// TuxeWorld H5 | ui/houseview.js | Vẽ ảnh chụp một căn nhà (chỉ để xem)
//
// Dùng khi sang thăm nhà người khác: không đi lại được, chỉ nhìn toàn cảnh
// gian nhà với đúng những món chủ nhà đã kê. Vẽ bằng chính atlas và bảng ô của
// bản đồ nội thất nên nhìn y hệt lúc đứng trong đó.
import { MAPS, TILE_SIZE as TILE } from '../data/maps.js';
import { bake, atlasReady } from '../engine/mapbake.js';
import { FURN_BY_ID } from '../data/estate.js';
import { MAP_TRONG_NHA } from '../engine/estate.js';

const anh = new Map();
function tep(src) {
  if (!anh.has(src)) {
    const im = new Image();
    im.src = src;
    anh.set(src, im);
  }
  return anh.get(src);
}

export const mapCuaMau = (baseId) => MAP_TRONG_NHA[baseId] || null;

/**
 * Vẽ gian nhà vào canvas. Ảnh nào chưa tải xong thì vẽ lại khi tải xong.
 * @param {HTMLCanvasElement} canvas
 * @param {string} baseId mẫu nhà
 * @param {Array<{id:string,x:number,y:number}>} dat đồ đã kê
 */
export function veNha(canvas, baseId, dat = []) {
  const mapId = mapCuaMau(baseId);
  const map = mapId && MAPS[mapId];
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  if (!map) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const baked = bake(mapId);

  const ve = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rong = canvas.clientWidth || 320;
    const o = Math.max(6, Math.floor(rong / map.w));
    const cao = o * map.h;
    canvas.width = Math.round(rong * dpr);
    canvas.height = Math.round(cao * dpr);
    canvas.style.height = cao + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, rong, cao);

    const lech = Math.round((rong - o * map.w) / 2);
    if (atlasReady(baked.atlas)) {
      for (const lay of baked.layers) {
        for (let i = 0; i < lay.length; i++) {
          const t = lay[i];
          if (t < 0) continue;
          const sx = (t % baked.cols) * TILE, sy = Math.floor(t / baked.cols) * TILE;
          ctx.drawImage(baked.atlas, sx, sy, TILE, TILE,
            lech + (i % map.w) * o, Math.floor(i / map.w) * o, o, o);
        }
      }
    } else {
      ctx.fillStyle = 'rgba(255,255,255,.05)';
      ctx.fillRect(0, 0, rong, cao);
    }

    for (const d of dat) {
      const f = FURN_BY_ID[d.id];
      if (!f) continue;
      const im = tep(f.img);
      if (!im.complete || !im.naturalWidth) continue;
      ctx.drawImage(im, lech + d.x * o, d.y * o, o * f.w, o * f.h);
    }
  };

  ve();
  // Lần vẽ đầu chạy trước khi trình duyệt tính xong bề rộng thật của thẻ, nên
  // clientWidth còn là 0 và tỉ lệ ra sai. Vẽ lại một nhịp nữa sau khi bố cục
  // ổn định, và mỗi lần khung đổi cỡ (xoay ngang máy chẳng hạn).
  requestAnimationFrame(() => requestAnimationFrame(ve));
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(() => ve());
    ro.observe(canvas);
  }
  // Ảnh atlas / ảnh đồ tải xong lúc nào thì vẽ lại lúc đó
  const cho = [baked.atlas, ...dat.map(d => FURN_BY_ID[d.id]).filter(Boolean).map(f => tep(f.img))];
  for (const im of cho) {
    if (im && !im.complete) im.addEventListener('load', ve, { once: true });
  }
  return ve;
}
