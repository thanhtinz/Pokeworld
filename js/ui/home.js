// TuxeWorld H5 | ui/home.js | Màn chính: bảng tóm tắt khu vực + lối đi ra bản đồ
//
// Trước đây màn này là chế độ IDLE tự đánh quái. Từ khi chuyển sang đi bộ trên
// bản đồ thì gặp Tuxemon là do người chơi bước vào bụi cỏ, nên phần tự đánh đã
// bỏ hẳn. Màn này giờ chỉ còn: đang ở đâu, chương truyện nào, và các nút để đi.
import { G, save, allFainted, emitQuest } from '../state.js';
import { heal } from '../engine/monster.js';
import { currentChapter, needIntro, markIntroSeen, emitStory, zoneLockedBy, storyProgress } from '../engine/story.js';
import { playDialog } from './dialog.js';
import { ZONES } from '../data/zones.js';
import { enterMap } from '../engine/overworld.js';
import { TRAINERS } from '../data/trainers.js';
import { esc, boxIcon, upgradeImages, tien, tienChu } from '../util.js';
import { toast, choose, itemIcon } from './kit.js';
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
  const isTown = !(zone.encounters?.length);
  const ch = currentChapter();
  const prog = storyProgress();

  // Ô hành động: mỗi cái một icon riêng, xếp lưới cho ra dáng màn chính của game
  const oHanhDong = (id, icon, ten, phu) => `
    <button class="act-tile" id="${id}">
      <span class="act-ico">${uiIcon(icon, 26)}</span>
      <b>${esc(ten)}</b>
      ${phu ? `<small>${esc(phu)}</small>` : ''}
    </button>`;

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

    <div class="act-grid">
      ${isTown ? oHanhDong('btn-center', 'heal', 'Hồi phục', 'Đội khoẻ lại') : ''}
      ${isTown ? oHanhDong('btn-shop', 'shop', 'Cửa hàng', 'Mua bán') : ''}
      ${oHanhDong('btn-travel', 'compass', 'Di chuyển', `${(zone.next || []).length} lối đi`)}
      ${oHanhDong('btn-trainers', 'battle', 'Đấu trainer',
        zone.trainers?.length ? `${zone.trainers.length} người` : 'Không có ai')}
    </div>
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

  // ==== Thị trấn ====
  const btnCenter = el.querySelector('#btn-center');
  if (btnCenter) btnCenter.addEventListener('click', () => {
    G.p.party.forEach(m => heal(m));
    save();
    toast('Cả đội đã hồi phục hoàn toàn!');
    refresh();
  });
  const btnShop = el.querySelector('#btn-shop');
  if (btnShop) btnShop.addEventListener('click', () => show('shop'));

  // ==== Mở bản đồ đi bộ (joystick) ====
  el.querySelector('#btn-world').addEventListener('click', () => show('world'));

  // ==== Di chuyển (kèm khóa cốt truyện) ====
  el.querySelector('#btn-travel').addEventListener('click', async () => {
    const opts = (zone.next || []).map(zid => {
      const z = ZONES[zid];
      const lock = zoneLockedBy(zid);
      return {
        html: `${zoneIcon(z, 24)} ${esc(z.name)}`,
        label: z.name,
        sub: lock ? `Cần hoàn thành ${lock.title}` : z.desc,
        disabled: !!lock,
        zid,
      };
    });
    if (!opts.length) { toast('Không có đường đi nào!'); return; }
    const i = await choose('Đi đâu?', opts);
    if (i === null) return;
    const zid = opts[i].zid;
    // Đặt luôn vị trí đi bộ vào bản đồ mới — không thì bấm "Đi bộ" sẽ quay về
    // đúng chỗ cũ trên bản đồ cũ vì G.p.pos vẫn trỏ tới đó.
    if (!enterMap(zid)) { G.p.zone = zid; save(); }
    emitQuest('reach_zone', { zone: zid }).forEach(({ quest }) => toast(`Hoàn thành: ${quest.name}`));
    refresh();
  });

  // ==== Trainer trong zone (trận đánh tay) ====
  el.querySelector('#btn-trainers').addEventListener('click', async () => {
    const ids = zone.trainers || [];
    // Trainer cốt truyện xuất hiện khi đúng chương
    const storyIds = [];
    if (ch && ch.goal?.t === 'defeat_trainer' && TRAINERS[ch.goal.id] && !needIntro()) {
      const t = TRAINERS[ch.goal.id];
      if ((t.zone || G.p.zone) === G.p.zone && !ids.includes(ch.goal.id)) storyIds.push(ch.goal.id);
    }
    const all = [...storyIds, ...ids];
    if (!all.length) { toast('Không có trainer nào ở đây.'); return; }
    const opts = all.map(tid => {
      const t = TRAINERS[tid];
      const won = !!G.p.defeatedTrainers[tid];
      const face = t.sprite ? `<img class="tr-face" src="assets/trainers/${t.sprite}.png" alt="" onerror="this.remove()"> ` : '';
      return {
        html: `${face}${esc(t.name)}${won ? ' <span class="won-pill">ĐÃ THẮNG</span>' : ''}`,
        label: `${t.name}${won ? ' (đã thắng)' : ''}`,
        sub: t.kind === 'gym' ? `Võ đường — Huy hiệu ${t.badgeName || ''}` : (t.rewardMoney ? `Thưởng ${tienChu(t.rewardMoney)}` : ''),
        tid,
      };
    });
    const i = await choose('Thách đấu ai?', opts);
    if (i === null) return;
    if (allFainted()) { toast('Cả đội đã gục, hồi phục trước đã!'); return; }
    const tid = opts[i].tid;
    const t = TRAINERS[tid];
    await playDialog([[t.kind === 'gym' ? 'sys' : t.kind === 'xero' ? 'xero' : t.kind === 'rival' ? 'rival' : 'sys',
      `${t.name}: "${t.intro || 'Đấu nào!'}"`]]);
    show('battle', { kind: 'trainer', trainerId: tid });
  });
}
