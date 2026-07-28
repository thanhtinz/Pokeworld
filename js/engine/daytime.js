// TuxeWorld H5 | engine/daytime.js | Giờ trong ngày
//
// Bản gốc giữ biến `daytime` trong game_variables và đổi theo đồng hồ trong
// game (tuxemon/celestial_handler.py). Bản web không có đồng hồ riêng nên lấy
// thẳng giờ máy người chơi: 6h–18h là ban ngày.
//
// Dùng cho: Tuxeball Ban Ngày / Ban Đêm, và bảng gặp có điều kiện giờ giấc.
const DAY_START = 6;
const DAY_END = 18;

export function isDaytime(now = new Date()) {
  const h = now.getHours();
  return h >= DAY_START && h < DAY_END;
}

// Giá trị đúng dạng biến của bản gốc: chuỗi 'true' / 'false'
export function gameVars() {
  return { daytime: isDaytime() ? 'true' : 'false' };
}

export function phaseName() {
  return isDaytime() ? 'Ban ngày' : 'Ban đêm';
}
