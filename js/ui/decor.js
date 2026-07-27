// TuxeWorld H5 | ui/decor.js | Bảng "Trang trí": ảnh đại diện, khung avatar, bong bóng chat
//
// Mở bằng cách bấm vào ảnh đại diện trên thanh trên cùng. Ba thứ này chỉ thay
// đổi cách người khác NHÌN thấy mình nên gom vào một bảng trượt mở nhanh tại
// chỗ, không cần rời màn hình đang chơi. Quần áo (skin) và danh hiệu vẫn ở
// trang Thời trang vì đó là cả bộ dạng nhân vật.
import { ensureData, trainerLevel, wearCosmetic } from '../engine/player.js';
import { AVATAR_FRAMES, CHAT_FRAMES, SKINS, NONE_ID, unlocked, requirement, imgOf } from '../data/cosmetics.js';
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

// Ô trong lưới: ảnh xem trước + tên + trạng thái
function cell({ id, name, art, worn, ok, note }) {
  return `<button type="button" class="fa-cell${worn ? ' worn' : ''}${ok ? '' : ' locked'}"
      data-id="${esc(id)}" ${ok ? '' : 'disabled'}>
    ${worn ? '<span class="fa-worn">Đang dùng</span>' : ''}
    ${art}
    <b class="fa-name">${esc(name)}</b>
    <small class="fa-req">${esc(note)}</small>
  </button>`;
}

export function openDecor(startTab) {
  ensureCss();
  const p = ensureData();
  if (!p) return null;

  // Tab ảnh đại diện: lấy MẶT của các bộ skin. Mặc định đi theo skin đang mặc,
  // nhưng ai thích để mặt bộ khác cũng được.
  function drawAvatar(box, api) {
    const lv = trainerLevel();
    const list = Object.entries(SKINS).filter(([, d]) => unlocked(d, p, lv));
    const cur = p.look.avatar || 'auto';
    box.innerHTML = `
      <div class="fa-grid">
        ${cell({ id: 'auto', name: 'Theo skin đang mặc', worn: cur === 'auto', ok: true,
          note: SKINS[p.look.skin]?.name || 'Trang phục gốc',
          art: `<span class="fa-art">${faceHtml(skinSrc(p.look.skin), 'fa-face')}</span>` })}
        ${list.map(([id, d]) => cell({
          id, name: d.name, worn: cur === id, ok: true, note: cur === id ? '✓' : 'Bấm để dùng',
          art: `<span class="fa-art">${faceHtml(skinSrc(id), 'fa-face')}</span>`,
        })).join('')}
      </div>
      <p class="empty-note sheet-note">Ảnh đại diện lấy phần gương mặt của bộ skin.</p>`;
    wire(box, api, 'avatar');
    upgradeFaces(box);
  }

  // Hai tab còn lại đều là ảnh admin tải lên nên dùng chung một khuôn
  function drawFrames(kind, table) {
    return (box, api) => {
      const lv = trainerLevel();
      const items = Object.entries(table);
      box.innerHTML = `
        <div class="fa-grid">
          ${items.map(([id, d]) => {
            const ok = unlocked(d, p, lv);
            const worn = p.look[kind] === id;
            return cell({
              id, name: d.name, worn, ok,
              note: ok ? (worn ? '✓' : 'Bấm để dùng') : requirement(d),
              art: art(kind, id, d),
            });
          }).join('')}
        </div>
        ${items.length <= 1
          ? '<p class="empty-note sheet-note">Chưa có món nào — quản trị viên tải ảnh lên trong trang /admin là hiện ngay ở đây.</p>'
          : ''}`;
      wire(box, api, kind);
      upgradeFaces(box);
    };
  }

  function art(kind, id, d) {
    if (!imgOf(d)) return `<span class="fa-art fa-none">${id === NONE_ID[kind] ? '⊘' : '?'}</span>`;
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
      const name = kind === 'avatar'
        ? (id === 'auto' ? 'theo skin đang mặc' : SKINS[id]?.name)
        : (kind === 'avatarFrame' ? AVATAR_FRAMES : CHAT_FRAMES)[id]?.name;
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
      { id: 'avatarFrame', name: 'Khung avatar', draw: drawFrames('avatarFrame', AVATAR_FRAMES) },
      { id: 'chatFrame', name: 'Bong bóng chat', draw: drawFrames('chatFrame', CHAT_FRAMES) },
    ],
  });
}
