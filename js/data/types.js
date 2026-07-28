// TuxeWorld H5 | data/types.js | Hệ và bảng khắc chế — TỰ SINH TỪ tools/mktuxemon.py
// Nguồn: Tuxemon (CC BY-SA 4.0). Đừng sửa tay.

export const TYPES = ["cosmic", "earth", "fire", "frost", "heroic", "lightning", "metal", "normal", "shadow", "sky", "venom", "water", "wood"];

// TYPE_NAMES[hệ] = tên tiếng Việt hiển thị trong game
export const TYPE_NAMES = {
  cosmic: "Vũ Trụ",
  earth: "Đất",
  fire: "Lửa",
  frost: "Băng",
  heroic: "Anh Hùng",
  lightning: "Điện",
  metal: "Kim",
  normal: "Thường",
  shadow: "Bóng Tối",
  sky: "Bầu Trời",
  venom: "Độc",
  water: "Nước",
  wood: "Gỗ",
};
export const TYPE_VI = TYPE_NAMES;   // tên cũ, giữ cho phần giao diện đang dùng

// TYPE_COLORS[hệ] = màu thẻ hệ
export const TYPE_COLORS = {
  cosmic: "#7038f8",
  earth: "#b8a038",
  fire: "#f08030",
  frost: "#98d8d8",
  heroic: "#f85888",
  lightning: "#f8d030",
  metal: "#b8b8d0",
  normal: "#a8a878",
  shadow: "#705848",
  sky: "#a890f0",
  venom: "#a040a0",
  water: "#6890f0",
  wood: "#78c850",
};

// CHART[hệ đánh][hệ chịu] = hệ số sát thương
export const CHART = {
  cosmic: { cosmic: 1, earth: 1, fire: 1, frost: 1, heroic: 2, lightning: 1, metal: 1, normal: 1, shadow: 0.5, sky: 1, venom: 2, water: 1, wood: 1 },
  earth: { cosmic: 1, earth: 1, fire: 2, frost: 1, heroic: 1, lightning: 2, metal: 1, normal: 1, shadow: 1, sky: 0.5, venom: 1, water: 1, wood: 0.5 },
  fire: { cosmic: 1, earth: 0.5, fire: 0.5, frost: 0.5, heroic: 1, lightning: 1, metal: 2, normal: 1, shadow: 1, sky: 1, venom: 2, water: 0.5, wood: 2 },
  frost: { cosmic: 1, earth: 2, fire: 1, frost: 0.5, heroic: 1, lightning: 1, metal: 0.5, normal: 1, shadow: 0.5, sky: 2, venom: 1, water: 0.5, wood: 2 },
  heroic: { cosmic: 0.5, earth: 1, fire: 1, frost: 2, heroic: 1, lightning: 1, metal: 1, normal: 2, shadow: 2, sky: 1, venom: 0.5, water: 1, wood: 1 },
  lightning: { cosmic: 1, earth: 0.5, fire: 1, frost: 1, heroic: 1, lightning: 0.5, metal: 2, normal: 1, shadow: 1, sky: 2, venom: 1, water: 2, wood: 0.5 },
  metal: { cosmic: 2, earth: 2, fire: 0.5, frost: 1, heroic: 1, lightning: 1, metal: 0.5, normal: 1, shadow: 1, sky: 1, venom: 1, water: 0.5, wood: 1 },
  normal: { cosmic: 1, earth: 1, fire: 1, frost: 1, heroic: 1, lightning: 1, metal: 0.5, normal: 1, shadow: 1, sky: 1, venom: 1, water: 1, wood: 1 },
  shadow: { cosmic: 2, earth: 0.5, fire: 1, frost: 1, heroic: 0.5, lightning: 1, metal: 1, normal: 1, shadow: 1, sky: 2, venom: 1, water: 1, wood: 1 },
  sky: { cosmic: 1, earth: 2, fire: 0.5, frost: 1, heroic: 2, lightning: 1, metal: 1, normal: 1, shadow: 1, sky: 1, venom: 1, water: 1, wood: 2 },
  venom: { cosmic: 1, earth: 0.5, fire: 1, frost: 1, heroic: 1, lightning: 1, metal: 0.5, normal: 2, shadow: 1, sky: 1, venom: 0.5, water: 0.5, wood: 2 },
  water: { cosmic: 1, earth: 1, fire: 2, frost: 0.5, heroic: 1, lightning: 1, metal: 1, normal: 1, shadow: 1, sky: 1, venom: 1, water: 0.5, wood: 0.5 },
  wood: { cosmic: 1, earth: 2, fire: 0.5, frost: 1, heroic: 1, lightning: 1, metal: 1, normal: 1, shadow: 1, sky: 1, venom: 0.5, water: 2, wood: 0.5 },
};

// Hệ số khi một chiêu hệ `atk` đánh vào sinh vật mang các hệ `defTypes`.
// Nhân dồn từng hệ giống loạt game gốc.
export function typeEff(atk, defTypes) {
  const row = CHART[atk];
  if (!row) return 1;
  let mult = 1;
  for (const d of defTypes || []) {
    const v = row[d];
    if (typeof v === 'number') mult *= v;
  }
  return mult;
}

export const typeName = (t) => TYPE_NAMES[t] || t;
export const typeColor = (t) => TYPE_COLORS[t] || '#888888';
