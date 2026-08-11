// TuxeWorld H5 | ui/wardrobe.js | Tủ đồ nhân vật + tiệm quần áo
//
// Hai chế độ dùng chung một màn:
//   tab 'tu'   — tủ đồ: mặc / cởi những món đang có
//   tab 'tiem' — quầy của cô Thắm ngoài Phố Kim Long, CHỈ mở được từ NPC đó
//
// Bản trước chỉ liệt kê TÊN món với một cái nút giá, mua rồi mới biết nó ra
// sao. Nay mỗi món hiện luôn ảnh khoác trên ma-nơ-canh, và bấm vào là MẶC THỬ:
// nhân vật ở trên đổi đồ ngay, ưng thì mới trả tiền.
//
// Bộ sprite mới vẽ chung một thân cho cả hai giới nên không phải lọc theo dáng
// nữa; đổi lại mỗi món có nhiều BẢN MÀU. Danh sách bày mỗi món một thẻ, chọn
// màu nằm trong thanh "đang thử" — bày cả 10 màu của 18 món thì thành 180 thẻ.
import { G, save } from '../state.js';
import * as AV from '../engine/avatar.js';
import { DO, O_DO } from '../data/nhanvat.js';
import { owFrame, owReady } from '../engine/owsprite.js';
import { esc, tien, tienChu } from '../util.js';
import { toast, header } from './kit.js';

