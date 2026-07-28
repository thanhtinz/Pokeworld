// TuxeWorld H5 | engine/overworld.js | Di chuyển trên bản đồ: va chạm, cổng dịch chuyển, gặp Tuxemon
import { MAPS, TILE_SIZE } from '../data/maps.js';
import { bake, isSolidAt, isEncAt, talkAt } from './mapbake.js';
import { ZONES } from '../data/zones.js';
import { ENCOUNTERS } from '../data/encounters.js';
import { G, save, markSeen, addItem } from '../state.js';
import { newTuxemon, maxHp } from './monster.js';
import { STATUSES } from '../data/statuses.js';
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

// Dang dung trong nha? Bản gốc gọi map_inside — vài loài chỉ tiến hoá khi ở
// trong nhà. Bản đồ nào môi trường là 'interior' thì tính là trong nhà.
export const isInside = () => (currentMap().env || '') === 'interior';

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

// ==== NPC ====
// Bản đồ Tuxemon chỉ cho toạ độ và hướng đứng, không có kịch bản đi lại. Mỗi
// NPC mang một kiểu cư xử (trường 'ai' do tools/mktmx.py gán theo nghề):
//   stand  đứng sau quầy, chỉ quay người khi người chơi lại gần
//   watch  lính gác: đứng một chỗ, đảo mắt nhìn quanh
//   wander đi lòng vòng quanh chỗ đứng
//   patrol đi đi lại lại một đoạn thẳng
// Ai cũng quay mặt về phía người chơi khi đứng sát, và bật dấu "!" một lần khi
// vừa trông thấy — nhìn có phản ứng chứ không phải tượng đá.
const NPC_SPEED = 1.8;           // ô mỗi giây, chậm hơn người chơi
const NPC_RANGE = 5;             // đi xa nhất ngần này ô so với chỗ đứng gốc
const NPC_FREQ = 1;              // giây giữa hai lần nghĩ tới chuyện bước đi
                                 // (WanderBehavior.frequency của bản gốc = 1)
const NOTICE_RANGE = 2;          // thấy người chơi trong ngần này ô thì quay mặt lại
const DIRS = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
const PATROL_DIRS = [[1, 0], [0, 1]];

// Đang đứng nhìn thẳng vào mặt nước chưa? Bản gốc gọi điều kiện này là
// "facing_tile surfable" — ô nước được đánh dấu ngay trong tileset, tools/mktmx.py
// nướng sẵn thành mảng water của từng bản đồ.
export function facingWater() {
  const map = currentMap();
  if (!map.water) return false;
  const { x, y } = facingTile();
  if (x < 0 || y < 0 || x >= map.w || y >= map.h) return false;
  return !!map.water[y * map.w + x];
}

export const pickKey = (mapId, it) => `${mapId}:${it.x},${it.y}:${it.id}`;
export const pickedUp = (mapId, it) => !!G.p?.picked?.[pickKey(mapId, it)];

// Chỗ nghỉ gần nhất — bản gốc gọi là teleport_faint: nơi người chơi tỉnh dậy
// khi cả đội gục, và cũng là đích của Chìa Khoá Thoát Hiểm. Cập nhật mỗi lần
// nghỉ ở một điểm hồi phục; chưa nghỉ ở đâu thì về thị trấn đầu game.
export function setHealSpot(mapId, x, y) {
  G.p.healAt = { map: mapId, x: Math.round(x), y: Math.round(y) };
  save();
}

export function healSpot() {
  const h = G.p?.healAt;
  if (h && MAPS[h.map]) return h;
  const m = MAPS[START_MAP];
  return { map: START_MAP, x: m.spawn.x, y: m.spawn.y };
}

// Xịt xua đuổi: n bước tiếp theo không gặp Tuxemon hoang (core/effects/repellent.py
// đăng ký một bộ đếm bước rồi trừ dần).
export function setRepellent(n) {
  G.p.repel = Math.max(G.p.repel || 0, Math.round(n));
  save();
}
export const repelLeft = () => G.p?.repel || 0;

// NPC có đang đứng ngay ô người chơi nhìn tới không (get_coords + get_direction
// bên bản gốc). Đang bị nhìn thẳng thì NPC đứng yên cho bấm nói chuyện.
function dangNhinThang(px, py, n) {
  const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[player.dir] || [0, 1];
  return n.x === px + d[0] && n.y === py + d[1];
}

