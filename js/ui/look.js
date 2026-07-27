// TuxeWorld H5 | ui/look.js | Dựng HTML cho đồ thời trang đang mặc
//
// Một món có thể có ẢNH (admin tải lên trong trang /admin) hoặc không. Có ảnh thì
// dùng ảnh, không có thì vẽ bằng CSS như bộ mặc định. Mọi màn hình đi qua đây để
// khung avatar / khung chat / danh hiệu ở đâu cũng hiện giống nhau.
import { AVATAR_FRAMES, CHAT_FRAMES, TITLES, imgOf } from '../data/cosmetics.js';
import { esc } from '../util.js';

// Đường dẫn ảnh nhét vào url(...) của CSS — chặn dấu nháy để không thoát ra ngoài
const cssUrl = (src) => `url('${String(src).replace(/['"\\\n]/g, '')}')`;

function frameAttrs(table, id, prefix) {
  const d = table[id];
  if (!d || id === 'none') return { cls: '', style: '' };
  const img = imgOf(d);
  if (img) return { cls: ` ${prefix}-img`, style: ` style="--fr:${cssUrl(img)}"` };
  return { cls: d.css ? ` ${prefix}-${esc(d.css)}` : '', style: '' };
}

// Khung ảnh đại diện: trả về { cls, style } để gắn vào .ring-ava-wrap
export const avatarFrame = (id) => frameAttrs(AVATAR_FRAMES, id, 'fr');
// Khung bong bóng chat: gắn vào .chat-line
export const chatFrame = (id) => frameAttrs(CHAT_FRAMES, id, 'cf');

// Danh hiệu: ảnh thì hiện ảnh, không thì hiện thẻ chữ tô màu
export function titleHtml(id, cls = 'title-pill') {
  const t = TITLES[id];
  if (!t) return '';
  const img = imgOf(t);
  if (img) return `<img class="${cls} tp-img" src="${esc(img)}" alt="${esc(t.name)}" onerror="this.remove()">`;
  return `<span class="${cls}" style="--tc:${esc(t.color || '#ffd43b')}">${esc(t.name)}</span>`;
}
