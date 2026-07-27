// PokeWorld H5 | engine/battlesize.js | Cỡ sprite trong trận đấu
//
// Luật: nhân vật to hơn Pokémon, TRỪ những con đã tiến hoá thì to hơn nhân vật.
// Ngoài ra dùng luôn chiều cao thật (SPECIES[].height, đơn vị mét) để trong
// cùng một nhóm con cao vẫn to hơn con thấp — Caterpie không bằng Bulbasaur.
//
// Có những loài không nằm trong chuỗi tiến hoá nào nhưng vốn đã khổng lồ
// (Onix 8.8m, Lapras 2.5m, Snorlax 2.1m). Ép chúng nhỏ hơn nhân vật thì nhìn
// vô lý, nên coi "to hơn nhân vật" = đã tiến hoá HOẶC cao từ 1.5m trở lên
// (1.5m là chiều cao lấy làm chuẩn cho nhân vật).
import { SPECIES } from '../data/species.js';
import { EVOLUTIONS } from '../data/evolutions.js';

export const TRAINER_PX = 104;                       // bề rộng khung sprite nhân vật
// Chiều cao THÂN NGƯỜI (đã cắt hết khoảng trống quanh sprite) để so trực tiếp
// với bề rộng khung Pokémon: cao hơn con chưa tiến hoá, thấp hơn con đã tiến hoá.
export const TRAINER_SIZE = 'min(96px, 25vw)';
export const TRAINER_HEIGHT_M = 1.5;

const SMALL_MAX = 92;                 // con chưa tiến hoá: không vượt quá mức này
const BIG_MIN = 124;                  // con đã tiến hoá: không nhỏ hơn mức này
const HARD_MAX = 200;

// Tập các loài là ĐÍCH của một lần tiến hoá — tính một lần lúc nạp module
const EVOLVED = new Set(Object.values(EVOLUTIONS).map(e => e.into));

export const isEvolved = (dex) => EVOLVED.has(Number(dex));

export function heightOf(dex) {
  const sp = SPECIES[dex];
  return sp && sp.height ? sp.height : 1;
}

// Con này có được vẽ to hơn nhân vật không?
export function biggerThanTrainer(dex) {
  return isEvolved(dex) || heightOf(dex) >= TRAINER_HEIGHT_M;
}

// Bề rộng khung sprite của một Pokémon, tính bằng px
export function monPx(mon) {
  if (!mon) return SMALL_MAX;
  const dex = mon.sp;
  const h = heightOf(dex);
  // Thang loga: 0.3m -> ~87, 1m -> ~116, 2m -> ~143, 9m -> ~200
  const raw = Math.round(70 + 46 * Math.log2(1 + h));
  const big = biggerThanTrainer(dex);
  // Dạng Mega luôn to hơn dạng thường của chính nó (mega.js đánh dấu bằng megaOf)
  const mega = mon.megaOf ? 1.15 : 1;
  const px = big
    ? Math.max(BIG_MIN, raw)
    : Math.min(SMALL_MAX, raw);
  return Math.round(Math.min(HARD_MAX, px * mega));
}
