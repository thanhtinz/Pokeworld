// TuxeWorld H5 | net/config.js | Cấu hình địa chỉ máy chủ (rỗng = chơi offline trên máy)
const KEY_URL = 'pw_server_url';
const KEY_TOKEN = 'pw_token';

// Địa chỉ mặc định khi build cho VPS — để trống thì người chơi tự nhập trong game
const DEFAULT_SERVER = '';

export function getServerUrl() {
  return localStorage.getItem(KEY_URL) || DEFAULT_SERVER || null;
}

export function setServerUrl(url) {
  if (!url) { localStorage.removeItem(KEY_URL); return null; }
  const clean = String(url).trim().replace(/\/+$/, '');
  localStorage.setItem(KEY_URL, clean);
  return clean;
}

export const isOnlineMode = () => !!getServerUrl();

export const getToken = () => localStorage.getItem(KEY_TOKEN) || null;
export const setToken = (t) => t ? localStorage.setItem(KEY_TOKEN, t) : localStorage.removeItem(KEY_TOKEN);
export const clearSession = () => { setToken(null); };
