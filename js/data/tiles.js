// PokeWorld H5 | data/tiles.js | Bộ tile thật + luật ghép cạnh (autotile) + khối nhà
// Ảnh: assets/tiles/terrain.png — bộ tile Pokémon 16px, cách nhau 1px, 21 cột.
// Nguồn: dorianleveque/Pokemap (assets/Terrain.png). Chỉ số ô tính từ 0.

export const TILESET = {
  src: 'assets/tiles/terrain.png',
  size: 16,       // cạnh một ô, tính bằng pixel trong ảnh
  spacing: 1,     // khoảng cách giữa các ô trong ảnh
  columns: 21,
};

// Mỗi bộ là 9 ô viền + 4 ô "góc lõm" (khi ô này lọt giữa nhưng chéo bị hụt).
// tl t tr / l c r / bl b br, ctl ctr cbl cbr = góc lõm trên-trái, trên-phải, dưới-trái, dưới-phải.
export const AUTOTILES = {
  grass: { tl: 11, t: 12, tr: 13, l: 32, c: 33, r: 34, bl: 53, b: 54, br: 55, ctl: 96, ctr: 95, cbl: 75, cbr: 74 },
  path:  { tl: 66, t: 67, tr: 68, l: 87, c: 88, r: 89, bl: 108, b: 109, br: 110, ctl: 107, ctr: 106, cbl: 86, cbr: 85 },
  sand:  { tl: 71, t: 72, tr: 73, l: 92, c: 93, r: 94, bl: 113, b: 114, br: 115, ctl: 215, ctr: 214, cbl: 194, cbr: 193 },
  water: { tl: 5, t: 6, tr: 7, l: 26, c: 27, r: 28, bl: 47, b: 48, br: 49, ctl: 91, ctr: 90, cbl: 70, cbr: 69 },
  deep:  { tl: 8, t: 9, tr: 10, l: 29, c: 30, r: 31, bl: 50, b: 51, br: 52, ctl: 30, ctr: 30, cbl: 30, cbr: 30 },
  tree:  { tl: 14, t: 35, tr: 36, l: 56, c: 57, r: 77, bl: 78, b: 98, br: 99, ctl: 57, ctr: 57, cbl: 57, cbr: 57 },
};

// Ô lẻ dùng để rải cho bản đồ đỡ đơn điệu
export const DECOR = {
  grass: 33,
  grassPebble: 2,
  flowerRed: 3,
  flowerWhite: 4,
  tallGrass: 20,     // ô 20 vốn trống: lấy đúng bụi cỏ của ô 25 nhưng đổi nền cát thành nền cỏ
  duneGrass: 25,     // bụi cỏ mọc trên cát (dùng ở bãi biển)
  sandDust: 24,
  stump: 116,
  bush: 111,
  shell: 112,
  sign: 43,
  rockWall: 84,     // khối đá xám đặc — dùng làm vách hang, không cần autotile
  ball: 45,
  logL: 165,
  logR: 166,
};

// Khối nhà nhiều ô: vẽ từ ô `start` sang phải `w` ô, xuống dưới `h` ô.
// door: [cột, hàng] trong khối — ô cửa đi vào được, các ô còn lại chắn đường.
export const BUILDINGS = {
  center: { start: 231, w: 5, h: 5, door: [2, 4] },   // Trung tâm Pokémon (mái đỏ, huy hiệu bóng)
  mart:   { start: 147, w: 4, h: 4, door: [1, 3] },   // Poké Mart (biển MART)
  gym:    { start: 236, w: 4, h: 5, door: [1, 4] },   // Nhà kính xanh ngọc — dùng làm Gym
  lab:    { start: 240, w: 7, h: 5, door: [4, 4] },   // Toà nhà lớn có máy móc — phòng nghiên cứu
  house:  { start: 16,  w: 4, h: 5, door: [1, 4] },   // Nhà mái đỏ
  house2: { start: 132, w: 5, h: 5, door: [2, 4] },   // Nhà mái xanh
};

// Toạ độ ô trong ảnh tileset (dùng cho drawImage)
export function tileRect(idx) {
  const { size, spacing, columns } = TILESET;
  const c = idx % columns, r = Math.floor(idx / columns);
  return { sx: c * (size + spacing), sy: r * (size + spacing), sw: size, sh: size };
}

// Chọn ô viền phù hợp dựa trên 8 ô xung quanh
export function pickAuto(set, same, x, y) {
  const u = same(x, y - 1), d = same(x, y + 1), l = same(x - 1, y), r = same(x + 1, y);
  if (!u && !l) return set.tl;
  if (!u && !r) return set.tr;
  if (!d && !l) return set.bl;
  if (!d && !r) return set.br;
  if (!u) return set.t;
  if (!d) return set.b;
  if (!l) return set.l;
  if (!r) return set.r;
  if (!same(x - 1, y - 1)) return set.ctl;
  if (!same(x + 1, y - 1)) return set.ctr;
  if (!same(x - 1, y + 1)) return set.cbl;
  if (!same(x + 1, y + 1)) return set.cbr;
  return set.c;
}
