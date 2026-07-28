// TuxeWorld H5 | engine/battle.js | State machine trận đấu: hàng đợi lượt, resolve action
import { rng, clamp } from '../util.js';
import { CONFIG } from '../state.js';
import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { ITEMS } from '../data/items.js';
import { stats, maxHp, isFainted, displayName, addTp, addBond, tryLearn } from './pokemon.js';
import { expYield, gainExp, movesAtLevel } from './exp.js';
import { applyStatus, removeStatus, canAct, endOfTurn, speedMult, rangeBlocked,
  thornDamage, survives, cantHeal, isLocked, afterBattle, statusName } from './status.js';
import { calcDamage, effText, typeMultiplier, RANGE_MAP } from './damage.js';
import { attemptCatch } from './catchmon.js';

// Tên chỉ số tiếng Việt (cho thông báo tăng/giảm chỉ số) — 6 chỉ số của Tuxemon
const STAT_VI = {
  hp: 'HP', armour: 'Giáp', dodge: 'Né', melee: 'Cận chiến',
  ranged: 'Tầm xa', speed: 'Tốc độ',
};

const freshStages = () => ({ armour: 0, dodge: 0, melee: 0, ranged: 0, speed: 0 });

function moveName(mvId) {
  const mv = MOVES[mvId];
  return (mv && mv.name) || mvId;
}

export class Battle {
  // { kind: 'wild'|'trainer', sides: [{mons:[...], kind:'player'|'wild'|'trainer'}, {...}] }
  constructor({ kind = 'wild', sides }) {
    this.kind = kind;
    this.turn = 1;
    this.over = false;
    this.winner = null;
    this.pending = [null, null]; // action đã submit theo side idx
    this.caughtMon = null;
    this.sides = sides.map((s) => {
      const side = {
        mons: s.mons,
        id: s.id,
        kind: s.kind || 'player',
        active: null,
        stages: freshStages(), // stage của con đang ra sân
        mustSwitch: false,
      };
      // Con đầu tiên còn sống ra sân
      for (let slot = 0; slot < s.mons.length; slot++) {
        if (!isFainted(s.mons[slot])) { side.active = slot; break; }
      }
      return side;
    });
  }

  activeMon(i) {
    const s = this.sides[i];
    return s.active === null ? null : s.mons[s.active];
  }

  // Người chơi submit action cho side idx.
  // action = {t:'move',i} | {t:'switch',slot} | {t:'item',id,targetSlot} | {t:'ball',id} | {t:'run'}
  submit(sideIdx, action) {
    if (this.over) return [false, 'Trận đấu đã kết thúc.'];
    // Chặn hành vi không hợp lệ theo loại trận
    if (action.t === 'ball' && this.kind !== 'wild') {
      return [false, 'Không thể bắt Tuxemon của huấn luyện viên khác!'];
    }
    if (action.t === 'run' && this.kind === 'trainer') {
      return [false, 'Không thể bỏ chạy khỏi trận đấu với huấn luyện viên!'];
    }
    if ((action.t === 'run' || action.t === 'switch') && isLocked(this.activeMon(sideIdx))) {
      return [false, 'Đang bị khoá, không rút lui được!'];
    }
    if (action.t === 'move') {
      const mon = this.activeMon(sideIdx);
      const mv = mon && mon.moves[action.i];
      if (!mv) return [false, 'Chiêu thức không hợp lệ.'];
      if ((mv.cd || 0) > 0) return [false, `Chiêu này còn chờ ${mv.cd} lượt!`];
    }
    if (action.t === 'switch') {
      const s = this.sides[sideIdx];
      const target = s.mons[action.slot];
      if (!target || isFainted(target) || action.slot === s.active) {
        return [false, 'Không thể đổi sang Tuxemon này.'];
      }
    }
    this.pending[sideIdx] = action;
    return [true, null];
  }

