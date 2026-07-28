// TuxeWorld H5 | data/estate.js | Nhà đất — SINH TỰ ĐỘNG bởi tools/mkestate.py
// KHONG SUA TAY. Ảnh cắt từ gfx/tilesets của Tuxemon (CC BY-SA 4.0).

// Mẫu nhà dựng trên khu đất — giá khác nhau, nhà càng to càng nhiều ô kê đồ
export const HOUSE_BASES = [
  { id: "nha_go", name: "Nhà Gỗ", price: 30000, desc: "Một gian gỗ mộc, đủ kê cái giường với cái bàn.", img: "assets/estate/nha_00.png", w: 78, h: 60, o: 4 },
  { id: "nha_khung", name: "Nhà Khung Gỗ", price: 90000, desc: "Rộng hơn hẳn, có cả cửa sổ nhìn ra vườn.", img: "assets/estate/nha_01.png", w: 79, h: 80, o: 6 },
  { id: "nha_ngoi", name: "Nhà Mái Ngói", price: 200000, desc: "Mái ngói đỏ, nhìn từ ngoài đã thấy tươm tất.", img: "assets/estate/nha_02.png", w: 79, h: 61, o: 8 },
  { id: "nha_da", name: "Nhà Đá Hai Tầng", price: 500000, desc: "To nhất khu — hàng xóm nhìn sang là biết chủ nhà khá.", img: "assets/estate/nha_03.png", w: 78, h: 80, o: 10 },
];

// Đồ trang trí: w/h là số Ô nó chiếm trong nhà
export const FURNITURE = [
  { id: "thung", name: "Thùng Gỗ", price: 600, img: "assets/estate/do_00.png", w: 1, h: 1 },
  { id: "binh", name: "Bình Sứ", price: 900, img: "assets/estate/do_01.png", w: 1, h: 1 },
  { id: "gio", name: "Giỏ Mây", price: 500, img: "assets/estate/do_02.png", w: 1, h: 1 },
  { id: "vach_go", name: "Vách Gỗ", price: 700, img: "assets/estate/do_03.png", w: 1, h: 1 },
  { id: "tuong", name: "Tượng Đá", price: 3500, img: "assets/estate/do_04.png", w: 1, h: 2 },
  { id: "chau_tim", name: "Chậu Hoa Tím", price: 1200, img: "assets/estate/do_05.png", w: 1, h: 1 },
  { id: "chau_vang", name: "Chậu Hoa Vàng", price: 1200, img: "assets/estate/do_06.png", w: 1, h: 1 },
  { id: "chum", name: "Chum Sành", price: 800, img: "assets/estate/do_07.png", w: 1, h: 1 },
  { id: "den", name: "Đèn Đứng", price: 2200, img: "assets/estate/do_08.png", w: 1, h: 4 },
  { id: "ban", name: "Bàn Gỗ", price: 1600, img: "assets/estate/do_09.png", w: 2, h: 2 },
  { id: "giuong_doi", name: "Giường Đôi", price: 4500, img: "assets/estate/do_10.png", w: 2, h: 2 },
  { id: "giuong_don", name: "Giường Đơn", price: 3000, img: "assets/estate/do_11.png", w: 1, h: 2 },
  { id: "ghe_don", name: "Ghế Đôn", price: 500, img: "assets/estate/do_12.png", w: 1, h: 1 },
  { id: "leu", name: "Lều Vải", price: 6000, img: "assets/estate/do_13.png", w: 3, h: 3 },
];

export const BASE_BY_ID = Object.fromEntries(HOUSE_BASES.map(b => [b.id, b]));
export const FURN_BY_ID = Object.fromEntries(FURNITURE.map(f => [f.id, f]));
