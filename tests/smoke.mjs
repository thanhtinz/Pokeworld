// TuxeWorld H5 | tests/smoke.mjs | Smoke test chạy bằng node (không cần trình duyệt)
// Kiểm tra data + engine: import sạch, số liệu khớp chéo, battle chạy trọn trận.
// Test này CHẶN DEPLOY: hỏng là GitHub Actions không đẩy được bản mới lên web.
import { SPECIES } from '../js/data/species.js';
import { MOVES } from '../js/data/moves.js';
import { LEARNSETS } from '../js/data/learnsets.js';
import { EVOLUTIONS } from '../js/data/evolutions.js';
import { ITEMS } from '../js/data/items.js';
import { ZONES } from '../js/data/zones.js';
import { MAPS } from '../js/data/maps.js';
import { TRAINERS } from '../js/data/trainers.js';
import { STARTERS } from '../js/data/starters.js';
import { QUESTS, DAILY_REWARDS } from '../js/data/quests.js';
import { CHAPTERS, RIVAL_STARTER } from '../js/data/story.js';
import { TITLES, AVATAR_FRAMES, CHAT_FRAMES, SKINS, COSMETIC_KINDS, ALL_KINDS, NONE_ID,
  applyRemote, imgOf, unlocked, requirement } from '../js/data/cosmetics.js';
import { typeEff, TYPE_NAMES, TYPE_COLORS, TYPES } from '../js/data/types.js';
import { NATURES, NATURE_LIST } from '../js/data/natures.js';
import { newTuxemon, stats, maxHp } from '../js/engine/pokemon.js';
import { expForLevel, gainExp, movesAtLevel } from '../js/engine/exp.js';
import { calcDamage } from '../js/engine/damage.js';
import { attemptCatch } from '../js/engine/catchmon.js';
import { checkEvolution, evolve } from '../js/engine/evolution.js';
import { Battle } from '../js/engine/battle.js';
import { G, newGame } from '../js/state.js';
import { monLevelCap, MAX_TRAINER_LEVEL, trainerExpFor } from '../js/engine/player.js';
import { FEATURES, isUnlocked, unlockedBetween } from '../js/engine/unlock.js';

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
// Ba con khởi đầu phải khác loài, khác hệ, đều là bậc cơ bản và có đường tiến hoá
ok('starter không trùng loài và không trùng hệ',
  new Set(STARTERS.map(s => s.sp)).size === 3 && new Set(STARTERS.map(s => s.type)).size === 3,
  STARTERS.map(s => `${s.name}/${s.type}`).join(' '));
ok('starter đều là bậc cơ bản và tiến hoá được',
  STARTERS.every(s => SPECIES[s.sp].stage === 'basic' && EVOLUTIONS[s.sp]),
  STARTERS.map(s => `${s.name}:${SPECIES[s.sp].stage}`).join(' '));
ok('đối thủ luôn nhặt một starter khác của mình',
  STARTERS.every(s => {
    const r = RIVAL_STARTER[s.sp];
    return r && r !== s.sp && STARTERS.some(x => x.sp === r);
  }), JSON.stringify(RIVAL_STARTER));

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

// ==== Bản đồ đi bộ ====
const mapBad = [];
for (const [id, mp] of Object.entries(MAPS)) {
  if (!mp.spawn || mp.spawn.x < 0 || mp.spawn.y < 0 || mp.spawn.x >= mp.w || mp.spawn.y >= mp.h) {
    mapBad.push(`${id}: điểm vào ngoài bản đồ`);
  }
  for (const w of mp.warps || []) {
    if (!MAPS[w.to]) mapBad.push(`${id} -> ${w.to} (không có bản đồ)`);
    else if (w.tx !== undefined && (w.tx < 0 || w.ty < 0 || w.tx >= MAPS[w.to].w || w.ty >= MAPS[w.to].h)) {
      mapBad.push(`${id} -> ${w.to} rơi ra ngoài bản đồ`);
    }
  }
}
ok('mọi điểm vào và cổng dịch chuyển đều nằm trong bản đồ', mapBad.length === 0, mapBad.slice(0, 3).join(' | '));

ok('khắc hệ: nước đánh lửa = 2', typeEff('water', ['fire']) === 2);
ok('khắc hệ: lửa đánh nước = 0.5', typeEff('fire', ['water']) === 0.5);
ok('khắc hệ: hệ lạ trả về 1', typeEff('khong_co', ['fire']) === 1);

// ==== Thời trang (toàn bộ là ảnh admin tải lên) ====
const p0 = { stats: { catches: 0, wins: 0 }, badges: [], granted: [] };
// Trang Thời trang chỉ còn skin + danh hiệu; khung avatar và bong bóng chat
// nằm trong bảng Trang trí, nhưng cả bốn loại vẫn phải có ô "không mặc gì".
ok('trang Thời trang có 2 tab', COSMETIC_KINDS.length === 2
  && COSMETIC_KINDS.every(k => ALL_KINDS.some(a => a.id === k.id)));