  aiAction(i) {
    const mon = this.activeMon(i);
    if (!mon) return { t: 'pass' };
    // Chọn chiêu đã hồi xong; trainer ưu tiên chiêu khắc hệ
    const usable = [];
    for (let idx = 0; idx < mon.moves.length; idx++) {
      if ((mon.moves[idx].cd || 0) <= 0) usable.push(idx);
    }
    if (usable.length === 0) return { t: 'struggle' };
    if (this.sides[i].kind === 'trainer') {
      const foe = this.activeMon(1 - i);
      let best = null, bestEff = -1;
      for (const idx of usable) {
        const mv = MOVES[mon.moves[idx].id];
        if (mv && mv.power) {
          const eff = typeMultiplier(mv.types, SPECIES[foe.sp].types);
          if (eff > bestEff) { best = idx; bestEff = eff; }
        }
      }
      if (best !== null) return { t: 'move', i: best };
    }
    return { t: 'move', i: rng.pick(usable) };
  }

  // Đủ action để resolve chưa? (side AI tự điền)
  ready() {
    for (let i = 0; i < this.sides.length; i++) {
      if (!this.pending[i]) {
        const s = this.sides[i];
        if (s.kind === 'wild' || s.kind === 'trainer') {
          this.pending[i] = this.aiAction(i);
        } else {
          return false;
        }
      }
    }
    return true;
  }

  // Độ ưu tiên: run/ball/item/switch trước, move theo priority + speed (par giảm nửa)
  actionOrder() {
    const entries = [];
    for (let i = 0; i < this.sides.length; i++) {
      const a = this.pending[i];
      let pri = 0;
      if (a.t === 'run' || a.t === 'ball' || a.t === 'item' || a.t === 'switch') {
        pri = 10;
      } else if (a.t === 'move') {
        const mon = this.activeMon(i);
        const mv = MOVES[mon.moves[a.i].id];
        pri = (mv && mv.priority) || 0;
      }
      const mon = this.activeMon(i);
      const spe = mon ? stats(mon).speed * speedMult(mon) : 0;
      entries.push({ side: i, pri, spe, tie: rng.float() });
    }
    entries.sort((x, y) => {
      if (x.pri !== y.pri) return y.pri - x.pri;
      if (x.spe !== y.spe) return y.spe - x.spe;
      return x.tie - y.tie; // speed tie: random
    });
    return entries;
  }

  endBattle(winner, ev) {
    this.over = true;
    this.winner = winner;
    // Bản gốc chỉ giữ lại trạng thái nào đánh dấu "còn sau trận" (độc, bỏng)
    for (const side of this.sides) for (const m of side.mons) afterBattle(m);
    ev.push({ t: 'end', winner });
  }

  // Xử lý faint của side i; trả về true nếu side hết mon (thua)
  handleFaint(i, ev) {
    const s = this.sides[i];
    const mon = s.mons[s.active];
    ev.push({ t: 'faint', side: i, slot: s.active });
    addBond(mon, -10);                  // config_monster.bond_modifiers.fainted
    ev.push({ t: 'msg', text: `${displayName(mon)} đã gục ngã!` });
    // Cho EXP nếu phía kia là người chơi
    const oi = 1 - i;
    const os = this.sides[oi];
    if (os.kind === 'player' && (s.kind === 'wild' || s.kind === 'trainer')) {
      const winnerMon = this.activeMon(oi);
      if (winnerMon && !isFainted(winnerMon)) {
        addBond(winnerMon, 3);          // config_monster.bond_modifiers.win_battle
        const amount = expYield(mon, 1, s.kind);
        const levels = gainExp(winnerMon, amount);
        addTp(winnerMon, mon);
        ev.push({ t: 'exp', side: oi, slot: os.active, amount, levels });
        ev.push({ t: 'msg', text: `${displayName(winnerMon)} nhận được ${amount} EXP!` });
        for (const lv of levels) {
          ev.push({ t: 'msg', text: `${displayName(winnerMon)} đã lên cấp ${lv}!` });
          // Chiêu mới tại các level vừa đạt
          for (const mvId of movesAtLevel(winnerMon.sp, lv)) {
            const res = tryLearn(winnerMon, mvId);
            if (res) {
              ev.push({ t: 'learn', side: oi, slot: os.active, move: mvId, full: res === 'full' });
              if (res === 'learned') {
                ev.push({ t: 'msg', text: `${displayName(winnerMon)} đã học ${moveName(mvId)}!` });
              } else {
                ev.push({ t: 'msg', text: `${displayName(winnerMon)} muốn học ${moveName(mvId)} nhưng đã đủ 4 chiêu!` });
              }
            }
          }
        }
      }
    }
    // Tự động đưa con kế tiếp ra sân (AI); người chơi sẽ được UI hỏi
    let nextSlot = null;
    for (let slot = 0; slot < s.mons.length; slot++) {
      if (!isFainted(s.mons[slot])) { nextSlot = slot; break; }
    }
    if (nextSlot !== null) {
      if (s.kind !== 'player') {
        s.active = nextSlot;
        s.stages = freshStages();
        ev.push({ t: 'sendOut', side: i, slot: nextSlot });
        ev.push({ t: 'msg', text: `Đối thủ tung ra ${displayName(s.mons[nextSlot])}!` });
      } else {
        s.mustSwitch = true; // UI bắt người chơi chọn con kế
      }
      return false;
    }
    return true; // hết mon
  }

