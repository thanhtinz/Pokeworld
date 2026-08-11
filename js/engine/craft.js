// TuxeWorld H5 | engine/craft.js | Nấu ăn — port từ Tuxemon
//
// Bản gốc: tuxemon/item/crafting_system.py + mods/recipes.yaml.
// Một công thức tiêu nguyên liệu rồi BỐC THĂM kết quả theo trọng số — cùng một
// công thức có thể ra món ngon hoặc món hỏng, đúng như bản gốc.
//
// Nguyên liệu kiếm ở tiệm tạp hoá hoặc do Tuxemon hoang rơi ra (js/data/drops.js).
import { rng } from '../util.js';
import { G, addItem, removeItem, save } from '../state.js';
import { RECIPES, RECIPE_BY_ID, CACH_LAM } from '../data/recipes.js';
import { ITEMS } from '../data/items.js';

export { RECIPES, RECIPE_BY_ID, CACH_LAM };

// Đang có bao nhiêu nguyên liệu này trong túi
export const dangCo = (id) => (G.p?.bag?.[id] || 0);

// Còn thiếu những gì để làm công thức này
export function conThieu(r) {
  const thieu = [];
  for (const [id, n] of Object.entries(r.ng)) {
    const co = dangCo(id);
    if (co < n) thieu.push({ id, can: n, co });
  }
  return thieu;
}

export const lamDuoc = (r) => conThieu(r).length === 0;

// Số lần làm được liên tiếp với số nguyên liệu đang có
export function soLanLamDuoc(r) {
  let n = Infinity;
  for (const [id, can] of Object.entries(r.ng)) n = Math.min(n, Math.floor(dangCo(id) / can));
  return Number.isFinite(n) ? n : 0;
}

// Bốc kết quả theo trọng số
function bocKetQua(r) {
  const tong = r.out.reduce((a, o) => a + o.w, 0);
  let x = rng.float() * tong;
  for (const o of r.out) { x -= o.w; if (x <= 0) return o; }
  return r.out[r.out.length - 1];
}

// Làm một mẻ. Trả [{ id, n, ten, xin }, lỗi] — xin = có phải kết quả tốt nhất không.
export function cheTao(recipeId) {
  const r = RECIPE_BY_ID[recipeId];
  if (!r) return [null, 'Không có công thức này.'];
  const thieu = conThieu(r);
  if (thieu.length) {
    const ten = thieu.map(t => `${ITEMS[t.id]?.name || t.id} ${t.co}/${t.can}`).join(', ');
    return [null, `Còn thiếu: ${ten}.`];
  }
  for (const [id, n] of Object.entries(r.ng)) removeItem(id, n);
  const o = bocKetQua(r);
  addItem(o.id, o.n);
  save();
  // Kết quả nào có trọng số cao nhất là món "đúng ý"; ra món khác tức là lệch
  const chuan = r.out.reduce((a, b) => (b.w > a.w ? b : a), r.out[0]);
  return [{ id: o.id, n: o.n, ten: ITEMS[o.id]?.name || o.id, xin: o.id === chuan.id }, null];
}

// Tỉ lệ ra từng món, để màn hình bày cho người chơi biết trước
export function tiLe(r) {
  const tong = r.out.reduce((a, o) => a + o.w, 0);
  return r.out.map(o => ({ ...o, pc: Math.round(o.w / tong * 100) }))
    .sort((a, b) => b.w - a.w);
}

// Gom công thức theo cách làm
export function theoCach() {
  const g = {};
  for (const r of RECIPES) (g[r.cach] ||= []).push(r);
  return g;
}
