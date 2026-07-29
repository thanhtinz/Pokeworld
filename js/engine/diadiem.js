// TuxeWorld H5 | engine/diadiem.js | Ghé mấy địa điểm dựng từ pack CraftPix
//
// Bốn chỗ này (Nhà Nguyện, Sảnh Bang Hội, Đền Đổ Nát, Sảnh Bạc) là bản đồ rời, không nối
// vào lưới đường của thị trấn. Ghé bằng cách CẮM TẠM một cái
// cổng đi ra ngay lúc bước vào — y như cách sang thăm nhà người khác bên
// engine/visit.js — nên đi vào kiểu gì cũng có đường ra.
//
// Không cắm cổng thì người chơi kẹt cứng trong đó: mấy bản đồ này đánh dấu là
// "trong nhà", mà trong nhà không có cổng nào thì chỉ còn nước xoá bản lưu.
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
];

export const DIA_DIEM_BY_ID = Object.fromEntries(DIA_DIEM.map(d => [d.id, d]));

let ve = null;      // chỗ quay lại: { map, x, y }

export const dangOChoi = () => !!ve;

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
 * @param {string} id mã địa điểm
 * @param {{map:string,x:number,y:number}} tuDau chỗ đang đứng, để còn quay về
 */
export function vaoDiaDiem(id, tuDau) {
  const m = MAPS[id];
  if (!DIA_DIEM_BY_ID[id] || !m) return [null, 'Chỗ này chưa dựng xong.'];
  const cua = cuaRa(m);
  if (!cua) return [null, 'Chỗ này không có lối vào.'];
  roiDiaDiem();      // trả cổng của lần ghé trước về đích gốc đã
  ve = tuDau?.map ? { map: tuDau.map, x: Math.floor(tuDau.x), y: Math.floor(tuDau.y) } : null;
  // Cổng ra đã có sẵn trong dữ liệu bản đồ (tools/craftpix.py cắm lúc dựng),
  // ở đây CHỈ đổi đích đến của nó. Cắm thêm một cổng nữa lên đúng ô đó thì
  // hai cổng chồng nhau, engine bắt trúng cái cũ và trả người chơi về Khu Dân
  // Cư chứ không về chỗ vừa đứng.
  const cong = (m.warps || []).find(w => w.x === cua.x && w.y === cua.y);
  if (cong && ve) {
    if (cong.goc === undefined) cong.goc = { to: cong.to, tx: cong.tx, ty: cong.ty };
    cong.to = ve.map;
    cong.tx = ve.x;
    cong.ty = ve.y;
  }
  const dung = choDung(m, cua);
  return [{ map: id, x: dung.x, y: dung.y }, null];
}

/** Rời địa điểm: trả cổng ra về đích gốc cho bản đồ nguyên trạng. */
export function roiDiaDiem() {
  if (!ve) return false;
  for (const d of DIA_DIEM) {
    for (const w of MAPS[d.id]?.warps || []) {
      if (w.goc) {
        Object.assign(w, w.goc);
        delete w.goc;
      }
    }
  }
  ve = null;
  return true;
}
