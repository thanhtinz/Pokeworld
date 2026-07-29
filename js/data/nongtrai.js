// TuxeWorld H5 | data/nongtrai.js | Cây trồng, con vật, nhà nông trại
// SINH TU DONG boi tools/nongtrai.py — KHONG SUA TAY.
//
// Art cắt từ pack "Cozy Farm" (đã mua, không phát tán lại bản gốc).
// Nền bản đồ vẫn là tileset ngoài trời của Tuxemon: trộn hai bộ NỀN thì
// lệch phong cách, còn trộn VẬT THỂ thì không.

export const THU_MUC = "assets/nt";
export const O = 16;             // cạnh một ô art, đúng bằng TILE của game
export const GIAI_DOAN = 6;     // số giai đoạn lớn của một cây

// Cây trồng. `phut` = mỗi giai đoạn lâu bấy nhiêu phút THẬT, nên tắt
// game cây vẫn lớn. Cây lâu ăn thì bán được giá hơn hẳn.
export const CAY = [
  { id: "cu_cai", name: "Củ Cải", giaHat: 25, giaBan: 14, phut: 2 },
  { id: "ca_rot", name: "Cà Rốt", giaHat: 40, giaBan: 22, phut: 3 },
  { id: "xa_lach", name: "Xà Lách", giaHat: 50, giaBan: 28, phut: 4 },
  { id: "khoai_tay", name: "Khoai Tây", giaHat: 70, giaBan: 40, phut: 5 },
  { id: "ca_chua", name: "Cà Chua", giaHat: 100, giaBan: 58, phut: 7 },
  { id: "lua_mi", name: "Lúa Mì", giaHat: 130, giaBan: 76, phut: 9 },
  { id: "ngo", name: "Ngô", giaHat: 170, giaBan: 100, phut: 11 },
  { id: "dau_tay", name: "Dâu Tây", giaHat: 230, giaBan: 138, phut: 14 },
  { id: "ca_tim", name: "Cà Tím", giaHat: 300, giaBan: 182, phut: 18 },
  { id: "bi_do", name: "Bí Đỏ", giaHat: 400, giaBan: 245, phut: 23 },
  { id: "dua_hau", name: "Dưa Hấu", giaHat: 550, giaBan: 340, phut: 30 },
];

export const CAY_BY_ID = Object.fromEntries(CAY.map(c => [c.id, c]));

// Con vật. `phut` = bao lâu ra một lứa sản phẩm, `an` = mỗi lứa ăn
// mấy bó cỏ khô. Không cho ăn thì đứng không, chẳng ra gì cả.
//
// `chan` = số chân, và nó quyết định con đó đi lại ở đâu: 2 chân
// (gà, gà tây) thả rông khắp nông trại, 4 chân thì chỉ trong chuồng.
export const THU = [
  { id: "ga", name: "Gà Mái", o: 16, sanPham: "trung_trang", gia: 1200, phut: 8, an: 1, chan: 2 },
  { id: "ga_nau", name: "Gà Nâu", o: 16, sanPham: "trung_nau", gia: 1800, phut: 10, an: 1, chan: 2 },
  { id: "tho", name: "Thỏ", o: 17, sanPham: "len_trang", gia: 2600, phut: 14, an: 1, chan: 4 },
  { id: "cuu", name: "Cừu", o: 17, sanPham: "len_xam", gia: 4200, phut: 18, an: 1, chan: 4 },
  { id: "de", name: "Dê", o: 19, sanPham: "sua_de", gia: 6000, phut: 22, an: 1, chan: 4 },
  { id: "lon", name: "Lợn", o: 20, sanPham: "thit_xong_khoi", gia: 8500, phut: 28, an: 1, chan: 4 },
  { id: "ga_tay", name: "Gà Tây", o: 17, sanPham: "long_ga_tay", gia: 11000, phut: 34, an: 1, chan: 2 },
  { id: "bo", name: "Bò Sữa", o: 24, sanPham: "sua_bo", gia: 16000, phut: 40, an: 1, chan: 4 },
];

export const THU_BY_ID = Object.fromEntries(THU.map(t => [t.id, t]));

