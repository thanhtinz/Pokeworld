// PokeWorld H5 | ui/intro.js | Đoạn intro mở đầu (cinematic dựng bằng ảnh + chữ, có nút bỏ qua)
// Muốn dùng video thật: đặt file vào assets/video/intro.mp4 — màn này tự phát video đó
// và bỏ qua phần cinematic ảnh.
import { activeAvatar } from '../engine/accounts.js';
import { G } from '../state.js';
import { esc, sleep, spriteUrl } from '../util.js';
import { show } from '../main.js';

const VIDEO_SRC = 'assets/video/intro.mp4';

// Các cảnh: mỗi cảnh gồm ảnh nền/nhân vật + lời dẫn
const SCENES = [
  {
    bg: 'assets/img/worldmap.jpg',
    art: null,
    text: 'Một thế giới rộng lớn, nơi con người và Pokémon cùng chung sống...',
    ms: 3400,
  },
  {
    bg: 'assets/img/worldmap.jpg',
    art: [spriteUrl(6), spriteUrl(9), spriteUrl(3)],
    text: 'Có những sinh vật mạnh mẽ ẩn mình trong rừng sâu, hang tối và đáy hồ.',
    ms: 3600,
  },
  {
    bg: null,
    art: ['assets/trainers/rocket_m.png', 'assets/trainers/giovanni.png'],
    text: 'Nhưng bóng tối đang trỗi dậy — Team Rocket săn lùng Pokémon khắp nơi.',
    ms: 3600,
    dark: true,
  },
  {
    bg: null,
    art: ['assets/trainers/oak.png'],
    text: 'Giáo sư Oak đang chờ một nhà huấn luyện đủ dũng cảm để thay đổi tất cả.',
    ms: 3400,
  },
  {
    bg: null,
    art: null,
    hero: true,
    text: 'Và hành trình của bạn... bắt đầu từ hôm nay.',
    ms: 3200,
  },
];

export async function render(el) {
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

  // Nếu có video thật thì phát video, không thì chạy cinematic ảnh
  if (await hasVideo()) {
    stage.innerHTML = `<video id="intro-video" playsinline autoplay muted src="${VIDEO_SRC}"></video>`;
    const v = stage.querySelector('#intro-video');
    v.addEventListener('ended', finish);
    v.addEventListener('error', () => runScenes(stage, caption, () => skipped, finish));
    return;
  }
  runScenes(stage, caption, () => skipped, finish);
}

// Kiểm tra file video có tồn tại không (HEAD request, lỗi thì coi như không có)
async function hasVideo() {
  try {
    const r = await fetch(VIDEO_SRC, { method: 'HEAD' });
    return r.ok;
  } catch { return false; }
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
