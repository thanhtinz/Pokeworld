// TuxeWorld H5 | ui/createchar.js | Tạo nhân vật: ghép ngoại hình + chọn bộ đồ
//
// Trước đây chỉ có hai lựa chọn Nam/Nữ với sprite dựng sẵn. Nay nhân vật ghép
// từ nhiều lớp rời (engine/avatar.js) nên chọn được từng phần: dáng người, màu
// da, tóc, màu tóc, mắt, tai, mũi, râu, biểu cảm — rồi lấy một trong ba bộ đồ
// mẫu. Quần áo còn lại mua ở tiệm trong Khu Dân Cư.
import { activeAccount, setAvatar, setCharCreated } from '../engine/accounts.js';
import { G, newGame, save, hasSave } from '../state.js';
import * as AV from '../engine/avatar.js';
import { THAN, DA, TAI, MUI, BIEU_CAM, MAT, TOC_KIEU, TOC_MAU, RAU_KIEU, RAU_MAU,
  BO_MAU, DO_BY_ID, monBoMau } from '../data/lpc.js';
import { owFrame, owReady } from '../engine/owsprite.js';
import { esc } from '../util.js';
import { toast } from './kit.js';
import { show } from '../main.js';

// Từng mục chỉnh: khoá trong bản ghi ngoại hình + danh sách lựa chọn.
// `trong` = cho phép để trống (không có phần đó).
const MUC = [
  { k: 'than', ten: 'Dáng người', ds: THAN },
  { k: 'da', ten: 'Màu da', ds: DA },
  { k: 'tocKieu', ten: 'Kiểu tóc', ds: TOC_KIEU, trong: 'Hói' },
  { k: 'tocMau', ten: 'Màu tóc', ds: TOC_MAU },
  { k: 'mat', ten: 'Mắt', ds: MAT },
  { k: 'tai', ten: 'Tai', ds: TAI, trong: 'Thường' },
  { k: 'mui', ten: 'Mũi', ds: MUI, trong: 'Thường' },
  { k: 'rauKieu', ten: 'Râu', ds: RAU_KIEU, trong: 'Không' },
  { k: 'rauMau', ten: 'Màu râu', ds: RAU_MAU },
  { k: 'bieucam', ten: 'Biểu cảm', ds: BIEU_CAM, trong: 'Bình thường' },
];

const bocNgauNhien = (ds) => ds[Math.floor(Math.random() * ds.length)]?.id ?? '';

export function render(el) {
  const acc = activeAccount();
  const nv = AV.macDinh(acc?.avatar === 'leaf' ? 'nu' : 'nam');
  let boDo = 1;
  let muc = 'than';                 // mục đang mở
  let raf = null;

  // Bộ đồ ở đây chỉ để XEM TRƯỚC; mặc thật lúc bấm Bắt đầu
  const macThu = () => Object.fromEntries(
    monBoMau(AV.danDo(nv.than), boDo).map(id => [DO_BY_ID[id].o, id]));

  function veHtml() {
    const m = MUC.find(x => x.k === muc) || MUC[0];
    const ds = m.trong ? [{ id: '', name: m.trong }, ...m.ds] : m.ds;
    el.innerHTML = `
      <div class="splash create-scr">
        <div class="splash-bg"></div>
        <div class="splash-inner cc-wrap">
          <h2 class="login-title">Tạo nhân vật</h2>

          <div class="card cc-xem">
            <canvas id="cc-canvas" width="128" height="256"></canvas>
            <button class="btn btn-sm" id="cc-random">Ngẫu nhiên</button>
          </div>

          <div class="seg-row seg-wrap cc-tabs">
            ${MUC.map(x => `<button type="button" class="seg-btn ${x.k === muc ? 'active' : ''}"
              data-muc="${esc(x.k)}">${esc(x.ten)}</button>`).join('')}
          </div>
          <div class="cc-chon">
            ${ds.map(o => `<button type="button" class="cc-o ${(nv[m.k] || '') === o.id ? 'chon' : ''}"
              data-val="${esc(o.id)}">${esc(o.name)}</button>`).join('')}
          </div>

          <h3 class="cc-h3">Bộ đồ mở đầu</h3>
          <div class="cc-bo">
            ${BO_MAU.map(b => `<button type="button" class="card cc-bo-o ${b.so === boDo ? 'chon' : ''}"
              data-bo="${b.so}"><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></button>`).join('')}
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
      // Đổi dáng người thì đồ mẫu cũng phải lấy bản của dáng mới
      nv[m.k] = b.dataset.val;
      veHtml();
    }));
    el.querySelectorAll('[data-bo]').forEach(b => b.addEventListener('click', () => {
      boDo = Number(b.dataset.bo);
      veHtml();
    }));
    el.querySelector('#cc-random').addEventListener('click', () => {
      for (const x of MUC) {
        const co = x.trong ? [{ id: '' }, ...x.ds] : x.ds;
        nv[x.k] = bocNgauNhien(co);
      }
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
        const f = owFrame('down', true, Date.now() * 0.5, im);
        ctx.drawImage(im, f.sx, f.sy, f.sw, f.sh, 0, 0, cv.width, cv.height);
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
