// TuxeWorld H5 | ui/decor.js | Bảng "Trang trí": ảnh đại diện, khung avatar, bong bóng chat
//
// Bố cục theo kiểu bảng chọn ảnh đại diện của game MOBA: cột tab dọc bên trái,
// lưới ở giữa, khung xem trước + nút "Sử dụng" bên phải. Chọn một ô chỉ là
// NGẮM, bấm "Sử dụng" mới thật sự mặc.
import { ensureData, trainerLevel, wearCosmetic } from '../engine/player.js';
import { AVATAR_FRAMES, CHAT_FRAMES, SKINS, unlocked, requirement, imgOf } from '../data/cosmetics.js';
import { esc } from '../util.js';
import { toast } from './kit.js';
import { avatarFrame, chatFrame, skinSrc, faceHtml, upgradeFaces, avatarSkinId } from './look.js';

const TABS = [
  { id: 'avatar', name: 'Ảnh đại diện', loai: 'ảnh đại diện' },
  { id: 'avatarFrame', name: 'Khung avatar', loai: 'khung avatar' },
  { id: 'chatFrame', name: 'Bong bóng chat', loai: 'bong bóng chat' },
];

function ensureCss() {
  if (document.getElementById('char-css')) return;
  const l = document.createElement('link');
  l.id = 'char-css';
  l.rel = 'stylesheet';
  l.href = 'css/character.css';
  document.head.appendChild(l);
}

export function openDecor(startTab) {
  ensureCss();
  const p = ensureData();
  if (!p) return null;

  let tab = TABS.some(t => t.id === startTab) ? startTab : TABS[0].id;
  let sel = null;                     // món đang ngắm

  const wrap = document.getElementById('modal-wrap');
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay decor-overlay';
  overlay.innerHTML = `
    <div class="decor" role="dialog" aria-label="Trang trí">
      <div class="decor-head">
        <b>Trang trí</b>
        <button type="button" class="sheet-x" aria-label="Đóng">×</button>
      </div>
      <div class="decor-body">
        <div class="decor-rail">
          ${TABS.map(t => `<button type="button" class="decor-tab" data-tab="${t.id}">${esc(t.name)}</button>`).join('')}
        </div>
        <div class="decor-grid-wrap"><div class="decor-grid"></div></div>
        <div class="decor-side">
          <div class="decor-prev"></div>
          <b class="decor-prev-name"></b>
          <small class="decor-prev-note"></small>
          <button type="button" class="btn btn-primary decor-use">Sử dụng</button>
        </div>
      </div>
    </div>`;

  const $ = (q) => overlay.querySelector(q);
  const close = () => { overlay.classList.remove('in'); setTimeout(() => overlay.remove(), 180); };

  // Danh sách món của tab: [id, def, mở khoá chưa]
  function danhSach() {
    const lv = trainerLevel();
    if (tab === 'avatar') {
      const skins = Object.entries(SKINS).filter(([, d]) => unlocked(d, p, lv));
      // Ở tab này đang nói chuyện ẢNH ĐẠI DIỆN, không phải quần áo
      const list = skins.map(([id, d]) => [id, id === 'default' ? { ...d, name: 'Avatar mặc định' } : d, true]);
      // Ô "theo skin đang mặc" chỉ có nghĩa khi có từ hai bộ trở lên
      if (skins.length > 1) list.unshift(['auto', { name: 'Theo skin đang mặc' }, true]);
      return list;
    }
    const table = tab === 'avatarFrame' ? AVATAR_FRAMES : CHAT_FRAMES;
    // Ô "none" là ô Trống: bỏ khung / bỏ bong bóng cho về mặc định
    return Object.entries(table)
      .map(([id, d]) => [id, id === 'none' ? { ...d, name: 'Trống' } : d, unlocked(d, p, lv)]);
  }

  function anh(id, d) {
    if (tab === 'avatar') {
      const src = id === 'auto' ? skinSrc(p.look.skin) : skinSrc(id);
      return faceHtml(src, 'decor-face');
    }
    if (!imgOf(d)) return '<span class="decor-none">⊘</span>';
    if (tab === 'chatFrame') {
      const cf = chatFrame(id);
      return `<span class="fa-bubble${cf.cls}"${cf.style}>Alo</span>`;
    }
    const fr = avatarFrame(id);
    return `<span class="ring-ava-wrap decor-ring${fr.cls}"${fr.style}>${
      faceHtml(skinSrc(avatarSkinId()), 'decor-face')}</span>`;
  }

  function draw() {
    overlay.querySelectorAll('.decor-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    const list = danhSach();
    // Chỉ có một bộ skin thì không có ô 'auto', lúc đó "đang dùng" chính là bộ đó
    let dangMac = p.look[tab];
    if (!list.some(([id]) => id === dangMac)) {
      dangMac = tab === 'avatar' ? avatarSkinId() : null;
    }
    if (!list.some(([id]) => id === sel)) {
      sel = list.some(([id]) => id === dangMac) ? dangMac : (list[0]?.[0] ?? null);
    }

    // Tab nào chỉ còn mỗi ô "Trống" thì đừng bày thẻ to ghi chữ "Trống" — thay
    // bằng một khung nhỏ báo chưa có gì, nhìn cho gọn.
    const rong = list.every(([id]) => id === 'none');
    $('.decor-grid').innerHTML = rong
      ? '<div class="slot-empty">— trống —</div>'
      : list.length
      ? list.map(([id, d, ok]) => `
        <button type="button" class="decor-cell${id === sel ? ' sel' : ''}${ok ? '' : ' locked'}"
                data-id="${esc(id)}" ${ok ? '' : 'disabled'}>
          ${id === dangMac ? '<span class="decor-worn">✓</span>' : ''}
          ${anh(id, d)}
        </button>`).join('')
      : '';

    const cur = rong ? null : list.find(([id]) => id === sel);
    const [id, d, ok] = cur || [];
    $('.decor-prev').innerHTML = cur ? anh(id, d) : '';
    $('.decor-prev-name').textContent = cur ? d.name : '— trống —';
    $('.decor-prev-note').textContent = rong ? 'Chưa có món nào'
      : !cur ? ''
      : id === dangMac ? 'Đang dùng'
        : ok ? 'Bấm Sử dụng để đổi' : requirement(d);
    const use = $('.decor-use');
    use.disabled = !cur || !ok || id === dangMac;
    use.textContent = cur && id === dangMac ? 'Đang dùng' : 'Sử dụng';

    upgradeFaces(overlay);
  }

  overlay.addEventListener('click', e => {
    const t = e.target.closest('.decor-tab');
    if (t) { tab = t.dataset.tab; sel = null; draw(); return; }
    const c = e.target.closest('.decor-cell');
    if (c) { sel = c.dataset.id; draw(); return; }
    if (e.target.closest('.decor-use')) {
      const list = danhSach();
      const cur = list.find(([id]) => id === sel);
      if (!cur) return;
      if (wearCosmetic(tab, sel)) toast(`Đã dùng ${cur[1].name}.`);
      document.dispatchEvent(new CustomEvent('look-change'));
      draw();
      return;
    }
    if (e.target.closest('.sheet-x') || e.target === overlay) close();
  });

  wrap.appendChild(overlay);
  draw();
  requestAnimationFrame(() => overlay.classList.add('in'));
  return { close, redraw: draw };
}
