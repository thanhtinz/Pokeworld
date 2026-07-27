// TuxeWorld H5 | data/arenas.js | Nền trận đấu theo khu vực
// Nền lấy từ Tuxemon (gfx/ui/combat), ghép lại cho khung dọc bằng
// tools/mkarena.py. Không có bệ đứng — Tuxemon đứng thẳng trên nền, giao diện
// chỉ vẽ thêm một vệt bóng mềm dưới chân.
import { absUrl } from '../util.js';

export const ARENAS = {
  taba_town: 'town',
  pc_town: 'town',
  mart_town: 'town',
  pc_lake: 'town',
  route1: 'grass',
  route1_sanglorian: 'tall_grass',
  dryadsgrove: 'forest',
  cotton_town: 'cave',
  cotton_town: 'lake',
  route1_sanglorian: 'grass',
  dryadsgrove: 'tall_grass',
  cotton_town: 'town',
  pc_town2: 'town',
  mart_town2: 'town',
  leather_town: 'beach',
  leather_town: 'cave',
};

export const DEFAULT_ARENA = 'grass';

// Trả về ba đường dẫn ảnh cho một khu vực.
// Dùng đường dẫn tuyệt đối vì mấy ảnh này đi vào biến CSS.
export function arenaFor(zoneId) {
  const a = ARENAS[zoneId] || DEFAULT_ARENA;
  return {
    name: a,
    bg: absUrl(`assets/arena/${a}_bg.png`),
  };
}
