// TuxeWorld H5 | net/pvpinvite.js | Lời mời PvP hiện được ở bất kỳ màn nào
// Đăng ký một lần lúc khởi động: có lời mời thì bật hộp chọn Nhận / Từ chối,
// bắt đầu trận thì chuyển thẳng sang màn PvP.
import * as sock from './socket.js';
import { toast, choose } from '../ui/kit.js';
import { show } from '../main.js';

let wired = false;

export function wirePvpInvites() {
  if (wired) return;
  wired = true;

  sock.on('pvp:invited', async ({ from } = {}) => {
    const i = await choose(`${from} muốn đấu với bạn!`, [
      { label: 'Nhận lời', sub: 'Vào trận ngay' },
      { label: 'Từ chối' },
    ]);
    if (i === 0) sock.acceptPvp();
    else sock.denyPvp();
  });

  sock.on('pvp:sent', ({ to } = {}) => toast(`Đã gửi lời thách đấu tới ${to}. Đang chờ trả lời...`));
  sock.on('pvp:denied', ({ by } = {}) => toast(`${by || 'Đối thủ'} đã từ chối.`));
  sock.on('pvp:error', ({ error } = {}) => toast(error || 'Không mở được trận PvP.'));

  sock.on('pvp:start', (d) => {
    if (!d) return;
    show('pvp', d);
  });
}
