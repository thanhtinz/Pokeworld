// TuxeWorld H5 | data/nhanvat.js | Danh mục ngoại hình + quần áo nhân vật
// SINH TU DONG boi tools/cozy.py — KHONG SUA TAY.
//
// Ô 32x32, thân người cao 20px — đúng bằng tỉ lệ NPC của Tuxemon (0.625)
// nên nhân vật chính và NPC cùng một cỡ pixel, không cái nào mịn hơn cái nào.
// Mỗi tệp là một LỚP rời; engine/avatar.js chồng lên nhau thành sprite.

export const THU_MUC = "assets/nv";

// Bộ CÂU CÁ: cùng đúng những lớp đó nhưng 5 khung x 4 hàng (chuẩn bị →
// vung → quật → quăng → giữ). Thân người ở đây KHÔNG cầm cần; cần câu là
// một lớp riêng vẽ sau cùng nên đổi màu theo cấp cần đang cầm được.
export const THU_MUC_CAU = "assets/nv_cau";
export const CAU_COT = 5;
// Nhịp từng khung (ms) — chép từ info.txt của pack.
export const CAU_NHIP = { doc: [100, 250, 60, 100, 100], ngang: [100, 100, 250, 60, 100] };
// Pack vẽ nhân vật lúc câu CAO HƠN 4px so với lúc đi, nên vẽ lên bản đồ
// phải hạ xuống bấy nhiêu, không thì chân lơ lửng trên mặt đất.
export const CAU_LECH_Y = 4;
export const CAN_MAU = ["goc", "nau", "xanh", "hong"];

// Giới tính chọn TRƯỚC. Bộ sprite này vẽ chung một thân cho cả hai giới,
// nên giới tính chỉ dùng để LỌC danh sách kiểu tóc và bộ đồ gợi ý.
export const GIOI = [{ id: "nam", name: "Nam" }, { id: "nu", name: "Nữ" }];

// Nước da: tệp nguồn char1..char8 không xếp theo độ sáng, nên bảng này
// đã sắp lại từ sáng tới sẫm và `tep` mới là số thứ tự tệp thật.
export const DA = [
  { id: "da1", name: "Sáng", tep: 1, mau: "#e6ac9c" },
  { id: "da2", name: "Ngà", tep: 2, mau: "#dea48a" },
  { id: "da3", name: "Vàng Ấm", tep: 4, mau: "#eb9c7a" },
  { id: "da4", name: "Rám Nắng", tep: 3, mau: "#de9a85" },
  { id: "da5", name: "Đồng", tep: 5, mau: "#ab6e4d" },
  { id: "da6", name: "Nâu", tep: 6, mau: "#96553e" },
  { id: "da7", name: "Nâu Đậm", tep: 7, mau: "#784c31" },
  { id: "da8", name: "Sẫm", tep: 8, mau: "#6c3d2d" },
];

