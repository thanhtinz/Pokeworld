// TuxeWorld H5 | engine/cauca.js | Câu cá: buông cần, bán cá, nuôi cá, dex
//
// Toàn bộ LUẬT nằm ở đây, không đụng giao diện. Màn ui/cauca.js chỉ vẽ và gọi
// mấy hàm dưới.
//
// Một lượt câu ba nhịp:
//   1. `buongCan()`  — thả câu, trả về thời gian chờ tới lúc cá rỉa
//   2. `caRia()`     — chọn ra con cá cắn câu (chưa bắt được)
//   3. `giatCan()`   — giật đúng lúc thì được cá, sai thì sổng
//
// Cá bắt được vào GIỎ. Từ giỏ thì bán lấy tiền, hoặc thả vào BỂ nuôi cho đẹp.
// Con nào bắt lần đầu thì ghi vào DEX, và con dài nhất từng bắt của mỗi loài
// được giữ lại làm KỶ LỤC — bảng xếp hạng chấm bằng tổng kỷ lục đó.
import { G, save } from '../state.js';
import { CA, CA_BY_ID, CAN, CAN_BY_ID, CHO_CAU, TRONG_SO, HIEM } from '../data/ca.js';

export { CA, CA_BY_ID, CAN, CAN_BY_ID, CHO_CAU, HIEM };

export const GIO_TOI_DA = 30;      // giỏ đầy thì phải bán bớt mới câu tiếp
export const BE_TOI_DA = 12;       // bể nuôi chứa được bấy nhiêu con
export const CHO_MIN = 900;        // sớm nhất bao lâu thì cá rỉa (ms)
export const CHO_MAX = 4200;
export const CUA_SO = 900;         // giật trong bấy nhiêu ms thì ăn (cần tre)

// ==== Chỗ cất trong bản lưu ====
export function kho() {
  if (!G.p) return { gio: [], be: [], dex: {}, can: 'can_tre', daCau: 0, sotuot: 0 };
  if (!G.p.ca || typeof G.p.ca !== 'object') G.p.ca = {};
  const k = G.p.ca;
  if (!Array.isArray(k.gio)) k.gio = [];
  if (!Array.isArray(k.be)) k.be = [];
  if (!k.dex || typeof k.dex !== 'object') k.dex = {};
  if (!CAN_BY_ID[k.can]) k.can = 'can_tre';
  if (typeof k.daCau !== 'number') k.daCau = 0;
  if (typeof k.sotuot !== 'number') k.sotuot = 0;
  // Bản lưu cũ có thể chứa loài đã bỏ — dọn đi chứ để lại là vỡ chỗ hiện ảnh
  k.gio = k.gio.filter(c => CA_BY_ID[c?.id]);
  k.be = k.be.filter(c => CA_BY_ID[c?.id]);
  for (const id of Object.keys(k.dex)) if (!CA_BY_ID[id]) delete k.dex[id];
  return k;
}

export const canDangDung = () => CAN_BY_ID[kho().can] || CAN[0];
export const coCan = (id) => (G.p?.ca?.canCo || ['can_tre']).includes(id);

/** Mua cần. Trả [lời nhắn, lỗi]. */
export function muaCan(id) {
  const c = CAN_BY_ID[id];
  if (!c) return [null, 'Không có cần này.'];
  const k = kho();
  if (!Array.isArray(G.p.ca.canCo)) G.p.ca.canCo = ['can_tre'];
  if (G.p.ca.canCo.includes(id)) return [null, 'Bạn có cần này rồi.'];
  if ((G.p.money || 0) < c.gia) return [null, 'Không đủ tiền.'];
  G.p.money -= c.gia;
  G.p.ca.canCo.push(id);
  k.can = id;
  save();
  return [`Sắm ${c.name} — cầm thử phát nào.`, null];
}

export function doiCan(id) {
  if (!CAN_BY_ID[id]) return [null, 'Không có cần này.'];
  if (!coCan(id)) return [null, 'Chưa có cần này.'];
  kho().can = id;
  save();
  return [`Đổi sang ${CAN_BY_ID[id].name}.`, null];
}

// ==== Buông cần ====
/** Cá ở chỗ này mà cần hiện tại với tới được. */
export function caODay(cho, bac = canDangDung().bac) {
  return CA.filter(c => c.cho === cho && c.hiem <= bac);
}

