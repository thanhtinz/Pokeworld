// TuxeWorld H5 | ui/gifts.js | Tiệm Quà: mua quà tặng bạn bè, cộng điểm thân mật
//
// Điểm thân mật là điều kiện để cầu hôn. Tiền trừ ở máy này, còn ĐIỂM thì máy
// chủ tự tra theo id món — client có sửa số cũng không ăn thua.
import { esc, fmt, tien } from '../util.js';
import { toast, header, choose } from './kit.js';
import { G, addMoney } from '../state.js';
import { isOnlineMode } from '../net/config.js';
import * as api from '../net/api.js';
import { netStatusCard, statusCardHtml, needServerHtml } from './netkit.js';
import { GIFTS, GIFT_BY_ID, MOC_KET_HON } from '../data/gifts.js';
import { drawTopBar, show } from '../main.js';

export function render(el, { from = 'menu' } = {}) {
  el.innerHTML = `
    ${header('Tiệm Quà', from)}
    ${statusCardHtml()}
    <div id="qu-body"></div>`;
  netStatusCard(el);

  const body = el.querySelector('#qu-body');
  if (!isOnlineMode()) { body.innerHTML = needServerHtml(); return; }

  let ban = [];          // danh sách bạn + điểm thân mật

  async function nap() {
    const r = await api.fetchIntimacy();
    ban = r.ok ? (r.data?.ds || []) : [];
    return r;
  }

  function veBan() {
    if (!ban.length) {
      return `<div class="card empty-note">Chưa có bạn nào. Kết bạn trước đã,
        rồi mới tặng quà được.</div>`;
    }
    return ban.map(b => {
      const pct = Math.min(100, Math.round(b.diem * 100 / MOC_KET_HON));
      return `<div class="card qu-ban">
        <div class="qu-ban-top">
          <b>${esc(b.username)}</b>
          <small>${esc(b.capDo)} · ${fmt(b.diem)}/${fmt(MOC_KET_HON)}</small>
        </div>
        <div class="qu-thanh"><i style="width:${pct}%"></i></div>
        <div class="qu-ban-duoi">
          <small>${b.soQua} món đã tặng · hôm nay còn tính ${b.conTinhHomNay} món</small>
          <button class="btn btn-sm btn-primary" data-tang="${esc(b.username)}">Tặng quà</button>
        </div>
      </div>`;
    }).join('');
  }

  function draw() {
    body.innerHTML = `
      <div class="card"><p class="es-note">Tặng quà cho bạn bè để cộng
      <b>điểm thân mật</b>. Đủ <b>${fmt(MOC_KET_HON)}</b> điểm với một người thì
      mới cầu hôn người đó được. Mỗi cặp mỗi ngày chỉ tính điểm cho 20 món đầu.</p></div>
      <h3 class="sec-title">Hàng trong tiệm</h3>
      <div class="ev-grid">
        ${GIFTS.map(q => `<div class="card ev-item">
          <img class="qu-img" src="${esc(q.img)}" alt="">
          <b>${esc(q.name)}</b>
          <small>+${fmt(q.diem)} thân mật</small>
          <small class="qu-mo">${esc(q.desc)}</small>
          <span class="qu-gia">${tien(q.price)}</span>
        </div>`).join('')}
      </div>
      <h3 class="sec-title">Bạn bè</h3>
      ${veBan()}`;

    body.querySelectorAll('[data-tang]').forEach(b =>
      b.addEventListener('click', () => moChon(b.dataset.tang)));
  }

  async function moChon(username) {
    const i = await choose(`Tặng gì cho ${username}?`,
      GIFTS.map(q => ({ label: q.name, sub: `${tien(q.price)} · +${fmt(q.diem)} thân mật` })));
    if (i == null || i < 0) return;
    const q = GIFTS[i];
    if ((G.p.money || 0) < q.price) { toast('Không đủ tiền mua món này.'); return; }
    const r = await api.sendGift(username, q.id);
    if (!r.ok) { toast(r.error); return; }
    // Máy chủ nhận rồi mới trừ tiền — mạng lỗi thì không mất tiền oan
    addMoney(-q.price);
    drawTopBar();
    const d = r.data;
    toast(d.cong
      ? `Tặng ${q.name} cho ${username}: +${fmt(d.cong)} thân mật (${fmt(d.diem)}).`
      : `${username} đã nhận đủ quà hôm nay — món này không cộng thêm điểm.`);
    await nap();
    draw();
    if (d.cuoiDuoc) toast(`Bạn và ${username} đủ điểm cầu hôn rồi!`);
  }

  body.innerHTML = '<div class="card"><div class="empty-note">Đang tải...</div></div>';
  nap().then(r => {
    if (!r.ok) { body.innerHTML = `<div class="card empty-note">${esc(r.error)}</div>`; return; }
    draw();
  });
}
