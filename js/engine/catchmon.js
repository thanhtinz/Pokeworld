// TuxeWorld H5 | engine/catchmon.js | Tỷ lệ bắt — ĐÚNG THEO TUXEMON
//
// Bản gốc (tuxemon/formula.py: shake_check + capture + calculate_status_modifier
// + calculate_capdev_modifier, cấu hình mods/capture_devices.yaml):
//   catch_check = (3*HPtối_đa - 2*HPhiện_tại) * catch_rate * hệ_số_trạng_thái
//                 * hệ_số_bóng / (3 * HPtối_đa)
//   shake_check = 524325 / (căn(căn(100 / catch_check)) * 8) * kháng_bắt
//   Lắc 4 lần, mỗi lần bốc số 0..65536; số nào lớn hơn shake_check là nó thoát.
// catch_rate của Tuxemon nằm thang 0-100 (không phải thang 0-255), và
// mỗi lần ném còn nhân thêm hệ số kháng bắt ngẫu nhiên riêng của từng loài.
import { rng } from '../util.js';
import { SPECIES } from '../data/species.js';
import { STATUSES } from '../data/statuses.js';
import { CAPDEV, CAPDEV_BASE } from '../data/capdev.js';
import { maxHp, stats } from './monster.js';
import { gameVars } from './daytime.js';

const MAX_CATCH_RATE = 100;      // config_monster.catch_rate_range[1]
const SHAKE_CONSTANT = 524325;
const SHAKE_DENOMINATOR = 8;
const SHAKE_DIVISOR = 65536;
const TOTAL_SHAKES = 4;
const CRUSHER_CAP = 1.4;

// Hệ số theo trạng thái của mục tiêu. Loại bóng nào khai riêng thì dùng số
// riêng, không thì lấy 1.0 (trạng thái tốt) / 1.2 (trạng thái xấu).
export function statusModifier(ballId, mon) {
  let m = CAPDEV_BASE.statusMult;
  const cfg = CAPDEV[ballId];
  const st = mon.status && STATUSES[mon.status];
  if (!cfg || !st) return m;
  if (cfg.status && cfg.status[mon.status] !== undefined) m *= cfg.status[mon.status];
  if (st.cat) {
    m *= st.cat === 'negative'
      ? (cfg.negative ?? CAPDEV_BASE.negative)
      : (cfg.positive ?? CAPDEV_BASE.positive);
  }
  return m;
}

// Hệ số riêng của từng loại Tuxeball: nhân thẳng, hệ/giới tính/giờ giấc không
// khớp thì ăn phạt nặng (0.2) đúng như bản gốc.
export function ballModifier(ballId, mon) {
  let m = CAPDEV_BASE.ballMult;
  const cfg = CAPDEV[ballId];
  if (!cfg) return m;

  if (cfg.mult) m *= cfg.mult;

  // Tuxeball Nghiền: giáp đối thủ càng dày càng dễ, nhưng dính buff là hỏng
  if (ballId === 'tuxeball_crusher') {
    let crusher = Math.min(CRUSHER_CAP, (stats(mon).armour / 5) * 0.01 + 1);
    if (statusModifier(ballId, mon) === (cfg.positive ?? CAPDEV_BASE.positive)) crusher = 0.01;
    m *= crusher;
  }

  // CHỖ LỆCH CÓ CHỦ Ý: bản gốc nhân hình phạt (0.2) KỂ CẢ khi đã khớp — nhìn
  // dòng log ngay cạnh ("No matching element found") thì rõ là nhầm, vì như vậy
  // Tuxeball Gỗ bắt con hệ Gỗ (1.5*0.2 = 0.3) còn tệ hơn Tuxeball thường (1.0),
  // tức là không loại bóng chuyên hệ nào đáng mua. Ở đây chỉ phạt khi TRẬT.
  if (cfg.element) {
    const types = SPECIES[mon.sp]?.types || [];
    let khop = false;
    for (const [t, v] of Object.entries(cfg.element)) if (types.includes(t)) { m *= v; khop = true; }
    if (!khop) m *= cfg.elementMalus ?? CAPDEV_BASE.elementMalus;
  }

  if (cfg.gender) {
    let khop = false;
    for (const [g, v] of Object.entries(cfg.gender)) if (mon.gender === g) { m *= v; khop = true; }
    if (!khop) m *= cfg.genderMalus ?? CAPDEV_BASE.genderMalus;
  }

  if (cfg.vars) {
    const vars = gameVars();
    let khop = false;
    for (const v of cfg.vars) {
      if (String(vars[v.key]) === String(v.value)) { m *= cfg.varBonus ?? CAPDEV_BASE.varBonus; khop = true; }
    }
    if (!khop) m *= cfg.varMalus ?? CAPDEV_BASE.varMalus;
  }

  if (cfg.random) m *= cfg.random[0] + Math.random() * (cfg.random[1] - cfg.random[0]);

  return m;
}

// Bắt xong thì vài loại bóng còn sửa luôn con vừa bắt (candy +1 cấp, bóng khẩu
// vị đổi vị ấm) — bản gốc: formula.apply_effects.
export function applyBallEffects(ballId, mon) {
  const cfg = CAPDEV[ballId];
  for (const e of cfg?.onCatch || []) {
    if (e.op === 'increment') mon[e.attr] = (Number(mon[e.attr]) || 0) + Number(e.value);
    else if (e.op === 'decrement') mon[e.attr] = (Number(mon[e.attr]) || 0) - Number(e.value);
    else if (e.op === 'multiply') mon[e.attr] = (Number(mon[e.attr]) || 0) * Number(e.value);
    else if (e.op === 'divide') mon[e.attr] = (Number(mon[e.attr]) || 0) / Number(e.value);
    else if (e.op === 'set') mon[e.attr] = e.value;
  }
}

// Ném hụt mà bóng thuộc loại nhặt lại được thì không mất bóng
export const keepOnFail = (ballId) => !!CAPDEV[ballId]?.keepOnFail;
export const keepOnCatch = (ballId) => !!CAPDEV[ballId]?.keepOnCatch;

// Thử bắt mon bằng ballId. Trả về { caught, shakes (0..4) }
export function attemptCatch(mon, ballId) {
  const spec = SPECIES[mon.sp];
  const max = maxHp(mon);
  const cur = Math.max(1, mon.hpCur ?? max);
  const rate = spec?.catchRate ?? 100;

  const catchCheck = (3 * max - 2 * cur) * rate
    * statusModifier(ballId, mon) * ballModifier(ballId, mon) / (3 * max);
  if (catchCheck <= 0) return { caught: false, shakes: 0 };

  const lo = spec?.catchLo ?? 1, hi = spec?.catchHi ?? 1;
  const resist = lo + Math.random() * Math.max(0, hi - lo);
  const shakeCheck = SHAKE_CONSTANT
    / (Math.sqrt(Math.sqrt(MAX_CATCH_RATE / catchCheck)) * SHAKE_DENOMINATOR)
    * resist;

  for (let i = 0; i < TOTAL_SHAKES; i++) {
    if (rng.int(0, SHAKE_DIVISOR) > Math.floor(shakeCheck)) {
      return { caught: false, shakes: i + 1 };
    }
  }
  return { caught: true, shakes: TOTAL_SHAKES };
}
