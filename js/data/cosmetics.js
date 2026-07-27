// TuxeWorld H5 | data/cosmetics.js | Thời trang: danh hiệu, khung avatar, khung chat, skin
//
// Đồ thời trang KHÔNG cộng chỉ số — mặc vào chỉ để đẹp và để người khác thấy.
// Danh hiệu mặc vào sẽ hiện ngay trên đầu nhân vật khi đi trên bản đồ, hiện
// cạnh tên trong khung chat và trên thẻ hồ sơ.

// Cách mở khoá: how = 'start' có sẵn | 'badge' đủ huy hiệu | 'catch' bắt đủ số
//               'win' thắng đủ trận | 'level' đủ cấp huấn luyện viên
export const TITLES = {
  rookie:   { name: 'Tân Binh',        color: '#9aa0c3', how: 'start' },
  explorer: { name: 'Kẻ Lữ Hành',      color: '#4dabf7', how: 'catch', n: 10 },
  hunter:   { name: 'Thợ Săn',         color: '#20c997', how: 'catch', n: 40 },
  scholar:  { name: 'Nhà Nghiên Cứu',  color: '#b197fc', how: 'catch', n: 100 },
  brawler:  { name: 'Tay Đấm',         color: '#fa5252', how: 'win',   n: 20 },
  veteran:  { name: 'Lão Làng',        color: '#ff922b', how: 'win',   n: 100 },
  badged:   { name: 'Chủ Huy Hiệu',    color: '#f0b429', how: 'badge', n: 2 },
  master:   { name: 'Bậc Thầy',        color: '#ffd43b', how: 'level', n: 30 },
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

// Khung bong bóng chat
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

// Đủ điều kiện mở khoá chưa? p = G.p, lv = cấp huấn luyện viên
export function unlocked(def, p, lv) {
  if (!def || def.how === 'start') return true;
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
  }[def.how] || '';
}

export const titleOf = (id) => TITLES[id] || null;
