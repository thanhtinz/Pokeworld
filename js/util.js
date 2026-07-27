// TuxeWorld H5 | util.js | Tiện ích chung: RNG, clamp, sprite, escape HTML

// Nguồn số ngẫu nhiên. Bình thường dùng Math.random, nhưng khi đấu PvP thì
// gieo hạt để HAI MÁY tính ra y hệt nhau — không có bước này thì mỗi bên thấy
// một kết quả khác nhau và máy chủ sẽ ghi trận là "tranh chấp".
let _seeded = null;
function _next() {
  if (!_seeded) return Math.random();
  // mulberry32: nhỏ, nhanh, cùng hạt luôn ra cùng dãy
  _seeded = (_seeded + 0x6D2B79F5) | 0;
  let t = _seeded;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export const rng = {
  seed(n) { _seeded = (Number(n) | 0) || 1; },
  unseed() { _seeded = null; },
  isSeeded() { return _seeded !== null; },
  int(a, b) { return a + Math.floor(_next() * (b - a + 1)); },
  float() { return _next(); },
  roll(p) { return _next() < p; },
  pick(arr) { return arr[Math.floor(_next() * arr.length)]; },
  // list phần tử có trường w (trọng số) -> trả về phần tử được chọn
  weighted(list) {
    const total = list.reduce((s, e) => s + (e.w || 1), 0);
    let roll = _next() * total;
    for (const e of list) { roll -= (e.w || 1); if (roll <= 0) return e; }
    return list[list.length - 1];
  },
};

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Escape HTML khi chèn chuỗi người dùng nhập (nickname...)
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ===== Sprite sinh vật (Tuxemon, nằm sẵn trong dự án) =====
// assets/mon/<id>.png     mặt trước (64x64)
// assets/mon/<id>_b.png   mặt sau
// assets/mon/<id>_i.png   icon nhỏ 24x24 cho danh sách
// Không còn phụ thuộc CDN nào — mất mạng vẫn chơi được đầy đủ.
export const monPath = (dexId, back = false) =>
  `assets/mon/${dexId}${back ? '_b' : ''}.png`;
export const monIconPath = (dexId) => `assets/mon/${dexId}_i.png`;

export const spriteUrl = (dexId, back = false) => monPath(dexId, back);
export const spriteShinyUrl = (dexId, back = false) => monPath(dexId, back);
export const monSprite = (mon, back = false) => monPath(mon.sp, back);
export const animSpriteUrl = (dexId, back = false) => monPath(dexId, back);
export const animSprite = (mon, back = false) => monPath(mon.sp, back);

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

// Ảnh nhỏ kiểu "trong hộp" — dùng cho danh sách đội, Tuxedex, túi đồ
export const boxIcon = (dexId) => monIconPath(dexId);
export const monBoxIcon = (mon) => monIconPath(mon.sp);
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

// Toàn bộ ảnh sinh vật đã nằm trong dự án nên không còn chuỗi dự phòng qua CDN.
// Giữ lại các tên hàm cũ để phần giao diện không phải sửa theo.
export const animLocal = (dexId, back = false) => monPath(dexId, back);
export const monLocalSrc = (mon, back = false) => monPath(mon.sp, back);
export const monFallbackAttr = (mon, back = false) =>
  `this.onerror=null;this.src='${monIconPath(mon.sp)}'`;
export const monSpriteClass = () => '';
export const monUpgradeChain = () => '';

// Đường dẫn tuyệt đối tính từ trang. Cần khi nhét ảnh vào biến CSS: URL tương đối
// trong biến CSS được tính theo vị trí file .css chứ không phải theo trang.
export const absUrl = (path) =>
  (typeof document === 'undefined' ? path : new URL(path, document.baseURI).href);
