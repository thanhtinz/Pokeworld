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

  // ==== Bổ sung chiêu Gen 1 ====
  // Hệ normal (đánh)
  pound:        { name: 'Pound', type: 'normal', category: 'physical', power: 40, acc: 100, pp: 35, priority: 0, effect: null },
  comet_punch:  { name: 'Comet Punch', type: 'normal', category: 'physical', power: 60, acc: 85, pp: 15, priority: 0, effect: null }, // đơn giản hoá: gộp nhiều đòn
  mega_punch:   { name: 'Mega Punch', type: 'normal', category: 'physical', power: 80, acc: 85, pp: 20, priority: 0, effect: null },
  mega_kick:    { name: 'Mega Kick', type: 'normal', category: 'physical', power: 120, acc: 75, pp: 5, priority: 0, effect: null },
  pay_day:      { name: 'Pay Day', type: 'normal', category: 'physical', power: 40, acc: 100, pp: 20, priority: 0, effect: null },
  doubleslap:   { name: 'Double Slap', type: 'normal', category: 'physical', power: 45, acc: 85, pp: 10, priority: 0, effect: null }, // đơn giản hoá: gộp nhiều đòn
  slam:         { name: 'Slam', type: 'normal', category: 'physical', power: 80, acc: 75, pp: 20, priority: 0, effect: null },
  horn_attack:  { name: 'Horn Attack', type: 'normal', category: 'physical', power: 65, acc: 100, pp: 25, priority: 0, effect: null },
  fury_attack:  { name: 'Fury Attack', type: 'normal', category: 'physical', power: 60, acc: 85, pp: 20, priority: 0, effect: null }, // đơn giản hoá: gộp nhiều đòn
  fury_swipes:  { name: 'Fury Swipes', type: 'normal', category: 'physical', power: 60, acc: 80, pp: 15, priority: 0, effect: null }, // đơn giản hoá: gộp nhiều đòn
  take_down:    { name: 'Take Down', type: 'normal', category: 'physical', power: 90, acc: 85, pp: 20, priority: 0,
                  effect: { kind: 'recoil', frac: 0.25 } },
  thrash:       { name: 'Thrash', type: 'normal', category: 'physical', power: 120, acc: 100, pp: 10, priority: 0, effect: null },
  strength:     { name: 'Strength', type: 'normal', category: 'physical', power: 80, acc: 100, pp: 15, priority: 0, effect: null },
  cut:          { name: 'Cut', type: 'normal', category: 'physical', power: 50, acc: 95, pp: 30, priority: 0, effect: null },
  headbutt:     { name: 'Headbutt', type: 'normal', category: 'physical', power: 70, acc: 100, pp: 15, priority: 0,
                  effect: { kind: 'flinch', chance: 30 } },
  stomp:        { name: 'Stomp', type: 'normal', category: 'physical', power: 65, acc: 100, pp: 20, priority: 0,
                  effect: { kind: 'flinch', chance: 30 } },
  dizzy_punch:  { name: 'Dizzy Punch', type: 'normal', category: 'physical', power: 70, acc: 100, pp: 10, priority: 0, effect: null },
  skull_bash:   { name: 'Skull Bash', type: 'normal', category: 'physical', power: 130, acc: 100, pp: 10, priority: 0, effect: null }, // đơn giản hoá: đánh ngay 1 lượt
  slash:        { name: 'Slash', type: 'normal', category: 'physical', power: 70, acc: 100, pp: 20, priority: 0, effect: null },
  super_fang:   { name: 'Super Fang', type: 'normal', category: 'physical', power: 60, acc: 90, pp: 10, priority: 0, effect: null }, // đơn giản hoá: power cố định
  egg_bomb:     { name: 'Egg Bomb', type: 'normal', category: 'physical', power: 100, acc: 75, pp: 10, priority: 0, effect: null },
  tri_attack:   { name: 'Tri Attack', type: 'normal', category: 'physical', power: 80, acc: 100, pp: 10, priority: 0,
                  effect: { kind: 'status', id: 'brn', chance: 20 } },
  self_destruct:{ name: 'Self-Destruct', type: 'normal', category: 'physical', power: 200, acc: 100, pp: 5, priority: 0, effect: null }, // đơn giản hoá: không tự ngất
  explosion:    { name: 'Explosion', type: 'normal', category: 'physical', power: 250, acc: 100, pp: 5, priority: 0, effect: null }, // đơn giản hoá: không tự ngất

  // Hệ normal (trạng thái)
  sing:         { name: 'Sing', type: 'normal', category: 'status', power: 0, acc: 55, pp: 15, priority: 0,
                  effect: { kind: 'status', id: 'slp', chance: 100 } },
  glare:        { name: 'Glare', type: 'normal', category: 'status', power: 0, acc: 100, pp: 30, priority: 0,
                  effect: { kind: 'status', id: 'par', chance: 100 } },
  supersonic:   { name: 'Supersonic', type: 'normal', category: 'status', power: 0, acc: 55, pp: 20, priority: 0, effect: null },
  disable:      { name: 'Disable', type: 'normal', category: 'status', power: 0, acc: 100, pp: 20, priority: 0, effect: null },
  screech:      { name: 'Screech', type: 'normal', category: 'status', power: 0, acc: 85, pp: 40, priority: 0,
                  effect: { kind: 'stat', target: 'foe', stat: 'def', stages: -2, chance: 100 } },
  defense_curl: { name: 'Defense Curl', type: 'normal', category: 'status', power: 0, acc: 100, pp: 40, priority: 0,
                  effect: { kind: 'stat', target: 'self', stat: 'def', stages: 1, chance: 100 } },
  swords_dance: { name: 'Swords Dance', type: 'normal', category: 'status', power: 0, acc: 100, pp: 20, priority: 0,
                  effect: { kind: 'stat', target: 'self', stat: 'atk', stages: 2, chance: 100 } },
  sharpen:      { name: 'Sharpen', type: 'normal', category: 'status', power: 0, acc: 100, pp: 30, priority: 0,
                  effect: { kind: 'stat', target: 'self', stat: 'atk', stages: 1, chance: 100 } },
  growth:       { name: 'Growth', type: 'normal', category: 'status', power: 0, acc: 100, pp: 20, priority: 0,
                  effect: { kind: 'stat', target: 'self', stat: 'spa', stages: 1, chance: 100 } },
  double_team:  { name: 'Double Team', type: 'normal', category: 'status', power: 0, acc: 100, pp: 15, priority: 0, effect: null }, // né tránh chưa hỗ trợ
  minimize:     { name: 'Minimize', type: 'normal', category: 'status', power: 0, acc: 100, pp: 10, priority: 0, effect: null }, // né tránh chưa hỗ trợ
  focus_energy: { name: 'Focus Energy', type: 'normal', category: 'status', power: 0, acc: 100, pp: 30, priority: 0, effect: null }, // tỉ lệ chí mạng chưa hỗ trợ
  smokescreen:  { name: 'Smokescreen', type: 'normal', category: 'status', power: 0, acc: 100, pp: 20, priority: 0, effect: null }, // giảm acc chưa hỗ trợ
  flash:        { name: 'Flash', type: 'normal', category: 'status', power: 0, acc: 100, pp: 20, priority: 0, effect: null }, // giảm acc chưa hỗ trợ
  softboiled:   { name: 'Soft-Boiled', type: 'normal', category: 'status', power: 0, acc: 100, pp: 10, priority: 0,
                  effect: { kind: 'heal', frac: 0.5 } },
  transform:    { name: 'Transform', type: 'normal', category: 'status', power: 0, acc: 100, pp: 10, priority: 0, effect: null }, // biến hình chưa hỗ trợ
  conversion:   { name: 'Conversion', type: 'normal', category: 'status', power: 0, acc: 100, pp: 30, priority: 0, effect: null }, // đổi hệ chưa hỗ trợ

  // Hệ fighting
  double_kick:  { name: 'Double Kick', type: 'fighting', category: 'physical', power: 60, acc: 100, pp: 30, priority: 0, effect: null }, // đơn giản hoá: gộp 2 đòn
  seismic_toss: { name: 'Seismic Toss', type: 'fighting', category: 'physical', power: 60, acc: 100, pp: 20, priority: 0, effect: null }, // đơn giản hoá: power cố định
  submission:   { name: 'Submission', type: 'fighting', category: 'physical', power: 80, acc: 80, pp: 20, priority: 0,
                  effect: { kind: 'recoil', frac: 0.25 } },
  jump_kick:    { name: 'Jump Kick', type: 'fighting', category: 'physical', power: 100, acc: 95, pp: 10, priority: 0, effect: null },
  hi_jump_kick: { name: 'High Jump Kick', type: 'fighting', category: 'physical', power: 130, acc: 90, pp: 10, priority: 0, effect: null },
  rolling_kick: { name: 'Rolling Kick', type: 'fighting', category: 'physical', power: 60, acc: 85, pp: 15, priority: 0,
                  effect: { kind: 'flinch', chance: 30 } },

  // Hệ poison
  sludge:       { name: 'Sludge', type: 'poison', category: 'physical', power: 65, acc: 100, pp: 20, priority: 0,
                  effect: { kind: 'status', id: 'psn', chance: 30 } },
  smog:         { name: 'Smog', type: 'poison', category: 'physical', power: 30, acc: 70, pp: 20, priority: 0,
                  effect: { kind: 'status', id: 'psn', chance: 40 } },
  poison_gas:   { name: 'Poison Gas', type: 'poison', category: 'status', power: 0, acc: 90, pp: 40, priority: 0,
                  effect: { kind: 'status', id: 'psn', chance: 100 } },
  toxic:        { name: 'Toxic', type: 'poison', category: 'status', power: 0, acc: 90, pp: 10, priority: 0,
                  effect: { kind: 'status', id: 'psn', chance: 100 } }, // đơn giản hoá: độc thường
  acid_armor:   { name: 'Acid Armor', type: 'poison', category: 'status', power: 0, acc: 100, pp: 20, priority: 0,
                  effect: { kind: 'stat', target: 'self', stat: 'def', stages: 2, chance: 100 } },

  // Hệ bug
  pin_missile:  { name: 'Pin Missile', type: 'bug', category: 'physical', power: 60, acc: 95, pp: 20, priority: 0, effect: null }, // đơn giản hoá: gộp nhiều đòn
  twineedle:    { name: 'Twineedle', type: 'bug', category: 'physical', power: 50, acc: 100, pp: 20, priority: 0,
                  effect: { kind: 'status', id: 'psn', chance: 20 } },
  leech_life:   { name: 'Leech Life', type: 'bug', category: 'physical', power: 20, acc: 100, pp: 15, priority: 0,
                  effect: { kind: 'drain', frac: 0.5 } },

  // Hệ flying
  peck:         { name: 'Peck', type: 'flying', category: 'physical', power: 35, acc: 100, pp: 35, priority: 0, effect: null },
  drill_peck:   { name: 'Drill Peck', type: 'flying', category: 'physical', power: 80, acc: 100, pp: 20, priority: 0, effect: null },
  fly:          { name: 'Fly', type: 'flying', category: 'physical', power: 90, acc: 95, pp: 15, priority: 0, effect: null }, // đơn giản hoá: đánh ngay 1 lượt
  sky_attack:   { name: 'Sky Attack', type: 'flying', category: 'physical', power: 140, acc: 90, pp: 5, priority: 0, effect: null }, // đơn giản hoá: đánh ngay 1 lượt

  // Hệ ground
  earthquake:   { name: 'Earthquake', type: 'ground', category: 'physical', power: 100, acc: 100, pp: 10, priority: 0, effect: null },
  dig:          { name: 'Dig', type: 'ground', category: 'physical', power: 80, acc: 100, pp: 10, priority: 0, effect: null }, // đơn giản hoá: đánh ngay 1 lượt
  bone_club:    { name: 'Bone Club', type: 'ground', category: 'physical', power: 65, acc: 85, pp: 20, priority: 0,
                  effect: { kind: 'flinch', chance: 10 } },
  bonemerang:   { name: 'Bonemerang', type: 'ground', category: 'physical', power: 90, acc: 90, pp: 10, priority: 0, effect: null }, // đơn giản hoá: gộp 2 đòn
  sand_attack:  { name: 'Sand Attack', type: 'ground', category: 'status', power: 0, acc: 100, pp: 15, priority: 0, effect: null }, // giảm acc chưa hỗ trợ

  // Hệ rock
  rock_slide:   { name: 'Rock Slide', type: 'rock', category: 'physical', power: 75, acc: 90, pp: 10, priority: 0,
                  effect: { kind: 'flinch', chance: 30 } },

  // Hệ ghost
  lick:         { name: 'Lick', type: 'ghost', category: 'physical', power: 30, acc: 100, pp: 30, priority: 0,
                  effect: { kind: 'status', id: 'par', chance: 30 } },
  night_shade:  { name: 'Night Shade', type: 'ghost', category: 'physical', power: 60, acc: 100, pp: 15, priority: 0, effect: null }, // đơn giản hoá: power cố định
  confuse_ray:  { name: 'Confuse Ray', type: 'ghost', category: 'status', power: 0, acc: 100, pp: 10, priority: 0,
                  effect: { kind: 'status', id: 'conf', chance: 100 } },

  // Hệ fire
  fire_spin:    { name: 'Fire Spin', type: 'fire', category: 'special', power: 35, acc: 85, pp: 15, priority: 0, effect: null },
  fire_punch:   { name: 'Fire Punch', type: 'fire', category: 'special', power: 75, acc: 100, pp: 15, priority: 0,
                  effect: { kind: 'status', id: 'brn', chance: 10 } },
  fire_blast:   { name: 'Fire Blast', type: 'fire', category: 'special', power: 110, acc: 85, pp: 5, priority: 0,
                  effect: { kind: 'status', id: 'brn', chance: 10 } },

  // Hệ water
  surf:         { name: 'Surf', type: 'water', category: 'special', power: 90, acc: 100, pp: 15, priority: 0, effect: null },
  waterfall:    { name: 'Waterfall', type: 'water', category: 'special', power: 80, acc: 100, pp: 15, priority: 0,
                  effect: { kind: 'flinch', chance: 20 } },
  crabhammer:   { name: 'Crabhammer', type: 'water', category: 'special', power: 100, acc: 90, pp: 10, priority: 0, effect: null },
  clamp:        { name: 'Clamp', type: 'water', category: 'special', power: 35, acc: 85, pp: 15, priority: 0, effect: null },
  withdraw:     { name: 'Withdraw', type: 'water', category: 'status', power: 0, acc: 100, pp: 40, priority: 0,
                  effect: { kind: 'stat', target: 'self', stat: 'def', stages: 1, chance: 100 } },

  // Hệ grass
  petal_dance:  { name: 'Petal Dance', type: 'grass', category: 'special', power: 120, acc: 100, pp: 10, priority: 0, effect: null },
  spore:        { name: 'Spore', type: 'grass', category: 'status', power: 0, acc: 100, pp: 15, priority: 0,
                  effect: { kind: 'status', id: 'slp', chance: 100 } },

  // Hệ electric
  thunder:      { name: 'Thunder', type: 'electric', category: 'special', power: 110, acc: 70, pp: 10, priority: 0,
                  effect: { kind: 'status', id: 'par', chance: 30 } },
  thunder_punch:{ name: 'Thunder Punch', type: 'electric', category: 'special', power: 75, acc: 100, pp: 15, priority: 0,
                  effect: { kind: 'status', id: 'par', chance: 10 } },

  // Hệ ice
  ice_beam:     { name: 'Ice Beam', type: 'ice', category: 'special', power: 90, acc: 100, pp: 10, priority: 0,
                  effect: { kind: 'status', id: 'frz', chance: 10 } },
  blizzard:     { name: 'Blizzard', type: 'ice', category: 'special', power: 110, acc: 70, pp: 5, priority: 0,
                  effect: { kind: 'status', id: 'frz', chance: 10 } },
  ice_punch:    { name: 'Ice Punch', type: 'ice', category: 'special', power: 75, acc: 100, pp: 15, priority: 0,
                  effect: { kind: 'status', id: 'frz', chance: 10 } },
  aurora_beam:  { name: 'Aurora Beam', type: 'ice', category: 'special', power: 65, acc: 100, pp: 20, priority: 0,
                  effect: { kind: 'stat', target: 'foe', stat: 'atk', stages: -1, chance: 10 } },
  haze:         { name: 'Haze', type: 'ice', category: 'status', power: 0, acc: 100, pp: 30, priority: 0, effect: null }, // xoá buff chưa hỗ trợ
  mist:         { name: 'Mist', type: 'ice', category: 'status', power: 0, acc: 100, pp: 30, priority: 0, effect: null }, // chắn giảm chỉ số chưa hỗ trợ

  // Hệ psychic
  psychic_mv:   { name: 'Psychic', type: 'psychic', category: 'special', power: 90, acc: 100, pp: 10, priority: 0,
                  effect: { kind: 'stat', target: 'foe', stat: 'spd', stages: -1, chance: 10 } },
  psywave:      { name: 'Psywave', type: 'psychic', category: 'special', power: 60, acc: 100, pp: 15, priority: 0, effect: null }, // đơn giản hoá: power cố định
  dream_eater:  { name: 'Dream Eater', type: 'psychic', category: 'special', power: 100, acc: 100, pp: 15, priority: 0,
                  effect: { kind: 'drain', frac: 0.5 } },
  hypnosis:     { name: 'Hypnosis', type: 'psychic', category: 'status', power: 0, acc: 60, pp: 20, priority: 0,
                  effect: { kind: 'status', id: 'slp', chance: 100 } },
  barrier:      { name: 'Barrier', type: 'psychic', category: 'status', power: 0, acc: 100, pp: 20, priority: 0,
                  effect: { kind: 'stat', target: 'self', stat: 'def', stages: 2, chance: 100 } },
  amnesia:      { name: 'Amnesia', type: 'psychic', category: 'status', power: 0, acc: 100, pp: 20, priority: 0,
                  effect: { kind: 'stat', target: 'self', stat: 'spd', stages: 2, chance: 100 } },
  meditate:     { name: 'Meditate', type: 'psychic', category: 'status', power: 0, acc: 100, pp: 40, priority: 0,
                  effect: { kind: 'stat', target: 'self', stat: 'atk', stages: 1, chance: 100 } },
  teleport:     { name: 'Teleport', type: 'psychic', category: 'status', power: 0, acc: 100, pp: 20, priority: 0, effect: null },
  reflect:      { name: 'Reflect', type: 'psychic', category: 'status', power: 0, acc: 100, pp: 20, priority: 0, effect: null }, // màn chắn chưa hỗ trợ
  light_screen: { name: 'Light Screen', type: 'psychic', category: 'status', power: 0, acc: 100, pp: 30, priority: 0, effect: null }, // màn chắn chưa hỗ trợ
};
