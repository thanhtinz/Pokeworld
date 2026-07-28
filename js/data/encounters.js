// TuxeWorld H5 | data/encounters.js | Bảng gặp Tuxemon hoang — TỰ SINH TỪ tools/mktmx.py
// Nguồn: db/encounter của Tuxemon, lấy theo đúng lệnh random_encounter ghi
// trong từng bản đồ. w = trọng số, min/max = khoảng cấp.

export const ENCOUNTERS = {
  taba_town: [{ sp: 22, w: 5, min: 3, max: 6 }, { sp: 45, w: 5, min: 2, max: 4 }, { sp: 51, w: 5, min: 2, max: 4 }, { sp: 57, w: 5, min: 3, max: 6 }, { sp: 60, w: 5, min: 3, max: 6 }, { sp: 64, w: 5, min: 2, max: 4 }, { sp: 80, w: 5, min: 2, max: 4 }, { sp: 91, w: 5, min: 2, max: 4 }, { sp: 111, w: 5, min: 3, max: 6 }, { sp: 139, w: 5, min: 3, max: 6 }],
  route1: [{ sp: 22, w: 5, min: 3, max: 6 }, { sp: 45, w: 5, min: 2, max: 4 }, { sp: 51, w: 5, min: 2, max: 4 }, { sp: 57, w: 5, min: 3, max: 6 }, { sp: 60, w: 5, min: 3, max: 6 }, { sp: 64, w: 5, min: 2, max: 4 }, { sp: 80, w: 5, min: 2, max: 4 }, { sp: 91, w: 5, min: 2, max: 4 }, { sp: 111, w: 5, min: 3, max: 6 }, { sp: 139, w: 5, min: 3, max: 6 }],
  dryadsgrove: [{ sp: 28, w: 10, min: 25, max: 28 }, { sp: 95, w: 30, min: 25, max: 28 }, { sp: 96, w: 30, min: 25, max: 28 }, { sp: 104, w: 30, min: 28, max: 30 }, { sp: 123, w: 10, min: 25, max: 28 }, { sp: 141, w: 10, min: 20, max: 25 }],
  route1_sanglorian: [{ sp: 22, w: 5, min: 3, max: 6 }, { sp: 45, w: 5, min: 2, max: 4 }, { sp: 51, w: 5, min: 2, max: 4 }, { sp: 57, w: 5, min: 3, max: 6 }, { sp: 60, w: 5, min: 3, max: 6 }, { sp: 64, w: 5, min: 2, max: 4 }, { sp: 80, w: 5, min: 2, max: 4 }, { sp: 91, w: 5, min: 2, max: 4 }, { sp: 111, w: 5, min: 3, max: 6 }, { sp: 139, w: 5, min: 3, max: 6 }],
  route2: [{ sp: 51, w: 50, min: 3, max: 8 }, { sp: 60, w: 50, min: 3, max: 8 }, { sp: 64, w: 50, min: 3, max: 8 }, { sp: 80, w: 50, min: 3, max: 6 }, { sp: 119, w: 20, min: 4, max: 8 }],
  citypark: [{ sp: 51, w: 30, min: 6, max: 9 }, { sp: 52, w: 10, min: 9, max: 14 }, { sp: 62, w: 30, min: 8, max: 12 }, { sp: 64, w: 30, min: 5, max: 8 }, { sp: 80, w: 30, min: 5, max: 8 }, { sp: 81, w: 10, min: 8, max: 11 }, { sp: 119, w: 30, min: 8, max: 12 }, { sp: 141, w: 10, min: 8, max: 12 }],
  route3: [{ sp: 57, w: 60, min: 7, max: 12 }, { sp: 62, w: 20, min: 8, max: 12 }, { sp: 80, w: 60, min: 7, max: 12 }, { sp: 95, w: 60, min: 7, max: 12 }],
  taba_ba_passageway_1: [{ sp: 22, w: 2, min: 4, max: 7 }, { sp: 60, w: 35, min: 3, max: 6 }, { sp: 158, w: 35, min: 2, max: 5 }],
  taba_ba_passageway_2: [{ sp: 22, w: 16, min: 5, max: 8 }, { sp: 60, w: 30, min: 4, max: 6 }, { sp: 241, w: 30, min: 4, max: 6 }],
  taba_ba_passageway_3: [{ sp: 22, w: 8, min: 6, max: 8 }, { sp: 28, w: 30, min: 5, max: 7 }, { sp: 74, w: 30, min: 5, max: 7 }],
};
