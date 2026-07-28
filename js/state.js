// TuxeWorld H5 | state.js | Trạng thái game + save/load localStorage + quest engine
import { clamp, todayNum } from './util.js';
import { QUESTS } from './data/quests.js';
import { loadActiveSave, writeActiveSave, clearActiveSave } from './engine/accounts.js';

// Khoá localStorage đời đầu — giữ nguyên tên để bản lưu cũ không mất.
const SAVE_KEY = 'pokeworld_save_v1';
export const SAVE_VERSION = 1;

export const CONFIG = {
  MAX_LEVEL: 100,
  SHINY_DENOM: 1024,       // web chơi casual: shiny 1/1024 cho vui hơn bản gốc 1/4096
  // CHỖ LỆCH CÓ CHỦ Ý so với bản gốc: công thức sát thương của Tuxemon rất nặng
  // đòn — hai con cùng cấp thường hạ nhau trong 1-3 lượt, đánh xong chưa kịp
  // nghĩ gì. Bản web nhân máu tối đa lên ngần này để một trận kéo dài cỡ 6-10
  // lượt, còn kịp đổi chiêu, dùng thuốc, tính đường bắt. Đặt lại bằng 1 là ra
  // đúng nhịp bản gốc.
  HP_SCALE: 3,
  IV_MAX: 15,             // Tuxemon: iv_range [0, 15]
  TP_CAP_STAT: 150,       // Tuxemon: max_tps
  TP_CAP_TOTAL: 300,      // Tuxemon: max_total_tps
  PARTY_MAX: 6,
  BOX_SIZE: 60,
  STARTING_MONEY: 3000,
  MONEY_CAP: 9999999,
  ESCAPE_METHOD: 'default',   // cách tính chạy trốn của bản gốc (method_escape)
};

// Trạng thái toàn cục. G.p = dữ liệu người chơi (null nếu chưa có save)
export const G = { p: null };

function defaultPlayer(name) {
  return {
    v: SAVE_VERSION,
    name: name || 'Trainer',
    money: CONFIG.STARTING_MONEY,
    badges: [],
    party: [],
    box: [],
    bag: { potion: 5, tuxeball: 10 },
    dex: { seen: {}, caught: {} },
    quests: { active: {}, done: {} },
    daily: { last: 0, streak: 0 },
    defeatedTrainers: {},
    zone: 'taba_town',
    starterChosen: false,
    stats: { catches: 0, wins: 0, playSince: Date.now() },
    look: { title: 'none', avatarFrame: 'none', chatFrame: 'none', skin: 'default' },
    monSkins: {},
    granted: [],
    trainer: { level: 1, exp: 0 },
  };
}

export function hasSave() { return !!loadActiveSave(); }

export function newGame(name) {
  G.p = defaultPlayer(name);
  save();
  return G.p;
}

export function save() {
  if (!G.p) return;
  try { writeActiveSave(JSON.parse(JSON.stringify(G.p))); }
  catch (e) { console.warn('save fail', e); }
}

// Vá Tuxemon trong bản lưu đời cũ: thiếu iv/tp/chiêu là công thức tính
// chỉ số ném lỗi ngay, mà lỗi đó rơi đúng vào màn Trang chủ nên vào game là
// thấy báo lỗi liền.
function vaMons(list) {
  if (!Array.isArray(list)) return [];
  return list.filter(m => m && m.sp !== undefined).map(m => {
    if (!Array.isArray(m.iv) || m.iv.length < 6) m.iv = [8, 8, 8, 8, 8, 8];
    m.iv = m.iv.map(v => clamp(Number(v) || 0, 0, CONFIG.IV_MAX));
    if (!Array.isArray(m.tp) || m.tp.length < 6) m.tp = [0, 0, 0, 0, 0, 0];
    delete m.ev;                       // EV của bản lưu cũ đã thay bằng TP
    if (!Array.isArray(m.moves) || !m.moves.length) m.moves = [{ id: 'struggle', cd: 0 }];
    for (const mv of m.moves) if (typeof mv.cd !== 'number') mv.cd = 0;
    m.lv = clamp(Number(m.lv) || 1, 1, CONFIG.MAX_LEVEL);
    if (typeof m.hpCur !== 'number') m.hpCur = 0;
    if (typeof m.bond !== 'number') m.bond = 25;
    delete m.friendship;               // độ thân thiết cũ đã thay bằng bond
    delete m.nature; delete m.ability; // bản gốc không có tính cách / đặc tính
    return m;
  });
}

export function load() {
  const data = loadActiveSave();
  if (!data) return false;
  try {
    // Vá field thiếu khi update version
    const def = defaultPlayer(data.name);
    for (const k of Object.keys(def)) if (data[k] === undefined) data[k] = def[k];
    data.v = SAVE_VERSION;
    data.party = vaMons(data.party);
    data.box = vaMons(data.box);
    G.p = data;
    return true;
  } catch (e) {
    console.warn('save hong', e);
    return false;
  }
}

