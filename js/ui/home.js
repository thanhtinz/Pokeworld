// PokeWorld H5 | ui/home.js | Màn bản đồ / khám phá (màn chính)
import { G, save, markSeen, allFainted, emitQuest } from '../state.js';
import { newPokemon, heal, displayName } from '../engine/pokemon.js';
import { ZONES } from '../data/zones.js';
import { TRAINERS } from '../data/trainers.js';
import { rng, esc, fmt } from '../util.js';
import { toast, choose } from './kit.js';
import { show, refresh } from '../main.js';

export function render(el) {
  const zone = ZONES[G.p.zone] || ZONES.town_1 || Object.values(ZONES)[0];
  const fainted = allFainted();
  const hasEnc = Array.isArray(zone.encounters) && zone.encounters.length > 0;
  const trainerIds = zone.trainers || [];

  el.innerHTML = `
    <div class="home-head card">
      <div class="home-zone">
        <span class="zone-ico">${zone.icon || '📍'}</span>
        <div>
          <h1>${esc(zone.name)}</h1>
          <p class="zone-desc">${esc(zone.desc || '')}</p>
        </div>
      </div>
      <div class="home-money"><span class="money-chip">💰 <b>${fmt(G.p.money)}₽</b></span> <button class="btn-mini" data-goto="quest">📜 Nhiệm vụ</button></div>
    </div>

    ${fainted ? `<div class="card warn-card">😵 Cả đội đã gục! Hãy về thị trấn để hồi phục ở Trung tâm Pokémon.</div>` : ''}

    <div class="home-actions">
      ${hasEnc
        ? `<button class="btn btn-primary btn-big" id="btn-grass" ${fainted ? 'disabled' : ''}>🍃 Vào bụi cỏ</button>`
        : `<button class="btn btn-primary btn-big" id="btn-center">🏥 Trung tâm Pokémon</button>
           <button class="btn btn-big" id="btn-shop">🛒 Cửa hàng</button>`}
    </div>

    ${trainerIds.length ? `
    <h2 class="sec-title">Nhà huấn luyện</h2>
    <div class="trainer-list">
      ${trainerIds.map(tid => {
        const t = TRAINERS[tid];
        if (!t) return '';
        const won = !!G.p.defeatedTrainers[tid];
        const gym = t.kind === 'gym';
        return `
        <button class="card trainer-card ${gym ? 'gym' : ''} ${won ? 'won' : ''}" data-tid="${esc(tid)}">
          <span class="tr-ico">${gym ? '🏛️' : '🧢'}</span>
          <span class="tr-name">${esc(t.name)}${gym && t.badgeName ? ` · 🏅 ${esc(t.badgeName)}` : ''}</span>
          <span class="tr-state">${won ? '✓' : '⚔️'}</span>
        </button>`;
      }).join('')}
    </div>` : ''}

    ${(zone.next || []).length ? `
    <h2 class="sec-title">Di chuyển</h2>
    <div class="move-list">
      ${zone.next.map(zid => {
        const z = ZONES[zid];
        if (!z) return '';
        return `<button class="card move-card" data-zid="${esc(zid)}">
          <span>${z.icon || '📍'}</span> ${esc(z.name)} <span class="mv-arrow">›</span>
        </button>`;
      }).join('')}
    </div>` : ''}
  `;

  // Vào bụi cỏ: random encounter theo trọng số
  const btnGrass = el.querySelector('#btn-grass');
  if (btnGrass) btnGrass.addEventListener('click', () => {
    if (allFainted()) { toast('Cả đội đã gục, không thể chiến đấu!'); return; }
    const e = rng.weighted(zone.encounters);
    const enemy = newPokemon(e.sp, rng.int(e.min, e.max));
    if (!enemy) { toast('Có lỗi dữ liệu encounter!'); return; }
    markSeen(e.sp);
    show('battle', { kind: 'wild', enemy });
  });

  // Trung tâm Pokémon (town)
  const btnCenter = el.querySelector('#btn-center');
  if (btnCenter) btnCenter.addEventListener('click', () => {
    G.p.party.forEach(m => heal(m));
    save();
    toast('💖 Cả đội đã hồi phục hoàn toàn!');
    refresh();
  });

  // Cửa hàng (town)
  const btnShop = el.querySelector('#btn-shop');
  if (btnShop) btnShop.addEventListener('click', () => show('shop'));

  // Trainer: intro rồi vào trận
  el.querySelectorAll('.trainer-card').forEach(card => {
    card.addEventListener('click', async () => {
      if (allFainted()) { toast('Cả đội đã gục, hãy hồi phục trước!'); return; }
      const tid = card.dataset.tid;
      const t = TRAINERS[tid];
      if (!t) return;
      const won = !!G.p.defeatedTrainers[tid];
      const i = await choose(`${t.name}: "${t.intro || 'Đấu nào!'}"`, [
        { label: '⚔️ Chiến đấu!', sub: won ? 'Đã thắng trước đó — đấu lại cho vui' : (t.rewardMoney ? `Thưởng ${fmt(t.rewardMoney)}₽` : undefined) },
      ]);
      if (i === 0) show('battle', { kind: 'trainer', trainerId: tid });
    });
  });

  // Di chuyển zone
  el.querySelectorAll('.move-card').forEach(card => {
    card.addEventListener('click', () => {
      const zid = card.dataset.zid;
      if (!ZONES[zid]) return;
      G.p.zone = zid;
      save();
      const done = emitQuest('reach_zone', { zone: zid });
      done.forEach(({ quest }) => toast(`🎉 Hoàn thành: ${quest.name}`));
      refresh();
    });
  });
}