  // Thực thi 1 move của side i lên side kia. moveIdx = số | 'struggle'
  doMove(i, moveIdx, ev) {
    const mon = this.activeMon(i);
    const oi = 1 - i;
    const foe = this.activeMon(oi);
    if (!mon || !foe) return;

    const [ok, msg] = canAct(mon, displayName(mon));
    if (msg) ev.push({ t: 'msg', text: msg });
    if (!ok) return;
    if (moveIdx !== 'struggle' && rangeBlocked(mon, MOVES[mon.moves[moveIdx]?.id]?.range)) {
      ev.push({ t: 'msg', text: `${displayName(mon)} đang bị ghì, không ra đòn kiểu này được!` });
      return;
    }

    let mvId, mv;
    if (moveIdx === 'struggle') {
      mvId = 'struggle';
      mv = { name: 'Vùng Vẫy', types: ['normal'], range: 'melee', category: 'damage', power: 1, acc: 100 };
    } else {
      const slotMv = mon.moves[moveIdx];
      mvId = slotMv.id;
      mv = MOVES[mvId];
      // Tuxemon không có PP: đánh xong chiêu phải chờ đủ số lượt "recharge"
      slotMv.cd = mv?.recharge || 0;
    }
    ev.push({ t: 'msg', text: `${displayName(mon)} dùng ${mv.name || moveName(mvId)}!` });

    // Tầm đánh quyết định chỉ số nào bị buff/debuff ảnh hưởng
    const [uKey, tKey] = RANGE_MAP[mv.range] || RANGE_MAP.melee;
    const ctx = {
      attStage: this.sides[i].stages[uKey] || 0,
      defStage: this.sides[oi].stages[tKey] || 0,
    };
    let res = calcDamage(mon, foe, mvId, ctx);
    if (moveIdx === 'struggle') {
      // struggle không nằm trong bảng chiêu: tính tay theo đúng công thức Tuxemon
      const stA = stats(mon), stD = stats(foe);
      const dmg = Math.floor(stA.melee * (7 + mon.lv) * 1 / Math.max(1, stD.armour));
      res = { dmg: Math.max(1, dmg), crit: false, eff: 1, missed: false };
    }

    if (res.missed) {
      ev.push({ t: 'msg', text: `${displayName(mon)} đánh trượt!` });
      return;
    }

    if (res.dmg > 0) {
      foe.hpCur = Math.max(0, foe.hpCur - res.dmg);
      if (foe.hpCur <= 0 && survives(foe)) {
        ev.push({ t: 'msg', text: `${displayName(foe)} lì đòn, vẫn còn 1 máu!` });
      }
      ev.push({ t: 'dmg', side: oi, slot: this.sides[oi].active, dmg: res.dmg,
                crit: res.crit, eff: res.eff, moveType: (mv.types || ['normal'])[0],
                sfx: mv.sfx || '', anim: mv.anim || '' });
      if (res.crit) ev.push({ t: 'msg', text: 'Đòn chí mạng!' });
      const et = effText(res.eff);
      if (et) ev.push({ t: 'msg', text: et });
      // Gai đâm ngược người ra đòn
      const gai = thornDamage(foe, mon, mv.range);
      if (gai > 0) {
        mon.hpCur = Math.max(0, mon.hpCur - gai);
        ev.push({ t: 'dmg', side: i, slot: this.sides[i].active, dmg: gai, crit: false, eff: 1 });
        ev.push({ t: 'msg', text: `${displayName(mon)} bị gai đâm ngược!` });
      }
    }

    // Hiệu ứng phụ của chiêu, lấy đúng danh sách effects bên bản gốc
    if (res.eff !== 0) this.applyEffects(i, oi, mv, res, ev);
  }

