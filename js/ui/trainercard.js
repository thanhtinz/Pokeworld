// TuxeWorld H5 | ui/trainercard.js | Thẻ huấn luyện viên
//
// Bố cục kiểu thẻ căn cước: ảnh + tên + mã số bên trái, số liệu ở giữa, hàng
// huy hiệu ở dưới, và mấy ngôi sao ở góc phải cho biết đã làm được tới đâu.
//
// Ảnh dùng ở đây: sprite huy hiệu là art của Tuxemon (CC BY-SA), ngôi sao do
// tools/mkicons.py tự vẽ, nền và khung là CSS tự viết.
import { trainerLevel, expToNext, MAX_TRAINER_LEVEL } from '../engine/player.js';
import { SPECIES } from '../data/species.js';
import { ITEMS } from '../data/items.js';
import { esc, fmt } from '../util.js';
import { itemIcon } from './kit.js';
import { titleHtml, myFaceHtml, faceHtml, faceSrcOf, avatarFrame } from './look.js';

// Kiểu của thẻ nằm trong css/character.css — màn nào vẽ thẻ cũng phải gọi hàm
// này trước, không thì thẻ đổ ra thành một cột chữ trần.
export function ensureCardCss() {
  if (document.getElementById('char-css')) return;
  const l = document.createElement('link');
  l.id = 'char-css';
  l.rel = 'stylesheet';
  l.href = 'css/character.css';
  document.head.appendChild(l);
}

// Năm huy hiệu võ đường của bản gốc, theo đúng thứ tự đi đường
export const BADGES = ['shaft_badge', 'scoop_badge', 'omnichannel_badge',
                       'greenwash_badge', 'nimrod_badge'];

// Mã số thẻ: bốc từ tên nên cùng một nhân vật lúc nào cũng ra một số
function maSo(ten) {
  let h = 7;
  for (const c of String(ten || '')) h = (h * 31 + c.charCodeAt(0)) % 99999;
  return String(h).padStart(5, '0');
}

// Năm mốc lấy sao — làm được mốc nào sáng sao đó
export function SAO(p) {
  const caught = Object.keys(p.dex?.caught || {}).length;
  const seen = Object.keys(p.dex?.seen || {}).length;
  const hh = (p.badges || []).length;
  return [
    { ok: hh >= 1, note: 'Thắng võ đường đầu tiên' },
    { ok: caught >= 25, note: 'Bắt đủ 25 loài' },
    { ok: (p.stats?.wins || 0) >= 100, note: 'Thắng 100 trận' },
    { ok: hh >= BADGES.length, note: 'Đủ 5 huy hiệu' },
    { ok: seen >= 150, note: 'Tuxedex gặp đủ 150 loài' },
  ];
}

const ngay = (ts) => ts ? new Date(ts).toLocaleDateString('vi-VN') : '—';

export function cardHtml(p) {
  const lv = trainerLevel();
  const need = expToNext(lv);
  const maxed = lv >= MAX_TRAINER_LEVEL;
  const pct = maxed ? 100 : Math.min(100, Math.round(p.trainer.exp / Math.max(1, need) * 100));
  const fr = avatarFrame(p.look.avatarFrame);
  const tong = Object.keys(SPECIES).filter(id => !SPECIES[id].glitched).length;
  const caught = Object.keys(p.dex?.caught || {}).length;
  const seen = Object.keys(p.dex?.seen || {}).length;
  const sao = SAO(p);
  const co = new Set(p.badges || []);

  return `
    <div class="tcard">
      <div class="tcard-top">
        <span class="tcard-label">Thẻ Huấn Luyện Viên</span>
        <span class="tcard-stars">${sao.map(s =>
          `<img src="assets/ui/icon/star.png" class="tcard-star${s.ok ? '' : ' off'}"
             width="15" height="15" alt="" title="${esc(s.note)}">`).join('')}</span>
      </div>

      <div class="tcard-body">
        <div class="tcard-face">
          <span class="ring-ava-wrap${fr.cls}"${fr.style}>${myFaceHtml('ring-ava')}</span>
          <span class="tcard-id">ID ${maSo(p.name)}</span>
        </div>
        <div class="tcard-info">
          <b class="tcard-name">${esc(p.name)}</b>
          ${titleHtml(p.look.title)}
          <div class="tcard-lv">Trainer Lv.${lv}${maxed ? ' · MAX' : ''}</div>
          <div class="char-xp"><div class="char-xp-fill" style="width:${pct}%"></div></div>
          <small class="tcard-xp">${maxed ? 'Cấp tối đa' : `${fmt(p.trainer.exp)}/${fmt(need)} EXP`}</small>
        </div>
      </div>

      <div class="tcard-grid">
        <div><small>Tiền</small><b>${fmt(p.money)}₽</b></div>
        <div><small>Đã bắt</small><b>${fmt(caught)}</b></div>
        <div><small>Đã gặp</small><b>${fmt(seen)}/${fmt(tong)}</b></div>
        <div><small>Bắt đầu</small><b>${ngay(p.stats?.playSince)}</b></div>
      </div>

      <div class="tcard-badges">
        <small>Huy hiệu võ đường</small>
        <div class="tcard-badge-row">
          ${BADGES.map(id => `<span class="tcard-badge${co.has(id) ? '' : ' off'}"
              title="${esc(ITEMS[id]?.name || id)}">${itemIcon(id, '', 30)}</span>`).join('')}
        </div>
      </div>
    </div>`;
}


