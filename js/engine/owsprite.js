// TuxeWorld H5 | engine/owsprite.js | Nhân vật đi lại trên bản đồ (sprite kiểu GBA)
// Mỗi file assets/ow/<tên>.png là lưới 3 cột x 4 hàng, ô 16x32:
//   hàng 0 xuống · hàng 1 lên · hàng 2 trái · hàng 3 phải
//   cột 0 đứng yên · cột 1 và 2 là hai bước chân
export const OW_W = 16, OW_H = 32;

const DIR_ROW = { down: 0, up: 1, left: 2, right: 3 };
const WALK_CYCLE = [1, 0, 2, 0];      // nhịp bước: trái - đứng - phải - đứng
const STEP_MS = 150;

const cache = new Map();

export function owImage(name) {
  if (!name) return null;
  let img = cache.get(name);
  if (!img) {
    img = new Image();
    img.src = `assets/ow/${name}.png`;
    cache.set(name, img);
  }
  return img;
}

// Ô cần cắt trong ảnh: đứng yên thì luôn khung 0, đang đi thì chạy vòng bước chân
export function owFrame(dir, moving, timeMs = Date.now()) {
  const row = DIR_ROW[dir] ?? 0;
  const col = moving ? WALK_CYCLE[Math.floor(timeMs / STEP_MS) % WALK_CYCLE.length] : 0;
  return { sx: col * OW_W, sy: row * OW_H, sw: OW_W, sh: OW_H };
}

export const owReady = (img) => !!(img && img.complete && img.naturalWidth);
