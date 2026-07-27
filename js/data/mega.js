// PokeWorld H5 | data/mega.js | Dữ liệu Mega Evolution (15 dạng Mega của vùng Kanto)
// Mỗi dạng Mega được đăng ký như một "loài" riêng với số hiệu 10xxx — trùng với
// số hiệu của PokeAPI nên sprite lấy được ngay qua spriteUrl(id) mà không cần map thêm.

// Dạng Mega: schema y hệt SPECIES để tái dùng toàn bộ engine (stats, khắc hệ, sprite)
export const MEGA_FORMS = {
  10033: { name: 'Mega Venusaur', base: { hp: 80, atk: 100, def: 123, spa: 122, spd: 120, spe: 80 },
    types: ['grass', 'poison'], abilities: ['thick_fat'], megaOf: 3,
    catchRate: 45, expCurve: 'medium_slow', genderRatio: 0.875, evYield: { spa: 2, spd: 1 }, baseExp: 281, height: 2.4, weight: 155.5 },
  10034: { name: 'Mega Charizard X', base: { hp: 78, atk: 130, def: 111, spa: 130, spd: 85, spe: 100 },
    types: ['fire', 'dragon'], abilities: ['tough_claws'], megaOf: 6,
    catchRate: 45, expCurve: 'medium_slow', genderRatio: 0.875, evYield: { spa: 3 }, baseExp: 267, height: 1.7, weight: 110.5 },
  10035: { name: 'Mega Charizard Y', base: { hp: 78, atk: 104, def: 78, spa: 159, spd: 115, spe: 100 },
    types: ['fire', 'flying'], abilities: ['drought'], megaOf: 6,
    catchRate: 45, expCurve: 'medium_slow', genderRatio: 0.875, evYield: { spa: 3 }, baseExp: 267, height: 1.7, weight: 100.5 },
  10036: { name: 'Mega Blastoise', base: { hp: 79, atk: 103, def: 120, spa: 135, spd: 115, spe: 78 },
    types: ['water'], abilities: ['mega_launcher'], megaOf: 9,
    catchRate: 45, expCurve: 'medium_slow', genderRatio: 0.875, evYield: { spd: 3 }, baseExp: 265, height: 1.6, weight: 101.1 },
  10087: { name: 'Mega Beedrill', base: { hp: 65, atk: 150, def: 40, spa: 15, spd: 80, spe: 145 },
    types: ['bug', 'poison'], abilities: ['adaptability'], megaOf: 15,
    catchRate: 45, expCurve: 'medium_fast', genderRatio: 0.5, evYield: { atk: 2 }, baseExp: 223, height: 1.4, weight: 40.5 },
  10088: { name: 'Mega Pidgeot', base: { hp: 83, atk: 80, def: 80, spa: 135, spd: 80, spe: 121 },
    types: ['normal', 'flying'], abilities: ['no_guard'], megaOf: 18,
    catchRate: 45, expCurve: 'medium_slow', genderRatio: 0.5, evYield: { spe: 3 }, baseExp: 240, height: 2.2, weight: 50.5 },
  10037: { name: 'Mega Alakazam', base: { hp: 55, atk: 50, def: 65, spa: 175, spd: 95, spe: 150 },
    types: ['psychic'], abilities: ['trace'], megaOf: 65,
    catchRate: 50, expCurve: 'medium_slow', genderRatio: 0.75, evYield: { spa: 3 }, baseExp: 250, height: 1.2, weight: 48.0 },
  10071: { name: 'Mega Slowbro', base: { hp: 95, atk: 75, def: 180, spa: 130, spd: 80, spe: 30 },
    types: ['water', 'psychic'], abilities: ['shell_armor'], megaOf: 80,
    catchRate: 75, expCurve: 'medium_fast', genderRatio: 0.5, evYield: { def: 2 }, baseExp: 172, height: 2.0, weight: 120.0 },
  10038: { name: 'Mega Gengar', base: { hp: 60, atk: 65, def: 80, spa: 170, spd: 95, spe: 130 },
    types: ['ghost', 'poison'], abilities: ['shadow_tag'], megaOf: 94,
    catchRate: 45, expCurve: 'medium_slow', genderRatio: 0.5, evYield: { spa: 3 }, baseExp: 250, height: 1.4, weight: 40.5 },
  10039: { name: 'Mega Kangaskhan', base: { hp: 105, atk: 125, def: 100, spa: 60, spd: 100, spe: 100 },
    types: ['normal'], abilities: ['parental_bond'], megaOf: 115,
    catchRate: 45, expCurve: 'medium_fast', genderRatio: 0, evYield: { hp: 2 }, baseExp: 172, height: 2.2, weight: 100.0 },
  10040: { name: 'Mega Pinsir', base: { hp: 65, atk: 155, def: 120, spa: 65, spd: 90, spe: 105 },
    types: ['bug', 'flying'], abilities: ['aerilate'], megaOf: 127,
    catchRate: 45, expCurve: 'slow', genderRatio: 0.5, evYield: { atk: 2 }, baseExp: 175, height: 1.7, weight: 59.0 },
  10041: { name: 'Mega Gyarados', base: { hp: 95, atk: 155, def: 109, spa: 70, spd: 130, spe: 81 },
    types: ['water', 'dark'], abilities: ['mold_breaker'], megaOf: 130,
    catchRate: 45, expCurve: 'slow', genderRatio: 0.5, evYield: { atk: 2 }, baseExp: 189, height: 6.5, weight: 305.0 },
  10042: { name: 'Mega Aerodactyl', base: { hp: 80, atk: 135, def: 85, spa: 70, spd: 95, spe: 150 },
    types: ['rock', 'flying'], abilities: ['tough_claws'], megaOf: 142,
    catchRate: 45, expCurve: 'slow', genderRatio: 0.875, evYield: { spe: 2 }, baseExp: 180, height: 2.1, weight: 79.0 },
  10043: { name: 'Mega Mewtwo X', base: { hp: 106, atk: 190, def: 100, spa: 154, spd: 100, spe: 130 },
    types: ['psychic', 'fighting'], abilities: ['steadfast'], megaOf: 150,
    catchRate: 3, expCurve: 'slow', genderRatio: -1, evYield: { atk: 3 }, baseExp: 351, height: 2.3, weight: 127.0 },
  10044: { name: 'Mega Mewtwo Y', base: { hp: 106, atk: 150, def: 70, spa: 194, spd: 120, spe: 140 },
    types: ['psychic'], abilities: ['insomnia'], megaOf: 150,
    catchRate: 3, expCurve: 'slow', genderRatio: -1, evYield: { spa: 3 }, baseExp: 351, height: 1.5, weight: 33.0 },
};

