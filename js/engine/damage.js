// TuxeWorld H5 | engine/damage.js | Công thức damage Gen-style: STAB, crit, khắc hệ
import { rng, clamp } from '../util.js';
import { CONFIG } from '../state.js';
import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { typeEff } from '../data/types.js';
import { stats } from './pokemon.js';

// Hệ số stage buff/debuff (-6..+6)
function stageMult(s) {
  s = clamp(s || 0, -6, 6);
  return s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
}

// Tính damage 1 đòn. ctx = { attStage, defStage }
// Trả về: { dmg, crit, eff (multiplier khắc hệ), missed }
export function calcDamage(att, def, moveId, ctx = {}) {
  const move = MOVES[moveId];
  if (!move) return { dmg: 0, crit: false, eff: 1, missed: true };

  // Chiêu status không gây damage
  if (move.category === 'status' || !move.power || move.power <= 0) {
    return { dmg: 0, crit: false, eff: 1, missed: false };
  }

  const acc = move.acc;
  if (acc && acc < 100 && !rng.roll(acc / 100)) {
    return { dmg: 0, crit: false, eff: 1, missed: true };
  }

  const attStats = stats(att);
  const defStats = stats(def);

  let a, d;
  if (move.category === 'physical') {
    a = attStats.atk;
    d = defStats.def;
    // Burn giảm nửa Atk vật lý
    if (att.status === 'brn') a = Math.floor(a / 2);
  } else {
    a = attStats.spa;
    d = defStats.spd;
  }
  // Áp stage buff/debuff trong trận
  a = Math.floor(a * stageMult(ctx.attStage));
  d = Math.floor(d * stageMult(ctx.defStage));

  // Crit 1/24, nhân 1.5 (đơn giản hóa)
  const crit = rng.roll(CONFIG.CRIT_CHANCE);
  if (crit) a = Math.floor(a * 1.5);

  // Công thức gốc Gen
  const base = Math.floor(Math.floor(Math.floor(2 * att.lv / 5 + 2) * move.power * a / Math.max(1, d)) / 50) + 2;

  // STAB
  const specAtt = SPECIES[att.sp];
  let stab = 1;
  for (const t of specAtt.types) {
    if (t === move.type) { stab = 1.5; break; }
  }

  // Khắc hệ
  const specDef = SPECIES[def.sp];
  const eff = typeEff(move.type, specDef.types);

  // Random 85..100%
  const roll = rng.int(85, 100) / 100;

  let dmg = Math.floor(base * stab * eff * roll);
  if (crit) dmg = Math.floor(dmg * 1.5);
  if (eff > 0 && dmg < 1) dmg = 1;
  if (eff === 0) dmg = 0;

  return { dmg, crit, eff, missed: false };
}

export function effText(eff) {
  if (eff === 0) return 'Không có tác dụng!';
  if (eff > 1) return 'Hiệu quả vượt trội!';
  if (eff < 1) return 'Không hiệu quả lắm...';
  return null;
}
