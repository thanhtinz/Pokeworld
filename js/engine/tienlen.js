// TuxeWorld H5 | engine/tienlen.js | Tiến Lên miền Nam — luật + máy đánh
//
// Bốn nhà, mỗi nhà 13 lá, đánh hết bài trước là nhất. Chỉ có LUẬT ở đây, không
// đụng giao diện.
//
// Thứ tự lá: 3 nhỏ nhất, 2 (heo) lớn nhất. Cùng số thì so chất
// bích < chuồn < rô < cơ. Nên quy tất cả về một con số HẠNG để so cho gọn.
import { boBai, xao, tenLa, CHAT_KY } from './casino.js';

// 3,4,...,K,A,2  -> 0..12
const BAC = { 3: 0, 4: 1, 5: 2, 6: 3, 7: 4, 8: 5, 9: 6, 10: 7, 11: 8, 12: 9, 13: 10, 1: 11, 2: 12 };
const CHAT_BAC = { bich: 0, chuon: 1, ro: 2, co: 3 };

export const bac = (l) => BAC[l.so];
export const hang = (l) => bac(l) * 4 + CHAT_BAC[l.chat];
export const soSanh = (a, b) => hang(a) - hang(b);

export const LOAI = {
  RAC: 'rac', DOI: 'doi', BA: 'ba', SANH: 'sanh',
  TU_QUY: 'tuquy', BA_DOI_THONG: 'badoithong', BON_DOI_THONG: 'bondoithong',
};

const sapXep = (ds) => ds.slice().sort(soSanh);

/**
 * Bộ bài này là kiểu gì? Trả { loai, hang, dai } hoặc null nếu không hợp lệ.
 * `hang` = hạng của lá lớn nhất, dùng để so bộ cùng loại.
 */
export function xetBo(ds) {
  if (!ds || !ds.length) return null;
  const b = sapXep(ds);
  const n = b.length;
  const cuoi = b[n - 1];
  const cungSo = b.every(l => l.so === b[0].so);

  if (n === 1) return { loai: LOAI.RAC, hang: hang(cuoi), dai: 1 };
  if (n === 2 && cungSo) return { loai: LOAI.DOI, hang: hang(cuoi), dai: 2 };
  if (n === 3 && cungSo) return { loai: LOAI.BA, hang: hang(cuoi), dai: 3 };
  if (n === 4 && cungSo) return { loai: LOAI.TU_QUY, hang: hang(cuoi), dai: 4 };

  // Sảnh: >=3 lá, bậc liên tiếp, KHÔNG được có heo (2)
  if (n >= 3 && b.every(l => l.so !== 2)) {
    let lien = true;
    for (let i = 1; i < n; i++) if (bac(b[i]) !== bac(b[i - 1]) + 1) { lien = false; break; }
    if (lien) return { loai: LOAI.SANH, hang: hang(cuoi), dai: n };
  }

  // Đôi thông: 3 hoặc 4 đôi liên tiếp, cũng không được có heo
  if ((n === 6 || n === 8) && b.every(l => l.so !== 2)) {
    let ok = true;
    const doi = [];
    for (let i = 0; i < n; i += 2) {
      if (b[i].so !== b[i + 1].so) { ok = false; break; }
      doi.push(bac(b[i]));
    }
    if (ok) {
      for (let i = 1; i < doi.length; i++) if (doi[i] !== doi[i - 1] + 1) { ok = false; break; }
    }
    if (ok) {
      return { loai: n === 6 ? LOAI.BA_DOI_THONG : LOAI.BON_DOI_THONG,
        hang: hang(cuoi), dai: n };
    }
  }
  return null;
}

// Hàng "bom" chặt được heo. Ba đôi thông chặt heo lẻ; tứ quý và bốn đôi thông
// chặt được cả đôi heo.
const CHAT_HEO_LE = [LOAI.BA_DOI_THONG, LOAI.TU_QUY, LOAI.BON_DOI_THONG];
const CHAT_DOI_HEO = [LOAI.TU_QUY, LOAI.BON_DOI_THONG];