// Mọi thứ cất được trong kho nông trại: nông sản + sản phẩm con vật.
export const MON = [
  { id: "cu_cai", name: "Củ Cải", gia: 14, tu: "cay" },
  { id: "ca_rot", name: "Cà Rốt", gia: 22, tu: "cay" },
  { id: "xa_lach", name: "Xà Lách", gia: 28, tu: "cay" },
  { id: "khoai_tay", name: "Khoai Tây", gia: 40, tu: "cay" },
  { id: "ca_chua", name: "Cà Chua", gia: 58, tu: "cay" },
  { id: "lua_mi", name: "Lúa Mì", gia: 76, tu: "cay" },
  { id: "ngo", name: "Ngô", gia: 100, tu: "cay" },
  { id: "dau_tay", name: "Dâu Tây", gia: 138, tu: "cay" },
  { id: "ca_tim", name: "Cà Tím", gia: 182, tu: "cay" },
  { id: "bi_do", name: "Bí Đỏ", gia: 245, tu: "cay" },
  { id: "dua_hau", name: "Dưa Hấu", gia: 340, tu: "cay" },
  { id: "sua_bo", name: "Sữa Bò", gia: 420, tu: "thu" },
  { id: "sua_de", name: "Sữa Dê", gia: 300, tu: "thu" },
  { id: "thit_xong_khoi", name: "Thịt Xông Khói", gia: 260, tu: "thu" },
  { id: "long_ga_tay", name: "Lông Gà Tây", gia: 190, tu: "thu" },
  { id: "trung_trang", name: "Trứng Gà", gia: 60, tu: "thu" },
  { id: "trung_nau", name: "Trứng Nâu", gia: 95, tu: "thu" },
  { id: "len_trang", name: "Len Trắng", gia: 140, tu: "thu" },
  { id: "len_xam", name: "Len Xám", gia: 230, tu: "thu" },
  { id: "co_kho", name: "Cỏ Khô", gia: 30, tu: "thu" },
  { id: "bo_sua", name: "Bơ", gia: 1050, tu: "thu" },
  { id: "pho_mai", name: "Phô Mai", gia: 1600, tu: "thu" },
  { id: "mozzarella", name: "Mozzarella", gia: 1080, tu: "thu" },
  { id: "pho_mai_de", name: "Phô Mai Dê", gia: 1150, tu: "thu" },
  { id: "mayo", name: "Mayonnaise", gia: 260, tu: "thu" },
  { id: "soi_trang", name: "Sợi Trắng", gia: 360, tu: "thu" },
  { id: "soi_xam", name: "Sợi Xám", gia: 590, tu: "thu" },
  { id: "vai_trang", name: "Vải Trắng", gia: 950, tu: "thu" },
  { id: "vai_xam", name: "Vải Xám", gia: 1520, tu: "thu" },
];

export const MON_BY_ID = Object.fromEntries(MON.map(m => [m.id, m]));

// Cỏ khô mua ở chỗ bác Nông, dùng cho thú ăn.
export const GIA_CO_KHO = 45;
// Chưa kê chuồng nào thì nuôi được bấy nhiêu con.
export const SUC_CHUA_GOC = 6;

// Nhà trên nông trại. `dac` = bản đồ ô chắn đường, đo bằng độ phủ
// alpha của chính tấm ảnh chứ không gõ tay.
export const NHA = [
  { id: "nha_nong", name: "Nhà Nông Trại", w: 5, h: 5, dac: [[0, 0, 1, 0, 0], [0, 1, 1, 1, 0], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [0, 1, 1, 1, 0]] },
  { id: "nha_bep", name: "Nhà Bếp", w: 9, h: 7, dac: [[0, 0, 0, 1, 1, 1, 1, 1, 0], [0, 0, 0, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 0], [0, 1, 1, 1, 1, 1, 1, 1, 0], [0, 0, 0, 0, 1, 1, 1, 0, 0]] },
  { id: "chuong_ga", name: "Chuồng Gà", w: 4, h: 5, dac: [[0, 0, 0, 0], [1, 1, 1, 0], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]] },
  { id: "chuong_bo", name: "Chuồng Bò", w: 6, h: 5, dac: [[0, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 0]] },
  { id: "nha_kinh", name: "Nhà Kính", w: 7, h: 5, dac: [[1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1], [0, 0, 1, 1, 1, 0, 0]] },
  { id: "sap_cho", name: "Sạp Chợ", w: 6, h: 4, dac: [[1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1]] },
];

export const NHA_BY_ID = Object.fromEntries(NHA.map(n => [n.id, n]));

// Máy chế biến. Ảnh là một DẢI khung ngang, ô 16x32 mỗi khung —
// máy đang chạy thì chạy hết dải, máy rảnh thì đứng ở khung đầu.
export const NHIP_MAY = 220;   // ms mỗi khung
export const MAY = [
  { id: "may_bo", name: "Máy Đánh Bơ", gia: 6000, khung: 2, ow: 16, oh: 32 },
  { id: "ep_pho_mai", name: "Máy Ép Phô Mai", gia: 9000, khung: 2, ow: 16, oh: 32 },
  { id: "ep_mozzarella", name: "Máy Ép Mozzarella", gia: 12000, khung: 2, ow: 16, oh: 32 },
  { id: "ep_pho_mai_de", name: "Máy Ép Phô Mai Dê", gia: 10000, khung: 2, ow: 16, oh: 32 },
  { id: "may_mayo", name: "Máy Làm Mayo", gia: 5000, khung: 2, ow: 16, oh: 32 },
  { id: "guong_soi", name: "Guồng Sợi", gia: 8000, khung: 4, ow: 16, oh: 32 },
  { id: "may_det", name: "Máy Dệt", gia: 15000, khung: 4, ow: 16, oh: 32 },
];

