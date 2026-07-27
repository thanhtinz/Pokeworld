// TuxeWorld H5 | data/cosmetics.js | Thời trang: danh hiệu, khung avatar, khung chat, skin
//
// Đồ thời trang KHÔNG cộng chỉ số — mặc vào chỉ để đẹp và để người khác thấy.
// Danh hiệu mặc vào hiện ngay trên đầu nhân vật khi đi trên bản đồ và cạnh tên
// trong khung chat.
//
// TOÀN BỘ món ở đây do quản trị viên tải ảnh lên trong trang /admin. Bản game
// chỉ giữ sẵn ô "không mặc gì" của từng loại để người chơi còn tháo ra được;
// mọi món khác được nạp về khi vào phiên online (xem applyRemote bên dưới).

// Cách mở khoá: how = 'start' có sẵn | 'badge' đủ huy hiệu | 'catch' bắt đủ số
//               'win' thắng đủ trận | 'level' đủ cấp huấn luyện viên
//               'manual' không tự mở được — phải được quản trị viên trao tay
export const TITLES = {
  none: { name: 'Không danh hiệu', color: '#9aa0c3', how: 'start' },
};

export const AVATAR_FRAMES = {
  none: { name: 'Không khung', how: 'start' },
};

export const CHAT_FRAMES = {
  none: { name: 'Bình thường', how: 'start' },
};

export const SKINS = {
  default: { name: 'Trang phục gốc', how: 'start' },
};

// Skin cho TUXEMON: mỗi món gắn với một loài (trường sp), mặc vào thì con loài
// đó của mình đổi hình trong trận đấu và trong đội hình.
export const MON_SKINS = {};

export const COSMETIC_KINDS = [
  { id: 'title', name: 'Danh hiệu', icon: 'flag', data: TITLES },
  { id: 'avatarFrame', name: 'Khung avatar', icon: 'person', data: AVATAR_FRAMES },
  { id: 'chatFrame', name: 'Khung chat', icon: 'chat', data: CHAT_FRAMES },
  { id: 'skin', name: 'Skin', icon: 'slot_skin', data: SKINS },
];

// Ô "không mặc gì" của mỗi loại — không bao giờ bị xoá theo dữ liệu máy chủ
export const NONE_ID = { title: 'none', avatarFrame: 'none', chatFrame: 'none', skin: 'default' };

const TABLES = {
  title: TITLES, avatarFrame: AVATAR_FRAMES, chatFrame: CHAT_FRAMES,
  skin: SKINS, monSkin: MON_SKINS,
};

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

// ==== Món + ảnh do quản trị viên tải lên ====
// gốc = địa chỉ máy chủ, vì ảnh nằm trên máy chủ chứ không nằm trong thư mục game
let assetBase = '';
const remoteKeys = new Set();

// items = mảng { kind, id, name, color, how, n, img } lấy từ GET /api/cosmetics
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
    if (!table || !it.id || it.id === NONE_ID[it.kind]) continue;
    table[it.id] = {
      name: it.name, color: it.color || '#ffd43b',
      how: it.how, n: it.n || 0, img: it.img || null,
      sp: it.sp || 0,          // skin Tuxemon: mã loài được đổi hình
    };
    remoteKeys.add(`${it.kind}:${it.id}`);
  }
  stamp();
}

// Đường dẫn ảnh đầy đủ của một món (null = món "không mặc gì")
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
