// TuxeWorld H5 | ui/fashion.js | Trang Thời trang: danh hiệu, khung avatar, khung chat, skin
//
// Đồ ở đây KHÔNG cộng chỉ số — mặc vào chỉ để đẹp và để người khác thấy.
// Danh hiệu mặc vào hiện ngay trên đầu nhân vật khi đi trên bản đồ.
import { G } from '../state.js';
import { activeAvatar } from '../engine/accounts.js';
import { ensureData, trainerLevel, wearCosmetic } from '../engine/equipment.js';
import { COSMETIC_KINDS, SKINS, unlocked, requirement, imgOf } from '../data/cosmetics.js';
import { esc } from '../util.js';
import { toast, header } from './kit.js';
import { uiIcon } from './icons.js';
import { avatarFrame, chatFrame, titleHtml } from './look.js';

const TABS = [
  ...COSMETIC_KINDS.map(k => ({ id: k.id, name: k.name, icon: k.icon, data: k.data })),
  { id: 'skin', name: 'Skin', icon: 'slot_skin', data: SKINS, soon: true },
];

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
  let tab = TABS.some(t => t.id === startTab) ? startTab : TABS[0].id;

  function draw() {
    const cur = TABS.find(t => t.id === tab);
    const lv = trainerLevel();
    const fr = avatarFrame(p.look.avatarFrame);

    el.innerHTML = `
      ${header('Thời trang', 'character')}

      <div class="card fa-preview">
        <span class="ring-ava-wrap${fr.cls}"${fr.style}>
          <img class="ring-ava" src="assets/trainers/${activeAvatar()}.png" alt="" onerror="this.remove()">
        </span>
        <b class="ring-name-lbl">${esc(p.name)}</b>
        ${titleHtml(p.look.title)}
        <small class="char-note-txt">Mặc cho đẹp — không đổi sức mạnh của bạn hay của Tuxemon.</small>
      </div>

      <div class="tab-row fa-tabs">
        ${TABS.map(t => `<button type="button" class="tab-btn ${t.id === tab ? 'active' : ''}" data-tab="${t.id}">
          ${uiIcon(t.icon, 18)} ${esc(t.name)}
        </button>`).join('')}
      </div>

      <div class="card fa-card">
        <div class="inv-head">
          <b>${esc(cur.name)}</b>
          <small>${Object.values(cur.data).filter(d => unlocked(d, p, lv)).length}/${Object.keys(cur.data).length} đã mở</small>
        </div>
        ${cur.soon
          ? '<div class="empty-note">Mới có bộ mặc định. Các bộ skin khác sẽ bổ sung sau.</div>'
          : ''}
        <div class="fa-grid">
          ${Object.entries(cur.data).map(([id, d]) => {
            const ok = unlocked(d, p, lv);
            const worn = p.look[tab] === id;
            return `<button type="button" class="fa-cell${worn ? ' worn' : ''}${ok ? '' : ' locked'}"
                    data-id="${esc(id)}" ${ok ? '' : 'disabled'}>
              ${worn ? '<span class="fa-worn">Đang mặc</span>' : ''}
              ${cellArt(tab, id, d)}
              <b class="fa-name"${d.color ? ` style="color:${d.color}"` : ''}>${esc(d.name)}</b>
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

  // Ô xem trước của từng loại. Món nào admin đã tải ảnh lên thì xem trước bằng
  // đúng ảnh đó, món không có ảnh thì vẫn vẽ bằng CSS như bộ mặc định.
  function cellArt(kind, id, d) {
    const img = imgOf(d);
    if (img && kind !== 'chatFrame') {
      return `<span class="fa-art"><img class="fa-img" src="${esc(img)}" alt="" onerror="this.remove()"></span>`;
    }
    if (kind === 'avatarFrame') {
      const cls = d.css ? ` fr-${esc(d.css)}` : '';
      return `<span class="fa-art"><span class="fa-frame${cls}"></span></span>`;
    }
    if (kind === 'chatFrame') {
      // Khung chat luôn xem trước bằng bong bóng thật, ảnh chỉ làm nền cho nó
      const cf = chatFrame(id);
      return `<span class="fa-art"><span class="fa-bubble${cf.cls}"${cf.style}>Alo</span></span>`;
    }
    if (kind === 'title') {
      return `<span class="fa-art">${titleHtml(id)}</span>`;
    }
    return `<span class="fa-art">${uiIcon('slot_skin', 30)}</span>`;
  }

  function wear(id) {
    if (tab === 'skin') { toast('Skin khác sẽ bổ sung sau.'); return; }
    if (wearCosmetic(tab, id)) {
      const kind = TABS.find(t => t.id === tab);
      toast(`Đã mặc ${kind.data[id].name}.`);
      draw();
    }
  }

  draw();
}
