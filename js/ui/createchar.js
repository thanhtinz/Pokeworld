// TuxeWorld H5 | ui/createchar.js | Tạo nhân vật: ghép ngoại hình + chọn bộ đồ
//
// Bản trước bày đúng kiểu một trang thiết lập: mười cái tab chữ chen nhau, mỗi
// mục là một hàng nút chữ, chọn "Nâu Đỏ" hay "Hạt Dẻ" thì phải bấm mới biết nó
// ra sao. Nay dựng theo lối màn tạo nhân vật của game:
//
//   · nhân vật đứng giữa một cái BỤC có vầng sáng, xoay được bốn hướng
//   · mục chỉnh nằm trên một thanh trượt ngang, không bẻ dòng
//   · chọn MÀU thì bày ô màu thật, chọn KIỂU thì bày ảnh cái đầu đội kiểu đó
//   · ba bộ đồ mẫu hiện luôn ảnh bộ đồ mặc trên người
import { activeAccount, setAvatar, setCharCreated } from '../engine/accounts.js';
import { G, newGame, save, hasSave } from '../state.js';
import * as AV from '../engine/avatar.js';
import { THAN, DA, TAI, MUI, BIEU_CAM, MAT, TOC_KIEU, TOC_MAU, RAU_KIEU, RAU_MAU,
  BO_MAU, DO_BY_ID, monBoMau } from '../data/lpc.js';
import { owFrame, owReady } from '../engine/owsprite.js';
import { esc } from '../util.js';
import { toast } from './kit.js';
import { show } from '../main.js';

// Từng mục chỉnh. `kieu` quyết định cách bày lựa chọn:
//   'mau'  — ô màu tròn          (màu da, màu tóc, màu mắt, màu râu)
//   'dau'  — ảnh cái đầu         (tóc, râu, tai, mũi, biểu cảm)
//   'chu'  — nút chữ             (dáng người)
// `trong` = cho phép để trống (không có phần đó).
const MUC = [
  { k: 'than', ten: 'Dáng', ds: THAN, kieu: 'chu' },
  { k: 'da', ten: 'Da', ds: DA, kieu: 'mau' },
  { k: 'tocKieu', ten: 'Tóc', ds: TOC_KIEU, kieu: 'dau', nhom: 'toc', trong: 'Hói' },
  { k: 'tocMau', ten: 'Màu tóc', ds: TOC_MAU, kieu: 'mau' },
  { k: 'mat', ten: 'Mắt', ds: MAT, kieu: 'mau' },
  { k: 'tai', ten: 'Tai', ds: TAI, kieu: 'dau', nhom: 'tai', trong: 'Thường' },
  { k: 'mui', ten: 'Mũi', ds: MUI, kieu: 'dau', nhom: 'mui', trong: 'Thường' },
  { k: 'rauKieu', ten: 'Râu', ds: RAU_KIEU, kieu: 'dau', nhom: 'rau', trong: 'Không' },
  { k: 'rauMau', ten: 'Màu râu', ds: RAU_MAU, kieu: 'mau' },
  { k: 'bieucam', ten: 'Biểu cảm', ds: BIEU_CAM, kieu: 'dau', nhom: 'bieucam', trong: 'Bình thường' },
];

const HUONG = [
  { id: 'down', ten: 'Trước' }, { id: 'left', ten: 'Trái' },
  { id: 'up', ten: 'Sau' }, { id: 'right', ten: 'Phải' },
];

// Số dòng trống trên đỉnh khung sprite (chỗ chừa cho mũ cao) cắt đi khi xem
// trước, kèm cỡ canvas tính ra từ đó: rộng 32 -> 128 nên tỉ lệ phóng là 4.
const BO_TREN = 10;
const XEM_W = 128;
const XEM_H = (64 - BO_TREN) * (XEM_W / 32);

const bocNgauNhien = (ds) => ds[Math.floor(Math.random() * ds.length)]?.id ?? '';

