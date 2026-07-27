// PokeWorld H5 | main.js | Router màn hình + khởi động app
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
import { activeAccount } from './engine/accounts.js';
import { startSession, onChange, net } from './net/session.js';
import { sanitizeSave } from './engine/mega.js';
import { wirePvpInvites } from './net/pvpinvite.js';
import { maxHp } from './engine/pokemon.js';

const SCREENS = {
  home, battle, party, dex, bag, shop, quest, starter, menu, character,
  chat, rank, guild, friends, pvp, marriage,
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
  scr.render(el, params);
  // Bottom nav: ẩn trong suốt luồng mở đầu và khi đang đánh
  const nav = document.getElementById('bottom-nav');
  nav.hidden = NO_NAV.has(name);
  nav.querySelectorAll('button').forEach(b =>
    b.classList.toggle('active', b.dataset.nav === name));
  el.scrollTop = 0;
}

// Vẽ lại màn hình hiện tại (sau khi state đổi)
export function refresh() { if (current) show(current, currentParams); }

export function inBattle() { return current === 'battle'; }

// Chấm đỏ trên nút Cộng đồng khi có tin nhắn chưa đọc
onChange(() => {
  const dot = document.getElementById('nav-dot');
  if (!dot) return;
  const n = net.unread.world + net.unread.guild + net.unread.dm;
  dot.hidden = !(n > 0) || current === 'chat';
});

// Mở phiên online nếu người chơi đã chọn máy chủ (chơi offline thì bỏ qua)
// Thoát game giữa lúc đang Mega thì save còn dạng 10xxx — dọn lại cho sạch
if (G.p) sanitizeSave(G.p, maxHp);

wirePvpInvites();
startSession().catch(e => console.warn('[online]', e));

// Nav dưới + nút back data-goto
document.getElementById('bottom-nav').addEventListener('click', e => {
  const btn = e.target.closest('button[data-nav]');
  if (!btn) return;
  if (inBattle()) { toast('Đang trong trận đấu!'); return; }
  show(btn.dataset.nav);
});
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
