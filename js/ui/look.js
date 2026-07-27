// TuxeWorld H5 | ui/look.js | Dựng HTML cho đồ thời trang đang mặc
//
// Mọi món thời trang đều là ảnh quản trị viên tải lên; món "không mặc gì" thì
// không có ảnh và giao diện trở về kiểu mặc định. Mọi màn hình đi qua đây để
// khung avatar / khung chat / danh hiệu / skin ở đâu cũng hiện giống nhau.
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
export function avatarSrc(skinId) {
  const id = skinId ?? G.p?.look?.skin;
  return imgOf(SKINS[id]) || `assets/trainers/${activeAvatar()}.png`;
}
