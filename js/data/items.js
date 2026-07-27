// PokeWorld H5 | data/items.js | Dữ liệu vật phẩm (thuốc, bóng, đá tiến hoá...)

// kind: 'medicine' | 'ball' | 'stone' | 'candy' | 'berry' | 'held'
// effect.heal = số HP hồi ('full' = hồi đầy); effect.cure = trạng thái chữa
export const ITEMS = {
  // Thuốc hồi máu
  potion:        { name: 'Potion', desc: 'Hồi 20 HP cho một Pokémon.', icon: '🧪',
                   kind: 'medicine', price: 300, sell: 150, effect: { heal: 20 } },
  super_potion:  { name: 'Super Potion', desc: 'Hồi 50 HP cho một Pokémon.', icon: '🧪',
                   kind: 'medicine', price: 700, sell: 350, effect: { heal: 50 } },
  hyper_potion:  { name: 'Hyper Potion', desc: 'Hồi 120 HP cho một Pokémon.', icon: '🧪',
                   kind: 'medicine', price: 1500, sell: 750, effect: { heal: 120 } },
  max_potion:    { name: 'Max Potion', desc: 'Hồi đầy HP cho một Pokémon.', icon: '🧪',
                   kind: 'medicine', price: 2500, sell: 1250, effect: { heal: 'full' } },
  revive:        { name: 'Revive', desc: 'Hồi sinh Pokémon bất tỉnh với 50% HP.', icon: '💊',
                   kind: 'medicine', price: 2000, sell: 1000, effect: { revive: 0.5 } },

  // Thuốc chữa trạng thái
  antidote:      { name: 'Antidote', desc: 'Chữa trạng thái trúng độc.', icon: '💊',
                   kind: 'medicine', price: 200, sell: 100, effect: { cure: 'psn' } },
  paralyze_heal: { name: 'Paralyze Heal', desc: 'Chữa trạng thái tê liệt.', icon: '💊',
                   kind: 'medicine', price: 300, sell: 150, effect: { cure: 'par' } },
  awakening:     { name: 'Awakening', desc: 'Đánh thức Pokémon đang ngủ.', icon: '💊',
                   kind: 'medicine', price: 100, sell: 50, effect: { cure: 'slp' } },
  burn_heal:     { name: 'Burn Heal', desc: 'Chữa trạng thái bỏng.', icon: '💊',
                   kind: 'medicine', price: 300, sell: 150, effect: { cure: 'brn' } },
  ice_heal:      { name: 'Ice Heal', desc: 'Chữa trạng thái đóng băng.', icon: '💊',
                   kind: 'medicine', price: 100, sell: 50, effect: { cure: 'frz' } },
  full_heal:     { name: 'Full Heal', desc: 'Chữa mọi trạng thái bất lợi.', icon: '💊',
                   kind: 'medicine', price: 400, sell: 200, effect: { cure: 'all' } },

  // Bóng bắt Pokémon
  poke_ball:     { name: 'Poké Ball', desc: 'Bóng bắt Pokémon cơ bản.', icon: '⚪',
                   kind: 'ball', price: 200, sell: 100, ballMult: 1.0 },
  great_ball:    { name: 'Great Ball', desc: 'Bóng tốt, tỉ lệ bắt cao hơn Poké Ball.', icon: '🔵',
                   kind: 'ball', price: 600, sell: 300, ballMult: 1.5 },
  ultra_ball:    { name: 'Ultra Ball', desc: 'Bóng thượng hạng, tỉ lệ bắt rất cao.', icon: '🟡',
                   kind: 'ball', price: 1200, sell: 600, ballMult: 2.0 },

  // Đá tiến hoá
  thunder_stone: { name: 'Thunder Stone', desc: 'Đá tiến hoá cho Pokémon hệ Điện.', icon: '💎',
                   kind: 'stone', price: 3000, sell: 1500 },
  water_stone:   { name: 'Water Stone', desc: 'Đá tiến hoá cho Pokémon hệ Nước.', icon: '💎',
                   kind: 'stone', price: 3000, sell: 1500 },
  fire_stone:    { name: 'Fire Stone', desc: 'Đá tiến hoá cho Pokémon hệ Lửa.', icon: '💎',
                   kind: 'stone', price: 3000, sell: 1500 },
  leaf_stone:    { name: 'Leaf Stone', desc: 'Đá tiến hoá cho Pokémon hệ Cỏ.', icon: '💎',
                   kind: 'stone', price: 3000, sell: 1500 },

  // Khác
  rare_candy:    { name: 'Rare Candy', desc: 'Tăng ngay 1 cấp cho Pokémon.', icon: '🍬',
                   kind: 'candy', price: 10000, sell: 2400, effect: { level: 1 } },
  oran_berry:    { name: 'Oran Berry', desc: 'Quả mọng hồi 10 HP.', icon: '🍓',
                   kind: 'berry', price: 100, sell: 50, effect: { heal: 10 } },
  lucky_egg:     { name: 'Lucky Egg', desc: 'Vật cầm: nhận thêm 50% Exp.', icon: '🥚',
                   kind: 'held', price: 10000, sell: 5000, effect: { expMult: 1.5 } },
  exp_share:     { name: 'Exp. Share', desc: 'Vật cầm: chia sẻ Exp cho cả đội.', icon: '📿',
                   kind: 'held', price: 6000, sell: 3000, effect: { expShare: true } },
};
