// PokeWorld H5 | ui/quest.js | Danh sách nhiệm vụ: đang làm / hoàn thành
import { G } from '../state.js';
import { QUESTS } from '../data/quests.js';
import { esc, fmt } from '../util.js';
import { itemIcon } from './kit.js';

export function render(el) {
  const active = Object.entries(G.p.quests.active);
  const done = Object.keys(G.p.quests.done);

  const rewardText = q => {
    const parts = [];
    if (q.reward?.money) parts.push(`${fmt(q.reward.money)}₽`);
    for (const it of q.reward?.items || []) parts.push(`${it.id} ×${it.n}`);
    return parts.join(' · ');
  };

  el.innerHTML = `
    <div class="scr-head"><button class="btn-back" data-goto="home">‹</button><h1>${itemIcon('vs_recorder', '', 22)} Nhiệm vụ</h1></div>

    <h2 class="sec-title">Đang làm</h2>
    ${active.length === 0 ? '<div class="card empty-note">Không có nhiệm vụ nào đang làm.</div>' : ''}
    ${active.map(([id, st]) => {
      const q = QUESTS[id];
      if (!q) return '';
      const n = q.goal?.n || 1;
      const cur = Math.min(st.progress || 0, n);
      return `
      <div class="card quest-card">
        <div class="q-head"><b>${esc(q.name)}</b>${q.daily ? '<span class="daily-pill">DAILY</span>' : ''}</div>
        <p>${esc(q.desc || '')}</p>
        <div class="q-progress">
          <div class="base-bar"><div class="base-fill" style="width:${Math.round(cur / n * 100)}%"></div></div>
          <small>${cur}/${n}</small>
        </div>
        ${rewardText(q) ? `<small class="q-reward">${itemIcon('nugget', '', 16)} ${esc(rewardText(q))}</small>` : ''}
      </div>`;
    }).join('')}

    <h2 class="sec-title">Hoàn thành</h2>
    ${done.length === 0 ? '<div class="card empty-note">Chưa hoàn thành nhiệm vụ nào.</div>' : ''}
    ${done.map(id => {
      const q = QUESTS[id];
      if (!q) return '';
      return `
      <div class="card quest-card done">
        <div class="q-head"><b>${esc(q.name)}</b><span class="done-pill">XONG</span>${q.daily ? '<span class="daily-pill">DAILY</span>' : ''}</div>
        <p>${esc(q.desc || '')}</p>
      </div>`;
    }).join('')}`;
}
