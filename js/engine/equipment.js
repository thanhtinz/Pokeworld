// TuxeWorld H5 | engine/equipment.js | Engine trang bị: mặc/tháo, cường hóa, bonus cộng dồn, trainer level
import { G, save, spend, addMoney } from '../state.js';
import { rng, clamp } from '../util.js';
import { SLOTS, RARITY, EQUIPMENT, UPGRADE, STAT_KEYS, statsOf, maxLevelOf } from '../data/equipment.js';
import { setGrants, NONE_ID } from '../data/cosmetics.js';

// Đá cường hóa: KHÔNG nằm trong data/items.js (file đó do màn khác giữ),
// nên định nghĩa tại đây và lưu số lượng trong G.p.bag.upgrade_stone.
export const STONE_ITEM = {
  id: 'upgrade_stone',
  name: 'Upgrade Stone',
  desc: 'Đá cường hóa trang bị',
  sprite: 'dome_fossil',
  price: 1500,
};

export const MAX_TRAINER_LEVEL = 50;

// ==== Bảo đảm dữ liệu save có đủ field (save cũ vẫn chạy được) ====
export function ensureData() {
  const p = G.p;
  if (!p) return null;
  if (!p.equipped || typeof p.equipped !== 'object') p.equipped = {};
  for (const s of SLOTS) if (p.equipped[s.id] === undefined) p.equipped[s.id] = null;
  if (!Array.isArray(p.inventory)) p.inventory = [];
  if (!p.trainer || typeof p.trainer !== 'object') p.trainer = { level: 1, exp: 0 };
  if (typeof p.trainer.level !== 'number') p.trainer.level = 1;
  if (typeof p.trainer.exp !== 'number') p.trainer.exp = 0;
  // Mặc định là "không mặc gì" — mọi món thời trang đều do admin tải ảnh lên
  if (!p.look || typeof p.look !== 'object') p.look = {};
  for (const [k, v] of Object.entries(NONE_ID)) {
    if (typeof p.look[k] !== 'string') p.look[k] = v;
  }
  // Món thời trang được quản trị viên trao tay (khoá dạng "title:tet_2026")
  if (!Array.isArray(p.granted)) p.granted = [];
  setGrants(p.granted);
  return p;
}

// Đổi một món thời trang đang mặc. Trả về true nếu có thay đổi.
export function wearCosmetic(kind, id) {
  const p = ensureData();
  if (!p || !p.look || p.look[kind] === id) return false;
  p.look[kind] = id;
  save();
  return true;
}

// ==== Trainer level ====
// Cần 100 * level^1.5 exp để đi từ `level` lên `level+1`.
export function expToNext(level) {
  if (level >= MAX_TRAINER_LEVEL) return Infinity;
  return Math.round(100 * Math.pow(level, 1.5));
}

// Tổng exp tích lũy -> level (1..50). Dùng cùng thang với addTrainerExp (exp reset mỗi cấp)
export function trainerLevelFor(exp) {
  let lv = 1;
  let left = Math.max(0, exp || 0);
  while (lv < MAX_TRAINER_LEVEL && left >= expToNext(lv)) {
    left -= expToNext(lv);
    lv++;
  }
  return lv;
}

// Cộng exp cho trainer. Trả về mảng các cấp MỚI đạt được (rỗng nếu không lên cấp).
export function addTrainerExp(amount) {
  const p = ensureData();
  if (!p || !(amount > 0)) return [];
  const gained = [];
  p.trainer.exp += Math.round(amount);
  while (p.trainer.level < MAX_TRAINER_LEVEL && p.trainer.exp >= expToNext(p.trainer.level)) {
    p.trainer.exp -= expToNext(p.trainer.level);
    p.trainer.level++;
    gained.push(p.trainer.level);
  }
  if (p.trainer.level >= MAX_TRAINER_LEVEL) p.trainer.exp = 0;
  save();
  return gained;
}

export function trainerLevel() {
  const p = ensureData();
  return p ? p.trainer.level : 1;
}

