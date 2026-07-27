// TuxeWorld H5 | engine/status.js | Trạng thái Burn/Poison/Sleep/Paralyze/Freeze
import { rng } from '../util.js';
import { SPECIES } from '../data/species.js';
import { maxHp } from './pokemon.js';

// brn=bỏng, psn=độc, slp=ngủ, par=tê liệt, frz=đóng băng
export const STATUS_NAMES = {
  brn: 'Bỏng', psn: 'Trúng độc', slp: 'Ngủ', par: 'Tê liệt', frz: 'Đóng băng',
};

// Áp trạng thái. Trả về true nếu áp thành công (đang có status khác thì thất bại).
export function applyStatus(mon, id) {
  if (mon.status) return false;
  if (!STATUS_NAMES[id]) return false;
  const spec = SPECIES[mon.sp];
  // Miễn nhiễm theo hệ
  for (const t of spec.types) {
    if (id === 'brn' && t === 'fire') return false;
    if (id === 'psn' && (t === 'poison' || t === 'steel')) return false;
    if (id === 'par' && t === 'electric') return false;
    if (id === 'frz' && t === 'ice') return false;
  }
  mon.status = id;
  if (id === 'slp') {
    mon.statusTurns = rng.int(1, 3); // ngủ 1-3 lượt
  }
  return true;
}

export function cureStatus(mon) {
  mon.status = null;
  mon.statusTurns = 0;
}

// Kiểm tra có được hành động lượt này không. Trả về [ok, msg|null] (msg tiếng Việt hoàn chỉnh).
export function canAct(mon, name) {
  if (mon.status === 'slp') {
    mon.statusTurns = (mon.statusTurns || 1) - 1;
    if (mon.statusTurns <= 0) {
      cureStatus(mon);
      return [true, `${name} đã tỉnh dậy!`];
    }
    return [false, `${name} đang ngủ say...`];
  }
  if (mon.status === 'frz') {
    if (rng.roll(0.2)) { // 20% tự tan băng mỗi lượt
      cureStatus(mon);
      return [true, `${name} đã tan băng!`];
    }
    return [false, `${name} bị đóng băng cứng ngắc!`];
  }
  if (mon.status === 'par') {
    if (rng.roll(0.25)) { // 25% tê liệt không đánh được
      return [false, `${name} bị tê liệt! Không thể cử động!`];
    }
  }
  return [true, null];
}

// Damage cuối lượt do trạng thái. Trả về { dmg, msg|null }.
export function endOfTurn(mon, name) {
  const max = maxHp(mon);
  if (mon.status === 'brn') {
    const d = Math.max(1, Math.floor(max / 16));
    mon.hpCur = Math.max(0, mon.hpCur - d);
    return { dmg: d, msg: `${name} bị vết bỏng hành hạ!` };
  }
  if (mon.status === 'psn') {
    const d = Math.max(1, Math.floor(max / 8));
    mon.hpCur = Math.max(0, mon.hpCur - d);
    return { dmg: d, msg: `${name} bị chất độc hành hạ!` };
  }
  return { dmg: 0, msg: null };
}

// Modifier speed do paralyze (dùng khi xếp thứ tự lượt)
export function speedMult(mon) {
  return mon.status === 'par' ? 0.5 : 1;
}

// Modifier tỉ lệ bắt theo status (dùng trong catchmon)
export function catchBonus(mon) {
  if (mon.status === 'slp' || mon.status === 'frz') return 2.5;
  if (mon.status) return 1.5;
  return 1;
}
