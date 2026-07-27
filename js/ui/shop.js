// PokeWorld H5 | ui/shop.js | Cửa hàng: mua / bán
import { G, spend, addMoney, addItem, removeItem } from '../state.js';
import { ITEMS } from '../data/items.js';
import { esc, fmt } from '../util.js';
import { toast, choose, itemIcon } from './kit.js';
import { MEGA_ITEM_IDS } from '../engine/mega.js';
import { uiIcon } from './icons.js';
import { EQUIPMENT, RARITY } from '../data/equipment.js';
import { shopList, buyEquip, buyStone, stoneCount, trainerLevel, STONE_ITEM } from '../engine/equipment.js';

export function render(el) {
  let tab = 'buy';

  function draw() {
    const megaSet = new Set(MEGA_ITEM_IDS);
    const buyIds = Object.keys(ITEMS).filter(id =>
      ITEMS[id].price > 0 && ITEMS[id].kind !== 'held' && !megaSet.has(id));
    const sellIds = Object.keys(G.p.bag).filter(id => G.p.bag[id] > 0 && ITEMS[id] && ITEMS[id].sell > 0);
    const ids = tab === 'buy' ? buyIds : tab === 'mega' ? MEGA_ITEM_IDS : tab === 'gear' ? [] : sellIds;

    el.innerHTML = `
      <div class="scr-head"><button class="btn-back" data-goto="home">‹</button><h1>Cửa hàng</h1></div>
      <div class="card shop-money">${uiIcon('coin', 20)} <b id="shop-balance">${fmt(G.p.money)}</b>₽</div>
      <div class="tab-row">
        <button type="button" class="tab-btn ${tab === 'buy' ? 'active' : ''}" data-tab="buy">Mua</button>
        <button type="button" class="tab-btn ${tab === 'gear' ? 'active' : ''}" data-tab="gear">Trang bị</button>
        <button type="button" class="tab-btn ${tab === 'mega' ? 'active' : ''}" data-tab="mega">Đá Mega</button>
        <button type="button" class="tab-btn ${tab === 'sell' ? 'active' : ''}" data-tab="sell">Bán</button>
      </div>
      ${tab === 'gear' ? gearShopHtml() : ''}
      <div class="item-list">
        ${ids.map(id => {
          const it = ITEMS[id];
          return `
          <button class="card item-row" data-id="${esc(id)}">
            ${itemIcon(id)}
            <span class="item-mid"><b>${esc(it.name)}</b><small>${esc(it.desc || '')}</small></span>
            <span class="item-n">${tab === 'sell'
              ? `×${G.p.bag[id]} · ${fmt(it.sell)}₽`
              : `${fmt(it.price)}₽${G.p.bag[id] ? ` <small>(có ${G.p.bag[id]})</small>` : ''}`}</span>
          </button>`;
        }).join('')}
        ${tab === 'mega' ? `<div class="card empty-note">Cần Key Stone, rồi cho Pokémon cầm đúng viên đá của loài đó ở màn Túi.
          Vào trận sẽ hiện nút MEGA EVOLUTION.</div>` : ''}
        ${ids.length === 0 ? `<div class="card empty-note">${tab === 'sell' ? 'Không có gì để bán.' : 'Chưa có hàng.'}</div>` : ''}
      </div>`;

    el.querySelectorAll('.tab-btn').forEach(b =>
      b.addEventListener('click', () => { tab = b.dataset.tab; draw(); }));
    el.querySelectorAll('.item-row:not(.gear-row):not(#btn-buy-stone)').forEach(b =>
      b.addEventListener('click', () => (tab === 'sell' ? sell(b.dataset.id) : buy(b.dataset.id))));
    el.querySelectorAll('.gear-row').forEach(b =>
      b.addEventListener('click', () => buyGear(b.dataset.gear)));
    const bs = el.querySelector('#btn-buy-stone');
    if (bs) bs.addEventListener('click', buyUpgradeStone);
  }

  // ==== Quầy trang bị (đồ trang trí cho nhân vật) ====
  function gearShopHtml() {
    const list = shopList(trainerLevel());
    return `
      <button class="card item-row" id="btn-buy-stone">
        ${itemIcon(STONE_ITEM.sprite, '', 28)}
        <span class="item-mid"><b>${esc(STONE_ITEM.name)}</b><small>${esc(STONE_ITEM.desc)} · đang có ×${stoneCount()}</small></span>
        <span class="item-n">${fmt(STONE_ITEM.price)}₽</span>
      </button>
      <div class="item-list">
        ${list.map(id => {
          const def = EQUIPMENT[id];
          const rar = RARITY[def.rarity] || RARITY.common;
          return `<button class="card item-row gear-row" data-gear="${esc(id)}" style="--rar:${rar.color}">
            ${itemIcon(def.sprite, '', 28)}
            <span class="item-mid">
              <b>${esc(def.name)}</b>
              <small style="color:${rar.color}">${esc(rar.name)} · ${esc(def.desc)}</small>
            </span>
            <span class="item-n">${fmt(def.price)}₽</span>
          </button>`;
        }).join('')}
        ${list.length === 0 ? '<div class="card empty-note">Chưa mở khoá món nào. Lên Trainer Level để có thêm hàng.</div>' : ''}
      </div>
      <div class="card empty-note">Trang bị chỉ để mặc cho đẹp, không cộng sức mạnh. Mặc ở màn <b>Nhân vật</b>.</div>`;
  }

  async function buyGear(id) {
    const def = EQUIPMENT[id];
    const i = await choose(`Mua ${def.name}?`, [
      { label: `Mua · ${fmt(def.price)}₽`, sub: esc(def.desc), disabled: G.p.money < def.price },
    ]);
    if (i === null) return;
    const r = buyEquip(id);
    toast(r.ok ? `Đã mua ${def.name}, mặc ở màn Nhân vật.` : (r.error || 'Không mua được.'));
    draw();
  }

  async function buyUpgradeStone() {
    const qtys = [1, 5, 10];
    const i = await choose(`Mua ${STONE_ITEM.name}?`, qtys.map(n => ({
      label: `Mua ×${n}`,
      sub: `${fmt(STONE_ITEM.price * n)}₽`,
      disabled: G.p.money < STONE_ITEM.price * n,
    })));
    if (i === null) return;
    const r = buyStone(qtys[i]);
    toast(r.ok ? `Đã mua ${STONE_ITEM.name} ×${qtys[i]}!` : (r.error || 'Không mua được.'));
    draw();
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
