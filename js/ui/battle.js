// TuxeWorld H5 | ui/battle.js | Màn trận đấu: wild / trainer, phát events tuần tự
import {
  G, save, addToParty, markSeen, markCaught, allFainted, emitQuest,
  removeItem, addMoney, addItem,
} from '../state.js';
import { Battle } from '../engine/battle.js';
import { monImg } from '../engine/monskin.js';
import { newTuxemon, displayName, maxHp, isFainted, replaceMove, heal } from '../engine/monster.js';
import { expProgress } from '../engine/exp.js';
import { checkEvolution, evolve } from '../engine/evolution.js';
import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { ITEMS } from '../data/items.js';
import { TRAINERS } from '../data/trainers.js';
import { monLocalSrc, monSpriteClass, monUpgradeChain, monFallbackAttr, upgradeImages, esc, sleep, fmt } from '../util.js';
import { textDelay, sfx, getSetting, playMusic } from '../engine/settings.js';
import { SFX, MON_CRY } from '../data/sounds.js';
import { fxFor } from '../data/vfx.js';
import { toast, choose, confirmDlg, hpBar, typeBadge, statusTag, itemIcon } from './kit.js';
import { uiIcon, rangeIcon, speedIcon } from './icons.js';
import { emitStory, rivalTeam } from '../engine/story.js';
import { playDialog } from './dialog.js';
import { show } from '../main.js';
import { syncNow } from '../net/session.js';
import { arenaFor } from '../data/arenas.js';
import { addTrainerExp, trainerLevel, trainerExpFor, monLevelCap } from '../engine/player.js';
import { unlockedBetween } from '../engine/unlock.js';
import { monPx } from '../engine/battlesize.js';

// Chương truyện hoàn thành sau trận -> phát thoại kết + báo thưởng
async function storyDone(ch) {
  if (!ch) return;
  if (ch.outro?.length) await playDialog(ch.outro);
  toast(`${ch.title} hoàn thành!`);
}

