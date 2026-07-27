// PokeWorld H5 | engine/idle.js | Vòng lặp idle: tự đánh quái, tự kiếm tiền/EXP, offline gains
import { G, save, markSeen, markCaught, addMoney, addToParty, emitQuest, allFainted } from '../state.js';
import { newPokemon, stats, maxHp, heal, isFainted, displayName, addEv, tryLearn } from './pokemon.js';
import { gainExp, expYield, movesAtLevel } from './exp.js';
import { calcDamage } from './damage.js';
import { attemptCatch } from './catchmon.js';
import { checkEvolution, evolve } from './evolution.js';
import { emitStory } from './story.js';
import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { ZONES } from '../data/zones.js';
import { typeEff } from '../data/types.js';
import { rng } from '../util.js';

export const TICK_MS = 1400;
const REST_MS = 12000;          // cả đội gục -> nghỉ hồi sức
const OFFLINE_CAP_MIN = 480;    // offline tối đa 8 giờ
const KILLS_PER_MIN = 5;        // ước lượng tốc độ farm cho offline

const idle = {
  timer: null,
  wild: null,          // mon hoang hiện tại
  resting: 0,          // timestamp hết nghỉ
  listeners: new Set(),
};

// UI đăng ký nhận event: {t:'appear'|'hit'|'hurt'|'ko'|'faint'|'rest'|'wake'|'catch'|'evolve'|'learn'|'levelup', ...}
export function onIdle(fn) { idle.listeners.add(fn); return () => idle.listeners.delete(fn); }
function emit(ev) { for (const fn of idle.listeners) { try { fn(ev); } catch (e) { console.warn(e); } } }

export function currentWild() { return idle.wild; }
export function isRunning() { return !!idle.timer; }
export function isResting() { return Date.now() < idle.resting; }

// Con đang ra trận = con đầu tiên còn sống
export function activeMon() {
  return G.p.party.find(m => !isFainted(m)) || null;
}

// Chiêu tốt nhất của attacker vs defender (idle không trừ PP cho đỡ vặt)
function bestMove(att, def) {
  let best = null, bestScore = -1;
  for (const mv of att.moves) {
    const def_ = MOVES[mv.id];
    if (!def_ || !def_.power) continue;
    const score = def_.power * typeEff(def_.type, SPECIES[def.sp].types);
    if (score > bestScore) { bestScore = score; best = mv.id; }
  }
  return best || 'tackle';
}

// Tiền rơi khi hạ 1 con
function moneyFor(mon) {
  const base = SPECIES[mon.sp]?.baseExp || 60;
  return Math.max(5, Math.round(base * mon.lv / 12));
}

function spawnWild() {
  const zone = ZONES[G.p.zone];
  if (!zone || !zone.encounters?.length) return null;
  const e = rng.weighted(zone.encounters);
  const mon = newPokemon(e.sp, rng.int(e.min, e.max));
  if (mon) markSeen(e.sp);
  return mon;
}

