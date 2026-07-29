// TuxeWorld H5 | data/phongtrong.js | TỰ SINH TỪ tools/phongtrong.py, đừng sửa tay
// Phòng trống dựng riêng cho nhà người chơi và nhà trọ chung — không
// mượn bản đồ nội thất của bản gốc nữa vì mấy bản đồ đó vẽ sẵn đồ đạc,
// kê thêm đồ của mình vào là đè lên nhau.

export const PHONG_NHA = {
  nha_go: "nha_go_trong",
  nha_khung: "nha_khung_trong",
  nha_ngoi: "nha_ngoi_trong",
  nha_da: "nha_da_trong",
};

export const MAP_NHA_TRO = "nha_tro";

// Ô cửa sau của một căn phòng: đục giữa bức tường trên cùng. Bước ra
// cửa này là ra sân sau — tức là nông trại. Nhà trọ chung không có.
export const oCuaSau = (m) => ({ x: Math.floor(m.w / 2), y: 0 });
