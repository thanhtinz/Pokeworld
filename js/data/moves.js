// PokeWorld H5 | data/moves.js | Dữ liệu chiêu thức (47 chiêu)

// category: 'physical' | 'special' | 'status'
// effect: {kind:'status',id,chance} | {kind:'stat',target:'foe'|'self',stat,stages,chance}
//         | {kind:'recoil',frac} | {kind:'drain',frac} | {kind:'heal',frac} | {kind:'flinch',chance}
export const MOVES = {
  // Hệ normal
  tackle:       { name: 'Tackle', type: 'normal', category: 'physical', power: 40, acc: 100, pp: 35, priority: 0, effect: null },
  scratch:      { name: 'Scratch', type: 'normal', category: 'physical', power: 40, acc: 100, pp: 35, priority: 0, effect: null },
  growl:        { name: 'Growl', type: 'normal', category: 'status', power: 0, acc: 100, pp: 40, priority: 0,
                  effect: { kind: 'stat', target: 'foe', stat: 'atk', stages: -1, chance: 100 } },
  tail_whip:    { name: 'Tail Whip', type: 'normal', category: 'status', power: 0, acc: 100, pp: 30, priority: 0,
                  effect: { kind: 'stat', target: 'foe', stat: 'def', stages: -1, chance: 100 } },
  leer:         { name: 'Leer', type: 'normal', category: 'status', power: 0, acc: 100, pp: 30, priority: 0,
                  effect: { kind: 'stat', target: 'foe', stat: 'def', stages: -1, chance: 100 } },
  quick_attack: { name: 'Quick Attack', type: 'normal', category: 'physical', power: 40, acc: 100, pp: 30, priority: 1, effect: null },
  hyper_fang:   { name: 'Hyper Fang', type: 'normal', category: 'physical', power: 80, acc: 90, pp: 15, priority: 0,
                  effect: { kind: 'flinch', chance: 10 } },
  body_slam:    { name: 'Body Slam', type: 'normal', category: 'physical', power: 85, acc: 100, pp: 15, priority: 0,
                  effect: { kind: 'status', id: 'par', chance: 30 } },
  double_edge:  { name: 'Double-Edge', type: 'normal', category: 'physical', power: 120, acc: 100, pp: 15, priority: 0,
                  effect: { kind: 'recoil', frac: 0.33 } },
  hyper_beam:   { name: 'Hyper Beam', type: 'normal', category: 'special', power: 150, acc: 90, pp: 5, priority: 0, effect: null },
  swift:        { name: 'Swift', type: 'normal', category: 'special', power: 60, acc: 100, pp: 20, priority: 0, effect: null }, // coi như luôn trúng
  splash:       { name: 'Splash', type: 'normal', category: 'status', power: 0, acc: 100, pp: 40, priority: 0, effect: null }, // không có tác dụng
  harden:       { name: 'Harden', type: 'normal', category: 'status', power: 0, acc: 100, pp: 30, priority: 0,
                  effect: { kind: 'stat', target: 'self', stat: 'def', stages: 1, chance: 100 } },
  recover:      { name: 'Recover', type: 'normal', category: 'status', power: 0, acc: 100, pp: 10, priority: 0,
                  effect: { kind: 'heal', frac: 0.5 } },
  rest:         { name: 'Rest', type: 'psychic', category: 'status', power: 0, acc: 100, pp: 10, priority: 0,
                  effect: { kind: 'heal', frac: 1.0 } }, // đơn giản hoá: hồi đầy máu

  // Hệ fire
  ember:        { name: 'Ember', type: 'fire', category: 'special', power: 40, acc: 100, pp: 25, priority: 0,
                  effect: { kind: 'status', id: 'brn', chance: 10 } },
  flamethrower: { name: 'Flamethrower', type: 'fire', category: 'special', power: 90, acc: 100, pp: 15, priority: 0,
                  effect: { kind: 'status', id: 'brn', chance: 10 } },

  // Hệ water
  water_gun:    { name: 'Water Gun', type: 'water', category: 'special', power: 40, acc: 100, pp: 25, priority: 0, effect: null },
  bubble:       { name: 'Bubble', type: 'water', category: 'special', power: 40, acc: 100, pp: 30, priority: 0,
                  effect: { kind: 'stat', target: 'foe', stat: 'spe', stages: -1, chance: 10 } },
  bubble_beam:  { name: 'Bubble Beam', type: 'water', category: 'special', power: 65, acc: 100, pp: 20, priority: 0,
                  effect: { kind: 'stat', target: 'foe', stat: 'spe', stages: -1, chance: 10 } },
  hydro_pump:   { name: 'Hydro Pump', type: 'water', category: 'special', power: 110, acc: 80, pp: 5, priority: 0, effect: null },

  // Hệ grass / poison (bột)
  vine_whip:    { name: 'Vine Whip', type: 'grass', category: 'physical', power: 45, acc: 100, pp: 25, priority: 0, effect: null },
  razor_leaf:   { name: 'Razor Leaf', type: 'grass', category: 'physical', power: 55, acc: 95, pp: 25, priority: 0, effect: null },
  solar_beam:   { name: 'Solar Beam', type: 'grass', category: 'special', power: 120, acc: 100, pp: 10, priority: 0, effect: null }, // đơn giản hoá: đánh ngay 1 lượt
  absorb:       { name: 'Absorb', type: 'grass', category: 'special', power: 20, acc: 100, pp: 25, priority: 0,
                  effect: { kind: 'drain', frac: 0.5 } },
  mega_drain:   { name: 'Mega Drain', type: 'grass', category: 'special', power: 40, acc: 100, pp: 15, priority: 0,
                  effect: { kind: 'drain', frac: 0.5 } },
  leech_seed:   { name: 'Leech Seed', type: 'grass', category: 'special', power: 20, acc: 90, pp: 10, priority: 0,
                  effect: { kind: 'drain', frac: 0.5 } }, // đơn giản hoá: coi như chiêu hút máu
  sleep_powder: { name: 'Sleep Powder', type: 'grass', category: 'status', power: 0, acc: 75, pp: 15, priority: 0,
                  effect: { kind: 'status', id: 'slp', chance: 100 } },
  poison_powder:{ name: 'Poison Powder', type: 'poison', category: 'status', power: 0, acc: 75, pp: 35, priority: 0,
                  effect: { kind: 'status', id: 'psn', chance: 100 } },
  stun_spore:   { name: 'Stun Spore', type: 'grass', category: 'status', power: 0, acc: 75, pp: 30, priority: 0,
                  effect: { kind: 'status', id: 'par', chance: 100 } },

  // Hệ electric
  thundershock: { name: 'Thunder Shock', type: 'electric', category: 'special', power: 40, acc: 100, pp: 30, priority: 0,
                  effect: { kind: 'status', id: 'par', chance: 10 } },
  thunderbolt:  { name: 'Thunderbolt', type: 'electric', category: 'special', power: 90, acc: 100, pp: 15, priority: 0,
                  effect: { kind: 'status', id: 'par', chance: 10 } },
  thunder_wave: { name: 'Thunder Wave', type: 'electric', category: 'status', power: 0, acc: 90, pp: 20, priority: 0,
                  effect: { kind: 'status', id: 'par', chance: 100 } },

  // Hệ flying
  gust:         { name: 'Gust', type: 'flying', category: 'special', power: 40, acc: 100, pp: 35, priority: 0, effect: null },
  wing_attack:  { name: 'Wing Attack', type: 'flying', category: 'physical', power: 60, acc: 100, pp: 35, priority: 0, effect: null },

  // Hệ dark
  bite:         { name: 'Bite', type: 'dark', category: 'physical', power: 60, acc: 100, pp: 25, priority: 0,
                  effect: { kind: 'flinch', chance: 30 } },

  // Hệ poison
  poison_sting: { name: 'Poison Sting', type: 'poison', category: 'physical', power: 15, acc: 100, pp: 35, priority: 0,
                  effect: { kind: 'status', id: 'psn', chance: 30 } },
  acid:         { name: 'Acid', type: 'poison', category: 'special', power: 40, acc: 100, pp: 30, priority: 0,
                  effect: { kind: 'stat', target: 'foe', stat: 'spd', stages: -1, chance: 10 } },

  // Hệ bug
  string_shot:  { name: 'String Shot', type: 'bug', category: 'status', power: 0, acc: 95, pp: 40, priority: 0,
                  effect: { kind: 'stat', target: 'foe', stat: 'spe', stages: -2, chance: 100 } },

  // Hệ psychic
  confusion:    { name: 'Confusion', type: 'psychic', category: 'special', power: 50, acc: 100, pp: 25, priority: 0,
                  effect: { kind: 'status', id: 'conf', chance: 10 } },
  psybeam:      { name: 'Psybeam', type: 'psychic', category: 'special', power: 65, acc: 100, pp: 20, priority: 0,
                  effect: { kind: 'status', id: 'conf', chance: 10 } },
  agility:      { name: 'Agility', type: 'psychic', category: 'status', power: 0, acc: 100, pp: 30, priority: 0,
                  effect: { kind: 'stat', target: 'self', stat: 'spe', stages: 2, chance: 100 } },

  // Hệ fighting
  karate_chop:  { name: 'Karate Chop', type: 'fighting', category: 'physical', power: 50, acc: 100, pp: 25, priority: 0, effect: null },
  low_kick:     { name: 'Low Kick', type: 'fighting', category: 'physical', power: 60, acc: 100, pp: 20, priority: 0, effect: null }, // đơn giản hoá: power cố định

  // Hệ rock / ground
  rock_throw:   { name: 'Rock Throw', type: 'rock', category: 'physical', power: 50, acc: 90, pp: 15, priority: 0, effect: null },
  magnitude:    { name: 'Magnitude', type: 'ground', category: 'physical', power: 70, acc: 100, pp: 30, priority: 0, effect: null }, // đơn giản hoá: power cố định 70

  // Hệ dragon
  dragon_rage:  { name: 'Dragon Rage', type: 'dragon', category: 'special', power: 40, acc: 100, pp: 10, priority: 0, effect: null }, // đơn giản hoá: power 40 thay damage cố định
};
