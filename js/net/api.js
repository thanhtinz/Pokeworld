// PokeWorld H5 | net/api.js | Gọi REST API máy chủ. Mọi hàm trả {ok, data|error} — không ném lỗi.
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
