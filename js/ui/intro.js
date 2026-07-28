// TuxeWorld H5 | ui/intro.js | Đoạn mở đầu: cinematic ảnh + lời dẫn, có nút bỏ qua
//
// Trước đây màn này dò thử assets/video/intro.mp4 bằng một request HEAD để nếu
// có video thì phát video thay cinematic. Dự án không kèm video nào nên lần nào
// vào game mới cũng ăn một lỗi 404 đỏ lòm trong console. Bỏ hẳn phần dò; muốn
// dùng video thì thêm lại vài dòng ở đây, đừng để nó dò mò mỗi lần chạy.
import { activeAvatar } from '../engine/accounts.js';
import { G } from '../state.js';
import { STARTERS } from '../data/starters.js';
import { esc, sleep, spriteUrl } from '../util.js';
import { show } from '../main.js';

// Bối cảnh lấy đúng theo thế giới Tuxemon: Thị Trấn Taba, ba Tuxemon khởi đầu
// của Giáo sư, lệnh cấm nuôi Tuxemon và tổ chức Team Xero đi lùng bắt.
const SCENES = [
  {
    bg: 'assets/img/worldmap.jpg',
    text: 'Đã có một thời con người và Tuxemon rong ruổi khắp thế giới cùng nhau...',
    ms: 3400,
  },
  {
    bg: 'assets/img/worldmap.jpg',
    art: STARTERS.map(s => spriteUrl(s.sp)),
    text: 'Mỗi vùng đất một hệ, một giống loài — không nơi nào giống nơi nào.',
    ms: 3600,
  },
  {
    art: ['assets/trainers/chief.png', 'assets/trainers/grunt.png'],
    text: 'Rồi lệnh cấm ập xuống: chỉ người được cấp phép mới được nuôi Tuxemon. '
        + 'Team Xero đi lùng bắt những con còn sót lại.',
    ms: 4200,
    dark: true,
  },
  {
    art: ['assets/trainers/professor.png'],
    text: 'Ở Thị Trấn Taba, Giáo sư vẫn giấu ba Tuxemon cuối cùng — chờ một người dám nhận.',
    ms: 3800,
  },
  {
    hero: true,
    text: 'Hôm nay, bạn bước ra khỏi cửa.',
    ms: 3000,
  },
];

export function render(el) {
  el.innerHTML = `
    <div class="intro-wrap" id="intro">
      <div class="intro-stage" id="stage"></div>
      <div class="intro-caption" id="caption"></div>
      <button class="intro-skip" id="btn-skip">Bỏ qua ›</button>
    </div>`;

  const stage = el.querySelector('#stage');
  const caption = el.querySelector('#caption');
  let skipped = false;
  const finish = () => { if (!skipped) { skipped = true; show('starter'); } };
  el.querySelector('#btn-skip').addEventListener('click', finish);

  runScenes(stage, caption, () => skipped, finish);
}

async function runScenes(stage, caption, isSkipped, done) {
  const avatar = activeAvatar();
  const name = G.p?.name || 'Trainer';

  for (const sc of SCENES) {
    if (isSkipped()) return;
    const arts = sc.hero ? [`assets/trainers/${avatar}.png`] : (sc.art || []);
    stage.innerHTML = `
      <div class="scene ${sc.dark ? 'scene-dark' : ''}">
        ${sc.bg ? `<img class="scene-bg" src="${sc.bg}" alt="" onerror="this.remove()">` : ''}
        <div class="scene-arts">
          ${arts.map((a, i) => `<img class="scene-art art-${i}" src="${a}" alt="" onerror="this.remove()">`).join('')}
        </div>
      </div>`;
    caption.classList.remove('show');
    void caption.offsetWidth;
    caption.textContent = sc.hero ? sc.text.replace('bạn', esc(name)) : sc.text;
    caption.classList.add('show');
    await sleep(sc.ms);
  }
  if (!isSkipped()) done();
}
