// PokeWorld H5 | engine/settings.js | Tuỳ chỉnh của người chơi + tiếng động giao diện
//
// Cài đặt lưu THEO MÁY (localStorage riêng) chứ không nằm trong save, vì cùng
// một tài khoản chơi trên máy yếu và máy khoẻ thì mức đồ hoạ nên khác nhau.
//
// Mọi mục ở đây đều thật sự có tác dụng — không có công tắc bật cho vui:
//   sfx/volume  -> tiếng động giao diện (tự tạo bằng WebAudio, không cần file)
//   motion      -> tắt là bỏ rung/nháy/hiệu ứng chuyển động toàn game
//   anim        -> tắt là dùng ảnh Pokémon tĩnh thay ảnh động (nhẹ mạng hơn)
//   stars       -> tắt lớp sao nền cho máy yếu đỡ phải vẽ
//   textSpeed   -> nhanh/chậm của lời thoại trong trận
//   autoDialog  -> thoại cốt truyện tự chạy tiếp, không phải chạm từng câu
//   autoSync    -> tự đẩy save lên máy chủ

const KEY = 'pw_settings_v1';

const DEFAULTS = {
  sfx: true,
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

// ==== Tiếng động giao diện ====
// Tự tổng hợp bằng WebAudio nên không cần tệp âm thanh nào.
let ctx = null;
function audio() {
  if (!cfg.sfx) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

const TONES = {
  tap:     { f: 660,  to: 660,  d: 0.05, type: 'square', g: 0.20 },
  confirm: { f: 520,  to: 880,  d: 0.14, type: 'square', g: 0.24 },
  cancel:  { f: 440,  to: 220,  d: 0.14, type: 'square', g: 0.22 },
  error:   { f: 200,  to: 140,  d: 0.20, type: 'sawtooth', g: 0.20 },
  hit:     { f: 320,  to: 90,   d: 0.16, type: 'triangle', g: 0.30 },
  win:     { f: 660,  to: 1320, d: 0.30, type: 'square', g: 0.26 },
  coin:    { f: 990,  to: 1480, d: 0.12, type: 'square', g: 0.22 },
};

export function sfx(name = 'tap') {
  const t = TONES[name] || TONES.tap;
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const now = ac.currentTime;
  osc.type = t.type;
  osc.frequency.setValueAtTime(t.f, now);
  if (t.to !== t.f) osc.frequency.exponentialRampToValueAtTime(t.to, now + t.d);
  gain.gain.setValueAtTime(t.g * cfg.volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + t.d);
  osc.connect(gain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + t.d + 0.02);
}

applyAll();
