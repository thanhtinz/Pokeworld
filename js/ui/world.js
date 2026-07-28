// TuxeWorld H5 | ui/world.js | Màn bản đồ: vẽ canvas + joystick ảo + nút tương tác
import { G, save } from '../state.js';
import { atlasReady } from '../engine/mapbake.js';
import { TILE_SIZE as TILE } from '../data/maps.js';
import {
  player, currentMap, currentBake, restorePosition, update, facingThing, updateNpcs,
  facingWater, setHealSpot, repelLeft, pickedUp, layTinNhaTre, isInside,
  enterMap } from '../engine/overworld.js';
import { owImage, owFrame, owReady, owSheetOk, OW_W, OW_H } from '../engine/owsprite.js';
import { nhaTrenBanDo, LOTS, KHU_DAT_MAP } from '../engine/estate.js';
import { MAPS } from '../data/maps.js';
import { FURN_BY_ID } from '../data/estate.js';
import * as ES from '../engine/estate.js';
import * as TT from '../engine/furniture.js';
import * as MT from '../engine/mounts.js';

// Ảnh nhà giữ lại sau lần tải đầu, không tạo <img> mới mỗi khung hình
const anhTepCache = new Map();
function anhTep(src) {
  if (!anhTepCache.has(src)) {
    const im = new Image();
    im.src = src;
    anhTepCache.set(src, im);
  }
  return anhTepCache.get(src);
}
import { heal, displayName } from '../engine/monster.js';
import { statusName } from '../engine/status.js';
import { fish, wearRod } from '../engine/fishing.js';
import { tradeNames, tradeCandidates, tradeDone, doTrade } from '../engine/trade.js';
import { isDaytime } from '../engine/daytime.js';
import { FISHING, isRod } from '../data/fishing.js';
import { ITEMS } from '../data/items.js';
import { SHOPS } from '../data/shops.js';
import { playMusic } from '../engine/settings.js';
import { activeAvatar } from '../engine/accounts.js';
import { esc, tien, monPath } from '../util.js';
import { toast, choose } from './kit.js';
import { playDialog } from './dialog.js';
import { show, drawTopBar } from '../main.js';
import { TITLES, SKINS, imgOf } from '../data/cosmetics.js';

