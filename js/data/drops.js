// TuxeWorld H5 | data/drops.js | Nguyên liệu rơi từ Tuxemon hoang
// SINH TU DONG boi tools/mkrecipes.py — KHONG SUA TAY.
//
// Bản gốc Tuxemon không có hệ thống rơi đồ: nguyên liệu nấu ăn
// không bán ở đâu, không rơi ở đâu, nên màn Nhà Bếp chỉ để ngắm.
// Bảng này gắn mỗi nguyên liệu với vài HỆ cho hợp lẽ — đánh con
// hệ Lửa thì ra tiêu, gia vị; con hệ Gỗ thì ra rau, vỏ cây.

export const TI_LE_ROI = 0.34;

export const ROI_THEO_HE = {
  cosmic: [{"id": "glowfat", "w": 9}],
  earth: [{"id": "meal_dust", "w": 8}, {"id": "root_beast_bark", "w": 7}, {"id": "stonefruit_bulbs", "w": 12}, {"id": "suncrust_butter", "w": 4}, {"id": "sweetroot", "w": 6}],
  fire: [{"id": "flamehorn_shank", "w": 10}, {"id": "glowfat", "w": 5}, {"id": "spice_dust", "w": 7}, {"id": "starpepper", "w": 9}, {"id": "suncrust_butter", "w": 4}],
  frost: [{"id": "beastmoss", "w": 6}, {"id": "sky_feather", "w": 7}],
  heroic: [{"id": "flamehorn_shank", "w": 8}, {"id": "moo_bloom", "w": 4}, {"id": "zestroot_wraps", "w": 6}],
  lightning: [{"id": "glowfat", "w": 7}],
  metal: [{"id": "crackle_salt", "w": 6}],
  normal: [{"id": "crackle_salt", "w": 4}, {"id": "meal_dust", "w": 5}, {"id": "mistflour_eggs", "w": 6}, {"id": "moo_bloom", "w": 7}, {"id": "suncrust_butter", "w": 6}],
  shadow: [{"id": "beastmoss", "w": 10}, {"id": "spice_dust", "w": 5}],
  sky: [{"id": "mistflour_eggs", "w": 8}, {"id": "sky_feather", "w": 12}],
  venom: [{"id": "spice_dust", "w": 7}, {"id": "starpepper", "w": 6}, {"id": "zestsap", "w": 7}],
  water: [{"id": "crackle_salt", "w": 8}, {"id": "field_greens", "w": 6}],
  wood: [{"id": "beastmoss", "w": 6}, {"id": "field_greens", "w": 10}, {"id": "meal_dust", "w": 4}, {"id": "moo_bloom", "w": 5}, {"id": "root_beast_bark", "w": 10}, {"id": "stonefruit_bulbs", "w": 8}, {"id": "sweetroot", "w": 8}, {"id": "zestroot_wraps", "w": 9}, {"id": "zestsap", "w": 12}],
};
