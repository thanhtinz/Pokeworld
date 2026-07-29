// TuxeWorld H5 | ui/splash.js | Màn khởi động: nền + nút START
import { show } from '../main.js';

export function render(el) {
  el.innerHTML = `
    <div class="splash">
      <div class="splash-bg"></div>
      <div class="splash-inner">
        <img class="splash-title" src="assets/img/title.png" alt="TuxeWorld" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'logo splash-logo',textContent:'TuxeWorld'}))">
        <button class="splash-start" id="btn-start">
          <span>START</span>
        </button>
      </div>
      <div class="splash-foot">© Dreamtech Studio</div>
    </div>`;

  const go = () => show('loading');
  el.querySelector('#btn-start').addEventListener('click', go);
  el.querySelector('.splash').addEventListener('click', e => {
    if (e.target.closest('.splash-start')) return; // đã có handler riêng
    go();
  });
}
