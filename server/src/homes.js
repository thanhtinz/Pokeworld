// TuxeWorld server | src/homes.js | Thăm nhà bạn + tường nhà
//
// Nhà của mỗi người nằm ngay trong bản lưu (save.estate): lô đất, mẫu nhà và
// danh sách đồ đã kê. Ở đây chỉ đọc ra rồi trả về, KHÔNG cho sửa — trang trí
// vẫn là việc của chính chủ bên client.
//
// Tường nhà là chỗ bạn bè ghé qua để lại một dòng. Ai vào xem được thì tuỳ
// chủ nhà đặt: mở cho tất cả, chỉ bạn bè, hay đóng hẳn.
import express from 'express';
import { find, filter, insert, remove, markDirty, uid, getDb } from './db.js';
import { authRequired } from './auth.js';
import { friendshipBetween, marriageOf } from './social.js';

export const homeRouter = express.Router();

const MAX_BAI = 400;              // độ dài tối đa một bài viết
const GIU_BAI = 100;              // mỗi nhà giữ tối đa ngần này bài
const CHO_GIUA_HAI_BAI = 20000;   // 20 giây giữa hai bài của cùng một người
export const CHE_DO = ['all', 'friends', 'none'];

const byName = (name) => {
  const lower = String(name || '').trim().toLowerCase();
  return find('users', u => u.unameLower === lower);
};

// Quan hệ giữa hai người: 'me' | 'partner' | 'friend' | 'nguoi_la'
function quanHe(me, chu) {
  if (!me) return 'nguoi_la';
  if (me.id === chu.id) return 'me';
  const m = marriageOf(chu.id);
  if (m && !m.pending && (m.a === me.id || m.b === me.id)) return 'partner';
  const f = friendshipBetween(me.id, chu.id);
  if (f && f.status === 'accepted') return 'friend';
  return 'nguoi_la';
}

const laNguoiNha = (qh) => qh === 'me' || qh === 'partner' || qh === 'friend';

export function cheDoTuong(chu) {
  const c = chu.save?.estate?.tuong;
  return CHE_DO.includes(c) ? c : 'friends';
}

// Xem được nhà này không
export function xemDuoc(me, chu) {
  const qh = quanHe(me, chu);
  if (qh === 'me') return true;
  const c = cheDoTuong(chu);
  if (c === 'none') return false;
  if (c === 'all') return true;
  return laNguoiNha(qh);
}

function baiCongKhai(b) {
  return {
    id: b.id, from: b.fromName, avatar: b.avatar, text: b.text, ts: b.ts,
    likes: (b.likes || []).length,
  };
}

// ==== Xem nhà ====
homeRouter.get('/:username', authRequired, (req, res) => {
  const chu = byName(req.params.username);
  if (!chu || chu.banned) return res.status(404).json({ error: 'Không tìm thấy người chơi.' });
  const me = req.user;
  const qh = quanHe(me, chu);
  if (!xemDuoc(me, chu)) {
    return res.status(403).json({
      error: cheDoTuong(chu) === 'none'
        ? `${chu.username} đang đóng cửa không tiếp khách.`
        : `${chu.username} chỉ cho bạn bè vào nhà.`,
    });
  }
  const es = chu.save?.estate || {};
  // Chỉ lấy đúng những gì cần để vẽ — không đổ cả bản lưu ra ngoài
  const bai = filter('wallPosts', b => b.homeId === chu.id)
    .sort((a, b) => b.ts - a.ts).slice(0, 50);
  res.json({
    username: chu.username,
    avatar: chu.avatar,
    quanHe: qh,
    lot: es.lot || null,
    base: es.base || null,
    dat: Array.isArray(es.dat) ? es.dat.slice(0, 200) : [],
    tuong: cheDoTuong(chu),
    vietDuoc: laNguoiNha(qh) || cheDoTuong(chu) === 'all',
    luotTham: chu.save?.estate?.tham || 0,
    bai: bai.map(baiCongKhai),
  });
});

// Ghi nhận một lượt thăm (không tính lượt của chính chủ)
homeRouter.post('/:username/tham', authRequired, (req, res) => {
  const chu = byName(req.params.username);
  if (!chu || chu.banned) return res.status(404).json({ error: 'Không tìm thấy người chơi.' });
  if (chu.id === req.user.id) return res.json({ ok: true, luotTham: chu.save?.estate?.tham || 0 });
  if (!xemDuoc(req.user, chu)) return res.status(403).json({ error: 'Không vào được nhà này.' });
  if (!chu.save) chu.save = {};
  if (!chu.save.estate) chu.save.estate = {};
  chu.save.estate.tham = (chu.save.estate.tham || 0) + 1;
  markDirty();
  res.json({ ok: true, luotTham: chu.save.estate.tham });
});

