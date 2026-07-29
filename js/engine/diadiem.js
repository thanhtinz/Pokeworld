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
import { NONG_TRAI_MAP, CONG_RA as CONG_NONG_TRAI } from '../data/nongtraimap.js';
import { KHU_DAT_MAP, CONG_RA as CONG_KHU_DAT } from '../data/khudancu.js';
import { nhaXong } from './estate.js';

export const DIA_DIEM = [
  { id: 'nha_nguyen', ten: 'Nhà Nguyện',
    mo: 'Chỗ làm lễ cưới. Ghế dài, cửa kính màu, tượng rồng đá hai bên.' },
  { id: 'sanh_bang', ten: 'Sảnh Bang Hội',
    mo: 'Đại sảnh của bang: bảng nhiệm vụ, cờ hiệu và bộ xương rồng giữa nhà.' },
  { id: 'den_do_nat', ten: 'Đền Đổ Nát',
    mo: 'Đền hoang giữa rừng, đá lở khắp nơi. Nghe đồn có thứ ngủ dưới đó.' },
  { id: 'sanh_bac', ten: 'Sảnh Bạc Kim Long',
    mo: 'Máy quay, bàn xì dách, bàn tiến lên. Đứng trước máy nào bấm A chơi máy đó.' },
];

export const DIA_DIEM_BY_ID = Object.fromEntries(DIA_DIEM.map(d => [d.id, d]));

// ==== Đi nhanh ====
// Khác bốn chỗ trên: đây là bản đồ NỐI THẲNG vào lưới đường, đi bộ tới được.
// Chỉ là đường bộ hơi xa (Khu Dân Cư -> nhà mình -> cửa sau) nên cho một lối
// tắt. Không gộp chung DIA_DIEM vì `dangOChoi()` dùng bảng đó để biết lúc mở
// game lên có nên kéo người chơi về giường không — nông trại thì nên kéo.
export const DIEM_NHANH = [
  // Nông trại là SÂN SAU của căn nhà, nên chưa xây nhà thì nó chưa tồn tại với
  // người chơi: `hien` bắt điều đó, màn Địa Điểm lọc theo. Bỏ qua bước này thì
  // đi nhanh vào được một mảnh đất chẳng có gì, mà cửa sau cũng chưa có nên
  // đường ra duy nhất là cổng bộ — vào trước khi đáng lẽ được vào.
  { id: NONG_TRAI_MAP, ten: 'Nông Trại Bờ Suối',
    mo: 'Sân sau nhà bạn: ruộng, hồ cá, chuồng thú và nhà kho.',
    hien: () => nhaXong(),
    cho: { x: CONG_NONG_TRAI.x, y: CONG_NONG_TRAI.y - 1 } },
  { id: KHU_DAT_MAP, ten: 'Khu Dân Cư Taba',
    mo: 'Khu đất ở đã chia lô. Nhà của bạn dựng ở đây.',
    cho: { x: CONG_KHU_DAT.x, y: CONG_KHU_DAT.y - 1 } },
];

/**
 * Đi nhanh tới một bản đồ trong DIEM_NHANH. Trả [{map,x,y}, lỗi].
 *
 * Đặt chân ở ô đã ghi sẵn chứ không dò cổng như `vaoDiaDiem`: nông trại có
 * nhiều cổng (cổng bộ ở cạnh nam, cửa sau nhà người chơi cắm động lúc vào nhà),
 * dò cổng đầu tiên thì đi nhanh xong rơi vào đâu tuỳ lúc.
 */
export function diNhanh(id) {
  const d = DIEM_NHANH.find(x => x.id === id);
  const m = d && MAPS[id];
  if (!m) return [null, 'Chỗ này chưa dựng xong.'];
  if (d.hien && !d.hien()) return [null, 'Chưa tới lúc đi được chỗ này.'];
  return [{ map: id, x: d.cho.x, y: d.cho.y }, null];
}

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
