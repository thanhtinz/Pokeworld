// TuxeWorld H5 | engine/avatar.js | Ghép lớp thành sprite nhân vật
//
// Nhân vật không còn là một tệp sprite cố định nữa mà ghép từ nhiều LỚP rời
// (assets/lpc, do tools/mklpc.py cắt từ bộ Liberated Pixel Cup): thân, tai,
// mắt, mũi, biểu cảm, râu, rồi tới quần áo, cuối cùng là tóc và mũ.
//
// Mỗi lớp đã cắt sẵn về đúng khuôn 3 cột × 4 hàng của sprite đi bản đồ, nên
// ghép xong là dùng thẳng được với js/engine/owsprite.js — không phải sửa gì
// bên đường vẽ.
//
// Ghép xong thì nướng thành MỘT ảnh (canvas → data URL) rồi nhớ lại theo khoá:
// vẽ mười mấy lớp mỗi khung hình thì máy yếu tụt khung ngay.
import { G, save } from '../state.js';
import { esc } from '../util.js';
import { THU_MUC, GIOI, THAN, DA, TAI, MUI, BIEU_CAM, MAT, TOC_KIEU, TOC_MAU,
  RAU_KIEU, RAU_MAU, O_DO, DO_BY_ID, monBoMau } from '../data/lpc.js';

export const KHUNG_W = 32;      // một khung trong sheet đã cắt
export const KHUNG_H = 64;
export const SHEET_W = KHUNG_W * 3;
export const SHEET_H = KHUNG_H * 4;

const dau = (ds) => ds[0]?.id || '';

// Ngoại hình mặc định — dùng cho bản lưu cũ chưa có mục này
export function macDinh(than = 'nam') {
  return {
    than,
    da: dau(DA),
    tai: '',
    mui: MUI[2]?.id || dau(MUI),
    bieucam: '',
    mat: dau(MAT),
    tocKieu: dau(TOC_KIEU),
    tocMau: dau(TOC_MAU),
    rauKieu: '',
    rauMau: dau(RAU_MAU),
  };
}

function hopLe(nv) {
  const co = (ds, v) => ds.some(x => x.id === v);
  const m = macDinh(co(THAN, nv?.than) ? nv.than : 'nam');
  if (!nv || typeof nv !== 'object') return m;
  const ra = { ...m };
  for (const [k, ds] of [['da', DA], ['tai', TAI], ['mui', MUI],
    ['bieucam', BIEU_CAM], ['mat', MAT], ['tocKieu', TOC_KIEU],
    ['tocMau', TOC_MAU], ['rauKieu', RAU_KIEU], ['rauMau', RAU_MAU]]) {
    if (nv[k] === '' || co(ds, nv[k])) ra[k] = nv[k];
  }
  return ra;
}

// ==== Chỗ cất trong bản lưu ====
export function look() {
  if (!G.p) return { nv: macDinh(), mac: {}, tuDo: [] };
  if (!G.p.look || typeof G.p.look !== 'object') G.p.look = {};
  const L = G.p.look;
  L.nv = hopLe(L.nv);
  if (!L.mac || typeof L.mac !== 'object') L.mac = {};
  if (!Array.isArray(L.tuDo)) L.tuDo = [];
  // Bản lưu cũ có thể đang mặc đồ lệch dáng: dáng "Mảnh Khảnh" trước ăn theo
  // tủ đồ của nam, đo lại thấy đồ nữ mới vừa người nên đã đổi. Cởi ra ở đây
  // chứ không thì nhân vật mặc áo cắt cho dáng khác, nhìn lệch hẳn.
  const kieu = danDo(L.nv.than);
  for (const o of Object.keys(L.mac)) {
    const d = DO_BY_ID[L.mac[o]];
    if (L.mac[o] && (!d || d.than !== kieu)) L.mac[o] = null;
  }
  return L;
}

export const nguoi = () => look().nv;
export const dangMac = () => look().mac;
export const tuDo = () => look().tuDo;

