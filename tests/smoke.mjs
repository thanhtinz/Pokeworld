// TuxeWorld H5 | tests/smoke.mjs | Smoke test chạy bằng node (không cần trình duyệt)
// Kiểm tra data + engine: import sạch, số liệu khớp chéo, battle chạy trọn trận.
// Test này CHẶN DEPLOY: hỏng là GitHub Actions không đẩy được bản mới lên web.
// engine/overworld.js kéo theo mapbake.js, mà mapbake dựng đối tượng Image để
// vẽ. Node không có Image — cắm một cái giả vào cho import chạy trót lọt; test
// này chỉ đụng tới bảng va chạm chứ không vẽ gì.
globalThis.Image = class { constructor() { this.complete = false; this.naturalWidth = 0; } };

// engine/accounts.js lưu vào localStorage. Node không có — cắm bản giả bằng Map
// để chạy được đường save -> load -> vá bản lưu cũ.
{
  const kho = new Map();
  globalThis.localStorage = {
    getItem: (k) => (kho.has(k) ? kho.get(k) : null),
    setItem: (k, v) => kho.set(k, String(v)),
    removeItem: (k) => kho.delete(k),
    clear: () => kho.clear(),
  };
}

import { SPECIES, speciesBySlug } from '../js/data/species.js';
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
import { newTuxemon, stats, maxHp, STAT_KEYS, heal, typesOf, isFainted } from '../js/engine/monster.js';
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
import { FISHING } from '../js/data/fishing.js';
import { fish, catchable } from '../js/engine/fishing.js';
import { TECH_SFX } from '../js/data/sounds.js';
import { fxFor } from '../js/data/vfx.js';
import { applyStatus, removeStatus, endOfTurn, statMult, thornDamage,
  counterDamage, swapDamage, wildRampage, condBlocked, condTag, canAct } from '../js/engine/status.js';
import { G, newGame } from '../js/state.js';
import { monLevelCap, MAX_TRAINER_LEVEL, trainerExpFor, addTrainerExp,
  trainerLevelFor } from '../js/engine/player.js';
import { FEATURES, isUnlocked, unlockedBetween } from '../js/engine/unlock.js';
import { ACHIEVEMENTS, ACH_BY_ID } from '../js/data/achievements.js';
import * as P from '../js/engine/park.js';
import * as DC from '../js/engine/daycare.js';
import * as ES from '../js/engine/estate.js';
import * as CR from '../js/engine/craft.js';
import { FURNITURE, HOUSE_BASES } from '../js/data/estate.js';
import { bangThanhTuu, nhanThuong, nhanHet, choNhan } from '../js/engine/achievements.js';

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

