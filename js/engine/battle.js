// TuxeWorld H5 | engine/battle.js | State machine trận đấu: hàng đợi lượt, resolve action
import { rng, clamp } from '../util.js';
import { CONFIG } from '../state.js';
import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { ITEMS } from '../data/items.js';
import { typeEff } from '../data/types.js';
import { stats, maxHp, isFainted, displayName, addEv, tryLearn } from './pokemon.js';
import { expYield, gainExp, movesAtLevel } from './exp.js';
import { applyStatus, canAct, endOfTurn, speedMult } from './status.js';
import { calcDamage, effText } from './damage.js';
import { attemptCatch } from './catchmon.js';

// Tên stat tiếng Việt (cho thông báo tăng/giảm chỉ số)
const STAT_VI = {
  atk: 'Tấn công', def: 'Phòng thủ', spa: 'Tấn công đặc biệt',
  spd: 'Phòng thủ đặc biệt', spe: 'Tốc độ',
};

const STATUS_APPLIED_VI = {
  brn: (n) => `${n} bị bỏng!`,
  psn: (n) => `${n} bị trúng độc!`,
  slp: (n) => `${n} ngủ thiếp đi!`,
  par: (n) => `${n} bị tê liệt! Có thể không cử động được!`,
  frz: (n) => `${n} bị đóng băng!`,
};

