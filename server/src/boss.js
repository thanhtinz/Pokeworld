// TuxeWorld server | src/boss.js | Boss thế giới và boss từng khu
//
// Boss có MỘT thanh máu chung cho cả máy chủ. Ai cũng đánh được, sát thương
// cộng dồn, hạ xong thì chia quà theo bảng xếp hạng sát thương — đánh nhiều
// thì quà to.
//
// Máy chủ KHÔNG mô phỏng lại trận đánh (trận chạy ở máy người chơi). Nên phải
// kẹp bằng hai cái:
//   · mỗi lần đánh chỉ trừ được tối đa capMoiLan (1/25 thanh máu) — muốn hạ
//     một con boss thì ít nhất 25 lượt đánh, không ai một mình gánh hết;
//   · mỗi người mỗi ngày chỉ đánh được LUOT_MOI_NGAY lần cho mỗi boss.
// Bảng máu/trần sát thương do src/boss.data.js giữ, không đọc số client gửi.
import express from 'express';
import { find, filter, insert, remove, markDirty, uid, getDb } from './db.js';
import { authRequired } from './auth.js';
import { sendMail } from './inbox.js';
import { BOSSES, BOSS_BY_ID } from './boss.data.js';

export const bossRouter = express.Router();

export const LUOT_MOI_NGAY = 10;
// Hạ xong bao lâu thì con mới xuất hiện lại
const HOI_SINH = { khu: 2 * 3600000, the_gioi: 6 * 3600000 };

const ngay = (ts = Date.now()) => Math.floor(ts / 86400000);

// Bảng thưởng theo THỨ HẠNG sát thương. Ai có đánh là có phần.
const THUONG = [
  { den: 1, tien: 200000, do: [{ id: 'imperial_potion', n: 3 }, { id: 'tuxeball_majestic', n: 5 }] },
  { den: 3, tien: 120000, do: [{ id: 'imperial_potion', n: 2 }, { id: 'tuxeball_majestic', n: 2 }] },
  { den: 10, tien: 60000, do: [{ id: 'mega_potion', n: 3 }] },
  { den: 50, tien: 25000, do: [{ id: 'super_potion', n: 3 }] },
  { den: Infinity, tien: 10000, do: [{ id: 'potion', n: 3 }] },
];

function phanThuong(hang) {
  return THUONG.find(t => hang <= t.den) || THUONG[THUONG.length - 1];
}

// Lượt đánh đang mở của một boss (chưa bị hạ)
function luotDangMo(bossId) {
  return find('bossRuns', r => r.bossId === bossId && !r.hetLuc);
}

function lanCuoiBiHa(bossId) {
  return filter('bossRuns', r => r.bossId === bossId && r.hetLuc)
    .reduce((m, r) => Math.max(m, r.hetLuc), 0);
}

// Mở một lượt mới nếu boss đã hồi sinh xong
function moLuot(def) {
  const dang = luotDangMo(def.id);
  if (dang) return dang;
  const cho = HOI_SINH[def.kind] || HOI_SINH.khu;
  if (Date.now() - lanCuoiBiHa(def.id) < cho) return null;
  return insert('bossRuns', {
    id: uid('bos'), bossId: def.id, hp: def.hpMax, hpMax: def.hpMax,
    batDau: Date.now(), hetLuc: 0, dmg: {}, ten: {},
  });
}

function conLaiMs(def) {
  const cho = HOI_SINH[def.kind] || HOI_SINH.khu;
  return Math.max(0, lanCuoiBiHa(def.id) + cho - Date.now());
}

function bangXepHang(run) {
  return Object.entries(run.dmg || {})
    .map(([id, dmg]) => ({ id, dmg, username: run.ten?.[id] || '???' }))
    .sort((a, b) => b.dmg - a.dmg);
}

function soLuotHomNay(userId, bossId) {
  const d = getDb().bossLuot || [];
  const r = d.find(x => x.u === userId && x.b === bossId && x.n === ngay());
  return r ? r.so : 0;
}

function ghiLuot(userId, bossId) {
  const db = getDb();
  if (!Array.isArray(db.bossLuot)) db.bossLuot = [];
  let r = db.bossLuot.find(x => x.u === userId && x.b === bossId && x.n === ngay());
  if (!r) { r = { u: userId, b: bossId, n: ngay(), so: 0 }; db.bossLuot.push(r); }
  r.so += 1;
  // Dọn bản ghi của những ngày trước cho khỏi phình
  db.bossLuot = db.bossLuot.filter(x => x.n >= ngay() - 1);
  markDirty();
}

