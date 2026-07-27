// TuxeWorld H5 | engine/damage.js | Công thức sát thương ĐÚNG THEO TUXEMON
//
// Bản gốc (tuxemon/formula.py — simple_damage_calculate):
//   sát thương = int(sức đánh * sức chiêu / sức đỡ)
//   sức đánh = chỉ số ra đòn * (7 + cấp)      (tầm "reliable" thì chỉ (7 + cấp))
//   sức chiêu = power * hệ số khắc hệ
//   sức đỡ   = max(1, chỉ số đỡ đòn)
// Tầm đánh quyết định lấy chỉ số nào (mods/range_map.yaml):
//   melee    cận chiến  vs giáp
//   touch    cận chiến  vs né
//   ranged   tầm xa     vs né
//   reach    tầm xa     vs giáp
//   reliable theo cấp   vs 1 (không đỡ được)
// Tuxemon KHÔNG có STAB, KHÔNG có chí mạng, KHÔNG nhân ngẫu nhiên 85-100%.
import { rng, clamp } from '../util.js';
import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { typeEff } from '../data/types.js';
import { stats } from './pokemon.js';

// Hệ số buff/debuff trong trận (-6..+6) — phần này game giữ lại cho dễ chơi
function stageMult(s) {
  s = clamp(s || 0, -6, 6);
  return s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
}

// Bảng tầm đánh: [chỉ số của người ra đòn, chỉ số của người đỡ]
export const RANGE_MAP = {
  melee: ['melee', 'armour'],
  touch: ['melee', 'dodge'],
  ranged: ['ranged', 'dodge'],
  reach: ['ranged', 'armour'],
  reliable: ['level', 'resist'],
};

const COEFF_DAMAGE = 7;          // hằng số của bản gốc
const MULT_MIN = 0.25, MULT_MAX = 4;

// Khắc hệ: nhân dồn MỌI hệ của chiêu với MỌI hệ của mục tiêu rồi kẹp [0.25, 4]
export function typeMultiplier(moveTypes, defTypes) {
  let m = 1;
  for (const t of moveTypes || []) m *= typeEff(t, defTypes || []);
  return Math.min(MULT_MAX, Math.max(MULT_MIN, m));
}

// Tính sát thương 1 đòn. ctx = { attStage, defStage }
// Trả về: { dmg, crit, eff (hệ số khắc hệ), missed }
export function calcDamage(att, def, moveId, ctx = {}) {
  const move = MOVES[moveId];
  if (!move) return { dmg: 0, crit: false, eff: 1, missed: true };

  if (move.category !== 'damage' || !move.power || move.power <= 0) {
    return { dmg: 0, crit: false, eff: 1, missed: false };
  }

  const acc = move.acc;
  if (acc && acc < 100 && !rng.roll(acc / 100)) {
    return { dmg: 0, crit: false, eff: 1, missed: true };
  }

  const [userKey, targetKey] = RANGE_MAP[move.range] || RANGE_MAP.melee;
  const attStats = stats(att);
  const defStats = stats(def);

  // Sức đánh
  let strength;
  if (userKey === 'level') {
    strength = COEFF_DAMAGE + att.lv;
  } else {
    let a = attStats[userKey];
    // Bỏng làm yếu đòn cận chiến (bản gốc giảm qua status, giữ lại cho dễ hiểu)
    if (att.status === 'brn' && userKey === 'melee') a = Math.floor(a / 2);
    strength = a * stageMult(ctx.attStage) * (COEFF_DAMAGE + att.lv);
  }

  // Sức đỡ
  const resist = targetKey === 'resist'
    ? 1
    : Math.max(1, defStats[targetKey] * stageMult(ctx.defStage));

  const eff = typeMultiplier(move.types, SPECIES[def.sp]?.types || []);
  const dmg = Math.floor(strength * (move.power * eff) / resist);

  return { dmg: Math.max(eff > 0 ? 1 : 0, dmg), crit: false, eff, missed: false };
}

export function effText(eff) {
  if (eff === 0) return 'Không có tác dụng!';
  if (eff > 1) return 'Hiệu quả vượt trội!';
  if (eff < 1) return 'Không hiệu quả lắm...';
  return null;
}
