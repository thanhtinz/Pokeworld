// TuxeWorld server | src/realtime.js | Socket.IO: online presence, chat thế giới, PvP realtime
// PvP theo mô hình lockstep: server phát 1 seed chung, hai client chạy cùng engine,
// server chỉ chuyển tiếp action + làm trọng tài kết quả (2 bên báo khớp mới ghi nhận).
import { verifyToken } from './auth.js';
import { find, insert, markDirty, uid, getDb } from './db.js';
import { listFriends } from './social.js';
import {
  setIo, addOnline, removeOnline, getConn, onlineCount, isOnline, emitToUsers,
} from './hub.js';
import { guildOf, memberOf, memberIds, pushGuildChat } from './guild.js';
import { saveDm, dmPublic, userByName } from './chat.js';

const online = {              // proxy nhỏ giữ nguyên cách dùng cũ trong file này
  get: (id) => getConn(id),
  delete: (id) => removeOnline(id),
  get size() { return onlineCount(); },
};
const rooms = new Map();    // roomId -> { players:[{id,username,socket}], seed, results:{} }
const invites = new Map();  // toUserId -> { fromId, fromName, ts }
const lastChat = new Map(); // userId -> timestamp (chống spam)
const lastDm = new Map();   // userId -> timestamp (chống spam DM)
const lastGuildChat = new Map();

const INVITE_TTL = 60000;
const CHAT_COOLDOWN = 2000;
const DM_COOLDOWN = 1000;
const GUILD_CHAT_COOLDOWN = 1000;

export { onlineCount, isOnline };

