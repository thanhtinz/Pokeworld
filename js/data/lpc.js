// TuxeWorld H5 | data/lpc.js | Danh mục ngoại hình + quần áo nhân vật
// SINH TU DONG boi tools/mklpc.py — KHONG SUA TAY.
//
// Ảnh cắt từ bộ sprite nhân vật của Liberated Pixel Cup
// (github.com/OpenGameArt/LiberatedPixelCup, CC BY-SA 3.0 / GPL 3.0).
// Mỗi tệp là một LỚP rời: thân, tai, mắt, mũi, biểu cảm, tóc, râu, đồ mặc.
// engine/avatar.js chồng các lớp lại thành một sprite hoàn chỉnh.

export const THU_MUC = "assets/lpc";

// Dáng người. `do` = lấy quần áo bản của dáng nào (LPC chỉ vẽ đồ cho nam/nữ).
export const THAN = [
  { id: "nam", name: "Nam", do: "nam" },
  { id: "nu", name: "Nữ", do: "nu" },
  { id: "luc", name: "Lực Lưỡng", do: "nam" },
  { id: "gay", name: "Mảnh Khảnh", do: "nam" },
];

export const DA = [{ id: "ivory", name: "Ngà" }, { id: "gold", name: "Vàng Ấm" }, { id: "copper", name: "Đồng" }, { id: "sienna", name: "Nâu Đỏ" }, { id: "coffee", name: "Nâu Đậm" }, { id: "dove", name: "Xám Nhạt" }];
export const TAI = [{ id: "big", name: "Tai To" }, { id: "nhon", name: "Tai Nhọn" }, { id: "dainhon", name: "Tai Nhọn Dài" }];
export const MUI = [{ id: "hech", name: "Mũi Hếch" }, { id: "to", name: "Mũi To" }, { id: "thang", name: "Mũi Thẳng" }];
export const BIEU_CAM = [{ id: "gian", name: "Cau Có" }, { id: "khoc", name: "Mếu Máo" }, { id: "vui", name: "Tươi Cười" }, { id: "buon", name: "Buồn Rầu" }];
export const MAT = [{ id: "xanhduong", name: "Xanh Dương" }, { id: "nau", name: "Nâu" }, { id: "xam", name: "Xám" }, { id: "xanhla", name: "Xanh Lá" }, { id: "cam", name: "Cam" }, { id: "tim", name: "Tím" }, { id: "do", name: "Đỏ" }, { id: "vang", name: "Vàng" }];
export const TOC_KIEU = [{ id: "thang", name: "Tóc Thẳng" }, { id: "dai", name: "Tóc Dài" }, { id: "mai", name: "Tóc Mái" }, { id: "duoi", name: "Tóc Đuôi Ngựa" }, { id: "xoan", name: "Tóc Xoăn" }, { id: "afro", name: "Tóc Xù" }, { id: "roi", name: "Tóc Rối" }, { id: "tem", name: "Tóc Tém" }, { id: "tet", name: "Tóc Tết" }, { id: "haichum", name: "Hai Chùm" }, { id: "mohican", name: "Mohican" }, { id: "congchua", name: "Tóc Công Chúa" }];
export const TOC_MAU = [{ id: "den", name: "Đen" }, { id: "nau", name: "Nâu" }, { id: "hatde", name: "Hạt Dẻ" }, { id: "vang", name: "Vàng" }, { id: "do", name: "Đỏ" }, { id: "bac", name: "Bạc" }];
export const RAU_KIEU = [{ id: "quaiham", name: "Râu Quai Nón" }, { id: "mep", name: "Ria Mép" }, { id: "lomchom", name: "Râu Lởm Chởm" }, { id: "vuot", name: "Ria Vuốt" }, { id: "phap", name: "Ria Kiểu Pháp" }];
export const RAU_MAU = [{ id: "den", name: "Đen" }, { id: "nau", name: "Nâu" }, { id: "vang", name: "Vàng" }, { id: "bac", name: "Bạc" }];

// Ô quần áo, xếp theo THỨ TỰ VẼ (trước ra sau)
export const O_DO = [
  { id: "quan", name: "Quần" },
  { id: "giay", name: "Giày" },
  { id: "ao", name: "Áo" },
  { id: "that_lung", name: "Thắt Lưng" },
  { id: "tay", name: "Bao Tay" },
  { id: "vai", name: "Giáp Vai" },
  { id: "co", name: "Cổ" },
  { id: "gang", name: "Găng" },
  { id: "mu", name: "Mũ" },
];

