// PokeWorld H5 | ui/home.js | Màn chính dạng IDLE: tự đánh quái, tiền/EXP tự chảy
import { G, save, allFainted, emitQuest } from '../state.js';
import { heal, displayName, maxHp, isFainted } from '../engine/pokemon.js';
import { expProgress } from '../engine/exp.js';
import {
  startIdle, stopIdle, onIdle, currentWild, activeMon, throwBall, claimOffline, isResting,
  isPaused, togglePause, fleeWild,
} from '../engine/idle.js';
import { currentChapter, needIntro, markIntroSeen, emitStory, zoneLockedBy, storyProgress } from '../engine/story.js';
import { playDialog } from './dialog.js';
import { ZONES } from '../data/zones.js';
import { TRAINERS } from '../data/trainers.js';
import { ITEMS } from '../data/items.js';
import { SPECIES } from '../data/species.js';
import { esc, fmt, monSprite, animSprite, spriteUrl, boxIcon, monBoxIcon, upgradeImages } from '../util.js';
import { toast, choose, hpBar, itemIcon, artUrl } from './kit.js';

// Icon đại diện zone: ưu tiên sprite item, sau đó artwork Pokémon, cuối cùng bỏ trống
function zoneIcon(z, size = 22) {
  if (!z) return '';
  if (z.iconItem) return itemIcon(z.iconItem, '', size);
  if (z.iconSp) return `<span class="zone-ico"><img class="px-icon" src="${boxIcon(z.iconSp)}" width="${size}" height="${size}" alt=""
    data-up="${artUrl(z.iconSp)}|${spriteUrl(z.iconSp)}"></span>`;
  return '';
}
import { show, refresh } from '../main.js';

let offlineClaimed = false; // chỉ nhận offline 1 lần mỗi phiên
let unsub = null;
// Khóa chống phát trùng cutscene: refresh() lồng nhau từng tạo 2 hộp thoại chồng lên nhau
let introBusy = false;
let introTimer = null;

