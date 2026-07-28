// TuxeWorld H5 | ui/bag.js | Túi đồ: lưới ô vật phẩm, dùng item ngoài trận
import { G, save, removeItem, addItem, markCaught, CONFIG } from '../state.js';
import { maxHp, displayName, tryLearn, replaceMove, heal } from '../engine/monster.js';
import { movesAtLevel } from '../engine/exp.js';
import { checkEvolution, evolve } from '../engine/evolution.js';
import { useItem as engineUse, canUse, isWorldItem } from '../engine/useitem.js';
import { fish, wearRod, rodLeft } from '../engine/fishing.js';
import { isDaytime } from '../engine/daytime.js';
import { isRod } from '../data/fishing.js';
import { isInside, facingWater, setRepellent, enterMap, healSpot } from '../engine/overworld.js';
import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { ITEMS } from '../data/items.js';
import { esc } from '../util.js';
import { toast, choose, confirmDlg, header, itemIcon } from './kit.js';
import { openSheet } from './sheet.js';

// Thứ tự nhóm hiện trong túi
const NHOM = [
  ['medicine', 'Thuốc'],
  ['ball', 'Tuxeball'],
  ['morph', 'Vật biến hình'],
  ['food', 'Món ăn'],
  ['stat', 'Rèn chỉ số'],
  ['tea', 'Trà'],
  ['fish', 'Cần câu'],
  ['tool', 'Đồ tiện ích'],
  ['tm', 'Đĩa chiêu'],
  ['element', 'Quả đổi hệ'],
  ['held', 'Đồ mang theo'],
];

