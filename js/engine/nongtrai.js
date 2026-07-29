// TuxeWorld H5 | engine/nongtrai.js | Nông trại: trồng trọt, nuôi thú, đơn hàng
//
// Đây là tính năng của riêng bản này, không có trong Tuxemon. Art cắt từ pack
// "Cozy Farm" (tools/mknongtrai.py), bản đồ do tools/nongtrai.py dựng.
//
// Cách chơi:
//   1. Đi hết ngõ phía bắc Khu Dân Cư là tới Nông Trại Bờ Suối.
//   2. Kê ruộng ra chỗ nào cũng được, rồi đứng trước ô ruộng bấm A để gieo.
//   3. CÂY CHỈ LỚN KHI ĐẤT CÒN ƯỚT — gieo xong phải tưới, mỗi lần tưới đủ cho
//      đúng một giai đoạn. Bỏ bê thì cây đứng nguyên đó chờ.
//   4. Chín thì bấm A để thu, nông sản vào kho nông trại.
//   5. Mua thú ở chỗ bác Nông. Thú phải CHO ĂN cỏ khô mới ra lứa sản phẩm sau.
//   6. Kê máy chế biến rồi bỏ nguyên liệu vào: sữa ra bơ với phô mai, len ra
//      sợi rồi ra vải. Món chế biến đắt hơn hẳn nguyên liệu thô.
//   7. Dân làng dán đơn ở bảng đơn hàng: gom đủ món thì giao, lấy tiền + điểm.
//
// Mọi mốc thời gian là THỜI GIAN THẬT (Date.now), tắt game cây vẫn lớn — giống
// hệt cách nhà đang xây bên engine/estate.js đếm giờ.
import { G, save, addMoney } from '../state.js';
import { CAY, CAY_BY_ID, THU, THU_BY_ID, MON, MON_BY_ID, VAT_THE, VAT_BY_ID,
  MAY, MAY_BY_ID, CONG_THUC, congThucCua,
  GIAI_DOAN, GIA_CO_KHO, SUC_CHUA_GOC } from '../data/nongtrai.js';
import { NONG_TRAI_MAP, VUNG, CAM, MAC_DINH, BAC_NONG, BANG_DON } from '../data/nongtraimap.js';

export { CAY, CAY_BY_ID, THU, THU_BY_ID, MON, MON_BY_ID, VAT_THE, VAT_BY_ID,
  MAY, MAY_BY_ID, CONG_THUC, congThucCua,
  GIAI_DOAN, GIA_CO_KHO, NONG_TRAI_MAP, VUNG, CAM, BAC_NONG, BANG_DON };

const PHUT = 60000;
export const CHIN = GIAI_DOAN - 1;      // giai đoạn cuối là lúc chín
export const DON_TOI_DA = 3;            // bảng dán được nhiều nhất bấy nhiêu đơn
export const PHUT_RA_DON = 12;          // bao lâu thì dán thêm một đơn mới

// ==== Chỗ cất trong bản lưu ====
export function nt() {
  if (!G.p) return { o: [], thu: [], kho: {}, don: [], diem: 0 };
  if (!G.p.nt || typeof G.p.nt !== 'object') G.p.nt = {};
  const n = G.p.nt;
  // Nông trại mới thì kê sẵn một luống ruộng với cái chuồng gà cho khỏi bỡ ngỡ
  if (!Array.isArray(n.o)) n.o = MAC_DINH.map(m => ({ ...m }));
  if (!Array.isArray(n.thu)) n.thu = [];
  if (!n.kho || typeof n.kho !== 'object') n.kho = {};
  if (!Array.isArray(n.don)) n.don = [];
  if (typeof n.diem !== 'number') n.diem = 0;
  if (typeof n.donLuc !== 'number') n.donLuc = 0;
  // Bản lưu cũ có thể lẫn mã không còn tồn tại — bỏ đi còn hơn vẽ ra ô trống
  n.o = n.o.filter(o => VAT_BY_ID[o.id]);
  n.thu = n.thu.filter(t => THU_BY_ID[t.id]);
  return n;
}

