// PokeWorld H5 | engine/overworld.js | Di chuyển trên bản đồ: va chạm, cổng dịch chuyển, gặp Pokémon
import { MAPS, TILE_SIZE, tileAt, mapWidth, mapHeight } from '../data/maps.js';
import { ZONES } from '../data/zones.js';
import { G, save, markSeen } from '../state.js';
import { newPokemon } from './pokemon.js';
import { rng } from '../util.js';

const SPEED = 3.4;              // ô mỗi giây
const ENC_STEP_MIN = 6;         // đi ít nhất ngần này ô cỏ mới có thể gặp
const ENC_CHANCE = 0.16;        // xác suất mỗi ô cỏ sau khi đủ ngưỡng

// Trạng thái người chơi trên bản đồ (đơn vị: ô, có phần lẻ để đi mượt)
export const player = { mapId: 'town_1', x: 11, y: 12, dir: 'down', moving: false, steps: 0 };

export function currentMap() {
  return MAPS[player.mapId] || MAPS.town_1;
}

// Đặt người chơi vào một bản đồ (dùng khi vào game / qua cổng)
export function enterMap(mapId, tx, ty) {
  const map = MAPS[mapId];
  if (!map) return false;
  player.mapId = mapId;
  player.x = tx ?? map.spawn.x;
  player.y = ty ?? map.spawn.y;
  player.steps = 0;
  // Đồng bộ với hệ thống khu vực cũ (spawn table, cốt truyện, trainer)
  if (ZONES[mapId]) G.p.zone = mapId;
  G.p.pos = { map: mapId, x: player.x, y: player.y };
  save();
  return true;
}

// Khôi phục vị trí đã lưu
export function restorePosition() {
  const pos = G.p?.pos;
  if (pos && MAPS[pos.map]) {
    player.mapId = pos.map;
    player.x = pos.x;
    player.y = pos.y;
  } else {
    const zone = G.p?.zone && MAPS[G.p.zone] ? G.p.zone : 'town_1';
    enterMap(zone);
  }
}

const isSolid = (map, x, y) => !!tileAt(map, Math.floor(x), Math.floor(y)).solid;

// NPC cũng chắn đường
function npcAt(map, x, y) {
  return (map.npcs || []).find(n => n.x === Math.floor(x) && n.y === Math.floor(y)) || null;
}

// Kiểm tra ô đích có đi được không (chừa lề để không kẹt góc)
function canWalk(map, x, y) {
  const pad = 0.28;
  const pts = [[x - pad, y - pad], [x + pad, y - pad], [x - pad, y + pad], [x + pad, y + pad]];
  for (const [px, py] of pts) {
    if (px < 0 || py < 0 || px >= mapWidth(map) || py >= mapHeight(map)) return false;
    if (isSolid(map, px, py)) return false;
  }
  return !npcAt(map, Math.round(x), Math.round(y));
}

// Cập nhật vị trí theo vector joystick. dt tính bằng giây.
// Trả về sự kiện xảy ra: {t:'warp',...} | {t:'encounter', mon} | null
export function update(dt, vx, vy) {
  const map = currentMap();
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
  if (canWalk(map, tryX, player.y)) player.x = tryX;
  const tryY = player.y + ny * dist;
  if (canWalk(map, player.x, tryY)) player.y = tryY;

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
  const tile = tileAt(map, tx, ty);
  if (tile.enc) {
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

// NPC đang đứng ngay trước mặt (để bấm nút tương tác)
export function facingNpc() {
  const map = currentMap();
  const dx = player.dir === 'left' ? -1 : player.dir === 'right' ? 1 : 0;
  const dy = player.dir === 'up' ? -1 : player.dir === 'down' ? 1 : 0;
  const tx = Math.round(player.x) + dx, ty = Math.round(player.y) + dy;
  return (map.npcs || []).find(n => n.x === tx && n.y === ty) || null;
}

export { TILE_SIZE };
