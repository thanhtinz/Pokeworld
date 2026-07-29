// TuxeWorld H5 | engine/diadiem.js | Ghé mấy địa điểm dựng từ pack CraftPix
//
// Bốn chỗ này (Nhà Nguyện, Sảnh Bang Hội, Đền Đổ Nát, Sảnh Bạc) giờ có CỬA
// THẬT trên bản đồ Khu Dân Cư — mỗi chỗ một ô cửa riêng, tools/khudancu.py cắm
// lúc dựng. Vào bằng cách đi tới đó bấm A, hoặc bấm nhanh từ mục Địa Điểm.
//
// Bản trước không có cửa nào: cổng ra của cả bốn chỗ đều trỏ về MỘT ô chung ở
// giữa đồng, mà mở từ Menu thì màn này còn viết đè đích đến thành chỗ người
// chơi đang đứng lúc bấm. Ra khỏi Sảnh Bạc lúc thì ra giữa đồng, lúc thì ra
// cạnh nhà khác — chẳng bao giờ ra đúng cửa mình vừa bước vào. Giờ cổng để
// nguyên như dữ liệu, ra chỗ nào là đúng thềm chỗ đó.
import { MAPS } from '../data/maps.js';

export const DIA_DIEM = [
  { id: 'nha_nguyen', ten: 'Nhà Nguyện',
    mo: 'Chỗ làm lễ cưới. Ghế dài, cửa kính màu, tượng rồng đá hai bên.' },
  { id: 'sanh_bang', ten: 'Sảnh Bang Hội',
    mo: 'Đại sảnh của bang: bảng nhiệm vụ, cờ hiệu và bộ xương rồng giữa nhà.' },
  { id: 'den_do_nat', ten: 'Đền Đổ Nát',
    mo: 'Đền hoang giữa rừng, đá lở khắp nơi. Nghe đồn có thứ ngủ dưới đó.' },
  { id: 'sanh_bac', ten: 'Sảnh Bạc Kim Long',
    mo: 'Máy quay, bàn xì dách, bàn tiến lên. Đứng trước máy nào bấm A chơi máy đó.' },
  // Công viên không phải bản đồ đi bộ mà là một màn riêng, nên đánh dấu `man`.
  { id: 'park', ten: 'Công Viên Pepper', man: 'park',
    mo: 'Vào cổng miễn phí. Ném bóng bắt Tuxemon hiếm, không đánh nhau.' },
];

export const DIA_DIEM_BY_ID = Object.fromEntries(DIA_DIEM.map(d => [d.id, d]));

/** Có phải đang đứng trong một địa điểm rời không? */
export const dangOChoi = (mapId) => !!DIA_DIEM_BY_ID[mapId];

/**
 * Ô cửa ra của một địa điểm — ĐỌC THẲNG từ cổng mà tools/craftpix.py đã cắm
 * sẵn lúc dựng bản đồ.
 *
 * Không tự dò lại: bên generator chọn cửa trong vùng nối với chỗ đặt chân,
 * dò lại ở đây bằng cách khác là ra ô khác, rồi tìm cổng không thấy và người
 * chơi mất đường về.
 */
export function cuaRa(m) {
  const w = m?.warps?.[0];
  return w ? { x: w.x, y: w.y } : null;
}

/**
 * Chỗ đặt chân khi vừa vào: một ô KỀ ngay cửa, ưu tiên phía trong.
 *
 * Không dò thẳng lên theo cột: có bản đồ ngay trên cửa là tường, dò kiểu đó
 * thì trượt một mạch lên tận mép trên, tức là đứng ra ngoài nhà.
 */
function choDung(m, cua) {
  const trong = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h
    && !m.solid[y * m.w + x];
  for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
    const x = cua.x + dx, y = cua.y + dy;
    if (trong(x, y)) return { x, y };
  }
  return { ...cua };
}

/**
 * Vào một địa điểm. Trả [{map,x,y}, lỗi] để màn bản đồ tự enterMap.
 *
 * KHÔNG đụng gì tới cổng ra nữa: đích của nó đã là đúng thềm cửa của chính
 * chỗ này trên Khu Dân Cư (tools/mktmx.py nối lúc dựng bản đồ).
 */
export function vaoDiaDiem(id) {
  const m = MAPS[id];
  if (!DIA_DIEM_BY_ID[id] || !m) return [null, 'Chỗ này chưa dựng xong.'];
  const cua = cuaRa(m);
  if (!cua) return [null, 'Chỗ này không có lối vào.'];
  const dung = choDung(m, cua);
  return [{ map: id, x: dung.x, y: dung.y }, null];
}

/** Thềm cửa của một địa điểm trên bản đồ ngoài — chỗ bước ra sẽ đứng. */
export function themCua(id) {
  const w = (MAPS[id]?.warps || [])[0];
  return w ? { map: w.to, x: w.tx, y: w.ty } : null;
}
