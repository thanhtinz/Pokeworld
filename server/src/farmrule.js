// TuxeWorld server | src/farmrule.js | Công thức tỉ lệ bị cướp nông trại
//
// Tách riêng khỏi src/farms.js và KHÔNG import gì cả: bộ smoke test của client
// (tests/smoke.mjs) đối chiếu con số hai bên, mà job deploy chỉ chạy client nên
// không có node_modules của server. Để công thức nằm trong farms.js thì test đó
// kéo theo cả express và deploy đỏ.
//
// Client dùng bản của mình trong js/engine/nongtrai.js. Hai bên PHẢI ra cùng
// một số: lệch là màn hình hiện một tỉ lệ rồi máy chủ bốc theo một tỉ lệ khác.
export const CUOP_GOC = 0.75;        // chưa có thú canh thì cướp gần như chắc ăn
export const CUOP_SAN = 0.20;        // canh giỏi nhất cũng chỉ chặn xuống mức này

/** Tỉ lệ một lần cướp thành công, theo cấp con đang canh (0 = không ai canh). */
export function tiLeBiCuop(capCanh = 0) {
  if (!capCanh) return CUOP_GOC;
  const giam = Math.min(CUOP_GOC - CUOP_SAN, 0.011 * capCanh);
  return Math.max(CUOP_SAN, CUOP_GOC - giam);
}
