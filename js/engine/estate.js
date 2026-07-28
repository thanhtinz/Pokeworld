// TuxeWorld H5 | engine/estate.js | Mua đất, xây nhà, trang trí
//
// Đây là tính năng của riêng bản này, không có trong Tuxemon (art thì lấy từ
// tileset của bản gốc). Cách chơi:
//   1. Từ Thị Trấn Taba đi theo biển chỉ đường vào Khu Dân Cư — một bản đồ
//      riêng đã chia sẵn sáu lô đất, mỗi lô cắm một tấm biển BÁN. Đứng trước
//      biển bấm nút hành động để mua.
//   2. Mua rồi thì bấm lại vào lô để chọn mẫu nhà và trả tiền. Nhà KHÔNG mọc
//      lên ngay — phải chờ thợ xây xong (mẫu càng to càng lâu).
//   3. Xây xong thì căn nhà hiện trên bản đồ, đi vào cửa là vào trong nhà.
//   4. Ở trong nhà mới bật được chế độ trang trí: kéo đồ tới chỗ muốn đặt.
//   5. Đồ nội thất mua ở chỗ bác thợ mộc đứng ngay đầu khu đất.
//   6. Đã kết hôn thì vợ/chồng vào được nhà nhau (cần nối máy chủ).
import { G, save, addMoney } from '../state.js';
import { BASE_BY_ID, FURN_BY_ID, HOUSE_BASES } from '../data/estate.js';
import { PHONG_NHA } from '../data/phongtrong.js';
import { MAPS } from '../data/maps.js';
import { dangTham } from './visit.js';

// Các lô đất nằm trong KHU DÂN CƯ — một bản đồ riêng, đi hết ngõ phía bắc Thị
// Trấn Taba là tới. Toạ độ lô, chỗ bác thợ mộc đứng và bản thân bản đồ đều do
// tools/khudancu.py sinh ra một lượt, nên nền đất luôn khớp với lô đất.
import { KHU_DAT_MAP, LOTS, THO_MOC, TIEM_QUA, LO_REN, CONG_RA } from '../data/khudancu.js';
export { KHU_DAT_MAP, LOTS, THO_MOC, TIEM_QUA, LO_REN, CONG_RA };
export const LOT_BY_ID = Object.fromEntries(LOTS.map(l => [l.id, l]));

// Bên trong nhà là PHÒNG TRỐNG dựng riêng (tools/phongtrong.py), không mượn
// bản đồ nội thất của bản gốc nữa: mấy bản đồ đó vẽ sẵn quầy, kệ, giường, nên
// kê thêm đồ của mình vào là đè lên nhau, nhìn như lỗi.
// Mẫu nhà càng đắt thì mặt bằng càng rộng — đúng nghĩa "nhà to hơn".
export const MAP_TRONG_NHA = PHONG_NHA;
// Mọi bản đồ có thể là nhà của người chơi — dùng để nhận ra đang ở trong nhà
export const CAC_MAP_NHA = Object.values(MAP_TRONG_NHA);
export const mapTrongNha = () => MAP_TRONG_NHA[nha().base] || null;

export function nha() {
  if (!G.p.estate) G.p.estate = { lot: null, base: null, kho: {}, dat: [] };
  const e = G.p.estate;
  if (!e.kho || typeof e.kho !== 'object') e.kho = {};   // {id: số món đang có}
  if (!Array.isArray(e.dat)) e.dat = [];                 // [{id,x,y}] đã kê
  return e;
}

// ==== Thời gian xây ====
// Mẫu càng to thợ làm càng lâu. Đây là thời gian THẬT, tắt game vẫn chạy tiếp.
export const THOI_GIAN_XAY = { nha_go: 5, nha_khung: 15, nha_ngoi: 30, nha_da: 60 };
const PHUT = 60000;

export const dangXay = () => { const e = nha(); return !!e.xongLuc && Date.now() < e.xongLuc; };
export const conLaiMs = () => { const e = nha(); return Math.max(0, (e.xongLuc || 0) - Date.now()); };
// Nhà dùng được chưa: đã chọn mẫu VÀ thợ đã xây xong
export const nhaXong = () => { const e = nha(); return !!e.base && !dangXay(); };

// "12 phút nữa" / "1 giờ 5 phút nữa"
export function conLaiChu() {
  const ms = conLaiMs();
  if (ms <= 0) return 'xong rồi';
  const p = Math.ceil(ms / PHUT);
  if (p < 60) return `${p} phút nữa`;
  return `${Math.floor(p / 60)} giờ ${p % 60} phút nữa`;
}

