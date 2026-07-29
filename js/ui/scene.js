// TuxeWorld H5 | ui/scene.js | Ô cửa sổ nhìn ra thế giới, dùng ở màn chính
//
// Màn chính trước đây chỉ toàn thẻ chữ, nhìn như một trang thiết lập chứ không
// giống game. Cái này vẽ ĐÚNG chỗ nhân vật đang đứng bằng chính bản đồ và
// sprite của màn đi bộ, nên vừa mở game lên là thấy ngay thế giới của mình.
//
// Đây chỉ là ẢNH XEM TRƯỚC: không điều khiển được, không đụng tới G.p. Mọi thứ
// nặng (bake bản đồ, ảnh atlas) đều dùng lại đồ đã nạp của màn bản đồ.
import { G } from '../state.js';
import { MAPS, TILE_SIZE as TILE } from '../data/maps.js';
import { bake, atlasReady } from '../engine/mapbake.js';
import { owImage, owFrame, owReady, owSheetOk, OW_W, OW_H } from '../engine/owsprite.js';
import { activeAvatar } from '../engine/accounts.js';
import * as AV from '../engine/avatar.js';
import { SKINS, imgOf } from '../data/cosmetics.js';
import { isDaytime } from '../engine/daytime.js';

const O_NGANG = 11;        // bề ngang khung nhìn, tính bằng ô

// Chỗ đang đứng theo bản lưu; chưa có thì lấy bản đồ mở đầu
function choDung() {
  const pos = G.p?.pos;
  if (pos && MAPS[pos.map]) return { map: pos.map, x: pos.x, y: pos.y };
  const id = G.p?.zone && MAPS[G.p.zone] ? G.p.zone : Object.keys(MAPS)[0];
  const m = MAPS[id];
  return { map: id, x: (m?.w || 10) / 2, y: (m?.h || 10) / 2 };
}

/**
 * Gắn cảnh vào một <canvas> có sẵn. Trả hàm dọn — màn nào gọi thì màn đó phải
 * gọi lại lúc rời đi, không thì vòng vẽ chạy mãi dưới nền.
 * @param {HTMLCanvasElement} canvas
 */
export function veCanh(canvas) {
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const cho = choDung();
  const baked = bake(cho.map);
  const skin = owImage(imgOf(SKINS[G.p?.look?.skin]));
  const goc = owImage(activeAvatar());
  const nguoi = () => {
    if (owSheetOk(skin)) return skin;
    const a = AV.anhNhanVat();
    return owReady(a) ? a : goc;
  };
  let raf = null;
  let song = true;

  function co() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    return r;
  }

  function ve() {
    if (!song) return;
    const r = co();
    const w = r.width, h = r.height;
    ctx.fillStyle = '#0b0716';
    ctx.fillRect(0, 0, w, h);
    if (!baked || !atlasReady(baked.atlas)) { raf = requestAnimationFrame(ve); return; }

    // Cỡ ô phải LÀ SỐ NGUYÊN: để lẻ thì mỗi ô lệch nửa điểm ảnh, cả khung nhìn
    // kẻ ô như giấy kẻ ca-rô.
    const size = Math.max(8, Math.ceil(w / O_NGANG));
    // Máy quay bám nhân vật nhưng không lia ra ngoài rìa bản đồ
    const cam = (toaDo, cheo, khung) => {
      const dai = cheo * size;
      if (dai <= khung) return -(khung - dai) / 2;
      return Math.min(dai - khung, Math.max(0, toaDo * size - khung / 2));
    };
    const camX = cam(cho.x, baked.w, w);
    const camY = cam(cho.y, baked.h, h);
    const x0 = Math.max(0, Math.floor(camX / size));
    const y0 = Math.max(0, Math.floor(camY / size));
    const x1 = Math.min(baked.w, Math.ceil((camX + w) / size));
    const y1 = Math.min(baked.h, Math.ceil((camY + h) / size));

    const dat = (t, px, py) => {
      if (t < 0) return;
      const sx = (t % baked.cols) * TILE, sy = Math.floor(t / baked.cols) * TILE;
      ctx.drawImage(baked.atlas, sx, sy, TILE, TILE, px, py, size, size);
    };
    for (const lay of baked.layers) {
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          dat(lay[y * baked.w + x], Math.round(x * size - camX), Math.round(y * size - camY));
        }
      }
    }

    // Nhân vật đứng thở tại chỗ: đổi khung chân thật chậm cho có sức sống
    const im = nguoi();
    if (owReady(im)) {
      const chH = size * (OW_H / OW_W);
      const f = owFrame('down', true, Date.now() * 0.28, im);
      // Bề ngang theo tỉ lệ ô của chính sprite, không ép cứng bằng một ô —
      // giống hệt màn bản đồ, không thì nhân vật ở đây béo hơn ngoài kia.
      const chW = chH * (f.sw / f.sh);
      const px = (cho.x + 0.5) * size - camX, py = (cho.y + 1) * size - camY;
      // Bóng đổ dưới chân cho nhân vật dính xuống nền
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(px, py - size * 0.12, size * 0.34, size * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.drawImage(im, f.sx, f.sy, f.sw, f.sh,
        Math.round(px - chW / 2), Math.round(py - chH + size * 0.34),
        Math.round(chW), Math.round(chH));
    }

    if (baked.above) {
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          dat(baked.above[y * baked.w + x], Math.round(x * size - camX), Math.round(y * size - camY));
        }
      }
    }

    // Ban đêm thì phủ một lớp xanh mực cho khớp với giờ thật
    if (!isDaytime()) {
      ctx.fillStyle = 'rgba(18,16,64,.26)';
      ctx.fillRect(0, 0, w, h);
    }
    raf = requestAnimationFrame(ve);
  }

  ve();
  return () => {
    song = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  };
}
