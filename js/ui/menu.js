// PokeWorld H5 | ui/menu.js | Bảng Menu: chỉ gồm các nút dẫn sang trang khác
import { G, claimDaily } from '../state.js';
import { DAILY_REWARDS } from '../data/quests.js';
import { ITEMS } from '../data/items.js';
import { esc, fmt, todayNum } from '../util.js';
import { toast, header, itemIcon } from './kit.js';
import { net } from '../net/session.js';
import { show, refresh } from '../main.js';

// Menu chỉ chứa những trang KHÔNG có sẵn trên thanh dưới và nút chat nổi.
// Bản đồ / Đội / Túi / Nhân vật / Pokédex đã có nút riêng nên không lặp lại ở đây.
// 'act' = nút làm việc gì đó tại chỗ, 'to' = nút mở trang.
const HUB = [
  { act: 'daily',     icon: 'lucky_egg',   label: 'Điểm danh' },
  { to: 'quest',      icon: 'vs_recorder', label: 'Nhiệm vụ' },
  { to: 'shop',       icon: 'coin_case',   label: 'Cửa hàng' },
  { to: 'rank',       icon: 'nugget',      label: 'Xếp hạng' },
  { to: 'guild',      icon: 'sacred_ash',  label: 'Bang hội' },
  { to: 'friends',    icon: 'poke_flute',  label: 'Bạn bè', badge: 'dm' },
  { to: 'marriage',   icon: 'heart_scale', label: 'Kết hôn' },
  { to: 'serverpick', icon: 'card_key',    label: 'Máy chủ' },
  { to: 'settings',   icon: 'gear_cog',    label: 'Cài đặt' },
];

// Số thông báo chưa đọc hiện trên góc ô
function badgeCount(kind) {
  if (!net.connected) return 0;
  if (kind === 'dm') return net.unread.dm || 0;
  return 0;
}

export function render(el) {
  const claimedToday = G.p.daily.last === todayNum();

  el.innerHTML = `
    ${header('Menu')}
    <div class="hub-grid">
      ${HUB.map(t => {
        const n = t.badge ? badgeCount(t.badge) : 0;
        // Điểm danh còn nhận được thì chấm sáng nhắc người chơi
        const dot = t.act === 'daily' && !claimedToday;
        const attr = t.act ? `data-act="${t.act}"` : `data-goto="${t.to}"`;
        return `<button type="button" class="hub-cell${dot ? ' hub-ready' : ''}" ${attr}>
          ${n ? `<span class="hub-badge">${n > 99 ? '99+' : n}</span>` : ''}
          ${dot ? '<span class="hub-dot"></span>' : ''}
          <span class="hub-ico">${itemIcon(t.icon, '', 32)}</span>
          <b class="hub-label">${esc(t.label)}</b>
        </button>`;
      }).join('')}
    </div>`;

  el.querySelectorAll('[data-goto]').forEach(b =>
    b.addEventListener('click', () => show(b.dataset.goto)));

  el.querySelector('[data-act="daily"]').addEventListener('click', () => {
    const r = claimDaily(DAILY_REWARDS);
    if (!r.ok) { toast('Hôm nay đã điểm danh rồi, mai quay lại nhé!'); return; }
    const parts = [];
    if (r.reward.money) parts.push(`${fmt(r.reward.money)}₽`);
    for (const it of r.reward.items || []) parts.push(`${ITEMS[it.id] ? ITEMS[it.id].name : it.id} ×${it.n}`);
    toast(`Ngày ${r.streak}: nhận ${parts.join(' + ') || 'quà'}!`);
    refresh();
  });
}
