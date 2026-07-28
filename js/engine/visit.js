// TuxeWorld H5 | engine/visit.js | Sang thăm nhà người khác
//
// Thăm nhà là VÀO HẲN bản đồ nhà người ta, đi lại trong đó, chứ không phải
// nhìn một tấm ảnh chụp. Bố cục nhà (mẫu nhà + đồ đã kê) lấy từ máy chủ rồi
// giữ tạm ở đây; màn bản đồ đọc chỗ này thay vì đọc nhà của chính mình.
//
// Khách thì KHÔNG sửa được gì: không bật trang trí, không dùng giường/bếp của
// chủ nhà. Ra khỏi nhà là xoá sạch, không dính vào bản lưu của mình.
import { MAPS } from '../data/maps.js';
import { PHONG_NHA } from '../data/phongtrong.js';

let khach = null;   // { username, base, dat, veMap, veX, veY }

export const dangTham = () => !!khach;
export const chuNha = () => khach?.username || '';
export const doCuaChu = () => khach?.dat || [];
export const mapDangTham = () => (khach ? PHONG_NHA[khach.base] : null);

/**
 * Vào nhà một người. Trả về [{map, x, y}, lỗi] để màn bản đồ tự enterMap.
 * @param {{username:string, base:string, dat:Array}} d dữ liệu lấy từ máy chủ
 * @param {{map:string, x:number, y:number}} ve chỗ quay lại khi đi ra
 */
export function vaoNhaNguoiKhac(d, ve) {
  const mapId = PHONG_NHA[d?.base];
  const m = mapId && MAPS[mapId];
  if (!m) return [null, 'Nhà này chưa dựng xong.'];
  khach = {
    username: d.username,
    base: d.base,
    dat: Array.isArray(d.dat) ? d.dat : [],
    veMap: ve?.map || null, veX: ve?.x ?? null, veY: ve?.y ?? null,
  };
  // Cổng đi ra: bước xuống mép dưới là về đúng chỗ vừa đứng
  m.warps = (m.warps || []).filter(w => !w.veNha && !w.raTham);
  if (ve?.map) {
    m.warps.push({ x: Math.floor(m.w / 2), y: m.h - 1, raTham: true,
      to: ve.map, tx: Math.floor(ve.x), ty: Math.floor(ve.y) });
  }
  return [{ map: mapId, x: Math.floor(m.w / 2), y: m.h - 2 }, null];
}

// Rời nhà người ta: gỡ cổng tạm và xoá dữ liệu mượn
export function roiNhaNguoiKhac() {
  if (!khach) return false;
  const mapId = PHONG_NHA[khach.base];
  const m = mapId && MAPS[mapId];
  if (m) m.warps = (m.warps || []).filter(w => !w.raTham);
  khach = null;
  return true;
}
