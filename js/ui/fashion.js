// TuxeWorld H5 | ui/fashion.js | Trang Thời trang: danh hiệu, khung avatar, khung chat, skin
//
// Đồ ở đây KHÔNG cộng chỉ số — mặc vào chỉ để đẹp và để người khác thấy.
// Món trong từng tab là ảnh quản trị viên tải lên trong trang /admin.
import { ensureData, trainerLevel, wearCosmetic } from '../engine/equipment.js';
import { COSMETIC_KINDS, NONE_ID, unlocked, requirement, imgOf } from '../data/cosmetics.js';
import { esc } from '../util.js';
import { toast, header } from './kit.js';
import { uiIcon } from './icons.js';
import { avatarFrame, chatFrame, titleHtml, avatarSrc } from './look.js';

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
    const fr = avatarFrame(p.look.avatarFrame);
    const items = Object.entries(cur.data);
    const onlyNone = items.length <= 1;

    el.innerHTML = `
      ${header('Thời trang', 'character')}

      <div class="card fa-preview">
        <span class="ring-ava-wrap${fr.cls}"${fr.style}>
          <img class="ring-ava" src="${esc(avatarSrc())}" alt="" onerror="this.remove()">
        </span>
        <b class="ring-name-lbl">${esc(p.name)}</b>
        ${titleHtml(p.look.title)}
        <small class="char-note-txt">Mặc cho đẹp — không đổi sức mạnh của bạn hay của Tuxemon.</small>
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
        ${onlyNone
          ? '<div class="empty-note">Chưa có món nào. Quản trị viên tải ảnh lên trong trang /admin là hiện ở đây ngay.</div>'
          : ''}
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

    el.querySelectorAll('.tab-btn').forEach(b =>
      b.addEventListener('click', () => { tab = b.dataset.tab; draw(); }));
    el.querySelectorAll('.fa-cell:not([disabled])').forEach(b =>
      b.addEventListener('click', () => wear(b.dataset.id)));
  }

  // Ô xem trước: có ảnh thì hiện đúng ảnh, ô "không mặc gì" thì hiện dấu gạch
  function cellArt(kind, id, d) {
    const img = imgOf(d);
    if (!img) return `<span class="fa-art fa-none">${id === NONE_ID[kind] ? '⊘' : uiIcon('slot_skin', 26)}</span>`;
    if (kind === 'chatFrame') {
      const cf = chatFrame(id);
      return `<span class="fa-art"><span class="fa-bubble${cf.cls}"${cf.style}>Alo</span></span>`;
    }
    if (kind === 'title') return `<span class="fa-art">${titleHtml(id)}</span>`;
    return `<span class="fa-art"><img class="fa-img" src="${esc(img)}" alt="" onerror="this.remove()"></span>`;
  }

  function wear(id) {
    if (wearCosmetic(tab, id)) {
      const kind = COSMETIC_KINDS.find(t => t.id === tab);
      toast(`Đã ${id === NONE_ID[tab] ? 'tháo' : 'mặc'} ${kind.data[id].name}.`);
      draw();
    }
  }

  draw();
}
