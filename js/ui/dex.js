// PokeWorld H5 | ui/dex.js | Pokédex: lưới loài + chi tiết
import { G, dexCounts } from '../state.js';
import { SPECIES } from '../data/species.js';
import { EVOLUTIONS } from '../data/evolutions.js';
import { spriteUrl, boxIcon, upgradeImages, esc } from '../util.js';
import { typeBadge, header, holoStyle } from './kit.js';

const STAT_ORDER = [['hp', 'HP'], ['atk', 'Tấn công'], ['def', 'Phòng thủ'], ['spa', 'Đặc công'], ['spd', 'Đặc thủ'], ['spe', 'Tốc độ']];

export function render(el) {
  const dexIds = Object.keys(SPECIES).map(Number).sort((a, b) => a - b);
  const total = dexIds.length;

  function drawList() {
    const [seen, caughtN] = dexCounts();
    el.innerHTML = `
      ${header('Pokédex')}
      <div class="card dex-count">Đã gặp <b>${seen}</b> — Đã bắt <b>${caughtN}</b> / ${total}</div>
      <div class="dex-grid">
        ${dexIds.map(id => {
          const s = SPECIES[id];
          const seenIt = !!G.p.dex.seen[id];
          const caughtIt = !!G.p.dex.caught[id];
          const cls = caughtIt ? 'caught' : seenIt ? 'seen' : 'unknown';
          return `
          <button class="holo-card dex-cell ${cls}" data-id="${id}" ${seenIt ? '' : 'disabled'}
                  ${caughtIt ? `style="${holoStyle(s.types)}"` : ''}>
            <span class="lv-chip">#${String(id).padStart(3, '0')}</span>
            <img class="px-icon dex-ico" src="${boxIcon(id)}" width="76" height="64" alt="" loading="lazy">
            <span class="dex-name">${seenIt ? esc(s.name) : '?'}</span>
            ${caughtIt ? '<span class="dex-check" title="Đã bắt"></span>' : ''}
          </button>`;
        }).join('')}
      </div>`;
    el.querySelectorAll('.dex-cell:not(.unknown)').forEach(c =>
      c.addEventListener('click', () => drawDetail(Number(c.dataset.id))));
  }

  // Tìm chuỗi tiến hóa chứa dex này từ EVOLUTIONS
  function evoChain(id) {
    const evos = EVOLUTIONS || {};
    const target = e => (e && (e.to ?? e.dex)) ?? (typeof e === 'number' ? e : null);
    // đi lùi về gốc
    let root = id;
    let guard = 0;
    while (guard++ < 10) {
      const prev = Object.keys(evos).find(k => {
        const e = evos[k];
        const list = Array.isArray(e) ? e : [e];
        return list.some(x => target(x) === root);
      });
      if (!prev) break;
      root = Number(prev);
    }
    // đi tiến (nhánh đầu tiên)
    const chain = [root];
    guard = 0;
    let cur = root;
    while (guard++ < 10) {
      const e = evos[cur];
      if (!e) break;
      const nxt = target(Array.isArray(e) ? e[0] : e);
      if (!nxt || chain.includes(nxt)) break;
      chain.push(nxt);
      cur = nxt;
    }
    return chain;
  }

  function drawDetail(id) {
    const s = SPECIES[id];
    const caughtIt = !!G.p.dex.caught[id];
    const maxBase = 160;
    const chain = evoChain(id);
    el.innerHTML = `
      <div class="scr-head"><button class="btn-back" id="dex-back">‹</button><h1>#${String(id).padStart(3, '0')} ${esc(s.name)}</h1></div>
      <div class="card dex-detail">
        <img src="${boxIcon(id)}" data-up="${spriteUrl(id)}" width="120" height="120" alt="${esc(s.name)}" class="dex-big px-icon ${caughtIt ? '' : 'silhouette'}">
        <div>${s.types.map(typeBadge).join(' ')}</div>
        <small>Cao ${s.height ?? '?'} m · Nặng ${s.weight ?? '?'} kg</small>
        <div class="dex-print">
          <img src="assets/footprints/${id}.png" width="32" height="32" alt=""
               onerror="this.closest('.dex-print').remove()">
          <small>Dấu chân</small>
        </div>
      </div>
      <div class="card">
        <h3>Chỉ số gốc</h3>
        ${STAT_ORDER.map(([k, label]) => `
          <div class="base-row">
            <span>${label}</span><b>${s.base[k]}</b>
            <div class="base-bar"><div class="base-fill" style="width:${Math.min(100, Math.round(s.base[k] / maxBase * 100))}%"></div></div>
          </div>`).join('')}
      </div>
      ${chain.length > 1 ? `
      <div class="card">
        <h3>Tiến hóa</h3>
        <div class="evo-chain">
          ${chain.map((d, i) => `
            ${i > 0 ? '<span class="evo-arrow"></span>' : ''}
            <span class="evo-node ${G.p.dex.seen[d] ? '' : 'silhouette'}">
              <img class="px-icon dex-ico" src="${boxIcon(d)}" width="68" height="56" alt="">
              <small>${G.p.dex.seen[d] ? esc(SPECIES[d] ? SPECIES[d].name : '?') : '?'}</small>
            </span>`).join('')}
        </div>
      </div>` : ''}`;
    upgradeImages(el);
    el.querySelector('#dex-back').addEventListener('click', drawList);
    el.scrollTop = 0;
  }

  drawList();
}