  // give (dính trạng thái) · healing / prop_healing (hồi máu) · prop_damage
  // (mất máu theo phần) · remove (gỡ trạng thái) · money (nhặt tiền)
  applyEffects(i, oi, mv, res, ev) {
    const mon = this.activeMon(i);
    const foe = this.activeMon(oi);
    const ben = (to) => (to === 'self' ? [i, mon] : [oi, foe]);

    for (const e of mv.eff || []) {
      if (e.t === 'give') {
        const [si, target] = ben(e.to);
        if (!target || isFainted(target)) continue;
        if (applyStatus(target, e.id)) {
          ev.push({ t: 'msg', text: `${displayName(target)} dính ${statusName(e.id)}!` });
          ev.push({ t: 'status', side: si, slot: this.sides[si].active, id: e.id });
        }
      } else if (e.t === 'healing' || e.t === 'prop_healing') {
        const [si, target] = e.t === 'healing' ? [i, mon] : ben(e.to);
        if (!target || cantHeal(target)) continue;
        const max = maxHp(target);
        // healing của bản gốc: (7 + cấp) * healing_power
        const amount = e.t === 'healing'
          ? Math.floor((7 + mon.lv) * (mv.heal || 1))
          : Math.floor(max * (e.n || 0.25));
        const truoc = target.hpCur;
        target.hpCur = Math.min(max, target.hpCur + Math.max(1, amount));
        ev.push({ t: 'heal', side: si, slot: this.sides[si].active, amount: target.hpCur - truoc });
        ev.push({ t: 'msg', text: `${displayName(target)} hồi phục sinh lực!` });
      } else if (e.t === 'prop_damage') {
        const [si, target] = ben(e.to);
        if (!target || isFainted(target)) continue;
        const d = Math.max(1, Math.floor(maxHp(target) * (e.n || 0.25)));
        target.hpCur = Math.max(0, target.hpCur - d);
        ev.push({ t: 'dmg', side: si, slot: this.sides[si].active, dmg: d, crit: false, eff: 1 });
      } else if (e.t === 'remove') {
        const [, target] = ben(e.to);
        if (target && removeStatus(target, e.cat)) {
          ev.push({ t: 'msg', text: `${displayName(target)} rũ bỏ được trạng thái!` });
        }
      } else if (e.t === 'money') {
        this.moneyBonus = (this.moneyBonus || 0) + 20 * mon.lv;
      }
    }
  }

