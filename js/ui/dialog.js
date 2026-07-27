// PokeWorld H5 | ui/dialog.js | Hộp thoại cutscene kiểu game Pokémon: chạm để qua câu
import { esc } from '../util.js';
import { SPEAKERS } from '../data/story.js';
import { activeAvatar } from '../engine/accounts.js';

// Hiện chuỗi hội thoại [[speakerId, text], ...] — Promise resolve khi xem hết.
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
        <div class="cutscene-box">
          <div class="cutscene-speaker"></div>
          <div class="cutscene-text"></div>
          <div class="cutscene-next">chạm để tiếp tục</div>
        </div>
      </div>`;
    wrap.appendChild(overlay);

    const speakerEl = overlay.querySelector('.cutscene-speaker');
    const textEl = overlay.querySelector('.cutscene-text');
    const faceEl = overlay.querySelector('.cutscene-face');
    let i = 0, typing = null, fullText = '';

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    function showLine() {
      const [sp, text] = lines[i];
      const who = SPEAKERS[sp] || SPEAKERS.sys;
      const img = sp === 'me' ? activeAvatar() : who.img;
      if (img) {
        faceEl.src = `assets/trainers/${img}.png`;
        faceEl.style.display = '';
        faceEl.onerror = () => { faceEl.style.display = 'none'; };
      } else {
        faceEl.style.display = 'none';
      }
      speakerEl.innerHTML = who.name ? `<b>${esc(who.name)}</b>` : '';
      speakerEl.style.display = who.name ? '' : 'none';
      fullText = text;
      textEl.textContent = '';
      if (reduced) { textEl.textContent = fullText; return; }
      let pos = 0;
      clearInterval(typing);
      typing = setInterval(() => {
        pos += 2; // 2 ký tự / tick cho nhanh vừa phải
        textEl.textContent = fullText.slice(0, pos);
        if (pos >= fullText.length) clearInterval(typing);
      }, 24);
    }

    overlay.addEventListener('click', () => {
      // Đang gõ dở -> hiện hết câu
      if (textEl.textContent.length < fullText.length) {
        clearInterval(typing);
        textEl.textContent = fullText;
        return;
      }
      i += 1;
      if (i >= lines.length) {
        clearInterval(typing);
        overlay.remove();
        resolve();
      } else {
        showLine();
      }
    });

    showLine();
  });
}
