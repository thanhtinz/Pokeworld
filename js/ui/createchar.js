// TuxeWorld H5 | ui/createchar.js | Tạo nhân vật: ghép ngoại hình + chọn bộ đồ
//
// Dựng theo lối màn tạo nhân vật của game chứ không phải một trang thiết lập:
//
//   · nhân vật đứng trên BỤC ĐÁ có vầng sáng, xoay được bốn hướng
//   · mục chỉnh nằm trên một thanh trượt ngang, không bẻ dòng
//   · chọn MÀU thì bày ô màu thật, chọn KIỂU thì bày ảnh cái đầu đội kiểu đó
//   · tóc và râu gộp kiểu với màu vào chung một thẻ — đổi kiểu xong đổi màu
//     ngay tại chỗ, khỏi nhảy sang tab khác
//   · tên và nút bắt đầu dính đáy màn hình, không phải cuộn xuống mới thấy
import { activeAccount, setAvatar, setCharCreated } from '../engine/accounts.js';
import { G, newGame, save, hasSave } from '../state.js';
import * as AV from '../engine/avatar.js';
import { GIOI, DA, TAI, MUI, BIEU_CAM, MAT, TOC_KIEU, TOC_MAU, RAU_KIEU, RAU_MAU,
  BO_MAU, DO_BY_ID, monBoMau } from '../data/lpc.js';
import { owFrame, owReady } from '../engine/owsprite.js';
import { esc } from '../util.js';
import { toast } from './kit.js';
import { show } from '../main.js';

// Từng mục chỉnh. `kieu` quyết định cách bày lựa chọn:
//   'mau'  — ô màu tròn          (màu da, màu mắt)
//   'dau'  — ảnh cái đầu         (tóc, râu, tai, mũi, biểu cảm)
// `trong` = cho phép để trống (không có phần đó).
// `phu`   = mục chọn màu đi kèm, bày ngay dưới cùng một thẻ.
// Không có mục "Dáng": chọn giới tính ở bước một là xong dáng người luôn.
const MUC = [
  { k: 'da', ten: 'Da', ds: DA, kieu: 'mau' },
  { k: 'tocKieu', ten: 'Tóc', ds: TOC_KIEU, kieu: 'dau', nhom: 'toc', trong: 'Hói',
    phu: { k: 'tocMau', ten: 'Màu tóc', ds: TOC_MAU } },
  { k: 'mat', ten: 'Mắt', ds: MAT, kieu: 'mau' },
  // LPC chỉ vẽ râu cho dáng nam, nên bên nữ không bày mục này
  { k: 'rauKieu', ten: 'Râu', ds: RAU_KIEU, kieu: 'dau', nhom: 'rau', trong: 'Không',
    gioi: 'nam', phu: { k: 'rauMau', ten: 'Màu râu', ds: RAU_MAU } },
  { k: 'tai', ten: 'Tai', ds: TAI, kieu: 'dau', nhom: 'tai', trong: 'Thường' },
  { k: 'mui', ten: 'Mũi', ds: MUI, kieu: 'dau', nhom: 'mui', trong: 'Thường' },
  { k: 'bieucam', ten: 'Biểu cảm', ds: BIEU_CAM, kieu: 'dau', nhom: 'bieucam', trong: 'Bình thường' },
];

const HUONG = [
  { id: 'down', ten: 'Trước' }, { id: 'left', ten: 'Trái' },
  { id: 'up', ten: 'Sau' }, { id: 'right', ten: 'Phải' },
];

// Số dòng trống trên đỉnh khung sprite (chỗ chừa cho mũ cao) cắt đi khi xem
// trước, kèm cỡ canvas tính ra từ đó: rộng 32 -> 144 nên tỉ lệ phóng là 4,5.
// 22 = 12 hàng đệm của mklpc.py + 10 dòng trống vốn có trên đỉnh đầu
const BO_TREN = 22;
const XEM_W = 144;
const XEM_H = (AV.KHUNG_H - BO_TREN) * (XEM_W / AV.KHUNG_W);

const bocNgauNhien = (ds) => ds[Math.floor(Math.random() * ds.length)]?.id ?? '';