// NPC PHẢI ĐI ĐƯỢC THẬT. Bản trước đặt hai luật tự nghĩ ra trong npcCanWalk —
// cấm bước lên ô có ít hơn ba lối ra, và cấm đứng cách NPC khác một ô — kết quả
// là NPC trong nhà và trong hẻm đứng chôn chân, còn NPC ngoài trời dồn hết về
// mấy khoảng đất trống. Test này chạy thẳng vòng lặp thật của game.
{
  const { player, updateNpcs } = await import('../js/engine/overworld.js');
  const dungYen = [];
  let dong = 0, tong = 0;
  for (const [id, mp] of Object.entries(MAPS)) {
    const diDuoc = (mp.npcs || []).filter(n => n.ai === 'wander' || n.ai === 'patrol');
    if (!diDuoc.length) continue;
    player.mapId = id;
    player.x = -50; player.y = -50;              // đẩy người chơi ra xa
    for (const n of mp.npcs) delete n.home;
    const goc = new Map(diDuoc.map(n => [n, `${n.x},${n.y}`]));
    const daDi = new Set();
    for (let i = 0; i < 60 * 60; i++) {          // 60 giây
      updateNpcs(1 / 60);
      for (const n of diDuoc) if (`${n.x},${n.y}` !== goc.get(n)) daDi.add(n);
    }
    tong += diDuoc.length;
    dong += daDi.size;
    for (const n of diDuoc) if (!daDi.has(n)) dungYen.push(`${id}:${n.sprite}@${goc.get(n)}`);
  }
  ok('NPC kiểu đi lại thì đi được thật', dong === tong,
    `${dong}/${tong} · kẹt: ${dungYen.slice(0, 5).join(' ')}`);

  // Đang bị nhìn thẳng mặt thì đứng yên, không thì lát sau bấm nói chuyện hụt
  const mp = MAPS.taba_town;
  const ai = (mp.npcs || []).find(n => n.ai === 'wander');
  player.mapId = 'taba_town';
  for (const n of mp.npcs) delete n.home;
  player.x = ai.x + 0.5; player.y = ai.y - 1 + 0.5; player.dir = 'down';
  const cho = `${ai.x},${ai.y}`;
  for (let i = 0; i < 60 * 10; i++) updateNpcs(1 / 60);
  ok('NPC đang bị nhìn thẳng thì đứng yên cho bấm nói chuyện',
    `${ai.x},${ai.y}` === cho, `${cho} -> ${ai.x},${ai.y}`);
}

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
// Máy chưa nối server thì chưa có món nào ngoài ô "không mặc gì" — đó chính là
// lúc giao diện phải bày khung "— trống —" thay vì một thẻ to ghi chữ "Trống".
ok('mới cài đặt thì loại nào cũng rỗng',
  ALL_KINDS.every(k => Object.keys(k.data).filter(id => id !== NONE_ID[k.id]).length === 0),
  ALL_KINDS.map(k => `${k.id}:${Object.keys(k.data).length}`).join(' '));

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
  ok('không có đòn chí mạng',
    calcDamage(att, def, entry ? entry[0] : 'ram', {}).crit === undefined);
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
    checkEvolution(m, 'item', w.item[0]) === w.into && checkEvolution(m, 'item', 'potion') !== w.into);
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
  // Đồ mang theo không "dùng" mà cho Tuxemon cầm, nên không có eff/inBattle.
  // Bóng Công Viên cũng ngoại lệ: bản gốc để usable_in: [MainParkMenuState] và
  // hiệu ứng 'park capture' — nó chỉ ném được trong màn Công Viên, không phải
  // trong trận, nên không có eff/inBattle/inWorld như đồ thường.
  // Nguyên liệu chế tạo cũng ngoại lệ: bản gốc để category 'none', không hiệu
  // ứng gì — nó chỉ tồn tại để đem đi làm món (mods/recipes.yaml).
  const dung = it.filter(([, x]) => !x.held && !['badge', 'park', 'lieu'].includes(x.kind));
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

  // Đĩa chiêu (TM) / đĩa hệ (MM) / quả đổi hệ — vật phẩm bản gốc, mới nối vào
  {
    const tm = Object.entries(ITEMS).filter(([, x]) => x.eff.some(e => e.t === 'learnMove'));
    ok('có đĩa chiêu', tm.length >= 10, String(tm.length));
    ok('đĩa chiêu nào cũng dạy chiêu game đang có',
      tm.every(([, x]) => x.eff.every(e => e.t !== 'learnMove' || MOVES[e.id])),
      tm.filter(([, x]) => x.eff.some(e => e.t === 'learnMove' && !MOVES[e.id]))
        .map(([s]) => s).join(' '));

    const [tmId, tmIt] = tm[0];
    const mvId = tmIt.eff.find(e => e.t === 'learnMove').id;
    const hoc = newTuxemon(STARTERS[0].sp, 20);
    hoc.moves = [{ id: 'canine', cd: 0 }];
    ok('chưa biết chiêu thì dùng được đĩa', canUse(tmId, hoc, { inBattle: false }));
    const r = useItem(tmId, hoc, { inBattle: false });
    ok('đĩa chiêu trả về chiêu cần học', r.learn === mvId, String(r.learn));
    hoc.moves.push({ id: mvId, cd: 0 });
    ok('biết rồi thì không dùng lại được', !canUse(tmId, hoc, { inBattle: false }));

    // Đĩa hệ: chỉ dùng cho con đúng hệ, và bốc chiêu đúng hệ đó
    const mm = Object.entries(ITEMS).find(([, x]) => x.eff.some(e => e.t === 'learnRandom'));
    ok('có đĩa hệ', !!mm);
    if (mm) {
      const el = mm[1].eff.find(e => e.t === 'learnRandom').el;
      const dung = newTuxemon(Object.entries(SPECIES).find(([, s]) => s.types.includes(el))[0], 20);
      const sai = newTuxemon(Object.entries(SPECIES).find(([, s]) => !s.types.includes(el))[0], 20);
      ok('đĩa hệ chỉ dùng cho con đúng hệ',
        canUse(mm[0], dung, { inBattle: false }) && !canUse(mm[0], sai, { inBattle: false }));
      const r2 = useItem(mm[0], dung, { inBattle: false });
      ok('đĩa hệ bốc ra chiêu đúng hệ',
        !!r2.learn && MOVES[r2.learn].types.includes(el) && !MOVES[r2.learn].res,
        String(r2.learn));
    }

    // Quả đổi hệ: đổi hẳn hệ, và không dùng được cho con vốn đã mang hệ đó
    const qua = Object.entries(ITEMS).filter(([, x]) => x.eff.some(e => e.t === 'switchType'));
    ok('có đủ quả đổi hệ cho 13 hệ', qua.length >= 13, String(qua.length));
    const el2 = qua[0][1].eff.find(e => e.t === 'switchType').el;
    const doi = newTuxemon(Object.entries(SPECIES).find(([, s]) => !s.types.includes(el2))[0], 20);
    useItem(qua[0][0], doi, { inBattle: true });
    ok('quả đổi hệ đổi được hệ', typesOf(doi).join() === el2, typesOf(doi).join());
    ok('con đã mang hệ đó thì quả vô dụng', !canUse(qua[0][0], doi, { inBattle: true }));
    ok('quả đổi hệ chỉ dùng trong trận', qua.every(([, x]) => x.inBattle && !x.inWorld));
  }

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

  // itemIcon('x') mà x không có trong bảng vật phẩm thì hàm trả về chuỗi rỗng —
  // không lỗi, không 404, chỉ là chỗ đó trống trơn và chẳng ai phát hiện. Giao
  // diện từng gọi hai mã vật phẩm chìa khoá của game khác (fame_checker,
  // vs_recorder) suốt một thời gian dài đúng vì thế.
  const lac = [];
  const doIcon = (thuMuc) => {
    for (const f of readdirSync(join(goc, thuMuc), { withFileTypes: true })) {
      const p2 = join(thuMuc, f.name);
      if (f.isDirectory()) { doIcon(p2); continue; }
      if (!f.name.endsWith('.js')) continue;
      const src = readFileSync(join(goc, p2), 'utf8');
      for (const m of src.matchAll(/itemIcon\(\s*['"]([a-z_0-9]+)['"]/g)) {
        if (!ITEMS[m[1]]) lac.push(`${p2}: ${m[1]}`);
        else if (!existsSync(join(goc, `assets/items/${m[1]}.png`))) lac.push(`${p2}: thiếu ảnh ${m[1]}`);
      }
    }
  };
  doIcon('js');
  ok('mã vật phẩm giao diện gọi tới đều có thật', lac.length === 0, lac.join(' | '));
}

// Hoa văn hiếm: Tuxemon không có shiny, chỉ có db/flair
{
  const goc2 = new URL('..', import.meta.url).pathname;
  const m = newTuxemon(STARTERS[0].sp, 5, { flair: 'stars' });
  ok('con hiếm mang hoa văn stars', m.flair === 'stars' && m.shiny === undefined);
  ok('con thường không có hoa văn', newTuxemon(STARTERS[0].sp, 5, { flair: null }).flair === null);
  ok('có ảnh hoa văn của bản gốc', existsSync(join(goc2, 'assets/ui/flair/stars.png')));
}

// Bản lưu đời cũ mở lên phải tự đổi sang mã mới, không mất tiến trình
{
  const { register } = await import('../js/engine/accounts.js');
  const { load, save } = await import('../js/state.js');
  await register('tester_va', '123456');
  newGame('Tester');
  G.p.badges = ['badge_boulder', 'badge_cascade'];
  G.p.defeatedTrainers = { gym_brock: true };
  G.p.party = [{ ...newTuxemon(STARTERS[0].sp, 10), shiny: true, flair: undefined }];
  save();
  G.p = null;
  ok('nạp lại được bản lưu', load() === true);
  ok('huy hiệu cũ đổi sang bộ của Tuxemon',
    G.p.badges.join() === 'shaft_badge,scoop_badge', G.p.badges.join());
  ok('mã huấn luyện viên cũ vẫn tính là đã thắng', G.p.defeatedTrainers.vo_duong_dat === true);
  ok('cờ shiny cũ đổi thành hoa văn stars',
    G.p.party[0].flair === 'stars' && G.p.party[0].shiny === undefined);
  // Con vô tính trong bản lưu cũ bị ghi nhầm là cái -> nạp lại phải sửa lại
  {
    const voTinh = Object.entries(SPECIES).find(([, x]) => x.gender.n === 1)[0];
    const con = newTuxemon(voTinh, 10);
    con.gender = 'f';
    G.p.party = [con];
    save();
    G.p = null; load();
    ok('giới tính sai trong bản lưu cũ được sửa lại', G.p.party[0].gender === 'n',
      G.p.party[0].gender);
  }
}

// Huy hiệu: dùng đúng bộ của Tuxemon, không phải huy hiệu vùng Kanto
{
  const hh = Object.entries(ITEMS).filter(([, x]) => x.kind === 'badge');
  ok('có bộ huy hiệu của Tuxemon', hh.length === 5, String(hh.length));
  ok('huy hiệu không bán, không dùng được',
    hh.every(([, x]) => !x.price && !x.inBattle && !x.inWorld));
  const gym = Object.values(TRAINERS).filter(t => t.badge);
  ok('võ đường nào cũng trao huy hiệu có thật trong bảng',
    gym.length > 0 && gym.every(t => ITEMS[t.badge]?.kind === 'badge'),
    gym.map(t => t.badge).join(' '));
  const kanto = /badge_(boulder|cascade|thunder|rainbow|soul|marsh|volcano|earth)/;
  const dinh = [...Object.keys(ITEMS), ...gym.map(t => t.badge)].filter(x => kanto.test(x));
  ok('không còn huy hiệu đặt tên theo game khác', dinh.length === 0, dinh.join(' '));
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

  // Giới tính bốc theo bảng trọng số của bản gốc. Trước đây công cụ sinh data
// quy gender_weights về một con số "tỉ lệ đực" lấy từ khoá 'male' với mặc định
// 0.5 — mà 116 loài ghi {neuter: 1.0} và 3 loài ghi {female: 1.0} đều không có
// khoá đó, nên cả 119 loài thành 50/50: Tuxeball Vô Tính vô dụng và đường tiến
// hoá theo giới tính không bao giờ bắt được.
{
  const nhom = { m: 0, f: 0, n: 0 };
  for (const sp of Object.values(SPECIES)) {
    const ds = Object.keys(sp.gender || {});
    if (ds.length === 1) nhom[ds[0]] += 1;
  }
  ok('có loài vô tính', nhom.n >= 100, JSON.stringify(nhom));
  ok('có loài chỉ một giống', nhom.m > 0 && nhom.f > 0, JSON.stringify(nhom));
  ok('bảng giới tính nào cũng có trọng số dương',
    Object.values(SPECIES).every(sp => Object.keys(sp.gender || {}).length
      && Object.values(sp.gender).every(w => w > 0)));

  const voTinh = Object.entries(SPECIES).find(([, x]) => x.gender.n === 1)[0];
  const doi = Object.entries(SPECIES).find(([, x]) => x.gender.m === 0.5)[0];
  const bocVoTinh = new Set();
  const bocDoi = new Set();
  for (let k = 0; k < 200; k++) {
    bocVoTinh.add(newTuxemon(voTinh, 5).gender);
    bocDoi.add(newTuxemon(doi, 5).gender);
  }
  ok('loài vô tính chỉ sinh ra con vô tính',
    bocVoTinh.size === 1 && bocVoTinh.has('n'), [...bocVoTinh].join());
  ok('loài 50/50 sinh ra cả đực lẫn cái',
    bocDoi.size === 2 && bocDoi.has('m') && bocDoi.has('f'), [...bocDoi].join());
}

// Trạng thái nhân sát thương theo hệ của con đang dính (modifiers bên bản gốc):
// bỏng thì hệ Lửa miễn nhiễm còn hệ Băng cháy gấp đôi. Trước đây chỉ đọc mỗi
// hệ số 0 để làm miễn nhiễm, hệ số 2 bị bỏ qua.
{
  ok('bỏng có bảng hệ số theo hệ',
    STATUSES.burn?.tmod?.frost === 2 && STATUSES.burn?.tmod?.fire === 0);
  const mot = (t) => {
    const id = Object.entries(SPECIES).find(([, x]) => x.types.length === 1 && x.types[0] === t
      && !x.glitched)?.[0];
    return id ? newTuxemon(id, 40) : null;
  };
  const bang = mot('frost'), thuong = mot('wood'), lua = mot('fire');
  for (const m of [bang, thuong, lua]) { if (m) { m.hpCur = maxHp(m); m.status = 'burn'; } }
  const dBang = endOfTurn(bang, 'X').dmg / maxHp(bang);
  const dThuong = endOfTurn(thuong, 'X').dmg / maxHp(thuong);
  ok('hệ Băng cháy gấp đôi', dBang > dThuong * 1.8, `${dBang.toFixed(3)} vs ${dThuong.toFixed(3)}`);
  const rLua = endOfTurn(lua, 'X');
  ok('hệ Lửa miễn nhiễm bỏng, trạng thái tan luôn',
    rLua.dmg === 0 && lua.status === null, String(rLua.dmg));
}

// Trạng thái nối máu hai con: hút máu chảy sang kẻ gây ra, ban sinh lực thì
// ngược lại. Trước đây chỉ trừ máu con dính mà không chuyển đi đâu cả.
{
  ok('có trạng thái nối máu',
    STATUSES.lifeleech?.link && STATUSES.lifegift?.link);
  const chay = (st) => {
    const me = newTuxemon(STARTERS[0].sp, 40);
    const foe = newTuxemon(STARTERS[2].sp, 40);
    me.moves = [{ id: vaHai || 'struggle', cd: 0 }];
    foe.moves = [{ id: vaHai || 'struggle', cd: 0 }];
    const b = new Battle({ kind: 'wild',
      sides: [{ kind: 'player', mons: [me] }, { kind: 'wild', mons: [foe] }] });
    me.hpCur = Math.floor(maxHp(me) / 2);
    foe.hpCur = Math.floor(maxHp(foe) / 2);
    applyStatus(foe, st);
    const a = [me.hpCur, foe.hpCur];
    b.submit(0, { t: 'move', i: 0 });
    b.resolve();
    return { ta: me.hpCur - a[0], dich: foe.hpCur - a[1] };
  };
  const hut = chay('lifeleech');
  ok('hút máu: địch mất, ta được', hut.ta > 0 && hut.dich < 0, JSON.stringify(hut));
  const ban = chay('lifegift');
  ok('ban sinh lực: ta mất, địch được', ban.ta < 0 && ban.dich > 0, JSON.stringify(ban));
  // Bên nối đã gục thì trạng thái tan
  const con = newTuxemon(STARTERS[0].sp, 20);
  applyStatus(con, 'lifeleech');
  endOfTurn(con, 'X', null);
  ok('không còn ai để nối thì trạng thái tan', con.status === null);
}

// Ngủ gật: ít nhất một lượt, tối đa dur lượt là chắc chắn tỉnh
{
  ok('ngủ gật có số lượt tối đa', STATUSES.noddingoff?.dur === 5);
  let daiNhat = 0;
  for (let k = 0; k < 300; k++) {
    const m = newTuxemon(STARTERS[0].sp, 20);
    applyStatus(m, 'noddingoff');
    let n = 0;
    while (n < 20) {
      const [duoc] = canAct(m, 'X');
      n += 1;
      if (duoc) break;
    }
    daiNhat = Math.max(daiNhat, n);
    ok.tmp = n;
  }
  ok('ngủ không bao giờ quá số lượt tối đa', daiNhat <= STATUSES.noddingoff.dur + 1,
    String(daiNhat));
  ok('ngủ luôn mất ít nhất một lượt', daiNhat >= 2, String(daiNhat));
}

// ==== Đồ rơi trên bản đồ (sự kiện add_item của bản gốc) ====
{
  const { player, update, enterMap, pickedUp } = await import('../js/engine/overworld.js');
  const roi = [];
  for (const [id, mp] of Object.entries(MAPS)) for (const it of mp.items || []) roi.push({ id, it });
  ok('có đồ rơi rải trên bản đồ', roi.length >= 3, String(roi.length));
  ok('món rơi nào cũng có thật trong bảng vật phẩm',
    roi.every(({ it }) => ITEMS[it.id]), roi.filter(({ it }) => !ITEMS[it.id]).map(x => x.it.id).join(' '));
  ok('số lượng rơi luôn dương', roi.every(({ it }) => (it.n || 1) > 0));
  ok('món rơi không nằm trong tường',
    roi.every(({ id, it }) => !MAPS[id].solid[it.y * MAPS[id].w + it.x]),
    roi.filter(({ id, it }) => MAPS[id].solid[it.y * MAPS[id].w + it.x]).map(x => x.id).join(' '));

  // Giẫm lên là nhặt, và chỉ nhặt được một lần
  const { id: mapId, it } = roi.find(({ id, it: x }) => MAPS[id].items.length && x.n >= 1);
  newGame('Thợ Nhặt');
  G.p.party = [newTuxemon(STARTERS[0].sp, 20)];
  enterMap(mapId, it.x, it.y + 1);
  const truoc = G.p.bag[it.id] || 0;
  ok('chưa nhặt thì chưa đánh dấu', !pickedUp(mapId, it));
  let ev = null;
  for (let k = 0; k < 90 && !ev; k++) {
    const e = update(1 / 60, 0, -1);
    if (e?.t === 'pickup') ev = e;
  }
  ok('giẫm lên là nhặt được', !!ev && ev.id === it.id, JSON.stringify(ev));
  ok('món vào đúng túi', (G.p.bag[it.id] || 0) === truoc + (it.n || 1),
    `${truoc} -> ${G.p.bag[it.id]}`);
  ok('nhặt rồi thì đánh dấu lại', pickedUp(mapId, it));
  // đi ra rồi quay lại: không nhặt được nữa
  enterMap(mapId, it.x, it.y + 1);
  let lai = null;
  for (let k = 0; k < 90 && !lai; k++) {
    const e = update(1 / 60, 0, -1);
    if (e?.t === 'pickup') lai = e;
  }
  ok('quay lại không nhặt được lần hai', lai === null);
}

// ==== Cửa hàng từng thị trấn (db/economy của bản gốc) ====
{
  const { SHOPS } = await import('../js/data/shops.js');
  const ds = Object.entries(SHOPS);
  ok('có nhiều gian hàng riêng', ds.length >= 8, String(ds.length));
  ok('gian hàng nào cũng có tên tiếng Việt',
    ds.every(([, x]) => x.name && !/^[a-z_]+$/.test(x.name)),
    ds.filter(([, x]) => /^[a-z_]+$/.test(x.name)).map(x => x[0]).join(' '));
  ok('món bán ra đều có thật trong bảng vật phẩm',
    ds.every(([, x]) => x.items.every(i => ITEMS[i.id])),
    ds.flatMap(([, x]) => x.items).filter(i => !ITEMS[i.id]).map(i => i.id).join(' '));
  ok('giá nào cũng dương', ds.every(([, x]) => x.items.every(i => i.price > 0)));
  ok('có gian hàng bán hàng số lượng có hạn',
    ds.some(([, x]) => x.items.some(i => i.stock > 0)));

  // Hàng càng về sau càng xịn: tiệm Kẹo phải đắt hơn tiệm đầu game
  const dau = SHOPS.tuxe_mart_taba;
  const cuoi = SHOPS.spyder_candy_scoop;
  if (dau && cuoi) {
    const tb = (x) => x.items.reduce((a, i) => a + i.price, 0) / x.items.length;
    ok('tiệm cuối game bán hàng đắt hơn tiệm đầu game', tb(cuoi) > tb(dau),
      `${tb(dau).toFixed(0)} vs ${tb(cuoi).toFixed(0)}`);
  }

  // Chủ tiệm phải đứng đúng trên bản đồ và trỏ tới gian hàng có thật
  const chu = [];
  for (const [id, mp] of Object.entries(MAPS)) {
    for (const n of mp.npcs || []) if (n.shop) chu.push({ id, n });
  }
  ok('có chủ tiệm trên bản đồ', chu.length >= 5, String(chu.length));
  ok('chủ tiệm nào cũng trỏ tới gian hàng có thật',
    chu.every(({ n }) => SHOPS[n.shop]), chu.filter(({ n }) => !SHOPS[n.shop]).map(x => x.n.shop).join(' '));
  ok('chủ tiệm đứng yên sau quầy', chu.every(({ n }) => n.ai === 'stand'));
}

// ==== Đổi Tuxemon với NPC (lệnh "trading" rải sẵn trong bản đồ gốc) ====
{
  const { tradeNames, tradeCandidates, tradeDone, doTrade } =
    await import('../js/engine/trade.js');
  const doi = [];
  for (const [id, mp] of Object.entries(MAPS)) {
    for (const n of mp.npcs || []) if (n.trade) doi.push({ id, n });
  }
  ok('có NPC đổi Tuxemon trên bản đồ', doi.length >= 3, String(doi.length));
  ok('vụ đổi nào cũng trỏ tới loài có thật',
    doi.every(({ n }) => speciesBySlug(n.trade.give) && speciesBySlug(n.trade.get)),
    doi.filter(({ n }) => !speciesBySlug(n.trade.get)).map(x => x.n.trade.get).join(' '));
  ok('không ai đòi đổi lấy đúng loài mình đưa',
    doi.every(({ n }) => n.trade.give !== n.trade.get));
  ok('NPC đổi chác thì đứng yên cho dễ bấm',
    doi.every(({ n }) => n.ai === 'stand'), doi.map(x => x.n.ai).join(' '));

  const { id: mapId, n: npc } = doi[0];
  const t = npc.trade;
  const ten = tradeNames(t);
  ok('lấy được tên tiếng Anh của hai loài', !!ten.give && !!ten.get, `${ten.give} -> ${ten.get}`);

  newGame('Lái Buôn');
  ok('chưa có con NPC cần thì không đổi được', tradeCandidates(t).length === 0);

  const spGive = Object.entries(SPECIES).find(([, x]) => x.slug === t.give)[0];
  const spGet = Object.entries(SPECIES).find(([, x]) => x.slug === t.get)[0];
  G.p.party = [newTuxemon(STARTERS[0].sp, 9), newTuxemon(spGive, 24)];
  const co = tradeCandidates(t);
  ok('có con hợp thì NPC nhận ra', co.length === 1 && co[0].i === 1, JSON.stringify(co.map(x => x.i)));

  ok('chưa đổi thì chưa đánh dấu xong', !tradeDone(mapId, npc.name, t));
  const r = doTrade(mapId, npc.name, t, 1);
  ok('đổi thành công', r.ok === true);
  ok('con nhận về đúng loài NPC hứa', String(G.p.party[1].sp) === String(spGet),
    `${G.p.party[1].sp} vs ${spGet}`);
  ok('con nhận về đúng cấp con vừa đưa đi', G.p.party[1].lv === 24, String(G.p.party[1].lv));
  ok('con nhận về được đánh dấu là đồ đổi', G.p.party[1].traded === true);
  ok('con nhận về vào luôn Tuxedex', !!G.p.dex.caught[G.p.party[1].sp]);
  ok('con còn lại trong đội không bị đụng tới', G.p.party[0].lv === 9);
  ok('đổi rồi thì đánh dấu xong, không đổi lại', tradeDone(mapId, npc.name, t));
}

// ==== Câu cá + mấy món tác động lên bản đồ (tính năng của bản gốc) ====
{
  ok('có 3 cần câu với cấu hình riêng', Object.keys(FISHING).length === 3,
    Object.keys(FISHING).join(' '));
  ok('cần càng xịn tỉ lệ cắn càng cao',
    FISHING.fishing_rod.trigger < FISHING.neptune.trigger
    && FISHING.neptune.trigger < FISHING.poseidon.trigger);
  ok('cần càng xịn cá càng to',
    FISHING.fishing_rod.lv[1] < FISHING.poseidon.lv[1]);
  ok('cần nào cũng có món tương ứng trong túi',
    Object.keys(FISHING).every(id => ITEMS[id]?.kind === 'fish'));
  ok('cần câu đòi đứng trước mặt nước',
    Object.keys(FISHING).every(id => ITEMS[id].cond.some(c => c.t === 'water')));

  for (const [id, cfg] of Object.entries(FISHING)) {
    const ds = catchable(id);
    ok(`${cfg.name} câu được vài loài`, ds.length >= 10, `${ds.length} loài`);
    ok(`${cfg.name} chỉ câu đúng dáng thân bản gốc cho phép`,
      ds.every(sp => cfg.shapes.includes(SPECIES[sp].shape)));
    ok(`${cfg.name} chỉ câu đúng bậc tiến hoá bản gốc cho phép`,
      ds.every(sp => cfg.stages.includes(SPECIES[sp].stage)));
  }
  // Cần Poseidon là cần duy nhất câu được thuỷ quái
  ok('chỉ cần xịn nhất mới câu được leviathan',
    catchable('poseidon').some(sp => SPECIES[sp].shape === 'leviathan')
    && !catchable('fishing_rod').some(sp => SPECIES[sp].shape === 'leviathan'));

  {
    let dinh = 0, lo = 99, hi = 0;
    for (let k = 0; k < 400; k++) {
      const r = fish('neptune');
      if (!r.ok) continue;
      dinh += 1;
      lo = Math.min(lo, r.mon.lv); hi = Math.max(hi, r.mon.lv);
    }
    const ti = dinh / 400;
    ok('tỉ lệ cắn câu bám sát cấu hình gốc',
      Math.abs(ti - FISHING.neptune.trigger) < 0.1, ti.toFixed(2));
    ok('cấp cá nằm trong khoảng của cần',
      lo >= FISHING.neptune.lv[0] && hi <= FISHING.neptune.lv[1], `${lo}-${hi}`);
  }

  // Độ bền cần câu: thả đủ số lần là gãy và biến khỏi túi
  {
    const { wearRod, rodLeft } = await import('../js/engine/fishing.js');
    ok('cần đắt hơn thì bền hơn',
      FISHING.fishing_rod.uses < FISHING.neptune.uses
      && FISHING.neptune.uses < FISHING.poseidon.uses);
    newGame('Ngư Dân');
    G.p.bag = { fishing_rod: 2 };
    const ben = FISHING.fishing_rod.uses;
    ok('cần mới còn nguyên độ bền', rodLeft('fishing_rod') === ben, String(rodLeft('fishing_rod')));
    for (let k = 0; k < ben - 1; k++) wearRod('fishing_rod');
    ok('thả gần hết thì còn 1 lần', rodLeft('fishing_rod') === 1, String(rodLeft('fishing_rod')));
    const r1 = wearRod('fishing_rod');
    ok('hết độ bền thì gãy', r1.broke === true);
    ok('gãy thì mất một cái khỏi túi', G.p.bag.fishing_rod === 1, String(G.p.bag.fishing_rod));
    ok('còn cái nữa thì độ bền về đầy', rodLeft('fishing_rod') === ben, String(rodLeft('fishing_rod')));
    for (let k = 0; k < ben; k++) wearRod('fishing_rod');
    ok('gãy cái cuối thì hết cần trong túi', !G.p.bag.fishing_rod);
  }

  // Mặt nước phải được nướng vào bản đồ, không thì không bao giờ câu được
  const nuoc = Object.entries(MAPS).filter(([, m]) => (m.water || []).some(x => x));
  ok('có bản đồ đánh dấu mặt nước', nuoc.length >= 4, String(nuoc.length));
  // Ô nước là ô KHÔNG ĐI VÀO ĐƯỢC (đứng trên bờ mà câu), nên phải chặn; và phải
  // có bờ ngay bên cạnh, không thì cả bản đồ có nước mà chẳng chỗ nào câu được.
  ok('ô nước đều là ô không giẫm lên được',
    nuoc.every(([, m]) => m.water.filter((v, i) => v && !m.solid[i]).length
      < m.water.filter(Boolean).length * 0.5),
    nuoc.map(([id, m]) => `${id}:${m.water.filter((v, i) => v && !m.solid[i]).length}`).join(' '));
  const dungDuoc = nuoc.filter(([, m]) => m.water.some((v, i) => {
    if (!v) return false;
    const x = i % m.w, y = Math.floor(i / m.w);
    return [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx >= 0 && ny >= 0 && nx < m.w && ny < m.h && !m.solid[ny * m.w + nx];
    });
  }));
  ok('bản đồ có nước nào cũng có chỗ đứng câu được',
    dungDuoc.length === nuoc.length,
    `${dungDuoc.length}/${nuoc.length}`);

  // Bốn món tác động lên bản đồ
  const { isWorldItem } = await import('../js/engine/useitem.js');
  for (const id of ['fishing_rod', 'alpha_seep', 'escape_key', 'bivouac']) {
    ok(`${ITEMS[id]?.name || id} là món dùng ngoài bản đồ`,
      !!ITEMS[id] && isWorldItem(id) && ITEMS[id].inWorld && !ITEMS[id].inBattle);
  }

  // Bình xịt: xịt xong thì n bước không gặp con nào
  {
    const { player, update, enterMap, setRepellent, repelLeft } =
      await import('../js/engine/overworld.js');
    newGame('Câu Cá');
    G.p.party = [newTuxemon(STARTERS[0].sp, 20)];
    enterMap('route1');
    setRepellent(50);
    ok('xịt xong thì bộ đếm chạy', repelLeft() === 50, String(repelLeft()));
    let gap = 0;
    for (let k = 0; k < 300; k++) {
      const e = update(0.05, (k % 20 < 10) ? 1 : -1, 0);
      if (e?.t === 'encounter') gap += 1;
    }
    ok('còn thuốc xịt thì không gặp con hoang nào', gap === 0, String(gap));
    ok('xịt hết thì bộ đếm về 0', repelLeft() === 0, String(repelLeft()));
  }

  // Chỗ nghỉ: chưa nghỉ ở đâu thì về thị trấn đầu game
  {
    const { healSpot, setHealSpot } = await import('../js/engine/overworld.js');
    newGame('Lữ Khách');
    const mac = healSpot();
    ok('chưa nghỉ ở đâu thì chỗ nghỉ là bản đồ đầu game',
      mac.map === Object.keys(MAPS)[0], mac.map);
    setHealSpot('cotton_town', 5, 6);
    ok('nghỉ ở đâu thì nhớ chỗ đó', healSpot().map === 'cotton_town');
  }
}

// Đi bộ trên bản đồ mà đang bỏng / trúng độc thì mất máu theo bước chân
{
  const co = Object.entries(STATUSES).filter(([, x]) => x.step?.length);
  ok('có trạng thái hành người theo bước chân', co.length === 2, co.map(x => x[0]).join(' '));
  ok('trạng thái đó đều còn sau khi hết trận', co.every(([, x]) => x.keep));
  ok('cứ 10 bước mất 1 máu', co.every(([, x]) => x.step[2] === 10 && x.step[0] === 'flat_damage'));

  const { player, update, enterMap } = await import('../js/engine/overworld.js');
  newGame('Bộ Hành');
  const con = newTuxemon(STARTERS[0].sp, 30);
  con.hpCur = maxHp(con);
  con.status = 'poison';
  G.p.party = [con];
  enterMap('taba_town');
  const truoc = con.hpCur;
  // NPC của bản đồ là biến chung, các test khác cho họ đi lang thang nên có lần
  // một người đứng chắn ngay lối, người chơi không nhích được ô nào và test này
  // đỏ oan. Tạm dọn NPC đi cho phần đường thông thoáng.
  const npcCu = MAPS.taba_town.npcs;
  MAPS.taba_town.npcs = [];
  // đi tới đi lui cho đủ bước; mỗi lần sang ô mới tính một bước
  for (let k = 0; k < 400; k++) update(0.05, (k % 20 < 10) ? 1 : -1, 0);
  MAPS.taba_town.npcs = npcCu;
  ok('đi bộ khi trúng độc thì mất máu dần', con.hpCur < truoc, `${truoc} -> ${con.hpCur}`);
  ok('nhưng không gục hẳn ngoài bản đồ', con.hpCur >= 1, String(con.hpCur));
}

// Chuỗi trạng thái dồn lực -> tích lực -> kiệt sức. Trước đây "Đang dồn lực"
  // không bao giờ chuyển tiếp (đứng đó vô nghĩa) còn "Tích lực" thì nhân đôi
  // NĂM chỉ số VĨNH VIỄN vì không có gì đẩy nó sang "Kiệt sức".
  {
    ok('trạng thái dồn lực có mốc chuyển tiếp',
      STATUSES.charging?.onTech === 'chargedup' && STATUSES.chargedup?.onTech === 'exhausted');
    ok('kiệt sức là chặng cuối, không chuyển tiếp nữa', !STATUSES.exhausted?.onTech);
    // on_tech_use của mấy trạng thái kia trỏ tới TÊN CHIÊU chứ không phải trạng
    // thái — công cụ sinh data phải lọc bỏ, nếu không là gán trạng thái ma
    ok('mốc chuyển tiếp nào cũng là trạng thái có thật',
      Object.values(STATUSES).every(x => (!x.onTech || STATUSES[x.onTech])
        && (!x.onItem || STATUSES[x.onItem])));

    const me = newTuxemon(STARTERS[0].sp, 40);
    const foe = newTuxemon(STARTERS[2].sp, 40);
    const danhId = Object.entries(MOVES).find(([, m]) =>
      m.category === 'damage' && m.acc === 100 && !m.recharge && !(m.eff || []).length)?.[0]
      || 'struggle';
    me.moves = [{ id: danhId, cd: 0 }];
    foe.moves = [{ id: vaHai || 'struggle', cd: 0 }];
    applyStatus(me, 'charging');
    const b = new Battle({ kind: 'wild',
      sides: [{ kind: 'player', mons: [me] }, { kind: 'wild', mons: [foe] }] });
    const buoc = [];
    for (let t = 0; t < 3; t++) {
      foe.hpCur = maxHp(foe);
      b.submit(0, { t: 'move', i: 0 });
      b.resolve();
      buoc.push([me.status, maxHp(foe) - foe.hpCur]);
    }
    ok('dồn lực -> tích lực -> kiệt sức',
      buoc.map(x => x[0]).join(',') === 'chargedup,exhausted,exhausted',
      buoc.map(x => x[0]).join(','));
    ok('đòn lúc tích lực nặng hơn hẳn đòn lúc kiệt sức',
      buoc[1][1] > buoc[2][1] * 2, buoc.map(x => x[1]).join(' vs '));
  }

  // disappear/appear: chiêu "lặn xuống" phải giáng được đòn đi kèm, chứ không
  // phải bấm xong đứng hình. Trước đây 5 chiêu này ra power 0, bấm vào là mất
  // lượt và khoá 4 lượt hồi chiêu — coi như tự thua.
  const lan = Object.entries(MOVES).filter(([, m]) => (m.eff || []).some(e => e.t === 'disappear'));
  ok('có chiêu lặn xuống', lan.length >= 5, String(lan.length));
  ok('chiêu lặn xuống nào cũng gọi tới một chiêu có thật',
    lan.every(([, m]) => m.eff.every(e => e.t !== 'disappear' || MOVES[e.id])),
    lan.filter(([, m]) => m.eff.some(e => e.t === 'disappear' && !MOVES[e.id])).map(([x]) => x).join(' '));
  ok('chiêu bung ra sau khi lặn đều là chiêu đánh',
    lan.every(([, m]) => m.eff.every(e => e.t !== 'disappear' || MOVES[e.id].category === 'damage')));
  {
    const [id] = lan[0];
    let sut = 0;
    for (let k = 0; k < 20 && !sut; k++) {
      const me = newTuxemon(STARTERS[0].sp, 40);
      const foe = newTuxemon(STARTERS[2].sp, 40);
      me.moves = [{ id, cd: 0 }];
      foe.moves = [{ id: vaHai || 'struggle', cd: 0 }];
      const b = new Battle({ kind: 'wild',
        sides: [{ kind: 'player', mons: [me] }, { kind: 'wild', mons: [foe] }] });
      b.submit(0, { t: 'move', i: 0 });
      b.resolve();
      sut = maxHp(foe) - foe.hpCur;
      ok.chiTiet = `${id} ${sut}`;
    }
    ok('lặn xuống rồi giáng đòn ngay trong lượt đó', sut > 0, ok.chiTiet);
  }

  // foresight: đòn trả sau đúng n lượt, KHÔNG được nối dây vô tận
  {
    const me = newTuxemon(STARTERS[0].sp, 40);
    const foe = newTuxemon(STARTERS[2].sp, 40);
    const fs = Object.entries(MOVES).find(([, m]) => (m.eff || []).some(e => e.t === 'foresight'));
    if (fs) {
      me.moves = [{ id: fs[0], cd: 0 }];
      foe.moves = [{ id: vaHai || 'struggle', cd: 0 }];
      const b = new Battle({ kind: 'wild',
        sides: [{ kind: 'player', mons: [me] }, { kind: 'wild', mons: [foe] }] });
      b.submit(0, { t: 'move', i: 0 });
      b.resolve();
      ok('tiên liệu xếp được một đòn trả sau', b.pendingActions.length === 1);
      const n = fs[1].eff.find(e => e.t === 'foresight').n;
      for (let k = 0; k < n; k++) { b.submit(0, { t: 'struggle' }); b.resolve(); }
      ok('đòn trả sau bung ra rồi thì không nối dây vô tận',
        b.pendingActions.length === 0, String(b.pendingActions.length));
    }
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
  // Luật thay trạng thái đúng theo status/transition_engine.py: MẶC ĐỊNH là cái
  // mới đè cái cũ, bất kể tốt hay xấu. Bản này từng tự đặt luật "tốt không đẩy
  // được xấu và ngược lại" — sai, và làm mấy chiêu buff mất luôn tác dụng gỡ.
  const m = newTuxemon(STARTERS[0].sp, 20);
  const deLen = Object.entries(STATUSES).find(([, x]) => x.cat === 'positive'
    && x.onNeg !== 'removed' && !x.onTech)[0];
  ok('mặc định trạng thái mới đè trạng thái cũ',
    applyStatus(m, 'poison') && applyStatus(m, deLen) && m.status === deLen,
    `${deLen} -> ${m.status}`);
  removeStatus(m, 'all');
  // 'removed': Tập trung / Vỏ cứng dính lúc đang mang trạng thái XẤU thì gỡ cái
  // xấu đi mà không dính vào — đúng hai món này trong bảng gốc
  const go = Object.entries(STATUSES).filter(([, x]) => x.onNeg === 'removed');
  ok('có trạng thái kiểu gỡ chứ không đè', go.length === 2, go.map(x => x[0]).join(' '));
  const m2 = newTuxemon(STARTERS[0].sp, 20);
  applyStatus(m2, 'poison');
  ok('trạng thái kiểu gỡ thì gỡ trạng thái xấu mà không tự dính vào',
    applyStatus(m2, go[0][0]) === false && m2.status === null, String(m2.status));

  applyStatus(m, 'poison');
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

  // Bùa hộ mệnh: món CẦM THEO chặn hẳn một trạng thái (db/item immunity_to_status)
  const bua = Object.entries(ITEMS).filter(([, x]) => x.immuneTo?.length);
  ok('có bùa hộ mệnh chặn trạng thái', bua.length === 8, String(bua.length));
  ok('bùa nào cũng là món cầm theo', bua.every(([, x]) => x.held && !x.inBattle && !x.inWorld));
  ok('bùa nào cũng chặn trạng thái có thật',
    bua.every(([, x]) => x.immuneTo.every(t => t === 'all' || STATUSES[t])),
    bua.flatMap(([, x]) => x.immuneTo).filter(t => t !== 'all' && !STATUSES[t]).join(' '));
  const [buaId, buaIt] = bua.find(([, x]) => !x.immuneTo.includes('all'));
  const cam = newTuxemon(STARTERS[0].sp, 20);
  cam.held = buaId;
  ok('cầm bùa thì không dính đúng trạng thái đó',
    !applyStatus(cam, buaIt.immuneTo[0]) && !cam.status, `${buaId} ${cam.status}`);
  ok('bùa không chặn trạng thái khác',
    applyStatus(cam, buaIt.immuneTo[0] === 'poison' ? 'burn' : 'poison'));
  const tat = newTuxemon(STARTERS[0].sp, 20);
  tat.held = bua.find(([, x]) => x.immuneTo.includes('all'))[0];
  ok('bùa "miễn tất" chặn mọi trạng thái',
    !applyStatus(tat, 'poison') && !applyStatus(tat, 'burn') && !applyStatus(tat, 'hardshell'));
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

// ==== Thành tựu ====
{
  newGame('AchTester');
  G.p.stats.catches = 0;
  ok('mới chơi thì chưa nhận được thành tựu nào', choNhan() === 0);
  ok('mọi phần thưởng trỏ tới vật phẩm có thật',
    ACHIEVEMENTS.every(a => (a.qua.do || []).every(d => !!ITEMS[d.id])),
    ACHIEVEMENTS.flatMap(a => (a.qua.do || []).map(d => d.id)).filter(id => !ITEMS[id]).join(', '));
  ok('mã thành tựu không trùng nhau',
    new Set(ACHIEVEMENTS.map(a => a.id)).size === ACHIEVEMENTS.length);
  const bienCo = new Set(Object.keys(bangThanhTuu()[0] ? {
    catches: 1, wins: 1, steps: 1, money: 1, badges: 1,
    dexSeen: 1, dexCaught: 1, trainerLv: 1, gioChoi: 1,
  } : {}));
  ok('mọi thành tựu gắn với một biến có thật',
    ACHIEVEMENTS.every(a => bienCo.has(a.bien)),
    ACHIEVEMENTS.filter(a => !bienCo.has(a.bien)).map(a => a.bien).join(', '));

  const [truoc, loi0] = nhanThuong('bat_1');
  ok('chưa đạt mốc thì không nhận được', !truoc && !!loi0);

  G.p.stats.catches = 1;
  ok('đạt mốc thì báo có thành tựu chờ nhận', choNhan() >= 1);
  const tienCu = G.p.money;
  const [qua, loi] = nhanThuong('bat_1');
  ok('nhận được thưởng khi đủ mốc', !!qua && !loi);
  ok('tiền cộng đúng', G.p.money === tienCu + ACH_BY_ID.bat_1.qua.tien);
  ok('vật phẩm vào túi', (G.p.bag.tuxeball || 0) >= 5);
  const [lai, loi2] = nhanThuong('bat_1');
  ok('không nhận lại lần hai', !lai && !!loi2);

  G.p.stats.wins = 1000;
  G.p.money = 2000000;
  const [gop, n] = nhanHet();
  ok('nhận tất cả gom được nhiều thành tựu', n >= 3, `n=${n}`);
  ok('nhận tất cả cộng dồn tiền', gop.tien > 0);
  ok('nhận xong thì hết cái chờ nhận', choNhan() === 0);
  ok('bảng thành tựu đánh dấu đã nhận',
    bangThanhTuu().filter(a => a.nhan).length === G.p.ach.length);
}

// ==== Không trận nào được phép KHÔNG BAO GIỜ KẾT THÚC ====
// Trận với huấn luyện viên KHÔNG chạy trốn được, nên nếu hai bên đều không hạ
// nổi nhau thì người chơi kẹt vĩnh viễn, phải xoá bản lưu. Bản gốc lấy 4 chiêu
// MỚI NHẤT làm bộ chiêu, mà vài loài (medipup Lv.16) 4 chiêu mới nhất đều
// power 0 — đó là lý do phải quét thật chứ không đoán.
{
  const mk = (e) => Array.isArray(e) ? newTuxemon(e[0], e[1]) : newTuxemon(e.sp, e.lv);
  let ket = 0, tong = 0;
  const xau = [];
  for (const [tid, t] of Object.entries(TRAINERS)) {
    const mau = (t.party || []).map(mk).filter(Boolean);
    if (!mau.length) continue;
    const lv = Math.round(mau.reduce((a, m) => a + m.lv, 0) / mau.length) + 2;
    for (let lan = 0; lan < 4; lan++) {
      const ta = STARTERS.map(s => newTuxemon(s.sp, lv)).filter(Boolean);
      G.p.party = ta;
      const dich = (t.party || []).map(mk).filter(Boolean);
      const b = new Battle({ kind: 'trainer',
        sides: [{ mons: ta, kind: 'player' }, { mons: dich, kind: 'trainer', bag: { potion: 3 } }] });
      let n = 0;
      while (!b.over && n < 400) {
        const m = b.sides[0].mons[b.sides[0].active ?? 0];
        if (!m || isFainted(m)) {
          const k = b.sides[0].mons.findIndex(x => x && !isFainted(x));
          if (k < 0) break;
          b.submit(0, { t: 'switch', slot: k });
        } else if (b.beTac()) {
          // Đánh mãi không xong thì người chơi bỏ cuộc — trận phải kết thúc được
          b.submit(0, { t: 'run' });
        } else {
          const u = (m.moves || []).findIndex(x => (x.cd || 0) <= 0);
          b.submit(0, u >= 0 ? { t: 'move', i: u } : { t: 'struggle' });
        }
        b.resolve();
        n++;
      }
      tong++;
      if (!b.over) { ket++; if (xau.length < 5) xau.push(tid); }
    }
  }
  ok(`mọi trận huấn luyện viên đều kết thúc được (${tong} trận)`, ket === 0, xau.join(', '));

  // Van an toàn: đánh quá lâu thì bỏ cuộc được, kể cả với huấn luyện viên
  {
    const bt = new Battle({ kind: 'trainer',
      sides: [{ mons: [newTuxemon(STARTERS[0].sp, 20)], kind: 'player' },
        { mons: [newTuxemon(STARTERS[1].sp, 20)], kind: 'trainer' }] });
    ok('trận trainer bình thường KHÔNG bỏ chạy được', bt.submit(0, { t: 'run' })[0] === false);
    bt.turn = bt.LUOT_BE_TAC + 1;
    ok('trận trainer bế tắc thì bỏ cuộc được', bt.submit(0, { t: 'run' })[0] === true);
  }
}

// ==== Công Viên Pepper ====
{
  newGame('ParkTester');
  G.p.money = 100;
  const [x, e1] = P.vaoCongVien();
  ok('không đủ tiền thì không vào được', !x && !!e1);

  G.p.money = 50000;
  const tienCu = G.p.money;
  const [vao, e2] = P.vaoCongVien();
  ok('mua vé vào được', !!vao && !e2);
  ok('vé trừ đúng tiền', G.p.money === tienCu - P.GIA_VE, String(G.p.money));
  ok('vào là có đủ bước và bóng', P.park.buoc === P.BUOC && P.park.bong === P.SO_BONG);
  ok('không vào hai lần', P.vaoCongVien()[1] !== null);

  // Đi cho tới khi gặp một con
  let gap = null;
  for (let i = 0; i < 400 && !gap; i++) {
    const ev = P.buocTrongCongVien();
    if (ev?.t === 'gap') gap = ev;
    if (ev?.t === 'hetBuoc') break;
  }
  ok('đi một lúc thì gặp Tuxemon', !!gap);
  ok('gặp con nào là ghi vào Tuxedex', !gap || G.p.dex.seen[gap.mon.sp] === true);

  if (gap) {
    const bongCu = P.park.bong;
    const r = P.nemBong();
    ok('ném bóng trừ đúng một quả', P.park.bong === bongCu - 1);
    ok('ném hụt thì có câu tả bộ dạng', r.bat || !!r.dangVe);
    ok('bắt được thì con đó vào đội hoặc box',
      !r.bat || G.p.party.length + G.p.box.length > 0);
  }

  // Bỏ qua thì hết con trước mặt
  P.park.gap = P.park.gap || { mon: gap?.mon, luot: 5, chay: 0 };
  P.boQua();
  ok('bỏ qua thì con vật đi mất', P.park.gap === null);

  const tk = P.raCong();
  ok('ra cổng thì hết ở trong công viên', !P.park.dang);
  ok('tổng kết đếm đúng số lần ném', tk.tong === tk.bat + tk.hut);
  ok('tổng kết có tỉ lệ bắt hợp lệ', tk.tiLe >= 0 && tk.tiLe <= 1);
  ok('tổng kết đếm số loài đã gặp', tk.soLoai >= 1, String(tk.soLoai));

  ok('bóng công viên không ném được ngoài trận thường',
    ITEMS[P.BONG] && ITEMS[P.BONG].kind === 'park' && !ITEMS[P.BONG].inBattle);
}

// ==== EXP huấn luyện viên: mọi cách kết thúc trận đều phải cho công ====
// Từng có lỗi: lệnh cộng EXP nằm trong nhánh "thắng trận" nên ai chơi kiểu đi
// BẮT là kẹt Lv.1 vĩnh viễn, không mở nổi Nhiệm vụ (Lv.2) hay Cửa hàng (Lv.3).
{
  for (const loai of ['wild', 'trainer', 'catch']) {
    ok(`kết thúc kiểu '${loai}' có cho EXP huấn luyện viên`,
      trainerExpFor(loai, 10) > 0, String(trainerExpFor(loai, 10)));
  }
  ok('bắt được cho nhiều EXP hơn đánh gục',
    trainerExpFor('catch', 10) > trainerExpFor('wild', 10));

  newGame('ExpTester');
  // Chơi kiểu chỉ đi bắt: đủ số lần thì phải mở được Nhiệm vụ và Cửa hàng
  let lan = 0;
  while (trainerLevelFor(0) === 1 && lan < 100) {
    addTrainerExp(trainerExpFor('catch', 5));
    lan++;
    if (G.p.trainer.level >= 3) break;
  }
  ok('chỉ đi bắt cũng lên được Trainer Lv.3', G.p.trainer.level >= 3,
    `sau ${lan} lần bắt mới tới Lv.${G.p.trainer.level}`);
  ok('lên Lv.3 thì mở được Nhiệm vụ và Cửa hàng',
    isUnlocked('quest', G.p.trainer.level) && isUnlocked('shop', G.p.trainer.level));
}

// ==== Nhà Trẻ ====
{
  newGame('DCTester');
  G.p.money = 100000;
  // Tìm một cặp đực/cái đã qua dạng cơ bản để thử nhân giống
  const daTienHoa = Object.keys(SPECIES).map(Number)
    .filter(id => DC.hangTienHoa(id) > 1 && !SPECIES[id].glitched);
  ok('có loài đã qua dạng cơ bản để ghép đôi', daTienHoa.length > 50, String(daTienHoa.length));
  // Loài chỉ có giống vô tính (robot...) thì không bao giờ ghép được — phải còn
  // đủ nhiều loài vừa có hai giới vừa đã tiến hoá, không thì tính năng vô dụng
  const ghepThat = daTienHoa.filter(id => SPECIES[id].gender?.m > 0 && SPECIES[id].gender?.f > 0);
  ok('còn đủ loài thật sự ghép đôi được', ghepThat.length > 80, String(ghepThat.length));

  const me = newTuxemon(daTienHoa[0], 20); me.gender = 'f';
  const cha = newTuxemon(daTienHoa[1], 24); cha.gender = 'm';
  ok('một đực một cái đã tiến hoá thì ghép được', DC.ghepDuoc(me, cha));
  const voTinh = newTuxemon(daTienHoa[2], 20); voTinh.gender = 'n';
  ok('con vô tính không ghép đôi được', !DC.ghepDuoc(me, voTinh));

  G.p.party = [me, cha, newTuxemon(STARTERS[0].sp, 10)];
  ok('gửi được con vào nhà trẻ', DC.gui(0)[0] !== null);
  ok('gửi rồi thì con rời đội hình', G.p.party.length === 2);
  DC.gui(0);
  ok('nhà trẻ giữ tối đa 2 con', DC.kho().mons.length === 2 && DC.gui(0)[1] !== null);
  ok('phải chừa lại ít nhất một con', G.p.party.length === 1);

  ok('hai con hợp đôi thì vào chế độ nhân giống', DC.cheDo() === 'nhangiong', DC.cheDo());

  // Đi tới mốc nửa đường rồi tới lúc đẻ
  let nua = false, san = false;
  for (let i = 0; i < DC.BUOC_CAN + 10; i++) {
    const e = DC.moiBuoc(1);
    if (e?.t === 'nuaduong') nua = true;
    if (e?.t === 'sansang') san = true;
  }
  ok('đi nửa đường thì có báo', nua);
  ok('đi đủ bước thì sẵn sàng', san && DC.sanSang());

  const soTruoc = G.p.party.length;
  const [con, err] = DC.layConNon();
  ok('đón được con non', !!con && !err, String(err));
  ok('con non vào đội hình', G.p.party.length === soTruoc + 1);
  ok('con non ở dạng gốc của bố mẹ', DC.hangTienHoa(con.sp) === 1,
    `${SPECIES[con.sp]?.slug} hạng ${DC.hangTienHoa(con.sp)}`);
  ok('con non có cấp trung bình của bố mẹ', con.lv === Math.floor((20 + 24) / 2), String(con.lv));
  ok('IV con non lấy giá trị cao hơn của bố mẹ',
    con.iv.every((v, i) => v >= Math.max(me.iv[i], cha.iv[i]) - 0 && v === Math.max(me.iv[i], cha.iv[i])));
  ok('đẻ xong thì đếm lại từ đầu', DC.kho().buoc === 0);

  // Chế độ rèn luyện: một con thì ăn EXP và trừ tiền
  DC.nhanVe();
  G.p.party = [newTuxemon(STARTERS[0].sp, 5), newTuxemon(STARTERS[1].sp, 5)];
  DC.gui(0);
  ok('một con thì vào chế độ rèn luyện', DC.cheDo() === 'renluyen');
  const expCu = DC.kho().mons[0].exp;
  const tienCu = G.p.money;
  for (let i = 0; i < 40; i++) DC.moiBuoc(1);
  ok('rèn luyện cộng EXP', DC.kho().mons[0].exp > expCu,
    `${expCu} -> ${DC.kho().mons[0].exp}`);
  ok('rèn luyện trừ tiền', G.p.money < tienCu, `${tienCu} -> ${G.p.money}`);
  ok('EXP lẻ 0.25/bước không bị cắt cụt thành 0', DC.kho().tongExp >= 9,
    String(DC.kho().tongExp));

  G.p.money = 0;
  const expKhiHetTien = DC.kho().mons[0].exp;
  for (let i = 0; i < 40; i++) DC.moiBuoc(1);
  ok('hết tiền thì ngừng cộng EXP chứ không nợ',
    DC.kho().mons[0].exp === expKhiHetTien && G.p.money === 0);
}

// ==== Bản đồ: địa hình phải chặn đúng, NPC phải đứng đúng chỗ ====
{
  let oNuoc = 0, nuocHo = 0, tongO = 0, oChan = 0;
  for (const m of Object.values(MAPS)) {
    tongO += m.solid.length;
    for (let i = 0; i < m.solid.length; i++) if (m.solid[i]) oChan++;
    if (!m.water) continue;
    for (let i = 0; i < m.water.length; i++) {
      if (!m.water[i]) continue;
      oNuoc++;
      if (!m.solid[i]) nuocHo++;
    }
  }
  ok('mặt nước luôn chặn đường, không lội bừa được', nuocHo === 0, `${nuocHo}/${oNuoc} ô hở`);
  ok('bản đồ có địa hình chặn thật sự (không phải đi đâu cũng được)',
    oChan / tongO > 0.25, `${(oChan / tongO * 100).toFixed(1)}%`);

  // NPC: người trong nhà thì đứng, ngoài đường mới có người đi lại
  let trongNhaDi = 0, ngoaiDi = 0, tongNpc = 0;
  for (const m of Object.values(MAPS)) {
    for (const n of m.npcs || []) {
      tongNpc++;
      if (m.env === 'interior' && n.ai !== 'stand') trongNhaDi++;
      if (m.env !== 'interior' && n.ai === 'wander') ngoaiDi++;
    }
  }
  ok('NPC trong nhà đứng yên hết', trongNhaDi === 0, String(trongNhaDi));
  ok('ngoài đường chỉ một số ít người đi lang thang',
    ngoaiDi / tongNpc < 0.2, `${ngoaiDi}/${tongNpc}`);
}

// ==== Nhà đất ====
{
  newGame('EsTester');
  ok('có đủ mẫu nhà và đồ trang trí', HOUSE_BASES.length >= 4 && FURNITURE.length >= 10,
    `${HOUSE_BASES.length} nhà / ${FURNITURE.length} món`);
  ok('mẫu nhà xếp theo giá tăng dần',
    HOUSE_BASES.every((b, i) => i === 0 || b.price > HOUSE_BASES[i - 1].price));
  ok('nhà càng đắt lưới càng rộng',
    HOUSE_BASES.every((b, i) => i === 0 || b.o >= HOUSE_BASES[i - 1].o));
  // Lô đất phải rơi vào ô TRỐNG của bản đồ, không đè lên nhà cửa/NPC có sẵn
  {
    const m = MAPS[ES.KHU_DAT_MAP];
    // CHỈ xét vật cản CỐ ĐỊNH. NPC thì đi lang thang khắp ô trống nên toạ độ
    // của chúng đổi liên tục — kiểm theo đó thì test lúc đỏ lúc xanh, mà cũng
    // vô nghĩa vì lát sau chúng lại đi chỗ khác. Ô nhà không đặt solid nên NPC
    // đi ngang qua cũng không kẹt.
    const ban = new Set();
    for (const w of m.warps || []) ban.add(`${w.x},${w.y}`);
    const xau = [];
    for (const l of ES.LOTS) {
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          const gx = l.x + dx, gy = l.y + dy;
          if (m.solid[gy * m.w + gx]) xau.push(`${l.id}: tường ${gx},${gy}`);
          else if (ban.has(`${gx},${gy}`)) xau.push(`${l.id}: đè cổng ${gx},${gy}`);
        }
      }
    }
    ok('mọi lô đất nằm trên ô trống, không đè lên gì', xau.length === 0,
      [...new Set(xau)].join(' | '));

    // Đất ở phải là ĐẤT BẰNG: không dựng nhà giữa hồ hay trên vách núi, và
    // phải có lối đi tới cửa chứ không xây kín trong bụi.
    const uot = ES.LOTS.filter(l => {
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          if (m.water && m.water[(l.y + dy) * m.w + (l.x + dx)]) return true;
        }
      }
      return false;
    });
    ok('không lô nào nằm dưới nước', uot.length === 0, uot.map(l => l.id).join(', '));

    const kin = ES.LOTS.filter(l => {
      const c = { x: l.x + 1, y: l.y + 2 };   // ô cửa
      if (m.solid[c.y * m.w + c.x]) return true;
      // phải đứng được ở ô ngay dưới cửa mới bấm vào nhà được
      const d = (c.y + 1) * m.w + c.x;
      return c.y + 1 >= m.h || m.solid[d];
    });
    ok('lô nào cũng có lối đi tới cửa nhà', kin.length === 0, kin.map(l => l.id).join(', '));

    // Khu dân cư là bản đồ RIÊNG, không mượn góc thị trấn nữa
    ok('khu đất là bản đồ riêng', ES.KHU_DAT_MAP !== 'taba_town', ES.KHU_DAT_MAP);
    const cong = (MAPS.taba_town.warps || []).filter(w => w.to === ES.KHU_DAT_MAP);
    ok('từ thị trấn có cổng vào khu dân cư', cong.length > 0);
    ok('trong khu dân cư có cổng về thị trấn',
      (m.warps || []).some(w => w.to === 'taba_town'));

    // Cổng phải nằm trong vùng đi lại chính của thị trấn. Có lần chương trình
    // sinh tự chọn một góc bị cây và vách đá vây kín — bản đồ vẫn "có cổng"
    // nhưng người chơi đi cả đời không tới.
    {
      const t = MAPS.taba_town;
      const s = t.spawn;
      const den = new Set([`${s.x},${s.y}`]);
      const hang = [[s.x, s.y]];
      while (hang.length) {
        const [x, y] = hang.pop();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= t.w || ny >= t.h) continue;
          if (t.solid[ny * t.w + nx]) continue;
          const k = `${nx},${ny}`;
          if (den.has(k)) continue;
          den.add(k); hang.push([nx, ny]);
        }
      }
      ok('đi bộ trong thị trấn tới được cổng khu dân cư',
        cong.every(w => den.has(`${w.x},${w.y}`)),
        cong.map(w => `${w.x},${w.y}`).join(' '));
    }

    // Địa hình phân biệt được: phải có mặt nước, và phải có tường bao quanh
    ok('khu dân cư có mặt nước', (m.water || []).some(v => v));
    const chan = m.solid.reduce((a, v) => a + v, 0);
    ok('khu dân cư có vật cản, không phải bãi trống', chan / (m.w * m.h) > 0.15,
      `${Math.round(chan * 100 / (m.w * m.h))}%`);

    // Đi bộ từ cổng vào phải tới được MỌI cửa nhà và chỗ bác thợ mộc
    const vao = cong[0];
    const den = new Set([`${vao.tx},${vao.ty}`]);
    const hang = [[vao.tx, vao.ty]];
    while (hang.length) {
      const [x, y] = hang.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
        if (m.solid[ny * m.w + nx]) continue;
        const k = `${nx},${ny}`;
        if (den.has(k)) continue;
        den.add(k); hang.push([nx, ny]);
      }
    }
    const xa = ES.LOTS.filter(l => !den.has(`${l.x + 1},${l.y + 3}`));
    ok('đi bộ từ cổng tới được mọi lô đất', xa.length === 0, xa.map(l => l.id).join(', '));
    ok('đi bộ từ cổng tới được bác thợ mộc',
      [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) =>
        den.has(`${ES.THO_MOC.x + dx},${ES.THO_MOC.y + dy}`)));
    ok('bác thợ mộc không đứng đè lên lô đất nào',
      ES.LOTS.every(l => ES.THO_MOC.x < l.x || ES.THO_MOC.x > l.x + 2
        || ES.THO_MOC.y < l.y || ES.THO_MOC.y > l.y + 2));
  }

  G.p.money = 1000;
  ok('không đủ tiền thì không mua được đất', ES.muaDat('a1')[1] !== null);
  G.p.money = 1000000;
  ok('mua được đất', ES.muaDat('a1')[0] !== null);
  ok('mỗi người chỉ một lô', ES.muaDat('a2')[1] !== null);
  ok('chưa có nhà thì bản đồ không vẽ gì', ES.nhaTrenBanDo(ES.KHU_DAT_MAP) === null);

  const re = HOUSE_BASES[0], dat = HOUSE_BASES[2];
  ok('dựng được nhà', ES.dungNha(re.id)[0] !== null);
  ok('nhà hiện lên bản đồ', !!ES.nhaTrenBanDo(ES.KHU_DAT_MAP));
  ok('nhà chỉ hiện ở đúng bản đồ khu đất', ES.nhaTrenBanDo('route1') === null);
  const truoc = G.p.money;
  const [nang] = ES.dungNha(dat.id);
  ok('nâng cấp chỉ trả phần chênh lệch',
    nang && G.p.money === truoc - (dat.price - re.price), String(G.p.money));
  ok('không đổi xuống mẫu nhỏ hơn', ES.dungNha(re.id)[1] !== null);

  // Kê đồ (bộ kê theo bản đồ trong nhà, test kỹ ở phần dưới)
  const mon = FURNITURE[0];
  ok('mua đồ vào kho', ES.muaDo(mon.id)[0] !== null && ES.conTrongKho(mon.id) === 1);
  ok('số món kê được khớp với căn phòng thật', (() => {
    const m = MAPS[ES.mapTrongNha()];
    return ES.soMonToiDa() === ES.soMonToiDa(m) && ES.soMonToiDa() >= 6;
  })(), `${ES.soMonToiDa()}`);

  ok('tổng giá trị cộng cả đất, nhà và đồ',
    ES.tomTat().giaTri >= ES.LOT_BY_ID.a1.price + dat.price);

  // ==== Đi bộ tới mua: biển bán / công trường / cửa nhà ====
  {
    newGame('EsMap');
    G.p.money = 1000000;
    const l = ES.LOTS[0];
    ok('lô chưa mua thì thấy biển BÁN',
      ES.vatTheODay(ES.KHU_DAT_MAP, l.x + 1, l.y + 1)?.kind === 'lo-ban');
    ok('chỗ bác thợ mộc bắt được',
      ES.vatTheODay(ES.KHU_DAT_MAP, ES.THO_MOC.x, ES.THO_MOC.y)?.kind === 'tho-moc');
    ok('bản đồ khác thì không có gì', ES.vatTheODay('route1', l.x + 1, l.y + 1) === null);

    ES.muaDat(l.id);
    ok('mua rồi thì lô thành của mình',
      ES.vatTheODay(ES.KHU_DAT_MAP, l.x + 1, l.y + 1)?.kind === 'lo-cua-minh');
    ok('lô khác báo đã có đất rồi',
      ES.vatTheODay(ES.KHU_DAT_MAP, ES.LOTS[1].x, ES.LOTS[1].y)?.kind === 'lo-nguoi-khac');

    ES.dungNha('nha_go');
    ok('dựng xong là vào chế độ đang xây', ES.dangXay() && !ES.nhaXong());
    ok('đang xây thì tới nơi thấy công trường',
      ES.vatTheODay(ES.KHU_DAT_MAP, l.x + 1, l.y + 1)?.kind === 'dang-xay');
    ok('còn lại có chữ mô tả', /phút|giờ/.test(ES.conLaiChu()), ES.conLaiChu());

    const tienTruoc = G.p.money;
    const [gia] = ES.xayNhanh();
    ok('giục thợ thì trả thêm tiền và xong ngay',
      gia > 0 && G.p.money === tienTruoc - gia && ES.nhaXong());
    const c = ES.oCua();
    ok('có ô cửa để đi vào', !!c);
    ok('đứng đúng ô cửa thì mở được nhà',
      ES.vatTheODay(ES.KHU_DAT_MAP, c.x, c.y)?.kind === 'cua-nha');
    ok('đứng chỗ khác trong lô thì chỉ là thân nhà',
      ES.vatTheODay(ES.KHU_DAT_MAP, l.x, l.y)?.kind === 'nha-minh');

    // Kê đồ theo ô bản đồ trong nhà
    const noi = MAPS[ES.mapTrongNha()];
    ok('bản đồ trong nhà có thật và trống', !!noi && (noi.npcs || []).length === 0);
    const mon = FURNITURE[0];
    ES.muaDo(mon.id);
    ok('mỗi mẫu nhà có mặt bằng riêng, càng đắt càng rộng', (() => {
      const co = HOUSE_BASES.map(b => MAPS[ES.MAP_TRONG_NHA[b.id]]);
      return co.every(Boolean) && co.every((m, i) => i === 0
        || m.w * m.h >= co[i - 1].w * co[i - 1].h);
    })(), HOUSE_BASES.map(b => {
      const m = MAPS[ES.MAP_TRONG_NHA[b.id]];
      return `${b.id}=${m ? m.w + 'x' + m.h : 'THIẾU'}`;
    }).join(' '));
  ok('bản đồ trong nhà nào cũng trống hẳn',
    Object.values(ES.MAP_TRONG_NHA).every(k => MAPS[k]
      && (MAPS[k].npcs || []).length === 0));
  ok('kê được vào ô giữa nhà', ES.keTaiO(mon.id, 2, 2)[0] !== null);
    ok('tìm lại được món ở ô đó', ES.monTaiO(2, 2)?.id === mon.id);
    const d = ES.monTaiO(2, 2);
    ok('kéo sang ô trống thì đi theo', ES.chuyenDo(d, 4, 3, noi)[0] !== null && d.x === 4);
    ok('kéo ra ngoài tường thì không cho', ES.chuyenDo(d, 0, 0, noi)[1] !== null);
    ok('kéo ra ngoài mép bản đồ thì không cho',
      ES.chuyenDo(d, noi.w, 3, noi)[1] !== null);
    ES.muaDo(mon.id);
    ok('không kê chồng lên món đang có', !ES.keDuocTrongNha(mon.id, 4, 3, noi));
    // Tường của phòng dày HAI hàng trên cùng — không được kê vào đó
    ok('không kê đồ vào tường',
      !ES.keDuocTrongNha(mon.id, 3, 0, noi) && !ES.keDuocTrongNha(mon.id, 3, 1, noi));
    ok('kê được ở hàng ngay dưới tường', ES.keDuocTrongNha(mon.id, 8, 2, noi));
    ok('không kê tràn ra ngoài bản đồ',
      !ES.keDuocTrongNha(mon.id, noi.w, 3, noi) && !ES.keDuocTrongNha(mon.id, 3, noi.h, noi));
    ok('cất về kho thì đồ quay lại kho',
      ES.catVeKho(d) && ES.conTrongKho(mon.id) === 2);
  }
}

