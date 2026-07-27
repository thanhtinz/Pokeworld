// TuxeWorld H5 | engine/player.js | Dữ liệu người chơi: cấp huấn luyện viên + thời trang
//
// Trước đây file này còn cả hệ thống trang bị (mặc đồ cộng chỉ số, cường hoá,
// mua bán). Đã bỏ hẳn: nhân vật không chiến đấu nên đồ cộng chỉ số không có
// nghĩa, chỉ giữ THỜI TRANG — thứ mặc vào cho đẹp và người khác nhìn thấy.
import { G, save, CONFIG } from '../state.js';
import { setGrants, NONE_ID } from '../data/cosmetics.js';

export const MAX_TRAINER_LEVEL = 50;

// Trần cấp cho Tuxemon: cấp huấn luyện viên x2 + 8 (Trainer Lv.1 -> trần Lv.10,
// Lv.46 trở đi là mở hết tới Lv.100).
// Không có trần thì chỉ cần cắm mặt vào một bụi cỏ là đội mạnh vượt cả cốt
// truyện, đánh đâu cũng một chiêu ăn ngay — thắng dễ quá thành ra chán.
// Đây là trần MỀM: quá trần vẫn lên được nhưng exp chỉ còn một phần nhỏ.
export const OVER_CAP_EXP = 0.2;

export function monLevelCap() {
  return Math.min(CONFIG.MAX_LEVEL, trainerLevel() * 2 + 8);
}

// EXP huấn luyện viên nhận sau mỗi trận. Đánh với người thì đáng giá hơn hẳn
// đánh quái hoang, để tiến độ đi theo cốt truyện chứ không theo bụi cỏ.
export function trainerExpFor(kind, enemyLv = 5) {
  const lv = Math.max(1, enemyLv);
  return kind === 'trainer' ? 20 + lv * 3 : 5 + lv;
}

// ==== Bảo đảm dữ liệu save có đủ field (save cũ vẫn chạy được) ====
export function ensureData() {
  const p = G.p;
  if (!p) return null;
  if (!p.trainer || typeof p.trainer !== 'object') p.trainer = { level: 1, exp: 0 };
  if (typeof p.trainer.level !== 'number') p.trainer.level = 1;
  if (typeof p.trainer.exp !== 'number') p.trainer.exp = 0;
  // Mặc định là "không mặc gì" — mọi món thời trang đều do admin tải ảnh lên
  if (!p.look || typeof p.look !== 'object') p.look = {};
  for (const [k, v] of Object.entries(NONE_ID)) {
    if (typeof p.look[k] !== 'string') p.look[k] = v;
  }
  // Skin riêng cho từng loài Tuxemon: { [mã loài]: mã skin }
  if (!p.monSkins || typeof p.monSkins !== 'object') p.monSkins = {};
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

// Mặc skin cho một loài Tuxemon (id rỗng = trả về hình gốc)
export function wearMonSkin(dex, id) {
  const p = ensureData();
  if (!p) return false;
  if (!id) delete p.monSkins[dex];
  else p.monSkins[dex] = id;
  save();
  return true;
}

// ==== Cấp huấn luyện viên ====
// Cần 100 * level^1.5 exp để đi từ `level` lên `level+1`.
export function expToNext(level) {
  if (level >= MAX_TRAINER_LEVEL) return Infinity;
  return Math.round(100 * Math.pow(level, 1.5));
}

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
