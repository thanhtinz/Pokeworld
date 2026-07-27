// PokeWorld H5 | engine/mega.js | Mega Evolution: đăng ký dạng Mega, kiểm tra điều kiện, biến hình
// Cách hoạt động: các dạng Mega được nạp thẳng vào bảng SPECIES với số hiệu 10xxx,
// nhờ vậy toàn bộ engine sẵn có (tính chỉ số, khắc hệ, sprite) dùng lại được nguyên vẹn.
// Mega chỉ tồn tại TRONG TRẬN — kết thúc trận luôn trả về dạng gốc, nên save không bao giờ
// chứa số hiệu 10xxx (server chỉ chấp nhận 1..151).
import { SPECIES } from '../data/species.js';
import { ITEMS } from '../data/items.js';
import { MEGA_FORMS, MEGA_STONES, MEGA_BY_SPECIES, KEY_STONE } from '../data/mega.js';
import { G } from '../state.js';

// Nạp dạng Mega vào bảng loài (chạy 1 lần khi import)
for (const [id, form] of Object.entries(MEGA_FORMS)) {
  if (!SPECIES[id]) SPECIES[id] = { ...form };
}

// Nạp Key Stone + các viên đá Mega vào bảng vật phẩm, để cửa hàng bán được
// và túi đồ gắn được cho Pokémon cầm. Không làm bước này thì cả hệ thống
// Mega có viết xong cũng không ai chạm tới được.
if (!ITEMS[KEY_STONE.id]) {
  ITEMS[KEY_STONE.id] = {
    name: KEY_STONE.name, desc: KEY_STONE.desc, kind: 'key',
    price: 20000, sell: 0,
  };
}
for (const [id, stone] of Object.entries(MEGA_STONES)) {
  if (ITEMS[id]) continue;
  ITEMS[id] = {
    name: stone.name,
    desc: `Cho ${SPECIES[stone.forSpecies]?.name || 'loài tương ứng'} Mega Evolution khi đang cầm.`,
    kind: 'held', price: stone.price ?? 15000, sell: Math.floor((stone.price ?? 15000) / 2),
  };
}

// Mã các vật phẩm thuộc hệ Mega — cửa hàng gom riêng một mục cho dễ tìm
export const MEGA_ITEM_IDS = [KEY_STONE.id, ...Object.keys(MEGA_STONES)];

export { MEGA_STONES, MEGA_BY_SPECIES, KEY_STONE };

export const isMegaForm = (spId) => !!MEGA_FORMS[spId];
export const isMega = (mon) => !!mon?.megaOf;

// Người chơi đã có Key Stone chưa
export function hasKeyStone() {
  return !!(G.p?.bag?.[KEY_STONE.id] > 0);
}

// Danh sách đá Mega hợp với 1 loài
export function stonesFor(speciesId) {
  return MEGA_BY_SPECIES[speciesId] || [];
}

// Pokémon này có thể Mega Evolve không?
// Trả về { stoneId, megaId, name } hoặc null.
// Điều kiện: có Key Stone + mon đang cầm đúng đá Mega của loài mình + chưa Mega trong trận.
export function canMegaEvolve(mon, { usedThisBattle = false } = {}) {
  if (!mon || isMega(mon) || usedThisBattle) return null;
  if (!hasKeyStone()) return null;
  const held = mon.held;
  if (!held) return null;
  const stone = MEGA_STONES[held];
  if (!stone || stone.forSpecies !== mon.sp) return null;
  return { stoneId: held, megaId: stone.megaId, name: MEGA_FORMS[stone.megaId]?.name || 'Mega' };
}

// Biến hình Mega. Giữ nguyên HP hiện tại theo TỈ LỆ (máu tối đa thay đổi theo chỉ số mới).
// Trả về { ok, megaId, name } hoặc { ok:false, error }.
export function megaEvolve(mon, maxHpFn) {
  const can = canMegaEvolve(mon);
  if (!can) return { ok: false, error: 'Chưa đủ điều kiện Mega Evolution.' };
  const oldMax = maxHpFn(mon);
  const frac = oldMax > 0 ? mon.hpCur / oldMax : 1;
  mon.megaOf = mon.sp;          // nhớ dạng gốc để hoàn nguyên
  mon.sp = can.megaId;
  const newMax = maxHpFn(mon);
  mon.hpCur = Math.max(1, Math.min(newMax, Math.round(newMax * frac)));
  return { ok: true, megaId: can.megaId, name: can.name };
}

// Hoàn nguyên về dạng gốc (gọi khi kết thúc trận hoặc Pokémon gục)
export function revertMega(mon, maxHpFn) {
  if (!isMega(mon)) return false;
  const oldMax = maxHpFn(mon);
  const frac = oldMax > 0 ? mon.hpCur / oldMax : 1;
  mon.sp = mon.megaOf;
  delete mon.megaOf;
  const newMax = maxHpFn(mon);
  mon.hpCur = Math.max(0, Math.min(newMax, Math.round(newMax * frac)));
  return true;
}

// Hoàn nguyên toàn đội — gọi sau mỗi trận để save không bao giờ dính số hiệu 10xxx
export function revertAll(party, maxHpFn) {
  let n = 0;
  for (const mon of party || []) if (revertMega(mon, maxHpFn)) n++;
  return n;
}

// Dọn dữ liệu Mega sót lại trong save (phòng trường hợp thoát game giữa trận)
export function sanitizeSave(player, maxHpFn) {
  const all = [...(player?.party || []), ...(player?.box || [])];
  return revertAll(all, maxHpFn);
}
