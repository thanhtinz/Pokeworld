// PokeWorld H5 | engine/accounts.js | Hệ thống tài khoản cục bộ: đăng ký/đăng nhập, nhiều hồ sơ
// LƯU Ý: đây là tài khoản LƯU TRÊN MÁY (localStorage) — mỗi thiết bị một danh sách,
// mật khẩu băm SHA-256. Muốn đồng bộ đa thiết bị thật cần backend (Firebase...) sau này.

const STORE_KEY = 'pw_accounts_v1';
const LEGACY_SAVE = 'pokeworld_save_v1';

function readStore() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && Array.isArray(s.list)) return s;
  } catch (e) { /* hỏng thì tạo mới */ }
  return { list: [], activeId: null };
}
function writeStore(s) {
  localStorage.setItem(STORE_KEY, JSON.stringify(s));
}

// Băm mật khẩu (SHA-256 -> hex). Trình duyệt cũ không có crypto.subtle thì lưu thô có prefix.
async function hashPass(pass) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('pw:' + pass));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return 'plain:' + pass;
  }
}

// Chuyển save cũ (trước khi có tài khoản) thành hồ sơ đầu tiên
function migrateLegacy(store) {
  const raw = localStorage.getItem(LEGACY_SAVE);
  if (!raw) return;
  try {
    const save = JSON.parse(raw);
    store.list.push({
      id: 'acc_' + Date.now(),
      user: save.name || 'Trainer',
      hash: null,               // chưa có mật khẩu -> đăng nhập tự do, có thể đặt sau
      avatar: 'red',
      createdAt: Date.now(),
      save,
    });
    writeStore(store);
    localStorage.removeItem(LEGACY_SAVE);
  } catch (e) { /* bỏ qua save hỏng */ }
}

export function listAccounts() {
  const s = readStore();
  migrateLegacy(s);
  return s.list.map(a => ({ id: a.id, user: a.user, avatar: a.avatar, hasPass: !!a.hash, save: a.save }));
}

export function activeAccount() {
  const s = readStore();
  return s.list.find(a => a.id === s.activeId) || null;
}

export async function register(user, pass, avatar) {
  user = String(user || '').trim().slice(0, 12);
  if (user.length < 2) return [false, 'Tên tài khoản tối thiểu 2 ký tự.'];
  if (!pass || pass.length < 4) return [false, 'Mật khẩu tối thiểu 4 ký tự.'];
  const s = readStore();
  migrateLegacy(s);
  if (s.list.some(a => a.user.toLowerCase() === user.toLowerCase())) {
    return [false, 'Tên tài khoản đã tồn tại trên máy này.'];
  }
  const acc = {
    id: 'acc_' + Date.now() + '_' + Math.floor(Math.random() * 1e6),
    user,
    hash: await hashPass(pass),
    avatar: avatar === 'leaf' ? 'leaf' : 'red',
    createdAt: Date.now(),
    save: null,
  };
  s.list.push(acc);
  s.activeId = acc.id;
  writeStore(s);
  return [true, acc.id];
}

export async function login(accId, pass) {
  const s = readStore();
  const acc = s.list.find(a => a.id === accId);
  if (!acc) return [false, 'Không tìm thấy tài khoản.'];
  if (acc.hash) {
    const h = await hashPass(pass || '');
    if (h !== acc.hash) return [false, 'Sai mật khẩu.'];
  }
  s.activeId = acc.id;
  writeStore(s);
  return [true, null];
}

export function logout() {
  const s = readStore();
  s.activeId = null;
  writeStore(s);
}

// Đặt/đổi mật khẩu cho tài khoản đang đăng nhập
export async function setPassword(pass) {
  if (!pass || pass.length < 4) return [false, 'Mật khẩu tối thiểu 4 ký tự.'];
  const s = readStore();
  const acc = s.list.find(a => a.id === s.activeId);
  if (!acc) return [false, 'Chưa đăng nhập.'];
  acc.hash = await hashPass(pass);
  writeStore(s);
  return [true, null];
}

export function deleteAccount(accId) {
  const s = readStore();
  s.list = s.list.filter(a => a.id !== accId);
  if (s.activeId === accId) s.activeId = null;
  writeStore(s);
}

// ==== Cầu nối save cho state.js ====
export function loadActiveSave() {
  return activeAccount()?.save || null;
}
export function writeActiveSave(save) {
  const s = readStore();
  const acc = s.list.find(a => a.id === s.activeId);
  if (!acc) return false;
  acc.save = save;
  writeStore(s);
  return true;
}
export function clearActiveSave() {
  const s = readStore();
  const acc = s.list.find(a => a.id === s.activeId);
  if (acc) { acc.save = null; writeStore(s); }
}
// Avatar người chơi đang đăng nhập ('red' nam | 'leaf' nữ)
export function activeAvatar() {
  return activeAccount()?.avatar || 'red';
}