const freshStages = () => ({ atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });

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
        flinched: false,
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
    if (action.t === 'move') {
      const mon = this.activeMon(sideIdx);
      const mv = mon && mon.moves[action.i];
      if (!mv) return [false, 'Chiêu thức không hợp lệ.'];
      if ((mv.pp || 0) <= 0) return [false, 'Chiêu này đã hết PP!'];
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
    // Chọn chiêu còn PP; trainer ưu tiên chiêu khắc hệ
    const usable = [];
    for (let idx = 0; idx < mon.moves.length; idx++) {
      if ((mon.moves[idx].pp || 0) > 0) usable.push(idx);
    }
    if (usable.length === 0) return { t: 'struggle' };
    if (this.sides[i].kind === 'trainer') {
      const foe = this.activeMon(1 - i);
      let best = null, bestEff = -1;
      for (const idx of usable) {
        const mv = MOVES[mon.moves[idx].id];
        if (mv && mv.power) {
          const eff = typeEff(mv.type, SPECIES[foe.sp].types);
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
      const spe = mon ? stats(mon).spe * speedMult(mon) : 0;
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
    ev.push({ t: 'end', winner });
  }

  // Xử lý faint của side i; trả về true nếu side hết mon (thua)
  handleFaint(i, ev) {
    const s = this.sides[i];
    const mon = s.mons[s.active];
    ev.push({ t: 'faint', side: i, slot: s.active });
    ev.push({ t: 'msg', text: `${displayName(mon)} đã gục ngã!` });
    // Cho EXP nếu phía kia là người chơi
    const oi = 1 - i;
    const os = this.sides[oi];
    if (os.kind === 'player' && (s.kind === 'wild' || s.kind === 'trainer')) {
      const winnerMon = this.activeMon(oi);
      if (winnerMon && !isFainted(winnerMon)) {
        const amount = expYield(mon, 1);
        const levels = gainExp(winnerMon, amount);
        addEv(winnerMon, SPECIES[mon.sp].evYield);
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

    let mvId, mv;
    if (moveIdx === 'struggle') {
      mvId = 'struggle';
      mv = { name: 'Vùng Vẫy', type: 'normal', category: 'physical', power: 50, acc: 100 };
    } else {
      const slotMv = mon.moves[moveIdx];
      mvId = slotMv.id;
      mv = MOVES[mvId];
      slotMv.pp = Math.max(0, (slotMv.pp || 0) - 1);
    }
    ev.push({ t: 'msg', text: `${displayName(mon)} dùng ${mv.name || moveName(mvId)}!` });

    const ctx = {
      attStage: mv.category === 'physical' ? this.sides[i].stages.atk : this.sides[i].stages.spa,
      defStage: mv.category === 'physical' ? this.sides[oi].stages.def : this.sides[oi].stages.spd,
    };
    let res = calcDamage(mon, foe, mvId, ctx);
    if (moveIdx === 'struggle') {
      // struggle không có trong bảng moves: tính tay
      const stA = stats(mon), stD = stats(foe);
      const dmg = Math.floor(Math.floor(Math.floor(2 * mon.lv / 5 + 2) * 50 * stA.atk / Math.max(1, stD.def)) / 50) + 2;
      res = { dmg, crit: false, eff: 1, missed: false };
    }

    if (res.missed) {
      ev.push({ t: 'msg', text: `${displayName(mon)} đánh trượt!` });
      return;
    }

    if (res.dmg > 0) {
      foe.hpCur = Math.max(0, foe.hpCur - res.dmg);
      ev.push({ t: 'dmg', side: oi, slot: this.sides[oi].active, dmg: res.dmg, crit: res.crit, eff: res.eff });
      if (res.crit) ev.push({ t: 'msg', text: 'Đòn chí mạng!' });
      const et = effText(res.eff);
      if (et) ev.push({ t: 'msg', text: et });
      // Recoil / drain
      const effDef = mv.effect;
      if (effDef && effDef.kind === 'recoil') {
        const rec = Math.max(1, Math.floor(res.dmg * effDef.frac));
        mon.hpCur = Math.max(0, mon.hpCur - rec);
        ev.push({ t: 'dmg', side: i, slot: this.sides[i].active, dmg: rec, crit: false, eff: 1 });
        ev.push({ t: 'msg', text: `${displayName(mon)} bị thương do phản lực!` });
      } else if (effDef && effDef.kind === 'drain') {
        const healAmt = Math.max(1, Math.floor(res.dmg * effDef.frac));
        mon.hpCur = Math.min(maxHp(mon), mon.hpCur + healAmt);
        ev.push({ t: 'heal', side: i, slot: this.sides[i].active, amount: healAmt });
        ev.push({ t: 'msg', text: `${displayName(mon)} hút sinh lực từ ${displayName(foe)}!` });
      }
    }

    // Hiệu ứng phụ
    const effDef = mv.effect;
    if (effDef && res.eff !== 0) {
      const chance = (effDef.chance ?? 100) / 100;
      if (effDef.kind === 'status' && rng.roll(chance) && !isFainted(foe)) {
        if (applyStatus(foe, effDef.id)) {
          const fn = STATUS_APPLIED_VI[effDef.id];
          ev.push({ t: 'msg', text: fn ? fn(displayName(foe)) : `${displayName(foe)} dính trạng thái!` });
        }
      } else if (effDef.kind === 'stat' && rng.roll(chance)) {
        const targetSide = effDef.target === 'self' ? i : oi;
        const st = this.sides[targetSide].stages;
        const old = st[effDef.stat] || 0;
        st[effDef.stat] = clamp(old + effDef.stages, -6, 6);
        if (st[effDef.stat] !== old) {
          const tName = displayName(this.activeMon(targetSide));
          const statName = STAT_VI[effDef.stat] || effDef.stat;
          ev.push({
            t: 'msg',
            text: effDef.stages > 0
              ? `${statName} của ${tName} tăng lên!`
              : `${statName} của ${tName} giảm xuống!`,
          });
        }
      } else if (effDef.kind === 'heal') {
        const amount = Math.floor(maxHp(mon) * effDef.frac);
        mon.hpCur = Math.min(maxHp(mon), mon.hpCur + amount);
        ev.push({ t: 'heal', side: i, slot: this.sides[i].active, amount });
        ev.push({ t: 'msg', text: `${displayName(mon)} hồi phục sinh lực!` });
      } else if (effDef.kind === 'flinch' && rng.roll(chance)) {
        this.sides[oi].flinched = true;
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
      if (s.flinched) {
        s.flinched = false;
        ev.push({ t: 'msg', text: `${displayName(mon)} chùn bước, không thể ra đòn!` });
        continue;
      }
      if (a.t === 'run') {
        // Tỉ lệ chạy theo speed 2 bên
        const mySpe = stats(mon).spe;
        const foeMon = this.activeMon(oi);
        const foeSpe = foeMon ? stats(foeMon).spe : 1;
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
          if (item.effect.cure) {
            target.status = null;
            target.statusTurns = 0;
          }
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

    // Cuối lượt: damage trạng thái
    if (!this.over) {
      for (let i = 0; i < this.sides.length; i++) {
        const mon = this.activeMon(i);
        if (mon && !isFainted(mon)) {
          const r = endOfTurn(mon, displayName(mon));
          if (r.dmg > 0) {
            ev.push({ t: 'dmg', side: i, slot: this.sides[i].active, dmg: r.dmg, crit: false, eff: 1 });
            if (r.msg) ev.push({ t: 'msg', text: r.msg });
            if (isFainted(mon)) {
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
