// TuxeWorld H5 | ui/world.js | Màn bản đồ: vẽ canvas + joystick ảo + nút tương tác
import { G, save } from '../state.js';
import * as CAU from '../engine/cauca.js';
import { ANH_BONG, BONG_KHUNG, BONG_NHIP, ANH_QUAN } from '../data/ca.js';
import { QUAN_CA } from '../data/nongtraimap.js';
import { atlasReady } from '../engine/mapbake.js';
import { TILE_SIZE as TILE } from '../data/maps.js';
import {
  player, currentMap, currentBake, restorePosition, update, facingThing, updateNpcs,
  facingWater, facingTile, setHealSpot, repelLeft, pickedUp, layTinNhaTre, layTinNguDay,
  isInside, enterMap } from '../engine/overworld.js';
import { owImage, owFrame, owReady, owSheetOk, OW_W, OW_H } from '../engine/owsprite.js';
import { nhaTrenBanDo, LOTS, KHU_DAT_MAP } from '../engine/estate.js';
import { MAPS } from '../data/maps.js';
import { FURN_BY_ID, TOA_BANG } from '../data/estate.js';
import * as ES from '../engine/estate.js';
import * as TT from '../engine/furniture.js';
import * as MT from '../engine/mounts.js';
import * as BD from '../engine/bangduong.js';
import * as INN from '../engine/inn.js';
import * as VS from '../engine/visit.js';
import * as api from '../net/api.js';
import { isOnlineMode, getToken } from '../net/config.js';

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
import * as AV from '../engine/avatar.js';
import * as NT from '../engine/nongtrai.js';
import { anhCay, anhThu as anhConThu, anhNha as anhNhaNT, anhMay, anhDat,
  NHIP_MAY } from '../data/nongtrai.js';
