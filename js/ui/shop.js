// TuxeWorld H5 | ui/shop.js | Cửa hàng: mua / bán
import { G, spend, addMoney, addItem, removeItem, save } from '../state.js';
import { ITEMS } from '../data/items.js';
import { SHOPS } from '../data/shops.js';
import { esc, fmt } from '../util.js';
import { toast, choose, itemIcon } from './kit.js';
import { uiIcon } from './icons.js';

// Gian hàng chia theo nhóm cho dễ tìm — 91 món xếp một dọc thì cuộn mỏi tay
const NHOM = [
  ['ball', 'Tuxeball'],
  ['medicine', 'Thuốc'],
  ['morph', 'Vật biến hình'],
  ['food', 'Món ăn'],
  ['stat', 'Rèn chỉ số'],
  ['tea', 'Trà'],
  ['fish', 'Cần câu'],
  ['tool', 'Đồ tiện ích'],
  ['tm', 'Đĩa chiêu'],
  ['element', 'Quả đổi hệ'],
];

// shop = mã gian hàng trong db/economy (bấm vào chủ tiệm trên bản đồ). Không
// truyền gì thì đây là gian hàng chung mở từ Menu, bán mọi món có giá.
export function render(el, { shop = null, from = 'home' } = {}) {
  let tab = 'buy';
  const tiem = shop && SHOPS[shop] ? SHOPS[shop] : null;
  // Giá riêng của từng gian hàng: bản gốc ghi giá ngay trong db/economy
  const giaCua = tiem ? Object.fromEntries(tiem.items.map(x => [x.id, x.price])) : null;
  const gia = (id) => (giaCua && giaCua[id] !== undefined ? giaCua[id] : ITEMS[id].price);
  const giaBan = (id) => (tiem ? Math.round(gia(id) * tiem.sell) : ITEMS[id].sell);

  // Hàng có hạn: bán hết là thôi (trường inventory bên bản gốc)
  const daMua = (id) => G.p.shopBuy?.[shop]?.[id] || 0;
  const conLai = (id) => {
    const row = tiem?.items.find(x => x.id === id);
    if (!row || row.stock === undefined) return Infinity;
    return Math.max(0, row.stock - daMua(id));
  };

  function draw() {
    const buyIds = tiem
      ? tiem.items.filter(x => ITEMS[x.id] && conLai(x.id) > 0).map(x => x.id)
      : Object.keys(ITEMS).filter(id => ITEMS[id].price > 0);
    const sellIds = Object.keys(G.p.bag).filter(id => G.p.bag[id] > 0 && ITEMS[id] && ITEMS[id].sell > 0);
    const ids = tab === 'buy' ? buyIds : sellIds;

    el.innerHTML = `
      <div class="scr-head"><button class="btn-back" data-goto="${esc(from)}">‹</button><h1>${
        esc(tiem ? tiem.name : 'Cửa hàng')}</h1></div>
      <div class="card shop-money">${uiIcon('coin', 20)} <b id="shop-balance">${fmt(G.p.money)}</b>₽</div>
      <div class="seg-row">
        <button type="button" class="seg-btn ${tab === 'buy' ? 'active' : ''}" data-tab="buy">Mua</button>
        <button type="button" class="seg-btn ${tab === 'sell' ? 'active' : ''}" data-tab="sell">Bán</button>
      </div>
      ${NHOM.map(([k, label]) => {
        const g = ids.filter(id => ITEMS[id].kind === k);
        if (!g.length) return '';
        return `<div class="shop-group"><h2 class="shop-group-h">${esc(label)}</h2>
          <div class="item-list">${g.map(id => hang(id)).join('')}</div></div>`;
      }).join('')}
      ${ids.length === 0 ? `<div class="card empty-note">${tab === 'sell' ? 'Không có gì để bán.' : 'Chưa có hàng.'}</div>` : ''}`;

    el.querySelectorAll('.seg-btn').forEach(b =>
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
          ? `×${G.p.bag[id]} · ${fmt(giaBan(id))}₽`
          : `${fmt(gia(id))}₽${conLai(id) !== Infinity ? ` <small>(còn ${conLai(id)})</small>`
              : (G.p.bag[id] ? ` <small>(có ${G.p.bag[id]})</small>` : '')}`}</span>
      </button>`;
  }

  async function buy(id) {
    const it = ITEMS[id];
    const con = conLai(id);
    const qtys = [1, 5, 10].filter(n => n <= con);
    if (!qtys.length) { toast('Hết hàng rồi!'); return; }
    const i = await choose(`Mua ${it.name}?`, qtys.map(n => ({
      label: `Mua ×${n}`,
      sub: `${fmt(gia(id) * n)}₽`,
      disabled: G.p.money < gia(id) * n,
    })));
    if (i === null) return;
    const n = qtys[i];
    if (!spend(gia(id) * n)) { toast('Không đủ tiền!'); return; }
    addItem(id, n);
    if (tiem && con !== Infinity) {
      if (!G.p.shopBuy) G.p.shopBuy = {};
      if (!G.p.shopBuy[shop]) G.p.shopBuy[shop] = {};
      G.p.shopBuy[shop][id] = daMua(id) + n;
      save();
    }
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
      sub: `${fmt(giaBan(id) * o.n)}₽`,
      disabled: o.n <= 0 || o.n > have,
    })));
    if (i === null) return;
    const n = opts[i].n;
    if (!removeItem(id, n)) { toast('Không đủ số lượng!'); return; }
    addMoney(giaBan(id) * n);
    toast(`Đã bán ${it.name} ×${n}, nhận ${fmt(giaBan(id) * n)}₽!`);
    draw();
  }

  draw();
}
