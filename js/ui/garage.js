// TuxeWorld H5 | ui/garage.js | Nhà Xe: mua xe, mua đồ nghề, chọn thứ để cưỡi
import { esc, tien, monPath } from '../util.js';
import { toast, header } from './kit.js';
import { G } from '../state.js';
import { drawTopBar, show } from '../main.js';
import { SPECIES } from '../data/species.js';
import { displayName } from '../engine/monster.js';
import * as MT from '../engine/mounts.js';

export function render(el, { from = 'menu' } = {}) {
  let tab = 'xe';                        // xe | thu

  function veXe() {
    const dang = MT.dangCuoi();
    return `
      <div class="card"><p class="es-note">Mua một lần là của mình mãi. Đang lái
      thì đi nhanh hơn và ít gặp Tuxemon hoang hơn — muốn bắt thì xuống xe.</p></div>
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

  function veThu() {
    const dang = MT.dangCuoi();
    const doi = G.p?.party || [];
    const nghe = MT.DO_NGHE.map(d => {
      const co = MT.coNghe(d.id);
      return `<div class="card gr-row">
        <div class="gr-info">
          <b>${esc(d.name)}</b>
          <small>${esc(d.desc)}</small>
        </div>
        ${co ? '<span class="gr-co">Đã có</span>'
          : `<button class="btn btn-sm btn-primary" data-mua-nghe="${esc(d.id)}">
               ${tien(d.price)}</button>`}
      </div>`;
    }).join('');

    const ds = doi.map((m, i) => {
      const k = MT.kieuCuoi(m);
      const sp = SPECIES[m.sp];
      const cuoi = dang?.t === 'thu' && dang.slot === i;
      let nut;
      if (!k) nut = '<span class="gr-khong">Không cưỡi được</span>';
      else if (!MT.coNghe(k)) nut = `<span class="gr-khong">Cần ${esc(MT.NGHE_BY_ID[k].name)}</span>`;
      else if ((m.hpCur || 0) <= 0) nut = '<span class="gr-khong">Đang gục</span>';
      else nut = `<button class="btn btn-sm ${cuoi ? '' : 'btn-primary'}"
             data-cuoi="${i}">${cuoi ? 'Đang cưỡi' : 'Cưỡi'}</button>`;
      return `<div class="card gr-row">
        <img class="gr-mon" src="${esc(monPath(m.sp))}" alt="">
        <div class="gr-info">
          <b>${esc(displayName(m))}</b>
          <small>Lv.${m.lv} · dáng ${esc(sp?.shape || '?')}</small>
          <small class="gr-toc">${k === 'bay' ? 'Biết bay — qua được mặt nước'
            : k === 'yen' ? 'Bốn chân — cưỡi được' : 'Dáng này không cưỡi được'}</small>
        </div>
        ${nut}
      </div>`;
    }).join('');

    return `
      <div class="card"><p class="es-note">Phải có đồ nghề đúng loại mới trèo lên
      được. Con biết bay còn bay thẳng qua sông hồ.</p></div>
      ${nghe}
      <h3 class="sec-title">Đội của bạn</h3>
      ${ds || '<div class="card empty-note">Đội đang trống.</div>'}`;
  }

  function draw() {
    const dang = MT.dangCuoi();
    el.innerHTML = `
      ${header('Nhà Xe', from)}
      ${dang ? `<div class="card gr-dang">
        Đang ${dang.t === 'xe' ? 'lái' : 'cưỡi'} <b>${esc(MT.tenDangCuoi())}</b>
        <button class="btn btn-sm" data-xuong="1">Xuống</button>
      </div>` : ''}
      <div class="seg-row">
        <button type="button" class="seg-btn ${tab === 'xe' ? 'active' : ''}"
          data-tab="xe">Xe cộ</button>
        <button type="button" class="seg-btn ${tab === 'thu' ? 'active' : ''}"
          data-tab="thu">Cưỡi Tuxemon</button>
      </div>
      ${tab === 'xe' ? veXe() : veThu()}`;

    el.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
      tab = b.dataset.tab; draw();
    }));
    el.querySelectorAll('[data-mua-xe]').forEach(b => b.addEventListener('click', () => {
      const [v, err] = MT.muaXe(b.dataset.muaXe);
      if (err) { toast(err); return; }
      toast(`Đã tậu ${v.name}!`);
      drawTopBar(); draw();
    }));
    el.querySelectorAll('[data-mua-nghe]').forEach(b => b.addEventListener('click', () => {
      const [d, err] = MT.muaNghe(b.dataset.muaNghe);
      if (err) { toast(err); return; }
      toast(`Đã mua ${d.name}!`);
      drawTopBar(); draw();
    }));
    el.querySelectorAll('[data-lai]').forEach(b => b.addEventListener('click', () => {
      const [, err] = MT.len({ t: 'xe', id: b.dataset.lai });
      if (err) { toast(err); return; }
      toast(`Lên ${MT.tenDangCuoi()}. Ra bản đồ là chạy được.`);
      draw();
    }));
    el.querySelectorAll('[data-cuoi]').forEach(b => b.addEventListener('click', () => {
      const [, err] = MT.len({ t: 'thu', slot: Number(b.dataset.cuoi) });
      if (err) { toast(err); return; }
      toast(`Trèo lên lưng ${MT.tenDangCuoi()}.`);
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
