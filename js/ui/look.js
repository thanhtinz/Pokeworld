// TuxeWorld H5 | ui/look.js | Dựng HTML cho đồ thời trang đang mặc
// Mọi màn hình đi qua đây để khung avatar / khung chat / danh hiệu / skin ở đâu
// cũng hiện giống nhau. Món nào cũng là ảnh quản trị viên tải lên.
import { AVATAR_FRAMES, CHAT_FRAMES, TITLES, SKINS, imgOf } from '../data/cosmetics.js';
import { activeAvatar } from '../engine/accounts.js';
import { G } from '../state.js';
import { esc } from '../util.js';

// Đường dẫn ảnh nhét vào url(...) của CSS — chặn dấu nháy để không thoát ra ngoài
const cssUrl = (src) => `url('${String(src).replace(/['"\\\n]/g, '')}')`;

function frameAttrs(table, id, prefix) {
  const img = imgOf(table[id]);
  if (!img) return { cls: '', style: '' };
  return { cls: ` ${prefix}-img`, style: ` style="--fr:${cssUrl(img)}"` };
}

// Khung ảnh đại diện: trả về { cls, style } để gắn vào .ring-ava-wrap
export const avatarFrame = (id) => frameAttrs(AVATAR_FRAMES, id, 'fr');
// Khung bong bóng chat: gắn vào .chat-line
export const chatFrame = (id) => frameAttrs(CHAT_FRAMES, id, 'cf');

export function titleHtml(id, cls = 'title-pill') {
  const t = TITLES[id];
  if (!t || id === 'none') return '';
  const img = imgOf(t);
  if (img) return `<img class="${cls} tp-img" src="${esc(img)}" alt="${esc(t.name)}" onerror="this.remove()">`;
  return `<span class="${cls}" style="--tc:${esc(t.color || '#ffd43b')}">${esc(t.name)}</span>`;
}

// Ảnh nhân vật hiện tại: skin đang mặc, không có thì avatar gốc của tài khoản
export function skinSrc(skinId) {
  const id = skinId ?? G.p?.look?.skin;
  return imgOf(SKINS[id]) || `assets/trainers/${activeAvatar()}.png`;
}
// Tên cũ
export const avatarSrc = skinSrc;

// Ảnh đại diện = gương mặt của skin; 'auto' = theo bộ đang mặc.
export function avatarSkinId() {
  const pick = G.p?.look?.avatar;
  if (pick && pick !== 'auto' && SKINS[pick]) return pick;
  return G.p?.look?.skin || 'default';
}

export const avatarFaceSrc = () => skinSrc(avatarSkinId());

// Ô mặt: lấy ảnh skin làm nền rồi cắt vào vùng đầu. Cắt kiểu nào còn tuỳ cỡ
// ảnh thật nên upgradeFaces() quyết định sau khi ảnh tải xong.
export function faceHtml(src, cls = '') {
  return `<span class="ava-face ${cls}" data-face="${esc(src)}" style="background-image:${cssUrl(src)}"></span>`;
}

export const myFaceHtml = (cls = '') => faceHtml(avatarFaceSrc(), cls);

// Ảnh mặt của NGƯỜI KHÁC: skin họ đang mặc, không có thì avatar gốc của họ.
// (skinSrc ở trên luôn lùi về avatar của MÌNH nên không dùng lại được.)
export function faceSrcOf(look, avatar) {
  const id = (look?.avatar && look.avatar !== 'auto' ? look.avatar : look?.skin) || 'default';
  return imgOf(SKINS[id]) || `assets/trainers/${avatar || 'red'}.png`;
}

// Cả người: ảnh 3x4 thì chỉ lấy một khung đứng yên, ảnh thường hiện nguyên tấm.
export function bodyHtml(src, cls = '') {
  return `<span class="ava-body ${cls}" data-face="${esc(src)}" style="background-image:${cssUrl(src)}"></span>`;
}

// Ảnh đi bản đồ = lưới 3x4 ô 16x32; ảnh khác coi như tranh cả người.
const SHEET_RATIO = 3 / 8;

export function upgradeFaces(root = document) {
  for (const el of root.querySelectorAll('[data-face]')) {
    const src = el.dataset.face;
    if (!src || el.dataset.faceDone === src) continue;
    el.dataset.faceDone = src;
    const im = new Image();
    im.onload = () => {
      const sheet = Math.abs(im.naturalWidth / im.naturalHeight - SHEET_RATIO) < 0.02;
      if (el.classList.contains('ava-body')) { el.classList.toggle('body-sheet', sheet); return; }
      el.classList.toggle('face-sheet', sheet);
      el.classList.toggle('face-zoom', !sheet);
    };
    im.onerror = () => el.classList.add('face-blank');
    im.src = src;
  }
}
