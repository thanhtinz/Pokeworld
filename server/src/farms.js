// TuxeWorld server | src/farms.js | Thăm nông trại người khác và cướp nông sản
//
// Nông trại của mỗi người nằm trong bản lưu (save.nt): ô ruộng, con vật, kho
// nông sản, thú canh. Ở đây chỉ đọc ra để vẽ, và cho một việc DUY NHẤT được
// sửa của khách: cướp một phần kho.
//
// Vì sao đặt luật ở máy chủ chứ không ở client: kho của người bị cướp là dữ
// liệu của NGƯỜI KHÁC. Để client tự tính rồi báo lên thì ai sửa được client là
// vét sạch kho cả server.
//
// Luật cướp:
//   · không cướp chính mình
//   · mỗi cặp (người cướp, chủ nhà) chỉ một lần trong CHO_CUOP giờ
//   · tỉ lệ thành công = CUOP_GOC trừ đi phần thú canh chặn được. Con canh càng
//     cao cấp càng chặn khoẻ, nhưng không bao giờ chặn hết
//   · cướp trúng thì lấy một PHẦN của đúng MỘT loại nông sản, có trần
//   · chủ nhà luôn biết: ghi vào nhật ký nông trại của họ và gửi một lá thư
import express from 'express';
import { find, filter, insert, markDirty, uid } from './db.js';
import { authRequired } from './auth.js';
import { friendshipBetween, marriageOf } from './social.js';
import { sendMail } from './inbox.js';

export const farmRouter = express.Router();

// Giữ khớp với js/engine/nongtrai.js — lệch là client hiện một tỉ lệ, máy chủ
// bốc theo một tỉ lệ khác.
export const CUOP_GOC = 0.75;
export const CUOP_SAN = 0.20;
const CHO_CUOP = 6 * 3600 * 1000;   // cùng một nông trại: 6 giờ mới cướp lại được
const PHAN_CUOP = 0.2;              // cướp nhiều nhất bấy nhiêu phần một loại
const TRAN_CUOP = 12;               // và không quá bấy nhiêu món một lần
const GIU_NHAT_KY = 30;             // nhật ký bị cướp giữ bấy nhiêu dòng

export const tiLeBiCuop = (capCanh = 0) => {
  if (!capCanh) return CUOP_GOC;
  const giam = Math.min(CUOP_GOC - CUOP_SAN, 0.011 * capCanh);
  return Math.max(CUOP_SAN, CUOP_GOC - giam);
};

const byName = (name) => {
  const lower = String(name || '').trim().toLowerCase();
  return find('users', u => u.unameLower === lower);
};

function quanHe(me, chu) {
  if (!me) return 'nguoi_la';
  if (me.id === chu.id) return 'me';
  const m = marriageOf(chu.id);
  if (m && !m.pending && (m.a === me.id || m.b === me.id)) return 'partner';
  const f = friendshipBetween(me.id, chu.id);
  if (f && f.status === 'accepted') return 'friend';
  return 'nguoi_la';
}

// Nông trại đã dựng chưa: chưa xây nhà thì chưa có nông trại nào cả
const coNongTrai = (u) => !!(u.save?.estate?.base && u.save?.nt);

// Chỉ NÔNG SẢN mới cướp được. Hạt giống với cỏ khô thì để lại: cướp hạt giống
// của người ta xong họ không trồng được gì nữa, phá chứ không phải cướp.
const cuopDuoc = (id) => !String(id).startsWith('hat_') && id !== 'co_kho';

function khoCuopDuoc(u) {
  const kho = u.save?.nt?.kho || {};
  return Object.entries(kho)
    .filter(([id, n]) => cuopDuoc(id) && Number(n) > 0)
    .map(([id, n]) => ({ id, n: Math.round(Number(n)) }));
}

function lanCuopGanNhat(meId, chuId) {
  return filter('farmRaids', r => r.from === meId && r.to === chuId)
    .reduce((m, r) => Math.max(m, r.ts), 0);
}

function congKhai(u, me) {
  const nt = u.save?.nt || {};
  const canh = nt.canh || null;
  const kho = khoCuopDuoc(u);
  return {
    username: u.username,
    avatar: u.avatar,
    quanHe: quanHe(me, u),
    ruong: (nt.o || []).filter(o => o.id === 'ruong').length,
    thu: (nt.thu || []).length,
    diem: nt.diem || 0,
    // Chỉ đưa TÊN con canh với cấp — không đưa cả con ra ngoài
    canh: canh ? { sp: canh.sp, lv: canh.lv || 1 } : null,
    tiLeCuop: tiLeBiCuop(canh?.lv || 0),
    // Cho khách thấy trong kho có gì để cướp, nhưng không thấy số lượng chính
    // xác: biết chính xác thì chỉ việc chọn đúng lúc kho đầy nhất
    coGi: kho.map(x => x.id).slice(0, 12),
    khoNhieu: kho.reduce((a, x) => a + x.n, 0) >= 20,
  };
}

