// TuxeWorld H5 | net/api.js | Gọi REST API máy chủ. Mọi hàm trả {ok, data|error} — không ném lỗi.
import { getServerUrl, getToken, setToken } from './config.js';

async function call(path, { method = 'GET', body, auth = true } = {}) {
  const base = getServerUrl();
  if (!base) return { ok: false, error: 'Chưa cấu hình máy chủ (đang chơi offline).' };
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = 'Bearer ' + t;
  }
  try {
    const res = await fetch(base + '/api' + path, {
      method, headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || `Lỗi máy chủ (${res.status})`, status: res.status };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: 'Không kết nối được máy chủ.' };
  }
}

// ==== Tài khoản ====
export async function register(username, password, avatar) {
  const r = await call('/auth/register', { method: 'POST', body: { username, password, avatar }, auth: false });
  if (r.ok) setToken(r.data.token);
  return r;
}
export async function login(username, password) {
  const r = await call('/auth/login', { method: 'POST', body: { username, password }, auth: false });
  if (r.ok) setToken(r.data.token);
  return r;
}
export const fetchMe = () => call('/me');

// ==== Save ====
export const pushSave = (save) => call('/save', { method: 'PUT', body: save });

// ==== Bảng xếp hạng / hồ sơ ====
export const fetchLeaderboard = (metric = 'money') => call(`/leaderboard?metric=${encodeURIComponent(metric)}`, { auth: false });
export const fetchPlayer = (username) => call(`/player/${encodeURIComponent(username)}`, { auth: false });
export const fetchConfig = () => call('/config', { auth: false });

// ==== Thời trang do admin cấu hình (ảnh + món thêm mới) ====
export const fetchCosmetics = () => call('/cosmetics', { auth: false });

// ==== Bạn bè ====
export const fetchFriends = () => call('/friends');
export const requestFriend = (username) => call('/friends/request', { method: 'POST', body: { username } });
export const respondFriend = (requestId, accept) => call('/friends/respond', { method: 'POST', body: { requestId, accept } });
export const removeFriend = (username) => call(`/friends/${encodeURIComponent(username)}`, { method: 'DELETE' });

// ==== Kết hôn ====
export const fetchMarriage = () => call('/marriage');
export const proposeMarriage = (username) => call('/marriage/propose', { method: 'POST', body: { username } });
export const respondMarriage = (accept) => call('/marriage/respond', { method: 'POST', body: { accept } });
export const divorce = () => call('/marriage', { method: 'DELETE' });

// ==== Bang hội ====
export const createGuild = (name, tag, desc, icon) => call('/guild/create', { method: 'POST', body: { name, tag, desc, icon } });
export const listGuilds = (q = '') => call(`/guild/list?q=${encodeURIComponent(q)}`);
export const myGuild = () => call('/guild/mine');
export const guildInfo = (id) => call(`/guild/${encodeURIComponent(id)}`);
export const joinGuild = (id) => call(`/guild/${encodeURIComponent(id)}/join`, { method: 'POST' });
export const respondApplicant = (id, userId, accept) => call(`/guild/${encodeURIComponent(id)}/applicant/${encodeURIComponent(userId)}`, { method: 'POST', body: { accept } });
export const leaveGuild = () => call('/guild/leave', { method: 'POST' });
export const kickMember = (userId) => call(`/guild/kick/${encodeURIComponent(userId)}`, { method: 'POST' });
export const promoteMember = (userId, role) => call(`/guild/promote/${encodeURIComponent(userId)}`, { method: 'POST', body: { role } });
export const donateGuild = (amount) => call('/guild/donate', { method: 'POST', body: { amount } });
export const updateGuildSettings = (settings) => call('/guild/settings', { method: 'PUT', body: settings });
export const disbandGuild = () => call('/guild/disband', { method: 'POST' });

// ==== Tin nhắn ====
export const fetchDmList = () => call('/chat/dm');
export const fetchDmHistory = (username, limit = 50) => call(`/chat/dm/${encodeURIComponent(username)}?limit=${limit}`);
export const fetchGuildChat = (limit = 50) => call(`/guild/chat?limit=${limit}`);

// Tự đồng bộ save lên máy chủ (gọi định kỳ, im lặng khi lỗi mạng)
let syncTimer = null;
export function startAutoSync(getSave, ms = 30000) {
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(async () => {
    const save = getSave();
    if (save && getToken()) await pushSave(save);
  }, ms);
}
export function stopAutoSync() {
  if (syncTimer) { clearInterval(syncTimer); syncTimer = null; }
}

// ==== Hộp thư ====
export const fetchMail = () => call('/mail');
export const readMail = (id) => call(`/mail/${encodeURIComponent(id)}/read`, { method: 'POST' });
export const claimMail = (id) => call(`/mail/${encodeURIComponent(id)}/claim`, { method: 'POST' });
export const claimAllMail = () => call('/mail/claim-all', { method: 'POST' });
export const cleanMail = () => call('/mail/clean', { method: 'POST' });

// ==== Thông báo ====
export const fetchNews = () => call('/news');
export const seenNews = () => call('/news/seen', { method: 'POST' });

// ==== Giftcode ====
export const redeemCode = (code) => call('/code', { method: 'POST', body: { code } });

// ==== Sự kiện ====
export const fetchEvents = () => call('/events');
export const syncEvent = (id, vars) => call(`/events/${encodeURIComponent(id)}/sync`, { method: 'POST', body: { vars } });
export const buyEvent = (id, shopId) => call(`/events/${encodeURIComponent(id)}/buy`, { method: 'POST', body: { shopId } });
export const rollEvent = (id, n = 1) => call(`/events/${encodeURIComponent(id)}/roll`, { method: 'POST', body: { n } });

// ==== Thẻ huấn luyện viên của người khác ====
export const fetchProfile = (username) => call(`/profile/${encodeURIComponent(username)}`);

// ==== Thăm nhà bạn + tường nhà ====
export const fetchHomes = () => call('/home');
export const fetchHome = (username) => call(`/home/${encodeURIComponent(username)}`);
export const visitHome = (username) => call(`/home/${encodeURIComponent(username)}/tham`, { method: 'POST' });
export const postWall = (username, text) =>
  call(`/home/${encodeURIComponent(username)}/wall`, { method: 'POST', body: { text } });
export const deleteWall = (postId) => call(`/home/wall/${encodeURIComponent(postId)}`, { method: 'DELETE' });
export const likeWall = (postId) => call(`/home/wall/${encodeURIComponent(postId)}/like`, { method: 'POST' });
export const setWallMode = (che) => call('/home/tuong/chedo', { method: 'POST', body: { che } });

// ==== Quà tặng + điểm thân mật ====
export const fetchGiftShop = () => call('/gift', { auth: false });
export const fetchIntimacy = () => call('/gift/thanmat');
export const sendGift = (username, giftId) =>
  call('/gift/tang', { method: 'POST', body: { username, giftId } });
