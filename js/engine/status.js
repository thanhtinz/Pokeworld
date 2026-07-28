// TuxeWorld H5 | engine/status.js | Trạng thái — CHẠY THEO BẢNG CỦA TUXEMON
//
// Bảng js/data/statuses.js sinh thẳng từ db/status của bản gốc: mỗi trạng thái
// có loại tác động (kind), tham số (p), hệ số nhân chỉ số (mods) và hệ miễn
// nhiễm. Mỗi con mang một trạng thái tại một thời điểm; món tốt không đẩy được
// món xấu ra và ngược lại.
import { rng } from '../util.js';
import { SPECIES } from '../data/species.js';
import { STATUSES, statusName } from '../data/statuses.js';
import { ITEMS } from '../data/items.js';
import { maxHp, typesOf } from './monster.js';

export { statusName };
export const STATUS_NAMES = Object.fromEntries(
  Object.entries(STATUSES).map(([id, s]) => [id, s.name]));

const def = (id) => STATUSES[id] || null;
const so = (v, mac) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : mac; };

// Dính một trạng thái mới lên con đang mang sẵn trạng thái khác thì xử lý ra
// sao — theo status/transition_engine.py của bản gốc:
//   · chưa mang gì            -> dính luôn
//   · đúng trạng thái đang có -> chồng lên, coi như không có gì mới
//   · đang mang trạng thái tốt-> tra onPos của trạng thái MỚI
//   · đang mang trạng thái xấu-> tra onNeg của trạng thái MỚI
// Mặc định của bản gốc là 'replaced' (cái mới đè cái cũ) chứ KHÔNG phải chặn.
// Bản này trước đây tự đặt luật "tốt không đẩy được xấu và ngược lại", thành
// ra mấy chiêu buff không còn tác dụng gỡ trạng thái xấu như bên gốc.
// 'removed' = gỡ trạng thái cũ mà KHÔNG dính cái mới (Tập trung, Vỏ cứng).
export function applyStatus(mon, id) {
  const s = def(id);
  if (!s) return false;
  if (immuneToStatus(mon, id)) return false;
  if ((s.immune || []).some(t => typesOf(mon).includes(t))) return false;
  if (mon.status === id) return false;

  const cu = def(mon.status);
  if (cu) {
    const cach = cu.cat === 'positive' ? (s.onPos || 'replaced')
      : cu.cat === 'negative' ? (s.onNeg || 'replaced') : 'replaced';
    if (cach === 'removed') { cureStatus(mon); return false; }
    if (cach !== 'replaced') return false;
  }

  mon.status = id;
  mon.statusTurns = 0;
  mon.statusUsed = 0;
  return true;
}

// Món đang cầm chặn hẳn một trạng thái (db/item: immunity_to_status).
// 'all' = chặn tất; bản gốc chỉ xét MÓN ĐANG CẦM, không xét món trong túi.
export function immuneToStatus(mon, id) {
  const it = mon.held && ITEMS[mon.held];
  const ds = it && it.immuneTo;
  return !!ds && (ds.includes('all') || ds.includes(id));
}

export function cureStatus(mon) {
  mon.status = null;
  mon.statusTurns = 0;
  mon.statusUsed = 0;
}

// Gỡ trạng thái theo nhóm ('positive' | 'negative' | 'all')
export function removeStatus(mon, cat = 'all') {
  const s = def(mon.status);
  if (!s) return false;
  if (cat !== 'all' && s.cat !== cat) return false;
  cureStatus(mon);
  return true;
}

// Hệ số nhân chỉ số do trạng thái
export function statMult(mon, key) {
  const s = def(mon.status);
  return s?.mods?.[key] ?? 1;
}

