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
export const monSprite = (mon, back = false) => monPath(mon.sp, back);
export const animSpriteUrl = (dexId, back = false) => monPath(dexId, back);

export const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');

// Đơn vị tiền của Tuxemon là ĐÔ LA, ký hiệu đứng TRƯỚC số:
//   tuxemon/ui/text_formatter.py -> "${{currency}}": lambda: "$"
// (Bản này trước đây dùng ₽ đặt sau số — đó là kiểu của Pokemon.)
//
// tien()  dùng cho chữ trần: toast, mô tả, thư... — có ký hiệu để biết là tiền.
// Chỗ nào ĐÃ CÓ icon đồng tiền đứng cạnh thì dùng thẳng fmt(), khỏi lặp lại.
export const TIEN = '$';
export const tien = (n) => `${TIEN}${fmt(n)}`;

// Ngày dạng số yyyymmdd (cho daily)
export const todayNum = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

// Ảnh nhỏ kiểu "trong hộp" — dùng cho danh sách đội, Tuxedex, túi đồ
export const boxIcon = (dexId) => monIconPath(dexId);
export const monBoxIcon = (mon) => monIconPath(mon.sp);

// Ảnh nào tải được thì đổi sang, dùng cho <img data-up="ảnh1|ảnh2">
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

// Ảnh sinh vật đều nằm sẵn trong dự án nên không cần chuỗi dự phòng nữa;
// giữ lại các tên hàm cũ để giao diện không phải sửa theo.
export const monLocalSrc = (mon, back = false) => monPath(mon.sp, back);
export const monFallbackAttr = (mon, back = false) =>
  `this.onerror=null;this.src='${monIconPath(mon.sp)}'`;
export const monSpriteClass = () => '';
export const monUpgradeChain = () => '';

// Đường dẫn tuyệt đối tính từ trang. Cần khi nhét ảnh vào biến CSS: URL tương đối
// trong biến CSS được tính theo vị trí file .css chứ không phải theo trang.
export const absUrl = (path) =>
  (typeof document === 'undefined' ? path : new URL(path, document.baseURI).href);
