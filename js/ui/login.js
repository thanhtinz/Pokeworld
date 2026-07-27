// PokeWorld H5 | ui/login.js | Màn đăng nhập / đăng ký + chọn nhân vật Nam (Red) / Nữ (Leaf)
import { listAccounts, register, login, deleteAccount } from '../engine/accounts.js';
import { load } from '../state.js';
import { esc } from '../util.js';
import { toast, confirmDlg } from './kit.js';
import { show } from '../main.js';

function enterGame() {
  const ok = load();
  show(ok ? 'home' : 'starter');
}

export function render(el) {
  const accounts = listAccounts();
  drawList(el, accounts);
}

// ==== Danh sách tài khoản ====
function drawList(el, accounts) {
  el.innerHTML = `
    <div class="starter-wrap">
      <img class="title-art" src="assets/img/title.png" alt="" onerror="this.remove()">
      <div class="logo">Poke<span>World</span></div>
      <p class="tagline">Đăng nhập để bắt đầu hành trình</p>

      <div class="login-list">
        ${accounts.map(a => `
          <button class="card login-acc" data-id="${esc(a.id)}">
            <img class="login-ava" src="assets/trainers/${a.avatar === 'leaf' ? 'leaf' : 'red'}.png" alt="">
            <span class="login-info">
              <b>${esc(a.user)}</b>
              <small>${a.save ? `Lv cao nhất ${Math.max(1, ...(a.save.party || []).map(m => m.lv || 1))} · ${(a.save.badges || []).length} huy hiệu` : 'Chưa bắt đầu'}</small>
            </span>
            ${a.hasPass ? '<span class="login-lock">🔒</span>' : ''}
          </button>`).join('')}
      </div>

      <button class="btn btn-primary btn-big" id="btn-register">＋ Tạo tài khoản mới</button>
    </div>`;

  el.querySelectorAll('.login-acc').forEach(btn => {
    btn.addEventListener('click', () => {
      const acc = accounts.find(a => a.id === btn.dataset.id);
      if (!acc) return;
      if (acc.hasPass) drawLogin(el, acc);
      else login(acc.id, '').then(([ok]) => { if (ok) enterGame(); });
    });
    // Giữ lâu để xóa tài khoản
    let timer = null;
    btn.addEventListener('touchstart', () => { timer = setTimeout(() => askDelete(el, btn.dataset.id), 900); }, { passive: true });
    btn.addEventListener('touchend', () => clearTimeout(timer));
    btn.addEventListener('contextmenu', e => { e.preventDefault(); askDelete(el, btn.dataset.id); });
  });
  el.querySelector('#btn-register').addEventListener('click', () => drawRegister(el));
}

async function askDelete(el, accId) {
  const ok = await confirmDlg('Xóa tài khoản này? Toàn bộ tiến trình sẽ mất!', 'Xóa');
  if (!ok) return;
  const ok2 = await confirmDlg('Chắc chắn chứ? Không thể hoàn tác!', 'Xóa vĩnh viễn');
  if (!ok2) return;
  deleteAccount(accId);
  drawList(el, listAccounts());
}

// ==== Nhập mật khẩu ====
function drawLogin(el, acc) {
  el.innerHTML = `
    <div class="starter-wrap">
      <img class="login-ava-big" src="assets/trainers/${acc.avatar === 'leaf' ? 'leaf' : 'red'}.png" alt="">
      <h2 class="login-title">${esc(acc.user)}</h2>
      <div class="card name-card">
        <label for="login-pass">Mật khẩu</label>
        <input id="login-pass" type="password" placeholder="Nhập mật khẩu" autocomplete="current-password">
        <button class="btn btn-primary" id="btn-login">Đăng nhập ▸</button>
        <button class="btn" id="btn-back-list">‹ Chọn tài khoản khác</button>
      </div>
    </div>`;
  const input = el.querySelector('#login-pass');
  const go = async () => {
    const [ok, err] = await login(acc.id, input.value);
    if (!ok) { toast(err); input.value = ''; input.focus(); return; }
    enterGame();
  };
  el.querySelector('#btn-login').addEventListener('click', go);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  el.querySelector('#btn-back-list').addEventListener('click', () => drawList(el, listAccounts()));
  input.focus();
}

// ==== Đăng ký + chọn nhân vật ====
function drawRegister(el) {
  let avatar = 'red';
  el.innerHTML = `
    <div class="starter-wrap">
      <h2 class="login-title">Tạo tài khoản</h2>

      <p class="sec-title" style="text-align:center">Chọn nhân vật của bạn</p>
      <div class="char-grid">
        <button class="char-card selected" data-ava="red">
          <img src="assets/trainers/red.png" alt="Nam">
          <b>Nam</b><small>Red</small>
        </button>
        <button class="char-card" data-ava="leaf">
          <img src="assets/trainers/leaf.png" alt="Nữ">
          <b>Nữ</b><small>Leaf</small>
        </button>
      </div>

      <div class="card name-card">
        <label for="reg-user">Tên tài khoản (2-12 ký tự)</label>
        <input id="reg-user" type="text" maxlength="12" autocomplete="username" placeholder="VD: Ash">
        <label for="reg-pass">Mật khẩu (tối thiểu 4 ký tự)</label>
        <input id="reg-pass" type="password" autocomplete="new-password" placeholder="Mật khẩu">
        <label for="reg-pass2">Nhập lại mật khẩu</label>
        <input id="reg-pass2" type="password" autocomplete="new-password" placeholder="Nhập lại">
        <button class="btn btn-primary" id="btn-do-register">Tạo & vào game ▸</button>
        <button class="btn" id="btn-back-list">‹ Quay lại</button>
      </div>
      <p class="login-note">Tài khoản lưu trên thiết bị này. Đừng quên mật khẩu — không có cách khôi phục!</p>
    </div>`;

  el.querySelectorAll('.char-card').forEach(c => c.addEventListener('click', () => {
    el.querySelectorAll('.char-card').forEach(x => x.classList.remove('selected'));
    c.classList.add('selected');
    avatar = c.dataset.ava;
  }));

  el.querySelector('#btn-do-register').addEventListener('click', async () => {
    const user = el.querySelector('#reg-user').value;
    const p1 = el.querySelector('#reg-pass').value;
    const p2 = el.querySelector('#reg-pass2').value;
    if (p1 !== p2) { toast('Mật khẩu nhập lại không khớp!'); return; }
    const [ok, err] = await register(user, p1, avatar);
    if (!ok) { toast(err); return; }
    toast(`Chào mừng ${user.trim()}! Hãy chọn Pokémon đầu tiên.`);
    enterGame();
  });
  el.querySelector('#btn-back-list').addEventListener('click', () => drawList(el, listAccounts()));
}
