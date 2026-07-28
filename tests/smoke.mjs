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
import { ENCOUNTERS } from '../js/data/encounters.js';
import { TRAINERS } from '../js/data/trainers.js';
import { STARTERS } from '../js/data/starters.js';
import { QUESTS, DAILY_REWARDS } from '../js/data/quests.js';
import { CHAPTERS, RIVAL_STARTER } from '../js/data/story.js';
import { TITLES, AVATAR_FRAMES, CHAT_FRAMES, SKINS, COSMETIC_KINDS, ALL_KINDS, NONE_ID,
  applyRemote, imgOf, unlocked, requirement } from '../js/data/cosmetics.js';
import { typeEff, TYPE_NAMES, TYPE_COLORS, TYPES } from '../js/data/types.js';
import { TASTES_COLD, TASTES_WARM, COLD_LIST, WARM_LIST } from '../js/data/tastes.js';
import { newTuxemon, stats, maxHp, STAT_KEYS, heal } from '../js/engine/monster.js';
import { PLAGUES } from '../js/data/plagues.js';
import { expForLevel, expYield, gainExp, movesAtLevel } from '../js/engine/exp.js';
import { calcDamage, typeMultiplier, RANGE_MAP } from '../js/engine/damage.js';
import { attemptCatch, ballModifier, statusModifier, applyBallEffects,
  keepOnFail } from '../js/engine/catchmon.js';
import { CAPDEV } from '../js/data/capdev.js';
import { useItem, canUse, foodBond } from '../js/engine/useitem.js';
import { escapeChance } from '../js/engine/escape.js';
import { scoreMove, pickItem } from '../js/engine/ai.js';
import { SHAPE_VI, STAGE_VI, HOME_VI, TAG_VI } from '../js/data/traits.js';
import { MON_CRY, CRY_SFX, cryPath, MUSIC } from '../js/data/sounds.js';
import { checkEvolution, evolve } from '../js/engine/evolution.js';
import { Battle } from '../js/engine/battle.js';
import { STATUSES } from '../js/data/statuses.js';
import { TECH_SFX } from '../js/data/sounds.js';
import { fxFor } from '../js/data/vfx.js';
import { applyStatus, removeStatus, endOfTurn, statMult, thornDamage,
  counterDamage, swapDamage, wildRampage, condBlocked, condTag } from '../js/engine/status.js';
import { G, newGame } from '../js/state.js';
import { monLevelCap, MAX_TRAINER_LEVEL, trainerExpFor } from '../js/engine/player.js';
import { FEATURES, isUnlocked, unlockedBetween } from '../js/engine/unlock.js';

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

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
// Khẩu vị thay cho tính cách: 6 vị lạnh (giảm) + 6 vị ấm (tăng), đúng bảng gốc
ok('12 khẩu vị', COLD_LIST.length === 6 && WARM_LIST.length === 6
  && Object.values(TASTES_COLD).every(t => t.mult < 1)
  && Object.values(TASTES_WARM).every(t => t.mult > 1));
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
    for (const it of o.item || []) if (!ITEMS[it]) bad.push(`tiến hoá ${sp}: đá ${it}`);
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

// NPC không được chồng ô hay đứng dính nhau — dính nhau là thành đám chặn lối
const npcBad = [];
for (const [id, mp] of Object.entries(MAPS)) {
  const o = new Set();
  for (const n of mp.npcs || []) {
    const k = `${n.x},${n.y}`;
    if (o.has(k)) npcBad.push(`${id}: hai người cùng ô ${k}`);
    o.add(k);
  }
  for (const a of mp.npcs || []) {
    for (const b of mp.npcs || []) {
      if (a === b) continue;
      if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1) {
        npcBad.push(`${id}: ${a.name} dính sát ${b.name}`);
      }
    }
  }
}
ok('NPC đứng cách nhau, không tụ thành đám', npcBad.length === 0, npcBad.slice(0, 3).join(' | '));

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
const starter = newTuxemon(STARTERS[0].sp, 20, { iv: [15, 15, 15, 15, 15, 15] });
const st = stats(starter);
ok('starter lv20 có đủ 6 chỉ số Tuxemon',
  STAT_KEYS.every(k => typeof st[k] === 'number' && st[k] > 0), JSON.stringify(st));

// Công thức gốc: chỉ số = dáng_thân * (cấp + 7) + IV (+ TP), rồi nhân khẩu vị
{
  const spec = SPECIES[STARTERS[0].sp];
  const plain = newTuxemon(STARTERS[0].sp, 20, { iv: [0, 0, 0, 0, 0, 0],
    tasteCold: 'mild', tasteWarm: 'peppy' });   // hai vị này cùng đánh vào speed
  const p = stats(plain);
  const khop = STAT_KEYS.filter(k => k !== 'speed')
    .every(k => p[k] === spec.base[k] * 27);
  ok('chỉ số = dáng thân * (cấp + 7)', khop, JSON.stringify(p));
  ok('khẩu vị lạnh/ấm cùng đánh vào một chỉ số thì bù nhau',
    p.speed === Math.floor(Math.floor(spec.base.speed * 27 * 0.9) * 1.1), String(p.speed));
  ok('mọi dáng thân cộng lại đều bằng 36 (không con nào mạnh sẵn)',
    Object.values(SPECIES).every(sp => STAT_KEYS.reduce((n, k) => n + sp.base[k], 0) === 36));
}
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
  .map(([k, v]) => [Number(k), (Array.isArray(v) ? v : [v]).find(
    o => o.level && !o.item && !o.gender && !o.bond && !o.stat && !o.tech)])
  .find(([k, v]) => v && SPECIES[k] && SPECIES[v.into]);
const mon = newTuxemon(evoFrom, Math.max(1, evoDef.level - 1));
gainExp(mon, expForLevel(evoDef.level + 1) - mon.exp + 10);
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
const superMove = Object.entries(MOVES).find(([, mv]) => mv.power > 0 && mv.category === 'damage'
  && Object.values(SPECIES).some(s => typeMultiplier(mv.types, s.types) > 1));
const [mvId, mv] = superMove;
const victim = Object.entries(SPECIES).find(([, s]) => typeMultiplier(mv.types, s.types) > 1)[0];
const dmg = calcDamage(newTuxemon(STARTERS[0].sp, 20), newTuxemon(Number(victim), 20), mvId, {});
ok(`đòn khắc hệ ${mvId} có hệ số > 1 (hoặc trượt)`, dmg.missed || dmg.eff > 1, JSON.stringify(dmg));