// Chương hoàn thành -> phát thoại kết + báo thưởng
async function chapterDone(ch) {
  if (!ch) return;
  if (ch.outro?.length) await playDialog(ch.outro);
  const parts = [];
  if (ch.reward?.money) parts.push(`${fmt(ch.reward.money)}₽`);
  for (const it of ch.reward?.items || []) parts.push(`${ITEMS[it.id]?.name || it.id} x${it.n}`);
  toast(`${ch.title} hoàn thành!${parts.length ? ' Nhận: ' + parts.join(', ') : ''}`);
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
      <div class="zone-chip">${zoneIcon(zone, 22)} <b>${esc(zone.name)}</b></div>
      <span class="money-chip">${itemIcon('nugget', '', 18)} <b id="money-val">${fmt(G.p.money)}</b>₽</span>
    </div>

    ${ch ? `
    <button class="card story-card" id="btn-story">
      <span class="story-badge">${itemIcon('fame_checker', '', 18)} ${prog.done}/${prog.total}</span>
      <span class="story-body"><b>${esc(ch.title)}</b><small>${esc(ch.desc)}</small></span>
      ${needIntro() ? '<span class="story-new" title="Mới"></span>' : ''}
    </button>` : (prog.finished ? `<div class="card story-card done"><img src="assets/img/crown.png" class="crown-ico" alt="" onerror="this.style.visibility='hidden'"> Đã phá đảo cốt truyện — tiếp tục hoàn thành Pokédex!</div>` : '')}

    ${isTown ? `
    <div class="town-wrap card">
      <p class="town-note">Trong thị trấn yên bình không có Pokémon hoang. Hãy ra các tuyến đường để farm!</p>
      <div class="town-btns">
        <button class="btn" id="btn-center">${itemIcon('full_restore', '', 22)} Hồi phục đội</button>
        <button class="btn" id="btn-shop">${itemIcon('coin_case', '', 22)} Cửa hàng</button>
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
      <button class="btn btn-primary" id="btn-ball">${itemIcon('poke_ball', '', 22)} Ném bóng</button>
      <button class="btn" id="btn-flee">${itemIcon('escape_rope', '', 22)} Bỏ chạy</button>
    </div>

    <div class="idle-controls">
      <button class="btn" id="btn-heal-item">${itemIcon('potion', '', 22)} Hồi máu</button>
      <button class="btn" id="btn-pause">${itemIcon('poke_flute', '', 22)} <span id="pause-lab">${isPaused() ? 'Tiếp tục' : 'Tạm dừng'}</span></button>
    </div>`}

    <div class="idle-controls">
      <button class="btn" id="btn-world">${itemIcon('town_map', '', 22)} Đi bộ</button>
      <button class="btn" id="btn-travel">${itemIcon('bicycle', '', 22)} Di chuyển</button>
      <button class="btn" id="btn-trainers">${itemIcon('vs_seeker', '', 22)} Trainer ${zone.trainers?.length ? `(${zone.trainers.length})` : ''}</button>
    </div>
  `;
  upgradeImages(el);

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

  // ==== VFX: hiệu ứng hình ảnh trong đấu trường ====
  const arenaEl = () => el.querySelector('#arena');

  // Lớp hiệu ứng dùng 1 lần rồi tự dọn
  function spawnFx(cls, ms = 600, target = null) {
    const host = target || arenaEl();
    if (!host) return null;
    const d = document.createElement('div');
    d.className = 'fx ' + cls;
    host.appendChild(d);
    setTimeout(() => d.remove(), ms);
    return d;
  }

  // Vệt chém + chớp sáng, mạnh hơn khi khắc hệ
  function vfxSlash(eff = 1) {
    const cls = eff > 1 ? 'fx-slash fx-super' : eff < 1 && eff > 0 ? 'fx-slash fx-weak' : 'fx-slash';
    spawnFx(cls, 500);
    if (eff > 1) spawnFx('fx-flash', 320);
  }
  // Chớp đỏ khi mình bị đánh
  function vfxHurtFlash() { spawnFx('fx-hurt', 380); }
  // Vòng sáng khi quái xuất hiện
  function vfxAppear() { spawnFx('fx-appear', 700); }
  // Sprite lao lên rồi về chỗ
  function vfxLunge(sel) {
    const s = el.querySelector(sel);
    if (!s) return;
    s.classList.remove('lunge'); void s.offsetWidth; s.classList.add('lunge');
  }

  // Trạng thái "đang đi tìm" giữa hai lần gặp
  function setSearching(left) {
    if (!wildSlot) return;
    const box = wildSlot.querySelector('.searching');
    if (box) box.textContent = 'Đang tìm Pokémon' + '.'.repeat(3 - Math.min(2, left));
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
      <img class="wild-sprite px-icon" src="${monBoxIcon(w)}" alt=""
           data-up="${animSprite(w)}|${monSprite(w)}">`;
    upgradeImages(wildSlot);
  }

  function drawMe() {
    if (!mePanel) return;
    const m = activeMon();
    if (!m) {
      mePanel.innerHTML = `<div class="me-rest">Cả đội đang nghỉ hồi sức...</div>`;
      return;
    }
    const mx = maxHp(m);
    const [cur, need] = expProgress(m);
    mePanel.innerHTML = `
      <img class="me-sprite px-icon" src="${monBoxIcon(m)}" alt=""
           data-up="${animSprite(m, true)}|${monSprite(m, true)}">
      <div class="me-info">
        <div class="me-name">${esc(displayName(m))} <b class="me-lv">Lv.${m.lv}</b></div>
        <div class="bar-label">HP ${m.hpCur}/${mx}</div>
        ${hpBar(m.hpCur, mx)}
        <div class="expbar"><div class="expbar-fill" style="width:${Math.min(100, Math.round(cur / Math.max(1, need) * 100))}%"></div></div>
      </div>`;
    upgradeImages(mePanel);
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
      toast(`Vắng mặt ${off.min} phút: +${fmt(off.money)}₽, +${fmt(off.exp)} EXP${off.levels.length ? `, lên Lv.${off.levels[off.levels.length - 1]}` : ''}!`, 4200);
    }
  }

  // ==== Subscribe idle events ====
  if (unsub) unsub();
  unsub = onIdle(ev => {
    if (moneyVal) moneyVal.textContent = fmt(G.p.money);
    switch (ev.t) {
      case 'search': setSearching(ev.left); break;
      case 'appear': drawWild(); popEmote('alert'); vfxAppear(); log(`Một ${displayName(ev.mon)} Lv.${ev.mon.lv} hoang dã xuất hiện!`, 'log-hl'); break;
      case 'hit': {
        updateWildHp();
        const spr = wildSlot?.querySelector('.wild-sprite');
        if (spr && ev.dmg > 0) {
          spr.classList.remove('shake'); void spr.offsetWidth; spr.classList.add('shake');
          vfxSlash(ev.eff);                     // vệt chém + chớp sáng theo độ khắc hệ
          pop(`-${ev.dmg}`, ev.crit ? 'pop-crit' : 'pop-dmg');
          if (ev.crit) log('Đòn chí mạng!', 'log-hl');
        }
        vfxLunge('.me-sprite');                 // Pokémon của mình lao lên đánh
        if (ev.missed) log(`${ev.move} đánh trượt!`);
        break;
      }
      case 'hurt': {
        drawMe();
        if (ev.dmg > 0) {
          const mine = mePanel?.querySelector('.me-sprite');
          if (mine) { mine.classList.remove('shake'); void mine.offsetWidth; mine.classList.add('shake'); }
          vfxHurtFlash();
        }
        break;
      }
      case 'flee': log(`Đã bỏ chạy khỏi ${ev.name}.`); drawWild(); break;
      case 'paused': log('Đã tạm dừng tự đánh.', 'log-hl'); break;
      case 'resumed': log('Tiếp tục tự đánh.', 'log-hl'); break;
      case 'ko':
        pop(`+${fmt(ev.money)}₽`);
        if (ev.exp) pop(`+${ev.exp} EXP`, 'pop-exp');
        log(`Hạ ${ev.name}! +${fmt(ev.money)}₽`, 'log-money');
        drawMe(); drawWild();
        break;
      case 'levelup': popEmote('note'); log(`Lên cấp ${ev.lv}!`, 'log-hl'); drawMe(); break;
      case 'learn': log(`Học chiêu mới: ${ev.move}!`, 'log-hl'); break;
      case 'evolve': log(`${ev.from} tiến hóa thành ${ev.to}!`, 'log-hl'); toast(`${ev.from} tiến hóa thành ${ev.to}!`); drawMe(); break;
      case 'faint': log(`${ev.name} đã gục!`); drawMe(); break;
      case 'rest': log('Cả đội gục — nghỉ hồi sức 12 giây...'); drawMe(); break;
      case 'wake': log('Đội đã hồi phục, tiếp tục chiến đấu!', 'log-hl'); drawMe(); break;
      case 'catch':
        if (ev.caught) {
          popEmote('heart');
          log(`Bắt được ${displayName(ev.mon)}!${ev.dest === 'box' ? ' (chuyển vào Box)' : ''}`, 'log-hl');
          toast(`Bắt được ${displayName(ev.mon)}!`);
          (ev.doneQ || []).forEach(({ quest }) => toast(`Hoàn thành: ${quest.name}`));
          if (ev.chDone) chapterDone(ev.chDone);
          drawWild();
        } else {
          popEmote('question');
          log(`Bóng lắc ${ev.shakes} lần... nó thoát ra!`);
        }
        break;
    }
  });

  drawMe();
  drawWild();

  // Idle chỉ chạy ngoài thị trấn
  if (isTown) stopIdle(); else startIdle();

  // ==== Cốt truyện ====
  // Xem thoại mở đầu chương: dừng idle -> phát thoại -> ghi nhận tiến trình
  async function playChapterIntro() {
    if (introBusy || !ch || !needIntro()) return;
    introBusy = true;
    try {
      stopIdle();
      await playDialog(ch.dialog);
      markIntroSeen();
      // Chương có mục tiêu hoàn thành ngay khi xem thoại (vd ch1: đã chọn starter)
      const done = emitStory('choose_starter', {});
      if (done) await chapterDone(done);
      if (!isTown) startIdle();
    } finally {
      introBusy = false;
    }
    refresh();
  }

  const btnStory = el.querySelector('#btn-story');
  if (btnStory && ch) btnStory.addEventListener('click', () => {
    if (needIntro()) playChapterIntro();
    else toast(ch.desc);
  });

  // Chương mới -> cutscene tự chạy như game gốc (không bắt người chơi tự đi tìm nút).
  // Hủy lịch cũ trước khi đặt lịch mới để mỗi lần render chỉ còn đúng 1 hàng chờ.
  clearTimeout(introTimer);
  if (ch && needIntro() && !introBusy) introTimer = setTimeout(playChapterIntro, 350);

  // ==== Ném bóng ====
  const btnBall = el.querySelector('#btn-ball');
  if (btnBall) btnBall.addEventListener('click', async () => {
    if (!currentWild()) { toast('Chưa có Pokémon hoang nào!'); return; }
    const balls = Object.entries(G.p.bag).filter(([id]) => ITEMS[id]?.kind === 'ball');
    if (!balls.length) { toast('Hết bóng! Mua thêm ở cửa hàng thị trấn.'); return; }
    const i = await choose('Chọn bóng', balls.map(([id, n]) => ({
      html: `${itemIcon(id, '', 26)} ${ITEMS[id].name} x${n}`,
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
  // ==== Bỏ chạy khỏi con đang gặp ====
  const btnFlee = el.querySelector('#btn-flee');
  if (btnFlee) btnFlee.addEventListener('click', () => {
    const r = fleeWild();
    if (!r.ok) toast(r.error);
  });

  // ==== Tạm dừng / tiếp tục tự đánh ====
  const btnPause = el.querySelector('#btn-pause');
  if (btnPause) btnPause.addEventListener('click', () => {
    const paused = togglePause();
    const lab = el.querySelector('#pause-lab');
    if (lab) lab.textContent = paused ? 'Tiếp tục' : 'Tạm dừng';
    btnPause.classList.toggle('btn-primary', paused);
  });

  const btnHealItem = el.querySelector('#btn-heal-item');
  if (btnHealItem) btnHealItem.addEventListener('click', async () => {
    const meds = Object.entries(G.p.bag).filter(([id]) => ITEMS[id]?.kind === 'medicine' && ITEMS[id].effect?.heal);
    if (!meds.length) { toast('Hết thuốc hồi máu!'); return; }
    const m = activeMon();
    if (!m) { toast('Không có Pokémon nào cần hồi!'); return; }
    const i = await choose(`Dùng thuốc cho ${displayName(m)}`, meds.map(([id, n]) => ({
      html: `${itemIcon(id, '', 26)} ${ITEMS[id].name} x${n}`,
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
    toast(`Đã hồi máu cho ${displayName(m)}!`);
  });

  // ==== Thị trấn ====
  const btnCenter = el.querySelector('#btn-center');
  if (btnCenter) btnCenter.addEventListener('click', () => {
    G.p.party.forEach(m => heal(m));
    save();
    toast('Cả đội đã hồi phục hoàn toàn!');
  });
  const btnShop = el.querySelector('#btn-shop');
  if (btnShop) btnShop.addEventListener('click', () => { stopIdle(); show('shop'); });

  // ==== Mở bản đồ đi bộ (joystick) ====
  const btnWorld = el.querySelector('#btn-world');
  if (btnWorld) btnWorld.addEventListener('click', () => { stopIdle(); show('world'); });

  // ==== Di chuyển (kèm khóa cốt truyện) ====
  el.querySelector('#btn-travel').addEventListener('click', async () => {
    const opts = (zone.next || []).map(zid => {
      const z = ZONES[zid];
      const lock = zoneLockedBy(zid);
      return {
        html: `${zoneIcon(z, 24)} ${esc(z.name)}`,
        label: z.name,
        sub: lock ? `Cần hoàn thành ${lock.title}` : z.desc,
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
    emitQuest('reach_zone', { zone: zid }).forEach(({ quest }) => toast(`Hoàn thành: ${quest.name}`));
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
      const face = t.sprite ? `<img class="tr-face" src="assets/trainers/${t.sprite}.png" alt="" onerror="this.remove()"> ` : '';
      return {
        html: `${face}${esc(t.name)}${won ? ' <span class="won-pill">ĐÃ THẮNG</span>' : ''}`,
        label: `${t.name}${won ? ' (đã thắng)' : ''}`,
        sub: t.kind === 'gym' ? `Gym — Huy hiệu ${t.badgeName || ''}` : (t.rewardMoney ? `Thưởng ${fmt(t.rewardMoney)}₽` : ''),
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
