// PokeWorld H5 | ui/pvp.js | Đấu PvP theo kiểu "khoá bước": hai máy chạy cùng một engine
//
// Cách hoạt động: máy chủ chỉ phát một hạt ngẫu nhiên chung rồi chuyển tiếp
// hành động qua lại. Hai máy tự tính trận đấu, cùng hạt nên ra cùng kết quả.
// Đánh xong mỗi bên báo người thắng; máy chủ chỉ ghi nhận khi hai bên khớp nhau.
import { G, save } from '../state.js';
import { Battle } from '../engine/battle.js';
import { displayName, maxHp, isFainted } from '../engine/pokemon.js';
import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { esc, sleep, rng, monLocalSrc, monSpriteClass, monUpgradeChain, upgradeImages } from '../util.js';
import { toast, hpBar, typeBadge, statusTag, header } from './kit.js';
import { arenaFor } from '../data/arenas.js';
import { monPx } from '../engine/battlesize.js';
import * as sock from '../net/socket.js';
import { show } from '../main.js';

export function render(el, ctx = {}) {
  const { seed, side, me, opponent } = ctx;
  if (!seed || side === undefined || !me || !opponent) {
    toast('Thiếu dữ liệu trận PvP.');
    show('home');
    return;
  }

  // Cùng hạt + cùng thứ tự bên = hai máy tính ra y hệt nhau
  rng.seed(seed);
  const mySide = side;           // 0 = người thách đấu, 1 = người chấp nhận
  const foeSide = 1 - side;

  // Dựng hai đội đúng thứ tự máy chủ quy định, không phụ thuộc mình là bên nào
  const parties = [];
  parties[mySide] = me.party.map(reviveMon).filter(Boolean);
  parties[foeSide] = opponent.party.map(reviveMon).filter(Boolean);
  if (!parties[0].length || !parties[1].length) {
    toast('Một trong hai đội hình trống.');
    return leave('error');
  }

  const b = new Battle({
    kind: 'pvp',
    sides: [
      { mons: parties[0], kind: 'player' },
      { mons: parties[1], kind: 'player' },
    ],
  });

  let turn = 0;
  let myAction = null;
  let foeAction = null;
  let busy = false;
  let finished = false;

  const arena = arenaFor(G.p.zone);
  el.innerHTML = `
    ${header(`PvP · ${esc(opponent.username)}`)}
    <div class="battle" style="--arena-bg:url(${arena.bg});--base-foe:url(${arena.foe});--base-me:url(${arena.me})">
      <div class="bt-enemy" id="pv-foe"></div>
      <div class="bt-log" id="pv-log"></div>
      <div class="bt-me" id="pv-me"></div>
      <div class="bt-actions" id="pv-act"></div>
    </div>`;

  const $foe = el.querySelector('#pv-foe');
  const $me = el.querySelector('#pv-me');
  const $log = el.querySelector('#pv-log');
  const $act = el.querySelector('#pv-act');

  function log(text) {
    const d = document.createElement('div');
    d.className = 'log-line';
    d.textContent = text;
    $log.appendChild(d);
    while ($log.children.length > 40) $log.firstChild.remove();
    $log.scrollTop = $log.scrollHeight;
  }

  // Pokémon từ máy chủ là dữ liệu thô, dựng lại cho đủ trường engine cần
  function reviveMon(raw) {
    if (!raw || !SPECIES[raw.sp]) return null;
    const m = { ...raw };
    m.moves = (m.moves || []).map(mv => ({ ...mv }));
    if (typeof m.hpCur !== 'number') m.hpCur = maxHp(m);
    return m;
  }

  function panel(mon, whoLabel, back) {
    if (!mon) return '';
    const info = `
      <div class="bt-info">
        <div class="bt-name">${esc(whoLabel)} · ${esc(displayName(mon))} <small>Lv.${mon.lv}</small> ${statusTag(mon.status)}</div>
        <div class="bt-row"><span class="bt-lab">HP</span>${hpBar(mon.hpCur, maxHp(mon))}</div>
      </div>`;
    const img = `
      <img class="bt-sprite ${back ? 'bt-sprite-me' : 'bt-sprite-enemy'} ${monSpriteClass(mon, back)} ${isFainted(mon) ? 'faint' : ''}"
           style="width:min(${monPx(mon)}px, 58vw)"
           src="${monLocalSrc(mon, back)}" data-up="${monUpgradeChain(mon, back)}" alt="">`;
    // Bên mình đứng TRÁI DƯỚI, đối thủ đứng PHẢI TRÊN — giống game Pokémon gốc.
    return back ? img + info : info + img;
  }

  function draw() {
    $foe.innerHTML = panel(b.activeMon(foeSide), opponent.username, false);
    $me.innerHTML = panel(b.activeMon(mySide), 'Bạn', true);
    upgradeImages($foe); upgradeImages($me);
    drawActions();
  }

  function drawActions() {
    if (finished) return;
    const m = b.activeMon(mySide);
    if (!m) { $act.innerHTML = ''; return; }
    const waiting = myAction && !foeAction;
    $act.innerHTML = `
      <div class="move-grid">
        ${m.moves.map((mv, i) => {
          const def = MOVES[mv.id];
          const dis = busy || waiting || mv.pp <= 0;
          return `<button type="button" class="btn move-btn" data-mv="${i}" ${dis ? 'disabled' : ''}>
            <span class="mv-name">${esc(def ? def.name : mv.id)}</span>
            <span class="mv-sub">${def ? typeBadge(def.type) : ''} <small>PP ${mv.pp}/${def ? def.pp : '?'}</small></span>
          </button>`;
        }).join('')}
      </div>
      ${waiting ? '<div class="log-line pv-wait">Đang chờ đối thủ ra đòn...</div>' : ''}
      <div class="bt-subrow">
        <button type="button" class="btn" id="pv-switch" ${busy || waiting ? 'disabled' : ''}>Đổi</button>
        <button type="button" class="btn btn-danger" id="pv-quit">Bỏ cuộc</button>
      </div>`;
    $act.querySelectorAll('.move-btn').forEach(btn =>
      btn.addEventListener('click', () => act({ t: 'move', i: Number(btn.dataset.mv) })));
    $act.querySelector('#pv-switch').addEventListener('click', switchMon);
    $act.querySelector('#pv-quit').addEventListener('click', () => {
      sock.forfeitPvp();
      leave('forfeit');
    });
  }

  async function switchMon() {
    const alive = b.sides[mySide].mons
      .map((m, i) => ({ m, i }))
      .filter(x => !isFainted(x.m) && x.i !== b.sides[mySide].active);
    if (!alive.length) { toast('Không còn Pokémon nào để đổi.'); return; }
    act({ t: 'switch', slot: alive[0].i });
  }

  // Gửi hành động của mình rồi chờ đối thủ
  function act(action) {
    if (busy || finished || myAction) return;
    const [ok, err] = b.submit(mySide, action);
    if (!ok) { toast(err || 'Không dùng được.'); return; }
    myAction = action;
    sock.sendPvpAction({ turn, action });
    drawActions();
    maybeResolve();
  }

  // Nhận hành động của đối thủ
  const offAction = sock.on('pvp:action', (payload) => {
    if (finished || !payload || payload.turn !== turn) return;
    foeAction = payload.action;
    b.submit(foeSide, payload.action);
    maybeResolve();
  });

  const offEnd = sock.on('pvp:end', ({ winner, disputed } = {}) => {
    if (finished) return;
    finished = true;
    if (disputed) log('Hai bên báo kết quả khác nhau — trận không được ghi nhận.');
    else log(winner ? `${winner} thắng!` : 'Trận đấu kết thúc.');
    endScreen(winner, disputed);
  });

  const offErr = sock.on('pvp:error', ({ error } = {}) => {
    toast(error || 'Lỗi PvP.');
    leave('error');
  });

  async function maybeResolve() {
    if (busy || finished || !myAction || !foeAction) return;
    busy = true;
    const out = b.resolve();
    myAction = null; foeAction = null;
    turn += 1;

    for (const e of out.events) {
      if (e.text) log(e.text);
      draw();
      await sleep(420);
    }
    draw();

    if (out.over) {
      finished = true;
      // Bên nào còn Pokémon sống thì bên đó thắng
      const iWon = out.winner === mySide;
      const winnerName = iWon ? me.username : opponent.username;
      log(iWon ? 'Bạn thắng!' : 'Bạn thua.');
      sock.reportPvpResult(winnerName);      // máy chủ đối chiếu với báo cáo của đối thủ
      endScreen(winnerName, false, true);
    }
    busy = false;
    drawActions();
  }

  function endScreen(winner, disputed, waitingServer = false) {
    $act.innerHTML = `
      <div class="card pv-end">
        <b>${disputed ? 'Kết quả không khớp' : winner ? `${esc(winner)} thắng!` : 'Kết thúc'}</b>
        <small>${disputed
          ? 'Máy chủ không ghi nhận trận này.'
          : waitingServer ? 'Đang chờ máy chủ đối chiếu kết quả...' : 'Trận đấu đã được ghi nhận.'}</small>
        <button type="button" class="btn btn-primary btn-big" id="pv-done">Về trang chính</button>
      </div>`;
    $act.querySelector('#pv-done').addEventListener('click', () => leave('done'));
  }

  function leave(why) {
    rng.unseed();                  // trả lại ngẫu nhiên thật cho phần chơi thường
    offAction(); offEnd(); offErr();
    if (why === 'forfeit') toast('Bạn đã bỏ cuộc.');
    save();
    show('home');
  }

  el.addEventListener('screen-leave', () => {
    rng.unseed();
    offAction(); offEnd(); offErr();
    if (!finished) sock.forfeitPvp();
  });

  log(`Trận PvP với ${opponent.username} bắt đầu!`);
  draw();
}
