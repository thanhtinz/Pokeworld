// TuxeWorld H5 | ui/chat.js | Trang trò chuyện: thế giới, bang hội, nhắn riêng
import { esc } from '../util.js';
import { toast, header } from './kit.js';
import { isOnlineMode } from '../net/config.js';
import * as api from '../net/api.js';
import * as sock from '../net/socket.js';
import { net, onChange, isOnline, clearUnread } from '../net/session.js';
import { netStatusCard, statusCardHtml, needServerHtml } from './netkit.js';
import { chatFrame, titleHtml } from './look.js';
import { ensureData } from '../engine/player.js';

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
    const myLook = (ensureData() || {}).look || {};
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
          return `<button type="button" class="chip ${channel === c ? 'on' : ''}" data-chan="${c}">${label}${
            u && channel !== c ? ` <i class="chip-dot"></i>` : ''}</button>`;
        }).join('')}
      </div>
      <div class="card chat-log" id="chat-log">
        ${lines.length ? lines.map(m => {
          const mine = m.from === net.me?.username;
          // Khung chat + danh hiệu mới chỉ áp cho tin của CHÍNH MÌNH: máy chủ
          // chưa gửi kèm trang phục của người khác.
          const fr = mine ? chatFrame(myLook.chatFrame) : { cls: '', style: '' };
          return `
          <div class="chat-line ${mine ? 'mine' : ''}${fr.cls}"${fr.style}>
            ${mine ? titleHtml(myLook.title, 'chat-title') : ''}
            <b>${esc(m.from)}</b><span>${esc(m.text || '')}</span>
          </div>`;
        }).join('')
        : '<div class="empty-note">Chưa có tin nhắn nào.</div>'}
      </div>
      ${channel === 'dm' && !dmWith ? `
        <div class="card">
          <b>Các cuộc trò chuyện</b>
          ${dmList === null ? '<div class="empty-note">Đang tải...</div>'
            : dmList.length ? dmList.map(c => `
              <button type="button" class="guild-row dm-row" data-dm="${esc(c.username)}">
                <span class="dm-mid">
                  <b>${esc(c.username)}${c.online ? ' <i class="dot-on"></i>' : ''}</b>
                  <small>${c.last?.fromMe ? 'Bạn: ' : ''}${esc((c.last?.text || '').slice(0, 40))}</small>
                </span>
                ${c.unread ? `<span class="dm-unread">${c.unread > 99 ? '99+' : c.unread}</span>` : ''}
              </button>`).join('')
            : '<div class="empty-note">Chưa nhắn riêng với ai.</div>'}
        </div>
        <div class="card">
          <label for="dm-to">Nhắn cho người mới</label>
          <input id="dm-to" type="text" maxlength="20" placeholder="Tên người chơi" autocomplete="off">
          <button class="btn" id="dm-open">Mở khung chat</button>
        </div>` : `
        <div class="chat-send">
          <input id="chat-input" type="text" maxlength="200" placeholder="Nhập tin nhắn..." autocomplete="off">
          <button class="btn btn-primary" id="chat-send">Gửi</button>
        </div>
        ${channel === 'dm' ? '<button class="btn-mini chat-back" id="dm-other">Nhắn người khác</button>' : ''}`}`;

    clearUnread(channel === 'dm' ? 'dm' : channel);

    // Vẽ lại ở nhịp sau: nếu xoá DOM ngay trong handler thì chính cái nút vừa
    // bấm bị gỡ giữa chừng, trên máy chậm sẽ mất luôn cú chạm.
    body.querySelectorAll('[data-chan]').forEach(b => b.addEventListener('click', () => {
      channel = b.dataset.chan;
      setTimeout(() => {
        draw();
        if (channel === 'guild') loadGuildHistory();
        if (channel === 'dm' && !dmWith) loadDmList();
      }, 0);
    }));

    body.querySelectorAll('.dm-row').forEach(b => b.addEventListener('click', () => openDm(b.dataset.dm)));

    const other = body.querySelector('#dm-other');
    if (other) other.addEventListener('click', () => { dmWith = null; draw(); });

    const open = body.querySelector('#dm-open');
    if (open) open.addEventListener('click', () => {
      const v = body.querySelector('#dm-to').value.trim();
      if (!v) { toast('Nhập tên người chơi đã!'); return; }
      openDm(v);
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

  // Mở một khung nhắn riêng và kéo lịch sử từ máy chủ về
  async function openDm(name) {
    dmWith = name;
    if (!net.dms.has(name)) net.dms.set(name, []);
    draw();
    const r = await api.fetchDmHistory(name);
    if (r.ok && Array.isArray(r.data?.rows)) { net.dms.set(name, r.data.rows); draw(); }
  }

  // Danh sách cuộc trò chuyện riêng nằm trên máy chủ; null = chưa tải xong
  let dmList = null;
  async function loadDmList() {
    if (!isOnline()) { dmList = []; draw(); return; }
    const r = await api.fetchDmList();
    dmList = r.ok && Array.isArray(r.data?.rows) ? r.data.rows : [];
    draw();
  }

  // Lịch sử chat bang hội chỉ nằm trên máy chủ, phải xin về một lần khi mở tab
  let guildLoaded = false;
  async function loadGuildHistory() {
    if (guildLoaded || !isOnline()) return;
    guildLoaded = true;
    const r = await api.fetchGuildChat(50);
    if (r.ok && Array.isArray(r.data?.rows)) {
      net.chat.guild = r.data.rows.map(m => ({ from: m.from, text: m.text, ts: m.ts, system: !!m.system }));
      draw();
    }
  }

  draw();
  if (channel === 'guild') loadGuildHistory();
  if (channel === 'dm' && !dmWith) loadDmList();
}
