// PokeWorld H5 | ui/marriage.js | Trang kết hôn: cầu hôn, trả lời, ly hôn
// Máy chủ bắt buộc phải là bạn bè trước khi cầu hôn, nên trang này luôn
// chỉ đường sang trang Bạn bè khi chưa có ai để cầu hôn.
import { esc } from '../util.js';
import { toast, confirmDlg, header } from './kit.js';
import { isOnlineMode } from '../net/config.js';
import * as api from '../net/api.js';
import { netStatusCard, statusCardHtml, needServerHtml } from './netkit.js';
import { show } from '../main.js';

// "2 tháng 3 ngày" — đếm từ lúc cưới cho vui
function since(ts) {
  if (!ts) return '';
  const days = Math.max(0, Math.floor((Date.now() - ts) / 86400000));
  if (days < 1) return 'Cưới hôm nay';
  if (days < 30) return `Đã bên nhau ${days} ngày`;
  const months = Math.floor(days / 30);
  return `Đã bên nhau ${months} tháng ${days - months * 30} ngày`;
}

const avatarImg = (p) => (p && p.avatar)
  ? `<img class="mr-ava" src="assets/trainers/${esc(p.avatar)}.png" alt="" onerror="this.remove()">` : '';

export function render(el) {
  el.innerHTML = `
    ${header('Kết hôn', 'menu')}
    ${statusCardHtml()}
    <div id="mr-body"></div>`;
  netStatusCard(el);

  const body = el.querySelector('#mr-body');
  if (!isOnlineMode()) { body.innerHTML = needServerHtml(); return; }

  async function draw() {
    body.innerHTML = '<div class="card"><div class="empty-note">Đang tải...</div></div>';
    const r = await api.fetchMarriage();
    if (!r.ok) {
      body.innerHTML = `<div class="card empty-note">${esc(r.error || 'Không tải được thông tin.')}</div>`;
      return;
    }
    const d = r.data || {};

    if (d.married) {
      body.innerHTML = `
        <div class="card mr-card">
          ${avatarImg(d.partner)}
          <b class="mr-name">${esc(d.partner?.username || '???')}</b>
          <small>${esc(since(d.since))}</small>
        </div>
        <div class="card">
          <button class="btn" id="mr-dm">Nhắn tin cho ${esc(d.partner?.username || '')}</button>
          <button class="btn btn-danger" id="mr-divorce">Ly hôn</button>
        </div>`;
      body.querySelector('#mr-dm').addEventListener('click', () => show('chat', { to: d.partner?.username }));
      body.querySelector('#mr-divorce').addEventListener('click', async () => {
        if (!await confirmDlg(`Ly hôn với ${d.partner?.username || 'người ấy'}?`, 'Ly hôn')) return;
        const res = await api.divorce();
        toast(res.ok ? 'Đã ly hôn.' : (res.error || 'Không thực hiện được.'));
        if (res.ok) draw();
      });
      return;
    }

    if (d.pendingIncoming) {
      body.innerHTML = `
        <div class="card mr-card">
          ${avatarImg(d.pendingIncoming)}
          <b class="mr-name">${esc(d.pendingIncoming.username)}</b>
          <small>đã cầu hôn bạn!</small>
        </div>
        <div class="card">
          <button class="btn btn-primary" id="mr-yes">Đồng ý</button>
          <button class="btn" id="mr-no">Từ chối</button>
        </div>`;
      const answer = async (accept) => {
        const res = await api.respondMarriage(accept);
        toast(res.ok ? (accept ? 'Chúc mừng hai bạn!' : 'Đã từ chối.') : (res.error || 'Không xử lý được.'));
        if (res.ok) draw();
      };
      body.querySelector('#mr-yes').addEventListener('click', () => answer(true));
      body.querySelector('#mr-no').addEventListener('click', () => answer(false));
      return;
    }

    if (d.pendingOutgoing) {
      body.innerHTML = `
        <div class="card mr-card">
          ${avatarImg(d.pendingOutgoing)}
          <b class="mr-name">${esc(d.pendingOutgoing.username)}</b>
          <small>Đang chờ trả lời...</small>
        </div>
        <div class="card empty-note">Lời cầu hôn đã gửi. Chờ người ấy vào trang này trả lời nhé.</div>`;
      return;
    }

    // Chưa có gì: cho chọn trong danh sách bạn bè
    const fr = await api.fetchFriends();
    const friends = fr.ok ? (fr.data?.friends || []) : [];
    body.innerHTML = `
      <div class="card">
        <b>Cầu hôn</b>
        <small class="empty-note">Chỉ cầu hôn được người đã là bạn bè.</small>
      </div>
      <div class="card">
        ${friends.length ? friends.map(f => `
          <div class="guild-row">
            <span>${esc(f.username)}</span>
            <button class="btn-mini" data-ask="${esc(f.username)}">Cầu hôn</button>
          </div>`).join('')
        : '<div class="empty-note">Chưa có bạn nào. Sang trang Bạn bè kết bạn trước đã.</div>'}
        ${friends.length ? '' : '<button class="btn" id="mr-friends">Sang trang Bạn bè</button>'}
      </div>`;

    const toFriends = body.querySelector('#mr-friends');
    if (toFriends) toFriends.addEventListener('click', () => show('friends'));
    body.querySelectorAll('[data-ask]').forEach(b => b.addEventListener('click', async () => {
      if (!await confirmDlg(`Cầu hôn ${b.dataset.ask}?`, 'Cầu hôn')) return;
      const res = await api.proposeMarriage(b.dataset.ask);
      toast(res.ok ? 'Đã gửi lời cầu hôn!' : (res.error || 'Không gửi được.'));
      if (res.ok) draw();
    }));
  }

  draw();
}
