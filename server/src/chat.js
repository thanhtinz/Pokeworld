// TuxeWorld server | src/chat.js | Tin nhắn riêng (DM): lưu trữ + REST lịch sử hội thoại
import express from 'express';
import { getDb, find, filter, insert, remove, markDirty, uid } from './db.js';
import { authRequired } from './auth.js';
import { isOnline } from './hub.js';

export const MAX_DM_PER_PAIR = 500;
export const DM_MAX_LEN = 300;

const pairMatch = (a, b) => (d) =>
  (d.from === a && d.to === b) || (d.from === b && d.to === a);

const userById = (id) => find('users', u => u.id === id);
export const userByName = (name) => {
  const lower = String(name || '').trim().toLowerCase();
  return find('users', u => u.unameLower === lower);
};

// Lưu 1 tin nhắn riêng, cắt bớt tin cũ (giữ 500 tin mới nhất mỗi cặp)
export function saveDm(fromId, toId, text) {
  const doc = insert('dms', {
    id: uid('dm'), from: fromId, to: toId,
    text: String(text).slice(0, DM_MAX_LEN), ts: Date.now(), read: false,
  });
  const rows = filter('dms', pairMatch(fromId, toId));
  if (rows.length > MAX_DM_PER_PAIR) {
    const keep = new Set(rows.slice(-MAX_DM_PER_PAIR).map(d => d.id));
    remove('dms', d => pairMatch(fromId, toId)(d) && !keep.has(d.id));
  }
  return doc;
}

// Chuyển doc trong DB sang dạng gửi cho client (dùng username thay vì id)
export function dmPublic(d) {
  const f = userById(d.from), t = userById(d.to);
  return {
    id: d.id, from: f?.username || '?', to: t?.username || '?',
    avatar: f?.avatar || null, text: d.text, ts: d.ts, read: !!d.read,
  };
}

// Lịch sử hội thoại với 1 người + đánh dấu đã đọc các tin họ gửi cho mình
export function dmHistory(user, other, limit = 50) {
  const n = Math.max(1, Math.min(200, Number(limit) || 50));
  const rows = filter('dms', pairMatch(user.id, other.id));
  let changed = false;
  for (const d of rows) {
    if (d.to === user.id && !d.read) { d.read = true; changed = true; }
  }
  if (changed) markDirty();
  return rows.slice(-n).map(dmPublic);
}

// Danh sách hội thoại: người đối thoại, tin cuối, số tin chưa đọc
export function dmConversations(user) {
  const byOther = new Map();
  for (const d of getDb().dms) {
    if (d.from !== user.id && d.to !== user.id) continue;
    const otherId = d.from === user.id ? d.to : d.from;
    const cur = byOther.get(otherId) || { unread: 0, last: null };
    if (!cur.last || d.ts >= cur.last.ts) cur.last = d;
    if (d.to === user.id && !d.read) cur.unread++;
    byOther.set(otherId, cur);
  }
  return [...byOther.entries()]
    .map(([otherId, v]) => {
      const u = userById(otherId);
      if (!u) return null;
      return {
        userId: otherId, username: u.username, avatar: u.avatar,
        online: isOnline(otherId), lastSeen: u.lastSeen,
        unread: v.unread,
        last: { text: v.last.text, ts: v.last.ts, fromMe: v.last.from === user.id },
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.last.ts - a.last.ts);
}

// ==== Router REST (/api/chat) ====
export const chatRouter = express.Router();
chatRouter.use(authRequired);

chatRouter.get('/dm', (req, res) => {
  res.json({ rows: dmConversations(req.user) });
});

chatRouter.get('/dm/:username', (req, res) => {
  const other = userByName(req.params.username);
  if (!other) return res.status(404).json({ error: 'Không tìm thấy người chơi.' });
  res.json({ username: other.username, rows: dmHistory(req.user, other, req.query.limit) });
});
