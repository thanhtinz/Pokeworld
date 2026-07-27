// PokeWorld H5 | ui/character.js | Màn Nhân Vật: trang bị 6 ô, cường hóa, túi trang bị, cửa hàng trang bị
import { save } from '../state.js';
import { activeAvatar } from '../engine/accounts.js';
import {
  ensureData, totalStats, equip, unequip, upgradeEquip, sellEquip,
  sellPrice, buyEquip, buyStone, shopList, stoneCount, expToNext, MAX_TRAINER_LEVEL, STONE_ITEM,
} from '../engine/equipment.js';
import { SLOTS, RARITY, EQUIPMENT, UPGRADE, STAT_KEYS, STAT_NAMES, statsOf, maxLevelOf } from '../data/equipment.js';
import { esc, fmt } from '../util.js';
import { toast, choose, confirmDlg, header, itemIcon } from './kit.js';

// Nạp CSS riêng của màn này 1 lần (index.html do màn khác giữ)
function ensureCss() {
  if (document.getElementById('char-css')) return;
  const l = document.createElement('link');
  l.id = 'char-css';
  l.rel = 'stylesheet';
  l.href = 'css/character.css';
  document.head.appendChild(l);
}

const rarOf = (id) => RARITY[(EQUIPMENT[id] || {}).rarity] || RARITY.common;
const slotName = (id) => (SLOTS.find(s => s.id === id) || {}).name || id;

// Mốc 100% của mỗi thanh chỉ số = tổng món tốt nhất mỗi ô, cường hóa tối đa.
// Tính một lần lúc nạp module để thanh luôn so với cùng một chuẩn.
const STAT_MAX = (() => {
  const out = {};
  for (const k of STAT_KEYS) {
    let sum = 0;
    for (const s of SLOTS) {
      let best = 0;
      for (const [id, def] of Object.entries(EQUIPMENT)) {
        if (def.slot !== s.id) continue;
        best = Math.max(best, statsOf(id, maxLevelOf(id))[k] || 0);
      }
      sum += best;
    }
    out[k] = Math.max(1, Math.round(sum));
  }
  return out;
})();

// Màu riêng cho từng thanh để nhìn phát biết ngay là chỉ số nào
const STAT_COLOR = {
  expBonus: '#7048e8', moneyBonus: '#f0b429', catchBonus: '#20c997', shinyBonus: '#f783ac',
  atkBonus: '#fa5252', defBonus: '#4dabf7', hpBonus: '#51cf66', idleSpeed: '#ff922b',
};

// Mô tả stat dạng "EXP nhận được +8%"
function statLines(st) {
  return Object.entries(st)
    .filter(([, v]) => v)
    .map(([k, v]) => `${STAT_NAMES[k] || k} +${v}%`);
}

