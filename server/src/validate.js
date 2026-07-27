// PokeWorld server | src/validate.js | Kiểm tra save từ client (chống sửa dữ liệu thô)
// Nguyên tắc: KHÔNG từ chối cứng (tránh làm mất tiến trình người chơi thật) —
// kẹp giá trị về mức hợp lệ và trả về cảnh báo để ghi log/admin xem.

const MONEY_CAP = 9999999;
const MAX_LEVEL = 100;
const MAX_DEX = 151;
const PARTY_MAX = 6;
const BOX_MAX = 60;
const IV_MAX = 31;
const EV_STAT_CAP = 252;
const ITEM_QTY_CAP = 999;

const clamp = (x, a, b) => Math.max(a, Math.min(b, Number.isFinite(x) ? x : a));

function cleanMon(mon, warn, where) {
  if (!mon || typeof mon !== 'object') return null;
  const sp = Math.round(Number(mon.sp));
  if (!(sp >= 1 && sp <= MAX_DEX)) { warn(`${where}: species ${mon.sp} không hợp lệ — bỏ`); return null; }
  const lv = clamp(Math.round(Number(mon.lv)), 1, MAX_LEVEL);
  if (lv !== mon.lv) warn(`${where}: level ${mon.lv} -> ${lv}`);

  const iv = Array.isArray(mon.iv) && mon.iv.length === 6
    ? mon.iv.map(v => clamp(Math.round(Number(v)), 0, IV_MAX))
    : [0, 0, 0, 0, 0, 0];
  const ev = Array.isArray(mon.ev) && mon.ev.length === 6
    ? mon.ev.map(v => clamp(Math.round(Number(v)), 0, EV_STAT_CAP))
    : [0, 0, 0, 0, 0, 0];

  const moves = Array.isArray(mon.moves)
    ? mon.moves.slice(0, 4).filter(m => m && typeof m.id === 'string').map(m => ({
        id: m.id.slice(0, 40),
        pp: clamp(Math.round(Number(m.pp)), 0, 64),
      }))
    : [];

  return {
    ...mon,
    sp, lv, iv, ev, moves,
    exp: clamp(Math.round(Number(mon.exp) || 0), 0, 2000000),
    hpCur: clamp(Math.round(Number(mon.hpCur) || 0), 0, 9999),
    friendship: clamp(Math.round(Number(mon.friendship) || 0), 0, 255),
    nick: typeof mon.nick === 'string' ? mon.nick.slice(0, 12) : null,
    shiny: !!mon.shiny,
  };
}

// Trả về { save, warnings }
export function validateSave(raw) {
  const warnings = [];
  const warn = m => warnings.push(m);
  if (!raw || typeof raw !== 'object') return { save: null, warnings: ['save không phải object'] };

  const save = { ...raw };

  // Tiền
  const money = clamp(Math.round(Number(save.money) || 0), 0, MONEY_CAP);
  if (money !== save.money) warn(`money ${save.money} -> ${money}`);
  save.money = money;

  // Đội hình & box
  save.party = (Array.isArray(save.party) ? save.party : [])
    .slice(0, PARTY_MAX).map((m, i) => cleanMon(m, warn, `party[${i}]`)).filter(Boolean);
  save.box = (Array.isArray(save.box) ? save.box : [])
    .slice(0, BOX_MAX).map((m, i) => cleanMon(m, warn, `box[${i}]`)).filter(Boolean);

  // Túi đồ
  const bag = {};
  for (const [id, n] of Object.entries(save.bag || {})) {
    if (typeof id !== 'string' || id.length > 40) { warn(`item id lạ: ${id}`); continue; }
    const q = clamp(Math.round(Number(n) || 0), 0, ITEM_QTY_CAP);
    if (q > 0) bag[id] = q;
  }
  save.bag = bag;

  // Huy hiệu
  save.badges = Array.isArray(save.badges)
    ? [...new Set(save.badges.filter(b => typeof b === 'string' && b.length < 40))].slice(0, 16)
    : [];

  // Pokédex
  const cleanDexMap = (obj) => {
    const out = {};
    for (const k of Object.keys(obj || {})) {
      const n = Number(k);
      if (n >= 1 && n <= MAX_DEX) out[n] = true;
    }
    return out;
  };
  save.dex = {
    seen: cleanDexMap(save.dex?.seen),
    caught: cleanDexMap(save.dex?.caught),
  };

  // Tên hiển thị
  if (typeof save.name === 'string') save.name = save.name.slice(0, 16);

  return { save, warnings };
}