export const oRuong = () => nt().o.filter(o => VAT_BY_ID[o.id]?.loai === 'ruong');
export const cacMay = () => nt().o.filter(o => VAT_BY_ID[o.id]?.loai === 'may');
export const danhSachThu = () => nt().thu;

/** Nuôi được nhiều nhất bao nhiêu con: mỗi cái chuồng cộng thêm một ít. */
export function sucChua() {
  return nt().o.reduce((a, o) => a + (VAT_BY_ID[o.id]?.chua || 0), SUC_CHUA_GOC);
}

// ==== Kho nông sản ====
export const kho = () => nt().kho;
export const co = (id) => kho()[id] || 0;

export function them(id, n = 1) {
  const k = kho();
  k[id] = (k[id] || 0) + n;
  save();
  return k[id];
}

export function bot(id, n = 1) {
  const k = kho();
  if ((k[id] || 0) < n) return false;
  k[id] -= n;
  if (k[id] <= 0) delete k[id];
  save();
  return true;
}

// ==== Ô ruộng: gieo, tưới, thu ====

/** Ô ruộng nằm ở đúng toạ độ này (nếu có). */
export const oTaiO = (x, y) => nt().o.find(o => {
  const v = VAT_BY_ID[o.id];
  return v && x >= o.x && x < o.x + v.w && y >= o.y && y < o.y + v.h;
}) || null;

/**
 * Dồn tiến độ lớn của một ô ruộng tới thời điểm hiện tại.
 *
 * Tiến độ chỉ chạy trong lúc ĐẤT CÒN ƯỚT, nên cây bỏ bê thì đứng nguyên. Cất
 * bằng tổng số mili-giây đã ướt (`tienDo`) chứ không cất "giai đoạn": có thế
 * thì đổi bảng cây trong data mới không làm sai cây đang trồng dở.
 */
export function donTienDo(o, gio = Date.now()) {
  if (!o?.cay) return o;
  const den = Math.min(gio, o.uotDen || 0);
  const tu = o.moc || 0;
  if (den > tu) o.tienDo = (o.tienDo || 0) + (den - tu);
  o.moc = gio;
  return o;
}

/** Giai đoạn hiện tại (0 = vừa gieo, CHIN = chín). */
export function giaiDoan(o, gio = Date.now()) {
  if (!o?.cay) return -1;
  const c = CAY_BY_ID[o.cay];
  if (!c) return -1;
  donTienDo(o, gio);
  return Math.min(CHIN, Math.floor((o.tienDo || 0) / (c.phut * PHUT)));
}

export const dangUot = (o, gio = Date.now()) => !!o?.cay && (o.uotDen || 0) > gio;
export const daChin = (o, gio = Date.now()) => giaiDoan(o, gio) >= CHIN;

/** Còn bao lâu nữa thì lên giai đoạn sau — chưa tưới thì trả null. */
export function conLaiMs(o, gio = Date.now()) {
  if (!o?.cay || daChin(o, gio)) return 0;
  if (!dangUot(o, gio)) return null;
  const c = CAY_BY_ID[o.cay];
  const moc = (giaiDoan(o, gio) + 1) * c.phut * PHUT;
  return Math.max(0, moc - (o.tienDo || 0));
}

export function conLaiChu(o) {
  const ms = conLaiMs(o);
  if (ms === null) return 'khát nước';
  if (ms <= 0) return 'chín rồi';
  const p = Math.ceil(ms / PHUT);
  return p < 60 ? `${p} phút nữa` : `${Math.floor(p / 60)} giờ ${p % 60} phút nữa`;
}

/** Gieo hạt. Trả [lời nhắn, lỗi]. */
export function gieo(o, cayId) {
  const c = CAY_BY_ID[cayId];
  if (!o || VAT_BY_ID[o.id]?.loai !== 'ruong') return [null, 'Chỗ này không phải ruộng.'];
  if (o.cay) return [null, 'Ô này đang có cây rồi.'];
  if (!c) return [null, 'Không có loại hạt này.'];
  if (!bot(`hat_${cayId}`)) return [null, `Hết hạt ${c.name} rồi.`];
  o.cay = cayId;
  o.tienDo = 0;
  o.moc = Date.now();
  o.uotDen = 0;
  save();
  return [`Đã gieo ${c.name} — nhớ tưới.`, null];
}

