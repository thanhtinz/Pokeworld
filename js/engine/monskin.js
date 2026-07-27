// TuxeWorld H5 | engine/monskin.js | Ảnh Tuxemon: skin đang mặc hoặc ảnh gốc
//
// Skin do quản trị viên tải lên (kind 'monSkin', gắn với một loài qua trường
// sp). Người chơi mặc skin cho loài nào thì MỌI con thuộc loài đó đổi hình
// trong trận đấu và đội hình; Tuxedex vẫn hiện ảnh gốc để tra cứu cho đúng.
import { G } from '../state.js';
import { MON_SKINS, imgOf } from '../data/cosmetics.js';
import { monPath } from '../util.js';

// Skin đang mặc cho một loài, hoặc null
export function skinOf(dex) {
  const id = G.p?.monSkins?.[dex];
  if (!id) return null;
  const def = MON_SKINS[id];
  return def && (!def.sp || def.sp === Number(dex)) ? def : null;
}

// Ảnh của một con: có skin thì dùng skin, không thì ảnh gốc của loài
export function monImg(mon, back = false) {
  if (!mon) return '';
  const def = skinOf(mon.sp);
  const img = def && imgOf(def);
  return img || monPath(mon.sp, back);
}

// Những skin hợp với một loài (để màn Đội hình bày ra cho chọn)
export const skinsFor = (dex) =>
  Object.entries(MON_SKINS).filter(([, d]) => !d.sp || d.sp === Number(dex));