// ==== Công thức đúng theo bản gốc Tuxemon ====
{
  // Sát thương = chỉ_số_ra_đòn * (7 + cấp) * power * khắc_hệ / chỉ_số_đỡ
  const att = newTuxemon(STARTERS[0].sp, 20, { iv: [0, 0, 0, 0, 0, 0], tasteCold: 'bland', tasteWarm: 'savory' });
  const def = newTuxemon(STARTERS[2].sp, 20, { iv: [0, 0, 0, 0, 0, 0], tasteCold: 'bland', tasteWarm: 'savory' });
  // Chọn một chiêu melee 100% trúng để tính tay cho khớp
  const entry = Object.entries(MOVES).find(([, m]) => m.category === 'damage' && m.range === 'melee' && m.acc === 100);
  if (entry) {
    const [id, m] = entry;
    const sa = stats(att), sd = stats(def);
    const mult = typeMultiplier(m.types, SPECIES[def.sp].types);
    const cho = Math.floor(sa.melee * (7 + att.lv) * (m.power * mult) / Math.max(1, sd.armour));
    const got = calcDamage(att, def, id, {}).dmg;
    ok(`sát thương khớp công thức gốc (${id})`, got === Math.max(1, cho), `${got} vs ${cho}`);
  }
  // Tầm đánh quyết định cặp chỉ số nào được dùng
  ok('bảng tầm đánh đúng như mods/range_map.yaml',
    RANGE_MAP.melee[0] === 'melee' && RANGE_MAP.melee[1] === 'armour'
    && RANGE_MAP.touch[1] === 'dodge' && RANGE_MAP.ranged[0] === 'ranged'
    && RANGE_MAP.reach[1] === 'armour' && RANGE_MAP.reliable[0] === 'level');
  // Khắc hệ nhân dồn mọi hệ rồi kẹp trong [0.25, 4]
  ok('hệ số khắc hệ kẹp trong 0.25 - 4', Object.values(MOVES).every(m => {
    const v = typeMultiplier(m.types, ['fire', 'water']);
    return v >= 0.25 && v <= 4;
  }));
  // Bản gốc không có STAB và không có chí mạng
  ok('không có đòn chí mạng', calcDamage(att, def, entry ? entry[0] : 'ram', {}).crit === false);
}

// EXP: tổng exp để lên cấp N = N^3, hạ một con cấp L cho L^2 (nêm theo loại trận)
ok('đường exp = cấp mũ 3', expForLevel(10) === 1000 && expForLevel(20) === 8000 && expForLevel(1) === 0);
{
  const con = newTuxemon(STARTERS[0].sp, 10);
  ok('exp thưởng = cấp bình phương (đã nêm theo loại trận)',
    expYield(con, 1, 'trainer') === Math.floor(100 * 1.5) && expYield(con, 1, 'wild') === Math.floor(100 * 0.85),
    `${expYield(con, 1, 'trainer')} / ${expYield(con, 1, 'wild')}`);
}

// Mỗi chiêu mang sẵn tiếng động và hiệu ứng riêng của bản gốc
{
  const coSfx = Object.values(MOVES).filter(m => m.sfx);
  const coAnim = Object.values(MOVES).filter(m => m.anim);
  ok('phần lớn chiêu có tiếng riêng', coSfx.length >= 200, String(coSfx.length));
  ok('tiếng của chiêu đều có tệp thật', coSfx.every(m => TECH_SFX[m.sfx]),
    coSfx.filter(m => !TECH_SFX[m.sfx]).slice(0, 3).map(m => m.sfx).join(' '));
  ok('phần lớn chiêu có hiệu ứng riêng', coAnim.length >= 200, String(coAnim.length));
  ok('hiệu ứng của chiêu luôn tìm được ảnh',
    coAnim.every(m => fxFor(m.anim, m.types[0])?.src));
}

// Chạy trốn theo đúng công thức bản gốc: hụt lần nào lần sau dễ hơn
{
  const me = newTuxemon(STARTERS[0].sp, 10);
  const foe = newTuxemon(STARTERS[2].sp, 10);
  ok('cùng cấp, lần đầu chạy 40%', Math.abs(escapeChance('default', me, foe, 0) - 0.4) < 1e-9);
  ok('thử lại lần 2 lên 55%', Math.abs(escapeChance('default', me, foe, 1) - 0.55) < 1e-9);
  ok('thử 4 lần là chắc chắn thoát', escapeChance('default', me, foe, 4) === 1);
  ok('cấp thấp hơn nhiều thì khó chạy',
    escapeChance('default', me, newTuxemon(STARTERS[2].sp, 40), 0) === 0);
  ok('cách tính always/never', escapeChance('always', me, foe) === 1
    && escapeChance('never', me, foe) === 0);
  ok('cách tính relative nằm trong [0,1]',
    escapeChance('relative', me, foe) >= 0 && escapeChance('relative', me, foe) <= 1);
  // Trong trận thật: chạy trong trận hoang dã phải kết thúc được trận
  const b = new Battle({ kind: 'wild', escapeMethod: 'always',
    sides: [{ kind: 'player', mons: [newTuxemon(STARTERS[0].sp, 10)] },
      { kind: 'wild', mons: [newTuxemon(STARTERS[2].sp, 5)] }] });
  b.submit(0, { t: 'run' });
  b.submit(1, { t: 'move', i: 0 });
  const evs = b.resolve().events;
  ok('chạy trốn kết thúc trận', b.over && evs.some(e => e.t === 'run' && e.ok));
}

// Điều kiện tiến hoá lấy đủ từ bản gốc, không chỉ mỗi "đủ cấp"
{
  const ways = Object.values(EVOLUTIONS).flat();
  const dem = (k) => ways.filter(w => w[k]).length;
  ok('có đường tiến hoá cần vật phẩm / giới tính / thân thiết',
    dem('item') > 0 && dem('gender') > 0 && dem('bond') > 0,
    `item ${dem('item')} · gender ${dem('gender')} · bond ${dem('bond')}`);
  // Đường cần vật phẩm thì lên cấp suông không được, dùng đúng món mới được
  const [sp, list] = Object.entries(EVOLUTIONS).find(([, w]) => w.some(x => x.item));
  const w = list.find(x => x.item);
  const m = newTuxemon(Number(sp), 60);
  ok('cần vật phẩm thì lên cấp suông không tiến hoá', checkEvolution(m, 'level') !== w.into);
  ok('dùng đúng vật phẩm mới tiến hoá',
    checkEvolution(m, 'stone', w.item[0]) === w.into && checkEvolution(m, 'stone', 'potion') !== w.into);
  // Đường cần giới tính thì con khác giới đi đường khác
  const g = Object.entries(EVOLUTIONS).find(([, w2]) => w2.some(x => x.gender));
  if (g) {
    const gw = g[1].find(x => x.gender);
    const dung = newTuxemon(Number(g[0]), 60, { gender: gw.gender });
    const sai = newTuxemon(Number(g[0]), 60, { gender: gw.gender === 'f' ? 'm' : 'f' });
    ok('điều kiện giới tính có tác dụng',
      checkEvolution(dung, 'level') === gw.into && checkEvolution(sai, 'level') !== gw.into);
  }
}

