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
    spawn: { x: 15, y: 22 },
    rows: [
      '################################',
      '#..............................#',
      '#..............................#',
      '#..........,.........,.........#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..--------------------------..#',
      '#.......-.........-............#',
      '#.......-.........-............#',
      '#....,..-.........-.........,..#',
      '#.......-.........-............#',
      '#.......-.........-............#',
      '#.......-.........-............#',
      '#.......-.........-............#',
      '#.......-.........-............#',
      '#.......-.........-............#',
      '#..--------------------------..#',
      '#........ssssBs--..............#',
      '#."""""..s~~~~s--........""""".#',
      '#."""""..s~~~~s--........""""".#',
      '#."""""..s~~~~s--........""""".#',
      '#."""""..ssssss--...,....""""".#',
      '###############--###############',
    ],
    buildings: [
      { b: 'center', x: 4, y: 4, kind: 'enter', name: 'Pokémon Center', text: 'Cửa tự động mở ra.' },
      { b: 'mart', x: 12, y: 5, kind: 'enter', name: 'Poké Mart', text: 'Cửa tự động mở ra.' },
      { b: 'house', x: 18, y: 4, kind: 'talk', name: 'Neighbor\'s House', text: 'Cửa khoá rồi.' },
      { b: 'house2', x: 24, y: 4, kind: 'talk', name: 'Old House', text: 'Bên trong tối om.' },
      { b: 'house', x: 3, y: 14, kind: 'home', name: 'Your House', text: 'Nhà của bạn. Ấm áp thật.' },
      { b: 'lab', x: 10, y: 14, kind: 'lab', name: 'Professor Oak\'s Lab', text: 'Phòng nghiên cứu của Giáo sư Oak.' },
      { b: 'house2', x: 20, y: 14, kind: 'talk', name: 'Rival\'s House', text: 'Nhà của Blue.' },
      { b: 'gym', x: 26, y: 14, kind: 'gym', name: 'Rock Gym', text: 'Phòng Gym hệ Đá. Sẵn sàng thách đấu chưa?', trainerId: 'gym_brock' },
    ],
    warps: [
      { x: 15, y: 25, to: 'route_1', tx: 8, ty: 1 },
      { x: 16, y: 25, to: 'route_1', tx: 8, ty: 1 },
      { x: 6, y: 8, to: 'pc_town', tx: 6, ty: 8 },
      { x: 13, y: 8, to: 'mart_town', tx: 3, ty: 7 },
    ],
    npcs: [
      { x: 14, y: 20, kind: 'talk', sprite: 'juan', name: 'Professor Oak', text: 'Cỏ cao là nơi Pokémon hoang trú ngụ. Hãy cẩn thận!', face: 'oak' },
      { x: 5, y: 20, kind: 'talk', sprite: 'roxanne', name: 'Daisy', text: 'Anh trai tớ đang ở trong phòng nghiên cứu đấy.', face: 'lass' },
      { x: 24, y: 10, kind: 'talk', sprite: 'liza', name: 'Boy', text: 'Poké Mart mới nhập Poké Ball đó!', face: 'youngster' },
      { x: 10, y: 10, kind: 'talk', sprite: 'wattson', name: 'Old Man', text: 'Hồi trẻ ta từng leo hết Lối Mòn Cát!', face: 'hiker' },
      { x: 28, y: 20, kind: 'talk', sprite: 'tate', name: 'Kid', text: 'Phòng Gym hệ Đá khó lắm, cẩn thận nhé!', face: 'youngster' },
    ],
  },
  route_1: {
    name: 'Đường Số 1',
    spawn: { x: 8, y: 2 },
    rows: [
      '########-###############################',
      '#.......-..............................#',
      '#.......-..."""""""""..................#',
      '#.""""".-..."""""""""...""""""""...###.#',
      '#.""""".-..."""""""""...""""""""...###.#',
      '#.""""".-..."""""""""...""""""""...###.#',
      '#.""""".-..."""""""""...""""""""...###.#',
      '#.""""".-..."""""""""..."""""""".......#',
      '#.""""".-..."""""""""...""""""""...o...#',
      '#.......-..............................#',
      '#.......-.,............................#',
      '#...o...-B............o....,...........#',
      '---###--------------------------.......#',
      '#..###.........................-.......#',
      '#..............................-.......#',
      '#."""""......""""""""..."""""".-..,....#',
      '#."""""......""""""""..."""""".-.......#',
      '#."""""......""""""""..."""""".-.......#',
      '#."""""......""""""""..."""""".-.......#',
      '#."""""......""""""""..........-.......#',
      '#..............................-...o...#',
      '#.........----------------------.......#',
      '#.........-............................#',
      '#.....o...-............."""""""........#',
      '#.........-..""""""""..."""""""........#',
      '#.........-..""""""""..."""""""........#',
      '#.........-.."""""""".####""""".....o..#',
      '#....,....-.."""""""".####"""""........#',
      '#.........-............................#',
      '##########-#############################',
    ],
    buildings: [
    ],
    warps: [
      { x: 8, y: 0, to: 'town_1', tx: 15, ty: 24 },
      { x: 10, y: 29, to: 'route_2', tx: 6, ty: 1 },
      { x: 0, y: 12, to: 'forest_1', tx: 33, ty: 14 },
    ],
    npcs: [
      { x: 17, y: 11, kind: 'trainer', sprite: 'tate', name: 'Youngster Joey', text: 'Pokémon của tớ mạnh lắm đấy!', face: 'youngster', trainerId: 'youngster_joey' },
      { x: 11, y: 20, kind: 'trainer', sprite: 'flannery', name: 'Lass Nina', text: 'Dễ thương nhưng không hiền đâu nhé!', face: 'lass', trainerId: 'lass_nina' },
      { x: 28, y: 12, kind: 'trainer', sprite: 'brawly', name: 'Bug Catcher Rick', text: 'Bọ là nhất!', face: 'bug_catcher', trainerId: 'bug_catcher_rick' },
      { x: 33, y: 21, kind: 'talk', sprite: 'norman', name: 'Hiker', text: 'Đi thẳng xuống nam là tới Đường Số 2.', face: 'gentleman' },
    ],
  },
  route_2: {
    name: 'Đường Số 2',
    spawn: { x: 6, y: 2 },
    rows: [
      '######-#################################',
      '#.....-................................#',
      '#.""""-.."""""""""...."""""""".........#',
      '#.""""-.."""""""""....""""""""...ooooo.#',
      '#.""""-.."""""""""....""""""""...ooooo.#',
      '#.""""-.."""""""""....""""""""...ooooo.#',
      '#.""""-.."""""""""....""""""""...ooooo.#',
      '#.""""-.."""""""""....""""""""...ooooo.#',
      '#.....-................................#',
      '#.....----------------------------------',
      '#...,...............o..........-.......#',
      '#.......o...................,..-.......#',
      '#."""""".......""""""""........-.......#',
      '#."""""".......""""""""..""""".-..oooo.#',
      '#."""""".......""""""""..""""".-..oooo.#',
      '#."""""".......""""""""..""""".-..oooo.#',
      '#."""""".......""""""""..""""".-..oooo.#',
      '#."""""".......""""""""..""""".-.......#',
      '#..............................-.......#',
      '#.........o....................-.......#',
      '#.###.......--------------------...###.#',
      '#.###.......-...........o..........###.#',
      '#.###.......-......,.....""""""........#',
      '#...........-."""""""""..""""""........#',
      '#...........-."""""""""..""""""........#',
      '#...........-."""""""""..""""""..,.....#',
      '#....o......-."""""""""..""""""......o.#',
      '#...........-."""""""""..""""""........#',
      '#...........-..........................#',
      '############-###########################',
    ],
    buildings: [
    ],
    warps: [
      { x: 6, y: 0, to: 'route_1', tx: 10, ty: 28 },
      { x: 39, y: 9, to: 'cave_1', tx: 1, ty: 11 },
      { x: 12, y: 29, to: 'lake_1', tx: 17, ty: 1 },
    ],
    npcs: [
      { x: 21, y: 10, kind: 'trainer', sprite: 'sidney', name: 'Camper Ethan', text: 'Đường này ta canh giữ!', face: 'camper_f', trainerId: 'camper_ethan' },
      { x: 13, y: 19, kind: 'trainer', sprite: 'wallace', name: 'Rocket Duo', text: 'Bọn ta đang bận đào đá quý!', face: 'rocket_f', trainerId: 'rocket_2' },
      { x: 28, y: 9, kind: 'talk', sprite: 'phoebe', name: 'Bug Catcher', text: 'Trong rừng phía tây nhiều bọ lắm!', face: 'school_kid' },
      { x: 14, y: 27, kind: 'talk', sprite: 'glacia', name: 'Lady', text: 'Hồ Gương Trời ngay dưới kia, đẹp lắm!', face: 'beauty' },
    ],
  },
  forest_1: {
    name: 'Rừng Xanh Thẳm',
    spawn: { x: 33, y: 14 },
    rows: [
      '####################################',
      '####################################',
      '####################################',
      '####################################',
      '######...""""""""""""...############',
      '######...""""""""""""...############',
      '######...""""""""""""...############',
      '######...############...############',
      '######.,.###""""""""....############',
      '######...###""""""""....############',
      '######...###""""""""....############',
      '######...###...######...############',
      '######...###...######...############',
      '######..."""""""""..................',
      '######..."""""""""..........o.......',
      '######...""""""""".o................',
      '######...######...#######...########',
      '######...######...#######...########',
      '######...######."""""""""...########',
      '######...######."""""""""...########',
      '######.o.######."""""""""...########',
      '######...################...########',
      '######...################.o.########',
      '######...################...########',
      '######........."""""""""""".########',
      '######.........""""""""""",.########',
      '######.......,."""""""""""".########',
      '####################################',
      '####################################',
      '####################################',
    ],
    buildings: [
    ],
    warps: [
      { x: 35, y: 13, to: 'route_1', tx: 1, ty: 12 },
      { x: 35, y: 14, to: 'route_1', tx: 1, ty: 12 },
      { x: 35, y: 15, to: 'route_1', tx: 1, ty: 12 },
    ],
    npcs: [
      { x: 17, y: 25, kind: 'trainer', sprite: 'brawly', name: 'Bug Catcher Rick', text: 'Bọ là nhất!', face: 'bug_catcher', trainerId: 'bug_catcher_rick' },
      { x: 13, y: 5, kind: 'talk', sprite: 'steven', name: 'Rocket Grunt', text: 'Cút khỏi đây, nhóc!', face: 'rocket_m' },
      { x: 23, y: 19, kind: 'talk', sprite: 'drake', name: 'Woodsman', text: 'Rừng này dễ lạc lắm, cứ men theo lối mòn.', face: 'sailor' },
    ],
  },
  cave_1: {
    name: 'Lối Mòn Cát',
    spawn: { x: 1, y: 11 },
    rows: [
      '##################################',
      '##################################',
      '##################################',
      '##################################',
      '######ssssssssssssssss############',
      '######ssssssosssssssss############',
      '######ssosssssssosssss############',
      '######ssssssssssssssss############',
      '######ssss########sssssssssssssss#',
      '######ssss########sssssssssssssss#',
      'ssssssssss########ssssssssssssoss#',
      'ssssssssss########ssossssssssssss#',
      'sssssssssssssss###ssss##ssss######',
      'sssssssssssssss###ssss##ssss######',
      '##########sssss###ssss##ssos######',
      '##########sssss###ssss##ssss######',
      '##########ssssssssssssssssss######',
      '##########ssssssssssssssssss######',
      '##########ssosssssssssssssss######',
      '##########ssssssssssssssssss######',
      '##############ssssssssssssss######',
      '##############sssssssssossss######',
      '##############sssossssssssss######',
      '##############ssssssssssssss######',
      '##################################',
      '##################################',
    ],
    buildings: [
    ],
    warps: [
      { x: 0, y: 11, to: 'route_2', tx: 38, ty: 9 },
      { x: 0, y: 12, to: 'route_2', tx: 38, ty: 9 },
    ],
    npcs: [
      { x: 26, y: 21, kind: 'trainer', sprite: 'wallace', name: 'Rocket Duo', text: 'Bọn ta đang bận đào đá quý!', face: 'rocket_f', trainerId: 'rocket_2' },
      { x: 13, y: 17, kind: 'talk', sprite: 'wattson', name: 'Hiker', text: 'Lối mòn này gió lớn, cẩn thận đấy!', face: 'hiker' },
      { x: 30, y: 9, kind: 'talk', sprite: 'roxanne', name: 'Geologist', text: 'Đá ở đây toàn loại quý đấy!', face: 'lass' },
    ],
  },
  lake_1: {
    name: 'Hồ Gương Trời',
    spawn: { x: 17, y: 2 },
    rows: [
      '#################-##################',
      '#................-.................#',
      '#................-.................#',
      '#..,.............-...............,.#',
      '#...sssssssssssss-ssssssssssssss...#',
      '#...ssssssssssssssssssssssssssss...#',
      '#...sss~~~~~~~~~~~~~~~~~~~~~~sss...#',
      '#...sss~~~~~~~~~~~~~~~~~~~~~~sss...#',
      '#...sss~~~~~WWWWWWWWWWWW~~~~~sss...#',
      '#...sss~~~~~WWWWWWWWWWWW~~~~~sss...#',
      '#...sss~~~~~WWWWWWWWWWWW~~~~~sss...#',
      '#...sss~~~~~WWWWWWWWWWWW~~~~~sss...#',
      '#...sss~~~~~WWWWWWWWWWWW~~~~~sss...#',
      '#...sss~~~~~~~~~~~~~~~~~~~~~~sss...#',
      '#...sss~~~~~~~~~~~~~~~~~~~~~~sss...#',
      '#...ssssssssssssssssssssssssssss...#',
      '#...ssssssssssssssssssssssssssss...#',
      '#................-.................#',
      '#................-.................#',
      '#....,...........-.............,...#',
      '#..B.............-.................#',
      '#..------------------------------..#',
      '#..................................#',
      '#..................................#',
      '#.""""""...................."""""".#',
      '#.""""""...................."""""".#',
      '#.""""""...................."""""".#',
      '####################################',
    ],
    buildings: [
      { b: 'gym', x: 8, y: 16, kind: 'gym', name: 'Cerulean Gym', text: 'Phòng Gym hệ Nước. Sẵn sàng chưa?', trainerId: 'gym_thuy' },
      { b: 'center', x: 21, y: 16, kind: 'enter', name: 'Pokémon Center', text: 'Cửa tự động mở ra.' },
      { b: 'house', x: 28, y: 16, kind: 'talk', name: 'Fisherman Hut', text: 'Mùi cá nồng nặc.' },
    ],
    warps: [
      { x: 17, y: 0, to: 'route_2', tx: 12, ty: 28 },
      { x: 23, y: 20, to: 'pc_lake', tx: 6, ty: 8 },
    ],
    npcs: [
      { x: 33, y: 12, kind: 'talk', sprite: 'winona', name: 'Swimmer', text: 'Nghe nói có Gyarados khổng lồ dưới hồ này...', face: 'swimmer_f' },
      { x: 6, y: 24, kind: 'trainer', sprite: 'sidney', name: 'Camper Ethan', text: 'Đường này ta canh giữ!', face: 'camper_f', trainerId: 'camper_ethan' },
      { x: 14, y: 22, kind: 'talk', sprite: 'liza', name: 'Girl', text: 'Trung tâm Pokémon ngay bên phải đó!', face: 'youngster' },
    ],
  },
  pc_town: {
    name: 'Trung Tâm Pokémon',
    image: 'assets/interiors/pokecenter.png',
    spawn: { x: 6, y: 8 },
    rows: [
      '##############',
      '##############',
      '##############',
      '##############',
      '#............#',
      '##...........#',
      '##........####',
      '##........####',
      '######..######',
    ],
    buildings: [
    ],
    spots: [
      { x: 6, y: 3, kind: 'heal', name: 'Nurse Joy', text: 'Chào mừng tới Trung tâm Pokémon! Để tôi chăm sóc đội của bạn nhé.', sprite: 'nurse_joy', face: 'nurse' },
      { x: 9, y: 3, kind: 'pc', name: 'PC', text: 'Máy gửi Pokémon. Mở hộp chứa nhé?' },
    ],
    warps: [
      { x: 6, y: 8, to: 'town_1', tx: 6, ty: 9 },
      { x: 7, y: 8, to: 'town_1', tx: 6, ty: 9 },
    ],
    npcs: [
      { x: 6, y: 2, kind: 'deco', sprite: 'nurse_joy', name: 'Nurse Joy', text: '', face: 'nurse' },
    ],
  },
  mart_town: {
    name: 'Poké Mart',
    image: 'assets/interiors/mart.png',
    spawn: { x: 3, y: 7 },
    rows: [
      '###########',
      '###########',
      '###.......#',
      '###.......#',
      '###...##..#',
      '......##..#',
      '......##..#',
      '###..######',
    ],
    buildings: [
    ],
    spots: [
      { x: 2, y: 3, kind: 'shop', name: 'Poké Mart', text: 'Chào mừng! Bạn cần mua gì nào?', sprite: 'mart_clerk', face: 'clerk' },
    ],
    warps: [
      { x: 3, y: 7, to: 'town_1', tx: 13, ty: 9 },
      { x: 4, y: 7, to: 'town_1', tx: 13, ty: 9 },
    ],
    npcs: [
      { x: 1, y: 2, kind: 'deco', sprite: 'mart_clerk', name: 'Clerk', text: '', face: 'clerk' },
    ],
  },
  pc_lake: {
    name: 'Trung Tâm Pokémon',
    image: 'assets/interiors/pokecenter.png',
    spawn: { x: 6, y: 8 },
    rows: [
      '##############',
      '##############',
      '##############',
      '##############',
      '#............#',
      '##...........#',
      '##........####',
      '##........####',
      '######..######',
    ],
    buildings: [
    ],
    spots: [
      { x: 6, y: 3, kind: 'heal', name: 'Nurse Joy', text: 'Chào mừng tới Trung tâm Pokémon! Để tôi chăm sóc đội của bạn nhé.', sprite: 'nurse_joy', face: 'nurse' },
      { x: 9, y: 3, kind: 'pc', name: 'PC', text: 'Máy gửi Pokémon. Mở hộp chứa nhé?' },
    ],
    warps: [
      { x: 6, y: 8, to: 'lake_1', tx: 23, ty: 21 },
      { x: 7, y: 8, to: 'lake_1', tx: 23, ty: 21 },
    ],
    npcs: [
      { x: 6, y: 2, kind: 'deco', sprite: 'nurse_joy', name: 'Nurse Joy', text: '', face: 'nurse' },
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
