// TuxeWorld H5 | tests/smoke.mjs | Smoke test chạy bằng node (không cần trình duyệt)
// Kiểm tra data + engine: import sạch, số liệu khớp chéo, battle chạy trọn trận.
// Test này CHẶN DEPLOY: hỏng là GitHub Actions không đẩy được bản mới lên web.
import { SPECIES } from '../js/data/species.js';
import { MOVES } from '../js/data/moves.js';
import { LEARNSETS } from '../js/data/learnsets.js';
import { EVOLUTIONS } from '../js/data/evolutions.js';
import { ITEMS } from '../js/data/items.js';
import { ZONES } from '../js/data/zones.js';
import { TRAINERS } from '../js/data/trainers.js';
import { STARTERS } from '../js/data/starters.js';
import { QUESTS, DAILY_REWARDS } from '../js/data/quests.js';
import { CHAPTERS } from '../js/data/story.js';
import { TITLES, AVATAR_FRAMES, CHAT_FRAMES, unlocked, requirement } from '../js/data/cosmetics.js';
import { typeEff, TYPE_NAMES, TYPE_COLORS, TYPES } from '../js/data/types.js';
import { NATURES, NATURE_LIST } from '../js/data/natures.js';
import { newTuxemon, stats, maxHp } from '../js/engine/pokemon.js';
import { expForLevel, gainExp, movesAtLevel } from '../js/engine/exp.js';
import { calcDamage } from '../js/engine/damage.js';
import { attemptCatch } from '../js/engine/catchmon.js';
import { checkEvolution, evolve } from '../js/engine/evolution.js';
import { Battle } from '../js/engine/battle.js';

let fails = 0;
const ok = (name, cond, extra = '') => {
  console.log((cond ? '[OK] ' : '[FAIL] ') + name + (cond || !extra ? '' : ' — ' + extra));
  if (!cond) fails++;
};

// ==== Dữ liệu ====
ok('có đủ loài Tuxemon', Object.keys(SPECIES).length >= 300, String(Object.keys(SPECIES).length));
ok('có bảng chiêu', Object.keys(MOVES).length >= 100, String(Object.keys(MOVES).length));
ok('13 hệ đều có tên tiếng Việt + màu',
  TYPES.length === 13 && TYPES.every(t => TYPE_NAMES[t] && TYPE_COLORS[t]));
ok('25 tính cách', NATURE_LIST.length === 25 && Object.keys(NATURES).length === 25);
ok('3 starter đều có thật', STARTERS.length === 3 && STARTERS.every(s => SPECIES[s.sp]));