// ==== Dùng nội thất: nằm, ngồi, ăn, tắm, nấu, bật đèn ====
{
  const TT = await import('../js/engine/furniture.js');
  const { FURNITURE, NHOM_DO } = await import('../js/data/estate.js');

  ok('bộ nội thất đủ nhiều để chọn', FURNITURE.length >= 60, `${FURNITURE.length} món`);
  ok('món nào cũng có ảnh riêng',
    new Set(FURNITURE.map(f => f.img)).size === FURNITURE.length);
  ok('id nội thất không trùng nhau',
    new Set(FURNITURE.map(f => f.id)).size === FURNITURE.length);
  ok('giá nội thất trải rộng, không cào bằng',
    new Set(FURNITURE.map(f => f.price)).size >= 15);
  const nhomCo = new Set(NHOM_DO.map(n => n.id));
  ok('món nào cũng thuộc một nhóm có thật',
    FURNITURE.every(f => nhomCo.has(f.nhom)),
    FURNITURE.filter(f => !nhomCo.has(f.nhom)).map(f => f.id).join(', '));
  ok('nhóm nào cũng có hàng',
    NHOM_DO.every(n => FURNITURE.some(f => f.nhom === n.id)));
  const kieuCo = new Set(Object.keys(TT.TEN_TUONG_TAC));
  ok('kiểu tương tác nào cũng có tên tiếng Việt',
    FURNITURE.every(f => !f.kind || kieuCo.has(f.kind)),
    FURNITURE.filter(f => f.kind && !kieuCo.has(f.kind)).map(f => f.kind).join(', '));
  for (const k of ['nam', 'ngoi', 'ban', 'tam', 'nau', 'den']) {
    ok(`có món để ${TT.TEN_TUONG_TAC[k]}`, FURNITURE.some(f => f.kind === k));
  }

  // Đặt một bộ đủ kiểu rồi dùng thử
  newGame('Chủ Nhà');
  G.p.money = 2000000;
  G.p.estate = { lot: ES.LOTS[0].id, base: 'nha_da', xongLuc: 1, kho: {}, dat: [] };
  G.p.party = [newTuxemon(STARTERS[0].sp, 12)];
  const mon0 = G.p.party[0];
  const timKieu = (k) => FURNITURE.find(f => f.kind === k);

  {
    const g = timKieu('nam');
    const d = { id: g.id, x: 2, y: 2 };
    mon0.hpCur = 1; mon0.status = 'poison';
    const [ra, err] = TT.dung(d);
    ok('nằm ngủ chạy được', !err && !!ra, err || '');
    ok('ngủ dậy cả đội đầy máu', mon0.hpCur === maxHp(mon0) && !mon0.status);
    ok('đang nằm thì tư thế là nằm', TT.tuTheHienTai() === 'nam');
    ok('nằm xong phải chờ mới nằm tiếp', TT.dung(d)[1] !== null);
    ok('bước một bước là đứng dậy', TT.dungDay() && TT.tuTheHienTai() === '');
  }
  {
    const g = timKieu('ngoi');
    const d = { id: g.id, x: 4, y: 2 };
    ok('ngồi xuống được', TT.dung(d)[0] !== null && TT.tuTheHienTai() === 'ngoi');
    ok('bấm lần nữa thì đứng lên', TT.dung(d)[0] !== null && TT.tuTheHienTai() === '');
    ok('ghế không có thời gian chờ', TT.dung(d)[0] !== null);
    TT.dungDay();
  }
  {
    const g = timKieu('ban');
    const d = { id: g.id, x: 6, y: 2 };
    mon0.hpCur = 1;
    const [ra] = TT.dung(d);
    ok('ăn cơm hồi một phần máu', !!ra && mon0.hpCur > 1 && mon0.hpCur < maxHp(mon0),
      `${mon0.hpCur}/${maxHp(mon0)}`);
    ok('ăn xong phải chờ mới ăn tiếp', TT.dung(d)[1] !== null);
  }
  {
    const g = timKieu('tam');
    const d = { id: g.id, x: 8, y: 2 };
    mon0.status = 'burn';
    ok('tắm xong hết trạng thái xấu', TT.dung(d)[0] !== null && !mon0.status);
  }
  {
    const g = timKieu('den');
    const d = { id: g.id, x: 10, y: 2 };
    const truoc = TT.denDangBat();
    TT.dung(d);
    ok('bật/tắt được đèn', TT.denDangBat() === !truoc);
    TT.dung(d);
    ok('bấm lại thì về như cũ', TT.denDangBat() === truoc);
  }
  {
    const g = timKieu('nau');
    const [ra] = TT.dung({ id: g.id, x: 12, y: 2 });
    ok('bếp mở thẳng màn chế tạo', ra?.moMan === 'craft');
  }
  ok('món chỉ để nhìn thì không dùng được',
    TT.dung({ id: FURNITURE.find(f => !f.kind).id, x: 1, y: 1 })[1] !== null);
  ok('món không có thật thì báo lỗi', TT.dung({ id: 'khong_co', x: 1, y: 1 })[1] !== null);

  // Đứng trước đồ trong nhà mình thì nút hành động bắt được
  {
    G.p.estate.dat = [{ id: timKieu('nam').id, x: 3, y: 3 }];
    const noi = ES.mapTrongNha();
    const t = ES.vatTheODay(noi, 3, 3);
    ok('trong nhà bấm được vào đồ đã kê', t?.kind === 'do-noi-that', JSON.stringify(t));
    ok('ô trống trong nhà thì không bắt được gì', ES.vatTheODay(noi, 7, 7) === null);
  }
}

