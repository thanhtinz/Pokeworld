// TuxeWorld H5 | ui/boss.js | Boss thế giới và boss từng khu
//
// Boss có một thanh máu chung cho cả máy chủ. Ai cũng đánh được, sát thương
// cộng dồn; hạ xong thì quà chia theo bảng xếp hạng sát thương và gửi vào hộp
// thư. Trận đánh chạy bằng chính engine chiến đấu — đánh xong màn trận tự báo
// sát thương lên máy chủ.
import { esc, fmt, monPath } from '../util.js';
import { toast, header } from './kit.js';
import { G } from '../state.js';
import { isOnlineMode } from '../net/config.js';
import * as api from '../net/api.js';
import { netStatusCard, statusCardHtml, needServerHtml } from './netkit.js';
import { newTuxemon } from '../engine/monster.js';
import { SPECIES } from '../data/species.js';
import { MAPS } from '../data/maps.js';
import { show } from '../main.js';

const cho = (ms) => {
  const p = Math.ceil(ms / 60000);
  if (p < 60) return `${p} phút`;
  return `${Math.floor(p / 60)} giờ ${p % 60} phút`;
};

export function render(el, { from = 'menu' } = {}) {
  let tab = 'the_gioi';

  el.innerHTML = `
    ${header('Săn Boss', from)}
    ${statusCardHtml()}
    <div id="bs-body"></div>`;
  netStatusCard(el);

  const body = el.querySelector('#bs-body');
  if (!isOnlineMode()) { body.innerHTML = needServerHtml(); return; }

  let ds = [];
  let luotMoiNgay = 0;

  function the(b) {
    const pct = Math.max(0, Math.min(100, Math.round(b.hp * 100 / b.hpMax)));
    const sp = SPECIES[b.sp];
    const noi = b.zone ? (MAPS[b.zone]?.name || b.zone) : 'Khắp thế giới';
    return `<div class="card bs-row">
      <div class="bs-top">
        <img class="bs-mon" src="${esc(monPath(b.sp))}" alt="">
        <div class="bs-info">
          <b>${esc(b.name)}</b>
          <small>${esc(sp?.name || '?')} · Lv.${b.lv} · ${esc(noi)}</small>
          <small>${b.song ? `${b.soNguoi} người đang đánh` : `Hồi sinh sau ${cho(b.hoiSinhSau)}`}</small>
        </div>
      </div>
      <div class="bs-thanh"><i style="width:${pct}%"></i>
        <b>${fmt(b.hp)} / ${fmt(b.hpMax)}</b></div>
      <div class="bs-duoi">
        <small>Sát thương của bạn: <b>${fmt(b.cuaBan)}</b>
          · còn ${b.conLuot}/${luotMoiNgay} lượt hôm nay</small>
        ${b.song && b.conLuot > 0
          ? `<button class="btn btn-sm btn-primary" data-danh="${esc(b.id)}">Khiêu chiến</button>`
          : `<span class="gr-khong">${b.song ? 'hết lượt hôm nay' : 'chưa hiện'}</span>`}
      </div>
      <button class="btn btn-sm bs-bxh" data-bxh="${esc(b.id)}">Bảng sát thương</button>
    </div>`;
  }

  function draw() {
    const loc = ds.filter(b => b.kind === tab);
    body.innerHTML = `
      <div class="card"><p class="es-note">Boss dùng chung một thanh máu cho cả
      máy chủ. Đánh được bao nhiêu tính bấy nhiêu — thua hay bỏ chạy vẫn được
      ghi nhận. Hạ xong, ai sát thương cao thì quà to, quà gửi vào hộp thư.</p></div>
      <div class="seg-row">
        <button type="button" class="seg-btn ${tab === 'the_gioi' ? 'active' : ''}"
          data-tab="the_gioi">Boss thế giới</button>
        <button type="button" class="seg-btn ${tab === 'khu' ? 'active' : ''}"
          data-tab="khu">Boss khu vực</button>
      </div>
      ${loc.length ? loc.map(the).join('')
        : '<div class="card empty-note">Chưa có con nào.</div>'}`;

    body.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
      tab = b.dataset.tab; draw();
    }));
    body.querySelectorAll('[data-danh]').forEach(b =>
      b.addEventListener('click', () => khieuChien(b.dataset.danh)));
    body.querySelectorAll('[data-bxh]').forEach(b =>
      b.addEventListener('click', () => moBxh(b.dataset.bxh)));
  }

  function khieuChien(bossId) {
    const b = ds.find(x => x.id === bossId);
    if (!b) return;
    if (!(G.p.party || []).some(m => (m.hpCur || 0) > 0)) {
      toast('Cả đội đang gục, đi hồi sức đã.');
      return;
    }
    const mon = newTuxemon(b.sp, b.lv);
    if (!mon) { toast('Không dựng được con boss này.'); return; }
    show('battle', { kind: 'boss', enemy: mon, bossId, bossName: b.name, from: 'boss' });
  }

  async function moBxh(bossId) {
    const r = await api.fetchBoss(bossId);
    if (!r.ok) { toast(r.error); return; }
    const d = r.data;
    body.innerHTML = `
      <div class="card bs-head">
        <b>${esc(d.name)}</b>
        <small>${d.song ? `Còn ${fmt(d.hp)}/${fmt(d.hpMax)} máu` : 'Đang chờ hồi sinh'}</small>
      </div>
      <div class="card">
        <b>Bảng sát thương</b>
        ${d.top?.length ? d.top.map((x, i) => `
          <div class="guild-row">
            <span>${i + 1}. ${esc(x.username)}</span>
            <b>${fmt(x.dmg)}</b>
          </div>`).join('') : '<div class="empty-note">Chưa ai đánh con này.</div>'}
      </div>
      <button class="btn" id="bs-back">Quay lại danh sách</button>`;
    body.querySelector('#bs-back').addEventListener('click', () => draw());
  }

  async function nap() {
    body.innerHTML = '<div class="card"><div class="empty-note">Đang tải...</div></div>';
    const r = await api.fetchBosses();
    if (!r.ok) { body.innerHTML = `<div class="card empty-note">${esc(r.error)}</div>`; return; }
    ds = r.data?.ds || [];
    luotMoiNgay = r.data?.luotMoiNgay || 0;
    draw();
  }

  nap();
}
