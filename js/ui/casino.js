// TuxeWorld H5 | ui/casino.js | Sòng bài Kim Long
//
// Năm trò, chung một màn: chọn trò -> đặt cược -> chơi -> kết toán.
// Toàn bộ chỉ dùng VÀNG KIẾM TRONG GAME, không có chỗ nào nạp tiền thật.
import { G } from '../state.js';
import { esc, tien } from '../util.js';
import { toast, header } from './kit.js';
import { refresh } from '../main.js';
import * as CS from '../engine/casino.js';
import * as CG from '../engine/casinogame.js';
import * as TL from '../engine/tienlen.js';

const NHA_TEN = ['Bạn', 'Út Mập', 'Chị Bảy', 'Ông Tư'];

export function render(el, { tro = null, from = 'menu' } = {}) {
  let dangTro = tro;
  let cuoc = CS.CUOC_MIN;
  let van = null;          // ván đang chơi của trò hiện tại
  let ke = '';             // dòng kể chuyện dưới bàn

  // Lá bài: rô và cơ tô đỏ, `up` là lá úp của nhà cái
  const laBai = (l, up = false) => `<span class="cs-la ${up ? 'up' : ''} ${CS.doLa(l) ? 'do' : ''}">${
    up ? '' : esc(CS.tenLa(l))}</span>`;

  // ==== Khung chung ====
  function veKhung(than, nut = '') {
    const [ok, err] = CS.choiDuoc();
    el.innerHTML = `
      ${header(dangTro ? CS.TRO_BY_ID[dangTro].ten : 'Sòng Bài Kim Long', dangTro ? null : from)}
      <div class="card cs-vi">
        <span>Vàng: <b>${tien(G.p?.money || 0)}</b></span>
        <span class="cs-ngay">Hôm nay thua: <b>${tien(CS.so().thua)}</b> / ${tien(CS.NGUONG_NGAY)}</span>
      </div>
      ${!ok && !van ? `<div class="card cs-chan">${esc(err)}</div>` : ''}
      ${than}
      ${ke ? `<div class="card cs-ke">${ke}</div>` : ''}
      ${nut}`;
    el.querySelector('#cs-ve')?.addEventListener('click', () => {
      dangTro = null; van = null; ke = ''; veHub();
    });
  }

  // ==== Màn chọn trò ====
  function veHub() {
    veKhung(`
      <div class="card cs-gioi">
        <b>Sòng bài Kim Long</b>
        <p>Cược bằng vàng kiếm trong game. Mỗi ngày thua quá
        <b>${tien(CS.NGUONG_NGAY)}</b> là nghỉ, mai chơi tiếp.</p>
      </div>
      <div class="cs-luoi">
        ${CS.TRO.map(t => `<button type="button" class="card cs-o" data-tro="${esc(t.id)}">
          <b>${esc(t.ten)}</b><small>${esc(t.mo)}</small>
        </button>`).join('')}
      </div>`);
    el.querySelectorAll('[data-tro]').forEach(b => b.addEventListener('click', () => {
      dangTro = b.dataset.tro;
      van = null;
      ke = '';
      veTro();
    }));
  }

  // Hàng chọn mức cược, dùng chung cho mọi trò
  function hangCuoc() {
    const max = CS.cuocToiDa();
    const muc = [100, 500, 1000, 2000, 5000].filter(x => x <= max);
    return `<div class="card cs-cuoc">
      <span>Cược: <b id="cs-so">${tien(cuoc)}</b></span>
      <div class="cs-muc">
        ${muc.map(x => `<button type="button" class="seg-btn ${x === cuoc ? 'active' : ''}"
          data-cuoc="${x}">${x >= 1000 ? (x / 1000) + 'K' : x}</button>`).join('')}
        ${max > 0 ? `<button type="button" class="seg-btn" data-cuoc="${max}">Tối đa</button>` : ''}
      </div>
    </div>`;
  }

  function ganCuoc() {
    el.querySelectorAll('[data-cuoc]').forEach(b => b.addEventListener('click', () => {
      cuoc = Number(b.dataset.cuoc);
      veTro();
    }));
  }

  const nutVe = '<button class="btn btn-lg" id="cs-ve">Về sảnh</button>';

  // Đặt cược chung: trả số vàng đã trừ, hoặc 0 nếu không được
  function batDau() {
    const [c, err] = CS.datCuoc(cuoc);
    if (err) { toast(err); return 0; }
    return c;
  }

  function chot(c, he, loi) {
    const nhan = Math.floor(c * he);
    const lai = CS.ketToan(c, nhan);
    ke = `${loi} — ${lai > 0 ? `<b class="cs-an">+${tien(lai)}</b>`
      : lai < 0 ? `<b class="cs-mat">${tien(lai)}</b>` : '<b>hoà vốn</b>'}`;
    refresh();
  }

  function veTro() {
    if (dangTro === 'slots') return veSlots();
    if (dangTro === 'coinflip') return veCoin();
    if (dangTro === 'blackjack') return veBlackjack();
    if (dangTro === 'domino') return veDomino();
    if (dangTro === 'tienlen') return veTienLen();
    return veHub();
  }

  // ==== Máy quay ====
  function veSlots() {
    const o = van?.o || ['bay', 'ngoc', 'chuong'];
    veKhung(`
      <div class="card cs-slot">
        <div class="cs-reel">${o.map(x => `<span class="cs-oq" data-o="${esc(x)}">
          ${esc(CG.O_QUAY.find(q => q.id === x)?.ten || '?')}</span>`).join('')}</div>
      </div>
      ${hangCuoc()}
      <div class="card cs-bang">
        <b>Bảng thưởng (ba ô giống nhau)</b>
        ${CG.O_QUAY.map(q => `<span>${esc(q.ten)} <b>×${CG.THUONG_BA[q.id]}</b></span>`).join('')}
        <small>Hai ô trùng: hoàn lại tiền cược.</small>
      </div>`,
    `<button class="btn btn-primary btn-lg" id="cs-quay">Quay</button>${nutVe}`);
    ganCuoc();
    el.querySelector('#cs-quay')?.addEventListener('click', () => {
      const c = batDau();
      if (!c) return;
      van = CG.quay();
      chot(c, van.he, van.ten);
      veSlots();
    });
  }

  // ==== Sấp ngửa ====
  function veCoin() {
    veKhung(`
      <div class="card cs-coin">
        <div class="cs-dong ${van?.ra || ''}">${van ? (van.ra === 'sap' ? 'SẤP' : 'NGỬA') : '?'}</div>
      </div>
      ${hangCuoc()}`,
    `<div class="cs-doi">
      ${CG.MAT.map(m => `<button class="btn btn-primary btn-lg" data-mat="${esc(m.id)}">${esc(m.ten)}</button>`).join('')}
    </div>${nutVe}`);
    ganCuoc();
    el.querySelectorAll('[data-mat]').forEach(b => b.addEventListener('click', () => {
      const c = batDau();
      if (!c) return;
      van = CG.tung(b.dataset.mat);
      chot(c, van.he, van.trung ? 'Đoán trúng!' : 'Trượt rồi');
      veCoin();
    }));
  }

  // ==== Xì dách ====
  function veBlackjack() {
    const v = van?.v;
    const hienNha = !v || v.xong;
    veKhung(`
      <div class="card cs-ban">
        <div class="cs-tay">
          <small>Nhà cái ${v && hienNha ? `— <b>${CG.diem(v.nha)}</b>` : ''}</small>
          <div class="cs-la-hang">${v ? v.nha.map((l, i) =>
            laBai(l, !hienNha && i > 0)).join('') : '<i>chưa chia</i>'}</div>
        </div>
        <div class="cs-tay">
          <small>Bạn ${v ? `— <b>${CG.diem(v.nguoi)}</b>` : ''}</small>
          <div class="cs-la-hang">${v ? v.nguoi.map(l => laBai(l)).join('') : '<i>chưa chia</i>'}</div>
        </div>
      </div>
      ${!v || v.xong ? hangCuoc() : ''}`,
    !v || v.xong
      ? `<button class="btn btn-primary btn-lg" id="cs-chia">Chia bài</button>${nutVe}`
      : `<div class="cs-doi">
          <button class="btn btn-primary btn-lg" id="cs-rut">Rút</button>
          <button class="btn btn-lg" id="cs-dung">Dừng</button>
        </div>`);
    ganCuoc();
    el.querySelector('#cs-chia')?.addEventListener('click', () => {
      const c = batDau();
      if (!c) return;
      const v2 = CG.chiaXiDach();
      van = { v: v2, cuoc: c };
      ke = '';
      if (CG.xiDach(v2.nguoi) || CG.xiDach(v2.nha)) {
        v2.xong = true;
        const r = CG.xuXiDach(v2);
        chot(c, r.he, r.ket === 'xidach' ? 'Xì dách!' : r.ket === 'hoa' ? 'Hoà' : 'Nhà cái xì dách');
      }
      veBlackjack();
    });
    el.querySelector('#cs-rut')?.addEventListener('click', () => {
      CG.rut(van.v);
      if (van.v.xong) {
        const r = CG.xuXiDach(van.v);
        chot(van.cuoc, r.he, 'Quắc rồi!');
      }
      veBlackjack();
    });
    el.querySelector('#cs-dung')?.addEventListener('click', () => {
      CG.nhaRut(van.v);
      const r = CG.xuXiDach(van.v);
      chot(van.cuoc, r.he,
        r.ket === 'thang' ? 'Bạn thắng!' : r.ket === 'hoa' ? 'Hoà' : 'Nhà cái thắng');
      veBlackjack();
    });
  }

  // ==== Đô-mi-nô ====
  function veDomino() {
    const v = van?.v;
    const quan = (q, cls = '') => `<span class="cs-quan ${cls}">${q[0]}<i></i>${q[1]}</span>`;
    veKhung(`
      <div class="card cs-ban">
        <small>Trên bàn${v && v.day.length ? ` — nối ${v.day[0][0]} … ${v.day[v.day.length - 1][1]}` : ''}</small>
        <div class="cs-day">${v && v.day.length ? v.day.map(q => quan(q)).join('')
          : '<i>bàn trống</i>'}</div>
        <small>Máy còn <b>${v ? v.may.length : '–'}</b> quân · nọc <b>${v ? v.noc.length : '–'}</b></small>
      </div>
      ${v && !v.xong ? `<div class="card cs-tay-toi">
        <small>Bài của bạn — bấm quân để đánh</small>
        <div class="cs-day">${v.nguoi.map((q, i) => {
          const duoc = CG.datDuoc(v, q).length > 0;
          return `<button type="button" class="cs-quan ${duoc ? 'duoc' : 'tit'}"
            data-q="${i}" ${duoc ? '' : 'disabled'}>${q[0]}<i></i>${q[1]}</button>`;
        }).join('')}</div>
      </div>` : ''}
      ${!v || v.xong ? hangCuoc() : ''}`,
    !v || v.xong
      ? `<button class="btn btn-primary btn-lg" id="cs-chia">Chia bài</button>${nutVe}`
      : `<button class="btn btn-lg" id="cs-boc">${v.noc.length ? 'Bốc quân' : 'Bỏ lượt'}</button>`);
    ganCuoc();
    el.querySelector('#cs-chia')?.addEventListener('click', () => {
      const c = batDau();
      if (!c) return;
      van = { v: CG.chiaDomino(), cuoc: c };
      ke = '';
      veDomino();
    });
    el.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => {
      const i = Number(b.dataset.q);
      const ben = CG.datDuoc(van.v, van.v.nguoi[i])[0];
      const [, err] = CG.danhDomino(van.v, 'nguoi', i, ben);
      if (err) { toast(err); return; }
      luotMay();
    }));
    el.querySelector('#cs-boc')?.addEventListener('click', () => {
      if (van.v.noc.length) {
        const q = CG.bocDomino(van.v, 'nguoi');
        toast(`Bốc được ${q[0]}|${q[1]}`);
        veDomino();
        return;
      }
      luotMay();
    });

    function luotMay() {
      CG.xetDomino(van.v);
      if (!van.v.xong) {
        CG.mayDiDomino(van.v);
        CG.xetDomino(van.v);
      }
      if (van.v.xong) {
        const k = van.v.ket;
        chot(van.cuoc, CG.heDomino(k),
          k === 'nguoi' ? 'Bạn hết bài trước!' : k === 'hoa' ? 'Hoà, tính nút bằng nhau' : 'Máy hết bài trước');
      }
      veDomino();
    }
  }

  // ==== Tiến lên ====
  function veTienLen() {
    const v = van?.v;
    const chon = van?.chon || [];
    const cua = (l) => chon.some(x => x.so === l.so && x.chat === l.chat);
    veKhung(`
      <div class="card cs-ban">
        <div class="cs-nha">
          ${[1, 2, 3].map(i => `<span class="${v && v.luot === i ? 'di' : ''}">
            ${esc(NHA_TEN[i])}: <b>${v ? v.tay[i].length : '–'}</b> lá</span>`).join('')}
        </div>
        <small>Trên bàn${v && v.ban.length ? ` — ${NHA_TEN[v.chuBan]} đánh` : ''}</small>
        <div class="cs-la-hang">${v && v.ban.length ? v.ban.map(l => laBai(l)).join('')
          : '<i>bàn trống</i>'}</div>
      </div>
      ${v && !TL.xong(v) ? `<div class="card cs-tay-toi">
        <small>Bài của bạn (${v.tay[0].length} lá)${v.luot === 0 ? ' — tới lượt bạn' : ' — chờ nhà khác'}</small>
        <div class="cs-la-hang chon">${v.tay[0].map((l, i) =>
          `<button type="button" class="cs-la ${CS.doLa(l) ? "do" : ""} ${cua(l) ? 'chon' : ''}"
            data-l="${i}">${esc(CS.tenLa(l))}</button>`).join('')}</div>
      </div>` : ''}
      ${!v || TL.xong(v) ? hangCuoc() : ''}`,
    !v || TL.xong(v)
      ? `<button class="btn btn-primary btn-lg" id="cs-chia">Chia bài</button>${nutVe}`
      : `<div class="cs-doi">
          <button class="btn btn-primary btn-lg" id="cs-danh" ${v.luot === 0 ? '' : 'disabled'}>Đánh</button>
          <button class="btn btn-lg" id="cs-bo" ${v.luot === 0 && v.ban.length ? '' : 'disabled'}>Bỏ lượt</button>
        </div>`);
    ganCuoc();
    el.querySelector('#cs-chia')?.addEventListener('click', () => {
      const c = batDau();
      if (!c) return;
      van = { v: TL.chia(), cuoc: c, chon: [] };
      ke = '';
      chayMay();
    });
    el.querySelectorAll('[data-l]').forEach(b => b.addEventListener('click', () => {
      const l = van.v.tay[0][Number(b.dataset.l)];
      van.chon = cua(l)
        ? van.chon.filter(x => !(x.so === l.so && x.chat === l.chat))
        : van.chon.concat([l]);
      veTienLen();
    }));
    el.querySelector('#cs-danh')?.addEventListener('click', () => {
      const [, err] = TL.danh(van.v, 0, van.chon);
      if (err) { toast(err); return; }
      van.chon = [];
      chayMay();
    });
    el.querySelector('#cs-bo')?.addEventListener('click', () => {
      const [, err] = TL.boLuot(van.v, 0);
      if (err) { toast(err); return; }
      van.chon = [];
      chayMay();
    });

    // Ba nhà máy đánh liên tiếp cho tới khi tới lượt người chơi
    function chayMay() {
      const v2 = van.v;
      let canh = 0;
      while (!TL.xong(v2) && v2.luot !== 0 && canh < 200) {
        canh += 1;
        const ai = v2.luot;
        const ds = TL.mayDanh(v2, ai);
        if (ds.length) TL.danh(v2, ai, ds);
        else TL.boLuot(v2, ai);
      }
      if (TL.xong(v2)) {
        const thu = v2.xong.indexOf(0);
        const he = TL.heTienLen(thu < 0 ? 3 : thu);
        const ten = ['nhất', 'nhì', 'ba', 'bét'][thu < 0 ? 3 : thu];
        chot(van.cuoc, he, `Bạn về ${ten}`);
      }
      veTienLen();
    }
  }

  if (dangTro) veTro(); else veHub();
}
