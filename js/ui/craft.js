// TuxeWorld H5 | ui/craft.js | Nhà Bếp: nấu món ăn cho Tuxemon
//
// Tên màn trước đây là "Chế Tạo" — nghe như rèn vũ khí, trong khi cả 25 công
// thức đều là món ăn. Mã màn vẫn giữ 'craft' để bản lưu và đường dẫn cũ không
// gãy; chỉ đổi cái tên người chơi nhìn thấy.
import { esc, fmt } from '../util.js';
import { toast, header, itemIcon } from './kit.js';
import { ITEMS } from '../data/items.js';
import { drawTopBar } from '../main.js';
import {
  RECIPES, CACH_LAM, theoCach, conThieu, lamDuoc, soLanLamDuoc,
  cheTao, tiLe, dangCo,
} from '../engine/craft.js';

const tenMon = (id) => ITEMS[id]?.name || id;

export function render(el, { from = 'menu' } = {}) {
  let cach = null;      // đang lọc theo cách làm nào
  let mo = null;        // công thức đang mở

  function draw() {
    const nhom = theoCach();
    const cacCach = Object.keys(nhom);
    if (!cach || !nhom[cach]) cach = cacCach[0];
    const ds = nhom[cach] || [];
    const lamDuocSo = RECIPES.filter(lamDuoc).length;

    el.innerHTML = `
      ${header('Nhà Bếp', from)}
      <div class="mail-bar">
        <small>${RECIPES.length} công thức · làm được ngay ${lamDuocSo}</small>
      </div>
      ${cacCach.length > 1 ? `
      <div class="seg-row${cacCach.length > 3 ? ' seg-wrap' : ''}">
        ${cacCach.map(c => `<button type="button" class="seg-btn ${c === cach ? 'active' : ''}"
          data-cach="${esc(c)}">${esc(CACH_LAM[c] || c)}</button>`).join('')}
      </div>` : ''}
      ${ds.map(r => {
        const duoc = lamDuoc(r);
        const dangMo = mo === r.id;
        const chinh = tiLe(r)[0];
        return `<div class="card cf-row${duoc ? ' ok' : ''}" data-id="${esc(r.id)}">
          <div class="cf-head">
            ${itemIcon(chinh.id, '', 34)}
            <div class="cf-mid">
              <b>${esc(tenMon(chinh.id))}</b>
              <small>${duoc ? `Làm được ${soLanLamDuoc(r)} mẻ` : `Còn thiếu ${conThieu(r).length} loại`}</small>
            </div>
            <button class="btn btn-sm ${duoc ? 'btn-primary' : ''} cf-make"
              data-id="${esc(r.id)}" ${duoc ? '' : 'disabled'}>Làm</button>
          </div>
          ${dangMo ? `
            <div class="cf-detail">
              <b class="cf-sub">Nguyên liệu</b>
              <div class="cf-ng">
                ${Object.entries(r.ng).map(([id, n]) => {
                  const co = dangCo(id);
                  return `<span class="cf-ng-i${co >= n ? ' du' : ''}">
                    ${itemIcon(id, '', 20)}${esc(tenMon(id))}
                    <b>${co}/${n}</b></span>`;
                }).join('')}
              </div>
              <b class="cf-sub">Có thể ra</b>
              <div class="cf-ng">
                ${tiLe(r).map(o => `<span class="cf-ng-i">
                  ${itemIcon(o.id, '', 20)}${esc(tenMon(o.id))} ×${o.n}
                  <b>${o.pc}%</b></span>`).join('')}
              </div>
            </div>` : ''}
        </div>`;
      }).join('') || '<div class="card empty-note">Chưa có công thức nào ở mục này.</div>'}`;

    el.querySelectorAll('.seg-btn').forEach(b => b.addEventListener('click', () => {
      cach = b.dataset.cach; mo = null; draw();
    }));
    el.querySelectorAll('.cf-row').forEach(r => r.addEventListener('click', (e) => {
      if (e.target.closest('.cf-make')) return;
      mo = mo === r.dataset.id ? null : r.dataset.id;
      draw();
    }));
    el.querySelectorAll('.cf-make').forEach(b => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const [kq, err] = cheTao(b.dataset.id);
      if (err) { toast(err); return; }
      toast(kq.xin ? `Làm xong ${kq.ten} ×${kq.n}!`
        : `Hỏng mất... ra ${kq.ten} ×${kq.n}.`);
      drawTopBar();
      draw();
    }));
  }

  draw();
}
