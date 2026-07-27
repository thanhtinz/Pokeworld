// TuxeWorld H5 | data/zones.js | Khu vực: bảng gặp sinh vật, huấn luyện viên, lối đi
// Bảng gặp TỰ SINH TỪ tools/mkworld.py theo địa hình của Tuxemon — đừng sửa tay phần encounters.

// kind: 'town' | 'route' | 'forest' | 'cave' | 'lake' | 'meadow' | 'beach'
export const ZONES = {
  town_1: {
    name: "Thị Trấn Khởi Đầu", kind: "town", icon: "town", iconSp: null, iconItem: "town_map",
    desc: "Nơi hành trình bắt đầu. Có trung tâm hồi phục, cửa hàng và võ đường đầu tiên.",
    encounters: [],
    trainers: ["gym_brock"],
    next: ["route_1"],
  },
  route_1: {
    name: "Đường Số 1", kind: "route", icon: "route", iconSp: 60, iconItem: null,
    desc: "Đồng cỏ phía bắc thị trấn, đầy sinh vật hoang cấp thấp.",
    encounters: [
      { sp: 60, w: 30, min: 2, max: 6 },   // Aardorn (basic)
      { sp: 83, w: 30, min: 2, max: 6 },   // Anoleaf (basic)
      { sp: 293, w: 30, min: 2, max: 6 },   // Caper (basic)
      { sp: 80, w: 30, min: 2, max: 6 },   // Cardiling (basic)
      { sp: 400, w: 30, min: 2, max: 6 },   // Cohldrabi (basic)
      { sp: 310, w: 30, min: 2, max: 6 },   // Devidin (basic)
      { sp: 57, w: 30, min: 2, max: 6 },   // Elofly (basic)
    ],
    trainers: ["youngster_minh", "lass_lan"],
    next: ["town_1", "forest_1", "route_2"],
  },
  forest_1: {
    name: "Rừng Xanh Thẳm", kind: "forest", icon: "forest", iconSp: 373, iconItem: null,
    desc: "Khu rừng rậm rạp, tán cây che kín mặt trời.",
    encounters: [
      { sp: 373, w: 30, min: 4, max: 9 },   // Banling (basic)
      { sp: 45, w: 30, min: 4, max: 9 },   // Budaye (basic)
      { sp: 101, w: 30, min: 4, max: 9 },   // Bursa (basic)
      { sp: 383, w: 30, min: 4, max: 9 },   // Chickadee (basic)
      { sp: 158, w: 30, min: 4, max: 9 },   // Chloragon (basic)
      { sp: 174, w: 30, min: 4, max: 9 },   // Flacono (basic)
      { sp: 229, w: 30, min: 4, max: 9 },   // Fordin (basic)
    ],
    trainers: ["bugcatcher_tung"],
    next: ["route_1"],
  },
  route_2: {
    name: "Đường Số 2", kind: "route", icon: "route", iconSp: 212, iconItem: null,
    desc: "Đường mòn dẫn tới hang núi và hồ nước.",
    encounters: [
      { sp: 212, w: 30, min: 5, max: 11 },   // Boltnu (basic)
      { sp: 143, w: 30, min: 5, max: 11 },   // Botbot (basic)
      { sp: 192, w: 30, min: 5, max: 11 },   // Chromeye (basic)
      { sp: 335, w: 30, min: 5, max: 11 },   // Claymorior (basic)
      { sp: 203, w: 30, min: 5, max: 11 },   // Drashimi (basic)
      { sp: 325, w: 30, min: 5, max: 11 },   // Flummby (basic)
      { sp: 99, w: 30, min: 5, max: 11 },   // Hatchling (basic)
    ],
    trainers: [],
    next: ["route_1", "cave_1", "lake_1"],
  },
  cave_1: {
    name: "Hang Đá", kind: "cave", icon: "cave", iconSp: 368, iconItem: null,
    desc: "Hang động tối tăm, lãnh địa của những sinh vật sống dưới lòng đất.",
    encounters: [
      { sp: 368, w: 30, min: 7, max: 13 },   // Babysnitch (basic)
      { sp: 105, w: 30, min: 7, max: 13 },   // Forturtle (basic)
      { sp: 277, w: 30, min: 7, max: 13 },   // Imbrickcile (basic)
      { sp: 290, w: 30, min: 7, max: 13 },   // Slichen (basic)
      { sp: 150, w: 30, min: 7, max: 13 },   // Vivipere (basic)
      { sp: 268, w: 30, min: 7, max: 13 },   // Woodoor (basic)
      { sp: 177, w: 30, min: 7, max: 13 },   // Wrougon (basic)
    ],
    trainers: ["hiker_dung"],
    next: ["route_2", "cave_2"],
  },
  lake_1: {
    name: "Hồ Gương Trời", kind: "lake", icon: "lake", iconSp: 119, iconItem: null,
    desc: "Hồ nước trong vắt, nơi đặt võ đường hệ Nước.",
    encounters: [
      { sp: 119, w: 30, min: 6, max: 12 },   // Axolightl (basic)
      { sp: 41, w: 30, min: 6, max: 12 },   // Dollfin (basic)
      { sp: 409, w: 30, min: 6, max: 12 },   // Gupphish (basic)
      { sp: 387, w: 30, min: 6, max: 12 },   // Kroki (basic)
      { sp: 307, w: 30, min: 6, max: 12 },   // Scarlant (basic)
      { sp: 180, w: 30, min: 6, max: 12 },   // Seirein (basic)
      { sp: 303, w: 30, min: 6, max: 12 },   // Sheye (basic)
    ],
    trainers: ["gym_thuy"],
    next: ["route_2", "route_3"],
  },
  route_3: {
    name: "Đường Số 3", kind: "route", icon: "route", iconSp: 31, iconItem: null,
    desc: "Con đường cát nóng phía nam hồ.",
    encounters: [
      { sp: 31, w: 30, min: 9, max: 15 },   // Agnite (basic)
      { sp: 340, w: 30, min: 9, max: 15 },   // Hissiorite (basic)
      { sp: 407, w: 30, min: 9, max: 15 },   // Hoodoll (basic)
      { sp: 48, w: 30, min: 9, max: 15 },   // Ignibus (basic)
      { sp: 110, w: 30, min: 9, max: 15 },   // Komodraw (basic)
      { sp: 263, w: 30, min: 9, max: 15 },   // Pantherafira (basic)
      { sp: 390, w: 30, min: 9, max: 15 },   // Pawsand (basic)
    ],
    trainers: ["camper_route3", "sailor_route3"],
    next: ["lake_1", "meadow_1", "town_2"],
  },
  meadow_1: {
    name: "Đồng Hoa Nắng", kind: "meadow", icon: "meadow", iconSp: 394, iconItem: null,
    desc: "Cánh đồng hoa nở quanh năm, sinh vật hệ Gỗ tụ về rất đông.",
    encounters: [
      { sp: 394, w: 30, min: 11, max: 17 },   // Helipi (basic)
      { sp: 220, w: 30, min: 11, max: 17 },   // Metesaur (basic)
      { sp: 222, w: 30, min: 11, max: 17 },   // Rosarin (basic)
      { sp: 354, w: 30, min: 11, max: 17 },   // Sprightly (basic)
      { sp: 316, w: 30, min: 11, max: 17 },   // Thumpurn (basic)
      { sp: 405, w: 30, min: 11, max: 17 },   // Toucanary (basic)
      { sp: 103, w: 30, min: 11, max: 17 },   // Trapsnap (basic)
    ],
    trainers: ["lass_rainbow"],
    next: ["route_3"],
  },
  town_2: {
    name: "Làng Ven Núi", kind: "town", icon: "town", iconSp: null, iconItem: "town_map",
    desc: "Ngôi làng nhỏ kẹp giữa núi và biển.",
    encounters: [],
    trainers: ["rocket_grunt_3"],
    next: ["route_3", "beach_1"],
  },
  beach_1: {
    name: "Bãi Biển Hoàng Hôn", kind: "beach", icon: "beach", iconSp: 86, iconItem: null,
    desc: "Bãi cát trải dài dưới nắng chiều, sóng vỗ suốt ngày đêm.",
    encounters: [
      { sp: 86, w: 30, min: 13, max: 19 },   // Fluoresfin (basic)
      { sp: 295, w: 30, min: 13, max: 19 },   // Lesmagu (basic)
      { sp: 337, w: 30, min: 13, max: 19 },   // Nebufin (basic)
      { sp: 366, w: 30, min: 13, max: 19 },   // Poinchin (basic)
      { sp: 370, w: 30, min: 13, max: 19 },   // Weedsea (basic)
      { sp: 403, w: 30, min: 13, max: 19 },   // Carcharock (standalone)
      { sp: 256, w: 30, min: 13, max: 19 },   // Flisces (standalone)
    ],
    trainers: ["swimmer_light"],
    next: ["town_2"],
  },
  cave_2: {
    name: "Hang Sâu Thẳm", kind: "cave", icon: "cave", iconSp: 172, iconItem: null,
    desc: "Mê cung đá sâu trong lòng núi, tối đến mức không thấy lối ra.",
    encounters: [
      { sp: 172, w: 30, min: 15, max: 22 },   // Chillimp (basic)
      { sp: 19, w: 30, min: 15, max: 22 },   // Rockitten (basic)
      { sp: 25, w: 30, min: 15, max: 22 },   // Tweesher (basic)
      { sp: 118, w: 30, min: 15, max: 22 },   // Araignee (standalone)
      { sp: 257, w: 30, min: 15, max: 22 },   // Mingdyn (standalone)
      { sp: 353, w: 30, min: 15, max: 22 },   // Teddisun (standalone)
      { sp: 32, w: 8, min: 17, max: 25 },   // Agnidon (stage1)
    ],
    trainers: ["camper_victory", "channeler_unknown"],
    next: ["cave_1"],
  },
};

// Random 1 encounter theo trọng số trong zone (null nếu zone không có spawn)
export function rollEncounter(zoneId, rng = Math.random) {
  const zone = ZONES[zoneId];
  if (!zone || !zone.encounters.length) return null;
  const total = zone.encounters.reduce((s, e) => s + e.w, 0);
  let r = rng() * total;
  for (const e of zone.encounters) {
    r -= e.w;
    if (r < 0) {
      const lv = e.min + Math.floor(rng() * (e.max - e.min + 1));
      return { sp: e.sp, lv };
    }
  }
  return null;
}
