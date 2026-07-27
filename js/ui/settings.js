// PokeWorld H5 | ui/settings.js | Hồ sơ trainer + đăng xuất + xoá save
// Tách khỏi Menu vì Menu giờ chỉ còn các nút dẫn sang trang khác.
import { G, dexCounts, wipeSave } from '../state.js';
import { logout, activeAvatar } from '../engine/accounts.js';
import { TRAINERS } from '../data/trainers.js';
import { esc, fmt } from '../util.js';
import { toast, confirmDlg, header, itemIcon } from './kit.js';
import { storyProgress } from '../engine/story.js';
import { show } from '../main.js';

export function render(el) {
  const [seen, caught] = dexCounts();
  // Map badge id -> tên (từ trainer gym)
  const badgeNames = {};
  for (const t of Object.values(TRAINERS || {})) {
    if (t.badge) badgeNames[t.badge] = t.badgeName || t.badge;
  }

  el.innerHTML = `
    ${header('Cài đặt', 'menu')}

    <div class="card profile-card">
      <div class="profile-name">
        <img class="profile-ava" src="assets/trainers/${activeAvatar()}.png" alt="" onerror="this.remove()">
        <b>${esc(G.p.name)}</b>
        ${storyProgress().finished ? `<img src="assets/img/crown.png" class="crown-ico" alt="" title="Nhà Vô Địch" onerror="this.style.visibility='hidden'">` : ''}
      </div>
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
      <h3>Tài khoản</h3>
      <button class="btn" id="btn-logout">Đăng xuất</button>
      <button class="btn btn-danger" id="btn-wipe">Xóa save chơi lại</button>
    </div>

    <div class="card about-card">
      <b>PokeWorld H5 v1.0</b>
      <small>Fan game phi lợi nhuận, chơi vui trên trình duyệt. Pokémon © Nintendo / Game Freak. Sprite: PokeAPI.</small>
    </div>`;

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