// ==== Bonus cộng dồn ====
// Tổng stat (%) của mọi món ĐANG MẶC, đã nhân độ hiếm + cấp cường hóa.
export function totalStats() {
  const out = {};
  for (const k of STAT_KEYS) out[k] = 0;
  const p = ensureData();
  if (!p) return out;
  for (const s of SLOTS) {
    const eq = p.equipped[s.id];
    if (!eq || !EQUIPMENT[eq.id]) continue;
    const st = statsOf(eq.id, eq.level || 0);
    for (const [k, v] of Object.entries(st)) out[k] = (out[k] || 0) + v;
  }
  for (const k of Object.keys(out)) out[k] = Math.round(out[k] * 10) / 10;
  return out;
}

// Hệ số nhân cho engine khác: bonusMult('expBonus') -> 1.25 nếu +25%
export function bonusMult(key) {
  return 1 + (totalStats()[key] || 0) / 100;
}

// ==== Inventory ====
let uidSeed = 0;
function newUid() {
  uidSeed++;
  return 'eq_' + Date.now().toString(36) + '_' + uidSeed.toString(36) + Math.floor(Math.random() * 1296).toString(36);
}

// Thêm một món vào túi trang bị (dùng cho shop / drop). Trả về uid hoặc null.
export function grantEquip(id, level = 0) {
  const p = ensureData();
  if (!p || !EQUIPMENT[id]) return null;
  const uid = newUid();
  p.inventory.push({ uid, id, level: clamp(level, 0, maxLevelOf(id)) });
  save();
  return uid;
}

export function findInv(uid) {
  const p = ensureData();
  if (!p) return null;
  return p.inventory.find(e => e.uid === uid) || null;
}

// Mặc một món trong túi. Trả về {ok, error, slot}
export function equip(invUid) {
  const p = ensureData();
  if (!p) return { ok: false, error: 'Chưa có dữ liệu người chơi.' };
  const idx = p.inventory.findIndex(e => e.uid === invUid);
  if (idx === -1) return { ok: false, error: 'Không tìm thấy trang bị.' };
  const item = p.inventory[idx];
  const def = EQUIPMENT[item.id];
  if (!def) return { ok: false, error: 'Trang bị không hợp lệ.' };
  if ((def.reqLevel || 1) > p.trainer.level) {
    return { ok: false, error: `Cần Trainer Lv.${def.reqLevel} mới mặc được.` };
  }
  const old = p.equipped[def.slot];
  p.inventory.splice(idx, 1);
  if (old) p.inventory.push({ uid: newUid(), id: old.id, level: old.level || 0 });
  p.equipped[def.slot] = { id: item.id, level: item.level || 0 };
  save();
  return { ok: true, slot: def.slot, replaced: old || null };
}

// Tháo món ở slot về túi. Trả về {ok, error, uid}
export function unequip(slotId) {
  const p = ensureData();
  if (!p) return { ok: false, error: 'Chưa có dữ liệu người chơi.' };
  const cur = p.equipped[slotId];
  if (!cur) return { ok: false, error: 'Ô này đang trống.' };
  const uid = newUid();
  p.inventory.push({ uid, id: cur.id, level: cur.level || 0 });
  p.equipped[slotId] = null;
  save();
  return { ok: true, uid };
}

// ==== Cường hóa ====
export function stoneCount() {
  const p = ensureData();
  return p ? (p.bag[STONE_ITEM.id] || 0) : 0;
}

// target = { slot:'hat' } (món đang mặc) HOẶC { uid:'eq_...' } (món trong túi)
// Trả về { ok, success, newLevel, error }
export function upgradeEquip(target) {
  const p = ensureData();
  if (!p) return { ok: false, error: 'Chưa có dữ liệu người chơi.' };

  let ref = null;
  if (target && target.slot) ref = p.equipped[target.slot];
  else if (target && target.uid) ref = p.inventory.find(e => e.uid === target.uid);
  else if (target && target.id) ref = target; // cho phép truyền thẳng object {id, level}
  if (!ref || !EQUIPMENT[ref.id]) return { ok: false, error: 'Không tìm thấy trang bị.' };

  const lv = ref.level || 0;
  const max = maxLevelOf(ref.id);
  if (lv >= max) return { ok: false, error: `Đã đạt cấp cường hóa tối đa (+${max}).` };

  const money = UPGRADE.costMoney(lv);
  const stones = UPGRADE.costStone(lv);
  if (p.money < money) return { ok: false, error: 'Không đủ tiền.' };
  if ((p.bag[STONE_ITEM.id] || 0) < stones) return { ok: false, error: 'Không đủ Upgrade Stone.' };

  spend(money);
  p.bag[STONE_ITEM.id] -= stones;
  if (p.bag[STONE_ITEM.id] <= 0) delete p.bag[STONE_ITEM.id];

  const success = rng.roll(UPGRADE.successRate(lv));
  if (success) ref.level = lv + 1;
  save();
  return { ok: true, success, newLevel: ref.level, error: null };
}

