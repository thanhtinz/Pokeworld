// PokeWorld H5 | ui/dialog.js | Hộp thoại cutscene kiểu game Pokémon: chạm để qua câu
import { esc } from '../util.js';
import { SPEAKERS } from '../data/story.js';
import { activeAvatar } from '../engine/accounts.js';
import { getSetting, textDelay, sfx } from '../engine/settings.js';

// Hiện chuỗi hội thoại [[người nói, text], ...] — Promise resolve khi xem hết.
// "người nói" là mã trong SPEAKERS, hoặc một object tự đặt:
//   { name, img }  -> ảnh 2D trong assets/trainers/
//   { name, ow }   -> lấy khung "đứng nhìn xuống" của sprite trong assets/ow/
// Chữ hiện kiểu đánh máy; chạm 1 lần hiện hết câu, chạm lần nữa qua câu sau.
export function playDialog(lines) {
  return new Promise(resolve => {
    if (!lines || !lines.length) return resolve();
    const wrap = document.getElementById('modal-wrap');
    const overlay = document.createElement('div');
    overlay.className = 'cutscene-overlay';
    overlay.innerHTML = `
      <div class="cutscene-wrap">
        <img class="cutscene-face" alt="" style="display:none">
        <div class="cutscene-face ow-face" style="display:none"></div>
        <div class="cutscene-box">
          <div class="cutscene-speaker"></div>
          <div class="cutscene-text"></div>
          <div class="cutscene-next">chạm để tiếp tục</div>
        </div>
      </div>`;
    wrap.appendChild(overlay);

    const speakerEl = overlay.querySelector('.cutscene-speaker');
    const textEl = overlay.querySelector('.cutscene-text');
    const faceEl = overlay.querySelector('img.cutscene-face');
    const owEl = overlay.querySelector('.ow-face');
    let i = 0, typing = null, fullText = '';

    // Tắt chuyển động (hệ điều hành hoặc cài đặt trong game) -> hiện thẳng cả câu
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || !getSetting('motion');

    function showLine() {
      const [sp, text] = lines[i];
      const who = (sp && typeof sp === 'object') ? sp : (SPEAKERS[sp] || SPEAKERS.sys);
      const img = sp === 'me' ? activeAvatar() : who.img;
      faceEl.style.display = 'none';
      owEl.style.display = 'none';
      if (img) {
        faceEl.src = `assets/trainers/${img}.png`;
        faceEl.style.display = '';
        faceEl.onerror = () => { faceEl.style.display = 'none'; };
      } else if (who.ow) {
        // Không có ảnh 2D riêng thì phóng to khung "đứng nhìn xuống" của sprite trên bản đồ
        owEl.style.backgroundImage = `url(assets/ow/${who.ow}.png)`;
        owEl.style.display = '';
      }
      speakerEl.innerHTML = who.name ? `<b>${esc(who.name)}</b>` : '';
      speakerEl.style.display = who.name ? '' : 'none';
      fullText = text;
      textEl.textContent = '';
      if (reduced) { textEl.textContent = fullText; scheduleAuto(); return; }
      let pos = 0;
      clearInterval(typing);
      typing = setInterval(() => {
        pos += 2; // 2 ký tự / tick cho nhanh vừa phải
        textEl.textContent = fullText.slice(0, pos);
        if (pos >= fullText.length) {
          clearInterval(typing);
          scheduleAuto();
        }
      }, textDelay(24));
    }

    // Chế độ tự chạy: gõ xong câu thì tự sang câu kế, không phải chạm
    let autoTimer = null;
    function scheduleAuto() {
      clearTimeout(autoTimer);
      if (!getSetting('autoDialog')) return;
      autoTimer = setTimeout(next, textDelay(1400));
    }

    function next() {
      clearInterval(typing);
      clearTimeout(autoTimer);
      i += 1;
      if (i >= lines.length) { overlay.remove(); resolve(); }
      else showLine();
    }

    overlay.addEventListener('click', () => {
      sfx('tap');
      // Đang gõ dở -> hiện hết câu
      if (textEl.textContent.length < fullText.length) {
        clearInterval(typing);
        textEl.textContent = fullText;
        scheduleAuto();
        return;
      }
      next();
    });

    showLine();
  });
}
