// TuxeWorld H5 | data/bangduong.js | TỰ SINH TỪ tools/bangduong.py, đừng sửa tay
// Toạ độ trong Bang Đường. Cửa hai khu trên khoá theo CẤP BANG.

export const BANG_MAP = "bang_duong";
export const CUA_KHU = [
  { id: "san_tap", name: "Sân Tập", x: 7, y: 11, cap: 5 },
  { id: "kho_bau", name: "Kho Báu", x: 22, y: 11, cap: 10 },
];
// Ba toà nhà của bang. Ảnh do js/ui/world.js vẽ đè lên bản đồ.
export const TOA_NHA = [
  { id: "bang_sanh", name: "Sảnh Bang", x: 5, y: 18, w: 4, h: 3, cua: 7, trong: "trong_sanh" },
  { id: "bang_dien", name: "Điện Thủ Hộ", x: 5, y: 8, w: 4, h: 3, cua: 7, trong: "trong_dien" },
  { id: "bang_kho", name: "Kho Bang", x: 19, y: 8, w: 4, h: 3, cua: 21, trong: "trong_kho" },
];
// Ô cổng ra ngoài
export const CONG_RA = { x: 14, y: 23 };
