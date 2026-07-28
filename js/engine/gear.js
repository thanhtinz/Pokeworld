// TuxeWorld H5 | engine/gear.js | Trang bị cho Tuxemon: cường hoá + nâng sao
//
// Sáu ô trang bị, mỗi ô cộng đúng MỘT chỉ số nên không ô nào giẫm chân ô nào
// (js/data/gear.js sinh từ tools/mkgear.py):
//   Mũ → Né tránh · Áo Giáp → Giáp · Giáp Vai → HP
//   Găng Tay → Cận chiến · Giày → Tốc độ · Trang Sức → Tầm xa
//
// Hai đường nâng cấp, cố tình khác tính chất nhau:
//   · CƯỜNG HOÁ (+0..+15) — rẻ, làm được liên tục, nhưng càng cao càng dễ hỏng.
//     Hỏng thì mất đá và tiền, cấp cường hoá GIỮ NGUYÊN (không tụt) — tụt cấp
//     là kiểu móc túi của game thương mại, ở đây không cần.
//   · NÂNG SAO (1★..5★) — đắt, chắc chắn thành công, và ĐỔI HẲN HÌNH DẠNG món
//     đồ. Mỗi bậc sao có một ảnh riêng.
//
// Tệp này KHÔNG import monster.js: monster.js phải gọi ngược sang đây trong
// stats(), có vòng import là vỡ.
import { G, save } from '../state.js';
import { GEAR_BY_ID, O_TRANG_BI, SAO_TOI_DA } from '../data/gear.js';
import { rng } from '../util.js';

export const CUONG_TOI_DA = 15;
export { SAO_TOI_DA };

// Hai loại đá dùng để nâng cấp. Không nhét vào bảng vật phẩm của Tuxemon vì
// bảng đó do mkitems.py sinh từ kho gốc — thêm tay vào là lần sinh sau mất.
export const DA = {
  cuong: { name: 'Đá Cường Hoá', gia: 400, img: 'assets/gear/da_cuong.png' },
  sao: { name: 'Đá Ngôi Sao', gia: 2500, img: 'assets/gear/da_sao.png' },
};

// ==== Chỗ cất trong bản lưu ====
export function duLieu() {
  if (!G.p) return null;
  if (!G.p.gear || typeof G.p.gear !== 'object') G.p.gear = {};
  const g = G.p.gear;
  if (!Array.isArray(g.kho)) g.kho = [];
  if (!g.da || typeof g.da !== 'object') g.da = {};
  for (const k of Object.keys(DA)) g.da[k] = Math.max(0, Math.floor(g.da[k] || 0));
  if (!(g.uid > 0)) g.uid = 1;
  return g;
}

export const kho = () => duLieu()?.kho || [];
export const soDa = (loai) => duLieu()?.da?.[loai] || 0;
export function themDa(loai, n) {
  const g = duLieu();
  if (!g || !DA[loai]) return 0;
  g.da[loai] = Math.max(0, (g.da[loai] || 0) + Math.floor(n));
  return g.da[loai];
}

export const timMon = (uid) => kho().find(x => x.u === uid) || null;
export const mauMon = (v) => (v ? GEAR_BY_ID[v.id] : null);

// ==== Chỉ số món đồ cộng cho Tuxemon ====
export const HE_SAO = 0.5;      // mỗi sao thêm 50% chỉ số gốc
export const HE_CUONG = 0.08;   // mỗi cấp cường hoá thêm 8% chỉ số gốc

export function giaTri(v) {
  const m = mauMon(v);
  if (!m) return 0;
  const sao = Math.max(1, Math.min(SAO_TOI_DA, v.sao || 1));
  const c = Math.max(0, Math.min(CUONG_TOI_DA, v.cuong || 0));
  return Math.round(m.base * (1 + HE_SAO * (sao - 1)) * (1 + HE_CUONG * c));
}

// ==== Đeo / tháo ====
function oCuaMon(mon) {
  if (!mon) return null;
  if (!mon.tb || typeof mon.tb !== 'object') mon.tb = {};
  return mon.tb;
}

export const dangDeo = (mon, o) => {
  const uid = oCuaMon(mon)?.[o];
  return uid ? timMon(uid) : null;
};

// Món này đang nằm trên con nào (null = đang trong kho)
export function aiDangDeo(uid) {
  for (const m of G.p?.party || []) {
    for (const o of Object.keys(m.tb || {})) if (m.tb[o] === uid) return m;
  }
  for (const m of G.p?.box || []) {
    for (const o of Object.keys(m.tb || {})) if (m.tb[o] === uid) return m;
  }
  return null;
}

/** Đeo một món lên Tuxemon. Trả [lời nhắn, lỗi]. */
export function deo(mon, uid) {
  const v = timMon(uid);
  const m = mauMon(v);
  if (!mon || !v || !m) return [null, 'Không có món này.'];
  const chu = aiDangDeo(uid);
  if (chu && chu !== mon) {
    // Gỡ khỏi con cũ rồi mới đeo — một món chỉ nằm trên một con
    for (const o of Object.keys(chu.tb || {})) if (chu.tb[o] === uid) chu.tb[o] = null;
  }
  const tb = oCuaMon(mon);
  const cu = tb[m.o] && tb[m.o] !== uid ? timMon(tb[m.o]) : null;
  tb[m.o] = uid;
  save();
  return [cu ? `Thay ${mauMon(cu).name} bằng ${m.name}.` : `Đã đeo ${m.name}.`, null];
}