// Đá Mega: item id -> { name, sprite (id sprite PokeAPI), megaId (dạng Mega mở khóa), forSpecies }
export const MEGA_STONES = {
  venusaurite:   { name: 'Venusaurite',   sprite: 'venusaurite',   megaId: 10033, forSpecies: 3,   price: 60000 },
  charizardite_x:{ name: 'Charizardite X',sprite: 'charizardite-x',megaId: 10034, forSpecies: 6,   price: 60000 },
  charizardite_y:{ name: 'Charizardite Y',sprite: 'charizardite-y',megaId: 10035, forSpecies: 6,   price: 60000 },
  blastoisinite: { name: 'Blastoisinite',  sprite: 'blastoisinite', megaId: 10036, forSpecies: 9,   price: 60000 },
  beedrillite:   { name: 'Beedrillite',    sprite: 'beedrillite',   megaId: 10087, forSpecies: 15,  price: 40000 },
  pidgeotite:    { name: 'Pidgeotite',     sprite: 'pidgeotite',    megaId: 10088, forSpecies: 18,  price: 40000 },
  alakazite:     { name: 'Alakazite',      sprite: 'alakazite',     megaId: 10037, forSpecies: 65,  price: 60000 },
  slowbronite:   { name: 'Slowbronite',    sprite: 'slowbronite',   megaId: 10071, forSpecies: 80,  price: 40000 },
  gengarite:     { name: 'Gengarite',      sprite: 'gengarite',     megaId: 10038, forSpecies: 94,  price: 60000 },
  kangaskhanite: { name: 'Kangaskhanite',  sprite: 'kangaskhanite', megaId: 10039, forSpecies: 115, price: 50000 },
  pinsirite:     { name: 'Pinsirite',      sprite: 'pinsirite',     megaId: 10040, forSpecies: 127, price: 50000 },
  gyaradosite:   { name: 'Gyaradosite',    sprite: 'gyaradosite',   megaId: 10041, forSpecies: 130, price: 60000 },
  aerodactylite: { name: 'Aerodactylite',  sprite: 'aerodactylite', megaId: 10042, forSpecies: 142, price: 50000 },
  mewtwonite_x:  { name: 'Mewtwonite X',   sprite: 'mewtwonite-x',  megaId: 10043, forSpecies: 150, price: 200000 },
  mewtwonite_y:  { name: 'Mewtwonite Y',   sprite: 'mewtwonite-y',  megaId: 10044, forSpecies: 150, price: 200000 },
};

// Chìa khóa Mega: phải có mới Mega Evolve được (nhận qua cốt truyện)
export const KEY_STONE = {
  id: 'key_stone', name: 'Key Stone', sprite: 'key-stone',
  desc: 'Viên đá cộng hưởng cho phép Pokémon cầm Mega Stone tiến hóa Mega trong trận đấu.',
};

// Tra cứu: số dex gốc -> danh sách { stoneId, megaId }
export const MEGA_BY_SPECIES = (() => {
  const map = {};
  for (const [stoneId, s] of Object.entries(MEGA_STONES)) {
    (map[s.forSpecies] ||= []).push({ stoneId, megaId: s.megaId });
  }
  return map;
})();
