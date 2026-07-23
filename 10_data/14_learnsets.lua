-- PokeWorld | 10_data/14_learnsets.lua | Bảng chiêu học theo cấp của từng loài
local PW = _G.PW or {}; _G.PW = PW

-- key = số dex; [level] = move id; tm = danh sách chiêu học qua máy TM
PW.learnsets = {
  [1] = { -- Bulbasaur
    [1]="tackle", [3]="growl", [7]="vine_whip", [13]="leech_seed", [20]="razor_leaf", [27]="poison_powder", [34]="solar_beam",
    tm={"body_slam", "double_edge", "mega_drain"},
  },
  [2] = { -- Ivysaur
    [1]="tackle", [3]="growl", [7]="vine_whip", [13]="leech_seed", [22]="razor_leaf", [30]="poison_powder", [38]="solar_beam",
    tm={"body_slam", "double_edge", "mega_drain"},
  },
  [3] = { -- Venusaur
    [1]="tackle", [3]="growl", [7]="vine_whip", [13]="leech_seed", [22]="razor_leaf", [30]="sleep_powder", [43]="solar_beam", [50]="mega_drain",
    tm={"body_slam", "double_edge", "hyper_beam"},
  },
  [4] = { -- Charmander
    [1]="scratch", [3]="growl", [7]="ember", [13]="leer", [20]="bite", [27]="flamethrower", [34]="body_slam",
    tm={"double_edge", "swift"},
  },
  [5] = { -- Charmeleon
    [1]="scratch", [3]="growl", [7]="ember", [13]="leer", [24]="bite", [33]="flamethrower", [42]="body_slam",
    tm={"double_edge", "swift"},
  },
  [6] = { -- Charizard
    [1]="scratch", [3]="growl", [7]="ember", [13]="leer", [24]="wing_attack", [36]="flamethrower", [46]="body_slam", [55]="hyper_beam",
    tm={"double_edge", "swift"},
  },
  [7] = { -- Squirtle
    [1]="tackle", [4]="tail_whip", [7]="water_gun", [13]="bubble", [20]="bite", [28]="bubble_beam", [35]="hydro_pump",
    tm={"body_slam", "double_edge"},
  },
  [8] = { -- Wartortle
    [1]="tackle", [4]="tail_whip", [7]="water_gun", [13]="bubble", [24]="bite", [31]="bubble_beam", [39]="hydro_pump",
    tm={"body_slam", "double_edge"},
  },
  [9] = { -- Blastoise
    [1]="tackle", [4]="tail_whip", [7]="water_gun", [13]="bubble", [24]="bite", [31]="bubble_beam", [42]="hydro_pump", [52]="hyper_beam",
    tm={"body_slam", "double_edge"},
  },
  [10] = { -- Caterpie
    [1]="tackle", [2]="string_shot", [8]="poison_sting",
    tm={},
  },
  [11] = { -- Metapod
    [1]="harden", [4]="string_shot",
    tm={},
  },
  [12] = { -- Butterfree
    [1]="confusion", [10]="gust", [13]="poison_powder", [15]="stun_spore", [17]="sleep_powder", [24]="psybeam", [32]="swift",
    tm={"solar_beam", "hyper_beam"},
  },
  [16] = { -- Pidgey
    [1]="tackle", [5]="growl", [9]="gust", [15]="quick_attack", [21]="wing_attack", [29]="agility",
    tm={"swift", "double_edge"},
  },
  [17] = { -- Pidgeotto
    [1]="tackle", [5]="growl", [9]="gust", [17]="quick_attack", [24]="wing_attack", [32]="agility", [40]="swift",
    tm={"double_edge"},
  },
  [18] = { -- Pidgeot
    [1]="tackle", [5]="growl", [9]="gust", [17]="quick_attack", [24]="wing_attack", [34]="agility", [46]="swift", [54]="hyper_beam",
    tm={"double_edge"},
  },
  [19] = { -- Rattata
    [1]="tackle", [3]="tail_whip", [7]="quick_attack", [14]="hyper_fang", [23]="bite", [34]="double_edge",
    tm={"body_slam", "swift"},
  },
  [20] = { -- Raticate
    [1]="tackle", [3]="tail_whip", [7]="quick_attack", [14]="hyper_fang", [27]="bite", [41]="double_edge", [50]="hyper_beam",
    tm={"body_slam", "swift"},
  },
  [25] = { -- Pikachu
    [1]="thundershock", [3]="growl", [6]="tail_whip", [8]="thunder_wave", [11]="quick_attack", [21]="swift", [26]="agility", [33]="thunderbolt",
    tm={"body_slam", "double_edge"},
  },
  [26] = { -- Raichu (tiến hoá bằng đá, giữ bộ chiêu cơ bản)
    [1]="thundershock", [2]="growl", [3]="thunder_wave", [4]="quick_attack",
    tm={"thunderbolt", "body_slam", "hyper_beam", "agility"},
  },
  [41] = { -- Zubat
    [1]="absorb", [5]="poison_sting", [10]="bite", [15]="wing_attack", [21]="confusion", [28]="mega_drain",
    tm={"swift"},
  },
  [42] = { -- Golbat
    [1]="absorb", [5]="poison_sting", [10]="bite", [15]="wing_attack", [24]="confusion", [33]="mega_drain", [42]="psybeam",
    tm={"swift", "hyper_beam"},
  },
  [43] = { -- Oddish
    [1]="absorb", [5]="poison_powder", [9]="stun_spore", [13]="sleep_powder", [19]="acid", [25]="mega_drain", [31]="solar_beam",
    tm={},
  },
  [44] = { -- Gloom
    [1]="absorb", [5]="poison_powder", [9]="stun_spore", [15]="sleep_powder", [23]="acid", [30]="mega_drain", [38]="solar_beam",
    tm={},
  },
  [66] = { -- Machop
    [1]="karate_chop", [3]="growl", [7]="low_kick", [13]="leer", [21]="body_slam", [31]="double_edge",
    tm={"rock_throw", "swift"},
  },
  [67] = { -- Machoke
    [1]="karate_chop", [3]="growl", [7]="low_kick", [13]="leer", [25]="body_slam", [36]="double_edge", [44]="hyper_beam",
    tm={"rock_throw", "swift"},
  },
  [74] = { -- Geodude
    [1]="tackle", [4]="harden", [8]="rock_throw", [14]="magnitude", [22]="body_slam", [30]="double_edge",
    tm={},
  },
  [75] = { -- Graveler
    [1]="tackle", [4]="harden", [8]="rock_throw", [14]="magnitude", [27]="body_slam", [36]="double_edge", [45]="hyper_beam",
    tm={},
  },
  [129] = { -- Magikarp
    [1]="splash", [15]="tackle",
    tm={},
  },
  [130] = { -- Gyarados
    [1]="tackle", [20]="bite", [25]="dragon_rage", [32]="body_slam", [41]="hydro_pump", [47]="hyper_beam",
    tm={"double_edge", "thunderbolt"},
  },
  [133] = { -- Eevee
    [1]="tackle", [3]="tail_whip", [8]="quick_attack", [16]="bite", [23]="swift", [30]="body_slam", [42]="double_edge",
    tm={},
  },
  [143] = { -- Snorlax
    [1]="tackle", [6]="growl", [13]="body_slam", [20]="rest", [28]="harden", [35]="double_edge", [48]="hyper_beam",
    tm={"mega_drain"},
  },
  [147] = { -- Dratini
    [1]="tackle", [5]="leer", [10]="thunder_wave", [15]="dragon_rage", [22]="agility", [29]="body_slam", [38]="hyper_beam",
    tm={"thunderbolt", "flamethrower", "bubble_beam"},
  },
}