// ==== Phương tiện ====
{
  const MT = await import('../js/engine/mounts.js');

  ok('có nhiều mẫu xe để chọn', MT.VEHICLES.length >= 3);
  ok('xe nào cũng đủ bốn hướng',
    MT.VEHICLES.every(v => ['up', 'down', 'left', 'right'].every(h => v.img[h])));
  ok('xe nào cũng có ảnh riêng, không dùng chung',
    new Set(MT.VEHICLES.flatMap(v => Object.values(v.img))).size
      === MT.VEHICLES.length * 4);
  ok('xe càng đắt càng nhanh',
    MT.VEHICLES.every((v, i) => i === 0
      || (v.price > MT.VEHICLES[i - 1].price && v.speed > MT.VEHICLES[i - 1].speed)));

  newGame('Tài Xế');
  G.p.money = 100;
  ok('không đủ tiền thì không mua được xe', MT.muaXe('xe_den')[1] !== null);
  G.p.money = 5000000;
  ok('mua được xe', MT.muaXe('xe_den')[0] !== null && MT.coXe('xe_den'));
  ok('không mua trùng chiếc đã có', MT.muaXe('xe_den')[1] !== null);
  ok('chưa có xe thì không lái được', MT.len({ t: 'xe', id: 'xe_do' })[1] !== null);
  ok('lái được chiếc mình có', MT.len({ t: 'xe', id: 'xe_den' })[0] !== null);
  ok('đang lái thì đi nhanh hơn', MT.heSoToc() > 1.2, String(MT.heSoToc()));
  ok('lái xe thì ít gặp hoang hơn', MT.heSoGapHoang() < 1);
  ok('xuống xe thì về tốc độ thường',
    MT.xuong() && MT.heSoToc() === 1 && MT.heSoGapHoang() === 1);

  // Bản lưu đời trước còn ghi đang cưỡi Tuxemon — phải tự dọn, không thì mở
  // game lên là ngồi trên lưng một con vô hình
  G.p.xe = { co: { xe_den: true }, nghe: { yen: true }, dang: { t: 'thu', slot: 0 } };
  ok('bản lưu cũ còn cưỡi thú thì dọn sạch',
    MT.dangCuoi() === null && G.p.xe.nghe === undefined);
  // Xe bị gỡ khỏi bảng thì cũng tự xuống
  G.p.xe = { co: {}, dang: { t: 'xe', id: 'xe_khong_co_that' } };
  ok('xe không còn trong bảng thì tự xuống',
    MT.kiemTraLai() && MT.dangCuoi() === null);

  // Nước vẫn là tường với mọi người — không còn kiểu bay qua nữa
  {
    const { bake, isSolidAt } = await import('../js/engine/mapbake.js');
    const [mid, m] = Object.entries(MAPS).find(([, x]) => (x.water || []).some(v => v));
    const i = m.water.findIndex(v => v);
    ok('ô nước luôn là ô chặn đường',
      isSolidAt(bake(mid), i % m.w, Math.floor(i / m.w)));
  }
}

