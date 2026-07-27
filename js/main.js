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
import { activeAccount } from './engine/accounts.js';

const SCREENS = { home, battle, party, dex, bag, shop, quest, starter, menu, login: loginScr };

let current = null;
let currentParams = null;

// Chuyển màn hình. Trong trận battle thì nav bị khóa.
export function show(name, params = {}) {
  const scr = SCREENS[name];
  if (!scr) { console.warn('screen?', name); return; }
  current = name;
  currentParams = params;
  const el = document.getElementById('screen');
  el.className = `screen screen-${name}`;
  el.innerHTML = '';
  scr.render(el, params);
  // Bottom nav: ẩn ở starter/battle/login
  const nav = document.getElementById('bottom-nav');
  nav.hidden = (name === 'starter' || name === 'battle' || name === 'login');
  nav.querySelectorAll('button').forEach(b =>
    b.classList.toggle('active', b.dataset.nav === name));
  el.scrollTop = 0;
}

// Vẽ lại màn hình hiện tại (sau khi state đổi)
export function refresh() { if (current) show(current, currentParams); }

export function inBattle() { return current === 'battle'; }

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
if (!activeAccount()) {
  show('login');
} else if (hasSave() && load()) {
  show(G.p.starterChosen ? 'home' : 'starter');
} else {
  show('starter');
}