// ==== Tham chiếu chéo: mọi mã data trỏ tới nhau đều phải tồn tại ====
const bad = [];
for (const [sp, ls] of Object.entries(LEARNSETS)) {
  if (!SPECIES[sp]) bad.push(`learnset loài ${sp}`);
  for (const entry of ls) {
    if (!Array.isArray(entry) || entry.length !== 2) { bad.push(`learnset ${sp} sai định dạng`); continue; }
    if (!MOVES[entry[1]]) bad.push(`chiêu ${entry[1]} (loài ${sp})`);
  }
}
for (const [tid, t] of Object.entries(TRAINERS)) {
  for (const m of t.party || []) if (!SPECIES[m.sp]) bad.push(`đội ${tid}: loài ${m.sp}`);
  // 'rival' sinh đội lúc đánh (engine/story.js), các loại khác phải có sẵn đội
  if (t.kind !== 'rival' && !(t.party || []).length) bad.push(`${tid}: đội rỗng`);
}
for (const [zid, z] of Object.entries(ZONES)) {
  for (const e of z.encounters || []) if (!SPECIES[e.sp]) bad.push(`${zid}: loài ${e.sp}`);
  for (const tr of z.trainers || []) if (!TRAINERS[tr]) bad.push(`${zid}: trainer ${tr}`);
  for (const n of z.next || []) if (!ZONES[n]) bad.push(`${zid}: lối đi ${n}`);
}
for (const [qid, q] of Object.entries(QUESTS)) {
  for (const it of q.reward?.items || []) if (!ITEMS[it.id]) bad.push(`${qid}: vật phẩm ${it.id}`);
  if (q.next && !QUESTS[q.next]) bad.push(`${qid}: nhiệm vụ kế ${q.next}`);
  if (q.goal.sp && !SPECIES[q.goal.sp]) bad.push(`${qid}: loài ${q.goal.sp}`);
  if (q.goal.id && !TRAINERS[q.goal.id]) bad.push(`${qid}: trainer ${q.goal.id}`);
  if (q.goal.zone && !ZONES[q.goal.zone]) bad.push(`${qid}: khu vực ${q.goal.zone}`);
}
for (const r of DAILY_REWARDS) for (const it of r.items || []) if (!ITEMS[it.id]) bad.push(`điểm danh: ${it.id}`);
for (const [sp, e] of Object.entries(EVOLUTIONS)) {
  const list = Array.isArray(e) ? e : [e];
  if (!SPECIES[sp]) bad.push(`tiến hoá: loài ${sp}`);
  for (const o of list) {
    if (o.into && !SPECIES[o.into]) bad.push(`tiến hoá ${sp} -> ${o.into}`);
    if (o.item && !ITEMS[o.item]) bad.push(`tiến hoá ${sp}: đá ${o.item}`);
  }
}
// Cốt truyện: mọi chương phải đánh được và mọi zone mở khoá phải có thật
for (const ch of CHAPTERS) {
  if (ch.goal?.t === 'defeat_trainer' && !TRAINERS[ch.goal.id]) bad.push(`${ch.id}: trainer ${ch.goal.id}`);
  if (ch.goal?.t === 'catch_species' && !SPECIES[ch.goal.sp]) bad.push(`${ch.id}: loài ${ch.goal.sp}`);
  for (const z of ch.unlock || []) if (!ZONES[z]) bad.push(`${ch.id}: mở khoá ${z}`);
  for (const it of ch.reward?.items || []) if (!ITEMS[it.id]) bad.push(`${ch.id}: vật phẩm ${it.id}`);
}
ok('mọi tham chiếu chéo trong data đều tồn tại', bad.length === 0, bad.slice(0, 6).join('; '));

// Loài mà nhiệm vụ bắt buộc phải bắt thì phải gặp được ở đâu đó
const wild = new Set(Object.values(ZONES).flatMap(z => (z.encounters || []).map(e => e.sp)));
const unreachable = Object.entries(QUESTS)
  .filter(([, q]) => q.goal?.t === 'catch_species' && !wild.has(q.goal.sp))
  .map(([qid]) => qid);
ok('nhiệm vụ bắt loài nào cũng gặp được loài đó', unreachable.length === 0, unreachable.join(', '));

ok('khắc hệ: nước đánh lửa = 2', typeEff('water', ['fire']) === 2);
ok('khắc hệ: lửa đánh nước = 0.5', typeEff('fire', ['water']) === 0.5);
ok('khắc hệ: hệ lạ trả về 1', typeEff('khong_co', ['fire']) === 1);

// ==== Thời trang ====
const p0 = { stats: { catches: 0, wins: 0 }, badges: [], granted: [] };
ok('danh hiệu mặc định mở sẵn', unlocked(TITLES.rookie, p0, 1));
ok('món trao tay thì khoá cho tới khi được trao',
  !unlocked(TITLES.founder, p0, 99)
  && unlocked(TITLES.founder, { ...p0, granted: ['title:founder'] }, 1));
ok('mọi món thời trang đều có câu điều kiện',
  [...Object.values(TITLES), ...Object.values(AVATAR_FRAMES), ...Object.values(CHAT_FRAMES)]
    .every(d => requirement(d).length > 0));