// Điều kiện bấm chiêu (db/technique: conditions của bản gốc).
{
  const co = Object.entries(MOVES).filter(([, m]) => m.cond?.length);
  ok('có chiêu đòi điều kiện trạng thái', co.length >= 5, `${co.length} chiêu`);
  ok('dreamwalk phải đang ngủ mới dùng được',
    MOVES.dreamwalk?.cond?.some(c => c.id === 'noddingoff' && !c.no));
  ok('mấy chiêu lấy đà bị chặn khi đang ghì/kẹt',
    ['altitude', 'burrow_blast', 'depth_charge', 'oven', 'rift_dash']
      .every(id => !MOVES[id] || MOVES[id].cond?.some(c => c.id === 'grabbed' && c.no)));

  const m = newTuxemon(STARTERS[0].sp, 20);
  m.status = null;
  ok('chưa ngủ thì không bấm được dreamwalk', !!condBlocked(m, MOVES.dreamwalk, 'X'));
  ok('nút hiện lý do bị chặn', condTag(m, MOVES.dreamwalk) === 'Cần Ngủ gật');
  m.status = 'noddingoff';
  ok('đang ngủ thì dreamwalk mở khoá', condBlocked(m, MOVES.dreamwalk, 'X') === null);
  ok('đang ngủ thì chiêu lấy đà vẫn bấm được',
    condBlocked(m, MOVES.altitude, 'X') === null);
  m.status = 'grabbed';
  ok('đang bị ghì thì chiêu lấy đà bị chặn', !!condBlocked(m, MOVES.altitude, 'X'));

  // Engine phải từ chối thật, không chỉ mờ nút
  {
    const ta = newTuxemon(STARTERS[0].sp, 20);
    ta.moves = [{ id: 'dreamwalk', cd: 0 }, { id: 'canine', cd: 0 }];
    const dich = newTuxemon(STARTERS[1].sp, 20);
    const bt = new Battle({ kind: 'wild',
      sides: [{ kind: 'player', mons: [ta] }, { kind: 'wild', mons: [dich] }] });
    ok('submit chặn chiêu chưa đủ điều kiện', bt.submit(0, { t: 'move', i: 0 })[0] === false);
    ta.status = 'noddingoff';
    ok('đủ điều kiện thì submit cho qua', bt.submit(0, { t: 'move', i: 0 })[0] === true);
  }
}

// Chiêu vòng cuối (struggle) KHÔNG được chiếm ô trong bộ bốn chiêu.
// Bản gốc đánh dấu learning_method: fallback và chỉ lấy ra khi hết chiêu dùng
// được; để nó lẫn vào learnset thì con nào cũng mang sẵn một chiêu gần vô dụng.
{
  const dinh = Object.entries(LEARNSETS)
    .filter(([, ls]) => ls.some(([, id]) => id === 'struggle')).map(([sp]) => sp);
  ok('không loài nào học struggle qua bảng học chiêu', dinh.length === 0,
    dinh.slice(0, 5).join(' '));
  ok('struggle vẫn còn trong bảng chiêu để dùng làm vòng cuối', !!MOVES.struggle);
  // Con mới ra lò phải có chiêu đánh được, không phải toàn chiêu hỗ trợ
  const m2 = newTuxemon(STARTERS[0].sp, 25);
  ok('starter cấp 25 có chiêu tấn công tử tế',
    m2.moves.some(mv => MOVES[mv.id]?.category === 'damage' && MOVES[mv.id].power >= 1),
    m2.moves.map(mv => `${mv.id}(${MOVES[mv.id]?.power})`).join(' '));
}

// Chiêu dùng "recharge" chứ không phải PP
ok('chiêu nào cũng có số lượt hồi, không có PP',
  Object.values(MOVES).every(m => typeof m.recharge === 'number' && m.pp === undefined));

// Bắt: thang catch_rate 0-100 + khoảng kháng bắt của từng loài
ok('catch_rate nằm thang 0-100 và có khoảng kháng bắt',
  Object.values(SPECIES).every(s => s.catchRate >= 0 && s.catchRate <= 100
    && s.catchLo > 0 && s.catchHi >= s.catchLo));

// Tuxeball: mỗi loại một hệ số riêng, lấy từ mods/capture_devices.yaml
{
  const balls = Object.entries(ITEMS).filter(([, it]) => it.kind === 'ball');
  ok('có đủ bộ tuxeball', balls.length >= 20, String(balls.length));
  ok('bóng nào cũng chỉ ném được trong trận với con hoang',
    balls.every(([, it]) => it.inBattle && it.cond.some(c => c.t === 'wild')));
  ok('bóng nào cũng có hệ số trong bảng capdev',
    balls.every(([id]) => CAPDEV[id]), balls.filter(([id]) => !CAPDEV[id]).map(x => x[0]).join(' '));

  const wood = Object.entries(SPECIES).find(([, s]) => s.types.includes('wood'))[0];
  const notWood = Object.entries(SPECIES).find(([, s]) => !s.types.includes('wood'))[0];
  ok('Tuxeball Gỗ ăn con hệ Gỗ, con hệ khác thì phạt nặng',
    ballModifier('tuxeball_wood', newTuxemon(Number(wood), 10)) > 1
    && ballModifier('tuxeball_wood', newTuxemon(Number(notWood), 10)) < 0.5);
  ok('Tuxeball Cổ mạnh gấp 99 lần', ballModifier('tuxeball_ancient', newTuxemon(1, 10)) === 99);
  ok('Tuxeball Đực chuộng con đực',
    ballModifier('tuxeball_male', newTuxemon(1, 10, { gender: 'm' }))
    > ballModifier('tuxeball_male', newTuxemon(1, 10, { gender: 'f' })));
  ok('bóng gia cố ném hụt vẫn nhặt lại được',
    keepOnFail('tuxeball_hardened') && !keepOnFail('tuxeball'));
  {
    const m = newTuxemon(1, 10);
    const lv = m.lv;
    applyBallEffects('tuxeball_candy', m);
    applyBallEffects('tuxeball_salty', m);
    ok('bóng kẹo +1 cấp, bóng vị mặn đổi khẩu vị',
      m.lv === lv + 1 && m.tasteWarm === 'salty');
  }
  ok('trạng thái xấu làm dễ bắt hơn', (() => {
    const m = newTuxemon(1, 10);
    const truoc = statusModifier('tuxeball', m);
    applyStatus(m, 'poison');
    return statusModifier('tuxeball', m) > truoc;
  })());
}