  // Resolve 1 lượt đầy đủ. Trả về { events, over, winner }
  resolve() {
    const ev = [];
    if (this.over) return { events: ev, over: true, winner: this.winner };
    if (!this.ready()) return { events: ev, over: false, winner: null };

    const order = this.actionOrder();
    for (const entry of order) {
      if (this.over) break;
      const i = entry.side;
      const oi = 1 - i;
      const a = this.pending[i];
      const s = this.sides[i];
      const mon = this.activeMon(i);

      if (mon && isFainted(mon) && a.t !== 'switch') {
        // Con vừa gục trong lượt này, bỏ qua action
        continue;
      }
      if (a.t === 'run') {
        // Tỉ lệ chạy theo speed 2 bên
        const mySpe = stats(mon).speed;
        const foeMon = this.activeMon(oi);
        const foeSpe = foeMon ? stats(foeMon).speed : 1;
        const chance = clamp(CONFIG.RUN_BASE_CHANCE + (mySpe - foeSpe) / 200, 0.1, 0.95);
        const ok = rng.roll(chance);
        ev.push({ t: 'run', ok, side: i });
        if (ok) {
          ev.push({ t: 'msg', text: 'Chạy thoát thành công!' });
          this.endBattle(oi, ev);
        } else {
          ev.push({ t: 'msg', text: 'Không chạy thoát được!' });
        }
      } else if (a.t === 'switch') {
        s.active = a.slot;
        s.stages = freshStages();
        s.mustSwitch = false;
        ev.push({ t: 'sendOut', side: i, slot: a.slot });
        ev.push({ t: 'msg', text: `Cố lên, ${displayName(s.mons[a.slot])}!` });
      } else if (a.t === 'item') {
        // Item dùng trong trận: controller đã trừ khỏi túi, ở đây chỉ áp hiệu ứng
        const item = ITEMS[a.id];
        const targetSlot = a.targetSlot ?? s.active;
        const target = s.mons[targetSlot];
        if (item && item.effect && target) {
          if (item.effect.heal) {
            const max = maxHp(target);
            let amount = item.effect.heal;
            if (amount === 'full') amount = max;
            const before = target.hpCur;
            target.hpCur = Math.min(max, target.hpCur + amount);
            ev.push({ t: 'heal', side: i, slot: targetSlot, amount: target.hpCur - before });
          }
          if (item.effect.cure) removeStatus(target, 'negative');
          ev.push({ t: 'msg', text: `Đã dùng ${item.name}!` });
        }
      } else if (a.t === 'ball') {
        const foeMon = this.activeMon(oi);
        ev.push({ t: 'msg', text: `Ném ${(ITEMS[a.id] && ITEMS[a.id].name) || a.id}!` });
        const res = attemptCatch(foeMon, a.id);
        ev.push({ t: 'catch', caught: res.caught, shakes: res.shakes, crit: res.crit });
        if (res.caught) {
          foeMon.ball = a.id;
          this.caughtMon = foeMon;
          ev.push({ t: 'msg', text: `Tuyệt vời! Đã bắt được ${displayName(foeMon)}!` });
          this.endBattle(i, ev);
        } else {
          ev.push({ t: 'msg', text: `Ôi không! ${displayName(foeMon)} đã thoát ra!` });
        }
      } else if (a.t === 'move' || a.t === 'struggle') {
        this.doMove(i, a.t === 'struggle' ? 'struggle' : a.i, ev);
        // Kiểm tra gục sau đòn
        const foeMon = this.activeMon(oi);
        if (foeMon && isFainted(foeMon)) {
          if (this.handleFaint(oi, ev)) this.endBattle(i, ev);
        }
        const selfMon = this.activeMon(i);
        if (selfMon && isFainted(selfMon)) { // recoil tự gục
          if (this.handleFaint(i, ev)) this.endBattle(oi, ev);
        }
      }
    }

    // Cuối lượt: mọi chiêu đang chờ hồi bớt đi một lượt (Tuxemon dùng recharge
    // thay cho PP — hết lượt chờ là dùng lại được).
    for (const side of this.sides) {
      for (const mon of side.mons) {
        for (const mv of mon.moves || []) if (mv.cd > 0) mv.cd -= 1;
      }
    }

    // Cuối lượt: damage trạng thái
    if (!this.over) {
      for (let i = 0; i < this.sides.length; i++) {
        const mon = this.activeMon(i);
        if (mon && !isFainted(mon)) {
          const r = endOfTurn(mon, displayName(mon));
          if (r.heal > 0) {
            ev.push({ t: 'heal', side: i, slot: this.sides[i].active, amount: r.heal });
            if (r.msg) ev.push({ t: 'msg', text: r.msg });
          }
          if (r.dmg > 0) {
            ev.push({ t: 'dmg', side: i, slot: this.sides[i].active, dmg: r.dmg, crit: false, eff: 1 });
            if (r.msg) ev.push({ t: 'msg', text: r.msg });
            if (isFainted(mon) && !survives(mon)) {
              if (this.handleFaint(i, ev)) this.endBattle(1 - i, ev);
            }
          }
        }
      }
    }

    this.pending = [null, null];
    this.turn += 1;
    return { events: ev, over: this.over, winner: this.winner };
  }
}
