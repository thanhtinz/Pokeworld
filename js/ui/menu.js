// PokeWorld H5 | ui/menu.js | Thông tin trainer, điểm danh, cài đặt
import { G, dexCounts, claimDaily, wipeSave } from '../state.js';
import { logout, activeAvatar } from '../engine/accounts.js';
import { DAILY_REWARDS } from '../data/quests.js';
import { TRAINERS } from '../data/trainers.js';
import { ITEMS } from '../data/items.js';
import { esc, fmt, todayNum } from '../util.js';
import { toast, confirmDlg, header, itemIcon } from './kit.js';
import { storyProgress } from '../engine/story.js';
import { net } from '../net/session.js';
import { show, refresh } from '../main.js';

// Bảng menu: mỗi ô là một trang riêng. Thêm trang mới thì thêm một dòng ở đây.
const HUB = [
  { to: 'character', icon: 'silph_scope',  label: 'Nhân vật',    note: 'Trang bị & chỉ số' },
  { to: 'party',     icon: 'exp_share',    label: 'Đội hình',    note: 'Sắp xếp Pokémon' },
  { to: 'dex',       icon: 'town_map',     label: 'Pokédex',     note: 'Đã gặp & đã bắt' },
  { to: 'bag',       icon: 'berry_pouch',  label: 'Túi',         note: 'Thuốc, bóng, đá' },
  { to: 'shop',      icon: 'coin_case',    label: 'Cửa hàng',    note: 'Mua vật phẩm' },
  { to: 'quest',     icon: 'vs_recorder',  label: 'Nhiệm vụ',    note: 'Hằng ngày & cốt truyện' },
  { to: 'chat',      icon: 'vs_seeker',    label: 'Trò chuyện',  note: 'Thế giới & bang', badge: 'chat' },
  { to: 'rank',      icon: 'nugget',       label: 'Xếp hạng',    note: 'Top người chơi' },
  { to: 'guild',     icon: 'sacred_ash',   label: 'Bang hội',    note: 'Lập & tham gia' },
  { to: 'friends',   icon: 'poke_flute',   label: 'Bạn bè',      note: 'Kết bạn, thách đấu', badge: 'dm' },
  { to: 'serverpick', icon: 'card_key',    label: 'Máy chủ',     note: 'Đổi máy chủ' },
];

// Số thông báo chưa đọc hiện trên góc ô
function badgeCount(kind) {
  if (!net.connected) return 0;
  if (kind === 'chat') return (net.unread.world || 0) + (net.unread.guild || 0);
  if (kind === 'dm') return net.unread.dm || 0;
  return 0;
}

function hubHtml() {
  return `<div class="hub-grid">${HUB.map(t => {
    const n = t.badge ? badgeCount(t.badge) : 0;
    return `<button type="button" class="hub-cell" data-goto="${t.to}">
      ${n ? `<span class="hub-badge">${n > 99 ? '99+' : n}</span>` : ''}
      <span class="hub-ico">${itemIcon(t.icon, '', 30)}</span>
      <b class="hub-label">${esc(t.label)}</b>
      <small class="hub-note">${esc(t.note)}</small>
    </button>`;
  }).join('')}</div>`;
}

export function render(el) {
  const [seen, caught] = dexCounts();
  // Map badge id -> tên (từ trainer gym)
  const badgeNames = {};
  for (const t of Object.values(TRAINERS || {})) {
    if (t.badge) badgeNames[t.badge] = t.badgeName || t.badge;
  }
  const claimedToday = G.p.daily.last === todayNum();

  el.innerHTML = `
    ${header('Menu')}

    <div class="card profile-card">
      <div class="profile-name"><img class="profile-ava" src="assets/trainers/${activeAvatar()}.png" alt="" onerror="this.remove()"> <b>${esc(G.p.name)}</b>${storyProgress().finished ? ` <img src="assets/img/crown.png" class="crown-ico" alt="" title="Nhà Vô Địch" onerror="this.style.visibility='hidden'">` : ''}</div>
      <div>${itemIcon('amulet_coin', '', 18)} ${fmt(G.p.money)}₽</div>
      <div class="badge-row">
        ${G.p.badges.length
          ? G.p.badges.map(b => `<span class="badge-pill"><img class="badge-crown${b === 'badge_boulder' ? ' badge-gray' : ''}" src="assets/img/crown.png" alt="" onerror="this.style.visibility='hidden'"> ${esc(badgeNames[b] || b)}</span>`).join('')
          : '<small>Chưa có huy hiệu nào.</small>'}
      </div>
      <div class="stat-grid">
        <div><b>${fmt(G.p.stats.catches)}</b><small>Đã bắt</small></div>
        <div><b>${fmt(G.p.stats.wins)}</b><small>Trận thắng</small></div>
        <div><b>${seen}/${caught}</b><small>Gặp/Bắt</small></div>
      </div>
    </div>

    <div class="card">
      <button class="btn btn-primary" id="btn-daily" ${claimedToday ? 'disabled' : ''}>
        ${itemIcon('lucky_egg', '', 22)} Điểm danh mỗi ngày ${claimedToday ? '(đã nhận)' : ''}
      </button>
      <small class="daily-streak">Chuỗi điểm danh: ${G.p.daily.streak} ngày</small>
    </div>

    ${hubHtml()}

    <div class="card">
      <h3>Cài đặt</h3>
      <button class="btn" id="btn-logout">Đăng xuất</button>
      <button class="btn btn-danger" id="btn-wipe">Xóa save chơi lại</button>
    </div>

    <div class="card about-card">
      <b>PokeWorld H5 v1.0</b>
      <small>Fan game phi lợi nhuận, chơi vui trên trình duyệt. Pokémon © Nintendo / Game Freak. Sprite: PokeAPI.</small>
    </div>`;

  el.querySelectorAll('[data-goto]').forEach(b =>
    b.addEventListener('click', () => show(b.dataset.goto)));

  el.querySelector('#btn-daily').addEventListener('click', () => {
    const r = claimDaily(DAILY_REWARDS);
    if (!r.ok) { toast('Hôm nay đã điểm danh rồi, mai quay lại nhé!'); return; }
    const parts = [];
    if (r.reward.money) parts.push(`${fmt(r.reward.money)}₽`);
    for (const it of r.reward.items || []) parts.push(`${ITEMS[it.id] ? ITEMS[it.id].name : it.id} ×${it.n}`);
    toast(`Ngày ${r.streak}: nhận ${parts.join(' + ') || 'quà'}!`);
    refresh();
  });

  el.querySelector('#btn-logout').addEventListener('click', () => {
    logout();
    location.reload();
  });
  el.querySelector('#btn-wipe').addEventListener('click', async () => {
    if (!await confirmDlg('Xóa toàn bộ dữ liệu và chơi lại từ đầu?', 'Xóa')) return;
    if (!await confirmDlg('Chắc chắn chứ? Không thể hoàn tác!', 'Xóa luôn')) return;
    wipeSave();
    toast('Đã xóa save. Bắt đầu lại!');
    show('starter');
  });
}
