// TuxeWorld H5 | engine/owsprite.js | Nhân vật đi lại trên bản đồ (sprite kiểu GBA)
// Mỗi file assets/ow/<tên>.png là lưới 3 cột x 4 hàng, ô 16x32:
//   hàng 0 xuống · hàng 1 trái · hàng 2 phải · hàng 3 lên
//   cột 0 đứng yên · cột 1 và 2 là hai bước chân
export const OW_W = 16, OW_H = 32;

// Bộ sprite Tuxemon xếp hàng: 0 xuống · 1 trái · 2 phải · 3 lên
const DIR_ROW = { down: 0, left: 1, right: 2, up: 3 };
const WALK_CYCLE = [1, 0, 2, 0];      // nhịp bước: trái - đứng - phải - đứng
const STEP_MS = 150;

const cache = new Map();

// name = tên tệp trong assets/ow, hoặc thẳng một địa chỉ ảnh (skin admin tải lên)
export function owImage(name) {
  if (!name) return null;
  let img = cache.get(name);
  if (!img) {
    img = new Image();
    img.src = /^(https?:|\/)/.test(name) ? name : `assets/ow/${name}.png`;
    cache.set(name, img);
  }
  return img;
}

// Ảnh có đúng tỉ lệ 3 cột x 4 hàng của bộ sprite đi bản đồ không?
// Skin tải lên mà không đúng khuôn thì vẫn dùng sprite gốc, tránh vẽ ra hình vỡ.
export const owSheetOk = (img) =>
  owReady(img) && Math.abs(img.naturalWidth / img.naturalHeight - 3 / 8) < 0.02;

// Ô cần cắt trong ảnh: đứng yên thì luôn khung 0, đang đi thì chạy vòng bước chân
export function owFrame(dir, moving, timeMs = Date.now()) {
  const row = DIR_ROW[dir] ?? 0;
  const col = moving ? WALK_CYCLE[Math.floor(timeMs / STEP_MS) % WALK_CYCLE.length] : 0;
  return { sx: col * OW_W, sy: row * OW_H, sw: OW_W, sh: OW_H };
}

export const owReady = (img) => !!(img && img.complete && img.naturalWidth);