// ==== Xem nông trại ====
farmRouter.get('/:username', authRequired, (req, res) => {
  const chu = byName(req.params.username);
  if (!chu || chu.banned) return res.status(404).json({ error: 'Không tìm thấy người chơi.' });
  if (!coNongTrai(chu)) {
    return res.status(404).json({ error: `${chu.username} chưa có nông trại nào.` });
  }
  const cho = Math.max(0, CHO_CUOP - (Date.now() - lanCuopGanNhat(req.user.id, chu.id)));
  res.json({
    ...congKhai(chu, req.user),
    laMinh: chu.id === req.user.id,
    choCuopMs: chu.id === req.user.id ? 0 : cho,
  });
});

// ==== Nhật ký bị cướp của chính mình ====
farmRouter.get('/me/nhatky', authRequired, (req, res) => {
  const ds = filter('farmRaids', r => r.to === req.user.id)
    .sort((a, b) => b.ts - a.ts).slice(0, GIU_NHAT_KY);
  res.json({
    nhatKy: ds.map(r => ({
      ai: r.fromName, ts: r.ts, duoc: r.duoc,
      mon: r.mon, so: r.so, coCanh: r.coCanh,
    })),
  });
});

// ==== Cướp ====
farmRouter.post('/:username/cuop', authRequired, (req, res) => {
  const chu = byName(req.params.username);
  if (!chu || chu.banned) return res.status(404).json({ error: 'Không tìm thấy người chơi.' });
  if (chu.id === req.user.id) {
    return res.status(400).json({ error: 'Cướp nông trại của chính mình làm gì.' });
  }
  if (!coNongTrai(chu)) {
    return res.status(404).json({ error: `${chu.username} chưa có nông trại nào.` });
  }
  const con = Math.max(0, CHO_CUOP - (Date.now() - lanCuopGanNhat(req.user.id, chu.id)));
  if (con > 0) {
    const gio = Math.ceil(con / 3600000);
    return res.status(429).json({ error: `Vừa ghé rồi, ${gio} giờ nữa hãy quay lại.` });
  }

  const canh = chu.save?.nt?.canh || null;
  const capCanh = canh?.lv || 0;
  const tiLe = tiLeBiCuop(capCanh);
  const duoc = Math.random() < tiLe;

  let mon = null;
  let so = 0;
  if (duoc) {
    const kho = khoCuopDuoc(chu);
    if (!kho.length) {
      // Kho rỗng thì coi như đi không: KHÔNG ghi nhật ký, cũng không tính lượt.
      // Tính lượt ở đây là người chơi mất 6 giờ chờ vì chuyện không xảy ra.
      return res.json({ duoc: false, rong: true, tiLe,
        canh: canh ? { sp: canh.sp, lv: capCanh } : null });
    }
    const chon = kho[Math.floor(Math.random() * kho.length)];
    so = Math.max(1, Math.min(TRAN_CUOP, Math.floor(chon.n * PHAN_CUOP)));
    mon = chon.id;
    // Trừ kho chủ nhà
    const k = chu.save.nt.kho;
    k[mon] = Math.max(0, Math.round(k[mon]) - so);
    if (!k[mon]) delete k[mon];
    // Cộng vào kho người cướp. Nếu người cướp chưa có nông trại thì vẫn nhận —
    // hàng vào kho, dựng nông trại xong là thấy.
    if (!req.user.save) req.user.save = {};
    if (!req.user.save.nt) req.user.save.nt = {};
    if (!req.user.save.nt.kho) req.user.save.nt.kho = {};
    const kt = req.user.save.nt.kho;
    kt[mon] = (Math.round(kt[mon]) || 0) + so;
    markDirty();
  }

  insert('farmRaids', {
    id: uid('raid'), from: req.user.id, fromName: req.user.username,
    to: chu.id, ts: Date.now(), duoc, mon, so, coCanh: !!canh,
  });

  // Chủ nhà LUÔN được biết — cướp im lặng thì người bị cướp chẳng hiểu kho mình
  // hụt vì cái gì, mà cũng không có lý do gì để đi cắt thú canh.
  sendMail(chu.id, {
    kind: 'nongtrai',
    from: 'Nông Trại',
    title: duoc ? 'Nông trại bị lấy mất hàng' : 'Có người mò vào nông trại',
    body: duoc
      ? `${req.user.username} vào nông trại và lấy đi ${so} món.`
      + (canh ? ' Thú canh có chặn nhưng không kịp.' : ' Nông trại chưa có thú canh nào.')
      : `${req.user.username} mò vào nông trại nhưng về không.`
      + (canh ? ' Thú canh đã chặn được.' : ''),
  });

  res.json({
    duoc, mon, so, tiLe,
    canh: canh ? { sp: canh.sp, lv: capCanh } : null,
  });
});
