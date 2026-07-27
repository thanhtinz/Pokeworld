// TuxeWorld H5 | engine/exp.js | Đường cong EXP, lên level, chia EXP
import { CONFIG } from '../state.js';
import { SPECIES } from '../data/species.js';
import { LEARNSETS } from '../data/learnsets.js';
import { maxHp, addFriendship } from './pokemon.js';
import { monLevelCap, OVER_CAP_EXP } from './player.js';

// Tổng EXP cần để đạt level lv theo từng đường cong (chuẩn Gen)
const CURVES = {
  fast: (lv) => Math.floor(4 * lv ** 3 / 5),
  medium_fast: (lv) => lv ** 3,
  medium_slow: (lv) => Math.floor(6 * lv ** 3 / 5 - 15 * lv ** 2 + 100 * lv - 140),
  slow: (lv) => Math.floor(5 * lv ** 3 / 4),
};

export function expForLevel(curve, lv) {
  if (lv <= 1) return 0;
  const fn = CURVES[curve] || CURVES.medium_fast;
  return Math.max(0, fn(lv));
}

// EXP đối thủ cho khi bị hạ (công thức rút gọn Gen 1): baseExp * lv / 9 / số người
// tham chiến. Mẫu số 9 thay vì 7 và quái hoang chỉ cho 0.85 phần: đánh bụi cỏ
// là để bắt và kiếm đồ, muốn lên cấp nhanh thì phải đi tìm huấn luyện viên.
const KIND_MULT = { wild: 0.85, trainer: 1.5 };

export function expYield(defeatedMon, n = 1, kind = 'wild') {
  const spec = SPECIES[defeatedMon.sp];
  const base = (spec && spec.baseExp) || 60;
  const nn = Math.max(1, n);
  const mult = KIND_MULT[kind] ?? 1;
  const amount = Math.floor(base * defeatedMon.lv / 9 / nn * mult);
  return Math.max(1, amount);
}

// Cộng EXP, xử lý lên nhiều level. Trả về mảng các level mới đạt (rỗng nếu không lên).
export function gainExp(mon, amount) {
  const spec = SPECIES[mon.sp];
  if (!spec) return [];
  // Lucky Egg x1.5
  if (mon.held === 'nu_phone') amount = Math.floor(amount * 1.5);
  // Vượt trần cấp thì gần như không lên nữa — muốn nuôi tiếp phải tự lên cấp
  // huấn luyện viên đã (đánh trainer, làm nhiệm vụ, đi hết cốt truyện).
  if (mon.lv >= monLevelCap()) amount = Math.max(1, Math.floor(amount * OVER_CAP_EXP));
  const newLevels = [];
  if (mon.lv >= CONFIG.MAX_LEVEL) return newLevels;
  mon.exp = (mon.exp || 0) + amount;
  while (mon.lv < CONFIG.MAX_LEVEL && mon.exp >= expForLevel(spec.expCurve, mon.lv + 1)) {
    const oldMax = maxHp(mon);
    mon.lv += 1;
    // Lên level: HP hiện tại tăng theo phần chênh max HP
    const newMax = maxHp(mon);
    mon.hpCur = Math.min(newMax, (mon.hpCur || 0) + (newMax - oldMax));
    newLevels.push(mon.lv);
    addFriendship(mon, 2);
  }
  if (mon.lv >= CONFIG.MAX_LEVEL) {
    mon.exp = expForLevel(spec.expCurve, CONFIG.MAX_LEVEL);
  }
  return newLevels;
}

// Chiêu mới có thể học đúng tại level này
export function movesAtLevel(spId, lv) {
  const ls = LEARNSETS[spId] || [];
  const out = ls.filter(([l]) => l === lv).map(([, id]) => id);
  return out;
}

// Tiến độ EXP tới level kế: trả về [cur, need] (cho UI vẽ thanh exp)
export function expProgress(mon) {
  const spec = SPECIES[mon.sp];
  if (!spec || mon.lv >= CONFIG.MAX_LEVEL) return [0, 1];
  const lo = expForLevel(spec.expCurve, mon.lv);
  const hi = expForLevel(spec.expCurve, mon.lv + 1);
  return [(mon.exp ?? lo) - lo, hi - lo];
}