// Đổi tài khoản (đăng nhập / đăng ký) -> vứt dữ liệu tài khoản cũ đang giữ trong
// bộ nhớ rồi nạp bản lưu của tài khoản mới. Thiếu bước này thì đăng nhập tài khoản
// khác trong cùng một lượt mở trang sẽ chơi bằng dữ liệu của tài khoản trước, hoặc
// tệ hơn: G.p vẫn là null và mọi màn hình đều báo lỗi.
export function reloadForAccount() {
  G.p = null;
  return load();
}

export function wipeSave() {
  clearActiveSave();
  G.p = null;
}

// ==== Tiền ====
export function addMoney(n) {
  G.p.money = clamp(G.p.money + n, 0, CONFIG.MONEY_CAP);
  save();
}
export function spend(n) {
  if (G.p.money < n) return false;
  G.p.money -= n;
  save();
  return true;
}

// ==== Túi đồ ====
export function addItem(id, n = 1) {
  G.p.bag[id] = (G.p.bag[id] || 0) + n;
  save();
}
export function removeItem(id, n = 1) {
  if ((G.p.bag[id] || 0) < n) return false;
  G.p.bag[id] -= n;
  if (G.p.bag[id] <= 0) delete G.p.bag[id];
  save();
  return true;
}

// ==== Party / Box ====
export function addToParty(mon) {
  if (G.p.party.length < CONFIG.PARTY_MAX) { G.p.party.push(mon); save(); return 'party'; }
  if (G.p.box.length < CONFIG.BOX_SIZE) { G.p.box.push(mon); save(); return 'box'; }
  return null;
}
export function firstAlive() {
  const i = G.p.party.findIndex(m => m.hpCur > 0);
  return i === -1 ? null : i;
}
export function allFainted() { return firstAlive() === null; }

// ==== Tuxedex ====
export function markSeen(id) { G.p.dex.seen[id] = true; save(); }
export function markCaught(id) { G.p.dex.seen[id] = true; G.p.dex.caught[id] = true; save(); }
export function dexCounts() {
  return [Object.keys(G.p.dex.seen).length, Object.keys(G.p.dex.caught).length];
}

// ==== Quest engine ====
// goal types: catch_any(n), catch_species(sp), defeat_trainer(id), reach_zone(zone),
//             catch_count(n), win_battles(n), earn_badge(id)
export function startQuest(id) {
  if (!QUESTS[id] || G.p.quests.done[id] || G.p.quests.active[id]) return;
  G.p.quests.active[id] = { progress: 0 };
  save();
  return QUESTS[id];
}

// Trả về mảng quest vừa hoàn thành [{id, quest}] để UI hiện thông báo
export function emitQuest(eventType, payload = {}) {
  if (!G.p) return [];
  const completed = [];
  for (const [id, st] of Object.entries(G.p.quests.active)) {
    const q = QUESTS[id];
    if (!q || q.goal.t !== eventType) continue;
    // Điều kiện phụ
    if (q.goal.sp && q.goal.sp !== payload.sp) continue;
    if (q.goal.id && q.goal.id !== payload.id) continue;
    if (q.goal.zone && q.goal.zone !== payload.zone) continue;
    st.progress = (st.progress || 0) + 1;
    if (st.progress >= (q.goal.n || 1)) {
      delete G.p.quests.active[id];
      G.p.quests.done[id] = true;
      if (q.reward?.money) G.p.money = clamp(G.p.money + q.reward.money, 0, CONFIG.MONEY_CAP);
      for (const it of q.reward?.items || []) G.p.bag[it.id] = (G.p.bag[it.id] || 0) + it.n;
      completed.push({ id, quest: q });
      if (q.next) startQuest(q.next);
    }
  }
  if (completed.length) save();
  return completed;
}

// ==== Daily ====
// Trả về {ok, streak, reward} hoặc {ok:false}
export function claimDaily(rewardTable) {
  const today = todayNum();
  if (G.p.daily.last === today) return { ok: false };
  const yesterday = todayNum() - 1; // đủ tốt cho casual (sai lệch cuối tháng chấp nhận được)
  G.p.daily.streak = (G.p.daily.last === yesterday) ? G.p.daily.streak + 1 : 1;
  G.p.daily.last = today;
  const idx = ((G.p.daily.streak - 1) % rewardTable.length);
  const reward = rewardTable[idx];
  addMoney(reward.money || 0);
  for (const it of reward.items || []) addItem(it.id, it.n);
  save();
  return { ok: true, streak: G.p.daily.streak, reward };
}
