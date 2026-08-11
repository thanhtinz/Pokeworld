// TuxeWorld H5 | engine/furniture.js | Nằm giường nhà trọ
//
// Mở game lên là nhân vật đang nằm trên giường nhà trọ; nhấn hướng một cái là
// ngồi dậy. Nằm xuống thì cả đội hồi máu, nhưng có KHOẢNG NGHỈ tính bằng giờ
// thật — tắt game vẫn chạy tiếp. Không có nghỉ thì nằm liên tục là hồi máu vô
// hạn, trạm hồi sức thành thừa.
import { G, save } from '../state.js';
import { heal } from './monster.js';

const PHUT = 60000;
export const NGHI_NAM = 120;      // phút thật giữa hai lần nằm

function moc() {
  if (!G.p) return {};
  if (!G.p.noiThat || typeof G.p.noiThat !== 'object') G.p.noiThat = {};
  return G.p.noiThat;
}

export const conNghiMs = () => Math.max(0, (moc().nam || 0) + NGHI_NAM * PHUT - Date.now());

export function conNghiChu() {
  const ms = conNghiMs();
  if (ms <= 0) return '';
  const p = Math.ceil(ms / PHUT);
  if (p < 60) return `${p} phút nữa`;
  return `${Math.floor(p / 60)} giờ ${p % 60} phút nữa`;
}

// Giường đang nằm (null = đang đứng) — màn bản đồ vẽ nhân vật theo cái này
let giuong = null;
export const giuongDangNam = () => giuong;

/** Nằm xuống một cái giường. Trả [lời nhắn, lỗi]. */
export function namXuong(g) {
  if (!g) return [null, 'Không có giường nào ở đây.'];
  giuong = g;
  const cho = conNghiChu();
  if (cho) return [`Bạn ngả lưng xuống. Vừa ngủ xong rồi, ${cho} hãy ngủ tiếp.`, null];
  const ds = G.p?.party || [];
  ds.forEach(heal);
  const m = moc();
  m.nam = Date.now();
  m.soLan = m.soLan || {};
  m.soLan.nam = (m.soLan.nam || 0) + 1;
  save();
  return ['Bạn ngả lưng xuống giường.'
    + (ds.length ? ' Cả đội khoẻ lại hoàn toàn.' : ''), null];
}

export function dungDay() {
  if (!giuong) return false;
  giuong = null;
  return true;
}

export const soLanDung = (kind) => (moc().soLan || {})[kind] || 0;
