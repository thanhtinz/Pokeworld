// TuxeWorld H5 | engine/exp.js | Kinh nghiệm, lên cấp — ĐÚNG THEO TUXEMON
//
// Bản gốc (tuxemon/monster/experience.py + mods/config_monster.yaml):
//   EXP tổng cần để đạt cấp N = hệ_số * N^3, nhóm "default" hệ số 1.0.
//   Mọi loài trong bản gốc đều dùng nhóm default — không có con nào lên chậm
//   hay nhanh hơn con nào.
// Thưởng EXP khi hạ một con (combat/experience_strategies.py):
//   exp = tổng_exp_của_con_thua / cấp_của_nó  =  cấp^2, chia đều cho những con
//   có tham chiến.
import { CONFIG } from '../state.js';
import { SPECIES } from '../data/species.js';
import { LEARNSETS } from '../data/learnsets.js';
import { maxHp } from './pokemon.js';
import { monLevelCap, OVER_CAP_EXP } from './player.js';

export function expForLevel(lv) {
  const n = Math.max(1, Math.floor(lv));
  return n <= 1 ? 0 : n ** 3;
}

// EXP nhận được khi hạ `defeatedMon`, chia cho số con tham chiến.
// kind chỉ dùng để nêm nhịp chơi của bản web: đánh huấn luyện viên đáng giá hơn.
const KIND_MULT = { wild: 0.85, trainer: 1.5 };

export function expYield(defeatedMon, n = 1, kind = 'wild') {
  const lv = Math.max(1, defeatedMon.lv || 1);
  const base = Math.floor(expForLevel(lv) / lv);      // = lv^2
  const mult = KIND_MULT[kind] ?? 1;
  return Math.max(1, Math.floor(base * mult / Math.max(1, n)));
}

// Cộng EXP, xử lý lên nhiều cấp. Trả về mảng các cấp mới đạt (rỗng nếu không lên).
export function gainExp(mon, amount) {
  if (!SPECIES[mon.sp]) return [];
  // Vượt trần cấp thì gần như không lên nữa — muốn nuôi tiếp phải tự lên cấp
  // huấn luyện viên đã (đánh trainer, làm nhiệm vụ, đi hết cốt truyện).
  if (mon.lv >= monLevelCap()) amount = Math.max(1, Math.floor(amount * OVER_CAP_EXP));
  const newLevels = [];
  if (mon.lv >= CONFIG.MAX_LEVEL) return newLevels;
  mon.exp = (mon.exp || 0) + amount;
  while (mon.lv < CONFIG.MAX_LEVEL && mon.exp >= expForLevel(mon.lv + 1)) {
    const oldMax = maxHp(mon);
    mon.lv += 1;
    // Lên cấp: HP hiện tại tăng theo phần chênh HP tối đa
    const newMax = maxHp(mon);
    mon.hpCur = Math.min(newMax, (mon.hpCur || 0) + (newMax - oldMax));
    newLevels.push(mon.lv);
  }
  if (mon.lv >= CONFIG.MAX_LEVEL) mon.exp = expForLevel(CONFIG.MAX_LEVEL);
  return newLevels;
}

// Chiêu mới có thể học đúng tại cấp này
export function movesAtLevel(spId, lv) {
  return (LEARNSETS[spId] || []).filter(([l]) => l === lv).map(([, id]) => id);
}

// Tiến độ EXP tới cấp kế: trả về [cur, need] (cho giao diện vẽ thanh exp)
export function expProgress(mon) {
  if (!SPECIES[mon.sp] || mon.lv >= CONFIG.MAX_LEVEL) return [0, 1];
  const lo = expForLevel(mon.lv);
  const hi = expForLevel(mon.lv + 1);
  return [(mon.exp ?? lo) - lo, hi - lo];
}
