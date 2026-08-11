// TuxeWorld H5 | ui/home.js | Màn chính: HUD phủ lên cảnh, mọi lối đi nằm quanh mép
//
// Bố cục theo kiểu màn sảnh của game mobile: cảnh chiếm HẾT màn hình, còn các
// lối đi thì bám quanh mép — hai cột nút tròn hai bên, thanh nút nhanh và một
// nút hành động to ở dưới. Kiểu này gọn hơn danh sách thẻ dọc: nhìn một cái là
// thấy hết chỗ bấm được, mà cảnh vẫn còn nguyên chỗ để nhìn.
//
// Nút nào cần nối máy chủ thì chơi một mình là ẨN HẲN chứ không hiện ra rồi
// báo "cần nối máy chủ" — bấm vào chẳng làm được gì thì bày ra chỉ tổ rối.
import { G, claimDaily } from '../state.js';
import { DAILY_REWARDS } from '../data/quests.js';
import { currentChapter, needIntro, markIntroSeen, emitStory, storyProgress } from '../engine/story.js';
import { playDialog } from './dialog.js';
import { ZONES } from '../data/zones.js';
import { ITEMS } from '../data/items.js';
import { esc, boxIcon, upgradeImages, tien, tienChu, fmt, todayNum } from '../util.js';
import { toast, itemIcon } from './kit.js';
import { uiIcon } from './icons.js';
import { veCanh } from './scene.js';
import { net } from '../net/session.js';
import { isOnlineMode } from '../net/config.js';
import { trainerLevel, expToNext } from '../engine/player.js';
import { isUnlocked, featureLevel } from '../engine/unlock.js';
import { choNhan } from '../engine/achievements.js';
import { stats } from '../engine/monster.js';
import { soLoaiDaBat } from '../engine/cauca.js';
import { show, refresh } from '../main.js';

// Hai cột nút hai bên. 'on' = chỉ chạy được khi đã nối máy chủ.
const TRAI = [
  { act: 'daily', icon: 'lich', label: 'Điểm danh' },
  { to: 'quest', icon: 'quest', label: 'Nhiệm vụ' },
  { to: 'achievements', icon: 'star', label: 'Thành tựu', badge: 'ach' },
  { to: 'events', icon: 'flag', label: 'Sự kiện', on: true },
  { to: 'gifts', icon: 'gift', label: 'Tiệm quà', on: true },
];
const PHAI = [
  { to: 'diadiem', icon: 'compass', label: 'Địa điểm' },
  { to: 'boss', icon: 'battle', label: 'Săn boss', on: true },
  { to: 'rank', icon: 'trophy', label: 'Xếp hạng', on: true },
  { to: 'guild', icon: 'guild', label: 'Bang hội', on: true },
  { to: 'friends', icon: 'friends', label: 'Bạn bè', badge: 'dm', on: true },
  { to: 'marriage', icon: 'heart', label: 'Kết hôn', on: true },
];
// Thanh nút nhanh ngay trên thanh điều hướng
const DOC = [
  { to: 'shop', icon: 'shop', label: 'Cửa hàng' },
  { to: 'wardrobe', icon: 'slot_outfit', label: 'Tủ đồ' },
  { to: 'garage', icon: 'car', label: 'Nhà xe' },
  { to: 'settings', icon: 'gear', label: 'Cài đặt' },
];

function zoneIcon(z, size = 22) {
  if (!z) return '';
  if (z.iconItem) return itemIcon(z.iconItem, '', size);
  if (z.iconSp) return `<span class="zone-ico"><img class="px-icon" src="${boxIcon(z.iconSp)}" width="${size}" height="${size}" alt=""></span>`;
  return '';
}

// Số thông báo chưa đọc hiện trên góc nút
function badgeCount(kind) {
  if (kind === 'ach') return choNhan();       // tính trên bản lưu, offline vẫn báo
  if (!net.connected) return 0;
  if (kind === 'dm') return net.unread.dm || 0;
  return 0;
}