export const MAT = [{ id: "den", name: "Đen", mau: "#362f2d" }, { id: "xanhduong", name: "Xanh Dương", mau: "#354652" }, { id: "xanhnhat", name: "Xanh Nhạt", mau: "#546e8a" }, { id: "nau", name: "Nâu", mau: "#4d3530" }, { id: "nautham", name: "Nâu Thẫm", mau: "#2e2723" }, { id: "naunhat", name: "Nâu Nhạt", mau: "#754b44" }, { id: "xanhla", name: "Xanh Lá", mau: "#475c4e" }, { id: "latham", name: "Lá Thẫm", mau: "#24382d" }, { id: "lanhat", name: "Lá Nhạt", mau: "#637d64" }, { id: "xam", name: "Xám", mau: "#544b4e" }, { id: "xamnhat", name: "Xám Nhạt", mau: "#6e656a" }, { id: "hong", name: "Hồng", mau: "#b04f63" }, { id: "hongnhat", name: "Hồng Nhạt", mau: "#c26576" }, { id: "do", name: "Đỏ", mau: "#a64444" }];
export const MA_HONG = [{ id: "m1", name: "Mức 1" }, { id: "m2", name: "Mức 2" }, { id: "m3", name: "Mức 3" }, { id: "m4", name: "Mức 4" }, { id: "m5", name: "Mức 5" }];
export const SON_MOI = [{ id: "m1", name: "Mức 1" }, { id: "m2", name: "Mức 2" }, { id: "m3", name: "Mức 3" }, { id: "m4", name: "Mức 4" }, { id: "m5", name: "Mức 5" }];
export const TOC_KIEU = [{ id: "buzzcut", name: "Tóc Húi Cua", gioi: "nam" }, { id: "gentleman", name: "Tóc Chải Lệch", gioi: "nam" }, { id: "emo", name: "Tóc Che Mắt", gioi: "" }, { id: "curly", name: "Tóc Xoăn", gioi: "" }, { id: "bob", name: "Tóc Bob", gioi: "" }, { id: "wavy", name: "Tóc Gợn Sóng", gioi: "" }, { id: "french_curl", name: "Xoăn Kiểu Pháp", gioi: "nu" }, { id: "midiwave", name: "Sóng Lỡ Vai", gioi: "nu" }, { id: "long_straight", name: "Tóc Dài Thẳng", gioi: "nu" }, { id: "extra_long", name: "Tóc Cực Dài", gioi: "nu" }, { id: "ponytail", name: "Tóc Đuôi Ngựa", gioi: "nu" }, { id: "braids", name: "Tóc Tết", gioi: "nu" }, { id: "spacebuns", name: "Hai Búi", gioi: "nu" }];
export const TOC_MAU = [{ id: "den", name: "Đen", mau: "#3d2e2e" }, { id: "vang", name: "Vàng", mau: "#946950" }, { id: "nau", name: "Nâu", mau: "#553a3a" }, { id: "naunhat", name: "Nâu Nhạt", mau: "#754d4b" }, { id: "dong", name: "Đồng", mau: "#875448" }, { id: "lucbao", name: "Lục Bảo", mau: "#274f49" }, { id: "xanhla", name: "Xanh Lá", mau: "#3c6342" }, { id: "xam", name: "Xám", mau: "#625a58" }, { id: "tunhat", name: "Tím Nhạt", mau: "#645473" }, { id: "xanhtham", name: "Xanh Thẫm", mau: "#433e5c" }, { id: "hong", name: "Hồng", mau: "#a35d6b" }, { id: "tim", name: "Tím", mau: "#463f66" }, { id: "do", name: "Đỏ", mau: "#783e45" }, { id: "ngoclam", name: "Ngọc Lam", mau: "#436069" }];
export const RAU_MAU = [{ id: "den", name: "Đen", mau: "#493736" }, { id: "vang", name: "Vàng", mau: "#a37758" }, { id: "nau", name: "Nâu", mau: "#614440" }, { id: "naunhat", name: "Nâu Nhạt", mau: "#825952" }, { id: "dong", name: "Đồng", mau: "#99624e" }, { id: "lucbao", name: "Lục Bảo", mau: "#2d5e52" }, { id: "xanhla", name: "Xanh Lá", mau: "#45734a" }, { id: "xam", name: "Xám", mau: "#757464" }, { id: "tunhat", name: "Tím Nhạt", mau: "#786187" }, { id: "xanhtham", name: "Xanh Thẫm", mau: "#53496e" }, { id: "hong", name: "Hồng", mau: "#ba6877" }, { id: "tim", name: "Tím", mau: "#4b4b7a" }, { id: "do", name: "Đỏ", mau: "#914747" }, { id: "ngoclam", name: "Ngọc Lam", mau: "#4d757a" }];
export const DO_MAU = [{ id: "den", name: "Đen", mau: "#4c464b" }, { id: "xanhduong", name: "Xanh Dương", mau: "#4b6275" }, { id: "xanhnhat", name: "Xanh Nhạt", mau: "#6283a4" }, { id: "nau", name: "Nâu", mau: "#654530" }, { id: "xanhla", name: "Xanh Lá", mau: "#406158" }, { id: "lanhat", name: "Lá Nhạt", mau: "#7d945f" }, { id: "hong", name: "Hồng", mau: "#c8616b" }, { id: "tim", name: "Tím", mau: "#745c96" }, { id: "do", name: "Đỏ", mau: "#b35249" }, { id: "trangxam", name: "Trắng Xám", mau: "#c5b6a0" }];

// Ô mặc, xếp theo THỨ TỰ VẼ (trước ra sau)
export const O_DO = [
  { id: "quan", name: "Quần" },
  { id: "giay", name: "Giày" },
  { id: "ao", name: "Áo" },
  { id: "khuyen", name: "Khuyên Tai" },
  { id: "matna", name: "Mặt Nạ" },
  { id: "kinh", name: "Kính" },
  { id: "mu", name: "Mũ" },
];