// Có được hành động lượt này không. Trả [ok, msg|null]
export function canAct(mon, name) {
  const s = def(mon.status);
  if (!s) return [true, null];
  const p0 = s.p?.[0];

  // Ngủ gật: ít nhất một lượt, sau đó MỖI LƯỢT bốc xem có tỉnh không, và quá
  // số lượt tối đa (duration = 5) thì chắc chắn tỉnh — core/effects/noddingoff.py
  if (s.kind === 'noddingoff') {
    mon.statusTurns = (mon.statusTurns || 0) + 1;
    const qua = s.dur > 0 && mon.statusTurns > s.dur;
    if (mon.statusTurns > 1 && (qua || !rng.roll(so(p0, 0.5)))) {
      cureStatus(mon);
      return [true, `${name} tỉnh ngủ!`];
    }
    return [false, `${name} đang ngủ gà ngủ gật...`];
  }
  if (s.kind === 'confused' && rng.roll(so(p0, 0.5))) {
    return [false, `${name} rối trí, đứng ngơ ra!`];
  }
  if (s.kind === 'charmed' && rng.roll(so(p0, 0.5))) {
    return [false, `${name} bị mê hoặc, không nỡ ra đòn!`];
  }
  if (s.kind === 'flinching' && rng.roll(so(p0, 0.5))) {
    return [false, `${name} chùn tay!`];
  }
  return [true, null];
}

// stuck chặn đòn cận chiến, grabbed chặn đòn tầm xa
export function rangeBlocked(mon, range) {
  const s = def(mon.status);
  if (!s || (s.kind !== 'stuck' && s.kind !== 'grabbed')) return false;
  return String(s.p?.[1] || '').split(':').filter(Boolean).includes(range);
}

// Điều kiện bấm được chiêu (db/technique: conditions). Bản gốc chỉ dùng một
// dạng: "status <tên>" với is/not — chiêu chỉ ra được khi NGƯỜI DÙNG đang (hoặc
// đang không) mang trạng thái đó. Ví dụ: "Đi trong mơ" phải đang ngủ mới bấm
// được, còn mấy chiêu lấy đà thì đang bị ghì/kẹt là chịu.
// Trả về null nếu bấm được, hoặc câu giải thích nếu không.
export function condBlocked(mon, mv, name) {
  for (const c of mv?.cond || []) {
    if (c.t !== 'status') continue;
    const co = mon.status === c.id;
    if (c.no && co) return `${name} đang ${(statusName(c.id) || c.id).toLowerCase()}, không dùng chiêu này được!`;
    if (!c.no && !co) return `${name} phải đang ${(statusName(c.id) || c.id).toLowerCase()} mới dùng được chiêu này!`;
  }
  return null;
}

// Nhãn ngắn cho nút bấm: vì sao chiêu này đang bị chặn.
export function condTag(mon, mv) {
  for (const c of mv?.cond || []) {
    if (c.t !== 'status') continue;
    const co = mon.status === c.id;
    if (c.no && co) return `Đang ${statusName(c.id)}`;
    if (!c.no && !co) return `Cần ${statusName(c.id)}`;
  }
  return null;
}

// Chuỗi trạng thái: dùng chiêu (hoặc dùng đồ) xong thì trạng thái đang mang
// chuyển sang trạng thái khác — dồn lực → tích lực → kiệt sức.
// Bản gốc (combat/session.py apply_technique) chạy chiêu TRƯỚC rồi mới đẩy
// trạng thái đi tiếp, nên chính đòn vừa đánh vẫn ăn hệ số của trạng thái cũ:
//   lượt 1 bấm chiêu dồn lực   -> mang "Đang dồn lực"
//   lượt 2 đánh bình thường    -> đánh xong đổi thành "Tích lực"
//   lượt 3 đánh với chỉ số x2  -> đánh xong đổi thành "Kiệt sức"
//   lượt 4 trở đi đánh với x0.5 cho tới khi giải trạng thái
// Trả về id trạng thái mới, hoặc null nếu không đổi gì.
export function chainStatus(mon, kieu = 'tech') {
  const s = def(mon.status);
  const tiep = s && (kieu === 'item' ? s.onItem : s.onTech);
  if (!tiep || !STATUSES[tiep]) return null;
  // Bản gốc xoá trạng thái cũ trước rồi mới gán, nên luật "món tốt không đẩy
  // được món xấu" không chắn đường ở đây.
  cureStatus(mon);
  applyStatus(mon, tiep);
  return mon.status === tiep ? tiep : null;
}

