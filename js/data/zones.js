// TuxeWorld H5 | data/zones.js | Khu vực: bảng gặp sinh vật, huấn luyện viên, lối đi
// Bảng gặp TỰ SINH TỪ tools/mkworld.py theo địa hình của Tuxemon — đừng sửa tay phần encounters.

// kind: 'town' | 'route' | 'forest' | 'cave' | 'lake' | 'meadow' | 'beach'
export const ZONES = {
  taba_town: {
    name: "Thị Trấn Taba", kind: "town", icon: "town", iconSp: null, iconItem: null,
    desc: "Thị trấn quê nhà, nơi hành trình bắt đầu.",
    encounters: [],
    trainers: ["vo_duong_dat"],
    next: ["dryadsgrove", "healing_center", "maple_house", "player_house_downstairs", "professor_lab", "route1", "taba_house1", "taba_house2", "taba_house3", "taba_house4", "tuxe_mart_taba"],
  },
  player_house_downstairs: {
    name: "Nhà Mình — Tầng Trệt", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà Mình — Tầng Trệt.",
    encounters: [],
    trainers: [],
    next: ["player_house_bedroom", "taba_town"],
  },
  maple_house: {
    name: "Nhà Maple", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà Maple.",
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
    trainers: ["nhoc_minh", "be_lan", "rival_1"],
    next: ["route1_sanglorian", "taba_ba_foyer", "taba_town"],
  },
  professor_lab: {
    name: "Phòng Nghiên Cứu", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Phòng Nghiên Cứu.",
    encounters: [],
    trainers: [],
    next: ["taba_town"],
  },
  healing_center: {
    name: "Trạm Hồi Sức", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Trạm Hồi Sức.",
    encounters: [],
    trainers: [],
    next: ["taba_town"],
  },
  tuxe_mart_taba: {
    name: "Tuxemart Taba", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Tuxemart Taba.",
    encounters: [],
    trainers: [],
    next: ["taba_town"],
  },
  taba_house1: {
    name: "Nhà Ông Bà Clawbrew", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà Ông Bà Clawbrew.",
    encounters: [],
    trainers: [],
    next: ["taba_town"],
  },
  taba_house2: {
    name: "Thư Viện Di Sản", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Thư Viện Di Sản.",
    encounters: [],
    trainers: [],
    next: ["taba_house2_upstairs", "taba_town"],
  },
  taba_house3: {
    name: "Nhà Trọ Lá Trầm Tư", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà Trọ Lá Trầm Tư.",
    encounters: [],
    trainers: [],
    next: ["taba_house3_upstairs", "taba_town"],
  },
  taba_house4: {
    name: "Quán Rượu Hải Âu Đáng Kính", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Quán Rượu Hải Âu Đáng Kính.",
    encounters: [],
    trainers: [],
    next: ["taba_town"],
  },
  dryadsgrove: {
    name: "Rừng Dryad", kind: "forest", icon: "forest", iconSp: 373, iconItem: null,
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
    trainers: ["bat_bo_tung", "da_ngoai_hanh", "xero_1"],
    next: ["cotton_town", "leather_town", "taba_town"],
  },
  player_house_bedroom: {
    name: "Nhà Mình — Phòng Ngủ", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà Mình — Phòng Ngủ.",
    encounters: [],
    trainers: [],
    next: [],
  },
  maple_bedroom: {
    name: "Nhà Maple — Phòng Ngủ", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà Maple — Phòng Ngủ.",
    encounters: [],
    trainers: [],
    next: [],
  },
  route1_sanglorian: {
    name: "Đường Số 1 — Ngã Sanglorian", kind: "route", icon: "route", iconSp: 212, iconItem: null,
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
    trainers: ["cam_trai_liem", "thuy_thu_marina", "xero_2"],
    next: ["cotton_town", "route1"],
  },
  taba_ba_foyer: {
    name: "Khu Thi Đấu Taba — Tiền Sảnh", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Khu Thi Đấu Taba — Tiền Sảnh.",
    encounters: [],
    trainers: [],
    next: ["route1", "taba_ba_main"],
  },
  taba_house2_upstairs: {
    name: "Thư Viện Di Sản — Tầng Trên", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Thư Viện Di Sản — Tầng Trên.",
    encounters: [],
    trainers: [],
    next: ["taba_house2"],
  },
  taba_house3_upstairs: {
    name: "Nhà Trọ Lá Trầm Tư — Tầng Trên", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà Trọ Lá Trầm Tư — Tầng Trên.",
    encounters: [],
    trainers: [],
    next: ["taba_house3"],
  },
  cotton_town: {
    name: "Thị Trấn Bông", kind: "town", icon: "town", iconSp: 277, iconItem: null,
    desc: "Thị trấn buôn bán sầm uất.",
    encounters: [
      { sp: 277, w: 30, min: 8, max: 14 },   // Imbrickcile (basic)
      { sp: 299, w: 30, min: 8, max: 14 },   // Medipup (basic)
      { sp: 107, w: 30, min: 8, max: 14 },   // Pythwire (basic)
      { sp: 19, w: 30, min: 8, max: 14 },   // Rockitten (basic)
      { sp: 307, w: 30, min: 8, max: 14 },   // Scarlant (basic)
      { sp: 243, w: 30, min: 8, max: 14 },   // Snock (basic)
      { sp: 268, w: 30, min: 8, max: 14 },   // Woodoor (basic)
    ],
    trainers: ["vo_duong_nuoc", "xero_grunt_3", "xero_boss"],
    next: ["cotton_cafe", "cotton_cathedral", "cotton_daycare", "cotton_misa_house", "cotton_scoop", "dryadsgrove", "route1_sanglorian", "route2"],
  },
  leather_town: {
    name: "Thị Trấn Da", kind: "town", icon: "town", iconSp: 105, iconItem: null,
    desc: "Thị trấn vùng đất khô, gió cát quanh năm.",
    encounters: [
      { sp: 105, w: 30, min: 11, max: 18 },   // Forturtle (basic)
      { sp: 340, w: 30, min: 11, max: 18 },   // Hissiorite (basic)
      { sp: 407, w: 30, min: 11, max: 18 },   // Hoodoll (basic)
      { sp: 390, w: 30, min: 11, max: 18 },   // Pawsand (basic)
      { sp: 177, w: 30, min: 11, max: 18 },   // Wrougon (basic)
      { sp: 219, w: 30, min: 11, max: 18 },   // Altie (standalone)
      { sp: 79, w: 30, min: 11, max: 18 },   // Anu (standalone)
    ],
    trainers: ["leo_nui_marcos", "nghien_cuu_mio", "boi_douglas", "rival_2"],
    next: ["citypark", "dryadsgrove", "flower_city", "leather_scoop", "leather_shaft1", "leather_shaft2", "route3"],
  },
  taba_ba_main: {
    name: "Khu Thi Đấu Taba — Đại Sảnh", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Khu Thi Đấu Taba — Đại Sảnh.",
    encounters: [],
    trainers: [],
    next: ["taba_ba_foyer", "taba_ba_passageway_1", "taba_ba_passageway_2", "taba_ba_passageway_3", "taba_ba_passageway_4", "taba_ba_stairwell_1"],
  },
  route2: {
    name: "Đường Số 2", kind: "route", icon: "route", iconSp: 394, iconItem: null,
    desc: "Đường mòn ven rừng, cỏ mọc cao quá gối.",
    encounters: [
      { sp: 394, w: 30, min: 8, max: 14 },   // Helipi (basic)
      { sp: 74, w: 30, min: 8, max: 14 },   // Katapill (basic)
      { sp: 110, w: 30, min: 8, max: 14 },   // Komodraw (basic)
      { sp: 199, w: 30, min: 8, max: 14 },   // Pairagrin (basic)
      { sp: 263, w: 30, min: 8, max: 14 },   // Pantherafira (basic)
      { sp: 385, w: 30, min: 8, max: 14 },   // Pickoon (basic)
      { sp: 222, w: 30, min: 8, max: 14 },   // Rosarin (basic)
    ],
    trainers: [],
    next: ["citypark", "cotton_town"],
  },
  cotton_cathedral: {
    name: "Thánh Đường Bông", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Thánh Đường Bông.",
    encounters: [],
    trainers: [],
    next: ["cotton_town"],
  },
  cotton_scoop: {
    name: "Tiệm Tạp Hoá Bông", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Tiệm Tạp Hoá Bông.",
    encounters: [],
    trainers: [],
    next: ["cotton_town"],
  },
  cotton_cafe: {
    name: "Quán Cà Phê Bông", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Quán Cà Phê Bông.",
    encounters: [],
    trainers: [],
    next: ["cotton_cafe_basement", "cotton_town"],
  },
  cotton_daycare: {
    name: "Nhà Trẻ Bông", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà Trẻ Bông.",
    encounters: [],
    trainers: [],
    next: ["cotton_town"],
  },
  cotton_misa_house: {
    name: "Nhà Misa", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà Misa.",
    encounters: [],
    trainers: [],
    next: ["cotton_misa_house_upstairs", "cotton_town"],
  },
  citypark: {
    name: "Công Viên Thành Phố", kind: "town", icon: "town", iconSp: 354, iconItem: null,
    desc: "Công viên giữa phố, chim chóc và người đi dạo.",
    encounters: [
      { sp: 354, w: 30, min: 10, max: 16 },   // Sprightly (basic)
      { sp: 316, w: 30, min: 10, max: 16 },   // Thumpurn (basic)
      { sp: 216, w: 30, min: 10, max: 16 },   // Turnipper (basic)
      { sp: 25, w: 30, min: 10, max: 16 },   // Tweesher (basic)
      { sp: 150, w: 30, min: 10, max: 16 },   // Vivipere (basic)
      { sp: 117, w: 30, min: 10, max: 16 },   // Abesnaki (standalone)
      { sp: 118, w: 30, min: 10, max: 16 },   // Araignee (standalone)
    ],
    trainers: [],
    next: ["leather_town", "route2"],
  },
  route3: {
    name: "Đường Số 3", kind: "route", icon: "route", iconSp: 31, iconItem: null,
    desc: "Đường đèo lên núi, dốc và lắm đá.",
    encounters: [
      { sp: 31, w: 30, min: 13, max: 20 },   // Agnite (basic)
      { sp: 368, w: 30, min: 13, max: 20 },   // Babysnitch (basic)
      { sp: 172, w: 30, min: 13, max: 20 },   // Chillimp (basic)
      { sp: 48, w: 30, min: 13, max: 20 },   // Ignibus (basic)
      { sp: 220, w: 30, min: 13, max: 20 },   // Metesaur (basic)
      { sp: 267, w: 30, min: 13, max: 20 },   // Ambuwl (standalone)
      { sp: 266, w: 30, min: 13, max: 20 },   // Cherubat (standalone)
    ],
    trainers: [],
    next: ["leather_town"],
  },
  leather_scoop: {
    name: "Tiệm Tạp Hoá Da", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Tiệm Tạp Hoá Da.",
    encounters: [],
    trainers: [],
    next: ["leather_town"],
  },
  leather_shaft1: {
    name: "Hầm Mỏ Shaft 1", kind: "indoor", icon: "indoor", iconSp: 290, iconItem: null,
    desc: "Tầng trên của hầm mỏ, tối om và ẩm thấp.",
    encounters: [
      { sp: 290, w: 30, min: 15, max: 22 },   // Slichen (basic)
      { sp: 178, w: 8, min: 17, max: 25 },   // Allagon (stage1)
      { sp: 369, w: 8, min: 17, max: 25 },   // Baddrscratch (stage1)
      { sp: 311, w: 8, min: 17, max: 25 },   // Devidra (stage1)
      { sp: 151, w: 8, min: 17, max: 25 },   // Vivicinder (stage1)
      { sp: 153, w: 8, min: 17, max: 25 },   // Viviteel (stage1)
      { sp: 154, w: 8, min: 17, max: 25 },   // Vivitrans (stage1)
    ],
    trainers: [],
    next: ["leather_town"],
  },
  leather_shaft2: {
    name: "Hầm Mỏ Shaft 2", kind: "indoor", icon: "indoor", iconSp: 233, iconItem: null,
    desc: "Tầng sâu của hầm mỏ, ít ai dám xuống tới đây.",
    encounters: [
      { sp: 233, w: 30, min: 17, max: 24 },   // Brewdin (standalone)
      { sp: 126, w: 30, min: 17, max: 24 },   // Djinnbo (standalone)
      { sp: 399, w: 30, min: 17, max: 24 },   // Glomon (standalone)
      { sp: 323, w: 30, min: 17, max: 24 },   // Jeluna (standalone)
      { sp: 247, w: 30, min: 17, max: 24 },   // Lunight (standalone)
      { sp: 248, w: 30, min: 17, max: 24 },   // Solight (standalone)
      { sp: 353, w: 30, min: 17, max: 24 },   // Teddisun (standalone)
    ],
    trainers: [],
    next: ["leather_town"],
  },
  flower_city: {
    name: "Thành Phố Hoa", kind: "town", icon: "town", iconSp: 119, iconItem: null,
    desc: "Thành phố ven nước, đâu cũng thấy hoa.",
    encounters: [
      { sp: 119, w: 30, min: 19, max: 26 },   // Axolightl (basic)
      { sp: 41, w: 30, min: 19, max: 26 },   // Dollfin (basic)
      { sp: 409, w: 30, min: 19, max: 26 },   // Gupphish (basic)
      { sp: 295, w: 30, min: 19, max: 26 },   // Lesmagu (basic)
      { sp: 366, w: 30, min: 19, max: 26 },   // Poinchin (basic)
      { sp: 303, w: 30, min: 19, max: 26 },   // Sheye (basic)
      { sp: 370, w: 30, min: 19, max: 26 },   // Weedsea (basic)
    ],
    trainers: [],
    next: ["leather_town"],
  },
  taba_ba_passageway_1: {
    name: "Khu Thi Đấu Taba — Hành Lang 1", kind: "indoor", icon: "indoor", iconSp: 397, iconItem: null,
    desc: "Hành lang khu thi đấu, không khí lạ thường.",
    encounters: [
      { sp: 397, w: 30, min: 21, max: 28 },   // Virware (basic)
      { sp: 280, w: 30, min: 21, max: 28 },   // Waysprite (basic)
      { sp: 271, w: 30, min: 21, max: 28 },   // Kernel (standalone)
      { sp: 381, w: 30, min: 21, max: 28 },   // Yamada (standalone)
      { sp: 281, w: 8, min: 23, max: 31 },   // Angesnow (stage1)
      { sp: 193, w: 8, min: 23, max: 31 },   // Angrito (stage1)
      { sp: 215, w: 8, min: 23, max: 31 },   // Apeoro (stage1)
    ],
    trainers: [],
    next: ["taba_ba_main"],
  },
  taba_ba_passageway_2: {
    name: "Khu Thi Đấu Taba — Hành Lang 2", kind: "indoor", icon: "indoor", iconSp: 345, iconItem: null,
    desc: "Hành lang khu thi đấu, sương giá bám tường.",
    encounters: [
      { sp: 345, w: 30, min: 23, max: 30 },   // Eskipup (basic)
      { sp: 387, w: 30, min: 23, max: 30 },   // Kroki (basic)
      { sp: 180, w: 30, min: 23, max: 30 },   // Seirein (basic)
      { sp: 103, w: 30, min: 23, max: 30 },   // Trapsnap (basic)
      { sp: 272, w: 30, min: 23, max: 30 },   // Tux (standalone)
      { sp: 249, w: 30, min: 23, max: 30 },   // Wolffsky (standalone)
      { sp: 298, w: 8, min: 25, max: 33 },   // Ampystoma (stage1)
    ],
    trainers: [],
    next: ["taba_ba_main"],
  },
  taba_ba_passageway_3: {
    name: "Khu Thi Đấu Taba — Hành Lang 3", kind: "indoor", icon: "indoor", iconSp: 86, iconItem: null,
    desc: "Hành lang khu thi đấu, nghe cả tiếng sóng.",
    encounters: [
      { sp: 86, w: 30, min: 25, max: 32 },   // Fluoresfin (basic)
      { sp: 337, w: 30, min: 25, max: 32 },   // Nebufin (basic)
      { sp: 403, w: 30, min: 25, max: 32 },   // Carcharock (standalone)
      { sp: 256, w: 30, min: 25, max: 32 },   // Flisces (standalone)
      { sp: 330, w: 30, min: 25, max: 32 },   // Metoxic (standalone)
      { sp: 404, w: 30, min: 25, max: 32 },   // Primordia (standalone)
      { sp: 270, w: 30, min: 25, max: 32 },   // Rhinocarpe (standalone)
    ],
    trainers: [],
    next: ["taba_ba_main"],
  },
  taba_ba_passageway_4: {
    name: "Khu Thi Đấu Taba — Hành Lang 4", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Khu Thi Đấu Taba — Hành Lang 4.",
    encounters: [],
    trainers: [],
    next: ["taba_ba_main"],
  },
  taba_ba_stairwell_1: {
    name: "Khu Thi Đấu Taba — Cầu Thang", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Khu Thi Đấu Taba — Cầu Thang.",
    encounters: [],
    trainers: [],
    next: ["taba_ba_main"],
  },
  cotton_cafe_basement: {
    name: "Quán Cà Phê Bông — Tầng Hầm", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Quán Cà Phê Bông — Tầng Hầm.",
    encounters: [],
    trainers: [],
    next: ["cotton_cafe"],
  },
  cotton_misa_house_upstairs: {
    name: "Nhà Misa — Tầng Trên", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà Misa — Tầng Trên.",
    encounters: [],
    trainers: [],
    next: ["cotton_misa_house"],
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