/** Bao lâu nữa thì cá rỉa (ms). */
export function buongCan(rnd = Math.random) {
  return Math.round(CHO_MIN + rnd() * (CHO_MAX - CHO_MIN));
}

/** Cửa sổ giật: cần càng xịn càng rộng tay. */
export const cuaSo = (bac = canDangDung().bac) => CUA_SO + (bac - 2) * 120;

/**
 * Con nào cắn câu. Bốc theo trọng số của bậc hiếm, nên cá quý hiếm khi lên.
 * Trả null nếu chỗ này chẳng có con nào cần với tới.
 */
export function caRia(cho, rnd = Math.random, bac = canDangDung().bac) {
  const ds = caODay(cho, bac);
  if (!ds.length) return null;
  const tong = ds.reduce((a, c) => a + (TRONG_SO[c.hiem] || 1), 0);
  let x = rnd() * tong;
  const con = ds.find(c => (x -= TRONG_SO[c.hiem] || 1) <= 0) || ds[ds.length - 1];
  // Chiều dài: bốc hai lần lấy trung bình cho con vừa vừa hay gặp hơn con
  // cực to hoặc cực bé — thả một lần thì cỡ nào cũng đều như nhau, vô vị.
  const [mn, mx] = con.dai;
  const t = (rnd() + rnd()) / 2;
  return { id: con.id, dai: Math.round(mn + (mx - mn) * t) };
}

/**
 * Bản đồ nào thì câu ra bảng cá nào. Bản đồ lạ thì cứ tính là hồ — thà ra cá
 * hiền còn hơn không câu được gì.
 */
const MAP_CHO = { khu_dan_cu: 'ho_dan_cu', taba_town: 'song_taba', khu_pho: 'song_taba' };
export const choTheoMap = (mapId) => MAP_CHO[mapId]
  || (/bien|beach|ocean|sea/i.test(mapId || '') ? 'bien_pepper' : 'ho_dan_cu');

export const giaCa = (c) => Math.max(1, Math.round((CA_BY_ID[c.id]?.giaCm || 1) * c.dai));

// ==== Thanh lực: vạch chạy qua lại, bấm trúng vùng xanh thì được cá ====
// Canh theo thời gian thì chỉ là phản xạ bấm nhanh, ai cũng như ai. Thanh lực
// thì NHÌN được: vùng trúng hẹp dần theo bậc hiếm nên cá quý thật sự khó.
export const VUNG_MIN = 0.09;      // hẹp nhất cũng còn 9% thanh, không thể bất khả

/** Bề rộng vùng trúng (theo tỉ lệ thanh). Cần xịn thì rộng, cá quý thì hẹp. */
export function vungTrung(bac = canDangDung().bac, hiem = 1) {
  const r = 0.34 + (bac - 2) * 0.07 - (hiem - 1) * 0.06;
  return Math.max(VUNG_MIN, Math.min(0.55, r));
}

/** Vạch chạy hết một vòng qua-lại mất bao lâu (ms). Cá càng quý càng nhanh. */
export const tocDoVach = (hiem = 1) => Math.max(620, 1500 - (hiem - 1) * 260);

/** Vùng trúng đặt ở đâu trên thanh — chừa mép để không bao giờ dính sát biên. */
export function choVung(rong, rnd = Math.random) {
  const le = 0.06;
  return le + rnd() * Math.max(0, 1 - rong - le * 2);
}

/** Vạch đang ở `vi` có nằm trong vùng bắt đầu từ `dau` rộng `rong` không? */
export const trungVach = (vi, dau, rong) => vi >= dau && vi <= dau + rong;

/**
 * Kéo cá theo kết quả thanh lực. Trượt vạch thì sổng.
 * Tách khỏi giatCan() vì lời nhắn khác hẳn: trượt vạch chứ không phải trễ tay.
 */
export function keoCa(con, trung) {
  if (!con || !CA_BY_ID[con?.id]) return [null, 'Chưa có con nào cắn câu.'];
  if (!trung) {
    const k = kho();
    k.sotuot += 1;
    save();
    return [null, 'Trượt vạch, cá vùng ra mất rồi.'];
  }
  return giatCan(con, 0);
}

