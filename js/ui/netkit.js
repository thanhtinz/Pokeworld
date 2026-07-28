// TuxeWorld H5 | ui/netkit.js | Phần dùng chung cho các trang cần máy chủ
import { esc } from '../util.js';
import { isOnlineMode } from '../net/config.js';
import { net, onChange, startSession } from '../net/session.js';
import { show } from '../main.js';

// Thẻ trạng thái kết nối. Trả về hàm huỷ để gỡ khi rời màn.
//
// CHỈ hiện khi có việc phải làm: chưa chọn máy chủ, hoặc mất kết nối. Nối được
// rồi thì ẩn hẳn — dòng "Đã kết nối · 1 người đang online" lặp ở đầu mọi trang
// chỉ tổ chiếm chỗ, người chơi đã biết mình đang online rồi.
export function netStatusCard(el, id = 'net-status') {
  const draw = () => {
    const box = el.querySelector('#' + id);
    if (!box) return;
    if (isOnlineMode() && net.connected) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    box.hidden = false;
    if (!isOnlineMode()) {
      box.innerHTML = `<b>Đang chơi Offline</b>
        <small>Chọn một máy chủ để dùng các tính năng nhiều người chơi.</small>
        <button class="btn" id="${id}-go">Chọn máy chủ</button>`;
      box.querySelector(`#${id}-go`).addEventListener('click', () => show('serverpick'));
      return;
    }
    box.innerHTML = `<b class="bad-dot">Mất kết nối</b>
      <small>${esc(net.lastError || 'Đang thử lại...')}</small>
      <button class="btn" id="${id}-retry">Kết nối lại</button>`;
    const btn = box.querySelector(`#${id}-retry`);
    if (btn) btn.addEventListener('click', async () => { await startSession(); draw(); });
  };
  const stop = onChange(draw);
  el.addEventListener('screen-leave', stop);
  draw();
  return draw;
}

export const statusCardHtml = (id = 'net-status') => `<div class="card net-status" id="${id}" hidden></div>`;

// Trang cần máy chủ mà đang offline -> nói rõ, đừng để trang trắng
export const needServerHtml = () =>
  `<div class="card empty-note">Tính năng này cần kết nối máy chủ.</div>`;
