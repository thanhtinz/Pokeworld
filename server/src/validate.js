// TuxeWorld server | src/validate.js | Kiểm tra save từ client (chống sửa dữ liệu thô)
// Nguyên tắc: KHÔNG từ chối cứng (tránh làm mất tiến trình người chơi thật) —
// kẹp giá trị về mức hợp lệ và trả về cảnh báo để ghi log/admin xem.

const MONEY_CAP = 9999999;
const MAX_LEVEL = 100;
const MAX_DEX = 411;          // số loài của bản gốc Tuxemon (js/data/species.js)
const PARTY_MAX = 6;
const BOX_MAX = 60;
const IV_MAX = 15;            // Tuxemon: iv_range [0, 15]
const TP_STAT_CAP = 150;      // Tuxemon: max_tps
const TP_TOTAL_CAP = 300;     // Tuxemon: max_total_tps
const BOND_MAX = 100;
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
  // TP (điểm rèn luyện) thay cho EV: mỗi chỉ số tối đa 150, tổng tối đa 300
  let tp = Array.isArray(mon.tp) && mon.tp.length === 6
    ? mon.tp.map(v => clamp(Math.round(Number(v)), 0, TP_STAT_CAP))
    : [0, 0, 0, 0, 0, 0];
  let tong = tp.reduce((a, b) => a + b, 0);
  if (tong > TP_TOTAL_CAP) {
    warn(`${where}: tổng TP ${tong} > ${TP_TOTAL_CAP} — cắt bớt`);
    tp = tp.map(v => Math.floor(v * TP_TOTAL_CAP / tong));
  }

  // Chiêu dùng "recharge" (cd) chứ không có PP
  const moves = Array.isArray(mon.moves)
    ? mon.moves.slice(0, 4).filter(m => m && typeof m.id === 'string').map(m => ({
        id: m.id.slice(0, 40),
        cd: clamp(Math.round(Number(m.cd) || 0), 0, 32),
      }))
    : [];

  const out = {
    ...mon,
    sp, lv, iv, tp, moves,
    exp: clamp(Math.round(Number(mon.exp) || 0), 0, 2000000),
    hpCur: clamp(Math.round(Number(mon.hpCur) || 0), 0, 99999),
    bond: clamp(Math.round(Number(mon.bond) ?? 25), 0, BOND_MAX),
    nick: typeof mon.nick === 'string' ? mon.nick.slice(0, 12) : null,
    // Hoa văn hiếm — client dùng 'stars' (db/flair của Tuxemon). Bản lưu đời cũ
    // ghi cờ shiny (khái niệm của game khác) thì quy về 'stars'.
    flair: (mon.flair === 'stars' || mon.shiny) ? 'stars' : null,
  };
  // Field của schema đời cũ, bản gốc không có
  delete out.ev; delete out.nature; delete out.ability; delete out.friendship;
  delete out.shiny;
  return out;
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

  // Tuxedex
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
