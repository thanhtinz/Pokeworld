// TuxeWorld H5 | data/equipment.js | Dữ liệu trang bị nhân vật: slot, độ hiếm, 24 món, bảng cường hóa

// 6 ô trang bị của huấn luyện viên. icon = id sprite item PokeAPI dùng làm ảnh mờ cho ô trống.
// icon = tên icon SVG trong ui/icons.js, dùng cho ô còn trống.
// Trước đây mượn sprite vật phẩm nên sáu ô nhìn như nhau, toàn khối xám.
export const SLOTS = [
  { id: 'hat',    name: 'Mũ',         icon: 'slot_hat' },
  { id: 'outfit', name: 'Trang phục', icon: 'slot_outfit' },
  { id: 'gloves', name: 'Găng tay',   icon: 'slot_gloves' },
  { id: 'shoes',  name: 'Giày',       icon: 'slot_shoes' },
  { id: 'bag',    name: 'Ba lô',      icon: 'slot_bag' },
  { id: 'skin',   name: 'Skin',       icon: 'slot_skin' },
];

// mult: hệ số nhân stat gốc theo độ hiếm; maxLevel: giới hạn cường hóa
export const RARITY = {
  common:    { name: 'Thường',       color: '#9aa0c3', mult: 1.0, maxLevel: 5 },
  rare:      { name: 'Hiếm',         color: '#4dabf7', mult: 1.5, maxLevel: 10 },
  epic:      { name: 'Sử Thi',       color: '#b197fc', mult: 2.2, maxLevel: 15 },
  legendary: { name: 'Huyền Thoại',  color: '#ffd43b', mult: 3.2, maxLevel: 20 },
};

// Danh sách các chỉ số phụ có thể xuất hiện (đơn vị %), kèm tên hiển thị
export const STAT_KEYS = ['expBonus', 'moneyBonus', 'catchBonus', 'shinyBonus', 'atkBonus', 'defBonus', 'hpBonus', 'idleSpeed'];
export const STAT_NAMES = {
  expBonus:   'EXP nhận được',
  moneyBonus: 'Tiền nhận được',
  catchBonus: 'Tỉ lệ bắt',
  shinyBonus: 'Tỉ lệ shiny',
  atkBonus:   'Tấn công',
  defBonus:   'Phòng thủ',
  hpBonus:    'HP tối đa',
  idleSpeed:  'Tốc độ đi bộ',
};

