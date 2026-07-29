// TuxeWorld H5 | ui/cauca.js | Sổ cá: giỏ, bể nuôi, dex
//
// Ba thẻ dùng chung một màn:
//   'gio' — cá vừa bắt: bán lấy tiền hoặc thả vào bể
//   'be'  — bể nuôi, ngắm là chính, cần tiền thì vớt ra bán
//   'dex' — đã gặp loài nào, kỷ lục dài nhất từng loài
//
// CÂU CÁ KHÔNG NẰM Ở ĐÂY. Đứng quay mặt ra mặt nước trên bản đồ rồi bấm A là
// quăng cần, thanh lực vẽ thẳng lên bản đồ. Trước đây còn một thẻ 'Câu' làm
// đúng việc đó bằng nút bấm trong panel — hai đường cho một việc, mà đường
// trong panel thì đứng ở đâu cũng câu được, chẳng cần ra tới bờ nước.
// Mua cần cũng dời ra bản đồ: nói chuyện với Ông Lái Cá bên hồ.
import * as F from '../engine/cauca.js';
import { anhCa } from '../data/ca.js';
import { esc, tien, tienChu } from '../util.js';
import { toast, header } from './kit.js';

const HIEM_BY = Object.fromEntries(F.HIEM.map(h => [h.bac, h]));

export function render(el, { tab = 'gio', from = 'menu' } = {}) {
  F.kho();

  const theCa = (c, phu = '') => {
    const d = F.CA_BY_ID[c.id];
    const h = HIEM_BY[d.hiem];
    return `<span class="cc-ca-anh"><img src="${esc(anhCa(c.id))}" alt=""></span>
      <b>${esc(d.name)}</b>
      <small style="color:${esc(h.mau)}">${esc(h.name)} · ${c.dai} cm</small>
      ${phu}`;
  };

  function veGio() {
    const k = F.kho();
    if (!k.gio.length) return '<div class="card empty-note">Giỏ trống. Ra câu vài con đã.</div>';
    const tongTien = k.gio.reduce((a, c) => a + F.giaCa(c), 0);
    return `
      <div class="card ck-tong">
        <span>Giỏ: <b>${k.gio.length}/${F.GIO_TOI_DA}</b></span>
        <button class="btn btn-sm btn-primary" id="ck-banhet">Bán hết ${tien(tongTien)}</button>
      </div>
      <div class="ck-luoi">${k.gio.map((c, i) => `<div class="card ck-o">
        ${theCa(c, `<span class="ck-gia">${tien(F.giaCa(c))}</span>`)}
        <span class="ck-o-nut">
          <button class="btn btn-sm btn-primary ck-ban" data-i="${i}">Bán</button>
          <button class="btn btn-sm ck-tha-be" data-i="${i}">Vào bể</button>
        </span>
      </div>`).join('')}</div>`;
  }

  function veBe() {
    const k = F.kho();
    return `
      <div class="card ck-tong"><span>Bể: <b>${k.be.length}/${F.BE_TOI_DA}</b></span>
        <small>Nuôi cho vui mắt; cần tiền thì vớt ra giỏ rồi bán.</small></div>
      ${k.be.length
        ? `<div class="ck-luoi">${k.be.map((c, i) => `<div class="card ck-o">
            ${theCa(c)}
            <span class="ck-o-nut">
              <button class="btn btn-sm ck-vot" data-i="${i}">Vớt ra giỏ</button>
            </span></div>`).join('')}</div>`
        : '<div class="card empty-note">Bể đang trống.</div>'}`;
  }

  function veDex() {
    const k = F.kho();
    return `
      <div class="card ck-tong">
        <span>Đã gặp <b>${F.soLoaiDaBat()}/${F.CA.length}</b> loài</span>
        <span>Điểm xếp hạng: <b>${F.diemCauCa()}</b></span>
      </div>
      ${F.CHO_CAU.map(nc => `
        <h3 class="ck-h3">${esc(nc.name)}</h3>
        <div class="ck-luoi">${F.CA.filter(c => c.cho === nc.id).map(c => {
          const co = k.dex[c.id];
          const h = HIEM_BY[c.hiem];
          return `<div class="card ck-o ${co ? '' : 'chua'}">
            <span class="cc-ca-anh"><img src="${esc(anhCa(c.id))}" alt=""></span>
            <b>${co ? esc(c.name) : '???'}</b>
            <small style="color:${esc(h.mau)}">${esc(h.name)}</small>
            ${co ? `<small>Kỷ lục ${co.dai} cm · bắt ${co.soLan} lần</small>
                    <small class="ck-desc">${esc(c.desc)}</small>`
                 : `<small>Dài ${c.dai[0]}–${c.dai[1]} cm</small>`}
          </div>`;
        }).join('')}</div>`).join('')}`;
  }

  function ve() {
    el.innerHTML = `
      ${header('Sổ Cá', from)}
      <div class="ck-tab">
        ${[['gio', 'Giỏ'], ['be', 'Bể Nuôi'], ['dex', 'Dex Cá']]
          .map(([k, t]) => `<button type="button" class="seg-btn ${tab === k ? 'active' : ''}"
            data-tab="${k}">${t}</button>`).join('')}
      </div>
      ${tab === 'gio' ? veGio() : tab === 'be' ? veBe() : veDex()}`;

    el.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
      tab = b.dataset.tab;
      ve();
    }));

    el.querySelectorAll('.ck-ban').forEach(b => b.addEventListener('click', () => {
      const [r, err] = F.banCa(+b.dataset.i);
      toast(err || `Bán ${r.name} ${r.dai} cm được ${tienChu(r.tien)}.`);
      ve();
    }));
    el.querySelector('#ck-banhet')?.addEventListener('click', () => {
      const [r, err] = F.banHet();
      toast(err || `Bán ${r.n} con, thu ${tienChu(r.tien)}.`);
      ve();
    });
    el.querySelectorAll('.ck-tha-be').forEach(b => b.addEventListener('click', () => {
      const [ok, err] = F.thaVaoBe(+b.dataset.i); toast(err || ok); ve();
    }));
    el.querySelectorAll('.ck-vot').forEach(b => b.addEventListener('click', () => {
      const [ok, err] = F.votKhoiBe(+b.dataset.i); toast(err || ok); ve();
    }));
  }

  ve();
}
