// TuxeWorld H5 | engine/bangduong.js | Bang Đường: hai khu khoá theo cấp bang
//
// Bản đồ do tools/bangduong.py sinh; toạ độ cửa, bục gọi boss và rương thưởng
// nằm trong js/data/bangduong.js nên không bao giờ lệch với nền đã kẻ.
//
// Cấp bang là thông tin của MÁY CHỦ. Bên này chỉ giữ lại con số vừa lấy về để
// biết có cho đi qua cửa hay không; máy chủ vẫn kiểm lại khi gọi boss hay nhận
// thưởng, nên sửa số ở đây cũng chẳng ăn được gì.
import { BANG_MAP, CUA_KHU, BUC_BOSS, RUONG_THUONG, CONG_RA } from '../data/bangduong.js';

export { BANG_MAP, CUA_KHU, BUC_BOSS, RUONG_THUONG, CONG_RA };

let capBang = 0;       // 0 = chưa vào bang nào / chưa biết
export const datCapBang = (n) => { capBang = Math.max(0, Math.floor(Number(n) || 0)); };
export const layCapBang = () => capBang;

export const cuaTaiO = (x, y) => CUA_KHU.find(c => c.x === x && c.y === y) || null;

// Ô này có đang chặn đường vì chưa đủ cấp bang không
export function khoaODay(mapId, x, y) {
  if (mapId !== BANG_MAP) return false;
  const c = cuaTaiO(x, y);
  return !!c && capBang < c.cap;
}

// Thứ đứng trước mặt trong Bang Đường — đi chung một đường với NPC/nhà đất
export function vatBangDuong(mapId, x, y) {
  if (mapId !== BANG_MAP) return null;
  if (x === BUC_BOSS.x && y === BUC_BOSS.y) {
    return { type: 'bang', kind: 'buc-boss', name: 'Bục Gọi Thủ Hộ' };
  }
  if (x === RUONG_THUONG.x && y === RUONG_THUONG.y) {
    return { type: 'bang', kind: 'ruong-thuong', name: 'Rương Thưởng Bang' };
  }
  const c = cuaTaiO(x, y);
  if (c) return { type: 'bang', kind: 'cua-khu', name: c.name, cua: c };
  return null;
}
