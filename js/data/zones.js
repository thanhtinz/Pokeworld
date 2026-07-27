// PokeWorld H5 | data/zones.js | Khu vực: bảng gặp sinh vật, huấn luyện viên, lối đi
// Bảng gặp TỰ SINH TỪ tools/mkworld.py theo địa hình của Tuxemon — đừng sửa tay phần encounters.

// kind: 'town' | 'route' | 'forest' | 'cave' | 'lake' | 'meadow' | 'beach'
export const ZONES = {
  taba_town: {
    name: "Thị Trấn Taba", kind: "town", icon: "town", iconSp: null, iconItem: null,
    desc: "Thị trấn quê nhà, nơi hành trình bắt đầu.",
    encounters: [],
    trainers: ["gym_brock"],
    next: ["dryadsgrove", "healing_center", "maple_house", "player_house_downstairs", "professor_lab", "route1", "taba_house1", "taba_house2", "taba_house3", "taba_house4", "tuxe_mart_taba"],
  },
  player_house_downstairs: {
    name: "Player Nhà Downstairs", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Player Nhà Downstairs.",
    encounters: [],
    trainers: [],
    next: ["player_house_bedroom", "taba_town"],
  },
  maple_house: {
    name: "Maple Nhà", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Maple Nhà.",
    encounters: [],
    trainers: [],
    next: ["maple_bedroom", "taba_town"],
  },
  route1: {
    name: "Đường Số 1", kind: "route", icon: "route", iconSp: 60, iconItem: null,
    desc: "Con đường cỏ dại đầu tiên ngoài thị trấn.",
    encounters: [
      { sp: 60, w: 30, min: 2, max: 7 },   // Aardorn (basic)
      { sp: 83, w: 30, min: 2, max: 7 },   // Anoleaf (basic)
      { sp: 293, w: 30, min: 2, max: 7 },   // Caper (basic)
      { sp: 80, w: 30, min: 2, max: 7 },   // Cardiling (basic)
      { sp: 400, w: 30, min: 2, max: 7 },   // Cohldrabi (basic)
      { sp: 310, w: 30, min: 2, max: 7 },   // Devidin (basic)
      { sp: 57, w: 30, min: 2, max: 7 },   // Elofly (basic)
    ],
    trainers: ["youngster_minh", "lass_lan"],
    next: ["route1_sanglorian", "taba_ba_foyer", "taba_town"],
  },
  professor_lab: {
    name: "Professor Lab", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Professor Lab.",
    encounters: [],
    trainers: [],
    next: ["taba_town"],
  },
  healing_center: {
    name: "Healing Trung Tâm", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Healing Trung Tâm.",
    encounters: [],
    trainers: [],
    next: ["taba_town"],
  },
  tuxe_mart_taba: {
    name: "Tuxe Mart Taba", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Tuxe Mart Taba.",
    encounters: [],
    trainers: [],
    next: ["taba_town"],
  },
  taba_house1: {
    name: "Taba Nhà1", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Taba Nhà1.",
    encounters: [],
    trainers: [],
    next: ["taba_town"],
  },
  taba_house2: {
    name: "Taba Nhà2", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Taba Nhà2.",
    encounters: [],
    trainers: [],
    next: ["taba_house2_upstairs", "taba_town"],
  },
  taba_house3: {
    name: "Taba Nhà3", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Taba Nhà3.",
    encounters: [],
    trainers: [],
    next: ["taba_house3_upstairs", "taba_town"],
  },
  taba_house4: {
    name: "Taba Nhà4", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Taba Nhà4.",
    encounters: [],
    trainers: [],
    next: ["taba_town"],
  },
  dryadsgrove: {
    name: "Dryadsgrove", kind: "forest", icon: "forest", iconSp: 373, iconItem: null,
    desc: "Rừng cây rậm rạp, sinh vật hệ Gỗ trú ngụ rất nhiều.",
    encounters: [
      { sp: 373, w: 30, min: 5, max: 11 },   // Banling (basic)
      { sp: 45, w: 30, min: 5, max: 11 },   // Budaye (basic)
      { sp: 101, w: 30, min: 5, max: 11 },   // Bursa (basic)
      { sp: 383, w: 30, min: 5, max: 11 },   // Chickadee (basic)
      { sp: 158, w: 30, min: 5, max: 11 },   // Chloragon (basic)
      { sp: 174, w: 30, min: 5, max: 11 },   // Flacono (basic)
      { sp: 229, w: 30, min: 5, max: 11 },   // Fordin (basic)
    ],
    trainers: ["bugcatcher_tung", "lass_rainbow"],
    next: ["cotton_town", "leather_town", "taba_town"],
  },
  player_house_bedroom: {
    name: "Player Nhà Bedroom", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Player Nhà Bedroom.",
    encounters: [],
    trainers: [],
    next: [],
  },
  maple_bedroom: {
    name: "Maple Bedroom", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Maple Bedroom.",
    encounters: [],
    trainers: [],
    next: [],
  },
  route1_sanglorian: {
    name: "Đường1 Sanglorian", kind: "route", icon: "route", iconSp: 212, iconItem: null,
    desc: "Đoạn đường nối sang thị trấn kế tiếp.",
    encounters: [
      { sp: 212, w: 30, min: 6, max: 12 },   // Boltnu (basic)
      { sp: 143, w: 30, min: 6, max: 12 },   // Botbot (basic)
      { sp: 192, w: 30, min: 6, max: 12 },   // Chromeye (basic)
      { sp: 335, w: 30, min: 6, max: 12 },   // Claymorior (basic)
      { sp: 203, w: 30, min: 6, max: 12 },   // Drashimi (basic)
      { sp: 325, w: 30, min: 6, max: 12 },   // Flummby (basic)
      { sp: 99, w: 30, min: 6, max: 12 },   // Hatchling (basic)
    ],
    trainers: ["camper_route3", "sailor_route3"],
    next: ["cotton_town", "route1"],
  },
  taba_ba_foyer: {
    name: "Taba Ba Foyer", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Taba Ba Foyer.",
    encounters: [],
    trainers: [],
    next: ["route1"],
  },
  taba_house2_upstairs: {
    name: "Taba Nhà2 Upstairs", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Taba Nhà2 Upstairs.",
    encounters: [],
    trainers: [],
    next: ["taba_house2"],
  },
  taba_house3_upstairs: {
    name: "Taba Nhà3 Upstairs", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Taba Nhà3 Upstairs.",
    encounters: [],
    trainers: [],
    next: ["taba_house3"],
  },
  cotton_town: {
    name: "Thị Trấn Bông", kind: "town", icon: "town", iconSp: 394, iconItem: null,
    desc: "Thị trấn buôn bán sầm uất.",
    encounters: [
      { sp: 394, w: 30, min: 8, max: 14 },   // Helipi (basic)
      { sp: 277, w: 30, min: 8, max: 14 },   // Imbrickcile (basic)
      { sp: 110, w: 30, min: 8, max: 14 },   // Komodraw (basic)
      { sp: 299, w: 30, min: 8, max: 14 },   // Medipup (basic)
      { sp: 385, w: 30, min: 8, max: 14 },   // Pickoon (basic)
      { sp: 107, w: 30, min: 8, max: 14 },   // Pythwire (basic)
      { sp: 19, w: 30, min: 8, max: 14 },   // Rockitten (basic)
    ],
    trainers: ["gym_thuy", "rocket_grunt_3"],
    next: ["dryadsgrove", "route1_sanglorian"],
  },
  leather_town: {
    name: "Thị Trấn Da", kind: "town", icon: "town", iconSp: 31, iconItem: null,
    desc: "Thị trấn vùng đất khô, gió cát quanh năm.",
    encounters: [
      { sp: 31, w: 30, min: 11, max: 18 },   // Agnite (basic)
      { sp: 105, w: 30, min: 11, max: 18 },   // Forturtle (basic)
      { sp: 340, w: 30, min: 11, max: 18 },   // Hissiorite (basic)
      { sp: 407, w: 30, min: 11, max: 18 },   // Hoodoll (basic)
      { sp: 48, w: 30, min: 11, max: 18 },   // Ignibus (basic)
      { sp: 263, w: 30, min: 11, max: 18 },   // Pantherafira (basic)
      { sp: 390, w: 30, min: 11, max: 18 },   // Pawsand (basic)
    ],
    trainers: ["camper_victory", "channeler_unknown", "swimmer_light"],
    next: ["dryadsgrove"],
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
