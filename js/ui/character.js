// TuxeWorld H5 | ui/character.js | Màn Nhân Vật: trang bị, thời trang, kho đồ
//
// Trang bị và thời trang ở đây đều là ĐỒ TRANG TRÍ: mặc cho nhân vật đẹp,
// không cộng sức mạnh (nhân vật không tham chiến, chỉ Tuxemon đánh nhau).
// Danh hiệu mặc vào sẽ hiện luôn trên đầu nhân vật khi đi trên bản đồ.
import { save } from '../state.js';
import {
  ensureData, equip, unequip, upgradeEquip, sellEquip, sellPrice, stoneCount,
  expToNext, MAX_TRAINER_LEVEL,
} from '../engine/equipment.js';
import { SLOTS, RARITY, EQUIPMENT, UPGRADE, maxLevelOf } from '../data/equipment.js';
import { TITLES } from '../data/cosmetics.js';
import { esc, fmt } from '../util.js';
import { toast, choose, confirmDlg, header, itemIcon } from './kit.js';
import { uiIcon } from './icons.js';
import { avatarFrame, titleHtml, avatarSrc } from './look.js';

// Nạp CSS riêng của màn này 1 lần
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

export function render(el) {
  ensureCss();
  const p = ensureData();
  if (!p) return;

  function draw() {
    el.innerHTML = `
      ${header('Nhân vật')}
      ${gearRingHtml()}
      ${fashionHtml()}
      ${invHtml()}`;

    el.querySelectorAll('.ring-cell').forEach(b =>
      b.addEventListener('click', () => onSlot(b.dataset.slot)));
    el.querySelectorAll('.inv-cell:not(.blank)').forEach(b =>
      b.addEventListener('click', () => onInv(b.dataset.uid)));
  }

  // ==== Vòng trang bị: 3 ô trái · nhân vật giữa · 3 ô phải ====
  function gearRingHtml() {
    const cell = (s) => {
      const eq = p.equipped[s.id];
      const def = eq ? EQUIPMENT[eq.id] : null;
      if (!def) {
        return `<button type="button" class="ring-cell empty" data-slot="${s.id}" style="--rar:var(--line)">
          <span class="ring-ico dim">${uiIcon(s.icon, 26)}</span>
          <small class="ring-name">${esc(s.name)}</small>
        </button>`;
      }
      const rar = rarOf(eq.id);
      return `<button type="button" class="ring-cell" data-slot="${s.id}" style="--rar:${rar.color}">
        ${eq.level ? `<span class="up-badge">+${eq.level}</span>` : ''}
        <span class="ring-ico">${itemIcon(def.sprite, '', 28)}</span>
        <small class="ring-name" style="color:${rar.color}">${esc(def.name)}</small>
      </button>`;
    };
    const lv = p.trainer.level;
    const need = expToNext(lv);
    const maxed = lv >= MAX_TRAINER_LEVEL;
    const pct = maxed ? 100 : Math.min(100, Math.round(p.trainer.exp / Math.max(1, need) * 100));
    const fr = avatarFrame(p.look.avatarFrame);
    return `
      <div class="card gear-ring">
        <div class="ring-col">${SLOTS.slice(0, 3).map(cell).join('')}</div>
        <div class="ring-mid">
          <span class="ring-ava-wrap${fr.cls}"${fr.style}>
            <img class="ring-ava" src="${esc(avatarSrc())}" alt="" onerror="this.remove()">
          </span>
          <b class="ring-name-lbl">${esc(p.name)}</b>
          ${titleHtml(p.look.title)}
          <div class="char-lv">Trainer Lv.${lv}${maxed ? ' (MAX)' : ''}</div>
          <div class="char-xp"><div class="char-xp-fill" style="width:${pct}%"></div></div>
          <small class="char-xp-num">${maxed ? 'Cấp tối đa' : `${fmt(p.trainer.exp)}/${fmt(need)}`}</small>
        </div>
        <div class="ring-col">${SLOTS.slice(3, 6).map(cell).join('')}</div>
      </div>`;
  }

  // ==== Nút dẫn sang trang Thời trang ====
  function fashionHtml() {
    const t = p.look.title !== 'none' ? TITLES[p.look.title] : null;
    return `
      <button type="button" class="card menu-link fa-link" data-goto="fashion">
        <span class="fa-link-ico">${uiIcon('flag', 22)}</span>
        <span class="fa-link-mid">
          <b>Thời trang</b>
          <small>Danh hiệu${t ? ` · ${esc(t.name)}` : ''} · Khung avatar · Khung chat · Skin</small>
        </span>
        <span class="fa-link-go">›</span>
      </button>`;
  }

  // ==== Kho trang bị: lưới ô, bấm vào mới hiện thông tin ====
  function invHtml() {
    const cells = p.inventory.map(e => {
      const def = EQUIPMENT[e.id];
      if (!def) return '';
      const rar = rarOf(e.id);
      return `<button type="button" class="inv-cell" data-uid="${esc(e.uid)}" style="--rar:${rar.color}"
              title="${esc(def.name)}">
        ${e.level ? `<span class="up-badge">+${e.level}</span>` : ''}
        <span class="inv-ico">${itemIcon(def.sprite, '', 30)}</span>
      </button>`;
    }).join('');
    // Kê thêm ô trống cho đủ hàng, lưới không bị hụt một góc
    const pad = p.inventory.length ? (4 - (p.inventory.length % 4)) % 4 : 8;
    const empties = Array.from({ length: pad }, () => '<span class="inv-cell blank"></span>').join('');
    return `
      <div class="card inv-card">
        <div class="inv-head">
          <b>Kho trang bị</b>
          <small>${p.inventory.length} món · ${stoneCount()} đá cường hoá</small>
        </div>
        <div class="inv-grid">${cells}${empties}</div>
        <small class="char-note-txt">${p.inventory.length
          ? 'Bấm vào ô để xem chi tiết, mặc, cường hoá hoặc bán.'
          : 'Chưa có món nào. Mua ở <b>Cửa hàng → Trang bị</b> hoặc nhặt được sau trận đấu.'}</small>
      </div>`;
  }

  // ==== Chi tiết món ====
  async function showDetail(id, level) {
    const def = EQUIPMENT[id];
    const rar = rarOf(id);
    await choose(`${def.name} · ${rar.name} +${level}/${maxLevelOf(id)}`, [
      { label: def.desc },
      { label: `Ô ${slotName(def.slot)} · mặc cho đẹp, không đổi sức mạnh` },
    ]);
  }

  // ==== Bấm vào ô trang bị trên vòng ====
  async function onSlot(slotId) {
    const eq = p.equipped[slotId];
    if (!eq || !EQUIPMENT[eq.id]) {
      const cands = p.inventory.filter(e => EQUIPMENT[e.id] && EQUIPMENT[e.id].slot === slotId);
      if (!cands.length) { toast(`Chưa có ${slotName(slotId)} nào trong kho.`); return; }
      const i = await choose(`Mặc ${slotName(slotId)}`, cands.map(e => ({
        label: `${EQUIPMENT[e.id].name}${e.level ? ` +${e.level}` : ''}`,
        sub: `${rarOf(e.id).name} · Cần Lv.${EQUIPMENT[e.id].reqLevel}`,
      })));
      if (i === null) return;
      doEquip(cands[i].uid);
      return;
    }
    const def = EQUIPMENT[eq.id];
    const canUp = eq.level < maxLevelOf(eq.id);
    const i = await choose(`${def.name} +${eq.level}`, [
      { label: 'Cường hoá', sub: canUp ? `+${eq.level} → +${eq.level + 1}` : 'Đã đạt cấp tối đa', disabled: !canUp },
      { label: 'Tháo ra', sub: 'Trả về kho' },
      { label: 'Xem chi tiết' },
    ]);
    if (i === 0) await doUpgrade(slotId);
    else if (i === 1) {
      const r = unequip(slotId);
      toast(r.ok ? `Đã tháo ${def.name}.` : (r.error || 'Không tháo được.'));
      draw();
    } else if (i === 2) await showDetail(eq.id, eq.level);
  }

  // ==== Bấm vào ô trong kho ====
  async function onInv(uid) {
    const item = p.inventory.find(e => e.uid === uid);
    if (!item) return;
    const def = EQUIPMENT[item.id];
    const price = sellPrice(item.id, item.level);
    const canUp = item.level < maxLevelOf(item.id);
    const i = await choose(`${def.name}${item.level ? ` +${item.level}` : ''}`, [
      { label: `Mặc vào ô ${slotName(def.slot)}`, sub: `${rarOf(item.id).name} · Cần Lv.${def.reqLevel}` },
      { label: 'Cường hoá', sub: canUp ? `+${item.level} → +${item.level + 1}` : 'Đã đạt cấp tối đa', disabled: !canUp },
      { label: 'Bán', sub: `Nhận ${fmt(price)}₽` },
      { label: 'Xem chi tiết', sub: def.desc },
    ]);
    if (i === 0) doEquip(uid);
    else if (i === 1) {
      const r = upgradeEquip({ uid });
      if (!r.ok) { toast(r.error); return; }
      toast(r.success ? `Cường hoá thành công! +${r.newLevel}` : 'Cường hoá thất bại. Trang bị vẫn nguyên vẹn.');
      draw();
    } else if (i === 2) {
      if (!await confirmDlg(`Bán ${def.name} lấy ${fmt(price)}₽?`, 'Bán')) return;
      const r = sellEquip(uid);
      toast(r.ok ? `Đã bán, nhận ${fmt(r.price)}₽.` : r.error);
      draw();
    } else if (i === 3) await showDetail(item.id, item.level);
  }

  async function doUpgrade(slotId) {
    const eq = p.equipped[slotId];
    if (!eq) return;
    const def = EQUIPMENT[eq.id];
    const lv = eq.level;
    const i = await choose(`Cường hoá ${def.name}: +${lv} → +${lv + 1}`, [
      { label: `Cường hoá (${Math.round(UPGRADE.successRate(lv) * 100)}% thành công)`,
        sub: `${fmt(UPGRADE.costMoney(lv))}₽ · ${UPGRADE.costStone(lv)} đá (đang có ${stoneCount()})`,
        disabled: p.money < UPGRADE.costMoney(lv) || stoneCount() < UPGRADE.costStone(lv) },
      { label: UPGRADE.failNote, disabled: true },
    ]);
    if (i !== 0) return;
    const r = upgradeEquip(slotId);
    if (!r.ok) { toast(r.error); return; }
    toast(r.success ? `Cường hoá thành công! +${r.newLevel}` : 'Cường hoá thất bại. Trang bị vẫn nguyên vẹn.');
    draw();
  }

  function doEquip(uid) {
    const r = equip(uid);
    toast(r.ok ? 'Đã mặc!' : (r.error || 'Không mặc được.'));
    if (r.ok) { save(); draw(); }
  }

  draw();
}