// Trả tiền để xong ngay — mỗi phút còn lại tính 500
export function xayNhanh() {
  const e = nha();
  if (!dangXay()) return [null, 'Không có gì đang xây.'];
  const gia = Math.ceil(conLaiMs() / PHUT) * 500;
  if ((G.p.money || 0) < gia) return [null, `Cần ${gia} để giục thợ làm cho xong.`];
  addMoney(-gia);
  e.xongLuc = Date.now();
  save();
  return [gia, null];
}

export const coDat = () => !!nha().lot;
export const coNha = () => !!nha().base;
export const mauNha = () => BASE_BY_ID[nha().base] || null;

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
  // Thợ bắt đầu làm; mẫu càng to càng lâu
  e.xongLuc = Date.now() + (THOI_GIAN_XAY[baseId] || 5) * PHUT;
  save();
  return [{ base: b, tra: phai, cho: e.xongLuc }, null];
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

// (Bỏ hẳn bộ kê đồ theo LƯỚI VUÔNG đời đầu: keDuoc/ke/go/donGonTheoO/oBiChiem.
// Từ khi kê đồ ngay trên bản đồ trong nhà thì bộ đó không còn chỗ nào gọi, chỉ
// còn mấy bài test tự gọi nhau — mà nó lại có luật khác hẳn bộ đang dùng, để
// lại chỉ tổ nhầm.)

