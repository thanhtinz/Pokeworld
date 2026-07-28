// TuxeWorld H5 | data/gear.js | Trang bị cho Tuxemon
// SINH TU DONG boi tools/mkgear.py — KHONG SUA TAY.
//
// Mỗi món có NĂM ảnh, một ảnh cho mỗi bậc sao: nâng sao là món đổi hình
// hẳn chứ không chỉ đổi con số (1 sao hàng trần → 5 sao thân tím, viền
// vàng, đá quý to, hào quang quanh món).
//
// base = chỉ số cộng thêm lúc 1 sao +0. Công thức đủ nằm ở engine/gear.js.

export const O_TRANG_BI = [
  { id: "mu", name: "Mũ", stat: "dodge" },
  { id: "ao", name: "Áo Giáp", stat: "armour" },
  { id: "vai", name: "Giáp Vai", stat: "hp" },
  { id: "tay", name: "Găng Tay", stat: "melee" },
  { id: "giay", name: "Giày", stat: "speed" },
  { id: "phu", name: "Trang Sức", stat: "ranged" },
];

export const HO_TRANG_BI = {
  vai: { name: "Vải", suc: 1.0 },
  sat: { name: "Sắt", suc: 1.7 },
  rong: { name: "Rồng", suc: 2.6 },
};

// Ảnh theo bậc sao: anhGear(id, sao)
export const anhGear = (id, sao) =>
  `assets/gear/${id}_${Math.max(1, Math.min(5, sao || 1))}.png`;

export const SAO_TOI_DA = 5;

export const GEAR = [
  { id: "mu_vai", o: "mu", ho: "vai", name: "Mũ Vải", stat: "dodge", base: 12, gia: 1200 },
  { id: "mu_sat", o: "mu", ho: "sat", name: "Mũ Sắt", stat: "dodge", base: 20, gia: 4800 },
  { id: "mu_rong", o: "mu", ho: "rong", name: "Mũ Rồng", stat: "dodge", base: 31, gia: 14400 },
  { id: "ao_vai", o: "ao", ho: "vai", name: "Áo Giáp Vải", stat: "armour", base: 16, gia: 1600 },
  { id: "ao_sat", o: "ao", ho: "sat", name: "Áo Giáp Sắt", stat: "armour", base: 27, gia: 6400 },
  { id: "ao_rong", o: "ao", ho: "rong", name: "Áo Giáp Rồng", stat: "armour", base: 42, gia: 19200 },
  { id: "vai_vai", o: "vai", ho: "vai", name: "Giáp Vai Vải", stat: "hp", base: 45, gia: 1400 },
  { id: "vai_sat", o: "vai", ho: "sat", name: "Giáp Vai Sắt", stat: "hp", base: 76, gia: 5600 },
  { id: "vai_rong", o: "vai", ho: "rong", name: "Giáp Vai Rồng", stat: "hp", base: 117, gia: 16800 },
  { id: "tay_vai", o: "tay", ho: "vai", name: "Găng Tay Vải", stat: "melee", base: 14, gia: 1300 },
  { id: "tay_sat", o: "tay", ho: "sat", name: "Găng Tay Sắt", stat: "melee", base: 24, gia: 5200 },
  { id: "tay_rong", o: "tay", ho: "rong", name: "Găng Tay Rồng", stat: "melee", base: 36, gia: 15600 },
  { id: "giay_vai", o: "giay", ho: "vai", name: "Giày Vải", stat: "speed", base: 12, gia: 1100 },
  { id: "giay_sat", o: "giay", ho: "sat", name: "Giày Sắt", stat: "speed", base: 20, gia: 4400 },
  { id: "giay_rong", o: "giay", ho: "rong", name: "Giày Rồng", stat: "speed", base: 31, gia: 13200 },
  { id: "phu_vai", o: "phu", ho: "vai", name: "Trang Sức Vải", stat: "ranged", base: 14, gia: 1500 },
  { id: "phu_sat", o: "phu", ho: "sat", name: "Trang Sức Sắt", stat: "ranged", base: 24, gia: 6000 },
  { id: "phu_rong", o: "phu", ho: "rong", name: "Trang Sức Rồng", stat: "ranged", base: 36, gia: 18000 },
];

export const GEAR_BY_ID = Object.fromEntries(GEAR.map(g => [g.id, g]));
export const O_BY_ID = Object.fromEntries(O_TRANG_BI.map(o => [o.id, o]));
