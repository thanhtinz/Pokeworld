// TuxeWorld H5 | ui/diadiem.js | Danh sách địa điểm ghé thăm được
//
// Mấy chỗ này là bản đồ rời, không nối vào lưới đường của thị trấn, nên gom
// vào một màn cho chọn. Bấm "Đi tới" là vào hẳn bản đồ, đi bộ trong đó bình
// thường; bước ra cửa là về đúng chỗ vừa đứng.
import { DIA_DIEM, DIEM_NHANH, vaoDiaDiem, diNhanh } from '../engine/diadiem.js';
import { MAPS } from '../data/maps.js';
import { esc } from '../util.js';
import { toast, header } from './kit.js';
import { show } from '../main.js';

export function render(el, { from = 'menu' } = {}) {
  const co = DIA_DIEM.filter(d => MAPS[d.id]);
  const nhanh = DIEM_NHANH.filter(d => MAPS[d.id] && (!d.hien || d.hien()));

  el.innerHTML = `
    ${header('Địa Điểm', from)}
    ${nhanh.length ? `<h3 class="dd-h3">Đi nhanh</h3>
      <div class="dd-luoi">${nhanh.map(d => {
        const m = MAPS[d.id];
        return `<div class="card dd-o">
          <b>${esc(d.ten)}</b>
          <small>${esc(d.mo)}</small>
          <span class="dd-co">${m.w}×${m.h} ô</span>
          <button class="btn btn-sm btn-primary dd-nhanh" data-id="${esc(d.id)}">Đi tới</button>
        </div>`;
      }).join('')}</div>
      <h3 class="dd-h3">Ghé thăm</h3>` : ''}
    ${co.length ? `<div class="dd-luoi">${co.map(d => {
      const m = MAPS[d.id];
      return `<div class="card dd-o">
        <b>${esc(d.ten)}</b>
        <small>${esc(d.mo)}</small>
        <span class="dd-co">${m.w}×${m.h} ô</span>
        <button class="btn btn-sm btn-primary dd-di" data-id="${esc(d.id)}">Đi tới</button>
      </div>`;
    }).join('')}</div>`
      : '<div class="card empty-note">Chưa dựng được địa điểm nào.</div>'}
  `;

  el.querySelectorAll('.dd-nhanh').forEach(b => b.addEventListener('click', async () => {
    const [cho, err] = diNhanh(b.dataset.id);
    if (err) { toast(err); return; }
    const { enterMap, boQuaNguDay } = await import('../engine/overworld.js');
    boQuaNguDay();
    enterMap(cho.map, cho.x, cho.y);
    show('world');
  }));

  el.querySelectorAll('.dd-di').forEach(b => b.addEventListener('click', async () => {
    const [cho, err] = vaoDiaDiem(b.dataset.id);
    if (err) { toast(err); return; }
    const { enterMap, boQuaNguDay } = await import('../engine/overworld.js');
    boQuaNguDay();
    enterMap(cho.map, cho.x, cho.y);
    show('world');
  }));
}
