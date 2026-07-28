// TuxeWorld H5 | data/encounters.js | Bảng gặp Tuxemon hoang — TỰ SINH TỪ tools/mktmx.py
// Nguồn: db/encounter của Tuxemon, lấy theo đúng lệnh random_encounter ghi
// trong từng bản đồ. w = trọng số, min/max = khoảng cấp.

export const ENCOUNTERS = {
  taba_town: [{ sp: 22, w: 5, min: 3, max: 6 }, { sp: 45, w: 5, min: 2, max: 4 }, { sp: 51, w: 5, min: 2, max: 4 }, { sp: 57, w: 5, min: 3, max: 6 }, { sp: 60, w: 5, min: 3, max: 6 }, { sp: 64, w: 5, min: 2, max: 4 }, { sp: 80, w: 5, min: 2, max: 4 }, { sp: 91, w: 5, min: 2, max: 4 }, { sp: 111, w: 5, min: 3, max: 6 }, { sp: 139, w: 5, min: 3, max: 6 }],
  route1: [{ sp: 22, w: 5, min: 3, max: 6 }, { sp: 45, w: 5, min: 2, max: 4 }, { sp: 51, w: 5, min: 2, max: 4 }, { sp: 57, w: 5, min: 3, max: 6 }, { sp: 60, w: 5, min: 3, max: 6 }, { sp: 64, w: 5, min: 2, max: 4 }, { sp: 80, w: 5, min: 2, max: 4 }, { sp: 91, w: 5, min: 2, max: 4 }, { sp: 111, w: 5, min: 3, max: 6 }, { sp: 139, w: 5, min: 3, max: 6 }],
  dryadsgrove: [{ sp: 28, w: 10, min: 25, max: 28 }, { sp: 95, w: 30, min: 25, max: 28 }, { sp: 96, w: 30, min: 25, max: 28 }, { sp: 104, w: 30, min: 28, max: 30 }, { sp: 123, w: 10, min: 25, max: 28 }, { sp: 141, w: 10, min: 20, max: 25 }],
  route1_sanglorian: [{ sp: 22, w: 5, min: 3, max: 6 }, { sp: 45, w: 5, min: 2, max: 4 }, { sp: 51, w: 5, min: 2, max: 4 }, { sp: 57, w: 5, min: 3, max: 6 }, { sp: 60, w: 5, min: 3, max: 6 }, { sp: 64, w: 5, min: 2, max: 4 }, { sp: 80, w: 5, min: 2, max: 4 }, { sp: 91, w: 5, min: 2, max: 4 }, { sp: 111, w: 5, min: 3, max: 6 }, { sp: 139, w: 5, min: 3, max: 6 }],
  cotton_tunnel: [{ sp: 184, w: 35, min: 35, max: 40 }, { sp: 208, w: 35, min: 30, max: 35 }, { sp: 212, w: 35, min: 25, max: 35 }, { sp: 220, w: 35, min: 30, max: 35 }],
  routec: [{ sp: 25, w: 70, min: 22, max: 29 }, { sp: 70, w: 70, min: 22, max: 29 }, { sp: 71, w: 70, min: 22, max: 29 }, { sp: 72, w: 70, min: 22, max: 29 }, { sp: 73, w: 70, min: 22, max: 29 }, { sp: 132, w: 70, min: 22, max: 29 }, { sp: 170, w: 70, min: 22, max: 29 }],
  route2: [{ sp: 51, w: 50, min: 3, max: 8 }, { sp: 60, w: 50, min: 3, max: 8 }, { sp: 64, w: 50, min: 3, max: 8 }, { sp: 80, w: 50, min: 3, max: 6 }, { sp: 119, w: 20, min: 4, max: 8 }],
  omnichannel1: [{ sp: 5, w: 5, min: 30, max: 31 }, { sp: 18, w: 5, min: 30, max: 31 }],
  candy_town: [{ sp: 25, w: 70, min: 22, max: 29 }, { sp: 70, w: 70, min: 22, max: 29 }, { sp: 71, w: 70, min: 22, max: 29 }, { sp: 72, w: 70, min: 22, max: 29 }, { sp: 73, w: 70, min: 22, max: 29 }, { sp: 132, w: 70, min: 22, max: 29 }, { sp: 170, w: 70, min: 22, max: 29 }],
  paper_town: [{ sp: 25, w: 70, min: 22, max: 29 }, { sp: 70, w: 70, min: 22, max: 29 }, { sp: 71, w: 70, min: 22, max: 29 }, { sp: 72, w: 70, min: 22, max: 29 }, { sp: 73, w: 70, min: 22, max: 29 }, { sp: 132, w: 70, min: 22, max: 29 }, { sp: 170, w: 70, min: 22, max: 29 }],
  dragonscave: [{ sp: 31, w: 60, min: 25, max: 30 }, { sp: 32, w: 20, min: 20, max: 28 }, { sp: 93, w: 60, min: 25, max: 30 }, { sp: 94, w: 20, min: 20, max: 28 }],
  candy_port: [{ sp: 25, w: 70, min: 22, max: 29 }, { sp: 70, w: 70, min: 22, max: 29 }, { sp: 71, w: 70, min: 22, max: 29 }, { sp: 72, w: 70, min: 22, max: 29 }, { sp: 73, w: 70, min: 22, max: 29 }, { sp: 132, w: 70, min: 22, max: 29 }, { sp: 170, w: 70, min: 22, max: 29 }],
  taba_ba_passageway_1: [{ sp: 22, w: 2, min: 4, max: 7 }, { sp: 60, w: 35, min: 3, max: 6 }, { sp: 158, w: 35, min: 2, max: 5 }],
  taba_ba_passageway_2: [{ sp: 22, w: 16, min: 5, max: 8 }, { sp: 60, w: 30, min: 4, max: 6 }, { sp: 241, w: 30, min: 4, max: 6 }],
  taba_ba_passageway_3: [{ sp: 22, w: 8, min: 6, max: 8 }, { sp: 28, w: 30, min: 5, max: 7 }, { sp: 74, w: 30, min: 5, max: 7 }],
  citypark: [{ sp: 51, w: 30, min: 6, max: 9 }, { sp: 52, w: 10, min: 9, max: 14 }, { sp: 62, w: 30, min: 8, max: 12 }, { sp: 64, w: 30, min: 5, max: 8 }, { sp: 80, w: 30, min: 5, max: 8 }, { sp: 81, w: 10, min: 8, max: 11 }, { sp: 119, w: 30, min: 8, max: 12 }, { sp: 141, w: 10, min: 8, max: 12 }],
  omnichannel2: [{ sp: 5, w: 5, min: 30, max: 31 }, { sp: 18, w: 5, min: 30, max: 31 }],
  route4: [{ sp: 57, w: 60, min: 11, max: 16 }, { sp: 74, w: 60, min: 11, max: 16 }, { sp: 103, w: 20, min: 12, max: 16 }, { sp: 293, w: 60, min: 11, max: 16 }],
  routea: [{ sp: 54, w: 15, min: 14, max: 18 }, { sp: 74, w: 70, min: 12, max: 18 }, { sp: 83, w: 30, min: 12, max: 18 }, { sp: 95, w: 35, min: 12, max: 15 }, { sp: 249, w: 10, min: 14, max: 18 }],
  route5: [{ sp: 54, w: 30, min: 16, max: 20 }, { sp: 55, w: 10, min: 18, max: 22 }, { sp: 83, w: 30, min: 18, max: 22 }, { sp: 84, w: 10, min: 22, max: 26 }, { sp: 128, w: 30, min: 19, max: 23 }],
  route3: [{ sp: 57, w: 60, min: 7, max: 12 }, { sp: 62, w: 20, min: 8, max: 12 }, { sp: 80, w: 60, min: 7, max: 12 }, { sp: 95, w: 60, min: 7, max: 12 }],
  route6: [{ sp: 91, w: 200, min: 19, max: 24 }, { sp: 92, w: 100, min: 21, max: 24 }, { sp: 120, w: 200, min: 19, max: 24 }],
  greenwash_greenhouse: [{ sp: 22, w: 50, min: 20, max: 25 }, { sp: 101, w: 50, min: 20, max: 25 }, { sp: 122, w: 50, min: 15, max: 25 }, { sp: 137, w: 50, min: 15, max: 25 }, { sp: 253, w: 50, min: 15, max: 25 }],
  omnichannel3: [{ sp: 5, w: 5, min: 30, max: 31 }, { sp: 18, w: 5, min: 30, max: 31 }],
  mansion_top: [{ sp: 89, w: 60, min: 13, max: 18 }, { sp: 126, w: 20, min: 14, max: 18 }, { sp: 134, w: 60, min: 13, max: 18 }, { sp: 135, w: 60, min: 13, max: 18 }],
};