export function render(el) {
  const acc = activeAccount();
  let gioi = acc?.avatar === 'leaf' ? 'nu' : 'nam';
  const nv = AV.macDinh(AV.thanDauCuaGioi(gioi));
  let buoc = 'gioi';                // 'gioi' = chọn giới tính, 'chinh' = chỉnh dáng
  let boDo = 1;
  let muc = 'da';                   // mục đang mở
  let huong = 0;                    // đang nhìn hướng nào
  let raf = null;

  // Bộ đồ ở đây chỉ để XEM TRƯỚC; mặc thật lúc bấm Bắt đầu
  const monTrongBo = (so) => monBoMau(AV.danDo(nv.than), so);
  const macThu = () => Object.fromEntries(
    monTrongBo(boDo).map(id => [DO_BY_ID[id].o, id]));

  // Danh sách lựa chọn của một mục, kèm ô trống nếu mục đó bỏ được
  const mucHienCo = () => MUC.filter(x => !x.gioi || x.gioi === gioi);
  // Lọc theo giới tính đã chọn: mục nào cả hai giới đều có thì `gioi` để rỗng.
  const dsCua = (m) => m.ds.filter(o => !o.gioi || o.gioi === gioi);
  const luaChon = (m) => (m.trong ? [{ id: '', name: m.trong }, ...dsCua(m)] : dsCua(m));

  // Ảnh/màu của một lựa chọn — đây là chỗ làm màn này hết giống trang thiết lập
  function oChon(m, o) {
    if (m.kieu === 'mau') {
      return `<i class="cc-mau" style="background:${esc(o.mau || '#888')}"></i>`;
    }
    if (m.kieu === 'dau') {
      // Tóc/râu xem theo màu đang chọn, không thì bày một màu khác hẳn đầu
      const ten = m.k === 'tocKieu' ? (o.id && `${o.id}_${nv.tocMau}`)
        : m.k === 'rauKieu' ? (o.id && `${o.id}_${nv.rauMau}`)
          : (o.id && `${o.id}_${nv.da}`);
      return AV.oPhanDau(m.nhom, ten, { cao: 54, nv });
    }
    return '';
  }

  const oHtml = (m, o, khoa, cls) => `<button type="button"
    class="cc-o ${(nv[khoa] || '') === o.id ? 'chon' : ''}"
    data-${cls}="${esc(o.id)}" title="${esc(o.name)}">
    ${cls === 'phu' ? `<i class="cc-mau" style="background:${esc(o.mau || '#888')}"></i>`
      : oChon(m, o)}<span>${esc(o.name)}</span>
  </button>`;

  // ==== Bước một: chọn giới tính ====
  // LPC vẽ đồ riêng cho từng giới (mặc chéo là lệch người), nên phải chốt giới
  // tính trước. Chọn xong là có luôn dáng người của giới đó, không bắt chọn
  // thêm lần nữa.
  function veGioi() {
    el.innerHTML = `
      <div class="splash create-scr">
        <div class="splash-bg"></div>
        <div class="splash-inner cc-wrap cc-gioi-man">
          <h2 class="login-title cc-title">Chọn giới tính</h2>
          <p class="cc-nho">Chọn xong là tới phần chỉnh khuôn mặt.</p>
          <div class="cc-gioi">
            ${GIOI.map(g => {
              const t = AV.thanDauCuaGioi(g.id);
              // Mỗi bên một kiểu tóc khác nhau cho dễ phân biệt ngay từ ảnh
              const xem = { ...AV.macDinh(t), tocKieu: g.id === 'nu' ? 'dai' : 'thang' };
              const mac = Object.fromEntries(monBoMau(AV.danDo(t), 1)
                .map(id => [DO_BY_ID[id].o, id]));
              return `<button type="button" class="card cc-gioi-o ${g.id === gioi ? 'chon' : ''}"
                data-gioi="${esc(g.id)}">
                ${AV.oNguoiDu(xem, mac, { cao: 150 })}
                <b>${esc(g.name)}</b>
              </button>`;
            }).join('')}
          </div>
        </div>
      </div>`;
    el.querySelectorAll('[data-gioi]').forEach(b => b.addEventListener('click', () => {
      doiGioi(b.dataset.gioi);
      buoc = 'chinh';
      veHtml();
    }));
  }

  const tenGioi = () => GIOI.find(g => g.id === gioi)?.name || 'Nam';

  // Đổi giới thì thân người phải nhảy theo, không thì nhân vật vẫn giữ thân cũ
  // mà tủ đồ lại là của bên kia.
  function doiGioi(g) {
    if (gioi === g) return;
    gioi = g;
    nv.than = AV.thanDauCuaGioi(g);
    // Râu chỉ vẽ cho dáng nam; đổi sang nữ mà còn râu thì trông rất kỳ
    if (gioi === 'nu') nv.rauKieu = '';
    // Đang để kiểu tóc chỉ dành cho giới kia thì kéo về kiểu đầu của giới mới
    for (const m of mucHienCo()) {
      const ds = dsCua(m);
      if (nv[m.k] && !ds.some(o => o.id === nv[m.k])) nv[m.k] = ds[0]?.id || '';
    }
  }

  function veHtml() {
    if (buoc === 'gioi') { veGioi(); return; }
    const dsMuc = mucHienCo();
    const m = dsMuc.find(x => x.k === muc) || dsMuc[0];
    const ds = luaChon(m);
    const i = Math.max(0, ds.findIndex(o => o.id === (nv[m.k] || '')));

    el.innerHTML = `
      <div class="splash create-scr">
        <div class="splash-bg"></div>
        <div class="splash-inner cc-wrap">
          <div class="cc-dinh">
            <button type="button" class="cc-lui" id="cc-lui">‹ ${esc(tenGioi())}</button>
            <h2 class="login-title cc-title">Tạo nhân vật</h2>
          </div>

          <div class="cc-buc">
            <div class="cc-sang"></div>
            <button type="button" class="cc-random" id="cc-random">🎲 Ngẫu nhiên</button>
            <button type="button" class="cc-xoay" data-xoay="-1" aria-label="Xoay trái">‹</button>
            <div class="cc-nguoi">
              <canvas id="cc-canvas" width="${XEM_W}" height="${XEM_H}"></canvas>
              <div class="cc-be"></div>
            </div>
            <button type="button" class="cc-xoay" data-xoay="1" aria-label="Xoay phải">›</button>
            <div class="cc-huong">
              ${HUONG.map((h, k) => `<i class="${k === huong ? 'on' : ''}"></i>`).join('')}
              <span>${esc(HUONG[huong].ten)}</span>
            </div>
          </div>

          <div class="cc-rail">
            ${dsMuc.map(x => `<button type="button" class="cc-rail-o ${x.k === m.k ? 'on' : ''}"
              data-muc="${esc(x.k)}">${esc(x.ten)}</button>`).join('')}
          </div>

          <div class="card cc-buoc">
            <div class="cc-buoc-dau">
              <button type="button" class="cc-mui" data-di="-1" aria-label="Lựa chọn trước">‹</button>
              <b>${esc(ds[i]?.name || '—')}</b>
              <span class="cc-dem">${i + 1}/${ds.length}</span>
              <button type="button" class="cc-mui" data-di="1" aria-label="Lựa chọn sau">›</button>
            </div>
            <div class="cc-chon cc-k-${m.kieu}">
              ${ds.map(o => oHtml(m, o, m.k, 'val')).join('')}
            </div>
            ${m.phu ? `<div class="cc-phu">
              <small>${esc(m.phu.ten)}</small>
              <div class="cc-chon cc-k-mau">
                ${m.phu.ds.map(o => oHtml(m, o, m.phu.k, 'phu')).join('')}
              </div>
            </div>` : ''}
          </div>

          <h3 class="cc-h3">Bộ đồ mở đầu</h3>
          <div class="cc-bo">
            ${BO_MAU.map(b => `<button type="button" class="card cc-bo-o ${b.so === boDo ? 'chon' : ''}"
              data-bo="${b.so}">
              ${AV.oBoDo(monTrongBo(b.so), { cao: 84, nv })}
              <b>${esc(b.name)}</b><small>${esc(b.desc)}</small>
            </button>`).join('')}
          </div>

          <div class="cc-day">
            <input id="char-name" type="text" maxlength="12" placeholder="Đặt tên nhà huấn luyện"
                   value="${esc(acc?.user || '')}" autocomplete="off" aria-label="Tên nhà huấn luyện">
            <button class="btn btn-primary" id="btn-create">Bắt đầu</button>
          </div>
        </div>
      </div>`;

    el.querySelector('#cc-lui').addEventListener('click', () => {
      buoc = 'gioi';
      veHtml();
    });
    el.querySelectorAll('[data-muc]').forEach(b => b.addEventListener('click', () => {
      muc = b.dataset.muc;
      veHtml();
    }));
    el.querySelectorAll('[data-val]').forEach(b => b.addEventListener('click', () => {
      nv[m.k] = b.dataset.val;
      veHtml();
    }));
    el.querySelectorAll('[data-phu]').forEach(b => b.addEventListener('click', () => {
      nv[m.phu.k] = b.dataset.phu;
      veHtml();
    }));
    // Nút ‹ › lật lần lượt trong mục đang mở — bấm nhanh cho vui mắt
    el.querySelectorAll('[data-di]').forEach(b => b.addEventListener('click', () => {
      const n = ds.length;
      nv[m.k] = ds[(i + Number(b.dataset.di) + n) % n].id;
      veHtml();
    }));
    el.querySelectorAll('[data-xoay]').forEach(b => b.addEventListener('click', () => {
      huong = (huong + Number(b.dataset.xoay) + HUONG.length) % HUONG.length;
      veHtml();
    }));
    el.querySelectorAll('[data-bo]').forEach(b => b.addEventListener('click', () => {
      boDo = Number(b.dataset.bo);
      veHtml();
    }));
    el.querySelector('#cc-random').addEventListener('click', () => {
      for (const x of dsMuc) {
        nv[x.k] = bocNgauNhien(luaChon(x));
        if (x.phu) nv[x.phu.k] = bocNgauNhien(x.phu.ds);
      }
      boDo = 1 + Math.floor(Math.random() * BO_MAU.length);
      veHtml();
    });
    el.querySelector('#btn-create').addEventListener('click', batDau);
    veCanh();
  }

  // Xem trước: vẽ nhân vật đang bước đi, thấy luôn dáng đi chứ không phải một
  // tấm hình chết.
  function veCanh() {
    const cv = el.querySelector('#cc-canvas');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const chay = () => {
      if (!cv.isConnected) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      const im = AV.anhNhanVat(nv, macThu());
      if (owReady(im)) {
        const f = owFrame(HUONG[huong].id, true, Date.now() * 0.5, im);
        // Khung sprite chừa sẵn khoảng trống trên đầu (chỗ để đội mũ cao). Vẽ
        // cả khung thì nhân vật dính tịt xuống đáy, phía trên trống hoác — nên
        // cắt bớt phần thừa đó đi.
        const bo = f.sh * (BO_TREN / AV.KHUNG_H);
        ctx.drawImage(im, f.sx, f.sy + bo, f.sw, f.sh - bo, 0, 0, cv.width, cv.height);
      }
      raf = requestAnimationFrame(chay);
    };
    cancelAnimationFrame(raf);
    chay();
  }
  el.addEventListener('screen-leave', () => cancelAnimationFrame(raf), { once: true });

  function batDau() {
    const name = el.querySelector('#char-name').value.trim().slice(0, 12);
    if (name.length < 2) { toast('Tên nhân vật tối thiểu 2 ký tự!'); return; }
    // Ảnh 2D cũ vẫn dùng ở vài chỗ (hộp thoại, danh sách tài khoản) nên vẫn
    // ghi lại nam/nữ cho khớp.
    setAvatar(AV.danDo(nv.than) === 'nu' ? 'leaf' : 'red');
    setCharCreated(true);
    // Không còn bản lưu của tài khoản này -> dựng ván mới, tuyệt đối không
    // xài lại G.p còn sót của tài khoản vừa đăng xuất.
    if (!G.p || !hasSave()) newGame(name);
    G.p.name = name;
    const L = AV.look();
    L.nv = { ...nv };
    L.mac = {};
    L.tuDo = [];
    AV.macBoMau(boDo, nv.than);
    save();
    show('intro');
  }

  veHtml();
}
