// PokeWorld H5 | util.js | Tiện ích chung: RNG, clamp, sprite, escape HTML

export const rng = {
  int(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
  float() { return Math.random(); },
  roll(p) { return Math.random() < p; },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  // list phần tử có trường w (trọng số) -> trả về phần tử được chọn
  weighted(list) {
    const total = list.reduce((s, e) => s + (e.w || 1), 0);
    let roll = Math.random() * total;
    for (const e of list) { roll -= (e.w || 1); if (roll <= 0) return e; }
    return list[list.length - 1];
  },
};

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Escape HTML khi chèn chuỗi người dùng nhập (nickname...)
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Sprite Pokémon từ PokeAPI (CDN công khai). back = sprite nhìn từ sau lưng.
export const spriteUrl = (dexId, back = false) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${back ? 'back/' : ''}${dexId}.png`;

export const spriteShinyUrl = (dexId, back = false) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${back ? 'back/' : ''}${dexId}.png`;

// Sprite theo mon instance (tự chọn shiny)
export const monSprite = (mon, back = false) =>
  mon.shiny ? spriteShinyUrl(mon.sp, back) : spriteUrl(mon.sp, back);

export const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');

// Ngày dạng số yyyymmdd (cho daily)
export const todayNum = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};
export const dayNum = () => Math.floor(Date.now() / 86400000);
