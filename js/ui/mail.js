// TuxeWorld H5 | ui/mail.js | Hộp thư: thư quà giftcode / admin / xếp hạng / sự kiện
import { esc, fmt, tien, tienChu } from '../util.js';
import { toast, header, itemIcon } from './kit.js';
import { ITEMS } from '../data/items.js';
import { inbox, refreshInbox, claimOne, claimAll, markRead, canInbox } from '../net/inbox.js';

const NGUON = {
  giftcode: 'Giftcode', admin: 'Ban Quản Trị', rank: 'Bảng xếp hạng',
  event: 'Sự kiện', system: 'Hệ thống',
};

const khiNao = (ts) => {
  const p = Math.floor((Date.now() - ts) / 60000);
  if (p < 1) return 'vừa xong';
  if (p < 60) return `${p} phút trước`;
  if (p < 1440) return `${Math.floor(p / 60)} giờ trước`;
  return `${Math.floor(p / 1440)} ngày trước`;
};

export function render(el) {
  let mo = null;   // id thư đang mở

  function quaHtml(m) {
    const ds = [];
    if (m.money > 0) ds.push(`<span class="mail-gift">💰 ${tien(m.money)}</span>`);
    for (const it of m.items || []) {
      const ten = ITEMS[it.id]?.name || it.id;
      ds.push(`<span class="mail-gift">${itemIcon(it.id, '', 20)}${esc(ten)} ×${it.n}</span>`);
    }
    return ds.join('');
  }

  function draw() {
    if (!canInbox()) {
      el.innerHTML = `${header('Hộp thư', 'home')}
        <div class="card empty-note">Hộp thư nằm trên máy chủ — vào Menu ▸ Online để nối máy chủ rồi quay lại nhé.</div>`;
      return;
    }
    const ds = inbox.mail;
    const coQua = ds.filter(m => !m.taken && (m.money > 0 || (m.items || []).length)).length;
    el.innerHTML = `
      ${header('Hộp thư', 'home')}
      <div class="mail-bar">
        <small>${ds.length} thư · ${inbox.unreadMail} chưa đọc</small>
        <button class="btn btn-primary btn-sm" id="mail-all" ${coQua ? '' : 'disabled'}>
          Nhận tất cả${coQua ? ` (${coQua})` : ''}</button>
      </div>
      ${ds.length ? ds.map(m => {
        const qua = quaHtml(m);
        const dangMo = mo === m.id;
        return `<div class="card mail-row${m.read ? '' : ' unread'}${dangMo ? ' open' : ''}" data-id="${esc(m.id)}">
          <div class="mail-head">
            <b class="mail-title">${m.read ? '' : '<i class="mail-dot"></i>'}${esc(m.title)}</b>
            <small>${esc(khiNao(m.ts))}</small>
          </div>
          <small class="mail-from">${esc(NGUON[m.kind] || m.from || 'Hệ thống')}</small>
          ${dangMo ? `<p class="mail-body">${esc(m.body || '')}</p>` : ''}
          ${qua ? `<div class="mail-gifts">${qua}</div>` : ''}
          ${qua ? `<button class="btn ${m.taken ? '' : 'btn-primary'} btn-sm mail-take"
                    data-id="${esc(m.id)}" ${m.taken ? 'disabled' : ''}>
                    ${m.taken ? 'Đã nhận' : 'Nhận quà'}</button>` : ''}
        </div>`;
      }).join('') : '<div class="card empty-note">Chưa có thư nào.</div>'}`;

    el.querySelectorAll('.mail-row').forEach(r => r.addEventListener('click', async (e) => {
      if (e.target.closest('.mail-take')) return;
      const id = r.dataset.id;
      mo = mo === id ? null : id;
      await markRead(id);
      draw();
    }));
    el.querySelectorAll('.mail-take').forEach(b => b.addEventListener('click', async (e) => {
      e.stopPropagation();
      b.disabled = true;
      const [qua, err] = await claimOne(b.dataset.id);
      if (err) { toast(err); draw(); return; }
      toast(`Đã nhận${qua.money ? ` ${tienChu(qua.money)}` : ''}${
        (qua.items || []).length ? ` và ${qua.items.length} món` : ''}!`);
      draw();
    }));
    el.querySelector('#mail-all')?.addEventListener('click', async (b) => {
      const [r, err] = await claimAll();
      if (err) { toast(err); return; }
      toast(`Đã nhận quà của ${r.n} lá thư!`);
      draw();
    });
  }

  draw();
  refreshInbox().then(draw);
}
