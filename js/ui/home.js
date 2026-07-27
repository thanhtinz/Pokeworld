// PokeWorld H5 | ui/home.js | Màn chính dạng IDLE: tự đánh quái, tiền/EXP tự chảy
import { G, save, allFainted, emitQuest } from '../state.js';
import { heal, displayName, maxHp, isFainted } from '../engine/pokemon.js';
import { expProgress } from '../engine/exp.js';
import { startIdle, stopIdle, onIdle, currentWild, activeMon, throwBall, claimOffline, isResting } from '../engine/idle.js';
import { currentChapter, needIntro, markIntroSeen, emitStory, zoneLockedBy, storyProgress } from '../engine/story.js';
import { playDialog } from './dialog.js';
import { ZONES } from '../data/zones.js';
import { TRAINERS } from '../data/trainers.js';
import { ITEMS } from '../data/items.js';
import { SPECIES } from '../data/species.js';
import { esc, fmt, monSprite, animSprite } from '../util.js';
import { toast, choose, hpBar, itemIcon } from './kit.js';
import { show, refresh } from '../main.js';

let offlineClaimed = false; // chỉ nhận offline 1 lần mỗi phiên
let unsub = null;

// Chương hoàn thành -> phát thoại kết + báo thưởng
async function chapterDone(ch) {
  if (!ch) return;
  if (ch.outro?.length) await playDialog(ch.outro);
  const parts = [];
  if (ch.reward?.money) parts.push(`${fmt(ch.reward.money)}₽`);
  for (const it of ch.reward?.items || []) parts.push(`${ITEMS[it.id]?.name || it.id} x${it.n}`);
  toast(`🏆 ${ch.title} hoàn thành!${parts.length ? ' Nhận: ' + parts.join(', ') : ''}`);
  refresh();
}

