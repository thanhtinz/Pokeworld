// TuxeWorld H5 | ui/menu.js | Bảng Menu: chỉ gồm các nút dẫn sang trang khác
import { G, claimDaily } from '../state.js';
import { DAILY_REWARDS } from '../data/quests.js';
import { ITEMS } from '../data/items.js';
import { esc, fmt, todayNum, tien } from '../util.js';
import { toast, header } from './kit.js';
import { uiIcon } from './icons.js';
import { net } from '../net/session.js';
import { isOnlineMode } from '../net/config.js';
import { trainerLevel } from '../engine/player.js';
import { isUnlocked, featureLevel } from '../engine/unlock.js';
import { choNhan } from '../engine/achievements.js';
import { show, refresh } from '../main.js';

// Menu chỉ chứa những trang KHÔNG có sẵn trên thanh dưới và nút chat nổi.
// Bản đồ / Đội / Túi / Nhân vật / Tuxedex đã có nút riêng nên không lặp lại ở đây.
// 'act' = nút làm việc gì đó tại chỗ, 'to' = nút mở trang.
// 'on' = chỉ chạy được khi đã nối máy chủ; chơi offline thì ẨN HẲN chứ không
// hiện ra rồi báo "cần nối máy chủ" — bấm vào chẳng làm được gì thì bày ra
// chỉ tổ rối.
const HUB = [
  { act: 'daily',     icon: 'gift',    label: 'Điểm danh' },
  { to: 'quest',      icon: 'quest',   label: 'Nhiệm vụ' },
  { to: 'shop',       icon: 'shop',    label: 'Cửa hàng' },
  { to: 'achievements', icon: 'star',   label: 'Thành tựu', badge: 'ach' },
  { to: 'park',       icon: 'walk',    label: 'Công viên' },
  { to: 'daycare',    icon: 'heal',    label: 'Nhà trẻ' },
  { to: 'craft',      icon: 'quest',   label: 'Chế tạo' },
  { to: 'garage',     icon: 'walk',    label: 'Nhà xe' },
  { to: 'events',     icon: 'flag',    label: 'Sự kiện', on: true },
  { to: 'rank',       icon: 'trophy',  label: 'Xếp hạng', on: true },
  { to: 'guild',      icon: 'guild',   label: 'Bang hội', on: true },
  { to: 'friends',    icon: 'friends', label: 'Bạn bè', badge: 'dm', on: true },
  { to: 'marriage',   icon: 'heart',   label: 'Kết hôn', on: true },
  { to: 'settings',   icon: 'gear',    label: 'Cài đặt' },
];

// Số thông báo chưa đọc hiện trên góc ô
function badgeCount(kind) {
  // Thành tựu tính trên bản lưu nên chơi offline vẫn báo được
  if (kind === 'ach') return choNhan();
  if (!net.connected) return 0;
  if (kind === 'dm') return net.unread.dm || 0;
  return 0;
}

export function render(el) {
  const claimedToday = G.p.daily.last === todayNum();
  const lv = trainerLevel();

  el.innerHTML = `
    ${header('Menu')}
    <div class="hub-grid">
      ${HUB.filter(t => !t.on || isOnlineMode()).map(t => {
        const n = t.badge ? badgeCount(t.badge) : 0;
        // Điểm danh còn nhận được thì chấm sáng nhắc người chơi
        const dot = t.act === 'daily' && !claimedToday;
        const attr = t.act ? `data-act="${t.act}"` : `data-goto="${t.to}"`;
        // Tính năng chưa tới cấp: vẫn hiện nhưng mờ đi và ghi rõ mở ở cấp nào,
        // để người chơi thấy trước cái mình sắp có.
        const locked = t.to && !isUnlocked(t.to, lv);
        return `<button type="button" class="hub-cell${dot ? ' hub-ready' : ''}${locked ? ' hub-locked' : ''}" ${attr}>
          ${n && !locked ? `<span class="hub-badge">${n > 99 ? '99+' : n}</span>` : ''}
          ${dot ? '<span class="hub-dot"></span>' : ''}
          <span class="hub-ico">${uiIcon(t.icon, 30)}</span>
          <b class="hub-label">${esc(t.label)}</b>
          ${locked ? `<small class="hub-lock">Lv.${featureLevel(t.to)}</small>` : ''}
        </button>`;
      }).join('')}
    </div>`;

  el.querySelectorAll('[data-goto]').forEach(b =>
    b.addEventListener('click', () => show(b.dataset.goto)));

  el.querySelector('[data-act="daily"]').addEventListener('click', () => {
    const r = claimDaily(DAILY_REWARDS);
    if (!r.ok) { toast('Hôm nay đã điểm danh rồi, mai quay lại nhé!'); return; }
    const parts = [];
    if (r.reward.money) parts.push(`${tien(r.reward.money)}`);
    for (const it of r.reward.items || []) parts.push(`${ITEMS[it.id] ? ITEMS[it.id].name : it.id} ×${it.n}`);
    toast(`Ngày ${r.streak}: nhận ${parts.join(' + ') || 'quà'}!`);
    refresh();
  });
}
