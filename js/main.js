// TuxeWorld H5 | main.js | Router màn hình + khởi động app
import { G, load, hasSave } from './state.js';
import { toast } from './ui/kit.js';

// Các màn hình đăng ký render(el, params). Import động để dễ tách file.
import * as home from './ui/home.js';
import * as battle from './ui/battle.js';
import * as party from './ui/party.js';
import * as dex from './ui/dex.js';
import * as bag from './ui/bag.js';
import * as shop from './ui/shop.js';
import * as quest from './ui/quest.js';
import * as starter from './ui/starter.js';
import * as menu from './ui/menu.js';
import * as loginScr from './ui/login.js';
import * as splash from './ui/splash.js';
import * as loading from './ui/loading.js';
import * as auth from './ui/auth.js';
import * as serverpick from './ui/serverpick.js';
import * as createchar from './ui/createchar.js';
import * as intro from './ui/intro.js';
import * as world from './ui/world.js';
import * as character from './ui/character.js';
import * as chat from './ui/chat.js';
import * as rank from './ui/rank.js';
import * as guild from './ui/guild.js';
import * as friends from './ui/friends.js';
import * as pvp from './ui/pvp.js';
import * as marriage from './ui/marriage.js';
import * as settings from './ui/settings.js';
import * as fashion from './ui/fashion.js';
import { activeAccount } from './engine/accounts.js';
import { startSession, onChange, net } from './net/session.js';
import { wirePvpInvites } from './net/pvpinvite.js';
import { maxHp } from './engine/pokemon.js';
import { trainerLevel } from './engine/player.js';
import { fmt } from './util.js';
import { uiIcon } from './ui/icons.js';
import { avatarSrc } from './ui/look.js';
import { playMusic } from './engine/settings.js';

// Nhạc nền theo màn: mấy màn mở đầu dùng nhạc nhẹ, đánh nhau thì đổi bản khác
const MUSIC_BY_SCREEN = {
  splash: 'title', loading: 'title', auth: 'title', login: 'title',
  serverpick: 'title', createchar: 'title', intro: 'title', starter: 'title',
  battle: 'battle', pvp: 'battle',
};

const SCREENS = {
  home, battle, party, dex, bag, shop, quest, starter, menu, character,
  chat, rank, guild, friends, pvp, marriage, settings, fashion,
  login: loginScr, splash, loading, auth, serverpick, createchar, intro, world,
};

// Các màn thuộc luồng mở đầu -> ẩn thanh điều hướng dưới
const NO_NAV = new Set(['splash', 'loading', 'auth', 'serverpick', 'createchar', 'intro', 'starter', 'battle', 'login', 'world', 'pvp']);

let current = null;
let currentParams = null;

// Chuyển màn hình. Trong trận battle thì nav bị khóa.
export function show(name, params = {}) {
  const scr = SCREENS[name];
  if (!scr) { console.warn('screen?', name); return; }
  current = name;
  currentParams = params;
  const el = document.getElementById('screen');
  el.dispatchEvent(new CustomEvent('screen-leave'));
  el.className = `screen screen-${name}`;
  el.innerHTML = '';
  // Màn nào lỗi thì hiện thẳng lỗi + nút tải lại. Trước đây render() ném lỗi là
  // người chơi ngồi trước một màn TRẮNG không biết làm gì (hay gặp khi máy còn
  // giữ bản cũ trong bộ nhớ đệm, mà bản cũ lại gọi tệp nay đã xoá).
  try {
    scr.render(el, params);
    // Có màn "return sớm" khi thiếu dữ liệu và để lại màn hình trắng trơn —
    // người chơi tưởng game treo. Trắng thì báo luôn cho biết đường mà làm.
    if (!el.children.length && !KHONG_CAN_NOI_DUNG.has(name)) {
      queueMicrotask(() => {
        if (current === name && !el.children.length) showCrash(el, name, new Error('Màn hình không có nội dung'));
      });
    }
  } catch (e) {
    console.error('render', name, e);
    showCrash(el, name, e);
  }
  // Bottom nav: ẩn trong suốt luồng mở đầu và khi đang đánh
  const nav = document.getElementById('bottom-nav');
  nav.hidden = NO_NAV.has(name);
  nav.querySelectorAll('button').forEach(b =>
    b.classList.toggle('active', b.dataset.nav === name));
  // Nút chat nổi: ẩn cùng lúc với nav, và ẩn luôn khi đang ở chính trang chat
  const fab = document.getElementById('chat-fab');
  if (fab) fab.hidden = nav.hidden || name === 'chat';
  // Thanh trên hiện cùng nhịp với thanh dưới
  drawTopBar(nav.hidden);
  playMusic(MUSIC_BY_SCREEN[name] || 'town');
  el.scrollTop = 0;
}