// ==== Engine ====
const starter = newTuxemon(STARTERS[0].sp, 20, { iv: [31, 31, 31, 31, 31, 31] });
const st = stats(starter);
ok('starter lv20 có chỉ số hợp lý', st.hp > 30 && st.atk > 10 && st.spe > 5, JSON.stringify(st));
ok('hpCur = maxHp lúc mới tạo', starter.hpCur === maxHp(starter));
ok('starter có ít nhất 1 chiêu', (starter.moves || []).length >= 1);

// Lấy một loài tiến hoá theo cấp ngay trong bảng để test, không cắm cứng mã loài
const [evoFrom, evoDef] = Object.entries(EVOLUTIONS)
  .map(([k, v]) => [Number(k), Array.isArray(v) ? v[0] : v])
  .find(([k, v]) => v.method === 'level' && v.level && SPECIES[k] && SPECIES[v.into]);
const mon = newTuxemon(evoFrom, Math.max(1, evoDef.level - 1));
gainExp(mon, expForLevel(SPECIES[evoFrom].expCurve, evoDef.level + 1) - mon.exp + 10);
ok(`lên cấp qua exp (${SPECIES[evoFrom].name} -> Lv.${mon.lv})`, mon.lv >= evoDef.level);
ok('đủ điều kiện tiến hoá', checkEvolution(mon, 'level') === evoDef.into);
ok('tiến hoá thành công', evolve(mon, evoDef.into) && mon.sp === evoDef.into);
ok('có chiêu học đúng cấp', Array.isArray(movesAtLevel(evoFrom, evoDef.level)));

const weak = newTuxemon(STARTERS[1].sp, 3);
weak.hpCur = 1;
let caught = false;
for (let i = 0; i < 40 && !caught; i++) caught = attemptCatch(weak, 'ultra_ball').caught;
ok('bắt được con 1 HP (40 lần thử)', caught);

// Đòn khắc hệ: tìm ngay trong data một cặp chiêu/loài khắc nhau
const superMove = Object.entries(MOVES).find(([, mv]) => mv.power > 0 && mv.category !== 'status'
  && Object.values(SPECIES).some(s => typeEff(mv.type, s.types) > 1));
const [mvId, mv] = superMove;
const victim = Object.entries(SPECIES).find(([, s]) => typeEff(mv.type, s.types) > 1)[0];
const dmg = calcDamage(newTuxemon(STARTERS[0].sp, 20), newTuxemon(Number(victim), 20), mvId, {});
ok(`đòn khắc hệ ${mvId} có hệ số > 1 (hoặc trượt)`, dmg.missed || dmg.eff > 1, JSON.stringify(dmg));

// ==== Trận đấu chạy trọn vẹn ====
const b = new Battle({
  kind: 'wild',
  sides: [
    { mons: [newTuxemon(STARTERS[0].sp, 20)], kind: 'wild' },
    { mons: [newTuxemon(STARTERS[1].sp, 20)], kind: 'wild' },
  ],
});
let turns = 0;
while (!b.over && turns < 200) { b.resolve(); turns++; }
ok(`trận hoang kết thúc (${turns} lượt, bên thắng = ${b.winner})`, b.over);

const bt = new Battle({
  kind: 'trainer',
  sides: [
    { mons: [newTuxemon(STARTERS[0].sp, 20)], kind: 'player' },
    { mons: [newTuxemon(STARTERS[2].sp, 18)], kind: 'trainer' },
  ],
});
const [okBall] = bt.submit(0, { t: 'ball', id: 'poke_ball' });
const [okRun] = bt.submit(0, { t: 'run' });
ok('trận trainer chặn ném bóng + bỏ chạy', !okBall && !okRun);

console.log(fails === 0 ? '=== SMOKE OK ===' : `=== ${fails} FAIL ===`);
process.exit(fails === 0 ? 0 : 1);
