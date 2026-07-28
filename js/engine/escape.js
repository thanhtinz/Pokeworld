// TuxeWorld H5 | engine/escape.js | Tỉ lệ chạy trốn ĐÚNG THEO TUXEMON
//
// Bản gốc: tuxemon/formula.py (attempt_escape) + core/effects/run.py.
// Có 4 cách tính, chọn bằng biến method_escape:
//   default  0.4 + 0.15 * (số lần đã thử + cấp mình - cấp địch)
//   relative 0.2 + 0.1*chênh cấp - 0.05*(sức địch/10) + 0.05*(tốc mình/10)
//   always   luôn thoát
//   never    không bao giờ thoát
// Điểm mấu chốt: mỗi lần chạy hụt thì lần sau DỄ HƠN — đếm số lần đã thử.
import { rng } from '../util.js';
import { stats } from './monster.js';

function defaultEscape(user, target, attempts) {
  return 0.4 + 0.15 * (attempts + user.lv - target.lv);
}

function relativeEscape(user, target) {
  const t = stats(target);
  const u = stats(user);
  const suc = (t.melee + t.ranged + t.dodge) / 3;
  return 0.2 + 0.1 * (user.lv - target.lv) - 0.05 * suc / 10 + 0.05 * u.speed / 10;
}

// Trả về xác suất [0..1]
export function escapeChance(method, user, target, attempts = 0) {
  if (method === 'always') return 1;
  if (method === 'never') return 0;
  const c = method === 'relative'
    ? relativeEscape(user, target)
    : defaultEscape(user, target, attempts);
  return Math.max(0, Math.min(1, c));
}

export function attemptEscape(method, user, target, attempts = 0) {
  return rng.roll(escapeChance(method, user, target, attempts));
}
