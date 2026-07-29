// TuxeWorld H5 | engine/avatar.js | Ghép lớp thành sprite nhân vật
//
// Nhân vật không phải một tệp sprite cố định mà ghép từ nhiều LỚP rời
// (assets/nv, do tools/cozy.py cắt ra): người, mắt, má hồng, son môi, rồi
// quần áo, rồi tóc, râu, cuối cùng là kính và mũ.
//
// Ô 32×32, thân người cao 20px — đúng bằng tỉ lệ của NPC Tuxemon (0,625) nên
// nhân vật chính và NPC cùng một cỡ pixel. Bản trước ghép từ LPC (ô 32×64) tuy
// đã canh cho cao bằng nhau nhưng pixel vẫn nhỏ gấp đôi, nhìn mịn hơn cả thế
// giới xung quanh.
//
// Mỗi lớp đã cắt sẵn về đúng khuôn 3 cột × 4 hàng của sprite đi bản đồ nên ghép
// xong dùng thẳng được với js/engine/owsprite.js.
//
// Ghép xong thì nướng thành MỘT ảnh (canvas → data URL) rồi nhớ lại theo khoá:
// vẽ mười mấy lớp mỗi khung hình thì máy yếu tụt khung ngay.
import { G, save } from '../state.js';
import { esc } from '../util.js';
import { THU_MUC, GIOI, DA, MAT, MA_HONG, SON_MOI, TOC_KIEU, TOC_MAU,
  RAU_MAU, DO_MAU, O_DO, DO, DO_BY_ID, monBoMau } from '../data/nhanvat.js';

export const KHUNG_W = 32;
export const KHUNG_H = 32;
export const SHEET_W = KHUNG_W * 3;
export const SHEET_H = KHUNG_H * 4;

const dau = (ds) => ds[0]?.id || '';
const tepDa = (da) => DA.find(d => d.id === da)?.tep || DA[0].tep;

// ==== Món đồ + màu ====
// Mỗi món có nhiều bản màu, tệp đặt tên `<id>_<màu>.png`. Chỗ đang mặc cất
// nguyên tên tệp (không có đuôi) cho `mac` vẫn là một bảng chuỗi phẳng — cất
// tách {id, màu} thì mọi chỗ đọc `mac` đều phải sửa theo.
// Có mã là tiền tố của mã khác (`ao_thuy_thu` với `ao_thuy_thu_no`,
// `khuyen_do` với `khuyen_do_bac`), nên so tiền tố thôi là chưa đủ: phần đuôi
// còn lại BẮT BUỘC phải là một mã màu có thật, và mã nào dài hơn thì thắng.
const MAU_HOP_LE = new Set([...DO_MAU.map(m => m.id), 'goc']);
export const monCua = (khoa) => {
  const k = String(khoa);
  let ra = null;
  for (const d of DO) {
    if (!k.startsWith(d.id + '_')) continue;
    if (!MAU_HOP_LE.has(k.slice(d.id.length + 1))) continue;
    if (!ra || d.id.length > ra.id.length) ra = d;
  }
  return ra;
};
export const mauCua = (khoa) => {
  const d = monCua(khoa);
  return d ? String(khoa).slice(d.id.length + 1) : '';
};
/** Món `id` bản màu `mau`; món chỉ có một bản thì màu là "goc". */
export const khoaDo = (id, mau) => `${id}_${DO_BY_ID[id]?.somau > 1 ? mau : 'goc'}`;
/** Mấy màu mà món này thật sự có. */
export const mauCoCua = (id) =>
  DO_BY_ID[id]?.somau > 1 ? DO_MAU.slice(0, DO_BY_ID[id].somau) : [];

// Ngoại hình mặc định — dùng cho bản lưu cũ chưa có mục này
export function macDinh(gioi = 'nam') {
  return {
    gioi,
    da: dau(DA),
    mat: dau(MAT),
    maHong: '',
    sonMoi: '',
    tocKieu: tocTheoGioi(gioi)[0]?.id || dau(TOC_KIEU),
    tocMau: dau(TOC_MAU),
    rau: '',                       // '' = không để râu, còn lại là mã màu râu
  };
}

// Bản lưu cũ dùng bộ LPC: có `than` ('nam'/'nu'/'luc'/'gay') chứ không có
// `gioi`, và mã của tóc/mắt/da đều là mã bên LPC. Không món nào khớp bộ mới nên
// chỉ giữ lại đúng GIỚI TÍNH, phần còn lại quay về mặc định — thà nhân vật về
// mẫu mặc định còn hơn hiện ra một đống lớp thiếu ảnh.
const GIOI_CU = { nam: 'nam', luc: 'nam', nu: 'nu', gay: 'nu' };

