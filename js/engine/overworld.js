// TuxeWorld H5 | engine/overworld.js | Di chuyển trên bản đồ: va chạm, cổng dịch chuyển, gặp Tuxemon
import { MAPS, TILE_SIZE } from '../data/maps.js';
import { bake, isSolidAt, isEncAt, talkAt } from './mapbake.js';
import { ZONES } from '../data/zones.js';
import { G, save, markSeen } from '../state.js';
import { newTuxemon } from './pokemon.js';
import { rng } from '../util.js';

const SPEED = 3.6;              // ô mỗi giây
const ENC_STEP_MIN = 8;         // đi ít nhất ngần này ô cỏ mới có thể gặp
const ENC_CHANCE = 0.12;        // xác suất mỗi ô cỏ sau khi đủ ngưỡng

// Trạng thái người chơi trên bản đồ (đơn vị: ô, có phần lẻ để đi mượt)
export const START_MAP = Object.keys(MAPS)[0];
export const player = { mapId: START_MAP, x: 1.5, y: 1.5, dir: 'down', moving: false, steps: 0 };

export function currentMap() {
  return MAPS[player.mapId] || MAPS[START_MAP];
}

export const currentBake = () => bake(player.mapId in MAPS ? player.mapId : START_MAP);

// Đặt người chơi vào một bản đồ (dùng khi vào game / qua cổng)
export function enterMap(mapId, tx, ty) {
  const map = MAPS[mapId];
  if (!map) return false;
  player.mapId = mapId;
  // +0.5 để đứng giữa ô chứ không dính mép
  const [sx, sy] = freeSpot(mapId, tx ?? map.spawn.x, ty ?? map.spawn.y);
  player.x = sx + 0.5;
  player.y = sy + 0.5;
  player.steps = 0;
  // Đồng bộ với hệ thống khu vực cũ (bảng spawn, cốt truyện, huấn luyện viên)
  if (ZONES[mapId]) G.p.zone = mapId;
  G.p.pos = { map: mapId, x: player.x, y: player.y };
  save();
  return true;
}

// Khôi phục vị trí đã lưu
export function restorePosition() {
  const pos = G.p?.pos;
  // Bản đồ có thể đã đổi từ bản cũ — vị trí lưu cũ có thể rơi vào tường/nhà
  const stuck = (id, x, y) => {
    const [fx, fy] = freeSpot(id, Math.floor(x), Math.floor(y));
    return fx !== Math.floor(x) || fy !== Math.floor(y);
  };
  if (pos && MAPS[pos.map] && !stuck(pos.map, pos.x, pos.y)) {
    player.mapId = pos.map;
    player.x = pos.x;
    player.y = pos.y;
  } else if (pos && MAPS[pos.map]) {
    enterMap(pos.map);
  } else {
    const zone = G.p?.zone && MAPS[G.p.zone] ? G.p.zone : START_MAP;
    enterMap(zone);
  }
}

// Ô vào bản đồ mà đang có NPC (hoặc là tường) thì tìm ô trống ngay cạnh.
// Bản đồ lấy từ Tuxemon nên chỗ xuất hiện đôi khi trùng đúng chỗ một NPC đứng.
function freeSpot(mapId, x, y) {
  const map = MAPS[mapId];
  const baked = bake(mapId);
  const okAt = (px, py) => px >= 0 && py >= 0 && px < map.w && py < map.h
    && !isSolidAt(baked, px, py) && !npcAt(map, px, py);
  if (okAt(x, y)) return [x, y];
  for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    if (okAt(x + dx, y + dy)) return [x + dx, y + dy];
  }
  return [x, y];
}

// ==== NPC đi lại ====
// Bản đồ lấy từ Tuxemon chỉ cho toạ độ và hướng đứng, không có kịch bản đi lại.
// Mỗi NPC ở đây tự đi quanh chỗ của mình vài ô rồi quay về, thỉnh thoảng chỉ
// đứng xoay người — làng xóm nhìn có người sống chứ không phải tượng.
const NPC_SPEED = 1.8;           // ô mỗi giây, chậm hơn người chơi
const NPC_RANGE = 2;             // đi xa nhất ngần này ô so với chỗ đứng gốc
const DIRS = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];

export function updateNpcs(dt) {
  const map = currentMap();
  const baked = currentBake();
  for (const n of map.npcs || []) {
    if (n.fixed) continue;
    if (n.home === undefined) {
      n.home = { x: n.x, y: n.y };
      n.ox = 0; n.oy = 0;
      n.wait = 1 + Math.random() * 4;
      n.moving = false;
    }
    // Đang bước: trượt dần sang ô đích
    if (n.moving) {
      const step = NPC_SPEED * dt;
      n.ox += Math.sign(n.tx - n.x - n.ox) * Math.min(step, Math.abs(n.tx - n.x - n.ox));
      n.oy += Math.sign(n.ty - n.y - n.oy) * Math.min(step, Math.abs(n.ty - n.y - n.oy));
      if (Math.abs(n.tx - n.x - n.ox) < 0.01 && Math.abs(n.ty - n.y - n.oy) < 0.01) {
        n.x = n.tx; n.y = n.ty; n.ox = 0; n.oy = 0;
        n.moving = false;
        n.wait = 1 + Math.random() * 4;
      }
      continue;
    }
    n.wait -= dt;
    if (n.wait > 0) continue;
    const [dir, dx, dy] = DIRS[Math.floor(Math.random() * DIRS.length)];
    n.dir = dir;
    const tx = n.x + dx, ty = n.y + dy;
    const xa = Math.abs(tx - n.home.x), ya = Math.abs(ty - n.home.y);
    const trong = xa <= NPC_RANGE && ya <= NPC_RANGE;
    // Một phần ba số lần chỉ xoay người cho khỏi đi lại liên tục
    if (!trong || Math.random() < 0.34 || !npcCanWalk(baked, map, tx, ty, n)) {
      n.wait = 1 + Math.random() * 3;
      continue;
    }
    n.tx = tx; n.ty = ty; n.moving = true;
  }
}

