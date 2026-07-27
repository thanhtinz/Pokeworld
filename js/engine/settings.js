// TuxeWorld H5 | engine/settings.js | Tuỳ chỉnh của người chơi + tiếng động giao diện
//
// Cài đặt lưu THEO MÁY (localStorage riêng) chứ không nằm trong save, vì cùng
// một tài khoản chơi trên máy yếu và máy khoẻ thì mức đồ hoạ nên khác nhau.
//
// Mọi mục ở đây đều thật sự có tác dụng — không có công tắc bật cho vui:
//   sfx/volume  -> tiếng động giao diện (tệp âm thanh của Tuxemon)
//   music       -> nhạc nền theo màn: thị trấn, trận đấu
//   motion      -> tắt là bỏ rung/nháy/hiệu ứng chuyển động toàn game
//   anim        -> tắt là dùng ảnh Tuxemon tĩnh thay ảnh động (nhẹ mạng hơn)
//   stars       -> tắt lớp sao nền cho máy yếu đỡ phải vẽ
//   textSpeed   -> nhanh/chậm của lời thoại trong trận
//   autoDialog  -> thoại cốt truyện tự chạy tiếp, không phải chạm từng câu
//   autoSync    -> tự đẩy save lên máy chủ

import { SFX, MUSIC, TECH_SFX } from '../data/sounds.js';

const KEY = 'pw_settings_v1';

const DEFAULTS = {
  sfx: true,
  music: true,
  volume: 0.5,
  motion: true,
  anim: true,
  stars: true,
  textSpeed: 'normal',    // slow | normal | fast
  autoDialog: false,
  autoSync: true,
};

export const TEXT_SPEED_MULT = { slow: 1.5, normal: 1, fast: 0.5 };

let cfg = load();
const listeners = new Set();

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...DEFAULTS, ...(raw && typeof raw === 'object' ? raw : {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch { /* hết chỗ thì thôi */ }
}

export const settings = () => cfg;
export const getSetting = (k) => cfg[k];

export function setSetting(k, v) {
  if (!(k in DEFAULTS)) return;
  cfg[k] = v;
  persist();
  applyAll();
  for (const fn of listeners) fn(k, v);
}

export function resetSettings() {
  cfg = { ...DEFAULTS };
  persist();
  applyAll();
  for (const fn of listeners) fn(null, null);
}

export function onSettingChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Nhân với mọi khoảng dừng của lời thoại trong trận
export const textDelay = (ms) => Math.round(ms * (TEXT_SPEED_MULT[cfg.textSpeed] ?? 1));

// Gắn cờ lên <html> để CSS tự tắt hiệu ứng / lớp sao
export function applyAll() {
  const r = document.documentElement;
  if (!r) return;
  r.classList.toggle('no-motion', !cfg.motion);
  r.classList.toggle('no-stars', !cfg.stars);
}

// ==== Tiếng động + nhạc nền ====
// Dùng thẳng tệp âm thanh của Tuxemon (js/data/sounds.js). Tệp chỉ tải khi
// lần đầu cần đến, và luôn kiểm tra công tắc sfx/music trước khi phát.
const cache = new Map();

function clip(src) {
  let a = cache.get(src);
  if (!a) {
    a = new Audio(src);
    a.preload = 'auto';
    cache.set(src, a);
  }
  return a;
}

// Tên cũ (win/cancel/error) vẫn gọi được để không phải sửa khắp nơi
const ALIAS = { cancel: 'click', error: 'hit_weak', win: 'levelup' };

// name có thể là tên tiếng chung ('hit', 'catch'...) hoặc slug tiếng riêng của
// một chiêu bên bản gốc ('sfx_kick', 'sfx_bubbles'...)
export function sfx(name = 'tap') {
  if (!cfg.sfx) return;
  const src = TECH_SFX[name] || SFX[SFX[name] ? name : (ALIAS[name] || 'tap')];
  if (!src) return;
  try {
    // Nhân bản để nhiều tiếng chồng nhau được (bấm nhanh, đánh liên tiếp)
    const a = clip(src).cloneNode();
    a.volume = Math.max(0, Math.min(1, cfg.volume));
    a.play().catch(() => {});
  } catch { /* trình duyệt chưa cho phát thì thôi */ }
}

// Nhạc nền: mỗi lúc chỉ một bản, tự lặp lại
let bgm = null;
let bgmName = '';

export function playMusic(name) {
  if (!MUSIC[name]) return;
  if (bgmName === name && bgm && !bgm.paused) return;
  stopMusic();
  bgmName = name;
  if (!cfg.music) return;
  try {
    bgm = clip(MUSIC[name]).cloneNode();
    bgm.loop = true;
    bgm.volume = Math.max(0, Math.min(1, cfg.volume * 0.55));
    bgm.play().catch(() => {});
  } catch { /* bỏ qua */ }
}

export function stopMusic() {
  if (bgm) { try { bgm.pause(); } catch { /* ignore */ } }
  bgm = null;
}

// Đổi công tắc nhạc / âm lượng thì áp dụng ngay cho bản đang phát
onSettingChange((k) => {
  if (k === 'music') {
    if (cfg.music) { const n = bgmName; bgmName = ''; playMusic(n); }
    else stopMusic();
  }
  if (k === 'volume' && bgm) bgm.volume = Math.max(0, Math.min(1, cfg.volume * 0.55));
});

applyAll();