import { esc, tien, tienChu } from '../util.js';
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
  // Vừa mở game lên: nằm sẵn trên giường cho tới khi người chơi nhấn hướng
  moGameNguDay();
  // Con đang cưỡi có thể đã gục hoặc bị bỏ khỏi đội từ màn khác
  MT.kiemTraLai();
  if (isInside()) MT.xuong();
  // Cấp bang quyết định hai cửa trong Bang Đường mở hay khoá — hỏi máy chủ
  // một lần khi vào màn bản đồ.
  if (isOnlineMode() && getToken()) {
    api.myGuild().then(r => BD.datCapBang(r.ok ? (r.data?.guild?.level || 0) : 0))
      .catch(() => {});
    // Ai đang online mà chưa có nhà thì cùng nằm nhà trọ — lấy danh sách để vẽ
    if (INN.laNhaTro(player.mapId)) {
      api.fetchInn().then(r => INN.datKhachTro(r.ok ? (r.data?.ds || []) : []))
        .catch(() => {});
    }
  }

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
  // Sprite người chơi ghép từ các lớp ngoại hình + quần áo (engine/avatar.js).
  // Skin do quản trị viên tải lên vẫn được ưu tiên nếu có, và sprite cũ đứng
  // đỡ trong lúc mấy lớp còn đang tải.
  const avatarImg = () => {
    if (owSheetOk(skinImg)) return skinImg;
    const a = AV.anhNhanVat();
    return owReady(a) ? a : baseImg;
  };
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

  // Trong nhà thì cửa ra chỉ là một ô sàn trông y hệt mấy ô bên cạnh — vào nhà
  // ai xong đứng loay hoay không biết lối nào ra. Soi sáng mọi ô cổng của bản
  // đồ trong nhà: quầng sáng nhấp nháy + mũi tên chỉ xuống + chữ "Lối ra".
  //
  // Chỉ làm trong nhà. Ngoài trời cổng nhiều (mỗi cửa nhà một cái), soi hết
  // thì cả thị trấn nhấp nháy như cây thông Nô-en.
  function veLoiRa(map, size, camX, camY) {
    if (!isInside()) return;
    const ds = map.warps || [];
    if (!ds.length) return;
    // Nhịp thở 1,6 giây — đủ chậm để không chói mắt
    const nhip = 0.5 + 0.5 * Math.sin(Date.now() / 1600 * Math.PI * 2);
    for (const w of ds) {
      const px = w.x * size - camX, py = w.y * size - camY;
      if (px < -size || py < -size || px > canvas.clientWidth || py > canvas.clientHeight) continue;
      ctx.save();
      ctx.fillStyle = `rgba(240,180,41,${0.16 + 0.2 * nhip})`;
      ctx.fillRect(Math.round(px), Math.round(py), Math.round(size), Math.round(size));
      ctx.strokeStyle = `rgba(255,224,130,${0.55 + 0.35 * nhip})`;
      ctx.lineWidth = Math.max(1, size * 0.09);
      ctx.strokeRect(Math.round(px) + 1, Math.round(py) + 1,
        Math.round(size) - 2, Math.round(size) - 2);
      // Mũi tên chỉ vào ô cửa, nhún lên xuống theo nhịp
      const mx = px + size / 2, my = py - size * (0.22 + 0.16 * nhip);
      ctx.fillStyle = `rgba(255,224,130,${0.7 + 0.3 * nhip})`;
      ctx.beginPath();
      ctx.moveTo(mx, my + size * 0.3);
      ctx.lineTo(mx - size * 0.24, my - size * 0.05);
      ctx.lineTo(mx + size * 0.24, my - size * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // Chữ chỉ ghi cho cái cổng GẦN NHẤT, không thì phòng nhiều cửa chữ chồng chữ
    let gan = null, xa = Infinity;
    for (const w of ds) {
      const d = (w.x - player.x) ** 2 + (w.y - player.y) ** 2;
      if (d < xa) { xa = d; gan = w; }
    }
    if (!gan) return;
    const W = canvas.clientWidth, H = canvas.clientHeight;
    const cx = gan.x * size - camX + size / 2;
    const cy = gan.y * size - camY + size / 2;
    const trongKhung = cx > 0 && cx < W && cy > 0 && cy < H;
    ctx.save();
    ctx.font = `${Math.round(size * 0.3)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (trongKhung) {
      ctx.lineWidth = Math.max(2, size * 0.1);
      ctx.strokeStyle = 'rgba(10,6,22,.85)';
      ctx.fillStyle = '#ffe082';
      const tx = Math.max(size * 1.1, Math.min(W - size * 1.1, cx));
      const ty = Math.max(size * 0.5, cy - size * 1.1);
      ctx.strokeText('Lối ra', tx, ty);
      ctx.fillText('Lối ra', tx, ty);
    } else {
      // Cửa nằm ngoài khung nhìn (phòng rộng): dán một cái biển ở mép màn hình
      // theo đúng hướng của nó. Kẹp trong vùng an toàn để không đè lên cần
      // điều khiển với nút A ở hai góc dưới.
      const bx = Math.max(W * 0.16, Math.min(W * 0.84, cx));
      const by = Math.max(H * 0.14, Math.min(H * 0.62, cy));
      const chu = 'Lối ra';
      const rong = ctx.measureText(chu).width + size * 1.15;
      const cao = size * 0.62;
      ctx.fillStyle = 'rgba(10,6,22,.82)';
      ctx.strokeStyle = 'rgba(255,224,130,.75)';
      ctx.lineWidth = Math.max(1, size * 0.05);
      ctx.beginPath();
      ctx.roundRect(bx - rong / 2, by - cao / 2, rong, cao, cao / 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffe082';
      ctx.fillText(chu, bx - size * 0.24, by);
      // Mũi tên nhỏ chỉ về phía cửa
      const goc = Math.atan2(cy - by, cx - bx);
      ctx.translate(bx + rong / 2 - size * 0.34, by);
      ctx.rotate(goc);
      ctx.beginPath();
      ctx.moveTo(size * 0.24, 0);
      ctx.lineTo(-size * 0.12, -size * 0.17);
      ctx.lineTo(-size * 0.12, size * 0.17);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // ==== Vẽ nông trại ====
  // Ruộng, cây theo giai đoạn, công trình, con vật — tất cả là VẬT THỂ vẽ đè
  // lên nền, không nướng vào bản đồ: người chơi kê lại lúc nào cũng được.
  const ntCache = {};
  function ntAnh(src) {
    if (!ntCache[src]) {
      const im = new Image();
      im.src = src;
      ntCache[src] = im;
    }
    return ntCache[src];
  }

  function veNongTrai(size, camX, camY) {
    const gio = Date.now();
    // Quán cá bên bờ ao: ảnh rời chứ không nằm trong tileset, phần chắn đường
    // thì bản đồ đã đánh dấu sẵn (tools/nongtrai.py).
    {
      const im = ntAnh(ANH_QUAN);
      if (owReady(im)) {
        ctx.drawImage(im, Math.round(QUAN_CA.x * size - camX),
          Math.round(QUAN_CA.y * size - camY),
          Math.round(QUAN_CA.w * size), Math.round(QUAN_CA.h * size));
      }
    }
    const ve1 = (src, x, y, w = 1, h = 1) => {
      const im = ntAnh(src);
      if (!owReady(im)) return;
      ctx.drawImage(im, Math.round(x * size - camX), Math.round(y * size - camY),
        Math.round(w * size), Math.round(h * size));
    };
    for (const o of NT.nt().o) {
      const v = NT.VAT_BY_ID[o.id];
      if (!v) continue;
      if (v.loai === 'ruong') {
        ve1(anhDat(NT.dangUot(o, gio)), o.x, o.y);
        if (o.cay) {
          ve1(anhCay(o.cay, NT.giaiDoan(o, gio), NT.dangUot(o, gio)), o.x, o.y);
          // Chín rồi thì nhấp nháy một chấm vàng cho dễ thấy từ xa
          if (NT.daChin(o, gio)) veCham(o.x + 0.5, o.y - 0.15, size, camX, camY, '#ffd43b');
          else if (!NT.dangUot(o, gio)) veCham(o.x + 0.5, o.y - 0.15, size, camX, camY, '#4dabf7');
        }
      } else if (v.loai === 'may') {
        // Máy chỉ chiếm MỘT ô nhưng ảnh cao hai ô — vẽ vươn lên trên ô nó đứng.
        // Máy đang chạy thì chạy hết dải khung, máy rảnh thì đứng khung đầu.
        const im = ntAnh(anhMay(o.id));
        const d = NT.MAY_BY_ID[o.id];
        if (owReady(im) && d) {
          const k = NT.mayDangChay(o, gio)
            ? Math.floor(gio / NHIP_MAY) % d.khung : 0;
          const sw = im.naturalWidth / d.khung;
          const cao = size * (d.oh / d.ow);
          ctx.drawImage(im, k * sw, 0, sw, im.naturalHeight,
            Math.round(o.x * size - camX), Math.round((o.y + 1) * size - camY - cao),
            Math.round(size), Math.round(cao));
        }
        if (NT.mayXong(o, gio)) veCham(o.x + 0.5, o.y - 1.15, size, camX, camY, '#ffd43b');
      } else {
        // Công trình vẽ cao hơn ô nó chiếm: ảnh gốc là mặt tiền nhìn nghiêng,
        // vẽ đúng bằng số ô thì lùn tịt.
        ve1(anhNhaNT(o.id), o.x, o.y, v.w, v.h);
      }
    }
    for (const con of NT.nt().thu) {
      const t = NT.THU_BY_ID[con.id];
      if (!t) continue;
      const im = ntAnh(anhConThu(con.id));
      if (!owReady(im)) continue;
      const f = owFrame(con.dir || 'down', false, gio, im);
      // Con vật vẽ đúng cỡ pixel gốc của nó so với ô 16px: con gà một ô, con bò
      // to hơn hẳn. Ép hết về một ô thì con nào cũng bằng con nào.
      const w = size * (t.o / 16);
      ctx.drawImage(im, f.sx, f.sy, f.sw, f.sh,
        Math.round((con.x + 0.5) * size - camX - w / 2),
        Math.round((con.y + 1) * size - camY - w),
        Math.round(w), Math.round(w));
      if (NT.sanSang(con, gio)) veCham(con.x + 0.5, con.y - 0.1, size, camX, camY, '#ffd43b');
      else if (!NT.dangDoi(con, gio)) veCham(con.x + 0.5, con.y - 0.1, size, camX, camY, '#ff8787');
    }
    // Đang cầm món chờ kê: vẽ bóng mờ ngay ô trước mặt cho biết sẽ đặt vào đâu
    const cam = NT.choKe();
    if (cam) {
      const o = facingTile();
      const v = NT.VAT_BY_ID[cam];
      const duoc = NT.keDuoc(cam, o.x, o.y);
      ctx.save();
      ctx.globalAlpha = 0.55;
      ve1(cam === 'ruong' ? anhDat(false) : anhNhaNT(cam), o.x, o.y, v.w, v.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = duoc ? '#51cf66' : '#ff6b6b';
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(o.x * size - camX), Math.round(o.y * size - camY),
        Math.round(v.w * size), Math.round(v.h * size));
      ctx.restore();
    }
  }

  // Chấm nhỏ báo "có việc ở đây" trên đầu ruộng/con vật
  function veCham(x, y, size, camX, camY, mau) {
    ctx.save();
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(Date.now() / 260);
    ctx.fillStyle = mau;
    ctx.beginPath();
    ctx.arc(Math.round(x * size - camX), Math.round(y * size - camY),
      Math.max(2, size * 0.12), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Vẽ NPC + người chơi (cả ngoài trời lẫn trong nhà)
  function drawActors(map, size, camX, camY) {
    // Nhân vật cao gấp đôi ô: rộng bằng 1 ô, cao 2 ô, chân đặt đúng ô đang đứng
    const chW = size, chH = size * (OW_H / OW_W);
    const put = (img, dir, moving, cx, cy) => {
      if (!owReady(img)) return;
      const f = owFrame(dir, moving, Date.now(), img);
      // Bề ngang vẽ theo ĐÚNG tỉ lệ ô của chính sprite đó, không ép cứng bằng
      // một ô. Sprite của Tuxemon và bản ghép LPC đều là 1:2 nên không đổi gì;
      // nhưng bộ nhân vật của Jephed ô 20×32, ép về 1:2 là bóp ngang 20%,
      // người trông gầy nhom.
      const w = chH * (f.sw / f.sh);
      ctx.drawImage(img, f.sx, f.sy, f.sw, f.sh,
        Math.round(cx - w / 2), Math.round(cy - chH + size * 0.34),
        Math.round(w), Math.round(chH));
    };
    // Nằm trên giường: giường trong game đều DỰNG ĐỨNG (rộng 1-2 ô, cao 2 ô)
    // nên xoay nhân vật 90° là nằm vắt ngang qua giường, thò cả người ra ngoài.
    // Nằm dọc theo giường thì cứ vẽ đứng, chỉ hạ xuống giữa giường là đủ.
    // Chỉ giường NẰM NGANG (rộng hơn cao) mới cần xoay.
    const nam = (img, cx, cy, ngang) => {
      if (!ngang) { put(img, 'down', false, cx, cy); return; }
      ctx.save();
      ctx.translate(cx, cy - chH / 2 + size * 0.34);
      ctx.rotate(Math.PI / 2);
      put(img, 'down', false, 0, chH / 2 - size * 0.34);
      ctx.restore();
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
    // Đồ nội thất kê trong nhà — vẽ ngay trên bản đồ, đúng ô đã đặt.
    // Đang sang thăm nhà người khác thì vẽ đồ CỦA CHỦ NHÀ.
    if (trongNhaNao()) {
      for (const d of doTrongNha()) {
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

    // Nhà trọ chung: vẽ dãy giường, mỗi người online chưa có nhà nằm một cái
    if (INN.laNhaTro(player.mapId)) {
      const f = FURN_BY_ID[INN.ID_GIUONG];
      const im = f && anhTep(f.img);
      const ds = INN.cacGiuong();
      const khach = INN.khachTro();
      ds.forEach((g, i) => {
        if (im?.complete && im.naturalWidth) {
          ctx.drawImage(im, Math.round(g.x * size - camX), Math.round(g.y * size - camY),
            Math.round(size * f.w), Math.round(size * f.h));
        }
        // Giường 0 là của mình (vẽ ở phần nhân vật), còn lại cho khách trọ
        const k = khach[i - 1];
        if (i === 0 || !k) return;
        const ava = owImage(k.avatar === 'leaf' ? 'leaf' : 'red');
        nam(ava, (g.x + f.w / 2) * size - camX,
          (g.y + f.h / 2) * size - camY + chH / 2 - size * 0.34, f.w > f.h);
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        ctx.font = `${Math.round(size * 0.26)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(k.username, (g.x + 0.5) * size - camX, (g.y - 0.15) * size - camY);
        ctx.restore();
      });
    }

    // ==== Nông trại: ruộng, cây, công trình, con vật ====
    // Vẽ TRƯỚC nhân vật để người chơi luôn đứng đè lên chứ không bị cây che.
    if (player.mapId === NT.NONG_TRAI_MAP) veNongTrai(size, camX, camY);

    // Biển "BÁN" cắm ở từng lô đất — CHỈ khi người chơi chưa có đất. Mua rồi
    // thì khu dân cư chỉ còn là chỗ ở của mình, không phải cái chợ đất.
    if (player.mapId === KHU_DAT_MAP && !ES.coDat()) {
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
    }

    // Toà nhà của bang hội đứng trên Bang Đường — vẽ đè lên bản đồ y như nhà
    // của người chơi, phần va chạm thì bản đồ đã đánh dấu sẵn.
    for (const t of BD.toaNhaTren(player.mapId)) {
      const a = TOA_BANG[t.id];
      const im = a && anhTep(a.img);
      if (!im?.complete || !im.naturalWidth) continue;
      const w2 = size * t.w;
      const h2 = w2 * (im.naturalHeight / im.naturalWidth);
      const px2 = Math.round(t.x * size - camX);
      const py2 = Math.round((t.y + 1) * size - camY - h2);
      ctx.drawImage(im, px2, py2, Math.round(w2), Math.round(h2));
      ctx.save();
      ctx.fillStyle = '#f0e6d0';
      ctx.font = `bold ${Math.round(size * 0.3)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,.7)';
      ctx.lineWidth = Math.max(2, size * 0.08);
      ctx.strokeText(t.name, px2 + w2 / 2, py2 - size * 0.15);
      ctx.fillText(t.name, px2 + w2 / 2, py2 - size * 0.15);
      ctx.restore();
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
    // Đang lái xe thì vẽ chiếc xe thay cho nhân vật
    const cuoi = MT.dangCuoi();
    if (cuoi && !trongNhaNao()) {
      const im = anhTep(MT.VEHICLE_BY_ID[cuoi.id]?.img[player.dir] || '');
      if (im?.complete && im.naturalWidth) {
        const w2 = size * (player.dir === 'up' || player.dir === 'down' ? 1.05 : 1.55);
        const h2 = w2 * (im.naturalHeight / im.naturalWidth);
        ctx.drawImage(im, Math.round(px - w2 / 2), Math.round(py - h2 * 0.72),
          Math.round(w2), Math.round(h2));
      }
      drawTitle(px, py - chH + size * 0.34);
      return;
    }

    // Đang thả câu thì vẽ dáng cầm cần (bộ 5 khung của assets/nv_cau) thay cho
    // dáng đứng. Ảnh chưa nướng xong thì cứ vẽ dáng thường, không để trống.
    // Bóng cá lượn trên mặt nước lúc đang thả câu. Chờ mà mặt nước phẳng lì
    // thì không biết dưới đó có gì; thấy cái bóng bơi qua bơi lại là biết
    // ngay còn cá.
    const veBongCa = () => {
      if (!cauTu) return;
      const im = ntAnh(ANH_BONG);
      if (!owReady(im)) return;
      const o = facingTile();
      const map = currentMap();
      if (!map.water?.[o.y * map.w + o.x]) return;
      const k = Math.floor((performance.now() - cauTu.t0) / BONG_NHIP) % BONG_KHUNG;
      const s2 = im.naturalWidth / BONG_KHUNG;
      // Lượn ngang trong lòng ô cho đỡ đứng chết một chỗ
      const lech = Math.sin((performance.now() - cauTu.t0) / 700) * size * 0.22;
      ctx.drawImage(im, k * s2, 0, s2, im.naturalHeight,
        Math.round(o.x * size - camX + lech), Math.round(o.y * size - camY),
        Math.round(size), Math.round(size));
    };
    veBongCa();

    const dangCau = () => {
      if (!cauTu) return false;
      const img = AV.anhCauCa(CAU.canDangDung().mau);
      if (!owReady(img)) return false;
      const f = AV.khungCau(player.dir, performance.now() - cauTu.t0, img);
      const w = chH * (f.sw / f.sh);
      // Pack vẽ nhân vật lúc câu cao hơn lúc đi mấy pixel, phải hạ lại cho
      // chân đứng đúng mặt đất
      const y = py - chH + size * 0.34 + chH * (AV.CAU_LECH_Y / f.sh);
      ctx.drawImage(img, f.sx, f.sy, f.sw, f.sh,
        Math.round(px - w / 2), Math.round(y), Math.round(w), Math.round(chH));
      return true;
    };
    const tt = TT.tuTheHienTai();
    // Nằm/ngồi thì vẽ NGAY TRÊN món đồ chứ không phải chỗ đang đứng — đứng
    // cạnh giường mà nằm thì trông như ngã ra sàn.
    const mon = TT.monDangNgoi();
    const fm = mon && FURN_BY_ID[mon.id];
    const mx = fm ? (mon.x + fm.w / 2) * size - camX : px;
    const my = fm ? (mon.y + fm.h / 2) * size - camY + chH / 2 - size * 0.34 : py;
    // Dáng cầm cần ĐÈ LÊN mọi tư thế khác: vừa nằm vừa quăng cần thì kỳ.
    if (dangCau()) {
      // đã vẽ trong dangCau()
    } else if (tt === 'nam') {
      nam(avatarImg(), mx, my, !!fm && fm.w > fm.h);
    } else if (tt === 'ngoi') {
      put(avatarImg(), player.dir, false, mx, my);
    } else {
      put(avatarImg(), player.dir, player.moving, px, py);
    }
    drawTitle(px, py - chH + size * 0.34);

    // Tắt đèn thì nhà tối đi, chừa một quầng sáng quanh nhân vật
    if (ES.dangTrongNha(player.mapId) && !VS.dangTham() && !TT.denDangBat()) {
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
    // Ba tiệm (thợ mộc, quà tặng, quần áo) đã dời ra Phố Kim Long — ở đó chúng
    // là NPC có sẵn trường `mo`, đi chung đường với mọi quầy hàng khác.
    const BIEN = { name: 'Biển Bán Đất' };
    if (thing.kind === 'lo-nguoi-khac') {
      await playDialog([[BIEN, 'Bạn đã có đất rồi — mỗi người một lô thôi.']]);
      return;
    }
    if (thing.kind === 'lo-ban') {
      const l = thing.lot;
      const i = await choose(l.name, [
        { label: `Mua ${tienChu(l.price)}`, sub: `Bạn đang có ${tienChu(G.p.money)}` },
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
        label: `${b.name} — ${tienChu(b.price)}`,
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
        { label: `Giục thợ làm ngay — ${tienChu(Math.ceil(ES.conLaiMs() / 60000) * 500)}` },
        { label: 'Để thợ làm tiếp' },
      ]);
      if (i !== 1) return;
      const [gia, err] = ES.xayNhanh();
      if (err) { toast(err); return; }
      toast(`Đã trả thêm ${tienChu(gia)} — nhà xong rồi!`);
      drawTopBar();
      return;
    }
    // Đồ đã kê trong nhà mình: nằm, ngồi, ăn, tắm, nấu, bật đèn
    if (thing.kind === 'do-noi-that') {
      const [ra, err] = TT.dung(thing.mon);
      if (err) { toast(err); return; }
      if (ra && ra.moMan) {                 // bếp thì mở thẳng màn Nhà Bếp
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
    // Cùng căn nhà đó nhưng nhìn từ phía sân sau (Nông Trại)
    if (thing.kind === 'cua-sau' || thing.kind === 'nha-sau') {
      if (thing.kind === 'nha-sau') {
        const c = ES.oCuaNongTrai();
        toast(`Cửa sau ở phía dưới căn nhà (ô ${c.x}, ${c.y}).`);
        return;
      }
      vaoNha(true);
      return;
    }
  }

  // Đang ở trong một căn nhà nào đó (nhà mình hay nhà người ta đang thăm)
  const trongNhaNao = () =>
    VS.dangTham() ? player.mapId === VS.mapDangTham() : ES.dangTrongNha(player.mapId);
  // Đồ đang bày trong căn nhà đó
  const doTrongNha = () => (VS.dangTham() ? VS.doCuaChu() : ES.nha().dat);

  // Vừa mở game lên thì nhân vật đang nằm trên giường — nhà mình hoặc nhà trọ.
  // Nhấn hướng một cái là đứng dậy (vòng lặp dưới lo việc đó).
  //
  // CHỈ chạy đúng một lần cho mỗi lần mở trang. Trước đây hàm này gọi ở mỗi lần
  // vẽ lại màn bản đồ, nên cứ từ Menu quay ra là bị đặt nằm xuống giường lại và
  // hiện thêm một dòng nhắc — vừa sai vừa phiền. Cũng bỏ luôn dòng nhắc: nhìn
  // là biết mình đang nằm ở đâu, không cần ai nói.
  function moGameNguDay() {
    const tin = layTinNguDay();
    if (!tin) return;
    if (tin.t === 'tro') {
      const g = INN.giuongCuaToi();
      if (g) TT.datTuThe('nam', { id: INN.ID_GIUONG, x: g.x, y: g.y });
      return;
    }
    if (tin.giuong) TT.datTuThe('nam', tin.giuong);
  }

  // ==== Bang Đường ====
  async function bangDuong(thing) {
    const BIA = { name: 'Bảng Đá' };
    if (thing.kind === 'cua-khu') {
      const c = thing.cua;
      if (BD.layCapBang() >= c.cap) {
        toast(`${c.name} đã mở — cứ đi thẳng vào.`);
        return;
      }
      await playDialog([[BIA,
        `${c.name} còn khoá. Bang phải đạt cấp ${c.cap} mới mở được cửa này.`]]);
      return;
    }
  }

  // Vào trong nhà: mượn bản đồ nội thất trống của bản gốc, cắm thêm một cổng
  // quay ra đúng chỗ vừa đứng.
  function vaoNha(tuRuong = false) {
    // Vào bằng cửa nào thì đứng ngay trong cửa đó — vào cửa sau mà bị quăng ra
    // tận cửa trước thì đi cả căn phòng mới quay lại được ruộng.
    const cho = tuRuong ? ES.camCongTuNongTrai() : ES.camCongVeNha();
    if (!cho) { toast('Chưa vào được.'); return; }
    enterMap(ES.mapTrongNha(), cho.x, cho.y);
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

    veLoiRa(map, size, camX, camY);
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
  // Khác rỗng nghĩa là đang thả câu: bản đồ vẽ nhân vật ở dáng cầm cần, tính
  // khung theo số ms kể từ `t0`.
  let cauTu = null;

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // Đang trang trí thì khoá đi lại, kẻo vừa kéo đồ vừa chạy
    if (!busy && !deco) {
      const k = keyVec();
      updateNpcs(dt);
      // Đang nằm/ngồi mà nhấn hướng thì đứng dậy trước đã
      // Nhấn hướng là đứng dậy. Không cần báo gì — nhìn nhân vật là thấy.
      if (vec.x + k.x || vec.y + k.y) TT.dungDay();
      const ev = update(dt, vec.x + k.x, vec.y + k.y);
      if (ev?.t === 'warp') {
        el.querySelector('#world-zone').textContent = currentMap().name;
        playMusic(currentMap().music || 'town');
        toast(`Đã tới ${ev.name}`);
        // Vào trong nhà thì phải xuống xe — chật thế lái vào đâu được
        if (isInside() && MT.xuong()) toast('Bạn xuống xe trước khi vào trong.');
        // Bước ra khỏi nhà đang thăm thì trả lại mọi thứ như cũ
        if (VS.dangTham() && player.mapId !== VS.mapDangTham()) {
          const ten = VS.chuNha();
          VS.roiNhaNguoiKhac();
          toast(`Đã rời nhà ${ten}.`);
        }
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
    // Khách thì không được kê lại nhà người ta
    const trongNha = ES.dangTrongNha(player.mapId) && !VS.dangTham();
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
    // Đặt tạm vào ô trống GẦN CHỖ ĐANG ĐỨNG nhất rồi người chơi kéo đi đâu tuỳ ý.
    // Trước đây quét từ góc trên trái nên món vừa lấy ra rơi tít góc phòng,
    // ngoài khung nhìn — tưởng như bấm xong chẳng có gì xảy ra.
    const noi = currentMap();
    const px = Math.floor(player.x), py = Math.floor(player.y);
    let cho = null, gan = Infinity;
    for (let y = 0; y < noi.h; y++) {
      for (let x = 0; x < noi.w; x++) {
        if (!ES.keDuocTrongNha(id, x, y, noi)) continue;
        const d = (x - px) ** 2 + (y - py) ** 2;
        if (d < gan) { gan = d; cho = { x, y }; }
      }
    }
    if (!cho) { toast('Không còn chỗ trống để kê.'); return; }
    const [, err] = ES.keTaiO(id, cho.x, cho.y);
    if (err) { toast(err); return; }
    toast(`Đặt ${FURN_BY_ID[id]?.name} xuống rồi — kéo tới chỗ bạn muốn.`);
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

  /**
   * Thanh lực: một cái vạch chạy qua chạy lại, bấm A lúc nó nằm trong vùng
   * xanh thì kéo được cá lên.
   *
   * Canh theo THỜI GIAN (chờ rồi bấm) thì chỉ là phản xạ nhanh tay, cá quý hay
   * cá rô cũng khó như nhau. Thanh lực thì NHÌN thấy được: vùng xanh hẹp dần
   * và vạch chạy nhanh dần theo bậc hiếm, nên cá quý khó một cách sờ được.
   *
   * Vẽ thẳng lên màn bản đồ, KHÔNG mở panel.
   */
  function thanhLuc(hiem) {
    return new Promise(xong => {
      const rong = CAU.vungTrung(undefined, hiem);
      const dau = CAU.choVung(rong);
      const vong = CAU.tocDoVach(hiem);
      const hop = document.createElement('div');
      hop.className = 'cau-thanh';
      hop.innerHTML = `<div class="cau-ray">
          <i class="cau-vung" style="left:${(dau * 100).toFixed(1)}%;width:${(rong * 100).toFixed(1)}%"></i>
          <i class="cau-vach"></i>
        </div>
        <p class="cau-chu">Bấm A khi vạch vào vùng xanh!</p>`;
      el.appendChild(hop);
      const vach = hop.querySelector('.cau-vach');
      const nut = el.querySelector('#btn-act');
      const bd = performance.now();
      let raf = 0;
      let vi = 0;
      const chay = (t) => {
        // Tam giác 0 -> 1 -> 0: vạch chạy qua rồi chạy lại
        const u = ((t - bd) % vong) / vong;
        vi = u < 0.5 ? u * 2 : 2 - u * 2;
        vach.style.left = `${(vi * 100).toFixed(2)}%`;
        raf = requestAnimationFrame(chay);
      };
      raf = requestAnimationFrame(chay);
      const thoi = (trung) => {
        cancelAnimationFrame(raf);
        window.removeEventListener('keydown', phim);
        nut?.removeEventListener('click', bam);
        nut?.classList.remove('cau-giat');
        hop.classList.add(trung ? 'trung' : 'truot');
        setTimeout(() => hop.remove(), 320);
        xong(trung);
      };
      const bam = () => thoi(CAU.trungVach(vi, dau, rong));
      const phim = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); bam(); } };
      window.addEventListener('keydown', phim);
      nut?.addEventListener('click', bam);
      nut?.classList.add('cau-giat');
      // Chần chừ mãi thì cá cũng chán mà đi
      setTimeout(() => { if (hop.isConnected) thoi(false); }, vong * 6);
    });
  }

  // Thả câu. Mỗi lần thả cần mòn một điểm, hết là gãy.
  async function thaCau(rod) {
    busy = true;
    // Bật dáng cầm cần TRƯỚC câu thoại: quăng cần rồi mới hiện chữ "quăng
    // cần xuống nước" thì đọc xong đã thấy người vẫn đứng khoanh tay.
    cauTu = { t0: performance.now() };
    try {
      await playDialog([[{ name: 'Bạn' }, `Quăng ${ITEMS[rod]?.name || 'cần câu'} xuống nước...`]]);
      const r = fish(rod);
      const mon = wearRod(rod);
      if (mon.broke) toast(`${ITEMS[rod]?.name || 'Cần câu'} gãy mất rồi!`);
      else if (mon.left <= 3) toast(`Cần sắp gãy — còn ${mon.left} lần thả.`);
      // Không dính Tuxemon thì thử CÁ THƯỜNG — cùng một cú quăng cần, khỏi
      // phải đẻ thêm một nút bấm riêng cho câu cá. Câu cá làm ngay trên bản
      // đồ chứ không mở panel: bắt được con nào thì báo bằng một dòng thoại.
      if (!r.ok) {
        const con = CAU.caRia(CAU.choTheoMap(player.mapId));
        if (!con) { toast('Chờ mãi mà chẳng con nào cắn...'); return; }
        // Cá rỉa rồi thì hiện thanh lực ngay trên bản đồ
        toast('Có con cắn câu!', 1000);
        const trung = await thanhLuc(CAU.CA_BY_ID[con.id].hiem);
        const [duoc, loi] = CAU.keoCa(con, trung);
        if (loi) { toast(loi); return; }
        const d = CAU.CA_BY_ID[duoc.id];
        await playDialog([[{ name: 'Bạn' },
          `${duoc.moi ? 'Loài mới! ' : duoc.kyLuc ? 'Kỷ lục mới! ' : ''}` +
          `Được một con ${d.name} dài ${duoc.dai} cm.`]]);
        save();
        return;
      }
      save();
      cleanup();
      show('battle', { kind: 'wild', enemy: r.mon, from: 'world',
        arena: isDaytime() ? r.env : r.envNight });
      return;
    } finally {
      busy = false;
      cauTu = null;
    }
  }

  // ==== Nông trại: làm việc NGAY TRÊN BẢN ĐỒ ====
  //
  // Cả việc đồng áng lẫn việc kê lại bố cục đều bấm A ngay tại chỗ. Mở panel
  // riêng cho từng ô ruộng thì trồng một luống mười hai ô là mười hai lần đóng
  // mở panel — làm một lúc là chán.
  async function ruongNuong(thing) {
    // 1) Đang cầm món chờ kê: bấm vào ô trống là đặt xuống
    if (thing.kind === 'cho-trong') {
      const [o, err] = NT.keTaiDay(thing.x, thing.y);
      toast(err || `Đã kê ${NT.VAT_BY_ID[o.id]?.name} vào đây.`);
      return;
    }

    // 2) Con vật: cho ăn hoặc thu sản phẩm
    if (thing.kind === 'thu') {
      const con = thing.con;
      const t = NT.THU_BY_ID[con.id];
      if (NT.sanSang(con)) {
        const [r, err] = NT.thuThu(con);
        if (err) { toast(err); return; }
        await playDialog([[{ name: 'Bạn' },
          `Lấy được ${NT.MON_BY_ID[r.id]?.name} từ ${t.name}.`]]);
        return;
      }
      const [ok, err] = NT.choAn(con);
      toast(err || ok);
      return;
    }

    // 3) Máy chế biến: bỏ nguyên liệu vào, hoặc lấy hàng ra
    if (thing.kind === 'may') {
      const m = thing.o;
      if (NT.mayXong(m)) {
        const [r, err] = NT.layKhoiMay(m);
        if (err) { toast(err); return; }
        await playDialog([[{ name: 'Bạn' },
          `Lấy được ${NT.MON_BY_ID[r.id]?.name} từ ${thing.name}.`]]);
        return;
      }
      if (NT.mayDangChay(m)) {
        toast(`${thing.name} đang chạy — ${NT.conLaiMayChu(m)}.`);
        return;
      }
      const ds = NT.congThucCua(m.id);
      const i = await choose(thing.name, [
        ...ds.map(c => ({
          label: NT.MON_BY_ID[c.ra]?.name || c.ra,
          sub: `cần ${c.soVao} ${NT.MON_BY_ID[c.vao]?.name} (có ${NT.co(c.vao)}) · ${c.phut} phút`,
          disabled: NT.co(c.vao) < c.soVao,
        })),
        { label: 'Nhấc máy lên', sub: 'Kê sang chỗ khác' },
        { label: 'Thôi' },
      ]);
      if (i === ds.length) {
        const [v, err] = NT.nhac(m);
        toast(err || `Đang cầm ${v.name}.`);
        return;
      }
      if (i === null || i < 0 || i > ds.length) return;
      const [ok, err] = NT.boVaoMay(m, ds[i].ra);
      toast(err || ok);
      return;
    }

    // 4) Công trình đã kê: nhấc lên để dời chỗ
    if (thing.kind === 'congtrinh') {
      const i = await choose(thing.name, [
        { label: 'Nhấc lên dời chỗ', sub: 'Kê lại ở đâu cũng được' },
        { label: 'Để yên đấy' },
      ]);
      if (i !== 0) return;
      const [v, err] = NT.nhac(thing.o);
      toast(err || `Đang cầm ${v.name}.`);
      return;
    }

    // 5) Ô ruộng
    const o = thing.o;
    if (!o.cay) {
      // Chưa gieo: chọn hạt trong kho. Không có hạt nào thì bảo đi mua.
      const co = NT.CAY.filter(c => NT.co(NT.maHat(c.id)) > 0);
      if (!co.length) {
        const i = await choose('Ô Ruộng', [
          { label: 'Nhấc ruộng lên', sub: 'Kê sang chỗ khác' },
          { label: 'Thôi', sub: 'Chưa có hạt nào — mua ở chỗ bác Nông' },
        ]);
        if (i === 0) {
          const [v, err] = NT.nhac(o);
          toast(err || `Đang cầm ${v.name}.`);
        }
        return;
      }
      const i = await choose('Gieo gì?', [
        ...co.map(c => ({ label: c.name,
          sub: `còn ${NT.co(NT.maHat(c.id))} gói · chín sau ${c.phut * NT.CHIN} phút` })),
        { label: 'Nhấc ruộng lên', sub: 'Kê sang chỗ khác' },
        { label: 'Thôi' },
      ]);
      if (i === co.length) {
        const [v, err] = NT.nhac(o);
        toast(err || `Đang cầm ${v.name}.`);
        return;
      }
      if (i < 0 || i > co.length) return;
      const [ok, err] = NT.gieo(o, co[i].id);
      toast(err || ok);
      return;
    }

    const c = NT.CAY_BY_ID[o.cay];
    if (NT.daChin(o)) {
      const [r, err] = NT.thu(o);
      if (err) { toast(err); return; }
      await playDialog([[{ name: 'Bạn' },
        `Thu được ${r.n} ${NT.MON_BY_ID[r.id]?.name || c.name}.`]]);
      return;
    }
    if (!NT.dangUot(o)) {
      const n = NT.tuoiHet();
      toast(n > 1 ? `Tưới luôn ${n} ô đang khát.` : `Tưới xong. ${c.name} lớn thêm một đoạn.`);
      return;
    }
    toast(`${c.name} — ${NT.conLaiChu(o)}.`);
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
      // Sảnh bạc: đứng trước máy/bàn nào thì mở đúng trò đó.
      // interact() rẽ theo thing.TYPE, nên nhánh này phải nằm ở đây — nhét vào
      // nhaDat() thì không bao giờ chạy tới vì type khác 'estate'.
      if (thing.type === 'casino') {
        cleanup();
        show('casino', { tro: thing.tro, from: 'world' });
        return;
      }
      // Nhà đất: biển bán, lô của mình, công trường, cửa nhà, bác thợ mộc
      if (thing.type === 'estate') { await nhaDat(thing); return; }
      // Bang Đường: cửa hai khu, bục gọi boss, rương thưởng nhiệm vụ
      if (thing.type === 'bang') { await bangDuong(thing); return; }
      // Nông trại: ruộng, con vật, công trình, chỗ kê đồ
      if (thing.type === 'nongtrai') { await ruongNuong(thing); return; }
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
      // NPC làm việc: nói xong thì mở đúng màn hình của việc đó (nhiệm vụ bang,
      // gọi Thủ Hộ...). Bản đồ tự sinh gắn sẵn trường 'mo' cho mấy NPC này.
      if (thing.mo) {
        cleanup();
        show(thing.mo, thing.tab ? { tab: thing.tab, from: 'world' } : { from: 'world' });
        return;
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
