// TuxeWorld H5 | engine/estate.js | Mua đất, xây nhà, trang trí
//
// Đây là tính năng của riêng bản này, không có trong Tuxemon (art thì lấy từ
// tileset của bản gốc). Cách chơi:
//   1. Khu Đất Mới có sẵn một số lô, mỗi lô một giá. Mua một lô.
//   2. Dựng nhà trên lô đó — bốn mẫu, giá khác nhau, nhà càng đắt càng nhiều ô
//      để kê đồ bên trong. Đổi mẫu nhà thì chỉ trả phần chênh lệch.
//   3. Vào trong nhà tự kê đồ trên lưới ô. Đồ mua rồi là của mình, gỡ ra khỏi
//      lưới thì về kho chứ không mất.
//   4. Đã kết hôn thì vợ/chồng vào được nhà nhau (cần nối máy chủ).
import { G, save, addMoney } from '../state.js';
import { BASE_BY_ID, FURN_BY_ID, HOUSE_BASES } from '../data/estate.js';

// Các lô đất — nằm ở rìa bắc Thị Trấn Taba. Toạ độ đã dò trên bản đồ thật cho
// chắc là ô trống, không đè lên nhà cửa / NPC / cổng dịch chuyển có sẵn.
export const KHU_DAT_MAP = 'taba_town';
export const LOTS = [
  { id: 'a1', name: 'Lô A1 — Rìa làng', price: 20000, x: 2, y: 2 },
  { id: 'a2', name: 'Lô A2 — Rìa làng', price: 20000, x: 8, y: 2 },
  { id: 'b1', name: 'Lô B1 — Mặt đường', price: 45000, x: 14, y: 2 },
  { id: 'b2', name: 'Lô B2 — Mặt đường', price: 45000, x: 22, y: 4 },
  { id: 'c1', name: 'Lô C1 — Gần quảng trường', price: 80000, x: 28, y: 4 },
  { id: 'c2', name: 'Lô C2 — Gần quảng trường', price: 80000, x: 34, y: 4 },
];
export const LOT_BY_ID = Object.fromEntries(LOTS.map(l => [l.id, l]));

export function nha() {
  if (!G.p.estate) G.p.estate = { lot: null, base: null, kho: {}, dat: [] };
  const e = G.p.estate;
  if (!e.kho || typeof e.kho !== 'object') e.kho = {};   // {id: số món đang có}
  if (!Array.isArray(e.dat)) e.dat = [];                 // [{id,x,y}] đã kê
  return e;
}

export const coDat = () => !!nha().lot;
export const coNha = () => !!nha().base;
export const mauNha = () => BASE_BY_ID[nha().base] || null;
// Nhà càng đắt lưới càng rộng
export const soO = () => (mauNha()?.o || 0);

export function muaDat(lotId) {
  const e = nha();
  const lot = LOT_BY_ID[lotId];
  if (!lot) return [null, 'Không có lô đất này.'];
  if (e.lot) return [null, 'Bạn đã có đất rồi — mỗi người một lô thôi.'];
  if ((G.p.money || 0) < lot.price) return [null, 'Không đủ tiền mua lô này.'];
  addMoney(-lot.price);
  e.lot = lotId;
  save();
  return [lot, null];
}

// Dựng nhà, hoặc nâng cấp lên mẫu đắt hơn (chỉ trả phần chênh lệch)
export function dungNha(baseId) {
  const e = nha();
  if (!e.lot) return [null, 'Phải mua đất trước đã.'];
  const b = BASE_BY_ID[baseId];
  if (!b) return [null, 'Không có mẫu nhà này.'];
  if (e.base === baseId) return [null, 'Bạn đang ở chính mẫu nhà này.'];
  const cu = BASE_BY_ID[e.base];
  const phai = cu ? b.price - cu.price : b.price;
  if (phai <= 0) return [null, 'Không đổi xuống mẫu nhỏ hơn được.'];
  if ((G.p.money || 0) < phai) return [null, `Còn thiếu ${phai - (G.p.money || 0)}.`];
  addMoney(-phai);
  e.base = baseId;
  save();
  return [{ base: b, tra: phai }, null];
}