export function render(el, { kind = 'wild', enemy = null, trainerId = null, from = 'home' } = {}) {
  // ==== Dựng trận ====
  let trainer = null;
  let enemySide;
  if (kind === 'trainer') {
    trainer = TRAINERS[trainerId];
    if (!trainer) { toast('Không tìm thấy trainer!'); show(from); return; }
    // Rival: đội động khắc hệ với starter người chơi (engine/story.js)
    const party = trainer.kind === 'rival' ? rivalTeam(trainerId) : (trainer.party || []);
    const mons = party.map(e =>
      Array.isArray(e) ? newTuxemon(e[0], e[1]) : newTuxemon(e.sp, e.lv, e.opts || {}));
    // Túi thuốc của huấn luyện viên: máy dùng theo luật mods/ai_items.yaml.
    // Đội càng đông thì mang càng nhiều thuốc.
    enemySide = { mons: mons.filter(Boolean), kind: 'trainer',
      bag: trainer.bag ? { ...trainer.bag } : { potion: Math.min(3, mons.length) } };
    for (const m of enemySide.mons) markSeen(m.sp);
  } else {
    if (!enemy) { show(from); return; }
    enemySide = { mons: [enemy], kind: 'wild' };
  }
  const b = new Battle({ kind, sides: [{ mons: G.p.party, kind: 'player' }, enemySide] });

  // ==== State cục bộ ====
  let busy = false;        // đang phát events -> khóa nút
  let ended = false;
  let caught = false;
  const pendingLearns = []; // [{slot, move}] học chiêu khi đã đủ 4 -> hỏi sau trận

  const pIdx = () => b.sides[0].active ?? 0;
  const eIdx = () => b.sides[1].active ?? 0;
  const pMon = () => b.sides[0].mons[pIdx()];
  const eMon = () => b.sides[1].mons[eIdx()];

  // ==== Khung DOM ====
  // Nền trận đấu đổi theo khu vực đang đứng
  const arena = arenaFor(G.p.pos?.map || G.p.zone);
  el.innerHTML = `
    <div class="battle" style="--arena-bg:url(${arena.bg})">
      <div class="bt-enemy" id="bt-enemy"></div>
      <div class="bt-log" id="bt-log"></div>
      <div class="bt-me" id="bt-me"></div>
      <div class="bt-actions" id="bt-actions"></div>
    </div>`;
  const $enemy = el.querySelector('#bt-enemy');
  const $log = el.querySelector('#bt-log');

  // Tiếng kêu riêng của loài: kind 0 = lúc ra trận, 1 = lúc gục.
  // Loài nào bản gốc không ghi tiếng thì trả false để chỗ gọi dùng tiếng chung.
  function keu(mon, kind) {
    const slug = mon && SPECIES[mon.sp]?.slug;
    const c = slug && MON_CRY[slug];
    if (!c || !c[kind]) return false;
    sfx(c[kind]);
    return true;
  }
  const $me = el.querySelector('#bt-me');
  const $act = el.querySelector('#bt-actions');

  function log(text) {
    const d = document.createElement('div');
    d.className = 'log-line';
    // Dòng đánh dấu [+] / [-] thì thay bằng icon thật của bản gốc
    const m = /^\[([+-])\]\s*/.exec(text);
    if (m) {
      const ico = document.createElement('img');
      ico.className = 'pm-ico';
      ico.src = `assets/ui/plusminus/${m[1] === '+' ? 'plus' : 'minus'}.png`;
      ico.alt = m[1];
      d.appendChild(ico);
      d.appendChild(document.createTextNode(text.slice(m[0].length)));
    } else {
      d.textContent = text;
    }
    $log.appendChild(d);
    while ($log.children.length > 40) $log.firstChild.remove();
    $log.scrollTop = $log.scrollHeight;
  }

  // Hiệu ứng chiêu thức: dải ảnh của Tuxemon, chạy bằng CSS steps() đè lên
  // con vừa ăn đòn. Tắt "hiệu ứng chuyển động" trong Cài đặt thì bỏ qua.
  function playFx(side, type, anim) {
    if (!getSetting('motion')) return;
    const host = side === 0 ? $me : $enemy;
    const stage = host?.querySelector('.bt-stage');
    if (!stage) return;
    const fx = fxFor(anim, type);
    const el2 = document.createElement('i');
    el2.className = 'bt-fx';
    // Đường dẫn phải là tuyệt đối: url() nằm trong biến CSS được tính lại theo
    // vị trí của TỆP CSS dùng nó (css/style.css), nên để tương đối là trình
    // duyệt đi tìm css/assets/vfx/... và không bao giờ thấy hiệu ứng nào.
    const fxUrl = new URL(fx.src, document.baseURI).href;
    el2.style.cssText = `--fx:url("${fxUrl}");--fxw:${fx.w}px;--fxh:${fx.h}px;`
      + `--fxn:${fx.frames};width:${fx.w}px;height:${fx.h}px;`;
    stage.appendChild(el2);
    setTimeout(() => el2.remove(), 700);
  }

  // Popup thưởng "+X₽" / "+X EXP" bay lên rồi mờ dần (chỉ trình bày)
  function floatPop(text, cls = '', topPct = 46) {
    const wrap = el.querySelector('.battle');
    if (!wrap) return;
    const d = document.createElement('div');
    d.className = `float-pop ${cls}`;
    d.textContent = text;
    d.style.top = topPct + '%';
    wrap.appendChild(d);
    setTimeout(() => d.remove(), 1500);
  }

  // ==== Vẽ 2 khung ====
  function renderEnemy() {
    const m = eMon();
    if (!m) { $enemy.innerHTML = ''; return; }
    const balls = kind === 'trainer'
      ? `<span class="tr-balls">${b.sides[1].mons.map(x =>
          `<img class="tr-ball" src="assets/ui/party/${
            isFainted(x) ? 'faint' : (x.status ? 'status' : 'alive')}.png" alt="">`).join('')}</span>` : '';
    $enemy.innerHTML = `
      <div class="bt-info">
        <div class="bt-name">${esc(displayName(m))}${m.shiny ? ' <span class="shiny-tag">SHINY</span>' : ''} <small>Lv.${m.lv}</small> ${statusTag(m.status)}</div>
        <div class="bt-row"><span class="bt-lab">HP</span>${hpBar(m.hpCur, maxHp(m))}</div>
        ${balls}
      </div>
      <span class="bt-stage">
        <img class="bt-sprite bt-sprite-enemy ${monSpriteClass(m)} ${isFainted(m) ? 'faint' : ''}"
             style="width:min(${monPx(m)}px, 58vw)"
             src="${monImg(m)}" onerror="${monFallbackAttr(m)}"
             data-up="${monUpgradeChain(m)}" alt="${esc(displayName(m))}">
      </span>`;
    upgradeImages($enemy);
  }

  function renderMe() {
    const m = pMon();
    if (!m) { $me.innerHTML = ''; return; }
    const mx = maxHp(m);
    const [cur, need] = expProgress(m);
    const expPct = Math.min(100, Math.round(cur / Math.max(1, need) * 100));
    $me.innerHTML = `
      <span class="bt-stage">
        <img class="bt-sprite bt-sprite-me ${monSpriteClass(m, true)} ${isFainted(m) ? 'faint' : ''}"
             style="width:min(${monPx(m)}px, 58vw)"
             src="${monImg(m, true)}" onerror="${monFallbackAttr(m, true)}"
             data-up="${monUpgradeChain(m, true)}" alt="${esc(displayName(m))}">
      </span>
      <div class="bt-info">
        <div class="bt-name">${esc(displayName(m))}${m.shiny ? ' <span class="shiny-tag">SHINY</span>' : ''} <small>Lv.${m.lv}</small> ${statusTag(m.status)}</div>
        <div class="bt-row"><span class="bt-lab">HP</span>${hpBar(m.hpCur, mx)}</div>
        <div class="bt-hpnum"><span class="hp-txt">${m.hpCur}/${mx}</span></div>
        <div class="bt-row"><span class="bt-lab">EXP</span><div class="expbar"><div class="expbar-fill" style="width:${expPct}%"></div></div></div>
      </div>`;
    upgradeImages($me);
  }

  // Cập nhật nhanh HP/EXP không vẽ lại (giữ class shake/faint đang chạy)
  function setBar(panel, cur, mx) {
    const fill = panel.querySelector('.hpbar-fill');
    if (!fill) return;
    const pct = Math.max(0, Math.min(100, Math.round(cur / Math.max(1, mx) * 100)));
    fill.style.width = pct + '%';
    fill.className = 'hpbar-fill ' + (pct > 50 ? 'hp-hi' : pct > 20 ? 'hp-mid' : 'hp-lo');
  }
  function updateBars() {
    const em = eMon();
    if (em) setBar($enemy, em.hpCur, maxHp(em));
    const m = pMon();
    if (m) {
      const mx = maxHp(m);
      setBar($me, m.hpCur, mx);
      const t = $me.querySelector('.hp-txt');
      if (t) t.textContent = `${m.hpCur}/${mx}`;
      const xf = $me.querySelector('.expbar-fill');
      if (xf) {
        const [cur, need] = expProgress(m);
        xf.style.width = Math.min(100, Math.round(cur / Math.max(1, need) * 100)) + '%';
      }
    }
  }

  function renderActions() {
    if (ended) return;
    const m = pMon();
    if (!m) return;
    $act.innerHTML = `
      <div class="move-grid">
        ${m.moves.map((mv, i) => {
          const def = MOVES[mv.id];
          const dis = busy || (mv.cd || 0) > 0;
          return `<button class="btn move-btn" data-mv="${i}" ${dis ? 'disabled' : ''}>
            <span class="mv-name">${esc(def ? def.name : mv.id)}</span>
            <span class="mv-sub">${def ? typeBadge(def.types[0]) : ''}${
              def ? rangeIcon(def.range) : ''}${def ? speedIcon(def.speed) : ''}</span>
            <small class="mv-cd">${(mv.cd || 0) > 0
              ? `Chờ ${mv.cd} lượt` : `Hồi ${def ? def.recharge : 0} lượt`}</small>
          </button>`;
        }).join('')}
      </div>
      ${m.moves.every(mv => (mv.cd || 0) > 0) ? `
        <button class="btn btn-primary" id="bt-struggle" ${busy ? 'disabled' : ''}>
          Gắng sức <small>(chiêu nào cũng đang hồi)</small></button>` : ''}
      <div class="bt-subrow">
        <button class="btn" id="bt-bag" ${busy ? 'disabled' : ''}>Túi</button>
        <button class="btn" id="bt-switch" ${busy ? 'disabled' : ''}>Đổi</button>
        ${kind === 'wild' ? `<button class="btn" id="bt-run" ${busy ? 'disabled' : ''}>Chạy</button>` : ''}
      </div>`;
    $act.querySelectorAll('.move-btn').forEach(btn =>
      btn.addEventListener('click', () => playerAct({ t: 'move', i: Number(btn.dataset.mv) })));
    const gs = $act.querySelector('#bt-struggle');
    if (gs) gs.addEventListener('click', () => playerAct({ t: 'struggle' }));
    $act.querySelector('#bt-bag').addEventListener('click', openBag);
    $act.querySelector('#bt-switch').addEventListener('click', openSwitch);
    const run = $act.querySelector('#bt-run');
    if (run) run.addEventListener('click', () => playerAct({ t: 'run' }));
  }

  function updateAll() { renderEnemy(); renderMe(); renderActions(); }

  // ==== Menu phụ ====
  async function openBag() {
    if (busy || ended) return;
    const ids = Object.keys(G.p.bag).filter(id => {
      const it = ITEMS[id];
      return it && it.inBattle && G.p.bag[id] > 0;
    });
    if (!ids.length) { toast('Không có vật phẩm dùng được trong trận!'); return; }
    const i = await choose('Túi đồ', ids.map(id => {
      const it = ITEMS[id];
      return { html: `${itemIcon(id, '', 22)} ${esc(it.name)} ×${G.p.bag[id]}`, label: `${it.name} ×${G.p.bag[id]}`, sub: it.desc || '' };
    }));
    if (i === null || busy || ended) return;
    const id = ids[i];
    if (ITEMS[id].kind === 'ball') {
      if (kind !== 'wild') { toast('Không thể bắt Tuxemon của trainer khác!'); return; }
      await playerAct({ t: 'ball', id });
    } else {
      const j = await choose('Dùng cho ai?', G.p.party.map(m =>
        ({ label: `${displayName(m)} Lv.${m.lv}`, sub: `HP ${m.hpCur}/${maxHp(m)}${m.status ? ' · ' + m.status : ''}` })));
      if (j === null || busy || ended) return;
      await playerAct({ t: 'item', id, targetSlot: j });
    }
  }

  async function openSwitch() {
    if (busy || ended) return;
    const act = pIdx();
    const i = await choose('Đổi Tuxemon', G.p.party.map((m, idx) => ({
      label: `${displayName(m)} Lv.${m.lv}`,
      sub: `HP ${m.hpCur}/${maxHp(m)}${idx === act ? ' · đang ra trận' : ''}`,
      disabled: isFainted(m) || idx === act,
    })));
    if (i === null || busy || ended) return;
    await playerAct({ t: 'switch', slot: i });
  }

  async function forceSwitch() {
    const i = await choose('Chọn Tuxemon ra trận!', G.p.party.map(m => ({
      label: `${displayName(m)} Lv.${m.lv}`,
      sub: `HP ${m.hpCur}/${maxHp(m)}`,
      disabled: isFainted(m),
    })), { cancelable: false });
    const [ok, err] = b.submit(0, { t: 'switch', slot: i });
    if (!ok) toast(err || 'Không hợp lệ');
    return ok;
  }

  // ==== Vòng lượt ====
  async function playerAct(action) {
    if (busy || ended) return;
    const [ok, err] = b.submit(0, action);
    if (!ok) { toast(err || 'Không thực hiện được!'); return; }
    // Trừ item khỏi túi khi action hợp lệ (engine không đụng vào bag)
    if (action.t === 'item' || action.t === 'ball') removeItem(action.id, 1);
    busy = true;
    renderActions();
    let winner = null;
    let over = false;
    let guard = 0;
    while (guard++ < 30) {
      if (!b.ready()) {
        if (b.sides[0].mustSwitch) { await forceSwitch(); continue; }
        break; // chờ input khác (không nên xảy ra)
      }
      const res = b.resolve();
      await playEvents(res.events || []);
      if (res.over) { over = true; winner = res.winner; break; }
      if (b.sides[0].mustSwitch) { await forceSwitch(); continue; }
      break;
    }
    if (ended) return;
    if (over || caught || ranAway) {
      await endBattle(winner);
      return;
    }
    busy = false;
    updateAll();
  }
  let ranAway = false;

  // ==== Phát events tuần tự ====
  async function playEvents(events) {
    for (const ev of events) {
      switch (ev.t) {
        case 'msg':
          log(ev.text);
          await sleep(textDelay(550));
          break;
        case 'dmg': {
          // Mỗi chiêu có tiếng riêng ghi sẵn bên bản gốc; không có thì lấy
          // tiếng theo hệ, cuối cùng mới tới tiếng đánh chung.
          sfx(ev.sfx || (ev.moveType && SFX[ev.moveType] ? ev.moveType
            : ev.eff > 1 ? 'hit_strong' : ev.eff < 1 ? 'hit_weak' : 'hit'));
          playFx(ev.side, ev.moveType, ev.anim);
          const spr = ev.side === 0 ? $me.querySelector('.bt-sprite') : $enemy.querySelector('.bt-sprite');
          if (spr) { spr.classList.remove('shake'); void spr.offsetWidth; spr.classList.add('shake'); }
          updateBars();
          await sleep(textDelay(520));
          break;
        }
        case 'refund':
          // Bóng loại nhặt lại được: trả về túi
          addItem(ev.id, 1);
          break;
        case 'heal':
          sfx('heal');
          playFx(ev.side, 'heal');
          updateBars();
          await sleep(textDelay(380));
          break;
        case 'faint': {
          const spr = ev.side === 0 ? $me.querySelector('.bt-sprite') : $enemy.querySelector('.bt-sprite');
          // Mỗi loài có tiếng gục riêng (db/monster của bản gốc)
          keu(b.sides[ev.side].mons[ev.slot], 1) || sfx('faint');
          if (spr) spr.classList.add('faint');
          updateBars();
          await sleep(textDelay(680));
          break;
        }
        case 'sendOut':
          if (ev.side === 0) renderMe(); else renderEnemy();
          keu(b.sides[ev.side].mons[ev.slot], 0);
          await sleep(textDelay(420));
          break;
        case 'exp':
          if (ev.amount) { sfx('coin'); floatPop(`+${fmt(ev.amount)} EXP`, 'exp', 58); }
          updateBars();
          if (ev.levels && ev.levels > 0) { sfx('levelup'); renderMe(); }
          await sleep(textDelay(320));
          break;
        case 'learn':
          if (ev.side === 0 && ev.full) pendingLearns.push({ slot: ev.slot, move: ev.move });
          await sleep(textDelay(150));
          break;
        case 'catch':
          await playCatch(ev);
          break;
        case 'run':
          if (ev.ok) ranAway = true;
          await sleep(350);
          break;
        case 'end':
          // Thắng thì nhạc khải hoàn, thua thì nhạc buồn — bản gốc cũng đổi
          // nhạc theo kết quả (db/environment: victory_music / defeat_music).
          playMusic(ev.winner === 0 ? 'win' : 'lose');
          break;
      }
    }
  }

  // Animation quả bóng bắt
  async function playCatch(ev) {
    sfx('throw');
    const spr = $enemy.querySelector('.bt-sprite');
    if (spr) spr.classList.add('hidden');
    const ball = document.createElement('div');
    ball.className = 'ball-anim';
    ball.textContent = '';
    $enemy.appendChild(ball);
    await sleep(350);
    const shakes = ev.shakes ?? 0;
    for (let i = 0; i < shakes; i++) {
      ball.classList.remove('ballshake'); void ball.offsetWidth; ball.classList.add('ballshake');
      await sleep(620);
    }
    if (ev.caught) {
      caught = true;
      sfx('catch');
      ball.classList.add('caught');
      log(ev.crit ? 'Bắt được! (Bắt chí mạng!)' : 'Bắt được!');
      await sleep(750);
    } else {
      ball.remove();
      if (spr) spr.classList.remove('hidden');
      log('Ôi không! Nó thoát ra mất!');
      await sleep(500);
    }
  }

  function questToasts(list) {
    for (const { quest } of list || []) toast(`Hoàn thành: ${quest.name}`);
  }

  // ==== Kết thúc trận ====
  async function endBattle(winner) {
    ended = true;
    busy = true;

    if (kind === 'wild' && caught && b.caughtMon) {
      const mon = b.caughtMon;
      const where = addToParty(mon);
      markCaught(mon.sp);
      if (where === 'box') toast('Đội đã đầy — chuyển vào Box!');
      else if (where === null) toast('Box cũng đầy! Không giữ được...');
      G.p.stats.catches++;
      const done = [];
      done.push(...emitQuest('catch_any', { sp: mon.sp }));
      done.push(...emitQuest('catch_species', { sp: mon.sp }));
      done.push(...emitQuest('catch_count', {}));
      questToasts(done);
    } else if (winner === 0) {
      if (kind === 'trainer' && trainer) {
        log(`${trainer.name}: "${trainer.lose || 'Thua rồi...'}"`);
        await sleep(500);
        if (!G.p.defeatedTrainers[trainerId]) {
          G.p.defeatedTrainers[trainerId] = true;
          if (trainer.rewardMoney) {
            addMoney(trainer.rewardMoney);
            floatPop(`+${fmt(trainer.rewardMoney)}₽`, '', 40);
            log(`Nhận ${fmt(trainer.rewardMoney)}₽ tiền thưởng!`);
          }
          if (trainer.rewardItem) {
            const rid = typeof trainer.rewardItem === 'string' ? trainer.rewardItem : trainer.rewardItem.id;
            const rn = typeof trainer.rewardItem === 'object' ? (trainer.rewardItem.n || 1) : 1;
            addItem(rid, rn);
            log(`Nhận ${ITEMS[rid] ? ITEMS[rid].name : rid} ×${rn}!`);
          }
          if (trainer.kind === 'gym' && trainer.badge) {
            if (!G.p.badges.includes(trainer.badge)) {
              G.p.badges.push(trainer.badge);
              toast(`Nhận huy hiệu ${trainer.badgeName || ''}!`);
              questToasts(emitQuest('earn_badge', { id: trainer.badge }));
              await storyDone(emitStory('earn_badge', { id: trainer.badge }));
            }
          }
          questToasts(emitQuest('defeat_trainer', { id: trainerId }));
          await storyDone(emitStory('defeat_trainer', { id: trainerId }));
        } else {
          log('Bạn lại thắng! (không có thưởng thêm)');
        }
        G.p.stats.wins++;
        questToasts(emitQuest('win_battles', {}));
      } else if (kind === 'wild') {
        G.p.stats.wins++;
        questToasts(emitQuest('win_battles', {}));
      }
      grantTrainerRewards();
      capNote();
    } else if (allFainted()) {
      // Thua trận
      G.p.zone = 'taba_town';
      for (const m of G.p.party) heal(m);
      const lost = Math.floor(G.p.money * 0.05);
      G.p.money -= lost;
      log('Cả đội đã gục hết...');
      toast(`Bạn tỉnh dậy ở thị trấn. Mất ${fmt(lost)}₽ viện phí.`);
    }

    // Hỏi thay chiêu khi đã đủ 4 chiêu
    for (const { slot, move } of pendingLearns) {
      const mon = b.sides[0].mons[slot];
      if (!mon) continue;
      const def = MOVES[move];
      const opts = mon.moves.map(mv => ({
        label: MOVES[mv.id] ? MOVES[mv.id].name : mv.id,
        sub: `Hồi ${MOVES[mv.id] ? MOVES[mv.id].recharge : 0} lượt`,
      }));
      opts.push({ label: 'Không học' });
      const idx = await choose(
        `${displayName(mon)} muốn học ${def ? def.name : move}. Quên chiêu nào?`, opts, { cancelable: false });
      if (idx !== null && idx < mon.moves.length) {
        replaceMove(mon, idx, move);
        toast(`Đã học ${def ? def.name : move}!`);
      }
    }

    // Tiến hóa sau trận
    for (const m of G.p.party) {
      const dex = checkEvolution(m, 'level');
      if (!dex) continue;
      const to = SPECIES[dex];
      const ok = await confirmDlg(`${displayName(m)} muốn tiến hóa thành ${to ? to.name : '?'}!`, 'Tiến hóa!');
      if (ok) {
        evolve(m, dex);
        markCaught(m.sp);
        toast(`Tiến hóa thành ${SPECIES[m.sp] ? SPECIES[m.sp].name : '?'}!`);
      }
    }

    save();
    syncNow();          // đẩy kết quả lên máy chủ ngay cho bảng xếp hạng khỏi trễ
    updateBars();
    $act.innerHTML = `<button class="btn btn-primary btn-big" id="bt-cont">Tiếp tục</button>`;
    // Đánh xong thì quay lại đúng nơi vừa rời đi (bản đồ hoặc màn chính)
    $act.querySelector('#bt-cont').addEventListener('click', () => show(from));
  }

  // Thắng trận thì huấn luyện viên cũng lên kinh nghiệm, thỉnh thoảng nhặt được
  // vật phẩm rơi ra (trước đây là trang bị — đã bỏ hệ thống đó).
  // Chạm trần cấp thì nói rõ, không thì người chơi thấy exp vào nhỏ giọt mà
  // không hiểu vì sao.
  function capNote() {
    const cap = monLevelCap();
    if ((pMon()?.lv || 0) >= cap) log(`Đã chạm trần Lv.${cap} — lên cấp Trainer để nuôi tiếp.`);
  }

  function grantTrainerRewards() {
    const lv = Math.max(1, eMon()?.lv || 5);
    const before = trainerLevel();
    const gained = addTrainerExp(trainerExpFor(kind, lv));
    if (gained.length) {
      const now = gained[gained.length - 1];
      toast(`Trainer lên Lv.${now}!`);
      // Lên cấp mà mở được tính năng mới thì phải báo, không thì người chơi
      // chẳng biết vừa có thêm cái gì.
      for (const f of unlockedBetween(before, now)) toast(`Mở khoá: ${f.name}! ${f.note}.`, 3200);
    }
    if (Math.random() < 0.18) {
      const pool = ['tuxeball', 'potion', 'restoration'];
      const id = pool[Math.floor(Math.random() * pool.length)];
      addItem(id, 1);
      toast(`Nhặt được ${ITEMS[id].name}!`);
    }
  }

  // ==== Mở màn ====
  updateAll();
  if (kind === 'trainer' && trainer) {
    log(`${trainer.name} muốn thách đấu!`);
    // Lời khiêu chiến kèm ảnh 2D của huấn luyện viên
    if (trainer.intro) {
      playDialog([[{ name: trainer.name, img: trainer.sprite }, trainer.intro]]);
    }
  } else {
    const m = eMon();
    log(`Một ${displayName(m)} hoang dã${m.shiny ? ' (Shiny)' : ''} xuất hiện!`);
    keu(m, 0);
  }
}
