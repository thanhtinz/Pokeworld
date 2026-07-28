// TuxeWorld H5 | engine/achievements.js | Chấm công thành tựu
//
// Không có "sự kiện thành tựu" riêng: mọi thành tựu đều đọc thẳng bản lưu nên
// dù cộng điểm bằng đường nào (đánh nhau, giftcode, admin tặng) cũng tính đúng.
// Thành tựu đã nhận nằm ở G.p.ach — nhận rồi thì thôi, không nhận lại được.
import { G, addMoney, addItem, save } from '../state.js';
import { ACHIEVEMENTS, ACH_BY_ID } from '../data/achievements.js';
import { trainerLevel } from './player.js';

// Bảng biến của bản lưu mà thành tựu đọc được
export function bienBanLuu(p = G.p) {
  if (!p) return {};
  return {
    catches: p.stats?.catches || 0,
    wins: p.stats?.wins || 0,
    steps: p.stats?.steps || 0,
    money: p.money || 0,
    badges: (p.badges || []).length,
    dexSeen: Object.keys(p.dex?.seen || {}).length,
    dexCaught: Object.keys(p.dex?.caught || {}).length,
    trainerLv: trainerLevel(),
    gioChoi: Math.floor((p.stats?.playMin || 0) / 60),
  };
}

const daNhan = (id) => (G.p?.ach || []).includes(id);

// Tiến độ một thành tựu: { lam, moc, xong, nhan }
export function tienDo(a, bien = bienBanLuu()) {
  const lam = Math.max(0, bien[a.bien] || 0);
  return {
    lam: Math.min(lam, a.moc),
    moc: a.moc,
    xong: lam >= a.moc,
    nhan: daNhan(a.id),
  };
}

// Cả bảng, kèm tiến độ — màn Thành tựu gọi đúng hàm này
export function bangThanhTuu() {
  const bien = bienBanLuu();
  return ACHIEVEMENTS.map(a => ({ ...a, ...tienDo(a, bien) }));
}

// Số thành tựu đã xong mà CHƯA bấm nhận — dùng cho chấm đỏ trên nút Menu
export function choNhan() {
  const bien = bienBanLuu();
  return ACHIEVEMENTS.filter(a => !daNhan(a.id) && (bien[a.bien] || 0) >= a.moc).length;
}

// Nhận thưởng một thành tựu. Trả [quà, lỗi].
export function nhanThuong(id) {
  const a = ACH_BY_ID[id];
  if (!a) return [null, 'Không có thành tựu này.'];
  if (daNhan(id)) return [null, 'Bạn đã nhận thưởng rồi.'];
  const bien = bienBanLuu();
  if ((bien[a.bien] || 0) < a.moc) return [null, 'Chưa đạt mốc này.'];

  if (!Array.isArray(G.p.ach)) G.p.ach = [];
  G.p.ach.push(id);
  if (a.qua.tien) addMoney(a.qua.tien);
  for (const d of a.qua.do || []) addItem(d.id, d.n);
  save();
  return [a.qua, null];
}

// Nhận hết cho nhanh
export function nhanHet() {
  const gop = { tien: 0, do: [] };
  let n = 0;
  for (const a of bangThanhTuu()) {
    if (!a.xong || a.nhan) continue;
    const [q] = nhanThuong(a.id);
    if (!q) continue;
    n += 1;
    gop.tien += q.tien || 0;
    for (const d of q.do || []) {
      const cu = gop.do.find(x => x.id === d.id);
      if (cu) cu.n += d.n;
      else gop.do.push({ ...d });
    }
  }
  return [gop, n];
}
