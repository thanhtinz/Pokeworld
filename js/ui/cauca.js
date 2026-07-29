// TuxeWorld H5 | ui/cauca.js | Câu cá: buông cần, giỏ, bể nuôi, dex, xếp hạng
//
// Bốn thẻ dùng chung một màn:
//   'cau' — chọn chỗ, buông cần, canh lúc phao giật
//   'gio' — cá vừa bắt: bán lấy tiền hoặc thả vào bể
//   'be'  — bể nuôi, ngắm là chính, cần tiền thì vớt ra bán
//   'dex' — đã gặp loài nào, kỷ lục dài nhất từng loài
//
// Nhịp câu cố ý KHÔNG hiện đếm ngược: phải nhìn cái phao. Hiện số thì chỉ còn
// là bấm đúng lúc màn hình bảo bấm, chẳng khác gì bấm nút.
import { G, save } from '../state.js';
import * as F from '../engine/cauca.js';
import { anhCa } from '../data/ca.js';
import { esc, tien, tienChu } from '../util.js';
import { toast, header } from './kit.js';

const HIEM_BY = Object.fromEntries(F.HIEM.map(h => [h.bac, h]));

export function render(el, { tab = 'cau', from = 'menu' } = {}) {
  F.kho();
  let cho = F.CHO_CAU[0].id;
  let pha = 'nghi';          // nghi | doi | ria | xong
  let con = null;            // con đang cắn câu
  let luc = 0;               // mốc thời gian cá bắt đầu rỉa
  let hen = null;            // setTimeout đang chờ
  let tin = '';              // dòng chữ dưới cái phao

  const donDep = () => { clearTimeout(hen); hen = null; };
  el.addEventListener('screen-leave', donDep, { once: true });

  const theCa = (c, phu = '') => {
    const d = F.CA_BY_ID[c.id];
    const h = HIEM_BY[d.hiem];
    return `<span class="cc-ca-anh"><img src="${esc(anhCa(c.id))}" alt=""></span>
      <b>${esc(d.name)}</b>
      <small style="color:${esc(h.mau)}">${esc(h.name)} · ${c.dai} cm</small>
      ${phu}`;
  };

  function veCau() {
    const can = F.canDangDung();
    const ds = F.caODay(cho);
    return `
      <div class="ck-cho">
        ${F.CHO_CAU.map(c => `<button type="button" class="seg-btn ${c.id === cho ? 'active' : ''}"
          data-cho="${esc(c.id)}" ${pha === 'nghi' ? '' : 'disabled'}>${esc(c.name)}</button>`).join('')}
      </div>
      <p class="ck-mo">${esc(F.CHO_CAU.find(c => c.id === cho).desc)}</p>

      <div class="card ck-ho ${pha}">
        <div class="ck-phao"></div>
        <p class="ck-tin">${esc(tin || 'Buông cần rồi chờ phao giật.')}</p>
      </div>

      <div class="ck-nut">
        ${pha === 'nghi'
          ? '<button class="btn btn-primary" id="ck-tha">Buông cần</button>'
          : pha === 'xong'
            ? '<button class="btn btn-primary" id="ck-tha">Câu tiếp</button>'
            : '<button class="btn btn-primary" id="ck-giat">Giật!</button>'}
      </div>

      <div class="card ck-can">
        <b>${esc(can.name)}</b>
        <small>${esc(can.desc)}</small>
        <span class="ck-can-so">Chỗ này với tới ${ds.length}/${
          F.CA.filter(c => c.cho === cho).length} loài</span>
      </div>
      <div class="ck-canmua">
        ${F.CAN.map(c => {
          const co = F.coCan(c.id);
          const dang = c.id === can.id;
          return `<button type="button" class="card ck-can-o ${dang ? 'chon' : ''}"
            data-can="${esc(c.id)}">
            <b>${esc(c.name)}</b><small>${esc(c.desc)}</small>
            <span class="ck-can-nut">${dang ? 'Đang dùng' : co ? 'Đổi sang' : tien(c.gia)}</span>
          </button>`;
        }).join('')}
      </div>`;
  }

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
      ${header('Câu Cá', from)}
      <div class="ck-tab">
        ${[['cau', 'Câu'], ['gio', 'Giỏ'], ['be', 'Bể Nuôi'], ['dex', 'Dex Cá']]
          .map(([k, t]) => `<button type="button" class="seg-btn ${tab === k ? 'active' : ''}"
            data-tab="${k}">${t}</button>`).join('')}
      </div>
      ${tab === 'cau' ? veCau() : tab === 'gio' ? veGio()
        : tab === 'be' ? veBe() : veDex()}`;

    el.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.tab !== 'cau') { donDep(); pha = 'nghi'; con = null; tin = ''; }
      tab = b.dataset.tab;
      ve();
    }));
    el.querySelectorAll('[data-cho]').forEach(b => b.addEventListener('click', () => {
      cho = b.dataset.cho; ve();
    }));
    el.querySelectorAll('[data-can]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.can;
      const [ok, err] = F.coCan(id) ? F.doiCan(id) : F.muaCan(id);
      toast(err || ok);
      ve();
    }));
    el.querySelector('#ck-tha')?.addEventListener('click', thaCan);
    el.querySelector('#ck-giat')?.addEventListener('click', giat);

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

  function thaCan() {
    donDep();
    con = F.caRia(cho);
    if (!con) { toast('Chỗ này cần của bạn chưa với tới con nào.'); return; }
    pha = 'doi'; tin = 'Phao đang nổi... chờ đã.'; ve();
    hen = setTimeout(() => {
      pha = 'ria'; luc = Date.now();
      tin = 'PHAO GIẬT! Giật ngay!';
      ve();
      // Quá cửa sổ mà không giật thì cá tha mồi đi
      hen = setTimeout(() => {
        if (pha !== 'ria') return;
        F.giatCan(con, 1e9);
        pha = 'xong'; con = null; tin = 'Chậm mất rồi, nó tha mồi đi.'; ve();
      }, F.cuaSo() + 60);
    }, F.buongCan());
  }

  function giat() {
    donDep();
    if (pha === 'doi') {
      F.giatCan(con, -1);
      pha = 'xong'; con = null; tin = 'Giật sớm quá, cá nhả mất rồi.'; ve();
      return;
    }
    const [r, err] = F.giatCan(con, Date.now() - luc);
    pha = 'xong'; con = null;
    if (err) { tin = err; ve(); return; }
    const d = F.CA_BY_ID[r.id];
    tin = `Được ${d.name} ${r.dai} cm!`;
    toast(`${r.moi ? 'Loài mới! ' : r.kyLuc ? 'Kỷ lục mới! ' : ''}${d.name} ${r.dai} cm`);
    save();
    ve();
  }

  ve();
}
