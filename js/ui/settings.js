// PokeWorld H5 | ui/settings.js | Cài đặt: âm thanh, hình ảnh, tự động, tài khoản
// Mọi công tắc ở đây đều nối thẳng vào engine/settings.js và có tác dụng thật.
import { wipeSave } from '../state.js';
import { logout } from '../engine/accounts.js';
import { esc } from '../util.js';
import { toast, confirmDlg, header } from './kit.js';
import { uiIcon } from './icons.js';
import { settings, setSetting, resetSettings, sfx } from '../engine/settings.js';
import { isOnlineMode } from '../net/config.js';
import { show } from '../main.js';

const SPEEDS = [['slow', 'Chậm'], ['normal', 'Vừa'], ['fast', 'Nhanh']];

export function render(el) {
  function draw() {
    const s = settings();

    // Một dòng công tắc bật/tắt
    const sw = (key, name, desc) => `
      <div class="set-row">
        <span class="set-mid"><b>${esc(name)}</b><small>${esc(desc)}</small></span>
        <button type="button" class="switch ${s[key] ? 'on' : ''}" data-sw="${key}"
                role="switch" aria-checked="${!!s[key]}" aria-label="${esc(name)}"></button>
      </div>`;

    el.innerHTML = `
      ${header('Cài đặt', 'menu')}

      <div class="card set-group">
        <h3>Âm thanh</h3>
        ${sw('sfx', 'Hiệu ứng âm thanh', 'Tiếng chạm nút, đòn đánh, nhận thưởng.')}
        <div class="set-row">
          <span class="set-mid"><b>Âm lượng</b><small>${Math.round(s.volume * 100)}%</small></span>
          <span class="set-range">
            <input type="range" id="set-vol" min="0" max="100" step="5" value="${Math.round(s.volume * 100)}"
                   ${s.sfx ? '' : 'disabled'} aria-label="Âm lượng">
          </span>
        </div>
      </div>

      <div class="card set-group">
        <h3>Hình ảnh</h3>
        ${sw('anim', 'Ảnh Pokémon động', 'Tắt thì dùng ảnh tĩnh, nhẹ mạng và mượt hơn trên máy yếu.')}
        ${sw('motion', 'Hiệu ứng chuyển động', 'Rung, nháy, chữ chạy trong hội thoại.')}
        ${sw('stars', 'Nền sao', 'Lớp sao lấp lánh phía sau giao diện.')}
        <div class="set-row">
          <span class="set-mid"><b>Tốc độ chữ</b><small>Nhịp hiện lời thoại trong trận đấu.</small></span>
          <span class="seg">
            ${SPEEDS.map(([v, n]) => `<button type="button" data-speed="${v}" class="${s.textSpeed === v ? 'on' : ''}">${n}</button>`).join('')}
          </span>
        </div>
      </div>

      <div class="card set-group">
        <h3>Tự động</h3>
        ${sw('autoDialog', 'Tự qua lời thoại', 'Đọc xong câu là tự sang câu kế, không cần chạm.')}
        ${sw('autoSync', 'Tự lưu lên máy chủ', `Cứ 30 giây đẩy tiến trình lên máy chủ một lần.${isOnlineMode() ? '' : ' (Đang chơi offline nên chưa dùng tới.)'}`)}
      </div>

      <div class="card set-group">
        <h3>Tài khoản</h3>
        <button class="btn" id="btn-server">${uiIcon('server', 20)} Đổi máy chủ</button>
        <button class="btn" id="btn-reset-set">Khôi phục cài đặt mặc định</button>
        <button class="btn" id="btn-logout">Đăng xuất</button>
        <button class="btn btn-danger" id="btn-wipe">Xóa save chơi lại</button>
      </div>

      <div class="card about-card">
        <b>PokeWorld H5 v1.0</b>
        <small>Fan game phi lợi nhuận, chơi vui trên trình duyệt. Pokémon © Nintendo / Game Freak. Sprite: PokeAPI.</small>
      </div>`;

    el.querySelectorAll('[data-sw]').forEach(b => b.addEventListener('click', () => {
      const key = b.dataset.sw;
      setSetting(key, !settings()[key]);
      sfx(settings()[key] ? 'confirm' : 'cancel');
      draw();
    }));

    const vol = el.querySelector('#set-vol');
    if (vol) {
      vol.addEventListener('input', () => setSetting('volume', Number(vol.value) / 100));
      // Thả tay mới kêu thử, không thì kéo một cái là kêu ầm ĩ
      vol.addEventListener('change', () => { sfx('coin'); draw(); });
    }

    el.querySelectorAll('[data-speed]').forEach(b => b.addEventListener('click', () => {
      setSetting('textSpeed', b.dataset.speed);
      sfx('tap');
      draw();
    }));

    el.querySelector('#btn-server').addEventListener('click', () => show('serverpick'));

    el.querySelector('#btn-reset-set').addEventListener('click', async () => {
      if (!await confirmDlg('Đưa mọi cài đặt về mặc định?', 'Khôi phục')) return;
      resetSettings();
      toast('Đã khôi phục cài đặt mặc định.');
      draw();
    });

    el.querySelector('#btn-logout').addEventListener('click', () => {
      logout();
      location.reload();
    });

    el.querySelector('#btn-wipe').addEventListener('click', async () => {
      if (!await confirmDlg('Xóa toàn bộ dữ liệu và chơi lại từ đầu?', 'Xóa')) return;
      if (!await confirmDlg('Chắc chắn chứ? Không thể hoàn tác!', 'Xóa luôn')) return;
      wipeSave();
      toast('Đã xóa save. Bắt đầu lại!');
      show('starter');
    });
  }

  draw();
}
