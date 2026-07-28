// TuxeWorld H5 | ui/homes.js | Thăm nhà bạn bè và viết lên tường nhà
import { esc } from '../util.js';
import { toast, header, confirmDlg } from './kit.js';
import { isOnlineMode } from '../net/config.js';
import { net } from '../net/session.js';
import * as api from '../net/api.js';
import { netStatusCard, statusCardHtml, needServerHtml } from './netkit.js';
import { BASE_BY_ID, FURN_BY_ID } from '../data/estate.js';
import { veNha } from './houseview.js';
import { show } from '../main.js';

const gio = (ts) => {
  const p = Math.floor((Date.now() - ts) / 60000);
  if (p < 1) return 'vừa xong';
  if (p < 60) return `${p} phút trước`;
  if (p < 1440) return `${Math.floor(p / 60)} giờ trước`;
  return `${Math.floor(p / 1440)} ngày trước`;
};

export function render(el, { username = null, from = 'menu' } = {}) {
  el.innerHTML = `
    ${header(username ? `Nhà ${username}` : 'Thăm nhà', from)}
    ${statusCardHtml()}
    <div id="hm-body"></div>`;
  netStatusCard(el);

  const body = el.querySelector('#hm-body');
  if (!isOnlineMode()) { body.innerHTML = needServerHtml(); return; }

  username ? moNha(body, username) : danhSach(body);
}

// ==== Danh sách nhà ghé thăm được ====
async function danhSach(body) {
  body.innerHTML = '<div class="card"><div class="empty-note">Đang tải...</div></div>';
  const r = await api.fetchHomes();
  if (!r.ok) { body.innerHTML = `<div class="card empty-note">${esc(r.error)}</div>`; return; }
  const ds = r.data?.nha || [];
  if (!ds.length) {
    body.innerHTML = `<div class="card empty-note">Chưa có ai để ghé thăm.
      Kết bạn trước đã, rồi bạn nào dựng nhà là hiện ở đây.</div>`;
    return;
  }
  body.innerHTML = `
    <div class="card"><p class="es-note">Nhà của bạn bè và vợ/chồng. Vào xem nhà
    người ta bày biện thế nào, rồi để lại một dòng trên tường.</p></div>
    <div class="card hm-che">
      <b>Ai được vào nhà bạn?</b>
      <div class="seg-row" id="hm-che"></div>
    </div>
    ${ds.map(n => `
      <div class="card gr-row">
        <div class="gr-info">
          <b>${esc(n.username)}</b>
          <small>${n.base ? esc(BASE_BY_ID[n.base]?.name || n.base) : 'chưa dựng nhà'}
            · ${n.soDo} món · ${n.luotTham} lượt thăm · ${n.soBai} bài</small>
        </div>
        ${n.moCua && n.base
          ? `<button class="btn btn-sm btn-primary" data-nha="${esc(n.username)}">Vào thăm</button>`
          : `<span class="gr-khong">${n.base ? 'đang đóng cửa' : 'nhà trống'}</span>`}
      </div>`).join('')}`;

  const CHE = [['all', 'Mọi người'], ['friends', 'Bạn bè'], ['none', 'Đóng cửa']];
  const hop = body.querySelector('#hm-che');
  let che = 'friends';
  const veChe = () => {
    hop.innerHTML = CHE.map(([k, t]) =>
      `<button type="button" class="seg-btn ${che === k ? 'active' : ''}"
        data-che="${k}">${t}</button>`).join('');
    hop.querySelectorAll('[data-che]').forEach(b => b.addEventListener('click', async () => {
      const r2 = await api.setWallMode(b.dataset.che);
      if (!r2.ok) { toast(r2.error); return; }
      che = r2.data.tuong; veChe();
      toast('Đã đổi quyền vào nhà.');
    }));
  };
  veChe();
  // Đọc chế độ hiện tại từ chính nhà mình
  if (net.me?.username) {
    api.fetchHome(net.me.username).then(r2 => {
      if (r2.ok && r2.data?.tuong) { che = r2.data.tuong; veChe(); }
    }).catch(() => {});
  }

  body.querySelectorAll('[data-nha]').forEach(b => b.addEventListener('click', () => {
    show('homes', { username: b.dataset.nha, from: 'homes' });
  }));
}

