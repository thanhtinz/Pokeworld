// TuxeWorld H5 | data/noithat.js | SINH TỰ ĐỘNG bởi tools/mknoithat.py
// KHONG SUA TAY. Ảnh cắt từ gfx/tilesets của Tuxemon (CC BY-SA 4.0).
//
// Chỉ còn hai thứ dựng sẵn: ba toà nhà của bang trên bản đồ Bang Đường,
// và cái giường kê trong nhà trọ chung.

// Toà nhà của bang hội, dựng trên bản đồ Bang Đường
export const TOA_BANG = {
  bang_sanh: { name: "Sảnh Bang", img: "assets/noithat/bang_00.png", w: 78, h: 60 },
  bang_dien: { name: "Điện Thủ Hộ", img: "assets/noithat/bang_01.png", w: 78, h: 61 },
  bang_kho: { name: "Kho Bang", img: "assets/noithat/bang_02.png", w: 78, h: 60 },
};

// Giường trong nhà trọ chung — w/h là số Ô nó chiếm
export const GIUONG_TRO = { id: "giuong_don", name: "Giường Đơn", img: "assets/noithat/do_11.png", w: 1, h: 2 };
