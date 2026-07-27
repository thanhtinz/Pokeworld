// TuxeWorld H5 | ui/guild.js | Trang bang hội: lập bang, xin vào, quản lý thành viên
import { G } from '../state.js';
import { esc, fmt } from '../util.js';
import { toast, choose, confirmDlg, header } from './kit.js';
import { isOnlineMode } from '../net/config.js';
import * as api from '../net/api.js';
import { netStatusCard, statusCardHtml, needServerHtml } from './netkit.js';
import { show } from '../main.js';

export function render(el) {
  el.innerHTML = `
    ${header('Bang hội', 'menu')}
    ${statusCardHtml()}
    <div id="guild-body"></div>`;
  netStatusCard(el);

  const body = el.querySelector('#guild-body');
  if (!isOnlineMode()) { body.innerHTML = needServerHtml(); return; }

  async function draw() {
    body.innerHTML = '<div class="card"><div class="empty-note">Đang tải...</div></div>';
    const mine = await api.myGuild();
    const g = mine.ok ? mine.data?.guild : null;
    if (g && g.id) return drawMine(g, mine.data?.role);
    return drawList();
  }

  async function drawList() {
    const listed = await api.listGuilds('');
    const guilds = listed.ok ? (listed.data?.rows || []) : [];
    body.innerHTML = `
      <div class="card">
        <b>Lập bang hội mới</b>
        <input id="g-name" type="text" maxlength="24" placeholder="Tên bang" autocomplete="off">
        <input id="g-tag" type="text" maxlength="5" placeholder="Ký hiệu (2-5 chữ)" autocomplete="off">
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
      if (r.ok) draw();
    });
    body.querySelectorAll('[data-join]').forEach(b => b.addEventListener('click', async () => {
      const r = await api.joinGuild(b.dataset.join);
      toast(r.ok ? 'Đã gửi đơn xin vào bang.' : (r.error || 'Không gửi được đơn.'));
      if (r.ok) draw();
    }));
  }

  async function drawMine(g, myRole) {
    // guildFull: members là SỐ thành viên, memberList mới là mảng
    const members = g.memberList || [];
    const boss = myRole === 'leader' || myRole === 'officer';
    const isLeader = myRole === 'leader';
    body.innerHTML = `
      <div class="card guild-head">
        <b>[${esc(g.tag || '')}] ${esc(g.name)}</b>
        <small>${esc(g.desc || '')}</small>
        <small>Cấp ${g.level ?? 1} · Quỹ ${fmt(g.treasury ?? 0)} · ${members.length}/${g.maxMembers ?? '?'} thành viên</small>
        <small>Hội trưởng: ${esc(g.leader || '?')} · Gia nhập: ${g.joinPolicy === 'open' ? 'tự do' : 'phải duyệt'}</small>
      </div>
      ${g.announcement ? `<div class="card guild-ann"><b>Thông báo</b><small>${esc(g.announcement)}</small></div>` : ''}
      <button class="card menu-link" id="g-chat">Chat bang hội ›</button>
      <div class="card">
        <b>Thành viên</b>
        ${members.map(m => `
          <div class="guild-row">
            <span>${esc(m.username)} <small>${esc(m.role || 'member')}${m.online ? ' · online' : ''}</small></span>
            <span class="row-btns">
              ${isLeader && m.role !== 'leader'
                ? `<button class="btn-mini" data-role="${esc(m.userId)}" data-cur="${esc(m.role || 'member')}">Chức vụ</button>` : ''}
              ${boss && m.role !== 'leader'
                ? `<button class="btn-mini" data-kick="${esc(m.userId)}">Đuổi</button>` : ''}
            </span>
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
      ${boss ? `
      <div class="card">
        <b>Thiết lập bang (phó hội trở lên)</b>
        <input id="g-set-desc" type="text" maxlength="80" placeholder="Giới thiệu ngắn" value="${esc(g.desc || '')}">
        <input id="g-set-ann" type="text" maxlength="120" placeholder="Thông báo cho cả bang" value="${esc(g.announcement || '')}">
        <label class="g-policy">
          <input type="checkbox" id="g-set-open" ${g.joinPolicy === 'open' ? 'checked' : ''}>
          Cho vào tự do (bỏ chọn thì phải duyệt đơn)
        </label>
        <button class="btn" id="g-save-set">Lưu thiết lập</button>
      </div>` : ''}
      <div class="card">
        <label for="g-donate">Góp quỹ bang (tiền trong game — bạn có ${fmt(G.p.money)}₽)</label>
        <input id="g-donate" type="number" min="100" step="100" value="1000">
        <button class="btn" id="g-donate-btn">Góp</button>
        <button class="btn btn-danger" id="g-leave">Rời bang</button>
        ${isLeader ? '<button class="btn btn-danger" id="g-disband">Giải tán bang</button>' : ''}
      </div>`;

    body.querySelector('#g-chat').addEventListener('click', () => show('chat'));
    body.querySelector('#g-donate-btn').addEventListener('click', async () => {
      const amount = Number(body.querySelector('#g-donate').value) || 0;
      if (amount <= 0) { toast('Nhập số tiền hợp lệ.'); return; }
      if ((G.p.money || 0) < amount) { toast('Không đủ tiền.'); return; }
      const r = await api.donateGuild(amount);
      toast(r.ok ? `Đã góp ${fmt(amount)}₽!` : (r.error || 'Không góp được.'));
      if (r.ok) draw();
    });
    body.querySelector('#g-leave').addEventListener('click', async () => {
      if (!await confirmDlg('Rời khỏi bang hội?')) return;
      const r = await api.leaveGuild();
      toast(r.ok ? 'Đã rời bang.' : (r.error || 'Không rời được.'));
      if (r.ok) draw();
    });
    body.querySelectorAll('[data-kick]').forEach(b => b.addEventListener('click', async () => {
      if (!await confirmDlg('Đuổi thành viên này?')) return;
      const r = await api.kickMember(b.dataset.kick);
      toast(r.ok ? 'Đã đuổi.' : (r.error || 'Không đuổi được.'));
      if (r.ok) draw();
    }));
    const saveSet = body.querySelector('#g-save-set');
    if (saveSet) saveSet.addEventListener('click', async () => {
      const r = await api.updateGuildSettings({
        desc: body.querySelector('#g-set-desc').value.trim(),
        announcement: body.querySelector('#g-set-ann').value.trim(),
        joinPolicy: body.querySelector('#g-set-open').checked ? 'open' : 'approval',
      });
      toast(r.ok ? 'Đã lưu thiết lập bang.' : (r.error || 'Không lưu được.'));
      if (r.ok) draw();
    });

    const disband = body.querySelector('#g-disband');
    if (disband) disband.addEventListener('click', async () => {
      if (!await confirmDlg(`Giải tán [${g.tag}] ${g.name}? Toàn bộ thành viên sẽ bị đưa ra ngoài.`, 'Giải tán')) return;
      if (!await confirmDlg('Không thể hoàn tác. Chắc chắn giải tán?', 'Giải tán luôn')) return;
      const r = await api.disbandGuild();
      toast(r.ok ? 'Đã giải tán bang hội.' : (r.error || 'Không giải tán được.'));
      if (r.ok) draw();
    });

    // Đổi chức vụ: nhường ghế hội trưởng cũng nằm ở đây
    body.querySelectorAll('[data-role]').forEach(b => b.addEventListener('click', async () => {
      const cur = b.dataset.cur;
      const opts = [
        { label: 'Phó hội', sub: 'Duyệt đơn, đuổi thành viên, sửa thiết lập', disabled: cur === 'officer' },
        { label: 'Thành viên', sub: 'Quyền cơ bản', disabled: cur === 'member' },
        { label: 'Nhường ghế hội trưởng', sub: 'Bạn sẽ xuống làm phó hội' },
      ];
      const i = await choose('Đổi chức vụ', opts);
      if (i === null) return;
      const role = ['officer', 'member', 'leader'][i];
      if (role === 'leader' && !await confirmDlg('Nhường ghế hội trưởng cho người này?', 'Nhường')) return;
      const r = await api.promoteMember(b.dataset.role, role);
      toast(r.ok ? 'Đã đổi chức vụ.' : (r.error || 'Không đổi được.'));
      if (r.ok) draw();
    }));

    body.querySelectorAll('[data-acc],[data-rej]').forEach(b => b.addEventListener('click', async () => {
      const accept = b.hasAttribute('data-acc');
      const r = await api.respondApplicant(g.id, b.dataset.acc || b.dataset.rej, accept);
      toast(r.ok ? (accept ? 'Đã nhận vào bang.' : 'Đã từ chối.') : (r.error || 'Không xử lý được.'));
      if (r.ok) draw();
    }));
  }

  draw();
}
