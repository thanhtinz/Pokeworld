// TuxeWorld H5 | ui/news.js | Thông báo: tin tức và sự kiện admin đăng
import { esc } from '../util.js';
import { header } from './kit.js';
import { inbox, refreshInbox, seenAllNews, canInbox } from '../net/inbox.js';

const khiNao = (ts) => new Date(ts).toLocaleString('vi-VN',
  { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export function render(el) {
  function draw() {
    if (!canInbox()) {
      el.innerHTML = `${header('Thông báo', 'home')}
        <div class="card empty-note">Tin tức nằm trên máy chủ — vào Menu ▸ Online để nối máy chủ rồi quay lại nhé.</div>`;
      return;
    }
    const ds = [...inbox.news].sort((a, b) => (b.pin - a.pin) || (b.ts - a.ts));
    el.innerHTML = `
      ${header('Thông báo', 'home')}
      ${ds.length ? ds.map(n => `
        <div class="card news-row ${n.kind === 'event' ? 'is-event' : ''}">
          ${n.banner ? `<img class="news-banner" src="${esc(n.banner)}" alt=""
              onerror="this.remove()">` : ''}
          <div class="news-head">
            <span class="news-tag">${n.kind === 'event' ? 'Sự kiện' : 'Tin tức'}</span>
            ${n.pin ? '<span class="news-tag pin">Ghim</span>' : ''}
            <small>${esc(khiNao(n.ts))}</small>
          </div>
          <b class="news-title">${esc(n.title)}</b>
          <p class="news-body">${esc(n.body || '')}</p>
        </div>`).join('')
        : '<div class="card empty-note">Chưa có thông báo nào.</div>'}`;
  }

  draw();
  refreshInbox().then(() => { draw(); seenAllNews(); });
}
