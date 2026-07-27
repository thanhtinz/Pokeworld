// TuxeWorld H5 | engine/catchmon.js | Tỷ lệ bắt — ĐÚNG THEO TUXEMON
//
// Bản gốc (tuxemon/formula.py shake_check + capture, mods/config_capture.yaml):
//   catch_check = (3*HPtối_đa - 2*HPhiện_tại) * catch_rate * hệ_số_trạng_thái
//                 * hệ_số_bóng / (3 * HPtối_đa)
//   shake_check = 524325 / (căn(căn(100 / catch_check)) * 8) * kháng_bắt
//   Lắc 4 lần, mỗi lần bốc số 0..65536; số nào lớn hơn shake_check là nó thoát.
// catch_rate của Tuxemon nằm thang 0-100 (không phải 0-255 kiểu Pokémon), và
// mỗi lần ném còn nhân thêm hệ số kháng bắt ngẫu nhiên riêng của từng loài.
import { rng } from '../util.js';
import { SPECIES } from '../data/species.js';
import { ITEMS } from '../data/items.js';
import { maxHp } from './pokemon.js';
import { catchBonus } from './status.js';

const MAX_CATCH_RATE = 100;      // config_monster.catch_rate_range[1]
const SHAKE_CONSTANT = 524325;
const SHAKE_DENOMINATOR = 8;
const SHAKE_DIVISOR = 65536;
const TOTAL_SHAKES = 4;

// Thử bắt mon bằng ballId. Trả về { caught, shakes (0..4), crit }
export function attemptCatch(mon, ballId) {
  const item = ITEMS[ballId];
  const ballMult = (item && item.effect && item.effect.rate) || 1.0;
  const spec = SPECIES[mon.sp];

  const max = maxHp(mon);
  const cur = Math.max(1, mon.hpCur ?? max);
  const rate = spec?.catchRate ?? 100;
  const statusBonus = catchBonus(mon);

  const catchCheck = (3 * max - 2 * cur) * rate * ballMult * statusBonus / (3 * max);
  if (catchCheck <= 0) return { caught: false, shakes: 0, crit: false };

  const lo = spec?.catchLo ?? 1, hi = spec?.catchHi ?? 1;
  const resist = lo + Math.random() * Math.max(0, hi - lo);
  const shakeCheck = SHAKE_CONSTANT
    / (Math.sqrt(Math.sqrt(MAX_CATCH_RATE / catchCheck)) * SHAKE_DENOMINATOR)
    * resist;

  for (let i = 0; i < TOTAL_SHAKES; i++) {
    if (rng.int(0, SHAKE_DIVISOR) > Math.floor(shakeCheck)) {
      return { caught: false, shakes: i + 1, crit: false };
    }
  }
  return { caught: true, shakes: TOTAL_SHAKES, crit: false };
}
