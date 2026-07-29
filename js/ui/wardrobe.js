// TuxeWorld H5 | ui/wardrobe.js | Tủ đồ nhân vật + tiệm quần áo
//
// Hai chế độ dùng chung một màn:
//   tab 'tu'   — tủ đồ: mặc / cởi những món đang có
//   tab 'tiem' — quầy của cô Thắm trong Khu Dân Cư, CHỈ mở được từ NPC đó
//
// Bản trước chỉ liệt kê TÊN món với một cái nút giá, mua rồi mới biết nó ra
// sao. Nay mỗi món hiện luôn ảnh khoác trên ma-nơ-canh, và bấm vào là MẶC THỬ:
// nhân vật ở trên đổi đồ ngay, ưng thì mới trả tiền.
//
// Quần áo bên LPC vẽ riêng cho dáng nam và dáng nữ, không phải một mẫu hai bản.
// Nên tiệm chỉ bày đồ hợp dáng người của người chơi.
import { G, save } from '../state.js';
import * as AV from '../engine/avatar.js';
import { DO, DO_BY_ID, O_DO } from '../data/lpc.js';
import { owFrame, owReady } from '../engine/owsprite.js';
import { esc, tien, tienChu } from '../util.js';
import { toast, header } from './kit.js';

export function render(el, { tab = 'tu', from = 'menu' } = {}) {
  AV.look();
  const tiem = tab === 'tiem';
  let raf = null;
  let loc = '';                     // ô đang lọc, '' là xem tất cả
  let thu = null;                   // món đang mặc thử (chưa mua / chưa mặc thật)

  const hopDang = (d) => d.than === AV.danDo();

  // Bộ đồ đang HIỂN THỊ = đồ thật, đè lên món đang thử
  function macXem() {
    const m = { ...AV.dangMac() };
    if (thu && DO_BY_ID[thu]) m[DO_BY_ID[thu].o] = thu;
    return m;
  }

  function oHtml(d, dangMac2, coRoi) {
    const dangThu = thu === d.id;
    return `<button type="button" class="card td-o ${dangThu ? 'thu' : ''} ${dangMac2 ? 'mac' : ''}"
      data-thu="${esc(d.id)}">
      <span class="td-anh">${AV.oMonDo(d.id, { cao: 88 })}</span>
      ${dangMac2 ? '<span class="td-co-mac">Đang mặc</span>'
        : dangThu ? '<span class="td-dang-thu">Đang thử</span>' : ''}
      <b>${esc(d.name)}</b>
      <small>${esc(O_DO.find(o => o.id === d.o)?.name || d.o)}</small>
      <span class="td-nut">
        ${tiem
          ? (coRoi ? '<span class="td-co">Đã có</span>'
                   : `<span class="btn btn-sm btn-primary td-mua" data-id="${esc(d.id)}">${tien(d.gia)}</span>`)
          : (dangMac2
            ? `<span class="btn btn-sm td-coi" data-o="${esc(d.o)}">Cởi ra</span>`
            : `<span class="btn btn-sm btn-primary td-mac" data-id="${esc(d.id)}">Mặc</span>`)}
      </span>
    </button>`;
  }

  function ve() {
    const mac = AV.dangMac();
    const xem = macXem();
    const co = AV.tuDo();
    const tatCa = tiem
      ? DO.filter(d => d.gia > 0 && hopDang(d))
      : DO.filter(d => co.includes(d.id) && hopDang(d));
    // Ô nào không có món nào thì không bày nút lọc cho rối mắt
    const oCo = O_DO.filter(o => tatCa.some(d => d.o === o.id));
    if (loc && !oCo.some(o => o.id === loc)) loc = '';
    const ds = loc ? tatCa.filter(d => d.o === loc) : tatCa;
    const mThu = thu && DO_BY_ID[thu];

    el.innerHTML = `
      ${header(tiem ? 'Tiệm Quần Áo Cô Thắm' : 'Tủ Đồ', from)}
      <div class="card td-xem">
        <div class="td-buc">
          <div class="td-sang"></div>
          <canvas id="td-canvas" width="96" height="192"></canvas>
        </div>
        <div class="td-slot">
          ${O_DO.map(o => {
            const d = xem[o.id] && DO_BY_ID[xem[o.id]];
            const laThu = mThu && mThu.o === o.id;
            return `<span class="td-oo ${d ? 'co' : ''} ${laThu ? 'thu' : ''}">
              <small>${esc(o.name)}</small>
              <b>${d ? esc(d.name) : '—'}</b>
            </span>`;
          }).join('')}
        </div>
      </div>

      ${mThu ? `<div class="card td-thanh">
        <span class="td-thanh-chu">Đang thử <b>${esc(mThu.name)}</b></span>
        <span class="td-thanh-nut">
          ${tiem
            ? (co.includes(mThu.id)
              ? '<button class="btn btn-sm btn-primary td-mac" data-id="' + esc(mThu.id) + '">Mặc luôn</button>'
              : '<button class="btn btn-sm btn-primary td-mua" data-id="' + esc(mThu.id) + '">Mua ' + tien(mThu.gia) + '</button>')
            : '<button class="btn btn-sm btn-primary td-mac" data-id="' + esc(mThu.id) + '">Mặc luôn</button>'}
          <button class="btn btn-sm td-thoi">Thôi</button>
        </span>
      </div>` : ''}

      ${oCo.length > 1 ? `<div class="td-loc">
        <button type="button" class="seg-btn ${loc ? '' : 'active'}" data-loc="">Tất cả</button>
        ${oCo.map(o => `<button type="button" class="seg-btn ${loc === o.id ? 'active' : ''}"
          data-loc="${esc(o.id)}">${esc(o.name)}</button>`).join('')}
      </div>` : ''}
      ${ds.length
        ? `<div class="td-luoi">${ds.map(d =>
            oHtml(d, mac[d.o] === d.id, co.includes(d.id))).join('')}</div>`
        : `<div class="card empty-note">${tiem
            ? 'Hôm nay hết hàng hợp dáng của bạn rồi.'
            : 'Tủ đang trống. Ghé tiệm quần áo trong Khu Dân Cư mà sắm.'}</div>`}
    `;

    el.querySelectorAll('[data-loc]').forEach(b => b.addEventListener('click', () => {
      loc = b.dataset.loc;
      ve();
    }));
    // Bấm vào cả cái thẻ là mặc thử; bấm lại lần nữa thì thôi
    el.querySelectorAll('[data-thu]').forEach(b => b.addEventListener('click', (e) => {
      if (e.target.closest('.td-mua, .td-mac, .td-coi')) return;   // mấy nút kia lo phần việc riêng
      thu = thu === b.dataset.thu ? null : b.dataset.thu;
      ve();
    }));
    el.querySelector('.td-thoi')?.addEventListener('click', () => { thu = null; ve(); });

    el.querySelectorAll('.td-mac').forEach(b => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const [okMac, err] = AV.mac(b.dataset.id);
      toast(err || okMac);
      if (!err) thu = null;
      ve();
    }));
    el.querySelectorAll('.td-coi').forEach(b => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const [okCoi, err] = AV.coi(b.dataset.o);
      toast(err || okCoi);
      ve();
    }));
    el.querySelectorAll('.td-mua').forEach(b => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const d = DO_BY_ID[b.dataset.id];
      if (!d) return;
      if ((G.p.money || 0) < d.gia) { toast('Không đủ tiền.'); return; }
      G.p.money -= d.gia;
      AV.themDo(d.id);
      AV.mac(d.id);
      save();
      toast(`Mua ${d.name} hết ${tienChu(d.gia)} — mặc luôn cho nóng.`);
      thu = null;
      ve();
    }));

    veCanh();
  }

  function veCanh() {
    const cv = el.querySelector('#td-canvas');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const chay = () => {
      if (!cv.isConnected) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      const im = AV.anhNhanVat(AV.nguoi(), macXem());
      if (owReady(im)) {
        const f = owFrame('down', true, Date.now() * 0.5, im);
        ctx.drawImage(im, f.sx, f.sy, f.sw, f.sh, 0, 0, cv.width, cv.height);
      }
      raf = requestAnimationFrame(chay);
    };
    cancelAnimationFrame(raf);
    chay();
  }
  el.addEventListener('screen-leave', () => cancelAnimationFrame(raf), { once: true });

  ve();
}