// ==== Chế tạo ====
{
  ok('đọc được công thức từ bản gốc', CR.RECIPES.length >= 20, String(CR.RECIPES.length));
  const xauNg = CR.RECIPES.flatMap(r => Object.keys(r.ng)).filter(id => !ITEMS[id]);
  ok('mọi nguyên liệu đều là món có thật', xauNg.length === 0, [...new Set(xauNg)].join(', '));
  const xauOut = CR.RECIPES.flatMap(r => r.out.map(o => o.id)).filter(id => !ITEMS[id]);
  ok('mọi kết quả đều là món có thật', xauOut.length === 0, [...new Set(xauOut)].join(', '));
  ok('công thức nào cũng có ít nhất một kết quả',
    CR.RECIPES.every(r => r.out.length > 0));
  // Nguyên liệu phải có đường kiếm, không thì công thức chỉ để ngắm
  const lieu = Object.keys(ITEMS).filter(id => ITEMS[id].kind === 'lieu');
  ok('nguyên liệu có mặt trong bảng vật phẩm', lieu.length >= 15, String(lieu.length));

  newGame('CraftTester');
  const r = CR.RECIPES[0];
  ok('thiếu nguyên liệu thì không làm được', CR.cheTao(r.id)[1] !== null);
  ok('conThieu liệt kê đúng số loại còn thiếu',
    CR.conThieu(r).length === Object.keys(r.ng).length);

  for (const [id, n] of Object.entries(r.ng)) G.p.bag[id] = n * 2;
  ok('đủ đồ thì báo làm được', CR.lamDuoc(r));
  ok('tính đúng số mẻ làm được', CR.soLanLamDuoc(r) === 2, String(CR.soLanLamDuoc(r)));
  const [kq, err] = CR.cheTao(r.id);
  ok('chế tạo ra một món', !!kq && !err, String(err));
  ok('kết quả vào túi', (G.p.bag[kq.id] || 0) >= kq.n);
  ok('nguyên liệu bị tiêu đi',
    Object.entries(r.ng).every(([id, n]) => (G.p.bag[id] || 0) === n));
  ok('làm mẻ thứ hai xong là hết đồ',
    CR.cheTao(r.id)[1] === null && CR.soLanLamDuoc(r) === 0);

  // Tỉ lệ phải cộng lại ra 100% (làm tròn) để bày cho người chơi
  for (const rr of CR.RECIPES) {
    const t = CR.tiLe(rr).reduce((a, o) => a + o.pc, 0);
    if (Math.abs(t - 100) > 2) { ok(`tỉ lệ công thức ${rr.id} cộng lại ~100%`, false, String(t)); break; }
  }
  ok('tỉ lệ mọi công thức cộng lại ~100%',
    CR.RECIPES.every(rr => Math.abs(CR.tiLe(rr).reduce((a, o) => a + o.pc, 0) - 100) <= 2));
}