// Dáng người quyết định lấy quần áo bản nào (LPC chỉ vẽ đồ cho nam và nữ)
export const danDo = (than = nguoi().than) =>
  THAN.find(t => t.id === than)?.do || 'nam';

// ==== Giới tính ====
// Chọn giới tính TRƯỚC, rồi mới tới dáng người trong giới đó.
export const gioiCua = (than = nguoi().than) =>
  THAN.find(t => t.id === than)?.gioi || 'nam';

/** Các dáng người thuộc một giới. */
export const thanTheoGioi = (gioi) => THAN.filter(t => t.gioi === gioi);

/** Dáng mặc định của một giới — dùng lúc vừa chọn xong giới tính. */
export const thanDauCuaGioi = (gioi) =>
  (thanTheoGioi(gioi)[0] || THAN[0]).id;

export { GIOI };

// ==== Đường dẫn từng lớp ====
export const P = (nhom, ten) => `${THU_MUC}/${nhom}/${ten}.png`;

/** Ảnh của riêng một món đồ (dùng để bày trong tiệm và tủ đồ). */
export const duongDo = (id) => P('do', id);

/**
 * Danh sách lớp theo ĐÚNG thứ tự vẽ, từ trong ra ngoài.
 * Tóc và mũ để cuối: mũ phải trùm lên tóc chứ không phải ngược lại.
 */
export function cacLop(nv = nguoi(), mac = dangMac()) {
  const ra = [P('base', `${nv.than}_${nv.da}`)];
  if (nv.tai) ra.push(P('tai', `${nv.tai}_${nv.da}`));
  if (nv.mui) ra.push(P('mui', `${nv.mui}_${nv.da}`));
  if (nv.mat) ra.push(P('mat', nv.mat));
  if (nv.bieucam) ra.push(P('bieucam', `${nv.bieucam}_${nv.da}`));
  if (nv.rauKieu) ra.push(P('rau', `${nv.rauKieu}_${nv.rauMau}`));
  for (const o of O_DO) {
    if (o.id === 'mu') continue;                 // mũ vẽ sau tóc
    const id = mac[o.id];
    if (id && DO_BY_ID[id]) ra.push(P('do', id));
  }
  if (nv.tocKieu) ra.push(P('toc', `${nv.tocKieu}_${nv.tocMau}`));
  if (mac.mu && DO_BY_ID[mac.mu]) ra.push(P('do', mac.mu));
  return ra;
}

export const khoaLop = (nv = nguoi(), mac = dangMac()) => cacLop(nv, mac).join('|');

// ==== Nướng thành một ảnh ====
const anhLop = new Map();
function tai(src) {
  if (anhLop.has(src)) return anhLop.get(src);
  const p = new Promise(ok => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = () => ok(null);          // thiếu một lớp thì bỏ qua lớp đó
    im.src = src;
  });
  anhLop.set(src, p);
  return p;
}

const nuong = new Map();

/**
 * Ảnh sprite hoàn chỉnh của một bộ ngoại hình. Trả về ngay một <img>; ảnh thật
 * gán vào sau khi mọi lớp tải xong (màn bản đồ tự bỏ qua ảnh chưa sẵn sàng).
 */
export function anhNhanVat(nv = nguoi(), mac = dangMac()) {
  const key = khoaLop(nv, mac);
  if (nuong.has(key)) return nuong.get(key);
  const img = new Image();
  nuong.set(key, img);
  const ds = cacLop(nv, mac);
  Promise.all(ds.map(tai)).then(lop => {
    const c = document.createElement('canvas');
    c.width = SHEET_W;
    c.height = SHEET_H;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    for (const im of lop) if (im) ctx.drawImage(im, 0, 0);
    img.src = c.toDataURL();
  });
  return img;
}

// Khung đứng nhìn thẳng — dùng làm ảnh đại diện trong giao diện
export const KHUNG_DUNG = { x: 0, y: 0, w: KHUNG_W, h: KHUNG_H };

