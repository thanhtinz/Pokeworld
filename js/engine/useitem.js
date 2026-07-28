// TuxeWorld H5 | engine/useitem.js | Dùng vật phẩm — ĐÚNG THEO TUXEMON
//
// Bản gốc để hiệu ứng và điều kiện của vật phẩm trong db/item, mỗi loại một
// lớp bên tuxemon/core/effects. Ở đây gom lại một chỗ vì cả túi đồ lẫn trận
// đấu đều gọi tới.
//
//   heal        hồi máu (fixed = số HP, percentage = phần trăm máu tối đa)
//   restore     gỡ mọi trạng thái xấu; con đã gục thì sống lại
//   gainXp      cho thẳng EXP
//   evolve      đá tiến hoá
//   boost       tăng chỉ số TRONG TRẬN (statchange)
//   changeStat  tăng chỉ số VĨNH VIỄN (change_stat)
//   food        món ăn — hợp khẩu vị thì tăng thân thiết, kỵ thì mất
import { ITEMS } from '../data/items.js';
import { maxHp, isFainted, stats, addBond } from './monster.js';
import { removeStatus } from './status.js';
import { gainExp } from './exp.js';
import { checkEvolution } from './evolution.js';

// Tên chỉ số hiện trong thông báo
const STAT_VI = { hp: 'HP', armour: 'Giáp', dodge: 'Né', melee: 'Cận chiến',
  ranged: 'Tầm xa', speed: 'Tốc độ' };

// Cặp khẩu vị đối nghịch — config_monster.opposite_tastes
const DOI_NGHICH = {
  peppy: 'mild', mild: 'peppy', salty: 'sweet', sweet: 'salty',
  hearty: 'soft', soft: 'hearty', zesty: 'flakey', flakey: 'zesty',
  refined: 'dry', dry: 'refined', savory: 'bland', bland: 'savory',
};

// config_monster.bond_preferences
const BOND = { great: 10, good: 5, average: 0, bad: -5, terrible: -10 };

export function foodBond(mon, warm, cold) {
  const hopWarm = warm === mon.tasteWarm;
  const hopCold = cold === mon.tasteCold;
  const kyWarm = DOI_NGHICH[warm] === mon.tasteWarm;
  const kyCold = DOI_NGHICH[cold] === mon.tasteCold;
  if (hopWarm && hopCold) return BOND.great;
  if (hopWarm || hopCold) return BOND.good;
  if (kyWarm && kyCold) return BOND.terrible;
  if (kyWarm || kyCold) return BOND.bad;
  return BOND.average;
}

// Điều kiện dùng được (db/item conditions). Trả về true/false.
export function canUse(itemId, mon, ctx = {}) {
  const it = ITEMS[itemId];
  if (!it) return false;
  if (ctx.inBattle && !it.inBattle) return false;
  if (!ctx.inBattle && !it.inWorld) return false;
  for (const c of it.cond || []) {
    if (c.t === 'wild') {
      if (!ctx.wild) return false;
    } else if (c.t === 'hp') {
      if (!mon) return false;
      const frac = (mon.hpCur || 0) / maxHp(mon);
      if (c.op === '<' && !(frac < c.n)) return false;
      if (c.op === '>' && !(frac > c.n)) return false;
      if (c.op === '==' && !(frac === c.n)) return false;
    } else if (c.t === 'status') {
      // Bản gốc coi "gục" là một trạng thái; ở đây gục = hết máu
      if (c.id === 'faint') { if (!mon || !isFainted(mon)) return false; }
      else if (!mon || mon.status !== c.id) return false;
    } else if (c.t === 'anyStatus') {
      if (!mon || !mon.status) return false;
    } else if (c.t === 'canEvolve') {
      if (!mon || !checkEvolution(mon, 'stone', itemId, ctx)) return false;
    }
  }
  return true;
}

// Dùng vật phẩm lên mon. Trả về { ok, msgs, evolveTo }
// ctx = { inBattle, wild, stages, party, inside } — stages là bảng buff của phe
// đang cầm mon; party/inside cho mấy đường tiến hoá nhìn ra ngoài con vật.
export function useItem(itemId, mon, ctx = {}) {
  const it = ITEMS[itemId];
  const msgs = [];
  if (!it || !canUse(itemId, mon, ctx)) return { ok: false, msgs, evolveTo: null };

  let ok = false;
  let evolveTo = null;

  for (const e of it.eff || []) {
    if (e.t === 'restore') {
      if (mon && isFainted(mon)) {
        mon.hpCur = 1;                       // sống lại; phần heal phía sau nâng máu
        msgs.push('Đã hồi sinh!');
        ok = true;
      }
      if (mon && mon.status && removeStatus(mon, 'negative')) {
        msgs.push('Đã gỡ trạng thái xấu!');
        ok = true;
      }
    } else if (e.t === 'heal') {
      const mx = maxHp(mon);
      const add = e.mode === 'percentage' ? Math.floor(mx * e.n) : Math.floor(e.n);
      if (mon.hpCur < mx) {
        const truoc = mon.hpCur;
        mon.hpCur = Math.max(0, Math.min(mx, mon.hpCur + add));
        if (mon.hpCur !== truoc) { msgs.push(`Hồi ${mon.hpCur - truoc} HP.`); ok = true; }
      }
    } else if (e.t === 'gainXp') {
      const levels = gainExp(mon, e.n);
      msgs.push(`Nhận ${e.n} EXP.`);
      for (const lv of levels) msgs.push(`Lên cấp ${lv}!`);
      ok = true;
    } else if (e.t === 'evolve') {
      evolveTo = checkEvolution(mon, 'stone', itemId, ctx);
      if (evolveTo) ok = true;
    } else if (e.t === 'boost') {
      // Trong trận: cộng thẳng vào bảng buff của phe đang cầm con này
      if (ctx.stages && ctx.stages[e.stat] !== undefined) {
        ctx.stages[e.stat] = Math.min(6, ctx.stages[e.stat] + e.step);
        msgs.push(`[+] ${STAT_VI[e.stat] || e.stat} tăng vọt!`);
        ok = true;
      }
    } else if (e.t === 'changeStat') {
      // Vĩnh viễn: cộng vào TP để chỉ số nhích lên đúng tỉ lệ yêu cầu
      if (!Array.isArray(mon.tp)) mon.tp = [0, 0, 0, 0, 0, 0];
      const idx = ['hp', 'armour', 'dodge', 'melee', 'ranged', 'speed'].indexOf(e.stat);
      if (idx >= 0) {
        const them = Math.max(1, Math.round(stats(mon)[e.stat] * e.n * 100 / Math.max(1, mon.lv)));
        mon.tp[idx] = Math.min(150, (mon.tp[idx] || 0) + them);
        msgs.push(`[+] ${STAT_VI[e.stat] || e.stat} tăng vĩnh viễn!`);
        ok = true;
      }
    } else if (e.t === 'food') {
      const n = foodBond(mon, e.warm, e.cold);
      addBond(mon, n);
      if (n > 0) msgs.push(`Rất hợp khẩu vị! Thân thiết +${n}.`);
      else if (n < 0) msgs.push(`Không hợp khẩu vị... Thân thiết ${n}.`);
      else msgs.push('Ăn xong nhưng chẳng thấy gì đặc biệt.');
      ok = true;
    }
  }

  return { ok, msgs, evolveTo };
}
