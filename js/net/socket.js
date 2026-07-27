// PokeWorld H5 | net/socket.js | Kết nối realtime: chat thế giới, presence, PvP
// Thư viện socket.io-client được nạp động từ chính máy chủ (không cần bundle).
import { getServerUrl, getToken } from './config.js';

let socket = null;
const handlers = new Map(); // event -> Set<fn>

function emitLocal(event, payload) {
  for (const fn of handlers.get(event) || []) {
    try { fn(payload); } catch (e) { console.warn('[socket]', event, e); }
  }
}

export function on(event, fn) {
  if (!handlers.has(event)) handlers.set(event, new Set());
  handlers.get(event).add(fn);
  return () => handlers.get(event)?.delete(fn);
}

async function loadClientLib(base) {
  if (window.io) return window.io;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = base + '/socket.io/socket.io.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('Không tải được thư viện realtime từ máy chủ.'));
    document.head.appendChild(s);
  });
  return window.io;
}

// Kết nối. Trả về {ok, error}
export async function connect() {
  const base = getServerUrl();
  const token = getToken();
  if (!base || !token) return { ok: false, error: 'Chưa đăng nhập máy chủ.' };
  if (socket?.connected) return { ok: true };
  try {
    const io = await loadClientLib(base);
    socket = io(base, { auth: { token }, transports: ['websocket', 'polling'] });

    // Chuyển tiếp sự kiện máy chủ ra hệ thống handler nội bộ
    for (const ev of [
      'welcome', 'presence:count', 'chat:msg', 'chat:error',
      'friends:presence', 'config:update', 'kicked',
      'pvp:invited', 'pvp:sent', 'pvp:denied', 'pvp:start',
      'pvp:action', 'pvp:end', 'pvp:error',
    ]) {
      socket.on(ev, payload => emitLocal(ev, payload));
    }
    socket.on('connect_error', err => emitLocal('error', { error: err.message }));
    socket.on('disconnect', reason => emitLocal('disconnected', { reason }));

    return await new Promise(resolve => {
      const t = setTimeout(() => resolve({ ok: false, error: 'Hết thời gian kết nối.' }), 8000);
      socket.on('connect', () => { clearTimeout(t); resolve({ ok: true }); });
      socket.on('connect_error', err => { clearTimeout(t); resolve({ ok: false, error: err.message }); });
    });
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export function disconnect() {
  if (socket) { socket.disconnect(); socket = null; }
}
export const isConnected = () => !!socket?.connected;

// ==== Hành động ====
export const sendChat = (text) => socket?.emit('chat:send', { text });
export const challengePvp = (username) => socket?.emit('pvp:challenge', { username });
export const acceptPvp = () => socket?.emit('pvp:accept');
export const denyPvp = () => socket?.emit('pvp:deny');
export const sendPvpAction = (action) => socket?.emit('pvp:action', action);
export const reportPvpResult = (winner) => socket?.emit('pvp:result', { winner });
export const forfeitPvp = () => socket?.emit('pvp:forfeit');
