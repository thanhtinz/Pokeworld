// TuxeWorld H5 | ui/splash.js | Màn khởi động: nền + nút START
import { show } from '../main.js';

export function render(el) {
  el.innerHTML = `
    <div class="splash">
      <div class="splash-bg"></div>
      <div class="splash-inner">
        <img class="splash-title" src="assets/img/title.png" alt="" onerror="this.remove()">
        <div class="logo splash-logo">Poke<span>World</span></div>
        <p class="tagline">Bắt · Huấn luyện · Chinh phục</p>

        <button class="splash-start" id="btn-start">
          <span>START</span>
        </button>
        <p class="splash-hint">Chạm để bắt đầu</p>
      </div>
      <div class="splash-foot">Fan game phi lợi nhuận · v1.0</div>
    </div>`;

  const go = () => show('loading');
  el.querySelector('#btn-start').addEventListener('click', go);
  el.querySelector('.splash').addEventListener('click', e => {
    if (e.target.closest('.splash-start')) return; // đã có handler riêng
    go();
  });
}
