// PokeWorld H5 | ui/chat.js | Trang trò chuyện: thế giới, bang hội, nhắn riêng
import { esc } from '../util.js';
import { toast, header } from './kit.js';
import { isOnlineMode } from '../net/config.js';
import * as api from '../net/api.js';
import * as sock from '../net/socket.js';
import { net, onChange, isOnline, clearUnread } from '../net/session.js';
import { netStatusCard, statusCardHtml, needServerHtml } from './netkit.js';

const CHANNELS = [['world', 'Thế giới'], ['guild', 'Bang hội'], ['dm', 'Riêng']];
let channel = 'world';
let dmWith = null;

export function render(el, { to = null } = {}) {
  if (to) { channel = 'dm'; dmWith = to; }

  el.innerHTML = `
    ${header('Trò chuyện')}
    ${statusCardHtml()}
    <div id="chat-body"></div>`;
  netStatusCard(el);

  if (!isOnlineMode()) {
    el.querySelector('#chat-body').innerHTML = needServerHtml();
    return;
  }

  const stop = onChange(() => draw());
  el.addEventListener('screen-leave', stop);

  function draw() {
    const body = el.querySelector('#chat-body');
    if (!body) return;
    const lines = channel === 'dm'
      ? (dmWith ? net.dms.get(dmWith) || [] : [])
      : net.chat[channel] || [];

    body.innerHTML = `
      <div class="chan-row">
        ${CHANNELS.map(([c, n]) => {
          const u = net.unread[c === 'dm' ? 'dm' : c];
          const label = c === 'dm' && dmWith ? `Riêng · ${esc(dmWith)}` : n;
          return `<button class="chip ${channel === c ? 'on' : ''}" data-chan="${c}">${label}${
            u && channel !== c ? ` <i class="chip-dot"></i>` : ''}</button>`;
        }).join('')}
      </div>
      <div class="card chat-log" id="chat-log">
        ${lines.length ? lines.map(m => `
          <div class="chat-line ${m.from === net.me?.username ? 'mine' : ''}">
            <b>${esc(m.from)}</b><span>${esc(m.text || '')}</span>
          </div>`).join('')
        : '<div class="empty-note">Chưa có tin nhắn nào.</div>'}
      </div>
      ${channel === 'dm' && !dmWith ? `
        <div class="card">
          <label for="dm-to">Nhắn riêng cho ai</label>
          <input id="dm-to" type="text" maxlength="20" placeholder="Tên người chơi" autocomplete="off">
          <button class="btn" id="dm-open">Mở khung chat</button>
        </div>` : `
        <div class="chat-send">
          <input id="chat-input" type="text" maxlength="200" placeholder="Nhập tin nhắn..." autocomplete="off">
          <button class="btn btn-primary" id="chat-send">Gửi</button>
        </div>
        ${channel === 'dm' ? '<button class="btn-mini chat-back" id="dm-other">Nhắn người khác</button>' : ''}`}`;

    clearUnread(channel === 'dm' ? 'dm' : channel);

    body.querySelectorAll('[data-chan]').forEach(b => b.addEventListener('click', () => {
      channel = b.dataset.chan;
      draw();
    }));

    const other = body.querySelector('#dm-other');
    if (other) other.addEventListener('click', () => { dmWith = null; draw(); });

    const open = body.querySelector('#dm-open');
    if (open) open.addEventListener('click', async () => {
      const v = body.querySelector('#dm-to').value.trim();
      if (!v) { toast('Nhập tên người chơi đã!'); return; }
      dmWith = v;
      if (!net.dms.has(v)) net.dms.set(v, []);
      draw();
      const r = await api.fetchDmHistory(v);
      if (r.ok && Array.isArray(r.data?.rows)) { net.dms.set(v, r.data.rows); draw(); }
    });

    const input = body.querySelector('#chat-input');
    const send = body.querySelector('#chat-send');
    if (send) {
      const doSend = () => {
        const text = input.value.trim();
        if (!text) return;
        if (!isOnline()) { toast('Chưa kết nối máy chủ.'); return; }
        if (channel === 'world') sock.sendChat(text);
        else if (channel === 'guild') sock.sendGuildChat(text);
        else sock.sendDm(dmWith, text);
        input.value = '';
      };
      send.addEventListener('click', doSend);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') doSend(); });
    }

    const log = body.querySelector('#chat-log');
    if (log) log.scrollTop = log.scrollHeight;
  }

  draw();
}
