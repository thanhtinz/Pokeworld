// TuxeWorld server | src/guildquest.js | Nhiệm vụ bang hội + boss bang hội
//
// NHIỆM VỤ BANG chạy theo TUẦN. Tiến độ cộng dồn từ việc thành viên đã làm,
// và chỉ đếm những việc MÁY CHỦ tự nhìn thấy — góp quỹ, sát thương lên boss,
// thắng PvP. Không nhận con số nào do client tự khai, nên không có gì để gian.
//
// BOSS BANG HỘI dùng chung engine boss nhưng mỗi bang một thanh máu riêng, và
// máu tăng theo cấp bang. Hạ xong: quỹ bang + kinh nghiệm bang + quà gửi vào
// hộp thư từng người theo thứ hạng sát thương.
import { markDirty } from './db.js';
import {
  BOSSES, BOSS_BY_ID, LUOT_MOI_NGAY, danhBoss, luotDangMo, conLaiMs,
  mauBoss, bangXepHang, soLuotHomNay,
} from './boss.js';

export const TUAN = 7 * 86400000;
export const tuanNay = (ts = Date.now()) => Math.floor(ts / TUAN);

// Nhiệm vụ tuần. 'loai' phải trùng với tên việc mà ghiCong() nhận.
export const NHIEM_VU = [
  { id: 'gop_quy', loai: 'gop', muc: 500000, ten: 'Góp quỹ bang',
    mo: 'Cả bang góp tổng cộng $500.000 vào quỹ.', exp: 400, quy: 100000 },
  { id: 'san_boss', loai: 'boss', muc: 1500000, ten: 'Săn boss',
    mo: 'Cả bang gây 1.500.000 sát thương lên boss bất kỳ.', exp: 600, quy: 150000 },
  { id: 'dau_truong', loai: 'pvp', muc: 30, ten: 'Đấu trường',
    mo: 'Thành viên thắng tổng cộng 30 trận PvP.', exp: 500, quy: 120000 },
  { id: 'don_nguoi', loai: 'thanhvien', muc: 5, ten: 'Chiêu binh',
    mo: 'Có 5 thành viên khác nhau đóng góp trong tuần.', exp: 300, quy: 80000 },
];
export const NV_BY_ID = Object.fromEntries(NHIEM_VU.map(n => [n.id, n]));

// Lấy (và tự khởi tạo lại mỗi tuần) sổ nhiệm vụ của một bang
export function soNhiemVu(g) {
  if (!g.nv || g.nv.tuan !== tuanNay()) {
    g.nv = { tuan: tuanNay(), tienDo: {}, daNhan: [], nguoiGop: [] };
    markDirty();
  }
  if (!g.nv.tienDo) g.nv.tienDo = {};
  if (!Array.isArray(g.nv.daNhan)) g.nv.daNhan = [];
  if (!Array.isArray(g.nv.nguoiGop)) g.nv.nguoiGop = [];
  return g.nv;
}

/**
 * Ghi công một việc thành viên vừa làm vào nhiệm vụ tuần của bang.
 * Gọi từ chỗ máy chủ TỰ BIẾT việc đó đã xảy ra, đừng gọi theo lời client.
 */
export function ghiCong(guild, userId, loai, n) {
  if (!guild || !(n > 0)) return;
  const s = soNhiemVu(guild);
  s.tienDo[loai] = (s.tienDo[loai] || 0) + n;
  if (userId && !s.nguoiGop.includes(userId)) {
    s.nguoiGop.push(userId);
    s.tienDo.thanhvien = s.nguoiGop.length;
  }
  markDirty();
}

export function bangNhiemVu(g) {
  const s = soNhiemVu(g);
  return NHIEM_VU.map(n => {
    const co = Math.min(n.muc, s.tienDo[n.loai] || 0);
    return {
      id: n.id, ten: n.ten, mo: n.mo, muc: n.muc, co,
      xong: co >= n.muc, daNhan: s.daNhan.includes(n.id),
      exp: n.exp, quy: n.quy,
    };
  });
}

export function conLaiTuan() {
  return (tuanNay() + 1) * TUAN - Date.now();
}

/**
 * Nhận thưởng một nhiệm vụ đã xong. Việc cộng kinh nghiệm / lên cấp bang nằm
 * bên src/guild.js, truyền vào đây để hai tệp không phải import vòng qua nhau.
 * @param {(g:object, exp:number)=>void} congExp
 */
export function nhanThuong(g, nvId, congExp) {
  const n = NV_BY_ID[nvId];
  if (!n) return [null, 'Không có nhiệm vụ này.'];
  const s = soNhiemVu(g);
  if (s.daNhan.includes(nvId)) return [null, 'Nhiệm vụ này nhận thưởng rồi.'];
  if ((s.tienDo[n.loai] || 0) < n.muc) return [null, 'Nhiệm vụ chưa xong.'];
  s.daNhan.push(nvId);
  g.treasury = (g.treasury || 0) + n.quy;
  congExp(g, n.exp);
  markDirty();
  return [{ id: nvId, exp: n.exp, quy: n.quy, treasury: g.treasury, level: g.level }, null];
}

// ==== Boss bang hội ====
export const BOSS_BANG = BOSSES.filter(b => b.kind === 'bang');

export function danhSachBossBang(g, userId) {
  return BOSS_BANG.map(def => {
    const mo = (g.level || 1) >= (def.capBang || 1);
    const run = mo ? luotDangMo(def.id, g.id) : null;
    const hpMax = mauBoss(def, g.level || 1);
    return {
      id: def.id, name: def.name, sp: def.sp, lv: def.lv,
      capBang: def.capBang, mo,
      hpMax,
      hp: run ? run.hp : (mo ? 0 : hpMax),
      song: !!run,
      hoiSinhSau: run ? 0 : conLaiMs(def, g.id),
      soNguoi: run ? Object.keys(run.dmg).length : 0,
      cuaBan: run ? (run.dmg[userId] || 0) : 0,
      conLuot: LUOT_MOI_NGAY - soLuotHomNay(userId, def.id),
      top: run ? bangXepHang(run).slice(0, 10)
        .map(x => ({ username: x.username, dmg: x.dmg })) : [],
    };
  });
}

/** Đánh boss bang. congExp giống nhanThuong(). */
export function danhBossBang(user, g, bossId, dmg, congExp) {
  const def = BOSS_BY_ID[bossId];
  if (!def || def.kind !== 'bang') return [null, 'Không có con boss bang này.'];
  if ((g.level || 1) < (def.capBang || 1)) {
    return [null, `Bang phải đạt cấp ${def.capBang} mới gọi được ${def.name}.`];
  }
  const [ra, err] = danhBoss(user, bossId, dmg, { guildId: g.id, capBang: g.level || 1 });
  if (err) return [null, err];
  // Sát thương lên boss cũng tính vào nhiệm vụ tuần
  ghiCong(g, user.id, 'boss', ra.sat);
  if (ra.ha) {
    // Hạ được thủ hộ thì cả bang có phần: quỹ + kinh nghiệm bang
    const quy = Math.round(def.hpMax / 4);
    g.treasury = (g.treasury || 0) + quy;
    congExp(g, Math.round(def.hpMax / 1000));
    ra.quyBang = quy;
    markDirty();
  }
  return [ra, null];
}