/** Tưới một ô: đủ nước cho đúng một giai đoạn. */
export function tuoi(o, gio = Date.now()) {
  if (!o?.cay) return [null, 'Ô này chưa gieo gì.'];
  if (daChin(o, gio)) return [null, 'Cây chín rồi, thu đi chứ tưới gì nữa.'];
  if (dangUot(o, gio)) return [null, 'Đất còn ướt mà.'];
  const c = CAY_BY_ID[o.cay];
  donTienDo(o, gio);
  o.uotDen = gio + c.phut * PHUT;
  save();
  return [`Tưới xong ${c.name}.`, null];
}

/** Tưới hết mọi ô đang khát — đỡ phải chạy từng ô một. */
export function tuoiHet(gio = Date.now()) {
  let n = 0;
  for (const o of oRuong()) {
    if (o.cay && !dangUot(o, gio) && !daChin(o, gio)) { tuoi(o, gio); n += 1; }
  }
  return n;
}

/** Thu hoạch. Trả [{id, n}, lỗi]. */
export function thu(o, gio = Date.now(), rnd = Math.random) {
  if (!o?.cay) return [null, 'Ô này chưa gieo gì.'];
  if (!daChin(o, gio)) return [null, 'Cây chưa chín.'];
  const id = o.cay;
  const n = 1 + Math.floor(rnd() * 3);        // mỗi ô ra 1-3 quả
  them(id, n);
  o.cay = null;
  o.tienDo = 0;
  o.uotDen = 0;
  o.moc = gio;
  save();
  return [{ id, n }, null];
}

// ==== Con vật ====

/** Con vật đứng ở ô này (nếu có). */
export const thuTaiO = (x, y) => nt().thu.find(t => t.x === x && t.y === y) || null;

/**
 * Chỗ thả một con vật mới mua: quét từ giữa nông trại ra, lấy ô đầu tiên không
 * vướng gì. Thả bừa vào ô cấm thì con vật đứng chồng lên lối đi hoặc lên NPC.
 */
export function choTrongCho() {
  const co_ = (x, y) => !CAM.has(`${x},${y}`) && !oTaiO(x, y) && !thuTaiO(x, y);
  const gx = Math.floor((VUNG.x0 + VUNG.x1) / 2);
  const gy = Math.floor((VUNG.y0 + VUNG.y1) / 2);
  for (let r = 0; r <= Math.max(VUNG.x1 - VUNG.x0, VUNG.y1 - VUNG.y0); r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = gx + dx;
        const y = gy + dy;
        if (x < VUNG.x0 || x > VUNG.x1 || y < VUNG.y0 || y > VUNG.y1) continue;
        if (co_(x, y)) return { x, y };
      }
    }
  }
  return { x: gx, y: gy };
}

export function muaThu(id, x, y) {
  const t = THU_BY_ID[id];
  const n = nt();
  if (!t) return [null, 'Không có con này.'];
  if (n.thu.length >= sucChua()) {
    return [null, `Chuồng đầy rồi — đang nuôi ${n.thu.length}/${sucChua()} con. Kê thêm chuồng đi.`];
  }
  if ((G.p.money || 0) < t.gia) return [null, `Cần ${t.gia} để mua ${t.name}.`];
  addMoney(-t.gia);
  n.thu.push({ id, x, y, sanLuc: 0, dir: 'down' });
  save();
  return [t, null];
}

export const sanSang = (con, gio = Date.now()) => !!con?.sanLuc && gio >= con.sanLuc;
export const dangDoi = (con, gio = Date.now()) => !!con?.sanLuc && gio < con.sanLuc;