// NPC không giẫm lên tường, lên cổng dịch chuyển, lên nhau hay lên người chơi
function npcCanWalk(baked, map, x, y, self) {
  if (x < 0 || y < 0 || x >= map.w || y >= map.h) return false;
  if (isSolidAt(baked, x, y)) return false;
  if ((map.warps || []).some(w => w.x === x && w.y === y)) return false;
  if (Math.floor(player.x) === x && Math.floor(player.y) === y) return false;
  return !(map.npcs || []).some(o => o !== self && ((o.x === x && o.y === y) || (o.moving && o.tx === x && o.ty === y)));
}

// NPC cũng chắn đường
function npcAt(map, x, y) {
  return (map.npcs || []).find(n => (n.x === x && n.y === y)
    || (n.moving && n.tx === x && n.ty === y)) || null;
}

// Kiểm tra vị trí đích có đi được không (chừa lề để không kẹt góc).
// cur = ô người chơi ĐANG đứng. NPC chắn đường, nhưng nếu người chơi lỡ đứng
// chung ô với NPC (điểm vào bản đồ trùng chỗ NPC đứng) mà vẫn chặn thì mỗi
// bước nhỏ trong khung hình đều bị từ chối -> đứng chôn chân, không đi đâu được.
function canWalk(baked, map, x, y, cur) {
  const pad = 0.3;
  const pts = [[x - pad, y - pad], [x + pad, y - pad], [x - pad, y + pad], [x + pad, y + pad]];
  for (const [px, py] of pts) {
    if (px < 0 || py < 0 || px >= map.w || py >= map.h) return false;
    if (isSolidAt(baked, Math.floor(px), Math.floor(py))) return false;
  }
  const tx = Math.floor(x), ty = Math.floor(y);
  if (cur && tx === cur[0] && ty === cur[1]) return true;   // vẫn trong ô của mình
  return !npcAt(map, tx, ty);
}

// Cập nhật vị trí theo vector joystick. dt tính bằng giây.
// Trả về sự kiện xảy ra: {t:'warp',...} | {t:'encounter', mon} | null
export function update(dt, vx, vy) {
  const map = currentMap();
  const baked = currentBake();
  const len = Math.hypot(vx, vy);
  if (len < 0.15) { player.moving = false; return null; }

  // Chuẩn hóa để đi chéo không nhanh hơn
  const nx = vx / len, ny = vy / len;
  player.moving = true;
  player.dir = Math.abs(nx) > Math.abs(ny) ? (nx > 0 ? 'right' : 'left') : (ny > 0 ? 'down' : 'up');

  const dist = SPEED * dt;
  const cur = [Math.floor(player.x), Math.floor(player.y)];
  const beforeTile = `${cur[0]},${cur[1]}`;

  // Trượt theo từng trục để men tường mượt thay vì dính cứng
  const tryX = player.x + nx * dist;
  if (canWalk(baked, map, tryX, player.y, cur)) player.x = tryX;
  const tryY = player.y + ny * dist;
  if (canWalk(baked, map, player.x, tryY, cur)) player.y = tryY;

  const afterTile = `${Math.floor(player.x)},${Math.floor(player.y)}`;
  if (beforeTile === afterTile) return null;   // chưa sang ô mới

  G.p.pos = { map: player.mapId, x: player.x, y: player.y };

  // Cổng dịch chuyển
  const tx = Math.floor(player.x), ty = Math.floor(player.y);
  const warp = (map.warps || []).find(w => w.x === tx && w.y === ty);
  if (warp) {
    enterMap(warp.to, warp.tx, warp.ty);
    return { t: 'warp', to: warp.to, name: MAPS[warp.to]?.name };
  }

  // Gặp Tuxemon khi đi trong cỏ cao
  if (isEncAt(baked, tx, ty)) {
    player.steps += 1;
    if (player.steps >= ENC_STEP_MIN && rng.roll(ENC_CHANCE)) {
      player.steps = 0;
      const mon = rollWild(player.mapId);
      if (mon) return { t: 'encounter', mon };
    }
  }
  return null;
}

// Chọn Tuxemon hoang theo bảng spawn của khu vực
export function rollWild(mapId) {
  const zone = ZONES[mapId];
  if (!zone?.encounters?.length) return null;
  const e = rng.weighted(zone.encounters);
  const mon = newTuxemon(e.sp, rng.int(e.min, e.max));
  if (mon) markSeen(e.sp);
  return mon;
}

// Ô ngay trước mặt người chơi
export function facingTile() {
  const dx = player.dir === 'left' ? -1 : player.dir === 'right' ? 1 : 0;
  const dy = player.dir === 'up' ? -1 : player.dir === 'down' ? 1 : 0;
  return { x: Math.floor(player.x) + dx, y: Math.floor(player.y) + dy };
}

// Thứ đang đứng trước mặt: NPC hoặc cửa một toà nhà (để bấm nút tương tác)
export function facingThing() {
  const map = currentMap();
  const { x, y } = facingTile();
  const npc = (map.npcs || []).find(n => n.x === x && n.y === y);
  if (npc) return { type: 'npc', ...npc };
  // Bảng hiệu / bảng thông báo: bản đồ Tuxemon đánh dấu bằng sự kiện thoại
  const talk = talkAt(currentBake(), x, y);
  if (talk) return { type: 'talk', ...talk };
  return null;
}

export { TILE_SIZE };
