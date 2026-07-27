// TuxeWorld H5 | engine/unlock.js | Mở khoá tính năng theo cấp huấn luyện viên
//
// Mở hết mọi thứ ngay từ phút đầu thì người mới nhìn đâu cũng thấy nút mà chẳng
// hiểu để làm gì, chơi vài hôm là hết cái để mong. Mấy tính năng phụ (xã hội,
// đấu người) mở dần theo cấp để lúc nào cũng còn thứ sắp tới.
//
// Cốt lõi KHÔNG bao giờ khoá: bản đồ, đội hình, túi, Tuxedex, nhân vật, cài đặt.
import { trainerLevel } from './player.js';

// Khoá là tên màn hình trong router (js/main.js)
export const FEATURES = {
  quest:    { lv: 2,  name: 'Nhiệm vụ',    note: 'Nhận nhiệm vụ hằng ngày và cốt truyện' },
  shop:     { lv: 3,  name: 'Cửa hàng',    note: 'Mua bóng, thuốc và vật phẩm' },
  chat:     { lv: 4,  name: 'Chat thế giới', note: 'Trò chuyện với người chơi khác' },
  friends:  { lv: 6,  name: 'Bạn bè',      note: 'Kết bạn và nhắn tin riêng' },
  rank:     { lv: 8,  name: 'Xếp hạng',    note: 'So kè với cả máy chủ' },
  guild:    { lv: 10, name: 'Bang hội',    note: 'Lập bang hoặc xin vào một bang' },
  pvp:      { lv: 12, name: 'Đấu PvP',     note: 'Thách đấu người chơi khác' },
  marriage: { lv: 15, name: 'Kết hôn',     note: 'Kết đôi với một người chơi' },
};

export const featureLevel = (id) => FEATURES[id]?.lv || 0;

export function isUnlocked(id, lv) {
  const f = FEATURES[id];
  if (!f) return true;                       // không nằm trong bảng = luôn mở
  return (lv ?? trainerLevel()) >= f.lv;
}

export function lockNote(id) {
  const f = FEATURES[id];
  return f ? `Mở ở Trainer Lv.${f.lv}` : '';
}

// Những tính năng vừa mở khi nhảy từ cấp cũ lên cấp mới (để báo cho người chơi)
export function unlockedBetween(oldLv, newLv) {
  return Object.entries(FEATURES)
    .filter(([, f]) => f.lv > oldLv && f.lv <= newLv)
    .map(([id, f]) => ({ id, ...f }));
}

// Danh sách sắp tới, xếp theo cấp cần — màn Nhân vật bày ra cho biết đường phấn đấu
export function upcoming(lv = trainerLevel(), max = 3) {
  return Object.entries(FEATURES)
    .filter(([, f]) => f.lv > lv)
    .sort((a, b) => a[1].lv - b[1].lv)
    .slice(0, max)
    .map(([id, f]) => ({ id, ...f }));
}
