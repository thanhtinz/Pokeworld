// PokeWorld H5 | data/learnsets.js | Bảng chiêu học theo cấp của từng loài

// key = số dex; {level: moveId}
export const LEARNSETS = {
  1: { // Bulbasaur
    1: 'tackle', 3: 'growl', 7: 'vine_whip', 13: 'leech_seed', 20: 'razor_leaf', 27: 'poison_powder', 34: 'solar_beam',
  },
  2: { // Ivysaur
    1: 'tackle', 3: 'growl', 7: 'vine_whip', 13: 'leech_seed', 22: 'razor_leaf', 30: 'poison_powder', 38: 'solar_beam',
  },
  3: { // Venusaur
    1: 'tackle', 3: 'growl', 7: 'vine_whip', 13: 'leech_seed', 22: 'razor_leaf', 30: 'sleep_powder', 43: 'solar_beam', 50: 'mega_drain',
  },
  4: { // Charmander
    1: 'scratch', 3: 'growl', 7: 'ember', 13: 'leer', 20: 'bite', 27: 'flamethrower', 34: 'body_slam',
  },
  5: { // Charmeleon
    1: 'scratch', 3: 'growl', 7: 'ember', 13: 'leer', 24: 'bite', 33: 'flamethrower', 42: 'body_slam',
  },
  6: { // Charizard
    1: 'scratch', 3: 'growl', 7: 'ember', 13: 'leer', 24: 'wing_attack', 36: 'flamethrower', 46: 'body_slam', 55: 'hyper_beam',
  },
  7: { // Squirtle
    1: 'tackle', 4: 'tail_whip', 7: 'water_gun', 13: 'bubble', 20: 'bite', 28: 'bubble_beam', 35: 'hydro_pump',
  },
  8: { // Wartortle
    1: 'tackle', 4: 'tail_whip', 7: 'water_gun', 13: 'bubble', 24: 'bite', 31: 'bubble_beam', 39: 'hydro_pump',
  },
  9: { // Blastoise
    1: 'tackle', 4: 'tail_whip', 7: 'water_gun', 13: 'bubble', 24: 'bite', 31: 'bubble_beam', 42: 'hydro_pump', 52: 'hyper_beam',
  },
  10: { // Caterpie
    1: 'tackle', 2: 'string_shot', 8: 'poison_sting', 12: 'harden', 15: 'leech_life', 20: 'pin_missile',
  },
  11: { // Metapod
    1: 'harden', 4: 'string_shot', 7: 'tackle', 12: 'leech_life', 16: 'poison_sting', 20: 'take_down',
  },
  12: { // Butterfree
    1: 'confusion', 10: 'gust', 13: 'poison_powder', 15: 'stun_spore', 17: 'sleep_powder', 24: 'psybeam', 32: 'swift',
  },
  13: { // Weedle
    1: 'poison_sting', 2: 'string_shot', 8: 'leech_life', 12: 'harden', 16: 'twineedle', 20: 'pin_missile',
  },
  14: { // Kakuna
    1: 'harden', 4: 'string_shot', 7: 'poison_sting', 12: 'leech_life', 16: 'twineedle', 20: 'pin_missile',
  },
  15: { // Beedrill
    1: 'fury_attack', 10: 'twineedle', 15: 'leech_life', 20: 'pin_missile', 25: 'pin_missile', 30: 'agility', 40: 'toxic',
  },
  16: { // Pidgey
    1: 'tackle', 5: 'growl', 9: 'gust', 15: 'quick_attack', 21: 'wing_attack', 29: 'agility',
  },
  17: { // Pidgeotto
    1: 'tackle', 5: 'growl', 9: 'gust', 17: 'quick_attack', 24: 'wing_attack', 32: 'agility', 40: 'swift',
  },
  18: { // Pidgeot
    1: 'tackle', 5: 'growl', 9: 'gust', 17: 'quick_attack', 24: 'wing_attack', 34: 'agility', 46: 'swift', 54: 'hyper_beam',
  },
  19: { // Rattata
    1: 'tackle', 3: 'tail_whip', 7: 'quick_attack', 14: 'hyper_fang', 23: 'bite', 34: 'double_edge',
  },
  20: { // Raticate
    1: 'tackle', 3: 'tail_whip', 7: 'quick_attack', 14: 'hyper_fang', 27: 'bite', 41: 'double_edge', 50: 'hyper_beam',
  },
  21: { // Spearow
    1: 'peck', 5: 'growl', 9: 'leer', 13: 'fury_attack', 19: 'headbutt', 25: 'agility', 31: 'drill_peck',
  },
  22: { // Fearow
    1: 'peck', 5: 'growl', 9: 'leer', 13: 'fury_attack', 20: 'agility', 29: 'drill_peck', 40: 'take_down', 50: 'hyper_beam',
  },
  23: { // Ekans
    1: 'sludge', 4: 'leer', 9: 'poison_sting', 12: 'bite', 17: 'glare', 23: 'screech', 30: 'acid', 38: 'sludge',
  },
  24: { // Arbok
    1: 'leer', 4: 'poison_sting', 9: 'bite', 15: 'glare', 22: 'screech', 30: 'acid', 40: 'sludge', 48: 'hyper_beam',
  },
  25: { // Pikachu
    1: 'thundershock', 3: 'growl', 6: 'tail_whip', 8: 'thunder_wave', 11: 'quick_attack', 21: 'swift', 26: 'agility', 33: 'thunderbolt',
  },
  26: { // Raichu (tiến hoá bằng đá, giữ bộ chiêu cơ bản)
    1: 'thundershock', 2: 'growl', 3: 'thunder_wave', 4: 'quick_attack', 5: 'swift', 6: 'thunderbolt', 8: 'thunder',
  },
  27: { // Sandshrew
    1: 'scratch', 3: 'defense_curl', 7: 'sand_attack', 11: 'poison_sting', 17: 'slash', 23: 'swift', 30: 'dig', 38: 'earthquake',
  },
  28: { // Sandslash
    1: 'scratch', 3: 'defense_curl', 7: 'sand_attack', 11: 'poison_sting', 20: 'slash', 28: 'swift', 36: 'dig', 46: 'earthquake',
  },
  29: { // Nidoran-F
    1: 'growl', 5: 'scratch', 9: 'tail_whip', 13: 'double_kick', 19: 'poison_sting', 25: 'bite', 31: 'toxic', 38: 'body_slam',
  },
  30: { // Nidorina
    1: 'growl', 5: 'scratch', 9: 'tail_whip', 13: 'double_kick', 20: 'poison_sting', 28: 'bite', 35: 'toxic', 43: 'body_slam',
  },
  31: { // Nidoqueen
    1: 'scratch', 8: 'double_kick', 14: 'tail_whip', 23: 'poison_sting', 31: 'body_slam', 40: 'earthquake', 48: 'sludge', 55: 'hyper_beam',
  },
  32: { // Nidoran-M
    1: 'leer', 5: 'peck', 9: 'focus_energy', 13: 'double_kick', 19: 'poison_sting', 25: 'horn_attack', 31: 'toxic', 38: 'thrash',
  },
  33: { // Nidorino
    1: 'leer', 5: 'peck', 9: 'focus_energy', 13: 'double_kick', 20: 'poison_sting', 28: 'horn_attack', 35: 'toxic', 43: 'thrash',
  },
  34: { // Nidoking
    1: 'peck', 8: 'double_kick', 14: 'horn_attack', 23: 'poison_sting', 31: 'thrash', 40: 'earthquake', 48: 'sludge', 55: 'hyper_beam',
  },
  35: { // Clefairy
    1: 'pound', 4: 'growl', 8: 'sing', 13: 'doubleslap', 19: 'defense_curl', 25: 'minimize', 31: 'headbutt', 39: 'body_slam',
  },
  36: { // Clefable
    1: 'pound', 4: 'sing', 8: 'doubleslap', 13: 'minimize', 20: 'body_slam', 28: 'psychic_mv', 36: 'softboiled', 45: 'hyper_beam',
  },
  37: { // Vulpix
    1: 'ember', 4: 'tail_whip', 9: 'quick_attack', 13: 'fire_spin', 17: 'confuse_ray', 23: 'flamethrower', 31: 'fire_spin', 39: 'fire_blast',
  },
  38: { // Ninetales
    1: 'ember', 4: 'quick_attack', 9: 'confuse_ray', 15: 'flamethrower', 24: 'fire_spin', 33: 'body_slam', 42: 'fire_blast', 50: 'hyper_beam',
  },
  39: { // Jigglypuff
    1: 'sing', 4: 'defense_curl', 9: 'pound', 14: 'disable', 19: 'doubleslap', 24: 'rest', 29: 'body_slam', 34: 'double_edge',
  },
  40: { // Wigglytuff
    1: 'sing', 4: 'doubleslap', 9: 'defense_curl', 15: 'body_slam', 23: 'rest', 31: 'psychic_mv', 40: 'double_edge', 49: 'hyper_beam',
  },
  41: { // Zubat
    1: 'absorb', 5: 'poison_sting', 10: 'bite', 15: 'wing_attack', 21: 'confusion', 28: 'mega_drain',
  },
  42: { // Golbat
    1: 'absorb', 5: 'poison_sting', 10: 'bite', 15: 'wing_attack', 24: 'confusion', 33: 'mega_drain', 42: 'psybeam',
  },
  43: { // Oddish
    1: 'absorb', 5: 'poison_powder', 9: 'stun_spore', 13: 'sleep_powder', 19: 'acid', 25: 'mega_drain', 31: 'solar_beam',
  },
  44: { // Gloom
    1: 'absorb', 5: 'poison_powder', 9: 'stun_spore', 15: 'sleep_powder', 23: 'acid', 30: 'mega_drain', 38: 'solar_beam',
  },
  45: { // Vileplume
    1: 'absorb', 5: 'poison_powder', 9: 'stun_spore', 15: 'sleep_powder', 25: 'acid', 34: 'mega_drain', 44: 'petal_dance', 52: 'solar_beam',
  },
  46: { // Paras
    1: 'scratch', 6: 'stun_spore', 11: 'poison_powder', 17: 'leech_life', 22: 'spore', 27: 'slash', 34: 'growth', 41: 'mega_drain',
  },
  47: { // Parasect
    1: 'scratch', 6: 'stun_spore', 11: 'poison_powder', 17: 'leech_life', 24: 'spore', 32: 'slash', 41: 'growth', 50: 'mega_drain',
  },
  48: { // Venonat
    1: 'tackle', 5: 'disable', 11: 'supersonic', 17: 'confusion', 23: 'poison_powder', 29: 'leech_life', 35: 'psybeam', 43: 'sleep_powder',
  },
  49: { // Venomoth
    1: 'tackle', 5: 'disable', 11: 'supersonic', 17: 'confusion', 25: 'poison_powder', 33: 'leech_life', 41: 'psybeam', 50: 'sludge',
  },
  50: { // Diglett
    1: 'scratch', 5: 'sand_attack', 9: 'growl', 17: 'magnitude', 25: 'dig', 33: 'slash', 41: 'earthquake', 49: 'dig',
  },
  51: { // Dugtrio
    1: 'scratch', 5: 'sand_attack', 9: 'growl', 19: 'magnitude', 28: 'dig', 38: 'slash', 47: 'earthquake', 55: 'hyper_beam',
  },
  52: { // Meowth
    1: 'scratch', 6: 'growl', 11: 'bite', 16: 'pay_day', 23: 'fury_swipes', 30: 'screech', 38: 'slash', 46: 'body_slam',
  },
  53: { // Persian
    1: 'scratch', 6: 'growl', 11: 'bite', 18: 'pay_day', 27: 'fury_swipes', 36: 'screech', 45: 'slash', 54: 'hyper_beam',
  },
  54: { // Psyduck
    1: 'water_gun', 5: 'tail_whip', 10: 'confusion', 16: 'disable', 23: 'bubble_beam', 31: 'psybeam', 39: 'surf', 47: 'hydro_pump',
  },
  55: { // Golduck
    1: 'water_gun', 5: 'tail_whip', 10: 'confusion', 16: 'disable', 26: 'bubble_beam', 36: 'psybeam', 46: 'surf', 55: 'hydro_pump',
  },
  56: { // Mankey
    1: 'scratch', 6: 'leer', 11: 'low_kick', 16: 'karate_chop', 23: 'fury_swipes', 30: 'seismic_toss', 38: 'thrash', 46: 'submission',
  },
  57: { // Primeape
    1: 'scratch', 6: 'leer', 11: 'low_kick', 16: 'karate_chop', 27: 'fury_swipes', 36: 'seismic_toss', 45: 'thrash', 54: 'submission',
  },
  58: { // Growlithe
    1: 'bite', 6: 'fire_spin', 12: 'ember', 18: 'leer', 25: 'take_down', 32: 'flamethrower', 40: 'agility', 48: 'fire_blast',
  },
  59: { // Arcanine
    1: 'bite', 6: 'ember', 12: 'leer', 20: 'take_down', 30: 'flamethrower', 40: 'agility', 50: 'fire_blast', 58: 'hyper_beam',
  },
  60: { // Poliwag
    1: 'bubble', 7: 'hypnosis', 13: 'water_gun', 19: 'doubleslap', 25: 'body_slam', 31: 'bubble_beam', 38: 'hydro_pump', 45: 'amnesia',
  },
  61: { // Poliwhirl
    1: 'bubble', 7: 'hypnosis', 13: 'water_gun', 19: 'doubleslap', 27: 'body_slam', 35: 'bubble_beam', 43: 'hydro_pump', 51: 'amnesia',
  },
  62: { // Poliwrath
    1: 'water_gun', 8: 'doubleslap', 16: 'submission', 24: 'body_slam', 33: 'bubble_beam', 42: 'karate_chop', 50: 'hydro_pump', 58: 'hyper_beam',
  },
  63: { // Abra
    1: 'teleport', 5: 'confusion', 10: 'disable', 16: 'psybeam', 22: 'reflect', 28: 'recover', 34: 'psychic_mv', 42: 'agility',
  },
  64: { // Kadabra
    1: 'teleport', 5: 'confusion', 10: 'disable', 16: 'psybeam', 24: 'reflect', 32: 'recover', 40: 'psychic_mv', 48: 'agility',
  },
  65: { // Alakazam
    1: 'teleport', 5: 'confusion', 10: 'disable', 16: 'psybeam', 26: 'reflect', 35: 'recover', 45: 'psychic_mv', 55: 'agility',
  },
  66: { // Machop
    1: 'karate_chop', 3: 'growl', 7: 'low_kick', 13: 'leer', 21: 'body_slam', 31: 'double_edge',
  },
  67: { // Machoke
    1: 'karate_chop', 3: 'growl', 7: 'low_kick', 13: 'leer', 25: 'body_slam', 36: 'double_edge', 44: 'hyper_beam',
  },
  68: { // Machamp
    1: 'karate_chop', 3: 'low_kick', 13: 'leer', 22: 'seismic_toss', 33: 'body_slam', 43: 'submission', 52: 'double_edge', 60: 'hyper_beam',
  },
  69: { // Bellsprout
    1: 'vine_whip', 6: 'growth', 11: 'sleep_powder', 15: 'poison_powder', 21: 'stun_spore', 27: 'acid', 34: 'razor_leaf', 42: 'slam',
  },
  70: { // Weepinbell
    1: 'vine_whip', 6: 'growth', 11: 'sleep_powder', 15: 'poison_powder', 23: 'stun_spore', 30: 'acid', 38: 'razor_leaf', 47: 'slam',
  },
  71: { // Victreebel
    1: 'vine_whip', 6: 'sleep_powder', 13: 'acid', 22: 'razor_leaf', 32: 'slam', 42: 'stun_spore', 50: 'solar_beam', 58: 'hyper_beam',
  },
  72: { // Tentacool
    1: 'poison_sting', 6: 'supersonic', 12: 'water_gun', 19: 'acid', 25: 'bubble_beam', 30: 'waterfall', 36: 'barrier', 43: 'hydro_pump',
  },
  73: { // Tentacruel
    1: 'poison_sting', 6: 'supersonic', 12: 'water_gun', 19: 'acid', 28: 'bubble_beam', 38: 'barrier', 47: 'hydro_pump', 55: 'hyper_beam',
  },
  74: { // Geodude
    1: 'tackle', 4: 'harden', 8: 'rock_throw', 14: 'magnitude', 22: 'body_slam', 30: 'double_edge',
  },
  75: { // Graveler
    1: 'tackle', 4: 'harden', 8: 'rock_throw', 14: 'magnitude', 27: 'body_slam', 36: 'double_edge', 45: 'hyper_beam',
  },
  76: { // Golem
    1: 'tackle', 4: 'defense_curl', 11: 'rock_throw', 19: 'magnitude', 29: 'rock_slide', 38: 'earthquake', 48: 'explosion', 56: 'double_edge',
  },
  77: { // Ponyta
    1: 'ember', 6: 'growl', 12: 'tail_whip', 19: 'stomp', 26: 'fire_spin', 33: 'take_down', 40: 'agility', 48: 'fire_blast',
  },
  78: { // Rapidash
    1: 'ember', 6: 'growl', 12: 'tail_whip', 20: 'stomp', 30: 'fire_spin', 40: 'take_down', 50: 'agility', 58: 'fire_blast',
  },
  79: { // Slowpoke
    1: 'tackle', 6: 'growl', 13: 'water_gun', 19: 'confusion', 25: 'disable', 31: 'headbutt', 38: 'psychic_mv', 46: 'amnesia',
  },
  80: { // Slowbro
    1: 'tackle', 6: 'growl', 13: 'water_gun', 19: 'confusion', 27: 'withdraw', 35: 'headbutt', 44: 'psychic_mv', 53: 'amnesia',
  },
  81: { // Magnemite
    1: 'tackle', 6: 'thundershock', 11: 'supersonic', 16: 'thunder_wave', 22: 'swift', 29: 'screech', 36: 'thunderbolt', 44: 'explosion',
  },
  82: { // Magneton
    1: 'tackle', 6: 'thundershock', 11: 'supersonic', 16: 'thunder_wave', 25: 'swift', 34: 'screech', 44: 'thunderbolt', 53: 'explosion',
  },
  83: { // Farfetchd
    1: 'peck', 7: 'sand_attack', 13: 'leer', 19: 'fury_attack', 25: 'swords_dance', 31: 'agility', 38: 'slash', 45: 'body_slam',
  },
  84: { // Doduo
    1: 'peck', 6: 'growl', 12: 'fury_attack', 19: 'headbutt', 25: 'tri_attack', 31: 'agility', 38: 'drill_peck', 45: 'take_down',
  },
  85: { // Dodrio
    1: 'peck', 6: 'growl', 12: 'fury_attack', 22: 'tri_attack', 32: 'agility', 41: 'drill_peck', 50: 'take_down', 58: 'hyper_beam',
  },
  86: { // Seel
    1: 'headbutt', 6: 'growl', 13: 'aurora_beam', 20: 'rest', 27: 'take_down', 34: 'ice_beam', 41: 'surf', 48: 'waterfall',
  },
  87: { // Dewgong
    1: 'headbutt', 6: 'growl', 13: 'aurora_beam', 22: 'rest', 31: 'take_down', 40: 'ice_beam', 49: 'surf', 57: 'blizzard',
  },
  88: { // Grimer
    1: 'pound', 5: 'poison_gas', 10: 'harden', 16: 'sludge', 23: 'minimize', 30: 'screech', 38: 'acid_armor', 46: 'toxic',
  },
  89: { // Muk
    1: 'pound', 5: 'poison_gas', 10: 'harden', 16: 'sludge', 26: 'minimize', 36: 'screech', 46: 'acid_armor', 55: 'hyper_beam',
  },
  90: { // Shellder
    1: 'tackle', 6: 'withdraw', 12: 'supersonic', 19: 'aurora_beam', 26: 'clamp', 33: 'leer', 40: 'ice_beam', 48: 'explosion',
  },
  91: { // Cloyster
    1: 'withdraw', 6: 'supersonic', 13: 'aurora_beam', 22: 'clamp', 32: 'waterfall', 41: 'ice_beam', 50: 'explosion', 58: 'hydro_pump',
  },
  92: { // Gastly
    1: 'lick', 5: 'hypnosis', 12: 'confuse_ray', 18: 'night_shade', 25: 'mega_drain', 32: 'dream_eater', 40: 'toxic', 48: 'psychic_mv',
  },
  93: { // Haunter
    1: 'lick', 5: 'hypnosis', 12: 'confuse_ray', 18: 'night_shade', 28: 'mega_drain', 36: 'dream_eater', 45: 'toxic', 54: 'psychic_mv',
  },
  94: { // Gengar
    1: 'lick', 5: 'hypnosis', 12: 'confuse_ray', 18: 'night_shade', 30: 'mega_drain', 40: 'dream_eater', 50: 'psychic_mv', 58: 'explosion',
  },
  95: { // Onix
    1: 'tackle', 6: 'harden', 11: 'rock_throw', 18: 'rock_slide', 25: 'slam', 32: 'rock_slide', 40: 'dig', 48: 'earthquake',
  },
  96: { // Drowzee
    1: 'pound', 5: 'hypnosis', 11: 'disable', 17: 'confusion', 24: 'headbutt', 31: 'psychic_mv', 38: 'meditate', 46: 'dream_eater',
  },
  97: { // Hypno
    1: 'pound', 5: 'hypnosis', 11: 'disable', 17: 'confusion', 26: 'headbutt', 35: 'psychic_mv', 44: 'meditate', 53: 'dream_eater',
  },
  98: { // Krabby
    1: 'bubble', 5: 'leer', 12: 'waterfall', 19: 'harden', 25: 'stomp', 32: 'clamp', 40: 'crabhammer', 48: 'surf',
  },
  99: { // Kingler
    1: 'bubble', 5: 'leer', 12: 'harden', 20: 'stomp', 30: 'crabhammer', 40: 'surf', 49: 'body_slam', 57: 'hyper_beam',
  },
  100: { // Voltorb
    1: 'tackle', 5: 'screech', 11: 'thundershock', 17: 'thunder_wave', 23: 'swift', 30: 'thunder_wave', 38: 'thunderbolt', 46: 'explosion',
  },
  101: { // Electrode
    1: 'tackle', 5: 'screech', 11: 'thundershock', 20: 'swift', 30: 'thunder_wave', 40: 'thunderbolt', 50: 'explosion', 58: 'thunder',
  },
  102: { // Exeggcute
    1: 'absorb', 7: 'leech_seed', 13: 'poison_powder', 19: 'confusion', 25: 'stun_spore', 31: 'sleep_powder', 39: 'solar_beam', 47: 'psychic_mv',
  },
  103: { // Exeggutor
    1: 'absorb', 7: 'confusion', 15: 'stomp', 25: 'egg_bomb', 35: 'psychic_mv', 45: 'solar_beam', 53: 'explosion', 60: 'hyper_beam',
  },
  104: { // Cubone
    1: 'growl', 5: 'bone_club', 11: 'headbutt', 17: 'leer', 24: 'focus_energy', 31: 'bonemerang', 39: 'dig', 47: 'double_edge',
  },
  105: { // Marowak
    1: 'growl', 5: 'bone_club', 11: 'headbutt', 17: 'leer', 27: 'focus_energy', 36: 'bonemerang', 45: 'earthquake', 54: 'double_edge',
  },
  106: { // Hitmonlee
    1: 'double_kick', 6: 'meditate', 12: 'rolling_kick', 20: 'jump_kick', 27: 'focus_energy', 34: 'hi_jump_kick', 42: 'swords_dance', 50: 'mega_kick',
  },
  107: { // Hitmonchan
    1: 'comet_punch', 6: 'agility', 12: 'fire_punch', 20: 'ice_punch', 27: 'thunder_punch', 34: 'mega_punch', 42: 'submission', 50: 'body_slam',
  },
  108: { // Lickitung
    1: 'lick', 7: 'supersonic', 13: 'defense_curl', 19: 'stomp', 25: 'headbutt', 31: 'slam', 39: 'screech', 47: 'body_slam',
  },
  109: { // Koffing
    1: 'poison_gas', 6: 'tackle', 12: 'smog', 19: 'sludge', 26: 'smokescreen', 33: 'haze', 40: 'self_destruct', 48: 'explosion',
  },
  110: { // Weezing
    1: 'poison_gas', 6: 'tackle', 12: 'smog', 19: 'sludge', 28: 'smokescreen', 37: 'haze', 46: 'self_destruct', 55: 'explosion',
  },
  111: { // Rhyhorn
    1: 'horn_attack', 8: 'tail_whip', 15: 'stomp', 22: 'fury_attack', 29: 'magnitude', 36: 'rock_slide', 43: 'take_down', 50: 'earthquake',
  },
  112: { // Rhydon
    1: 'horn_attack', 8: 'tail_whip', 15: 'stomp', 22: 'fury_attack', 32: 'magnitude', 42: 'rock_slide', 51: 'earthquake', 60: 'hyper_beam',
  },
  113: { // Chansey
    1: 'pound', 5: 'growl', 9: 'tail_whip', 13: 'softboiled', 20: 'doubleslap', 27: 'sing', 35: 'egg_bomb', 44: 'double_edge',
  },
  114: { // Tangela
    1: 'absorb', 7: 'growth', 13: 'vine_whip', 19: 'poison_powder', 25: 'stun_spore', 31: 'mega_drain', 39: 'slam', 47: 'solar_beam',
  },
  115: { // Kangaskhan
    1: 'comet_punch', 7: 'leer', 13: 'bite', 19: 'tail_whip', 26: 'mega_punch', 34: 'dizzy_punch', 42: 'body_slam', 50: 'double_edge',
  },
  116: { // Horsea
    1: 'bubble', 8: 'smokescreen', 15: 'leer', 22: 'water_gun', 29: 'bubble_beam', 36: 'agility', 43: 'surf', 50: 'hydro_pump',
  },
  117: { // Seadra
    1: 'bubble', 8: 'smokescreen', 15: 'leer', 22: 'water_gun', 32: 'bubble_beam', 41: 'agility', 50: 'surf', 58: 'hydro_pump',
  },
  118: { // Goldeen
    1: 'peck', 7: 'tail_whip', 13: 'supersonic', 19: 'horn_attack', 25: 'water_gun', 32: 'fury_attack', 40: 'waterfall', 48: 'agility',
  },
  119: { // Seaking
    1: 'peck', 7: 'tail_whip', 13: 'supersonic', 19: 'horn_attack', 28: 'water_gun', 37: 'fury_attack', 46: 'waterfall', 55: 'hydro_pump',
  },
  120: { // Staryu
    1: 'tackle', 6: 'harden', 12: 'water_gun', 19: 'swift', 25: 'recover', 32: 'bubble_beam', 40: 'psychic_mv', 48: 'hydro_pump',
  },
  121: { // Starmie
    1: 'water_gun', 8: 'swift', 15: 'recover', 24: 'bubble_beam', 33: 'psychic_mv', 42: 'ice_beam', 50: 'hydro_pump', 58: 'hyper_beam',
  },
  122: { // Mr. Mime
    1: 'pound', 6: 'confusion', 12: 'barrier', 19: 'light_screen', 26: 'doubleslap', 33: 'psybeam', 41: 'psychic_mv', 49: 'reflect',
  },
  123: { // Scyther
    1: 'quick_attack', 7: 'leer', 13: 'focus_energy', 20: 'fury_swipes', 27: 'wing_attack', 34: 'slash', 42: 'swords_dance', 50: 'agility',
  },
  124: { // Jynx
    1: 'pound', 7: 'lick', 13: 'aurora_beam', 20: 'doubleslap', 27: 'ice_punch', 34: 'psychic_mv', 42: 'ice_beam', 50: 'blizzard',
  },
  125: { // Electabuzz
    1: 'quick_attack', 7: 'leer', 13: 'thundershock', 20: 'thunder_punch', 27: 'light_screen', 34: 'swift', 42: 'thunderbolt', 50: 'thunder',
  },
  126: { // Magmar
    1: 'ember', 7: 'leer', 13: 'smokescreen', 20: 'fire_punch', 27: 'smog', 34: 'flamethrower', 42: 'confuse_ray', 50: 'fire_blast',
  },
  127: { // Pinsir
    1: 'pin_missile', 7: 'focus_energy', 13: 'seismic_toss', 20: 'harden', 27: 'slash', 34: 'swords_dance', 42: 'submission', 50: 'leech_life',
  },
  128: { // Tauros
    1: 'tackle', 7: 'tail_whip', 13: 'stomp', 20: 'horn_attack', 28: 'leer', 36: 'take_down', 44: 'body_slam', 52: 'earthquake',
  },
  129: { // Magikarp
    1: 'splash', 15: 'tackle', 20: 'waterfall', 25: 'bubble', 30: 'water_gun', 35: 'harden',
  },
  130: { // Gyarados
    1: 'tackle', 20: 'bite', 25: 'dragon_rage', 32: 'body_slam', 41: 'hydro_pump', 47: 'hyper_beam',
  },
  131: { // Lapras
    1: 'water_gun', 8: 'growl', 15: 'sing', 22: 'mist', 29: 'body_slam', 36: 'surf', 44: 'ice_beam', 52: 'hydro_pump',
  },
  132: { // Ditto
    1: 'transform', 5: 'tackle', 10: 'pound', 15: 'quick_attack', 20: 'swift', 25: 'body_slam',
  },
  133: { // Eevee
    1: 'tackle', 3: 'tail_whip', 8: 'quick_attack', 16: 'bite', 23: 'swift', 30: 'body_slam', 42: 'double_edge',
  },
  134: { // Vaporeon
    1: 'tackle', 8: 'quick_attack', 16: 'water_gun', 23: 'bite', 30: 'aurora_beam', 36: 'bubble_beam', 42: 'surf', 52: 'hydro_pump',
  },
  135: { // Jolteon
    1: 'tackle', 8: 'quick_attack', 16: 'thundershock', 23: 'bite', 30: 'thunder_wave', 36: 'swift', 42: 'thunderbolt', 52: 'thunder',
  },
  136: { // Flareon
    1: 'tackle', 8: 'quick_attack', 16: 'ember', 23: 'bite', 30: 'fire_spin', 36: 'swift', 42: 'flamethrower', 52: 'fire_blast',
  },
  137: { // Porygon
    1: 'tackle', 9: 'conversion', 12: 'agility', 20: 'psybeam', 24: 'recover', 32: 'swift', 36: 'tri_attack', 44: 'hyper_beam',
  },
  138: { // Omanyte
    1: 'water_gun', 13: 'withdraw', 19: 'horn_attack', 25: 'leer', 31: 'bubble_beam', 37: 'rock_slide', 43: 'rock_throw', 49: 'hydro_pump',
  },
  139: { // Omastar
    1: 'water_gun', 13: 'withdraw', 19: 'horn_attack', 25: 'leer', 34: 'bubble_beam', 44: 'surf', 53: 'hydro_pump', 60: 'hyper_beam',
  },
  140: { // Kabuto
    1: 'scratch', 13: 'harden', 19: 'absorb', 25: 'leer', 31: 'mega_drain', 37: 'slash', 43: 'surf', 49: 'hydro_pump',
  },
  141: { // Kabutops
    1: 'scratch', 13: 'harden', 19: 'absorb', 25: 'leer', 34: 'slash', 44: 'mega_drain', 53: 'surf', 60: 'hyper_beam',
  },
  142: { // Aerodactyl
    1: 'wing_attack', 8: 'agility', 15: 'bite', 22: 'supersonic', 29: 'take_down', 36: 'rock_slide', 44: 'fly', 52: 'hyper_beam',
  },
  143: { // Snorlax
    1: 'tackle', 6: 'growl', 13: 'body_slam', 20: 'rest', 28: 'harden', 35: 'double_edge', 48: 'hyper_beam',
  },
  144: { // Articuno
    1: 'gust', 13: 'mist', 25: 'aurora_beam', 37: 'ice_beam', 49: 'agility', 55: 'blizzard', 60: 'hyper_beam',
  },
  145: { // Zapdos
    1: 'peck', 13: 'thunder_wave', 25: 'thundershock', 37: 'thunderbolt', 49: 'agility', 55: 'thunder', 60: 'hyper_beam',
  },
  146: { // Moltres
    1: 'peck', 13: 'fire_spin', 25: 'ember', 37: 'flamethrower', 49: 'agility', 55: 'fire_blast', 60: 'hyper_beam',
  },
  147: { // Dratini
    1: 'tackle', 5: 'leer', 10: 'thunder_wave', 15: 'dragon_rage', 22: 'agility', 29: 'body_slam', 38: 'hyper_beam',
  },
  148: { // Dragonair
    1: 'tackle', 5: 'leer', 10: 'thunder_wave', 15: 'dragon_rage', 25: 'agility', 35: 'slam', 45: 'body_slam', 55: 'hyper_beam',
  },
  149: { // Dragonite
    1: 'wing_attack', 10: 'thunder_wave', 20: 'dragon_rage', 30: 'agility', 40: 'slam', 50: 'wing_attack', 55: 'body_slam', 61: 'hyper_beam',
  },
  150: { // Mewtwo
    1: 'confusion', 11: 'disable', 22: 'swift', 33: 'psychic_mv', 44: 'barrier', 55: 'recover', 66: 'amnesia', 77: 'hyper_beam',
  },
  151: { // Mew
    1: 'pound', 10: 'transform', 20: 'confusion', 30: 'psychic_mv', 40: 'swift', 50: 'recover', 60: 'hyper_beam',
  },
};

// Danh sách chiêu một loài biết được đến cấp lv (tối đa 4 chiêu mới nhất)
export function movesAtLevel(dex, lv) {
  const ls = LEARNSETS[dex];
  if (!ls) return [];
  const learned = Object.keys(ls)
    .map(Number)
    .filter((l) => l <= lv)
    .sort((a, b) => a - b)
    .map((l) => ls[l]);
  return learned.slice(-4);
}
