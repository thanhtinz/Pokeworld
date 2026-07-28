// TuxeWorld H5 | engine/monster.js | Tạo một con Tuxemon: IV, TP, khẩu vị, chỉ số
//
// Chỉ số tính ĐÚNG THEO BẢN GỐC (tuxemon/monster/stats.py):
//   chỉ số = dáng_thân * (cấp + 7) + IV + TP*cấp/100, rồi nhân hệ số khẩu vị.
// Không có bảng chỉ số riêng cho từng loài: mọi dáng thân cộng lại đều bằng 36,
// nên tiến hoá KHÔNG tự làm con vật mạnh lên — mạnh lên là nhờ cấp, IV, TP và
// bộ chiêu mới.
import { rng, clamp } from '../util.js';
import { CONFIG } from '../state.js';
import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { LEARNSETS } from '../data/learnsets.js';
import { TASTES_COLD, TASTES_WARM, COLD_LIST, WARM_LIST } from '../data/tastes.js';
import { expForLevel } from './exp.js';
import { heSoAn } from './meal.js';
import { congTrangBi } from './gear.js';

// Thứ tự chỉ số trong mảng iv/tp (khớp schema save)
export const STAT_KEYS = ['hp', 'armour', 'dodge', 'melee', 'ranged', 'speed'];
export const COEFF_STATS = 7;      // config_monster.coeff_stats của bản gốc

// Loài đỡ đạn cho bản lưu cũ trỏ tới loài không còn tồn tại
const FALLBACK_SPEC = { name: '???', types: ['normal'],
  base: { hp: 6, armour: 6, dodge: 6, melee: 6, ranged: 6, speed: 6 } };

// Bốc giới tính theo bảng trọng số {m, f, n} của loài
function bocGioiTinh(bang) {
  const ds = Object.entries(bang || { m: 0.5, f: 0.5 }).filter(([, w]) => w > 0);
  if (!ds.length) return 'n';
  const tong = ds.reduce((a, [, w]) => a + w, 0);
  let x = rng.float() * tong;
  for (const [g, w] of ds) { x -= w; if (x <= 0) return g; }
  return ds[ds.length - 1][0];
}

// Tạo một con mới. opts = { iv, tasteCold, tasteWarm, gender, flair, ball, moves }
export function newTuxemon(spId, level, opts = {}) {
  const spec = SPECIES[spId];
  if (!spec) {
    console.warn(`newTuxemon: species ${spId} không tồn tại`);
    return null;
  }
  const lv = clamp(level || 5, 1, CONFIG.MAX_LEVEL);

  // IV: 0..15 mỗi chỉ số (bản gốc dùng khoảng này, không phải 0..31)
  let iv = opts.iv;
  if (!iv) {
    iv = [];
    for (let i = 0; i < 6; i++) iv.push(rng.int(0, CONFIG.IV_MAX));
  }

  // Khẩu vị: một vị lạnh (giảm) + một vị ấm (tăng), thay cho tính cách
  const tasteCold = opts.tasteCold || rng.pick(COLD_LIST);
  const tasteWarm = opts.tasteWarm || rng.pick(WARM_LIST);

  // Giới tính bốc theo BẢNG TRỌNG SỐ của bản gốc (gender_weights): phần lớn
  // loài 50/50 đực-cái, 116 loài vô tính hoàn toàn, vài loài chỉ một giống.
  let gender = opts.gender;
  if (!gender) gender = bocGioiTinh(spec.gender);

  // Hoa văn hiếm (flair). Tuxemon KHÔNG có shiny — cái bản game này từng gọi là
  // shiny là khái niệm của game khác. Bản gốc có db/flair: hoa văn cosmetic vẽ
  // đè lên sprite, nhóm 'common' hiện mới có mỗi 'stars'. Dùng luôn cái đó làm
  // dấu hiệu con hiếm; tỉ lệ FLAIR_DENOM là lựa chọn của bản web, bản gốc không
  // ràng buộc gì.
  let flair = opts.flair !== undefined ? opts.flair : (opts.shiny ? 'stars' : undefined);
  if (flair === undefined) flair = rng.roll(1 / CONFIG.FLAIR_DENOM) ? 'stars' : null;

  const mon = {
    sp: spId,
    lv,
    exp: expForLevel(lv),
    nick: null,
    iv,
    tp: [0, 0, 0, 0, 0, 0],      // điểm rèn luyện, cộng dần sau mỗi trận thắng
    tasteCold,
    tasteWarm,
    gender,
    flair: flair || null,
    ball: opts.ball || 'tuxeball',
    moves: opts.moves || defaultMoves(spId, lv),
    hpCur: 0,
    status: null,
    statusTurns: 0,
    bond: 25,                     // config_monster.starting_bond
  };
  mon.hpCur = maxHp(mon);
  return mon;
}

