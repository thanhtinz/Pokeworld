// TuxeWorld H5 | ui/party.js | Đội hình 6 slot + chi tiết + Box
import { G, save, CONFIG } from '../state.js';
import { monImg, skinsFor } from '../engine/monskin.js';
import { wearMonSkin, trainerLevel, monLevelCap } from '../engine/player.js';
import { unlocked, requirement, imgOf } from '../data/cosmetics.js';
import { stats, maxHp, displayName, isFainted, STAT_KEYS } from '../engine/monster.js';
import { expProgress } from '../engine/exp.js';
import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { tasteText } from '../data/tastes.js';
import { monSprite, monBoxIcon, monPath, upgradeImages, esc } from '../util.js';
import { toast, choose, confirmDlg, hpBar, typeBadge, statusTag, header, holoStyle, itemIcon } from './kit.js';
import { rangeIcon } from './icons.js';
import { openSheet } from './sheet.js';

// Sáu chỉ số của Tuxemon
const STAT_VI = { hp: 'HP', armour: 'Giáp', dodge: 'Né tránh', melee: 'Cận chiến',
  ranged: 'Tầm xa', speed: 'Tốc độ' };

export function render(el) {
  let sel = null; // index mon đang xem chi tiết

  function draw() {
    const party = G.p.party;
    el.innerHTML = `
      ${header('Đội hình')}
      <div class="party-list">
        ${party.map((m, i) => `
          <button class="holo-card party-slot ${sel === i ? 'sel' : ''} ${isFainted(m) ? 'ko' : ''}" data-i="${i}"
                  style="${holoStyle(SPECIES[m.sp] ? SPECIES[m.sp].types : [])}">
            <span class="lv-chip">Lv.${m.lv}</span>
            <img class="holo-sprite px-icon" src="${monImg(m)}" width="72" height="72" alt="">
            <div class="ps-mid">
              <span class="holo-name ps-name">${esc(displayName(m))}${m.shiny ? ' <span class="shiny-tag">SHINY</span>' : ''}</span>
              ${statusTag(m.status)}
              ${hpBar(m.hpCur, maxHp(m))}
              <small class="ps-hp">${m.hpCur}/${maxHp(m)}</small>
            </div>
          </button>`).join('')}
        ${party.length === 0 ? '<div class="card party-empty-note">Chưa có Tuxemon nào.</div>' : ''}
      </div>
      <button class="btn" id="btn-box">${itemIcon('tuxeball', '', 22)} Box (${G.p.box.length})</button>
      <div id="party-detail"></div>`;

    el.querySelectorAll('.party-slot').forEach(btn =>
      btn.addEventListener('click', () => { sel = (sel === Number(btn.dataset.i)) ? null : Number(btn.dataset.i); draw(); }));
    el.querySelector('#btn-box').addEventListener('click', openBox);

    if (sel !== null && party[sel]) drawDetail(party[sel]);
    upgradeImages(el);
  }

  // Trái tim thân thiết — ảnh gfx/ui/icons/bond của bản gốc, 4 mức
  function bondHearts(bond) {
    const muc = Math.max(1, Math.min(4, Math.ceil((bond || 0) / 25) || 1));
    let out = '';
    for (let i = 1; i <= 4; i++) {
      out += `<img class="bond-ico" src="assets/ui/bond/${i <= muc ? muc : 1}.png"
        style="opacity:${i <= muc ? 1 : .25}" alt="">`;
    }
    return out;
  }

  function drawDetail(m) {
    const box = el.querySelector('#party-detail');
    const spec = SPECIES[m.sp];
    const st = stats(m);
    const [cur, need] = expProgress(m);
    const cap = monLevelCap();
    box.innerHTML = `
      <div class="card detail-card">
        <div class="detail-top">
          <img src="${monImg(m)}" width="96" height="96" alt="" class="detail-sprite px-icon">
          <div>
            <h2>${esc(displayName(m))}${m.shiny ? ' <span class="shiny-tag">SHINY</span>' : ''}</h2>
            <div>${(spec ? spec.types : []).map(typeBadge).join(' ')}</div>
            <small>Lv.${m.lv} · ${m.gender === 'm' ? 'Đực' : m.gender === 'f' ? 'Cái' : '—'} · ${esc(tasteText(m))}</small><br>
            <small>EXP: ${cur}/${need} tới level sau</small><br>
            <small class="bond-line">Thân thiết ${bondHearts(m.bond ?? 25)} ${m.bond ?? 25}/100</small>
            ${m.lv >= cap ? `<br><small class="cap-note">Đã chạm trần Lv.${cap} — lên cấp Trainer để nuôi tiếp</small>` : ''}
          </div>
        </div>
        <table class="stat-table">
          ${STAT_KEYS.map(k => `<tr><td>${STAT_VI[k]}</td><td><b>${k === 'hp' ? maxHp(m) : st[k]}</b></td></tr>`).join('')}
        </table>
        <details class="ivev">
          <summary>IV / TP chi tiết</summary>
          <table class="stat-table">
            <tr><th></th><th>IV</th><th>TP</th></tr>
            ${STAT_KEYS.map((k, i) => `<tr><td>${STAT_VI[k]}</td><td>${m.iv?.[i] ?? 0}</td><td>${m.tp?.[i] ?? 0}</td></tr>`).join('')}
          </table>
        </details>
        <h3>Chiêu thức</h3>
        <div class="move-list-sm">
          ${m.moves.map(mv => {
            const d = MOVES[mv.id];
            return `<div class="move-row">${d ? typeBadge(d.types[0]) : ''} ${d ? rangeIcon(d.range) : ''}
              ${esc(d ? d.name : mv.id)} <small>Hồi ${d ? d.recharge : 0} lượt</small></div>`;
          }).join('')}
        </div>
        <div class="detail-btns">
          <button class="btn" id="d-swap">Đổi vị trí</button>
          <button class="btn" id="d-nick">Biệt danh</button>
          <button class="btn" id="d-skin">Skin</button>
          <button class="btn" id="d-tobox">Gửi vào Box</button>
        </div>
      </div>`;

    box.querySelector('#d-swap').addEventListener('click', async () => {
      const j = await choose('Đổi vị trí với...', G.p.party.map((x, i) => ({
        label: `${i + 1}. ${displayName(x)} Lv.${x.lv}`, disabled: i === sel,
      })));
      if (j === null) return;
      const p = G.p.party;
      [p[sel], p[j]] = [p[j], p[sel]];
      sel = j;
      save(); draw();
    });

    // Skin Tuxemon: ảnh do quản trị viên tải lên, mặc theo LOÀI (mọi con cùng
    // loài đổi hình theo). Mở bằng bảng trượt để nhìn thấy ảnh trước khi chọn.
    box.querySelector('#d-skin').addEventListener('click', () => openSkinSheet(m));

    box.querySelector('#d-nick').addEventListener('click', () => {
      const v = prompt('Biệt danh mới (để trống = bỏ biệt danh):', m.nick || '');
      if (v === null) return;
      m.nick = v.trim().slice(0, 12) || null;
      save(); draw();
    });

    box.querySelector('#d-tobox').addEventListener('click', async () => {
      const aliveCount = G.p.party.filter(x => !isFainted(x)).length;
      if (G.p.party.length <= 1) { toast('Không thể gửi Tuxemon cuối cùng!'); return; }
      if (!isFainted(m) && aliveCount <= 1) { toast('Không thể gửi con cuối cùng còn sống!'); return; }
      if (G.p.box.length >= CONFIG.BOX_SIZE) { toast('Box đã đầy!'); return; }
      if (!await confirmDlg(`Gửi ${displayName(m)} vào Box?`)) return;
      G.p.box.push(G.p.party.splice(sel, 1)[0]);
      sel = null;
      save(); toast('Đã gửi vào Box.'); draw();
    });
  }

  // Bảng skin của một loài: ô "hình gốc" + từng skin admin tải lên
  function openSkinSheet(m) {
    const list = skinsFor(m.sp);
    if (!list.length) { toast('Chưa có skin nào cho loài này.'); return; }
    openSheet({
      title: `Skin cho ${displayName(m)}`,
      tabs: [{ id: 'skin', name: 'Skin', draw(sbox, api) {
        const lv = trainerLevel();
        const cur = G.p.monSkins?.[m.sp] || '';
        const cell = (id, name, img, worn, ok, note) => `
          <button type="button" class="fa-cell${worn ? ' worn' : ''}${ok ? '' : ' locked'}"
                  data-id="${esc(id)}" ${ok ? '' : 'disabled'}>
            ${worn ? '<span class="fa-worn">Đang mặc</span>' : ''}
            <span class="fa-art"><img class="fa-img" src="${esc(img)}" alt="" onerror="this.remove()"></span>
            <b class="fa-name">${esc(name)}</b>
            <small class="fa-req">${esc(note)}</small>
          </button>`;
        sbox.innerHTML = `<div class="fa-grid">
          ${cell('', 'Hình gốc', monPath(m.sp), !cur, true, cur ? 'Bấm để dùng' : '✓')}
          ${list.map(([id, d]) => {
            const ok = unlocked(d, G.p, lv);
            return cell(id, d.name, imgOf(d) || monPath(m.sp), cur === id, ok,
              ok ? (cur === id ? '✓' : 'Bấm để mặc') : requirement(d));
          }).join('')}
        </div>`;
        sbox.querySelectorAll('.fa-cell:not([disabled])').forEach(b => b.addEventListener('click', () => {
          const id = b.dataset.id;
          wearMonSkin(m.sp, id);
          toast(id ? `Đã mặc ${list.find(([x]) => x === id)[1].name}.` : 'Đã trả về hình gốc.');
          api.redraw();
          draw();
        }));
      } }],
    });
  }

  async function openBox() {
    if (G.p.box.length === 0) { toast('Box trống!'); return; }
    const i = await choose(`Box (${G.p.box.length}/${CONFIG.BOX_SIZE})`, G.p.box.map(m => ({
      label: `${displayName(m)} Lv.${m.lv}${m.shiny ? ' (Shiny)' : ''}`,
      sub: `HP ${m.hpCur}/${maxHp(m)}`,
    })));
    if (i === null) return;
    const m = G.p.box[i];
    if (G.p.party.length >= CONFIG.PARTY_MAX) {
      toast('Đội đã đủ 6 — gửi bớt vào Box trước!');
      return;
    }
    if (!await confirmDlg(`Rút ${displayName(m)} về đội?`)) return;
    G.p.party.push(G.p.box.splice(i, 1)[0]);
    save(); toast(`${displayName(m)} đã về đội!`); draw();
  }

  draw();
}
