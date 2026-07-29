// TuxeWorld H5 | data/nongtraimap.js | TỰ SINH TỪ tools/nongtrai.py, đừng sửa tay
// Toạ độ trên bản đồ nông trại, sinh cùng lúc với chính bản đồ nên không
// bao giờ lệch khỏi nền đất đã kẻ sẵn.

export const NONG_TRAI_MAP = "nong_trai";
// Chỗ đặt chân khi đi nhanh vào — ngay trước cửa nhà mình.
export const CONG_RA = { x: 3, y: 10 };
// Nông trại là một DẢI NGANG: đúng một lối đi chạy suốt từ tây sang
// đông, sáu khu kê ngay trên dải đó.
export const LOI_NGANG = [9, 10];

// Khu đất trồng: một ô quây rào, ô ruộng kê trong lòng nó.
export const KHU_TRONG = { x: 6, y: 3, w: 7, h: 6 };
export const VUNG_TRONG = { x0: 7, y0: 4, x1: 11, y1: 7 };
// Chuồng thú quây rào, kể cả hàng rào. Con vật chỉ đi trong VUNG_THU.
export const CHUONG = { x: 14, y: 3, w: 6, h: 6 };
export const VUNG_THU = { x0: 15, y0: 4, x1: 18, y1: 7 };
// Mặt nước hồ nuôi cá. Hồ hở mặt phía lối đi để buông cần được.
export const AO_CA = { x0: 21, y0: 4, x1: 26, y1: 8 };
// Hai toà nhà cố định. Ảnh nằm ở assets/nt/nha/*.png chứ không ở
// tileset, nên bản đồ chỉ đánh dấu chặn đường, phần vẽ do
// js/ui/world.js lo.
export const NHA_KHO = { x: 29, y: 4, w: 5, h: 5 };
export const NHA_BEP = { x: 35, y: 2, w: 9, h: 7 };
export const BAC_NONG = { x: 31, y: 9 };
// Chỗ dựng nhà của người chơi trên nông trại — vùng 3x3 y hệt lô đất
// bên Khu Dân Cư, ô cửa nằm giữa hàng dưới cùng. Nông trại là SÂN SAU
// của căn nhà đó: bước ra cửa sau trong nhà là ra thẳng ngoài ruộng.
export const NHA_SAU = { x: 2, y: 5 };

// Biển MUA cắm dưới lối đi, đối diện từng khu. Bấm vào là ra bảng chọn
// ngay trên bản đồ chứ không mở panel.
export const BIEN = [
  { ma: "hat", ten: "Mua Hạt Giống", x: 9, y: 11 },
  { ma: "thu", ten: "Mua Con Vật", x: 16, y: 11 },
  { ma: "can", ten: "Mua Cần Câu", x: 23, y: 11 },
];

// Vùng kê được vật thể nông trại — ngoài vùng này là lối đi, hồ, viền cây.
export const VUNG = { x0: 2, y0: 3, x1: 43, y1: 11 };

// Bố cục mặc định của nông trại mới. Người chơi đổi lại được hết.
export const MAC_DINH = [
  { id: "ruong", x: 7, y: 5 },
  { id: "ruong", x: 8, y: 5 },
  { id: "ruong", x: 9, y: 5 },
  { id: "ruong", x: 10, y: 5 },
  { id: "ruong", x: 7, y: 6 },
  { id: "ruong", x: 8, y: 6 },
  { id: "ruong", x: 9, y: 6 },
  { id: "ruong", x: 10, y: 6 },
  { id: "ruong", x: 7, y: 7 },
  { id: "ruong", x: 8, y: 7 },
  { id: "ruong", x: 9, y: 7 },
  { id: "ruong", x: 10, y: 7 },
];

// Ô KHÔNG kê được dù nằm trong vùng: lối đi, mặt nước, hàng rào, nhà,
// biển, chỗ người làm việc đứng. Kê ruộng đè lên đường thì đi không lọt,
// mà kê đè lên NPC thì bấm A ra câu thoại chứ không ra ruộng.
export const CAM = new Set(["2,5", "2,6", "2,7", "2,8", "2,9", "2,10", "3,5", "3,6", "3,7", "3,8", "3,9", "3,10", "4,5", "4,6", "4,7", "4,8", "4,9", "4,10", "5,9", "5,10", "6,3", "6,4", "6,5", "6,6", "6,7", "6,8", "6,9", "6,10", "7,3", "7,8", "7,9", "7,10", "8,3", "8,9", "8,10", "9,3", "9,9", "9,10", "9,11", "10,3", "10,8", "10,9", "10,10", "11,3", "11,8", "11,9", "11,10", "12,3", "12,4", "12,5", "12,6", "12,7", "12,8", "12,9", "12,10", "13,9", "13,10", "14,3", "14,4", "14,5", "14,6", "14,7", "14,8", "14,9", "14,10", "15,3", "15,8", "15,9", "15,10", "16,3", "16,9", "16,10", "16,11", "17,3", "17,9", "17,10", "18,3", "18,8", "18,9", "18,10", "19,3", "19,4", "19,5", "19,6", "19,7", "19,8", "19,9", "19,10", "20,3", "20,4", "20,5", "20,6", "20,7", "20,8", "20,9", "20,10", "21,3", "21,4", "21,5", "21,6", "21,7", "21,8", "21,9", "21,10", "22,3", "22,4", "22,5", "22,6", "22,7", "22,8", "22,9", "22,10", "23,3", "23,4", "23,5", "23,6", "23,7", "23,8", "23,9", "23,10", "23,11", "24,3", "24,4", "24,5", "24,6", "24,7", "24,8", "24,9", "24,10", "25,3", "25,4", "25,5", "25,6", "25,7", "25,8", "25,9", "25,10", "26,3", "26,4", "26,5", "26,6", "26,7", "26,8", "26,9", "26,10", "27,3", "27,4", "27,5", "27,6", "27,7", "27,8", "27,9", "27,10", "28,9", "28,10", "29,4", "29,5", "29,6", "29,7", "29,8", "29,9", "29,10", "30,4", "30,5", "30,6", "30,7", "30,8", "30,9", "30,10", "31,4", "31,5", "31,6", "31,7", "31,8", "31,9", "31,10", "32,4", "32,5", "32,6", "32,7", "32,8", "32,9", "32,10", "33,4", "33,5", "33,6", "33,7", "33,8", "33,9", "33,10", "34,9", "34,10", "35,3", "35,4", "35,5", "35,6", "35,7", "35,8", "35,9", "35,10", "36,3", "36,4", "36,5", "36,6", "36,7", "36,8", "36,9", "36,10", "37,3", "37,4", "37,5", "37,6", "37,7", "37,8", "37,9", "37,10", "38,3", "38,4", "38,5", "38,6", "38,7", "38,8", "38,9", "38,10", "39,3", "39,4", "39,5", "39,6", "39,7", "39,8", "39,9", "39,10", "40,3", "40,4", "40,5", "40,6", "40,7", "40,8", "40,9", "40,10", "41,3", "41,4", "41,5", "41,6", "41,7", "41,8", "41,9", "41,10", "42,3", "42,4", "42,5", "42,6", "42,7", "42,8", "42,9", "42,10", "43,3", "43,4", "43,5", "43,6", "43,7", "43,8", "43,9", "43,10"]);