function huongToi(n, x, y) {
  const dx = x - n.x, dy = y - n.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

// Bong bong cam xuc theo tinh cach NPC — anh lay tu gfx/bubbles cua ban goc
const BUBBLE_RANH = {
  stand: ['dots', 'sleep', 'note'],
  watch: ['dots', 'question', 'exclamation'],
  patrol: ['dots', 'note', 'money'],
  wander: ['note', 'heart', 'confused', 'tuxeball'],
};

function keu(n, kind, giay) {
  n.bubble = kind;
  n.emote = giay;
}

export function updateNpcs(dt) {
  const map = currentMap();
  const baked = currentBake();
  const px = Math.floor(player.x), py = Math.floor(player.y);
  for (const n of map.npcs || []) {
    if (n.home === undefined) {
      n.home = { x: n.x, y: n.y };
      n.ox = 0; n.oy = 0;
      n.wait = NPC_FREQ * (0.5 + Math.random() * 2);
      n.moving = false;
      n.step = n.ai === 'patrol' ? PATROL_DIRS[Math.floor(Math.random() * 2)] : null;
      n.way = 1;
    }
    if (n.emote > 0) {
      n.emote -= dt;
      if (n.emote <= 0) n.bubble = null;
    }

    // Trượt dần sang ô đích
    if (n.moving) {
      const step = NPC_SPEED * dt;
      n.ox += Math.sign(n.tx - n.x - n.ox) * Math.min(step, Math.abs(n.tx - n.x - n.ox));
      n.oy += Math.sign(n.ty - n.y - n.oy) * Math.min(step, Math.abs(n.ty - n.y - n.oy));
      if (Math.abs(n.tx - n.x - n.ox) < 0.01 && Math.abs(n.ty - n.y - n.oy) < 0.01) {
        n.x = n.tx; n.y = n.ty; n.ox = 0; n.oy = 0;
        n.moving = false;
        n.wait = NPC_FREQ * (0.7 + Math.random() * 0.9);
      }
      continue;
    }

    // Người chơi lại gần thì quay mặt về phía họ — nhưng CHỈ ĐỨNG LẠI khi đang
    // bị nhìn thẳng mặt. Bản gốc (WanderBehavior.update) chỉ dừng đúng lúc NPC
    // nằm trên ô người chơi đang hướng tới, để bấm nói chuyện không hụt; trước
    // đây bản này dừng cả vùng 2 ô quanh người chơi, mà đó lại đúng là mấy NPC
    // đang hiện trên màn hình — nhìn vào chỉ thấy toàn tượng đá.
    const gan = Math.abs(px - n.x) + Math.abs(py - n.y) <= NOTICE_RANGE;
    if (gan) {
      n.dir = huongToi(n, px, py);
      if (!n.seen) { n.seen = true; keu(n, 'exclamation', 1.2); }
    } else {
      n.seen = false;
    }
    if (dangNhinThang(px, py, n)) { n.wait = Math.max(n.wait, 0.3); continue; }

    n.wait -= dt;
    if (n.wait > 0) continue;

    // Thỉnh thoảng nghĩ ngợi một cái cho đỡ đơ
    if (!n.emote && Math.random() < 0.12) {
      const ds = BUBBLE_RANH[n.ai] || BUBBLE_RANH.wander;
      keu(n, ds[Math.floor(Math.random() * ds.length)], 1.6);
    }

    if (n.ai === 'stand') {
      n.dir = DIRS[Math.floor(Math.random() * DIRS.length)][0];
      n.wait = 3 + Math.random() * 5;
      continue;
    }
    if (n.ai === 'watch') {
      n.dir = DIRS[Math.floor(Math.random() * DIRS.length)][0];
      n.wait = 1.5 + Math.random() * 2.5;
      continue;
    }
    if (n.ai === 'patrol') {
      const [sx, sy] = n.step;
      let tx = n.x + sx * n.way, ty = n.y + sy * n.way;
      const xa = Math.abs(tx - n.home.x) + Math.abs(ty - n.home.y);
      if (xa > NPC_RANGE || !npcCanWalk(baked, map, tx, ty, n)) {
        n.way *= -1;
        tx = n.x + sx * n.way; ty = n.y + sy * n.way;
        if (!npcCanWalk(baked, map, tx, ty, n)) { n.wait = 1 + Math.random(); continue; }
      }
      n.dir = huongToi(n, tx, ty);
      n.tx = tx; n.ty = ty; n.moving = true;
      continue;
    }

    // wander — bản gốc bốc ngẫu nhiên trong DANH SÁCH LỐI RA ĐI ĐƯỢC, chứ không
    // bốc một hướng rồi thấy vướng thì thôi. Khác nhau to: NPC đứng cạnh tường
    // thì cách cũ có tới 3/4 số lần bốc trúng tường và đứng im.
    const loi = [];
    for (const [dir, dx, dy] of DIRS) {
      const tx = n.x + dx, ty = n.y + dy;
      if (Math.abs(tx - n.home.x) > NPC_RANGE || Math.abs(ty - n.home.y) > NPC_RANGE) continue;
      if (npcCanWalk(baked, map, tx, ty, n)) loi.push([dir, tx, ty]);
    }
    if (!loi.length) { n.wait = NPC_FREQ; continue; }
    const [dir, tx, ty] = loi[Math.floor(Math.random() * loi.length)];
    n.dir = dir;
    n.tx = tx; n.ty = ty; n.moving = true;
  }
}

// NPC không giẫm lên tường, cổng dịch chuyển, người chơi hay NPC khác.
//
// Bản gốc chỉ có ngần đó (pathfinder.get_exits đọc bảng va chạm, mà bảng va
// chạm đã tính cả nhân vật khác). Bản này từng thêm hai luật tự nghĩ ra và cả
// hai đều phản tác dụng:
//   · cấm bước lên ô có từ hai lối ra trở xuống — hoá ra cấm luôn mọi ô trong
//     nhà và mọi con hẻm, nên NPC ở đó đứng chôn chân vĩnh viễn, đồng thời đẩy
//     hết NPC ngoài trời dồn về mấy khoảng đất trống, thành ra tụ một đám
//   · cấm đứng cách NPC khác một ô — hai NPC gần nhau là khoá chân lẫn nhau
// Giữ lại duy nhất một luật: không chui vào ngõ cụt (ô chỉ có đúng một lối ra),
// vì trong đó NPC tự nhốt mình.
function npcCanWalk(baked, map, x, y, self) {
  if (x < 0 || y < 0 || x >= map.w || y >= map.h) return false;
  if (isSolidAt(baked, x, y)) return false;
  if ((map.warps || []).some(w => w.x === x && w.y === y)) return false;
  if (Math.floor(player.x) === x && Math.floor(player.y) === y) return false;
  if (loiRa(baked, map, x, y) <= 1) return false;
  return !(map.npcs || []).some(o => o !== self && oX(o) === x && oY(o) === y);
}

const oX = (n) => (n.moving ? n.tx : n.x);
const oY = (n) => (n.moving ? n.ty : n.y);

function loiRa(baked, map, x, y) {
  let n = 0;
  for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < map.w && ny < map.h && !isSolidAt(baked, nx, ny)) n += 1;
  }
  return n;
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

  // Đồ rơi trên bản đồ: giẫm lên là nhặt, mỗi món chỉ nhặt được một lần
  // (bản gốc gác bằng biến <tên>:yes trong sự kiện add_item).
  const nhat = (map.items || []).find(it => it.x === Math.floor(player.x)
    && it.y === Math.floor(player.y) && !pickedUp(player.mapId, it));
  if (nhat) {
    if (!G.p.picked) G.p.picked = {};
    G.p.picked[pickKey(player.mapId, nhat)] = true;
    addItem(nhat.id, nhat.n || 1);
    save();
    return { t: 'pickup', id: nhat.id, n: nhat.n || 1 };
  }

  // Bỏng / trúng độc còn hành cả lúc đi bộ: bản gốc ghi ngay trong db/status
  // (step_effect_type + step_interval), mặc định cứ 10 bước mất 1 máu. Đây là
  // lý do hai trạng thái đó đánh dấu "còn sau khi hết trận".
  const dau = buocDau();

  // Cổng dịch chuyển
  const tx = Math.floor(player.x), ty = Math.floor(player.y);
  const warp = (map.warps || []).find(w => w.x === tx && w.y === ty);
  if (warp) {
    enterMap(warp.to, warp.tx, warp.ty);
    return { t: 'warp', to: warp.to, name: MAPS[warp.to]?.name };
  }

  // Xịt xua đuổi còn hiệu lực thì đếm ngược, và không gặp con nào
  if (G.p.repel > 0) {
    G.p.repel -= 1;
    if (G.p.repel === 0) return { t: 'repelEnd' };
    return dau;
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
  return dau;
}

