// TuxeWorld H5 | ui/world.js | Màn bản đồ: vẽ canvas + joystick ảo + nút tương tác
import { G, save } from '../state.js';
import { atlasReady } from '../engine/mapbake.js';
import { TILE_SIZE as TILE } from '../data/maps.js';
import {
  player, currentMap, currentBake, restorePosition, update, facingThing,
} from '../engine/overworld.js';
import { owImage, owFrame, owReady, OW_W, OW_H } from '../engine/owsprite.js';
import { heal } from '../engine/pokemon.js';
import { activeAvatar } from '../engine/accounts.js';
import { esc } from '../util.js';
import { toast, choose } from './kit.js';
import { playDialog } from './dialog.js';
import { show } from '../main.js';
import { TITLES, imgOf } from '../data/cosmetics.js';

// Ảnh danh hiệu admin tải lên — tải một lần rồi dùng lại mỗi khung hình
const titleImgs = new Map();
function titleImage(src) {
  let im = titleImgs.get(src);
  if (!im) {
    im = new Image();
    im.src = src;
    titleImgs.set(src, im);
  }
  return im.complete && im.naturalWidth ? im : null;
}

let raf = null;

export function render(el) {
  restorePosition();

  el.innerHTML = `
    <div class="world">
      <div class="world-top">
        <span class="zone-chip" id="world-zone">${esc(currentMap().name)}</span>
        <button class="btn-mini" id="btn-world-menu">Menu</button>
      </div>
      <canvas id="world-canvas"></canvas>
      <div class="joy" id="joy">
        <div class="joy-base"><div class="joy-knob" id="joy-knob"></div></div>
      </div>
      <button class="act-btn" id="btn-act">A</button>
    </div>`;

  const canvas = el.querySelector('#world-canvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const avatarImg = owImage(activeAvatar());
  function sizeCanvas() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }
  sizeCanvas();
  const onResize = () => sizeCanvas();
  window.addEventListener('resize', onResize);

  // ==== Joystick ====
  const joy = el.querySelector('#joy');
  const knob = el.querySelector('#joy-knob');
  const vec = { x: 0, y: 0 };
  let touchId = null;
  const MAX_R = 42;

  const setKnob = (dx, dy) => { knob.style.transform = `translate(${dx}px, ${dy}px)`; };
  function joyStart(e) {
    const t = e.changedTouches ? e.changedTouches[0] : e;
    touchId = e.changedTouches ? t.identifier : 'mouse';
    joyMove(e);
  }
  function joyMove(e) {
    const base = joy.getBoundingClientRect();
    const cx = base.left + base.width / 2, cy = base.top + base.height / 2;
    let t = e;
    if (e.changedTouches) {
      t = [...e.changedTouches].find(x => x.identifier === touchId);
      if (!t) return;
    }
    let dx = t.clientX - cx, dy = t.clientY - cy;
    const len = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(len, MAX_R);
    dx = dx / len * clamped; dy = dy / len * clamped;
    setKnob(dx, dy);
    vec.x = dx / MAX_R; vec.y = dy / MAX_R;
  }
  function joyEnd() { touchId = null; vec.x = 0; vec.y = 0; setKnob(0, 0); }

  joy.addEventListener('touchstart', e => { e.preventDefault(); joyStart(e); }, { passive: false });
  joy.addEventListener('touchmove', e => { e.preventDefault(); joyMove(e); }, { passive: false });
  joy.addEventListener('touchend', joyEnd);
  joy.addEventListener('touchcancel', joyEnd);
  joy.addEventListener('mousedown', e => { e.preventDefault(); joyStart(e); });
  window.addEventListener('mousemove', e => { if (touchId === 'mouse') joyMove(e); });
  window.addEventListener('mouseup', () => { if (touchId === 'mouse') joyEnd(); });

  // ==== Bàn phím (chơi trên máy tính) ====
  const keys = new Set();
  const onKeyDown = e => {
    keys.add(e.key);
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); interact(); }
  };
  const onKeyUp = e => keys.delete(e.key);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  function keyVec() {
    let x = 0, y = 0;
    if (keys.has('ArrowLeft') || keys.has('a')) x -= 1;
    if (keys.has('ArrowRight') || keys.has('d')) x += 1;
    if (keys.has('ArrowUp') || keys.has('w')) y -= 1;
    if (keys.has('ArrowDown') || keys.has('s')) y += 1;
    return { x, y };
  }

  // ==== Vẽ ====

  // Vẽ NPC + người chơi (cả ngoài trời lẫn trong nhà)
  function drawActors(map, size, camX, camY) {
    // Nhân vật cao gấp đôi ô: rộng bằng 1 ô, cao 2 ô, chân đặt đúng ô đang đứng
    const chW = size, chH = size * (OW_H / OW_W);
    const put = (img, dir, moving, cx, cy) => {
      if (!owReady(img)) return;
      const f = owFrame(dir, moving);
      ctx.drawImage(img, f.sx, f.sy, f.sw, f.sh,
        Math.round(cx - chW / 2), Math.round(cy - chH + size * 0.34), Math.round(chW), Math.round(chH));
    };
    for (const n of map.npcs || []) {
      put(owImage(n.sprite), n.dir || 'down', false,
        (n.x + 0.5) * size - camX, (n.y + 1) * size - camY);
    }
    const bob = player.moving ? Math.sin(Date.now() / 90) * 2 : 0;
    const px = player.x * size - camX;
    const py = (player.y + 0.5) * size - camY + bob;
    put(avatarImg, player.dir, player.moving, px, py);
    drawTitle(px, py - chH + size * 0.34);
  }

  // Danh hiệu đang mặc, hiện ngay trên đầu nhân vật
  function drawTitle(cx, topY) {
    const t = TITLES[G.p?.look?.title];
    if (!t) return;
    // Danh hiệu có ảnh riêng thì vẽ ảnh, cao 16px cho khớp thẻ chữ
    const src = imgOf(t);
    if (src) {
      const im = titleImage(src);
      if (!im) return;
      const h = 16;
      const w = Math.round(im.naturalWidth * h / im.naturalHeight);
      ctx.drawImage(im, Math.round(cx - w / 2), Math.round(topY - h - 2), w, h);
      return;
    }
    ctx.save();
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = Math.ceil(ctx.measureText(t.name).width) + 12;
    const h = 16;
    const x = Math.round(cx - w / 2);
    const y = Math.round(topY - h - 2);
    ctx.fillStyle = 'rgba(8, 5, 18, .78)';
    ctx.strokeStyle = t.color;
    ctx.lineWidth = 1;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill(); ctx.stroke(); }
    else { ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h); }
    ctx.fillStyle = t.color;
    ctx.fillText(t.name, x + w / 2, y + h / 2 + 0.5);
    ctx.restore();
  }

  function drawHud(map) {
    // Tên khu vực luôn khớp bản đồ đang đứng
    const chip = el.querySelector('#world-zone');
    if (chip && chip.textContent !== map.name) chip.textContent = map.name;
    // Nút A sáng lên khi đứng trước NPC, trước cửa hoặc trước quầy
    const hint = el.querySelector('#btn-act');
    if (hint) hint.classList.toggle('act-ready', !!facingThing());
  }

  function draw() {
    const map = currentMap();
    const baked = currentBake();
    const w = canvas.clientWidth, h = canvas.clientHeight;
    // Ô đủ to để nhìn rõ trên điện thoại, nhưng luôn đủ lớn để bản đồ phủ kín màn hình
    const size = Math.ceil(Math.max(Math.min(w, h) / 12, h / baked.h, w / baked.w));
    // Máy quay bám người chơi nhưng không lia ra ngoài rìa bản đồ
    const clamp = (v, lo, hi) => (hi < lo ? lo : Math.min(hi, Math.max(lo, v)));
    const camX = clamp(player.x * size - w / 2, 0, baked.w * size - w);
    const camY = clamp(player.y * size - h / 2, 0, baked.h * size - h);

    ctx.fillStyle = '#0b0716';
    ctx.fillRect(0, 0, w, h);

    if (!atlasReady(baked.atlas)) return;
    const x0 = Math.max(0, Math.floor(camX / size));
    const y0 = Math.max(0, Math.floor(camY / size));
    const x1 = Math.min(baked.w, Math.ceil((camX + w) / size));
    const y1 = Math.min(baked.h, Math.ceil((camY + h) / size));

    // Vẽ từng lớp một, lớp sau đè lên lớp trước — đúng thứ tự Tiled lưu
    const put = (t, px, py) => {
      if (t < 0) return;
      const sx = (t % baked.cols) * TILE, sy = Math.floor(t / baked.cols) * TILE;
      ctx.drawImage(baked.atlas, sx, sy, TILE, TILE, px, py, size, size);
    };
    for (const lay of baked.layers) {
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          put(lay[y * baked.w + x], Math.round(x * size - camX), Math.round(y * size - camY));
        }
      }
    }

    drawActors(map, size, camX, camY);

    // Lớp "Above Player": mái nhà, tán cây — vẽ ĐÈ lên nhân vật
    if (baked.above) {
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          put(baked.above[y * baked.w + x], Math.round(x * size - camX), Math.round(y * size - camY));
        }
      }
    }
    drawHud(map);
  }

  // ==== Vòng lặp ====
  let last = performance.now();
  let busy = false;   // đang mở hộp thoại/chuyển màn thì ngừng nhận điều khiển

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!busy) {
      const k = keyVec();
      const ev = update(dt, vec.x + k.x, vec.y + k.y);
      if (ev?.t === 'warp') {
        el.querySelector('#world-zone').textContent = currentMap().name;
        toast(`Đã tới ${ev.name}`);
      } else if (ev?.t === 'encounter') {
        busy = true;
        save();
        cleanup();
        show('battle', { kind: 'wild', enemy: ev.mon, from: 'world' });
        return;
      }
    }
    draw();
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  // ==== Tương tác ====
  async function interact() {
    if (busy) return;
    const thing = facingThing();
    if (!thing) return;
    busy = true;
    try {
      // Nói chuyện thì hiện chân dung: ảnh 2D nếu có, không thì phóng to sprite trên bản đồ
      if (thing.type === 'talk') {
        // Bảng hiệu / bảng thông báo lấy từ sự kiện thoại của bản đồ Tuxemon
        await playDialog([[{ name: thing.name }, 'Bảng ghi: "' + thing.name + '".']]);
        return;
      }
      if (thing.text) {
        const who = { name: thing.name, img: thing.face || null, ow: thing.face ? null : (thing.sprite || null) };
        await playDialog([[who, thing.text]]);
      }
      switch (thing.kind) {
        case 'heal':
          G.p.party.forEach(m => heal(m));
          save();
          toast('Cả đội đã hồi phục hoàn toàn!');
          break;
        case 'shop':
          cleanup(); show('shop'); return;
        case 'pc':
        case 'home':
          cleanup(); show('party'); return;
        case 'lab':
          cleanup(); show('dex'); return;
        case 'trainer':
        case 'gym': {
          const won = !!G.p.defeatedTrainers?.[thing.trainerId];
          const i = await choose(thing.name, [
            { label: 'Chiến đấu!', sub: won ? 'Đã thắng trước đó' : 'Chưa từng thắng' },
            { label: 'Thôi để sau' },
          ]);
          if (i === 0) { cleanup(); show('battle', { kind: 'trainer', trainerId: thing.trainerId, from: 'world' }); return; }
          break;
        }
        default:
          break;
      }
    } finally {
      busy = false;
    }
  }
  el.querySelector('#btn-act').addEventListener('click', interact);
  el.querySelector('#btn-world-menu').addEventListener('click', () => { cleanup(); show('home'); });

  function cleanup() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    window.removeEventListener('resize', onResize);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
  }

  // Dọn khi rời màn (router gọi lại render sẽ ghi đè #screen)
  el.addEventListener('screen-leave', cleanup);
}
