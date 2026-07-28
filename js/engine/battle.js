// TuxeWorld H5 | engine/battle.js | State machine trận đấu: hàng đợi lượt, resolve action
import { rng, clamp } from '../util.js';
import { CONFIG } from '../state.js';
import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { ITEMS } from '../data/items.js';
import { stats, maxHp, isFainted, displayName, addTp, addBond, tryLearn,
  typesOf } from './monster.js';
import { TYPES, TYPE_NAMES } from '../data/types.js';
import { PLAGUES } from '../data/plagues.js';
import { STATUSES } from '../data/statuses.js';
import { expYield, gainExp, movesAtLevel } from './exp.js';
import { applyStatus, removeStatus, canAct, endOfTurn, speedMult, rangeBlocked,
  thornDamage, survives, cantHeal, isLocked, afterBattle, statusName,
  counterDamage, swapDamage, wildRampage, condBlocked, chainStatus } from './status.js';
import { calcDamage, effText, typeMultiplier, RANGE_MAP } from './damage.js';
import { attemptCatch, applyBallEffects, keepOnFail, keepOnCatch } from './catchmon.js';
import { attemptEscape } from './escape.js';
import { useItem } from './useitem.js';
import { bestMove, pickItem } from './ai.js';

// Tên chỉ số tiếng Việt (cho thông báo tăng/giảm chỉ số) — 6 chỉ số của Tuxemon
const STAT_VI = {
  hp: 'HP', armour: 'Giáp', dodge: 'Né', melee: 'Cận chiến',
  ranged: 'Tầm xa', speed: 'Tốc độ',
};

const freshStages = () => ({ armour: 0, dodge: 0, melee: 0, ranged: 0, speed: 0 });

// Hệ số hồi máu theo giờ — formula.calculate_time_based_multiplier của bản gốc.
// Càng gần giờ đỉnh càng mạnh, ngoài khung giờ thì bằng 0.
function heSoTheoGio(gio, dinh, batDau, ketThuc) {
  let h = gio, d = dinh, e2 = ketThuc;
  if (e2 < batDau) e2 += 24;
  if (h < batDau) h += 24;
  if (d < batDau) d += 24;
  if (!(batDau <= h && h < e2)) return 0;
  const nua = (e2 - batDau) / 2;
  let xa = Math.abs(h - d);
  if (xa > nua) xa = (e2 - batDau) - xa;
  return Math.max(0, 1 - (xa / nua) ** 2);
}

// mods/config_combat.yaml — hệ số tính thứ tự ra đòn
const SPEED_FACTOR = 0.25;
const SPEED_BONUS = 1.0;
const DODGE_MOD = 0.01;

function moveName(mvId) {
  const mv = MOVES[mvId];
  return (mv && mv.name) || mvId;
}