export function render(el, { tab = 'tu', from = 'menu' } = {}) {
  AV.look();
  const tiem = tab === 'tiem';
  let raf = null;
  let loc = '';                     // ô đang lọc, '' là xem tất cả
  let thu = null;                   // món đang mặc thử: { id, mau }

  const khoaThu = () => (thu ? AV.khoaDo(thu.id, thu.mau) : null);

  // Bộ đồ đang HIỂN THỊ = đồ thật, đè lên món đang thử
  function macXem() {
    const m = { ...AV.dangMac() };
    const k = khoaThu();
    if (k) m[AV.monCua(k).o] = k;
    return m;
  }

  // Trong tủ: món nào có bản màu nào. Ở tiệm thì bày hết bản màu của món.
  const mauCoTrongTu = (id) => {
    const co = AV.tuDo();
    return AV.mauCoCua(id).filter(m => co.includes(AV.khoaDo(id, m.id)));
  };

  // Màu bày trên thẻ. KHÔNG lấy màu đầu bảng (Đen): thẻ nền tối mà đồ cũng đen
  // thì cả gian hàng nhìn như trống trơn. Xoay vòng theo vị trí món cho quầy
  // hàng có màu có sắc, mà vẫn cố định chứ không đổi mỗi lần vẽ lại.
  const mauBay = (d) => {
    const ds = AV.mauCoCua(d.id);
    if (ds.length < 2) return 'goc';
    const i = DO.findIndex(x => x.id === d.id);
    return ds[1 + (i % (ds.length - 1))].id;
  };

  function oHtml(d, khoaBay, dangMac2, coRoi) {
    const dangThu = thu?.id === d.id;
    return `<button type="button" class="card td-o ${dangThu ? 'thu' : ''} ${dangMac2 ? 'mac' : ''}"
      data-thu="${esc(d.id)}">
      <span class="td-anh">${AV.oMonDo(khoaBay, { cao: 88 })}</span>
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
      ? DO.filter(d => d.gia > 0)
      : DO.filter(d => co.some(k => AV.monCua(k)?.id === d.id));
    // Ô nào không có món nào thì không bày nút lọc cho rối mắt
    const oCo = O_DO.filter(o => tatCa.some(d => d.o === o.id));
    if (loc && !oCo.some(o => o.id === loc)) loc = '';
    const ds = loc ? tatCa.filter(d => d.o === loc) : tatCa;
    const dThu = thu ? DO.find(d => d.id === thu.id) : null;
    // Ở tiệm thì chọn được mọi màu; trong tủ chỉ mấy màu đã sắm
    const mauThu = dThu
      ? (tiem ? AV.mauCoCua(dThu.id) : mauCoTrongTu(dThu.id))
      : [];

    el.innerHTML = `
      ${header(tiem ? 'Tiệm Quần Áo Cô Thắm' : 'Tủ Đồ', from)}
      <div class="card td-xem">
        <div class="td-buc">
          <div class="td-sang"></div>
          <canvas id="td-canvas" width="128" height="128"></canvas>
        </div>
        <div class="td-slot">
          ${O_DO.map(o => {
            const d = xem[o.id] && AV.monCua(xem[o.id]);
            const laThu = dThu && dThu.o === o.id;
            return `<span class="td-oo ${d ? 'co' : ''} ${laThu ? 'thu' : ''}">
              <small>${esc(o.name)}</small>
              <b>${d ? esc(d.name) : '—'}</b>
            </span>`;
          }).join('')}
        </div>
      </div>

      ${dThu ? `<div class="card td-thanh">
        <span class="td-thanh-chu">Đang thử <b>${esc(dThu.name)}</b></span>
        ${mauThu.length > 1 ? `<span class="td-mau">
          ${mauThu.map(m => `<button type="button" class="td-mau-o ${m.id === thu.mau ? 'chon' : ''}"
            data-mau="${esc(m.id)}" title="${esc(m.name)}"
            style="background:${esc(m.mau)}"></button>`).join('')}
        </span>` : ''}
        <span class="td-thanh-nut">
          ${tiem
            ? (co.includes(khoaThu())
              ? `<button class="btn btn-sm btn-primary td-mac" data-id="${esc(dThu.id)}">Mặc luôn</button>`
              : `<button class="btn btn-sm btn-primary td-mua" data-id="${esc(dThu.id)}">Mua ${tien(dThu.gia)}</button>`)
            : `<button class="btn btn-sm btn-primary td-mac" data-id="${esc(dThu.id)}">Mặc luôn</button>`}
          <button class="btn btn-sm td-thoi">Thôi</button>
        </span>
      </div>` : ''}

      ${oCo.length > 1 ? `<div class="td-loc">
        <button type="button" class="seg-btn ${loc ? '' : 'active'}" data-loc="">Tất cả</button>
        ${oCo.map(o => `<button type="button" class="seg-btn ${loc === o.id ? 'active' : ''}"
          data-loc="${esc(o.id)}">${esc(o.name)}</button>`).join('')}
      </div>` : ''}
      ${ds.length
        ? `<div class="td-luoi">${ds.map(d => {
            // Thẻ bày bản màu đang thử nếu đang thử món này, không thì bản đang
            // mặc, không nữa thì bản màu đầu tiên có được.
            const cua = co.filter(k => AV.monCua(k)?.id === d.id);
            const khoaBay = (thu?.id === d.id && khoaThu())
              || (AV.monCua(mac[d.o])?.id === d.id ? mac[d.o] : null)
              || cua[0] || AV.khoaDo(d.id, mauBay(d));
            return oHtml(d, khoaBay, mac[d.o] === khoaBay, cua.length > 0);
          }).join('')}</div>`
        : `<div class="card empty-note">${tiem
            ? 'Hôm nay cô Thắm chưa dọn hàng ra.'
            : 'Tủ đang trống. Ghé tiệm quần áo ngoài Phố Kim Long mà sắm.'}</div>`}
    `;

    el.querySelectorAll('[data-loc]').forEach(b => b.addEventListener('click', () => {
      loc = b.dataset.loc;
      ve();
    }));
    el.querySelectorAll('[data-mau]').forEach(b => b.addEventListener('click', () => {
      thu = { ...thu, mau: b.dataset.mau };
      ve();
    }));
    // Bấm vào cả cái thẻ là mặc thử; bấm lại lần nữa thì thôi
    el.querySelectorAll('[data-thu]').forEach(b => b.addEventListener('click', (e) => {
      if (e.target.closest('.td-mua, .td-mac, .td-coi')) return;   // mấy nút kia lo phần việc riêng
      const id = b.dataset.thu;
      if (thu?.id === id) { thu = null; ve(); return; }
      const d0 = DO.find(x => x.id === id);
      const dsm = tiem ? AV.mauCoCua(id) : mauCoTrongTu(id);
      const bay = mauBay(d0);
      thu = { id, mau: dsm.some(m => m.id === bay) ? bay : (dsm[0]?.id || 'goc') };
      ve();
    }));
    el.querySelector('.td-thoi')?.addEventListener('click', () => { thu = null; ve(); });

    el.querySelectorAll('.td-mac').forEach(b => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = b.dataset.id;
      const d0 = DO.find(x => x.id === id);
      const k = thu?.id === id ? khoaThu()
        : (co.find(x => AV.monCua(x)?.id === id) || AV.khoaDo(id, mauBay(d0)));
      const [okMac, err] = AV.mac(k);
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
      const d = DO.find(x => x.id === b.dataset.id);
      if (!d) return;
      if ((G.p.money || 0) < d.gia) { toast('Không đủ tiền.'); return; }
      const k = thu?.id === d.id ? khoaThu() : AV.khoaDo(d.id, mauBay(d));
      G.p.money -= d.gia;
      AV.themDo(k);
      AV.mac(k);
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