export function render(el) {
  const acc = activeAccount();
  const nv = AV.macDinh(acc?.avatar === 'leaf' ? 'nu' : 'nam');
  let boDo = 1;
  let muc = 'than';                 // mục đang mở
  let huong = 0;                    // đang nhìn hướng nào
  let raf = null;

  // Bộ đồ ở đây chỉ để XEM TRƯỚC; mặc thật lúc bấm Bắt đầu
  const monTrongBo = (so) => monBoMau(AV.danDo(nv.than), so);
  const macThu = () => Object.fromEntries(
    monTrongBo(boDo).map(id => [DO_BY_ID[id].o, id]));

  // Danh sách lựa chọn của một mục, kèm ô trống nếu mục đó bỏ được
  const luaChon = (m) => (m.trong ? [{ id: '', name: m.trong }, ...m.ds] : m.ds);

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
      return AV.oPhanDau(m.nhom, ten, { cao: 52, nv });
    }
    return '';
  }

  function veHtml() {
    const m = MUC.find(x => x.k === muc) || MUC[0];
    const ds = luaChon(m);
    const i = Math.max(0, ds.findIndex(o => o.id === (nv[m.k] || '')));

    el.innerHTML = `
      <div class="splash create-scr">
        <div class="splash-bg"></div>
        <div class="splash-inner cc-wrap">
          <h2 class="login-title">Tạo nhân vật</h2>

          <div class="cc-buc">
            <div class="cc-sang"></div>
            <button type="button" class="cc-xoay trai" data-xoay="-1" aria-label="Xoay trái">‹</button>
            <canvas id="cc-canvas" width="${XEM_W}" height="${XEM_H}"></canvas>
            <button type="button" class="cc-xoay phai" data-xoay="1" aria-label="Xoay phải">›</button>
            <div class="cc-san"></div>
            <div class="cc-huong">
              ${HUONG.map((h, k) => `<i class="${k === huong ? 'on' : ''}"></i>`).join('')}
              <span>${esc(HUONG[huong].ten)}</span>
            </div>
            <button class="btn btn-sm cc-random" id="cc-random">🎲 Ngẫu nhiên</button>
          </div>

          <div class="cc-rail">
            ${MUC.map(x => `<button type="button" class="cc-rail-o ${x.k === muc ? 'on' : ''}"
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
              ${ds.map(o => `<button type="button" class="cc-o ${(nv[m.k] || '') === o.id ? 'chon' : ''}"
                data-val="${esc(o.id)}" title="${esc(o.name)}">
                ${oChon(m, o)}<span>${esc(o.name)}</span>
              </button>`).join('')}
            </div>
          </div>

          <h3 class="cc-h3">Bộ đồ mở đầu</h3>
          <div class="cc-bo">
            ${BO_MAU.map(b => `<button type="button" class="card cc-bo-o ${b.so === boDo ? 'chon' : ''}"
              data-bo="${b.so}">
              ${AV.oBoDo(monTrongBo(b.so), { cao: 84, nv })}
              <b>${esc(b.name)}</b><small>${esc(b.desc)}</small>
            </button>`).join('')}
          </div>

          <div class="card name-card">
            <label for="char-name">Tên nhà huấn luyện (hiện trong game)</label>
            <input id="char-name" type="text" maxlength="12" placeholder="VD: Ash"
                   value="${esc(acc?.user || '')}" autocomplete="off">
            <button class="btn btn-primary btn-big" id="btn-create">Bắt đầu hành trình</button>
          </div>
        </div>
      </div>`;

    el.querySelectorAll('[data-muc]').forEach(b => b.addEventListener('click', () => {
      muc = b.dataset.muc;
      veHtml();
    }));
    el.querySelectorAll('.cc-o').forEach(b => b.addEventListener('click', () => {
      nv[m.k] = b.dataset.val;
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
      for (const x of MUC) nv[x.k] = bocNgauNhien(luaChon(x));
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
