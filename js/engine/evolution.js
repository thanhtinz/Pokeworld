// TuxeWorld H5 | engine/evolution.js | Kiểm tra + thực thi tiến hóa
import { rng } from '../util.js';
import { SPECIES } from '../data/species.js';
import { EVOLUTIONS } from '../data/evolutions.js';
import { maxHp, stats, typesOf } from './monster.js';

// Kiểm tra điều kiện tiến hoá theo đúng bảng của bản gốc (js/data/evolutions.js).
// trigger: 'level' sau khi lên cấp | 'stone' khi dùng vật phẩm (arg = mã món)
// Điều kiện có thể gộp nhiều thứ: cấp + giới tính, cấp + so sánh chỉ số...
// ctx = { party: [...con trong đội], inside: đang ở trong nhà } — vài đường
// tiến hoá của bản gốc nhìn ra ngoài bản thân con vật.
export function checkEvolution(mon, trigger, arg, ctx = {}) {
  const ways = EVOLUTIONS[mon.sp];
  if (!ways) return null;
  const list = Array.isArray(ways) ? ways : [ways];
  for (const e of list) {
    if (!SPECIES[e.into]) continue;
    // Đường nào cần vật phẩm thì chỉ xét khi đang dùng đúng món đó
    if (e.item) {
      if (trigger !== 'stone' || !e.item.includes(arg)) continue;
    } else if (trigger === 'stone') {
      continue;
    }
    if (e.level && mon.lv < e.level) continue;
    if (e.gender && mon.gender !== e.gender) continue;
    if (e.bond && (mon.bond || 0) < e.bond) continue;
    if (e.stat) {
      const st = stats(mon);
      if (!(st[e.stat[0]] > st[e.stat[1]])) continue;
    }
    if (e.tech && !(mon.moves || []).some(mv => mv.id === e.tech)) continue;
    if (e.tasteWarm && mon.tasteWarm !== e.tasteWarm) continue;
    if (e.tasteCold && mon.tasteCold !== e.tasteCold) continue;
    // Hệ ĐANG mang, không phải hệ gốc — vài chiêu đổi hệ ngay giữa trận
    if (e.element && !typesOf(mon).includes(e.element)) continue;
    if (e.inside !== undefined && !!ctx.inside !== e.inside) continue;
    // Trong đội phải có đủ số con của loài kia
    if (e.party) {
      const doi = ctx.party || [];
      const du = e.party.every(([sp, n]) => doi.filter(x => x && x.sp === sp).length >= n);
      if (!du) continue;
    }
    return e.into;
  }
  return null;
}

// Thực thi tiến hoá: đổi loài, giữ nguyên IV/TP/khẩu vị/biệt danh, HP giữ theo
// tỉ lệ. Tuxemon không có "đặc tính" nên tiến hoá không đổi gì thêm; chỉ số cũng
// KHÔNG tự vọt lên vì mọi dáng thân đều mạnh ngang nhau — cái được là bộ chiêu
// mới và (thường) dáng thân khác.
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
  return true;
}