function hopLe(nv) {
  const co = (ds, v) => ds.some(x => x.id === v);
  const gioi = nv?.gioi || GIOI_CU[nv?.than] || 'nam';
  const m = macDinh(GIOI.some(g => g.id === gioi) ? gioi : 'nam');
  if (!nv || typeof nv !== 'object') return m;
  const ra = { ...m };
  for (const [k, ds] of [['da', DA], ['mat', MAT], ['maHong', MA_HONG],
    ['sonMoi', SON_MOI], ['tocKieu', TOC_KIEU], ['tocMau', TOC_MAU],
    ['rau', RAU_MAU]]) {
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
  // Đồ của bộ LPC cũ không còn tệp nào khớp — bỏ hết, không thì mặc lên là
  // thủng một mảng trong suốt giữa người.
  for (const o of Object.keys(L.mac)) {
    if (L.mac[o] && !monCua(L.mac[o])) L.mac[o] = null;
  }
  L.tuDo = L.tuDo.filter(k => monCua(k));
  return L;
}

export const nguoi = () => look().nv;
export const dangMac = () => look().mac;
export const tuDo = () => look().tuDo;

// ==== Giới tính ====
// Bộ sprite này vẽ chung một thân cho cả hai giới, nên giới tính KHÔNG đổi hình
// dáng — chỉ dùng để lọc danh sách kiểu tóc bày ra cho chọn.
export const gioiCua = () => nguoi().gioi;
export const tocTheoGioi = (gioi) => TOC_KIEU.filter(t => !t.gioi || t.gioi === gioi);

export { GIOI };

// ==== Đường dẫn từng lớp ====
export const P = (nhom, ten) => `${THU_MUC}/${nhom}/${ten}.png`;

/** Ảnh của riêng một món đồ (dùng để bày trong tiệm và tủ đồ). */
export const duongDo = (khoa) => P(monCua(khoa)?.o || 'ao', khoa);

/**
 * Danh sách lớp theo ĐÚNG thứ tự vẽ, từ trong ra ngoài.
 * Thứ tự này là của chính bộ sprite (xem info.txt của pack): người → mắt →
 * quần áo → tóc → râu → phụ kiện. Mũ phải sau tóc chứ không thì tóc trùm lên mũ.
 */
export function cacLop(nv = nguoi(), mac = dangMac()) {
  const ra = [P('nguoi', `tong${tepDa(nv.da)}`)];
  if (nv.mat) ra.push(P('mat', nv.mat));
  if (nv.maHong) ra.push(P('mahong', nv.maHong));
  if (nv.sonMoi) ra.push(P('sonmoi', nv.sonMoi));
  for (const o of O_DO) {
    const khoa = mac[o.id];
    if (khoa && monCua(khoa)) ra.push(P(o.id, khoa));
  }
  if (nv.tocKieu) ra.push(P('toc', `${nv.tocKieu}_${nv.tocMau}`));
  if (nv.rau) ra.push(P('rau', nv.rau));
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
    // Mấy chỗ bày ảnh đại diện gọi lấy địa chỉ NGAY lúc vẽ, mà lúc đó sprite
    // chưa nướng xong nên phải lùi về tranh cũ. Nướng xong thì báo cho màn
    // hình vẽ lại, không thì phải đổi màn mới thấy đúng mặt mình.
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('look-change'));
    }
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
// biết nó ra sao. Mấy hàm dưới cắt đúng KHUNG ĐỨNG NHÌN THẲNG của các lớp bằng
// CSS (ảnh to hơn khung, kéo lệch cho lộ đúng ô cần) — rẻ hơn hẳn so với dựng
// một cái canvas cho mỗi món.
//
// Đo trên chính bộ ảnh đã cắt (mọi lớp gộp lại): dính pixel ở dòng 8..31, cột
// 7..24. Người 12..31, tóc 9..31, mũ 8..19, mắt 20..21, râu 21..25.
// Khung phải trùm từ dòng 7 chứ cắt sát là mũ cao cụt mất nóc.
export const VUNG_NGUOI = { x: 6, y: 7, w: 20, h: 25 };
export const VUNG_DAU = { x: 6, y: 7, w: 20, h: 18 };
// Khung hẹp hơn cho mấy ô chọn tóc/râu/mắt: khung trên lấy tới ngực, bày trong
// ô chọn thì cái đầu bé tí, nhìn không ra kiểu gì.
export const VUNG_MAT = { x: 8, y: 8, w: 16, h: 18 };

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