// 4 chiêu gần nhất theo learnset tại level cho trước.
// LEARNSETS[dex] = [[cấp, mã chiêu], ...] đã sắp sẵn theo cấp; một cấp có thể
// học nhiều chiêu nên phải là mảng chứ không phải object khoá theo cấp.
export function defaultMoves(spId, level) {
  const ls = LEARNSETS[spId] || [];
  const learned = ls.filter(([lv]) => lv <= level).map(([, id]) => id);
  // Lấy 4 chiêu cuối cùng (mới nhất)
  const moves = [];
  const start = Math.max(0, learned.length - 4);
  // Tuxemon không có PP: mỗi chiêu có "recharge" — đánh xong phải chờ vài lượt
  // mới dùng lại được. cd = số lượt còn phải chờ.
  for (let i = start; i < learned.length; i++) moves.push({ id: learned[i], cd: 0 });
  // Con nào không có bảng học chiêu thì vẫn phải có gì đó để đánh
  if (moves.length === 0) moves.push({ id: 'struggle', cd: 0 });

  // CHỖ NÀY CỐ Ý KHÁC BẢN GỐC.
  // Bản gốc lấy đúng 4 chiêu mới nhất (monster/moves.py: eligible_moves[-4:]).
  // Nhưng vài loài có 4 chiêu mới nhất đều power 0 — medipup Lv.16 là
  // [revenge_stance, canine, hibernate, mystic_blending], không đòn nào gây sát
  // thương mà mystic_blending còn hồi máu. Con đó nằm trong đội của võ đường và
  // của trùm, mà trận huấn luyện viên thì KHÔNG chạy trốn được: hai bên không
  // hạ nổi nhau là người chơi kẹt vĩnh viễn, phải xoá bản lưu.
  // Nên: nếu cả bộ không có đòn nào gây sát thương thì đổi chiêu cũ nhất lấy
  // đòn mạnh nhất mà nó đã học được.
  const coDon = (id) => (MOVES[id]?.power || 0) > 0;
  if (moves.length && !moves.some(m => coDon(m.id))) {
    const donManh = learned.filter(coDon)
      .sort((a, b) => (MOVES[b].power || 0) - (MOVES[a].power || 0))[0];
    if (donManh) moves[0] = { id: donManh, cd: 0 };
  }
  return moves;
}

// 6 chỉ số theo đúng bản gốc: dáng_thân * (cấp + 7) + IV + TP*cấp/100,
// rồi nhân hệ số của hai khẩu vị.
export function stats(mon) {
  // Bản lưu đời cũ có thể thiếu iv/tp/khẩu vị, hoặc giữ một loài nay đã bỏ.
  // Thiếu thì lấy mặc định — ném lỗi ở đây là vỡ nguyên màn hình của người chơi.
  const spec = SPECIES[mon.sp] || FALLBACK_SPEC;
  const lv = mon.lv || 1;
  const mult = lv + COEFF_STATS;
  const cold = TASTES_COLD[mon.tasteCold];
  const warm = TASTES_WARM[mon.tasteWarm];
  const out = {};
  for (let i = 0; i < STAT_KEYS.length; i++) {
    const key = STAT_KEYS[i];
    const base = spec.base?.[key] ?? FALLBACK_SPEC.base[key];
    const iv = mon.iv?.[i] || 0;
    const tp = Math.floor((mon.tp?.[i] || 0) * lv / 100);
    let val = Math.floor(base * mult + iv + tp);
    if (cold?.stat === key) val = Math.floor(val * cold.mult);
    if (warm?.stat === key) val = Math.floor(val * warm.mult);
    // Bữa no do món ăn tự nấu để lại (engine/meal.js) — hết giờ là tự hết
    val = Math.floor(val * heSoAn(mon, key));
    // Trang bị cộng THẲNG số điểm ghi trên món (engine/gear.js), không nhân
    // phần trăm — nhìn con số trên món là biết ngay được thêm bao nhiêu.
    val += congTrangBi(mon, key);
    out[key] = val;
  }
  return out;
}