// Bảng tóm tắt cho màn hình
export function tomTat() {
  const e = nha();
  const b = mauNha();
  return {
    lot: LOT_BY_ID[e.lot] || null,
    base: b,
    o: soMonToiDa(),
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
  return { x: l.x, y: l.y, img: b.img, name: b.name, xay: dangXay() };
}

// Ô cửa của căn nhà — đứng vào đó là vào trong
export function oCua() {
  const e = nha();
  const l = LOT_BY_ID[e.lot];
  return l ? { x: l.x + 1, y: l.y + 2 } : null;
}

// ==== Vật thể trên bản đồ mà nút hành động bắt được ====
// Trả về một "thing" giống NPC/bảng hiệu để js/engine/overworld.js dùng chung
// một đường với mọi thứ khác.
export function vatTheODay(mapId, x, y) {
  // Đang là khách trong nhà người ta thì không đụng vào đồ của chủ nhà
  if (dangTham()) return null;
  // Trong nhà mình: đứng trước món nào thì bắt được món đó, để còn nằm/ngồi/ăn
  if (dangTrongNha(mapId)) {
    const d = monTaiO(x, y);
    if (d) {
      const f = FURN_BY_ID[d.id];
      return { type: 'estate', kind: 'do-noi-that', name: f?.name || 'Đồ đạc', mon: d };
    }
    return null;
  }
  if (mapId === KHU_DAT_MAP) {
    if (x === THO_MOC.x && y === THO_MOC.y) {
      return { type: 'estate', kind: 'tho-moc', name: 'Bác Thợ Mộc' };
    }
    if (x === TIEM_QUA.x && y === TIEM_QUA.y) {
      return { type: 'estate', kind: 'tiem-qua', name: 'Cô Hoa' };
    }
    // Lò rèn: chỗ DUY NHẤT bán đá nâng cấp. Trang bị thì không bán ở đâu cả.
    if (x === LO_REN.x && y === LO_REN.y) {
      return { type: 'estate', kind: 'lo-ren', name: 'Bác Thép' };
    }
    const e = nha();
    for (const l of LOTS) {
      // Vùng 3x3 của lô: đứng cạnh ô nào trong đó cũng bấm được
      if (x < l.x || x > l.x + 2 || y < l.y || y > l.y + 2) continue;
      if (e.lot !== l.id) {
        return e.lot
          ? { type: 'estate', kind: 'lo-nguoi-khac', name: 'Biển Bán Đất', lot: l }
          : { type: 'estate', kind: 'lo-ban', name: 'Biển Bán Đất', lot: l };
      }
      if (!e.base) return { type: 'estate', kind: 'lo-cua-minh', name: l.name, lot: l };
      if (dangXay()) return { type: 'estate', kind: 'dang-xay', name: 'Công Trường', lot: l };
      const c = oCua();
      if (c && x === c.x && y === c.y) {
        return { type: 'estate', kind: 'cua-nha', name: mauNha()?.name || 'Nhà', lot: l };
      }
      return { type: 'estate', kind: 'nha-minh', name: mauNha()?.name || 'Nhà', lot: l };
    }
  }
  return null;
}

// ==== Kê đồ NGAY TRÊN BẢN ĐỒ trong nhà ====
// Khác với lưới cũ: toạ độ là ô thật của bản đồ nội thất, nên món kê ở đâu thì
// đi tới đó nhìn thấy ở đúng chỗ đó.

// Món đang nằm ở ô này (nếu có)
export function monTaiO(x, y) {
  return nha().dat.find(d => {
    const f = FURN_BY_ID[d.id];
    return f && x >= d.x && x < d.x + f.w && y >= d.y && y < d.y + f.h;
  }) || null;
}

// Ô này kê được không: phải trong lòng bản đồ, không đè lên món khác, và không
// vượt quá số món mà mẫu nhà cho phép.
export function keDuocTrongNha(id, x, y, map, boQua = null) {
  const f = FURN_BY_ID[id];
  if (!f || !map) return false;
  if (x < 0 || y < 0 || x + f.w > map.w || y + f.h > map.h) return false;
  for (let dy = 0; dy < f.h; dy++) {
    for (let dx = 0; dx < f.w; dx++) {
      // Không kê vào TƯỜNG. Trước đây chỉ chừa một ô quanh mép bản đồ, mà
      // phòng của mình có tường dày HAI hàng trên cùng — nên kê được cả vào
      // giữa bức tường, món đồ dính nửa trong nửa ngoài.
      if (map.solid?.[(y + dy) * map.w + (x + dx)]) return false;
      const o = monTaiO(x + dx, y + dy);
      if (o && o !== boQua) return false;
    }
  }
  return true;
}

// Mặt bằng rộng thì kê được nhiều đồ hơn — tính theo SỐ Ô THẬT của căn phòng.
// Trước đây gọi không kèm bản đồ thì trả một con số khác (theo trường 'o' của
// mẫu nhà), nên màn hình hiện một đằng mà lúc kê lại chặn một nẻo. Giờ mỗi mẫu
// nhà chỉ có đúng một căn phòng nên cứ tra thẳng phòng đó ra mà tính.
export function soMonToiDa(map = null) {
  if (!mauNha()) return 0;
  const m = map || MAPS[mapTrongNha()];
  if (!m) return 0;
  return Math.max(6, Math.floor((m.w - 2) * (m.h - 2) / 6));
}

export function keTaiO(id, x, y) {
  const e = nha();
  if (!nhaXong()) return [null, 'Nhà chưa xây xong.'];
  if (!conTrongKho(id)) return [null, 'Trong kho hết món này rồi.'];
  if (e.dat.length >= soMonToiDa()) {
    return [null, `${mauNha().name} chỉ kê được ${soMonToiDa()} món.`];
  }
  e.kho[id] -= 1;
  if (e.kho[id] <= 0) delete e.kho[id];
  e.dat.push({ id, x, y });
  save();
  return [{ id, x, y }, null];
}

// Kéo một món sang ô khác. Thả trúng chỗ không hợp thì trả về chỗ cũ.
export function chuyenDo(d, x, y, map) {
  if (!d) return [null, 'Không có món nào.'];
  if (!keDuocTrongNha(d.id, x, y, map, d)) return [null, 'Chỗ này không kê vừa.'];
  d.x = x; d.y = y;
  save();
  return [d, null];
}

// Cất một món về kho
export function catVeKho(d) {
  const e = nha();
  const i = e.dat.indexOf(d);
  if (i < 0) return false;
  e.dat.splice(i, 1);
  e.kho[d.id] = (e.kho[d.id] || 0) + 1;
  save();
  return true;
}

// Cắm cổng đi ra cho bản đồ trong nhà. Gọi trước khi đưa người chơi vào nhà —
// dù là bước qua cửa hay là mở game lên đã nằm sẵn trong đó.
export function camCongVeNha() {
  const c = oCua();
  const noi = MAPS[mapTrongNha()];
  if (!noi || !c) return null;
  noi.warps = (noi.warps || []).filter(w => !w.veNha);
  noi.warps.push({ x: Math.floor(noi.w / 2), y: noi.h - 1, veNha: true,
    to: KHU_DAT_MAP, tx: c.x, ty: c.y + 1 });
  return { x: Math.floor(noi.w / 2), y: noi.h - 2 };
}

// Cái giường đầu tiên đã kê trong nhà — mở game lên thì nằm lên chính nó
export function giuongTrongNha() {
  return nha().dat.find(d => FURN_BY_ID[d.id]?.kind === 'nam') || null;
}

// Đang đứng trong chính nhà mình?
export const dangTrongNha = (mapId) => mapId === mapTrongNha() && nhaXong();

export { HOUSE_BASES };
