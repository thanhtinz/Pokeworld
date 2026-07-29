// TuxeWorld H5 | data/nongtraimap.js | TỰ SINH TỪ tools/nongtrai.py, đừng sửa tay
// Toạ độ trên bản đồ nông trại, sinh cùng lúc với chính bản đồ nên không
// bao giờ lệch khỏi nền đất đã kẻ sẵn.

export const NONG_TRAI_MAP = "nong_trai";
export const CONG_RA = { x: 14, y: 10 };
// Nông trại là một DẢI NGANG: đúng một lối đi chạy suốt từ tây sang
// đông, bốn khu kê ngay trên dải đó.
export const LOI_NGANG = [9, 10];
// Bác Nông đứng trước cửa nhà kho: chợ, đơn hàng và kho nông sản đều ở đó.
export const BAC_NONG = { x: 25, y: 9 };
export const AO_CA = { x0: 17, y0: 4, x1: 21, y1: 8 };
// Nhà kho. Ảnh nằm ở assets/nt/nha/nha_nong.png chứ không ở tileset,
// nên bản đồ chỉ đánh dấu chặn đường, còn phần vẽ do js/ui/world.js lo.
export const NHA_KHO = { x: 23, y: 4, w: 5, h: 5 };
// Chỗ dựng nhà của người chơi trên nông trại — vùng 3x3 y hệt lô đất
// bên Khu Dân Cư, ô cửa nằm giữa hàng dưới cùng. Nông trại là SÂN SAU
// của căn nhà đó: bước ra cửa sau trong nhà là ra thẳng ngoài ruộng.
export const NHA_SAU = { x: 2, y: 5 };

// Vùng kê được vật thể nông trại — ngoài vùng này là lối đi, ao, viền cây.
export const VUNG = { x0: 2, y0: 3, x1: 27, y1: 11 };

// Bố cục mặc định của nông trại mới. Người chơi đổi lại được hết.
export const MAC_DINH = [
  { id: "ruong", x: 6, y: 5 },
  { id: "ruong", x: 7, y: 5 },
  { id: "ruong", x: 8, y: 5 },
  { id: "ruong", x: 9, y: 5 },
  { id: "ruong", x: 6, y: 6 },
  { id: "ruong", x: 7, y: 6 },
  { id: "ruong", x: 8, y: 6 },
  { id: "ruong", x: 9, y: 6 },
  { id: "ruong", x: 6, y: 7 },
  { id: "ruong", x: 7, y: 7 },
  { id: "ruong", x: 8, y: 7 },
  { id: "ruong", x: 9, y: 7 },
  { id: "chuong_ga", x: 12, y: 4 },
];

// Ô KHÔNG kê được dù nằm trong vùng: lối đi, mặt nước, nhà kho, chỗ người
// làm việc đứng. Kê ruộng đè lên đường thì đi không lọt, mà kê đè lên NPC
// thì bấm A ra câu thoại chứ không ra ruộng.
export const CAM = new Set(["2,5", "2,6", "2,7", "2,8", "2,9", "2,10", "3,5", "3,6", "3,7", "3,8", "3,9", "3,10", "4,5", "4,6", "4,7", "4,8", "4,9", "4,10", "5,9", "5,10", "6,9", "6,10", "7,9", "7,10", "8,9", "8,10", "9,9", "9,10", "10,9", "10,10", "11,9", "11,10", "12,9", "12,10", "13,9", "13,10", "14,9", "14,10", "15,9", "15,10", "16,9", "16,10", "17,4", "17,5", "17,6", "17,7", "17,8", "17,9", "17,10", "18,4", "18,5", "18,6", "18,7", "18,8", "18,9", "18,10", "19,4", "19,5", "19,6", "19,7", "19,8", "19,9", "19,10", "20,4", "20,5", "20,6", "20,7", "20,8", "20,9", "20,10", "21,4", "21,5", "21,6", "21,7", "21,8", "21,9", "21,10", "22,9", "22,10", "23,4", "23,5", "23,6", "23,7", "23,8", "23,9", "23,10", "24,4", "24,5", "24,6", "24,7", "24,8", "24,9", "24,10", "25,4", "25,5", "25,6", "25,7", "25,8", "25,9", "25,10", "26,4", "26,5", "26,6", "26,7", "26,8", "26,9", "26,10", "27,4", "27,5", "27,6", "27,7", "27,8", "27,9", "27,10"]);

