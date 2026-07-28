// TuxeWorld H5 | ui/events.js | Sự kiện: nhiệm vụ tích đồng, đổi thưởng, vòng quay
//
// Nội dung màn này KHÔNG nằm trong game — ban quản trị dựng ở trang /admin nên
// mỗi máy chủ một kiểu. Client chỉ vẽ lại đúng những gì máy chủ trả về.
import { esc, fmt, tien } from '../util.js';
import { toast, header, itemIcon } from './kit.js';
import { ITEMS } from '../data/items.js';
import {
  events, refreshEvents, syncEvent, buyEvent, rollEvent, canEvent,
} from '../net/events.js';

const tenMon = (id) => ITEMS[id]?.name || id;

// Mô tả một phần quà: "$5.000 + Thuốc hồi ×3"
function quaText(x) {
  const ds = [];
  if (x.money > 0) ds.push(`${tien(x.money)}`);
  if (x.itemId) ds.push(`${tenMon(x.itemId)} ×${x.itemN}`);
  return ds.join(' + ') || '—';
}

function anhQua(x) {
  if (x.img) return `<img class="ev-img" src="${esc(x.img)}" alt="" onerror="this.remove()">`;
  if (x.itemId) return itemIcon(x.itemId, 'ev-img', 34);
  return '<span class="ev-img ev-coin">💰</span>';
}

