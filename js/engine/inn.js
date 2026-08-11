// TuxeWorld H5 | engine/inn.js | Nhà trọ chung: chỗ ngủ của mọi người chơi
//
// Mở game lên là nhân vật đang nằm ngủ ở nhà trọ chứ không đứng giữa đường.
// Chơi một mình thì cả phòng chỉ có mình; nối máy chủ thì mỗi người online nằm
// một giường.
//
// Phòng trọ là bản đồ trống do tools/phongtrong.py dựng; giường thì vẽ bằng
// sprite nội thất cắt sẵn (js/data/noithat.js) nên không phải cắt thêm ảnh.
import { MAP_NHA_TRO } from '../data/phongtrong.js';
import { MAPS } from '../data/maps.js';

export { MAP_NHA_TRO };

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

// Người khác đang ngủ nhờ ở đây — màn bản đồ lấy về từ máy chủ rồi đặt vào đây
let khach = [];
export function datKhachTro(ds) {
  khach = Array.isArray(ds) ? ds.slice(0, cacGiuong().length - 1) : [];
}
export const khachTro = () => khach;

// Nhà trọ phải có CỬA THẬT trên bản đồ, không thì đi ra rồi không có đường vào
// lại — trước đây cổng ra chỉ thả người chơi xuống chỗ xuất phát của thị trấn,
// bấm vào cửa nào cũng ra nhà của người khác.
//
// Quán Rượu Hải Âu Đáng Kính (taba_house4) trong Thị Trấn Taba đóng luôn vai
// nhà trọ chung: cửa quán dẫn thẳng vào phòng trọ.
const CUA = { map: 'taba_town', x: 25, y: 3, ra: { x: 25, y: 4 } };
export const CUA_TRO = CUA;

// Cắm cổng cho CẢ HAI CHIỀU: cửa quán rượu dẫn vào phòng trọ, và bước xuống
// mép dưới phòng trọ là ra ngay trước cửa quán, đúng chỗ vừa đi vào — quay đầu
// là thấy cửa để vào lại.
export function camCongNhaTro() {
  const m = MAPS[MAP_NHA_TRO];
  if (!m) return null;
  const cho = choDay();
  const vao = (MAPS[CUA.map]?.warps || []).find(w => w.x === CUA.x && w.y === CUA.y);
  if (vao && cho) {
    vao.to = MAP_NHA_TRO;
    vao.tx = cho.x;
    vao.ty = cho.y;
  }
  m.warps = (m.warps || []).filter(w => !w.raTro);
  m.warps.push({ x: Math.floor(m.w / 2), y: m.h - 1, raTro: true,
    to: CUA.map, tx: CUA.ra.x, ty: CUA.ra.y });
  return choDay();
}
