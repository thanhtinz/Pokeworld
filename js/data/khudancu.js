// TuxeWorld H5 | data/khudancu.js | TỰ SINH TỪ tools/khudancu.py, đừng sửa tay
// Toạ độ các lô đất trong bản đồ khu dân cư, sinh cùng lúc với bản đồ nên
// không bao giờ lệch khỏi nền đất đã kẻ sẵn.
//
// Khu này là ĐẤT Ở THUẦN TUÝ: không hàng quán, không hồ câu. Tiệm xá
// dời hết ra Phố Kim Long, hồ câu dời lên Nông Trại — trước gom chung
// một chỗ nên đi mua đất mà cứ lẫn vào chợ búa.

export const KHU_DAT_MAP = "khu_dan_cu";
export const LOTS = [
  { id: "a1", name: "Lô A1 — Đầu ngõ", price: 20000, x: 3, y: 8 },
  { id: "b1", name: "Lô B1 — Mặt đường", price: 45000, x: 13, y: 8 },
  { id: "c1", name: "Lô C1 — Cuối ngõ", price: 80000, x: 22, y: 8 },
  { id: "a2", name: "Lô A2 — Đầu ngõ", price: 20000, x: 3, y: 17 },
  { id: "b2", name: "Lô B2 — Mặt đường", price: 45000, x: 13, y: 17 },
  { id: "c2", name: "Lô C2 — Cuối ngõ", price: 80000, x: 22, y: 17 },
];
// Ô cổng ra thị trấn — dùng để chỉ đường cho người chơi
export const CONG_RA = { x: 9, y: 25 };
// Ô cổng lên Nông Trại, ở cạnh trên bản đồ
export const CONG_BAC = { x: 9, y: 0 };

