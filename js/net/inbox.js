// TuxeWorld H5 | net/inbox.js | Hộp thư + Thông báo
//
// Cả hai đều nằm trên máy chủ. Chơi offline thì hai nút trên thanh trên vẫn
// bấm được nhưng chỉ báo "cần nối máy chủ" — không giấu đi để người chơi biết
// là có tính năng đó.
import * as api from './api.js';
import { isOnlineMode, getToken } from './config.js';
import { G, addMoney, addItem } from '../state.js';

export const inbox = {
  mail: [],
  news: [],
  unreadMail: 0,      // thư chưa đọc
  unclaimed: 0,       // thư còn quà chưa nhận
  unreadNews: 0,
  loaded: false,
};

const listeners = new Set();
export function onInbox(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function changed() { for (const fn of listeners) { try { fn(inbox); } catch (e) { console.warn(e); } } }

export const canInbox = () => isOnlineMode() && !!getToken();

export async function refreshInbox() {
  if (!canInbox()) { inbox.loaded = false; return false; }
  const [m, n] = await Promise.all([api.fetchMail(), api.fetchNews()]);
  if (m.ok) {
    inbox.mail = m.data.mail || [];
    inbox.unreadMail = m.data.unread || 0;
    inbox.unclaimed = m.data.unclaimed || 0;
  }
  if (n.ok) {
    inbox.news = n.data.news || [];
    inbox.unreadNews = n.data.unread || 0;
  }
  inbox.loaded = m.ok || n.ok;
  changed();
  return inbox.loaded;
}

// Cộng quà vào bản lưu. Máy chủ chỉ ghi nhận đã trao, phần cộng nằm ở client
// để dùng chung đúng một đường với mọi thứ khác trong game.
export function nhanQua(qua) {
  if (!qua) return;
  if (qua.money > 0) addMoney(qua.money);
  for (const it of qua.items || []) addItem(it.id, it.n || 1);
}

export async function claimOne(id) {
  const r = await api.claimMail(id);
  if (!r.ok) return [null, r.error || 'Không nhận được quà.'];
  nhanQua(r.data.qua);
  await refreshInbox();
  return [r.data.qua, null];
}

export async function claimAll() {
  const r = await api.claimAllMail();
  if (!r.ok) return [null, r.error || 'Không nhận được quà.'];
  nhanQua(r.data.qua);
  await refreshInbox();
  return [{ qua: r.data.qua, n: r.data.n }, null];
}

export async function markRead(id) {
  const m = inbox.mail.find(x => x.id === id);
  if (!m || m.read) return;
  m.read = true;
  inbox.unreadMail = Math.max(0, inbox.unreadMail - 1);
  changed();
  await api.readMail(id);
}

export async function seenAllNews() {
  if (!inbox.unreadNews) return;
  inbox.unreadNews = 0;
  changed();
  await api.seenNews();
}

export async function dungMa(code) {
  if (!canInbox()) return [null, 'Cần nối máy chủ mới nhập được mã.'];
  const r = await api.redeemCode(code);
  if (!r.ok) return [null, r.error || 'Mã không dùng được.'];
  await refreshInbox();
  return [r.data.mail, null];
}