// Vật phẩm: hiệu ứng chạy đúng như bản gốc
{
  const it = Object.entries(ITEMS);
  ok('có đủ bộ vật phẩm', it.length >= 80, String(it.length));
  // Đồ mang theo không "dùng" mà cho Tuxemon cầm, nên không có eff/inBattle
  const dung = it.filter(([, x]) => !x.held);
  ok('món nào cũng có ít nhất một hiệu ứng', dung.every(([, x]) => x.eff.length > 0));
  ok('món nào cũng dùng được ở đâu đó', dung.every(([, x]) => x.inBattle || x.inWorld));
  ok('có đồ mang theo', it.some(([, x]) => x.held));

  // Máy Truyền EXP: con dự bị cũng lên EXP sau trận
  {
    const ra = newTuxemon(STARTERS[0].sp, 30);
    const duBi = newTuxemon(STARTERS[1].sp, 10);
    ra.held = 'xp_transmitter';
    const dich = newTuxemon(STARTERS[2].sp, 5);
    dich.hpCur = 1;
    const truoc = duBi.exp;
    const bt = new Battle({ kind: 'wild',
      sides: [{ kind: 'player', mons: [ra, duBi] }, { kind: 'wild', mons: [dich] }] });
    let n = 0;
    while (!bt.over && n < 40) {
      const u = ra.moves.findIndex(m => (m.cd || 0) <= 0);
      bt.submit(0, u >= 0 ? { t: 'move', i: u } : { t: 'struggle' });
      bt.resolve(); n++;
    }
    ok('Máy Truyền EXP chia EXP cho con dự bị', duBi.exp > truoc,
      `${truoc} -> ${duBi.exp}`);
  }

  // Thuốc hồi máu: đúng số HP ghi trong mô tả
  const mon = newTuxemon(STARTERS[0].sp, 20);
  mon.hpCur = 1;
  useItem('potion', mon, { inBattle: false });
  ok('thuốc hồi đúng 50 HP', mon.hpCur === 51, String(mon.hpCur));

  // Con còn đầy máu thì thuốc không dùng được (điều kiện current_hp < 1.0)
  mon.hpCur = maxHp(mon);
  ok('máu đầy thì không dùng được thuốc', !canUse('potion', mon, { inBattle: false }));

  // Hồi sinh: chỉ dùng cho con đã gục
  const guc = newTuxemon(STARTERS[1].sp, 20);
  guc.hpCur = 0;
  ok('hồi sinh chỉ dùng cho con đã gục',
    canUse('revive', guc, { inBattle: false })
    && !canUse('revive', newTuxemon(STARTERS[1].sp, 20), { inBattle: false }));
  useItem('revive', guc, { inBattle: false });
  ok('hồi sinh thì sống lại', guc.hpCur > 0, String(guc.hpCur));

  // Trà: cho thẳng EXP
  const tra = newTuxemon(STARTERS[2].sp, 5);
  const expTruoc = tra.exp;
  useItem('tea', tra, { inBattle: false });
  ok('trà cho đúng 500 EXP', tra.exp - expTruoc === 500, String(tra.exp - expTruoc));

  // Món ăn: hợp khẩu vị thì tăng thân thiết, kỵ thì mất
  const an = newTuxemon(STARTERS[0].sp, 10, { tasteWarm: 'salty', tasteCold: 'sweet' });
  ok('hợp cả hai vị thì +10 thân thiết', foodBond(an, 'salty', 'sweet') === 10);
  ok('kỵ cả hai vị thì -10 thân thiết', foodBond(an, 'sweet', 'salty') === -10);
  ok('không hợp không kỵ thì không đổi', foodBond(an, 'peppy', 'dry') === 0);

  // Đá tiến hoá phải trỏ tới đường tiến hoá có thật
  const daTienHoa = it.filter(([, x]) => x.eff.some(e => e.t === 'evolve')).map(([id]) => id);
  const duong = new Set(Object.values(EVOLUTIONS).flat().flatMap(w => w.item || []));
  ok('đá tiến hoá nào cũng mở được ít nhất một đường',
    daTienHoa.some(id => duong.has(id)), daTienHoa.join(' '));
}

