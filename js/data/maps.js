// PokeWorld H5 | data/maps.js | Bản đồ đi lại được, viết bằng lưới ký tự cho dễ sửa
// Ký hiệu:  . cỏ   , cỏ hoa   " cỏ cao (gặp Pokémon)   f cỏ rừng (gặp Pokémon)
//           # cây   ~ nước    - đường đất   s cát   o đá   B bảng hiệu
//           W tường nhà   R mái nhà   D cửa   = sàn   c nền hang   C vách hang

// Ký tự -> { t: chỉ số ô trong tileset, solid: chắn đường, enc: có gặp Pokémon }
export const TILE_LEGEND = {
  '.': { t: 0 },
  ',': { t: 8 },
  '"': { t: 1, enc: true },
  'f': { t: 12, enc: true },
  '-': { t: 2 },
  's': { t: 10 },
  '=': { t: 11 },
  'c': { t: 13 },
  '#': { t: 4, solid: true },
  '~': { t: 3, solid: true },
  'o': { t: 9, solid: true },
  'W': { t: 5, solid: true },
  'R': { t: 6, solid: true },
  'B': { t: 15, solid: true },
  'C': { t: 14, solid: true },
  'D': { t: 7 },              // cửa: đi lên được, chạm vào thì mở cửa hàng/trung tâm
};

export const TILE_SIZE = 32;