export const isLocked = (mon) => def(mon.status)?.kind === 'lockdown';
export const cantHeal = (mon) => def(mon.status)?.kind === 'festering';

// Đòn dội lại khi bị đánh trúng — bốn trạng thái cùng một kiểu tính:
// prickly / spiky (gai), feedback (phản đòn), elementalshield (khiên nguyên tố).
// Bản gốc: máu_tối_đa_của_người_dính / divisor, chỉ dội với đúng tầm đánh ghi kèm.
const THORN = new Set(['prickly', 'spiky', 'feedback', 'elemental_shield']);

export function thornDamage(target, attacker, range) {
  const s = def(target.status);
  if (!s || !THORN.has(s.kind)) return 0;
  const list = String(s.p?.[1] || '').split(':').filter(Boolean);
  if (list.length && !list.includes(range)) return 0;
  return Math.max(1, Math.floor(maxHp(attacker) / so(s.p?.[0], 8)));
}

// Đáp trả / báo thù: giáng lại ĐÚNG số sát thương vừa ăn. 'revenge' còn hút
// luôn chỗ đó thành máu cho mình. Không ăn với chiêu tầm 'reliable'.
// Trả về { dmg, hut } — 0 nghĩa là trạng thái không kích hoạt.
export function counterDamage(target, range, dmg) {
  const s = def(target.status);
  if (!s || (s.kind !== 'retaliate' && s.kind !== 'revenge')) return null;
  if (range === 'reliable' || dmg <= 0) return null;
  return { dmg, hut: s.kind === 'revenge' };
}

// Dính lao: rút lui khỏi sân là mất một phần máu
export function swapDamage(mon) {
  const s = def(mon.status);
  if (s?.kind !== 'harpooned') return 0;
  return Math.max(1, Math.floor(maxHp(mon) / so(s.p?.[0], 8)));
}

// Hoang dại: có xác suất phát cuồng, bỏ lượt và tự cắn mình một miếng
export function wildRampage(mon) {
  const s = def(mon.status);
  if (s?.kind !== 'wild') return 0;
  if (!rng.roll(so(s.p?.[0], 0.25))) return 0;
  return Math.max(1, Math.floor(maxHp(mon) / so(s.p?.[1], 8)));
}

// Lì đòn: một lần chịu đòn chí tử vẫn còn 1 máu
export function survives(mon) {
  const s = def(mon.status);
  if (s?.kind !== 'diehard') return false;
  if ((mon.statusUsed || 0) >= so(s.p?.[0], 1)) return false;
  mon.statusUsed = (mon.statusUsed || 0) + 1;
  mon.hpCur = 1;
  return true;
}

// Cuối lượt: mất/hồi máu theo trạng thái. Trả { dmg, heal, msg|null }
// Hệ số nhân sát thương của trạng thái theo HỆ của con đang dính. Bản gốc
// (modifiers.get_multiplier) gom mọi modifier khớp rồi lấy theo chế độ ghi ở
// tham số thứ hai — cả bảng chỉ dùng 'weakest', tức lấy số nhỏ nhất; không có
// modifier nào khớp thì bằng 1. Bỏng: hệ Lửa miễn nhiễm, hệ Băng cháy gấp đôi.
function heSoTrangThai(mon, s) {
  if (!s.tmod) return 1;
  const che = String(s.p?.[1] || 'weakest');
  const co = typesOf(mon).filter(t => s.tmod[t] !== undefined).map(t => s.tmod[t]);
  if (!co.length) return 1;
  if (che === 'strongest') return Math.max(...co);
  if (che === 'first') return co[0];
  if (che === 'average') return co.reduce((a, b) => a + b, 0) / co.length;
  if (che === 'cumulative') return co.reduce((a, b) => a * b, 1);
  return Math.min(...co);
}

// Số máu chuyển giữa hai con — formula.calculate_hp_transfer.
// nhan = con NHẬN máu, cho = con MẤT máu.
function chuyenMau(nhan, cho, uoc) {
  return Math.max(0, Math.min(Math.floor(maxHp(cho) / so(uoc, 16)), cho.hpCur,
    maxHp(nhan) - nhan.hpCur));
}

