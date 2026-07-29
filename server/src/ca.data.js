// TuxeWorld H5 | server/src/ca.data.js | Bậc hiếm của từng loài cá
// SINH TU DONG boi tools/mkca.py — KHONG SUA TAY.
// Máy chủ dùng bảng này để chấm điểm câu cá cho bảng xếp hạng.
export const HIEM_CA = {"ca_ro": 1, "ca_diec": 1, "ca_chep": 2, "ca_tre": 2, "ca_qua": 3, "ca_bong": 1, "ca_lang": 2, "ca_chien": 3, "ca_anh_vu": 4, "ca_nuc": 1, "ca_thu": 2, "ca_ngu": 3, "ca_mu_do": 3, "ca_rong_bien": 4};

// Phải khớp y hệt diemCauCa() bên js/engine/cauca.js
export function diemCauCa(save) {
  const dex = save?.ca?.dex || {};
  let d = 0;
  for (const [id, v] of Object.entries(dex)) {
    const h = HIEM_CA[id];
    if (h) d += Math.round((v?.dai || 0) * (1 + (h - 1) * 0.6));
  }
  return d;
}