// "Lực chiến": cộng hết chỉ số của cả đội. Không phải công thức chiến đấu nào
// cả — chỉ là MỘT con số để người chơi biết đội mình mạnh lên hay không sau
// mỗi lần thay đồ, lên cấp, đổi đội hình.
function lucChien() {
  let n = 0;
  for (const m of G.p?.party || []) {
    const s = stats(m);
    n += (s.hp || 0) + s.melee + s.ranged + s.armour + s.dodge + s.speed + m.lv * 4;
  }
  return n;
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
  const lv = trainerLevel();
  const expNay = G.p.trainer?.exp || 0;
  const expCan = expToNext(lv);

  // Một nút tròn trong cột bên
  const nutBen = (t) => {
    const n = t.badge ? badgeCount(t.badge) : 0;
    const cham = t.act === 'daily' && !nhanDuocDiemDanh();
    const khoa = t.to && !isUnlocked(t.to, lv);
    const attr = t.act ? `data-act="${t.act}"` : `data-goto="${t.to}"`;
    return `<button type="button" class="hud-nut${khoa ? ' khoa' : ''}" ${attr}>
      <span class="hud-vien">${uiIcon(t.icon, 26)}</span>
      <b>${esc(t.label)}</b>
      ${n && !khoa ? `<i class="hud-so">${n > 99 ? '99+' : n}</i>` : ''}
      ${cham && !khoa ? '<i class="hud-cham"></i>' : ''}
      ${khoa ? `<small class="hud-khoa">Lv.${featureLevel(t.to)}</small>` : ''}
    </button>`;
  };

  el.innerHTML = `
    <div class="hud">
      <canvas class="hud-canvas" id="home-scene"></canvas>
      <div class="hud-veil"></div>

      <div class="hud-tren">
        <div class="hud-cap">
          <b>Lv.${lv}</b>
          <span class="hud-exp"><i style="width:${Math.min(100, Math.round(expNay / Math.max(1, expCan) * 100))}%"></i></span>
          <small>${fmt(expNay)}/${fmt(expCan)}</small>
        </div>
        <div class="hud-suc">
          <span class="hud-suc-nhan">LỰC</span>
          <b>${fmt(lucChien())}</b>
        </div>
      </div>

      <div class="hud-vung">${esc(zone.name)}</div>

      <div class="hud-cot trai">${TRAI.filter(t => !t.on || isOnlineMode()).map(nutBen).join('')}</div>
      <div class="hud-cot phai">${PHAI.filter(t => !t.on || isOnlineMode()).map(nutBen).join('')}</div>

      <div class="hud-duoi">
        ${ch ? `
        <button class="hud-truyen${needIntro() ? ' moi' : ''}" id="btn-story">
          <span class="hud-truyen-nhan">${itemIcon('shaft_badge', '', 16)} ${prog.done}/${prog.total}</span>
          <span class="hud-truyen-chu"><b>${esc(ch.title)}</b><small>${esc(ch.desc)}</small></span>
        </button>` : (prog.finished ? `
        <div class="hud-truyen xong">
          <img src="assets/img/crown.png" class="crown-ico" alt="" onerror="this.style.visibility='hidden'">
          <span class="hud-truyen-chu"><b>Đã phá đảo cốt truyện</b><small>Còn Tuxedex chờ bạn hoàn thành</small></span>
        </div>` : '')}

        <div class="hud-hang">
          <div class="hud-bang">
            <span><i>Khu vực</i><b>${zoneIcon(zone, 14)} ${esc(zone.name)}</b></span>
            <span><i>Đã bắt</i><b>${fmt(Object.keys(G.p.dex?.caught || {}).length)} loài</b></span>
            <span><i>Cá</i><b>${fmt(soLoaiDaBat())} loài</b></span>
          </div>
          <button class="hud-di" id="btn-world">
            ${uiIcon('map', 26)}
            <b>ĐI BỘ</b>
          </button>
        </div>

        <div class="hud-doc">
          ${DOC.filter(t => !t.on || isOnlineMode()).map(t => {
            const khoa = !isUnlocked(t.to, lv);
            return `<button type="button" class="hud-doc-nut${khoa ? ' khoa' : ''}" data-goto="${t.to}">
              <span class="hud-vien">${uiIcon(t.icon, 24)}</span>
              <b>${esc(t.label)}</b>
            </button>`;
          }).join('')}
        </div>
      </div>
    </div>
  `;
  upgradeImages(el);

  // Cảnh sống trong khung nền — nhớ tắt vòng vẽ khi rời màn
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

  // ==== Mấy nút quanh mép ====
  el.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => {
    if (b.classList.contains('khoa')) {
      toast(`Còn khoá — mở ở Trainer Lv.${featureLevel(b.dataset.goto)}.`);
      return;
    }
    show(b.dataset.goto);
  }));

  const nutDiemDanh = el.querySelector('[data-act="daily"]');
  if (nutDiemDanh) nutDiemDanh.addEventListener('click', () => {
    const r = claimDaily(DAILY_REWARDS);
    if (!r.ok) { toast('Hôm nay đã điểm danh rồi, mai quay lại nhé!'); return; }
    const parts = [];
    if (r.reward.money) parts.push(tienChu(r.reward.money));
    for (const it of r.reward.items || []) parts.push(`${ITEMS[it.id] ? ITEMS[it.id].name : it.id} ×${it.n}`);
    toast(`Ngày ${r.streak}: nhận ${parts.join(' + ') || 'quà'}!`);
    refresh();
  });
}

// Hôm nay điểm danh rồi thì thôi nhắc — dùng chung đúng cách tính ngày của state.js
const nhanDuocDiemDanh = () => G.p?.daily?.last === todayNum();
