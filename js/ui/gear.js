// TuxeWorld H5 | ui/gear.js | Màn Trang Bị: kho đồ + lò rèn
//
// Trang bị KHÔNG bán ở đâu cả — chỉ rơi từ Tuxemon hoang, từ boss, và thi
// thoảng nhặt được bên vệ đường. Ở đây chỉ có việc dùng đồ đã kiếm được: đeo,
// cường hoá, nâng sao, thu hồi món thừa.
//
// Đá nâng cấp thì mua ở LÒ RÈN trong Khu Dân Cư (bác Thép). Vào màn này bằng
// tham số tab:'da' là chỉ hiện đúng quầy đá của bác ấy.
import { G } from '../state.js';
import * as GR from '../engine/gear.js';
import { GEAR_BY_ID, anhGear, SAO_TOI_DA } from '../data/gear.js';
import { displayName } from '../engine/monster.js';
import { monImg } from '../engine/monskin.js';
import { esc, tien, tienChu } from '../util.js';
import { toast, choose, header, confirmDlg } from './kit.js';
import { show } from '../main.js';

const TEN_CHI_SO = { hp: 'HP', armour: 'Giáp', dodge: 'Né tránh',
  melee: 'Cận chiến', ranged: 'Tầm xa', speed: 'Tốc độ' };

const sao = (n) => '★'.repeat(n) + '☆'.repeat(SAO_TOI_DA - n);

export function render(el, { tab = 'kho', from = 'menu' } = {}) {
  GR.duLieu();
  const quayDa = tab === 'da';

  function dongKho(v) {
    const m = GEAR_BY_ID[v.id];
    const chu = GR.aiDangDeo(v.u);
    return `<div class="card gr-row">
      <div class="gr-head">
        <img class="gr-img" src="${anhGear(v.id, v.sao)}" width="46" height="46"
             alt="" loading="lazy">
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
        ${chu ? '' : `<button class="btn btn-sm gr-thu" data-u="${v.u}">Thu hồi</button>`}
      </div>
    </div>`;
  }

  function ve() {
    const ds = GR.kho();
    const raSo = ds.filter(v => !GR.aiDangDeo(v.u) && (v.sao || 1) === 1).length;
    el.innerHTML = quayDa ? `
      ${header('Lò Rèn Bác Thép', from)}
      ${quayDaHtml()}`
      : `
      ${header('Trang Bị', from)}
      <div class="gr-tom">
        ${Object.entries(GR.DA).map(([k, d]) => `<span class="gr-da-o">
          <img src="${d.img}" width="24" height="24" alt=""><b>${GR.soDa(k)}</b>
          <small>${esc(d.name)}</small></span>`).join('')}
      </div>
      ${ds.length ? `
        ${raSo > 1 ? `<button class="btn btn-sm" id="gr-thu-all">Thu hồi ${raSo} món 1★ đang rảnh</button>` : ''}
        ${ds.map(dongKho).join('')}`
        : `<div class="card empty-note">Chưa nhặt được món nào.
             Trang bị rơi từ Tuxemon hoang, từ boss, và thi thoảng nằm bên vệ đường —
             không nơi nào bán.</div>`}
    `;

    if (quayDa) {
      el.querySelectorAll('.gr-mua-da').forEach(b => b.addEventListener('click', () => {
        const [ok, err] = GR.muaDa(b.dataset.loai, Number(b.dataset.n) || 1);
        toast(err || ok);
        ve();
      }));
      return;
    }

    const btnAll = el.querySelector('#gr-thu-all');
    if (btnAll) btnAll.addEventListener('click', async () => {
      if (!await confirmDlg(`Thu hồi hết ${raSo} món 1★ đang không ai đeo?\n`
        + 'Đổi lại lấy Đá Cường Hoá.', 'Thu hồi')) return;
      const [ok, err] = GR.thuHoiHangLoat(1);
      toast(err || ok);
      ve();
    });

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
      const [ok, err] = GR.thao(chu, GEAR_BY_ID[GR.timMon(uid).id].o);
      toast(err || ok);
      ve();
    }));

    el.querySelectorAll('.gr-cuong').forEach(b => b.addEventListener('click', async () => {
      const v = GR.timMon(Number(b.dataset.u));
      if (!v) return;
      const ti = Math.round(GR.tiLeCuong(v.cuong) * 100);
      if (!await confirmDlg(`Cường hoá +${v.cuong} → +${v.cuong + 1}?\n`
        + `Tốn ${tienChu(GR.giaCuong(v.cuong))} + 1 ${GR.DA.cuong.name}.\n`
        + `Tỉ lệ ${ti}% — hỏng thì mất đá và tiền nhưng giữ nguyên cấp.`,
      'Cường hoá')) return;
      const [kq, err] = GR.cuongHoa(v.u);
      toast(err || kq.msg);
      ve();
    }));

    el.querySelectorAll('.gr-nang').forEach(b => b.addEventListener('click', async () => {
      const v = GR.timMon(Number(b.dataset.u));
      if (!v) return;
      if (!await confirmDlg(`Nâng ${v.sao}★ → ${v.sao + 1}★?\n`
        + `Tốn ${tienChu(GR.giaSao(v.sao))} + ${GR.daSaoCan(v.sao)} ${GR.DA.sao.name}.\n`
        + 'Chắc chắn được, và món đồ đổi hẳn hình dạng.', 'Nâng sao')) return;
      const [ok, err] = GR.nangSao(v.u);
      toast(err || ok);
      ve();
    }));

    el.querySelectorAll('.gr-thu').forEach(b => b.addEventListener('click', async () => {
      const v = GR.timMon(Number(b.dataset.u));
      if (!v) return;
      if (!await confirmDlg(`Thu hồi món này lấy ${GR.daThuHoi(v)} ${GR.DA.cuong.name}?\n`
        + 'Món đồ mất luôn cùng cấp cường hoá và bậc sao.', 'Thu hồi')) return;
      const [ok, err] = GR.thuHoi(v.u);
      toast(err || ok);
      ve();
    }));
  }

  // Quầy của bác Thép: chỉ bán đá, không bán trang bị
  function quayDaHtml() {
    return Object.entries(GR.DA).map(([k, d]) => `
      <div class="card gr-row">
        <div class="gr-head">
          <img class="gr-img" src="${d.img}" width="46" height="46" alt="">
          <div class="gr-mid">
            <b>${esc(d.name)}</b>
            <small>Đang có <b class="gr-num">${GR.soDa(k)}</b></small>
            <small>${k === 'cuong' ? 'Dùng để cường hoá +1 mỗi lần.'
                                   : 'Dùng để nâng sao — món đồ đổi hình dạng.'}</small>
          </div>
        </div>
        <div class="gr-btns">
          <button class="btn btn-sm gr-mua-da" data-loai="${k}" data-n="1">×1 · ${tien(d.gia)}</button>
          <button class="btn btn-sm btn-primary gr-mua-da" data-loai="${k}" data-n="10">×10 · ${tien(d.gia * 10)}</button>
        </div>
      </div>`).join('');
  }

  ve();
}