// Máu tối đa = chỉ số hp, nhân hệ số kéo dài trận đấu của bản web (xem
// CONFIG.HP_SCALE trong state.js).
export function maxHp(mon) {
  return Math.max(1, Math.floor(stats(mon).hp * CONFIG.HP_SCALE));
}

// Hệ hiện tại của một con. Vài chiêu của bản gốc (switch) đổi hệ ngay giữa
// trận, chiêu 'reverse' trả về hệ gốc — nên chỗ nào tính khắc hệ cũng phải
// hỏi qua đây chứ không đọc thẳng SPECIES.
export function typesOf(mon) {
  if (mon && Array.isArray(mon.types) && mon.types.length) return mon.types;
  return SPECIES[mon?.sp]?.types || ['normal'];
}

// Tên hiển thị: nickname > tên loài
export function displayName(mon) {
  if (mon.nick) return mon.nick;
  const spec = SPECIES[mon.sp];
  return spec ? spec.name : '?';
}

export function heal(mon) {
  mon.hpCur = maxHp(mon);
  mon.status = null;
  mon.statusTurns = 0;
  delete mon.plague;          // trạm hồi sức chữa luôn bệnh dịch
  for (const mv of mon.moves || []) mv.cd = 0;
}

export function isFainted(mon) {
  return (mon.hpCur || 0) <= 0;
}

// Điểm rèn luyện (TP) sau mỗi trận thắng — bản gốc (combat/reward_system.py):
// chỉ số nào của ĐỐI THỦ cao hơn của mình thì mình được +1 TP đúng chỉ số đó.
export function addTp(winner, loser) {
  if (!winner || !loser) return [];
  if (!Array.isArray(winner.tp)) winner.tp = [0, 0, 0, 0, 0, 0];
  const w = stats(winner);
  const l = stats(loser);
  let total = winner.tp.reduce((n, x) => n + (x || 0), 0);
  const got = [];
  for (let i = 0; i < STAT_KEYS.length; i++) {
    const key = STAT_KEYS[i];
    if (l[key] <= w[key]) continue;
    if ((winner.tp[i] || 0) >= CONFIG.TP_CAP_STAT || total >= CONFIG.TP_CAP_TOTAL) continue;
    winner.tp[i] = (winner.tp[i] || 0) + 1;
    total += 1;
    got.push(key);
  }
  return got;
}

// Học chiêu mới khi lên level. Trả về: 'learned' | 'full' (đủ 4, cần thay) | null
export function tryLearn(mon, moveId) {
  for (const mv of mon.moves) {
    if (mv.id === moveId) return null; // đã biết
  }
  const def = MOVES[moveId];
  if (!def) return null;
  if (mon.moves.length < 4) {
    mon.moves.push({ id: moveId, cd: 0 });
    return 'learned';
  }
  return 'full';
}

// Thay chiêu ở vị trí idx (khi đầy 4 chiêu)
export function replaceMove(mon, idx, moveId) {
  const def = MOVES[moveId];
  if (!def || !mon.moves[idx]) return false;
  mon.moves[idx] = { id: moveId, cd: 0 };
  return true;
}

// Độ thân thiết (bond) — bản gốc: bắt đầu 25, thắng +3, gục -10, tối đa 100.
// Tiến hoá của vài loài đòi bond đủ cao.
export function addBond(mon, n) {
  if (!mon) return;
  mon.bond = clamp((mon.bond ?? 25) + n, 0, 100);
}

// Thân thiết ĂN VÀO TRẬN ĐẤU, không chỉ để tiến hoá. Trên mức trung bình (50)
// thì con vật đánh mạnh dần lên, tối đa +10% ở mức 100. Dưới 50 không phạt —
// mới bắt về đã yếu sẵn thì chẳng ai nuôi.
export const HE_SO_THAN = 500;          // 50 điểm thân = +10%
export const MOC_LI_DON = 80;           // từ đây mới có cửa gắng gượng
export function heSoThanThiet(mon) {
  const b = mon?.bond ?? 25;
  return 1 + Math.max(0, b - 50) / HE_SO_THAN;
}

// Rất thân thì một lần mỗi trận có thể gắng gượng lại với 1 máu.
// Xác suất = bond/200, tức 40% ở mức 80 và 50% ở mức 100.
export function coHoiGangGuong(mon) {
  const b = mon?.bond ?? 25;
  return b >= MOC_LI_DON ? b / 200 : 0;
}