/**
 * Giật cần. `tre` = giật muộn bao nhiêu ms so với lúc cá rỉa.
 * Giật sớm (tre < 0) hay muộn quá cửa sổ thì đều sổng.
 * Trả [con cá vào giỏ, lỗi].
 */
export function giatCan(con, tre) {
  const k = kho();
  if (!con || !CA_BY_ID[con.id]) return [null, 'Chưa có con nào cắn câu.'];
  if (tre < 0) { k.sotuot += 1; save(); return [null, 'Giật sớm quá, cá nhả mất rồi.']; }
  if (tre > cuaSo()) { k.sotuot += 1; save(); return [null, 'Chậm mất rồi, nó tha mồi đi.']; }
  if (k.gio.length >= GIO_TOI_DA) return [null, 'Giỏ đầy rồi, bán bớt đã.'];
  const ghi = { id: con.id, dai: con.dai };
  k.gio.push(ghi);
  k.daCau += 1;
  // Dex + kỷ lục: chỉ giữ con DÀI NHẤT từng bắt của mỗi loài
  const cu = k.dex[con.id];
  const moi = !cu;
  if (!cu || con.dai > cu.dai) k.dex[con.id] = { dai: con.dai, soLan: (cu?.soLan || 0) + 1 };
  else cu.soLan += 1;
  save();
  return [{ ...ghi, moi, kyLuc: !cu || con.dai > (cu?.dai ?? 0) }, null];
}

// ==== Giỏ: bán hoặc thả vào bể ====
export function banCa(chiSo) {
  const k = kho();
  const c = k.gio[chiSo];
  if (!c) return [null, 'Không có con này trong giỏ.'];
  const tien = giaCa(c);
  k.gio.splice(chiSo, 1);
  G.p.money = (G.p.money || 0) + tien;
  save();
  return [{ tien, name: CA_BY_ID[c.id].name, dai: c.dai }, null];
}

export function banHet() {
  const k = kho();
  if (!k.gio.length) return [null, 'Giỏ đang trống.'];
  const tien = k.gio.reduce((a, c) => a + giaCa(c), 0);
  const n = k.gio.length;
  k.gio = [];
  G.p.money = (G.p.money || 0) + tien;
  save();
  return [{ tien, n }, null];
}

/** Thả một con từ giỏ vào bể nuôi. */
export function thaVaoBe(chiSo) {
  const k = kho();
  const c = k.gio[chiSo];
  if (!c) return [null, 'Không có con này trong giỏ.'];
  if (k.be.length >= BE_TOI_DA) return [null, 'Bể chật rồi.'];
  k.gio.splice(chiSo, 1);
  k.be.push({ ...c, tha: Date.now() });
  save();
  return [`Thả ${CA_BY_ID[c.id].name} vào bể.`, null];
}

/** Vớt từ bể ra giỏ (để bán). */
export function votKhoiBe(chiSo) {
  const k = kho();
  const c = k.be[chiSo];
  if (!c) return [null, 'Bể không có con này.'];
  if (k.gio.length >= GIO_TOI_DA) return [null, 'Giỏ đầy rồi.'];
  k.be.splice(chiSo, 1);
  k.gio.push({ id: c.id, dai: c.dai });
  save();
  return [`Vớt ${CA_BY_ID[c.id].name} ra giỏ.`, null];
}

// ==== Dex + điểm xếp hạng ====
export const daBat = (id) => !!kho().dex[id];
export const kyLuc = (id) => kho().dex[id]?.dai || 0;
export const soLoaiDaBat = () => Object.keys(kho().dex).length;

/**
 * Điểm câu cá dùng để xếp hạng. Cộng kỷ lục của từng loài, nhân theo bậc hiếm
 * — không thì ai rảnh ngồi câu cá rô cả ngày cũng lên đầu bảng.
 */
export function diemCauCa() {
  const k = kho();
  let d = 0;
  for (const [id, v] of Object.entries(k.dex)) {
    const c = CA_BY_ID[id];
    if (c) d += Math.round(v.dai * (1 + (c.hiem - 1) * 0.6));
  }
  return d;
}

/** Tóm tắt để đẩy lên máy chủ cho bảng xếp hạng. */
export const tomTat = () => ({
  diem: diemCauCa(),
  loai: soLoaiDaBat(),
  tong: CA.length,
  daCau: kho().daCau,
});
