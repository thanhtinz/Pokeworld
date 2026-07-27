// TuxeWorld H5 | engine/story.js | Engine cốt truyện: chương hiện tại, tiến độ, khóa zone
import { G, save, addMoney, addItem } from '../state.js';
import { CHAPTERS, ZONE_LOCKS, RIVAL_STARTER } from '../data/story.js';
import { EVOLUTIONS } from '../data/evolutions.js';

const RIVAL_KEYS = Object.keys(RIVAL_STARTER).map(Number);

// Lần theo chuỗi tiến hoá tối đa hai bậc
function evolveTwice(sp) {
  let cur = sp;
  for (let i = 0; i < 2; i++) {
    const e = EVOLUTIONS[cur];
    if (!e) break;
    cur = e.into;
  }
  return cur;
}

// Trạng thái lưu trong save: G.p.story = { idx: 0, doneIntro: {}, finished: false }
function st() {
  if (!G.p.story) G.p.story = { idx: 0, doneIntro: {}, finished: false };
  return G.p.story;
}

// Chương hiện tại (null nếu đã hết truyện)
export function currentChapter() {
  const s = st();
  return s.finished ? null : CHAPTERS[s.idx] || null;
}

// Đã xem hội thoại mở đầu chương hiện tại chưa (để home hiện nút "Xem tiếp truyện")
export function needIntro() {
  const ch = currentChapter();
  return !!ch && !st().doneIntro[ch.id];
}
export function markIntroSeen() {
  const ch = currentChapter();
  if (ch) { st().doneIntro[ch.id] = true; save(); }
}

// Zone bị khóa theo cốt truyện? Trả về chương cần hoàn thành (object) hoặc null nếu mở.
export function zoneLockedBy(zoneId) {
  const needId = ZONE_LOCKS[zoneId];
  if (!needId) return null;
  const s = st();
  const needIdx = CHAPTERS.findIndex(c => c.id === needId);
  // Mở khi đã VƯỢT QUA chương needIdx (unlock nằm trong reward chương đó)
  if (s.finished || s.idx > needIdx) return null;
  return CHAPTERS[needIdx];
}

// Đội rival theo starter người chơi + mốc truyện
export function rivalTeam(battleId) {
  const starter = G.p.starterId || G.p.party[0]?.sp || RIVAL_KEYS[0];
  const rs = RIVAL_STARTER[starter] || RIVAL_KEYS[0];
  if (battleId === 'rival_1') {
    return [{ sp: rs, lv: 6 }];
  }
  // rival_2: đội cuối — starter tiến hóa 2 lần + đội đa hệ
  // Tiến hoá hai bậc từ chính con đối thủ chọn, tra thẳng trong bảng tiến hoá
  const evo2 = evolveTwice(rs);
  return [
    { sp: 257, lv: 30 },
    { sp: 353, lv: 31 },
    { sp: 32, lv: 32 },
    { sp: evo2, lv: 34 }, // con khởi đầu của đối thủ, đã tiến hoá tối đa
  ];
}

// Báo sự kiện cho cốt truyện (gọi cùng chỗ với emitQuest).
// Trả về chương vừa hoàn thành (object kèm outro/reward) hoặc null.
export function emitStory(eventType, payload = {}) {
  if (!G.p) return null;
  const s = st();
  const ch = currentChapter();
  if (!ch) return null;
  const g = ch.goal;
  if (g.t !== eventType) return null;
  if (g.id && g.id !== payload.id) return null;
  if (g.sp && g.sp !== payload.sp) return null;
  // Điều kiện phụ của chương (vd ch8 cần badge nước trước)
  if (ch.require?.badge && !(G.p.badges || []).includes(ch.require.badge)) return null;
  // Goal đếm số lượng
  if (g.n && g.n > 1) {
    s.count = (s.count || 0) + 1;
    if (s.count < g.n) { save(); return null; }
  }
  // Hoàn thành chương
  s.count = 0;
  if (ch.reward?.money) addMoney(ch.reward.money);
  for (const it of ch.reward?.items || []) addItem(it.id, it.n);
  s.idx += 1;
  if (s.idx >= CHAPTERS.length) s.finished = true;
  save();
  return ch;
}

// Tiến độ hiển thị: "Chương X/8"
export function storyProgress() {
  const s = st();
  return { done: Math.min(s.idx, CHAPTERS.length), total: CHAPTERS.length, finished: s.finished };
}
