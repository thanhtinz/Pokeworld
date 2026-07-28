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
    next: ["cotton_town", "cotton_tunnel", "routec", "routed"],
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
    next: ["cotton_artshop", "cotton_cafe", "cotton_house1", "cotton_house2", "cotton_scoop", "cotton_tunnel", "dryadsgrove", "healing_center", "omnichannel1", "route1", "route2"],
  },
  routed: {
    name: "Đường Đồng Cỏ", kind: "route", icon: "route", iconSp: null, iconItem: null,
    desc: "Khu vực Đường Đồng Cỏ.",
    encounters: [],
    trainers: [],
    next: ["dryadsgrove", "flower_city", "leather_town"],
  },
  cotton_tunnel: {
    name: "Đường Hầm Bông", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Đường Hầm Bông.",
    encounters: [],
    trainers: [],
    next: [],
  },
  routec: {
    name: "Đường Rừng Thông", kind: "route", icon: "route", iconSp: null, iconItem: null,
    desc: "Khu vực Đường Rừng Thông.",
    encounters: [],
    trainers: [],
    next: ["candy_port", "candy_town", "dragonscave", "dryadsgrove", "paper_town", "route1"],
  },
  taba_ba_main: {
    name: "Khu Thi Đấu Taba — Đại Sảnh", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Khu Thi Đấu Taba — Đại Sảnh.",
    encounters: [],
    trainers: [],
    next: ["taba_ba_foyer", "taba_ba_passageway_1", "taba_ba_passageway_2", "taba_ba_passageway_3", "taba_ba_passageway_4", "taba_ba_stairwell_1"],
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
    next: ["cotton_town"],
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
    next: ["brideswood", "citypark", "cotton_town"],
  },
  cotton_artshop: {
    name: "Tiệm Tranh Bông", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Tiệm Tranh Bông.",
    encounters: [],
    trainers: [],
    next: ["cotton_town"],
  },
  cotton_house1: {
    name: "Nhà 1 Bông", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà 1 Bông.",
    encounters: [],
    trainers: [],
    next: ["cotton_town"],
  },
  cotton_house2: {
    name: "Nhà 2 Bông", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà 2 Bông.",
    encounters: [],
    trainers: [],
    next: ["cotton_town"],
  },
  omnichannel1: {
    name: "Toà Thương Trường — Tầng 1", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Toà Thương Trường — Tầng 1.",
    encounters: [],
    trainers: [],
    next: ["cotton_town", "omnichannel2"],
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
    next: ["candy_port", "dojo1", "flower_center", "flower_house1", "flower_house2", "flower_petshop", "flower_scoop", "leather_town", "nimrod_bottom", "paper_town", "route4", "route5", "routea", "routed", "timber_town"],
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
    next: ["candy_port", "citypark", "flower_city", "leather_center", "leather_gym", "leather_house1", "leather_house2", "leather_museum", "leather_scoop", "leather_shaft1", "leather_shaft2", "paper_town", "route3", "routed", "timber_town"],
  },
  candy_town: {
    name: "Thị Trấn Kẹo", kind: "town", icon: "town", iconSp: null, iconItem: null,
    desc: "Khu vực Thị Trấn Kẹo.",
    encounters: [],
    trainers: [],
    next: ["candy_cafe", "candy_center", "candy_house1", "candy_house2", "candy_house3", "candy_port", "candy_scoop", "greenwash", "greenwash_greenhouse", "route6", "routec"],
  },
  paper_town: {
    name: "Thị Trấn Giấy", kind: "town", icon: "town", iconSp: null, iconItem: null,
    desc: "Khu vực Thị Trấn Giấy.",
    encounters: [],
    trainers: [],
    next: ["brideswood", "candy_port", "downstairs", "flower_city", "leather_town", "paper_daycare", "paper_manor", "paper_rival_downstairs", "paper_scoop", "route1", "routec", "timber_town"],
  },
  dragonscave: {
    name: "Hang Rồng", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Hang Rồng.",
    encounters: [],
    trainers: [],
    next: ["cotton_tunnel", "routec"],
  },
  candy_port: {
    name: "Bến Cảng Kẹo", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Bến Cảng Kẹo.",
    encounters: [],
    trainers: [],
    next: [],
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
    next: ["taba_ba_br_1", "taba_ba_main"],
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
    next: ["taba_ba_br_2", "taba_ba_main"],
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
    next: ["taba_ba_br_3", "taba_ba_main"],
  },
  taba_ba_passageway_4: {
    name: "Khu Thi Đấu Taba — Hành Lang 4", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Khu Thi Đấu Taba — Hành Lang 4.",
    encounters: [],
    trainers: [],
    next: ["taba_ba_br_4", "taba_ba_main"],
  },
  taba_ba_stairwell_1: {
    name: "Khu Thi Đấu Taba — Cầu Thang", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Khu Thi Đấu Taba — Cầu Thang.",
    encounters: [],
    trainers: [],
    next: ["taba_ba_main", "taba_ba_stairwell_2"],
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
    next: ["citypark_house1", "leather_town", "route2"],
  },
  brideswood: {
    name: "Rừng Cô Dâu", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Rừng Cô Dâu.",
    encounters: [],
    trainers: [],
    next: ["paper_town", "route1", "route2"],
  },
  omnichannel2: {
    name: "Toà Thương Trường — Tầng 2", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Toà Thương Trường — Tầng 2.",
    encounters: [],
    trainers: [],
    next: ["omnichannel1", "omnichannel3"],
  },
  route4: {
    name: "Đường Số 4", kind: "route", icon: "route", iconSp: null, iconItem: null,
    desc: "Khu vực Đường Số 4.",
    encounters: [],
    trainers: [],
    next: ["flower_city", "route3"],
  },
  routea: {
    name: "Đường Ven Biển", kind: "route", icon: "route", iconSp: null, iconItem: null,
    desc: "Khu vực Đường Ven Biển.",
    encounters: [],
    trainers: [],
    next: ["flower_city", "mansion", "mansion_top"],
  },
  route5: {
    name: "Route 5", kind: "route", icon: "route", iconSp: null, iconItem: null,
    desc: "Khu vực Route 5.",
    encounters: [],
    trainers: [],
    next: ["flower_city", "timber_town"],
  },
  dojo1: {
    name: "Võ Đường Thứ Nhất", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Võ Đường Thứ Nhất.",
    encounters: [],
    trainers: [],
    next: ["dojo2", "flower_city"],
  },
  nimrod_bottom: {
    name: "Tầng Dưới Thợ Săn", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Tầng Dưới Thợ Săn.",
    encounters: [],
    trainers: [],
    next: ["flower_city", "nimrod_middle", "nimrod_room"],
  },
  flower_petshop: {
    name: "Tiệm Thú Cưng Hoa", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Tiệm Thú Cưng Hoa.",
    encounters: [],
    trainers: [],
    next: [],
  },
  flower_house2: {
    name: "Nhà 2 Hoa", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà 2 Hoa.",
    encounters: [],
    trainers: [],
    next: [],
  },
  flower_house1: {
    name: "Nhà 1 Hoa", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà 1 Hoa.",
    encounters: [],
    trainers: [],
    next: [],
  },
  flower_center: {
    name: "Trung Tâm Hồi Phục Hoa", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Trung Tâm Hồi Phục Hoa.",
    encounters: [],
    trainers: [],
    next: [],
  },
  flower_scoop: {
    name: "Tiệm Kem Hoa", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Tiệm Kem Hoa.",
    encounters: [],
    trainers: [],
    next: [],
  },
  timber_town: {
    name: "Thị Trấn Gỗ", kind: "town", icon: "town", iconSp: null, iconItem: null,
    desc: "Khu vực Thị Trấn Gỗ.",
    encounters: [],
    trainers: [],
    next: ["candy_port", "flower_city", "leather_town", "paper_town", "route5", "routee", "scoop1", "timber_cafe", "timber_center", "timber_house", "timber_scoop", "timber_walledgarden1", "tunnel"],
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
    next: ["leather_town", "route4", "wayfarer_inn1"],
  },
  leather_scoop: {
    name: "Tiệm Tạp Hoá Da", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Tiệm Tạp Hoá Da.",
    encounters: [],
    trainers: [],
    next: ["leather_town"],
  },
  leather_museum: {
    name: "Bảo Tàng Da", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Bảo Tàng Da.",
    encounters: [],
    trainers: [],
    next: [],
  },
  leather_house1: {
    name: "Nhà 1 Da", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà 1 Da.",
    encounters: [],
    trainers: [],
    next: ["leather_town"],
  },
  leather_house2: {
    name: "Nhà 2 Da", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà 2 Da.",
    encounters: [],
    trainers: [],
    next: ["leather_town"],
  },
  leather_center: {
    name: "Trung Tâm Hồi Phục Da", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Trung Tâm Hồi Phục Da.",
    encounters: [],
    trainers: [],
    next: [],
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
  leather_gym: {
    name: "Võ Đường Da", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Võ Đường Da.",
    encounters: [],
    trainers: [],
    next: [],
  },
  route6: {
    name: "Route 6", kind: "route", icon: "route", iconSp: null, iconItem: null,
    desc: "Khu vực Route 6.",
    encounters: [],
    trainers: [],
    next: ["candy_town", "tunnel"],
  },
  candy_house1: {
    name: "Nhà 1 Kẹo", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà 1 Kẹo.",
    encounters: [],
    trainers: [],
    next: ["candy_town"],
  },
  candy_center: {
    name: "Trung Tâm Hồi Phục Kẹo", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Trung Tâm Hồi Phục Kẹo.",
    encounters: [],
    trainers: [],
    next: [],
  },
  greenwash: {
    name: "Thị Trấn Xanh", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Thị Trấn Xanh.",
    encounters: [],
    trainers: [],
    next: ["candy_town", "greenwash_greenhouse", "greenwash_level2"],
  },
  candy_cafe: {
    name: "Quán Cà Phê Kẹo", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Quán Cà Phê Kẹo.",
    encounters: [],
    trainers: [],
    next: [],
  },
  candy_scoop: {
    name: "Tiệm Kem Kẹo", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Tiệm Kem Kẹo.",
    encounters: [],
    trainers: [],
    next: ["candy_town"],
  },
  greenwash_greenhouse: {
    name: "Nhà Kính Xanh", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà Kính Xanh.",
    encounters: [],
    trainers: [],
    next: ["candy_town", "greenwash"],
  },
  candy_house3: {
    name: "Nhà 3 Kẹo", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà 3 Kẹo.",
    encounters: [],
    trainers: [],
    next: ["candy_town"],
  },
  candy_house2: {
    name: "Nhà 2 Kẹo", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà 2 Kẹo.",
    encounters: [],
    trainers: [],
    next: ["candy_town"],
  },
  downstairs: {
    name: "Nhà Dân — Tầng Trệt", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà Dân — Tầng Trệt.",
    encounters: [],
    trainers: [],
    next: ["paper_town"],
  },
  paper_daycare: {
    name: "Nhà Trẻ Giấy", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà Trẻ Giấy.",
    encounters: [],
    trainers: [],
    next: [],
  },
  paper_scoop: {
    name: "Tiệm Kem Giấy", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Tiệm Kem Giấy.",
    encounters: [],
    trainers: [],
    next: [],
  },
  paper_manor: {
    name: "Dinh Thự Giấy", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Dinh Thự Giấy.",
    encounters: [],
    trainers: [],
    next: [],
  },
  paper_rival_downstairs: {
    name: "Nhà Đối Thủ Giấy", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà Đối Thủ Giấy.",
    encounters: [],
    trainers: [],
    next: [],
  },
  taba_ba_br_1: {
    name: "Phòng Nghỉ 1 Taba", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Phòng Nghỉ 1 Taba.",
    encounters: [],
    trainers: [],
    next: ["taba_ba_main", "taba_ba_passageway_1"],
  },
  taba_ba_br_2: {
    name: "Phòng Nghỉ 2 Taba", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Phòng Nghỉ 2 Taba.",
    encounters: [],
    trainers: [],
    next: ["taba_ba_main", "taba_ba_passageway_2"],
  },
  taba_ba_br_3: {
    name: "Phòng Nghỉ 3 Taba", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Phòng Nghỉ 3 Taba.",
    encounters: [],
    trainers: [],
    next: ["taba_ba_main", "taba_ba_passageway_3"],
  },
  taba_ba_br_4: {
    name: "Phòng Nghỉ 4 Taba", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Phòng Nghỉ 4 Taba.",
    encounters: [],
    trainers: [],
    next: ["taba_ba_main", "taba_ba_passageway_4"],
  },
  taba_ba_stairwell_2: {
    name: "Cầu Thang 2 Taba", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Cầu Thang 2 Taba.",
    encounters: [],
    trainers: [],
    next: ["taba_ba_stairwell_1"],
  },
  citypark_house1: {
    name: "Nhà Bên Công Viên", kind: "town", icon: "town", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà Bên Công Viên.",
    encounters: [],
    trainers: [],
    next: ["citypark"],
  },
  omnichannel3: {
    name: "Toà Thương Trường — Tầng 3", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Toà Thương Trường — Tầng 3.",
    encounters: [],
    trainers: [],
    next: ["omnichannel2"],
  },
  mansion: {
    name: "Dinh Thự Cổ", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Dinh Thự Cổ.",
    encounters: [],
    trainers: [],
    next: ["mansion_top", "routea"],
  },
  mansion_top: {
    name: "Tầng Trên Dinh Thự", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Tầng Trên Dinh Thự.",
    encounters: [],
    trainers: [],
    next: ["mansion", "routea"],
  },
  dojo2: {
    name: "Võ Đường Thứ Hai", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Võ Đường Thứ Hai.",
    encounters: [],
    trainers: [],
    next: ["dojo1"],
  },
  nimrod_middle: {
    name: "Tầng Giữa Thợ Săn", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Tầng Giữa Thợ Săn.",
    encounters: [],
    trainers: [],
    next: ["nimrod_bottom", "nimrod_room"],
  },
  nimrod_room: {
    name: "Phòng Thợ Săn", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Phòng Thợ Săn.",
    encounters: [],
    trainers: [],
    next: [],
  },
  tunnel: {
    name: "Đường Hầm Xuyên Núi", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Đường Hầm Xuyên Núi.",
    encounters: [],
    trainers: [],
    next: ["route6", "routee", "timber_town"],
  },
  scoop1: {
    name: "Tiệm Kem Đầu Phố", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Tiệm Kem Đầu Phố.",
    encounters: [],
    trainers: [],
    next: ["timber_town"],
  },
  timber_center: {
    name: "Trung Tâm Hồi Phục Gỗ", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Trung Tâm Hồi Phục Gỗ.",
    encounters: [],
    trainers: [],
    next: [],
  },
  timber_scoop: {
    name: "Tiệm Kem Gỗ", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Tiệm Kem Gỗ.",
    encounters: [],
    trainers: [],
    next: ["timber_town"],
  },
  routee: {
    name: "Đường Sương Mù", kind: "route", icon: "route", iconSp: null, iconItem: null,
    desc: "Khu vực Đường Sương Mù.",
    encounters: [],
    trainers: [],
    next: ["timber_town", "tunnel"],
  },
  timber_cafe: {
    name: "Quán Cà Phê Gỗ", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Quán Cà Phê Gỗ.",
    encounters: [],
    trainers: [],
    next: [],
  },
  timber_house: {
    name: "Nhà Gỗ", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Nhà Gỗ.",
    encounters: [],
    trainers: [],
    next: ["timber_town"],
  },
  timber_walledgarden1: {
    name: "Vườn Tường 1 Gỗ", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Vườn Tường 1 Gỗ.",
    encounters: [],
    trainers: [],
    next: ["timber_town"],
  },
  wayfarer_inn1: {
    name: "Quán Trọ 1 Lữ Khách", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Quán Trọ 1 Lữ Khách.",
    encounters: [],
    trainers: [],
    next: ["nimrod_room", "route3"],
  },
  greenwash_level2: {
    name: "Tầng 2 Xanh", kind: "indoor", icon: "indoor", iconSp: null, iconItem: null,
    desc: "Khu vực Tầng 2 Xanh.",
    encounters: [],
    trainers: [],
    next: ["greenwash"],
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
