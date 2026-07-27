// PokeWorld H5 | ui/online.js | Màn Cộng đồng: chat, bảng xếp hạng, bang hội, bạn bè
// Chơi offline thì màn này chỉ nói rõ cần chọn máy chủ, không báo lỗi lung tung.
import { G } from '../state.js';
import { esc, fmt } from '../util.js';
import { toast, confirmDlg, header } from './kit.js';
import { isOnlineMode } from '../net/config.js';
import * as api from '../net/api.js';
import * as sock from '../net/socket.js';
import { net, onChange, startSession, isOnline, clearUnread } from '../net/session.js';
import { show } from '../main.js';

const TABS = [
  { id: 'chat', label: 'Trò chuyện' },
  { id: 'rank', label: 'Xếp hạng' },
  { id: 'guild', label: 'Bang hội' },
  { id: 'friends', label: 'Bạn bè' },
];

let tab = 'chat';
let chatChannel = 'world';     // world | guild | dm
let dmWith = null;

export function render(el) {
  el.innerHTML = `
    ${header('Cộng đồng')}
    <div class="card net-status" id="net-status"></div>
    <div class="tab-row" id="tab-row">
      ${TABS.map(t => `<button class="tab-btn ${tab === t.id ? 'on' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
    </div>
    <div id="tab-body"></div>`;

  el.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => {
    tab = b.dataset.tab;
    el.querySelectorAll('.tab-btn').forEach(x => x.classList.toggle('on', x.dataset.tab === tab));
    drawBody();
  }));

  const stop = onChange(() => { drawStatus(); if (tab === 'chat') drawChat(); });
  el.addEventListener('screen-leave', stop);

  function drawStatus() {
    const box = el.querySelector('#net-status');
    if (!box) return;
    if (!isOnlineMode()) {
      box.innerHTML = `<b>Đang chơi Offline</b>
        <small>Chọn một máy chủ để trò chuyện, đấu PvP và lên bảng xếp hạng.</small>
        <button class="btn" id="go-server">Chọn máy chủ</button>`;
      box.querySelector('#go-server').addEventListener('click', () => show('serverpick'));
      return;
    }
    box.innerHTML = net.connected
      ? `<b class="ok-dot">Đã kết nối</b> <small>${net.online} người đang online${net.me ? ` · bạn là <b>${esc(net.me.username)}</b>` : ''}</small>`
      : `<b class="bad-dot">Mất kết nối</b> <small>${esc(net.lastError || 'Đang thử lại...')}</small>
         <button class="btn" id="reconnect">Kết nối lại</button>`;
    const btn = box.querySelector('#reconnect');
    if (btn) btn.addEventListener('click', async () => { await startSession(); drawStatus(); });
  }

  function drawBody() {
    const body = el.querySelector('#tab-body');
    if (!isOnlineMode()) {
      body.innerHTML = `<div class="card empty-note">Phần này cần kết nối máy chủ.</div>`;
      return;
    }
    if (tab === 'chat') drawChat();
    else if (tab === 'rank') drawRank(body);
    else if (tab === 'guild') drawGuild(body);
    else drawFriends(body);
  }

  // ==================== Trò chuyện ====================
  function drawChat() {
    if (tab !== 'chat') return;
    const body = el.querySelector('#tab-body');
    const lines = chatChannel === 'dm'
      ? (dmWith ? net.dms.get(dmWith) || [] : [])
      : net.chat[chatChannel] || [];
    const label = { world: 'Thế giới', guild: 'Bang hội', dm: dmWith ? `Riêng · ${dmWith}` : 'Riêng' };

    body.innerHTML = `
      <div class="chan-row">
        ${['world', 'guild', 'dm'].map(c =>
          `<button class="chip ${chatChannel === c ? 'on' : ''}" data-chan="${c}">${label[c]}</button>`).join('')}
      </div>
      <div class="card chat-log" id="chat-log">
        ${lines.length ? lines.map(m => `
          <div class="chat-line ${m.from === net.me?.username ? 'mine' : ''}">
            <b>${esc(m.from || m.username || '???')}</b>
            <span>${esc(m.text || '')}</span>
          </div>`).join('')
        : '<div class="empty-note">Chưa có tin nhắn nào.</div>'}
      </div>
      ${chatChannel === 'dm' && !dmWith ? `
        <div class="card">
          <label for="dm-to">Nhắn riêng cho ai</label>
          <input id="dm-to" type="text" maxlength="20" placeholder="Tên người chơi" autocomplete="off">
          <button class="btn" id="dm-open">Mở khung chat</button>
        </div>` : `
        <div class="chat-send">
          <input id="chat-input" type="text" maxlength="200" placeholder="Nhập tin nhắn..." autocomplete="off">
          <button class="btn btn-primary" id="chat-send">Gửi</button>
        </div>`}`;

    clearUnread(chatChannel === 'dm' ? 'dm' : chatChannel);

    body.querySelectorAll('[data-chan]').forEach(b => b.addEventListener('click', () => {
      chatChannel = b.dataset.chan;
      drawChat();
    }));

    const open = body.querySelector('#dm-open');
    if (open) open.addEventListener('click', () => {
      const v = body.querySelector('#dm-to').value.trim();
      if (!v) { toast('Nhập tên người chơi đã!'); return; }
      dmWith = v;
      if (!net.dms.has(v)) net.dms.set(v, []);
      api.fetchDmHistory(v).then(r => {
        if (r.ok && Array.isArray(r.data?.rows)) net.dms.set(v, r.data.rows);
        drawChat();
      });
      drawChat();
    });

    const input = body.querySelector('#chat-input');
    const send = body.querySelector('#chat-send');
    if (send) {
      const doSend = () => {
        const text = input.value.trim();
        if (!text) return;
        if (!isOnline()) { toast('Chưa kết nối máy chủ.'); return; }
        if (chatChannel === 'world') sock.sendChat(text);
        else if (chatChannel === 'guild') sock.sendGuildChat(text);
        else sock.sendDm(dmWith, text);
        input.value = '';
      };
      send.addEventListener('click', doSend);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') doSend(); });
    }

    const log = body.querySelector('#chat-log');
    if (log) log.scrollTop = log.scrollHeight;
  }

  // ==================== Bảng xếp hạng ====================
  let rankMetric = 'money';
  async function drawRank(body) {
    body.innerHTML = `
      <div class="chan-row">
        ${[['money', 'Tiền'], ['badges', 'Huy hiệu'], ['dex', 'Pokédex']].map(([k, n]) =>
          `<button class="chip ${rankMetric === k ? 'on' : ''}" data-metric="${k}">${n}</button>`).join('')}
      </div>
      <div class="card" id="rank-list"><div class="empty-note">Đang tải...</div></div>`;
    body.querySelectorAll('[data-metric]').forEach(b => b.addEventListener('click', () => {
      rankMetric = b.dataset.metric;
      drawRank(body);
    }));
    const r = await api.fetchLeaderboard(rankMetric);
    const list = body.querySelector('#rank-list');
    if (!list) return;
    if (!r.ok) { list.innerHTML = `<div class="empty-note">Không tải được bảng xếp hạng.</div>`; return; }
    const rows = r.data?.rows || [];
    list.innerHTML = rows.length ? rows.map((e, i) => `
      <div class="rank-row ${e.username === net.me?.username ? 'mine' : ''}">
        <b class="rank-no">${i + 1}</b>
        <span class="rank-name">${esc(e.username || e.name || '???')}</span>
        <span class="rank-val">${fmt(e.value ?? e[rankMetric] ?? 0)}</span>
      </div>`).join('') : '<div class="empty-note">Chưa có ai trên bảng.</div>';
  }

  // ==================== Bang hội ====================
  async function drawGuild(body) {
    body.innerHTML = `<div class="card"><div class="empty-note">Đang tải...</div></div>`;
    const mine = await api.myGuild();
    const g = mine.ok ? mine.data?.guild : null;
    if (g && g.id) return drawMyGuild(body, g, mine.data?.role);

    const listed = await api.listGuilds('');
    const guilds = listed.ok ? (listed.data?.rows || []) : [];
    body.innerHTML = `
      <div class="card">
        <b>Lập bang hội mới</b>
        <input id="g-name" type="text" maxlength="24" placeholder="Tên bang" autocomplete="off">
        <input id="g-tag" type="text" maxlength="5" placeholder="Ký hiệu (3-5 chữ)" autocomplete="off">
        <input id="g-desc" type="text" maxlength="80" placeholder="Giới thiệu ngắn" autocomplete="off">
        <button class="btn btn-primary" id="g-create">Lập bang</button>
      </div>
      <div class="card">
        <b>Bang hội đang có</b>
        ${guilds.length ? guilds.map(x => `
          <div class="guild-row">
            <span><b>[${esc(x.tag || '')}] ${esc(x.name)}</b>
              <small>${x.members ?? 0}/${x.maxMembers ?? '?'} thành viên</small></span>
            <button class="btn-mini" data-join="${esc(x.id)}">Xin vào</button>
          </div>`).join('') : '<div class="empty-note">Chưa có bang hội nào. Lập bang đầu tiên đi!</div>'}
      </div>`;

    body.querySelector('#g-create').addEventListener('click', async () => {
      const name = body.querySelector('#g-name').value.trim();
      const tag = body.querySelector('#g-tag').value.trim();
      if (name.length < 3) { toast('Tên bang cần ít nhất 3 ký tự.'); return; }
      if (tag.length < 2) { toast('Ký hiệu cần ít nhất 2 ký tự.'); return; }
      const r = await api.createGuild(name, tag, body.querySelector('#g-desc').value.trim(), '');
      toast(r.ok ? 'Đã lập bang hội!' : (r.error || 'Không lập được bang.'));
      if (r.ok) drawGuild(body);
    });
    body.querySelectorAll('[data-join]').forEach(b => b.addEventListener('click', async () => {
      const r = await api.joinGuild(b.dataset.join);
      toast(r.ok ? 'Đã gửi đơn xin vào bang.' : (r.error || 'Không gửi được đơn.'));
    }));
  }

  async function drawMyGuild(body, g, myRole) {
    // guildFull: members là SỐ thành viên, memberList mới là mảng
    const members = g.memberList || [];
    const boss = myRole === 'leader' || myRole === 'officer';
    body.innerHTML = `
      <div class="card guild-head">
        <b>[${esc(g.tag || '')}] ${esc(g.name)}</b>
        <small>${esc(g.desc || '')}</small>
        <small>Cấp ${g.level ?? 1} · Quỹ ${fmt(g.treasury ?? 0)} · ${members.length}/${g.maxMembers ?? '?'} thành viên</small>
      </div>
      <div class="card">
        <b>Thành viên</b>
        ${members.map(m => `
          <div class="guild-row">
            <span>${esc(m.username)} <small>${esc(m.role || 'member')}${m.online ? ' · online' : ''}</small></span>
            ${boss && m.username !== net.me?.username
              ? `<button class="btn-mini" data-kick="${esc(m.userId || m.username)}">Đuổi</button>` : ''}
          </div>`).join('')}
      </div>
      ${(g.applicants || []).length ? `
      <div class="card">
        <b>Đơn xin vào</b>
        ${g.applicants.map(a => `
          <div class="guild-row">
            <span>${esc(a.username)}</span>
            <span>
              <button class="btn-mini" data-acc="${esc(a.userId)}">Nhận</button>
              <button class="btn-mini" data-rej="${esc(a.userId)}">Từ chối</button>
            </span>
          </div>`).join('')}
      </div>` : ''}
      <div class="card">
        <label for="g-donate">Góp quỹ bang (tiền trong game)</label>
        <input id="g-donate" type="number" min="100" step="100" value="1000">
        <button class="btn" id="g-donate-btn">Góp</button>
        <button class="btn" id="g-leave">Rời bang</button>
      </div>`;

    body.querySelector('#g-donate-btn').addEventListener('click', async () => {
      const amount = Number(body.querySelector('#g-donate').value) || 0;
      if (amount <= 0) { toast('Nhập số tiền hợp lệ.'); return; }
      if ((G.p.money || 0) < amount) { toast('Không đủ tiền.'); return; }
      const r = await api.donateGuild(amount);
      toast(r.ok ? `Đã góp ${fmt(amount)}!` : (r.error || 'Không góp được.'));
      if (r.ok) drawGuild(body);
    });
    body.querySelector('#g-leave').addEventListener('click', async () => {
      if (!await confirmDlg('Rời khỏi bang hội?')) return;
      const r = await api.leaveGuild();
      toast(r.ok ? 'Đã rời bang.' : (r.error || 'Không rời được.'));
      if (r.ok) drawGuild(body);
    });
    body.querySelectorAll('[data-kick]').forEach(b => b.addEventListener('click', async () => {
      if (!await confirmDlg('Đuổi thành viên này?')) return;
      const r = await api.kickMember(b.dataset.kick);
      toast(r.ok ? 'Đã đuổi.' : (r.error || 'Không đuổi được.'));
      if (r.ok) drawGuild(body);
    }));
    body.querySelectorAll('[data-acc],[data-rej]').forEach(b => b.addEventListener('click', async () => {
      const accept = b.hasAttribute('data-acc');
      const r = await api.respondApplicant(g.id, b.dataset.acc || b.dataset.rej, accept);
      toast(r.ok ? (accept ? 'Đã nhận vào bang.' : 'Đã từ chối.') : (r.error || 'Không xử lý được.'));
      if (r.ok) drawGuild(body);
    }));
  }

  // ==================== Bạn bè ====================
  async function drawFriends(body) {
    body.innerHTML = `<div class="card"><div class="empty-note">Đang tải...</div></div>`;
    const r = await api.fetchFriends();
    const d = r.ok ? (r.data || {}) : {};
    const friends = d.friends || [];
    const incoming = d.incoming || [];
    body.innerHTML = `
      <div class="card">
        <label for="fr-name">Kết bạn</label>
        <input id="fr-name" type="text" maxlength="20" placeholder="Tên người chơi" autocomplete="off">
        <button class="btn" id="fr-add">Gửi lời mời</button>
      </div>
      ${incoming.length ? `
      <div class="card">
        <b>Lời mời đang chờ</b>
        ${incoming.map(f => `
          <div class="guild-row">
            <span>${esc(f.username)}</span>
            <span>
              <button class="btn-mini" data-yes="${esc(f.requestId)}">Đồng ý</button>
              <button class="btn-mini" data-no="${esc(f.requestId)}">Từ chối</button>
            </span>
          </div>`).join('')}
      </div>` : ''}
      <div class="card">
        <b>Danh sách bạn</b>
        ${friends.length ? friends.map(f => `
          <div class="guild-row">
            <span>${esc(f.username)}</span>
            <span>
              <button class="btn-mini" data-dm="${esc(f.username)}">Nhắn</button>
              <button class="btn-mini" data-pvp="${esc(f.username)}">Đấu</button>
            </span>
          </div>`).join('') : '<div class="empty-note">Chưa có bạn nào.</div>'}
      </div>`;

    body.querySelector('#fr-add').addEventListener('click', async () => {
      const v = body.querySelector('#fr-name').value.trim();
      if (!v) { toast('Nhập tên người chơi đã!'); return; }
      const res = await api.requestFriend(v);
      toast(res.ok ? 'Đã gửi lời mời.' : (res.error || 'Không gửi được.'));
    });
    body.querySelectorAll('[data-yes],[data-no]').forEach(b => b.addEventListener('click', async () => {
      const accept = b.hasAttribute('data-yes');
      const res = await api.respondFriend(b.dataset.yes || b.dataset.no, accept);
      toast(res.ok ? (accept ? 'Đã kết bạn!' : 'Đã từ chối.') : (res.error || 'Không xử lý được.'));
      if (res.ok) drawFriends(body);
    }));
    body.querySelectorAll('[data-dm]').forEach(b => b.addEventListener('click', () => {
      tab = 'chat'; chatChannel = 'dm'; dmWith = b.dataset.dm;
      el.querySelectorAll('.tab-btn').forEach(x => x.classList.toggle('on', x.dataset.tab === 'chat'));
      drawBody();
    }));
    body.querySelectorAll('[data-pvp]').forEach(b => b.addEventListener('click', () => {
      if (!isOnline()) { toast('Chưa kết nối máy chủ.'); return; }
      sock.challengePvp(b.dataset.pvp);
      toast(`Đã gửi lời thách đấu tới ${b.dataset.pvp}.`);
    }));
  }

  drawStatus();
  drawBody();
}