export function render(el) {
  ensureCss();
  const p = ensureData();
  if (!p) return;
  let tab = 'inv'; // gear | inv | shop

  function draw() {
    el.innerHTML = `
      ${header('Nhân vật')}

      ${gearRingHtml()}

      ${statBarsHtml()}

      <div class="tab-row">
        <button type="button" class="tab-btn ${tab === 'inv' ? 'active' : ''}" data-tab="inv">Kho trang bị (${p.inventory.length})</button>
        <button type="button" class="tab-btn ${tab === 'shop' ? 'active' : ''}" data-tab="shop">Cửa hàng</button>
      </div>

      <div class="char-body">${tab === 'shop' ? shopHtml() : invHtml()}</div>`;

    el.querySelectorAll('.tab-btn').forEach(b =>
      b.addEventListener('click', () => { tab = b.dataset.tab; draw(); }));
    el.querySelectorAll('.ring-cell').forEach(b =>
      b.addEventListener('click', () => onSlot(b.dataset.slot)));
    el.querySelectorAll('.inv-row').forEach(b =>
      b.addEventListener('click', () => onInv(b.dataset.uid)));
    el.querySelectorAll('.shop-row').forEach(b =>
      b.addEventListener('click', () => onBuy(b.dataset.id)));
    const bs = el.querySelector('#btn-buy-stone');
    if (bs) bs.addEventListener('click', onBuyStone);
  }

  // ==== Vòng trang bị: 3 ô trái - nhân vật giữa - 3 ô phải ====
  function gearRingHtml() {
    const cell = (s) => {
      const eq = p.equipped[s.id];
      const def = eq ? EQUIPMENT[eq.id] : null;
      if (!def) {
        return `<button type="button" class="ring-cell empty" data-slot="${s.id}" style="--rar:var(--line)">
          <span class="ring-ico dim">${itemIcon(s.icon, '', 30)}</span>
          <small class="ring-name">${esc(s.name)}</small>
        </button>`;
      }
      const rar = rarOf(eq.id);
      return `<button type="button" class="ring-cell" data-slot="${s.id}" style="--rar:${rar.color}">
        ${eq.level ? `<span class="up-badge">+${eq.level}</span>` : ''}
        <span class="ring-ico">${itemIcon(def.sprite, '', 30)}</span>
        <small class="ring-name" style="color:${rar.color}">${esc(def.name)}</small>
      </button>`;
    };
    const left = SLOTS.slice(0, 3).map(cell).join('');
    const right = SLOTS.slice(3, 6).map(cell).join('');
    const lv = p.trainer.level;
    const need = expToNext(lv);
    const maxed = lv >= MAX_TRAINER_LEVEL;
    const pct = maxed ? 100 : Math.min(100, Math.round(p.trainer.exp / Math.max(1, need) * 100));
    return `
      <div class="card gear-ring">
        <div class="ring-col">${left}</div>
        <div class="ring-mid">
          <img class="ring-ava" src="assets/trainers/${activeAvatar()}.png" alt="" onerror="this.remove()">
          <b class="ring-name-lbl">${esc(p.name)}</b>
          <div class="char-lv">Trainer Lv.${lv}${maxed ? ' (MAX)' : ''}</div>
          <div class="char-xp"><div class="char-xp-fill" style="width:${pct}%"></div></div>
          <small class="char-xp-num">${maxed ? 'Cấp tối đa' : `${fmt(p.trainer.exp)}/${fmt(need)}`}</small>
        </div>
        <div class="ring-col">${right}</div>
      </div>`;
  }

  // ==== Thanh chỉ số: so với mức tối đa lý thuyết của bộ trang bị tốt nhất ====
  function statBarsHtml() {
    const ts = totalStats();
    const rows = STAT_KEYS.map(k => {
      const v = ts[k] || 0;
      // v > 0 luôn hiện ít nhất một vạch mỏng, không thì nhìn y hệt số 0
      const pct = v ? Math.max(4, Math.min(100, Math.round(v / STAT_MAX[k] * 100))) : 0;
      return `
        <div class="stat-row">
          <span class="stat-lab">${esc(STAT_NAMES[k] || k)}</span>
          <span class="stat-track"><i style="width:${pct}%;background:${STAT_COLOR[k]}"></i></span>
          <span class="stat-val" style="color:${v ? STAT_COLOR[k] : 'var(--muted)'}">+${v}%</span>
        </div>`;
    }).join('');
    const any = STAT_KEYS.some(k => ts[k]);
    return `
      <div class="card char-stats">
        <h3>Chỉ số nhân vật</h3>
        <div class="stat-bars">${rows}</div>
        ${any ? '' : '<small class="empty-note">Chưa mặc trang bị nào — mặc đồ vào để kéo các thanh này lên.</small>'}
      </div>`;
  }

  // ==== Túi trang bị ====
  function invHtml() {
    if (!p.inventory.length) {
      return '<div class="card empty-note">Kho trang bị trống. Mua ở tab Cửa hàng hoặc nhặt được sau trận đấu.<br>Thuốc, bóng và đá tiến hoá nằm ở màn <b>Túi</b> riêng.</div>';
    }
    return `<div class="item-list">${p.inventory.map(e => {
      const def = EQUIPMENT[e.id];
      if (!def) return '';
      const rar = rarOf(e.id);
      return `<button class="card item-row inv-row" data-uid="${esc(e.uid)}" style="--rar:${rar.color}">
        ${itemIcon(def.sprite, '', 28)}
        <span class="item-mid">
          <b>${esc(def.name)}${e.level ? ` <i class="up-inline">+${e.level}</i>` : ''}</b>
          <small style="color:${rar.color}">${esc(rar.name)} · ${esc(slotName(def.slot))} · Lv.${def.reqLevel}</small>
        </span>
        <span class="item-n">${fmt(sellPrice(e.id, e.level))}₽</span>
      </button>`;
    }).join('')}</div>
    <div class="card char-note"><small>${esc(UPGRADE.failNote)}</small></div>`;
  }

  // ==== Cửa hàng ====
  function shopHtml() {
    const ids = shopList(p.trainer.level);
    return `
      <div class="card shop-money">${itemIcon('amulet_coin', '', 18)} <b>${fmt(p.money)}</b>₽</div>
      <button class="card item-row" id="btn-buy-stone">
        ${itemIcon(STONE_ITEM.sprite, '', 28)}
        <span class="item-mid"><b>${esc(STONE_ITEM.name)}</b><small>${esc(STONE_ITEM.desc)} · đang có ×${stoneCount()}</small></span>
        <span class="item-n">${fmt(STONE_ITEM.price)}₽</span>
      </button>
      <div class="item-list">
        ${ids.map(id => {
          const def = EQUIPMENT[id];
          const rar = rarOf(id);
          return `<button class="card item-row shop-row" data-id="${esc(id)}" style="--rar:${rar.color}">
            ${itemIcon(def.sprite, '', 28)}
            <span class="item-mid">
              <b>${esc(def.name)}</b>
              <small style="color:${rar.color}">${esc(rar.name)} · ${esc(slotName(def.slot))} · ${esc(statLines(statsOf(id, 0)).join(', '))}</small>
            </span>
            <span class="item-n">${fmt(def.price)}₽</span>
          </button>`;
        }).join('')}
        ${ids.length === 0 ? '<div class="card empty-note">Chưa mở khóa món nào.</div>' : ''}
      </div>
      <div class="card char-note"><small>Lên Trainer Level để mở khóa trang bị mạnh hơn.</small></div>`;
  }

  // ==== Chi tiết món ====
  async function showDetail(id, level) {
    const def = EQUIPMENT[id];
    const rar = rarOf(id);
    const cur = statLines(statsOf(id, level));
    const opts = cur.map(l => ({ label: l }));
    opts.push({ label: def.desc });
    await choose(`${def.name} · ${rar.name} +${level}/${maxLevelOf(id)}`, opts);
  }

  // ==== Tương tác ô trang bị ====
  async function onSlot(slotId) {
    const eq = p.equipped[slotId];
    if (!eq || !EQUIPMENT[eq.id]) {
      // Ô trống: gợi ý mặc món phù hợp trong túi
      const cands = p.inventory.filter(e => EQUIPMENT[e.id] && EQUIPMENT[e.id].slot === slotId);
      if (!cands.length) { toast(`Chưa có ${slotName(slotId)} nào trong túi.`); return; }
      const i = await choose(`Mặc ${slotName(slotId)}`, cands.map(e => ({
        label: `${EQUIPMENT[e.id].name}${e.level ? ` +${e.level}` : ''}`,
        sub: `${rarOf(e.id).name} · Cần Lv.${EQUIPMENT[e.id].reqLevel}`,
      })));
      if (i === null) return;
      doEquip(cands[i].uid);
      return;
    }
    const def = EQUIPMENT[eq.id];
    const max = maxLevelOf(eq.id);
    const canUp = eq.level < max;
    const i = await choose(`${def.name} +${eq.level}`, [
      { label: 'Cường hóa', sub: canUp
          ? `+${eq.level} → +${eq.level + 1} · ${fmt(UPGRADE.costMoney(eq.level))}₽ + ${UPGRADE.costStone(eq.level)} đá · ${Math.round(UPGRADE.successRate(eq.level) * 100)}%`
          : 'Đã đạt cấp tối đa', disabled: !canUp },
      { label: 'Tháo ra', sub: 'Đưa về túi trang bị' },
      { label: 'Xem chi tiết' },
    ]);
    if (i === 0) await doUpgrade(slotId);
    else if (i === 1) {
      const r = unequip(slotId);
      toast(r.ok ? `Đã tháo ${def.name}.` : r.error);
      draw();
    } else if (i === 2) await showDetail(eq.id, eq.level);
  }

  async function doUpgrade(slotId) {
    const eq = p.equipped[slotId];
    if (!eq) return;
    const def = EQUIPMENT[eq.id];
    const lv = eq.level;
    const money = UPGRADE.costMoney(lv);
    const stones = UPGRADE.costStone(lv);
    const rate = Math.round(UPGRADE.successRate(lv) * 100);
    const before = statLines(statsOf(eq.id, lv));
    const after = statLines(statsOf(eq.id, lv + 1));
    const i = await choose(`Cường hóa ${def.name}: +${lv} → +${lv + 1}`, [
      { label: `Cường hóa (${rate}% thành công)`,
        sub: `${fmt(money)}₽ · ${stones} đá (đang có ${stoneCount()})`,
        disabled: p.money < money || stoneCount() < stones },
      { label: `Hiện tại: ${before.join(', ')}` , disabled: true },
      { label: `Sau khi lên: ${after.join(', ')}`, disabled: true },
      { label: UPGRADE.failNote, disabled: true },
    ]);
    if (i !== 0) return;
    const r = upgradeEquip({ slot: slotId });
    if (!r.ok) { toast(r.error); return; }
    draw();
    const cell = el.querySelector(`.ring-cell[data-slot="${slotId}"]`);
    if (cell) cell.classList.add(r.success ? 'fx-glow' : 'fx-shake');
    if (r.success) toast(`Cường hóa thành công! ${def.name} +${r.newLevel}`);
    else toast('Cường hóa thất bại. Trang bị vẫn nguyên vẹn, chỉ mất tiền và đá.');
  }

  function doEquip(uid) {
    const r = equip(uid);
    if (!r.ok) { toast(r.error); return; }
    toast('Đã mặc trang bị.');
    draw();
  }

  // ==== Tương tác túi ====
  async function onInv(uid) {
    const item = p.inventory.find(e => e.uid === uid);
    if (!item) return;
    const def = EQUIPMENT[item.id];
    const price = sellPrice(item.id, item.level);
    const i = await choose(`${def.name}${item.level ? ` +${item.level}` : ''}`, [
      { label: 'Mặc vào', sub: `Ô ${slotName(def.slot)} · cần Trainer Lv.${def.reqLevel}` },
      { label: 'Cường hóa', sub: item.level < maxLevelOf(item.id)
          ? `+${item.level} → +${item.level + 1} · ${fmt(UPGRADE.costMoney(item.level))}₽ + ${UPGRADE.costStone(item.level)} đá`
          : 'Đã đạt cấp tối đa', disabled: item.level >= maxLevelOf(item.id) },
      { label: 'Bán', sub: `Nhận ${fmt(price)}₽` },
      { label: 'Xem chi tiết' },
    ]);
    if (i === 0) doEquip(uid);
    else if (i === 1) {
      const r = upgradeEquip({ uid });
      if (!r.ok) { toast(r.error); return; }
      toast(r.success ? `Cường hóa thành công! +${r.newLevel}` : 'Cường hóa thất bại. Trang bị vẫn nguyên vẹn.');
      draw();
    } else if (i === 2) {
      if (!await confirmDlg(`Bán ${def.name} lấy ${fmt(price)}₽?`, 'Bán')) return;
      const r = sellEquip(uid);
      toast(r.ok ? `Đã bán, nhận ${fmt(r.price)}₽.` : r.error);
      draw();
    } else if (i === 3) await showDetail(item.id, item.level);
  }

  // ==== Mua ====
  async function onBuy(id) {
    const def = EQUIPMENT[id];
    const i = await choose(`Mua ${def.name}?`, [
      { label: `Mua · ${fmt(def.price)}₽`, sub: statLines(statsOf(id, 0)).join(', '), disabled: p.money < def.price },
      { label: 'Xem chi tiết' },
    ]);
    if (i === 0) {
      const r = buyEquip(id);
      toast(r.ok ? `Đã mua ${def.name}, xem ở tab Túi.` : r.error);
      draw();
    } else if (i === 1) await showDetail(id, 0);
  }

  async function onBuyStone() {
    const qtys = [1, 5, 10];
    const i = await choose('Mua Upgrade Stone', qtys.map(n => ({
      label: `Mua ×${n}`,
      sub: `${fmt(STONE_ITEM.price * n)}₽`,
      disabled: p.money < STONE_ITEM.price * n,
    })));
    if (i === null) return;
    const r = buyStone(qtys[i]);
    toast(r.ok ? `Đã mua ${qtys[i]} Upgrade Stone.` : r.error);
    save();
    draw();
  }

  draw();
}