export function setupRealtime(io) {
  setIo(io);
  // Xác thực JWT khi bắt tay
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const payload = token && verifyToken(token);
    if (!payload) return next(new Error('Chưa đăng nhập.'));
    const user = find('users', u => u.id === payload.uid);
    if (!user) return next(new Error('Tài khoản không tồn tại.'));
    if (user.banned) return next(new Error(`Tài khoản bị khóa: ${user.banReason || ''}`));
    socket.data.user = user;
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    addOnline(user.id, { socketId: socket.id, username: user.username, avatar: user.avatar });
    global.__pwOnlineCount = online.size;
    user.lastSeen = Date.now();
    markDirty();

    socket.emit('welcome', {
      user: { id: user.id, username: user.username, avatar: user.avatar },
      motd: getDb().config.motd,
      online: online.size,
    });
    io.emit('presence:count', { online: online.size });
    notifyFriends(io, user, true);

    // ==== Chat thế giới ====
    socket.on('chat:send', ({ text } = {}) => {
      const now = Date.now();
      if (now - (lastChat.get(user.id) || 0) < CHAT_COOLDOWN) {
        return socket.emit('chat:error', { error: 'Gõ chậm thôi bạn ơi!' });
      }
      const clean = String(text || '').trim().slice(0, 200);
      if (!clean) return;
      lastChat.set(user.id, now);
      io.emit('chat:msg', {
        username: user.username, avatar: user.avatar, text: clean, ts: now,
      });
    });

    // ==== Tin nhắn riêng ====
    socket.on('dm:send', ({ to, text } = {}) => {
      const now = Date.now();
      if (now - (lastDm.get(user.id) || 0) < DM_COOLDOWN) {
        return socket.emit('chat:error', { error: 'Gõ chậm thôi bạn ơi!' });
      }
      const clean = String(text || '').trim().slice(0, 300);
      if (!clean) return;
      const target = userByName(to);
      if (!target) return socket.emit('chat:error', { error: 'Không tìm thấy người chơi.' });
      if (target.id === user.id) return socket.emit('chat:error', { error: 'Không thể nhắn cho chính mình.' });
      lastDm.set(user.id, now);
      const doc = saveDm(user.id, target.id, clean);
      const payload = dmPublic(doc);
      emitToUsers([target.id], 'dm:msg', payload);
      socket.emit('dm:msg', { ...payload, echo: true });
    });

    // ==== Chat bang hội ====
    socket.on('guild:send', ({ text } = {}) => {
      const now = Date.now();
      if (now - (lastGuildChat.get(user.id) || 0) < GUILD_CHAT_COOLDOWN) {
        return socket.emit('chat:error', { error: 'Gõ chậm thôi bạn ơi!' });
      }
      const clean = String(text || '').trim().slice(0, 300);
      if (!clean) return;
      const g = guildOf(user.id);
      if (!g || !memberOf(g, user.id)) {
        return socket.emit('chat:error', { error: 'Bạn chưa ở trong bang hội nào.' });
      }
      lastGuildChat.set(user.id, now);
      const doc = pushGuildChat(g.id, {
        from: user.username, avatar: user.avatar, text: clean,
      });
      emitToUsers(memberIds(g), 'guild:msg', doc);
    });

    // ==== PvP ====
    socket.on('pvp:challenge', ({ username } = {}) => {
      const lower = String(username || '').toLowerCase();
      const target = find('users', u => u.unameLower === lower);
      if (!target) return socket.emit('pvp:error', { error: 'Không tìm thấy người chơi.' });
      if (target.id === user.id) return socket.emit('pvp:error', { error: 'Không thể tự đấu với mình.' });
      const conn = online.get(target.id);
      if (!conn) return socket.emit('pvp:error', { error: `${target.username} đang offline.` });
      if (!(user.save?.party || []).length) return socket.emit('pvp:error', { error: 'Đội hình của bạn trống.' });
      if (!(target.save?.party || []).length) return socket.emit('pvp:error', { error: 'Đối thủ chưa có đội hình.' });

      invites.set(target.id, { fromId: user.id, fromName: user.username, ts: Date.now() });
      io.to(conn.socketId).emit('pvp:invited', { from: user.username, avatar: user.avatar });
      socket.emit('pvp:sent', { to: target.username });
    });

    socket.on('pvp:accept', () => {
      const inv = invites.get(user.id);
      if (!inv || Date.now() - inv.ts > INVITE_TTL) {
        invites.delete(user.id);
        return socket.emit('pvp:error', { error: 'Lời mời đã hết hạn.' });
      }
      invites.delete(user.id);
      const challenger = find('users', u => u.id === inv.fromId);
      const conn = challenger && online.get(challenger.id);
      if (!conn) return socket.emit('pvp:error', { error: 'Đối thủ đã offline.' });

      const roomId = uid('pvp');
      const seed = Math.floor(Math.random() * 2 ** 31);
      const room = {
        id: roomId, seed, results: {},
        players: [
          { id: challenger.id, username: challenger.username, socketId: conn.socketId },
          { id: user.id, username: user.username, socketId: socket.id },
        ],
      };
      rooms.set(roomId, room);
      socket.data.roomId = roomId;
      const challengerSocket = io.sockets.sockets.get(conn.socketId);
      if (challengerSocket) challengerSocket.data.roomId = roomId;

      const partyOf = (u) => (u.save?.party || []).slice(0, 6);
      // side 0 = người thách đấu, side 1 = người chấp nhận
      io.to(conn.socketId).emit('pvp:start', {
        roomId, seed, side: 0,
        me: { username: challenger.username, avatar: challenger.avatar, party: partyOf(challenger) },
        opponent: { username: user.username, avatar: user.avatar, party: partyOf(user) },
      });
      socket.emit('pvp:start', {
        roomId, seed, side: 1,
        me: { username: user.username, avatar: user.avatar, party: partyOf(user) },
        opponent: { username: challenger.username, avatar: challenger.avatar, party: partyOf(challenger) },
      });
    });

    socket.on('pvp:deny', () => {
      const inv = invites.get(user.id);
      if (!inv) return;
      invites.delete(user.id);
      const conn = online.get(inv.fromId);
      if (conn) io.to(conn.socketId).emit('pvp:denied', { by: user.username });
    });

    // Chuyển tiếp hành động sang đối thủ
    socket.on('pvp:action', (payload) => {
      const room = rooms.get(socket.data.roomId);
      if (!room) return;
      for (const p of room.players) {
        if (p.id !== user.id) io.to(p.socketId).emit('pvp:action', payload);
      }
    });

    // Hai bên báo kết quả — khớp mới ghi nhận
    socket.on('pvp:result', ({ winner } = {}) => {
      const room = rooms.get(socket.data.roomId);
      if (!room) return;
      room.results[user.id] = winner; // winner = username người thắng
      const ids = room.players.map(p => p.id);
      if (ids.every(id => room.results[id] !== undefined)) {
        const [r1, r2] = ids.map(id => room.results[id]);
        const disputed = r1 !== r2;
        const winnerName = disputed ? null : r1;
        recordPvp(room, winnerName, disputed);
        for (const p of room.players) {
          io.to(p.socketId).emit('pvp:end', { winner: winnerName, disputed });
          const s = io.sockets.sockets.get(p.socketId);
          if (s) s.data.roomId = null;
        }
        rooms.delete(room.id);
      }
    });

    socket.on('pvp:forfeit', () => endRoomByLeave(io, socket, user, 'forfeit'));

    socket.on('disconnect', () => {
      online.delete(user.id);
      global.__pwOnlineCount = online.size;
      user.lastSeen = Date.now();
      markDirty();
      io.emit('presence:count', { online: online.size });
      notifyFriends(io, user, false);
      endRoomByLeave(io, socket, user, 'disconnect');
    });
  });
}

