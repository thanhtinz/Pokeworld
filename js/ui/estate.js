// TuxeWorld H5 | ui/estate.js | Khu Đất Mới: mua đất, dựng nhà, trang trí
import { esc, fmt, tien } from '../util.js';
import { toast, header, confirmDlg } from './kit.js';
import { uiIcon } from './icons.js';
import { G } from '../state.js';
// KHÔNG dùng refresh() ở màn này: refresh() gọi lại show() nên render() chạy
// từ đầu và tab đang mở bị đặt lại — bấm nút xong là mất chỗ. Chỉ cần vẽ lại
// thanh trên cho số tiền đúng.
import { drawTopBar } from '../main.js';
import { FURNITURE, FURN_BY_ID, HOUSE_BASES } from '../data/estate.js';
import {
  LOTS, nha, coDat, coNha, mauNha, soO, muaDat, dungNha,
  muaDo, conTrongKho, ke, go, donGonTheoO, tomTat,
} from '../engine/estate.js';
import { isOnlineMode, getToken } from '../net/config.js';
import * as api from '../net/api.js';

export function render(el) {
  let tab = coNha() ? 'trong' : 'dat';   // dat | nha | trong | cho
  let dangKe = null;                     // món đang cầm để đặt xuống
  let banDoi = null;                     // tên vợ/chồng, chỉ có khi nối máy chủ

  // ==== Mua đất ====
  function veDat() {
    const e = nha();
    return `
      <div class="card">
        <b class="park-title">Khu Đất Mới</b>
        <p class="es-note">Mỗi người mua được <b>một lô</b>. Mua xong thì dựng
        nhà lên đó, rồi vào trong tự kê đồ.</p>
      </div>
      ${LOTS.map(l => {
        const cua = e.lot === l.id;
        const daCoDat = !!e.lot;
        return `<div class="card es-lot${cua ? ' mine' : ''}">
          <div class="es-lot-mid">
            <b>${esc(l.name)}</b>
            <small>${cua ? 'Đất của bạn' : tien(l.price)}</small>
          </div>
          ${cua ? '<span class="badge-mine">ĐÃ MUA</span>'
            : `<button class="btn btn-sm ${daCoDat ? '' : 'btn-primary'} es-buy-lot"
                 data-id="${esc(l.id)}" ${daCoDat ? 'disabled' : ''}>Mua</button>`}
        </div>`;
      }).join('')}`;
  }

  // ==== Chọn mẫu nhà ====
  function veNha() {
    if (!coDat()) return '<div class="card empty-note">Phải mua đất trước đã.</div>';
    const cu = mauNha();
    return `
      <div class="card"><p class="es-note">Nhà càng đắt thì bên trong càng nhiều
      ô để kê đồ. Đổi lên mẫu đắt hơn thì <b>chỉ trả phần chênh lệch</b>.</p></div>
      ${HOUSE_BASES.map(b => {
        const dang = cu?.id === b.id;
        const phai = cu ? b.price - cu.price : b.price;
        return `<div class="card es-base${dang ? ' mine' : ''}">
          <img src="${esc(b.img)}" alt="" class="es-base-img">
          <div class="es-base-mid">
            <b>${esc(b.name)}</b>
            <small>${esc(b.desc)}</small>
            <small class="es-o">Lưới ${b.o}×${b.o} ô</small>
          </div>
          ${dang ? '<span class="badge-mine">ĐANG Ở</span>'
            : `<button class="btn btn-sm ${phai > 0 ? 'btn-primary' : ''} es-build"
                 data-id="${esc(b.id)}" ${phai > 0 ? '' : 'disabled'}>
                 ${phai > 0 ? tien(phai) : '—'}</button>`}
        </div>`;
      }).join('')}`;
  }

  // ==== Bên trong nhà: lưới kê đồ ====
  function veTrong() {
    if (!coNha()) return '<div class="card empty-note">Chưa dựng nhà nào.</div>';
    const e = nha();
    const n = soO();
    const t = tomTat();
    // Vẽ lưới n×n, món nào chiếm nhiều ô thì trải lên bằng grid-area
    const o = [];
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        o.push(`<button type="button" class="es-cell" data-x="${x}" data-y="${y}"
          style="grid-area:${y + 1}/${x + 1}"></button>`);
      }
    }
    const do_ = e.dat.map(d => {
      const f = FURN_BY_ID[d.id];
      if (!f) return '';
      return `<img class="es-item" src="${esc(f.img)}" alt="${esc(f.name)}"
        title="${esc(f.name)}"
        style="grid-area:${d.y + 1}/${d.x + 1}/span ${f.h}/span ${f.w}">`;
    }).join('');

    return `
      <div class="card">
        <div class="es-room-head">
          <b>${esc(mauNha().name)}</b>
          <small>${t.daKe} món đã kê · ${t.trongKho} món trong kho</small>
        </div>
        <div class="es-room" style="--n:${n}">${o.join('')}${do_}</div>
        <p class="es-note">${dangKe
          ? `Đang cầm <b>${esc(FURN_BY_ID[dangKe].name)}</b> — chạm một ô để đặt xuống.`
          : 'Chạm vào món đã kê để gỡ về kho. Chọn món ở tab Kho để kê thêm.'}</p>
        ${dangKe ? '<button class="btn btn-sm" id="es-huy">Thôi, không đặt nữa</button>' : ''}
      </div>
      <div class="card">
        <div class="tcard-rows">
          ${[['Lô đất', t.lot?.name || '—'],
             ['Mẫu nhà', t.base?.name || '—'],
             ['Tổng giá trị', tien(t.giaTri)]].map(([k, v]) => `
            <div class="tcard-row"><span class="tcard-k">${k}</span>
              <i class="tcard-dots"></i><b class="tcard-v">${esc(String(v))}</b></div>`).join('')}
        </div>
      </div>`;
  }

  // ==== Kho + cửa hàng đồ ====
  function veCho() {
    return `
      <div class="card"><p class="es-note">Mua đồ về kho, rồi sang tab
      <b>Trong nhà</b> để kê. Gỡ ra thì đồ về kho chứ không mất.</p></div>
      <div class="ev-grid">
        ${FURNITURE.map(f => {
          const co = conTrongKho(f.id);
          return `<div class="card ev-item">
            <img class="es-shop-img" src="${esc(f.img)}" alt="">
            <b>${esc(f.name)}</b>
            <small>${f.w}×${f.h} ô</small>
            ${co ? `<small class="ev-limit">Trong kho: ${co}</small>` : ''}
            <button class="btn btn-sm btn-primary es-buy-do" data-id="${esc(f.id)}">
              ${tien(f.price)}</button>
            ${co && coNha() ? `<button class="btn btn-sm es-take" data-id="${esc(f.id)}">Kê</button>` : ''}
          </div>`;
        }).join('')}
      </div>`;
  }

  function draw() {
    const TAB = [['dat', 'Lô đất'], ['nha', 'Mẫu nhà'], ['trong', 'Trong nhà'], ['cho', 'Kho đồ']];

    el.innerHTML = `
      ${header('Nhà Đất', 'menu')}
      <div class="seg-row">
        ${TAB.map(([k, ten]) =>
          `<button type="button" class="seg-btn ${tab === k ? 'active' : ''}"
             data-tab="${k}">${ten}</button>`).join('')}
      </div>
      ${tab === 'dat' ? veDat() : tab === 'nha' ? veNha()
        : tab === 'trong' ? veTrong() : veCho()}
      ${banDoi && coNha() ? `<div class="card es-share">
        ${uiIcon('heart', 16)} Bạn đời <b>${esc(banDoi)}</b> ra vào nhà này thoải mái.
      </div>` : ''}`;

    el.querySelectorAll('.seg-btn').forEach(b => b.addEventListener('click', () => {
      tab = b.dataset.tab; dangKe = null; draw();
    }));

    el.querySelectorAll('.es-buy-lot').forEach(b => b.addEventListener('click', async () => {
      const l = LOTS.find(x => x.id === b.dataset.id);
      if (!await confirmDlg(`Mua ${l.name} giá ${tien(l.price)}?`)) return;
      const [ok, err] = muaDat(b.dataset.id);
      if (err) { toast(err); return; }
      toast(`Đã mua ${ok.name}!`);
      tab = 'nha';
      drawTopBar(); draw();
    }));

    el.querySelectorAll('.es-build').forEach(b => b.addEventListener('click', async () => {
      const [r, err] = dungNha(b.dataset.id);
      if (err) { toast(err); return; }
      const bo = donGonTheoO();
      toast(`Đã dựng ${r.base.name}!${bo ? ` (${bo} món phải gỡ về kho)` : ''}`);
      tab = 'trong';
      drawTopBar(); draw();
    }));

    el.querySelectorAll('.es-buy-do').forEach(b => b.addEventListener('click', () => {
      const [f, err] = muaDo(b.dataset.id);
      if (err) { toast(err); return; }
      toast(`Đã mua ${f.name}.`);
      drawTopBar(); draw();
    }));

    el.querySelectorAll('.es-take').forEach(b => b.addEventListener('click', () => {
      dangKe = b.dataset.id;
      tab = 'trong';
      draw();
    }));

    el.querySelector('#es-huy')?.addEventListener('click', () => { dangKe = null; draw(); });

    el.querySelectorAll('.es-cell').forEach(c => c.addEventListener('click', () => {
      const x = Number(c.dataset.x), y = Number(c.dataset.y);
      if (dangKe) {
        const [, err] = ke(dangKe, x, y);
        if (err) { toast(err); return; }
        if (!conTrongKho(dangKe)) dangKe = null;
        draw();
        return;
      }
      const [d, err] = go(x, y);
      if (err) return;                       // ô trống thì thôi, không cần báo
      toast(`Đã gỡ ${FURN_BY_ID[d.id]?.name || d.id} về kho.`);
      draw();
    }));
  }

  draw();

  // Vợ/chồng ra vào nhà nhau — chỉ có nghĩa khi đã nối máy chủ
  if (isOnlineMode() && getToken()) {
    api.fetchMarriage().then(r => {
      const ten = r.ok && !r.data?.pending ? r.data?.partner?.username : null;
      if (ten && ten !== banDoi) { banDoi = ten; draw(); }
    }).catch(() => {});
  }
}
