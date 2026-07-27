// PokeWorld server | src/social.js | Hệ thống bạn bè + kết hôn
import { find, filter, insert, remove, markDirty, uid } from './db.js';

const pairKey = (a, b) => [a, b].sort().join('|');

// ==== Bạn bè ====
export function friendshipBetween(aId, bId) {
  const key = pairKey(aId, bId);
  return find('friendships', f => pairKey(f.a, f.b) === key);
}

export function sendFriendRequest(fromUser, toUser) {
  if (fromUser.id === toUser.id) return [null, 'Không thể kết bạn với chính mình.'];
  const existing = friendshipBetween(fromUser.id, toUser.id);
  if (existing) {
    if (existing.status === 'accepted') return [null, 'Hai bạn đã là bạn bè rồi.'];
    if (existing.from === fromUser.id) return [null, 'Đã gửi lời mời, đang chờ phản hồi.'];
    // Người kia đã mời mình trước -> chấp nhận luôn
    existing.status = 'accepted';
    markDirty();
    return [existing, null];
  }
  if (filter('friendships', f => (f.a === fromUser.id || f.b === fromUser.id) && f.status === 'accepted').length >= 100) {
    return [null, 'Danh sách bạn bè đã đầy (tối đa 100).'];
  }
  const doc = insert('friendships', {
    id: uid('frd'), a: fromUser.id, b: toUser.id,
    status: 'pending', from: fromUser.id, createdAt: Date.now(),
  });
  return [doc, null];
}

export function respondFriendRequest(user, requestId, accept) {
  const req = find('friendships', f => f.id === requestId);
  if (!req) return [null, 'Không tìm thấy lời mời.'];
  if (req.status !== 'pending') return [null, 'Lời mời đã được xử lý.'];
  // Chỉ người NHẬN mới được phản hồi
  const receiver = req.from === req.a ? req.b : req.a;
  if (receiver !== user.id) return [null, 'Bạn không phải người nhận lời mời này.'];
  if (accept) {
    req.status = 'accepted';
    markDirty();
    return [req, null];
  }
  remove('friendships', f => f.id === requestId);
  return [{ removed: true }, null];
}

export function listFriends(user) {
  const rows = filter('friendships', f => f.a === user.id || f.b === user.id);
  const friends = [], incoming = [], outgoing = [];
  for (const f of rows) {
    const otherId = f.a === user.id ? f.b : f.a;
    const other = find('users', u => u.id === otherId);
    if (!other) continue;
    const info = { id: other.id, username: other.username, avatar: other.avatar, lastSeen: other.lastSeen };
    if (f.status === 'accepted') friends.push(info);
    else if (f.from === user.id) outgoing.push({ ...info, requestId: f.id });
    else incoming.push({ ...info, requestId: f.id });
  }
  return { friends, incoming, outgoing };
}

export function removeFriend(user, otherId) {
  const key = pairKey(user.id, otherId);
  const n = remove('friendships', f => pairKey(f.a, f.b) === key);
  return n > 0;
}

// ==== Kết hôn ====
export function marriageOf(userId) {
  return find('marriages', m => m.a === userId || m.b === userId);
}

export function proposeMarriage(fromUser, toUser) {
  if (fromUser.id === toUser.id) return [null, 'Không thể cầu hôn chính mình.'];
  if (marriageOf(fromUser.id)) return [null, 'Bạn đang trong một mối quan hệ rồi.'];
  if (marriageOf(toUser.id)) return [null, `${toUser.username} đã kết hôn với người khác.`];
  const fr = friendshipBetween(fromUser.id, toUser.id);
  if (!fr || fr.status !== 'accepted') return [null, 'Phải là bạn bè trước khi cầu hôn.'];
  const existing = find('marriages', m => m.pending && ((m.a === fromUser.id && m.b === toUser.id) || (m.a === toUser.id && m.b === fromUser.id)));
  if (existing) return [null, 'Đã có lời cầu hôn đang chờ.'];
  const doc = insert('marriages', {
    id: uid('mrg'), a: fromUser.id, b: toUser.id,
    pending: true, from: fromUser.id, since: null, createdAt: Date.now(),
  });
  return [doc, null];
}

export function respondMarriage(user, accept) {
  const m = find('marriages', x => x.pending && x.b === user.id);
  if (!m) return [null, 'Không có lời cầu hôn nào.'];
  if (accept) {
    m.pending = false;
    m.since = Date.now();
    markDirty();
    return [m, null];
  }
  remove('marriages', x => x.id === m.id);
  return [{ removed: true }, null];
}

export function divorce(user) {
  const m = marriageOf(user.id);
  if (!m) return [null, 'Bạn chưa kết hôn.'];
  remove('marriages', x => x.id === m.id);
  return [{ removed: true }, null];
}

// Thông tin hôn nhân để trả về client
export function marriageInfo(user) {
  const m = find('marriages', x => (x.a === user.id || x.b === user.id));
  if (!m) return { married: false, pendingIncoming: null, pendingOutgoing: null };
  const otherId = m.a === user.id ? m.b : m.a;
  const other = find('users', u => u.id === otherId);
  const partner = other ? { id: other.id, username: other.username, avatar: other.avatar } : null;
  if (m.pending) {
    return m.from === user.id
      ? { married: false, pendingOutgoing: partner, pendingIncoming: null }
      : { married: false, pendingIncoming: partner, pendingOutgoing: null };
  }
  return { married: true, partner, since: m.since };
}
