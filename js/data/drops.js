// TuxeWorld H5 | data/drops.js | Món ăn rơi từ Tuxemon hoang
// SINH TU DONG boi tools/mkmonan.py — KHONG SUA TAY.
//
// Bản gốc Tuxemon không có hệ thống rơi đồ, mà món ăn cũng không
// bán ở đâu. Bảng này cho mỗi hệ vài món hợp lẽ: món vị Mặn (cộng
// Cận chiến) rơi ở mấy hệ đánh gần, món vị Thanh (cộng Tầm xa) rơi
// ở mấy hệ đánh xa.

export const TI_LE_ROI = 0.34;

export const ROI_THEO_HE = {
  cosmic: [{"id": "cheesecake", "w": 9}, {"id": "cream_puffs", "w": 9}, {"id": "crepes", "w": 9}, {"id": "mille_feuille", "w": 9}, {"id": "rub_pork_chops", "w": 9}],
  earth: [{"id": "croissants", "w": 5}, {"id": "hash", "w": 9}, {"id": "honey_cake", "w": 9}, {"id": "mashed_potatoes", "w": 5}, {"id": "pie", "w": 9}, {"id": "potato_fries", "w": 5}, {"id": "pretzels", "w": 5}, {"id": "rub_chicken", "w": 5}, {"id": "rub_ribs", "w": 9}, {"id": "souffle", "w": 9}],
  fire: [{"id": "pancakes", "w": 7}, {"id": "pastry", "w": 7}, {"id": "pita", "w": 7}, {"id": "pudding", "w": 7}, {"id": "wings", "w": 7}],
  heroic: [{"id": "croissants", "w": 9}, {"id": "mashed_potatoes", "w": 9}, {"id": "potato_fries", "w": 9}, {"id": "pretzels", "w": 9}, {"id": "rub_chicken", "w": 9}],
  lightning: [{"id": "meatballs", "w": 7}, {"id": "pancakes", "w": 9}, {"id": "pastry", "w": 9}, {"id": "phyllo", "w": 7}, {"id": "pita", "w": 9}, {"id": "potato_casserole", "w": 7}, {"id": "pudding", "w": 9}, {"id": "rub_steak", "w": 7}, {"id": "shell_tacos", "w": 7}, {"id": "wings", "w": 9}],
  metal: [{"id": "croissants", "w": 7}, {"id": "hash", "w": 7}, {"id": "honey_cake", "w": 7}, {"id": "mashed_potatoes", "w": 7}, {"id": "pie", "w": 7}, {"id": "potato_fries", "w": 7}, {"id": "pretzels", "w": 7}, {"id": "rub_chicken", "w": 7}, {"id": "rub_ribs", "w": 7}, {"id": "souffle", "w": 7}],
  shadow: [{"id": "cheesecake", "w": 7}, {"id": "cream_puffs", "w": 7}, {"id": "crepes", "w": 7}, {"id": "mille_feuille", "w": 7}, {"id": "rub_pork_chops", "w": 7}],
  sky: [{"id": "meatballs", "w": 9}, {"id": "pancakes", "w": 5}, {"id": "pastry", "w": 5}, {"id": "phyllo", "w": 9}, {"id": "pita", "w": 5}, {"id": "potato_casserole", "w": 9}, {"id": "pudding", "w": 5}, {"id": "rub_steak", "w": 9}, {"id": "shell_tacos", "w": 9}, {"id": "wings", "w": 5}],
  venom: [{"id": "cheesecake", "w": 5}, {"id": "cream_puffs", "w": 5}, {"id": "crepes", "w": 5}, {"id": "mille_feuille", "w": 5}, {"id": "rub_pork_chops", "w": 5}],
  water: [{"id": "meatballs", "w": 5}, {"id": "phyllo", "w": 5}, {"id": "potato_casserole", "w": 5}, {"id": "rub_steak", "w": 5}, {"id": "shell_tacos", "w": 5}],
  wood: [{"id": "hash", "w": 5}, {"id": "honey_cake", "w": 5}, {"id": "pie", "w": 5}, {"id": "rub_ribs", "w": 5}, {"id": "souffle", "w": 5}],
};
