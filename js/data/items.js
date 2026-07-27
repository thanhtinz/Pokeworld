// TuxeWorld H5 | data/items.js | Vật phẩm — TỰ SINH TỪ tools/mkitems.py
// Nguồn: Tuxemon (CC BY-SA 4.0). Đừng sửa tay.

// kind: 'ball' bắt | 'medicine' hồi phục | 'stone' tiến hoá | 'held' mang theo
export const ITEMS = {
  tuxeball: { name: 'Tuxeball', desc: 'Tuxeball cơ bản để bắt Tuxemon hoang.', kind: 'ball', price: 100, sell: 50, effect: { rate: 1 } },
  tuxeball_hardened: { name: 'Tuxeball Gia Cố', desc: 'Vỏ gia cố, bắt dễ hơn hẳn Tuxeball thường.', kind: 'ball', price: 350, sell: 175, effect: { rate: 1.5 } },
  tuxeball_lavish: { name: 'Tuxeball Xa Xỉ', desc: 'Tuxeball xa xỉ, tỉ lệ bắt cao.', kind: 'ball', price: 300, sell: 150, effect: { rate: 2 } },
  tuxeball_crusher: { name: 'Tuxeball Nghiền', desc: 'Càng ép yếu đối thủ thì càng dễ bắt.', kind: 'ball', price: 400, sell: 200, effect: { rate: 2.5 } },
  tuxeball_ancient: { name: 'Tuxeball Cổ', desc: 'Tuxeball cổ, gần như chắc chắn bắt được.', kind: 'ball', price: 1200, sell: 600, effect: { rate: 4 } },
  potion: { name: 'Thuốc Hồi', desc: 'Hồi 50 HP cho một Tuxemon.', kind: 'medicine', price: 50, sell: 25, effect: { heal: 50 } },
  super_potion: { name: 'Thuốc Hồi Lớn', desc: 'Hồi 100 HP cho một Tuxemon.', kind: 'medicine', price: 100, sell: 50, effect: { heal: 100 } },
  mega_potion: { name: 'Thuốc Hồi Cực Lớn', desc: 'Hồi 200 HP cho một Tuxemon.', kind: 'medicine', price: 400, sell: 200, effect: { heal: 200 } },
  imperial_potion: { name: 'Thuốc Hoàng Gia', desc: 'Hồi đầy HP cho một Tuxemon.', kind: 'medicine', price: 1000, sell: 500, effect: { heal: 'full' } },
  restoration: { name: 'Thuốc Giải', desc: 'Chữa mọi trạng thái xấu.', kind: 'medicine', price: 700, sell: 350, effect: { cure: 'all' } },
  cureall: { name: 'Thuốc Toàn Năng', desc: 'Hồi đầy HP và chữa mọi trạng thái.', kind: 'medicine', price: 1500, sell: 750, effect: { heal: 'full', cure: 'all' } },
  revive: { name: 'Hồi Sinh', desc: 'Hồi sinh Tuxemon bất tỉnh với nửa HP.', kind: 'medicine', price: 1500, sell: 750, effect: { revive: 0.5 } },
  fire_booster: { name: 'Đá Lửa', desc: 'Giúp Tuxemon hệ Lửa tiến hoá.', kind: 'stone', price: 2000, sell: 1000 },
  water_booster: { name: 'Đá Nước', desc: 'Giúp Tuxemon hệ Nước tiến hoá.', kind: 'stone', price: 2000, sell: 1000 },
  wood_booster: { name: 'Đá Gỗ', desc: 'Giúp Tuxemon hệ Gỗ tiến hoá.', kind: 'stone', price: 2000, sell: 1000 },
  earth_booster: { name: 'Đá Đất', desc: 'Giúp Tuxemon hệ Đất tiến hoá.', kind: 'stone', price: 2000, sell: 1000 },
  metal_booster: { name: 'Đá Kim', desc: 'Giúp Tuxemon hệ Kim tiến hoá.', kind: 'stone', price: 2000, sell: 1000 },
  lucky_bamboo: { name: 'Trúc May Mắn', desc: 'Trúc may mắn — tăng ngay 1 cấp cho Tuxemon.', kind: 'held', price: 2000, sell: 1000, effect: { levelUp: 1 } },
  fishing_rod: { name: 'Cần Câu', desc: 'Cần câu — vật kỷ niệm của dân ven hồ.', kind: 'held', price: 800, sell: 400 },
  nu_phone: { name: 'Điện Thoại', desc: 'Điện thoại đời mới, ai cũng có một cái.', kind: 'held', price: 500, sell: 250 },
};

export const itemIconPath = (id) => `assets/items/${id}.png`;
export const itemsOfKind = (kind) => Object.entries(ITEMS).filter(([, it]) => it.kind === kind);