// ==== Quà tặng + điểm thân mật ====
{
  const { GIFTS, GIFT_BY_ID, MOC_KET_HON, QUA_MOI_NGAY } = await import('../js/data/gifts.js');
  const { existsSync } = await import('node:fs');

  ok('có đủ loại quà để chọn', GIFTS.length >= 6, `${GIFTS.length} món`);
  ok('id quà không trùng nhau', new Set(GIFTS.map(q => q.id)).size === GIFTS.length);
  ok('quà càng đắt càng nhiều điểm',
    GIFTS.every((q, i) => i === 0
      || (q.price > GIFTS[i - 1].price && q.diem > GIFTS[i - 1].diem)));
  ok('món đắt nhất đủ một mình chạm mốc cưới',
    GIFTS[GIFTS.length - 1].diem >= MOC_KET_HON);
  ok('mốc kết hôn đúng 10.000 điểm như yêu cầu', MOC_KET_HON === 10000);
  ok('có giới hạn số quà tính điểm mỗi ngày', QUA_MOI_NGAY > 0 && QUA_MOI_NGAY <= 50);
  ok('món nào cũng có ảnh trên đĩa',
    GIFTS.every(q => existsSync(new URL('../' + q.img, import.meta.url))),
    GIFTS.filter(q => !existsSync(new URL('../' + q.img, import.meta.url))).map(q => q.id).join(', '));
  ok('tra được quà theo id', GIFT_BY_ID[GIFTS[0].id]?.name === GIFTS[0].name);

  // Bảng của máy chủ phải khớp từng con số với bảng của client
  {
    const sv = await import('../server/src/gifts.data.js');
    ok('bảng quà hai bên khớp nhau',
      sv.MOC_KET_HON === MOC_KET_HON && sv.QUA_MOI_NGAY === QUA_MOI_NGAY
      && sv.GIFTS.length === GIFTS.length
      && sv.GIFTS.every((q, i) => q.id === GIFTS[i].id && q.diem === GIFTS[i].diem
        && q.price === GIFTS[i].price));
  }

  // Cô bán quà phải đứng ở ô đi tới được và không trùng chỗ bác thợ mộc
  {
    const m = MAPS[ES.KHU_DAT_MAP];
    const q = ES.TIEM_QUA;
    ok('cô bán quà đứng trong bản đồ khu dân cư',
      q.x >= 0 && q.y >= 0 && q.x < m.w && q.y < m.h);
    ok('cô bán quà không đứng trùng bác thợ mộc',
      q.x !== ES.THO_MOC.x || q.y !== ES.THO_MOC.y);
    ok('đứng cạnh cô bán quà thì bấm được',
      ES.vatTheODay(ES.KHU_DAT_MAP, q.x, q.y)?.kind === 'tiem-qua');
    ok('có ô trống cạnh cô bán quà để đứng',
      [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) =>
        !m.solid[(q.y + dy) * m.w + (q.x + dx)]));
  }
}