// spawn: vị trí xuất hiện mặc định. warps: cổng sang khu khác.
// npcs: nhân vật đứng trên bản đồ (kind: heal | shop | pc | trainer | talk)
export const MAPS = {
  town_1: {
    name: 'Thị Trấn Khởi Đầu',
    spawn: { x: 11, y: 12 },
    rows: [
      '####################',
      '#....,....,........#',
      '#..RRRR....RRRR....#',
      '#..RRRR....RRRR..#.#',
      '#..WWDW....WWDW....#',
      '#..--------------..#',
      '#..-............-..#',
      '#..-..RRRRRR....-..#',
      '#..-..RRRRRR....-..#',
      '#..-..WWWDWW....-..#',
      '#..-------------...#',
      '#....,.......,.....#',
      '#..................#',
      '#.....B............#',
      '#........----......#',
      '####################',
    ],
    warps: [{ x: 9, y: 15, to: 'route_1', tx: 10, ty: 1 }, { x: 10, y: 15, to: 'route_1', tx: 10, ty: 1 }],
    npcs: [
      { x: 5, y: 4, kind: 'heal', sprite: 'lass', name: 'Nurse Joy', text: 'Để tôi chăm sóc Pokémon của bạn nhé!' },
      { x: 13, y: 4, kind: 'shop', sprite: 'youngster', name: 'Poké Mart', text: 'Chào mừng! Bạn cần mua gì?' },
      { x: 9, y: 9, kind: 'gym', sprite: 'brock', name: 'Gym Đá', trainerId: 'gym_brock', text: 'Phòng Gym hệ Đá. Sẵn sàng thách đấu chưa?' },
      { x: 3, y: 11, kind: 'talk', sprite: 'oak', name: 'Professor Oak', text: 'Cỏ cao là nơi Pokémon hoang trú ngụ. Hãy cẩn thận!' },
    ],
  },

  route_1: {
    name: 'Đường Số 1',
    spawn: { x: 10, y: 2 },
    rows: [
      '########....########',
      '#.......--.........#',
      '#..""""..-...""""..#',
      '#..""""..-...""""..#',
      '#........-.........#',
      '#..#.....-......#..#',
      '#..#..""""""....#..#',
      '#.....""""""-......#',
      '#..,.........-..,..#',
      '#..."""".....-.....#',
      '#...""""..#..-..#..#',
      '#............-.....#',
      '#..""""......-.""..#',
      '#..""""......-.""..#',
      '#............-.....#',
      '####....########....',
    ],
    warps: [
      { x: 4, y: 15, to: 'town_1', tx: 9, ty: 14 },
      { x: 5, y: 15, to: 'town_1', tx: 9, ty: 14 },
      { x: 16, y: 15, to: 'route_2', tx: 3, ty: 2 },
      { x: 17, y: 15, to: 'route_2', tx: 3, ty: 2 },
      { x: 0, y: 7, to: 'forest_1', tx: 18, ty: 8 },
    ],
    npcs: [
      { x: 14, y: 6, kind: 'trainer', sprite: 'youngster', name: 'Youngster Joey', trainerId: 'youngster_joey', text: 'Đấu một trận nhé!' },
      { x: 6, y: 12, kind: 'trainer', sprite: 'lass', name: 'Lass Nina', trainerId: 'lass_nina', text: 'Pokémon của tớ dễ thương mà mạnh lắm!' },
    ],
  },

  route_2: {
    name: 'Đường Số 2',
    spawn: { x: 3, y: 2 },
    rows: [
      '####....############',
      '#...--..............',
      '#..---..""""""".....',
      '#....-..""""""".....',
      '#....-..............',
      '#....--------.....#.',
      '#...........-...ooo.',
      '#..""""""...-...ooo.',
      '#..""""""...-.......',
      '#...........-.......',
      '#..#........-....##.',
      '#..#..,,....------..',
      '#........."""""""..#',
      '#........."""""""..#',
      '#..................#',
      '########....########',
    ],
    warps: [
      { x: 4, y: 0, to: 'route_1', tx: 16, ty: 14 },
      { x: 5, y: 0, to: 'route_1', tx: 16, ty: 14 },
      { x: 19, y: 1, to: 'cave_1', tx: 2, ty: 8 },
      { x: 8, y: 15, to: 'lake_1', tx: 10, ty: 1 },
      { x: 9, y: 15, to: 'lake_1', tx: 10, ty: 1 },
    ],
    npcs: [
      { x: 15, y: 8, kind: 'trainer', sprite: 'camper', name: 'Camper Ethan', trainerId: 'camper_ethan', text: 'Đường này ta canh giữ!' },
    ],
  },

  forest_1: {
    name: 'Rừng Xanh Thẳm',
    spawn: { x: 18, y: 8 },
    rows: [
      '####################',
      '#ffff####ffff###ff.#',
      '#ffff#....fff#..ff..',
      '#....#.ff.....#.....',
      '#.####.ff.###.#.###.',
      '#.#..#....#f#.#...#.',
      '#.#ff#.##.#f#.###.#.',
      '#.#ff#.##.....#...#.',
      '#.#..........#..#...',
      '#.###.####.#.#..#.#.',
      '#.....#ff#.#.#..#.#.',
      '#.#####ff#.#.####.#.',
      '#.#....ff#.#......#.',
      '#.#.####.#.########.',
      '#...#fff.#..........',
      '####################',
    ],
    warps: [{ x: 19, y: 8, to: 'route_1', tx: 1, ty: 7 }],
    npcs: [
      { x: 7, y: 10, kind: 'trainer', sprite: 'bug_catcher', name: 'Bug Catcher Rick', trainerId: 'bug_catcher_rick', text: 'Bọ là nhất!' },
      { x: 3, y: 3, kind: 'talk', sprite: 'rocket_m', name: 'Rocket Grunt', text: 'Cút khỏi đây, nhóc!' },
    ],
  },

  cave_1: {
    name: 'Hang Dơi Đá',
    spawn: { x: 2, y: 8 },
    rows: [
      'CCCCCCCCCCCCCCCCCCCC',
      'CccccCCCCcccccCCCCcC',
      'CcCCcCCCCcCCCcCCCCcC',
      'CcCCccccccCCCcccccCC',
      'CcCCCCCCCcCCCCCCCcCC',
      'CccccccCCcccCCCCCcCC',
      'CCCCCCcCCCCcCCCCCcCC',
      'CcccccccccccccccccCC',
      'ccCCCCCCCCCCCCCCcCCC',
      'CcCCCcccccCCCCCcccCC',
      'CcCCCcCCCcCCCCCCCcCC',
      'CcccccCCCccccccCCcCC',
      'CCCCCCCCCCCCCCcCCcCC',
      'CccccccccccCCCcccccC',
      'CCCCCCCCCCcCCCCCCCCC',
      'CCCCCCCCCCCCCCCCCCCC',
    ],
    warps: [{ x: 1, y: 8, to: 'route_2', tx: 18, ty: 1 }],
    npcs: [
      { x: 16, y: 11, kind: 'trainer', sprite: 'rocket_f', name: 'Rocket Duo', trainerId: 'rocket_2', text: 'Bọn ta đang bận đào đá quý!' },
    ],
  },

  lake_1: {
    name: 'Hồ Gương Trời',
    spawn: { x: 10, y: 2 },
    rows: [
      '#########....#######',
      '#.....,....--......#',
      '#..sssssssssssss...#',
      '#..s~~~~~~~~~~~s...#',
      '#..s~~~~~~~~~~~s...#',
      '#..s~~~~~~~~~~~s...#',
      '#..s~~~~~~~~~~~ss..#',
      '#..s~~~~~~~~~~~~s..#',
      '#..ss~~~~~~~~~~~s..#',
      '#...ss~~~~~~~~ss...#',
      '#....sssssssss.....#',
      '#..""".......""""..#',
      '#..""".RRRR..""""..#',
      '#......WWDW........#',
      '#..................#',
      '####################',
    ],
    warps: [
      { x: 9, y: 0, to: 'route_2', tx: 8, ty: 14 },
      { x: 10, y: 0, to: 'route_2', tx: 8, ty: 14 },
    ],
    npcs: [
      { x: 9, y: 13, kind: 'gym', sprite: 'misty', name: 'Gym Nước', trainerId: 'gym_thuy', text: 'Sóng lớn sắp cuốn cậu đi đấy!' },
      { x: 15, y: 11, kind: 'talk', sprite: 'swimmer_f', name: 'Swimmer', text: 'Nghe nói có Gyarados khổng lồ dưới hồ này...' },
    ],
  },
};

// Tra ô theo tọa độ. Ngoài biên coi như tường.
export function tileAt(map, x, y) {
  const row = map.rows[y];
  if (!row || x < 0 || x >= row.length) return { t: 4, solid: true };
  return TILE_LEGEND[row[x]] || { t: 0 };
}

export const mapWidth = (map) => Math.max(...map.rows.map(r => r.length));
export const mapHeight = (map) => map.rows.length;
