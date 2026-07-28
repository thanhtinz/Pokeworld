// TuxeWorld H5 | ui/profile.js | Xem thẻ huấn luyện viên của người chơi khác
//
// Mở từ Xếp hạng, Bạn bè hoặc khung chat: bấm vào tên ai thì xem thẻ người đó.
// Thẻ chỉ có thành tích công khai — máy chủ không trả tiền, túi đồ hay đội hình.
import { esc } from '../util.js';
import { header, toast } from './kit.js';
import { upgradeFaces } from './look.js';
import { otherCardHtml, ensureCardCss } from './trainercard.js';
import { isOnlineMode } from '../net/config.js';
import * as api from '../net/api.js';

export function render(el, { username = '', from = 'rank' } = {}) {
  ensureCardCss();
  const ten = String(username || '').trim();

  function khung(noi) {
    el.innerHTML = `${header('Thẻ huấn luyện viên', from)}<div class="card empty-note">${noi}</div>`;
  }

  if (!ten) return khung('Chưa chọn người chơi nào.');
  if (!isOnlineMode()) {
    return khung('Thẻ của người chơi khác nằm trên máy chủ — vào Menu ▸ Online để nối máy chủ nhé.');
  }

  khung('Đang tải thẻ…');
  api.fetchProfile(ten).then((r) => {
    if (!r.ok) {
      khung(esc(r.error || 'Không xem được thẻ của người này.'));
      return;
    }
    const d = r.data;
    el.innerHTML = `
      ${header(d.username, from)}
      ${otherCardHtml(d)}
      <div class="card prof-when">
        <small>Lần cuối online: ${d.lastSeen
          ? esc(new Date(d.lastSeen).toLocaleString('vi-VN')) : 'chưa rõ'}</small>
      </div>`;
    upgradeFaces(el);
  }).catch(() => toast('Không nối được máy chủ.'));
}
