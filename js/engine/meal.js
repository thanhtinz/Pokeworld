// TuxeWorld H5 | engine/meal.js | Bữa ăn: món nấu ra được việc gì cho Tuxemon
//
// Bản gốc cho ăn chỉ nhích điểm thân thiết, mà thân thiết thì chỉ vài loài
// dùng tới lúc tiến hoá — chẳng bõ công đi kiếm món.
//
// Nay mỗi món ăn còn để lại một BỮA NO: chỉ số ứng với vị ấm của món được cộng
// thêm một khoảng, tính bằng GIỜ THẬT — tắt game vẫn chạy tiếp. Món càng hợp khẩu vị con đó thì cộng
// càng nhiều và no càng lâu.
//
// Mỗi con chỉ giữ MỘT bữa no; ăn món mới là thay món cũ (kể cả khi món mới
// kém hơn — người chơi tự quyết cho ăn gì).
//
// Món ăn mua ở tiệm tạp hoá hoặc rơi ra khi thắng Tuxemon hoang.
//
// Tệp này cố tình KHÔNG import monster.js: monster.js phải gọi ngược sang đây
// trong stats(), có vòng import là vỡ.
import { TASTES_WARM } from '../data/tastes.js';

const PHUT = 60000;

// Mức hợp khẩu vị -> cộng bao nhiêu và no bao lâu.
// Tên mức trùng với bảng bond_preferences của bản gốc (xem engine/useitem.js).
export const MUC_AN = {
  great:    { pct: 0.20, phut: 60, ten: 'rất hợp miệng' },
  good:     { pct: 0.14, phut: 45, ten: 'hợp miệng' },
  average:  { pct: 0.08, phut: 30, ten: 'ăn tạm' },
  bad:      null,        // kỵ miệng thì nhè ra, không no
  terrible: null,
};

// Bữa no còn hiệu lực của một con, hết hạn thì dọn luôn cho sạch bản lưu
export function buaAn(mon) {
  const b = mon?.buaAn;
  if (!b) return null;
  if (!(b.den > Date.now())) { delete mon.buaAn; return null; }
  return b;
}

/**
 * Cho ăn một món. Gọi sau khi đã tính mức hợp khẩu vị.
 * @param {object} mon con được ăn
 * @param {string} warm vị ấm của món (quyết định cộng chỉ số nào)
 * @param {string} muc  'great' | 'good' | 'average' | 'bad' | 'terrible'
 * @returns {string|null} câu tả bữa no, hoặc null nếu món kỵ miệng
 */
export function choAn(mon, warm, muc) {
  const m = MUC_AN[muc];
  const w = TASTES_WARM[warm];
  if (!mon || !m || !w) return null;
  mon.buaAn = { stat: w.stat, pct: m.pct, den: Date.now() + m.phut * PHUT };
  return `${TEN_CHI_SO[w.stat] || w.stat} +${Math.round(m.pct * 100)}% trong ${m.phut} phút`;
}

export const TEN_CHI_SO = { hp: 'HP', armour: 'Giáp', dodge: 'Né tránh',
  melee: 'Cận chiến', ranged: 'Tầm xa', speed: 'Tốc độ' };

// Hệ số nhân cho MỘT chỉ số — monster.js gọi trong stats()
export function heSoAn(mon, key) {
  const b = buaAn(mon);
  return b && b.stat === key ? 1 + b.pct : 1;
}

// Câu hiện trong giao diện: "Giáp +14% · còn 42 phút"
export function chuBuaAn(mon) {
  const b = buaAn(mon);
  if (!b) return '';
  const p = Math.max(1, Math.ceil((b.den - Date.now()) / PHUT));
  const con = p < 60 ? `${p} phút` : `${Math.floor(p / 60)} giờ ${p % 60} phút`;
  return `${TEN_CHI_SO[b.stat] || b.stat} +${Math.round(b.pct * 100)}% · còn ${con}`;
}
