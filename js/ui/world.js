// PokeWorld H5 | ui/world.js | Màn bản đồ: vẽ canvas + joystick ảo + nút tương tác
import { G, save } from '../state.js';
import {
  player, currentMap, enterMap, restorePosition, update, facingNpc, TILE_SIZE,
} from '../engine/overworld.js';
import { TILE_LEGEND, tileAt, mapWidth, mapHeight } from '../data/maps.js';
import { heal } from '../engine/pokemon.js';
import { activeAvatar } from '../engine/accounts.js';
import { esc } from '../util.js';
import { toast, choose } from './kit.js';
import { playDialog } from './dialog.js';
import { show, refresh } from '../main.js';

const TILESET_SRC = 'assets/tiles/tileset.png';
const TILES_PER_ROW = 4;   // bộ tile 4x4 ô

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
  tileset.src = TILESET_SRC;
  const avatarImg = new Image();
  avatarImg.src = `assets/trainers/${activeAvatar()}.png`;
  const npcCache = {};

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

  function setKnob(dx, dy) {
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
  }
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
    const sx = (idx % TILES_PER_ROW) * TILE_SIZE;
    const sy = Math.floor(idx / TILES_PER_ROW) * TILE_SIZE;
    ctx.drawImage(tileset, sx, sy, TILE_SIZE, TILE_SIZE, dx, dy, size, size);
  }

  function draw() {
    const map = currentMap();
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const size = Math.max(34, Math.round(Math.min(w, h) / 11));   // ô to vừa mắt trên điện thoại
    const camX = player.x * size - w / 2;
    const camY = player.y * size - h / 2;

    ctx.fillStyle = '#0b0716';
    ctx.fillRect(0, 0, w, h);

    const x0 = Math.max(0, Math.floor(camX / size));
    const y0 = Math.max(0, Math.floor(camY / size));
    const x1 = Math.min(mapWidth(map), Math.ceil((camX + w) / size));
    const y1 = Math.min(mapHeight(map), Math.ceil((camY + h) / size));

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const tl = tileAt(map, x, y);
        drawTile(tl.t, Math.round(x * size - camX), Math.round(y * size - camY), size);
      }
    }

    // NPC
    for (const n of map.npcs || []) {
      if (n.x < x0 - 1 || n.x > x1 || n.y < y0 - 1 || n.y > y1) continue;
      let img = npcCache[n.sprite];
      if (!img) { img = new Image(); img.src = `assets/trainers/${n.sprite}.png`; npcCache[n.sprite] = img; }
      if (img.complete && img.naturalWidth) {
        const s = size * 0.95;
        ctx.drawImage(img, Math.round(n.x * size - camX + (size - s) / 2), Math.round(n.y * size - camY - s * 0.28), s, s);
      }
    }

    // Người chơi (nhún nhẹ khi đi cho có cảm giác bước chân)
    const bob = player.moving ? Math.sin(Date.now() / 90) * 2 : 0;
    if (avatarImg.complete && avatarImg.naturalWidth) {
      const s = size * 1.05;
      ctx.drawImage(
        avatarImg,
        Math.round(player.x * size - camX - s / 2 + size / 2),
        Math.round(player.y * size - camY - s * 0.55 + size / 2 + bob),
        s, s,
      );
    }

    // Gợi ý bấm A khi đứng trước NPC
    const npc = facingNpc();
    const hint = el.querySelector('#btn-act');
    if (hint) hint.classList.toggle('act-ready', !!npc);
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

  // ==== Tương tác với NPC ====
  async function interact() {
    if (busy) return;
    const npc = facingNpc();
    if (!npc) return;
    busy = true;
    try {
      if (npc.text) await playDialog([['sys', `${npc.name}: "${npc.text}"`]]);
      if (npc.kind === 'heal') {
        G.p.party.forEach(m => heal(m));
        save();
        toast('Cả đội đã hồi phục hoàn toàn!');
      } else if (npc.kind === 'shop') {
        cleanup(); show('shop'); return;
      } else if (npc.kind === 'pc') {
        cleanup(); show('party'); return;
      } else if (npc.kind === 'trainer' || npc.kind === 'gym') {
        const won = !!G.p.defeatedTrainers?.[npc.trainerId];
        const i = await choose(npc.name, [
          { label: 'Chiến đấu!', sub: won ? 'Đã thắng trước đó' : 'Chưa từng thắng' },
        ]);
        if (i === 0) { cleanup(); show('battle', { kind: 'trainer', trainerId: npc.trainerId, from: 'world' }); return; }
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