export function thao(mon, o) {
  const tb = oCuaMon(mon);
  if (!tb || !tb[o]) return [null, 'Ô này đang trống.'];
  const v = timMon(tb[o]);
  tb[o] = null;
  save();
  return [`Đã tháo ${mauMon(v)?.name || 'món đồ'}.`, null];
}

/** Tổng chỉ số trang bị của một con: { armour: 12, speed: 8, ... } */
export function chiSoThem(mon) {
  const ra = {};
  const tb = mon?.tb;
  if (!tb) return ra;
  for (const o of O_TRANG_BI) {
    const v = tb[o.id] ? timMon(tb[o.id]) : null;
    if (!v) continue;
    const m = mauMon(v);
    if (!m) continue;
    ra[m.stat] = (ra[m.stat] || 0) + giaTri(v);
  }
  return ra;
}

// monster.js gọi trong stats() — cộng THẲNG vào chỉ số, không nhân phần trăm,
// để người chơi nhìn số trên món là biết ngay được thêm bao nhiêu.
export const congTrangBi = (mon, key) => chiSoThem(mon)[key] || 0;

// ==== Mua món mới ====
export function mua(id) {
  const m = GEAR_BY_ID[id];
  const g = duLieu();
  if (!m || !g) return [null, 'Không có món này.'];
  if ((G.p.money || 0) < m.gia) return [null, 'Không đủ tiền.'];
  G.p.money -= m.gia;
  const v = { u: g.uid++, id, sao: 1, cuong: 0 };
  g.kho.push(v);
  save();
  return [`Mua ${m.name} 1★.`, null];
}

export function muaDa(loai, n = 1) {
  const d = DA[loai];
  if (!d) return [null, 'Không có loại đá này.'];
  const tien = d.gia * n;
  if ((G.p.money || 0) < tien) return [null, 'Không đủ tiền.'];
  G.p.money -= tien;
  themDa(loai, n);
  save();
  return [`Mua ${d.name} ×${n}.`, null];
}

// ==== Cường hoá ====
// Ba cấp đầu chắc ăn cho người chơi quen tay, sau đó mỗi cấp bớt 5% cho tới
// sàn 35% — đủ để +15 là thành tựu chứ không phải chuyện đương nhiên.
export function tiLeCuong(cuong) {
  if (cuong < 3) return 1;
  return Math.max(0.35, 1 - (cuong - 2) * 0.05);
}
export const giaCuong = (cuong) => 300 * (cuong + 1);

export function cuongHoa(uid) {
  const v = timMon(uid);
  const m = mauMon(v);
  if (!v || !m) return [null, 'Không có món này.'];
  if (v.cuong >= CUONG_TOI_DA) return [null, `Đã kịch ${CUONG_TOI_DA} rồi.`];
  const tien = giaCuong(v.cuong);
  if (soDa('cuong') < 1) return [null, `Thiếu ${DA.cuong.name}.`];
  if ((G.p.money || 0) < tien) return [null, 'Không đủ tiền.'];
  G.p.money -= tien;
  themDa('cuong', -1);
  const truoc = giaTri(v);
  if (!rng.roll(tiLeCuong(v.cuong))) {
    save();
    return [{ hong: true, msg: `Cường hoá hỏng! Vẫn giữ +${v.cuong}.` }, null];
  }
  v.cuong++;
  save();
  return [{ hong: false, msg: `${m.name} lên +${v.cuong}! Chỉ số ${truoc} → ${giaTri(v)}.` }, null];
}

// ==== Nâng sao ====
export const daSaoCan = (sao) => sao;              // 1★→2★ cần 1 viên, 4★→5★ cần 4
export const giaSao = (sao) => 2500 * sao;

export function nangSao(uid) {
  const v = timMon(uid);
  const m = mauMon(v);
  if (!v || !m) return [null, 'Không có món này.'];
  const sao = v.sao || 1;
  if (sao >= SAO_TOI_DA) return [null, `Đã đủ ${SAO_TOI_DA}★ rồi.`];
  const can = daSaoCan(sao);
  const tien = giaSao(sao);
  if (soDa('sao') < can) return [null, `Cần ${can} ${DA.sao.name}.`];
  if ((G.p.money || 0) < tien) return [null, 'Không đủ tiền.'];
  G.p.money -= tien;
  themDa('sao', -can);
  const truoc = giaTri(v);
  v.sao = sao + 1;
  save();
  return [`${m.name} lên ${v.sao}★ — đổi hẳn hình dạng! Chỉ số ${truoc} → ${giaTri(v)}.`, null];
}

// ==== Bán lại ====
export const giaBan = (v) => {
  const m = mauMon(v);
  if (!m) return 0;
  // Trả lại một nửa tiền món gốc cộng một nửa tiền đá đã đổ vào
  let n = m.gia / 2;
  for (let s = 1; s < (v.sao || 1); s++) n += (giaSao(s) + DA.sao.gia * daSaoCan(s)) / 2;
  n += (v.cuong || 0) * (300 + DA.cuong.gia) / 2;
  return Math.round(n);
};

export function ban(uid) {
  const g = duLieu();
  const v = timMon(uid);
  if (!g || !v) return [null, 'Không có món này.'];
  const chu = aiDangDeo(uid);
  if (chu) return [null, 'Đang có Tuxemon đeo — tháo ra đã.'];
  const tien = giaBan(v);
  g.kho = g.kho.filter(x => x.u !== uid);
  G.p.money = (G.p.money || 0) + tien;
  save();
  return [`Bán ${mauMon(v).name} được ${tien} vàng.`, null];
}