export function render(el) {
  const zone = ZONES[G.p.zone] || ZONES.town_1;
  const isTown = !(zone.encounters?.length);
  const ch = currentChapter();
  const prog = storyProgress();
  const me = activeMon();

  el.innerHTML = `
    <div class="idle-top">
      <div class="zone-chip">${zone.icon || '📍'} <b>${esc(zone.name)}</b></div>
      <span class="money-chip">${itemIcon('nugget', '💰', 18)} <b id="money-val">${fmt(G.p.money)}</b>₽</span>
    </div>

    ${ch ? `
    <button class="card story-card" id="btn-story">
      <span class="story-badge">📖 ${prog.done}/${prog.total}</span>
      <span class="story-body"><b>${esc(ch.title)}</b><small>${esc(ch.desc)}</small></span>
      ${needIntro() ? '<span class="story-new">▶</span>' : ''}
    </button>` : (prog.finished ? `<div class="card story-card done"><img src="assets/img/crown.png" class="crown-ico" alt="👑"> Đã phá đảo cốt truyện — tiếp tục hoàn thành Pokédex!</div>` : '')}

    ${isTown ? `
    <div class="town-wrap card">
      <p class="town-note">🏘️ Trong thị trấn yên bình không có Pokémon hoang. Hãy ra các tuyến đường để farm!</p>
      <div class="town-btns">
        <button class="btn" id="btn-center">${itemIcon('full_restore', '🏥', 22)} Hồi phục đội</button>
        <button class="btn" id="btn-shop">${itemIcon('coin_case', '🛒', 22)} Cửa hàng</button>
      </div>
    </div>` : `
    <div class="arena" id="arena">
      <div class="arena-wild" id="wild-slot">
        <div class="searching">Đang tìm Pokémon<span class="dots">...</span></div>
      </div>
      <div class="arena-pop" id="pop-layer"></div>
    </div>

    <div class="me-panel card" id="me-panel"></div>

    <div class="idle-log" id="idle-log"></div>

    <div class="idle-controls">
      <button class="btn btn-primary" id="btn-ball">${itemIcon('poke_ball', '⚪', 22)} Ném bóng</button>
      <button class="btn" id="btn-heal-item">${itemIcon('potion', '🧪', 22)} Hồi máu</button>
    </div>`}

    <div class="idle-controls">
      <button class="btn" id="btn-travel">${itemIcon('town_map', '🗺️', 22)} Di chuyển</button>
      <button class="btn" id="btn-trainers">${itemIcon('vs_seeker', '⚔️', 22)} Trainer ${zone.trainers?.length ? `(${zone.trainers.length})` : ''}</button>
    </div>
  `;

  const logEl = el.querySelector('#idle-log');
  const wildSlot = el.querySelector('#wild-slot');
  const popLayer = el.querySelector('#pop-layer');
  const mePanel = el.querySelector('#me-panel');
  const moneyVal = el.querySelector('#money-val');

  function log(text, cls = '') {
    if (!logEl) return;
    const d = document.createElement('div');
    d.className = 'log-line ' + cls;
    d.textContent = text;
    logEl.prepend(d);
    while (logEl.children.length > 5) logEl.lastChild.remove();
  }

  function pop(text, cls = 'pop-money') {
    if (!popLayer) return;
    const d = document.createElement('div');
    d.className = 'float-pop ' + cls;
    d.textContent = text;
    d.style.left = (30 + Math.random() * 40) + '%';
    popLayer.appendChild(d);
    setTimeout(() => d.remove(), 1600);
  }

  // Emote PMD bay lên trong arena (tim khi bắt được, nốt nhạc khi lên cấp...)
  function popEmote(name) {
    if (!popLayer) return;
    const d = document.createElement('img');
    d.className = 'float-pop pop-emote';
    d.src = `assets/img/emote_${name}.png`;
    d.style.left = (38 + Math.random() * 24) + '%';
    d.onerror = () => d.remove();
    popLayer.appendChild(d);
    setTimeout(() => d.remove(), 1600);
  }

  function drawWild() {
    if (!wildSlot) return;
    const w = currentWild();
    if (!w) {
      wildSlot.innerHTML = `<div class="searching">Đang tìm Pokémon<span class="dots">...</span></div>`;
      return;
    }
    const mx = maxHp(w);
    wildSlot.innerHTML = `
      <div class="wild-info">
        <span class="wild-name">${esc(displayName(w))}</span>
        <span class="wild-lv">Lv.${w.lv}</span>
        ${hpBar(w.hpCur, mx)}
      </div>
      <img class="wild-sprite" src="${animSprite(w)}" alt=""
           onerror="this.onerror=null;this.src='${monSprite(w)}'">`;
  }

  function drawMe() {
    if (!mePanel) return;
    const m = activeMon();
    if (!m) {
      mePanel.innerHTML = `<div class="me-rest">😴 Cả đội đang nghỉ hồi sức...</div>`;
      return;
    }
    const mx = maxHp(m);
    const [cur, need] = expProgress(m);
    mePanel.innerHTML = `
      <img class="me-sprite" src="${animSprite(m, true)}" alt=""
           onerror="this.onerror=null;this.src='${monSprite(m, true)}'">
      <div class="me-info">
        <div class="me-name">${esc(displayName(m))} <b class="me-lv">Lv.${m.lv}</b></div>
        <div class="bar-label">HP ${m.hpCur}/${mx}</div>
        ${hpBar(m.hpCur, mx)}
        <div class="expbar"><div class="expbar-fill" style="width:${Math.min(100, Math.round(cur / Math.max(1, need) * 100))}%"></div></div>
      </div>`;
  }

  function updateWildHp() {
    const w = currentWild();
    if (!w || !wildSlot) return;
    const fill = wildSlot.querySelector('.hpbar-fill');
    if (fill) {
      const pct = Math.max(0, Math.round(w.hpCur / Math.max(1, maxHp(w)) * 100));
      fill.style.width = pct + '%';
      fill.className = 'hpbar-fill ' + (pct > 50 ? 'hp-hi' : pct > 20 ? 'hp-mid' : 'hp-lo');
    }
  }

  // ==== Nhận offline gains (1 lần mỗi phiên) ====
  if (!offlineClaimed) {
    offlineClaimed = true;
    const off = claimOffline();
    if (off) {
      toast(`⏰ Vắng mặt ${off.min} phút: +${fmt(off.money)}₽, +${fmt(off.exp)} EXP${off.levels.length ? `, lên Lv.${off.levels[off.levels.length - 1]}` : ''}!`, 4200);
    }
  }

  // ==== Subscribe idle events ====
  if (unsub) unsub();
  unsub = onIdle(ev => {
    if (moneyVal) moneyVal.textContent = fmt(G.p.money);
    switch (ev.t) {
      case 'appear': drawWild(); popEmote('alert'); log(`Một ${displayName(ev.mon)} Lv.${ev.mon.lv} hoang dã xuất hiện!`, 'log-hl'); break;
      case 'hit': {
        updateWildHp();
        const spr = wildSlot?.querySelector('.wild-sprite');
        if (spr && ev.dmg > 0) { spr.classList.remove('shake'); void spr.offsetWidth; spr.classList.add('shake'); }
        if (ev.missed) log(`${ev.move} đánh trượt!`);
        break;
      }
      case 'hurt': drawMe(); break;
      case 'ko':
        pop(`+${fmt(ev.money)}₽`);
        if (ev.exp) pop(`+${ev.exp} EXP`, 'pop-exp');
        log(`Hạ ${ev.name}! +${fmt(ev.money)}₽`, 'log-money');
        drawMe(); drawWild();
        break;
      case 'levelup': popEmote('note'); log(`⬆️ Lên cấp ${ev.lv}!`, 'log-hl'); drawMe(); break;
      case 'learn': log(`✨ Học chiêu mới: ${ev.move}!`, 'log-hl'); break;
      case 'evolve': log(`🌟 ${ev.from} tiến hóa thành ${ev.to}!`, 'log-hl'); toast(`🌟 ${ev.from} tiến hóa thành ${ev.to}!`); drawMe(); break;
      case 'faint': log(`💥 ${ev.name} đã gục!`); drawMe(); break;
      case 'rest': log('😴 Cả đội gục — nghỉ hồi sức 12 giây...'); drawMe(); break;
      case 'wake': log('💖 Đội đã hồi phục, tiếp tục chiến đấu!', 'log-hl'); drawMe(); break;
      case 'catch':
        if (ev.caught) {
          popEmote('heart');
          log(`🎉 Bắt được ${displayName(ev.mon)}!${ev.dest === 'box' ? ' (chuyển vào Box)' : ''}`, 'log-hl');
          toast(`🎉 Bắt được ${displayName(ev.mon)}!`);
          (ev.doneQ || []).forEach(({ quest }) => toast(`🎉 Hoàn thành: ${quest.name}`));
          if (ev.chDone) chapterDone(ev.chDone);
          drawWild();
        } else {
          popEmote('question');
          log(`⚪ Bóng lắc ${ev.shakes} lần... nó thoát ra!`);
        }
        break;
    }
  });

  drawMe();
  drawWild();

  // Idle chỉ chạy ngoài thị trấn
  if (isTown) stopIdle(); else startIdle();

  // ==== Cốt truyện ====
  const btnStory = el.querySelector('#btn-story');
  if (btnStory && ch) btnStory.addEventListener('click', async () => {
    if (needIntro()) {
      stopIdle();
      await playDialog(ch.dialog);
      markIntroSeen();
      // Chương goal đặc biệt hoàn thành ngay khi xem thoại (vd ch1 chọn starter đã xong)
      const done = emitStory('choose_starter', {});
      if (done) { await chapterDone(done); }
      if (!isTown) startIdle();
      refresh();
    } else {
      toast(ch.desc);
    }
  });

  // ==== Ném bóng ====
  const btnBall = el.querySelector('#btn-ball');
  if (btnBall) btnBall.addEventListener('click', async () => {
    if (!currentWild()) { toast('Chưa có Pokémon hoang nào!'); return; }
    const balls = Object.entries(G.p.bag).filter(([id]) => ITEMS[id]?.kind === 'ball');
    if (!balls.length) { toast('Hết bóng! Mua thêm ở cửa hàng thị trấn.'); return; }
    const i = await choose('Chọn bóng', balls.map(([id, n]) => ({
      html: `${itemIcon(id, ITEMS[id].icon || '⚪')} ${ITEMS[id].name} x${n}`,
      label: `${ITEMS[id].name} x${n}`,
      sub: `x${(ITEMS[id].ballMult || 1).toFixed(1)} tỉ lệ bắt`,
    })));
    if (i === null) return;
    const [ballId] = balls[i];
    if (!currentWild()) { toast('Nó chạy mất rồi!'); return; }
    G.p.bag[ballId] -= 1;
    if (G.p.bag[ballId] <= 0) delete G.p.bag[ballId];
    save();
    throwBall(ballId);
  });

  // ==== Hồi máu nhanh bằng thuốc ====
  const btnHealItem = el.querySelector('#btn-heal-item');
  if (btnHealItem) btnHealItem.addEventListener('click', async () => {
    const meds = Object.entries(G.p.bag).filter(([id]) => ITEMS[id]?.kind === 'medicine' && ITEMS[id].effect?.heal);
    if (!meds.length) { toast('Hết thuốc hồi máu!'); return; }
    const m = activeMon();
    if (!m) { toast('Không có Pokémon nào cần hồi!'); return; }
    const i = await choose(`Dùng thuốc cho ${displayName(m)}`, meds.map(([id, n]) => ({
      html: `${itemIcon(id, ITEMS[id].icon || '🧪')} ${ITEMS[id].name} x${n}`,
      label: `${ITEMS[id].name} x${n}`, sub: ITEMS[id].desc,
    })));
    if (i === null) return;
    const [itemId] = meds[i];
    const effectHeal = ITEMS[itemId].effect.heal;
    const mx = maxHp(m);
    m.hpCur = Math.min(mx, m.hpCur + (effectHeal === 'full' ? mx : effectHeal));
    G.p.bag[itemId] -= 1;
    if (G.p.bag[itemId] <= 0) delete G.p.bag[itemId];
    save();
    drawMe();
    toast(`💊 Đã hồi máu cho ${displayName(m)}!`);
  });

  // ==== Thị trấn ====
  const btnCenter = el.querySelector('#btn-center');
  if (btnCenter) btnCenter.addEventListener('click', () => {
    G.p.party.forEach(m => heal(m));
    save();
    toast('💖 Cả đội đã hồi phục hoàn toàn!');
  });
  const btnShop = el.querySelector('#btn-shop');
  if (btnShop) btnShop.addEventListener('click', () => { stopIdle(); show('shop'); });

  // ==== Di chuyển (kèm khóa cốt truyện) ====
  el.querySelector('#btn-travel').addEventListener('click', async () => {
    const opts = (zone.next || []).map(zid => {
      const z = ZONES[zid];
      const lock = zoneLockedBy(zid);
      return {
        label: `${z.icon || '📍'} ${z.name}`,
        sub: lock ? `🔒 Cần hoàn thành ${lock.title}` : z.desc,
        disabled: !!lock,
        zid,
      };
    });
    if (!opts.length) { toast('Không có đường đi nào!'); return; }
    const i = await choose('Đi đâu?', opts);
    if (i === null) return;
    const zid = opts[i].zid;
    G.p.zone = zid;
    save();
    emitQuest('reach_zone', { zone: zid }).forEach(({ quest }) => toast(`🎉 Hoàn thành: ${quest.name}`));
    refresh();
  });

  // ==== Trainer trong zone (trận đánh tay) ====
  el.querySelector('#btn-trainers').addEventListener('click', async () => {
    const ids = zone.trainers || [];
    // Trainer cốt truyện xuất hiện khi đúng chương
    const storyIds = [];
    if (ch && ch.goal?.t === 'defeat_trainer' && TRAINERS[ch.goal.id] && !needIntro()) {
      const t = TRAINERS[ch.goal.id];
      if ((t.zone || G.p.zone) === G.p.zone && !ids.includes(ch.goal.id)) storyIds.push(ch.goal.id);
    }
    const all = [...storyIds, ...ids];
    if (!all.length) { toast('Không có trainer nào ở đây.'); return; }
    const opts = all.map(tid => {
      const t = TRAINERS[tid];
      const won = !!G.p.defeatedTrainers[tid];
      const story = t.story && !won;
      return {
        label: `${t.kind === 'gym' ? '🏛️' : story ? '📖' : '🧢'} ${t.name}${won ? ' ✓' : ''}`,
        sub: t.kind === 'gym' ? `Gym — 🏅 ${t.badgeName || ''}` : (t.rewardMoney ? `Thưởng ${fmt(t.rewardMoney)}₽` : ''),
        tid,
      };
    });
    const i = await choose('Thách đấu ai?', opts);
    if (i === null) return;
    if (allFainted()) { toast('Cả đội đã gục, hồi phục trước đã!'); return; }
    const tid = opts[i].tid;
    const t = TRAINERS[tid];
    stopIdle();
    await playDialog([[t.kind === 'gym' ? 'sys' : t.kind === 'rocket' ? 'rocket' : t.kind === 'rival' ? 'rival' : 'sys',
      `${t.name}: "${t.intro || 'Đấu nào!'}"`]]);
    show('battle', { kind: 'trainer', trainerId: tid });
  });
}