// Câu ghi dưới tên: dùng được ở đâu
const CACH_DUNG = {
  ball: 'Chỉ ném được trong trận với Tuxemon hoang.',
  morph: 'Dùng cho một Tuxemon để nó biến sang hình thái khác.',
  medicine: 'Dùng cho một Tuxemon trong đội.',
  food: 'Cho một Tuxemon ăn để tăng thân thiết.',
  stat: 'Tăng chỉ số cho một Tuxemon.',
  tea: 'Cho một Tuxemon uống để nhận EXP.',
  fish: 'Đứng quay mặt ra mặt nước rồi bấm để thả câu.',
  tool: 'Dùng ngay trên bản đồ, không cần chọn Tuxemon.',
  tm: 'Dạy một chiêu mới cho Tuxemon, không cần đủ cấp.',
  element: 'Chỉ dùng trong trận — đổi hẳn hệ của Tuxemon.',
  held: 'Cho một Tuxemon cầm theo, có tác dụng cả khi ngồi dự bị.',
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
                ${isRod(id) ? `<span class="bag-wear">${rodLeft(id)}</span>` : ''}
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
              <b>${esc(it.name)} <span class="item-n">×${G.p.bag[id]}</span>${
                isRod(id) ? ` <span class="item-n">còn ${rodLeft(id)} lần thả</span>` : ''}</b>
              <small>${esc(it.desc || '')}</small>
              <small class="bag-how">${esc(CACH_DUNG[it.kind] || '')}</small>
            </div>
          </div>
          <button class="btn btn-primary" id="bag-use">${it.held ? 'Cho cầm' : 'Dùng'}</button>`;
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

    // Đồ mang theo: đưa cho một con cầm, lấy lại món cũ nếu đang cầm gì đó
    if (it.held) {
      const ai = await pickMon(`Cho ai cầm ${it.name}?`);
      if (!ai) return;
      if (ai.held) {
        addItem(ai.held, 1);
        toast(`Đã lấy lại ${ITEMS[ai.held] ? ITEMS[ai.held].name : ai.held}.`);
      }
      ai.held = id;
      removeItem(id, 1);
      toast(`${displayName(ai)} đang cầm ${it.name}.`);
      save(); draw();
      return;
    }

    if (!it.inWorld) { toast('Món này chỉ dùng được trong trận!'); return; }

    // Món tác động lên thế giới: không chọn Tuxemon nào cả
    if (isWorldItem(id)) { await dungNgoaiDoi(id); return; }

    const mon = await pickMon(`Dùng ${it.name} cho ai?`);
    if (!mon) return;
    const ctx = { inBattle: false, party: G.p.party, inside: isInside() };
    if (!canUse(id, mon, ctx)) { toast('Không có tác dụng!'); return; }

    const res = engineUse(id, mon, ctx);
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

    // Đĩa chiêu / đĩa hệ: đủ 4 chiêu rồi thì hỏi quên chiêu nào, y như lúc lên cấp
    if (res.learn) await daHoc(mon, res.learn);

    // Cho EXP xong có thể lên cấp -> học chiêu mới, rồi tới lượt tiến hoá theo cấp
    await hocChieuMoi(mon);
    if (!res.evolveTo) {
      const dex = checkEvolution(mon, 'level', null, ctx);
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

  // Cần câu · bình xịt · chìa khoá thoát · lều trại — bốn món của bản gốc tác
  // động lên bản đồ chứ không lên một con nào.
  async function dungNgoaiDoi(id) {
    const ctx = { inBattle: false, party: G.p.party, inside: isInside(), water: facingWater() };
    if (!canUse(id, null, ctx)) {
      toast(isRod(id) ? 'Phải đứng quay mặt ra mặt nước mới thả câu được!'
        : 'Không dùng được lúc này.');
      return;
    }
    const res = engineUse(id, null, ctx);
    if (!res.ok || !res.world) { toast('Không có tác dụng!'); return; }
    const v = res.world;

    if (v.t === 'fishing') {
      const r = fish(id);
      const mon = wearRod(id);
      if (mon.broke) toast(`${it.name} gãy mất rồi!`);
      else if (mon.left <= 3) toast(`Cần sắp gãy — còn ${mon.left} lần thả.`);
      if (!r.ok) { toast('Thả câu mãi mà chẳng con nào cắn...'); draw(); return; }
      toast('Có con cắn câu!');
      save();
      show('battle', { kind: 'wild', enemy: r.mon, from: 'bag',
        arena: isDaytime() ? r.env : r.envNight });
      return;
    }
    if (v.t === 'repellent') {
      removeItem(id, 1);
      setRepellent(v.n || 100);
      toast(`Đã xịt — ${v.n || 100} bước tới không gặp Tuxemon hoang.`);
    } else if (v.t === 'teleport') {
      removeItem(id, 1);
      const nha = healSpot();
      enterMap(nha.map, nha.x, nha.y);
      toast('Đã về chỗ nghỉ.');
    } else if (v.t === 'camp') {
      removeItem(id, 1);
      for (const m of G.p.party) heal(m);
      toast('Dựng trại nghỉ — cả đội khoẻ lại như mới!');
    }
    save();
    draw();
  }

  // Nhét một chiêu vào bộ chiêu; đủ 4 chiêu thì hỏi quên chiêu nào
  async function daHoc(mon, mvId) {
    const r = tryLearn(mon, mvId);
    const d = MOVES[mvId];
    if (r === 'learned') { toast(`Học được ${d ? d.name : mvId}!`); return; }
    if (r !== 'full') return;
    const opts = mon.moves.map(mv => ({ label: MOVES[mv.id] ? MOVES[mv.id].name : mv.id }));
    opts.push({ label: 'Không học' });
    const idx = await choose(`${displayName(mon)} muốn học ${d ? d.name : mvId}. Quên chiêu nào?`,
      opts, { cancelable: false });
    if (idx !== null && idx < mon.moves.length) replaceMove(mon, idx, mvId);
  }

  // Chiêu học được ở cấp hiện tại
  async function hocChieuMoi(mon) {
    for (const mvId of movesAtLevel(mon.sp, mon.lv)) await daHoc(mon, mvId);
  }


  draw();
}
