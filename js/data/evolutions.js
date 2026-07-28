// PokeWorld H5 | data/evolutions.js | Chuỗi tiến hoá — TỰ SINH TỪ tools/mktuxemon.py
// Nguồn: Tuxemon (CC BY-SA 4.0). Đừng sửa tay.
// Mỗi loài là một mảng các đường tiến hoá; điều kiện có thể là cấp,
// vật phẩm, giới tính, độ thân thiết, so sánh hai chỉ số, hoặc biết chiêu.

export const EVOLUTIONS = {
  9: [{ into: 11, level: 32 }, { into: 12, level: 32 }],   // mk01_alpha
  10: [{ into: 11, level: 32 }, { into: 13, level: 32 }],   // mk01_beta
  14: [{ into: 9, level: 10 }, { into: 10, level: 10 }],   // mk01_proto
  19: [{ into: 20, level: 24 }],   // rockitten
  20: [{ into: 21, level: 36 }],   // rockat
  22: [{ into: 23, level: 9 }],   // nut
  23: [{ into: 24, level: 12 }],   // bolt
  25: [{ into: 26, level: 24 }],   // tweesher
  26: [{ into: 27, level: 36 }],   // heronquak
  28: [{ into: 29, level: 24 }],   // lambert
  29: [{ into: 30, level: 36 }],   // legko
  31: [{ into: 32, level: 24 }],   // agnite
  32: [{ into: 33, level: 36 }],   // agnidon
  34: [{ into: 35, item: ["earth_booster"] }, { into: 36, item: ["metal_booster"] }],   // grintot
  37: [{ into: 38, item: ["earth_booster"] }, { into: 39, item: ["metal_booster"] }, { into: 40, item: ["fire_booster"] }],   // memnomnom
  41: [{ into: 42, bond: 100 }, { into: 43, item: ["water_booster"] }, { into: 44, item: ["metal_booster"] }],   // dollfin
  45: [{ into: 46, item: ["lucky_bamboo", "wood_booster"] }, { into: 47, item: ["water_booster"] }],   // budaye
  48: [{ into: 49, item: ["metal_booster"] }, { into: 50, item: ["earth_booster"] }],   // ignibus
  51: [{ into: 52, level: 9 }],   // cataspike
  52: [{ into: 53, level: 12 }],   // puparmor
  54: [{ into: 55, level: 9 }],   // vamporm
  55: [{ into: 56, level: 12 }],   // dracune
  57: [{ into: 58, level: 18 }],   // elofly
  58: [{ into: 59, level: 42 }],   // elowind
  60: [{ into: 61, level: 18 }],   // aardorn
  62: [{ into: 63, level: 18 }],   // squabbit
  64: [{ into: 65, level: 18 }],   // eyenemy
  66: [{ into: 67, level: 18 }],   // pipis
  68: [{ into: 69, level: 18 }],   // noctula
  70: [{ into: 71, level: 18 }],   // nudiflot_male
  72: [{ into: 73, level: 18 }],   // nudiflot_female
  74: [{ into: 75, level: 9 }],   // katapill
  75: [{ into: 76, level: 12, stat: ["dodge", "speed"] }, { into: 77, level: 12, stat: ["speed", "dodge"] }, { into: 78, level: 12, stat: ["speed", "dodge"] }],   // katacoon
  80: [{ into: 81, level: 18 }],   // cardiling
  81: [{ into: 82, level: 36 }],   // cardiwing
  83: [{ into: 84, level: 18 }],   // anoleaf
  84: [{ into: 85, level: 36 }],   // gectile
  86: [{ into: 87, level: 18 }],   // fluoresfin
  87: [{ into: 88, level: 36 }],   // incandesfin
  89: [{ into: 90, level: 32 }],   // cairfrey
  91: [{ into: 92, level: 18 }],   // dandicub
  93: [{ into: 94, level: 32 }],   // embra
  95: [{ into: 96, level: 18 }],   // shybulb
  97: [{ into: 98, level: 32 }],   // tikoal
  99: [{ into: 100, level: 18 }],   // hatchling
  101: [{ into: 102, level: 32 }],   // bursa
  103: [{ into: 104, level: 32 }],   // trapsnap
  105: [{ into: 106, level: 18 }],   // forturtle
  107: [{ into: 108, item: ["fire_booster"] }, { into: 109, item: ["metal_booster"] }],   // pythwire
  110: [{ into: 315, level: 32 }],   // komodraw
  111: [{ into: 112, level: 32 }],   // grimachin
  113: [{ into: 114, level: 18 }],   // tumbleworm
  119: [{ into: 298, level: 32 }],   // axolightl
  120: [{ into: 121, level: 32 }],   // capiti
  150: [{ into: 153, level: 24, gender: "f" }, { into: 157, level: 24, gender: "m" }, { into: 155, level: 26 }, { into: 151, tech: "salamander" }],   // vivipere
  158: [{ into: 159, level: 32 }],   // chloragon
  159: [{ into: 160, level: 54 }],   // sapragon
  167: [{ into: 168, level: 30 }],   // foxfire
  169: [{ into: 380, level: 24 }],   // pharfan
  170: [{ into: 171, level: 18 }],   // nostray
  172: [{ into: 173, level: 18 }],   // chillimp
  174: [{ into: 175, level: 18 }],   // flacono
  175: [{ into: 176, level: 36 }],   // corvix
  177: [{ into: 178, level: 32 }],   // wrougon
  178: [{ into: 179, level: 54 }],   // allagon
  180: [{ into: 182, level: 20 }],   // seirein
  182: [{ into: 183, level: 36 }],   // spirain
  187: [{ into: 188, level: 18 }],   // fruitera
  188: [{ into: 189, level: 36 }],   // megafruitera
  192: [{ into: 193, level: 18 }, { into: 194, level: 18 }, { into: 195, level: 18 }, { into: 196, level: 18 }],   // chromeye
  197: [{ into: 198, level: 24 }],   // fancair
  199: [{ into: 200, level: 26 }],   // pairagrin
  201: [{ into: 202, level: 18 }],   // skwib
  203: [{ into: 204, level: 18 }],   // drashimi
  204: [{ into: 205, level: 36 }],   // tsushimi
  206: [{ into: 207, level: 18 }],   // selket
  208: [{ into: 209, level: 18 }],   // furnursus
  209: [{ into: 377, level: 36 }],   // statursus
  210: [{ into: 211, level: 18 }],   // baoby
  212: [{ into: 213, level: 18 }],   // boltnu
  214: [{ into: 215, level: 18 }],   // tetrchimp
  216: [{ into: 217, level: 18 }],   // turnipper
  217: [{ into: 218, level: 32 }],   // beenstalker
  220: [{ into: 221, level: 40 }],   // metesaur
  222: [{ into: 223, level: 32 }],   // rosarin
  223: [{ into: 224, level: 30 }],   // toxiris
  225: [{ into: 226, level: 41 }],   // jelillow
  227: [{ into: 228, level: 20 }],   // merlicun
  229: [{ into: 230, level: 32 }],   // fordin
  230: [{ into: 231, level: 32 }],   // stegofor
  235: [{ into: 236, level: 20 }],   // tarpeur
  238: [{ into: 239, level: 32 }],   // tumblequill
  243: [{ into: 244, level: 24 }],   // snock
  245: [{ into: 246, level: 18 }],   // snaki
  250: [{ into: 251, level: 32 }],   // bumbulus
  254: [{ into: 255, bond: 80 }],   // fuzzlet
  258: [{ into: 259, level: 38 }],   // uneye
  263: [{ into: 264, level: 18 }],   // pantherafira
  268: [{ into: 269, level: 26 }],   // woodoor
  275: [{ into: 276, level: 18 }],   // potturmeist
  277: [{ into: 278, level: 18 }],   // imbrickcile
  278: [{ into: 279, level: 36 }],   // bricgard
  280: [{ into: 281, level: 14 }, { into: 282, level: 14 }],   // waysprite
  281: [{ into: 284, level: 32 }],   // angesnow
  282: [{ into: 283, level: 32 }],   // demosnow
  286: [{ into: 287, level: 32 }],   // tadcool
  288: [{ into: 289, level: 20 }],   // squink
  290: [{ into: 291, level: 26 }],   // slichen
  291: [{ into: 292, level: 50 }],   // glombroc
  293: [{ into: 294, level: 32 }],   // caper
  295: [{ into: 296, level: 18 }],   // lesmagu
  296: [{ into: 297, level: 36 }],   // shelagu
  299: [{ into: 300, level: 24 }],   // medipup
  303: [{ into: 304, bond: 40 }],   // sheye
  305: [{ into: 306, level: 15 }],   // marvillar
  307: [{ into: 308, level: 8 }],   // scarlant
  308: [{ into: 309, level: 20 }],   // shull
  310: [{ into: 311, level: 18 }],   // devidin
  311: [{ into: 312, level: 32 }],   // devidra
  316: [{ into: 317, level: 20 }],   // thumpurn
  321: [{ into: 322, level: 32 }],   // sprorm
  327: [{ into: 328, level: 30 }],   // hoarse
  328: [{ into: 329, level: 55 }],   // equill
  335: [{ into: 336, level: 32 }],   // claymorior
  337: [{ into: 338, level: 16 }],   // nebufin
  338: [{ into: 339, level: 32 }],   // galasces
  340: [{ into: 341, level: 18 }],   // hissiorite
  341: [{ into: 342, level: 36 }],   // cobarett
  343: [{ into: 344, level: 24 }],   // burrlock
  345: [{ into: 346, level: 30 }],   // eskipup
  347: [{ into: 348, level: 30 }],   // flounce
  350: [{ into: 351, level: 9 }],   // stonifly
  351: [{ into: 352, level: 16 }],   // cocrune
  354: [{ into: 355, level: 32 }],   // sprightly
  356: [{ into: 357, level: 24 }],   // stomic
  358: [{ into: 359, level: 16 }],   // cackleen
  359: [{ into: 360, level: 30 }],   // brumi
  366: [{ into: 367, level: 18 }],   // poinchin
  368: [{ into: 369, level: 20 }],   // babysnitch
  373: [{ into: 374, level: 18 }],   // banling
  374: [{ into: 375, level: 36 }],   // bansaken
  383: [{ into: 384, level: 15 }],   // chickadee
  385: [{ into: 386, level: 20 }],   // pickoon
  387: [{ into: 388, level: 15 }],   // kroki
  388: [{ into: 389, level: 35 }],   // krokivip
  390: [{ into: 391, item: ["earth_booster"] }],   // pawsand
  394: [{ into: 395, level: 15 }],   // helipi
  395: [{ into: 396, level: 30 }],   // coppi
  397: [{ into: 398, item: ["metal_booster"] }],   // virware
  400: [{ into: 401, level: 15 }],   // cohldrabi
  401: [{ into: 402, level: 32 }],   // lettice
  405: [{ into: 406, level: 20 }],   // toucanary
  407: [{ into: 408, level: 20 }],   // hoodoll
  409: [{ into: 410, level: 20 }],   // gupphish
  410: [{ into: 411, level: 38 }],   // gupphire
};

export const EVOLVED_INTO = new Set(Object.values(EVOLUTIONS).map(e => e.into));