// ==== Boss thế giới + boss khu vực ====
{
  const { BOSSES, BOSS_BY_ID, BOSS_HE_SO } = await import('../js/data/bosses.js');
  const { SPECIES } = await import('../js/data/species.js');

  ok('có boss thế giới', BOSSES.some(b => b.kind === 'the_gioi'));
  ok('có boss riêng cho từng khu', BOSSES.filter(b => b.kind === 'khu').length >= 8,
    String(BOSSES.filter(b => b.kind === 'khu').length));
  ok('id boss không trùng nhau', new Set(BOSSES.map(b => b.id)).size === BOSSES.length);
  ok('boss nào cũng dùng loài có thật',
    BOSSES.every(b => !!SPECIES[b.sp]),
    BOSSES.filter(b => !SPECIES[b.sp]).map(b => b.id).join(', '));
  ok('boss khu nào cũng gắn với một bản đồ có thật',
    BOSSES.filter(b => b.kind === 'khu').every(b => !!MAPS[b.zone]),
    BOSSES.filter(b => b.kind === 'khu' && !MAPS[b.zone]).map(b => b.zone).join(', '));
  ok('boss thế giới trâu hơn boss khu', (() => {
    const tg = Math.min(...BOSSES.filter(b => b.kind === 'the_gioi').map(b => b.hpMax));
    const kv = Math.max(...BOSSES.filter(b => b.kind === 'khu').map(b => b.hpMax));
    return tg > kv;
  })());
  ok('cấp boss nằm trong thang chơi được',
    BOSSES.every(b => b.lv >= 10 && b.lv <= 100));
  // Trần sát thương phải buộc nhiều người cùng đánh mới hạ được
  ok('một mình không hạ nổi boss nào',
    BOSSES.every(b => b.hpMax / b.capMoiLan >= 20),
    BOSSES.filter(b => b.hpMax / b.capMoiLan < 20).map(b => b.id).join(', '));
  ok('hệ số quy đổi sát thương dương', BOSS_HE_SO > 0
    && BOSSES.every(b => b.heSo === BOSS_HE_SO));
  ok('tra được boss theo id', BOSS_BY_ID[BOSSES[0].id]?.name === BOSSES[0].name);
  // Bảng của máy chủ phải khớp từng con số
  {
    const sv = await import('../server/src/boss.data.js');
    ok('bảng boss hai bên khớp nhau',
      sv.BOSSES.length === BOSSES.length
      && sv.BOSSES.every((b, i) => b.id === BOSSES[i].id && b.hpMax === BOSSES[i].hpMax
        && b.capMoiLan === BOSSES[i].capMoiLan && b.sp === BOSSES[i].sp));
  }
  // Dựng thử con boss xem engine có tạo được không
  {
    const b = BOSSES[0];
    const mon = newTuxemon(b.sp, b.lv);
    ok('dựng được con boss bằng engine thường',
      !!mon && mon.lv === b.lv && maxHp(mon) > 0);
    ok('boss có chiêu để đánh', (mon.moves || []).length > 0);
  }
}

// ==== Bang Đường: bản đồ riêng của bang hội ====
{
  const BD = await import('../js/engine/bangduong.js');
  const m = MAPS[BD.BANG_MAP];
  ok('có bản đồ Bang Đường', !!m, BD.BANG_MAP);
  ok('Bang Đường có cổng về khu dân cư',
    (m.warps || []).some(w => w.to === ES.KHU_DAT_MAP));
  ok('từ khu dân cư có cổng vào Bang Đường',
    (MAPS[ES.KHU_DAT_MAP].warps || []).some(w => w.to === BD.BANG_MAP));
  ok('Bang Đường có hai khu khoá theo cấp bang', BD.CUA_KHU.length === 2);
  ok('hai khu mở ở hai mốc cấp khác nhau',
    BD.CUA_KHU[0].cap !== BD.CUA_KHU[1].cap
    && BD.CUA_KHU.every(c => c.cap >= 2));

  // Cửa phải nằm trên ô ĐI ĐƯỢC — khoá là do cấp bang, không phải do tường
  ok('ô cửa không phải tường',
    BD.CUA_KHU.every(c => !m.solid[c.y * m.w + c.x]),
    BD.CUA_KHU.filter(c => m.solid[c.y * m.w + c.x]).map(c => c.id).join(', '));

  // Chưa vào bang: cửa khoá. Đủ cấp: mở.
  BD.datCapBang(0);
  ok('chưa có bang thì cửa khoá',
    BD.CUA_KHU.every(c => BD.khoaODay(BD.BANG_MAP, c.x, c.y)));
  BD.datCapBang(BD.CUA_KHU[0].cap);
  ok('đủ cấp thì cửa tương ứng mở',
    !BD.khoaODay(BD.BANG_MAP, BD.CUA_KHU[0].x, BD.CUA_KHU[0].y));
  ok('cửa cấp cao hơn vẫn khoá',
    BD.khoaODay(BD.BANG_MAP, BD.CUA_KHU[1].x, BD.CUA_KHU[1].y));
  BD.datCapBang(99);
  ok('cấp cao thì mở hết',
    BD.CUA_KHU.every(c => !BD.khoaODay(BD.BANG_MAP, c.x, c.y)));
  ok('bản đồ khác không bị khoá lây',
    !BD.khoaODay('taba_town', BD.CUA_KHU[0].x, BD.CUA_KHU[0].y));

  ok('ô trống thì không bắt được gì', BD.vatBangDuong(BD.BANG_MAP, 1, 1) === null);

  // ==== Ba toà nhà của bang, ngoài và trong đều có người ====
  {
    const { TOA_BANG } = await import('../js/data/estate.js');
    const toa = BD.TOA_NHA;
    ok('bang có nhiều toà nhà', toa.length >= 3, String(toa.length));
    ok('toà nào cũng có ảnh', toa.every(t => !!TOA_BANG[t.id]),
      toa.filter(t => !TOA_BANG[t.id]).map(t => t.id).join(', '));
    ok('toà nào cũng có gian trong riêng',
      toa.every(t => !!MAPS[t.trong])
      && new Set(toa.map(t => t.trong)).size === toa.length);
    ok('thân nhà chặn đường, chỉ chừa ô cửa', toa.every(t => {
      for (let dy = 0; dy < t.h; dy++) {
        for (let dx = 0; dx < t.w; dx++) {
          const x = t.x + dx, y = t.y - dy;
          const cua = (x === t.cua && y === t.y);
          if (!!m.solid[y * m.w + x] === cua) return false;
        }
      }
      return true;
    }));
    ok('cửa toà nào cũng có cổng vào đúng gian trong', toa.every(t =>
      (m.warps || []).some(w => w.x === t.cua && w.y === t.y && w.to === t.trong)));
    ok('gian trong nào cũng có cổng đi ra Bang Đường', toa.every(t =>
      (MAPS[t.trong].warps || []).some(w => w.to === BD.BANG_MAP)));

    // NPC: ngoài sân có người, trong mỗi toà cũng có người
    ok('ngoài sân có NPC', (m.npcs || []).length >= 2, String((m.npcs || []).length));
    ok('trong toà nào cũng có NPC',
      toa.every(t => (MAPS[t.trong].npcs || []).length >= 1));
    ok('NPC nào cũng đứng trên ô đi được', (() => {
      const xau = [];
      for (const mp of [m, ...toa.map(t => MAPS[t.trong])]) {
        for (const n of mp.npcs || []) {
          if (mp.solid[n.y * mp.w + n.x]) xau.push(`${n.name}@${n.x},${n.y}`);
        }
      }
      return xau.length === 0 || xau.join(' ');
    })() === true);

    // Việc của bang phải bấm vào NPC mới làm được
    const viec = toa.flatMap(t => (MAPS[t.trong].npcs || []).filter(n => n.mo));
    ok('có NPC giao nhiệm vụ bang',
      viec.some(n => n.mo === 'guild' && n.tab === 'nhiemvu'),
      viec.map(n => `${n.name}:${n.mo}/${n.tab || ''}`).join(', '));
    ok('có NPC gọi Thủ Hộ để đánh boss bang',
      viec.some(n => n.mo === 'guild' && n.tab === 'boss'));
    ok('NPC làm việc nào cũng có lời thoại',
      viec.every(n => (n.lines || []).length > 0));
    ok('NPC làm việc thì đứng yên, không đi lang thang',
      viec.every(n => n.ai === 'stand'));
    ok('bản đồ không còn bục đá / rương gỗ đứng giữa sân',
      BD.BUC_BOSS === undefined && BD.RUONG_THUONG === undefined);
  }

  // Đi bộ từ cổng phải tới được cửa hai khu, bục boss và rương (khi đã mở cấp)
  {
    const den = new Set();
    const bd = (sx, sy) => {
      den.clear();
      const q = [[sx, sy]];
      den.add(`${sx},${sy}`);
      while (q.length) {
        const [x, y] = q.pop();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
          if (m.solid[ny * m.w + nx]) continue;
          const k = `${nx},${ny}`;
          if (den.has(k)) continue;
          den.add(k); q.push([nx, ny]);
        }
      }
    };
    bd(BD.CONG_RA.x, BD.CONG_RA.y - 1);
    ok('đi bộ từ cổng tới được cả hai cửa khu',
      BD.CUA_KHU.every(c => den.has(`${c.x},${c.y}`)));
    ok('đi bộ từ cổng tới được cửa cả ba toà nhà',
      BD.TOA_NHA.every(t => den.has(`${t.cua},${t.y}`)),
      BD.TOA_NHA.filter(t => !den.has(`${t.cua},${t.y}`)).map(t => t.id).join(', '));
  }

  // Boss bang phải có trong bảng và không lọt vào danh sách boss công khai
  {
    const { BOSSES } = await import('../js/data/bosses.js');
    const bang = BOSSES.filter(b => b.kind === 'bang');
    ok('có boss bang hội', bang.length >= 3);
    ok('boss bang mở dần theo cấp bang',
      bang.every((b, i) => i === 0 || b.capBang > bang[i - 1].capBang));
    ok('boss thường không có mốc cấp bang',
      BOSSES.filter(b => b.kind !== 'bang').every(b => !b.capBang));
  }
}

// ==== Tiền: số trước, ảnh đồng tiền sau ====
{
  const { tien, tienChu, COIN_IMG } = await import('../js/util.js');
  const { existsSync } = await import('node:fs');
  const h = tien(4500);
  ok('tiền dùng ẢNH đồng tiền, không dùng ký hiệu chữ',
    h.includes(COIN_IMG) && !h.includes('$') && !h.includes('₽'), h);
  ok('ảnh đồng tiền nằm SAU con số',
    h.indexOf('4.500') < h.indexOf('<img'), h);
  ok('có ảnh đồng tiền trên đĩa', existsSync(new URL('../' + COIN_IMG, import.meta.url)));
  ok('bản chữ trần không có thẻ HTML nào',
    !/[<>]/.test(tienChu(4500)) && tienChu(4500).includes('4.500'), tienChu(4500));
}

