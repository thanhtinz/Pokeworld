// TuxeWorld H5 | ui/loading.js | Màn tải dữ liệu: nạp trước asset hay dùng + thanh tiến trình
import { spriteUrl } from '../util.js';
import { show } from '../main.js';
import { STARTERS } from '../data/starters.js';
import { ZONES } from '../data/zones.js';

const TIPS = [
  'Tuxemon hệ Nước rất mạnh trước hệ Lửa, Đá và Đất.',
  'Làm Tuxemon hoang yếu máu rồi hãy ném bóng — tỉ lệ bắt cao hơn nhiều.',
  'Tuxemon đang ngủ hoặc đóng băng dễ bắt hơn gấp đôi.',
  'Skin Tuxemon và danh hiệu đổi trong màn Nhân vật — mặc cho đẹp thôi, không đổi sức mạnh.',
  'Bạn vẫn nhận tiền và EXP khi thoát game — tối đa 8 giờ.',
  'Đá tiến hoá bán ở cửa hàng trong thị trấn.',
  'Tuxemon hệ Gỗ khắc hệ Đất và Nước, nhưng sợ Lửa.',
];

// Ảnh chắc chắn dùng ngay khi vào game. Danh sách cũ còn trỏ vào sprite thời
// Pokémon đã xoá (oak, rival, juan, nurse_joy...) nên mỗi lần vào game là một
// loạt 404; nay chỉ giữ tệp có thật và suy phần sinh vật ra TỪ CHÍNH DỮ LIỆU.
const LOCAL_ASSETS = [
  'assets/img/title.png', 'assets/img/dlgbox.png', 'assets/img/crown.png',
  'assets/img/worldmap.jpg',
  'assets/ui/dpad.png', 'assets/ui/btn-a.png', 'assets/ui/btn-b.png',
  'assets/ow/red.png', 'assets/ow/leaf.png', 'assets/ow/professor.png', 'assets/ow/nurse.png',
  'assets/trainers/red.png', 'assets/trainers/leaf.png', 'assets/trainers/professor.png',
];

// Ba starter + vài loài gặp ngay ở khu vực đầu tiên
const PRELOAD_DEX = [
  ...STARTERS.map(s => s.sp),
  ...(ZONES[Object.keys(ZONES)[0]]?.encounters || []).slice(0, 4).map(e => e.sp),
];

function loadImage(src, timeoutMs = 2500) {
  return new Promise(resolve => {
    const img = new Image();
    const done = () => resolve(true);
    const t = setTimeout(done, timeoutMs);   // mạng chậm/chặn thì bỏ qua, không treo game
    img.onload = () => { clearTimeout(t); done(); };
    img.onerror = () => { clearTimeout(t); done(); };
    img.src = src;
  });
}

// Tải song song cả danh sách, cập nhật tiến trình theo từng ảnh xong.
// Có hạn chót chung: quá hạn thì vào game luôn, ảnh còn thiếu sẽ tải khi cần.
function loadAllImages(list, onOne, deadlineMs = 6000) {
  const all = Promise.all(list.map(src => loadImage(src).then(() => onOne())));
  const deadline = new Promise(r => setTimeout(r, deadlineMs));
  return Promise.race([all, deadline]);
}

export async function render(el) {
  const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
  el.innerHTML = `
    <div class="splash loading-scr">
      <div class="splash-bg"></div>
      <div class="splash-inner">
        <div class="logo splash-logo">Tuxe<span>World</span></div>
        <div class="load-wrap">
          <div class="load-bar"><div class="load-fill" id="load-fill"></div></div>
          <div class="load-row">
            <span id="load-label">Đang chuẩn bị...</span>
            <span id="load-pct">0%</span>
          </div>
        </div>
        <p class="load-tip"><b>Mẹo:</b> ${tip}</p>
      </div>
    </div>`;

  const fill = el.querySelector('#load-fill');
  const pct = el.querySelector('#load-pct');
  const label = el.querySelector('#load-label');

  // Danh sách công việc: mỗi mục là [nhãn, hàm async]
  const tasks = [];
  tasks.push(['Đang tải dữ liệu Tuxemon...', async () => {
    await Promise.all([
      import('../data/species.js'), import('../data/moves.js'),
      import('../data/learnsets.js'), import('../data/evolutions.js'),
      import('../data/types.js'), import('../data/tastes.js'),
    ]);
  }]);
  tasks.push(['Đang tải vật phẩm & khu vực...', async () => {
    await Promise.all([
      import('../data/items.js'), import('../data/zones.js'),
      import('../data/trainers.js'), import('../data/quests.js'),
      import('../data/story.js'),
    ]);
  }]);
  // Ảnh tải SONG SONG (mạng chậm/chặn cũng không treo màn hình)
  const images = [...new Set([
    ...LOCAL_ASSETS,
    ...PRELOAD_DEX.flatMap(dex => [spriteUrl(dex), spriteUrl(dex, true)]),
  ])];
  tasks.push(['Đang tải hình ảnh...', async (bump) => {
    const step = 1 / images.length;
    await loadAllImages(images, () => bump(step));
  }]);
  tasks.push(['Hoàn tất!', async () => { /* chốt danh sách */ }]);

  // Tiến trình 0..1 — mỗi công việc chiếm một phần bằng nhau
  const total = tasks.length;
  let progress = 0;
  const paint = () => {
    const p = Math.min(100, Math.round(progress * 100));
    fill.style.width = p + '%';
    pct.textContent = p + '%';
  };

  for (let i = 0; i < total; i++) {
    const [text, fn] = tasks[i];
    label.textContent = text;
    const slice = 1 / total;
    const base = i / total;
    // bump(frac): công việc dài tự báo tiến độ bên trong phần của mình
    const bump = (frac) => { progress = Math.min(base + slice, progress + slice * frac); paint(); };
    try { await fn(bump); } catch (e) { console.warn('preload:', e); }
    progress = (i + 1) / total;
    paint();
    await new Promise(r => setTimeout(r, 20));   // nhịp nhỏ để thanh vẽ kịp
  }

  await new Promise(r => setTimeout(r, 320));
  show('auth');
}
