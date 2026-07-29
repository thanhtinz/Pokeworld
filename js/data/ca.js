// TuxeWorld H5 | data/ca.js | Danh mục cá + chỗ câu + cần câu
// SINH TU DONG boi tools/mkca.py — KHONG SUA TAY.
//
// Icon vẽ bằng code (assets/ca) chứ không lấy từ kho nào: cá không có
// sẵn trong Tuxemon, mà kiếm pack ngoài thì lại vướng giấy phép.

export const THU_MUC_CA = "assets/ca";

// Bậc hiếm: càng cao càng khó cắn câu, bán cũng càng được giá.
export const HIEM = [
  { bac: 1, name: "Thường", mau: "#9aa4b2" },
  { bac: 2, name: "Khá", mau: "#5bc0eb" },
  { bac: 3, name: "Hiếm", mau: "#c77dff" },
  { bac: 4, name: "Huyền Thoại", mau: "#ffd43b" },
];

// Trọng số cắn câu theo bậc hiếm (chưa chuẩn hoá).
export const TRONG_SO = {"1": 100, "2": 45, "3": 14, "4": 2};

export const CHO_CAU = [
  { id: "ao_nong_trai", name: "Ao Nông Trại", desc: "Ao nước ngay trong nông trại, cá hiền, hợp người mới." },
  { id: "song_taba", name: "Sông Taba", desc: "Nước chảy quanh thị trấn, cá to hơn và khó lừa hơn." },
  { id: "bien_pepper", name: "Biển Pepper", desc: "Sóng lớn gió to. Chỗ duy nhất câu được cá quý." },
];

// giaCm = tiền trên mỗi cm, nên con càng dài bán càng được giá.
export const CA = [
  { id: "ca_ro", name: "Cá Rô", hiem: 1, cho: "ao_nong_trai", dai: [8, 22], giaCm: 4, mau: "#6b7a3a", desc: "Con cá quen mặt nhất ao hồ. Nhỏ mà lì." },
  { id: "ca_diec", name: "Cá Diếc", hiem: 1, cho: "ao_nong_trai", dai: [10, 26], giaCm: 5, mau: "#8a8f6a", desc: "Thịt lành, dân câu hay bắt được lúc sáng sớm." },
  { id: "ca_chep", name: "Cá Chép", hiem: 2, cho: "ao_nong_trai", dai: [20, 55], giaCm: 7, mau: "#9a6b2f", desc: "Vảy vàng óng. Câu được con to là cả buổi vui." },
  { id: "ca_tre", name: "Cá Trê", hiem: 2, cho: "ao_nong_trai", dai: [18, 48], giaCm: 8, mau: "#3f3a33", desc: "Râu dài, trơn tuột, giãy khoẻ hơn vẻ ngoài." },
  { id: "ca_qua", name: "Cá Quả", hiem: 3, cho: "ao_nong_trai", dai: [30, 70], giaCm: 11, mau: "#3c4a3a", desc: "Săn mồi cỡ bự của hồ. Cắn câu là cần cong hẳn." },
  { id: "ca_bong", name: "Cá Bống", hiem: 1, cho: "song_taba", dai: [6, 18], giaCm: 5, mau: "#7a6a55", desc: "Nằm sát đáy, hay rúc vào khe đá." },
  { id: "ca_lang", name: "Cá Lăng", hiem: 2, cho: "song_taba", dai: [25, 60], giaCm: 9, mau: "#5a5f6b", desc: "Cá sông thịt chắc, dân sành ăn săn lùng." },
  { id: "ca_chien", name: "Cá Chiên", hiem: 3, cho: "song_taba", dai: [35, 85], giaCm: 13, mau: "#4a4230", desc: "To và dữ. Cần yếu là gãy làm đôi." },
  { id: "ca_anh_vu", name: "Cá Anh Vũ", hiem: 4, cho: "song_taba", dai: [28, 62], giaCm: 26, mau: "#8b3a3a", desc: "Xưa chỉ dành tiến vua. Cả tháng chưa chắc gặp một con." },
  { id: "ca_nuc", name: "Cá Nục", hiem: 1, cho: "bien_pepper", dai: [12, 28], giaCm: 6, mau: "#5f7a8a", desc: "Đi thành đàn, cắn câu liên tục." },
  { id: "ca_thu", name: "Cá Thu", hiem: 2, cho: "bien_pepper", dai: [30, 75], giaCm: 10, mau: "#3d5a6b", desc: "Bơi nhanh như tên. Kéo mỏi cả tay." },
  { id: "ca_ngu", name: "Cá Ngừ", hiem: 3, cho: "bien_pepper", dai: [50, 120], giaCm: 15, mau: "#2f4a5e", desc: "Nặng như hòn đá, khoẻ như con trâu." },
  { id: "ca_mu_do", name: "Cá Mú Đỏ", hiem: 3, cho: "bien_pepper", dai: [35, 80], giaCm: 17, mau: "#9b3730", desc: "Đỏ au, nấp trong rạn. Nhà hàng trả giá cao." },
  { id: "ca_rong_bien", name: "Cá Rồng Biển", hiem: 4, cho: "bien_pepper", dai: [60, 150], giaCm: 30, mau: "#2b6b6b", desc: "Người ta đồn thấy nó thì cả năm gặp may." },
];

export const CA_BY_ID = Object.fromEntries(CA.map(c => [c.id, c]));

// Cần câu: `bac` = câu được cá tới bậc hiếm nào, `mau` = lớp cần
// vẽ trên bản đồ lúc thả câu (assets/nv_cau/can).
export const CAN = [
  { id: "can_tre", name: "Cần Tre", gia: 0, bac: 2, mau: "nau", desc: "Cần gộc tự vót. Chỉ với tới cá thường và khá." },
  { id: "can_go", name: "Cần Gỗ", gia: 3500, bac: 3, mau: "goc", desc: "Dẻo hơn, kéo được cá hiếm mà không gãy." },
  { id: "can_thep", name: "Cần Thép", gia: 18000, bac: 4, mau: "xanh", desc: "Lõi thép. Cá huyền thoại cũng gồng được." },
];

export const CAN_BY_ID = Object.fromEntries(CAN.map(c => [c.id, c]));

/** Ảnh icon của một loài cá. */
export const anhCa = (id) => `${THU_MUC_CA}/${id}.png`;

