// TuxeWorld server | src/boss.data.js | BẢN SAO của js/data/bosses.js
// SINH TỰ ĐỘNG bởi tools/mkboss.py — KHONG SUA TAY.
// Máy chủ tự tra máu và trần sát thương của từng boss, không tin số client gửi lên.

export const BOSS_HE_SO = 60;

// hpMax = thanh máu CHUNG của cả máy chủ, không phải máu con Tuxemon.
// heSo  = sát thương thật trong trận nhân lên bấy nhiêu lần.
// capMoiLan = một lần đánh trừ được nhiều nhất bằng này.
export const BOSSES = [
  { id: "khu_candy_town", kind: "khu", zone: "candy_town", name: "Chúa Tể Tweesher", sp: 25, lv: 37, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_citypark", kind: "khu", zone: "citypark", name: "Đầu Đàn Sprightly", sp: 354, lv: 24, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_cotton_town", kind: "khu", zone: "cotton_town", name: "Bá Vương Imbrickcile", sp: 277, lv: 22, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_dragonscave", kind: "khu", zone: "dragonscave", name: "Cổ Thú Agnite", sp: 31, lv: 38, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_dryadsgrove", kind: "khu", zone: "dryadsgrove", name: "Hung Thần Sapsnap", sp: 104, lv: 38, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_flower_city", kind: "khu", zone: "flower_city", name: "Thủ Lĩnh Axolightl", sp: 119, lv: 34, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_greenwash_greenhouse", kind: "khu", zone: "greenwash_greenhouse", name: "Lão Tướng Nut", sp: 22, lv: 33, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_leather_shaft1", kind: "khu", zone: "leather_shaft1", name: "Ác Mộng Allagon", sp: 178, lv: 33, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_leather_shaft2", kind: "khu", zone: "leather_shaft2", name: "Chúa Tể Brewdin", sp: 233, lv: 32, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_leather_town", kind: "khu", zone: "leather_town", name: "Đầu Đàn Forturtle", sp: 105, lv: 26, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_mansion_top", kind: "khu", zone: "mansion_top", name: "Bá Vương Cairfrey", sp: 89, lv: 26, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_paper_town", kind: "khu", zone: "paper_town", name: "Cổ Thú Tweesher", sp: 25, lv: 37, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_route1", kind: "khu", zone: "route1", name: "Hung Thần Aardorn", sp: 60, lv: 20, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_route1_sanglorian", kind: "khu", zone: "route1_sanglorian", name: "Thủ Lĩnh Boltnu", sp: 212, lv: 20, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_route2", kind: "khu", zone: "route2", name: "Lão Tướng Helipi", sp: 394, lv: 22, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_route3", kind: "khu", zone: "route3", name: "Ác Mộng Agnite", sp: 31, lv: 28, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_route4", kind: "khu", zone: "route4", name: "Chúa Tể Elofly", sp: 57, lv: 24, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_route5", kind: "khu", zone: "route5", name: "Đầu Đàn Gectile", sp: 84, lv: 34, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_routea", kind: "khu", zone: "routea", name: "Bá Vương Vamporm", sp: 54, lv: 26, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_routec", kind: "khu", zone: "routec", name: "Cổ Thú Tweesher", sp: 25, lv: 37, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_taba_ba_passageway_1", kind: "khu", zone: "taba_ba_passageway_1", name: "Hung Thần Angesnow", sp: 281, lv: 39, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_taba_ba_passageway_2", kind: "khu", zone: "taba_ba_passageway_2", name: "Thủ Lĩnh Ampystoma", sp: 298, lv: 41, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_taba_ba_passageway_3", kind: "khu", zone: "taba_ba_passageway_3", name: "Lão Tướng Fluoresfin", sp: 86, lv: 40, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "khu_taba_town", kind: "khu", zone: "taba_town", name: "Ác Mộng Nut", sp: 22, lv: 20, hpMax: 240000, heSo: 60, capMoiLan: 9600 },
  { id: "the_gioi_1", kind: "the_gioi", zone: null, name: "Bạo Chúa Agnsher", sp: 1, lv: 90, hpMax: 1200000, heSo: 60, capMoiLan: 48000 },
  { id: "the_gioi_2", kind: "the_gioi", zone: null, name: "Bạo Chúa Bearloch", sp: 2, lv: 93, hpMax: 1400000, heSo: 60, capMoiLan: 56000 },
  { id: "the_gioi_3", kind: "the_gioi", zone: null, name: "Bạo Chúa Chrome Robo", sp: 3, lv: 96, hpMax: 1600000, heSo: 60, capMoiLan: 64000 },
  { id: "the_gioi_4", kind: "the_gioi", zone: null, name: "Bạo Chúa D0Llf1N", sp: 4, lv: 99, hpMax: 1800000, heSo: 60, capMoiLan: 72000 },
];

export const BOSS_BY_ID = Object.fromEntries(BOSSES.map(b => [b.id, b]));