/**
 * Một ô ảnh đại diện: cắt đúng khung đứng ra, phóng to theo `cao`.
 * Trả HTML để nhét thẳng vào innerHTML.
 */
export function oNhanVat(nv = nguoi(), mac = dangMac(), cao = 64, cls = '') {
  const img = anhNhanVat(nv, mac);
  const ti = cao / KHUNG_H;
  return `<span class="nv-o ${cls}" style="width:${Math.round(KHUNG_W * ti)}px;height:${cao}px">
    <img src="${img.src || ''}" data-nv="${esc(khoaLop(nv, mac))}"
         style="width:${Math.round(SHEET_W * ti)}px;height:${Math.round(SHEET_H * ti)}px">
  </span>`;
}

/**
 * Ảnh trong `oNhanVat` có thể được dựng trước khi lớp nướng xong. Gọi hàm này
 * sau khi đặt innerHTML để gán lại src khi ảnh sẵn sàng.
 */
export function capNhatO(root = document) {
  for (const im of root.querySelectorAll('[data-nv]')) {
    const src = nuong.get(im.dataset.nv)?.src;
    if (src && im.src !== src) im.src = src;
    else if (!src) {
      const cho = nuong.get(im.dataset.nv);
      if (cho) cho.addEventListener('load', () => { im.src = cho.src; }, { once: true });
    }
  }
}

// ==== Ảnh xem trước từng phần (không cần canvas) ====
//
// Tiệm bày mấy chục món mà chỉ ghi tên thì người chơi phải bấm từng cái mới
// biết nó ra sao. Mấy hàm dưới cắt đúng KHUNG ĐỨNG NHÌN THẲNG của các lớp
// bằng CSS (ảnh to hơn khung, kéo lệch cho lộ đúng ô cần) — rẻ hơn hẳn so với
// dựng một cái canvas cho mỗi món.
// Đo trên chính bộ ảnh đã cắt: mũ chiếm dòng 6..42, tóc 9..51, râu 29..38, và
// có món rộng hết cả 32 cột. Khung đầu phải trùm đủ chỗ đó, cắt hẹp thì mũ
// chỉ còn cái chỏm còn tóc dài thì cụt ngang.
export const VUNG_NGUOI = { x: 0, y: 2, w: KHUNG_W, h: 62 };
export const VUNG_DAU = { x: 0, y: 5, w: KHUNG_W, h: 43 };
// Khung hẹp hơn cho mấy ô chọn tóc/râu/tai/mũi/biểu cảm: khung mũ ở trên lấy
// tới tận ngực, bày trong ô chọn thì cái đầu bé tí, nhìn không ra kiểu gì.
export const VUNG_MAT = { x: 2, y: 7, w: 28, h: 34 };

/**
 * Chồng vài lớp lại thành một ô ảnh tĩnh.
 * @param {Array<[string, string]>} ds cặp [đường dẫn, class thêm vào]
 */
export function oLop(ds, { cao = 96, vung = VUNG_NGUOI, cls = '' } = {}) {
  const ti = cao / vung.h;
  const st = `width:${Math.round(SHEET_W * ti)}px;height:${Math.round(SHEET_H * ti)}px;` +
    `left:${Math.round(-vung.x * ti)}px;top:${Math.round(-vung.y * ti)}px`;
  return `<span class="lop-o ${cls}" style="width:${Math.round(vung.w * ti)}px;height:${cao}px">
    ${ds.map(([src, k]) => `<img src="${esc(src)}" class="${k || ''}" style="${st}" alt="">`).join('')}
  </span>`;
}

/** Một món đồ, khoác lên thân người mờ làm ma-nơ-canh cho dễ hình dung. */
export function oMonDo(id, { cao = 96, nv = nguoi() } = {}) {
  const d = DO_BY_ID[id];
  if (!d) return '';
  const tren = d.o === 'mu';           // mũ thì soi phần đầu cho rõ
  return oLop([[P('base', `${nv.than}_${nv.da}`), 'lop-nen'], [P('do', id), '']],
    { cao, vung: tren ? VUNG_DAU : VUNG_NGUOI, cls: 'do-o' });
}