// ==== Bán lại ====
// Giá bán = 40% giá gốc + 200 mỗi cấp cường hóa
export function sellPrice(id, level = 0) {
  const def = EQUIPMENT[id];
  if (!def) return 0;
  return Math.round(def.price * 0.4) + 200 * (level || 0);
}

export function sellEquip(invUid) {
  const p = ensureData();
  if (!p) return { ok: false, error: 'Chưa có dữ liệu người chơi.' };
  const idx = p.inventory.findIndex(e => e.uid === invUid);
  if (idx === -1) return { ok: false, error: 'Không tìm thấy trang bị.' };
  const item = p.inventory[idx];
  const price = sellPrice(item.id, item.level || 0);
  p.inventory.splice(idx, 1);
  addMoney(price);
  return { ok: true, price, id: item.id };
}

// ==== Mua ====
export function buyEquip(id) {
  const p = ensureData();
  const def = EQUIPMENT[id];
  if (!p || !def) return { ok: false, error: 'Món này không tồn tại.' };
  if ((def.reqLevel || 1) > p.trainer.level) return { ok: false, error: `Cần Trainer Lv.${def.reqLevel}.` };
  if (p.money < def.price) return { ok: false, error: 'Không đủ tiền.' };
  spend(def.price);
  const uid = grantEquip(id);
  return { ok: true, uid };
}

export function buyStone(n = 1) {
  const p = ensureData();
  if (!p) return { ok: false, error: 'Chưa có dữ liệu người chơi.' };
  const cost = STONE_ITEM.price * n;
  if (p.money < cost) return { ok: false, error: 'Không đủ tiền.' };
  spend(cost);
  p.bag[STONE_ITEM.id] = (p.bag[STONE_ITEM.id] || 0) + n;
  save();
  return { ok: true, cost, n };
}

// ==== Rơi trang bị sau trận ====
const DROP_CHANCE = 0.06; // 6% mỗi trận
const RARITY_W = [
  ['common', 70], ['rare', 25], ['epic', 4.5], ['legendary', 0.5],
];

// zoneLevel càng cao càng dễ rơi + dễ ra đồ xịn. Trả về id trang bị hoặc null.
export function randomDrop(zoneLevel = 5) {
  const zl = clamp(Number(zoneLevel) || 1, 1, 100);
  if (!rng.roll(DROP_CHANCE + zl * 0.0015)) return null;

  // Chỉ rơi món mà zone đủ "trình" (reqLevel <= zoneLevel + 4)
  const cap = zl + 4;
  const pool = RARITY_W
    .map(([r, w]) => ({ r, w }))
    .filter(e => Object.values(EQUIPMENT).some(x => x.rarity === e.r && (x.reqLevel || 1) <= cap));
  if (!pool.length) return null;

  const pick = rng.weighted(pool);
  const list = Object.keys(EQUIPMENT).filter(id =>
    EQUIPMENT[id].rarity === pick.r && (EQUIPMENT[id].reqLevel || 1) <= cap);
  if (!list.length) return null;
  return rng.pick(list);
}

export function shopList(level) {
  const lv = level === undefined ? trainerLevel() : level;
  return Object.keys(EQUIPMENT).filter(id => (EQUIPMENT[id].reqLevel || 1) <= lv);
}

export { SLOTS, RARITY, EQUIPMENT, UPGRADE, statsOf, maxLevelOf };
