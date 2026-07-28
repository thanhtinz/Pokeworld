// TuxeWorld H5 | net/events.js | Sự kiện do ban quản trị dựng
//
// Sự kiện nằm trên máy chủ, nội dung do admin tự khai (xem server/src/events.js).
// Phần của client chỉ có hai việc:
//   1. Đọc BẢNG BIẾN của bản lưu rồi gửi lên — máy chủ so với mốc lúc mở sự
//      kiện lần đầu để biết đã làm được bao nhiêu và trao đồng sự kiện.
//   2. Gọi đổi thưởng / quay thưởng. Quà không cộng thẳng vào túi mà về Hộp
//      thư, người chơi bấm nhận ở đó — đi chung một đường với giftcode.
import * as api from './api.js';
import { isOnlineMode, getToken } from './config.js';
import { G } from '../state.js';

export const events = { list: [], loaded: false };

export const canEvent = () => isOnlineMode() && !!getToken();

// Bảng biến gửi lên máy chủ. Tên khoá phải khớp BIEN_GAME bên server.
export function bienGame() {
  const p = G.p;
  if (!p) return {};
  const ngay = Math.floor((Date.now() - (p.stats?.playSince || Date.now())) / 86400000) + 1;
  return {
    wins: p.stats?.wins || 0,
    catches: p.stats?.catches || 0,
    dexSeen: Object.keys(p.dex?.seen || {}).length,
    dexCaught: Object.keys(p.dex?.caught || {}).length,
    steps: p.stats?.steps || 0,
    money: p.money || 0,
    trainerLv: p.trainer?.level || 1,
    badges: (p.badges || []).length,
    playDays: ngay,
  };
}

export async function refreshEvents() {
  if (!canEvent()) { events.loaded = false; events.list = []; return false; }
  const r = await api.fetchEvents();
  if (!r.ok) return false;
  events.list = r.data.events || [];
  events.loaded = true;
  return true;
}

// Chấm công một sự kiện: gửi biến lên, nhận về số đồng và tiến độ từng nhiệm vụ
export async function syncEvent(id) {
  const r = await api.syncEvent(id, bienGame());
  if (!r.ok) return [null, r.error || 'Không nối được sự kiện.'];
  return [r.data, null];
}

export async function buyEvent(id, shopId) {
  const r = await api.buyEvent(id, shopId);
  if (!r.ok) return [null, r.error || 'Không đổi được.'];
  return [r.data, null];
}

export async function rollEvent(id, n = 1) {
  const r = await api.rollEvent(id, n);
  if (!r.ok) return [null, r.error || 'Không quay được.'];
  return [r.data, null];
}
