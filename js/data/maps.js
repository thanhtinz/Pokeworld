// PokeWorld H5 | data/maps.js | Bản đồ đi lại được — TỰ SINH TỪ tools/mkmaps.py, đừng sửa tay
// Ký hiệu ô: . cỏ  , cỏ hoa  " cỏ cao (gặp Pokémon)  - đường đất  s cát
//            ~ nước  W nước sâu  # cây  o đá  B bảng hiệu
import { BUILDINGS } from './tiles.js';

export const TILE_SIZE = 16;

// Ký tự -> loại địa hình. solid: chắn đường. enc: đi vào có thể gặp Pokémon.
export const TERRAIN = {
  '.': { kind: 'grass' },
  ',': { kind: 'grass', decor: 'flower' },
  '"': { kind: 'grass', decor: 'tall', enc: true },
  '-': { kind: 'path' },
  's': { kind: 'sand' },
  '~': { kind: 'water', solid: true },
  'W': { kind: 'deep', solid: true },
  '#': { kind: 'tree', solid: true },
  'o': { kind: 'grass', decor: 'rock', solid: true },
  'B': { kind: 'grass', decor: 'sign', solid: true },
};

export const MAPS = {
  town_1: {
    name: 'Thị Trấn Khởi Đầu',
    spawn: { x: 11, y: 16 },
    rows: [
      '########################',
      '#......................#',
      '#......................#',
      '#..........,...........#',
      '#......................#',
      '#......................#',
      '#......................#',
      '#..------------------..#',
      '#.....-............,...#',
      '#.....-................#',
      '#.....-................#',
      '#.....-................#',
      '#.....-................#',
      '#.....-..............B.#',
      '#.....-................#',
      '#..------------------..#',
      '#.....-............,...#',
      '#.""".-..........""""..#',
      '#.""".-..........""""..#',
      '######-#################',
    ],
    buildings: [
      { b: 'center', x: 3, y: 2, kind: 'heal', name: 'Pokémon Center', text: 'Chào mừng! Để tôi chăm sóc Pokémon cho bạn.' },
      { b: 'mart', x: 15, y: 3, kind: 'shop', name: 'Poké Mart', text: 'Mời vào xem hàng!' },
      { b: 'lab', x: 8, y: 10, kind: 'lab', name: 'Professor Oak\'s Lab', text: 'Phòng nghiên cứu Pokémon của Giáo sư Oak.' },
      { b: 'house', x: 2, y: 10, kind: 'home', name: 'Your House', text: 'Nhà của bạn. Ấm áp thật.' },
      { b: 'house2', x: 17, y: 10, kind: 'talk', name: 'Neighbor\'s House', text: 'Cửa khoá rồi.' },
    ],
    warps: [
      { x: 6, y: 19, to: 'route_1', tx: 6, ty: 1 },
    ],
    npcs: [
      { x: 15, y: 16, kind: 'talk', sprite: 'oak', name: 'Professor Oak', text: 'Cỏ cao là nơi Pokémon hoang trú ngụ. Hãy cẩn thận!' },
      { x: 3, y: 16, kind: 'talk', sprite: 'lass', name: 'Daisy', text: 'Anh trai tớ đang ở trong phòng nghiên cứu đấy.' },
      { x: 19, y: 8, kind: 'talk', sprite: 'youngster', name: 'Boy', text: 'Poké Mart mới nhập Poké Ball đó!' },
    ],
  },
  route_1: {
    name: 'Đường Số 1',
    spawn: { x: 6, y: 2 },
    rows: [
      '######-#################',
      '#.....-.............,..#',
      '#.....-..."""""""......#',
      '#.....-..."""""""......#',
      '#.""""-..."""""""......#',
      '#.""""-..."""""""......#',
      '#.""""-..."""""""..o...#',
      '#.....-................#',
      '#..#..-.....#..........#',
      '#.....-................#',
      '------------------.....#',
      '#................-.....#',
      '#."""""..."""""".-.....#',
      '#."""""..."""""".-.....#',
      '#."""""..."""""".-.....#',
      '#."""""..........-.....#',
      '#.......o........-.....#',
      '#..#.........#...-.....#',
      '#.,..............-.....#',
      '#################-######',
    ],
    buildings: [],
    warps: [
      { x: 6, y: 0, to: 'town_1', tx: 6, ty: 18 },
      { x: 17, y: 19, to: 'route_2', tx: 5, ty: 1 },
      { x: 0, y: 10, to: 'forest_1', tx: 21, ty: 9 },
    ],
    npcs: [
      { x: 12, y: 7, kind: 'trainer', sprite: 'youngster', name: 'Youngster Joey', text: 'Pokémon của tớ mạnh lắm đấy!', trainerId: 'youngster_joey' },
      { x: 8, y: 14, kind: 'trainer', sprite: 'lass', name: 'Lass Nina', text: 'Dễ thương nhưng không hiền đâu nhé!', trainerId: 'lass_nina' },
    ],
  },
  route_2: {
    name: 'Đường Số 2',
    spawn: { x: 5, y: 2 },
    rows: [
      '#####-##################',
      '#....-.................#',
      '#....-...""""""".......#',
      '#....-..."""""""....#..#',
      '#....-.................#',
      '#""".-.................#',
      '#""".-.................#',
      '#....-------------------',
      '#.................-....#',
      '#...."""""""......-....#',
      '#...."""""""......-....#',
      '#...."""""""...,..-....#',
      '#.oo..............-....#',
      '#...........oo....-.#..#',
      '#.................-....#',
      '#...."""""""......-....#',
      '#.#.."""""""......-....#',
      '#.................-....#',
      '#.................-....#',
      '##################-#####',
    ],
    buildings: [],
    warps: [
      { x: 5, y: 0, to: 'route_1', tx: 17, ty: 18 },
      { x: 23, y: 7, to: 'cave_1', tx: 1, ty: 9 },
      { x: 18, y: 19, to: 'lake_1', tx: 11, ty: 1 },
    ],
    npcs: [
      { x: 14, y: 10, kind: 'trainer', sprite: 'camper', name: 'Camper Ethan', text: 'Đường này ta canh giữ!', trainerId: 'camper_ethan' },
      { x: 3, y: 16, kind: 'talk', sprite: 'bug_catcher', name: 'Bug Catcher', text: 'Trong rừng phía tây nhiều bọ lắm!' },
    ],
  },
  forest_1: {
    name: 'Rừng Xanh Thẳm',
    spawn: { x: 21, y: 9 },
    rows: [
      '########################',
      '########################',
      '########################',
      '####..."""""""..########',
      '####..."""""""..########',
      '####..########..########',
      '####,.########..########',
      '####..########..########',
      '####..########..#####...',
      '####..""""""............',
      '####..""""""............',
      '####..###########..#####',
      '####..###########o.#####',
      '####.,###########..#####',
      '####..###########..#####',
      '####...""""""".....#####',
      '####...""""""".....#####',
      '########################',
      '########################',
      '########################',
    ],
    buildings: [],
    warps: [
      { x: 23, y: 9, to: 'route_1', tx: 1, ty: 10 },
      { x: 23, y: 10, to: 'route_1', tx: 1, ty: 10 },
    ],
    npcs: [
      { x: 9, y: 16, kind: 'trainer', sprite: 'bug_catcher', name: 'Bug Catcher Rick', text: 'Bọ là nhất!', trainerId: 'bug_catcher_rick' },
      { x: 10, y: 4, kind: 'talk', sprite: 'rocket_m', name: 'Rocket Grunt', text: 'Cút khỏi đây, nhóc!' },
    ],
  },
  cave_1: {
    name: 'Lối Mòn Cát',
    spawn: { x: 1, y: 9 },
    rows: [
      '########################',
      '########################',
      '########################',
      '#####sssssssssssss######',
      '#####ssssossosssss######',
      '#####sssssssssssss######',
      '#####sos#######sss######',
      '#####sss#######sss######',
      'ssssssss#######sosssoss#',
      'ssssssos#######ssssssss#',
      'ssssssssssssssssss######',
      '########ssssssssss######',
      '########sss####sss######',
      '########ssssssssss######',
      '########sssossosss######',
      '########ssssssssss######',
      '########################',
      '########################',
      '########################',
      '########################',
    ],
    buildings: [],
    warps: [
      { x: 0, y: 9, to: 'route_2', tx: 22, ty: 7 },
    ],
    npcs: [
      { x: 17, y: 14, kind: 'trainer', sprite: 'rocket_f', name: 'Rocket Duo', text: 'Bọn ta đang bận đào đá quý!', trainerId: 'rocket_2' },
      { x: 12, y: 11, kind: 'talk', sprite: 'camper', name: 'Hiker', text: 'Lối mòn này gió lớn, cẩn thận đấy!' },
    ],
  },
  lake_1: {
    name: 'Hồ Gương Trời',
    spawn: { x: 11, y: 2 },
    rows: [
      '###########-############',
      '#..........-...........#',
      '#.,........-...........#',
      '#..sssssssssssssssss...#',
      '#..ss~~~~~~~~~~~~~ss...#',
      '#..ss~~~~~~~~~~~~~ss...#',
      '#..ss~~WWWWWWWWW~~ss...#',
      '#..ss~~WWWWWWWWW~~ss...#',
      '#..ss~~WWWWWWWWW~~ss...#',
      '#..ss~~~~~~~~~~~~~ss...#',
      '#..sssssssssssssssss...#',
      '#..........-...........#',
      '#..........-...........#',
      '#."""".....-......"""".#',
      '#."""".....-......"""".#',
      '#..........-.........,.#',
      '#.B........-...........#',
      '#.--------------------.#',
      '#......................#',
      '########################',
    ],
    buildings: [
      { b: 'gym', x: 5, y: 12, kind: 'gym', name: 'Cerulean Gym', text: 'Phòng Gym hệ Nước. Sẵn sàng chưa?', trainerId: 'gym_thuy' },
      { b: 'center', x: 14, y: 12, kind: 'heal', name: 'Pokémon Center', text: 'Nghỉ ngơi một chút nhé!' },
    ],
    warps: [
      { x: 11, y: 0, to: 'route_2', tx: 18, ty: 18 },
    ],
    npcs: [
      { x: 20, y: 8, kind: 'talk', sprite: 'swimmer_f', name: 'Swimmer', text: 'Nghe nói có Gyarados khổng lồ dưới hồ này...' },
    ],
  },
};

export const mapWidth = (map) => map.rows[0].length;
export const mapHeight = (map) => map.rows.length;

// Tra ký tự địa hình. Ngoài biên coi như cây.
export function charAt(map, x, y) {
  const row = map.rows[y];
  if (!row || x < 0 || x >= row.length) return '#';
  return row[x];
}

export function terrainAt(map, x, y) {
  return TERRAIN[charAt(map, x, y)] || TERRAIN['.'];
}

// Ô cửa của từng toà nhà: { 'x,y': {...building} }
export function doorsOf(map) {
  const out = {};
  for (const b of map.buildings || []) {
    const def = BUILDINGS[b.b];
    if (!def) continue;
    out[`${b.x + def.door[0]},${b.y + def.door[1]}`] = b;
  }
  return out;
}
