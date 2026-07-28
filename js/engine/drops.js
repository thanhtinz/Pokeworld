// TuxeWorld H5 | engine/drops.js | Đánh Tuxemon hoang thì rơi nguyên liệu
//
// Nguyên liệu nấu ăn bên bản gốc không bán ở đâu, không rơi ở đâu — cả màn Chế
// Tạo chỉ để ngắm. Nay tiệm tạp hoá bán mấy thứ cơ bản, còn thứ quý thì phải
// đi đánh: thắng một con hoang là có cửa nhặt được một món hợp với HỆ của nó.
//
// Chỉ rơi ở trận HOANG. Đấu huấn luyện viên thì đã có tiền thưởng rồi, cho rơi
// nữa là cày trainer sướng hơn đi bụi cỏ, hỏng nhịp chơi.
import { ROI_THEO_HE, TI_LE_ROI } from '../data/drops.js';
import { ITEMS } from '../data/items.js';
import { rng } from '../util.js';
import { typesOf } from './monster.js';

/**
 * Bốc một nguyên liệu rơi ra từ con vừa thắng.
 * @param {object} mon con Tuxemon hoang vừa gục
 * @returns {{id:string,n:number}|null}
 */
export function boc(mon) {
  if (!mon) return null;
  if (!rng.roll(TI_LE_ROI)) return null;
  // Con hai hệ thì gộp cả hai bảng lại — dễ ra đồ hơn một chút, coi như phần
  // thưởng cho việc đi tìm con hiếm.
  const bang = [];
  for (const he of typesOf(mon)) {
    for (const d of ROI_THEO_HE[he] || []) {
      if (ITEMS[d.id]) bang.push(d);
    }
  }
  if (!bang.length) return null;
  const tong = bang.reduce((s, d) => s + d.w, 0);
  let r = rng.float() * tong;
  for (const d of bang) {
    r -= d.w;
    if (r <= 0) return { id: d.id, n: 1 };
  }
  return { id: bang[bang.length - 1].id, n: 1 };
}
