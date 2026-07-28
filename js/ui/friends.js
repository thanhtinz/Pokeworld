// TuxeWorld H5 | ui/friends.js | Trang bạn bè: kết bạn, nhắn tin, thách đấu
import { esc } from '../util.js';
import { toast, confirmDlg, header } from './kit.js';
import { isOnlineMode } from '../net/config.js';
import * as api from '../net/api.js';
import * as sock from '../net/socket.js';
import { isOnline } from '../net/session.js';
import { netStatusCard, statusCardHtml, needServerHtml } from './netkit.js';
import { show } from '../main.js';

export function render(el) {
  el.innerHTML = `
    ${header('Bạn bè', 'menu')}
    ${statusCardHtml()}
    <div id="fr-body"></div>`;
  netStatusCard(el);

  const body = el.querySelector('#fr-body');
  if (!isOnlineMode()) { body.innerHTML = needServerHtml(); return; }

  async function draw() {
    body.innerHTML = '<div class="card"><div class="empty-note">Đang tải...</div></div>';
    const r = await api.fetchFriends();
    const d = r.ok ? (r.data || {}) : {};
    const friends = d.friends || [];
    const incoming = d.incoming || [];
    const outgoing = d.outgoing || [];

    body.innerHTML = `
      <div class="card">
        <label for="fr-name">Kết bạn</label>
        <input id="fr-name" type="text" maxlength="20" placeholder="Tên người chơi" autocomplete="off">
        <button class="btn" id="fr-add">Gửi lời mời</button>
      </div>
      ${incoming.length ? `
      <div class="card">
        <b>Lời mời đang chờ bạn trả lời</b>
        ${incoming.map(f => `
          <div class="guild-row">
            <span>${esc(f.username)}</span>
            <span>
              <button class="btn-mini" data-yes="${esc(f.requestId)}">Đồng ý</button>
              <button class="btn-mini" data-no="${esc(f.requestId)}">Từ chối</button>
            </span>
          </div>`).join('')}
      </div>` : ''}
      ${outgoing.length ? `
      <div class="card">
        <b>Lời mời bạn đã gửi</b>
        ${outgoing.map(f => `<div class="guild-row"><span>${esc(f.username)} <small>đang chờ</small></span></div>`).join('')}
      </div>` : ''}
      <div class="card">
        <b>Danh sách bạn (${friends.length})</b>
        ${friends.length ? friends.map(f => `
          <div class="guild-row">
            <button type="button" class="fr-name" data-card="${esc(f.username)}">${esc(f.username)}</button>
            <span>
              <button class="btn-mini" data-dm="${esc(f.username)}">Nhắn</button>
              <button class="btn-mini" data-nha="${esc(f.username)}">Nhà</button>
              <button class="btn-mini" data-pvp="${esc(f.username)}">Đấu</button>
              <button class="btn-mini" data-del="${esc(f.id)}">Xoá</button>
            </span>
          </div>`).join('') : '<div class="empty-note">Chưa có bạn nào.</div>'}
      </div>`;

    // Bấm tên bạn để xem thẻ huấn luyện viên của họ
    body.querySelectorAll('[data-card]').forEach(b => b.addEventListener('click',
      () => show('profile', { username: b.dataset.card, from: 'friends' })));

    body.querySelector('#fr-add').addEventListener('click', async () => {
      const v = body.querySelector('#fr-name').value.trim();
      if (!v) { toast('Nhập tên người chơi đã!'); return; }
      const res = await api.requestFriend(v);
      toast(res.ok ? 'Đã gửi lời mời.' : (res.error || 'Không gửi được.'));
      if (res.ok) draw();
    });
    body.querySelectorAll('[data-yes],[data-no]').forEach(b => b.addEventListener('click', async () => {
      const accept = b.hasAttribute('data-yes');
      const res = await api.respondFriend(b.dataset.yes || b.dataset.no, accept);
      toast(res.ok ? (accept ? 'Đã kết bạn!' : 'Đã từ chối.') : (res.error || 'Không xử lý được.'));
      if (res.ok) draw();
    }));
    body.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if (!await confirmDlg('Xoá người này khỏi danh sách bạn?')) return;
      const res = await api.removeFriend(b.dataset.del);
      toast(res.ok ? 'Đã xoá.' : (res.error || 'Không xoá được.'));
      if (res.ok) draw();
    }));
    body.querySelectorAll('[data-dm]').forEach(b => b.addEventListener('click', () => show('chat', { to: b.dataset.dm })));
    body.querySelectorAll('[data-nha]').forEach(b => b.addEventListener('click',
      () => show('homes', { username: b.dataset.nha, from: 'friends' })));
    body.querySelectorAll('[data-pvp]').forEach(b => b.addEventListener('click', () => {
      if (!isOnline()) { toast('Chưa kết nối máy chủ.'); return; }
      sock.challengePvp(b.dataset.pvp);
      toast(`Đã gửi lời thách đấu tới ${b.dataset.pvp}.`);
    }));
  }
  draw();
}
