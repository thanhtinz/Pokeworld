// TuxeWorld H5 | ui/park.js | Công Viên Pepper
//
// Chơi offline vẫn được — mọi thứ nằm trong bản lưu trên máy.
import { esc, fmt, tien, monLocalSrc, monFallbackAttr } from '../util.js';
import { toast, header, itemIcon, confirmDlg } from './kit.js';
import { uiIcon } from './icons.js';
import { SPECIES } from '../data/species.js';
import { displayName } from '../engine/monster.js';
import { refresh } from '../main.js';
import {
  park, GIA_VE, BUOC, SO_BONG, BONG, LUOT_MOI_CON,
  vaoCongVien, buocTrongCongVien, nemBong, choAn, boQua, raCong,
} from '../engine/park.js';

export function render(el, { from = 'diadiem' } = {}) {
  let tongKet = null;      // bảng tổng kết sau khi ra cổng
  let dong = '';           // dòng kể chuyện dưới ảnh

  function veCong() {
    el.innerHTML = `
      ${header('Công Viên Pepper', from)}
      <div class="card park-gate">
        <b class="park-title">${GIA_VE > 0 ? `Vé vào cổng ${tien(GIA_VE)}` : 'Vào cổng miễn phí'}</b>
        <p>Trong công viên <b>không đánh nhau</b>. Bạn chỉ được ném
        ${itemIcon(BONG, '', 18)} <b>Tuxeball Công Viên</b>, cho ăn để nó bớt
        cảnh giác, hoặc bỏ qua đi tìm con khác.</p>
        <ul class="park-rule">
          <li>${uiIcon('walk', 15)} Được đi <b>${BUOC} bước</b></li>
          <li>${itemIcon(BONG, '', 15)} Mang theo <b>${SO_BONG} bóng</b></li>
          <li>${uiIcon('flag', 15)} Mỗi con chỉ đứng lại <b>${LUOT_MOI_CON} lượt</b></li>
        </ul>
        <button class="btn btn-primary" id="park-in">${GIA_VE > 0 ? 'Mua vé vào' : 'Vào công viên'}</button>
      </div>
      ${tongKet ? bangTongKet(tongKet) : ''}`;

    el.querySelector('#park-in').addEventListener('click', () => {
      const [d, err] = vaoCongVien();
      if (err) { toast(err); return; }
      tongKet = null;
      dong = 'Bạn bước qua cổng. Cỏ cao ngang gối, đâu đó có tiếng sột soạt.';
      refresh();
      veTrong();
    });
  }

  function bangTongKet(t) {
    return `
      <div class="card park-sum">
        <b class="park-title">Tổng kết chuyến đi</b>
        <div class="tcard-rows">
          ${[['Số lần ném', fmt(t.tong)],
             ['Bắt được', fmt(t.bat)],
             ['Ném hụt', fmt(t.hut)],
             ['Tỉ lệ bắt', `${Math.round(t.tiLe * 100)}%`],
             ['Số loài đã gặp', fmt(t.soLoai)],
             ['Bước còn thừa', fmt(t.buocConLai)]].map(([k, v]) => `
            <div class="tcard-row"><span class="tcard-k">${k}</span>
              <i class="tcard-dots"></i><b class="tcard-v">${v}</b></div>`).join('')}
        </div>
        ${t.hayGap.length ? `<b class="park-sub">Hay gặp nhất</b>
          <div class="park-top">${t.hayGap.map(([slug, n]) => {
            const sp = Object.entries(SPECIES).find(([, s]) => s.slug === slug);
            return `<span class="park-top-i">${sp
              ? `<img src="${monLocalSrc({ sp: Number(sp[0]) })}" alt=""
                   onerror="${monFallbackAttr({ sp: Number(sp[0]) })}">` : ''}
              ${esc(sp ? sp[1].name : slug)} ×${n}</span>`;
          }).join('')}</div>` : '<p class="empty-note">Chưa gặp con nào.</p>'}
      </div>`;
  }

  function veTrong() {
    const g = park.gap;
    el.innerHTML = `
      ${header('Công Viên Pepper')}
      <div class="park-bar">
        <span>${uiIcon('walk', 16)} <b>${park.buoc}</b> bước</span>
        <span>${itemIcon(BONG, '', 16)} <b>${park.bong}</b> bóng</span>
        <span>${uiIcon('ball', 16)} <b>${park.batDuoc}</b> bắt được</span>
      </div>

      <div class="card park-stage">
        ${g ? `
          <img class="park-mon" src="${monLocalSrc(g.mon)}" alt=""
               onerror="${monFallbackAttr(g.mon)}">
          <b class="park-name">${esc(displayName(g.mon))} <small>Lv.${g.mon.lv}</small></b>
          <small class="park-turn">Còn đứng lại ${g.luot} lượt</small>
        ` : '<div class="park-empty">Cỏ cao rung rinh trước mặt…</div>'}
        <p class="park-say">${esc(dong)}</p>
      </div>

      ${g ? `
        <div class="park-acts">
          <button class="btn btn-primary" id="p-nem" ${park.bong ? '' : 'disabled'}>
            Ném bóng</button>
          <button class="btn" id="p-an">Cho ăn</button>
          <button class="btn" id="p-bo">Bỏ qua</button>
        </div>`
      : `<button class="btn btn-primary park-walk" id="p-di">Đi tiếp</button>`}

      <button class="btn park-out" id="p-ra">Ra cổng</button>`;

    el.querySelector('#p-di')?.addEventListener('click', () => {
      const e = buocTrongCongVien();
      if (!e) return;
      if (e.t === 'hetBuoc') { dong = 'Hết giờ rồi, người gác cổng gọi bạn ra.'; xong(); return; }
      if (e.t === 'diTiep') { dong = 'Bạn đi thêm một đoạn, chưa thấy gì.'; veTrong(); return; }
      dong = `Một ${displayName(e.mon)} hoang xuất hiện!`;
      veTrong();
    });

    el.querySelector('#p-nem')?.addEventListener('click', () => {
      const r = nemBong();
      if (!r) return;
      if (r.hetBong) { toast('Hết bóng rồi!'); return; }
      if (r.bat) {
        dong = `Bắt được ${displayName(r.mon)}!`;
        toast(`Bắt được ${displayName(r.mon)}!`);
      } else {
        dong = `Lắc ${r.lac} cái rồi bung ra… Nó ${r.dangVe}.`
          + (r.chay ? ' Rồi nó chuồn mất!' : '');
      }
      refresh();
      veTrong();
    });

    el.querySelector('#p-an')?.addEventListener('click', () => {
      const r = choAn();
      if (!r) return;
      dong = r.chay ? 'Bạn vừa đặt mồi xuống thì nó đã chạy mất.'
        : 'Nó ăn mồi, có vẻ bớt cảnh giác hẳn.';
      veTrong();
    });

    el.querySelector('#p-bo')?.addEventListener('click', () => {
      boQua();
      dong = 'Bạn lùi lại, để nó yên.';
      veTrong();
    });

    el.querySelector('#p-ra')?.addEventListener('click', async () => {
      if (!await confirmDlg('Ra cổng bây giờ? Số bước còn lại sẽ bỏ phí.')) return;
      xong();
    });
  }

  function xong() {
    tongKet = raCong();
    veCong();
  }

  if (park.dang) veTrong(); else veCong();
}