// Mấy màn này tự chuyển tiếp ngay (không kịp vẽ gì) nên trắng là bình thường
const KHONG_CAN_NOI_DUNG = new Set(['starter']);

// Màn hình báo lỗi + nút xoá bộ nhớ đệm rồi tải lại
function showCrash(el, name, err) {
  el.innerHTML = `
    <div class="card" style="margin:24px 14px">
      <h2 style="margin-bottom:8px">Màn "${name}" không mở được</h2>
      <p class="empty-note" style="text-align:left">Thường là do máy còn giữ bản game cũ.
      Bấm nút dưới để xoá bộ nhớ đệm và tải lại bản mới nhất.</p>
      <pre style="white-space:pre-wrap;font-size:11px;color:var(--muted);margin:8px 0">${
        String(err && err.message || err).slice(0, 200)}</pre>
      <button class="btn btn-primary" id="btn-hard-reload">Xoá bộ nhớ đệm & tải lại</button>
    </div>`;
  el.querySelector('#btn-hard-reload').addEventListener('click', hardReload);
}

// Gỡ service worker + xoá cache rồi nạp lại trang
export async function hardReload() {
  try {
    const regs = await navigator.serviceWorker?.getRegistrations?.() || [];
    await Promise.all(regs.map(r => r.unregister()));
    const keys = await caches?.keys?.() || [];
    await Promise.all(keys.map(k => caches.delete(k)));
  } catch (e) { console.warn('hardReload', e); }
  location.reload();
}

// Vẽ icon SVG vào mọi chỗ đánh dấu data-ico (thanh dưới, nút chat nổi)
for (const el of document.querySelectorAll('[data-ico]')) {
  el.innerHTML = uiIcon(el.dataset.ico, el.classList.contains('tb-coin') ? 17 : 26);
}

// ==== Thanh trên: avatar, tên, cấp, tiền ====
// Gọi lại sau mỗi lần đổi màn và mỗi lần refresh() nên số tiền luôn đúng.
export function drawTopBar(hide = false) {
  const bar = document.getElementById('top-bar');
  if (!bar) return;
  if (hide || !G.p) { bar.hidden = true; return; }
  bar.hidden = false;
  const ava = document.getElementById('tb-ava');
  const src = avatarSrc();
  if (ava.getAttribute('src') !== src) { ava.src = src; ava.style.visibility = ''; }
  document.getElementById('tb-name').textContent = G.p.name || '';
  document.getElementById('tb-lv').textContent = `Lv.${trainerLevel()}`;
  document.getElementById('tb-money').textContent = fmt(G.p.money || 0);
}

// Vẽ lại màn hình hiện tại (sau khi state đổi)
export function refresh() { if (current) show(current, currentParams); }

export function inBattle() { return current === 'battle'; }

// Chấm đỏ trên nút chat nổi khi có tin nhắn chưa đọc
onChange(() => {
  const dot = document.getElementById('nav-dot');
  if (!dot) return;
  const n = net.unread.world + net.unread.guild + net.unread.dm;
  dot.hidden = !(n > 0) || current === 'chat';
});

