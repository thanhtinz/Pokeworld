// PokeWorld H5 | engine/mapbake.js | "Nướng" bản đồ: từ lưới ký tự ra lưới ô ảnh thật
// Ghép cạnh (autotile) một lần rồi nhớ lại, vẽ mỗi khung hình chỉ việc tra bảng.
import { AUTOTILES, DECOR, BUILDINGS, pickAuto } from '../data/tiles.js';
import { MAPS, TERRAIN, charAt, mapWidth, mapHeight } from '../data/maps.js';

const cache = new Map();

// Số ngẫu nhiên "cố định" theo toạ độ — cùng ô luôn ra cùng kết quả
function hash(x, y) {
  let h = (x * 73856093) ^ (y * 19349663);
  h = (h ^ (h >>> 13)) >>> 0;
  return h;
}

const WATERY = new Set(['sand', 'water', 'deep']);
// Vách hang cũng coi là "nền cát" khi ghép viền: nếu không, nền hang bị viền
// cỏ xanh của bộ autotile cát chạy dọc theo vách đá.
const SANDY_EDGE = new Set([...WATERY, 'rockwall']);

export function bake(mapId) {
  if (cache.has(mapId)) return cache.get(mapId);
  const map = MAPS[mapId];
  if (!map) return null;

  const w = mapWidth(map), h = mapHeight(map);
  // Bản đồ trong nhà dùng một tấm ảnh làm nền, lưới ký tự chỉ để chắn đường
  const isRoom = !!map.image;
  const n = w * h;
  const ground = new Int16Array(n);
  const over = new Int16Array(n).fill(-1);
  const top = new Int16Array(n).fill(-1);
  const solid = new Uint8Array(n);
  const enc = new Uint8Array(n);

  const kindAt = (x, y) => (TERRAIN[charAt(map, x, y)] || TERRAIN['.']).kind;
  const isWatery = (x, y) => SANDY_EDGE.has(kindAt(x, y));
  const isWater = (x, y) => { const k = kindAt(x, y); return k === 'water' || k === 'deep'; };
  const isDeep = (x, y) => kindAt(x, y) === 'deep';
  const isPath = (x, y) => kindAt(x, y) === 'path';
  const isTree = (x, y) => kindAt(x, y) === 'tree';

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const t = TERRAIN[charAt(map, x, y)] || TERRAIN['.'];
      const k = t.kind;

      if (isRoom) {                 // trong nhà: chỉ cần biết ô nào chắn đường
        ground[i] = -1;
        if (t.solid) solid[i] = 1;
        continue;
      }

      // Vách hang: khối đá đặc, không pha nền cỏ
      if (k === 'rockwall') {
        ground[i] = DECOR.rockWall;
        solid[i] = 1;
        continue;
      }

      // Lớp nền: vùng nước/cát nằm trên cát, còn lại nằm trên cỏ
      if (WATERY.has(k)) {
        ground[i] = pickAuto(AUTOTILES.sand, isWatery, x, y);
      } else {
        const r = hash(x, y) % 100;
        ground[i] = r < 6 ? DECOR.grassPebble : DECOR.grass;
      }

      // Lớp phủ
      if (k === 'water') {
        over[i] = pickAuto(AUTOTILES.water, isWater, x, y);
      } else if (k === 'deep') {
        over[i] = AUTOTILES.water.c;
        top[i] = pickAuto(AUTOTILES.deep, isDeep, x, y);
      } else if (k === 'path') {
        over[i] = pickAuto(AUTOTILES.path, isPath, x, y);
      } else if (k === 'tree') {
        over[i] = pickAuto(AUTOTILES.tree, isTree, x, y);
      }

      if (t.decor === 'tall') over[i] = DECOR.tallGrass;
      else if (t.decor === 'flower') over[i] = hash(x, y) & 1 ? DECOR.flowerRed : DECOR.flowerWhite;
      else if (t.decor === 'rock') over[i] = DECOR.bush;
      else if (t.decor === 'sign') over[i] = DECOR.sign;

      if (t.solid) solid[i] = 1;
      // Hang động không có cỏ cao: mọi ô đi được đều là ô gặp Pokémon
      if (t.enc || (map.encAll && !t.solid)) enc[i] = 1;
    }
  }

  // Nhà: dán đè lên trên cùng, chắn đường trừ ô cửa
  const doors = {};
  for (const b of map.buildings || []) {
    const def = BUILDINGS[b.b];
    if (!def) continue;
    for (let j = 0; j < def.h; j++) {
      for (let k2 = 0; k2 < def.w; k2++) {
        const x = b.x + k2, y = b.y + j;
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const i = y * w + x;
        top[i] = def.start + k2 + j * 21;
        solid[i] = 1;
        enc[i] = 0;
      }
    }
    const dx = b.x + def.door[0], dy = b.y + def.door[1];
    doors[`${dx},${dy}`] = b;
    solid[dy * w + dx] = 0;   // đứng lên ô cửa được để bấm vào
  }

  // Ô "điểm tương tác": quầy lễ tân, máy PC... bấm A khi đứng trước là dùng được
  for (const sp of map.spots || []) doors[`${sp.x},${sp.y}`] = sp;

  const baked = { w, h, ground, over, top, solid, enc, doors, map, image: map.image || null };
  cache.set(mapId, baked);
  return baked;
}

export const isSolidAt = (baked, x, y) =>
  x < 0 || y < 0 || x >= baked.w || y >= baked.h ? true : !!baked.solid[y * baked.w + x];

export const isEncAt = (baked, x, y) =>
  x < 0 || y < 0 || x >= baked.w || y >= baked.h ? false : !!baked.enc[y * baked.w + x];

export const doorAt = (baked, x, y) => baked.doors[`${x},${y}`] || null;
