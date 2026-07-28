// TuxeWorld H5 | ui/character.js | Màn Nhân Vật: hồ sơ + lối vào Thời trang
//
// Nhân vật KHÔNG chiến đấu (chỉ Tuxemon đánh nhau) nên ở đây không có trang bị
// cộng chỉ số nữa — chỉ còn hồ sơ và đồ thời trang mặc cho đẹp.
import { G } from '../state.js';
import { ensureData, trainerLevel, expToNext, MAX_TRAINER_LEVEL } from '../engine/player.js';
import { TITLES } from '../data/cosmetics.js';
import { upcoming } from '../engine/unlock.js';
import { SPECIES } from '../data/species.js';
import { esc, fmt } from '../util.js';
import { header } from './kit.js';
import { uiIcon } from './icons.js';
import { avatarFrame, titleHtml, myFaceHtml, upgradeFaces } from './look.js';

function ensureCss() {
  if (document.getElementById('char-css')) return;
  const l = document.createElement('link');
  l.id = 'char-css';
  l.rel = 'stylesheet';
  l.href = 'css/character.css';
  document.head.appendChild(l);
}

export function render(el) {
  ensureCss();
  const p = ensureData();
  if (!p) return;

  const lv = trainerLevel();
  const need = expToNext(lv);
  const maxed = lv >= MAX_TRAINER_LEVEL;
  const pct = maxed ? 100 : Math.min(100, Math.round(p.trainer.exp / Math.max(1, need) * 100));
  const fr = avatarFrame(p.look.avatarFrame);
  const t = p.look.title !== 'none' ? TITLES[p.look.title] : null;

  // Đếm theo đúng danh sách Tuxedex (bỏ mấy con "glitched" bị ẩn)
  const dexIds = Object.keys(SPECIES).filter(id => !SPECIES[id].glitched);
  const caught = Object.keys(G.p.dex?.caught || {}).length;
  const seen = Object.keys(G.p.dex?.seen || {}).length;
  const next = upcoming(lv);

  el.innerHTML = `
    ${header('Nhân vật')}

    <div class="card char-card">
      <!-- Khung avatar bao quanh GƯƠNG MẶT, đúng như trên thanh trên cùng -->
      <span class="ring-ava-wrap${fr.cls}"${fr.style}>${myFaceHtml('ring-ava')}</span>
      <b class="ring-name-lbl">${esc(p.name)}</b>
      ${titleHtml(p.look.title)}
      <div class="char-lv">Trainer Lv.${lv}${maxed ? ' (MAX)' : ''}</div>
      <div class="char-xp"><div class="char-xp-fill" style="width:${pct}%"></div></div>
      <small class="char-xp-num">${maxed ? 'Cấp tối đa' : `${fmt(p.trainer.exp)}/${fmt(need)}`}</small>
    </div>

    <div class="card char-facts">
      <div><b>${fmt(caught)}</b><small>Đã bắt</small></div>
      <div><b>${fmt(seen)}</b><small>Đã gặp</small></div>
      <div><b>${fmt(dexIds.length)}</b><small>Tổng loài</small></div>
      <div><b>${fmt(G.p.badges?.length || 0)}</b><small>Huy hiệu</small></div>
    </div>

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
