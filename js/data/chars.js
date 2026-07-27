// PokeWorld H5 | data/chars.js | Sprite nhân vật người chơi (bộ Mana Seed)
//
// Mỗi file assets/char/<id>.png là lưới 7 cột × 4 hàng, ô 64×64:
//   hàng 0 xuống · hàng 1 lên · hàng 2 phải · hàng 3 trái
//   cột 0 đứng yên · cột 1-6 là sáu khung đi bộ
// Ảnh do tools/mkchars.py ghép sẵn từ bản demo miễn phí của Mana Seed
// (thân + quần áo + tóc dán chồng thành một lớp, game khỏi phải xếp lúc chạy).

export const CHAR_CELL = 64;
// Người trong ô 64×64 chỉ chiếm một vùng nhỏ ở giữa. Đo bằng tools/mkchars.py:
// mọi khung của mọi hướng đều nằm gọn trong hộp này.
export const BODY = { x: 22, y: 12, w: 20, h: 33 };
export const CHAR_COLS = 7;
export const CHAR_ROWS = 4;
export const WALK_FRAMES = 6;
export const WALK_MS = 135;          // nhịp đi bộ tác giả bộ sprite khuyến nghị

const DIR_ROW = { down: 0, up: 1, right: 2, left: 3 };

export const CHARS = {
  red:  { name: 'Nam', src: 'assets/char/red.png' },
  leaf: { name: 'Nữ',  src: 'assets/char/leaf.png' },
};

export const charSrc = (id) => (CHARS[id] || CHARS.red).src;

const cache = new Map();

export function charImage(id) {
  const src = charSrc(id);
  let img = cache.get(src);
  if (!img) {
    img = new Image();
    img.src = src;
    cache.set(src, img);
  }
  return img;
}

export const charReady = (img) => !!(img && img.complete && img.naturalWidth);

// Ô cần cắt trong ảnh. Đứng yên -> cột 0; đang đi -> chạy vòng 6 khung.
export function charFrame(dir, moving, timeMs = Date.now()) {
  const row = DIR_ROW[dir] ?? 0;
  const col = moving ? 1 + (Math.floor(timeMs / WALK_MS) % WALK_FRAMES) : 0;
  return { sx: col * CHAR_CELL, sy: row * CHAR_CELL, sw: CHAR_CELL, sh: CHAR_CELL };
}

// Một khung tĩnh dạng HTML, CẮT SÁT NGƯỜI (bỏ phần trống quanh ô) rồi phóng
// tới đúng chiều cao yêu cầu. Nhờ vậy "cao 92px" nghĩa là người cao đúng 92px,
// so được trực tiếp với sprite Pokémon.
// `height` là độ dài CSS bất kỳ: '92px', 'min(92px, 24vw)'...
export function charBodyHtml(id, { dir = 'down', height = '92px', cls = '', style = '' } = {}) {
  const f = charFrame(dir, false);
  const col = f.sx / CHAR_CELL, row = f.sy / CHAR_CELL;
  const k = (n) => `calc(${height} * ${(n / BODY.h).toFixed(5)})`;   // 1 đơn vị ảnh = height/BODY.h
  return `<span class="char-frame ${cls}" style="
    width:${k(BODY.w)};height:${height};
    background-image:url(${charSrc(id)});
    background-size:${k(CHAR_CELL * CHAR_COLS)} ${k(CHAR_CELL * CHAR_ROWS)};
    background-position:${k(-(col * CHAR_CELL + BODY.x))} ${k(-(row * CHAR_CELL + BODY.y))};${style}"></span>`;
}
