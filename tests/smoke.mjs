// PokeWorld H5 | tests/smoke.mjs | Smoke test chạy bằng node (không cần trình duyệt)
// Kiểm tra data + engine: import sạch, số liệu khớp chéo, battle chạy trọn trận.
import { SPECIES } from '../js/data/species.js';
import { MOVES } from '../js/data/moves.js';
import { LEARNSETS } from '../js/data/learnsets.js';
import { EVOLUTIONS } from '../js/data/evolutions.js';
import { ITEMS } from '../js/data/items.js';
import { ZONES } from '../js/data/zones.js';
import { TRAINERS } from '../js/data/trainers.js';
import { QUESTS, DAILY_REWARDS } from '../js/data/quests.js';
import { typeEff, TYPE_VI, TYPE_COLORS, TYPES } from '../js/data/types.js';
import { NATURES, NATURE_LIST } from '../js/data/natures.js';
import { newPokemon, stats, maxHp, isFainted } from '../js/engine/pokemon.js';
import { expForLevel, gainExp } from '../js/engine/exp.js';
import { calcDamage } from '../js/engine/damage.js';
import { attemptCatch } from '../js/engine/catchmon.js';
import { checkEvolution, evolve } from '../js/engine/evolution.js';
import { Battle } from '../js/engine/battle.js';

let fails = 0;
const ok = (name, cond) => {
  console.log((cond ? '[OK] ' : '[FAIL] ') + name);
  if (!cond) fails++;
};

// ==== Data chéo ====
ok('32 species', Object.keys(SPECIES).length >= 32);
ok('45+ moves', Object.keys(MOVES).length >= 45);
ok('18 types VI + màu', TYPES.length === 18 && TYPES.every(t => TYPE_VI[t] && TYPE_COLORS[t]));
ok('25 natures', NATURE_LIST.length === 25 && Object.keys(NATURES).length === 25);

let refErr = 0;
for (const [sp, ls] of Object.entries(LEARNSETS)) {
  if (!SPECIES[sp]) refErr++;
  for (const mv of Object.values(ls)) if (!MOVES[mv]) refErr++;
}
for (const t of Object.values(TRAINERS)) {
  for (const m of t.party) if (!SPECIES[m.sp]) refErr++;
  if (t.rewardItem && !ITEMS[t.rewardItem.id]) refErr++;
}
for (const z of Object.values(ZONES)) {
  for (const e of z.encounters || []) if (!SPECIES[e.sp]) refErr++;
  for (const tr of z.trainers || []) if (!TRAINERS[tr]) refErr++;
  for (const n of z.next || []) if (!ZONES[n]) refErr++;
}
for (const q of Object.values(QUESTS)) {
  for (const it of q.reward?.items || []) if (!ITEMS[it.id]) refErr++;
  if (q.next && !QUESTS[q.next]) refErr++;
  if (q.goal.sp && !SPECIES[q.goal.sp]) refErr++;
  if (q.goal.id && !TRAINERS[q.goal.id]) refErr++;
}
for (const r of DAILY_REWARDS) for (const it of r.items || []) if (!ITEMS[it.id]) refErr++;
for (const [sp, e] of Object.entries(EVOLUTIONS)) {
  if (!SPECIES[sp] || (e && e.into && !SPECIES[e.into])) refErr++;
  if (e && e.item && !ITEMS[e.item]) refErr++;
}
ok('tham chiếu chéo data (0 lỗi)', refErr === 0);

ok('khắc hệ: electric vs rock/ground = 0', typeEff('electric', ['rock', 'ground']) === 0);
ok('khắc hệ: water vs rock/ground = 4', typeEff('water', ['rock', 'ground']) === 4);
ok('khắc hệ: normal vs ghost = 0', typeEff('normal', ['ghost']) === 0);

// ==== Engine ====
const pika = newPokemon(25, 20, { iv: [31, 31, 31, 31, 31, 31], nature: 'jolly' });
const st = stats(pika);
ok('pikachu lv20 stats hợp lý', st.hp > 30 && st.spe > 50);
ok('hpCur = maxHp lúc tạo', pika.hpCur === maxHp(pika));

const char = newPokemon(4, 15);
gainExp(char, expForLevel(SPECIES[4].expCurve, 16) - char.exp + 10);
ok('charmander lên lv16', char.lv >= 16);
const evo = checkEvolution(char, 'level');
ok('đủ điều kiện tiến hóa -> 5', evo === 5);
ok('evolve thành công', evolve(char, evo) && char.sp === 5);

const weak = newPokemon(10, 3);
weak.hpCur = 1;
let caught = false;
for (let i = 0; i < 30 && !caught; i++) caught = attemptCatch(weak, 'ultra_ball').caught;
ok('bắt được caterpie 1hp (30 lần thử)', caught);

const dmg = calcDamage(newPokemon(7, 20), newPokemon(4, 20), 'water_gun', {});
ok('water gun vs charmander: eff 2 hoặc miss', dmg.missed || dmg.eff === 2);

// Trận trọn vẹn
const b = new Battle({
  kind: 'wild',
  sides: [
    { mons: [newPokemon(4, 20)], kind: 'wild' },
    { mons: [newPokemon(1, 20)], kind: 'wild' },
  ],
});
let turns = 0;
while (!b.over && turns < 100) { b.resolve(); turns++; }
ok(`battle kết thúc (${turns} lượt, winner=${b.winner})`, b.over);

// Trận trainer chặn ball/run
const bt = new Battle({
  kind: 'trainer',
  sides: [
    { mons: [newPokemon(25, 20)], kind: 'player' },
    { mons: [newPokemon(74, 18)], kind: 'trainer' },
  ],
});
const [okBall] = bt.submit(0, { t: 'ball', id: 'poke_ball' });
const [okRun] = bt.submit(0, { t: 'run' });
ok('trainer battle chặn ball + run', !okBall && !okRun);

console.log(fails === 0 ? '=== SMOKE OK ===' : `=== ${fails} FAIL ===`);
process.exit(fails === 0 ? 0 : 1);