// ==== Tường nhà ====
homeRouter.post('/:username/wall', authRequired, (req, res) => {
  const chu = byName(req.params.username);
  if (!chu || chu.banned) return res.status(404).json({ error: 'Không tìm thấy người chơi.' });
  const qh = quanHe(req.user, chu);
  const che = cheDoTuong(chu);
  if (che === 'none' && qh !== 'me') {
    return res.status(403).json({ error: `${chu.username} đã khoá tường nhà.` });
  }
  if (che === 'friends' && !laNguoiNha(qh)) {
    return res.status(403).json({ error: 'Phải là bạn bè mới viết lên tường được.' });
  }
  const text = String(req.body?.text || '').trim().slice(0, MAX_BAI);
  if (!text) return res.status(400).json({ error: 'Chưa viết gì cả.' });

  const gan = filter('wallPosts', b => b.from === req.user.id)
    .reduce((m, b) => Math.max(m, b.ts), 0);
  if (Date.now() - gan < CHO_GIUA_HAI_BAI) {
    return res.status(429).json({ error: 'Viết chậm thôi, chờ vài giây nữa.' });
  }

  const bai = insert('wallPosts', {
    id: uid('wal'), homeId: chu.id, from: req.user.id,
    fromName: req.user.username, avatar: req.user.avatar,
    text, ts: Date.now(), likes: [],
  });
  // Nhà nào nhiều bài quá thì cắt bớt bài cũ nhất
  const cua = filter('wallPosts', b => b.homeId === chu.id).sort((a, b) => a.ts - b.ts);
  if (cua.length > GIU_BAI) {
    const bo = new Set(cua.slice(0, cua.length - GIU_BAI).map(b => b.id));
    remove('wallPosts', b => bo.has(b.id));
  }
  res.json(baiCongKhai(bai));
});

// Xoá bài: người viết hoặc chủ nhà đều xoá được
homeRouter.delete('/wall/:postId', authRequired, (req, res) => {
  const bai = find('wallPosts', b => b.id === req.params.postId);
  if (!bai) return res.status(404).json({ error: 'Không có bài này.' });
  if (bai.from !== req.user.id && bai.homeId !== req.user.id) {
    return res.status(403).json({ error: 'Chỉ người viết hoặc chủ nhà mới xoá được.' });
  }
  remove('wallPosts', b => b.id === bai.id);
  res.json({ ok: true });
});

// Thích / bỏ thích
homeRouter.post('/wall/:postId/like', authRequired, (req, res) => {
  const bai = find('wallPosts', b => b.id === req.params.postId);
  if (!bai) return res.status(404).json({ error: 'Không có bài này.' });
  if (!Array.isArray(bai.likes)) bai.likes = [];
  const i = bai.likes.indexOf(req.user.id);
  if (i >= 0) bai.likes.splice(i, 1);
  else bai.likes.push(req.user.id);
  markDirty();
  res.json({ likes: bai.likes.length, thich: i < 0 });
});

// Chủ nhà đổi ai được vào
homeRouter.post('/tuong/chedo', authRequired, (req, res) => {
  const c = String(req.body?.che || '');
  if (!CHE_DO.includes(c)) return res.status(400).json({ error: 'Chế độ không hợp lệ.' });
  const u = req.user;
  if (!u.save) u.save = {};
  if (!u.save.estate) u.save.estate = {};
  u.save.estate.tuong = c;
  markDirty();
  res.json({ tuong: c });
});

// Danh sách nhà ghé thăm được: bạn bè (và vợ/chồng) đã có nhà
homeRouter.get('/', authRequired, (req, res) => {
  const me = req.user;
  const rows = filter('friendships', f => (f.a === me.id || f.b === me.id) && f.status === 'accepted');
  const ids = new Set(rows.map(f => (f.a === me.id ? f.b : f.a)));
  const m = marriageOf(me.id);
  if (m && !m.pending) ids.add(m.a === me.id ? m.b : m.a);
  const ds = [];
  for (const id of ids) {
    const u = find('users', x => x.id === id);
    if (!u || u.banned) continue;
    const es = u.save?.estate || {};
    ds.push({
      username: u.username, avatar: u.avatar,
      base: es.base || null,
      soDo: Array.isArray(es.dat) ? es.dat.length : 0,
      luotTham: es.tham || 0,
      moCua: xemDuoc(me, u),
      soBai: getDb().wallPosts.filter(b => b.homeId === u.id).length,
    });
  }
  ds.sort((a, b) => (b.base ? 1 : 0) - (a.base ? 1 : 0));
  res.json({ nha: ds });
});
