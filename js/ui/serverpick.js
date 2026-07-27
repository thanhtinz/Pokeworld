// PokeWorld H5 | ui/serverpick.js | Chọn máy chủ: chơi offline trên máy hoặc kết nối máy chủ online
import { getServerUrl, setServerUrl, setToken } from '../net/config.js';
import { fetchConfig, register as netRegister, login as netLogin } from '../net/api.js';
import { activeAccount } from '../engine/accounts.js';
import { esc } from '../util.js';
import { toast } from './kit.js';
import { show } from '../main.js';

// Máy chủ dựng sẵn — sửa danh sách này khi bạn có VPS
const SERVERS = [
  // { id: 'vn1', name: 'Việt Nam 1', url: 'https://api.tenmien.com', region: 'Đông Nam Á' },
];

const LAST_KEY = 'pw_last_server';

export function render(el) {
  const acc = activeAccount();
  const saved = localStorage.getItem(LAST_KEY) || '';

  el.innerHTML = `
    <div class="splash server-scr">
      <div class="splash-bg"></div>
      <div class="splash-inner">
        <h2 class="login-title">Chọn máy chủ</h2>
        <p class="server-hint">Xin chào <b>${esc(acc?.user || 'Trainer')}</b> — chọn nơi bạn muốn chơi</p>

        <div class="server-list">
          <button class="card server-card ${!saved ? 'selected' : ''}" data-url="">
            <span class="sv-dot sv-off"></span>
            <span class="sv-info">
              <b>Chơi Offline</b>
              <small>Lưu trên máy này · không cần mạng · không có PvP/Bang hội</small>
            </span>
          </button>

          ${SERVERS.map(s => `
            <button class="card server-card" data-url="${esc(s.url)}">
              <span class="sv-dot" data-ping="${esc(s.url)}"></span>
              <span class="sv-info">
                <b>${esc(s.name)}</b>
                <small class="sv-status" data-for="${esc(s.url)}">${esc(s.region)} · đang kiểm tra...</small>
              </span>
            </button>`).join('')}
        </div>

        <div class="card name-card">
          <label for="sv-custom">Hoặc nhập địa chỉ máy chủ riêng</label>
          <input id="sv-custom" type="url" placeholder="https://api.tenmien.com" value="${esc(saved)}" autocomplete="off">
          <button class="btn" id="btn-test">Kiểm tra kết nối</button>
        </div>

        <button class="btn btn-primary btn-big" id="btn-enter">Vào game</button>
      </div>
    </div>`;

  let chosen = saved;   // '' = offline

  el.querySelectorAll('.server-card').forEach(card => {
    card.addEventListener('click', () => {
      el.querySelectorAll('.server-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      chosen = card.dataset.url;
      el.querySelector('#sv-custom').value = chosen;
    });
  });

  // Kiểm tra máy chủ dựng sẵn
  for (const s of SERVERS) pingServer(el, s.url);

  el.querySelector('#btn-test').addEventListener('click', async () => {
    const url = el.querySelector('#sv-custom').value.trim();
    if (!url) { toast('Nhập địa chỉ máy chủ đã!'); return; }
    const prev = getServerUrl();
    setServerUrl(url);
    const r = await fetchConfig();
    setServerUrl(prev);
    if (r.ok) {
      toast(`Kết nối được: ${r.data.serverName || 'máy chủ'} · ${r.data.online || 0} người online`);
      chosen = url;
      el.querySelectorAll('.server-card').forEach(c => c.classList.remove('selected'));
    } else {
      toast('Không kết nối được máy chủ này.');
    }
  });

  el.querySelector('#btn-enter').addEventListener('click', async () => {
    const custom = el.querySelector('#sv-custom').value.trim();
    const url = custom || chosen;
    if (!url) {                     // chơi offline
      setServerUrl(null);
      setToken(null);
      localStorage.setItem(LAST_KEY, '');
      return goNext();
    }
    setServerUrl(url);
    localStorage.setItem(LAST_KEY, url);
    toast('Đang kết nối máy chủ...');
    const ok = await syncAccount();
    if (!ok) {
      toast('Không đăng nhập được máy chủ — tạm chơi offline.');
      setServerUrl(null);
      setToken(null);
    }
    goNext();
  });
}

// Đồng bộ tài khoản cục bộ lên máy chủ (đăng nhập, chưa có thì đăng ký)
async function syncAccount() {
  const acc = activeAccount();
  if (!acc) return false;
  // Mật khẩu cục bộ đã băm nên không dùng lại được — dùng khóa dẫn xuất ổn định từ id tài khoản
  const pass = 'pw_' + acc.id.slice(-16);
  let r = await netLogin(acc.user, pass);
  if (!r.ok) r = await netRegister(acc.user, pass, acc.avatar || 'red');
  return r.ok;
}

function goNext() {
  const acc = activeAccount();
  // Đã tạo nhân vật rồi thì vào thẳng game
  show(acc?.charCreated ? 'home' : 'createchar');
}

// Kiểm tra máy chủ dựng sẵn: hiện trạng thái + số người online
async function pingServer(el, url) {
  const dot = el.querySelector(`.sv-dot[data-ping="${CSS.escape(url)}"]`);
  const status = el.querySelector(`.sv-status[data-for="${CSS.escape(url)}"]`);
  const prev = getServerUrl();
  setServerUrl(url);
  const r = await fetchConfig();
  setServerUrl(prev);
  if (!dot || !status) return;
  if (r.ok) {
    dot.classList.add('sv-on');
    status.textContent = `${r.data.serverName || 'Máy chủ'} · ${r.data.online || 0} người online`;
  } else {
    dot.classList.add('sv-down');
    status.textContent = 'Không kết nối được';
  }
}