export function render(el) {
  let mo = null;          // sự kiện đang mở
  let tab = 'task';       // task | shop | gacha
  let st = null;          // { token, done, tien } lấy từ máy chủ

  function veList() {
    const ds = events.list;
    el.innerHTML = `
      ${header('Sự kiện', 'home')}
      ${ds.length ? ds.map(e => `
        <button type="button" class="card ev-card" data-id="${esc(e.id)}">
          ${e.banner ? `<img class="ev-banner" src="${esc(e.banner)}" alt="" onerror="this.remove()">` : ''}
          <b class="ev-name">${esc(e.name)}</b>
          <p class="ev-desc">${esc((e.desc || '').slice(0, 120))}</p>
          <small class="ev-meta">${e.end ? `Kết thúc ${new Date(e.end).toLocaleDateString('vi-VN')}` : 'Không giới hạn thời gian'}</small>
        </button>`).join('')
        : '<div class="card empty-note">Chưa có sự kiện nào đang mở.</div>'}`;

    el.querySelectorAll('.ev-card').forEach(b => b.addEventListener('click', () => {
      mo = events.list.find(x => x.id === b.dataset.id);
      tab = 'task';
      st = null;
      veChiTiet();
      lamMoiTienDo();
    }));
  }

  // Gửi bảng biến lên chấm công, xong thì báo mốc vừa đạt
  async function lamMoiTienDo() {
    if (!mo) return;
    const [d, err] = await syncEvent(mo.id);
    if (err) { toast(err); return; }
    st = d;
    if (d.xong?.length) {
      toast(`Xong ${d.xong.length} nhiệm vụ, +${d.xong.reduce((a, t) => a + t.reward, 0)} ${mo.token.name}!`);
    }
    veChiTiet();
  }

  function thanhDong() {
    const T = mo.token;
    return `<div class="ev-bar">
      ${T.img ? `<img src="${esc(T.img)}" alt="" onerror="this.remove()">` : '<span>🪙</span>'}
      <b>${fmt(st?.token || 0)}</b><small>${esc(T.name)}</small>
    </div>`;
  }

  function veNhiemVu() {
    const ds = mo.tasks || [];
    if (!ds.length) return '<div class="card empty-note">Sự kiện này không có nhiệm vụ.</div>';
    const tienDo = Object.fromEntries((st?.tien || []).map(t => [t.id, t]));
    return ds.map(t => {
      const p = tienDo[t.id] || { lam: 0, need: t.need, xong: false };
      const pc = Math.min(100, Math.round(p.lam / p.need * 100));
      return `<div class="card ev-task${p.xong ? ' done' : ''}">
        <div class="ev-task-head">
          <b>${esc(t.name || 'Nhiệm vụ')}</b>
          <small>+${t.reward} ${esc(mo.token.name)}</small>
        </div>
        <div class="ev-prog"><i style="width:${pc}%"></i></div>
        <small class="ev-num">${p.xong ? 'Đã hoàn thành' : `${fmt(p.lam)} / ${fmt(p.need)}`}</small>
      </div>`;
    }).join('');
  }

  function veDoiThuong() {
    const ds = mo.shop || [];
    if (!ds.length) return '<div class="card empty-note">Sự kiện này không có gian đổi thưởng.</div>';
    return `<div class="ev-grid">${ds.map(x => {
      const da = st?.bought?.[x.id] || 0;
      const het = x.limit && da >= x.limit;
      const thieu = (st?.token || 0) < x.cost;
      return `<div class="card ev-item">
        ${anhQua(x)}
        <b>${esc(x.name || quaText(x))}</b>
        <small>${esc(quaText(x))}</small>
        <small class="ev-limit">${x.limit ? `Còn ${Math.max(0, x.limit - da)}/${x.limit} lượt` : 'Không giới hạn'}</small>
        <button class="btn ${het || thieu ? '' : 'btn-primary'} btn-sm ev-buy"
          data-id="${esc(x.id)}" ${het || thieu ? 'disabled' : ''}>
          ${het ? 'Hết lượt' : `${x.cost} 🪙`}</button>
      </div>`;
    }).join('')}</div>`;
  }

  function veVongQuay() {
    const ds = mo.gacha || [];
    if (!ds.length) return '<div class="card empty-note">Sự kiện này không có vòng quay.</div>';
    const tong = ds.reduce((a, x) => a + x.w, 0);
    const du = (n) => (st?.token || 0) >= mo.gachaCost * n;
    return `
      <div class="card ev-roll">
        <p>Mỗi lượt tốn <b>${mo.gachaCost} ${esc(mo.token.name)}</b>. Quà rơi thẳng vào Hộp thư.</p>
        <div class="ev-roll-btn">
          <button class="btn ${du(1) ? 'btn-primary' : ''} ev-go" data-n="1" ${du(1) ? '' : 'disabled'}>Quay ×1</button>
          <button class="btn ${du(10) ? 'btn-primary' : ''} ev-go" data-n="10" ${du(10) ? '' : 'disabled'}>Quay ×10</button>
        </div>
      </div>
      <div class="card">
        <b class="ev-sub">Danh sách giải</b>
        <div class="ev-grid">${ds.map(x => `
          <div class="ev-item">
            ${anhQua(x)}
            <b>${esc(x.name || quaText(x))}</b>
            <small>${esc(quaText(x))}</small>
            <small class="ev-limit">${(x.w / tong * 100).toFixed(1)}%</small>
          </div>`).join('')}</div>
      </div>`;
  }

  function veChiTiet() {
    const TAB = [['task', 'Nhiệm vụ'], ['shop', 'Đổi thưởng'], ['gacha', 'Vòng quay']];
    el.innerHTML = `
      ${header(mo.name, 'events')}
      ${mo.banner ? `<img class="ev-banner big" src="${esc(mo.banner)}" alt="" onerror="this.remove()">` : ''}
      ${mo.desc ? `<div class="card ev-note">${esc(mo.desc)}</div>` : ''}
      ${thanhDong()}
      <div class="seg-row">
        ${TAB.map(([k, ten]) =>
          `<button type="button" class="seg-btn ${tab === k ? 'active' : ''}" data-tab="${k}">${ten}</button>`).join('')}
      </div>
      ${tab === 'task' ? veNhiemVu() : tab === 'shop' ? veDoiThuong() : veVongQuay()}`;

    el.querySelectorAll('.seg-btn').forEach(b => b.addEventListener('click', () => {
      tab = b.dataset.tab; veChiTiet();
    }));
    el.querySelectorAll('.ev-buy').forEach(b => b.addEventListener('click', async () => {
      b.disabled = true;
      const [d, err] = await buyEvent(mo.id, b.dataset.id);
      if (err) { toast(err); veChiTiet(); return; }
      toast('Đã đổi! Quà nằm trong Hộp thư.');
      await lamMoiTienDo();
    }));
    el.querySelectorAll('.ev-go').forEach(b => b.addEventListener('click', async () => {
      b.disabled = true;
      const [d, err] = await rollEvent(mo.id, Number(b.dataset.n));
      if (err) { toast(err); veChiTiet(); return; }
      toast(`Trúng: ${d.trung.map(x => x.name).join(', ')} — xem Hộp thư!`);
      await lamMoiTienDo();
    }));
  }

  function draw() {
    if (!canEvent()) {
      el.innerHTML = `${header('Sự kiện', 'home')}
        <div class="card empty-note">Sự kiện nằm trên máy chủ — vào Menu ▸ Online để nối máy chủ rồi quay lại nhé.</div>`;
      return;
    }
    if (mo) veChiTiet(); else veList();
  }

  draw();
  refreshEvents().then(draw);
}
