// PokeWorld H5 | ui/auth.js | Màn đăng ký / đăng nhập (2 nút lớn rồi mới tới biểu mẫu)
import { listAccounts, register, login, deleteAccount } from '../engine/accounts.js';
import { esc } from '../util.js';
import { toast, confirmDlg } from './kit.js';
import { show } from '../main.js';

export function render(el) {
  drawHome(el);
}

// ==== Màn chính: 2 nút Đăng nhập / Đăng ký ====
function drawHome(el) {
  const accounts = listAccounts();
  el.innerHTML = `
    <div class="splash auth-scr">
      <div class="splash-bg"></div>
      <div class="splash-inner">
        <img class="splash-title" src="assets/img/title.png" alt="" onerror="this.remove()">
        <div class="logo splash-logo">Poke<span>World</span></div>

        <div class="auth-btns">
          <button class="btn btn-primary btn-big" id="btn-to-login">Đăng nhập</button>
          <button class="btn btn-big" id="btn-to-register">Đăng ký</button>
        </div>
        ${accounts.length ? `<p class="auth-note">Đã có ${accounts.length} tài khoản trên máy này</p>` : ''}
      </div>
    </div>`;

  el.querySelector('#btn-to-login').addEventListener('click', () => {
    if (!accounts.length) { toast('Chưa có tài khoản nào — hãy đăng ký trước!'); return; }
    drawAccountList(el, accounts);
  });
  el.querySelector('#btn-to-register').addEventListener('click', () => drawRegister(el));
}

// ==== Danh sách tài khoản đã lưu ====
function drawAccountList(el, accounts) {
  el.innerHTML = `
    <div class="splash auth-scr">
      <div class="splash-bg"></div>
      <div class="splash-inner">
        <h2 class="login-title">Chọn tài khoản</h2>
        <div class="login-list">
          ${accounts.map(a => `
            <button class="card login-acc" data-id="${esc(a.id)}">
              <img class="login-ava" src="assets/trainers/${a.avatar === 'leaf' ? 'leaf' : 'red'}.png" alt="">
              <span class="login-info">
                <b>${esc(a.user)}</b>
                <small>${a.save
                  ? `Lv ${Math.max(1, ...(a.save.party || []).map(m => m.lv || 1))} · ${(a.save.badges || []).length} huy hiệu`
                  : 'Chưa bắt đầu'}</small>
              </span>
              ${a.hasPass ? '<span class="login-lock">Khóa</span>' : ''}
            </button>`).join('')}
        </div>
        <button class="btn" id="btn-back">‹ Quay lại</button>
      </div>
    </div>`;

  el.querySelectorAll('.login-acc').forEach(btn => {
    btn.addEventListener('click', () => {
      const acc = accounts.find(a => a.id === btn.dataset.id);
      if (!acc) return;
      if (acc.hasPass) drawPassword(el, acc);
      else login(acc.id, '').then(([ok]) => { if (ok) show('serverpick'); });
    });
    let timer = null;
    btn.addEventListener('touchstart', () => { timer = setTimeout(() => askDelete(el, btn.dataset.id), 900); }, { passive: true });
    btn.addEventListener('touchend', () => clearTimeout(timer));
    btn.addEventListener('contextmenu', e => { e.preventDefault(); askDelete(el, btn.dataset.id); });
  });
  el.querySelector('#btn-back').addEventListener('click', () => drawHome(el));
}

async function askDelete(el, accId) {
  if (!await confirmDlg('Xóa tài khoản này? Toàn bộ tiến trình sẽ mất!', 'Xóa')) return;
  if (!await confirmDlg('Chắc chắn chứ? Không thể hoàn tác!', 'Xóa vĩnh viễn')) return;
  deleteAccount(accId);
  drawAccountList(el, listAccounts());
}

// ==== Nhập mật khẩu ====
function drawPassword(el, acc) {
  el.innerHTML = `
    <div class="splash auth-scr">
      <div class="splash-bg"></div>
      <div class="splash-inner">
        <img class="login-ava-big" src="assets/trainers/${acc.avatar === 'leaf' ? 'leaf' : 'red'}.png" alt="">
        <h2 class="login-title">${esc(acc.user)}</h2>
        <div class="card name-card">
          <label for="login-pass">Mật khẩu</label>
          <input id="login-pass" type="password" placeholder="Nhập mật khẩu" autocomplete="current-password">
          <button class="btn btn-primary" id="btn-login">Đăng nhập</button>
          <button class="btn" id="btn-back">‹ Chọn tài khoản khác</button>
        </div>
      </div>
    </div>`;
  const input = el.querySelector('#login-pass');
  const go = async () => {
    const [ok, err] = await login(acc.id, input.value);
    if (!ok) { toast(err); input.value = ''; input.focus(); return; }
    show('serverpick');
  };
  el.querySelector('#btn-login').addEventListener('click', go);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  el.querySelector('#btn-back').addEventListener('click', () => drawAccountList(el, listAccounts()));
  input.focus();
}

// ==== Đăng ký (chỉ tài khoản — nhân vật tạo ở màn sau) ====
function drawRegister(el) {
  el.innerHTML = `
    <div class="splash auth-scr">
      <div class="splash-bg"></div>
      <div class="splash-inner">
        <h2 class="login-title">Tạo tài khoản</h2>
        <div class="card name-card">
          <label for="reg-user">Tên tài khoản (2-12 ký tự)</label>
          <input id="reg-user" type="text" maxlength="12" autocomplete="username" placeholder="VD: ashketchum">
          <label for="reg-pass">Mật khẩu (tối thiểu 4 ký tự)</label>
          <input id="reg-pass" type="password" autocomplete="new-password" placeholder="Mật khẩu">
          <label for="reg-pass2">Nhập lại mật khẩu</label>
          <input id="reg-pass2" type="password" autocomplete="new-password" placeholder="Nhập lại">
          <button class="btn btn-primary" id="btn-do-register">Đăng ký</button>
          <button class="btn" id="btn-back">‹ Quay lại</button>
        </div>
        <p class="login-note">Tài khoản lưu trên thiết bị này. Khi chọn máy chủ online, tài khoản sẽ được đồng bộ lên máy chủ.</p>
      </div>
    </div>`;

  el.querySelector('#btn-do-register').addEventListener('click', async () => {
    const user = el.querySelector('#reg-user').value;
    const p1 = el.querySelector('#reg-pass').value;
    const p2 = el.querySelector('#reg-pass2').value;
    if (p1 !== p2) { toast('Mật khẩu nhập lại không khớp!'); return; }
    // Avatar chọn ở màn tạo nhân vật — tạm để 'red', sẽ ghi đè sau
    const [ok, err] = await register(user, p1, 'red');
    if (!ok) { toast(err); return; }
    toast('Tạo tài khoản thành công!');
    show('serverpick');
  });
  el.querySelector('#btn-back').addEventListener('click', () => drawHome(el));
}
