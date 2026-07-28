// TuxeWorld H5 | engine/furniture.js | Dùng nội thất: nằm, ngồi, ăn, tắm...
//
// Kê đồ xong thì phải dùng được, không thì chỉ là hình dán. Đứng cạnh món nào
// trong nhà mình, bấm nút hành động là làm việc tương ứng với món đó.
//
// Mỗi kiểu có một khoảng nghỉ riêng tính bằng GIỜ THẬT — tắt game vẫn chạy
// tiếp, y như thời gian xây nhà. Không có nghỉ thì nằm liên tục là hồi máu vô
// hạn, trạm hồi sức thành thừa.
import { G, save } from '../state.js';
import { heal, maxHp } from './monster.js';
import { FURN_BY_ID } from '../data/estate.js';

export const TEN_TUONG_TAC = {
  nam: 'nằm ngủ',
  ngoi: 'ngồi',
  ban: 'ăn cơm',
  den: 'bật đèn',
  tam: 'tắm rửa',
  nau: 'nấu ăn',
};

// Chữ hiện trên nút hành động
export const NUT_TUONG_TAC = {
  nam: 'Nằm ngủ',
  ngoi: 'Ngồi',
  ban: 'Ăn cơm',
  den: 'Bật/tắt đèn',
  tam: 'Tắm rửa',
  nau: 'Nấu ăn',
};

const PHUT = 60000;
// Khoảng nghỉ giữa hai lần dùng, tính bằng phút thật
export const NGHI = { nam: 120, ban: 45, tam: 60 };

function moc() {
  if (!G.p) return {};
  if (!G.p.noiThat || typeof G.p.noiThat !== 'object') G.p.noiThat = {};
  return G.p.noiThat;
}

export const conNghiMs = (kind) => {
  const m = moc()[kind] || 0;
  return Math.max(0, m + (NGHI[kind] || 0) * PHUT - Date.now());
};

export function conNghiChu(kind) {
  const ms = conNghiMs(kind);
  if (ms <= 0) return '';
  const p = Math.ceil(ms / PHUT);
  if (p < 60) return `${p} phút nữa`;
  return `${Math.floor(p / 60)} giờ ${p % 60} phút nữa`;
}

// Đèn nhà đang bật hay tắt (chỉ để vẽ, không ảnh hưởng lối chơi)
export const denDangBat = () => moc().den !== false;

// Tư thế hiện tại của nhân vật trong nhà: '' | 'nam' | 'ngoi'
let tuThe = '';
let monDangDung = null;
export const tuTheHienTai = () => tuThe;
export const monDangNgoi = () => monDangDung;
// Đặt tư thế từ bên ngoài — dùng cho lúc mở game lên đã nằm sẵn trên giường
// (giường nhà trọ không nằm trong danh sách đồ đã kê nên phải truyền vào).
export function datTuThe(kieu, mon = null) {
  tuThe = kieu || '';
  monDangDung = tuThe ? mon : null;
}

export function dungDay() {
  if (!tuThe) return false;
  tuThe = '';
  monDangDung = null;
  return true;
}

// Đếm số lần dùng — thành tựu và tường nhà đọc lại
function ghiNhan(kind) {
  const m = moc();
  m.soLan = m.soLan || {};
  m.soLan[kind] = (m.soLan[kind] || 0) + 1;
}
export const soLanDung = (kind) => (moc().soLan || {})[kind] || 0;

function doiMau() {
  const ds = G.p?.party || [];
  return ds.length ? ds : null;
}

/**
 * Dùng một món đã kê. Trả [lời nhắn, lỗi] — cùng kiểu với các engine khác.
 * @param {{id:string,x:number,y:number}} d món trong G.p.estate.dat
 */
export function dung(d) {
  const f = d && FURN_BY_ID[d.id];
  if (!f) return [null, 'Không có món này.'];
  const kind = f.kind || '';
  if (!kind) return [null, `${f.name} chỉ để cho đẹp nhà thôi.`];

  const cho = conNghiChu(kind);
  if (cho && kind !== 'ngoi' && kind !== 'den' && kind !== 'nau') {
    return [null, `Vừa ${TEN_TUONG_TAC[kind]} xong rồi, ${cho} hãy làm tiếp.`];
  }
  const m = moc();

  if (kind === 'ngoi') {
    if (tuThe === 'ngoi' && monDangDung === d) {
      dungDay();
      return [`Bạn đứng dậy khỏi ${f.name.toLowerCase()}.`, null];
    }
    tuThe = 'ngoi';
    monDangDung = d;
    ghiNhan('ngoi');
    save();
    return [`Bạn ngồi xuống ${f.name.toLowerCase()}. Đi một bước là đứng lên.`, null];
  }

  if (kind === 'den') {
    m.den = !denDangBat();
    save();
    return [m.den ? 'Bật đèn lên, nhà sáng hẳn.' : 'Tắt đèn, nhà tối om.', null];
  }

  if (kind === 'nau') {
    // Bếp thì mở thẳng màn Nhà Bếp — nấu ăn đã có sẵn hệ thống công thức rồi,
    // làm thêm một cái nữa chỉ tổ trùng.
    ghiNhan('nau');
    save();
    return [{ moMan: 'craft' }, null];
  }

  if (kind === 'nam') {
    // Nằm thì lúc nào cũng nằm được, kể cả chưa có con nào trong đội
    const ds = G.p?.party || [];
    ds.forEach(heal);
    m.nam = Date.now();
    ghiNhan('nam');
    tuThe = 'nam';                        // nằm luôn trên giường cho tới khi đi
    monDangDung = d;
    save();
    return [`Bạn ngả lưng lên ${f.name.toLowerCase()}.`
      + (ds.length ? ' Cả đội khoẻ lại hoàn toàn.' : ''), null];
  }

  const doi = doiMau();
  if (!doi) return [null, 'Chưa có Tuxemon nào trong đội.'];

  if (kind === 'ban') {
    // Bữa cơm hồi một phần chứ không đầy — muốn đầy thì đi ngủ
    let hoi = 0;
    for (const mon of doi) {
      const toi = maxHp(mon);
      const them = Math.min(Math.ceil(toi * 0.35), toi - (mon.hpCur || 0));
      if (them > 0) { mon.hpCur += them; hoi += them; }
    }
    m.ban = Date.now();
    ghiNhan('ban');
    save();
    return [hoi ? `Cả nhà ăn một bữa, đội hồi ${hoi} HP.`
      : 'Ăn xong, ai cũng no. Đội đang khoẻ sẵn rồi.', null];
  }

  if (kind === 'tam') {
    let sach = 0;
    for (const mon of doi) {
      if (mon.status) { mon.status = null; mon.statusTurns = 0; sach++; }
    }
    m.tam = Date.now();
    ghiNhan('tam');
    save();
    return [sach ? `Tắm rửa xong, ${sach} Tuxemon hết trạng thái xấu.`
      : 'Tắm một cái cho mát. Cả đội đang sạch sẽ khoẻ mạnh.', null];
  }

  return [null, `${f.name} chưa dùng được.`];
}