/** Cho ăn một bó cỏ khô; ăn xong thì hẹn giờ ra lứa sản phẩm. */
export function choAn(con, gio = Date.now()) {
  const t = THU_BY_ID[con?.id];
  if (!t) return [null, 'Không có con này.'];
  if (dangDoi(con, gio)) return [null, `${t.name} đang no, chưa đói đâu.`];
  if (sanSang(con, gio)) return [null, `${t.name} có sẵn ${MON_BY_ID[t.sanPham]?.name} rồi, thu đi đã.`];
  if (!bot('co_kho', t.an || 1)) return [null, 'Hết cỏ khô rồi — mua ở chỗ bác Nông.'];
  con.sanLuc = gio + t.phut * PHUT;
  save();
  return [`${t.name} ăn xong rồi.`, null];
}

/** Thu sản phẩm của một con. */
export function thuThu(con, gio = Date.now()) {
  const t = THU_BY_ID[con?.id];
  if (!t) return [null, 'Không có con này.'];
  if (!con.sanLuc) return [null, `${t.name} đang đói, cho ăn đã.`];
  if (!sanSang(con, gio)) return [null, `${t.name} chưa ra lứa mới — ${conLaiThuChu(con, gio)}.`];
  them(t.sanPham, 1);
  con.sanLuc = 0;
  save();
  return [{ id: t.sanPham, n: 1 }, null];
}

export function conLaiThuChu(con, gio = Date.now()) {
  const ms = Math.max(0, (con?.sanLuc || 0) - gio);
  const p = Math.ceil(ms / PHUT);
  return p < 60 ? `${p} phút nữa` : `${Math.floor(p / 60)} giờ ${p % 60} phút nữa`;
}

// ==== Máy chế biến ====
//
// Khúc kiếm tiền thật của nông trại: thú cho ra nguyên liệu thô rẻ tiền, máy
// biến nó thành món đắt gấp mấy lần. Sữa → bơ / phô mai, len → sợi → vải.
// Giống chuỗi sản xuất của Hay Day, và cũng là lý do đáng mua chuồng to.

export const mayRanh = (m) => !m?.lam;
export const mayXong = (m, gio = Date.now()) => !!m?.lam && gio >= (m.xongLuc || 0);
export const mayDangChay = (m, gio = Date.now()) => !!m?.lam && gio < (m.xongLuc || 0);

export function conLaiMayChu(m, gio = Date.now()) {
  const ms = Math.max(0, (m?.xongLuc || 0) - gio);
  const p = Math.ceil(ms / PHUT);
  return p < 60 ? `${p} phút nữa` : `${Math.floor(p / 60)} giờ ${p % 60} phút nữa`;
}

/** Công thức đang chạy trong máy (nếu có). */
export const congThucDangLam = (m) =>
  CONG_THUC.find(c => c.may === m?.id && c.ra === m?.lam) || null;

/** Bỏ nguyên liệu vào máy. `ra` là mã món muốn làm. Trả [lời nhắn, lỗi]. */
export function boVaoMay(m, raId) {
  const v = VAT_BY_ID[m?.id];
  if (!v || v.loai !== 'may') return [null, 'Chỗ này không phải máy.'];
  if (!mayRanh(m)) {
    return [null, mayXong(m) ? 'Máy có hàng rồi, lấy ra đã.'
      : `Máy đang chạy — ${conLaiMayChu(m)}.`];
  }
  const ct = CONG_THUC.find(c => c.may === m.id && c.ra === raId);
  if (!ct) return [null, 'Máy này không làm được món đó.'];
  if (co(ct.vao) < ct.soVao) {
    return [null, `Cần ${ct.soVao} ${MON_BY_ID[ct.vao]?.name} — trong kho mới có ${co(ct.vao)}.`];
  }
  bot(ct.vao, ct.soVao);
  m.lam = ct.ra;
  m.xongLuc = Date.now() + ct.phut * PHUT;
  save();
  return [`Máy chạy rồi — ${ct.phut} phút nữa có ${MON_BY_ID[ct.ra]?.name}.`, null];
}

