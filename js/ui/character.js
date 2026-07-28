// TuxeWorld H5 | ui/character.js | Màn Nhân Vật: hồ sơ + lối vào Thời trang
//
// Nhân vật KHÔNG chiến đấu (chỉ Tuxemon đánh nhau) nên ở đây không có trang bị
// cộng chỉ số nữa — chỉ còn hồ sơ và đồ thời trang mặc cho đẹp.
import { ensureData, trainerLevel } from '../engine/player.js';
import { TITLES } from '../data/cosmetics.js';
import { upcoming } from '../engine/unlock.js';
import { esc, fmt } from '../util.js';
import { header } from './kit.js';
import { uiIcon } from './icons.js';
import { upgradeFaces } from './look.js';
import { cardHtml, ensureCardCss } from './trainercard.js';

export function render(el) {
  ensureCardCss();
  const p = ensureData();
  if (!p) return;

  const lv = trainerLevel();
  const next = upcoming(lv);
  const t = p.look.title !== 'none' ? TITLES[p.look.title] : null;

  el.innerHTML = `
    ${header('Nhân vật')}

    ${cardHtml(p)}

    ${next.length ? `<div class="card unlock-card">
      <div class="inv-head"><b>Sắp mở khoá</b><small>Lên cấp Trainer để mở</small></div>
      ${next.map(f => `<div class="unlock-row">
        <span class="unlock-lv">Lv.${f.lv}</span>
        <span class="unlock-mid"><b>${esc(f.name)}</b><small>${esc(f.note)}</small></span>
      </div>`).join('')}
    </div>` : ''}

    <button type="button" class="card menu-link fa-link" data-goto="fashion">
      <span class="fa-link-ico">${uiIcon('flag', 22)}</span>
      <span class="fa-link-mid">
        <b>Thời trang</b>
        <small>${t ? `${esc(t.name)} · ` : ''}Skin nhân vật · Danh hiệu</small>
      </span>
      <span class="fa-link-go">›</span>
    </button>`;

  upgradeFaces(el);
}