// Chia quà rồi đóng lượt
function chiaQua(def, run) {
  const bxh = bangXepHang(run);
  bxh.forEach((x, i) => {
    const t = phanThuong(i + 1);
    sendMail(x.id, {
      kind: 'boss',
      title: `Hạ được ${def.name}`,
      body: `Bạn xếp hạng ${i + 1}/${bxh.length} về sát thương `
        + `(${x.dmg.toLocaleString('vi-VN')} điểm). Đây là phần của bạn.`,
      money: t.tien,
      items: t.do,
      from: 'Hội Săn Boss',
    });
  });
  run.hetLuc = Date.now();
  markDirty();
  return bxh;
}

// Trả về [kết quả, lỗi]
export function danhBoss(user, bossId, dmgThat) {
  const def = BOSS_BY_ID[bossId];
  if (!def) return [null, 'Không có con boss này.'];
  const run = moLuot(def);
  if (!run) {
    return [null, `${def.name} vừa bị hạ, còn ${Math.ceil(conLaiMs(def) / 60000)} phút nữa mới hiện lại.`];
  }
  if (soLuotHomNay(user.id, bossId) >= LUOT_MOI_NGAY) {
    return [null, `Hôm nay bạn đánh ${def.name} đủ ${LUOT_MOI_NGAY} lần rồi.`];
  }

  const tho = Math.max(0, Math.round(Number(dmgThat) || 0));
  const sat = Math.min(tho * def.heSo, def.capMoiLan, run.hp);
  run.hp = Math.max(0, run.hp - sat);
  run.dmg[user.id] = (run.dmg[user.id] || 0) + sat;
  run.ten[user.id] = user.username;
  ghiLuot(user.id, bossId);
  markDirty();

  let bxh = null;
  const ha = run.hp <= 0;
  if (ha) bxh = chiaQua(def, run);

  const xep = bangXepHang(run).findIndex(x => x.id === user.id) + 1;
  return [{
    boss: def.name,
    sat,
    hp: run.hp,
    hpMax: run.hpMax,
    cuaBan: run.dmg[user.id],
    hang: xep,
    soNguoi: Object.keys(run.dmg).length,
    conLuot: LUOT_MOI_NGAY - soLuotHomNay(user.id, bossId),
    ha,
    top: (bxh || bangXepHang(run)).slice(0, 10)
      .map(x => ({ username: x.username, dmg: x.dmg })),
  }, null];
}

// ==== Route ====
bossRouter.get('/', authRequired, (req, res) => {
  const ds = BOSSES.map(def => {
    // Xem danh sách cũng là lúc mở lượt mới cho con nào đã hồi sinh xong —
    // không thì boss nằm im mãi vì chưa ai đánh, mà chưa mở lượt thì nút đánh
    // cũng không hiện: hai bên khoá chết lẫn nhau.
    const run = moLuot(def);
    return {
      id: def.id, kind: def.kind, zone: def.zone, name: def.name,
      sp: def.sp, lv: def.lv, hpMax: def.hpMax,
      hp: run ? run.hp : (conLaiMs(def) > 0 ? 0 : def.hpMax),
      song: !!run,
      hoiSinhSau: run ? 0 : conLaiMs(def),
      soNguoi: run ? Object.keys(run.dmg).length : 0,
      cuaBan: run ? (run.dmg[req.user.id] || 0) : 0,
      conLuot: LUOT_MOI_NGAY - soLuotHomNay(req.user.id, def.id),
    };
  });
  res.json({ ds, luotMoiNgay: LUOT_MOI_NGAY });
});

bossRouter.get('/:bossId', authRequired, (req, res) => {
  const def = BOSS_BY_ID[req.params.bossId];
  if (!def) return res.status(404).json({ error: 'Không có con boss này.' });
  const run = moLuot(def);
  res.json({
    id: def.id, name: def.name, sp: def.sp, lv: def.lv, kind: def.kind,
    zone: def.zone, hpMax: def.hpMax,
    hp: run ? run.hp : 0,
    song: !!run,
    hoiSinhSau: run ? 0 : conLaiMs(def),
    conLuot: LUOT_MOI_NGAY - soLuotHomNay(req.user.id, def.id),
    cuaBan: run ? (run.dmg[req.user.id] || 0) : 0,
    top: run ? bangXepHang(run).slice(0, 20).map(x => ({ username: x.username, dmg: x.dmg })) : [],
  });
});

bossRouter.post('/:bossId/danh', authRequired, (req, res) => {
  const [ra, err] = danhBoss(req.user, req.params.bossId, req.body?.dmg);
  if (err) return res.status(400).json({ error: err });
  res.json(ra);
});
