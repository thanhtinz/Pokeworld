// TuxeWorld H5 | ui/daycare.js | Nhà Trẻ
//
// Chơi offline vẫn được — mọi thứ nằm trong bản lưu trên máy.
import { esc, fmt, tien, monLocalSrc, monFallbackAttr } from '../util.js';
import { toast, header, confirmDlg, choose } from './kit.js';
import { uiIcon } from './icons.js';
import { G } from '../state.js';
import { displayName } from '../engine/monster.js';
import { refresh } from '../main.js';
import {
  kho, cheDo, sanSang, ghepDuoc, gui, nhanVe, layConNon,
  TOI_DA, BUOC_CAN, EXP_MOI_BUOC, TIEN_MOI_EXP,
} from '../engine/daycare.js';

const TEN_CHE_DO = {
  trong: 'Đang trống',
  renluyen: 'Đang rèn luyện',
  nhangiong: 'Đang làm quen',
  nuaduong: 'Đã quen nhau',
  sansang: 'Có con non!',
};

const GIOI = { m: '♂', f: '♀', n: '⚲' };

export function render(el) {
  function theMon(m) {
    return `<div class="dc-mon">
      <img src="${monLocalSrc(m)}" alt="" onerror="${monFallbackAttr(m)}">
      <b>${esc(displayName(m))}</b>
      <small>Lv.${m.lv} ${GIOI[m.gender] || ''}</small>
    </div>`;
  }

  function draw() {
    const d = kho();
    const md = cheDo();
    const cap = d.mons.length === 2 && ghepDuoc(d.mons[0], d.mons[1]);
    const pc = Math.min(100, Math.round(d.buoc / BUOC_CAN * 100));
    const soCon = d.mons.length;
    const renLuyen = md === 'renluyen';
    // Rèn luyện: 2 con thì tốn gấp đôi vì cả hai cùng ăn EXP
    const expBuoc = soCon ? EXP_MOI_BUOC : 0;
    const tienBuoc = expBuoc * TIEN_MOI_EXP * soCon;

    el.innerHTML = `
      ${header('Nhà Trẻ', 'menu')}

      <div class="card dc-head">
        <b class="dc-mode ${md}">${TEN_CHE_DO[md]}</b>
        <p>Gửi tối đa <b>${TOI_DA} con</b>. Cứ mỗi bước bạn đi ngoài bản đồ,
        con gửi ở đây được <b>${EXP_MOI_BUOC} EXP</b> và bạn trả
        <b>${tien(TIEN_MOI_EXP)} mỗi EXP</b>. Gửi <b>một đực một cái</b> đã qua dạng
        cơ bản thì chúng còn sinh con non.</p>
      </div>

      <div class="card dc-slots">
        ${d.mons.length ? d.mons.map(theMon).join('')
          : '<div class="empty-note">Chưa gửi con nào.</div>'}
        ${d.mons.length < TOI_DA
          ? `<button class="dc-add" id="dc-add">+ Gửi thêm</button>` : ''}
      </div>

      ${d.mons.length ? `
        <div class="card">
          <div class="tcard-rows">
            ${[['Chế độ', TEN_CHE_DO[md]],
               // Chỉ chế độ rèn luyện mới cộng EXP và thu phí; cặp đang nhân
               // giống thì nhà trẻ trông không công.
               ...(renLuyen ? [
                 ['EXP mỗi bước', `${expBuoc} × ${soCon} con`],
                 ['Phí mỗi bước', tien(tienBuoc)]] : []),
               ['Tổng EXP đã cho', fmt(d.tongExp)],
               ['Tổng phí đã trả', tien(d.tongTien)]].map(([k, v]) => `
              <div class="tcard-row"><span class="tcard-k">${k}</span>
                <i class="tcard-dots"></i><b class="tcard-v">${v}</b></div>`).join('')}
          </div>
        </div>` : ''}

      ${cap ? `
        <div class="card dc-breed">
          <div class="ev-task-head"><b>Tiến độ nhân giống</b>
            <small>${fmt(Math.min(d.buoc, BUOC_CAN))} / ${fmt(BUOC_CAN)} bước</small></div>
          <div class="ev-prog"><i style="width:${pc}%"></i></div>
          <button class="btn ${sanSang() ? 'btn-primary' : ''}" id="dc-con"
            ${sanSang() ? '' : 'disabled'}>
            ${sanSang() ? 'Đón con non' : 'Chưa tới lúc'}</button>
        </div>`
      : d.mons.length === 2 ? `
        <div class="card empty-note">Hai con này không ghép đôi được (phải một
        đực một cái, và cả hai đã qua dạng cơ bản) — chỉ rèn luyện thôi.</div>` : ''}

      ${d.mons.length
        ? `<button class="btn dc-out" id="dc-out">Nhận hết về</button>` : ''}`;

    el.querySelector('#dc-add')?.addEventListener('click', async () => {
      if (G.p.party.length <= 1) { toast('Phải chừa lại ít nhất một con để đi đường.'); return; }
      // choose() trả về CHỈ SỐ trong danh sách, đúng bằng ô trong đội hình
      const i = await choose('Gửi con nào?', G.p.party.map(m => ({
        label: `${displayName(m)} ${GIOI[m.gender] || ''}`,
        sub: `Lv.${m.lv}`,
      })));
      if (i === null || i === undefined) return;
      const [, err] = gui(i);
      if (err) { toast(err); return; }
      refresh();
      draw();
    });

    el.querySelector('#dc-out')?.addEventListener('click', async () => {
      if (!await confirmDlg('Nhận hết về? Tiến độ nhân giống sẽ mất.')) return;
      const ds = nhanVe();
      toast(`Đã nhận về ${ds.length} con.`);
      refresh();
      draw();
    });

    el.querySelector('#dc-con')?.addEventListener('click', () => {
      const [con, err] = layConNon();
      if (err) { toast(err); return; }
      toast(`Chào mừng ${displayName(con)} Lv.${con.lv}!`);
      refresh();
      draw();
    });
  }

  draw();
}
