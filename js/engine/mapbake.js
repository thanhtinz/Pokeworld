// TuxeWorld H5 | engine/mapbake.js | Chuẩn bị bản đồ để vẽ
//
// Bản đồ nay do tools/mktmx.py sinh từ tệp Tiled của Tuxemon: mỗi bản đồ có
// sẵn các lớp ô đã trỏ vào ATLAS riêng của nó, nên ở đây không phải ghép viền
// hay dựng gì thêm — chỉ nạp ảnh atlas và nhớ lại cho lần sau.
import { MAPS } from '../data/maps.js';

const cache = new Map();
const images = new Map();

export function atlasImage(src) {
  let img = images.get(src);
  if (!img) {
    img = new Image();
    img.src = src;
    images.set(src, img);
  }
  return img;
}

export const atlasReady = (img) => !!(img && img.complete && img.naturalWidth);

// Trả về mọi thứ màn hình bản đồ cần, tính một lần rồi nhớ luôn
export function bake(mapId) {
  if (cache.has(mapId)) return cache.get(mapId);
  const map = MAPS[mapId];
  if (!map) return null;
  const baked = {
    id: mapId,
    map,
    w: map.w,
    h: map.h,
    cols: map.cols,
    layers: map.layers || [],
    above: map.above || null,
    solid: map.solid || [],
    atlas: atlasImage(map.atlas),
  };
  cache.set(mapId, baked);
  return baked;
}

export const isSolidAt = (baked, x, y) =>
  (!baked || x < 0 || y < 0 || x >= baked.w || y >= baked.h)
    ? true
    : !!baked.solid[y * baked.w + x];

// Bản đồ Tuxemon không đánh dấu ô cỏ cao riêng, nên quy ước: đi trên ô KHÔNG
// chắn đường của khu vực có bảng gặp thì đều có thể gặp sinh vật hoang.
export const isEncAt = (baked, x, y) => !isSolidAt(baked, x, y);

export const warpAt = (baked, x, y) =>
  (baked?.map.warps || []).find(w => w.x === x && w.y === y) || null;

export const talkAt = (baked, x, y) =>
  (baked?.map.talks || []).find(t => t.x === x && t.y === y) || null;