// Bản đồ gốc không kèm chữ trên bảng, nên mỗi loại bảng nói một câu cho hợp cảnh
const BANG_NOI = {
  'Kệ sách': 'Toàn sách về Tuxemon. Có quyển kể chuyện từ đời trước.',
  'Bảng thông báo': 'Bảng ghi vài dòng thông báo của thị trấn.',
  'Tấm áp phích': 'Áp phích quảng cáo một giải đấu Tuxemon.',
  'Cái TV': 'Trên TV đang chiếu lại một trận đấu Tuxemon.',
  'Bảng hiệu': 'Bảng hiệu đã cũ, chữ mờ gần hết.',
};

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
  // Con đang cưỡi có thể đã gục hoặc bị bỏ khỏi đội từ màn khác
  MT.kiemTraLai();
  if (isInside()) MT.xuong();

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
      <button class="btn deco-btn" id="btn-deco" hidden>Trang trí</button>
      <div class="deco-bar" id="deco-bar" hidden>
        <span id="deco-note">Kéo món đồ tới chỗ muốn đặt</span>
        <span class="deco-zoom">
          <button class="btn btn-sm" id="deco-out" aria-label="Thu nhỏ">−</button>
          <b id="deco-zn">100%</b>
          <button class="btn btn-sm" id="deco-in" aria-label="Phóng to">+</button>
        </span>
        <button class="btn btn-sm" id="deco-add">Lấy đồ trong kho</button>
        <button class="btn btn-sm btn-primary" id="deco-done">Xong</button>
      </div>
    </div>`;

  // ==== Trang trí trong nhà ====
  let deco = false;                 // đang bật chế độ trang trí
  const keo = { mon: null, x: 0, y: 0 };   // món đang kéo và ô nó đang lơ lửng trên
  let zoom = 1;                            // chỉ dùng khi đang trang trí

  // Cỡ một ô trên màn hình. Tách ra dùng chung cho cả lúc VẼ lẫn lúc quy đổi
  // toạ độ ngón tay — hai chỗ mà lệch nhau một chút là kéo đồ rơi sai ô.
  function coO() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const baked = currentBake();
    const co = Math.ceil(Math.max(Math.min(w, h) / 12, h / baked.h, w / baked.w));
    return deco ? Math.max(12, Math.round(co * zoom)) : co;
  }

  const canvas = el.querySelector('#world-canvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Skin admin tải lên mà đúng khuôn 3x4 thì dùng làm sprite đi bản đồ luôn
  const skinImg = owImage(imgOf(SKINS[G.p?.look?.skin]));
  const baseImg = owImage(activeAvatar());
  const avatarImg = () => (owSheetOk(skinImg) ? skinImg : baseImg);
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
    // Đồ rơi chưa nhặt: vẽ icon món đó ngay trên ô, nhặt rồi thì thôi
    for (const it of map.items || []) {
      if (pickedUp(player.mapId, it)) continue;
      const im = itemImg(it.id);
      if (!im?.complete || !im.naturalWidth) continue;
      const s2 = Math.round(size * 0.7);
      ctx.drawImage(im, Math.round((it.x + 0.5) * size - camX - s2 / 2),
        Math.round((it.y + 0.55) * size - camY - s2 / 2), s2, s2);
    }
    // Đồ nội thất kê trong nhà — vẽ ngay trên bản đồ, đúng ô đã đặt
    if (ES.dangTrongNha(player.mapId)) {
      for (const d of ES.nha().dat) {
        const f = FURN_BY_ID[d.id];
        if (!f) continue;
        const im = anhTep(f.img);
        if (!im?.complete || !im.naturalWidth) continue;
        const w2 = size * f.w;
        const h2 = w2 * (im.naturalHeight / im.naturalWidth);
        const dx = d === keo.mon ? keo.x : d.x, dy = d === keo.mon ? keo.y : d.y;
        ctx.save();
        if (d === keo.mon) ctx.globalAlpha = 0.75;
        ctx.drawImage(im, Math.round(dx * size - camX),
          Math.round((dy + f.h) * size - camY - h2), Math.round(w2), Math.round(h2));
        ctx.restore();
        // Đang trang trí thì viền ô cho thấy món nào kéo được
        if (deco) {
          ctx.save();
          ctx.strokeStyle = d === keo.mon ? '#f0b429' : 'rgba(255,255,255,.45)';
          ctx.lineWidth = 2;
          ctx.strokeRect(Math.round(dx * size - camX) + 1, Math.round(dy * size - camY) + 1,
            Math.round(size * f.w) - 2, Math.round(size * f.h) - 2);
          ctx.restore();
        }
      }
    }

    // Biển "BÁN" cắm ở từng lô đất chưa ai mua
    if (player.mapId === KHU_DAT_MAP) {
      for (const l of LOTS) {
        if (ES.nha().lot === l.id) continue;
        const bx = (l.x + 1) * size - camX, by = (l.y + 2) * size - camY;
        ctx.save();
        ctx.fillStyle = '#8a6a3a';
        ctx.fillRect(Math.round(bx + size * 0.42), Math.round(by - size * 0.1),
          Math.max(2, Math.round(size * 0.16)), Math.round(size * 0.55));
        ctx.fillStyle = '#f0e6d0';
        ctx.strokeStyle = '#8a6a3a';
        ctx.lineWidth = Math.max(1, size * 0.06);
        const bw = size * 0.95, bh = size * 0.5;
        ctx.fillRect(Math.round(bx), Math.round(by - size * 0.55), Math.round(bw), Math.round(bh));
        ctx.strokeRect(Math.round(bx), Math.round(by - size * 0.55), Math.round(bw), Math.round(bh));
        ctx.fillStyle = '#b03a24';
        ctx.font = `bold ${Math.round(size * 0.3)}px system-ui, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('BÁN', Math.round(bx + bw / 2), Math.round(by - size * 0.3));
        ctx.restore();
      }
      // Bác thợ mộc bán nội thất
      const tm = ES.THO_MOC;
      const im2 = owImage('nurse');
      if (owReady(im2)) put(im2, 'down', false, (tm.x + 0.5) * size - camX, (tm.y + 1) * size - camY);
    }

    // Căn nhà người chơi đã dựng trên lô đất của mình
    const nhaMinh = nhaTrenBanDo(player.mapId);
    if (nhaMinh) {
      const im = anhTep(nhaMinh.img);
      if (im?.complete && im.naturalWidth) {
        const w2 = size * 3;
        const h2 = w2 * (im.naturalHeight / im.naturalWidth);
        const px = Math.round(nhaMinh.x * size - camX);
        const py = Math.round((nhaMinh.y + 3) * size - camY - h2);
        // Đang xây thì vẽ mờ, kèm chữ cho biết còn bao lâu
        ctx.save();
        if (nhaMinh.xay) ctx.globalAlpha = 0.45;
        ctx.drawImage(im, px, py, Math.round(w2), Math.round(h2));
        ctx.restore();
        if (nhaMinh.xay) {
          ctx.save();
          ctx.fillStyle = '#f0b429';
          ctx.font = `bold ${Math.round(size * 0.34)}px system-ui, sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('ĐANG XÂY', px + w2 / 2, py + h2 / 2);
          ctx.restore();
        }
      }
    }
    for (const n of map.npcs || []) {
      const nx = (n.x + (n.ox || 0) + 0.5) * size - camX;
      const ny = (n.y + (n.oy || 0) + 1) * size - camY;
      put(owImage(n.sprite), n.dir || 'down', !!n.moving, nx, ny);
      if (n.emote > 0) drawEmote(n.bubble, nx, ny - chH + size * 0.2);
    }
    const bob = player.moving ? Math.sin(Date.now() / 90) * 2 : 0;
    const px = player.x * size - camX;
    const py = (player.y + 0.5) * size - camY + bob;
    // Đang ngồi thì lún xuống một chút, đang nằm thì xoay ngang — nhìn là biết
    // Đang lái xe / cưỡi Tuxemon thì vẽ cái đang cưỡi thay cho nhân vật
    const cuoi = MT.dangCuoi();
    if (cuoi && !ES.dangTrongNha(player.mapId)) {
      if (cuoi.t === 'xe') {
        const im = anhTep(MT.VEHICLE_BY_ID[cuoi.id].img[player.dir] || '');
        if (im?.complete && im.naturalWidth) {
          const w2 = size * (player.dir === 'up' || player.dir === 'down' ? 1.05 : 1.55);
          const h2 = w2 * (im.naturalHeight / im.naturalWidth);
          ctx.drawImage(im, Math.round(px - w2 / 2), Math.round(py - h2 * 0.72),
            Math.round(w2), Math.round(h2));
        }
        drawTitle(px, py - chH + size * 0.34);
        return;
      }
      // Cưỡi thú: con vật ở dưới, người ngồi lên trên
      const mon = (G.p.party || [])[cuoi.slot];
      const im = mon && anhTep(monPath(mon.sp));
      if (im?.complete && im.naturalWidth) {
        const s2 = size * 2.1;
        ctx.drawImage(im, Math.round(px - s2 / 2), Math.round(py + size * 0.34 - s2),
          Math.round(s2), Math.round(s2));
      }
      put(avatarImg(), player.dir, player.moving, px, py - size * 0.7);
      drawTitle(px, py - chH - size * 0.36);
      return;
    }

    const tt = TT.tuTheHienTai();
    // Nằm/ngồi thì vẽ NGAY TRÊN món đồ chứ không phải chỗ đang đứng — đứng
    // cạnh giường mà nằm thì trông như ngã ra sàn.
    const mon = TT.monDangNgoi();
    const fm = mon && FURN_BY_ID[mon.id];
    const mx = fm ? (mon.x + fm.w / 2) * size - camX : px;
    const my = fm ? (mon.y + fm.h / 2) * size - camY + chH / 2 - size * 0.34 : py;
    if (tt === 'nam') {
      ctx.save();
      ctx.translate(mx, my - chH / 2 + size * 0.34);
      ctx.rotate(Math.PI / 2);
      put(avatarImg(), 'down', false, 0, chH / 2);
      ctx.restore();
    } else if (tt === 'ngoi') {
      put(avatarImg(), player.dir, false, mx, my);
    } else {
      put(avatarImg(), player.dir, player.moving, px, py);
    }
    drawTitle(px, py - chH + size * 0.34);

    // Tắt đèn thì nhà tối đi, chừa một quầng sáng quanh nhân vật
    if (ES.dangTrongNha(player.mapId) && !TT.denDangBat()) {
      ctx.save();
      const g = ctx.createRadialGradient(px, py - size * 0.4, size * 0.4,
        px, py - size * 0.4, size * 3.2);
      g.addColorStop(0, 'rgba(8,10,26,.15)');
      g.addColorStop(1, 'rgba(8,10,26,.82)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }

  // Icon món đồ rơi trên bản đồ
  const itemCache = {};
  function itemImg(id) {
    if (!itemCache[id]) {
      const im = new Image();
      im.src = `assets/items/${id}.png`;
      itemCache[id] = im;
    }
    return itemCache[id];
  }

  // Bong bóng cảm xúc trên đầu NPC — ảnh gfx/bubbles của bản gốc
  const bubbleCache = {};
  function bubbleImg(kind) {
    if (!bubbleCache[kind]) {
      const im = new Image();
      im.src = `assets/ui/bubble/${kind}.png`;
      bubbleCache[kind] = im;
    }
    return bubbleCache[kind];
  }

  function drawEmote(kind, cx, topY) {
    const im = bubbleImg(kind || 'exclamation');
    if (!im.complete || !im.naturalWidth) return;
    const s = 20;
    ctx.drawImage(im, Math.round(cx - s / 2), Math.round(topY - s), s, s);
  }

  // Danh hiệu đang mặc, hiện ngay trên đầu nhân vật
  function drawTitle(cx, topY) {
    const id = G.p?.look?.title;
    const t = id && id !== 'none' ? TITLES[id] : null;
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
    if (hint) hint.classList.toggle('act-ready', !!facingThing() || !!canCau());
  }

  // ==== Nhà đất ====
  async function nhaDat(thing) {
    const BAC = { name: 'Bác Thợ Mộc', ow: 'nurse' };
    const BIEN = { name: 'Biển Bán Đất' };
    if (thing.kind === 'tho-moc') {
      await playDialog([[BAC, 'Bàn ghế giường tủ, thiếu gì tôi cũng có. Ghé xem đi!']]);
      cleanup(); show('estate', { tab: 'cho', from: 'world' });
      return;
    }
    if (thing.kind === 'lo-nguoi-khac') {
      await playDialog([[BIEN, 'Bạn đã có đất rồi — mỗi người một lô thôi.']]);
      return;
    }
    if (thing.kind === 'lo-ban') {
      const l = thing.lot;
      const i = await choose(l.name, [
        { label: `Mua ${tien(l.price)}`, sub: `Bạn đang có ${tien(G.p.money)}` },
        { label: 'Thôi để sau' },
      ]);
      if (i !== 0) return;
      const [ok, err] = ES.muaDat(l.id);
      if (err) { toast(err); return; }
      toast(`Đã mua ${ok.name}! Giờ chọn mẫu nhà đi.`);
      drawTopBar();
      return;
    }
    if (thing.kind === 'lo-cua-minh') {
      const ds = ES.HOUSE_BASES.map(b => ({
        label: `${b.name} — ${tien(b.price)}`,
        sub: `${ES.THOI_GIAN_XAY[b.id]} phút xây · ${b.o}×${b.o} ô kê đồ`,
        disabled: (G.p.money || 0) < b.price,
      }));
      ds.push({ label: 'Thôi để sau' });
      const i = await choose('Chọn mẫu nhà', ds);
      if (i === null || i >= ES.HOUSE_BASES.length) return;
      const [r, err] = ES.dungNha(ES.HOUSE_BASES[i].id);
      if (err) { toast(err); return; }
      await playDialog([[BAC, `Được rồi! ${r.base.name} nhé. Cho tôi ${ES.THOI_GIAN_XAY[r.base.id]} phút.`]]);
      drawTopBar();
      return;
    }
    if (thing.kind === 'dang-xay') {
      const i = await choose('Công trường', [
        { label: `Còn ${ES.conLaiChu()}`, disabled: true },
        { label: `Giục thợ làm ngay — ${tien(Math.ceil(ES.conLaiMs() / 60000) * 500)}` },
        { label: 'Để thợ làm tiếp' },
      ]);
      if (i !== 1) return;
      const [gia, err] = ES.xayNhanh();
      if (err) { toast(err); return; }
      toast(`Đã trả thêm ${tien(gia)} — nhà xong rồi!`);
      drawTopBar();
      return;
    }
    // Đồ đã kê trong nhà mình: nằm, ngồi, ăn, tắm, nấu, bật đèn
    if (thing.kind === 'do-noi-that') {
      const [ra, err] = TT.dung(thing.mon);
      if (err) { toast(err); return; }
      if (ra && ra.moMan) {                 // bếp thì mở thẳng màn Chế Tạo
        cleanup(); show(ra.moMan, { from: 'world' });
        return;
      }
      toast(ra);
      return;
    }
    if (thing.kind === 'cua-nha' || thing.kind === 'nha-minh') {
      if (thing.kind === 'nha-minh') {
        const c = ES.oCua();
        toast(`Cửa ở phía dưới căn nhà (ô ${c.x}, ${c.y}).`);
        return;
      }
      vaoNha();
      return;
    }
  }

  // Vào trong nhà: mượn bản đồ nội thất trống của bản gốc, cắm thêm một cổng
  // quay ra đúng chỗ vừa đứng.
  function vaoNha() {
    const c = ES.oCua();
    const noi = MAPS[ES.mapTrongNha()];
    if (!noi || !c) { toast('Chưa vào được.'); return; }
    noi.warps = (noi.warps || []).filter(w => !w.veNha);
    noi.warps.push({ x: Math.floor(noi.w / 2), y: noi.h - 1, veNha: true,
      to: ES.KHU_DAT_MAP, tx: c.x, ty: c.y + 1 });
    enterMap(ES.mapTrongNha(), Math.floor(noi.w / 2), noi.h - 2);
    toast('Về tới nhà rồi. Bấm nút Trang trí để kê đồ.');
  }

  function draw() {
    const map = currentMap();
    const baked = currentBake();
    const w = canvas.clientWidth, h = canvas.clientHeight;
    // Ô đủ to để nhìn rõ trên điện thoại, nhưng luôn đủ lớn để bản đồ phủ kín màn hình
    const size = coO();
    // Máy quay bám người chơi nhưng không lia ra ngoài rìa bản đồ
    // Bản đồ NHỎ HƠN khung nhìn (hay gặp khi thu nhỏ lúc trang trí) thì căn
    // giữa, không thì nó dạt lên góc trái để lộ một mảng đen to.
    const cam = (toaDo, cheo, khung) => {
      const dai = cheo * size;
      if (dai <= khung) return -(khung - dai) / 2;
      return Math.min(dai - khung, Math.max(0, toaDo * size - khung / 2));
    };
    const camX = cam(player.x, baked.w, w);
    const camY = cam(player.y, baked.h, h);

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
    // Đang trang trí thì khoá đi lại, kẻo vừa kéo đồ vừa chạy
    if (!busy && !deco) {
      const k = keyVec();
      updateNpcs(dt);
      // Đang nằm/ngồi mà nhấn hướng thì đứng dậy trước đã
      if ((vec.x + k.x || vec.y + k.y) && TT.dungDay()) toast('Bạn đứng dậy.');
      const ev = update(dt, vec.x + k.x, vec.y + k.y);
      if (ev?.t === 'warp') {
        el.querySelector('#world-zone').textContent = currentMap().name;
        playMusic(currentMap().music || 'town');
        toast(`Đã tới ${ev.name}`);
        // Vào trong nhà thì phải xuống xe — chật thế lái vào đâu được
        if (isInside() && MT.xuong()) toast('Bạn xuống xe trước khi vào trong.');
      }
      // Tin từ nhà trẻ: mỗi mốc chỉ báo một lần
      const tin = layTinNhaTre();
      if (tin === 'sansang') toast('Nhà trẻ báo: có con non chờ bạn tới đón!');
      else if (tin === 'nuaduong') toast('Nhà trẻ báo: hai con đã quen nhau lắm rồi.');
      else if (tin === 'hettien') toast('Hết tiền trả nhà trẻ — việc rèn luyện tạm dừng.');
      if (ev?.t === 'pickup') {
        const it = ITEMS[ev.id];
        toast(`Nhặt được ${it ? it.name : ev.id}${ev.n > 1 ? ` ×${ev.n}` : ''}!`);
      } else if (ev?.t === 'repelEnd') {
        toast('Bình xịt đã hết tác dụng.');
      } else if (ev?.t === 'stepHurt') {
        // Bỏng / trúng độc bào máu theo bước chân — báo một lần khi kiệt tới đáy
        for (const m of ev.mons) toast(`${displayName(m)} kiệt sức vì ${statusName(m.status)}!`);
      } else if (ev?.t === 'encounter') {
        busy = true;
        save();
        cleanup();
        show('battle', { kind: 'wild', enemy: ev.mon, from: 'world' });
        return;
      }
    }
    capNhatNutDeco();
    draw();
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  // ==== Nút Trang trí + kéo thả đồ ====
  const btnDeco = el.querySelector('#btn-deco');
  const barDeco = el.querySelector('#deco-bar');

  function capNhatNutDeco() {
    const trongNha = ES.dangTrongNha(player.mapId);
    btnDeco.hidden = !trongNha || deco;
    barDeco.hidden = !deco;
    el.querySelector('#joy').hidden = deco;
    el.querySelector('#btn-act').hidden = deco;
  }

  const ZOOM_MIN = 0.5, ZOOM_MAX = 3;
  function datZoom(z) {
    zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
    const n = el.querySelector('#deco-zn');
    if (n) n.textContent = Math.round(zoom * 100) + '%';
  }
  el.querySelector('#deco-in').addEventListener('click', () => datZoom(zoom * 1.25));
  el.querySelector('#deco-out').addEventListener('click', () => datZoom(zoom / 1.25));

  // Chụm hai ngón để phóng to / thu nhỏ
  const ngon = new Map();
  let khoangCu = 0;
  function khoangHaiNgon() {
    const [a, b2] = [...ngon.values()];
    return Math.hypot(a.x - b2.x, a.y - b2.y);
  }

  btnDeco.addEventListener('click', () => { deco = true; datZoom(1); capNhatNutDeco(); });
  el.querySelector('#deco-done').addEventListener('click', () => {
    deco = false; keo.mon = null; capNhatNutDeco();
  });
  el.querySelector('#deco-add').addEventListener('click', async () => {
    const e = ES.nha();
    const ds = Object.entries(e.kho).filter(([, n]) => n > 0);
    if (!ds.length) {
      toast('Kho trống — mua đồ ở chỗ bác thợ mộc đã.');
      return;
    }
    const i = await choose('Lấy món nào ra kê?', ds.map(([id, n]) => ({
      label: FURN_BY_ID[id]?.name || id, sub: `còn ${n} cái`,
    })));
    if (i === null) return;
    const id = ds[i][0];
    // Đặt tạm vào ô trống đầu tiên tìm được, rồi người chơi kéo đi đâu tuỳ ý
    const noi = currentMap();
    for (let y = 1; y < noi.h - 1; y++) {
      for (let x = 1; x < noi.w - 1; x++) {
        if (ES.keDuocTrongNha(id, x, y, noi)) {
          const [, err] = ES.keTaiO(id, x, y);
          if (err) { toast(err); return; }
          toast(`Đặt ${FURN_BY_ID[id]?.name} xuống rồi — kéo tới chỗ bạn muốn.`);
          return;
        }
      }
    }
    toast('Không còn chỗ trống để kê.');
  });

  // Kéo bằng ngón tay: chạm trúng món nào thì nhấc món đó lên, thả xuống ô mới
  const oTuMan = (ev) => {
    const r = canvas.getBoundingClientRect();
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const baked = currentBake();
    const size = coO();
    const cam = (toaDo, cheo, khung) => {
      const dai = cheo * size;
      if (dai <= khung) return -(khung - dai) / 2;
      return Math.min(dai - khung, Math.max(0, toaDo * size - khung / 2));
    };
    const camX = cam(player.x, baked.w, w);
    const camY = cam(player.y, baked.h, h);
    return {
      x: Math.floor((ev.clientX - r.left + camX) / size),
      y: Math.floor((ev.clientY - r.top + camY) / size),
    };
  };

  canvas.addEventListener('pointerdown', (ev) => {
    if (!deco) return;
    ngon.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (ngon.size === 2) { khoangCu = khoangHaiNgon(); keo.mon = null; return; }
    const { x, y } = oTuMan(ev);
    const d = ES.monTaiO(x, y);
    if (!d) return;
    keo.mon = d; keo.x = d.x; keo.y = d.y;
    canvas.setPointerCapture(ev.pointerId);
    ev.preventDefault();
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!deco) return;
    if (ngon.has(ev.pointerId)) ngon.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    // Hai ngón: chụm vào / xoè ra để zoom, không kéo đồ
    if (ngon.size === 2) {
      const d = khoangHaiNgon();
      if (khoangCu > 0) datZoom(zoom * (d / khoangCu));
      khoangCu = d;
      ev.preventDefault();
      return;
    }
    if (!keo.mon) return;
    const { x, y } = oTuMan(ev);
    keo.x = x; keo.y = y;
    ev.preventDefault();
  });
  const thaTay = (ev) => {
    if (ev && ngon.has(ev.pointerId)) ngon.delete(ev.pointerId);
    if (ngon.size < 2) khoangCu = 0;
    if (!keo.mon) return;
    const [, err] = ES.chuyenDo(keo.mon, keo.x, keo.y, currentMap());
    if (err) toast(err);
    keo.mon = null;
  };
  canvas.addEventListener('pointerup', thaTay);
  canvas.addEventListener('pointercancel', thaTay);

  // ==== Tương tác ====
  // Cần câu xịn nhất đang có trong túi, nếu đang đứng quay mặt ra mặt nước.
  // Bản gốc bắt đúng điều kiện này (db/item: facing_tile surfable).
  function canCau() {
    if (!facingWater()) return null;
    const co = Object.keys(G.p.bag).filter(id => G.p.bag[id] > 0 && isRod(id));
    if (!co.length) return null;
    // cần nào tỉ lệ cắn cao nhất thì dùng cần đó
    return co.sort((a, b) => FISHING[b].trigger - FISHING[a].trigger)[0];
  }

  // Thả câu. Mỗi lần thả cần mòn một điểm, hết là gãy.
  async function thaCau(rod) {
    busy = true;
    try {
      await playDialog([[{ name: 'Bạn' }, `Quăng ${ITEMS[rod]?.name || 'cần câu'} xuống nước...`]]);
      const r = fish(rod);
      const mon = wearRod(rod);
      if (mon.broke) toast(`${ITEMS[rod]?.name || 'Cần câu'} gãy mất rồi!`);
      else if (mon.left <= 3) toast(`Cần sắp gãy — còn ${mon.left} lần thả.`);
      if (!r.ok) { toast('Chờ mãi mà chẳng con nào cắn...'); return; }
      save();
      cleanup();
      show('battle', { kind: 'wild', enemy: r.mon, from: 'world',
        arena: isDaytime() ? r.env : r.envNight });
      return;
    } finally {
      busy = false;
    }
  }

  // NPC đổi Tuxemon (bản gốc rải sẵn trong bản đồ bằng lệnh "trading")
  async function moiDoi(npc, who) {
    const t = npc.trade;
    const ten = tradeNames(t);
    const mapId = player.mapId;
    if (tradeDone(mapId, npc.name, t)) {
      await playDialog([[who, `Cảm ơn cậu vụ đổi hôm trước nhé! ${ten.get} hợp với tôi lắm.`]]);
      return;
    }
    await playDialog([
      [who, `Tôi mê ${ten.give} lắm mà mãi chưa có con nào.`],
      [who, `Cậu đổi cho tôi một con ${ten.give} không? Tôi đưa lại ${ten.get} của tôi.`],
    ]);
    const co = tradeCandidates(t);
    if (!co.length) {
      await playDialog([[who, `Cậu chưa có ${ten.give} à... Bao giờ có thì quay lại nhé.`]]);
      return;
    }
    const opts = co.map(x => ({ label: `${displayName(x.m)} Lv.${x.m.lv}`,
      sub: `Đổi lấy ${ten.get} cùng cấp` }));
    opts.push({ label: 'Thôi, để sau' });
    const idx = await choose(`Đưa con nào cho ${npc.name}?`, opts);
    if (idx === null || idx >= co.length) return;
    const r = doTrade(mapId, npc.name, t, co[idx].i);
    if (!r.ok) { toast('Đổi không thành.'); return; }
    await playDialog([
      [who, `Tuyệt! ${displayName(r.given)} về tay tôi rồi.`],
      [who, `Cầm lấy ${ten.get} nhé — chăm nó cho tốt!`],
    ]);
    toast(`Đã đổi ${displayName(r.given)} lấy ${displayName(r.got)}!`);
    save();
  }

  async function interact() {
    if (busy) return;
    const rod = canCau();
    if (rod && !facingThing()) { await thaCau(rod); return; }
    const thing = facingThing();
    if (!thing) return;
    busy = true;
    try {
      // Nói chuyện thì hiện chân dung: ảnh 2D nếu có, không thì phóng to sprite trên bản đồ
      if (thing.type === 'talk') {
        // Bảng hiệu: chữ thật ghi trong bản đồ gốc (thing.text) mới là nội dung;
        // bảng nào bản gốc không ghi gì thì nói câu chung theo loại bảng.
        await playDialog([[{ name: thing.name },
          thing.text || BANG_NOI[thing.name] || 'Không đọc được gì rõ ràng.']]);
        return;
      }
      // Nhà đất: biển bán, lô của mình, công trường, cửa nhà, bác thợ mộc
      if (thing.type === 'estate') { await nhaDat(thing); return; }
      // NPC bản đồ mang sẵn vài câu thoại (js/data/maps.js), NPC cũ dùng .text
      const who = { name: thing.name, img: thing.face || null,
        ow: thing.face ? null : (thing.sprite || null) };
      // NPC đổi Tuxemon: chào hỏi bằng chính lời mời đổi chứ không nói câu chung
      if (thing.trade) { await moiDoi(thing, who); return; }
      // Chủ tiệm: mở đúng gian hàng của thị trấn đó (db/economy bên bản gốc)
      if (thing.shop && SHOPS[thing.shop]) {
        await playDialog([[who, `Chào cậu! Ghé ${SHOPS[thing.shop].name} xem có gì hợp không.`]]);
        cleanup();
        show('shop', { shop: thing.shop, from: 'world' });
        return;
      }
      const say = thing.lines?.length ? thing.lines : (thing.text ? [thing.text] : []);
      if (say.length) {
        await playDialog(say.map(t => [who, t]));
      }
      switch (thing.kind) {
        case 'heal':
          G.p.party.forEach(m => heal(m));
          // Nghỉ ở đâu thì đó thành chỗ tỉnh dậy khi cả đội gục, và là đích
          // của Chìa Khoá Thoát Hiểm (bản gốc: teleport_faint)
          setHealSpot(player.mapId, player.x, player.y);
          save();
          toast('Cả đội đã hồi phục hoàn toàn! Đây là chỗ nghỉ của bạn.');
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
