// PokeWorld H5 | data/arenas.js | Nền trận đấu theo khu vực
// Ảnh lấy từ pokerogue-assets (images/arenas): mỗi bộ gồm nền trời-đất và
// hai cái bệ đứng — bệ của mình ở dưới trái, bệ của đối thủ ở trên phải.
import { absUrl } from '../util.js';

export const ARENAS = {
  town_1: 'town',
  pc_town: 'town',
  mart_town: 'town',
  pc_lake: 'town',
  route_1: 'grass',
  route_2: 'tall_grass',
  forest_1: 'forest',
  cave_1: 'cave',
  lake_1: 'lake',
  route_3: 'grass',
  meadow_1: 'tall_grass',
  town_2: 'town',
  pc_town2: 'town',
  mart_town2: 'town',
  beach_1: 'beach',
  cave_2: 'cave',
};

export const DEFAULT_ARENA = 'grass';

// Trả về ba đường dẫn ảnh cho một khu vực.
// Dùng đường dẫn tuyệt đối vì mấy ảnh này đi vào biến CSS.
export function arenaFor(zoneId) {
  const a = ARENAS[zoneId] || DEFAULT_ARENA;
  return {
    name: a,
    bg: absUrl(`assets/arena/${a}_bg.png`),
    foe: absUrl(`assets/arena/${a}_base_foe.png`),
    me: absUrl(`assets/arena/${a}_base_me.png`),
  };
}
