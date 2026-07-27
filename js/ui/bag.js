// PokeWorld H5 | ui/bag.js | Túi đồ: tab theo loại, dùng item ngoài trận
import { G, save, removeItem, addItem, markCaught, CONFIG } from '../state.js';
import { maxHp, displayName, isFainted, tryLearn, replaceMove } from '../engine/pokemon.js';
import { gainExp, expForLevel, movesAtLevel } from '../engine/exp.js';
import { checkEvolution, evolve } from '../engine/evolution.js';
import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { ITEMS } from '../data/items.js';
import { esc } from '../util.js';
import { toast, choose, confirmDlg, header, itemIcon } from './kit.js';

const TABS = [
  ['medicine', '💊 Thuốc'],
  ['ball', '⚪ Bóng'],
  ['stone', '💎 Đá'],
  ['candy', '🍬 Kẹo'],
  ['berry', '🍓 Quả'],
  ['held', '🎗️ Cầm'],
];

export function render(el) {
  let tab = 'medicine';

  function itemsOfTab(kind) {
    return Object.keys(G.p.bag)
      .filter(id => G.p.bag[id] > 0 && ITEMS[id] && ITEMS[id].kind === kind);
  }

  function draw() {
    const ids = itemsOfTab(tab);
    el.innerHTML = `
      ${header('Túi đồ')}
      <div class="tab-row">
        ${TABS.map(([k, label]) => `<button class="tab-btn ${tab === k ? 'active' : ''}" data-tab="${k}">${label}</button>`).join('')}
      </div>
      <div class="item-list">
        ${ids.map(id => {
          const it = ITEMS[id];
          return `
          <button class="card item-row" data-id="${esc(id)}">
            ${itemIcon(id, it.icon || '🎁')}
            <span class="item-mid"><b>${esc(it.name)}</b><small>${esc(it.desc || '')}</small></span>
            <span class="item-n">×${G.p.bag[id]}</span>
          </button>`;
        }).join('')}
        ${ids.length === 0 ? '<div class="card empty-note">Không có vật phẩm loại này.</div>' : ''}
      </div>`;

    el.querySelectorAll('.tab-btn').forEach(b =>
      b.addEventListener('click', () => { tab = b.dataset.tab; draw(); }));
    el.querySelectorAll('.item-row').forEach(b =>
      b.addEventListener('click', () => useItem(b.dataset.id)));
  }

  async function pickMon(title) {
    const i = await choose(title, G.p.party.map(m => ({
      label: `${displayName(m)} Lv.${m.lv}`,
      sub: `HP ${m.hpCur}/${maxHp(m)}${m.status ? ' · ' + m.status : ''}`,
    })));
    return i === null ? null : G.p.party[i];
  }

  async function useItem(id) {
    const it = ITEMS[id];
    if (!it) return;
    if (G.p.party.length === 0) { toast('Chưa có Pokémon nào!'); return; }

    if (it.kind === 'medicine' || it.kind === 'berry') {
      const mon = await pickMon(`Dùng ${it.name} cho ai?`);
      if (!mon) return;
      if (applyMedicine(mon, it)) {
        removeItem(id, 1);
        toast(`Đã dùng ${it.name} cho ${displayName(mon)}!`);
        save(); draw();
      } else {
        toast('Không có tác dụng!');
      }
      return;
    }

    if (it.kind === 'stone') {
      const mon = await pickMon(`Dùng ${it.name} cho ai?`);
      if (!mon) return;
      const dex = checkEvolution(mon, 'stone', id);
      if (!dex) { toast('Không có tác dụng với Pokémon này!'); return; }
      const to = SPECIES[dex];
      if (!await confirmDlg(`${displayName(mon)} sẽ tiến hóa thành ${to ? to.name : '?'}!`, 'Tiến hóa!')) return;
      evolve(mon, dex);
      markCaught(mon.sp);
      removeItem(id, 1);
      toast(`🎉 Tiến hóa thành ${SPECIES[mon.sp] ? SPECIES[mon.sp].name : '?'}!`);
      save(); draw();
      return;
    }

    if (it.kind === 'candy') {
      const mon = await pickMon(`Dùng ${it.name} cho ai?`);
      if (!mon) return;
      if (mon.lv >= CONFIG.MAX_LEVEL) { toast('Đã đạt level tối đa!'); return; }
      const spec = SPECIES[mon.sp];
      const need = expForLevel(spec.expCurve, mon.lv + 1) - (mon.exp || 0);
      gainExp(mon, Math.max(1, need));
      removeItem(id, 1);
      toast(`${displayName(mon)} lên Lv.${mon.lv}!`);
      // Học chiêu mới ở level này (nếu có)
      for (const mvId of movesAtLevel(mon.sp, mon.lv)) {
        const r = tryLearn(mon, mvId);
        const d = MOVES[mvId];
        if (r === 'learned') toast(`Học được ${d ? d.name : mvId}!`);
        else if (r === 'full') {
          const opts = mon.moves.map(mv => ({ label: MOVES[mv.id] ? MOVES[mv.id].name : mv.id }));
          opts.push({ label: 'Không học' });
          const idx = await choose(`${displayName(mon)} muốn học ${d ? d.name : mvId}. Quên chiêu nào?`, opts, { cancelable: false });
          if (idx !== null && idx < mon.moves.length) replaceMove(mon, idx, mvId);
        }
      }
      // Tiến hóa theo level
      const dex = checkEvolution(mon, 'level');
      if (dex) {
        const to = SPECIES[dex];
        if (await confirmDlg(`${displayName(mon)} muốn tiến hóa thành ${to ? to.name : '?'}!`, 'Tiến hóa!')) {
          evolve(mon, dex);
          markCaught(mon.sp);
          toast(`🎉 Tiến hóa thành ${SPECIES[mon.sp] ? SPECIES[mon.sp].name : '?'}!`);
        }
      }
      save(); draw();
      return;
    }

    if (it.kind === 'held') {
      const mon = await pickMon(`Cho ai cầm ${it.name}?`);
      if (!mon) return;
      if (mon.held) {
        addItem(mon.held, 1); // trả item cũ về túi
        toast(`Đã lấy lại ${ITEMS[mon.held] ? ITEMS[mon.held].name : mon.held}.`);
      }
      mon.held = id;
      removeItem(id, 1);
      toast(`${displayName(mon)} đang cầm ${it.name}.`);
      save(); draw();
      return;
    }

    if (it.kind === 'ball') {
      toast('Bóng chỉ dùng được trong trận với Pokémon hoang dã!');
    }
  }

  // Áp dụng thuốc: heal số/full, cure trạng thái, hồi sinh. Trả về true nếu có tác dụng.
  function applyMedicine(mon, it) {
    const ef = it.effect || {};
    let used = false;
    const mx = maxHp(mon);

    // Hồi sinh
    if (ef.revive) {
      if (!isFainted(mon)) return false;
      const frac = typeof ef.revive === 'number' ? ef.revive : 0.5;
      mon.hpCur = Math.max(1, Math.floor(mx * frac));
      used = true;
    } else if (isFainted(mon) && (ef.heal || ef.cure)) {
      return false; // thuốc thường không dùng cho mon đã gục
    }

    // Hồi máu
    const healAmt = ef.heal ?? ef.amount;
    if (healAmt && mon.hpCur < mx) {
      const add = healAmt === 'full' ? mx : Number(healAmt) || 0;
      if (add > 0) { mon.hpCur = Math.min(mx, mon.hpCur + add); used = true; }
    }

    // Chữa trạng thái
    if (ef.cure && mon.status && (ef.cure === 'all' || ef.cure === mon.status)) {
      mon.status = null;
      mon.statusTurns = 0;
      used = true;
    }
    return used;
  }

  draw();
}