/** Lấy hàng ra khỏi máy. Trả [{id, n}, lỗi]. */
export function layKhoiMay(m, gio = Date.now()) {
  if (!m?.lam) return [null, 'Máy đang rảnh.'];
  if (!mayXong(m, gio)) return [null, `Máy đang chạy — ${conLaiMayChu(m, gio)}.`];
  const id = m.lam;
  them(id, 1);
  m.lam = null;
  m.xongLuc = 0;
  save();
  return [{ id, n: 1 }, null];
}

// ==== Kê đồ trên nông trại ====

/**
 * Ô này kê được không: phải trong vùng cho phép, không đè lên lối đi / mặt nước
 * / chỗ người làm việc đứng (bảng CAM), và không đè lên món đã kê.
 */
export function keDuoc(id, x, y, boQua = null) {
  const v = VAT_BY_ID[id];
  if (!v) return false;
  if (x < VUNG.x0 || y < VUNG.y0 || x + v.w - 1 > VUNG.x1 || y + v.h - 1 > VUNG.y1) return false;
  for (let dy = 0; dy < v.h; dy++) {
    for (let dx = 0; dx < v.w; dx++) {
      if (CAM.has(`${x + dx},${y + dy}`)) return false;
      const o = oTaiO(x + dx, y + dy);
      if (o && o !== boQua) return false;
    }
  }
  return true;
}

// ==== Trang trí: mua ở chợ, kê NGAY TRÊN BẢN ĐỒ ====
//
// Mua xong thì món nằm "trên tay" (choKe), quay ra bản đồ đứng vào chỗ nào ưng
// thì bấm A đặt xuống. Làm màn kéo thả riêng thì lại thành một cái panel nữa,
// mà cả bố cục nông trại thì phải ngắm tận nơi mới biết kê vào đâu cho hợp.
export const choKe = () => nt().choKe || null;

/** Mua một món, món đó nằm trên tay chờ kê. Trả [món, lỗi]. */
export function mua(id) {
  const v = VAT_BY_ID[id];
  if (!v) return [null, 'Không có thứ này.'];
  if (choKe()) return [null, `Đang cầm ${VAT_BY_ID[choKe()]?.name} — kê xuống đã.`];
  if ((G.p.money || 0) < v.gia) return [null, `Cần ${v.gia} để làm ${v.name}.`];
  addMoney(-v.gia);
  nt().choKe = id;
  save();
  return [v, null];
}

/** Đặt món đang cầm xuống ô này. Trả [món, lỗi]. */
export function keTaiDay(x, y) {
  const id = choKe();
  if (!id) return [null, 'Trên tay không cầm gì cả.'];
  if (!keDuoc(id, x, y)) return [null, 'Chỗ này kê không vừa.'];
  const o = { id, x, y };
  const n = nt();
  n.o.push(o);
  n.choKe = null;
  save();
  return [o, null];
}

/** Nhấc một món đã kê lên tay để dời đi chỗ khác. */
export function nhac(o) {
  const n = nt();
  const i = n.o.indexOf(o);
  if (i < 0) return [null, 'Không thấy món này.'];
  if (choKe()) return [null, 'Đang cầm món khác rồi.'];
  if (o.cay) return [null, 'Nhổ hết cây đã rồi hẵng nhấc ruộng.'];
  if (o.lam) return [null, 'Máy đang có hàng trong bụng — lấy ra đã.'];
  n.o.splice(i, 1);
  n.choKe = o.id;
  save();
  return [VAT_BY_ID[o.id], null];
}

/** Bỏ món đang cầm, lấy lại nửa tiền. */
export function boMonDangCam() {
  const id = choKe();
  if (!id) return [null, 'Trên tay không cầm gì cả.'];
  const lai = Math.floor((VAT_BY_ID[id]?.gia || 0) / 2);
  nt().choKe = null;
  addMoney(lai);
  save();
  return [lai, null];
}

// ==== Chợ: mua hạt, cỏ khô; bán nông sản ====