// than = đồ này vẽ cho dáng nào (LPC vẽ riêng cho nam và nữ).
// gia = 0 nghĩa là đồ của bộ mẫu, cho sẵn lúc tạo nhân vật, không bán.
export const DO = [
  { id: "n_ao_xanh", name: "Áo Tay Dài Xanh", o: "ao", than: "nam", gia: 0, bo: 1 },
  { id: "n_ao_batay", name: "Áo Ba Lỗ", o: "ao", than: "nam", gia: 0, bo: 2 },
  { id: "n_ao_somi", name: "Áo Sơ Mi", o: "ao", than: "nam", gia: 0, bo: 3 },
  { id: "n_ao_den", name: "Áo Tay Dài Đen", o: "ao", than: "nam", gia: 900, bo: 0 },
  { id: "n_ao_luc", name: "Áo Tay Dài Lục", o: "ao", than: "nam", gia: 900, bo: 0 },
  { id: "n_ao_tim", name: "Áo Tay Dài Tím", o: "ao", than: "nam", gia: 900, bo: 0 },
  { id: "n_ao_xam", name: "Áo Tay Dài Xám", o: "ao", than: "nam", gia: 900, bo: 0 },
  { id: "n_ao_la", name: "Áo Tay Dài Xanh Lá", o: "ao", than: "nam", gia: 900, bo: 0 },
  { id: "n_ao_somi_soc", name: "Áo Sơ Mi Sọc", o: "ao", than: "nam", gia: 1600, bo: 0 },
  { id: "n_ao_xich", name: "Áo Giáp Xích", o: "ao", than: "nam", gia: 5200, bo: 0 },
  { id: "n_quan_tay", name: "Quần Tây", o: "quan", than: "nam", gia: 0, bo: 1 },
  { id: "n_quan_om", name: "Quần Ôm Đen", o: "quan", than: "nam", gia: 0, bo: 2 },
  { id: "n_quan_thung", name: "Quần Thụng", o: "quan", than: "nam", gia: 0, bo: 3 },
  { id: "n_quan_om_xanh", name: "Quần Ôm Xanh", o: "quan", than: "nam", gia: 800, bo: 0 },
  { id: "n_quan_soc", name: "Quần Tây Sọc", o: "quan", than: "nam", gia: 1400, bo: 0 },
  { id: "n_ao_choang", name: "Áo Choàng Dài", o: "quan", than: "nam", gia: 1800, bo: 0 },
  { id: "n_giap_ong_bac", name: "Giáp Ống Bạc", o: "quan", than: "nam", gia: 4200, bo: 0 },
  { id: "n_giap_ong_vang", name: "Giáp Ống Vàng", o: "quan", than: "nam", gia: 6800, bo: 0 },
  { id: "n_giay_da", name: "Giày Da", o: "giay", than: "nam", gia: 0, bo: 0 },
  { id: "n_ung_bac", name: "Ủng Giáp Bạc", o: "giay", than: "nam", gia: 3600, bo: 0 },
  { id: "n_ung_vang", name: "Ủng Giáp Vàng", o: "giay", than: "nam", gia: 5900, bo: 0 },
  { id: "n_mu_dua", name: "Mũ Quả Dưa", o: "mu", than: "nam", gia: 1500, bo: 0 },
  { id: "n_mu_cao", name: "Mũ Chóp Cao", o: "mu", than: "nam", gia: 2600, bo: 0 },
  { id: "n_mu_longvu", name: "Mũ Lông Vũ", o: "mu", than: "nam", gia: 2200, bo: 0 },
  { id: "n_mu_trumda", name: "Mũ Trùm Da", o: "mu", than: "nam", gia: 1900, bo: 0 },
  { id: "n_mu_trumxich", name: "Mũ Trùm Xích", o: "mu", than: "nam", gia: 3400, bo: 0 },
  { id: "n_mu_trumsat", name: "Mũ Trùm Sắt", o: "mu", than: "nam", gia: 3000, bo: 0 },
  { id: "n_mu_tru", name: "Mũ Trụ", o: "mu", than: "nam", gia: 4100, bo: 0 },
  { id: "n_mu_trukin", name: "Mũ Trụ Kín", o: "mu", than: "nam", gia: 6200, bo: 0 },
  { id: "n_mu_trugai", name: "Mũ Trụ Gai", o: "mu", than: "nam", gia: 7400, bo: 0 },
  { id: "n_no_co", name: "Nơ Cổ", o: "co", than: "nam", gia: 700, bo: 0 },
  { id: "n_ca_vat", name: "Cà Vạt", o: "co", than: "nam", gia: 800, bo: 0 },
  { id: "n_khan", name: "Khăn Quàng Đỏ", o: "co", than: "nam", gia: 1200, bo: 0 },
  { id: "n_tl_vai", name: "Thắt Lưng Vải", o: "that_lung", than: "nam", gia: 600, bo: 0 },
  { id: "n_tl_da", name: "Thắt Lưng Da", o: "that_lung", than: "nam", gia: 1100, bo: 0 },
  { id: "n_tl_le", name: "Thắt Lưng Lễ Phục", o: "that_lung", than: "nam", gia: 1700, bo: 0 },
  { id: "n_giap_vai", name: "Giáp Vai", o: "vai", than: "nam", gia: 3800, bo: 0 },
  { id: "n_giap_vai_le", name: "Giáp Vai Lệch", o: "vai", than: "nam", gia: 2400, bo: 0 },
  { id: "n_bao_tay", name: "Bao Tay Da", o: "tay", than: "nam", gia: 1300, bo: 0 },
  { id: "n_bao_tay_bac", name: "Bao Tay Bạc", o: "tay", than: "nam", gia: 3100, bo: 0 },
  { id: "n_bao_tay_vang", name: "Bao Tay Vàng", o: "tay", than: "nam", gia: 5000, bo: 0 },
  { id: "n_gang_bac", name: "Găng Giáp Bạc", o: "gang", than: "nam", gia: 2900, bo: 0 },
  { id: "n_gang_vang", name: "Găng Giáp Vàng", o: "gang", than: "nam", gia: 4700, bo: 0 },
  { id: "u_ao_xanh", name: "Áo Kiểu Tay Dài Xanh", o: "ao", than: "nu", gia: 0, bo: 1 },
  { id: "u_ao_batay", name: "Áo Ba Lỗ Xanh Lá", o: "ao", than: "nu", gia: 0, bo: 2 },
  { id: "u_dam_xe", name: "Đầm Xẻ Đen", o: "ao", than: "nu", gia: 0, bo: 3 },
  { id: "u_ao_kieu_den", name: "Áo Kiểu Đen", o: "ao", than: "nu", gia: 900, bo: 0 },
  { id: "u_ao_kieu_luc", name: "Áo Kiểu Lục", o: "ao", than: "nu", gia: 900, bo: 0 },
  { id: "u_ao_co_tron", name: "Áo Cổ Tròn Tím", o: "ao", than: "nu", gia: 1100, bo: 0 },
  { id: "u_ao_cuop_bien", name: "Áo Cướp Biển", o: "ao", than: "nu", gia: 1900, bo: 0 },
  { id: "u_dam_ai", name: "Đầm Ai-len Lục", o: "ao", than: "nu", gia: 2600, bo: 0 },
  { id: "u_ao_daitay_do", name: "Áo Tay Dài Nâu", o: "ao", than: "nu", gia: 900, bo: 0 },
  { id: "u_ao_xich", name: "Áo Giáp Xích", o: "ao", than: "nu", gia: 5200, bo: 0 },
  { id: "u_quan_den", name: "Quần Đen", o: "quan", than: "nu", gia: 0, bo: 1 },
  { id: "u_quan_ngan", name: "Quần Đùi", o: "quan", than: "nu", gia: 0, bo: 2 },
  { id: "u_quan_xam", name: "Quần Xám", o: "quan", than: "nu", gia: 800, bo: 0 },
  { id: "u_vay_but", name: "Váy Bút Chì", o: "quan", than: "nu", gia: 1300, bo: 0 },
  { id: "u_vay_xe", name: "Váy Xẻ Tím", o: "quan", than: "nu", gia: 1600, bo: 0 },
  { id: "u_vay_xoe", name: "Váy Xoè Xanh", o: "quan", than: "nu", gia: 2100, bo: 0 },
  { id: "u_vay_chien", name: "Váy Chiến Binh", o: "quan", than: "nu", gia: 3300, bo: 0 },
  { id: "u_giap_ong_bac", name: "Giáp Ống Bạc", o: "quan", than: "nu", gia: 4200, bo: 0 },
  { id: "u_giay_da", name: "Giày Da", o: "giay", than: "nu", gia: 0, bo: 0 },
  { id: "u_giay_den", name: "Giày Đen", o: "giay", than: "nu", gia: 700, bo: 0 },
  { id: "u_dep", name: "Dép Quai Hậu", o: "giay", than: "nu", gia: 600, bo: 0 },
  { id: "u_dep_le", name: "Dép Lê", o: "giay", than: "nu", gia: 500, bo: 0 },
  { id: "u_giay_mem", name: "Giày Mềm", o: "giay", than: "nu", gia: 1400, bo: 0 },
  { id: "u_bot_cao", name: "Bốt Cao Cổ", o: "giay", than: "nu", gia: 2300, bo: 0 },
  { id: "u_ung_bac", name: "Ủng Giáp Bạc", o: "giay", than: "nu", gia: 3600, bo: 0 },
  { id: "u_mu_longvu", name: "Mũ Lông Vũ", o: "mu", than: "nu", gia: 2200, bo: 0 },
  { id: "u_mu_phu_thuy", name: "Mũ Phù Thuỷ", o: "mu", than: "nu", gia: 2800, bo: 0 },
  { id: "u_vuong_mien", name: "Vương Miện", o: "mu", than: "nu", gia: 4500, bo: 0 },
  { id: "u_mu_trumda", name: "Mũ Trùm Da", o: "mu", than: "nu", gia: 1900, bo: 0 },
  { id: "u_mu_trumxich", name: "Mũ Trùm Xích", o: "mu", than: "nu", gia: 3400, bo: 0 },
  { id: "u_mu_tru", name: "Mũ Trụ", o: "mu", than: "nu", gia: 4100, bo: 0 },
  { id: "u_mu_trukin", name: "Mũ Trụ Kín", o: "mu", than: "nu", gia: 6200, bo: 0 },
  { id: "u_mu_chien", name: "Mũ Chiến Binh", o: "mu", than: "nu", gia: 5400, bo: 0 },
  { id: "u_day_chuyen", name: "Dây Chuyền", o: "co", than: "nu", gia: 1500, bo: 0 },
  { id: "u_mat_day", name: "Mặt Dây Chuyền", o: "co", than: "nu", gia: 2000, bo: 0 },
  { id: "u_tl_vai", name: "Thắt Lưng Vải", o: "that_lung", than: "nu", gia: 600, bo: 0 },
  { id: "u_tl_da", name: "Thắt Lưng Da", o: "that_lung", than: "nu", gia: 1100, bo: 0 },
  { id: "u_giap_vai", name: "Giáp Vai", o: "vai", than: "nu", gia: 3800, bo: 0 },
  { id: "u_bao_tay", name: "Bao Tay Da", o: "tay", than: "nu", gia: 1300, bo: 0 },
  { id: "u_bao_tay_bac", name: "Bao Tay Bạc", o: "tay", than: "nu", gia: 3100, bo: 0 },
  { id: "u_gang_bac", name: "Găng Giáp Bạc", o: "gang", than: "nu", gia: 2900, bo: 0 },
];

export const DO_BY_ID = Object.fromEntries(DO.map(d => [d.id, d]));

// Ba bộ đồ mẫu cho chọn lúc tạo nhân vật. Giày da tặng kèm cả ba bộ.
export const BO_MAU = [
  { so: 1, name: "Bộ Đi Học", desc: "Gọn gàng, hợp lúc mới lên đường" },
  { so: 2, name: "Bộ Năng Động", desc: "Nhẹ và thoáng, tiện chạy nhảy" },
  { so: 3, name: "Bộ Lịch Sự", desc: "Chỉn chu, ra dáng người có nghề" },
];

// Món của bộ mẫu số `so` cho dáng `than` (kèm đôi giày miễn phí)
export const monBoMau = (than, so) =>
  DO.filter(d => d.than === than && d.gia === 0 && (d.bo === so || d.bo === 0))
    .map(d => d.id);