/** Một phần ngoại hình (tóc, râu, tai...) đặt trên đầu người mờ. */
export function oPhanDau(nhom, ten, { cao = 64, nv = nguoi() } = {}) {
  const ds = [[P('base', `${nv.than}_${nv.da}`), 'lop-nen']];
  if (ten) ds.push([P(nhom, ten), '']);
  return oLop(ds, { cao, vung: VUNG_MAT, cls: 'do-o' });
}

/**
 * Nhân vật ĐẦY ĐỦ (thân, mặt, tóc, quần áo) ở khung đứng nhìn thẳng, không làm
 * mờ lớp nào. Khác `oBoDo` đúng chỗ đó: thẻ chọn bộ đồ thì làm mờ người đi cho
 * bộ đồ nổi lên, còn thẻ chọn giới tính phải thấy nguyên cả con người.
 */
export function oNguoiDu(nv = nguoi(), mac = dangMac(), { cao = 128 } = {}) {
  return oLop(cacLop(nv, mac).map(p => [p, '']), { cao, cls: 'do-o' });
}

/** Cả một bộ đồ mẫu khoác lên người, dùng cho thẻ chọn bộ lúc tạo nhân vật. */
export function oBoDo(ds, { cao = 96, nv = nguoi() } = {}) {
  const lop = [[P('base', `${nv.than}_${nv.da}`), 'lop-nen']];
  for (const o of O_DO) {
    const id = ds.find(x => DO_BY_ID[x]?.o === o.id);
    if (id) lop.push([P('do', id), '']);
  }
  return oLop(lop, { cao, cls: 'do-o' });
}

// ==== Tủ đồ ====
export function coDo(id) {
  return tuDo().includes(id);
}

export function themDo(id) {
  const L = look();
  if (!DO_BY_ID[id] || L.tuDo.includes(id)) return false;
  L.tuDo.push(id);
  save();
  return true;
}

/** Mặc một món. Trả [lời nhắn, lỗi]. */
export function mac(id) {
  const d = DO_BY_ID[id];
  const L = look();
  if (!d) return [null, 'Không có món này.'];
  if (!L.tuDo.includes(id)) return [null, 'Chưa có món này trong tủ.'];
  if (d.than !== danDo()) return [null, 'Món này không hợp dáng người của bạn.'];
  L.mac[d.o] = id;
  save();
  return [`Đã mặc ${d.name}.`, null];
}

export function coi(o) {
  const L = look();
  if (!L.mac[o]) return [null, 'Ô này đang trống.'];
  const ten = DO_BY_ID[L.mac[o]]?.name || 'món đồ';
  L.mac[o] = null;
  save();
  return [`Đã cởi ${ten}.`, null];
}

/** Mặc trọn một bộ mẫu (dùng lúc tạo nhân vật). */
export function macBoMau(so, than = nguoi().than) {
  const L = look();
  const ds = monBoMau(danDo(than), so);
  for (const id of ds) {
    if (!L.tuDo.includes(id)) L.tuDo.push(id);
    const d = DO_BY_ID[id];
    if (d) L.mac[d.o] = id;
  }
  save();
  return ds;
}

/**
 * Đổi dáng người thì bộ đồ đang mặc có thể không còn hợp — cởi hết món lệch
 * dáng ra, không thì nhân vật mặc áo vẽ cho dáng khác, nhìn lệch hẳn người.
 */
export function doiThan(than) {
  const L = look();
  L.nv.than = THAN.some(t => t.id === than) ? than : 'nam';
  const kieu = danDo();
  for (const o of Object.keys(L.mac)) {
    const d = DO_BY_ID[L.mac[o]];
    if (d && d.than !== kieu) L.mac[o] = null;
  }
  save();
}
