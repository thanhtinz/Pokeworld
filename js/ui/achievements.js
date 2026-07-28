// TuxeWorld H5 | ui/achievements.js | Màn Thành tựu
//
// Chơi offline vẫn dùng được: mọi thứ đọc từ bản lưu trên máy, không cần máy chủ.
import { esc, fmt, tien } from '../util.js';
import { toast, header, itemIcon } from './kit.js';
import { uiIcon } from './icons.js';
import { ITEMS } from '../data/items.js';
import { NHOM_TEN } from '../data/achievements.js';
import { bangThanhTuu, nhanThuong, nhanHet } from '../engine/achievements.js';
import { refresh } from '../main.js';

function quaHtml(q) {
  const ds = [];
  if (q.tien) ds.push(`<span class="ach-qua">${uiIcon('coin', 15)}${tien(q.tien)}</span>`);
  for (const d of q.do || []) {
    ds.push(`<span class="ach-qua">${itemIcon(d.id, '', 18)}${esc(ITEMS[d.id]?.name || d.id)} ×${d.n}</span>`);
  }
  return ds.join('');
}

export function render(el) {
  function draw() {
    const ds = bangThanhTuu();
    const cho = ds.filter(a => a.xong && !a.nhan).length;
    const xong = ds.filter(a => a.nhan).length;

    // Gom theo nhóm, trong nhóm thì cái nhận được đẩy lên trên
    const nhom = {};
    for (const a of ds) (nhom[a.nhom] ||= []).push(a);
    for (const k of Object.keys(nhom)) {
      nhom[k].sort((x, y) => (y.xong && !y.nhan) - (x.xong && !x.nhan) || x.nhan - y.nhan);
    }

    el.innerHTML = `
      ${header('Thành tựu', 'menu')}
      <div class="mail-bar">
        <small>Đã nhận ${xong}/${ds.length}</small>
        <button class="btn btn-primary btn-sm" id="ach-all" ${cho ? '' : 'disabled'}>
          Nhận tất cả${cho ? ` (${cho})` : ''}</button>
      </div>
      ${Object.entries(nhom).map(([k, list]) => `
        <div class="card">
          <div class="bag-head"><b>${esc(NHOM_TEN[k] || k)}</b>
            <small>${list.filter(a => a.nhan).length}/${list.length}</small></div>
          ${list.map(a => {
            const pc = Math.round(a.lam / a.moc * 100);
            return `<div class="ach-row${a.nhan ? ' done' : a.xong ? ' ready' : ''}">
              <span class="ach-ico">${uiIcon(a.ico, 22)}</span>
              <div class="ach-mid">
                <b>${esc(a.ten)}</b>
                <small>${esc(a.mo)}</small>
                <div class="ev-prog"><i style="width:${pc}%"></i></div>
                <small class="ach-num">${fmt(a.lam)} / ${fmt(a.moc)}</small>
                <div class="ach-quas">${quaHtml(a.qua)}</div>
              </div>
              <button class="btn btn-sm ${a.xong && !a.nhan ? 'btn-primary' : ''} ach-take"
                data-id="${esc(a.id)}" ${a.xong && !a.nhan ? '' : 'disabled'}>
                ${a.nhan ? 'Đã nhận' : a.xong ? 'Nhận' : 'Chưa đủ'}</button>
            </div>`;
          }).join('')}
        </div>`).join('')}`;

    el.querySelectorAll('.ach-take').forEach(b => b.addEventListener('click', () => {
      const [q, err] = nhanThuong(b.dataset.id);
      if (err) { toast(err); return; }
      toast(`Nhận thưởng!${q.tien ? ` +${tien(q.tien)}` : ''}`);
      refresh();
      draw();
    }));
    el.querySelector('#ach-all')?.addEventListener('click', () => {
      const [q, n] = nhanHet();
      if (!n) { toast('Chưa có thành tựu nào nhận được.'); return; }
      toast(`Nhận ${n} thành tựu, +${tien(q.tien)}!`);
      refresh();
      draw();
    });
  }

  draw();
}
