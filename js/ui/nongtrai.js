// TuxeWorld H5 | ui/nongtrai.js | Nhà kho: chợ, đơn hàng dân làng, kho nông sản
//
// Mở bằng cách nói chuyện với bác Nông trước cửa nhà kho trên bản đồ.
//
// Ba thẻ dùng chung một màn:
//   'cho' — mua hạt giống, cỏ khô, con vật, và thứ kê ra nông trại
//   'don' — bảng đơn hàng của dân làng, gom đủ thì giao
//   'kho' — nông sản đang có, bán lại cho bác Nông
//
// VIỆC ĐỒNG ÁNG KHÔNG NẰM Ở ĐÂY. Gieo, tưới, thu, cho thú ăn, kê lại bố cục —
// tất cả làm ngay trên bản đồ bằng nút A. Màn này chỉ là cái chợ với cái bảng
// đơn, đúng hai thứ mà đứng ngoài ruộng không làm được.
import { G } from '../state.js';
import * as NT from '../engine/nongtrai.js';
import { anhHat, anhMon, anhThu, anhNha, anhMay, anhDat } from '../data/nongtrai.js';
import { esc, tien, tienChu, monPath } from '../util.js';
import { displayName as tenHien } from '../engine/monster.js';
import { toast, header, choose, confirmDlg } from './kit.js';
import { isOnlineMode } from '../net/config.js';
import * as api from '../net/api.js';

const anhVat = (id) => {
  const loai = NT.VAT_BY_ID[id]?.loai;
  return loai === 'ruong' ? anhDat(false) : loai === 'may' ? anhMay(id) : anhNha(id);
};

// Một dòng "2 Sữa Bò → Bơ · 10 phút" cho từng công thức của máy
const chuCongThuc = (c) =>
  `${c.soVao} ${NT.MON_BY_ID[c.vao]?.name} → ${NT.MON_BY_ID[c.ra]?.name} · ${c.phut} phút`;

