// TuxeWorld H5 | data/fishing.js | Cấu hình câu cá — TỰ SINH TỪ tools/mkitems.py
// Nguồn: mods/fishing.yaml của Tuxemon (CC BY-SA 4.0). Đừng sửa tay.
// trigger = tỉ lệ cắn câu · lv = khoảng cấp · stages/shapes = lọc loài theo
// bậc tiến hoá và dáng thân, w = trọng số bốc dáng thân.

export const FISHING = {
  "fishing_rod": {"name": "Cần Câu", "trigger": 0.6, "lv": [5, 15], "stages": ["basic"], "shapes": ["polliwog", "piscine"], "w": {"polliwog": 0.7, "piscine": 0.3}, "env": "ocean", "envNight": "night_ocean"},
  "neptune": {"name": "Cần Neptune", "trigger": 0.8, "lv": [10, 25], "stages": ["basic", "stage1"], "shapes": ["polliwog", "piscine"], "w": {"polliwog": 0.3, "piscine": 0.7}, "env": "ocean", "envNight": "night_ocean"},
  "poseidon": {"name": "Cần Poseidon", "trigger": 0.95, "lv": [15, 40], "stages": ["stage2", "stage1"], "shapes": ["polliwog", "piscine", "leviathan"], "w": {"polliwog": 0.3, "piscine": 0.4, "leviathan": 0.3}, "env": "ocean", "envNight": "night_ocean"},
};

export const isRod = (id) => Object.prototype.hasOwnProperty.call(FISHING, id);
