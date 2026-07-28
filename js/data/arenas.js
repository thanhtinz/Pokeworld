// TuxeWorld H5 | data/arenas.js | Nền trận đấu theo môi trường
// TỰ SINH TỪ tools/mkarena.py — nguồn db/environment của Tuxemon.
// Đừng sửa tay.
//
// Mỗi bản đồ mang sẵn hai mã môi trường (env ban ngày, envNight ban
// đêm) do tools/mktmx.py đọc từ lệnh set_environment của bản gốc.
import { absUrl } from '../util.js';
import { MAPS } from './maps.js';
import { isDaytime } from '../engine/daytime.js';

// Danh sách môi trường có sẵn ảnh nền
export const ARENAS = ['37707', 'arid', 'beach', 'bridge', 'canyon', 'cave', 'cavern', 'cliff', 'clouds', 'desert', 'forest', 'grass', 'interior', 'night_arid', 'night_beach', 'night_bridge', 'night_canyon', 'night_cliff', 'night_desert', 'night_forest', 'night_grass', 'night_ocean', 'night_park', 'night_plain', 'night_sand', 'night_sea', 'night_snow', 'night_snowplain', 'night_valley', 'ocean', 'park', 'plain', 'sand', 'sea', 'snow', 'snowplain', 'stadium', 'sunset', 'underwater', 'valley'];

export const DEFAULT_ARENA = 'grass';

// Nền của một bản đồ. Trời tối thì lấy cảnh đêm; môi trường nào không
// có cảnh đêm riêng (trong nhà) thì vẫn dùng cảnh thường.
export function arenaFor(mapId) {
  const mp = MAPS[mapId];
  let a = mp ? (isDaytime() ? mp.env : mp.envNight) : DEFAULT_ARENA;
  if (!ARENAS.includes(a)) a = mp && ARENAS.includes(mp.env) ? mp.env : DEFAULT_ARENA;
  return { name: a, bg: absUrl(`assets/arena/${a}_bg.png`) };
}
