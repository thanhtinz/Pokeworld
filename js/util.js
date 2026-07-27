// PokeWorld H5 | util.js | Tiện ích chung: RNG, clamp, sprite, escape HTML

export const rng = {
  int(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
  float() { return Math.random(); },
  roll(p) { return Math.random() < p; },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  // list phần tử có trường w (trọng số) -> trả về phần tử được chọn
  weighted(list) {
    const total = list.reduce((s, e) => s + (e.w || 1), 0);
    let roll = Math.random() * total;
    for (const e of list) { roll -= (e.w || 1); if (roll <= 0) return e; }
    return list[list.length - 1];
  },
};

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Escape HTML khi chèn chuỗi người dùng nhập (nickname...)
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Sprite Pokémon từ PokeAPI (CDN công khai). back = sprite nhìn từ sau lưng.
export const spriteUrl = (dexId, back = false) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${back ? 'back/' : ''}${dexId}.png`;

export const spriteShinyUrl = (dexId, back = false) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${back ? 'back/' : ''}${dexId}.png`;

// Sprite theo mon instance (tự chọn shiny)
export const monSprite = (mon, back = false) =>
  mon.shiny ? spriteShinyUrl(mon.sp, back) : spriteUrl(mon.sp, back);

// Sprite pixel ĐỘNG (gen 5 B/W animated .gif) — dùng trong trận đấu.
// Cấu trúc repo PokeAPI: animated/{id}.gif, animated/back/{id}.gif,
// animated/shiny/{id}.gif, animated/back/shiny/{id}.gif
const ANIM_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated';
export const animSpriteUrl = (dexId, back = false, shiny = false) =>
  `${ANIM_BASE}/${back ? 'back/' : ''}${shiny ? 'shiny/' : ''}${dexId}.gif`;

// Animated sprite theo mon instance (tự chọn shiny)
export const animSprite = (mon, back = false) =>
  animSpriteUrl(mon.sp, back, !!mon.shiny);

// Sprite item chính hãng từ PokeAPI (id của mình dùng _ , CDN dùng -)
export const itemSpriteUrl = (itemId) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${String(itemId).replace(/_/g, '-')}.png`;

export const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');

// Ngày dạng số yyyymmdd (cho daily)
export const todayNum = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};
export const dayNum = () => Math.floor(Date.now() / 86400000);

// ===== Ảnh cục bộ từ pokesprite (msikma/pokesprite) =====
// Ảnh nằm ngay trong dự án nên chơi được cả khi mất mạng / bị chặn CDN.
import { slugOf } from './data/slugs.js';

// Ảnh nhỏ kiểu "trong hộp" — dùng cho danh sách đội, Pokédex, túi đồ
export const boxIcon = (dexId, shiny = false) => {
  const slug = slugOf(dexId);
  return slug ? `assets/pokesprite/${shiny ? 'shiny' : 'regular'}/${slug}.png` : 'assets/pokesprite/unknown.png';
};
export const monBoxIcon = (mon) => boxIcon(mon.sp, !!mon.shiny);
export const EGG_ICON = 'assets/pokesprite/egg.png';

// Ảnh vật phẩm cục bộ. Kho pokesprite chia theo nhóm nên cần biết nhóm.
const ITEM_DIRS = ['ball', 'medicine', 'berry', 'evo-item', 'hold-item',
  'mega-stone', 'battle-item', 'gem', 'fossil', 'valuable-item', 'key-item'];
export const itemIconLocal = (itemId, dir) =>
  `assets/pokesprite/items/${dir}/${String(itemId).replace(/_/g, '-')}.png`;
export { ITEM_DIRS };

// Chuỗi ảnh dự phòng cho thẻ <img>: ảnh chính hỏng thì tự thử ảnh kế tiếp.
// Dùng: <img src="${a}" onerror="${fallbackAttr(b, c)}">
export function fallbackAttr(...urls) {
  const step = (i) => (i >= urls.length
    ? 'this.onerror=null'
    : `this.onerror=function(){${step(i + 1)}};this.src='${urls[i]}'`);
  return step(0);
}

// Ảnh cục bộ hiện ngay, ảnh đẹp hơn (CDN) tải xong mới đổi sang.
// Mạng chậm hay bị chặn thì người chơi vẫn thấy hình, không phải ô trống.
// data-up có thể liệt kê nhiều ảnh cách nhau bằng dấu | — thử lần lượt, cái nào tải được thì dùng.
export function upgradeImages(root) {
  if (!root) return;
  for (const img of root.querySelectorAll('img[data-up]')) {
    const list = (img.dataset.up || '').split('|').filter(Boolean);
    img.removeAttribute('data-up');
    (function next(i) {
      if (i >= list.length) return;
      const probe = new Image();
      probe.onload = () => { img.src = list[i]; };
      probe.onerror = () => next(i + 1);
      probe.src = list[i];
    })(0);
  }
}

// Ảnh động Gen 5 để sẵn trong dự án — chỉ có mặt trước, không shiny, dex 1..386.
// Có thì dùng luôn khỏi phải chờ CDN; thiếu thì trả null để rơi về ảnh trên mạng.
const ANIM_LOCAL_MAX = 386;
const ANIM_LOCAL_MISSING = new Set([297]);
export function animLocal(dexId, back = false, shiny = false) {
  if (back || shiny) return null;
  const id = Number(dexId);
  if (!(id >= 1 && id <= ANIM_LOCAL_MAX) || ANIM_LOCAL_MISSING.has(id)) return null;
  return `assets/anim/${id}.gif`;
}

// Danh sách ảnh nên thử theo thứ tự cho một Pokémon (dùng với data-up)
export const monUpgradeChain = (mon, back = false) =>
  [animLocal(mon.sp, back, mon.shiny), animSprite(mon, back), monSprite(mon, back)]
    .filter(Boolean).join('|');

// Đường dẫn tuyệt đối tính từ trang. Cần khi nhét ảnh vào biến CSS: URL tương đối
// trong biến CSS được tính theo vị trí file .css chứ không phải theo trang.
export const absUrl = (path) =>
  (typeof document === 'undefined' ? path : new URL(path, document.baseURI).href);
