// TuxeWorld H5 | engine/casinogame.js | Luật của từng trò trong sòng bài
//
// Chỉ là LUẬT — không đụng tới giao diện, không tự trừ tiền. Màn chơi gọi
// engine/casino.js để đặt cược và kết toán, còn chỗ này lo chia bài, tính điểm
// và nước đi của máy. Tách ra thế thì test bằng node được, không cần trình
// duyệt.
import { boBai, xao, tenLa } from './casino.js';

// ==== Máy quay (slots) ====
//
// Bảng trả thưởng tính ra kỳ vọng ~92% tiền cược: đủ để thỉnh thoảng trúng cho
// vui nhưng về lâu dài vẫn lỗ, đúng kiểu máy quay. Không đặt >100% được, không
// thì cứ ngồi quay là giàu.
export const O_QUAY = [
  { id: 'cherry', ten: 'Anh Đào', trong: 8 },
  { id: 'chuong', ten: 'Chuông', trong: 6 },
  { id: 'chanh', ten: 'Chanh', trong: 6 },
  { id: 'ngoc', ten: 'Ngọc', trong: 4 },
  { id: 'vuong', ten: 'Vương Miện', trong: 3 },
  { id: 'bay', ten: 'Số Bảy', trong: 1 },
];

// Ba lá giống nhau ăn bao nhiêu lần tiền cược
export const THUONG_BA = {
  cherry: 4, chuong: 6, chanh: 6, ngoc: 12, vuong: 25, bay: 60,
};
export const THUONG_HAI = 1;      // hai ô giống nhau: hoàn lại tiền cược

const TONG_TRONG = O_QUAY.reduce((a, o) => a + o.trong, 0);

function motO(rnd) {
  let x = rnd() * TONG_TRONG;
  for (const o of O_QUAY) {
    x -= o.trong;
    if (x < 0) return o.id;
  }
  return O_QUAY[O_QUAY.length - 1].id;
}

/**
 * Quay ba ô. Trả { o: [id,id,id], he: số lần cược ăn được, ten }.
 */
export function quay(rnd = Math.random) {
  const o = [motO(rnd), motO(rnd), motO(rnd)];
  let he = 0;
  let ten = 'Trượt';
  if (o[0] === o[1] && o[1] === o[2]) {
    he = THUONG_BA[o[0]];
    ten = `Ba ${O_QUAY.find(x => x.id === o[0]).ten}!`;
  } else if (o[0] === o[1] || o[1] === o[2] || o[0] === o[2]) {
    he = THUONG_HAI;
    ten = 'Hai ô trùng — hoàn cược';
  }
  return { o, he, ten };
}

// ==== Sấp ngửa ====
export const MAT = [{ id: 'sap', ten: 'Sấp' }, { id: 'ngua', ten: 'Ngửa' }];

/** Tung đồng xu. Đoán trúng ăn gấp đôi (hệ số 2), trượt mất trắng. */
export function tung(chon, rnd = Math.random) {
  const ra = rnd() < 0.5 ? 'sap' : 'ngua';
  return { ra, trung: ra === chon, he: ra === chon ? 2 : 0 };
}

// ==== Xì dách (blackjack) ====
//
// Luật gọn theo kiểu sòng: người chơi rút tới khi dừng, nhà cái phải rút tới
// 17. Xì dách (A + lá 10 điểm ngay từ đầu) ăn 2,5 lần cược.
export const DIEM_LA = (l) => (l.so >= 10 ? 10 : l.so);

/** Điểm của một tay bài; A tính 11 nếu không quắc, không thì tính 1. */
export function diem(tay) {
  let d = 0;
  let ace = 0;
  for (const l of tay) {
    if (l.so === 1) { ace += 1; d += 11; } else d += DIEM_LA(l);
  }
  while (d > 21 && ace > 0) { d -= 10; ace -= 1; }
  return d;
}

export const quac = (tay) => diem(tay) > 21;
export const xiDach = (tay) => tay.length === 2 && diem(tay) === 21;

/** Ván mới: chia 2 lá cho người, 2 lá cho nhà cái (lá 2 của nhà úp). */
export function chiaXiDach(rnd = Math.random) {
  const nọc = xao(boBai(), rnd);
  return {
    noc: nọc.slice(4),
    nguoi: [nọc[0], nọc[2]],
    nha: [nọc[1], nọc[3]],
    xong: false,
  };
}

export function rut(v) {
  if (v.xong || !v.noc.length) return v;
  v.nguoi = v.nguoi.concat([v.noc[0]]);
  v.noc = v.noc.slice(1);
  if (quac(v.nguoi)) v.xong = true;
  return v;
}

/** Người chơi dừng: nhà cái lật bài và rút tới khi đủ 17. */
export function nhaRut(v) {
  while (diem(v.nha) < 17 && v.noc.length) {
    v.nha = v.nha.concat([v.noc[0]]);
    v.noc = v.noc.slice(1);
  }
  v.xong = true;
  return v;
}

/**
 * Chốt ván. Trả { ket: 'thang'|'thua'|'hoa'|'xidach', he } — `he` là số lần
 * tiền cược nhận lại (0 = mất trắng, 1 = hoà, 2 = thắng, 2.5 = xì dách).
 */
