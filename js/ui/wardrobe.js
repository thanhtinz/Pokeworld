// TuxeWorld H5 | ui/wardrobe.js | Tủ đồ nhân vật + tiệm quần áo
//
// Hai chế độ dùng chung một màn:
//   tab 'tu'   — tủ đồ: mặc / cởi những món đang có
//   tab 'tiem' — quầy của cô Thắm trong Khu Dân Cư, CHỈ mở được từ NPC đó
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

  const hopDang = (d) => d.than === AV.danDo();

  function oHtml(d, dangMac2, coRoi) {
    return `<div class="card td-o">
      <b>${esc(d.name)}</b>
      <small>${esc(O_DO.find(o => o.id === d.o)?.name || d.o)}</small>
      <div class="td-nut">
        ${tiem
          ? (coRoi ? '<span class="td-co">Đã có</span>'
                   : `<button class="btn btn-sm btn-primary td-mua" data-id="${esc(d.id)}">${tien(d.gia)}</button>`)
          : (dangMac2
            ? `<button class="btn btn-sm td-coi" data-o="${esc(d.o)}">Cởi ra</button>`
            : `<button class="btn btn-sm btn-primary td-mac" data-id="${esc(d.id)}">Mặc</button>`)}
      </div>
    </div>`;
  }

  function ve() {
    const mac = AV.dangMac();
    const co = AV.tuDo();
    const tatCa = tiem
      ? DO.filter(d => d.gia > 0 && hopDang(d))
      : DO.filter(d => co.includes(d.id) && hopDang(d));
    // Ô nào không có món nào thì không bày nút lọc cho rối mắt
    const oCo = O_DO.filter(o => tatCa.some(d => d.o === o.id));
    if (loc && !oCo.some(o => o.id === loc)) loc = '';
    const ds = loc ? tatCa.filter(d => d.o === loc) : tatCa;

    el.innerHTML = `
      ${header(tiem ? 'Tiệm Quần Áo Cô Thắm' : 'Tủ Đồ', from)}
      <div class="card td-xem">
        <canvas id="td-canvas" width="96" height="192"></canvas>
        <div class="td-slot">
          ${O_DO.map(o => {
            const d = mac[o.id] && DO_BY_ID[mac[o.id]];
            return `<span class="td-oo ${d ? 'co' : ''}">
              <small>${esc(o.name)}</small>
              <b>${d ? esc(d.name) : '—'}</b>
            </span>`;
          }).join('')}
        </div>
      </div>
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

    el.querySelectorAll('.td-mac').forEach(b => b.addEventListener('click', () => {
      const [ok, err] = AV.mac(b.dataset.id);
      toast(err || ok);
      ve();
    }));
    el.querySelectorAll('.td-coi').forEach(b => b.addEventListener('click', () => {
      const [ok, err] = AV.coi(b.dataset.o);
      toast(err || ok);
      ve();
    }));
    el.querySelectorAll('.td-mua').forEach(b => b.addEventListener('click', () => {
      const d = DO_BY_ID[b.dataset.id];
      if (!d) return;
      if ((G.p.money || 0) < d.gia) { toast('Không đủ tiền.'); return; }
      G.p.money -= d.gia;
      AV.themDo(d.id);
      AV.mac(d.id);
      save();
      toast(`Mua ${d.name} hết ${tienChu(d.gia)} — mặc luôn cho nóng.`);
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
      const im = AV.anhNhanVat();
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
