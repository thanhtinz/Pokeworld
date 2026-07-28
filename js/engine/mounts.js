// TuxeWorld H5 | engine/mounts.js | Phương tiện
//
// Mua hẳn một chiếc xe ở Nhà Xe, mua rồi là của mình mãi. Đang lái thì đi
// nhanh hơn và ít gặp Tuxemon hoang hơn — muốn bắt thì xuống xe.
//
// (Bản trước có thêm kiểu cưỡi lên lưng Tuxemon, nhưng sprite trận đấu dán
// lên bản đồ nhìn không ra gì nên đã bỏ hẳn.)
//
// Trong nhà thì không lái — chật thế lái vào đâu.
import { G, save, addMoney } from '../state.js';
import { VEHICLE_BY_ID, VEHICLES } from '../data/vehicles.js';

export { VEHICLES, VEHICLE_BY_ID };

export function xe() {
  if (!G.p) return { co: {}, dang: null };
  if (!G.p.xe || typeof G.p.xe !== 'object') G.p.xe = {};
  const v = G.p.xe;
  if (!v.co || typeof v.co !== 'object') v.co = {};        // {id xe: true}
  if (v.dang === undefined) v.dang = null;                 // đang lái chiếc nào
  // Bản lưu đời trước còn giữ đồ nghề cưỡi thú và cả con đang cưỡi — dọn đi,
  // không thì mở game lên là ngồi trên lưng một con vô hình.
  if (v.nghe) delete v.nghe;
  if (v.dang && v.dang.t !== 'xe') v.dang = null;
  return v;
}

export const coXe = (id) => !!xe().co[id];

// ==== Mua ====
export function muaXe(id) {
  const v = VEHICLE_BY_ID[id];
  if (!v) return [null, 'Không có mẫu xe này.'];
  if (coXe(id)) return [null, `Bạn có ${v.name} rồi.`];
  if ((G.p.money || 0) < v.price) return [null, 'Không đủ tiền mua chiếc này.'];
  addMoney(-v.price);
  xe().co[id] = true;
  save();
  return [v, null];
}

// ==== Lên / xuống ====
export function len(dang) {
  const v = xe();
  if (dang?.t !== 'xe') return [null, 'Không rõ muốn lái gì.'];
  if (!coXe(dang.id)) return [null, 'Bạn chưa có chiếc xe này.'];
  v.dang = { t: 'xe', id: dang.id };
  save();
  return [v.dang, null];
}

export function xuong() {
  const v = xe();
  if (!v.dang) return false;
  v.dang = null;
  save();
  return true;
}

export const dangCuoi = () => xe().dang;

export function tenDangCuoi() {
  const d = dangCuoi();
  return d ? (VEHICLE_BY_ID[d.id]?.name || 'Xe') : '';
}

// ==== Ảnh hưởng lên cách đi ====
export function heSoToc() {
  const d = dangCuoi();
  return d ? (VEHICLE_BY_ID[d.id]?.speed || 1) : 1;
}

// Ngồi trên xe thì cỏ ít cọ vào chân hơn — gặp hoang bớt hẳn, nhưng KHÔNG tắt
// hẳn, không thì mua xe xong là hết trò bắt Tuxemon.
export const heSoGapHoang = () => (dangCuoi() ? 0.4 : 1);

// Chiếc xe trong bản lưu bị gỡ khỏi bảng thì tự xuống
export function kiemTraLai() {
  const d = dangCuoi();
  if (!d || VEHICLE_BY_ID[d.id]) return false;
  xuong();
  return true;
}
