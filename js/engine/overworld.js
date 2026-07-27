// PokeWorld H5 | engine/overworld.js | Di chuyển trên bản đồ: va chạm, cổng dịch chuyển, gặp Pokémon
import { MAPS, TILE_SIZE, mapWidth, mapHeight } from '../data/maps.js';
import { bake, isSolidAt, isEncAt, doorAt } from './mapbake.js';
import { ZONES } from '../data/zones.js';
import { G, save, markSeen } from '../state.js';
import { newPokemon } from './pokemon.js';
import { rng } from '../util.js';

const SPEED = 3.6;              // ô mỗi giây
const ENC_STEP_MIN = 6;         // đi ít nhất ngần này ô cỏ mới có thể gặp
const ENC_CHANCE = 0.16;        // xác suất mỗi ô cỏ sau khi đủ ngưỡng

// Trạng thái người chơi trên bản đồ (đơn vị: ô, có phần lẻ để đi mượt)
export const player = { mapId: 'town_1', x: 11.5, y: 16.5, dir: 'down', moving: false, steps: 0 };

export function currentMap() {
  return MAPS[player.mapId] || MAPS.town_1;
}

export const currentBake = () => bake(player.mapId in MAPS ? player.mapId : 'town_1');

// Đặt người chơi vào một bản đồ (dùng khi vào game / qua cổng)
export function enterMap(mapId, tx, ty) {
  const map = MAPS[mapId];
  if (!map) return false;
  player.mapId = mapId;
  // +0.5 để đứng giữa ô chứ không dính mép
  player.x = (tx ?? map.spawn.x) + 0.5;
  player.y = (ty ?? map.spawn.y) + 0.5;
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
  const stuck = (id, x, y) => isSolidAt(bake(id), Math.floor(x), Math.floor(y));
  if (pos && MAPS[pos.map] && !stuck(pos.map, pos.x, pos.y)) {
    player.mapId = pos.map;
    player.x = pos.x;
    player.y = pos.y;
  } else if (pos && MAPS[pos.map]) {
    enterMap(pos.map);
  } else {
    const zone = G.p?.zone && MAPS[G.p.zone] ? G.p.zone : 'town_1';
    enterMap(zone);
  }
}

// NPC cũng chắn đường
function npcAt(map, x, y) {
  return (map.npcs || []).find(n => n.x === x && n.y === y) || null;
}

// Kiểm tra vị trí đích có đi được không (chừa lề để không kẹt góc)
function canWalk(baked, map, x, y) {
  const pad = 0.3;
  const pts = [[x - pad, y - pad], [x + pad, y - pad], [x - pad, y + pad], [x + pad, y + pad]];
  for (const [px, py] of pts) {
    if (px < 0 || py < 0 || px >= mapWidth(map) || py >= mapHeight(map)) return false;
    if (isSolidAt(baked, Math.floor(px), Math.floor(py))) return false;
  }
  return !npcAt(map, Math.floor(x), Math.floor(y));
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
  const beforeTile = `${Math.floor(player.x)},${Math.floor(player.y)}`;

  // Trượt theo từng trục để men tường mượt thay vì dính cứng
  const tryX = player.x + nx * dist;
  if (canWalk(baked, map, tryX, player.y)) player.x = tryX;
  const tryY = player.y + ny * dist;
  if (canWalk(baked, map, player.x, tryY)) player.y = tryY;

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

  // Gặp Pokémon khi đi trong cỏ cao
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

// Chọn Pokémon hoang theo bảng spawn của khu vực
export function rollWild(mapId) {
  const zone = ZONES[mapId];
  if (!zone?.encounters?.length) return null;
  const e = rng.weighted(zone.encounters);
  const mon = newPokemon(e.sp, rng.int(e.min, e.max));
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
  const door = doorAt(currentBake(), x, y);
  if (door) return { type: 'door', ...door };
  // Đứng ngay trên ô cửa cũng tính là vào cửa
  const here = doorAt(currentBake(), Math.floor(player.x), Math.floor(player.y));
  if (here) return { type: 'door', ...here };
  return null;
}

export { TILE_SIZE };