// ==== Một căn nhà cụ thể ====
async function moNha(body, username) {
  body.innerHTML = '<div class="card"><div class="empty-note">Đang mở cửa...</div></div>';
  const r = await api.fetchHome(username);
  if (!r.ok) { body.innerHTML = `<div class="card empty-note">${esc(r.error)}</div>`; return; }
  const d = r.data;
  if (d.quanHe !== 'me') api.visitHome(username).catch(() => {});

  const base = BASE_BY_ID[d.base];
  const dem = {};
  for (const x of d.dat || []) dem[x.id] = (dem[x.id] || 0) + 1;

  body.innerHTML = `
    <div class="card hm-head">
      <b>${esc(d.username)}</b>
      <small>${base ? esc(base.name) : 'Chưa dựng nhà'} · ${(d.dat || []).length} món
        · ${d.luotTham} lượt thăm</small>
    </div>
    ${base ? '<div class="card hm-canvas"><canvas id="hm-nha"></canvas></div>'
      : '<div class="card empty-note">Chủ nhà chưa dựng gì cả.</div>'}
    ${Object.keys(dem).length ? `<div class="card">
      <b>Đồ trong nhà</b>
      <div class="hm-do">${Object.entries(dem).map(([id, n]) => {
        const f = FURN_BY_ID[id];
        return f ? `<span class="hm-mon"><img src="${esc(f.img)}" alt="">${esc(f.name)}${n > 1 ? ` ×${n}` : ''}</span>` : '';
      }).join('')}</div>
    </div>` : ''}
    <h3 class="sec-title">Tường nhà</h3>
    ${d.vietDuoc ? `<div class="card">
      <textarea id="hm-text" maxlength="400" rows="3"
        placeholder="Để lại một dòng cho ${esc(d.username)}..."></textarea>
      <button class="btn btn-primary" id="hm-gui">Đăng lên tường</button>
    </div>` : '<div class="card empty-note">Bạn không viết lên tường nhà này được.</div>'}
    <div id="hm-bai"></div>`;

  if (base) veNha(body.querySelector('#hm-nha'), d.base, d.dat || []);

  let bai = d.bai || [];
  const hop = body.querySelector('#hm-bai');
  const veBai = () => {
    if (!bai.length) {
      hop.innerHTML = '<div class="card empty-note">Tường còn trống, viết dòng đầu tiên đi.</div>';
      return;
    }
    hop.innerHTML = bai.map(b => `
      <div class="card hm-bai">
        <div class="hm-bai-top">
          <b>${esc(b.from)}</b><small>${gio(b.ts)}</small>
        </div>
        <p>${esc(b.text)}</p>
        <div class="hm-bai-nut">
          <button class="btn btn-sm" data-thich="${esc(b.id)}">♥ ${b.likes}</button>
          ${b.from === net.me?.username || d.quanHe === 'me'
            ? `<button class="btn btn-sm" data-xoa="${esc(b.id)}">Xoá</button>` : ''}
        </div>
      </div>`).join('');
    hop.querySelectorAll('[data-thich]').forEach(x => x.addEventListener('click', async () => {
      const r2 = await api.likeWall(x.dataset.thich);
      if (!r2.ok) { toast(r2.error); return; }
      const b = bai.find(y => y.id === x.dataset.thich);
      if (b) b.likes = r2.data.likes;
      veBai();
    }));
    hop.querySelectorAll('[data-xoa]').forEach(x => x.addEventListener('click', async () => {
      if (!await confirmDlg('Xoá bài này?')) return;
      const r2 = await api.deleteWall(x.dataset.xoa);
      if (!r2.ok) { toast(r2.error); return; }
      bai = bai.filter(y => y.id !== x.dataset.xoa);
      veBai();
    }));
  };
  veBai();

  const gui = body.querySelector('#hm-gui');
  if (gui) gui.addEventListener('click', async () => {
    const ta = body.querySelector('#hm-text');
    const text = ta.value.trim();
    if (!text) { toast('Chưa viết gì cả.'); return; }
    gui.disabled = true;
    const r2 = await api.postWall(username, text);
    gui.disabled = false;
    if (!r2.ok) { toast(r2.error); return; }
    ta.value = '';
    bai = [r2.data, ...bai];
    veBai();
    toast('Đã đăng lên tường.');
  });
}
