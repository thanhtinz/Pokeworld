// PokeWorld H5 | ui/world.js | Màn bản đồ: vẽ canvas + joystick ảo + nút tương tác
import { G, save } from '../state.js';
import {
  player, currentMap, currentBake, restorePosition, update, facingThing,
} from '../engine/overworld.js';
import { TILESET, tileRect } from '../data/tiles.js';
import { owImage, owFrame, owReady, OW_W, OW_H } from '../engine/owsprite.js';
import { heal } from '../engine/pokemon.js';
import { activeAvatar } from '../engine/accounts.js';
import { esc } from '../util.js';
import { toast, choose } from './kit.js';
import { playDialog } from './dialog.js';
import { show } from '../main.js';

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

  const tileset = new Image();
  tileset.src = TILESET.src;
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
  function drawTile(idx, dx, dy, size) {
    const { sx, sy, sw, sh } = tileRect(idx);
    ctx.drawImage(tileset, sx, sy, sw, sh, dx, dy, size, size);
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
    if (!tileset.complete || !tileset.naturalWidth) return;

    const x0 = Math.max(0, Math.floor(camX / size));
    const y0 = Math.max(0, Math.floor(camY / size));
    const x1 = Math.min(baked.w, Math.ceil((camX + w) / size));
    const y1 = Math.min(baked.h, Math.ceil((camY + h) / size));

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = y * baked.w + x;
        const px = Math.round(x * size - camX), py = Math.round(y * size - camY);
        drawTile(baked.ground[i], px, py, size);
        if (baked.over[i] >= 0) drawTile(baked.over[i], px, py, size);
        if (baked.top[i] >= 0) drawTile(baked.top[i], px, py, size);
      }
    }

    // Nhân vật cao gấp đôi ô: vẽ rộng bằng 1 ô, cao 2 ô, chân đặt đúng ô đang đứng
    const chW = size, chH = size * (OW_H / OW_W);
    function drawChar(img, dir, moving, cx, cy) {
      if (!owReady(img)) return;
      const f = owFrame(dir, moving);
      ctx.drawImage(img, f.sx, f.sy, f.sw, f.sh,
        Math.round(cx - chW / 2), Math.round(cy - chH + size * 0.34), Math.round(chW), Math.round(chH));
    }

    // NPC quay mặt xuống, đứng yên
    for (const n of map.npcs || []) {
      if (n.x < x0 - 2 || n.x > x1 + 1 || n.y < y0 - 2 || n.y > y1 + 1) continue;
      drawChar(owImage(n.sprite), n.dir || 'down', false,
        (n.x + 0.5) * size - camX, (n.y + 1) * size - camY);
    }

    // Người chơi
    drawChar(avatarImg, player.dir, player.moving,
      player.x * size - camX, (player.y + 0.5) * size - camY);

    // Tên khu vực luôn khớp bản đồ đang đứng
    const chip = el.querySelector('#world-zone');
    if (chip && chip.textContent !== map.name) chip.textContent = map.name;

    // Gợi ý bấm A khi đứng trước NPC hoặc trước cửa
    const hint = el.querySelector('#btn-act');
    if (hint) hint.classList.toggle('act-ready', !!facingThing());
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
      if (thing.text) await playDialog([['sys', `${thing.name}: "${thing.text}"`]]);
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