export class Battle {
  // { kind: 'wild'|'trainer', sides: [{mons:[...], kind:'player'|'wild'|'trainer'}, {...}] }
  constructor({ kind = 'wild', sides, escapeMethod }) {
    this.kind = kind;
    this.turn = 1;
    // Van an toàn chống trận không bao giờ kết thúc — xem beTac() bên dưới
    this.LUOT_BE_TAC = 80;
    this.over = false;
    this.winner = null;
    this.pending = [null, null]; // action đã submit theo side idx
    this.caughtMon = null;
    // Hàng đợi hành động chờ (combat/action_queue.py: _pending_queue). Chiêu
    // "lặn xuống" và chiêu "tiên liệu" đều đặt một đòn nữa vào đây, tới lượt
    // ghi trong mục thì đòn đó tự bung ra ở cuối lượt.
    this.pendingActions = [];
    this.runAttempts = 0;                            // bản gốc: biến run_attempts
    this.escapeMethod = escapeMethod || CONFIG.ESCAPE_METHOD; // default|relative|always|never
    this.sides = sides.map((s) => {
      const side = {
        mons: s.mons,
        id: s.id,
        kind: s.kind || 'player',
        bag: s.bag || null,             // túi thuốc của huấn luyện viên (nếu có)
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
    if (action.t === 'run' && this.kind === 'trainer' && !this.beTac()) {
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
      const vuong = condBlocked(mon, MOVES[mv.id], displayName(mon));
      if (vuong) return [false, vuong];
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

  // Máy đánh — theo tuxemon/ai: chấm điểm từng chiêu rồi chọn cái cao nhất.
  // Huấn luyện viên xét dùng thuốc trước, con hoang thì chỉ biết đánh.
  aiAction(i) {
    const mon = this.activeMon(i);
    if (!mon) return { t: 'pass' };
    const s = this.sides[i];
    const foe = this.activeMon(1 - i);

    if (s.kind === 'trainer' && s.bag) {
      const id = pickItem(mon, s.bag);
      if (id) {
        s.bag[id] -= 1;
        if (s.bag[id] <= 0) delete s.bag[id];
        return { t: 'item', id, targetSlot: s.active };
      }
    }

    const usable = [];
    for (let idx = 0; idx < mon.moves.length; idx++) {
      if ((mon.moves[idx].cd || 0) > 0) continue;
      if (condBlocked(mon, MOVES[mon.moves[idx].id], 'x')) continue;
      usable.push(idx);
    }
    if (usable.length === 0) return { t: 'struggle' };
    if (!foe) return { t: 'move', i: rng.pick(usable) };
    return { t: 'move', i: bestMove(mon, usable, foe) };
  }

  // Trận BẾ TẮC: đánh quá lâu mà không bên nào hạ nổi bên nào.
  //
  // Bản gốc không có luật này. Nhưng bản gốc cũng không cho bỏ chạy khỏi trận
  // huấn luyện viên, mà vài con vừa hồi máu vừa lì đòn (budaye với 'mending')
  // có thể đỡ ngang đúng lượng sát thương nhận vào. Gặp đúng thế đó thì trận
  // chạy vô tận và người chơi kẹt luôn, phải xoá bản lưu — nên sau LUOT_BE_TAC
  // lượt thì mở đường bỏ chạy kể cả với huấn luyện viên.
  beTac() { return this.turn > this.LUOT_BE_TAC; }

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

  // Thứ tự ra đòn — bản gốc formula.speed_monster + mods/config_combat.yaml:
  //   tốc = chỉ_số_tốc * (1 + tốc_độ_chiêu * 0.25) + né * 0.01
  // Chiêu "cực nhanh" (+3) đi trước hẳn, "cực chậm" (-3) ra sau cùng, nên chọn
  // chiêu nào cũng là chọn luôn nhịp đánh. Chạy/ném bóng/dùng đồ/đổi con vẫn
  // đi trước mọi chiêu.
  actionOrder() {
    const entries = [];
    for (let i = 0; i < this.sides.length; i++) {
      const a = this.pending[i];
      const mon = this.activeMon(i);
      let pri = 0;
      let tocChieu = 0;
      if (a.t === 'run' || a.t === 'ball' || a.t === 'item' || a.t === 'switch') {
        pri = 10;
      } else if (a.t === 'move' && mon) {
        const mv = MOVES[mon.moves[a.i]?.id];
        tocChieu = (mv && mv.speed) || 0;
      }
      const st = mon ? stats(mon) : null;
      const spe = st
        ? Math.floor(Math.max(1, st.speed * speedMult(mon)
            * (SPEED_BONUS + tocChieu * SPEED_FACTOR)) + st.dodge * DODGE_MOD)
        : 0;
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
    this.pendingActions = [];
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
        const tong = expYield(mon, 1, s.kind);
        // Máy Truyền EXP (xp_transmitter của bản gốc): con ra trận ăn một nửa,
        // nửa còn lại chia đều cho những con khác trong đội, kể cả con đang
        // ngồi dự bị. Không mang thì con ra trận ăn trọn.
        const chia = os.mons.some(m2 => m2 && m2.held === 'xp_transmitter'
          && !isFainted(m2)) && os.mons.length > 1;
        const amount = chia ? Math.floor(tong / 2) : tong;
        const levels = gainExp(winnerMon, amount);
        addTp(winnerMon, mon);
        ev.push({ t: 'exp', side: oi, slot: os.active, amount, levels });
        ev.push({ t: 'msg', text: `${displayName(winnerMon)} nhận được ${amount} EXP!` });
        if (chia) {
          const con = os.mons.filter(m2 => m2 && m2 !== winnerMon && !isFainted(m2));
          const moiCon = Math.floor((tong - amount) / Math.max(1, con.length));
          for (const m2 of con) {
            if (moiCon <= 0) break;
            const lv2 = gainExp(m2, moiCon);
            for (const lv of lv2) for (const mvId of movesAtLevel(m2.sp, lv)) tryLearn(m2, mvId);
          }
          if (con.length && moiCon > 0) {
            ev.push({ t: 'msg',
              text: `Máy Truyền EXP chia ${moiCon} EXP cho ${con.length} con còn lại!` });
          }
        }
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

  // Bung các đòn trong hàng đợi chờ tới hạn ở lượt này
  buongDonCho(ev) {
    if (!this.pendingActions.length) return;
    // Dọn trước: quá hạn, hoặc bên tung / bên nhận đã gục thì huỷ
    this.pendingActions = this.pendingActions.filter(p => {
      if (p.turn < this.turn) return false;
      const u = this.activeMon(p.side), t = this.activeMon(1 - p.side);
      return u && t && !isFainted(u) && !isFainted(t);
    });
    const toi = this.pendingActions.filter(p => p.turn === this.turn);
    this.pendingActions = this.pendingActions.filter(p => p.turn !== this.turn);
    for (const p of toi) {
      if (this.over) break;
      const oi = 1 - p.side;
      this.doMove(p.side, { id: p.id, power: p.power }, ev);
      const foeMon = this.activeMon(oi);
      if (foeMon && isFainted(foeMon)) {
        if (this.handleFaint(oi, ev)) { this.endBattle(p.side, ev); break; }
      }
      const selfMon = this.activeMon(p.side);
      if (selfMon && isFainted(selfMon)) {
        if (this.handleFaint(p.side, ev)) { this.endBattle(oi, ev); break; }
      }
    }
  }

  // Thực thi 1 move của side i lên side kia.
  // moveIdx = số ô chiêu | 'struggle' | {id, power} (đòn bung ra từ hàng đợi chờ)
  doMove(i, moveIdx, ev) {
    const cho = (moveIdx && typeof moveIdx === 'object') ? moveIdx : null;
    const mon = this.activeMon(i);
    const oi = 1 - i;
    const foe = this.activeMon(oi);
    if (!mon || !foe) return;

    const [ok, msg] = canAct(mon, displayName(mon));
    if (msg) ev.push({ t: 'msg', text: msg });
    if (!ok) return;

    // Hoang dại: có lúc phát cuồng, bỏ luôn lượt và tự cắn mình một miếng
    const cuong = wildRampage(mon);
    if (cuong > 0) {
      mon.hpCur = Math.max(0, mon.hpCur - cuong);
      ev.push({ t: 'dmg', side: i, slot: this.sides[i].active, dmg: cuong, eff: 1 });
      ev.push({ t: 'msg', text: `${displayName(mon)} phát cuồng, quay ra tự cắn mình!` });
      return;
    }
    const tamDanh = cho ? MOVES[cho.id]?.range
      : (moveIdx === 'struggle' ? null : MOVES[mon.moves[moveIdx]?.id]?.range);
    if (tamDanh && rangeBlocked(mon, tamDanh)) {
      ev.push({ t: 'msg', text: `${displayName(mon)} đang bị ghì, không ra đòn kiểu này được!` });
      return;
    }

    // Đang mang bệnh: mỗi lượt ra đòn đều thử phát tán, phát tán được thì mất
    // luôn lượt đánh (bản gốc combat/session.py pre_check đổi chiêu sang chiêu bệnh).
    if (mon.plague && PLAGUES[mon.plague]) {
      const pl = PLAGUES[mon.plague];
      if (!foe.plague && rng.roll(pl.spread)) {
        foe.plague = mon.plague;
        ev.push({ t: 'msg',
          text: `${displayName(mon)} lên cơn bệnh, lây ${pl.name} sang ${displayName(foe)}!` });
        return;
      }
      if (pl.khoi && rng.roll(pl.khoi)) {
        delete mon.plague;
        ev.push({ t: 'msg', text: `${displayName(mon)} tự khỏi bệnh ${pl.name}.` });
      }
    }

    let mvId, mv;
    if (cho) {
      mvId = cho.id;
      mv = MOVES[mvId];
      if (!mv) return;
    } else if (moveIdx === 'struggle') {
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
      // Chiêu tiên liệu bung lại thì hệ số sát thương ĐÚNG BẰNG số lượt đã chờ
      power: cho && cho.power ? cho.power : undefined,
    };
    // Chiêu "mượn hệ": trước khi tính sát thương, chiêu đổi sang hệ của người
    // dùng (Nội Lực, Ngoại Lực) hoặc của đối thủ (Cướp Sức) — core/effects/move_type.py
    const muon = (mv.eff || []).find(e => e.t === 'move_type');
    if (muon) {
      const nguon = muon.from === 'foe' ? foe : mon;
      ctx.types = typesOf(nguon);
      ev.push({ t: 'msg',
        text: `${mv.name} mượn hệ ${ctx.types.map(x => TYPE_NAMES[x] || x).join('/')}!` });
    }
    let res = calcDamage(mon, foe, mvId, ctx);
    if (moveIdx === 'struggle') {
      // struggle không nằm trong bảng chiêu: tính tay theo đúng công thức Tuxemon
      const stA = stats(mon), stD = stats(foe);
      const dmg = Math.floor(stA.melee * (7 + mon.lv) * 1 / Math.max(1, stD.armour));
      res = { dmg: Math.max(1, dmg), eff: 1, missed: false };
    }

    // Chiêu "phủ đầu" (splash): bản gốc vẫn tính sát thương rồi CHIA cho divisor
    // khi trượt, chứ không mất trắng như chiêu thường — vì thế mấy chiêu này độ
    // trúng chỉ 60-75% mà hệ số lại 2.25-3.0 (core/effects/splash.py).
    const toe = (mv.eff || []).find(e => e.t === 'splash');
    if (res.missed && toe) {
      const lai = calcDamage(mon, foe, mvId, { ...ctx, boQuaDoTrung: true });
      res = { ...lai, dmg: Math.floor(lai.dmg / Math.max(1, toe.div || 2)), missed: false };
      ev.push({ t: 'msg', text: `${displayName(mon)} đánh chệch, nhưng đòn vẫn tạt trúng!` });
    } else if (res.missed) {
      ev.push({ t: 'msg', text: `${displayName(mon)} đánh trượt!` });
      return;
    }

    // Chiêu "đánh nhiều đòn": tung lại tối đa n lần, trượt phát nào dừng phát đó
    // (bản gốc core/effects/multiattack.py). Cộng dồn rồi trừ máu một lần.
    const nhieu = (mv.eff || []).find(e => e.t === 'multiattack');
    if (nhieu && res.dmg > 0) {
      let lan = 1;
      for (let k = 1; k < (nhieu.n || 2); k++) {
        const them = calcDamage(mon, foe, mvId, ctx);
        if (them.missed) break;
        res.dmg += them.dmg;
        lan++;
      }
      if (lan > 1) ev.push({ t: 'msg', text: `Trúng liên tiếp ${lan} đòn!` });
    }

    if (res.dmg > 0) {
      foe.hpCur = Math.max(0, foe.hpCur - res.dmg);
      if (foe.hpCur <= 0 && survives(foe)) {
        ev.push({ t: 'msg', text: `${displayName(foe)} lì đòn, vẫn còn 1 máu!` });
      }
      ev.push({ t: 'dmg', side: oi, slot: this.sides[oi].active, dmg: res.dmg,
                eff: res.eff, moveType: (mv.types || ['normal'])[0],
                sfx: mv.sfx || '', anim: mv.anim || '' });
      const et = effText(res.eff);
      if (et) ev.push({ t: 'msg', text: et });
      // Gai / phản đòn / khiên nguyên tố đâm ngược người ra đòn
      const gai = thornDamage(foe, mon, mv.range);
      if (gai > 0) {
        mon.hpCur = Math.max(0, mon.hpCur - gai);
        ev.push({ t: 'dmg', side: i, slot: this.sides[i].active, dmg: gai, eff: 1 });
        ev.push({ t: 'msg', text: `${displayName(mon)} bị dội ngược!` });
      }
      // Đáp trả / báo thù: giáng lại đúng số sát thương vừa ăn
      const dap = counterDamage(foe, mv.range, res.dmg);
      if (dap) {
        mon.hpCur = Math.max(0, mon.hpCur - dap.dmg);
        ev.push({ t: 'dmg', side: i, slot: this.sides[i].active, dmg: dap.dmg, eff: 1 });
        ev.push({ t: 'msg', text: `${displayName(foe)} đáp trả nguyên đòn vừa rồi!` });
        if (dap.hut && !isFainted(foe)) {
          const truoc = foe.hpCur;
          foe.hpCur = Math.min(maxHp(foe), foe.hpCur + dap.dmg);
          ev.push({ t: 'heal', side: oi, slot: this.sides[oi].active, amount: foe.hpCur - truoc });
          ev.push({ t: 'msg', text: `${displayName(foe)} hút luôn chỗ đó thành máu!` });
        }
      }
    }

    // Hiệu ứng phụ của chiêu, lấy đúng danh sách effects bên bản gốc
    if (res.eff !== 0) this.applyEffects(i, oi, mv, res, ev, mvId, !!cho);

    // Đánh xong thì trạng thái dạng chuỗi mới đẩy đi tiếp — làm SAU cùng để
    // chính đòn vừa rồi vẫn ăn hệ số của trạng thái cũ, đúng như bản gốc.
    const doi = chainStatus(mon, 'tech');
    if (doi) ev.push({ t: 'msg', text: `${displayName(mon)} chuyển sang ${statusName(doi)}!` });
  }

  // give (dính trạng thái) · healing / prop_healing (hồi máu) · prop_damage
  // (mất máu theo phần) · remove (gỡ trạng thái) · money (nhặt tiền) ·
  // switch / reverse (đổi hệ) · cooldown_modifier (khoá chiêu) ·
  // photogenesis (hồi máu theo giờ) · sacrifice (tự huỷ) · life_swap (đổi máu) ·
  // transfer (đẩy trạng thái sang bên kia)
  applyEffects(i, oi, mv, res, ev, mvId, donCho = false) {
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
        ev.push({ t: 'dmg', side: si, slot: this.sides[si].active, dmg: d, eff: 1 });
      } else if (e.t === 'remove') {
        const [, target] = ben(e.to);
        if (target && removeStatus(target, e.cat)) {
          ev.push({ t: 'msg', text: `${displayName(target)} rũ bỏ được trạng thái!` });
        }
      } else if (e.t === 'money') {
        this.moneyBonus = (this.moneyBonus || 0) + 20 * mon.lv;
      } else if (e.t === 'switch') {
        // Đổi hệ của mục tiêu; 'random' thì bốc một hệ bất kỳ
        const [, target] = ben(e.to);
        if (!target || isFainted(target)) continue;
        const he = e.el === 'random' ? rng.pick(TYPES) : e.el;
        if (!TYPES.includes(he) || typesOf(target).includes(he)) continue;
        target.types = [he];
        ev.push({ t: 'msg', text: `${displayName(target)} đổi sang hệ ${TYPE_NAMES[he] || he}!` });
      } else if (e.t === 'reverse') {
        // Trả cả hai bên về hệ gốc
        for (const m2 of [mon, foe]) if (m2) delete m2.types;
        ev.push({ t: 'msg', text: 'Hệ của cả hai bên trở lại như cũ!' });
      } else if (e.t === 'cooldown_modifier') {
        const [, target] = ben(e.to);
        if (!target) continue;
        for (const m2 of target.moves || []) m2.cd = Math.max(m2.cd || 0, e.cd);
        ev.push({ t: 'msg',
          text: e.cd > 0 ? `${displayName(target)} bị khoá chiêu ${e.cd} lượt!`
            : `${displayName(target)} hồi chiêu tức thì!` });
      } else if (e.t === 'photogenesis') {
        // Hồi máu theo giờ trong ngày, mạnh nhất đúng giờ đỉnh
        if (cantHeal(mon)) continue;
        const [batDau, dinh, ketThuc] = e.h || [6, 12, 18];
        const k = heSoTheoGio(new Date().getHours(), dinh, batDau, ketThuc);
        if (k <= 0) { ev.push({ t: 'msg', text: 'Nhưng không có gì xảy ra...' }); continue; }
        const max = maxHp(mon);
        const amount = Math.floor((7 + mon.lv) * (mv.heal || 1) * k);
        const truoc = mon.hpCur;
        mon.hpCur = Math.min(max, mon.hpCur + Math.max(1, amount));
        ev.push({ t: 'heal', side: i, slot: this.sides[i].active, amount: mon.hpCur - truoc });
        ev.push({ t: 'msg', text: `${displayName(mon)} hấp thụ ánh sáng và hồi phục!` });
      } else if (e.t === 'sacrifice') {
        // Tự rút cạn máu mình để giáng vào đối thủ
        if (!foe || isFainted(foe)) continue;
        const d = Math.max(1, Math.floor(mon.hpCur * (e.n ?? 1)));
        mon.hpCur = 0;
        foe.hpCur = Math.max(0, foe.hpCur - d);
        ev.push({ t: 'dmg', side: oi, slot: this.sides[oi].active, dmg: d, eff: 1 });
        ev.push({ t: 'msg', text: `${displayName(mon)} tự huỷ để giáng một đòn!` });
      } else if (e.t === 'life_swap') {
        if (!foe || isFainted(foe) || isFainted(mon)) continue;
        const a = mon.hpCur, b2 = foe.hpCur;
        mon.hpCur = Math.min(maxHp(mon), b2);
        foe.hpCur = Math.min(maxHp(foe), a);
        ev.push({ t: 'heal', side: i, slot: this.sides[i].active, amount: mon.hpCur - a });
        ev.push({ t: 'msg', text: 'Sinh lực hai bên bị hoán đổi!' });
      } else if (e.t === 'disappear') {
        // Lặn xuống / bay vọt lên: cuối lượt này giáng xuống bằng chiêu đi kèm
        // (core/effects/disappear.py xếp đòn đó vào hàng chờ của ĐÚNG lượt này,
        // rồi POST_ACTION bung ra). Chiêu bung ra mang hiệu ứng 'appear' để gỡ
        // dấu "đang khuất".
        if (MOVES[e.id]) {
          mon.outOfRange = true;
          this.pendingActions.push({ turn: this.turn, side: i, id: e.id });
          ev.push({ t: 'msg', text: `${displayName(mon)} khuất bóng, chờ giáng xuống!` });
        }
      } else if (e.t === 'appear') {
        if (mon.outOfRange) {
          mon.outOfRange = false;
          ev.push({ t: 'msg', text: `${displayName(mon)} lao ra!` });
        }
      } else if (e.t === 'foresight') {
        // Tiên liệu: đúng n lượt nữa chiêu tự tung lại, hệ số sát thương bằng
        // chính n — càng chờ lâu đòn sau càng nặng (core/effects/foresight.py).
        // CHỖ LỆCH CÓ CHỦ Ý: bản gốc dựng lại nguyên chiêu nên đòn bung ra lại
        // xếp tiếp một đòn nữa, thành dây vô tận từ một lần bấm. Ở đây đòn bung
        // ra không xếp tiếp — bấm một lần thì được đúng một đòn trả sau.
        if (donCho) continue;
        const n = Math.max(1, e.n || 1);
        this.pendingActions.push({ turn: this.turn + n, side: i, id: mvId, power: n });
        ev.push({ t: 'msg', text: `${displayName(mon)} tính trước ${n} lượt cho đòn này!` });
      } else if (e.t === 'plague') {
        // Lây bệnh sang đối thủ theo xác suất spreadness của bản gốc
        const pl = PLAGUES[e.id];
        const [, target] = ben('foe');
        if (!pl || !target || isFainted(target)) continue;
        if (target.plague === e.id) {
          ev.push({ t: 'msg', text: `${displayName(target)} đã mang bệnh sẵn rồi.` });
        } else if (rng.roll(pl.spread)) {
          target.plague = e.id;
          ev.push({ t: 'msg', text: `${displayName(target)} nhiễm bệnh ${pl.name}!` });
        } else {
          ev.push({ t: 'msg', text: `${displayName(target)} phủi được, không dính bệnh.` });
        }
      } else if (e.t === 'transfer') {
        // Đẩy một trạng thái từ bên này sang bên kia
        const [tu, den] = e.dir === 'user_to_target' ? [mon, foe] : [foe, mon];
        if (!tu || !den || tu.status !== e.id) continue;
        removeStatus(tu, 'all');
        if (applyStatus(den, e.id)) {
          ev.push({ t: 'msg',
            text: `${statusName(e.id)} bị đẩy sang ${displayName(den)}!` });
        }
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
        const foeMon = this.activeMon(oi) || mon;
        const ok = attemptEscape(this.escapeMethod, mon, foeMon, this.runAttempts);
        ev.push({ t: 'run', ok, side: i });
        if (ok) {
          this.runAttempts = 0;
          ev.push({ t: 'msg', text: 'Chạy thoát thành công!' });
          this.endBattle(oi, ev);
        } else {
          // Hụt một lần thì lần sau dễ hơn (bản gốc: run_attempts + 1)
          this.runAttempts += 1;
          ev.push({ t: 'msg', text: 'Không chạy thoát được!' });
        }
      } else if (a.t === 'switch') {
        // Dính lao: rút lui khỏi sân là mất một phần máu
        const raSan = this.activeMon(i);
        const lao = raSan ? swapDamage(raSan) : 0;
        if (lao > 0) {
          raSan.hpCur = Math.max(0, raSan.hpCur - lao);
          ev.push({ t: 'dmg', side: i, slot: s.active, dmg: lao, eff: 1 });
          ev.push({ t: 'msg', text: `${displayName(raSan)} bị lao giật khi rút lui!` });
        }
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
        if (item && target) {
          const before = target.hpCur;
          const res = useItem(a.id, target, { inBattle: true, wild: this.kind === 'wild',
            stages: s.stages });
          ev.push({ t: 'msg', text: `Đã dùng ${item.name}!` });
          if (target.hpCur !== before) {
            ev.push({ t: 'heal', side: i, slot: targetSlot, amount: target.hpCur - before });
          }
          for (const m of res.msgs) ev.push({ t: 'msg', text: m });
          if (!res.ok) ev.push({ t: 'msg', text: 'Nhưng không có tác dụng!' });
          // Bản gốc chỉ đẩy chuỗi trạng thái khi món có tác dụng thật
          if (res.ok) {
            const doi = chainStatus(target, 'item');
            if (doi) ev.push({ t: 'msg', text: `${displayName(target)} chuyển sang ${statusName(doi)}!` });
          }
        }
      } else if (a.t === 'ball') {
        const foeMon = this.activeMon(oi);
        ev.push({ t: 'msg', text: `Ném ${(ITEMS[a.id] && ITEMS[a.id].name) || a.id}!` });
        const res = attemptCatch(foeMon, a.id);
        ev.push({ t: 'catch', caught: res.caught, shakes: res.shakes, ball: a.id });
        if (res.caught) {
          foeMon.ball = a.id;
          // Vài loại bóng còn sửa con vừa bắt: kẹo +1 cấp, bóng khẩu vị đổi vị
          applyBallEffects(a.id, foeMon);
          if (foeMon.hpCur > maxHp(foeMon)) foeMon.hpCur = maxHp(foeMon);
          this.caughtMon = foeMon;
          ev.push({ t: 'msg', text: `Tuyệt vời! Đã bắt được ${displayName(foeMon)}!` });
          if (keepOnCatch(a.id)) ev.push({ t: 'refund', id: a.id });
          this.endBattle(i, ev);
        } else {
          ev.push({ t: 'msg', text: `Ôi không! ${displayName(foeMon)} đã thoát ra!` });
          // Tuxeball Gia Cố: ném hụt vẫn nhặt lại được
          if (keepOnFail(a.id)) {
            ev.push({ t: 'refund', id: a.id });
            ev.push({ t: 'msg', text: `Nhặt lại được ${(ITEMS[a.id] && ITEMS[a.id].name) || a.id}.` });
          }
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

    // Cuối lượt: bung những đòn đã xếp hàng chờ đúng lượt này. Bản gốc làm ở
    // pha POST_ACTION (autoclean_pending rồi from_pending_to_action) — đòn nào
    // mà người tung hoặc mục tiêu đã gục thì bỏ luôn.
    if (!this.over) this.buongDonCho(ev);

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
          // Trạng thái nối máu thì bên kia là con đang đứng sân của phe đối diện
          const noi = STATUSES[mon.status]?.link ? this.activeMon(1 - i) : null;
          const r = endOfTurn(mon, displayName(mon), noi);
          if (r.toLinked && noi) {
            const truoc = noi.hpCur;
            noi.hpCur = clamp(noi.hpCur + r.toLinked, 0, maxHp(noi));
            const lech = noi.hpCur - truoc;
            if (lech > 0) {
              ev.push({ t: 'heal', side: 1 - i, slot: this.sides[1 - i].active, amount: lech });
            } else if (lech < 0) {
              ev.push({ t: 'dmg', side: 1 - i, slot: this.sides[1 - i].active, dmg: -lech, eff: 1 });
            }
            if (isFainted(noi) && !survives(noi)) {
              if (this.handleFaint(1 - i, ev)) this.endBattle(i, ev);
            }
          }
          if (r.heal > 0) {
            ev.push({ t: 'heal', side: i, slot: this.sides[i].active, amount: r.heal });
            if (r.msg) ev.push({ t: 'msg', text: r.msg });
          }
          if (r.dmg > 0) {
            ev.push({ t: 'dmg', side: i, slot: this.sides[i].active, dmg: r.dmg, eff: 1 });
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