// Mỗi bước đi trừ máu con đang mang trạng thái có step_effect. Trả về sự kiện
// báo cho giao diện nếu có con gục, còn không thì null.
function buocDau() {
  const guc = [];
  for (const mon of (G.p?.party || [])) {
    const s = STATUSES[mon.status];
    if (!s?.step || mon.hpCur <= 0) continue;
    const [kieu, gt, moi] = s.step;
    mon.stepTick = (mon.stepTick || 0) + 1;
    if (mon.stepTick < moi) continue;
    mon.stepTick = 0;
    let d = 0;
    if (kieu === 'flat_damage') d = gt;
    else if (kieu === 'percent_max_hp_damage') d = maxHp(mon) * gt / 100;
    else if (kieu === 'percent_current_hp_damage') d = mon.hpCur * gt / 100;
    else if (kieu === 'percent_max_hp_heal') d = -maxHp(mon) * gt / 100;
    d = Math.round(d);
    if (!d) continue;
    // Bản gốc không để con nào gục hẳn vì đi bộ — chừa lại 1 máu
    mon.hpCur = Math.max(d > 0 ? 1 : 0, Math.min(maxHp(mon), mon.hpCur - d));
    if (d > 0 && mon.hpCur <= 1) guc.push(mon);
  }
  if (!guc.length) return null;
  save();
  return { t: 'stepHurt', mons: guc };
}

// Chọn Tuxemon hoang. Ưu tiên bảng gặp lấy thẳng từ bản gốc (js/data/encounters.js
// sinh theo lệnh random_encounter ghi trong chính bản đồ đó); bản đồ nào bản gốc
// không khai thì dùng bảng theo địa hình của js/data/zones.js.
export function rollWild(mapId) {
  const list = ENCOUNTERS[mapId]?.length ? ENCOUNTERS[mapId] : ZONES[mapId]?.encounters;
  if (!list?.length) return null;
  const e = rng.weighted(list);
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
