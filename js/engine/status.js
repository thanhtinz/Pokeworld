// TuxeWorld H5 | engine/status.js | Trạng thái — CHẠY THEO BẢNG CỦA TUXEMON
//
// Bảng js/data/statuses.js sinh thẳng từ db/status của bản gốc: mỗi trạng thái
// có loại tác động (kind), tham số (p), hệ số nhân chỉ số (mods) và hệ miễn
// nhiễm. Mỗi con mang một trạng thái tại một thời điểm; món tốt không đẩy được
// món xấu ra và ngược lại.
import { rng } from '../util.js';
import { SPECIES } from '../data/species.js';
import { STATUSES, statusName } from '../data/statuses.js';
import { maxHp, typesOf } from './monster.js';

export { statusName };
export const STATUS_NAMES = Object.fromEntries(
  Object.entries(STATUSES).map(([id, s]) => [id, s.name]));

const def = (id) => STATUSES[id] || null;
const so = (v, mac) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : mac; };

export function applyStatus(mon, id) {
  const s = def(id);
  if (!s) return false;
  const spec = { types: typesOf(mon) };
  if ((s.immune || []).some(t => (spec?.types || []).includes(t))) return false;
  const cu = def(mon.status);
  if (cu && cu.cat !== s.cat) return false;
  if (mon.status === id) return false;
  mon.status = id;
  mon.statusTurns = s.kind === 'noddingoff' ? rng.int(1, 3) : 0;
  mon.statusUsed = 0;
  return true;
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

  if (s.kind === 'noddingoff') {
    mon.statusTurns = (mon.statusTurns || 1) - 1;
    if (mon.statusTurns <= 0) { cureStatus(mon); return [true, `${name} tỉnh ngủ!`]; }
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
export function endOfTurn(mon, name) {
  const s = def(mon.status);
  if (!s) return { dmg: 0, heal: 0, msg: null };
  const max = maxHp(mon);
  const phan = (mac) => Math.max(1, Math.floor(max / so(s.p?.[0], mac)));

  if (s.kind === 'burnt' || s.kind === 'poisoned' || s.kind === 'lifeleech') {
    const d = phan(s.kind === 'lifeleech' ? 16 : 8);
    mon.hpCur = Math.max(0, mon.hpCur - d);
    const msg = s.kind === 'burnt' ? `${name} bị vết bỏng hành hạ!`
      : s.kind === 'poisoned' ? `${name} bị chất độc hành hạ!`
        : `${name} bị hút mất sinh lực!`;
    return { dmg: d, heal: 0, msg };
  }
  if (s.kind === 'wasting') {
    // Bản gốc càng để lâu càng nặng
    mon.statusUsed = (mon.statusUsed || 0) + 1;
    const d = Math.max(1, Math.floor(max / so(s.p?.[0], 16)) * mon.statusUsed);
    mon.hpCur = Math.max(0, mon.hpCur - d);
    return { dmg: d, heal: 0, msg: `${name} đang suy kiệt dần!` };
  }
  if (s.kind === 'recover' || s.kind === 'lifegift') {
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
  const s = def(mon.status);
  if (s && !s.keep) cureStatus(mon);
}
