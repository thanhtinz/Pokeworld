// PokeWorld H5 | data/evolutions.js | Chuỗi tiến hoá của các loài hiện có

// key = số dex; method: 'level' | 'stone' | 'friendship'
export const EVOLUTIONS = {
  1: { into: 2, method: 'level', level: 16 },                // Bulbasaur -> Ivysaur
  2: { into: 3, method: 'level', level: 32 },                // Ivysaur -> Venusaur
  4: { into: 5, method: 'level', level: 16 },                // Charmander -> Charmeleon
  5: { into: 6, method: 'level', level: 36 },                // Charmeleon -> Charizard
  7: { into: 8, method: 'level', level: 16 },                // Squirtle -> Wartortle
  8: { into: 9, method: 'level', level: 36 },                // Wartortle -> Blastoise
  10: { into: 11, method: 'level', level: 7 },               // Caterpie -> Metapod
  11: { into: 12, method: 'level', level: 10 },              // Metapod -> Butterfree
  16: { into: 17, method: 'level', level: 18 },              // Pidgey -> Pidgeotto
  17: { into: 18, method: 'level', level: 36 },              // Pidgeotto -> Pidgeot
  19: { into: 20, method: 'level', level: 20 },              // Rattata -> Raticate
  25: { into: 26, method: 'stone', item: 'thunder_stone' },  // Pikachu -> Raichu
  41: { into: 42, method: 'level', level: 22 },              // Zubat -> Golbat
  43: { into: 44, method: 'level', level: 21 },              // Oddish -> Gloom
  66: { into: 67, method: 'level', level: 28 },              // Machop -> Machoke
  74: { into: 75, method: 'level', level: 25 },              // Geodude -> Graveler
  129: { into: 130, method: 'level', level: 20 },            // Magikarp -> Gyarados
  // 133 Eevee: các dạng tiến hoá (134/135/136) chưa có trong SPECIES nên chưa khai báo.
  // 147 Dratini: Dragonair (148) chưa có trong SPECIES nên chưa khai báo.
};
