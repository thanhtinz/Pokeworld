// TuxeWorld H5 | engine/mounts.js | Phương tiện và cưỡi Tuxemon
//
// Hai cách đi nhanh hơn đôi chân:
//   1. XE — mua hẳn một chiếc ở Nhà Xe, mua rồi là của mình mãi.
//   2. CƯỠI TUXEMON — phải có ĐỒ NGHỀ đúng loại thì mới trèo lên được:
//        · Yên Cương    cho con bốn chân (brute, landrace, varmint, hunter, dragon)
//        · Dây Cương Bay cho con biết bay (flier)
//      Con biết bay còn qua được mặt nước, đây là điểm ăn tiền của nó.
//
// Trong nhà thì không cưỡi/lái gì cả — chật thế thì lái vào đâu.
import { G, save, addMoney } from '../state.js';
import { SPECIES } from '../data/species.js';
import { VEHICLE_BY_ID, VEHICLES } from '../data/vehicles.js';

export { VEHICLES, VEHICLE_BY_ID };

// Dáng con vật theo bảng 'shape' của bản gốc (db/monster/*.json)
export const DANG_BON_CHAN = ['brute', 'landrace', 'varmint', 'hunter', 'dragon'];
export const DANG_BAY = ['flier'];

// Đồ nghề bán ở Nhà Xe — không phải vật phẩm trong túi mà là đồ mua một lần
export const DO_NGHE = [
  { id: 'yen', name: 'Yên Cương', price: 25000, speed: 1.55,
    desc: 'Trèo lên lưng Tuxemon bốn chân mà đi. Nhanh hơn đi bộ hẳn.' },
  { id: 'bay', name: 'Dây Cương Bay', price: 90000, speed: 1.85,
    desc: 'Cưỡi được con biết bay — và bay thẳng qua mặt nước.' },
];
export const NGHE_BY_ID = Object.fromEntries(DO_NGHE.map(d => [d.id, d]));

export function xe() {
  if (!G.p) return { co: {}, nghe: {}, dang: null };
  if (!G.p.xe || typeof G.p.xe !== 'object') G.p.xe = {};
  const v = G.p.xe;
  if (!v.co || typeof v.co !== 'object') v.co = {};        // {id xe: true}
  if (!v.nghe || typeof v.nghe !== 'object') v.nghe = {};  // {yen|bay: true}
  if (v.dang === undefined) v.dang = null;                 // đang cưỡi cái gì
  return v;
}

export const coXe = (id) => !!xe().co[id];
export const coNghe = (id) => !!xe().nghe[id];

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

export function muaNghe(id) {
  const d = NGHE_BY_ID[id];
  if (!d) return [null, 'Không có món này.'];
  if (coNghe(id)) return [null, `Bạn có ${d.name} rồi.`];
  if ((G.p.money || 0) < d.price) return [null, 'Không đủ tiền mua món này.'];
  addMoney(-d.price);
  xe().nghe[id] = true;
  save();
  return [d, null];
}

// ==== Cưỡi được con nào ====
// Trả 'yen' | 'bay' | null — chính là id đồ nghề cần có
export function kieuCuoi(mon) {
  const sp = mon && SPECIES[mon.sp];
  if (!sp) return null;
  if (DANG_BAY.includes(sp.shape)) return 'bay';
  if (DANG_BON_CHAN.includes(sp.shape)) return 'yen';
  return null;
}

// Con nào trong đội cưỡi được ngay bây giờ
export function conCuoiDuoc() {
  return (G.p?.party || []).map((m, i) => ({ mon: m, slot: i, kieu: kieuCuoi(m) }))
    .filter(c => c.kieu && coNghe(c.kieu) && (c.mon.hpCur || 0) > 0);
}

// ==== Lên / xuống ====
export function len(dang) {
  const v = xe();
  if (dang?.t === 'xe') {
    if (!coXe(dang.id)) return [null, 'Bạn chưa có chiếc xe này.'];
    v.dang = { t: 'xe', id: dang.id };
  } else if (dang?.t === 'thu') {
    const mon = (G.p?.party || [])[dang.slot];
    const k = kieuCuoi(mon);
    if (!mon) return [null, 'Không có con này trong đội.'];
    if (!k) return [null, 'Con này không cưỡi được.'];
    if (!coNghe(k)) return [null, `Cần ${NGHE_BY_ID[k].name} mới cưỡi được.`];
    if ((mon.hpCur || 0) <= 0) return [null, 'Con này đang gục, để nó nghỉ đã.'];
    v.dang = { t: 'thu', slot: dang.slot, kieu: k };
  } else {
    return [null, 'Không rõ muốn cưỡi gì.'];
  }
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

// Tên hiện trên màn hình
export function tenDangCuoi() {
  const d = dangCuoi();
  if (!d) return '';
  if (d.t === 'xe') return VEHICLE_BY_ID[d.id]?.name || 'Xe';
  const mon = (G.p?.party || [])[d.slot];
  return SPECIES[mon?.sp]?.name || 'Tuxemon';
}

// ==== Ảnh hưởng lên cách đi ====
export function heSoToc() {
  const d = dangCuoi();
  if (!d) return 1;
  if (d.t === 'xe') return VEHICLE_BY_ID[d.id]?.speed || 1;
  return NGHE_BY_ID[d.kieu]?.speed || 1;
}

// Đang bay thì qua được mặt nước
export const dangBay = () => dangCuoi()?.kieu === 'bay';

// Ngồi trên xe / trên lưng con vật thì cỏ ít cọ vào chân hơn — gặp hoang bớt
// hẳn, nhưng KHÔNG tắt hẳn, không thì mua xe xong là hết trò bắt Tuxemon.
export const heSoGapHoang = () => (dangCuoi() ? 0.4 : 1);

// Con đang cưỡi mà gục / bị bỏ ra khỏi đội thì tự xuống
export function kiemTraLai() {
  const d = dangCuoi();
  if (!d || d.t !== 'thu') return false;
  const mon = (G.p?.party || [])[d.slot];
  if (mon && (mon.hpCur || 0) > 0 && kieuCuoi(mon) === d.kieu) return false;
  xuong();
  return true;
}