ok('bốn loại thời trang', ALL_KINDS.length === 4
  && ALL_KINDS.every(k => k.data[NONE_ID[k.id]]));
ok('ô "không mặc gì" luôn mở sẵn',
  ALL_KINDS.every(k => unlocked(k.data[NONE_ID[k.id]], p0, 1)));

// Giả lập máy chủ trả về kho thời trang admin đã tải lên
applyRemote([
  { kind: 'title', id: 'tet', name: 'Tết', how: 'manual', img: '/uploads/cosmetics/t.png' },
  { kind: 'avatarFrame', id: 'vip', name: 'VIP', how: 'level', n: 40, img: '/uploads/cosmetics/v.png' },
], 'http://may-chu');
ok('nhận món admin thêm', !!TITLES.tet && !!AVATAR_FRAMES.vip);
ok('ghép đúng địa chỉ ảnh', imgOf(TITLES.tet) === 'http://may-chu/uploads/cosmetics/t.png');
ok('món trao tay khoá cho tới khi được trao',
  !unlocked(TITLES.tet, p0, 99)
  && unlocked(TITLES.tet, { ...p0, granted: ['title:tet'] }, 1));
ok('món theo cấp mở đúng mốc',
  !unlocked(AVATAR_FRAMES.vip, p0, 39) && unlocked(AVATAR_FRAMES.vip, p0, 40));
applyRemote([], 'http://may-chu');
ok('admin xoá món thì client gỡ theo, ô "không mặc gì" vẫn còn',
  !TITLES.tet && !AVATAR_FRAMES.vip && TITLES.none && SKINS.default);
ok('mọi món thời trang đều có câu điều kiện',
  [...Object.values(TITLES), ...Object.values(AVATAR_FRAMES), ...Object.values(CHAT_FRAMES)]
    .every(d => requirement(d).length > 0));

// ==== Engine ====
const starter = newTuxemon(STARTERS[0].sp, 20, { iv: [31, 31, 31, 31, 31, 31] });
const st = stats(starter);
ok('starter lv20 có chỉ số hợp lý', st.hp > 30 && st.atk > 10 && st.spe > 5, JSON.stringify(st));
ok('hpCur = maxHp lúc mới tạo', starter.hpCur === maxHp(starter));
ok('starter có ít nhất 1 chiêu', (starter.moves || []).length >= 1);

// Trần cấp Tuxemon tính theo cấp huấn luyện viên nên phải có người chơi thật
// mới nuôi lên cao được. Dựng một ván rồi nâng cấp huấn luyện viên lên kịch.
newGame('Test');
G.p.trainer = { level: MAX_TRAINER_LEVEL, exp: 0 };
ok('trần cấp mở hết khi Trainer tối đa', monLevelCap() >= 100, String(monLevelCap()));

// ==== Nhịp chơi: trần cấp + exp theo loại trận ====
G.p.trainer = { level: 1, exp: 0 };
ok('trần cấp lúc mới chơi là Lv.10', monLevelCap() === 10, String(monLevelCap()));
const capMon = newTuxemon(STARTERS[0].sp, 10);
const truoc = capMon.exp;
gainExp(capMon, 1000);
ok('chạm trần thì exp vào nhỏ giọt', capMon.exp - truoc <= 200, String(capMon.exp - truoc));
const duoiTran = newTuxemon(STARTERS[0].sp, 3);
const truoc2 = duoiTran.exp;
gainExp(duoiTran, 1000);
ok('dưới trần thì exp vào đủ', duoiTran.exp - truoc2 === 1000);
ok('đánh trainer đáng giá hơn đánh quái hoang',
  trainerExpFor('trainer', 10) > trainerExpFor('wild', 10) * 2);

// ==== Mở khoá tính năng theo cấp ====
ok('tính năng ngoài bảng thì luôn mở', isUnlocked('home', 1) && isUnlocked('party', 1));
ok('tính năng xã hội khoá lúc mới chơi',
  !isUnlocked('pvp', 1) && !isUnlocked('guild', 1) && !isUnlocked('marriage', 1));
ok('đủ cấp thì mở', Object.entries(FEATURES).every(([id, f]) => isUnlocked(id, f.lv)));
ok('mốc mở khoá tăng dần và không trùng',
  new Set(Object.values(FEATURES).map(f => f.lv)).size === Object.keys(FEATURES).length);
ok('lên cấp báo đúng thứ vừa mở',
  unlockedBetween(1, FEATURES.quest.lv).some(f => f.id === 'quest')
  && !unlockedBetween(1, FEATURES.quest.lv).some(f => f.id === 'marriage'));
G.p.trainer = { level: MAX_TRAINER_LEVEL, exp: 0 };

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