function endRoomByLeave(io, socket, user, reason) {
  const room = rooms.get(socket.data?.roomId);
  if (!room) return;
  const other = room.players.find(p => p.id !== user.id);
  if (other) {
    io.to(other.socketId).emit('pvp:end', { winner: other.username, reason });
    const s = io.sockets.sockets.get(other.socketId);
    if (s) s.data.roomId = null;
  }
  recordPvp(room, other?.username || null, false);
  rooms.delete(room.id);
  socket.data.roomId = null;
}

function recordPvp(room, winnerName, disputed) {
  const winner = room.players.find(p => p.username === winnerName);
  const loser = room.players.find(p => p.username !== winnerName);
  insert('pvpHistory', {
    id: uid('pvp'), winner: winnerName, loser: loser?.username || null,
    disputed: !!disputed, ts: Date.now(),
  });
  if (!disputed && winner && loser) {
    const wu = find('users', u => u.id === winner.id);
    const lu = find('users', u => u.id === loser.id);
    if (wu) { wu.stats = wu.stats || { pvpWin: 0, pvpLose: 0 }; wu.stats.pvpWin++; }
    if (lu) { lu.stats = lu.stats || { pvpWin: 0, pvpLose: 0 }; lu.stats.pvpLose++; }
    markDirty();
  }
}

function notifyFriends(io, user, isOnlineNow) {
  const { friends } = listFriends(user);
  for (const f of friends) {
    const conn = online.get(f.id);
    if (conn) {
      io.to(conn.socketId).emit('friends:presence', {
        username: user.username, online: isOnlineNow,
      });
    }
  }
}

// Cho admin: đá người chơi ra khỏi server ngay khi bị ban
// Gửi riêng cho một người chơi đang online (im lặng nếu họ offline)
export function emitToUser(io, userId, event, payload) {
  const conn = online.get(userId);
  if (!conn) return false;
  io.sockets.sockets.get(conn.socketId)?.emit(event, payload);
  return true;
}

export function kickUser(io, userId, reason) {
  const conn = online.get(userId);
  if (!conn) return false;
  const s = io.sockets.sockets.get(conn.socketId);
  if (s) { s.emit('kicked', { reason }); s.disconnect(true); }
  return true;
}
