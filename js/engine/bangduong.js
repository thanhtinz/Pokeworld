// TuxeWorld H5 | engine/bangduong.js | Bang Đường: hai khu khoá theo cấp bang
//
// Bản đồ do tools/bangduong.py sinh; toạ độ cửa, bục gọi boss và rương thưởng
// nằm trong js/data/bangduong.js nên không bao giờ lệch với nền đã kẻ.
//
// Cấp bang là thông tin của MÁY CHỦ. Bên này chỉ giữ lại con số vừa lấy về để
// biết có cho đi qua cửa hay không; máy chủ vẫn kiểm lại khi gọi boss hay nhận
// thưởng, nên sửa số ở đây cũng chẳng ăn được gì.
import { BANG_MAP, CUA_KHU, TOA_NHA, CONG_RA } from '../data/bangduong.js';

export { BANG_MAP, CUA_KHU, TOA_NHA, CONG_RA };

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

// Thứ đứng trước mặt trong Bang Đường — đi chung một đường với NPC/nhà đất.
// Việc của bang (nhiệm vụ, gọi Thủ Hộ) nay do NPC ĐỨNG TRONG TỪNG TOÀ NHÀ lo,
// không còn bục đá với rương gỗ đứng chơ vơ giữa sân nữa.
export function vatBangDuong(mapId, x, y) {
  if (mapId !== BANG_MAP) return null;
  const c = cuaTaiO(x, y);
  if (c) return { type: 'bang', kind: 'cua-khu', name: c.name, cua: c };
  return null;
}

// Các toà nhà đang đứng trên bản đồ (màn bản đồ vẽ ảnh theo cái này)
export const toaNhaTren = (mapId) => (mapId === BANG_MAP ? TOA_NHA : []);