// Mở phiên online nếu người chơi đã chọn máy chủ (chơi offline thì bỏ qua)
wirePvpInvites();
startSession().catch(e => console.warn('[online]', e));

// Nav dưới + nút back data-goto
document.getElementById('bottom-nav').addEventListener('click', e => {
  const btn = e.target.closest('button[data-nav]');
  if (!btn) return;
  if (inBattle()) { toast('Đang trong trận đấu!'); return; }
  show(btn.dataset.nav);
});
// ==== Nút chat nổi: kéo thả được, nhớ vị trí theo máy ====
// Kéo xong nút bám mép gần nhất và không bao giờ ra khỏi màn hình, kể cả khi
// xoay ngang hoặc đổi cỡ cửa sổ.
(function wireChatFab() {
  const fab = document.getElementById('chat-fab');
  if (!fab) return;
  const KEY = 'pw_fab_pos';
  const MARGIN = 10;
  const NAV_GAP = 76;                       // chừa chỗ cho thanh điều hướng dưới
  let dragging = false, moved = false, sx = 0, sy = 0, ox = 0, oy = 0;

  const clampPos = (x, y) => {
    const w = fab.offsetWidth || 52, h = fab.offsetHeight || 52;
    return [
      Math.min(Math.max(MARGIN, x), Math.max(MARGIN, innerWidth - w - MARGIN)),
      Math.min(Math.max(MARGIN, y), Math.max(MARGIN, innerHeight - h - NAV_GAP)),
    ];
  };

  function place(x, y, save = false) {
    const [cx, cy] = clampPos(x, y);
    fab.style.left = cx + 'px';
    fab.style.top = cy + 'px';
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
    if (save) { try { localStorage.setItem(KEY, JSON.stringify({ x: cx, y: cy })); } catch { /* bỏ qua */ } }
  }

  function restore() {
    let p = null;
    try { p = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { p = null; }
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) place(p.x, p.y);
  }

  fab.addEventListener('pointerdown', (e) => {
    dragging = true; moved = false;
    sx = e.clientX; sy = e.clientY;
    const r = fab.getBoundingClientRect();
    ox = r.left; oy = r.top;
    fab.setPointerCapture(e.pointerId);
    fab.classList.add('dragging');
  });

  fab.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    // Nhích vài pixel mới tính là kéo, không thì chạm hơi lệch tay là mất cú bấm
    if (!moved && Math.hypot(dx, dy) < 6) return;
    moved = true;
    e.preventDefault();
    place(ox + dx, oy + dy);
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    fab.classList.remove('dragging');
    if (e && e.pointerId !== undefined) { try { fab.releasePointerCapture(e.pointerId); } catch { /* bỏ qua */ } }
    if (moved) {
      const r = fab.getBoundingClientRect();
      place(r.left, r.top, true);
    }
  }
  fab.addEventListener('pointerup', endDrag);
  fab.addEventListener('pointercancel', endDrag);

  fab.addEventListener('click', (e) => {
    if (moved) { e.preventDefault(); moved = false; return; }   // vừa kéo thì không mở trang
    if (inBattle()) { toast('Đang trong trận đấu!'); return; }
    show('chat');
  });

  // Đổi cỡ màn hình / xoay máy: kéo nút về trong khung
  addEventListener('resize', () => {
    if (fab.style.left) place(parseFloat(fab.style.left), parseFloat(fab.style.top), true);
  });

  restore();
})();
document.addEventListener('click', e => {
  const b = e.target.closest('[data-goto]');
  if (b) show(b.dataset.goto);
});

// ==== Boot ====
// Luồng mở đầu: splash -> loading -> auth -> chọn máy chủ -> tạo nhân vật -> intro -> chọn starter
// Đang chơi dở thì vào thẳng game, không bắt xem lại.
const acc = activeAccount();
if (acc && hasSave() && load() && G.p.starterChosen) {
  show('home');
} else if (acc && acc.charCreated && hasSave() && load()) {
  show('starter');
} else {
  show('splash');
}
