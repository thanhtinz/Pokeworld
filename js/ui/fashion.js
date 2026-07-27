// TuxeWorld H5 | ui/fashion.js | Trang Thời trang: skin nhân vật + danh hiệu
//
// Đồ ở đây KHÔNG cộng chỉ số — mặc vào chỉ để đẹp và để người khác thấy.
// Món trong từng tab là ảnh quản trị viên tải lên trong trang /admin.
// Khung avatar và bong bóng chat KHÔNG nằm ở đây: bấm ảnh đại diện trên thanh
// trên cùng sẽ mở bảng Trang trí gọn hơn cho ba thứ đó.
import { ensureData, trainerLevel, wearCosmetic } from '../engine/player.js';
import { COSMETIC_KINDS, NONE_ID, unlocked, requirement, imgOf } from '../data/cosmetics.js';
import { esc } from '../util.js';
import { toast, header } from './kit.js';
import { uiIcon } from './icons.js';
import { titleHtml, skinSrc, bodyHtml, upgradeFaces } from './look.js';

function ensureCss() {
  if (document.getElementById('char-css')) return;
  const l = document.createElement('link');
  l.id = 'char-css';
  l.rel = 'stylesheet';
  l.href = 'css/character.css';
  document.head.appendChild(l);
}

export function render(el, { tab: startTab } = {}) {
  ensureCss();
  const p = ensureData();
  if (!p) return;
  let tab = COSMETIC_KINDS.some(t => t.id === startTab) ? startTab : COSMETIC_KINDS[0].id;

  function draw() {
    const cur = COSMETIC_KINDS.find(t => t.id === tab);
    const lv = trainerLevel();
    const items = Object.entries(cur.data);

    el.innerHTML = `
      ${header('Thời trang', 'character')}

      <div class="card fa-preview">
        <span class="ring-ava-wrap fa-body">${bodyHtml(skinSrc(), 'fa-body-img')}</span>
        <b class="ring-name-lbl">${esc(p.name)}</b>
        ${titleHtml(p.look.title)}
      </div>

      <div class="tab-row fa-tabs">
        ${COSMETIC_KINDS.map(t => `<button type="button" class="tab-btn ${t.id === tab ? 'active' : ''}" data-tab="${t.id}">
          ${esc(t.name)}
        </button>`).join('')}
      </div>

      <div class="card fa-card">
        <div class="inv-head">
          <b>${esc(cur.name)}</b>
          <small>${items.filter(([, d]) => unlocked(d, p, lv)).length}/${items.length} đã mở</small>
        </div>

        <div class="fa-grid">
          ${items.map(([id, d]) => {
            const ok = unlocked(d, p, lv);
            const worn = p.look[tab] === id;
            return `<button type="button" class="fa-cell${worn ? ' worn' : ''}${ok ? '' : ' locked'}"
                    data-id="${esc(id)}" ${ok ? '' : 'disabled'}>
              ${worn ? '<span class="fa-worn">Đang mặc</span>' : ''}
              ${cellArt(tab, id, d)}
              <b class="fa-name"${d.color && d.img ? ` style="color:${esc(d.color)}"` : ''}>${esc(d.name)}</b>
              <small class="fa-req">${ok ? (worn ? '✓' : 'Bấm để mặc') : requirement(d)}</small>
            </button>`;
          }).join('')}
        </div>
      </div>`;

    upgradeFaces(el);
    el.querySelectorAll('.tab-btn').forEach(b =>
      b.addEventListener('click', () => { tab = b.dataset.tab; draw(); }));
    el.querySelectorAll('.fa-cell:not([disabled])').forEach(b =>
      b.addEventListener('click', () => wear(b.dataset.id)));
  }

  // Ô xem trước: có ảnh thì hiện đúng ảnh, ô "không mặc gì" thì hiện dấu gạch
  function cellArt(kind, id, d) {
    const img = imgOf(d);
    if (!img) return `<span class="fa-art fa-none">${id === NONE_ID[kind] ? '⊘' : uiIcon('slot_skin', 26)}</span>`;
    if (kind === 'title') return `<span class="fa-art">${titleHtml(id)}</span>`;
    // Skin là ảnh đi bản đồ 3x4 -> chỉ bày một khung cho gọn
    if (kind === 'skin') return `<span class="fa-art">${bodyHtml(img, 'fa-body-cell')}</span>`;
    return `<span class="fa-art"><img class="fa-img" src="${esc(img)}" alt="" onerror="this.remove()"></span>`;
  }

  function wear(id) {
    if (wearCosmetic(tab, id)) {
      const kind = COSMETIC_KINDS.find(t => t.id === tab);
      toast(`Đã ${id === NONE_ID[tab] ? 'tháo' : 'mặc'} ${kind.data[id].name}.`);
      document.dispatchEvent(new CustomEvent('look-change'));
      draw();
    }
  }

  draw();
}