function tick() {
  if (!G.p) return;
  // Đang nghỉ hồi sức
  if (isResting()) return;
  const me = activeMon();
  if (!me) {
    // Cả đội gục -> nghỉ rồi tự hồi
    idle.resting = Date.now() + REST_MS;
    emit({ t: 'rest', ms: REST_MS });
    setTimeout(() => {
      if (!G.p) return;
      G.p.party.forEach(m => heal(m));
      save();
      emit({ t: 'wake' });
    }, REST_MS);
    return;
  }
  // Chưa có quái -> xuất hiện
  if (!idle.wild) {
    idle.wild = spawnWild();
    if (idle.wild) emit({ t: 'appear', mon: idle.wild });
    return;
  }
  const wild = idle.wild;

  // Mình đánh trước
  const mvId = bestMove(me, wild);
  const r = calcDamage(me, wild, mvId, {});
  if (!r.missed && r.dmg > 0) wild.hpCur = Math.max(0, wild.hpCur - r.dmg);
  emit({ t: 'hit', move: MOVES[mvId]?.name || mvId, dmg: r.dmg, crit: r.crit, eff: r.eff, missed: r.missed, wild });

  if (isFainted(wild)) {
    const money = moneyFor(wild);
    addMoney(money);
    const exp = expYield(wild, 1);
    const levels = gainExp(me, exp);
    addEv(me, SPECIES[wild.sp].evYield);
    G.p.stats.wins = (G.p.stats.wins || 0) + 1;
    emitQuest('win_battles', {});
    emit({ t: 'ko', name: displayName(wild), money, exp, levels });
    // Học chiêu mới ở level mới (tự học nếu còn slot; đầy thì bỏ qua trong idle)
    for (const lv of levels) {
      emit({ t: 'levelup', lv });
      for (const m of movesAtLevel(me.sp, lv)) {
        if (tryLearn(me, m) === 'learned') emit({ t: 'learn', move: MOVES[m]?.name || m });
      }
    }
    // Tiến hóa tự động trong idle (đúng chất treo máy)
    const evoTo = levels.length ? checkEvolution(me, 'level') : null;
    if (evoTo) {
      const oldName = displayName(me);
      if (evolve(me, evoTo)) emit({ t: 'evolve', from: oldName, to: displayName(me) });
    }
    idle.wild = null;
    save();
    return;
  }

  // Quái đánh trả (giảm 40% sát thương — idle thân thiện với treo máy)
  const wMv = bestMove(wild, me);
  const wr = calcDamage(wild, me, wMv, {});
  wr.dmg = Math.floor(wr.dmg * 0.6);
  if (!wr.missed && wr.dmg > 0) me.hpCur = Math.max(0, me.hpCur - wr.dmg);
  emit({ t: 'hurt', move: MOVES[wMv]?.name || wMv, dmg: wr.dmg, missed: wr.missed, me });
  if (isFainted(me)) {
    emit({ t: 'faint', name: displayName(me) });
    save();
  }
}

export function startIdle() {
  if (idle.timer) return;
  idle.timer = setInterval(tick, TICK_MS);
  tick();
}
export function stopIdle() {
  if (idle.timer) { clearInterval(idle.timer); idle.timer = null; }
}

// Ném bóng bắt con hoang hiện tại. Trả về kết quả hoặc null nếu không có quái.
export function throwBall(ballId) {
  const wild = idle.wild;
  if (!wild) return null;
  const res = attemptCatch(wild, ballId);
  if (res.caught) {
    wild.ball = ballId;
    const dest = addToParty(wild);
    markCaught(wild.sp);
    G.p.stats.catches = (G.p.stats.catches || 0) + 1;
    const doneQ = [
      ...emitQuest('catch_any', { sp: wild.sp }),
      ...emitQuest('catch_species', { sp: wild.sp }),
      ...emitQuest('catch_count', {}),
    ];
    const chDone = emitStory('catch_count', {});
    idle.wild = null;
    save();
    emit({ t: 'catch', caught: true, mon: wild, dest, doneQ, chDone });
  } else {
    emit({ t: 'catch', caught: false, shakes: res.shakes });
  }
  return res;
}

// ==== Offline gains ====
// Gọi lúc boot: tính thu nhập khi vắng mặt. Trả về {min, money, exp, levels} hoặc null.
export function claimOffline() {
  if (!G.p) return null;
  const now = Date.now();
  const last = G.p.idleLast || now;
  G.p.idleLast = now;
  const min = Math.min(OFFLINE_CAP_MIN, Math.floor((now - last) / 60000));
  if (min < 2) { save(); return null; }
  const zone = ZONES[G.p.zone];
  const me = activeMon();
  if (!zone?.encounters?.length || !me) { save(); return null; }
  // Ước lượng phần thưởng trung bình của zone
  let avgMoney = 0, avgExp = 0;
  for (const e of zone.encounters) {
    const lv = (e.min + e.max) / 2;
    const base = SPECIES[e.sp]?.baseExp || 60;
    avgMoney += Math.round(base * lv / 12);
    avgExp += Math.round(base * lv / 7);
  }
  avgMoney = Math.round(avgMoney / zone.encounters.length);
  avgExp = Math.round(avgExp / zone.encounters.length);
  const kills = min * KILLS_PER_MIN;
  const money = kills * avgMoney;
  const exp = Math.round(kills * avgExp * 0.6); // offline kém hiệu quả hơn online chút
  addMoney(money);
  const levels = gainExp(me, exp);
  save();
  return { min, money, exp, levels, kills };
}

// Đánh dấu mốc thời gian định kỳ để offline tính đúng (gọi từ vòng tick UI hoặc interval riêng)
export function touchIdleClock() {
  if (G.p) { G.p.idleLast = Date.now(); }
}
setInterval(() => { touchIdleClock(); if (G.p) save(); }, 30000);