const lopNen = (nv) => [P('nguoi', `tong${tepDa(nv.da)}`), 'lop-nen'];

/** Một món đồ, khoác lên thân người mờ làm ma-nơ-canh cho dễ hình dung. */
export function oMonDo(khoa, { cao = 96, nv = nguoi() } = {}) {
  const d = monCua(khoa);
  if (!d) return '';
  const tren = d.o === 'mu' || d.o === 'kinh' || d.o === 'khuyen' || d.o === 'matna';
  return oLop([lopNen(nv), [P(d.o, khoa), '']],
    { cao, vung: tren ? VUNG_DAU : VUNG_NGUOI, cls: 'do-o' });
}

/** Một phần ngoại hình (tóc, râu, mắt...) đặt trên đầu người mờ. */
export function oPhanDau(nhom, ten, { cao = 64, nv = nguoi() } = {}) {
  const ds = [lopNen(nv)];
  if (ten) ds.push([P(nhom, ten), '']);
  return oLop(ds, { cao, vung: VUNG_MAT, cls: 'do-o' });
}

/**
 * Nhân vật ĐẦY ĐỦ ở khung đứng nhìn thẳng, không làm mờ lớp nào. Khác `oBoDo`
 * đúng chỗ đó: thẻ chọn bộ đồ thì làm mờ người đi cho bộ đồ nổi lên, còn thẻ
 * chọn giới tính phải thấy nguyên cả con người.
 */
export function oNguoiDu(nv = nguoi(), mac = dangMac(), { cao = 128 } = {}) {
  return oLop(cacLop(nv, mac).map(p => [p, '']), { cao, cls: 'do-o' });
}

/** Cả một bộ đồ mẫu khoác lên người, dùng cho thẻ chọn bộ lúc tạo nhân vật. */
export function oBoDo(ds, { cao = 96, nv = nguoi() } = {}) {
  const lop = [lopNen(nv)];
  for (const o of O_DO) {
    const khoa = ds.find(x => monCua(x)?.o === o.id);
    if (khoa) lop.push([P(o.id, khoa), '']);
  }
  return oLop(lop, { cao, cls: 'do-o' });
}

// ==== Tủ đồ ====
export function coDo(khoa) {
  return tuDo().includes(khoa);
}

export function themDo(khoa) {
  const L = look();
  if (!monCua(khoa) || L.tuDo.includes(khoa)) return false;
  L.tuDo.push(khoa);
  save();
  return true;
}

/** Mặc một món. Trả [lời nhắn, lỗi]. */
export function mac(khoa) {
  const d = monCua(khoa);
  const L = look();
  if (!d) return [null, 'Không có món này.'];
  if (!L.tuDo.includes(khoa)) return [null, 'Chưa có món này trong tủ.'];
  L.mac[d.o] = khoa;
  save();
  return [`Đã mặc ${d.name}.`, null];
}

export function coi(o) {
  const L = look();
  if (!L.mac[o]) return [null, 'Ô này đang trống.'];
  const ten = monCua(L.mac[o])?.name || 'món đồ';
  L.mac[o] = null;
  save();
  return [`Đã cởi ${ten}.`, null];
}

/** Mặc trọn một bộ mẫu (dùng lúc tạo nhân vật). */
export function macBoMau(so) {
  const L = look();
  const ds = monBoMau(so);
  for (const khoa of ds) {
    if (!L.tuDo.includes(khoa)) L.tuDo.push(khoa);
    const d = monCua(khoa);
    if (d) L.mac[d.o] = khoa;
  }
  save();
  return ds;
}

/** Đổi giới tính. Bộ này chung một thân nên đồ đang mặc không phải cởi ra. */
export function doiGioi(gioi) {
  const L = look();
  L.nv.gioi = GIOI.some(g => g.id === gioi) ? gioi : 'nam';
  // Kiểu tóc chỉ dành cho giới kia thì kéo về kiểu đầu của giới mới
  const ds = tocTheoGioi(L.nv.gioi);
  if (!ds.some(t => t.id === L.nv.tocKieu)) L.nv.tocKieu = ds[0]?.id || '';
  save();
}