// linked = con đã gây ra trạng thái này (trạng thái có link: true nối máu hai
// bên). Trả thêm toLinked = số máu cộng/trừ cho con kia.
export function endOfTurn(mon, name, linked = null) {
  const s = def(mon.status);
  if (!s) return { dmg: 0, heal: 0, msg: null };
  const max = maxHp(mon);
  const he = heSoTrangThai(mon, s);
  // Hệ số 0 = miễn nhiễm: bản gốc trừ ra 0 máu rồi gỡ luôn trạng thái
  if (he === 0) {
    cureStatus(mon);
    return { dmg: 0, heal: 0, msg: `${name} miễn nhiễm, trạng thái tan biến.` };
  }
  const phan = (mac) => Math.max(1, Math.floor(max / so(s.p?.[0], mac) * he));

  // Hút máu / ban sinh lực nối hai con với nhau: máu rút khỏi bên này thì chảy
  // thẳng sang bên kia (core/effects/lifeleech.py, lifegift.py). Bên kia gục
  // rồi thì trạng thái tan luôn.
  if (s.kind === 'lifeleech' || s.kind === 'lifegift') {
    if (!linked || linked.hpCur <= 0) { cureStatus(mon); return { dmg: 0, heal: 0, msg: null }; }
    if (s.kind === 'lifeleech') {
      const d = chuyenMau(linked, mon, s.p?.[0]);
      if (d <= 0) return { dmg: 0, heal: 0, msg: null };
      mon.hpCur = Math.max(0, mon.hpCur - d);
      return { dmg: d, heal: 0, toLinked: d, msg: `${name} bị hút mất sinh lực!` };
    }
    if (cantHeal(mon)) return { dmg: 0, heal: 0, msg: null };
    const d = chuyenMau(mon, linked, s.p?.[0]);
    if (d <= 0) return { dmg: 0, heal: 0, msg: null };
    mon.hpCur = Math.min(max, mon.hpCur + d);
    return { dmg: 0, heal: d, toLinked: -d, msg: `${name} được truyền sinh lực!` };
  }

  if (s.kind === 'burnt' || s.kind === 'poisoned') {
    const d = phan(8);
    mon.hpCur = Math.max(0, mon.hpCur - d);
    return { dmg: d, heal: 0,
      msg: s.kind === 'burnt' ? `${name} bị vết bỏng hành hạ!` : `${name} bị chất độc hành hạ!` };
  }
  if (s.kind === 'wasting') {
    // Bản gốc càng để lâu càng nặng
    mon.statusUsed = (mon.statusUsed || 0) + 1;
    const d = Math.max(1, Math.floor(max / so(s.p?.[0], 16) * he) * mon.statusUsed);
    mon.hpCur = Math.max(0, mon.hpCur - d);
    return { dmg: d, heal: 0, msg: `${name} đang suy kiệt dần!` };
  }
  if (s.kind === 'recover') {
    if (cantHeal(mon)) return { dmg: 0, heal: 0, msg: null };
    const truoc = mon.hpCur;
    mon.hpCur = Math.min(max, mon.hpCur + phan(16));
    return { dmg: 0, heal: mon.hpCur - truoc, msg: `${name} hồi lại một chút sinh lực.` };
  }
  return { dmg: 0, heal: 0, msg: null };
}

export const speedMult = (mon) => statMult(mon, 'speed');

export function catchBonus(mon) {
  const s = def(mon.status);
  if (!s) return 1;
  if (s.kind === 'noddingoff' || s.kind === 'stuck' || s.kind === 'grabbed') return 2.5;
  return s.cat === 'negative' ? 1.5 : 1;
}

// Hết trận: chỉ trạng thái bản gốc đánh dấu "còn sau trận" mới giữ lại
export function afterBattle(mon) {
  delete mon.outOfRange;   // dấu "đang khuất" của chiêu lặn xuống, chỉ có trong trận
  const s = def(mon.status);
  if (s && !s.keep) cureStatus(mon);
}