const laHeo = (bo, ds) => bo.loai === LOAI.RAC && ds[0].so === 2;
const laDoiHeo = (bo, ds) => bo.loai === LOAI.DOI && ds[0].so === 2;

/**
 * Bộ `ds` có chặt được bộ `truoc` đang trên bàn không?
 * @param {Array} ds bộ định đánh
 * @param {Array} truoc bộ đang chặn trên bàn (rỗng = được đánh gì cũng được)
 */
export function chatDuoc(ds, truoc) {
  const a = xetBo(ds);
  if (!a) return false;
  if (!truoc || !truoc.length) return true;
  const b = xetBo(truoc);
  if (!b) return true;

  // Hàng bom chặt heo
  if (laHeo(b, truoc) && CHAT_HEO_LE.includes(a.loai)) return true;
  if (laDoiHeo(b, truoc) && CHAT_DOI_HEO.includes(a.loai)) return true;
  // Bom to chặt bom nhỏ
  if (b.loai === LOAI.BA_DOI_THONG && CHAT_DOI_HEO.includes(a.loai)) return true;
  if (b.loai === LOAI.TU_QUY && a.loai === LOAI.BON_DOI_THONG) return true;

  if (a.loai !== b.loai) return false;
  if (a.dai !== b.dai) return false;
  return a.hang > b.hang;
}

/** Chia bài bốn nhà. Nhà nào có 3 bích thì đi trước. */
export function chia(rnd = Math.random) {
  const bo = xao(boBai(), rnd);
  const tay = [0, 1, 2, 3].map(i => sapXep(bo.slice(i * 13, i * 13 + 13)));
  let dau = 0;
  for (let i = 0; i < 4; i++) {
    if (tay[i].some(l => l.so === 3 && l.chat === 'bich')) dau = i;
  }
  return {
    tay,
    luot: dau,
    ban: [],            // bộ đang trên bàn
    chuBan: dau,        // ai đánh bộ đó
    bo: [false, false, false, false],   // ai đã bỏ lượt vòng này
    xong: [],           // thứ tự về nhất, nhì...
    dauVan: true,       // ván mới: bắt buộc bộ đầu phải có 3 bích
  };
}

const conBai = (v, i) => v.tay[i].length > 0;

/** Nhà kế tiếp còn bài và chưa bỏ lượt. */
function nhaKe(v) {
  for (let k = 1; k <= 4; k++) {
    const i = (v.luot + k) % 4;
    if (conBai(v, i) && !v.bo[i]) return i;
  }
  return v.luot;
}

/**
 * Đánh một bộ. `ds` là mảng lá (phải nằm trong tay người đó).
 * Trả [ván, lỗi].
 */
export function danh(v, ai, ds) {
  if (v.luot !== ai) return [v, 'Chưa tới lượt.'];
  if (!ds.length) return [v, 'Chưa chọn lá nào.'];
  const tay = v.tay[ai];
  const co = ds.every(l => tay.some(t => t.so === l.so && t.chat === l.chat));
  if (!co) return [v, 'Có lá không nằm trong bài của bạn.'];
  if (!xetBo(ds)) return [v, 'Mấy lá này không thành bộ.'];
  if (v.dauVan && !ds.some(l => l.so === 3 && l.chat === 'bich')) {
    return [v, 'Ván đầu phải đánh bộ có 3 bích.'];
  }
  if (!chatDuoc(ds, v.ban)) return [v, 'Bộ này không chặt được bài trên bàn.'];

  v.tay[ai] = tay.filter(t => !ds.some(l => l.so === t.so && l.chat === t.chat));
  v.ban = sapXep(ds);
  v.chuBan = ai;
  v.dauVan = false;
  if (!v.tay[ai].length && !v.xong.includes(ai)) v.xong.push(ai);
  v.luot = nhaKe(v);
  return [v, null];
}

