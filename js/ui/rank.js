// TuxeWorld H5 | ui/rank.js | Trang bảng xếp hạng
import { esc, fmt } from '../util.js';
import { header } from './kit.js';
import { isOnlineMode } from '../net/config.js';
import * as api from '../net/api.js';
import { net } from '../net/session.js';
import { netStatusCard, statusCardHtml, needServerHtml } from './netkit.js';
import { show } from '../main.js';

const METRICS = [['money', 'Tiền'], ['badges', 'Huy hiệu'], ['dex', 'Tuxedex'],
  ['cauca', 'Câu cá']];
let metric = 'money';

export function render(el) {
  el.innerHTML = `
    ${header('Bảng xếp hạng', 'menu')}
    ${statusCardHtml()}
    <div id="rank-body"></div>`;
  netStatusCard(el);

  const body = el.querySelector('#rank-body');
  if (!isOnlineMode()) { body.innerHTML = needServerHtml(); return; }

  async function draw() {
    body.innerHTML = `
      <div class="chan-row">
        ${METRICS.map(([k, n]) => `<button type="button" class="chip ${metric === k ? 'on' : ''}" data-m="${k}">${n}</button>`).join('')}
      </div>
      <div class="card" id="rank-list"><div class="empty-note">Đang tải...</div></div>`;
    body.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { metric = b.dataset.m; draw(); }));

    const r = await api.fetchLeaderboard(metric);
    const list = body.querySelector('#rank-list');
    if (!list) return;
    if (!r.ok) { list.innerHTML = '<div class="empty-note">Không tải được bảng xếp hạng.</div>'; return; }
    const rows = r.data?.rows || [];
    // Bấm vào một hàng để xem thẻ huấn luyện viên của người đó
    list.innerHTML = rows.length ? rows.map((e, i) => `
      <button type="button" class="rank-row ${e.username === net.me?.username ? 'mine' : ''}"
              data-who="${esc(e.username)}">
        <b class="rank-no">${i + 1}</b>
        <span class="rank-name">${esc(e.username)}</span>
        <span class="rank-val">${fmt(e.value ?? 0)}</span>
      </button>`).join('') : '<div class="empty-note">Chưa có ai trên bảng.</div>';
    list.querySelectorAll('[data-who]').forEach(b => b.addEventListener('click',
      () => show('profile', { username: b.dataset.who, from: 'rank' })));
  }
  draw();
}