export function render(el, { tab = 'cho', from = 'world' } = {}) {
  NT.nt();
  NT.lamMoiDon();

  // ==== Thẻ Chợ ====
  function veCho() {
    const cam = NT.choKe();
    const t = NT.tomTat();
    return `
      ${cam ? `<div class="card nt-cam">
        <span><img src="${esc(anhVat(cam))}" alt=""> Đang cầm <b>${esc(NT.VAT_BY_ID[cam].name)}</b></span>
        <small>Ra bản đồ, đứng trước chỗ trống rồi bấm A để kê xuống.</small>
        <button class="btn btn-sm" id="nt-bo">Trả lại, lấy nửa tiền</button>
      </div>` : ''}

      <h3 class="nt-h3">Hạt giống</h3>
      <p class="nt-mo">Gieo ở ô ruộng. Cây chỉ lớn khi đất còn ướt — gieo xong nhớ tưới.</p>
      <div class="nt-luoi">${NT.CAY.map(c => `
        <div class="card nt-o">
          <span class="nt-anh"><img src="${esc(anhHat(c.id))}" alt=""></span>
          <b>${esc(c.name)}</b>
          <small>Chín sau ${c.phut * NT.CHIN} phút · bán ${tien(c.giaBan)}</small>
          <small class="nt-dang">Đang có ${NT.co(NT.maHat(c.id))} gói</small>
          <button class="btn btn-sm btn-primary nt-muahat" data-cay="${esc(c.id)}">
            Mua ${tien(c.giaHat)}</button>
        </div>`).join('')}</div>

      <h3 class="nt-h3">Cỏ khô</h3>
      <p class="nt-mo">Thú phải ăn mới ra lứa sản phẩm sau. Đang có
        <b>${NT.co('co_kho')}</b> bó.</p>
      <div class="nt-hang">
        <button class="btn btn-sm btn-primary nt-muaco" data-n="1">Mua 1 bó ${tien(NT.GIA_CO_KHO)}</button>
        <button class="btn btn-sm nt-muaco" data-n="10">Mua 10 bó ${tien(NT.GIA_CO_KHO * 10)}</button>
      </div>

      <h3 class="nt-h3">Con vật</h3>
      <p class="nt-mo">Đang nuôi <b>${t.thu}/${t.chua}</b> con. Muốn nuôi thêm thì kê chuồng.</p>
      <div class="nt-luoi">${NT.THU.map(a => `
        <div class="card nt-o">
          <span class="nt-anh nt-thu"><img src="${esc(anhThu(a.id))}" alt=""></span>
          <b>${esc(a.name)}</b>
          <small>Cho ${esc(NT.MON_BY_ID[a.sanPham]?.name || '')} sau ${a.phut} phút</small>
          <button class="btn btn-sm btn-primary nt-muathu" data-thu="${esc(a.id)}">
            Mua ${tien(a.gia)}</button>
        </div>`).join('')}</div>

      <h3 class="nt-h3">Kê ra nông trại</h3>
      <p class="nt-mo">Mua xong thì cầm ra bản đồ, đứng đâu ưng thì bấm A đặt xuống.
        Muốn dời chỗ thì bấm A ngay trước món đã kê. Máy chế biến biến nguyên
        liệu thô thành món đắt hơn hẳn — bỏ hàng vào rồi lát quay lại lấy.</p>
      <p class="nt-mo">Ô ruộng KHÔNG có ở đây: đất mua ngay tại chỗ nó, đi tới ô
        đang cắm biển bán trong khu trồng rồi bấm A.</p>
      <div class="nt-luoi">${NT.VAT_THE.filter(v => v.loai !== 'ruong').map(v => `
        <div class="card nt-o">
          <span class="nt-anh nt-vat ${v.loai === 'may' ? 'nt-may' : ''}">
            <img src="${esc(anhVat(v.id))}" alt=""></span>
          <b>${esc(v.name)}</b>
          <small>${v.loai === 'ruong' ? 'Gieo hạt được'
            : v.loai === 'chuong' ? `Nuôi thêm ${v.chua} con`
            : v.loai === 'may' ? NT.congThucCua(v.id).map(chuCongThuc).join('<br>')
            : 'Kê cho đẹp'}</small>
          <button class="btn btn-sm btn-primary nt-muavat" data-vat="${esc(v.id)}"
            ${cam ? 'disabled' : ''}>Mua ${tien(v.gia)}</button>
        </div>`).join('')}</div>`;
  }

  // ==== Thẻ Đơn hàng ====
  function veDon() {
    const n = NT.nt();
    if (!n.don.length) {
      return `<div class="card empty-note">Chưa có đơn nào. Dân làng gửi thêm
        sau khoảng ${NT.PHUT_RA_DON} phút.</div>`;
    }
    return `
      <div class="card nt-tong">
        <span>Uy tín nông trại: <b>${n.diem}</b></span>
        <small>Đơn trả cao hơn bán lẻ ${Math.round((NT.HE_SO_DON - 1) * 100)}%.</small>
      </div>
      ${n.don.map(d => {
        const du = NT.duMon(d);
        return `<div class="card nt-don ${du ? 'du' : ''}">
          <b>${esc(d.khach)}</b>
          <div class="nt-donmon">${d.mon.map(m => {
            const co = NT.co(m.id);
            return `<span class="nt-monnho ${co >= m.n ? 'du' : ''}">
              <img src="${esc(anhMon(m.id))}" alt="">
              ${esc(NT.MON_BY_ID[m.id]?.name || m.id)} ${co}/${m.n}</span>`;
          }).join('')}</div>
          <span class="nt-dongia">${tien(d.tien)} · +${d.diem} uy tín</span>
          <span class="nt-donnut">
            <button class="btn btn-sm btn-primary nt-giao" data-ma="${esc(d.ma)}"
              ${du ? '' : 'disabled'}>${du ? 'Giao hàng' : 'Chưa đủ'}</button>
            <button class="btn btn-sm nt-bodon" data-ma="${esc(d.ma)}">Bỏ đơn</button>
          </span>
        </div>`;
      }).join('')}`;
  }

  // ==== Thẻ Kho ====
  function veKho() {
    const k = NT.kho();
    const ds = Object.keys(k).filter(id => k[id] > 0);
    if (!ds.length) return '<div class="card empty-note">Kho trống. Ra ruộng thu vài lứa đã.</div>';
    const banDuoc = ds.filter(id => NT.MON_BY_ID[id] && id !== 'co_kho');
    const tongTien = banDuoc.reduce((a, id) => a + NT.MON_BY_ID[id].gia * k[id], 0);
    return `
      <div class="card nt-tong">
        <span>Kho: <b>${ds.reduce((a, id) => a + k[id], 0)}</b> món</span>
        ${banDuoc.length ? `<button class="btn btn-sm btn-primary" id="nt-banhet">
          Bán hết ${tien(tongTien)}</button>` : ''}
      </div>
      <p class="nt-mo">Cỏ khô để nuôi thú nên bác Nông không mua lại. Hạt giống cũng vậy.</p>
      <div class="nt-luoi">${ds.map(id => {
        const hat = NT.laHat(id);
        const c = hat ? NT.cayCuaHat(id) : null;
        const m = NT.MON_BY_ID[id];
        const ten = hat ? `Hạt ${c?.name || id}` : (m?.name || id);
        const anh = hat ? anhHat(c?.id || '') : anhMon(id);
        return `<div class="card nt-o">
          <span class="nt-anh"><img src="${esc(anh)}" alt=""></span>
          <b>${esc(ten)}</b>
          <small>Đang có ${k[id]}</small>
          ${(!hat && m && id !== 'co_kho')
            ? `<button class="btn btn-sm nt-ban" data-mon="${esc(id)}">Bán ${tien(m.gia)}/cái</button>`
            : '<small class="nt-dang">Không bán lại</small>'}
        </div>`;
      }).join('')}</div>`;
  }

  // ==== Thẻ Canh Gác ====
  //
  // Gom cả ba việc liên quan tới chuyện bị cướp vào một chỗ: cắt con canh, xem
  // nhật ký ai đã mò vào, và ghé nông trại người khác. Rải ra ba màn thì người
  // chơi bị cướp xong chẳng biết vào đâu mà xử.
  let nhatKy = null;          // null = chưa tải
  let ntBan = null;           // nông trại vừa ghé

  function veCanh() {
    const c = NT.thuCanh();
    const ti = Math.round(NT.tiLeBiCuop(c?.lv || 0) * 100);
    const doi = (G.p?.party || []);
    return `
      <div class="card nt-canh">
        <b>Thú canh nông trại</b>
        ${c ? `<span class="nt-canh-con">
            <img src="${esc(monPath(c.sp))}" alt="">
            <span><b>${esc(tenHien({ sp: c.sp }))}</b><small>Lv.${c.lv}</small></span>
          </span>`
          : '<small>Chưa cắt con nào. Nông trại không có ai canh.</small>'}
        <small>Tỉ lệ bị cướp mỗi lần có người mò vào: <b>${ti}%</b></small>
        <span class="nt-donnut">
          <button class="btn btn-sm btn-primary" id="nt-cat-canh">
            ${c ? 'Đổi con khác' : 'Cắt một con ra canh'}</button>
          ${c ? '<button class="btn btn-sm" id="nt-goi-canh">Gọi về đội</button>' : ''}
        </span>
        <small class="nt-dang">Con đang canh không đánh nhau được. Đội đang có
          ${doi.length} con.</small>
      </div>

      <h3 class="nt-h3">Ai đã mò vào</h3>
      ${!isOnlineMode()
        ? '<div class="card empty-note">Chế độ Offline thì không ai vào được.</div>'
        : nhatKy === null
          ? '<div class="card empty-note">Đang tải...</div>'
          : (nhatKy.length
            ? `<div class="nt-luoi">${nhatKy.map(r => `<div class="card nt-don">
                <b>${esc(r.ai)}</b>
                <small>${r.duoc
                  ? `lấy mất ${r.so} ${esc(NT.MON_BY_ID[r.mon]?.name || r.mon)}`
                  : 'về không'}${r.coCanh ? ' · có thú canh' : ' · không ai canh'}</small>
                <small class="nt-dang">${esc(khiNao(r.ts))}</small>
              </div>`).join('')}</div>`
            : '<div class="card empty-note">Chưa ai mò vào nông trại.</div>')}

      <h3 class="nt-h3">Ghé nông trại người khác</h3>
      <p class="nt-mo">Ghé xem rồi lấy bớt nông sản của họ. Nông trại nào có thú
        canh thì khó ăn hơn hẳn, mà chủ nhà cũng luôn biết là bạn đã tới.</p>
      ${!isOnlineMode()
        ? '<div class="card empty-note">Cần chơi ở máy chủ online.</div>'
        : `<div class="nt-hang">
            <input id="nt-ten-ban" type="text" maxlength="20" placeholder="Tên người chơi">
            <button class="btn btn-sm btn-primary" id="nt-ghe">Ghé</button>
          </div>
          ${ntBan ? theNongTraiBan(ntBan) : ''}`}`;
  }

  function theNongTraiBan(f) {
    const cho = f.choCuopMs > 0;
    return `<div class="card nt-don ${cho ? '' : 'du'}">
      <b>${esc(f.username)}</b>
      <small>${f.ruong} ô ruộng · ${f.thu} con · uy tín ${f.diem}</small>
      <small>${f.canh
        ? `Có <b>${esc(tenHien({ sp: f.canh.sp }))} Lv.${f.canh.lv}</b> canh`
        : 'Không ai canh'} · lấy được ~<b>${Math.round(f.tiLeCuop * 100)}%</b></small>
      <small>${f.coGi.length
        ? `Trong kho: ${f.coGi.map(id => esc(NT.MON_BY_ID[id]?.name || id)).join(', ')}`
        : 'Kho đang trống'}</small>
      <span class="nt-donnut">
        <button class="btn btn-sm btn-primary" id="nt-cuop"
          ${f.laMinh || cho || !f.coGi.length ? 'disabled' : ''}>
          ${f.laMinh ? 'Nông trại của bạn'
            : cho ? `Chờ ${Math.ceil(f.choCuopMs / 3600000)} giờ`
            : f.coGi.length ? 'Lấy bớt' : 'Chẳng có gì'}</button>
      </span>
    </div>`;
  }

  const khiNao = (ts) => {
    const p = Math.floor((Date.now() - ts) / 60000);
    if (p < 1) return 'vừa xong';
    if (p < 60) return `${p} phút trước`;
    if (p < 1440) return `${Math.floor(p / 60)} giờ trước`;
    return `${Math.floor(p / 1440)} ngày trước`;
  };

  // Một dòng gọn: nông trại đang có việc gì chờ tay người. Mọi thứ ở đây chạy
  // theo giờ THẬT nên quay lại mà phải đi soi từng ô thì mệt.
  function veViec() {
    const v = NT.viecDangCho();
    const ds = [
      [v.chin, 'ô chín'], [v.khat, 'ô khát nước'], [v.mayXong, 'máy có hàng'],
      [v.thuXong, 'con chờ thu'], [v.thuDoi, 'con đang đói'], [v.donDu, 'đơn giao được'],
    ].filter(([n2]) => n2 > 0).map(([n2, t]) => `${n2} ${t}`);
    if (!ds.length) return '';
    return `<div class="card nt-viec">${esc(ds.join(' · '))}</div>`;
  }

  function ve() {
    el.innerHTML = `
      ${header('Nông Trại', from)}
      ${veViec()}
      <div class="nt-tab">
        ${[['cho', 'Chợ'], ['don', 'Đơn Hàng'], ['kho', 'Kho'], ['canh', 'Canh Gác']]
          .map(([k, t]) => `<button type="button" class="seg-btn ${tab === k ? 'active' : ''}"
            data-tab="${k}">${t}</button>`).join('')}
      </div>
      ${tab === 'cho' ? veCho() : tab === 'don' ? veDon()
        : tab === 'canh' ? veCanh() : veKho()}`;

    if (tab === 'canh') nutCanh();

    el.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
      tab = b.dataset.tab; ve();
    }));

    el.querySelectorAll('.nt-muahat').forEach(b => b.addEventListener('click', () => {
      const [gia, err] = NT.muaHat(b.dataset.cay);
      toast(err || `Mua một gói hạt, trả ${tienChu(gia)}.`);
      ve();
    }));
    el.querySelectorAll('.nt-muaco').forEach(b => b.addEventListener('click', () => {
      const [gia, err] = NT.muaCoKho(+b.dataset.n);
      toast(err || `Mua ${b.dataset.n} bó cỏ, trả ${tienChu(gia)}.`);
      ve();
    }));
    el.querySelectorAll('.nt-muathu').forEach(b => b.addEventListener('click', () => {
      // Con vật thả ngay vào nông trại, đứng cạnh cổng cho dễ tìm
      const cho = NT.choTrongCho();
      const [t, err] = NT.muaThu(b.dataset.thu, cho.x, cho.y);
      toast(err || `${t.name} về nông trại rồi.`);
      ve();
    }));
    el.querySelectorAll('.nt-muavat').forEach(b => b.addEventListener('click', () => {
      const [v, err] = NT.mua(b.dataset.vat);
      toast(err || `Đã mua ${v.name}.`);
      ve();
    }));
    el.querySelector('#nt-bo')?.addEventListener('click', () => {
      const [lai, err] = NT.boMonDangCam();
      toast(err || `Trả lại, nhận về ${tienChu(lai)}.`);
      ve();
    });

    el.querySelectorAll('.nt-giao').forEach(b => b.addEventListener('click', () => {
      const [r, err] = NT.giaoDon(b.dataset.ma);
      toast(err || `Giao xong! Nhận ${tienChu(r.tien)} và +${r.diem} uy tín.`);
      ve();
    }));
    el.querySelectorAll('.nt-bodon').forEach(b => b.addEventListener('click', () => {
      NT.boDon(b.dataset.ma);
      toast('Đã bỏ đơn. Lát nữa sẽ có đơn khác.');
      ve();
    }));

    el.querySelectorAll('.nt-ban').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.mon;
      const [t, err] = NT.ban(id, NT.co(id));
      toast(err || `Bán hết ${NT.MON_BY_ID[id]?.name}, thu ${tienChu(t)}.`);
      ve();
    }));
    el.querySelector('#nt-banhet')?.addEventListener('click', () => {
      const t = NT.banHet();
      toast(t ? `Bán sạch kho, thu ${tienChu(t)}.` : 'Không có gì để bán.');
      ve();
    });
  }

  // ==== Nút của thẻ Canh Gác ====
  function nutCanh() {
    if (tab === 'canh' && nhatKy === null && isOnlineMode()) {
      api.fetchFarmLog().then(r => { nhatKy = r.nhatKy || []; ve(); })
        .catch(() => { nhatKy = []; ve(); });
    }
    el.querySelector('#nt-cat-canh')?.addEventListener('click', async () => {
      const doi = (G.p?.party || []);
      if (doi.length <= 1) {
        toast('Chỉ còn một con trong đội — cắt đi thì đánh nhau bằng gì.');
        return;
      }
      const i = await choose('Cắt con nào ra canh', doi.map(m => ({
        label: tenHien(m), sub: `Lv.${m.lv}` })).concat([{ label: 'Thôi' }]));
      if (i < 0 || i >= doi.length) return;
      const [con, err] = NT.catThuCanh(i);
      toast(err || `${tenHien(con)} ra canh nông trại.`);
      ve();
    });
    el.querySelector('#nt-goi-canh')?.addEventListener('click', () => {
      const [, err] = NT.goiThuCanhVe();
      toast(err || 'Đã gọi về đội. Nông trại không còn ai canh.');
      ve();
    });
    el.querySelector('#nt-ghe')?.addEventListener('click', async () => {
      const ten = el.querySelector('#nt-ten-ban')?.value.trim();
      if (!ten) { toast('Nhập tên người chơi đã.'); return; }
      try {
        ntBan = await api.fetchFarm(ten);
        ve();
      } catch (e) { toast(e.message || 'Không xem được nông trại đó.'); }
    });
    el.querySelector('#nt-cuop')?.addEventListener('click', async () => {
      if (!ntBan) return;
      if (!await confirmDlg(`Lấy bớt nông sản của ${ntBan.username}? Chủ nhà sẽ biết.`,
        'Lấy bớt')) return;
      try {
        const r = await api.raidFarm(ntBan.username);
        if (r.rong) toast('Kho họ trống trơn, chẳng có gì mà lấy.');
        else if (r.duoc) {
          NT.them(r.mon, r.so);
          toast(`Lấy được ${r.so} ${NT.MON_BY_ID[r.mon]?.name || r.mon}.`);
        } else {
          toast(r.canh ? 'Thú canh chặn được, về không.' : 'Không lấy được gì.');
        }
        ntBan = await api.fetchFarm(ntBan.username);
        nhatKy = null;
        ve();
      } catch (e) { toast(e.message || 'Không lấy được.'); }
    });
  }

  ve();
}