// ==== Thẻ của NGƯỜI KHÁC ====
// Máy chủ trả về sẵn số liệu công khai (xem GET /profile/:username) — không có
// tiền, túi đồ hay đội hình nên thẻ này chỉ khoe thành tích.
export function otherCardHtml(d) {
  const tong = Object.keys(SPECIES).filter(id => !SPECIES[id].glitched).length;
  const look = d.look || { title: 'none', avatarFrame: 'none', skin: 'default' };
  const fr = avatarFrame(look.avatarFrame);
  const co = new Set(d.badges || []);
  const sao = SAO({
    dex: { caught: Array.from({ length: d.dexCaught }, (_, i) => i),
           seen: Array.from({ length: d.dexSeen }, (_, i) => i) },
    badges: d.badges || [],
    stats: { wins: d.wins || 0 },
  });

  return `
    <div class="tcard">
      <div class="tcard-top">
        <span class="tcard-label">Thẻ Huấn Luyện Viên</span>
        <span class="tcard-stars">${sao.map(s =>
          `<img src="assets/ui/icon/star.png" class="tcard-star${s.ok ? '' : ' off'}"
             width="15" height="15" alt="" title="${esc(s.note)}">`).join('')}</span>
      </div>

      <div class="tcard-body">
        <div class="tcard-face">
          <span class="ring-ava-wrap${fr.cls}"${fr.style}>${
            faceHtml(faceSrcOf(look, d.avatar), 'ring-ava')}</span>
          <span class="tcard-id">ID ${maSo(d.username)}</span>
        </div>
        <div class="tcard-info">
          <b class="tcard-name">${esc(d.username)}</b>
          ${titleHtml(look.title)}
          <div class="tcard-lv">Trainer Lv.${d.trainer?.level || 1}</div>
          ${d.guild ? `<small class="tcard-xp">Bang hội ${esc(d.guild.name)} [${esc(d.guild.tag)}]</small>` : ''}
        </div>
      </div>

      <div class="tcard-grid">
        <div><small>Thắng</small><b>${fmt(d.wins || 0)}</b></div>
        <div><small>Đã bắt</small><b>${fmt(d.dexCaught || 0)}</b></div>
        <div><small>Đã gặp</small><b>${fmt(d.dexSeen || 0)}/${fmt(tong)}</b></div>
        <div><small>PvP</small><b>${fmt(d.pvp?.win || 0)}/${fmt(d.pvp?.lose || 0)}</b></div>
      </div>

      <div class="tcard-badges">
        <small>Huy hiệu võ đường</small>
        <div class="tcard-badge-row">
          ${BADGES.map(id => `<span class="tcard-badge${co.has(id) ? '' : ' off'}"
              title="${esc(ITEMS[id]?.name || id)}">${itemIcon(id, '', 30)}</span>`).join('')}
        </div>
      </div>
    </div>`;
}
