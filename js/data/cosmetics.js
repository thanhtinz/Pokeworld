// TuxeWorld H5 | data/cosmetics.js | Thời trang: danh hiệu, khung avatar, khung chat, skin
//
// Đồ thời trang KHÔNG cộng chỉ số — mặc vào chỉ để đẹp và để người khác thấy.
// Danh hiệu mặc vào sẽ hiện ngay trên đầu nhân vật khi đi trên bản đồ, hiện
// cạnh tên trong khung chat và trên thẻ hồ sơ.
//
// Bộ dưới đây là bộ MẶC ĐỊNH đi kèm game. Admin có thể thêm món mới và tải ảnh
// riêng cho từng món trong trang /admin; những món đó được ghép đè vào các bảng
// này khi vào phiên online (xem applyRemote bên dưới) — món nào có ảnh thì giao
// diện dùng ảnh, không có thì vẫn vẽ bằng CSS như cũ.

// Cách mở khoá: how = 'start' có sẵn | 'badge' đủ huy hiệu | 'catch' bắt đủ số
//               'win' thắng đủ trận | 'level' đủ cấp huấn luyện viên
//               'manual' không tự mở được — phải được quản trị viên trao tay
export const TITLES = {
  rookie:   { name: 'Tân Binh',        color: '#9aa0c3', how: 'start' },
  explorer: { name: 'Kẻ Lữ Hành',      color: '#4dabf7', how: 'catch', n: 10 },
  hunter:   { name: 'Thợ Săn',         color: '#20c997', how: 'catch', n: 40 },
  scholar:  { name: 'Nhà Nghiên Cứu',  color: '#b197fc', how: 'catch', n: 100 },
  brawler:  { name: 'Tay Đấm',         color: '#fa5252', how: 'win',   n: 20 },
  veteran:  { name: 'Lão Làng',        color: '#ff922b', how: 'win',   n: 100 },
  badged:   { name: 'Chủ Huy Hiệu',    color: '#f0b429', how: 'badge', n: 2 },
  master:   { name: 'Bậc Thầy',        color: '#ffd43b', how: 'level', n: 30 },
  // Không có điều kiện nào tự đạt được — quản trị viên trao tay trong trang admin
  founder:  { name: 'Khai Quốc',       color: '#ffe066', how: 'manual' },
  champion: { name: 'Nhà Vô Địch',     color: '#ff6b6b', how: 'manual' },
  friend:   { name: 'Bạn Của Nhà Phát Triển', color: '#66d9e8', how: 'manual' },
};

// Khung ảnh đại diện — vẽ bằng CSS nên không tốn ảnh nào
export const AVATAR_FRAMES = {
  none:   { name: 'Không khung', css: null,      how: 'start' },
  bronze: { name: 'Viền Đồng',   css: 'bronze',  how: 'level', n: 5 },
  silver: { name: 'Viền Bạc',    css: 'silver',  how: 'level', n: 15 },
  gold:   { name: 'Viền Vàng',   css: 'gold',    how: 'level', n: 25 },
  neon:   { name: 'Viền Neon',   css: 'neon',    how: 'win',   n: 50 },
  flame:  { name: 'Viền Lửa',    css: 'flame',   how: 'badge', n: 2 },
};

export const CHAT_FRAMES = {
  none:   { name: 'Bình thường', css: null,     how: 'start' },
  cloud:  { name: 'Mây Trắng',   css: 'cloud',  how: 'catch', n: 20 },
  leaf:   { name: 'Lá Xanh',     css: 'leaf',   how: 'catch', n: 60 },
  ember:  { name: 'Than Hồng',   css: 'ember',  how: 'win',   n: 30 },
  royal:  { name: 'Hoàng Gia',   css: 'royal',  how: 'badge', n: 2 },
};

// Skin nhân vật — mới có bộ mặc định, các bộ khác bổ sung sau
export const SKINS = {
  default: { name: 'Trang phục gốc', how: 'start' },
};

