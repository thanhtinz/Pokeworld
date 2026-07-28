// TuxeWorld H5 | ui/bag.js | Túi đồ: lưới ô vật phẩm, dùng item ngoài trận
import { G, save, removeItem, addItem, markCaught, CONFIG } from '../state.js';
import { maxHp, displayName, tryLearn, replaceMove } from '../engine/monster.js';
import { movesAtLevel } from '../engine/exp.js';
import { checkEvolution, evolve } from '../engine/evolution.js';
import { useItem as engineUse, canUse } from '../engine/useitem.js';
import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { ITEMS } from '../data/items.js';
import { esc } from '../util.js';
import { toast, choose, confirmDlg, header, itemIcon } from './kit.js';
import { openSheet } from './sheet.js';

// Thứ tự nhóm hiện trong túi
const NHOM = [
  ['medicine', 'Thuốc'],
  ['ball', 'Bóng'],
  ['stone', 'Đá tiến hoá'],
  ['food', 'Món ăn'],
  ['stat', 'Rèn chỉ số'],
  ['tea', 'Trà'],
  ['held', 'Vật cầm'],
];

// Câu ghi dưới tên: dùng được ở đâu
const CACH_DUNG = {
  ball: 'Chỉ ném được trong trận với Tuxemon hoang.',
  stone: 'Dùng cho một Tuxemon để tiến hoá.',
  held: 'Cho một Tuxemon cầm theo.',
  medicine: 'Dùng cho một Tuxemon trong đội.',
  food: 'Cho một Tuxemon ăn để tăng thân thiết.',
  stat: 'Tăng chỉ số cho một Tuxemon.',
  tea: 'Cho một Tuxemon uống để nhận EXP.',
};

export function render(el) {
  function itemsOfKind(kind) {
    return Object.keys(G.p.bag)
      .filter(id => G.p.bag[id] > 0 && ITEMS[id] && ITEMS[id].kind === kind);
  }

  function draw() {
    const nhom = NHOM.map(([k, label]) => [label, itemsOfKind(k)]).filter(([, ids]) => ids.length);
    const tong = nhom.reduce((n, [, ids]) => n + ids.length, 0);
    el.innerHTML = `
      ${header('Túi đồ')}
      ${nhom.map(([label, ids]) => `
        <div class="card bag-group">
          <div class="bag-head"><b>${esc(label)}</b><small>${ids.length} loại</small></div>
          <div class="bag-grid">
            ${ids.map(id => {
              const it = ITEMS[id];
              return `<button type="button" class="bag-cell" data-id="${esc(id)}" title="${esc(it.name)}">
                <span class="bag-n">×${G.p.bag[id]}</span>
                <span class="bag-art">${itemIcon(id, '', 40)}</span>
                <b class="bag-name">${esc(it.name)}</b>
              </button>`;
            }).join('')}
          </div>
        </div>`).join('')}
      ${tong === 0 ? '<div class="card empty-note">Túi đang trống.</div>' : ''}`;

    el.querySelectorAll('.bag-cell').forEach(b =>
      b.addEventListener('click', () => openItem(b.dataset.id)));
  }

  // Bảng chi tiết một vật phẩm
  function openItem(id) {
    const it = ITEMS[id];
    if (!it) return;
    openSheet({
      title: it.name,
      tabs: [{ id: 'ct', name: it.name, draw(box, api) {
        box.innerHTML = `
          <div class="bag-detail">
            <span class="bag-detail-art">${itemIcon(id, '', 64)}</span>
            <div class="bag-detail-mid">
              <b>${esc(it.name)} <span class="item-n">×${G.p.bag[id]}</span></b>
              <small>${esc(it.desc || '')}</small>
              <small class="bag-how">${esc(CACH_DUNG[it.kind] || '')}</small>
            </div>
          </div>
          <button class="btn btn-primary" id="bag-use">${it.kind === 'held' ? 'Cho cầm' : 'Dùng'}</button>`;
        box.querySelector('#bag-use').addEventListener('click', async () => {
          api.close();
          await useItem(id);
        });
      } }],
    });
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
    if (G.p.party.length === 0) { toast('Chưa có Tuxemon nào!'); return; }

    if (it.kind === 'held') {
      const mon = await pickMon(`Cho ai cầm ${it.name}?`);
      if (!mon) return;
      if (mon.held) {
        addItem(mon.held, 1);
        toast(`Đã lấy lại ${ITEMS[mon.held] ? ITEMS[mon.held].name : mon.held}.`);
      }
      mon.held = id;
      removeItem(id, 1);
      toast(`${displayName(mon)} đang cầm ${it.name}.`);
      save(); draw();
      return;
    }

    if (!it.inWorld) { toast('Món này chỉ dùng được trong trận!'); return; }

    const mon = await pickMon(`Dùng ${it.name} cho ai?`);
    if (!mon) return;
    if (!canUse(id, mon, { inBattle: false })) { toast('Không có tác dụng!'); return; }

    const res = engineUse(id, mon, { inBattle: false });
    if (!res.ok) { toast('Không có tác dụng!'); return; }

    // Tiến hoá bằng đá: hỏi trước rồi mới đổi loài
    if (res.evolveTo) {
      const to = SPECIES[res.evolveTo];
      if (!await confirmDlg(`${displayName(mon)} sẽ tiến hóa thành ${to ? to.name : '?'}!`, 'Tiến hóa!')) return;
      evolve(mon, res.evolveTo);
      markCaught(mon.sp);
      res.msgs.push(`Tiến hóa thành ${SPECIES[mon.sp] ? SPECIES[mon.sp].name : '?'}!`);
    }

    removeItem(id, 1);
    for (const m of res.msgs) toast(m);

    // Cho EXP xong có thể lên cấp -> học chiêu mới, rồi tới lượt tiến hoá theo cấp
    await hocChieuMoi(mon);
    if (!res.evolveTo) {
      const dex = checkEvolution(mon, 'level');
      if (dex) {
        const to = SPECIES[dex];
        if (await confirmDlg(`${displayName(mon)} muốn tiến hóa thành ${to ? to.name : '?'}!`, 'Tiến hóa!')) {
          evolve(mon, dex);
          markCaught(mon.sp);
          toast(`Tiến hóa thành ${SPECIES[mon.sp] ? SPECIES[mon.sp].name : '?'}!`);
        }
      }
    }
    save(); draw();
  }

  // Chiêu học được ở cấp hiện tại; đủ 4 chiêu thì hỏi quên chiêu nào
  async function hocChieuMoi(mon) {
    for (const mvId of movesAtLevel(mon.sp, mon.lv)) {
      const r = tryLearn(mon, mvId);
      const d = MOVES[mvId];
      if (r === 'learned') toast(`Học được ${d ? d.name : mvId}!`);
      else if (r === 'full') {
        const opts = mon.moves.map(mv => ({ label: MOVES[mv.id] ? MOVES[mv.id].name : mv.id }));
        opts.push({ label: 'Không học' });
        const idx = await choose(`${displayName(mon)} muốn học ${d ? d.name : mvId}. Quên chiêu nào?`,
          opts, { cancelable: false });
        if (idx !== null && idx < mon.moves.length) replaceMove(mon, idx, mvId);
      }
    }
  }


  draw();
}
