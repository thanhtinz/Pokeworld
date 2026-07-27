// TuxeWorld H5 | ui/serverpick.js | Chọn máy chủ: chơi offline hoặc chọn một máy chủ online
// Danh sách máy chủ nằm ở js/net/servers.js — người chơi chỉ chọn, không tự nhập địa chỉ.
import { getServerUrl, setServerUrl, setToken } from '../net/config.js';
import { fetchConfig, register as netRegister, login as netLogin } from '../net/api.js';
import { activeAccount } from '../engine/accounts.js';
import { SERVERS, isDevMode, setDevMode, getDevUrl, setDevUrl } from '../net/servers.js';
import { esc } from '../util.js';
import { toast } from './kit.js';
import { show } from '../main.js';
import { G, load } from '../state.js';

const LAST_KEY = 'pw_last_server';

export function render(el) {
  const acc = activeAccount();
  const saved = localStorage.getItem(LAST_KEY) || '';
  // Máy chủ đã lưu mà nay không còn trong danh sách thì coi như chưa chọn
  const savedOk = SERVERS.some(s => s.url === saved);
  let chosen = savedOk ? saved : '';   // '' = chơi offline
  let dev = isDevMode();

  el.innerHTML = `
    <div class="splash server-scr">
      <div class="splash-bg"></div>
      <div class="splash-inner">
        <h2 class="login-title" id="sv-title">Chọn máy chủ</h2>
        <p class="server-hint">Xin chào <b>${esc(acc?.user || 'Trainer')}</b> — chọn nơi bạn muốn chơi</p>

        <div class="server-list">
          <button class="card server-card ${chosen ? '' : 'selected'}" data-url="">
            <span class="sv-dot sv-off"></span>
            <span class="sv-info">
              <b>Chơi Offline</b>
              <small>Lưu trên máy này · không cần mạng · không có PvP/Bang hội</small>
            </span>
          </button>

          ${SERVERS.map(s => `
            <button class="card server-card ${chosen === s.url ? 'selected' : ''}" data-url="${esc(s.url)}">
              <span class="sv-dot" data-ping="${esc(s.url)}"></span>
              <span class="sv-info">
                <b>${esc(s.name)}${s.note ? ` <em class="sv-note">${esc(s.note)}</em>` : ''}</b>
                <small class="sv-status" data-for="${esc(s.url)}">${esc(s.region || '')} · đang kiểm tra...</small>
              </span>
            </button>`).join('')}
        </div>

        ${SERVERS.length ? '' : `
          <p class="server-note">Hiện chưa có máy chủ online nào. Bạn vẫn chơi được toàn bộ
          cốt truyện ở chế độ Offline; khi máy chủ mở, nó sẽ hiện ngay tại đây.</p>`}

        <div class="card name-card dev-box" id="dev-box" style="${dev ? '' : 'display:none'}">
          <label for="sv-custom">Chế độ thử máy chủ (dành cho người phát triển)</label>
          <input id="sv-custom" type="url" placeholder="https://api.tenmien.com" value="${esc(getDevUrl())}" autocomplete="off">
          <button class="btn" id="btn-test">Kiểm tra kết nối</button>
        </div>

        <button class="btn btn-primary btn-big" id="btn-enter">Vào game</button>
      </div>
    </div>`;

  const select = (url) => {
    chosen = url;
    el.querySelectorAll('.server-card').forEach(c => c.classList.toggle('selected', c.dataset.url === url));
  };

  el.querySelectorAll('.server-card').forEach(card => {
    card.addEventListener('click', () => select(card.dataset.url));
  });

  // Kiểm tra tình trạng từng máy chủ trong danh sách
  for (const s of SERVERS) pingServer(el, s.url);

  // Chạm 5 lần vào tiêu đề để bật/tắt chế độ thử máy chủ
  let taps = 0, tapTimer = null;
  el.querySelector('#sv-title').addEventListener('click', () => {
    taps += 1;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { taps = 0; }, 1200);
    if (taps < 5) return;
    taps = 0;
    dev = !dev;
    setDevMode(dev);
    el.querySelector('#dev-box').style.display = dev ? '' : 'none';
    toast(dev ? 'Đã bật chế độ thử máy chủ' : 'Đã tắt chế độ thử máy chủ');
  });

  el.querySelector('#btn-test').addEventListener('click', async () => {
    const url = el.querySelector('#sv-custom').value.trim();
    if (!url) { toast('Nhập địa chỉ máy chủ đã!'); return; }
    const r = await probe(url);
    if (r.ok) {
      setDevUrl(url);
      select(url);
      toast(`Kết nối được: ${r.data.serverName || 'máy chủ'} · ${r.data.online || 0} người online`);
    } else {
      toast('Không kết nối được máy chủ này.');
    }
  });

  el.querySelector('#btn-enter').addEventListener('click', async () => {
    if (!chosen) {                    // chơi offline
      setServerUrl(null);
      setToken(null);
      localStorage.setItem(LAST_KEY, '');
      return goNext();
    }
    setServerUrl(chosen);
    localStorage.setItem(LAST_KEY, chosen);
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
  // Đã tạo nhân vật rồi thì vào thẳng game — nhưng phải NẠP ĐƯỢC bản lưu đã.
  // Tài khoản đánh dấu "đã tạo nhân vật" mà bản lưu mất (xoá dở, hết dung lượng)
  // thì vào thẳng home sẽ vỡ mọi màn; cho tạo lại nhân vật vẫn hơn.
  const ready = acc?.charCreated && (G.p || load());
  show(ready ? 'home' : 'createchar');
}

// Hỏi thử một máy chủ mà không làm hỏng lựa chọn hiện tại
async function probe(url) {
  const prev = getServerUrl();
  setServerUrl(url);
  const r = await fetchConfig();
  setServerUrl(prev);
  return r;
}

// Hiện tình trạng + số người online của máy chủ trong danh sách
async function pingServer(el, url) {
  const r = await probe(url);
  const dot = el.querySelector(`.sv-dot[data-ping="${CSS.escape(url)}"]`);
  const status = el.querySelector(`.sv-status[data-for="${CSS.escape(url)}"]`);
  if (!dot || !status) return;
  if (r.ok) {
    dot.classList.add('sv-on');
    status.textContent = `${r.data.serverName || 'Máy chủ'} · ${r.data.online || 0} người online`;
  } else {
    dot.classList.add('sv-down');
    status.textContent = 'Không kết nối được';
  }
}