/** Giá một gói hạt. Cất trong kho dưới mã `hat_<cây>`. */
export const maHat = (cayId) => `hat_${cayId}`;
export const laHat = (id) => String(id).startsWith('hat_');
export const cayCuaHat = (id) => CAY_BY_ID[String(id).slice(4)] || null;

export function muaHat(cayId, n = 1) {
  const c = CAY_BY_ID[cayId];
  if (!c) return [null, 'Không có loại hạt này.'];
  const gia = c.giaHat * n;
  if ((G.p.money || 0) < gia) return [null, `Cần ${gia} để mua ${n} gói.`];
  addMoney(-gia);
  them(maHat(cayId), n);
  return [gia, null];
}

export function muaCoKho(n = 1) {
  const gia = GIA_CO_KHO * n;
  if ((G.p.money || 0) < gia) return [null, `Cần ${gia} để mua ${n} bó cỏ.`];
  addMoney(-gia);
  them('co_kho', n);
  return [gia, null];
}

/** Bán nông sản trong kho. Hạt giống thì không mua lại. */
export function ban(id, n = 1) {
  const m = MON_BY_ID[id];
  if (!m) return [null, 'Bác Nông không mua thứ này.'];
  if (co(id) < n) return [null, 'Trong kho không đủ.'];
  bot(id, n);
  const tien = m.gia * n;
  addMoney(tien);
  return [tien, null];
}

export function banHet() {
  let tien = 0;
  for (const id of Object.keys(kho())) {
    if (!MON_BY_ID[id] || id === 'co_kho') continue;   // cỏ khô để nuôi, không bán
    const [t] = ban(id, co(id));
    tien += t || 0;
  }
  return tien;
}

// ==== Đơn hàng của dân làng ====
//
// Kiểu Hay Day: dân làng dán đơn lên bảng, mỗi đơn xin vài món. Gom đủ thì
// giao, lấy tiền cao hơn bán lẻ cho bác Nông cộng thêm điểm uy tín.

const TEN_KHACH = ['Cô Sáu', 'Chú Bảy', 'Bà Tư', 'Anh Hùng', 'Chị Lài', 'Thầy Đồ',
  'Bé Na', 'Ông Chín', 'Cô Mận', 'Chú Tám'];
// Đơn trả cao hơn giá lẻ bấy nhiêu lần — có thế mới bõ công gom hàng
export const HE_SO_DON = 1.6;

/** Món nào người chơi trồng/nuôi được thì mới đưa vào đơn. */
export function monLamDuoc() {
  const ds = new Set(oRuong().length ? CAY.map(c => c.id) : []);
  for (const t of nt().thu) {
    const sp = THU_BY_ID[t.id]?.sanPham;
    if (sp) ds.add(sp);
  }
  // Có máy nào thì dân làng biết mà đặt luôn món máy đó làm ra
  for (const m of cacMay()) {
    for (const c of congThucCua(m.id)) ds.add(c.ra);
  }
  // Chưa có gì thì vẫn cho mấy cây rẻ nhất, không thì bảng đơn trống trơn
  if (!ds.size) for (const c of CAY.slice(0, 3)) ds.add(c.id);
  return [...ds];
}

/** Dựng một đơn mới. `rnd` tách ra để test bấm được kết quả cố định. */
export function taoDon(rnd = Math.random, gio = Date.now()) {
  const nguon = monLamDuoc();
  if (!nguon.length) return null;
  const soMon = 1 + Math.floor(rnd() * Math.min(3, nguon.length));
  const chon = [];
  const con = [...nguon];
  for (let i = 0; i < soMon && con.length; i++) {
    const j = Math.floor(rnd() * con.length);
    const id = con.splice(j, 1)[0];
    chon.push({ id, n: 1 + Math.floor(rnd() * 4) });
  }
  const tien = Math.round(chon.reduce(
    (a, m) => a + (MON_BY_ID[m.id]?.gia || 0) * m.n, 0) * HE_SO_DON);
  return {
    ma: `d${gio}${Math.floor(rnd() * 1000)}`,
    khach: TEN_KHACH[Math.floor(rnd() * TEN_KHACH.length)],
    mon: chon,
    tien,
    diem: Math.max(1, Math.round(tien / 300)),
  };
}