export function xuXiDach(v) {
  const dn = diem(v.nguoi);
  const dh = diem(v.nha);
  const xn = xiDach(v.nguoi);
  const xh = xiDach(v.nha);
  if (xn && xh) return { ket: 'hoa', he: 1 };
  if (xn) return { ket: 'xidach', he: 2.5 };
  if (xh) return { ket: 'thua', he: 0 };
  if (dn > 21) return { ket: 'thua', he: 0 };
  if (dh > 21) return { ket: 'thang', he: 2 };
  if (dn > dh) return { ket: 'thang', he: 2 };
  if (dn < dh) return { ket: 'thua', he: 0 };
  return { ket: 'hoa', he: 1 };
}

// ==== Đô-mi-nô ====
//
// Kiểu chặn (block game) hai người, bộ đôi-sáu 28 quân: chia mỗi bên 7 quân,
// còn lại làm nọc. Nối được thì nối, không thì bốc; nọc hết mà vẫn tắc thì
// bỏ lượt. Hết bài trước là thắng; hai bên cùng tắc thì ai còn ít nút hơn thắng.
export function boDomino() {
  const ra = [];
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) ra.push([a, b]);
  return ra;
}

export const nutQuan = (q) => q[0] + q[1];
export const tongNut = (tay) => tay.reduce((s, q) => s + nutQuan(q), 0);

export function chiaDomino(rnd = Math.random) {
  const bo = xao(boDomino(), rnd);
  return {
    nguoi: bo.slice(0, 7),
    may: bo.slice(7, 14),
    noc: bo.slice(14),
    day: [],                 // dãy đã đánh, [trái ... phải]
    luot: 'nguoi',
    xong: false,
    ket: null,
  };
}

export const dauTrai = (v) => (v.day.length ? v.day[0][0] : null);
export const dauPhai = (v) => (v.day.length ? v.day[v.day.length - 1][1] : null);

/** Quân này đặt được ở đầu nào? Trả mảng 'trai' / 'phai'. */
export function datDuoc(v, q) {
  if (!v.day.length) return ['phai'];
  const ra = [];
  if (q[0] === dauTrai(v) || q[1] === dauTrai(v)) ra.push('trai');
  if (q[0] === dauPhai(v) || q[1] === dauPhai(v)) ra.push('phai');
  return ra;
}

export const conNuocDi = (v, tay) => tay.some(q => datDuoc(v, q).length > 0);

/** Đặt quân thứ `i` của tay `ai` xuống đầu `ben`. */
export function danhDomino(v, ai, i, ben) {
  const tay = v[ai];
  const q = tay[i];
  if (!q) return [v, 'Không có quân đó.'];
  const duoc = datDuoc(v, q);
  if (!duoc.includes(ben)) return [v, 'Quân này không nối được vào đầu đó.'];
  // Xoay quân cho khớp đầu đang nối
  let dat = q.slice();
  if (ben === 'trai') {
    if (dat[1] !== dauTrai(v)) dat = [dat[1], dat[0]];
    v.day = [dat].concat(v.day);
  } else if (v.day.length) {
    if (dat[0] !== dauPhai(v)) dat = [dat[1], dat[0]];
    v.day = v.day.concat([dat]);
  } else {
    v.day = [dat];
  }
  v[ai] = tay.filter((_, k) => k !== i);
  return [v, null];
}

/** Bốc một quân từ nọc. Trả quân bốc được, hoặc null nếu hết nọc. */
export function bocDomino(v, ai) {
  if (!v.noc.length) return null;
  const q = v.noc[0];
  v.noc = v.noc.slice(1);
  v[ai] = v[ai].concat([q]);
  return q;
}

/** Máy đi một nước: bốc tới khi có nước, rồi đánh quân nhiều nút nhất. */
export function mayDiDomino(v) {
  while (!conNuocDi(v, v.may) && v.noc.length) bocDomino(v, 'may');
  if (!conNuocDi(v, v.may)) return { bo: true };
  let tot = -1;
  let nut = -1;
  for (let i = 0; i < v.may.length; i++) {
    if (datDuoc(v, v.may[i]).length && nutQuan(v.may[i]) > nut) {
      nut = nutQuan(v.may[i]);
      tot = i;
    }
  }
  const q = v.may[tot];
  const ben = datDuoc(v, q)[0];
  danhDomino(v, 'may', tot, ben);
  return { bo: false, quan: q, ben };
}

/** Ván xong chưa? Đặt v.ket = 'nguoi' | 'may' | 'hoa'. */
export function xetDomino(v) {
  if (!v.nguoi.length) { v.xong = true; v.ket = 'nguoi'; return v; }
  if (!v.may.length) { v.xong = true; v.ket = 'may'; return v; }
  const tacCa = !v.noc.length
    && !conNuocDi(v, v.nguoi) && !conNuocDi(v, v.may);
  if (tacCa) {
    v.xong = true;
    const a = tongNut(v.nguoi);
    const b = tongNut(v.may);
    v.ket = a < b ? 'nguoi' : b < a ? 'may' : 'hoa';
  }
  return v;
}

/** Hệ số nhận lại: thắng ăn gấp đôi, hoà hoàn cược. */
export const heDomino = (ket) => (ket === 'nguoi' ? 2 : ket === 'hoa' ? 1 : 0);

export const tenQuan = (q) => `${q[0]}|${q[1]}`;
export { tenLa };
