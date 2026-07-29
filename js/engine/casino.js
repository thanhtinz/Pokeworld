// TuxeWorld H5 | engine/casino.js | Sòng bài — phần chung của mọi trò
//
// CHỈ CHƠI BẰNG VÀNG TRONG GAME. Không có chỗ nào nạp tiền thật, không bán
// chip, không đổi vàng ra bất cứ thứ gì ngoài game. Đây là trò may rủi để tiêu
// vàng kiếm được, không phải cờ bạc ăn tiền.
//
// Vì thế mới có mấy cái hãm ở dưới:
//   · cược có mức trần, không cho dốc sạch ví trong một ván
//   · mỗi ngày thua quá NGUONG_NGAY là nghỉ, mai chơi tiếp
//   · luôn chừa lại VON_TOI_THIEU để người chơi không kẹt cứng không mua nổi
//     thuốc mà đi tiếp
import { G, save, addMoney } from '../state.js';

export const CUOC_MIN = 100;
export const CUOC_MAX = 5000;
export const NGUONG_NGAY = 20000;      // thua quá mức này thì nghỉ tới hôm sau
export const VON_TOI_THIEU = 200;      // giữ lại chừng này, không cho cược hết

export const TRO = [
  { id: 'slots', ten: 'Máy Quay', mo: 'Ba ô quay, ra ba hình giống nhau thì ăn đậm.' },
  { id: 'coinflip', ten: 'Sấp Ngửa', mo: 'Chọn mặt đồng xu, đoán trúng ăn gấp đôi.' },
  { id: 'blackjack', ten: 'Xì Dách', mo: 'Rút tới gần 21 nhất mà không quá.' },
  { id: 'domino', ten: 'Đô-mi-nô', mo: 'Nối quân cùng số, hết bài trước thì thắng.' },
  { id: 'tienlen', ten: 'Tiến Lên', mo: 'Đánh hết bài trước ba nhà kia.' },
];

export const TRO_BY_ID = Object.fromEntries(TRO.map(t => [t.id, t]));

// ==== Sổ sách ====
function homNay() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function so() {
  if (!G.p) return { ngay: homNay(), thua: 0, van: 0, an: 0, mat: 0 };
  if (!G.p.casino || typeof G.p.casino !== 'object') G.p.casino = {};
  const c = G.p.casino;
  if (c.ngay !== homNay()) {          // sang ngày mới thì mở lại
    c.ngay = homNay();
    c.thua = 0;
  }
  c.thua = Number(c.thua) || 0;
  c.van = Number(c.van) || 0;
  c.an = Number(c.an) || 0;
  c.mat = Number(c.mat) || 0;
  return c;
}

/** Còn được chơi không, kèm lý do nếu không. */
export function choiDuoc() {
  const c = so();
  if (c.thua >= NGUONG_NGAY) {
    return [false, `Hôm nay thua ${c.thua.toLocaleString('vi-VN')} rồi, nghỉ đi. Mai quay lại.`];
  }
  if ((G.p?.money || 0) < CUOC_MIN + VON_TOI_THIEU) {
    return [false, 'Không đủ vàng để cược. Đi kiếm thêm đã.'];
  }
  return [true, null];
}

/** Mức cược cao nhất được phép lúc này. */
export function cuocToiDa() {
  const con = (G.p?.money || 0) - VON_TOI_THIEU;
  const conNgay = NGUONG_NGAY - so().thua;
  return Math.max(0, Math.min(CUOC_MAX, con, conNgay));
}

export function cuocHopLe(n) {
  const x = Math.floor(Number(n) || 0);
  if (x < CUOC_MIN) return [0, `Cược tối thiểu ${CUOC_MIN.toLocaleString('vi-VN')} vàng.`];
  const max = cuocToiDa();
  if (x > max) return [0, `Cược tối đa lúc này là ${max.toLocaleString('vi-VN')} vàng.`];
  return [x, null];
}

/**
 * Trừ tiền cược lúc bắt đầu ván. Trả [ok, lỗi].
 * Mọi trò đều phải gọi cái này TRƯỚC, rồi mới chia bài / quay.
 */
export function datCuoc(n) {
  const [ok, err] = choiDuoc();
  if (!ok) return [0, err];
  const [x, e2] = cuocHopLe(n);
  if (e2) return [0, e2];
  addMoney(-x);
  const c = so();
  c.van += 1;
  save();
  return [x, null];
}

/**
 * Chốt ván: `nhan` là số vàng nhận lại (0 = mất trắng, = cược là hoà,
 * > cược là thắng). Trả về lãi/lỗ ròng của ván.
 */
export function ketToan(cuoc, nhan) {
  const c = so();
  const lai = Math.floor(nhan) - Math.floor(cuoc);
  if (nhan > 0) addMoney(Math.floor(nhan));
  if (lai > 0) c.an += lai;
  else if (lai < 0) {
    c.mat += -lai;
    c.thua += -lai;
  }
  save();
  return lai;
}

// ==== Bộ bài tây ====
export const CHAT = ['bich', 'chuon', 'ro', 'co'];       // ♠ ♣ ♦ ♥
export const CHAT_KY = { bich: '♠', chuon: '♣', ro: '♦', co: '♥' };
export const CHAT_TEN = { bich: 'Bích', chuon: 'Chuồn', ro: 'Rô', co: 'Cơ' };
export const SO_TEN = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };

export const tenLa = (l) => `${SO_TEN[l.so] || l.so}${CHAT_KY[l.chat]}`;
export const doLa = (l) => l.chat === 'ro' || l.chat === 'co';

/** Bộ 52 lá. */
export function boBai() {
  const ra = [];
  for (const chat of CHAT) {
    for (let so = 1; so <= 13; so++) ra.push({ so, chat });
  }
  return ra;
}

/** Xáo Fisher–Yates. `rnd` cho test bơm số ngẫu nhiên cố định vào. */
export function xao(ds, rnd = Math.random) {
  const a = ds.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