/**
 * Dán thêm đơn cho đủ bảng. Gọi mỗi lần mở bảng hoặc bước vào nông trại.
 * Cứ PHUT_RA_DON phút mới ra thêm một đơn, nên không thể đứng bấm liên tục để
 * xin đơn mới cho tới lúc gặp đơn dễ.
 */
export function lamMoiDon(gio = Date.now(), rnd = Math.random) {
  const n = nt();
  if (n.don.length >= DON_TOI_DA) return 0;
  if (!n.donLuc) n.donLuc = gio - PHUT_RA_DON * PHUT;   // lần đầu thì dán ngay
  let them_ = 0;
  while (n.don.length < DON_TOI_DA && gio - n.donLuc >= PHUT_RA_DON * PHUT) {
    const d = taoDon(rnd, gio + them_);
    if (!d) break;
    n.don.push(d);
    n.donLuc += PHUT_RA_DON * PHUT;
    them_ += 1;
  }
  if (n.donLuc > gio) n.donLuc = gio;
  if (them_) save();
  return them_;
}

export const duMon = (d) => !!d && d.mon.every(m => co(m.id) >= m.n);

/** Giao một đơn. Trả [{tien, diem}, lỗi]. */
export function giaoDon(ma) {
  const n = nt();
  const i = n.don.findIndex(d => d.ma === ma);
  if (i < 0) return [null, 'Đơn này không còn trên bảng.'];
  const d = n.don[i];
  if (!duMon(d)) return [null, 'Chưa gom đủ hàng cho đơn này.'];
  for (const m of d.mon) bot(m.id, m.n);
  addMoney(d.tien);
  n.diem += d.diem;
  n.don.splice(i, 1);
  save();
  return [{ tien: d.tien, diem: d.diem }, null];
}

/** Bỏ một đơn không làm nổi. Bảng sẽ dán đơn khác sau. */
export function boDon(ma) {
  const n = nt();
  const i = n.don.findIndex(d => d.ma === ma);
  if (i < 0) return false;
  n.don.splice(i, 1);
  save();
  return true;
}

// ==== Điểm nông trại (cho bảng xếp hạng) ====
export function diemNongTrai() {
  return nt().diem;
}

export const tomTat = () => {
  const n = nt();
  return {
    ruong: oRuong().length,
    dangTrong: oRuong().filter(o => o.cay).length,
    chin: oRuong().filter(o => daChin(o)).length,
    thu: n.thu.length,
    chua: sucChua(),
    may: cacMay().length,
    mayXong: cacMay().filter(m => mayXong(m)).length,
    kho: Object.values(n.kho).reduce((a, v) => a + v, 0),
    don: n.don.length,
    diem: n.diem,
  };
};

// ==== Vật thể trên bản đồ mà nút hành động bắt được ====
// Trả về một "thing" giống NPC/biển hiệu để js/engine/overworld.js dùng chung
// một đường với mọi thứ khác.
export function vatNongTrai(mapId, x, y) {
  if (mapId !== NONG_TRAI_MAP) return null;
  const con = thuTaiO(x, y);
  if (con) {
    return { type: 'nongtrai', kind: 'thu', name: THU_BY_ID[con.id]?.name || 'Con vật', con };
  }
  const o = oTaiO(x, y);
  if (o) {
    const v = VAT_BY_ID[o.id];
    const kind = v.loai === 'ruong' ? 'ruong' : v.loai === 'may' ? 'may' : 'congtrinh';
    return { type: 'nongtrai', kind, name: v.name, o };
  }
  // Đang cầm món chờ kê thì mọi ô trống đều bấm được
  if (choKe() && keDuoc(choKe(), x, y)) {
    return { type: 'nongtrai', kind: 'cho-trong',
      name: VAT_BY_ID[choKe()]?.name || 'Chỗ trống', x, y };
  }
  return null;
}
