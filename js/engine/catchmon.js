// TuxeWorld H5 | engine/catchmon.js | Công thức tỷ lệ bắt: ball modifier, status, critical catch
import { rng } from '../util.js';
import { SPECIES } from '../data/species.js';
import { ITEMS } from '../data/items.js';
import { maxHp } from './pokemon.js';
import { catchBonus } from './status.js';

// Thử bắt mon bằng ballId. Công thức Gen 3/4 rút gọn:
//   a = (3*maxHP - 2*curHP) * rate * ball / (3*maxHP) * statusBonus
//   bắt chắc nếu a >= 255, ngược lại 4 lần lắc xác suất b = (a/255)^0.25
// Trả về { caught, shakes (0..3), crit }
export function attemptCatch(mon, ballId) {
  const item = ITEMS[ballId];
  const ballMult = (item && item.effect && item.effect.rate) || 1.0;
  const spec = SPECIES[mon.sp];

  const max = maxHp(mon);
  const cur = Math.max(1, mon.hpCur ?? max);
  const rate = (spec && spec.catchRate) || 45;
  const statusBonus = catchBonus(mon);

  let a = (3 * max - 2 * cur) * rate * ballMult / (3 * max) * statusBonus;
  a = Math.min(255, a);

  // Critical catch: tỉ lệ nhỏ, chỉ 1 lần lắc
  const crit = rng.roll(Math.min(0.15, a / 255 / 6));

  if (a >= 255) {
    return { caught: true, shakes: 3, crit };
  }

  const b = (a / 255) ** 0.25;
  const checks = crit ? 1 : 4;
  let shakes = 0;
  for (let k = 0; k < checks; k++) {
    if (rng.roll(b)) shakes++;
    else break;
  }
  const caught = shakes === checks;
  if (!crit && caught) shakes = 3;
  return { caught, shakes: Math.min(shakes, 3), crit };
}
