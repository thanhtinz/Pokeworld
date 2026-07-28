// TuxeWorld H5 | ui/gear.js | Màn Trang Bị: kho đồ, lò rèn, cửa hàng
//
// Ba việc gom một màn cho khỏi nhảy qua nhảy lại: xem/đeo đồ đang có, cường
// hoá và nâng sao ngay tại chỗ, và mua món mới.
import { G, save } from '../state.js';
import * as GR from '../engine/gear.js';
import { GEAR, GEAR_BY_ID, O_TRANG_BI, O_BY_ID, anhGear, SAO_TOI_DA }
  from '../data/gear.js';
import { HO_TRANG_BI } from '../data/gear.js';
import { displayName } from '../engine/monster.js';
import { monImg } from '../engine/monskin.js';
import { esc, fmt, tien, tienChu } from '../util.js';
import { toast, choose, header, confirmDlg } from './kit.js';
import { show, refresh } from '../main.js';

const TEN_CHI_SO = { hp: 'HP', armour: 'Giáp', dodge: 'Né tránh',
  melee: 'Cận chiến', ranged: 'Tầm xa', speed: 'Tốc độ' };

const sao = (n) => '★'.repeat(n) + '☆'.repeat(SAO_TOI_DA - n);

export function render(el, { tab = 'kho' } = {}) {
  GR.duLieu();
  let cua = tab;

  // Ảnh một món trong kho, đúng bậc sao của nó
  function anh(v, size = 46) {
    return `<img class="gr-img" src="${anhGear(v.id, v.sao)}" width="${size}"
      height="${size}" alt="" loading="lazy">`;
  }

  function dongKho(v) {
    const m = GEAR_BY_ID[v.id];
    const chu = GR.aiDangDeo(v.u);
    return `<div class="card gr-row" data-u="${v.u}">
      <div class="gr-head">
        ${anh(v)}
        <div class="gr-mid">
          <b>${esc(m.name)} ${v.cuong ? `<span class="gr-plus">+${v.cuong}</span>` : ''}</b>
          <small class="gr-sao">${sao(v.sao)}</small>
          <small>${TEN_CHI_SO[m.stat]} <b class="gr-num">+${GR.giaTri(v)}</b></small>
          ${chu ? `<small class="gr-deo">Đang đeo: ${esc(displayName(chu))}</small>` : ''}
        </div>
      </div>
      <div class="gr-btns">
        <button class="btn btn-sm gr-deo-btn" data-u="${v.u}">${chu ? 'Đổi con' : 'Trang bị'}</button>
        ${chu ? `<button class="btn btn-sm gr-thao" data-u="${v.u}">Tháo</button>` : ''}
        <button class="btn btn-sm gr-cuong" data-u="${v.u}"
          ${v.cuong >= GR.CUONG_TOI_DA ? 'disabled' : ''}>Cường hoá</button>
        <button class="btn btn-sm btn-primary gr-nang" data-u="${v.u}"
          ${v.sao >= SAO_TOI_DA ? 'disabled' : ''}>Nâng sao</button>
        ${chu ? '' : `<button class="btn btn-sm gr-ban" data-u="${v.u}">Bán</button>`}
      </div>
    </div>`;
  }

  function dongTiem(m) {
    return `<div class="card gr-row">
      <div class="gr-head">
        <img class="gr-img" src="${anhGear(m.id, 1)}" width="46" height="46" alt="">
        <div class="gr-mid">
          <b>${esc(m.name)}</b>
          <small class="gr-sao">${sao(1)}</small>
          <small>${TEN_CHI_SO[m.stat]} <b class="gr-num">+${m.base}</b> · ${esc(HO_TRANG_BI[m.ho].name)}</small>
        </div>
      </div>
      <div class="gr-btns">
        <button class="btn btn-sm btn-primary gr-mua" data-id="${esc(m.id)}">${tien(m.gia)}</button>
      </div>
    </div>`;
  }

  function ve() {
    const ds = GR.kho();
    el.innerHTML = `
      ${header('Trang Bị', 'menu')}
      <div class="seg-row">
        <button type="button" class="seg-btn ${cua === 'kho' ? 'active' : ''}" data-tab="kho">Kho đồ (${ds.length})</button>
        <button type="button" class="seg-btn ${cua === 'tiem' ? 'active' : ''}" data-tab="tiem">Cửa hàng</button>
      </div>

      <div class="card gr-da">
        ${Object.entries(GR.DA).map(([k, d]) => `
          <span class="gr-da-o">
            <img src="${d.img}" width="26" height="26" alt="">
            <b>${esc(d.name)}</b><i>×${GR.soDa(k)}</i>
            <button class="btn btn-sm gr-mua-da" data-loai="${k}">${tien(d.gia)}</button>
          </span>`).join('')}
      </div>

      ${cua === 'kho' ? (ds.length ? `
        <div class="card gr-note">
          <small>Sáu ô: ${O_TRANG_BI.map(o => `${esc(o.name)} → ${TEN_CHI_SO[o.stat]}`).join(' · ')}.
          <b>Cường hoá</b> rẻ nhưng càng cao càng dễ hỏng (hỏng thì giữ nguyên cấp,
          không tụt). <b>Nâng sao</b> chắc chắn được và đổi hẳn hình dạng món đồ.</small>
        </div>
        ${ds.map(dongKho).join('')}`
        : '<div class="card empty-note">Chưa có món nào. Sang Cửa hàng sắm một bộ đi.</div>')
      : GEAR.map(dongTiem).join('')}
    `;

    el.querySelectorAll('[data-tab]').forEach(b =>
      b.addEventListener('click', () => { cua = b.dataset.tab; ve(); }));

    el.querySelectorAll('.gr-mua-da').forEach(b => b.addEventListener('click', () => {
      const [ok, err] = GR.muaDa(b.dataset.loai, 1);
      toast(err || ok);
      ve();
    }));

    el.querySelectorAll('.gr-mua').forEach(b => b.addEventListener('click', () => {
      const [ok, err] = GR.mua(b.dataset.id);
      toast(err || ok);
      ve();
    }));

    el.querySelectorAll('.gr-deo-btn').forEach(b => b.addEventListener('click', async () => {
      const uid = Number(b.dataset.u);
      const doi = G.p.party || [];
      if (!doi.length) { toast('Chưa có Tuxemon nào trong đội.'); return; }
      const i = await choose('Đeo cho con nào?', doi.map(m => ({
        html: `<img class="px-icon" src="${monImg(m)}" width="28" height="28" alt=""> ${esc(displayName(m))}`,
        label: displayName(m),
        sub: `Lv.${m.lv}`,
      })));
      if (i === null) return;
      const [ok, err] = GR.deo(doi[i], uid);
      toast(err || ok);
      ve();
    }));

    el.querySelectorAll('.gr-thao').forEach(b => b.addEventListener('click', () => {
      const uid = Number(b.dataset.u);
      const chu = GR.aiDangDeo(uid);
      const m = GEAR_BY_ID[GR.timMon(uid).id];
      const [ok, err] = GR.thao(chu, m.o);
      toast(err || ok);
      ve();
    }));

    el.querySelectorAll('.gr-cuong').forEach(b => b.addEventListener('click', async () => {
      const uid = Number(b.dataset.u);
      const v = GR.timMon(uid);
      if (!v) return;
      const ti = Math.round(GR.tiLeCuong(v.cuong) * 100);
      const dong = await confirmDlg(
        `Cường hoá +${v.cuong} → +${v.cuong + 1}?\n`
        + `Tốn ${tienChu(GR.giaCuong(v.cuong))} + 1 ${GR.DA.cuong.name}.\n`
        + `Tỉ lệ thành công ${ti}% — hỏng thì mất đá và tiền nhưng giữ nguyên cấp.`,
        'Cường hoá');
      if (!dong) return;
      const [kq, err] = GR.cuongHoa(uid);
      toast(err || kq.msg);
      ve();
    }));

    el.querySelectorAll('.gr-nang').forEach(b => b.addEventListener('click', async () => {
      const uid = Number(b.dataset.u);
      const v = GR.timMon(uid);
      if (!v) return;
      const dong = await confirmDlg(
        `Nâng ${v.sao}★ → ${v.sao + 1}★?\n`
        + `Tốn ${tienChu(GR.giaSao(v.sao))} + ${GR.daSaoCan(v.sao)} ${GR.DA.sao.name}.\n`
        + 'Chắc chắn thành công, và món đồ sẽ đổi hẳn hình dạng.',
        'Nâng sao');
      if (!dong) return;
      const [ok, err] = GR.nangSao(uid);
      toast(err || ok);
      ve();
    }));

    el.querySelectorAll('.gr-ban').forEach(b => b.addEventListener('click', async () => {
      const uid = Number(b.dataset.u);
      const v = GR.timMon(uid);
      if (!v) return;
      const dong = await confirmDlg(
        `Bán món này được lại ${tienChu(GR.giaBan(v))}.\n`
        + 'Bán rồi là mất luôn cấp cường hoá và bậc sao.', 'Bán');
      if (!dong) return;
      const [ok, err] = GR.ban(uid);
      toast(err || ok);
      ve();
    }));
  }

  ve();
}
