// TuxeWorld H5 | ui/createchar.js | Tạo nhân vật: chọn giới tính + đặt tên nhà huấn luyện
import { activeAccount, setAvatar, setCharCreated } from '../engine/accounts.js';
import { G, newGame, save, hasSave } from '../state.js';
import { esc } from '../util.js';
import { toast } from './kit.js';
import { show } from '../main.js';

const CHARS = [
  { id: 'red',  label: 'Nam', sub: 'Red',  desc: 'Nhà huấn luyện trẻ đầy nhiệt huyết.' },
  { id: 'leaf', label: 'Nữ',  sub: 'Leaf', desc: 'Cô gái thông minh, yêu Tuxemon.' },
];

export function render(el) {
  const acc = activeAccount();
  let avatar = acc?.avatar === 'leaf' ? 'leaf' : 'red';

  el.innerHTML = `
    <div class="splash create-scr">
      <div class="splash-bg"></div>
      <div class="splash-inner">
        <h2 class="login-title">Tạo nhân vật</h2>

        <div class="char-preview">
          <img id="char-img" src="assets/trainers/${avatar}.png" alt="">
          <p class="char-desc" id="char-desc">${esc(CHARS.find(c => c.id === avatar).desc)}</p>
        </div>

        <div class="char-grid">
          ${CHARS.map(c => `
            <button class="char-card ${c.id === avatar ? 'selected' : ''}" data-ava="${c.id}">
              <img src="assets/trainers/${c.id}.png" alt="${esc(c.label)}">
              <b>${esc(c.label)}</b><small>${esc(c.sub)}</small>
            </button>`).join('')}
        </div>

        <div class="card name-card">
          <label for="char-name">Tên nhà huấn luyện (hiện trong game)</label>
          <input id="char-name" type="text" maxlength="12" placeholder="VD: Ash" value="${esc(acc?.user || '')}" autocomplete="off">
          <button class="btn btn-primary btn-big" id="btn-create">Bắt đầu hành trình</button>
        </div>
      </div>
    </div>`;

  el.querySelectorAll('.char-card').forEach(c => c.addEventListener('click', () => {
    el.querySelectorAll('.char-card').forEach(x => x.classList.remove('selected'));
    c.classList.add('selected');
    avatar = c.dataset.ava;
    el.querySelector('#char-img').src = `assets/trainers/${avatar}.png`;
    el.querySelector('#char-desc').textContent = CHARS.find(x => x.id === avatar).desc;
  }));

  el.querySelector('#btn-create').addEventListener('click', () => {
    const name = el.querySelector('#char-name').value.trim().slice(0, 12);
    if (name.length < 2) { toast('Tên nhân vật tối thiểu 2 ký tự!'); return; }
    setAvatar(avatar);
    setCharCreated(true);
    // Không còn bản lưu của tài khoản này -> dựng ván mới, tuyệt đối không
    // xài lại G.p còn sót của tài khoản vừa đăng xuất.
    if (!G.p || !hasSave()) newGame(name);
    G.p.name = name;
    save();
    show('intro');
  });
}
