// TuxeWorld H5 | engine/ai.js | AI đánh nhau — ĐÚNG THEO TUXEMON
//
// Bản gốc: tuxemon/ai/technique_tracker.py (chấm điểm chiêu),
// tuxemon/ai/decision_strategy.py (chọn nước đi), cấu hình mods/ai_techniques.yaml
// và mods/ai_items.yaml.
//
// Điểm của một chiêu = khắc hệ + thưởng theo tầm đánh + sức mạnh + độ chính xác
//                      + điểm hồi máu (thưởng khi mình sắp gục, phạt khi đang đầy).
// Huấn luyện viên còn xét dùng thuốc trước khi ra đòn (ai_items.yaml).
import { rng } from '../util.js';
import { MOVES } from '../data/moves.js';
import { ITEMS } from '../data/items.js';
import { SPECIES } from '../data/species.js';
import { typeMultiplier } from './damage.js';
import { maxHp } from './monster.js';

// Trọng số mặc định — lấy nguyên bảng ví dụ trong mods/ai_techniques.yaml
export const AI_WEIGHTS = {
  meleeBonus: 1.0, touchBonus: 1.0, rangedBonus: 1.0,
  reachBonus: 1.0, reliableBonus: 1.0,
  powerWeight: 1.0,
  accuracyWeight: 1.0,
  elementalWeight: 1.0,
  elementalHealthScaling: 1.0,
  elementalHealthThreshold: 1.0,
  healthPriorityThreshold: 0.5,
  healingWeight: 1.5,
  healingPenaltyThreshold: 0.9,
  healingPenaltyWeight: 0.5,
};

const POWER_MAX = 3.0;      // platform/const/sizes.py POWER_RANGE[1]

const hpRatio = (mon) => (mon.hpCur || 0) / Math.max(1, maxHp(mon));

// Chấm điểm một chiêu — trả về tổng điểm (càng cao càng nên dùng)
export function scoreMove(user, moveId, foe, w = AI_WEIGHTS) {
  const mv = MOVES[moveId];
  if (!mv) return -Infinity;

  // Khắc hệ; đối thủ còn nhiều máu thì đòn khắc hệ càng đáng giá
  let eff = 0;
  if (w.elementalWeight) {
    eff = typeMultiplier(mv.types, SPECIES[foe.sp]?.types || []) * w.elementalWeight;
    if (w.elementalHealthThreshold && w.elementalHealthScaling
        && hpRatio(foe) > w.elementalHealthThreshold) {
      eff *= w.elementalHealthScaling;
    }
  }

  const tamDanh = w[`${mv.range}Bonus`] || 0;
  const suc = w.powerWeight ? (mv.power || 0) / POWER_MAX * w.powerWeight : 0;
  const trung = w.accuracyWeight ? (mv.acc || 0) / 100 * w.accuracyWeight : 0;

  // Chiêu hồi máu: mình sắp gục thì cộng, mình đang đầy máu thì trừ
  let hoi = 0;
  const laHoi = (mv.heal || 0) > 0 || !mv.power;
  if (laHoi) {
    const r = hpRatio(user);
    if (r < w.healthPriorityThreshold) hoi = (mv.heal || 0) * w.healingWeight;
    else if (r > w.healingPenaltyThreshold) hoi = -(mv.heal || 0) * w.healingPenaltyWeight;
  }

  return eff + tamDanh + suc + trung + hoi;
}

// Chọn chiêu tốt nhất trong danh sách chỉ số chiêu còn dùng được
export function bestMove(user, usable, foe, w = AI_WEIGHTS) {
  let best = null, cao = -Infinity;
  for (const idx of usable) {
    const s = scoreMove(user, user.moves[idx].id, foe, w);
    if (s > cao) { cao = s; best = idx; }
  }
  return best === null ? rng.pick(usable) : best;
}

// Luật dùng thuốc của huấn luyện viên — mods/ai_items.yaml.
// Bản gốc chỉ ghi sẵn một luật: potion dùng khi máu trong khoảng 30%-80%.
export const AI_ITEMS = {
  potion: { hpRange: [0.3, 0.8] },
  super_potion: { hpRange: [0.15, 0.6] },
  mega_potion: { hpBelow: 0.4 },
  imperial_potion: { hpBelow: 0.3 },
  restoration: { statuses: true },
  cureall: { hpBelow: 0.35 },
};

function hopLuat(luat, mon) {
  const r = hpRatio(mon);
  if (luat.hpBelow !== undefined && r >= luat.hpBelow) return false;
  if (luat.hpAbove !== undefined && r <= luat.hpAbove) return false;
  if (luat.hpRange && !(r >= luat.hpRange[0] && r < luat.hpRange[1])) return false;
  if (luat.statuses && !mon.status) return false;
  return true;
}

// Huấn luyện viên có nên dùng thuốc không? bag = { id: số lượng }
// Trả về mã vật phẩm hoặc null.
export function pickItem(mon, bag) {
  for (const [id, luat] of Object.entries(AI_ITEMS)) {
    if (!bag || !bag[id]) continue;
    if (!ITEMS[id] || !ITEMS[id].inBattle) continue;
    if (hopLuat(luat, mon)) return id;
  }
  return null;
}
