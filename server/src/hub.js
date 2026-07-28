// TuxeWorld server | src/hub.js | Sổ đăng ký kết nối realtime (presence + gửi sự kiện)
// Tách riêng khỏi realtime.js để các module logic (guild, chat) gửi được sự kiện
// mà không tạo vòng lặp import.

const online = new Map(); // userId -> { socketId, username, avatar }
let ioRef = null;

export function setIo(io) { ioRef = io; }
export function getIo() { return ioRef; }

export function addOnline(userId, info) { online.set(userId, info); }
export function removeOnline(userId) { online.delete(userId); }
export function getConn(userId) { return online.get(userId) || null; }
export function onlineCount() { return online.size; }
export function isOnline(userId) { return online.has(userId); }

// Gửi sự kiện tới 1 người chơi (nếu đang online). Trả về true nếu đã gửi.
export function emitToUser(userId, event, payload) {
  const conn = online.get(userId);
  if (!conn || !ioRef) return false;
  ioRef.to(conn.socketId).emit(event, payload);
  return true;
}

// Gửi sự kiện tới nhiều người chơi cùng lúc. Trả về số người nhận được.
export function emitToUsers(userIds, event, payload) {
  let n = 0;
  for (const id of userIds || []) if (emitToUser(id, event, payload)) n++;
  return n;
}
