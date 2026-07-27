// TuxeWorld H5 | ui/decor.js | Bảng "Trang trí": ảnh đại diện, khung avatar, bong bóng chat
import { ensureData, trainerLevel, wearCosmetic } from '../engine/player.js';
import { AVATAR_FRAMES, CHAT_FRAMES, SKINS, unlocked, requirement, imgOf } from '../data/cosmetics.js';
import { esc } from '../util.js';
import { toast } from './kit.js';
import { openSheet } from './sheet.js';
import { avatarFrame, chatFrame, skinSrc, faceHtml, upgradeFaces, avatarSkinId } from './look.js';

function ensureCss() {
  if (document.getElementById('char-css')) return;
  const l = document.createElement('link');
  l.id = 'char-css';
  l.rel = 'stylesheet';
  l.href = 'css/character.css';
  document.head.appendChild(l);
}

const TRONG = (kind) => `<p class="empty-note sheet-note">Chưa có ${kind} nào.</p>`;

function cell({ id, name, art, worn, ok, note }) {
  return `<button type="button" class="fa-cell${worn ? ' worn' : ''}${ok ? '' : ' locked'}"
      data-id="${esc(id)}" ${ok ? '' : 'disabled'}>
    ${worn ? '<span class="fa-worn">Đang dùng</span>' : ''}
    ${art}
    <b class="fa-name">${esc(name)}</b>
    ${note ? `<small class="fa-req">${esc(note)}</small>` : ''}
  </button>`;
}

export function openDecor(startTab) {
  ensureCss();
  const p = ensureData();
  if (!p) return null;

  // Ảnh đại diện = gương mặt của một bộ skin. Chỉ một bộ thì khỏi bày ô "theo
  // skin đang mặc" — nó trùng y hệt ô kia.
  function drawAvatar(box, api) {
    const lv = trainerLevel();
    const list = Object.entries(SKINS).filter(([, d]) => unlocked(d, p, lv));
    const cur = p.look.avatar || 'auto';
    const theo = list.length > 1
      ? cell({ id: 'auto', name: 'Theo skin đang mặc', worn: cur === 'auto', ok: true, note: '',
        art: `<span class="fa-art">${faceHtml(skinSrc(p.look.skin), 'fa-face')}</span>` })
      : '';
    box.innerHTML = `
      <div class="fa-grid">
        ${theo}
        ${list.map(([id, d]) => cell({
          id, name: d.name, ok: true, note: '',
          worn: cur === id || (cur === 'auto' && list.length === 1),
          art: `<span class="fa-art">${faceHtml(skinSrc(id), 'fa-face')}</span>`,
        })).join('')}
      </div>`;
    wire(box, api, 'avatar');
    upgradeFaces(box);
  }

  function drawFrames(kind, table, tenLoai) {
    return (box, api) => {
      const lv = trainerLevel();
      // Ô "không mặc gì" chỉ có nghĩa khi đang mặc một món — chưa có món nào
      // thì tab để trống, không bày ô rỗng cho chật chỗ.
      const items = Object.entries(table).filter(([id]) => id !== 'none' || p.look[kind] !== 'none');
      box.innerHTML = items.length
        ? `<div class="fa-grid">${items.map(([id, d]) => {
            const ok = unlocked(d, p, lv);
            const worn = p.look[kind] === id;
            return cell({ id, name: d.name, worn, ok, note: ok ? '' : requirement(d), art: art(kind, id, d) });
          }).join('')}</div>`
        : TRONG(tenLoai);
      wire(box, api, kind);
      upgradeFaces(box);
    };
  }

  function art(kind, id, d) {
    if (!imgOf(d)) return '<span class="fa-art fa-none">⊘</span>';
    if (kind === 'chatFrame') {
      const cf = chatFrame(id);
      return `<span class="fa-art"><span class="fa-bubble${cf.cls}"${cf.style}>Alo</span></span>`;
    }
    const fr = avatarFrame(id);
    return `<span class="fa-art"><span class="ring-ava-wrap fa-ring${fr.cls}"${fr.style}>
      ${faceHtml(skinSrc(avatarSkinId()), 'fa-face')}</span></span>`;
  }

  function wire(box, api, kind) {
    box.querySelectorAll('.fa-cell:not([disabled])').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.id;
      const table = { avatar: SKINS, avatarFrame: AVATAR_FRAMES, chatFrame: CHAT_FRAMES }[kind];
      const name = id === 'auto' ? 'theo skin đang mặc' : table[id]?.name;
      if (wearCosmetic(kind, id)) toast(`Đã đổi sang ${name}.`);
      api.redraw();
      document.dispatchEvent(new CustomEvent('look-change'));
    }));
  }

  return openSheet({
    title: 'Trang trí',
    tab: startTab,
    tabs: [
      { id: 'avatar', name: 'Ảnh đại diện', draw: drawAvatar },
      { id: 'avatarFrame', name: 'Khung avatar', draw: drawFrames('avatarFrame', AVATAR_FRAMES, 'khung avatar') },
      { id: 'chatFrame', name: 'Bong bóng chat', draw: drawFrames('chatFrame', CHAT_FRAMES, 'bong bóng chat') },
    ],
  });
}
