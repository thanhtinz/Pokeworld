// TuxeWorld H5 | net/session.js | Phiên chơi online: giữ kết nối, tự lưu lên máy chủ,
// và nhớ hộ giao diện những gì máy chủ gửi về (tin nhắn, số người online, lời mời PvP).
//
// Toàn bộ phần này chỉ chạy khi người chơi đã chọn một máy chủ ở màn "Chọn máy chủ".
// Chơi offline thì mọi hàm ở đây đều im lặng trở về, game vẫn chạy bình thường.
import { isOnlineMode, getToken, getServerUrl } from './config.js';
import * as api from './api.js';
import * as sock from './socket.js';
import { G, save as saveGame } from '../state.js';
import { getSetting, onSettingChange } from '../engine/settings.js';
import { applyRemote, setGrants } from '../data/cosmetics.js';

const MAX_LOG = 120;

// Kho dữ liệu online dùng chung cho các màn hình
export const net = {
  connected: false,
  online: 0,               // số người đang online
  me: null,                // hồ sơ trên máy chủ
  chat: { world: [], guild: [] },
  dms: new Map(),          // tên người -> danh sách tin nhắn
  unread: { world: 0, guild: 0, dm: 0 },
  pvp: null,               // { with, seed, invited }
  lastError: null,
};

const listeners = new Set();
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function changed() { for (const fn of listeners) { try { fn(net); } catch (e) { console.warn(e); } } }

function push(list, msg) {
  list.push(msg);
  if (list.length > MAX_LOG) list.splice(0, list.length - MAX_LOG);
}

let wired = false;
function wire() {
  if (wired) return;
  wired = true;

  sock.on('welcome', d => {
    if (d?.user) net.me = d.user;
    if (typeof d?.online === 'number') net.online = d.online;
    net.connected = true;
    changed();
  });
  sock.on('presence:count', d => { net.online = d?.online ?? net.online; changed(); });
  sock.on('disconnected', () => { net.connected = false; changed(); });
  sock.on('error', d => { net.lastError = d?.error || 'Mất kết nối'; net.connected = false; changed(); });

  // Máy chủ gửi { username, text, ts } cho chat thế giới và { from, text } cho kênh khác
  // -> chuẩn hoá về một dạng { from, text, ts } cho giao diện.
  const norm = (m) => ({ from: m.from || m.username || '???', text: m.text, ts: m.ts, system: !!m.system });
  sock.on('chat:msg', m => { push(net.chat.world, norm(m)); net.unread.world += 1; changed(); });
  sock.on('guild:msg', m => { push(net.chat.guild, norm(m)); net.unread.guild += 1; changed(); });
  sock.on('dm:msg', m => {
    const who = m.from === net.me?.username ? m.to : m.from;
    if (!net.dms.has(who)) net.dms.set(who, []);
    push(net.dms.get(who), norm(m));
    net.unread.dm += 1;
    changed();
  });
  sock.on('chat:error', d => { net.lastError = d?.error || 'Không gửi được'; changed(); });

  sock.on('pvp:invited', d => { net.pvp = { with: d.from, invited: true }; changed(); });
  sock.on('pvp:sent', d => { net.pvp = { with: d.to, waiting: true }; changed(); });
  sock.on('pvp:denied', () => { net.pvp = null; changed(); });
  sock.on('pvp:start', d => { net.pvp = { with: d.opponent, seed: d.seed, started: true }; changed(); });
  sock.on('pvp:end', () => { net.pvp = null; changed(); });
  sock.on('kicked', d => { net.lastError = d?.reason || 'Bạn bị mời khỏi máy chủ.'; changed(); });

  // Admin sửa kho thời trang / trao món cho mình -> áp dụng ngay, không cần vào lại
  sock.on('cosmetics:update', d => { applyRemote(d?.items || [], getServerUrl() || ''); changed(); });
  sock.on('cosmetics:granted', d => { keepGrants(d?.cosmetics || []); changed(); });
}

// Ghi nhớ danh sách món được trao. Lưu luôn vào bản lưu để lần sau mở game
// (kể cả khi máy chủ chưa trả lời kịp) danh hiệu đã trao vẫn còn.
function keepGrants(list) {
  setGrants(list);
  if (G.p) { G.p.granted = [...list]; saveGame(); }
}

// Tải kho thời trang admin cấu hình. Chạy được cả khi chưa đăng nhập.
export async function loadCosmetics() {
  if (!isOnlineMode()) return { ok: false, offline: true };
  const r = await api.fetchCosmetics();
  if (r.ok) applyRemote(r.data?.items || [], getServerUrl() || '');
  return r;
}

// Mở phiên online. Gọi khi vào game; chơi offline thì không làm gì.
export async function startSession() {
  if (!isOnlineMode() || !getToken()) return { ok: false, offline: true };
  wire();
  const r = await sock.connect();
  net.connected = !!r.ok;
  if (!r.ok) net.lastError = r.error;
  else {
    // Đẩy bản lưu NGAY khi vào phiên. Không làm bước này thì trong 30 giây đầu
    // máy chủ chưa có dữ liệu người chơi, lập bang hội sẽ báo "chưa có dữ liệu game".
    await api.pushSave(buildSave());
    if (getSetting('autoSync')) api.startAutoSync(() => buildSave(), 30000);
    const me = await api.fetchMe();
    if (me.ok) {
      net.me = me.data?.user || me.data;
      keepGrants(me.data?.cosmetics || net.me?.cosmetics || []);
    }
    await loadCosmetics();
  }
  changed();
  return r;
}

export function endSession() {
  api.stopAutoSync();
  sock.disconnect();
  net.connected = false;
  changed();
}

// Bản lưu gửi lên máy chủ — chỉ những gì máy chủ cần để xếp hạng và chống gian lận
function buildSave() {
  const p = G.p || {};
  return {
    name: p.name, money: p.money, badges: p.badges,
    party: p.party, box: p.box, dex: p.dex,
    trainer: p.trainer, story: p.story, pos: p.pos,
    look: p.look, monSkins: p.monSkins,
  };
}

// Đẩy bản lưu ngay lập tức (dùng sau trận đấu, sau khi mua bán...)
export async function syncNow() {
  if (!isOnlineMode() || !getToken()) return { ok: false, offline: true };
  return api.pushSave(buildSave());
}

export const isOnline = () => isOnlineMode() && net.connected;

export function clearUnread(kind) {
  // Chỉ báo thay đổi khi thật sự có thay đổi. Báo vô điều kiện sẽ thành vòng lặp
  // vô hạn: màn chat vẽ lại -> xoá đánh dấu -> báo đổi -> vẽ lại -> ... treo trang.
  if (net.unread[kind] > 0) { net.unread[kind] = 0; changed(); }
}

// Bật/tắt tự đồng bộ ngay khi người chơi đổi trong Cài đặt
onSettingChange((k) => {
  if (k !== 'autoSync') return;
  if (getSetting('autoSync')) api.startAutoSync(() => buildSave(), 30000);
  else api.stopAutoSync();
});
