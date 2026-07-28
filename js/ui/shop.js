// TuxeWorld H5 | ui/shop.js | Cửa hàng: mua / bán
import { G, spend, addMoney, addItem, removeItem } from '../state.js';
import { ITEMS } from '../data/items.js';
import { esc, fmt } from '../util.js';
import { toast, choose, itemIcon } from './kit.js';
import { uiIcon } from './icons.js';

// Gian hàng chia theo nhóm cho dễ tìm — 91 món xếp một dọc thì cuộn mỏi tay
const NHOM = [
  ['ball', 'Tuxeball'],
  ['medicine', 'Thuốc'],
  ['stone', 'Đá tiến hoá'],
  ['food', 'Món ăn'],
  ['stat', 'Rèn chỉ số'],
  ['tea', 'Trà'],
  ['tm', 'Đĩa chiêu'],
  ['element', 'Quả đổi hệ'],
];

export function render(el) {
  let tab = 'buy';

  function draw() {
    const buyIds = Object.keys(ITEMS).filter(id => ITEMS[id].price > 0);
    const sellIds = Object.keys(G.p.bag).filter(id => G.p.bag[id] > 0 && ITEMS[id] && ITEMS[id].sell > 0);
    const ids = tab === 'buy' ? buyIds : sellIds;

    el.innerHTML = `
      <div class="scr-head"><button class="btn-back" data-goto="home">‹</button><h1>Cửa hàng</h1></div>
      <div class="card shop-money">${uiIcon('coin', 20)} <b id="shop-balance">${fmt(G.p.money)}</b>₽</div>
      <div class="tab-row">
        <button type="button" class="tab-btn ${tab === 'buy' ? 'active' : ''}" data-tab="buy">Mua</button>
        <button type="button" class="tab-btn ${tab === 'sell' ? 'active' : ''}" data-tab="sell">Bán</button>
      </div>
      ${NHOM.map(([k, label]) => {
        const g = ids.filter(id => ITEMS[id].kind === k);
        if (!g.length) return '';
        return `<div class="shop-group"><h2 class="shop-group-h">${esc(label)}</h2>
          <div class="item-list">${g.map(id => hang(id)).join('')}</div></div>`;
      }).join('')}
      ${ids.length === 0 ? `<div class="card empty-note">${tab === 'sell' ? 'Không có gì để bán.' : 'Chưa có hàng.'}</div>` : ''}`;

    el.querySelectorAll('.tab-btn').forEach(b =>
      b.addEventListener('click', () => { tab = b.dataset.tab; draw(); }));
    el.querySelectorAll('.item-row').forEach(b =>
      b.addEventListener('click', () => (tab === 'sell' ? sell(b.dataset.id) : buy(b.dataset.id))));
  }

  function hang(id) {
    const it = ITEMS[id];
    return `
      <button class="card item-row" data-id="${esc(id)}">
        ${itemIcon(id)}
        <span class="item-mid"><b>${esc(it.name)}</b><small>${esc(it.desc || '')}</small></span>
        <span class="item-n">${tab === 'sell'
          ? `×${G.p.bag[id]} · ${fmt(it.sell)}₽`
          : `${fmt(it.price)}₽${G.p.bag[id] ? ` <small>(có ${G.p.bag[id]})</small>` : ''}`}</span>
      </button>`;
  }

  async function buy(id) {
    const it = ITEMS[id];
    const qtys = [1, 5, 10];
    const i = await choose(`Mua ${it.name}?`, qtys.map(n => ({
      label: `Mua ×${n}`,
      sub: `${fmt(it.price * n)}₽`,
      disabled: G.p.money < it.price * n,
    })));
    if (i === null) return;
    const n = qtys[i];
    if (!spend(it.price * n)) { toast('Không đủ tiền!'); return; }
    addItem(id, n);
    toast(`Đã mua ${it.name} ×${n}!`);
    draw();
  }

  async function sell(id) {
    const it = ITEMS[id];
    const have = G.p.bag[id] || 0;
    const opts = [
      { n: 1, label: 'Bán ×1' },
      { n: Math.min(5, have), label: `Bán ×${Math.min(5, have)}` },
      { n: have, label: `Bán hết (×${have})` },
    ];
    const i = await choose(`Bán ${it.name}?`, opts.map(o => ({
      label: o.label,
      sub: `${fmt(it.sell * o.n)}₽`,
      disabled: o.n <= 0 || o.n > have,
    })));
    if (i === null) return;
    const n = opts[i].n;
    if (!removeItem(id, n)) { toast('Không đủ số lượng!'); return; }
    addMoney(it.sell * n);
    toast(`Đã bán ${it.name} ×${n}, nhận ${fmt(it.sell * n)}₽!`);
    draw();
  }

  draw();
}
