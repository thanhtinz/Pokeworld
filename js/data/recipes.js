// TuxeWorld H5 | data/recipes.js | Công thức nấu ăn
// SINH TU DONG boi tools/mkrecipes.py tu mods/recipes.yaml — KHONG SUA TAY.
//
// ng  = nguyên liệu cần (mã món -> số lượng)
// out = kết quả có thể ra, w là trọng số (cộng lại chưa chắc bằng 1)

export const CACH_LAM = {"cooking": "Nấu ăn", "brewing": "Pha chế", "baking": "Nướng bánh", "alchemy": "Luyện đan", "crafting": "Thủ công"};

export const RECIPES = [
  { id: "rub_pork_chops", cach: "cooking", ng: {"root_beast_bark": 2, "glowfat": 1, "crackle_salt": 1, "starpepper": 1, "sweetroot": 1}, out: [{"id": "rub_pork_chops", "n": 1, "w": 0.9}, {"id": "bite_of_despair", "n": 1, "w": 0.1}] },
  { id: "mille_feuille", cach: "cooking", ng: {"meal_dust": 2, "sweetroot": 1, "mistflour_eggs": 2, "suncrust_butter": 1, "moo_bloom": 1, "crackle_salt": 1}, out: [{"id": "mille_feuille", "n": 1, "w": 0.8}, {"id": "whispersoup", "n": 1, "w": 0.2}] },
  { id: "cheesecake", cach: "cooking", ng: {"mistflour_eggs": 2, "moo_bloom": 1, "glowfat": 1, "suncrust_butter": 1, "crackle_salt": 1}, out: [{"id": "cheesecake", "n": 1, "w": 0.8}, {"id": "inferno_custard", "n": 1, "w": 0.2}] },
  { id: "cream_puffs", cach: "cooking", ng: {"sweetroot": 2, "mistflour_eggs": 2, "glowfat": 1, "moo_bloom": 1, "meal_dust": 1, "crackle_salt": 1}, out: [{"id": "cream_puffs", "n": 1, "w": 0.9}, {"id": "bite_of_despair", "n": 1, "w": 0.1}] },
  { id: "crepes", cach: "cooking", ng: {"meal_dust": 2, "sweetroot": 1, "mistflour_eggs": 2, "suncrust_butter": 1, "crackle_salt": 1, "starpepper": 1}, out: [{"id": "crepes", "n": 1, "w": 0.9}, {"id": "whispersoup", "n": 1, "w": 0.1}] },
  { id: "rub_steak", cach: "cooking", ng: {"flamehorn_shank": 1, "glowfat": 1, "crackle_salt": 1, "starpepper": 1, "sweetroot": 1}, out: [{"id": "rub_steak", "n": 1, "w": 0.9}, {"id": "bite_of_despair", "n": 1, "w": 0.1}] },
  { id: "meatballs", cach: "cooking", ng: {"stonefruit_bulbs": 2, "meal_dust": 1, "mistflour_eggs": 2, "zestsap": 1, "crackle_salt": 1, "starpepper": 1}, out: [{"id": "meatballs", "n": 2, "w": 0.8}, {"id": "inferno_custard", "n": 1, "w": 0.2}] },
  { id: "shell_tacos", cach: "cooking", ng: {"zestroot_wraps": 2, "zestsap": 1, "moo_bloom": 1, "field_greens": 1, "crackle_salt": 1}, out: [{"id": "shell_tacos", "n": 1, "w": 0.9}, {"id": "bite_of_despair", "n": 1, "w": 0.1}] },
  { id: "potato_casserole", cach: "cooking", ng: {"stonefruit_bulbs": 2, "zestsap": 1, "moo_bloom": 1, "sweetroot": 1, "crackle_salt": 1}, out: [{"id": "potato_casserole", "n": 1, "w": 0.8}, {"id": "dread_omelette", "n": 1, "w": 0.2}] },
  { id: "phyllo", cach: "cooking", ng: {"meal_dust": 1, "sweetroot": 1, "mistflour_eggs": 1, "suncrust_butter": 1, "zestsap": 1, "crackle_salt": 1}, out: [{"id": "phyllo", "n": 1, "w": 0.9}, {"id": "bite_of_despair", "n": 1, "w": 0.1}] },
  { id: "croissants", cach: "cooking", ng: {"meal_dust": 1, "sweetroot": 1, "mistflour_eggs": 1, "suncrust_butter": 1, "crackle_salt": 1, "spice_dust": 1}, out: [{"id": "croissants", "n": 1, "w": 0.8}, {"id": "dread_omelette", "n": 1, "w": 0.2}] },
  { id: "rub_chicken", cach: "cooking", ng: {"sky_feather": 1, "glowfat": 1, "crackle_salt": 1, "starpepper": 1}, out: [{"id": "rub_chicken", "n": 1, "w": 0.9}, {"id": "bite_of_despair", "n": 1, "w": 0.1}] },
  { id: "potato_fries", cach: "cooking", ng: {"stonefruit_bulbs": 1, "glowfat": 1, "crackle_salt": 1, "sweetroot": 1}, out: [{"id": "potato_fries", "n": 1, "w": 0.8}, {"id": "dread_omelette", "n": 1, "w": 0.2}] },
  { id: "pretzels", cach: "cooking", ng: {"meal_dust": 2, "sweetroot": 1, "mistflour_eggs": 1, "glowfat": 1, "crackle_salt": 1, "starpepper": 1}, out: [{"id": "pretzels", "n": 2, "w": 0.9}, {"id": "bite_of_despair", "n": 1, "w": 0.1}] },
  { id: "mashed_potatoes", cach: "cooking", ng: {"stonefruit_bulbs": 1, "moo_bloom": 1, "crackle_salt": 1}, out: [{"id": "mashed_potatoes", "n": 1, "w": 0.8}, {"id": "inferno_custard", "n": 1, "w": 0.2}] },
  { id: "rub_ribs", cach: "cooking", ng: {"stonefruit_bulbs": 2, "glowfat": 1, "crackle_salt": 1, "starpepper": 1}, out: [{"id": "rub_ribs", "n": 1, "w": 0.9}, {"id": "bite_of_despair", "n": 1, "w": 0.1}] },
  { id: "pie", cach: "cooking", ng: {"meal_dust": 1, "mistflour_eggs": 1, "suncrust_butter": 1, "beastmoss": 1, "crackle_salt": 1}, out: [{"id": "pie", "n": 1, "w": 0.8}, {"id": "whispersoup", "n": 1, "w": 0.2}] },
  { id: "honey_cake", cach: "cooking", ng: {"meal_dust": 1, "sweetroot": 1, "mistflour_eggs": 1, "suncrust_butter": 1, "spice_dust": 1}, out: [{"id": "honey_cake", "n": 1, "w": 0.9}, {"id": "bite_of_despair", "n": 1, "w": 0.1}] },
  { id: "souffle", cach: "cooking", ng: {"mistflour_eggs": 2, "moo_bloom": 1, "glowfat": 1, "zestsap": 1, "crackle_salt": 1}, out: [{"id": "souffle", "n": 1, "w": 0.8}, {"id": "dread_omelette", "n": 1, "w": 0.2}] },
  { id: "hash", cach: "cooking", ng: {"stonefruit_bulbs": 1, "field_greens": 1, "glowfat": 1, "crackle_salt": 1, "starpepper": 1}, out: [{"id": "hash", "n": 1, "w": 0.9}, {"id": "bite_of_despair", "n": 1, "w": 0.1}] },
  { id: "pita", cach: "cooking", ng: {"meal_dust": 2, "crackle_salt": 1, "glowfat": 1, "spice_dust": 1}, out: [{"id": "pita", "n": 1, "w": 0.8}, {"id": "whispersoup", "n": 1, "w": 0.2}] },
  { id: "pastry", cach: "cooking", ng: {"meal_dust": 2, "sweetroot": 1, "mistflour_eggs": 2, "suncrust_butter": 1, "spice_dust": 1}, out: [{"id": "pastry", "n": 1, "w": 0.9}, {"id": "bite_of_despair", "n": 1, "w": 0.1}] },
  { id: "pudding", cach: "cooking", ng: {"sweetroot": 2, "mistflour_eggs": 2, "glowfat": 1, "moo_bloom": 1, "meal_dust": 1}, out: [{"id": "pudding", "n": 1, "w": 0.8}, {"id": "inferno_custard", "n": 1, "w": 0.2}] },
  { id: "pancakes", cach: "cooking", ng: {"meal_dust": 2, "sweetroot": 1, "mistflour_eggs": 1, "suncrust_butter": 1, "spice_dust": 1}, out: [{"id": "pancakes", "n": 2, "w": 0.9}, {"id": "bite_of_despair", "n": 1, "w": 0.1}] },
  { id: "wings", cach: "cooking", ng: {"meal_dust": 2, "starpepper": 1, "crackle_salt": 1, "glowfat": 1, "mistflour_eggs": 1}, out: [{"id": "wings", "n": 1, "w": 0.8}, {"id": "inferno_custard", "n": 1, "w": 0.2}] },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map(r => [r.id, r]));
