// TuxeWorld H5 | engine/pokemon.js | Tạo instance Tuxemon: IV, EV, nature, gender, shiny, tính stats
import { rng, clamp } from '../util.js';
import { CONFIG } from '../state.js';
import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { LEARNSETS } from '../data/learnsets.js';
import { NATURES, NATURE_LIST } from '../data/natures.js';
import { expForLevel } from './exp.js';

// Thứ tự stat trong mảng iv/ev (khớp schema save)
export const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

// Tạo 1 instance mới. opts = { iv, nature, gender, shiny, ability, ball, moves }
export function newTuxemon(spId, level, opts = {}) {
  const spec = SPECIES[spId];
  if (!spec) {
    console.warn(`newTuxemon: species ${spId} không tồn tại`);
    return null;
  }
  const lv = clamp(level || 5, 1, CONFIG.MAX_LEVEL);

  // IV: 0..31 mỗi stat
  let iv = opts.iv;
  if (!iv) {
    iv = [];
    for (let i = 0; i < 6; i++) iv.push(rng.int(0, CONFIG.IV_MAX));
  }

  // Nature
  const nature = opts.nature || rng.pick(NATURE_LIST);

  // Gender theo genderRatio (tỉ lệ đực; -1 = không giới tính)
  let gender = opts.gender;
  if (!gender) {
    if (spec.genderRatio === -1) gender = 'n';
    else if (rng.roll(spec.genderRatio)) gender = 'm';
    else gender = 'f';
  }

  // Shiny: 1/SHINY_DENOM
  let shiny = opts.shiny;
  if (shiny === undefined || shiny === null) {
    shiny = rng.roll(1 / CONFIG.SHINY_DENOM);
  }

  // Ability
  const ability = opts.ability || rng.pick(spec.abilities || []) || 'none';

  const mon = {
    sp: spId,
    lv,
    exp: expForLevel(spec.expCurve, lv),
    nick: null,
    iv,
    ev: [0, 0, 0, 0, 0, 0],
    nature,
    ability,
    gender,
    shiny: !!shiny,
    ball: opts.ball || 'poke_ball',
    moves: opts.moves || defaultMoves(spId, lv),
    hpCur: 0,
    status: null,
    statusTurns: 0,
    friendship: 70,
    held: null,
  };
  mon.hpCur = maxHp(mon);
  return mon;
}

// 4 chiêu gần nhất theo learnset tại level cho trước.
// LEARNSETS[dex] = [[cấp, mã chiêu], ...] đã sắp sẵn theo cấp; một cấp có thể
// học nhiều chiêu nên phải là mảng chứ không phải object khoá theo cấp.
export function defaultMoves(spId, level) {
  const ls = LEARNSETS[spId] || [];
  const learned = ls.filter(([lv]) => lv <= level).map(([, id]) => id);
  // Lấy 4 chiêu cuối cùng (mới nhất)
  const moves = [];
  const start = Math.max(0, learned.length - 4);
  for (let i = start; i < learned.length; i++) {
    const mv = MOVES[learned[i]];
    moves.push({ id: learned[i], pp: mv ? mv.pp : 10 });
  }
  // Con nào không có bảng học chiêu thì vẫn phải có gì đó để đánh
  if (moves.length === 0) moves.push({ id: 'struggle', pp: MOVES.struggle ? MOVES.struggle.pp : 20 });
  return moves;
}

// Tính 6 stats theo công thức Gen 3+ (IV/EV/nature ±10%)
export function stats(mon) {
  const spec = SPECIES[mon.sp];
  const out = {};
  for (let i = 0; i < STAT_KEYS.length; i++) {
    const key = STAT_KEYS[i];
    const base = spec.base[key];
    const iv = mon.iv[i] || 0;
    const ev = mon.ev[i] || 0;
    const lv = mon.lv;
    if (key === 'hp') {
      if (spec.base.hp === 1) {
        // Shedinja-style
        out.hp = 1;
      } else {
        out.hp = Math.floor((2 * base + iv + Math.floor(ev / 4)) * lv / 100) + lv + 10;
      }
    } else {
      let val = Math.floor((2 * base + iv + Math.floor(ev / 4)) * lv / 100) + 5;
      const nat = NATURES[mon.nature];
      if (nat) {
        if (nat.up === key && nat.down !== key) val = Math.floor(val * 1.1);
        else if (nat.down === key && nat.up !== key) val = Math.floor(val * 0.9);
      }
      out[key] = val;
    }
  }
  return out;
}

export function maxHp(mon) {
  return stats(mon).hp;
}

// Tên hiển thị: nickname > tên loài
export function displayName(mon) {
  if (mon.nick) return mon.nick;
  const spec = SPECIES[mon.sp];
  return spec ? spec.name : '?';
}

// Hồi đầy máu + hết trạng thái + hồi PP
export function heal(mon) {
  mon.hpCur = maxHp(mon);
  mon.status = null;
  mon.statusTurns = 0;
  for (const mv of mon.moves || []) {
    const def = MOVES[mv.id];
    mv.pp = def ? def.pp : mv.pp;
  }
}

export function isFainted(mon) {
  return (mon.hpCur || 0) <= 0;
}

// Cộng EV khi hạ đối thủ (tôn trọng cap từng stat và tổng)
export function addEv(mon, yield_) {
  if (!yield_) return;
  let total = 0;
  for (let i = 0; i < 6; i++) total += mon.ev[i] || 0;
  for (let i = 0; i < STAT_KEYS.length; i++) {
    const key = STAT_KEYS[i];
    const add = yield_[key];
    if (add && add > 0) {
      const roomStat = CONFIG.EV_CAP_STAT - (mon.ev[i] || 0);
      const roomTotal = CONFIG.EV_CAP_TOTAL - total;
      const gain = Math.min(add, roomStat, roomTotal);
      if (gain > 0) {
        mon.ev[i] = (mon.ev[i] || 0) + gain;
        total += gain;
      }
    }
  }
}

// Học chiêu mới khi lên level. Trả về: 'learned' | 'full' (đủ 4, cần thay) | null
export function tryLearn(mon, moveId) {
  for (const mv of mon.moves) {
    if (mv.id === moveId) return null; // đã biết
  }
  const def = MOVES[moveId];
  if (!def) return null;
  if (mon.moves.length < 4) {
    mon.moves.push({ id: moveId, pp: def.pp });
    return 'learned';
  }
  return 'full';
}

// Thay chiêu ở vị trí idx (khi đầy 4 chiêu)
export function replaceMove(mon, idx, moveId) {
  const def = MOVES[moveId];
  if (!def || !mon.moves[idx]) return false;
  mon.moves[idx] = { id: moveId, pp: def.pp };
  return true;
}

export function addFriendship(mon, n) {
  mon.friendship = clamp((mon.friendship || 0) + n, 0, 255);
}