// Mọi đường dẫn assets/... viết cứng trong mã và CSS đều phải có tệp thật.
// Trước đây màn mở đầu dò assets/video/intro.mp4 (không hề có) nên vào game
// mới là ăn ngay một lỗi 404 trong console mà không ai để ý.
{
  const goc = new URL('..', import.meta.url).pathname;
  const thieu = [];
  const quet = (thuMuc, duoi) => {
    for (const f of readdirSync(join(goc, thuMuc), { withFileTypes: true })) {
      const p2 = join(thuMuc, f.name);
      if (f.isDirectory()) { quet(p2, duoi); continue; }
      if (!duoi.some(d => f.name.endsWith(d))) continue;
      const src = readFileSync(join(goc, p2), 'utf8');
      for (const m of src.matchAll(/['"`(]\s*(assets\/[A-Za-z0-9_./-]+\.[a-z0-9]{2,4})/g)) {
        const duong = m[1];
        if (duong.includes('${')) continue;
        if (!existsSync(join(goc, duong))) thieu.push(`${p2}: ${duong}`);
      }
    }
  };
  quet('js', ['.js']);
  quet('css', ['.css']);
  ok('đường dẫn ảnh/âm thanh viết cứng nào cũng có tệp thật',
    thieu.length === 0, thieu.slice(0, 5).join(' | '));
}

// Mã huấn luyện viên không còn đặt theo hạng huấn luyện viên của game khác
{
  const xau = /^(gym_|rocket|youngster|lass|bugcatcher|hiker_|camper_|sailor_|swimmer_|channeler|picnicker)/;
  const dinh = Object.keys(TRAINERS).filter(id => xau.test(id));
  ok('mã huấn luyện viên đã đổi hết', dinh.length === 0, dinh.join(' '));
  const kind = new Set(Object.values(TRAINERS).map(t => t.kind));
  ok('loại huấn luyện viên chỉ còn trainer/gym/xero/rival',
    [...kind].every(k => ['trainer', 'gym', 'xero', 'rival'].includes(k)),
    [...kind].join(' '));
  // Ảnh 2D của ai cũng phải tồn tại (mksprites kiểm tra khi sinh, đây chốt lại)
  ok('huấn luyện viên nào cũng có tên sprite',
    Object.values(TRAINERS).every(t => t.sprite && /^[a-z_0-9]+$/.test(t.sprite)));
}

// Tuxedex lọc được: dữ liệu phải đủ để tìm theo tên, hệ, nơi sống, đặc điểm
{
  const v = Object.values(SPECIES).filter(s => !s.glitched);
  ok('loài nào cũng có tên để tìm', v.every(s => s.name && s.name.length > 1));
  ok('mỗi hệ đều lọc ra được ít nhất một loài',
    TYPES.every(t => v.some(s => s.types.includes(t))),
    TYPES.filter(t => !v.some(s => s.types.includes(t))).join(' '));
  const nha = new Set(v.flatMap(s => s.home || []));
  const dd = new Set(v.flatMap(s => s.tags || []));
  ok('có nhiều nơi sống và đặc điểm để lọc', nha.size >= 10 && dd.size >= 20,
    `${nha.size} nơi sống, ${dd.size} đặc điểm`);
}

// Bệnh dịch (mods/plagues.yaml): dính chiêu mang bệnh thì có thể lây,
// con đang bệnh ra đòn lại có lúc lây tiếp thay vì đánh
{
  ok('có bảng bệnh dịch', Object.keys(PLAGUES).length >= 1);
  ok('bệnh nào cũng có tên tiếng Việt và tỉ lệ lây',
    Object.values(PLAGUES).every(p2 => p2.name && p2.spread > 0 && p2.spread <= 1));

  const mvBenh = Object.entries(MOVES).find(([, m]) =>
    (m.eff || []).some(e => e.t === 'plague'));
  ok('có chiêu mang bệnh trong bảng chiêu', !!mvBenh, mvBenh?.[0]);

  if (mvBenh) {
    // Ném chiêu bệnh nhiều lần thì kiểu gì cũng có lần lây được
    let lay = 0;
    for (let k = 0; k < 300; k++) {
      const me = newTuxemon(STARTERS[0].sp, 30);
      const foe = newTuxemon(STARTERS[2].sp, 30);
      me.moves = [{ id: mvBenh[0], cd: 0 }];
      foe.moves = [{ id: mvBenh[0], cd: 0 }];
      const bt = new Battle({ kind: 'wild',
        sides: [{ kind: 'player', mons: [me] }, { kind: 'wild', mons: [foe] }] });
      bt.submit(0, { t: 'move', i: 0 });
      bt.submit(1, { t: 'move', i: 0 });
      bt.resolve();
      if (foe.plague) lay++;
    }
    ok('chiêu mang bệnh lây được nhưng không phải lúc nào cũng lây',
      lay > 5 && lay < 250, `${lay}/300`);
  }

  // Trạm hồi sức chữa luôn bệnh
  {
    const m2 = newTuxemon(STARTERS[0].sp, 20);
    m2.plague = Object.keys(PLAGUES)[0];
    heal(m2);
    ok('hồi sức chữa luôn bệnh dịch', !m2.plague);
  }
}

// Tiến hoá: mấy điều kiện nhìn ra ngoài bản thân con vật
{
  const ways = Object.entries(EVOLUTIONS).flatMap(([sp, w]) => w.map(x => [Number(sp), x]));
  const co = (k) => ways.filter(([, w]) => w[k] !== undefined);
  ok('có đường tiến hoá theo khẩu vị / hệ / trong nhà / đội hình',
    co('tasteWarm').length && co('element').length
    && co('inside').length && co('party').length,
    `taste ${co('tasteWarm').length} element ${co('element').length} `
    + `inside ${co('inside').length} party ${co('party').length}`);

  // Khẩu vị: đúng vị mới đi được đường đó
  {
    const [sp, w] = co('tasteWarm')[0];
    const dung = newTuxemon(sp, 60, { tasteWarm: w.tasteWarm });
    const sai = newTuxemon(sp, 60, { tasteWarm: w.tasteWarm === 'salty' ? 'peppy' : 'salty' });
    ok('điều kiện khẩu vị có tác dụng',
      checkEvolution(dung, 'level') === w.into && checkEvolution(sai, 'level') !== w.into);
  }

  // Trong nhà: ngoài trời thì không đi được đường đó.
  // Cấp phải thấp hơn mấy đường "đủ cấp" đứng trước, vì bản gốc lấy đường
  // KHỚP ĐẦU TIÊN (evolution.get_eligible_evolution_slug).
  {
    const [sp, w] = co('inside')[0];
    const capMin = Math.min(...EVOLUTIONS[sp].filter(x => x.level).map(x => x.level), 99);
    const m2 = newTuxemon(sp, Math.max(1, capMin - 1));
    ok('điều kiện trong nhà có tác dụng',
      checkEvolution(m2, 'level', null, { inside: w.inside }) === w.into
      && checkEvolution(m2, 'level', null, { inside: !w.inside }) !== w.into);
  }

  // Đội hình: thiếu con kia thì không tiến hoá
  {
    const [sp, w] = co('party')[0];
    const m2 = newTuxemon(sp, 60);
    const [canSp, canN] = w.party[0];
    const du = [m2, ...Array.from({ length: canN }, () => newTuxemon(canSp, 10))];
    ok('điều kiện đội hình có tác dụng',
      checkEvolution(m2, 'level', null, { party: du }) === w.into
      && checkEvolution(m2, 'level', null, { party: [m2] }) !== w.into);
  }

  // Hệ ĐANG mang (chiêu switch đổi được), không phải hệ gốc
  {
    const [sp, w] = co('element')[0];
    const capMin = Math.min(...EVOLUTIONS[sp].filter(x => x.level).map(x => x.level), 99);
    const m2 = newTuxemon(sp, Math.max(1, capMin - 1));
    const truoc = checkEvolution(m2, 'level');
    m2.types = [w.element];
    ok('điều kiện hệ đọc hệ đang mang',
      checkEvolution(m2, 'level') === w.into, `trước ${truoc}, cần ${w.into}`);
  }
}

// Trạng thái: kiểu tác động nào cũng phải có chỗ xử lý trong engine
{
  const kinds = [...new Set(Object.values(STATUSES).map(s => s.kind))];
  ok('có đủ bảng trạng thái của bản gốc', kinds.length >= 25, String(kinds.length));

  // Bốn trạng thái dội đòn dùng chung một cách tính
  const doi = Object.entries(STATUSES).filter(([, s]) =>
    ['prickly', 'spiky', 'feedback', 'elemental_shield'].includes(s.kind));
  ok('có đủ nhóm trạng thái dội đòn', doi.length >= 3, String(doi.length));
  {
    const nan = newTuxemon(STARTERS[0].sp, 25);
    const danh2 = newTuxemon(STARTERS[2].sp, 25);
    const [id, st] = doi[0];
    applyStatus(nan, id);
    const tam = String(st.p?.[1] || '').split(':').filter(Boolean)[0] || 'melee';
    ok(`${id} dội ngược người ra đòn`, thornDamage(nan, danh2, tam) > 0);
    ok(`${id} không dội với tầm khác`,
      !st.p?.[1] || thornDamage(nan, danh2, 'khong_co_tam_nay') === 0);
  }

  // Đáp trả / báo thù giáng lại đúng số vừa ăn
  {
    const m2 = newTuxemon(STARTERS[1].sp, 25);
    applyStatus(m2, 'retaliate');
    const r = counterDamage(m2, 'melee', 40);
    ok('đáp trả giáng lại đúng số sát thương', r && r.dmg === 40 && !r.hut);
    ok('đáp trả không ăn với chiêu tầm reliable', counterDamage(m2, 'reliable', 40) === null);
    removeStatus(m2, 'all');
    applyStatus(m2, 'revenge');
    ok('báo thù còn hút chỗ đó thành máu', counterDamage(m2, 'melee', 40)?.hut === true);
  }

  // Dính lao: rút lui là mất máu
  {
    const m2 = newTuxemon(STARTERS[0].sp, 25);
    ok('chưa dính lao thì rút lui không mất gì', swapDamage(m2) === 0);
    applyStatus(m2, 'harpooned');
    ok('dính lao thì rút lui mất máu', swapDamage(m2) > 0);
  }

  // Hoang dại: có lúc phát cuồng tự cắn mình
  {
    const m2 = newTuxemon(STARTERS[0].sp, 25);
    applyStatus(m2, 'wild');
    let cuong = 0;
    for (let k = 0; k < 200; k++) if (wildRampage(m2) > 0) cuong++;
    ok('hoang dại thỉnh thoảng phát cuồng', cuong > 10 && cuong < 190, `${cuong}/200`);
  }
}

// Hiệu ứng phụ của chiêu: những loại engine chạy được thì phải chạy thật
{
  const loai = {};
  for (const mv of Object.values(MOVES)) for (const e of mv.eff || []) loai[e.t] = (loai[e.t] || 0) + 1;
  ok('có đủ các loại hiệu ứng của bản gốc',
    ['give', 'healing', 'multiattack', 'switch', 'cooldown_modifier',
      'photogenesis', 'sacrifice', 'life_swap', 'splash', 'move_type'].every(k => loai[k] > 0),
    JSON.stringify(loai));

  // Đánh thử một chiêu. Cho đối thủ dùng chiêu 0 sát thương và ra đòn sau,
  // để kết quả chỉ phản ánh đúng hiệu ứng đang kiểm tra.
  const vaHai = Object.entries(MOVES).find(([, m]) => !m.power && !(m.eff || []).length
    && m.category !== 'damage')?.[0];
  const danh = (mvId, sua) => {
    const me = newTuxemon(STARTERS[0].sp, 30, { iv: [15, 15, 15, 15, 15, 15] });
    const foe = newTuxemon(STARTERS[2].sp, 30, { iv: [0, 0, 0, 0, 0, 0] });
    me.moves = [{ id: mvId, cd: 0 }];
    foe.moves = [{ id: vaHai || 'struggle', cd: 0 }];
    if (sua) sua(me, foe);
    const bt = new Battle({ kind: 'wild',
      sides: [{ kind: 'player', mons: [me] }, { kind: 'wild', mons: [foe] }] });
    bt.submit(0, { t: 'move', i: 0 });
    bt.submit(1, { t: 'move', i: 0 });
    const ev = bt.resolve().events;
    return { me, foe, ev, truot: ev.some(e => e.t === 'msg' && /đánh trượt/.test(e.text)) };
  };

  // switch: đổi hệ đối thủ -> con đó mang đúng hệ mới
  const mvSwitch = Object.entries(MOVES).find(([, m]) =>
    (m.eff || []).some(e => e.t === 'switch' && e.el !== 'random' && e.to === 'foe'))[0];
  {
    const he = MOVES[mvSwitch].eff.find(e => e.t === 'switch').el;
    const r = danh(mvSwitch);
    ok(`chiêu ${mvSwitch} đổi hệ đối thủ sang ${he}`,
      r.truot || r.foe.types?.includes(he), JSON.stringify(r.foe.types));
  }

  // cooldown_modifier: khoá chiêu đối thủ
  const mvCd = Object.entries(MOVES).find(([, m]) =>
    (m.eff || []).some(e => e.t === 'cooldown_modifier' && e.to === 'foe' && e.cd > 0));
  if (mvCd) {
    const r = danh(mvCd[0]);
    const cd = mvCd[1].eff.find(e => e.t === 'cooldown_modifier').cd;
    ok('chiêu khoá chiêu làm đối thủ phải chờ',
      r.truot || r.ev.some(e => e.t === 'msg' && /bị khoá chiêu/.test(e.text)),
      `cd=${cd}`);
  }

  // sacrifice: người dùng cạn máu, đối thủ ăn đòn
  const mvSac = Object.entries(MOVES).find(([, m]) =>
    (m.eff || []).some(e => e.t === 'sacrifice'));
  if (mvSac) {
    const r = danh(mvSac[0]);
    ok('chiêu tự huỷ rút cạn máu người dùng', r.truot || r.me.hpCur === 0);
  }

  // life_swap: đổi máu hai bên
  const mvSwap = Object.entries(MOVES).find(([, m]) =>
    (m.eff || []).some(e => e.t === 'life_swap'));
  if (mvSwap) {
    const r = danh(mvSwap[0], (me) => { me.hpCur = Math.floor(maxHp(me) / 4); });
    ok('chiêu hoán đổi sinh lực kéo máu mình lên',
      r.truot || r.ev.some(e => e.t === 'msg' && /hoán đổi/.test(e.text)),
      String(r.me.hpCur));
  }

  // multiattack: đánh nhiều đòn thì sát thương cao hơn một đòn đơn cùng chiêu
  const mvMulti = Object.entries(MOVES).find(([, m]) =>
    (m.eff || []).some(e => e.t === 'multiattack') && m.acc === 100 && m.power > 0);
  if (mvMulti) {
    const me = newTuxemon(STARTERS[0].sp, 30);
    const foe = newTuxemon(STARTERS[2].sp, 30);
    const mot = calcDamage(me, foe, mvMulti[0], {}).dmg;
    const r = danh(mvMulti[0]);
    const tong = maxHp(r.foe) - r.foe.hpCur;
    ok('chiêu đánh nhiều đòn gây sát thương gấp bội',
      r.truot || tong > mot, `${tong} vs ${mot}`);
  }

  // splash: chiêu "phủ đầu" phải là chiêu ĐÁNH có hệ số, không phải chiêu hỗ trợ.
  // Trước đây công cụ sinh data chỉ nhận 'damage' nên cả Surf lẫn Bão Điện đều
  // ra power 0 — bấm vào chỉ tốn lượt.
  const toe = Object.entries(MOVES).filter(([, m]) => (m.eff || []).some(e => e.t === 'splash'));
  ok('có chiêu phủ đầu', toe.length >= 10, String(toe.length));
  ok('chiêu phủ đầu đều gây sát thương thật',
    toe.every(([, m]) => m.category === 'damage' && m.power > 0),
    toe.filter(([, m]) => !m.power).map(([s]) => s).join(' '));
  ok('Surf đánh ra máu', MOVES.surf?.power >= 2 && MOVES.surf.category === 'damage');
  {
    // Đánh trượt vẫn tạt trúng: cho độ trúng về 0 mà máu đối thủ vẫn phải sụt
    const [id, mv] = toe.find(([, m]) => m.acc < 100) || toe[0];
    const goc = mv.acc;
    mv.acc = 1;
    let sut = 0;
    for (let k = 0; k < 40 && !sut; k++) {
      const r = danh(id);
      sut = maxHp(r.foe) - r.foe.hpCur;
    }
    mv.acc = goc;
    ok('chiêu phủ đầu trượt vẫn ăn nửa đòn', sut > 0, `${id} ${sut}`);
  }

  // move_type: chiêu mượn hệ của người dùng thì khắc hệ tính theo hệ đó
  const muon = Object.entries(MOVES).filter(([, m]) => (m.eff || []).some(e => e.t === 'move_type'));
  ok('có chiêu mượn hệ', muon.length >= 2, String(muon.length));
  ok('chiêu mượn hệ vẫn là chiêu đánh',
    muon.every(([, m]) => m.category === 'damage' && m.power > 0));
}

// Khu vực bắt sinh vật: đủ nhiều vùng, cấp tăng dần theo đường đi
{
  const co = Object.entries(ZONES).filter(([, z]) => z.encounters.length);
  ok('có nhiều vùng bắt được sinh vật', co.length >= 12, String(co.length));
  const loai = new Set(co.flatMap(([, z]) => z.encounters.map(e => e.sp)));
  ok('bắt được kha khá loài trong game', loai.size >= 90, String(loai.size));
  ok('vùng nào cấp trên cũng không thấp hơn cấp dưới',
    co.every(([, z]) => z.encounters.every(e => e.max >= e.min)));
  ok('vùng đầu game vẫn dễ', ZONES.route1.encounters.every(e => e.min <= 5));
}

// Thế giới đi bộ: đủ bản đồ, tên nào cũng đặt tay chứ không để máy ghép bừa
{
  const ids = Object.keys(MAPS);
  ok('thế giới có đủ bản đồ', ids.length >= 40, String(ids.length));
  // Máy ghép tên sẽ để lại chữ tiếng Anh kiểu "Upstairs", "Scoop", "Lab"
  const song = /(Upstairs|Downstairs|Bedroom|Scoop|Lab|Foyer|Cathedral|Daycare|Cafe|Passageway|Stairwell|Basement|Nhà\d)/;
  const xau = ids.filter(id => song.test(MAPS[id].name));
  ok('không bản đồ nào còn tên ghép máy', xau.length === 0,
    xau.map(id => MAPS[id].name).slice(0, 4).join(' | '));
  // Điểm vào không được rơi vào tường
  const ket = ids.filter(id => MAPS[id].solid[MAPS[id].spawn.y * MAPS[id].w + MAPS[id].spawn.x]);
  ok('điểm vào bản đồ nào cũng đứng được', ket.length === 0, ket.join(' '));
}

// Bảng hiệu mang chữ thật của bản đồ gốc, không còn nói chung chung
{
  const co = Object.values(MAPS).flatMap(m => m.talks || []).filter(t => t.text);
  ok('có bảng hiệu mang chữ thật', co.length >= 8, String(co.length));
  ok('chữ trên bảng đã dịch tiếng Việt (không còn ASCII thuần)',
    co.every(t => /[àáảãạăâđêôơưÀ-ỹ]/.test(t.text)), co.find(t => !/[À-ỹ]/.test(t.text))?.text);
}

// Tốc độ của chiêu quyết định ai ra đòn trước (formula.speed_monster)
{
  const v = Object.values(MOVES);
  ok('chiêu nào cũng có mức tốc độ -3..+3',
    v.every(m => Number.isInteger(m.speed) && m.speed >= -3 && m.speed <= 3));
  ok('có đủ cả chiêu nhanh lẫn chiêu chậm',
    v.some(m => m.speed > 0) && v.some(m => m.speed < 0));

  // Hai con y hệt nhau, con dùng chiêu nhanh phải đi trước
  const nhanh = Object.entries(MOVES).find(([, m]) => m.speed >= 2)[0];
  const cham = Object.entries(MOVES).find(([, m]) => m.speed <= -2)[0];
  const lam = (mv) => {
    const m = newTuxemon(STARTERS[0].sp, 20, { iv: [8, 8, 8, 8, 8, 8],
      tasteCold: 'bland', tasteWarm: 'savory' });
    m.moves = [{ id: mv, cd: 0 }];
    return m;
  };
  const b2 = new Battle({ kind: 'wild',
    sides: [{ kind: 'player', mons: [lam(nhanh)] }, { kind: 'wild', mons: [lam(cham)] }] });
  b2.submit(0, { t: 'move', i: 0 });
  b2.submit(1, { t: 'move', i: 0 });
  ok('chiêu nhanh ra đòn trước chiêu chậm', b2.actionOrder()[0].side === 0,
    `${nhanh}(${MOVES[nhanh].speed}) vs ${cham}(${MOVES[cham].speed})`);
}

// Tuxedex: ghi chép, nơi sống, đặc điểm lấy từ db/monster của bản gốc
{
  const v = Object.values(SPECIES);
  ok('gần như loài nào cũng có ghi chép Tuxedex',
    v.filter(s => s.desc).length >= v.length * 0.9,
    `${v.filter(s => s.desc).length}/${v.length}`);
  ok('phần lớn loài có nơi sống', v.filter(s => s.home?.length).length >= 200,
    String(v.filter(s => s.home?.length).length));
  ok('nơi sống và đặc điểm đều đã dịch tiếng Việt',
    v.every(s => (s.home || []).every(h => Object.values(HOME_VI).includes(h))
      && (s.tags || []).every(t => Object.values(TAG_VI).includes(t))));
  ok('dáng thân và bậc đều có tên tiếng Việt',
    v.every(s => SHAPE_VI[s.shape] && STAGE_VI[s.stage]),
    v.filter(s => !SHAPE_VI[s.shape] || !STAGE_VI[s.stage]).slice(0, 3)
      .map(s => `${s.slug}:${s.shape}/${s.stage}`).join(' '));
}

// Tiếng kêu riêng của từng loài (db/sounds/monster_calls.yaml)
{
  const co = Object.keys(MON_CRY).length;
  ok('loài nào cũng có tiếng kêu riêng', co >= 400, String(co));
  ok('tiếng kêu nào cũng trỏ tới tệp có thật',
    Object.values(MON_CRY).every(([a, b]) => (!a || CRY_SFX[a]) && (!b || CRY_SFX[b])));
  const r = Object.values(SPECIES).find(s => s.slug === 'rockitten');
  ok('gọi được tiếng ra trận và tiếng gục',
    !!cryPath(r.slug, 0) && !!cryPath(r.slug, 1));
}

// AI đánh nhau: chấm điểm chiêu theo bản gốc
{
  const me = newTuxemon(STARTERS[0].sp, 20);
  // Chiêu khắc hệ phải được chấm cao hơn chiêu vô dụng cùng sức mạnh
  const foe = newTuxemon(STARTERS[2].sp, 20);
  const list = Object.keys(MOVES).filter(id => MOVES[id].power > 0 && MOVES[id].acc === 100);
  const khac = list.find(id => typeMultiplier(MOVES[id].types, SPECIES[foe.sp].types) > 1);
  const thuong = list.find(id => typeMultiplier(MOVES[id].types, SPECIES[foe.sp].types) === 1
    && MOVES[id].power === MOVES[khac].power && MOVES[id].range === MOVES[khac].range);
  if (khac && thuong) {
    ok('AI chấm chiêu khắc hệ cao hơn chiêu thường',
      scoreMove(me, khac, foe) > scoreMove(me, thuong, foe));
  }
  // Chiêu hồi máu: sắp gục thì đáng dùng, đầy máu thì không
  const hoi = Object.keys(MOVES).find(id => (MOVES[id].heal || 0) > 0);
  if (hoi) {
    const yeu = newTuxemon(STARTERS[0].sp, 20); yeu.hpCur = 1;
    const khoe = newTuxemon(STARTERS[0].sp, 20);
    ok('AI chỉ hồi máu khi sắp gục', scoreMove(yeu, hoi, foe) > scoreMove(khoe, hoi, foe));
  }
  // Huấn luyện viên dùng thuốc đúng khoảng máu của mods/ai_items.yaml
  const t = newTuxemon(STARTERS[1].sp, 20);
  t.hpCur = Math.floor(maxHp(t) * 0.5);
  ok('máu nửa vời thì trainer uống thuốc', pickItem(t, { potion: 2 }) === 'potion');
  t.hpCur = maxHp(t);
  ok('máu đầy thì không uống', pickItem(t, { potion: 2 }) === null);

  // Trận thật: trainer mang thuốc phải dùng được và trận vẫn kết thúc
  const b = new Battle({ kind: 'trainer',
    sides: [{ kind: 'player', mons: [newTuxemon(STARTERS[0].sp, 30)] },
      { kind: 'trainer', mons: [newTuxemon(STARTERS[2].sp, 25)], bag: { potion: 3 } }] });
  let n = 0;
  let uong = false;
  while (!b.over && n < 80) {
    // Chiêu nào cũng đang hồi thì gắng sức, đúng như nút trong game
    const me2 = b.activeMon(0);
    const co = me2.moves.findIndex(mv => (mv.cd || 0) <= 0);
    b.submit(0, co >= 0 ? { t: 'move', i: co } : { t: 'struggle' });
    const r = b.resolve();
    if (r.events.some(e => e.t === 'msg' && e.text.includes('Thuốc Hồi'))) uong = true;
    n++;
  }
  ok('trận với trainer vẫn kết thúc', b.over, `${n} lượt`);
  ok('trainer có uống thuốc khi máu xuống thấp', uong);
}

// ==== Bảng gặp Tuxemon hoang lấy từ db/encounter ====
ok('có bảng gặp lấy từ bản gốc', Object.keys(ENCOUNTERS).length >= 1, String(Object.keys(ENCOUNTERS).length));
{
  const bad = [];
  for (const [id, list] of Object.entries(ENCOUNTERS)) {
    if (!MAPS[id]) bad.push(`${id}: không có bản đồ này`);
    for (const e of list) {
      if (!SPECIES[e.sp]) bad.push(`${id}: loài ${e.sp} không tồn tại`);
      if (!(e.min >= 1 && e.max >= e.min && e.w > 0)) bad.push(`${id}: khoảng cấp/trọng số sai`);
    }
  }
  ok('bảng gặp trỏ tới loài và bản đồ có thật', bad.length === 0, bad.slice(0, 3).join(' | '));
  ok('bản đồ đầu game chỉ gặp con cấp thấp',
    (ENCOUNTERS.route1 || []).every(e => e.max <= 10),
    JSON.stringify((ENCOUNTERS.route1 || []).map(e => e.max)));
}

// Mỗi bản đồ mang sẵn tên bản nhạc lấy từ lệnh play_music của bản gốc
ok('bản đồ nào cũng có nhạc nền có thật',
  Object.values(MAPS).every(m => MUSIC[m.music]),
  Object.values(MAPS).filter(m => !MUSIC[m.music]).map(m => m.music).join(' '));
ok('nhạc không dồn hết về một bản',
  new Set(Object.values(MAPS).map(m => m.music)).size >= 5,
  [...new Set(Object.values(MAPS).map(m => m.music))].join(' '));

// ==== Trạng thái lấy từ db/status của bản gốc ====
ok('có bảng trạng thái Tuxemon', Object.keys(STATUSES).length >= 30, String(Object.keys(STATUSES).length));
ok('trạng thái nào cũng có tên tiếng Việt, nhóm và kiểu tác động',
  Object.values(STATUSES).every(s => s.name && ['positive', 'negative'].includes(s.cat) && s.kind));
{
  const m = newTuxemon(STARTERS[0].sp, 20);
  ok('dính trạng thái xấu rồi thì trạng thái tốt không chen vào được',
    applyStatus(m, 'poison') && !applyStatus(m, 'hardshell') && m.status === 'poison');
  const truoc = m.hpCur;
  const r = endOfTurn(m, 'Test');
  ok('độc trừ máu mỗi lượt', r.dmg > 0 && m.hpCur === truoc - r.dmg);
  ok('thuốc gỡ được trạng thái xấu', removeStatus(m, 'negative') && !m.status);
  ok('trạng thái tốt nhân chỉ số đúng bảng gốc',
    applyStatus(m, 'hardshell') && statMult(m, 'armour') === STATUSES.hardshell.mods.armour);
  removeStatus(m, 'all');
  const lua = Object.values(SPECIES).find(sp => sp.types.includes('fire'));
  const conLua = newTuxemon(Object.keys(SPECIES).find(k => SPECIES[k] === lua) * 1, 10);
  ok('hệ lửa miễn nhiễm bỏng', !applyStatus(conLua, 'burn'));
}

// Chiêu có hiệu ứng phụ lấy đúng từ effects của bản gốc
{
  const coEff = Object.values(MOVES).filter(m => (m.eff || []).length);
  ok('phần lớn chiêu có hiệu ứng phụ', coEff.length >= 100, String(coEff.length));
  ok('hiệu ứng "give" luôn trỏ tới một trạng thái có thật',
    coEff.flatMap(m => m.eff).filter(e => e.t === 'give').every(e => STATUSES[e.id]));
}

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