export const COSMETIC_KINDS = [
  { id: 'title',       name: 'Danh hiệu',    icon: 'flag',   data: TITLES },
  { id: 'avatarFrame', name: 'Khung avatar', icon: 'person', data: AVATAR_FRAMES },
  { id: 'chatFrame',   name: 'Khung chat',   icon: 'chat',   data: CHAT_FRAMES },
];

const TABLES = { title: TITLES, avatarFrame: AVATAR_FRAMES, chatFrame: CHAT_FRAMES, skin: SKINS };

// Gắn sẵn kind + id vào từng món để chỗ nào cầm def cũng biết nó là món gì.
function stamp() {
  for (const [kind, table] of Object.entries(TABLES)) {
    for (const [id, def] of Object.entries(table)) {
      def.kind = kind;
      def.id = id;
      def.key = `${kind}:${id}`;
    }
  }
}
stamp();

// ==== Món admin thêm / ảnh admin tải lên ====
// gốc = địa chỉ máy chủ, vì ảnh nằm trên máy chủ chứ không nằm trong thư mục game
let assetBase = '';
const remoteKeys = new Set();

// items = mảng { kind, id, name, color, css, how, n, img } lấy từ GET /api/cosmetics
export function applyRemote(items, base = '') {
  assetBase = String(base || '').replace(/\/+$/, '');
  // Bỏ các món của lần tải trước không còn nữa (admin đã xoá)
  const keep = new Set((items || []).map(it => `${it.kind}:${it.id}`));
  for (const key of [...remoteKeys]) {
    if (keep.has(key)) continue;
    const [kind, id] = key.split(':');
    delete TABLES[kind]?.[id];
    remoteKeys.delete(key);
  }
  for (const it of items || []) {
    const table = TABLES[it.kind];
    if (!table || !it.id) continue;
    const cur = table[it.id];
    if (cur) {
      // Món có sẵn trong game: chỉ nhận thêm ảnh, giữ nguyên tên/điều kiện gốc
      cur.img = it.img || null;
    } else {
      table[it.id] = {
        name: it.name, color: it.color, css: it.css || null,
        how: it.how, n: it.n || 0, img: it.img || null,
      };
      remoteKeys.add(`${it.kind}:${it.id}`);
    }
  }
  stamp();
}

export function imgOf(def) {
  if (!def?.img) return null;
  return /^https?:\/\//.test(def.img) ? def.img : assetBase + def.img;
}

// ==== Món được trao tay ====
// Danh sách khoá "kind:id" máy chủ đã trao cho người chơi này.
let granted = new Set();

export function setGrants(list) {
  granted = new Set(Array.isArray(list) ? list : []);
}
export const grantList = () => [...granted];
export const hasGrant = (def) => !!def?.key && granted.has(def.key);

// Đủ điều kiện mở khoá chưa? p = G.p, lv = cấp huấn luyện viên
export function unlocked(def, p, lv) {
  if (!def) return false;
  // Được trao tay thì mở, bất kể điều kiện gốc là gì
  if (hasGrant(def) || p?.granted?.includes(def.key)) return true;
  if (def.how === 'start') return true;
  if (def.how === 'manual') return false;
  const n = def.n || 0;
  if (def.how === 'catch') return (p?.stats?.catches || 0) >= n;
  if (def.how === 'win') return (p?.stats?.wins || 0) >= n;
  if (def.how === 'badge') return (p?.badges?.length || 0) >= n;
  if (def.how === 'level') return (lv || 1) >= n;
  return false;
}

// Câu mô tả điều kiện, hiện ở ô còn khoá
export function requirement(def) {
  if (!def || def.how === 'start') return 'Có sẵn từ đầu';
  const n = def.n || 0;
  return {
    catch: `Bắt đủ ${n} sinh vật`,
    win: `Thắng ${n} trận`,
    badge: `Có ${n} huy hiệu`,
    level: `Trainer Lv.${n}`,
    manual: 'Quản trị viên trao tay',
  }[def.how] || '';
}

export const titleOf = (id) => TITLES[id] || null;
