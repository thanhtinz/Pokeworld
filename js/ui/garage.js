// TuxeWorld H5 | ui/garage.js | Nhà Xe: mua xe và chọn chiếc đang lái
import { esc, tien } from '../util.js';
import { toast, header } from './kit.js';
import { drawTopBar } from '../main.js';
import * as MT from '../engine/mounts.js';

export function render(el, { from = 'menu' } = {}) {

  function veXe() {
    const dang = MT.dangCuoi();
    return `
      <div class="card"><p class="es-note">Đang lái thì đi nhanh hơn và ít gặp Tuxemon
      hoang hơn — muốn bắt thì xuống xe.</p></div>
      ${MT.VEHICLES.map(v => {
        const co = MT.coXe(v.id);
        const lai = dang?.t === 'xe' && dang.id === v.id;
        return `<div class="card gr-row">
          <img class="gr-img" src="${esc(v.img.right)}" alt="">
          <div class="gr-info">
            <b>${esc(v.name)}</b>
            <small>${esc(v.desc)}</small>
            <small class="gr-toc">Tốc độ ×${v.speed}</small>
          </div>
          ${co
            ? `<button class="btn btn-sm ${lai ? '' : 'btn-primary'}"
                 data-lai="${esc(v.id)}">${lai ? 'Đang lái' : 'Lái'}</button>`
            : `<button class="btn btn-sm btn-primary" data-mua-xe="${esc(v.id)}">
                 ${tien(v.price)}</button>`}
        </div>`;
      }).join('')}`;
  }

  function draw() {
    const dang = MT.dangCuoi();
    el.innerHTML = `
      ${header('Nhà Xe', from)}
      ${dang ? `<div class="card gr-dang">
        Đang lái <b>${esc(MT.tenDangCuoi())}</b>
        <button class="btn btn-sm" data-xuong="1">Xuống</button>
      </div>` : ''}
      ${veXe()}`;

    el.querySelectorAll('[data-mua-xe]').forEach(b => b.addEventListener('click', () => {
      const [v, err] = MT.muaXe(b.dataset.muaXe);
      if (err) { toast(err); return; }
      toast(`Đã tậu ${v.name}!`);
      drawTopBar(); draw();
    }));
    el.querySelectorAll('[data-lai]').forEach(b => b.addEventListener('click', () => {
      const [, err] = MT.len({ t: 'xe', id: b.dataset.lai });
      if (err) { toast(err); return; }
      toast(`Lên ${MT.tenDangCuoi()}. Ra bản đồ là chạy được.`);
      draw();
    }));
    el.querySelectorAll('[data-xuong]').forEach(b => b.addEventListener('click', () => {
      MT.xuong();
      toast('Đã xuống.');
      draw();
    }));
  }

  draw();
}
