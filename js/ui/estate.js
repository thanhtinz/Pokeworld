// TuxeWorld H5 | ui/estate.js | Khu Đất Mới: mua đất, dựng nhà, trang trí
import { esc, fmt, tien } from '../util.js';
import { toast, header, confirmDlg } from './kit.js';
import { uiIcon } from './icons.js';
import { G } from '../state.js';
// KHÔNG dùng refresh() ở màn này: refresh() gọi lại show() nên render() chạy
// từ đầu và tab đang mở bị đặt lại — bấm nút xong là mất chỗ. Chỉ cần vẽ lại
// thanh trên cho số tiền đúng.
import { drawTopBar } from '../main.js';
import { FURNITURE, FURN_BY_ID, NHOM_DO } from '../data/estate.js';
import { TEN_TUONG_TAC } from '../engine/furniture.js';
import {
  muaDo, conTrongKho, tomTat, dangXay, conLaiChu, soMonToiDa,
} from '../engine/estate.js';
import { isOnlineMode, getToken } from '../net/config.js';
import * as api from '../net/api.js';

export function render(el, { from = 'menu' } = {}) {
  let tab = 'cho';                       // cho | tinhtrang
  let nhom = NHOM_DO[0].id;              // nhóm đồ đang xem trong cửa hàng
  let banDoi = null;                     // tên vợ/chồng, chỉ có khi nối máy chủ

  // ==== Bảng tình trạng nhà cửa ====
  function veTinhTrang() {
    const t = tomTat();
    if (!t.lot) {
      return `<div class="card empty-note">Bạn chưa có đất. Từ Thị Trấn Taba đi
        theo biển chỉ đường vào <b>Khu Dân Cư</b>, lô nào cắm biển <b>BÁN</b> thì
        đứng trước biển bấm nút hành động để mua.</div>`;
    }
    const dong = [['Lô đất', t.lot.name]];
    if (!t.base) dong.push(['Nhà', 'chưa dựng — bấm vào lô đất trên bản đồ để chọn mẫu']);
    else if (dangXay()) dong.push(['Đang xây', `${t.base.name} · còn ${conLaiChu()}`]);
    else {
      dong.push(['Mẫu nhà', t.base.name]);
      dong.push(['Đồ đã kê', `${t.daKe}/${soMonToiDa()} món`]);
    }
    dong.push(['Đồ trong kho', `${t.trongKho} món`]);
    dong.push(['Tổng giá trị', tien(t.giaTri)]);
    return `<div class="card"><div class="tcard-rows">
      ${dong.map(([k, v]) => `<div class="tcard-row"><span class="tcard-k">${esc(k)}</span>
        <i class="tcard-dots"></i><b class="tcard-v">${esc(String(v))}</b></div>`).join('')}
    </div></div>`;
  }

  // ==== Kho + cửa hàng đồ ====
  // Hơn bảy chục món nên phải chia nhóm, đổ hết một lượt thì cuộn mỏi tay.
  function veCho() {
    const ds = FURNITURE.filter(f => (f.nhom || 'kho') === nhom);
    return `
      <div class="card"><p class="es-note">Mua đồ về kho, rồi vào nhà bật
      <b>Trang trí</b> để kê. Món nào ghi <b>nằm / ngồi</b> thì kê xong
      vào dùng được.</p></div>
      <div class="seg-row seg-wrap">
        ${NHOM_DO.map(n => `<button type="button"
          class="seg-btn ${nhom === n.id ? 'active' : ''}"
          data-nhom="${esc(n.id)}">${esc(n.name)}</button>`).join('')}
      </div>
      <div class="ev-grid">
        ${ds.map(f => {
          const co = conTrongKho(f.id);
          const t = TEN_TUONG_TAC[f.kind];
          return `<div class="card ev-item">
            <img class="es-shop-img" src="${esc(f.img)}" alt="">
            <b>${esc(f.name)}</b>
            <small>${f.w}×${f.h} ô${t ? ` · ${esc(t)}` : ''}</small>
            ${co ? `<small class="ev-limit">Trong kho: ${co}</small>` : ''}
            <button class="btn btn-sm btn-primary es-buy-do" data-id="${esc(f.id)}">
              ${tien(f.price)}</button>
          </div>`;
        }).join('')}
      </div>`;
  }

  function draw() {
    const TAB = [['cho', 'Cửa hàng nội thất'], ['tinhtrang', 'Nhà của tôi']];

    el.innerHTML = `
      ${header('Bác Thợ Mộc', from)}
      <div class="seg-row">
        ${TAB.map(([k, ten]) =>
          `<button type="button" class="seg-btn ${tab === k ? 'active' : ''}"
             data-tab="${k}">${ten}</button>`).join('')}
      </div>
      ${tab === 'cho' ? veCho() : veTinhTrang()}
      ${banDoi && tomTat().base ? `<div class="card es-share">
        ${uiIcon('heart', 16)} Bạn đời <b>${esc(banDoi)}</b> ra vào nhà này thoải mái.
      </div>` : ''}`;

    el.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
      tab = b.dataset.tab; draw();
    }));
    el.querySelectorAll('[data-nhom]').forEach(b => b.addEventListener('click', () => {
      nhom = b.dataset.nhom; draw();
    }));



    el.querySelectorAll('.es-buy-do').forEach(b => b.addEventListener('click', () => {
      const [f, err] = muaDo(b.dataset.id);
      if (err) { toast(err); return; }
      toast(`Đã mua ${f.name}.`);
      drawTopBar(); draw();
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