export const MAY_BY_ID = Object.fromEntries(MAY.map(m => [m.id, m]));

// Công thức: bỏ `soVao` món `vao` vào máy, `phut` phút sau lấy ra
// một món `ra`. Món ra luôn đắt hơn tổng món vào.
export const CONG_THUC = [
  { may: "may_bo", vao: "sua_bo", soVao: 2, ra: "bo_sua", phut: 10 },
  { may: "ep_pho_mai", vao: "sua_bo", soVao: 3, ra: "pho_mai", phut: 16 },
  { may: "ep_mozzarella", vao: "sua_bo", soVao: 2, ra: "mozzarella", phut: 14 },
  { may: "ep_pho_mai_de", vao: "sua_de", soVao: 3, ra: "pho_mai_de", phut: 15 },
  { may: "may_mayo", vao: "trung_trang", soVao: 3, ra: "mayo", phut: 8 },
  { may: "guong_soi", vao: "len_trang", soVao: 2, ra: "soi_trang", phut: 9 },
  { may: "guong_soi", vao: "len_xam", soVao: 2, ra: "soi_xam", phut: 11 },
  { may: "may_det", vao: "soi_trang", soVao: 2, ra: "vai_trang", phut: 18 },
  { may: "may_det", vao: "soi_xam", soVao: 2, ra: "vai_xam", phut: 22 },
];

/** Mấy công thức mà cái máy này làm được. */
export const congThucCua = (mayId) => CONG_THUC.filter(c => c.may === mayId);

// Thứ kê được lên nông trại. Ruộng là ô 1x1 vẽ bằng ảnh đất, còn lại
// mượn nguyên kích thước của công trình trong NHA.
export const VAT_THE = [
  { id: "ruong", name: "Ô Ruộng", loai: "ruong", gia: 300, chua: 0, w: 1, h: 1 },
  { id: "chuong_ga", name: "Chuồng Gà", loai: "chuong", gia: 5000, chua: 4, w: 4, h: 5 },
  { id: "chuong_bo", name: "Chuồng Bò", loai: "chuong", gia: 14000, chua: 3, w: 6, h: 5 },
  { id: "nha_kinh", name: "Nhà Kính", loai: "trang_tri", gia: 22000, chua: 0, w: 7, h: 5 },
  { id: "nha_nong", name: "Nhà Nông Trại", loai: "trang_tri", gia: 9000, chua: 0, w: 5, h: 5 },
  { id: "sap_cho", name: "Sạp Chợ", loai: "trang_tri", gia: 12000, chua: 0, w: 6, h: 4 },
  { id: "may_bo", name: "Máy Đánh Bơ", loai: "may", gia: 6000, chua: 0, w: 1, h: 1 },
  { id: "ep_pho_mai", name: "Máy Ép Phô Mai", loai: "may", gia: 9000, chua: 0, w: 1, h: 1 },
  { id: "ep_mozzarella", name: "Máy Ép Mozzarella", loai: "may", gia: 12000, chua: 0, w: 1, h: 1 },
  { id: "ep_pho_mai_de", name: "Máy Ép Phô Mai Dê", loai: "may", gia: 10000, chua: 0, w: 1, h: 1 },
  { id: "may_mayo", name: "Máy Làm Mayo", loai: "may", gia: 5000, chua: 0, w: 1, h: 1 },
  { id: "guong_soi", name: "Guồng Sợi", loai: "may", gia: 8000, chua: 0, w: 1, h: 1 },
  { id: "may_det", name: "Máy Dệt", loai: "may", gia: 15000, chua: 0, w: 1, h: 1 },
];

export const VAT_BY_ID = Object.fromEntries(VAT_THE.map(v => [v.id, v]));

/** Ảnh một giai đoạn của cây; `uot` = ô đã tưới. */
export const anhCay = (id, gd, uot) =>
  `${THU_MUC}/cay/${id}/${uot ? "w" : ""}${gd}.png`;
export const anhHat = (id) => `${THU_MUC}/hat/${id}.png`;
export const anhMon = (id) => `${THU_MUC}/mon/${id}.png`;
export const anhThu = (id) => `${THU_MUC}/thu/${id}.png`;
export const anhNha = (id) => `${THU_MUC}/nha/${id}.png`;
export const anhMay = (id) => `${THU_MUC}/may/${id}.png`;
export const anhDat = (uot) => `${THU_MUC}/dat/${uot ? "uot" : "tho"}.png`;

