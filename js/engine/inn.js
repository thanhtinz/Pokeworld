// TuxeWorld H5 | engine/inn.js | Nhà trọ chung: chỗ ngủ khi chưa có nhà riêng
//
// Mở game lên là nhân vật đang nằm ngủ chứ không đứng giữa đường:
//   · chưa có nhà  -> tỉnh dậy ở NHÀ TRỌ CHUNG. Chơi một mình thì cả phòng chỉ
//     có mình; nối máy chủ thì mỗi người online chưa có nhà nằm một giường.
//   · đã có nhà    -> tỉnh dậy ngay trong nhà mình.
//
// Phòng trọ là bản đồ trống do tools/phongtrong.py dựng; giường thì vẽ bằng
// chính sprite nội thất (FURNITURE) nên không phải cắt thêm ảnh nào.
import { MAP_NHA_TRO } from '../data/phongtrong.js';
import { MAPS } from '../data/maps.js';

export { MAP_NHA_TRO };

const GIUONG = 'giuong_don';     // món dùng làm giường trọ
const HANG = [3, 9];             // hai dãy giường, y của đầu giường
const X_DAU = 2;                 // giường đầu tiên ở cột này
const CACH = 3;                  // hai giường cách nhau mấy cột

// Danh sách chỗ đặt giường trong phòng trọ, tính theo bề rộng bản đồ thật
export function cacGiuong() {
  const m = MAPS[MAP_NHA_TRO];
  if (!m) return [];
  const ra = [];
  for (const y of HANG) {
    for (let x = X_DAU; x + 1 < m.w - 1; x += CACH) {
      if (y + 2 >= m.h) continue;
      ra.push({ x, y });
    }
  }
  return ra;
}

export const laNhaTro = (mapId) => mapId === MAP_NHA_TRO;

// Giường của mình luôn là cái đầu tiên — đứng dậy là thấy cửa ngay
export const giuongCuaToi = () => cacGiuong()[0] || null;

// Chỗ đứng khi vừa rời giường: ngay dưới chân giường
export function choDay() {
  const g = giuongCuaToi();
  const m = MAPS[MAP_NHA_TRO];
  if (!g || !m) return { x: 2, y: 3 };
  return { x: g.x, y: Math.min(m.h - 2, g.y + 2) };
}

export const ID_GIUONG = GIUONG;

// Người khác đang ngủ nhờ ở đây — màn bản đồ lấy về từ máy chủ rồi đặt vào đây
let khach = [];
export function datKhachTro(ds) {
  khach = Array.isArray(ds) ? ds.slice(0, cacGiuong().length - 1) : [];
}
export const khachTro = () => khach;

// Cắm cổng đi ra cho phòng trọ: bước xuống mép dưới là ra thị trấn đầu game
export function camCongNhaTro(veMap) {
  const m = MAPS[MAP_NHA_TRO];
  if (!m) return null;
  m.warps = (m.warps || []).filter(w => !w.raTro);
  m.warps.push({ x: Math.floor(m.w / 2), y: m.h - 1, raTro: true, to: veMap });
  return choDay();
}
