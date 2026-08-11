// TuxeWorld H5 | ui/home.js | Màn chính: bảng tóm tắt khu vực + lối đi ra bản đồ
//
// Trước đây màn này là chế độ IDLE tự đánh quái. Từ khi chuyển sang đi bộ trên
// bản đồ thì gặp Tuxemon là do người chơi bước vào bụi cỏ, nên phần tự đánh đã
// bỏ hẳn. Màn này giờ chỉ còn: đang ở đâu, chương truyện nào, và các nút để đi.
import { G } from '../state.js';
import { currentChapter, needIntro, markIntroSeen, emitStory, storyProgress } from '../engine/story.js';
import { playDialog } from './dialog.js';
import { ZONES } from '../data/zones.js';
import { esc, boxIcon, upgradeImages, tien } from '../util.js';
import { toast, itemIcon } from './kit.js';
import { uiIcon } from './icons.js';
import { veCanh } from './scene.js';
import { show, refresh } from '../main.js';

// Icon đại diện zone: ưu tiên sprite item, sau đó artwork Tuxemon, cuối cùng bỏ trống
function zoneIcon(z, size = 22) {
  if (!z) return '';
  if (z.iconItem) return itemIcon(z.iconItem, '', size);
  if (z.iconSp) return `<span class="zone-ico"><img class="px-icon" src="${boxIcon(z.iconSp)}" width="${size}" height="${size}" alt=""></span>`;
  return '';
}

// Khóa chống phát trùng cutscene: refresh() lồng nhau từng tạo 2 hộp thoại chồng lên nhau
let introBusy = false;
let introTimer = null;

// Chương hoàn thành -> phát thoại kết + báo thưởng
async function chapterDone(ch) {
  if (!ch) return;
  if (ch.outro?.length) await playDialog(ch.outro);
  const parts = [];
  if (ch.reward?.money) parts.push(`${tien(ch.reward.money)}`);
  for (const it of ch.reward?.items || []) parts.push(`${it.id} x${it.n}`);
  toast(`${ch.title} hoàn thành!${parts.length ? ' Nhận: ' + parts.join(', ') : ''}`);
  refresh();
}

export function render(el) {
  const zone = ZONES[G.p.zone] || Object.values(ZONES)[0];
  const ch = currentChapter();
  const prog = storyProgress();

  el.innerHTML = `
    <div class="hero">
      <canvas class="hero-canvas" id="home-scene"></canvas>
      <div class="hero-veil"></div>
      <div class="hero-top">
        <span class="zone-chip">${zoneIcon(zone, 20)} <b>${esc(zone.name)}</b></span>
      </div>
      <div class="hero-foot">
        <p class="hero-desc">${esc(zone.desc || '')}</p>
        <button class="btn btn-primary btn-big hero-go" id="btn-world">
          ${uiIcon('map', 20)} Đi bộ trên bản đồ
        </button>
      </div>
    </div>

    ${ch ? `
    <button class="card story-card" id="btn-story">
      <span class="story-badge">${itemIcon('shaft_badge', '', 18)} ${prog.done}/${prog.total}</span>
      <span class="story-body"><b>${esc(ch.title)}</b><small>${esc(ch.desc)}</small></span>
      ${needIntro() ? '<span class="story-new" title="Mới"></span>' : ''}
    </button>` : (prog.finished ? `<div class="card story-card done"><img src="assets/img/crown.png" class="crown-ico" alt="" onerror="this.style.visibility='hidden'"> Đã phá đảo cốt truyện — tiếp tục hoàn thành Tuxedex!</div>` : '')}

  `;
  upgradeImages(el);

  // Cảnh sống trong khung hero — nhớ tắt vòng vẽ khi rời màn
  const tatCanh = veCanh(el.querySelector('#home-scene'));
  el.addEventListener('screen-leave', tatCanh, { once: true });

  // ==== Cốt truyện ====
  async function playChapterIntro() {
    if (introBusy || !ch || !needIntro()) return;
    introBusy = true;
    try {
      await playDialog(ch.dialog);
      markIntroSeen();
      // Chương có mục tiêu hoàn thành ngay khi xem thoại (vd ch1: đã chọn starter)
      const done = emitStory('choose_starter', {});
      if (done) await chapterDone(done);
    } finally {
      introBusy = false;
    }
    refresh();
  }

  const btnStory = el.querySelector('#btn-story');
  if (btnStory && ch) btnStory.addEventListener('click', () => {
    if (needIntro()) playChapterIntro();
    else toast(ch.desc);
  });

  // Chương mới -> cutscene tự chạy như game gốc (không bắt người chơi tự đi tìm nút).
  // Hủy lịch cũ trước khi đặt lịch mới để mỗi lần render chỉ còn đúng 1 hàng chờ.
  clearTimeout(introTimer);
  if (ch && needIntro() && !introBusy) introTimer = setTimeout(playChapterIntro, 350);

  // ==== Mở bản đồ đi bộ (joystick) ====
  el.querySelector('#btn-world').addEventListener('click', () => show('world'));

}
