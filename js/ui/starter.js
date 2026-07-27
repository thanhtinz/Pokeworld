// PokeWorld H5 | ui/starter.js | Màn mở đầu: đặt tên + chọn starter
import { G, newGame, addToParty, markCaught, startQuest, save } from '../state.js';
import { newPokemon } from '../engine/pokemon.js';
import { SPECIES } from '../data/species.js';
import { QUESTS } from '../data/quests.js';
import { spriteUrl, esc } from '../util.js';
import { toast, confirmDlg, typeBadge, holoStyle } from './kit.js';
import { activeAccount } from '../engine/accounts.js';
import { show } from '../main.js';

const STARTERS = [1, 4, 7]; // Bulbasaur / Charmander / Squirtle

export function render(el) {
  // Đã có save + đã chọn starter -> không nên ở đây
  if (G.p && G.p.starterChosen) { show('home'); return; }
  const hasPlayer = true; // tên đã có từ tài khoản -> vào thẳng phần chọn starter

  el.innerHTML = `
    <div class="starter-wrap">
      <img class="title-art" src="assets/img/title.png" alt="" onerror="this.remove()">
      <div class="logo">Poke<span>World</span></div>
      <p class="tagline">Bắt · Huấn luyện · Chinh phục phòng Gym</p>

      ${hasPlayer ? '' : `
      <div class="card name-card" id="name-card">
        <label for="trainer-name">Tên nhà huấn luyện</label>
        <input id="trainer-name" type="text" maxlength="12" placeholder="Nhập tên (tối đa 12 ký tự)" autocomplete="off">
        <button class="btn btn-primary" id="btn-name">Bắt đầu</button>
      </div>`}

      <div class="starter-pick ${hasPlayer ? '' : 'hidden'}" id="starter-pick">
        <h2>Chọn bạn đồng hành đầu tiên</h2>
        <div class="starter-grid">
          ${STARTERS.map(id => {
            const s = SPECIES[id];
            if (!s) return '';
            return `
            <button class="holo-card starter-card" data-sp="${id}" style="${holoStyle(s.types)}">
              <img class="portrait" src="assets/portraits/${id}.png" width="84" alt="${esc(s.name)}"
                   onerror="this.onerror=null;this.src='${spriteUrl(id)}'">
              <b>${esc(s.name)}</b>
              <span class="starter-types">${s.types.map(typeBadge).join(' ')}</span>
            </button>`;
          }).join('')}
        </div>
      </div>
    </div>`;

  let pendingName = '';
  const btnName = el.querySelector('#btn-name');
  if (btnName) {
    const input = el.querySelector('#trainer-name');
    const go = () => {
      const v = input.value.trim().slice(0, 12);
      if (!v) { toast('Nhập tên đã nhé!'); input.focus(); return; }
      pendingName = v;
      el.querySelector('#name-card').classList.add('hidden');
      el.querySelector('#starter-pick').classList.remove('hidden');
    };
    btnName.addEventListener('click', go);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  }

  el.querySelectorAll('.starter-card').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.sp);
      const s = SPECIES[id];
      const ok = await confirmDlg(`Chọn ${s.name} làm bạn đồng hành nhé?`, 'Chọn!');
      if (!ok) return;
      if (!G.p) newGame((activeAccount()?.user) || pendingName || 'Trainer');
      const mon = newPokemon(id, 5);
      if (!mon) { toast('Có lỗi dữ liệu, thử lại sau!'); return; }
      addToParty(mon);
      markCaught(id);
      G.p.starterChosen = true;
      G.p.starterId = id; // dùng cho đội rival khắc hệ (engine/story.js)
      // Quest chính đầu tiên: ưu tiên 'main_starter', fallback quest main đầu trong data
      const qKeys = Object.keys(QUESTS || {});
      const mainKey = QUESTS && QUESTS.main_starter ? 'main_starter'
        : (qKeys.find(k => k.startsWith('main')) || qKeys[0]);
      if (mainKey) startQuest(mainKey);
      save();
      toast(`${s.name} đã gia nhập đội! Chúc hành trình vui vẻ!`);
      show('home');
    });
  });
}
