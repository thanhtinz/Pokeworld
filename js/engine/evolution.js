// TuxeWorld H5 | engine/evolution.js | Kiểm tra + thực thi tiến hóa
import { rng } from '../util.js';
import { SPECIES } from '../data/species.js';
import { EVOLUTIONS } from '../data/evolutions.js';
import { maxHp } from './pokemon.js';

// Kiểm tra điều kiện tiến hóa của mon theo trigger.
// trigger: 'level' (sau khi lên level) | 'stone' (arg = itemId) | 'friendship'
// Trả về dex mới nếu đủ điều kiện, null nếu không.
export function checkEvolution(mon, trigger, arg) {
  const def = EVOLUTIONS[mon.sp];
  if (!def) return null;
  // Hỗ trợ cả 1 entry lẫn mảng nhiều lựa chọn (kiểu Eevee)
  const options = def.into ? [def] : def;
  for (const e of options) {
    if (e.method === 'level' && trigger === 'level' && mon.lv >= (e.level ?? 999)) {
      return e.into;
    }
    if (e.method === 'stone' && trigger === 'stone' && arg === e.item) {
      return e.into;
    }
    if (e.method === 'friendship' && (trigger === 'friendship' || trigger === 'level')
        && (mon.friendship || 0) >= (e.min ?? 220)) {
      return e.into;
    }
  }
  return null;
}

// Thực thi tiến hóa: đổi species, giữ IV/EV/nature/nick, tính lại HP theo tỉ lệ.
// Ability random lại nếu không thuộc loài mới. Trả về true nếu thành công.
export function evolve(mon, newDex) {
  const newSpec = SPECIES[newDex];
  if (!newSpec) {
    console.warn(`evolve: species ${newDex} không tồn tại`);
    return false;
  }
  const oldMax = maxHp(mon);
  const hpFrac = oldMax > 0 ? mon.hpCur / oldMax : 1;
  mon.sp = newDex;
  const newMax = maxHp(mon);
  mon.hpCur = Math.max(1, Math.floor(newMax * hpFrac));
  // Ability: nếu ability cũ không thuộc loài mới thì random lại từ loài mới
  const keep = (newSpec.abilities || []).includes(mon.ability);
  if (!keep) {
    mon.ability = rng.pick(newSpec.abilities || []) || mon.ability;
  }
  return true;
}