// somau = món này có mấy bản màu (1 nghĩa là chỉ một bản, hậu tố "goc").
// gia = 0 nghĩa là đồ của bộ mẫu, cho sẵn lúc tạo nhân vật, không bán.
export const DO = [
  { id: "ao_thun", name: "Áo Thun", o: "ao", gia: 0, bo: 0, somau: 10 },
  { id: "ao_soc", name: "Áo Sọc", o: "ao", gia: 120, bo: 0, somau: 10 },
  { id: "ao_the_thao", name: "Áo Thể Thao", o: "ao", gia: 0, bo: 2, somau: 10 },
  { id: "ao_hai_day", name: "Áo Hai Dây", o: "ao", gia: 140, bo: 0, somau: 10 },
  { id: "ao_hoa", name: "Áo Hoa", o: "ao", gia: 180, bo: 0, somau: 10 },
  { id: "ao_thuy_thu", name: "Áo Thuỷ Thủ", o: "ao", gia: 220, bo: 0, somau: 10 },
  { id: "ao_thuy_thu_no", name: "Áo Thuỷ Thủ Nơ", o: "ao", gia: 240, bo: 0, somau: 10 },
  { id: "ao_dau_lau", name: "Áo Đầu Lâu", o: "ao", gia: 260, bo: 0, somau: 10 },
  { id: "ao_yem", name: "Áo Yếm", o: "ao", gia: 200, bo: 0, somau: 10 },
  { id: "ao_vest", name: "Áo Vest", o: "ao", gia: 0, bo: 3, somau: 10 },
  { id: "vay_lien", name: "Váy Liền", o: "ao", gia: 280, bo: 0, somau: 10 },
  { id: "do_he", name: "Đồ Hề", o: "ao", gia: 420, bo: 0, somau: 2 },
  { id: "do_bi_ngo", name: "Đồ Bí Ngô", o: "ao", gia: 460, bo: 0, somau: 2 },
  { id: "do_ma", name: "Đồ Ma", o: "ao", gia: 500, bo: 0, somau: 1 },
  { id: "do_phu_thuy", name: "Đồ Phù Thuỷ", o: "ao", gia: 520, bo: 0, somau: 1 },
  { id: "quan_dai", name: "Quần Dài", o: "quan", gia: 0, bo: 0, somau: 10 },
  { id: "quan_au", name: "Quần Âu", o: "quan", gia: 0, bo: 3, somau: 10 },
  { id: "chan_vay", name: "Chân Váy", o: "quan", gia: 150, bo: 0, somau: 10 },
  { id: "giay", name: "Giày", o: "giay", gia: 0, bo: 0, somau: 10 },
  { id: "kinh_can", name: "Kính Cận", o: "kinh", gia: 90, bo: 0, somau: 10 },
  { id: "kinh_ram", name: "Kính Râm", o: "kinh", gia: 110, bo: 0, somau: 10 },
  { id: "mu_cao_boi", name: "Mũ Cao Bồi", o: "mu", gia: 260, bo: 0, somau: 1 },
  { id: "mu_may_man", name: "Mũ May Mắn", o: "mu", gia: 300, bo: 0, somau: 1 },
  { id: "mu_phu_thuy", name: "Mũ Phù Thuỷ", o: "mu", gia: 340, bo: 0, somau: 1 },
  { id: "mu_bi_ngo", name: "Mũ Bí Ngô", o: "mu", gia: 320, bo: 0, somau: 1 },
  { id: "mu_bi_ngo_tim", name: "Mũ Bí Ngô Tím", o: "mu", gia: 320, bo: 0, somau: 1 },
  { id: "khuyen_do", name: "Khuyên Đỏ", o: "khuyen", gia: 80, bo: 0, somau: 1 },
  { id: "khuyen_do_bac", name: "Khuyên Đỏ Bạc", o: "khuyen", gia: 100, bo: 0, somau: 1 },
  { id: "khuyen_luc", name: "Khuyên Lục Bảo", o: "khuyen", gia: 80, bo: 0, somau: 1 },
  { id: "khuyen_luc_bac", name: "Khuyên Lục Bạc", o: "khuyen", gia: 100, bo: 0, somau: 1 },
  { id: "mat_na_he_do", name: "Mặt Nạ Hề Đỏ", o: "matna", gia: 200, bo: 0, somau: 1 },
  { id: "mat_na_he_xanh", name: "Mặt Nạ Hề Xanh", o: "matna", gia: 200, bo: 0, somau: 1 },
  { id: "mat_na_ma", name: "Mặt Nạ Ma", o: "matna", gia: 240, bo: 0, somau: 1 },
];

export const DO_BY_ID = Object.fromEntries(DO.map(d => [d.id, d]));

// Ba bộ đồ mẫu cho chọn lúc tạo nhân vật. Giày tặng kèm cả ba bộ.
// `mau` = màu của từng ô trong bộ đó.
export const BO_MAU = [
  { so: 1, name: "Bộ Đi Học", desc: "Áo thun quần dài, gọn gàng lúc mới lên đường", mau: { ao: "xanhduong", quan: "nau", giay: "nau" } },
  { so: 2, name: "Bộ Năng Động", desc: "Áo thể thao, nhẹ và thoáng, tiện chạy nhảy", mau: { ao: "xanhla", quan: "trangxam", giay: "trangxam" } },
  { so: 3, name: "Bộ Lịch Sự", desc: "Vest quần âu, chỉn chu ra dáng người có nghề", mau: { ao: "den", quan: "den", giay: "den" } },
];

// Món của bộ mẫu số `so`, kèm mấy món tặng chung (bo === 0). Trả về
// KHOÁ đầy đủ `<id>_<màu>` chứ không phải mã món trần.
export const monBoMau = (so) => {
  const bo = BO_MAU.find(b => b.so === so) || BO_MAU[0];
  return DO.filter(d => d.gia === 0 && (d.bo === so || d.bo === 0))
    .map(d => `${d.id}_${d.somau > 1 ? (bo.mau[d.o] || "den") : "goc"}`);
};