// 24 món: 6 slot × 4 độ hiếm. reqLevel 1 / 5 / 12 / 20 theo độ hiếm.
export const EQUIPMENT = {
  // ==== Mũ ====
  cap_basic:     { name: 'Lucky Cap', slot: 'hat', rarity: 'common', reqLevel: 1, price: 2000,
                   sprite: 'lucky_egg', stats: { expBonus: 5 },
                   desc: 'Mũ lưỡi trai may mắn, đội vào học nhanh hơn một chút.' },
  cap_scope:     { name: 'Scope Visor', slot: 'hat', rarity: 'rare', reqLevel: 5, price: 8000,
                   sprite: 'silph_scope', stats: { expBonus: 8, catchBonus: 5 },
                   desc: 'Kính che mắt nhìn xuyên bụi rậm, dễ nhắm Tuxemon hoang dã.' },
  cap_crown:     { name: 'Champion Crown', slot: 'hat', rarity: 'epic', reqLevel: 12, price: 26000,
                   sprite: 'nugget', stats: { expBonus: 14, moneyBonus: 10, atkBonus: 4 },
                   desc: 'Vương miện của nhà vô địch, uy phong khiến Tuxemon mạnh hơn.' },
  cap_ashen:     { name: 'Sacred Halo', slot: 'hat', rarity: 'legendary', reqLevel: 20, price: 90000,
                   sprite: 'sacred_ash', stats: { expBonus: 22, shinyBonus: 12, hpBonus: 8 },
                   desc: 'Vòng hào quang tro thiêng, truyền thuyết kể nó gọi được Tuxemon hiếm.' },

  // ==== Trang phục ====
  outfit_tee:    { name: 'Rookie Jacket', slot: 'outfit', rarity: 'common', reqLevel: 1, price: 2400,
                   sprite: 'exp_share', stats: { defBonus: 5 },
                   desc: 'Áo khoác tân binh, bền và ấm cho những chuyến đi đầu tiên.' },
  outfit_sail:   { name: 'Sailor Coat', slot: 'outfit', rarity: 'rare', reqLevel: 5, price: 9000,
                   sprite: 'ss_ticket', stats: { defBonus: 9, hpBonus: 5 },
                   desc: 'Áo thủy thủ chống gió biển, đứng vững trước mọi đòn đánh.' },
  outfit_armor:  { name: 'Fossil Plate Vest', slot: 'outfit', rarity: 'epic', reqLevel: 12, price: 29000,
                   sprite: 'dome_fossil', stats: { defBonus: 16, hpBonus: 10, atkBonus: 4 },
                   desc: 'Giáp ghép từ mảnh hóa thạch cổ, cứng như đá tảng.' },
  outfit_regal:  { name: 'Regal Mantle', slot: 'outfit', rarity: 'legendary', reqLevel: 20, price: 96000,
                   sprite: 'full_restore', stats: { defBonus: 24, hpBonus: 18, expBonus: 8 },
                   desc: 'Áo choàng hoàng gia dệt chỉ bạc, phục hồi tinh thần cả đội.' },

  // ==== Găng tay ====
  gloves_work:   { name: 'Work Gloves', slot: 'gloves', rarity: 'common', reqLevel: 1, price: 1800,
                   sprite: 'old_rod', stats: { atkBonus: 5 },
                   desc: 'Găng lao động sờn cũ, nắm chắc mọi thứ trong tay.' },
  gloves_angler: { name: 'Angler Grips', slot: 'gloves', rarity: 'rare', reqLevel: 5, price: 7600,
                   sprite: 'good_rod', stats: { atkBonus: 9, catchBonus: 4 },
                   desc: 'Găng câu cá chống trượt, kéo bóng ném chuẩn hơn.' },
  gloves_key:    { name: 'Keymaster Gloves', slot: 'gloves', rarity: 'epic', reqLevel: 12, price: 25000,
                   sprite: 'card_key', stats: { atkBonus: 16, defBonus: 6 },
                   desc: 'Găng của kẻ mở mọi cánh cửa, ra đòn dứt khoát.' },
  gloves_flute:  { name: 'Maestro Gloves', slot: 'gloves', rarity: 'legendary', reqLevel: 20, price: 88000,
                   sprite: 'poke_flute', stats: { atkBonus: 25, catchBonus: 10, expBonus: 6 },
                   desc: 'Găng nhạc trưởng, mỗi cử chỉ đều điều khiển được nhịp trận đấu.' },

  // ==== Giày ====
  shoes_run:     { name: 'Running Shoes', slot: 'shoes', rarity: 'common', reqLevel: 1, price: 2200,
                   sprite: 'bicycle', stats: { idleSpeed: 6 },
                   desc: 'Giày chạy nhẹ tênh, đi tuần nhanh hơn hẳn.' },
  shoes_map:     { name: 'Trailblazer Boots', slot: 'shoes', rarity: 'rare', reqLevel: 5, price: 8400,
                   sprite: 'town_map', stats: { idleSpeed: 11, expBonus: 5 },
                   desc: 'Ủng mở đường, biết lối tắt qua mọi con đường.' },
  shoes_sea:     { name: 'Voyager Boots', slot: 'shoes', rarity: 'epic', reqLevel: 12, price: 27000,
                   sprite: 'old_sea_map', stats: { idleSpeed: 18, moneyBonus: 8, defBonus: 5 },
                   desc: 'Ủng viễn dương theo hải đồ cổ, đưa bạn tới nơi chưa ai đặt chân.' },
  shoes_seeker:  { name: 'Seeker Striders', slot: 'shoes', rarity: 'legendary', reqLevel: 20, price: 92000,
                   sprite: 'vs_seeker', stats: { idleSpeed: 28, expBonus: 10, moneyBonus: 10 },
                   desc: 'Giày truy tìm đối thủ, không bao giờ để bạn phải chờ trận kế tiếp.' },

  // ==== Ba lô ====
  bag_pouch:     { name: 'Berry Pouch', slot: 'bag', rarity: 'common', reqLevel: 1, price: 2600,
                   sprite: 'berry_pouch', stats: { moneyBonus: 5 },
                   desc: 'Túi quả nhỏ gọn, chỗ nào cũng nhét thêm được chiến lợi phẩm.' },
  bag_coin:      { name: 'Coin Case', slot: 'bag', rarity: 'rare', reqLevel: 5, price: 9600,
                   sprite: 'coin_case', stats: { moneyBonus: 12 },
                   desc: 'Hộp xu sòng bạc, tiền thưởng cứ thế đầy lên.' },
  bag_nugget:    { name: 'Nugget Satchel', slot: 'bag', rarity: 'epic', reqLevel: 12, price: 31000,
                   sprite: 'nugget', stats: { moneyBonus: 20, expBonus: 6 },
                   desc: 'Túi đựng vàng cục, ai nhìn thấy cũng muốn trả giá cao hơn.' },
  bag_restore:   { name: 'Grand Rucksack', slot: 'bag', rarity: 'legendary', reqLevel: 20, price: 99000,
                   sprite: 'rare_candy', stats: { moneyBonus: 30, expBonus: 12, hpBonus: 8 },
                   desc: 'Ba lô khổng lồ chứa cả kho kẹo hiếm, hành trình nào cũng dư dả.' },

  // ==== Skin (bộ trang phục toàn thân) ====
  skin_rookie:   { name: 'Áo Tân Binh', slot: 'skin', rarity: 'common', reqLevel: 1, price: 2800,
                   sprite: 'teachy_tv', stats: { catchBonus: 5 },
                   desc: 'Bộ đồ vải thô của người mới lên đường.' },
  skin_ranger:   { name: 'Đồ Kiểm Lâm', slot: 'skin', rarity: 'rare', reqLevel: 5, price: 10000,
                   sprite: 'fame_checker', stats: { catchBonus: 9, shinyBonus: 4 },
                   desc: 'Bộ đồ xanh rêu của người gác rừng, đi bụi rậm không sợ gai.' },
  skin_diver:    { name: 'Đồ Lặn Biển', slot: 'skin', rarity: 'epic', reqLevel: 12, price: 33000,
                   sprite: 'vs_recorder', stats: { catchBonus: 15, shinyBonus: 8, expBonus: 6 },
                   desc: 'Bộ đồ lặn kín người, xuống nước sâu cỡ nào cũng chịu được.' },
  skin_champion: { name: 'Áo Nhà Vô Địch', slot: 'skin', rarity: 'legendary', reqLevel: 20, price: 105000,
                   sprite: 'max_revive', stats: { catchBonus: 22, shinyBonus: 18, hpBonus: 10 },
                   desc: 'Áo choàng chỉ nhà vô địch mới được khoác lên vai.' },
};

