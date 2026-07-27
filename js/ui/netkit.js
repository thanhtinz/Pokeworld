// PokeWorld H5 | ui/netkit.js | Phần dùng chung cho các trang cần máy chủ
import { esc } from '../util.js';
import { isOnlineMode } from '../net/config.js';
import { net, onChange, startSession } from '../net/session.js';
import { show } from '../main.js';

// Thẻ trạng thái kết nối. Trả về hàm huỷ để gỡ khi rời màn.
export function netStatusCard(el, id = 'net-status') {
  const draw = () => {
    const box = el.querySelector('#' + id);
    if (!box) return;
    if (!isOnlineMode()) {
      box.innerHTML = `<b>Đang chơi Offline</b>
        <small>Chọn một máy chủ để dùng các tính năng nhiều người chơi.</small>
        <button class="btn" id="${id}-go">Chọn máy chủ</button>`;
      box.querySelector(`#${id}-go`).addEventListener('click', () => show('serverpick'));
      return;
    }
    box.innerHTML = net.connected
      ? `<b class="ok-dot">Đã kết nối</b> <small>${net.online} người đang online${net.me ? ` · bạn là <b>${esc(net.me.username)}</b>` : ''}</small>`
      : `<b class="bad-dot">Mất kết nối</b> <small>${esc(net.lastError || 'Đang thử lại...')}</small>
         <button class="btn" id="${id}-retry">Kết nối lại</button>`;
    const btn = box.querySelector(`#${id}-retry`);
    if (btn) btn.addEventListener('click', async () => { await startSession(); draw(); });
  };
  const stop = onChange(draw);
  el.addEventListener('screen-leave', stop);
  draw();
  return draw;
}

export const statusCardHtml = (id = 'net-status') => `<div class="card net-status" id="${id}"></div>`;

// Trang cần máy chủ mà đang offline -> nói rõ, đừng để trang trắng
export const needServerHtml = () =>
  `<div class="card empty-note">Tính năng này cần kết nối máy chủ.</div>`;