// ==== Đồ trang trí ====
export function muaDo(id) {
  const f = FURN_BY_ID[id];
  if (!f) return [null, 'Không có món này.'];
  if ((G.p.money || 0) < f.price) return [null, 'Không đủ tiền.'];
  const e = nha();
  addMoney(-f.price);
  e.kho[id] = (e.kho[id] || 0) + 1;
  save();
  return [f, null];
}

// Số món đang nằm trong kho (chưa kê)
export const conTrongKho = (id) => (nha().kho[id] || 0);

// Ô nào đang bị chiếm — dùng để chặn kê chồng lên nhau
function oBiChiem(bo = null) {
  const e = nha();
  const set = new Set();
  e.dat.forEach((d, i) => {
    if (i === bo) return;
    const f = FURN_BY_ID[d.id];
    if (!f) return;
    for (let dy = 0; dy < f.h; dy++) {
      for (let dx = 0; dx < f.w; dx++) set.add(`${d.x + dx},${d.y + dy}`);
    }
  });
  return set;
}

export function keDuoc(id, x, y) {
  const f = FURN_BY_ID[id];
  const n = soO();
  if (!f || !n) return false;
  if (x < 0 || y < 0 || x + f.w > n || y + f.h > n) return false;
  const chiem = oBiChiem();
  for (let dy = 0; dy < f.h; dy++) {
    for (let dx = 0; dx < f.w; dx++) if (chiem.has(`${x + dx},${y + dy}`)) return false;
  }
  return true;
}

export function ke(id, x, y) {
  const e = nha();
  if (!coNha()) return [null, 'Chưa có nhà để kê đồ.'];
  if (!conTrongKho(id)) return [null, 'Trong kho hết món này rồi.'];
  if (!keDuoc(id, x, y)) return [null, 'Chỗ này kê không vừa.'];
  e.kho[id] -= 1;
  if (e.kho[id] <= 0) delete e.kho[id];
  e.dat.push({ id, x, y });
  save();
  return [{ id, x, y }, null];
}

// Gỡ món ở ô (x,y) — trả về kho chứ không mất tiền oan
export function go(x, y) {
  const e = nha();
  const i = e.dat.findIndex(d => {
    const f = FURN_BY_ID[d.id];
    return f && x >= d.x && x < d.x + f.w && y >= d.y && y < d.y + f.h;
  });
  if (i < 0) return [null, 'Ô này không có gì.'];
  const [d] = e.dat.splice(i, 1);
  e.kho[d.id] = (e.kho[d.id] || 0) + 1;
  save();
  return [d, null];
}

// Đổi nhà nhỏ hơn thì đồ ngoài lưới mới phải gỡ về kho. Gọi sau khi đổi mẫu.
export function donGonTheoO() {
  const e = nha();
  const n = soO();
  const giu = [];
  for (const d of e.dat) {
    const f = FURN_BY_ID[d.id];
    if (f && d.x + f.w <= n && d.y + f.h <= n) giu.push(d);
    else e.kho[d.id] = (e.kho[d.id] || 0) + 1;
  }
  const bo = e.dat.length - giu.length;
  e.dat = giu;
  if (bo) save();
  return bo;
}

// Bảng tóm tắt cho màn hình
export function tomTat() {
  const e = nha();
  const b = mauNha();
  return {
    lot: LOT_BY_ID[e.lot] || null,
    base: b,
    o: soO(),
    daKe: e.dat.length,
    trongKho: Object.values(e.kho).reduce((a, x) => a + x, 0),
    giaTri: (LOT_BY_ID[e.lot]?.price || 0) + (b?.price || 0)
      + e.dat.concat(Object.entries(e.kho).flatMap(([id, n]) => Array(n).fill({ id })))
        .reduce((a, d) => a + (FURN_BY_ID[d.id]?.price || 0), 0),
  };
}

// Căn nhà đang đứng ở đâu trên bản đồ — màn bản đồ vẽ theo cái này
export function nhaTrenBanDo(mapId) {
  const e = nha();
  if (mapId !== KHU_DAT_MAP || !e.lot || !e.base) return null;
  const l = LOT_BY_ID[e.lot];
  const b = BASE_BY_ID[e.base];
  if (!l || !b) return null;
  return { x: l.x, y: l.y, img: b.img, name: b.name };
}

export { HOUSE_BASES };
