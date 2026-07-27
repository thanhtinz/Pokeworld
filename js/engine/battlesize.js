// TuxeWorld H5 | engine/battlesize.js | Cỡ sprite trong trận đấu
//
// Luật: nhân vật to hơn Tuxemon, TRỪ những con đã tiến hoá thì to hơn nhân vật.
// Ngoài ra dùng luôn chiều cao thật (SPECIES[].height, đơn vị mét) để trong
// cùng một nhóm con cao vẫn to hơn con thấp — Caterpie không bằng Bulbasaur.
//
// Có những loài không nằm trong chuỗi tiến hoá nào nhưng vốn đã khổng lồ
// (Onix 8.8m, Lapras 2.5m, Snorlax 2.1m). Ép chúng nhỏ hơn nhân vật thì nhìn
// vô lý, nên coi "to hơn nhân vật" = đã tiến hoá HOẶC cao từ 1.5m trở lên
// (1.5m là chiều cao lấy làm chuẩn cho nhân vật).
import { SPECIES } from '../data/species.js';
import { EVOLVED_INTO } from '../data/evolutions.js';

export const TRAINER_PX = 104;                       // bề rộng khung sprite nhân vật
// Chiều cao THÂN NGƯỜI (đã cắt hết khoảng trống quanh sprite) để so trực tiếp
// với bề rộng khung Tuxemon: cao hơn con chưa tiến hoá, thấp hơn con đã tiến hoá.
export const TRAINER_SIZE = 'min(150px, 38vw)';
export const TRAINER_HEIGHT_M = 1.5;

// Mốc lấy theo cỡ sprite cũ (địch 140 / mình 130) để Tuxemon vẫn to như trước,
// rồi con đã tiến hoá được đẩy lên hẳn một bậc nữa.
const SMALL_MAX = 138;                // con chưa tiến hoá: cỡ như cũ
const BIG_MIN = 176;                  // con đã tiến hoá: to hơn hẳn
const HARD_MAX = 250;

export const isEvolved = (dex) => EVOLVED_INTO.has(Number(dex));

export function heightOf(dex) {
  const sp = SPECIES[dex];
  return sp && sp.height ? sp.height : 1;
}

// Con này có được vẽ to hơn nhân vật không?
export function biggerThanTrainer(dex) {
  return isEvolved(dex) || heightOf(dex) >= TRAINER_HEIGHT_M;
}

// Bề rộng khung sprite của một Tuxemon, tính bằng px
export function monPx(mon) {
  if (!mon) return SMALL_MAX;
  const dex = mon.sp;
  const h = heightOf(dex);
  // Thang loga: 0.3m -> ~127, 1m -> ~152, 2m -> ~183, 9m -> ~273
  const raw = Math.round(100 + 52 * Math.log2(1 + h));
  const big = biggerThanTrainer(dex);

  const px = big
    ? Math.max(BIG_MIN, raw)
    : Math.min(SMALL_MAX, raw);
  return Math.round(Math.min(HARD_MAX, px));
}