// ==== Bảng cường hóa ====
// Thất bại KHÔNG làm mất hay hạ cấp trang bị — chỉ tốn tiền và đá.
export const UPGRADE = {
  stoneItem: 'upgrade_stone',
  // Tiền cần để lên từ `level` -> `level+1`
  costMoney(level) { return Math.round(500 * Math.pow(level + 1, 1.6)); },
  // Số đá cường hóa cần
  costStone(level) { return 1 + Math.floor(level / 3); },
  // Tỉ lệ thành công (0..1)
  successRate(level) {
    if (level < 5) return 1.0;
    if (level < 10) return 0.8;
    if (level < 15) return 0.6;
    return 0.4;
  },
  // Hệ số nhân stat theo cấp cường hóa
  levelMult(level) { return 1 + level * 0.12; },
  failNote: 'Cường hóa thất bại KHÔNG làm mất hay hạ cấp trang bị — bạn chỉ tốn tiền và đá.',
};

// Stat thực tế của một món ở cấp cường hóa `level` (đã nhân độ hiếm + cấp)
export function statsOf(id, level = 0) {
  const eq = EQUIPMENT[id];
  if (!eq) return {};
  const rm = (RARITY[eq.rarity] || RARITY.common).mult;
  const lm = UPGRADE.levelMult(level || 0);
  const out = {};
  for (const [k, v] of Object.entries(eq.stats || {})) {
    out[k] = Math.round(v * rm * lm * 10) / 10;
  }
  return out;
}

// Cấp cường hóa tối đa của món
export function maxLevelOf(id) {
  const eq = EQUIPMENT[id];
  return eq ? (RARITY[eq.rarity] || RARITY.common).maxLevel : 0;
}