/** Bỏ lượt. */
export function boLuot(v, ai) {
  if (v.luot !== ai) return [v, 'Chưa tới lượt.'];
  if (!v.ban.length) return [v, 'Đang được quyền đánh, không bỏ lượt được.'];
  v.bo[ai] = true;
  const ke = nhaKe(v);
  // Ba nhà kia bỏ hết -> chủ bàn được đánh mới
  const conLai = [0, 1, 2, 3].filter(i => conBai(v, i) && !v.bo[i]);
  if (conLai.length <= 1) {
    v.ban = [];
    v.bo = [false, false, false, false];
    v.luot = conLai.length ? conLai[0] : v.chuBan;
    if (!conBai(v, v.luot)) v.luot = nhaKe(v);
  } else {
    v.luot = ke;
  }
  return [v, null];
}

// ==== Máy đánh ====
// Không cần cao siêu: bám luật, ưu tiên đánh bộ nhỏ nhất chặt được, giữ heo và
// bom lại phòng thân. Đủ để người chơi không thấy máy đánh bậy.
function moiBo(tay) {
  const ra = [];
  const theoSo = {};
  for (const l of tay) (theoSo[l.so] = theoSo[l.so] || []).push(l);
  for (const l of tay) ra.push([l]);
  for (const ds of Object.values(theoSo)) {
    if (ds.length >= 2) ra.push(ds.slice(0, 2));
    if (ds.length >= 3) ra.push(ds.slice(0, 3));
    if (ds.length === 4) ra.push(ds.slice());
  }
  // sảnh: quét mọi đoạn liên tiếp từ bài đã sắp
  const b = sapXep(tay).filter(l => l.so !== 2);
  const rieng = [];
  for (const l of b) if (!rieng.some(x => bac(x) === bac(l))) rieng.push(l);
  for (let i = 0; i < rieng.length; i++) {
    for (let j = i + 2; j < rieng.length; j++) {
      const doan = rieng.slice(i, j + 1);
      let lien = true;
      for (let k = 1; k < doan.length; k++) {
        if (bac(doan[k]) !== bac(doan[k - 1]) + 1) { lien = false; break; }
      }
      if (lien) ra.push(doan);
      else break;
    }
  }
  return ra.filter(x => xetBo(x));
}

/**
 * Nước đi của máy. Trả mảng lá để đánh, hoặc [] nghĩa là bỏ lượt.
 */
export function mayDanh(v, ai) {
  const tay = v.tay[ai];
  let duoc = moiBo(tay).filter(ds => chatDuoc(ds, v.ban));
  if (v.dauVan) duoc = duoc.filter(ds => ds.some(l => l.so === 3 && l.chat === 'bich'));
  if (!duoc.length) return [];
  // Giữ bom lại nếu còn cách khác
  const thuong = duoc.filter(ds => {
    const b = xetBo(ds);
    return b.loai !== LOAI.TU_QUY && b.loai !== LOAI.BON_DOI_THONG
      && b.loai !== LOAI.BA_DOI_THONG;
  });
  const chon = thuong.length ? thuong : duoc;
  // Bộ dài trước (tống bài đi cho nhanh), cùng dài thì lấy bộ nhỏ nhất
  chon.sort((a, b) => (b.length - a.length) || (xetBo(a).hang - xetBo(b).hang));
  return chon[0];
}

/** Ván xong khi chỉ còn một nhà cầm bài. */
export function xong(v) {
  return [0, 1, 2, 3].filter(i => conBai(v, i)).length <= 1;
}

/** Hệ số nhận lại theo thứ hạng của người chơi (nhà 0). */
export const heTienLen = (thu) => [3, 1.5, 0, 0][thu] ?? 0;

export { tenLa, CHAT_KY };