// ==== Phòng trong nhà phải TRỐNG, không đè lên đồ vẽ sẵn ====
{
  const { PHONG_NHA, MAP_NHA_TRO } = await import('../js/data/phongtrong.js');
  const { HOUSE_BASES, FURN_BY_ID } = await import('../js/data/estate.js');

  ok('mẫu nhà nào cũng có phòng riêng',
    HOUSE_BASES.every(b => !!PHONG_NHA[b.id]),
    HOUSE_BASES.filter(b => !PHONG_NHA[b.id]).map(b => b.id).join(', '));
  ok('mỗi mẫu nhà một phòng khác nhau',
    new Set(Object.values(PHONG_NHA)).size === Object.keys(PHONG_NHA).length);
  ok('nhà càng đắt phòng càng rộng', (() => {
    const o = HOUSE_BASES.map(b => MAPS[PHONG_NHA[b.id]]).map(m => m.w * m.h);
    return o.every((n, i) => i === 0 || n > o[i - 1]);
  })());

  for (const [base, mid] of Object.entries(PHONG_NHA)) {
    const m = MAPS[mid];
    // Phòng phải trống: chỉ có hai hàng tường trên cùng là chặn, còn lại đi được
    const chan = m.solid.reduce((a, v) => a + v, 0);
    ok(`phòng ${base} trống, chỉ có tường trên cùng`, chan === m.w * 2,
      `${chan} ô chặn / ${m.w * 2} mong đợi`);
    ok(`phòng ${base} không có NPC hay đồ vẽ sẵn`,
      (m.npcs || []).length === 0 && (m.items || []).length === 0);
    // Chỉ một lớp ô: không có lớp đồ đạc phủ lên nền
    ok(`phòng ${base} chỉ một lớp nền`, m.layers.length === 1 && !m.above);
  }

  // Nhà trọ chung
  const tro = MAPS[MAP_NHA_TRO];
  ok('có bản đồ nhà trọ chung', !!tro);
  const INN = await import('../js/engine/inn.js');
  const giuong = INN.cacGiuong();
  ok('nhà trọ có nhiều giường', giuong.length >= 8, `${giuong.length} giường`);
  ok('giường nào cũng nằm gọn trong phòng',
    giuong.every(g => g.x >= 0 && g.y >= 0 && g.x + 1 < tro.w && g.y + 2 < tro.h));
  ok('giường không đè lên nhau', (() => {
    const o = new Set();
    for (const g of giuong) {
      for (let dy = 0; dy < 2; dy++) {
        const k = `${g.x},${g.y + dy}`;
        if (o.has(k)) return false;
        o.add(k);
      }
    }
    return true;
  })());
  ok('giường không nằm trong tường',
    giuong.every(g => !tro.solid[g.y * tro.w + g.x]));
  ok('món dùng làm giường trọ là món có thật', !!FURN_BY_ID[INN.ID_GIUONG]);
  ok('nhận ra bản đồ nhà trọ', INN.laNhaTro(MAP_NHA_TRO) && !INN.laNhaTro('taba_town'));
  INN.datKhachTro(Array.from({ length: 99 }, (_, i) => ({ username: 'x' + i })));
  ok('số khách trọ không vượt quá số giường còn lại',
    INN.khachTro().length === giuong.length - 1);
  INN.datKhachTro([]);
}

// ==== Mở game lên thì tỉnh dậy ở giường ====
{
  const OW = await import('../js/engine/overworld.js');
  const { MAP_NHA_TRO } = await import('../js/data/phongtrong.js');
  const INN = await import('../js/engine/inn.js');

  // nguDay() chỉ chạy một lần cho mỗi lần mở trang, nên test theo đúng thứ tự đó
  newGame('Người Ngủ');
  const r = OW.nguDay();
  ok('chưa có nhà thì tỉnh dậy ở nhà trọ',
    r?.t === 'tro' && OW.player.mapId === MAP_NHA_TRO, JSON.stringify(r));
  ok('dậy đúng trên giường của mình', (() => {
    const g = INN.giuongCuaToi();
    return Math.floor(OW.player.x) === g.x && Math.floor(OW.player.y) === g.y;
  })());
  ok('nhà trọ có cổng đi ra',
    (MAPS[MAP_NHA_TRO].warps || []).some(w => w.raTro));
  ok('gọi lần hai thì không kéo về nữa', OW.nguDay() === null);
}

// ==== Thăm nhà là VÀO HẲN bản đồ nhà người ta ====
{
  const VS = await import('../js/engine/visit.js');
  const { PHONG_NHA } = await import('../js/data/phongtrong.js');

  ok('chưa thăm ai thì không có gì', !VS.dangTham() && VS.doCuaChu().length === 0);
  const chu = { username: 'HangXom', base: 'nha_ngoi',
    dat: [{ id: 'giuong_do_doi', x: 3, y: 4 }, { id: 'ban_tron', x: 7, y: 6 }] };
  const [cho, err] = VS.vaoNhaNguoiKhac(chu, { map: 'taba_town', x: 10, y: 12 });
  ok('vào được nhà người khác', !err && cho?.map === PHONG_NHA.nha_ngoi, err || '');
  ok('đang thăm thì biết chủ nhà là ai',
    VS.dangTham() && VS.chuNha() === 'HangXom' && VS.doCuaChu().length === 2);
  ok('nhà đang thăm có cổng đi ra về đúng chỗ cũ', (() => {
    const w = (MAPS[cho.map].warps || []).find(x => x.raTham);
    return w && w.to === 'taba_town' && w.tx === 10 && w.ty === 12;
  })());
  // Là khách thì không đụng được vào đồ của chủ nhà
  G.p.estate = { lot: ES.LOTS[0].id, base: 'nha_ngoi', xongLuc: 1, kho: {},
    dat: [{ id: 'giuong_do_doi', x: 3, y: 4 }] };
  ok('khách không bấm được vào đồ trong nhà người ta',
    ES.vatTheODay(PHONG_NHA.nha_ngoi, 3, 4) === null);
  ok('rời nhà thì gỡ sạch cổng tạm', (() => {
    const okRoi = VS.roiNhaNguoiKhac();
    return okRoi && !VS.dangTham()
      && !(MAPS[cho.map].warps || []).some(x => x.raTham);
  })());
  ok('về nhà mình thì lại bấm được đồ',
    ES.vatTheODay(PHONG_NHA.nha_ngoi, 3, 4)?.kind === 'do-noi-that');
  ok('nhà chưa dựng thì không thăm được',
    VS.vaoNhaNguoiKhac({ username: 'A', base: null, dat: [] }, null)[1] !== null);
}

// ==== Nằm giường thì nằm DỌC theo giường ====
// Màn bản đồ chỉ xoay ngang nhân vật khi món nằm rộng hơn cao. Mọi giường
// trong game đều dựng đứng, nên chỉ cần giữ đúng luật đó trong dữ liệu là
// không bao giờ còn cảnh nằm vắt ngang thò cả người ra ngoài giường.
{
  const { FURNITURE } = await import('../js/data/estate.js');
  const nam = FURNITURE.filter(f => f.kind === 'nam');
  ok('có món để nằm', nam.length > 0);
  const ngang = nam.filter(f => f.w > f.h);
  ok('không giường nào nằm ngang', ngang.length === 0,
    ngang.map(f => f.id).join(', '));
  const INN2 = await import('../js/engine/inn.js');
  const g = FURNITURE.find(f => f.id === INN2.ID_GIUONG);
  ok('giường nhà trọ cũng dựng đứng', !!g && g.h >= g.w);
}

// ==== Mỗi ô trong Menu một icon riêng ====
// Trước đây Nhiệm vụ và Chế tạo dùng chung tờ giấy, Nhà trẻ thì mượn dấu cộng
// hồi máu — nhìn vào không biết ô nào là ô nào. Bài này đọc thẳng mã nguồn nên
// không phải dựng DOM chỉ để soi một danh sách.
{
  const { readFileSync, existsSync } = await import('node:fs');
  const src = readFileSync(new URL('../js/ui/menu.js', import.meta.url), 'utf8');
  const ten = [...src.matchAll(/icon:\s*'([a-z_]+)'/g)].map(m => m[1]);
  ok('Menu có đủ ô', ten.length >= 15);
  const trung = ten.filter((x, i) => ten.indexOf(x) !== i);
  ok('không ô Menu nào trùng icon', trung.length === 0, [...new Set(trung)].join(', '));

  // Tên nào khai trong danh sách icon pixel thì phải có tệp thật, không thì
  // uiIcon() trả về chuỗi rỗng và ô hiện ra trống trơn.
  const isrc = readFileSync(new URL('../js/ui/icons.js', import.meta.url), 'utf8');
  const ve = [...isrc.matchAll(/const VE = new Set\(\[([\s\S]*?)\]\)/g)][0]?.[1] || '';
  const dsVe = [...ve.matchAll(/'([a-z_]+)'/g)].map(m => m[1]);
  const thieu = dsVe.filter(n =>
    !existsSync(new URL(`../assets/ui/icon/${n}.png`, import.meta.url)));
  ok('icon pixel nào khai cũng có tệp thật', thieu.length === 0, thieu.join(', '));
}

// ==== Món ăn phải có icon riêng ====
// Bản gốc để CẢ 47 món ăn / nguyên liệu trỏ chung vào gfx/items/box.png, nên
// sau khi chạy mkitems.py là màn Chế Tạo hiện 25 dòng giống hệt nhau.
// tools/mkfood.py vẽ đè lên; bài này canh cho ai chạy lại mkitems.py mà quên
// mkfood.py thì biết ngay.
{
  const { readFileSync, existsSync, readdirSync } = await import('node:fs');
  const { createHash } = await import('node:crypto');
  const { RECIPES } = await import('../js/data/recipes.js');
  const thu = new URL('../assets/items/', import.meta.url);
  const bam = (f) => createHash('md5')
    .update(readFileSync(new URL(f, thu))).digest('hex');

  // Mọi món nhắc tới trong công thức đều phải có ảnh
  const canh = new Set();
  for (const r of RECIPES) {
    Object.keys(r.ng).forEach(id => canh.add(id));
    r.out.forEach(o => canh.add(o.id));
  }
  const thieu = [...canh].filter(id => !existsSync(new URL(`${id}.png`, thu)));
  ok('món nào trong công thức cũng có ảnh', thieu.length === 0, thieu.join(', '));

  // Và không món nào trong đó dùng chung ảnh với món khác
  const theoBam = new Map();
  for (const id of canh) {
    if (thieu.includes(id)) continue;
    const h = bam(`${id}.png`);
    theoBam.set(h, [...(theoBam.get(h) || []), id]);
  }
  const dung_chung = [...theoBam.values()].filter(v => v.length > 1);
  ok('không hai món ăn nào dùng chung một ảnh', dung_chung.length === 0,
    dung_chung.map(v => v.join('=')).join(' | '));
  ok('thư mục vật phẩm không rỗng', readdirSync(new URL(thu)).length > 100);
}

// ==== Nhà trọ có cửa thật, đi ra rồi vào lại được ====
// Lỗi cũ: cổng ra của phòng trọ chỉ thả người chơi xuống chỗ xuất phát của thị
// trấn, không có cửa nào dẫn ngược vào — bấm cửa nào cũng lạc sang nhà người
// khác. Nay mượn cửa Quán Rượu Hải Âu (taba_house4) làm cửa nhà trọ.
{
  const INN = await import('../js/engine/inn.js');
  const cuaO = () => (MAPS[INN.CUA_TRO.map].warps || [])
    .find(w => w.x === INN.CUA_TRO.x && w.y === INN.CUA_TRO.y);
  ok('có sẵn một cái cửa ở chỗ định mượn', !!cuaO());
  const dichGoc = cuaO().to;

  INN.dongBoCuaTro(true);
  INN.camCongNhaTro();
  ok('chưa có nhà thì cửa quán dẫn vào phòng trọ', cuaO().to === INN.MAP_NHA_TRO);
  ok('vào là đứng ngay chỗ chân giường', (() => {
    const c = INN.choDay();
    return cuaO().tx === c.x && cuaO().ty === c.y;
  })());
  const ra = (MAPS[INN.MAP_NHA_TRO].warps || []).find(w => w.raTro);
  ok('phòng trọ có cổng ra về đúng trước cửa quán',
    !!ra && ra.to === INN.CUA_TRO.map
    && ra.tx === INN.CUA_TRO.ra.x && ra.ty === INN.CUA_TRO.ra.y);
  ok('cổng ra nằm trong lòng bản đồ phòng trọ', (() => {
    const m = MAPS[INN.MAP_NHA_TRO];
    return ra.x >= 0 && ra.x < m.w && ra.y >= 0 && ra.y < m.h;
  })());
  // Gọi hai lần thì vẫn chỉ có một cổng ra, không chồng lên nhau
  INN.camCongNhaTro();
  ok('gọi lại không nhân đôi cổng ra',
    (MAPS[INN.MAP_NHA_TRO].warps || []).filter(w => w.raTro).length === 1);

  INN.dongBoCuaTro(false);
  ok('dựng nhà xong thì cửa trả lại quán rượu', cuaO().to === dichGoc);
}

// ==== Bản đồ trong nhà phải có cờ `trong` để soi cửa ra ====
{
  const trong = Object.entries(MAPS).filter(([, m]) => m.trong);
  ok('nhận ra được bản đồ trong nhà', trong.length > 40);
  ok('nhà dân trong Taba là trong nhà', !!MAPS.taba_house1?.trong);
  ok('phòng trọ là trong nhà', !!MAPS.nha_tro?.trong);
  ok('thị trấn KHÔNG phải trong nhà', !MAPS.taba_town?.trong);
  // Trong nhà mà không có cổng nào thì vào là kẹt luôn — trừ mấy phòng nhà
  // riêng, cổng của chúng do engine/estate.js cắm lúc chạy.
  const { PHONG_NHA, MAP_NHA_TRO } = await import('../js/data/phongtrong.js');
  const tuCam = new Set([...Object.values(PHONG_NHA), MAP_NHA_TRO]);
  const ket = trong.filter(([id, m]) => !tuCam.has(id) && !(m.warps || []).length);
  ok('trong nhà nào cũng có lối ra', ket.length === 0, ket.map(([id]) => id).join(', '));
}

// Tổng kết PHẢI nằm cuối tệp. Trước đây nó đứng giữa chừng, nên mọi bài
// thêm về sau nằm sau process.exit() và không bao giờ chạy.
console.log(fails === 0 ? '=== SMOKE OK ===' : `=== ${fails} FAIL ===`);
process.exit(fails === 0 ? 0 : 1);
