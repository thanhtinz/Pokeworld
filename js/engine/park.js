// TuxeWorld H5 | engine/park.js | Công Viên Pepper — port từ Tuxemon
//
// Bản gốc: tuxemon/park_tracker.py (ParkSession / ParkTracker / ParkEncounter),
// tuxemon/core/effects/park.py (ném bóng công viên), db/item/tuxeball_park.yaml.
//
// Luật: trả tiền vào cổng, được một số bước đi có hạn và một nắm Tuxeball Công
// Viên. Gặp con nào thì KHÔNG đánh nhau — chỉ được ném bóng, cho ăn, hoặc bỏ
// qua. Mỗi cuộc gặp có số lượt riêng, hết lượt hoặc bốc trúng tỉ lệ bỏ chạy là
// nó chuồn. Ra cổng thì tổng kết cả buổi.
import { rng } from '../util.js';
import { G, save, addMoney, markSeen, markCaught, addToParty } from '../state.js';
import { newTuxemon, stats } from './monster.js';
import { attemptCatch } from './catchmon.js';
import { SPECIES } from '../data/species.js';

// Bản gốc: eclipse_park_steps100 — "You still have 100 steps left!"
export const BUOC = 100;
export const GIA_VE = 5000;
export const SO_BONG = 30;
export const BONG = 'tuxeball_park';
export const LUOT_MOI_CON = 30;          // ParkEncounter initial_turns

// Loài gặp trong công viên: bản gốc là bản đồ riêng. Bản này chọn theo cùng
// một luật — loài nào KHÔNG phải khởi đầu và không bị đánh dấu ẩn.
function danhSachLoai() {
  return Object.keys(SPECIES).map(Number).filter(id => !SPECIES[id].glitched);
}

// Một buổi đi công viên
export const park = {
  dang: false,
  buoc: 0,
  bong: 0,
  gap: null,          // { mon, luot, chay } — con đang đứng trước mặt
  // ParkTracker
  loaiDaGap: {},      // slug -> số lần gặp
  batDuoc: 0,
  nemHut: 0,
};

export function dangOCongVien() { return park.dang; }

export function vaoCongVien() {
  if (park.dang) return [null, 'Bạn đang ở trong công viên rồi.'];
  if ((G.p.money || 0) < GIA_VE) return [null, 'Không đủ tiền mua vé vào cổng.'];
  addMoney(-GIA_VE);
  park.dang = true;
  park.buoc = BUOC;
  park.bong = SO_BONG;
  park.gap = null;
  park.loaiDaGap = {};
  park.batDuoc = 0;
  park.nemHut = 0;
  save();
  return [{ buoc: park.buoc, bong: park.bong }, null];
}

// Tỉ lệ bỏ chạy ban đầu — ParkEncounter._calculate_initial_flee_rate:
// nền 0.05, con nào tốc độ trên 80 thì cộng thêm 0.05
function tiLeChay(mon) {
  let r = 0.05;
  if (stats(mon).speed > 80) r += 0.05;
  return Math.min(r, 1);
}

// Đi một bước trong công viên. Trả về sự kiện cho màn hình vẽ.
export function buocTrongCongVien() {
  if (!park.dang) return null;
  if (park.gap) return null;                 // đang đứng trước một con thì thôi
  park.buoc -= 1;
  if (park.buoc <= 0) return { t: 'hetBuoc' };
  // Cứ khoảng 1/4 số bước thì gặp một con
  if (!rng.roll(0.25)) return { t: 'diTiep' };

  const ds = danhSachLoai();
  const sp = ds[Math.floor(rng.float() * ds.length)];
  const mon = newTuxemon(sp, 5 + Math.floor(rng.float() * 26));
  if (!mon) return { t: 'diTiep' };
  const slug = SPECIES[sp].slug;
  park.loaiDaGap[slug] = (park.loaiDaGap[slug] || 0) + 1;
  markSeen(sp);
  park.gap = { mon, luot: LUOT_MOI_CON, chay: tiLeChay(mon) };
  save();
  return { t: 'gap', mon };
}

// Sáu câu tả bộ dạng con vật khi ném hụt — menu_park_* của bản gốc
export const DANG_VE = [
  'co rúm lại, sẵn sàng bỏ chạy',
  'nhìn chằm chằm vào bạn, không đoán được đang nghĩ gì',
  'đi lững thững, như đang mải nghĩ chuyện đâu đâu',
  'nằm cuộn tròn, thở đều đều',
  'chạy vòng vòng tung cả bụi lên vì phấn khích',
  'khựng lại, hình như đánh hơi thấy gì đó',
];

function ketThucGap(ly) {
  park.gap = null;
  save();
  return ly;
}

// Ném bóng. Trả { bat, lac, dangVe, hetBong }
export function nemBong() {
  if (!park.gap) return null;
  if (park.bong <= 0) return { hetBong: true };
  park.bong -= 1;
  const g = park.gap;
  // Dùng đúng công thức bắt của bản gốc (engine/catchmon.js), chỉ khác loại bóng
  const mon = g.mon;
  const kq = attemptCatch(mon, BONG);
  if (kq.caught) {
    markCaught(mon.sp);
    mon.ball = BONG;
    addToParty(mon);
    park.batDuoc += 1;
    ketThucGap(null);
    save();
    return { bat: true, lac: kq.shakes, mon };
  }
  const lac = kq.shakes;
  park.nemHut += 1;
  const dangVe = DANG_VE[Math.floor(rng.float() * DANG_VE.length)];
  const hetGap = truLuot();
  save();
  return { bat: false, lac, dangVe, chay: hetGap };
}

// Cho ăn: con vật bớt cảnh giác nên khó bỏ chạy hơn (apply_item_modifiers
// với flee_rate_reduction của bản gốc), nhưng tốn một lượt.
export function choAn() {
  if (!park.gap) return null;
  park.gap.chay = Math.max(0, park.gap.chay - 0.03);
  const hetGap = truLuot();
  save();
  return { chay: hetGap, tiLe: park.gap ? park.gap.chay : 0 };
}

// Hết lượt hoặc bốc trúng tỉ lệ thì con vật chuồn. Trả true nếu nó đã đi.
function truLuot() {
  const g = park.gap;
  if (!g) return true;
  g.luot -= 1;
  if (g.luot <= 0 || rng.roll(g.chay)) { ketThucGap(null); return true; }
  return false;
}

export function boQua() {
  if (!park.gap) return null;
  ketThucGap(null);
  return { boQua: true };
}

// Ra cổng — trả bảng tổng kết (menu_park_summary của bản gốc)
export function raCong() {
  const tong = park.batDuoc + park.nemHut;
  const tk = {
    tong,
    bat: park.batDuoc,
    hut: park.nemHut,
    tiLe: tong ? park.batDuoc / tong : 0,
    soLoai: Object.keys(park.loaiDaGap).length,
    hayGap: Object.entries(park.loaiDaGap).sort((a, b) => b[1] - a[1]).slice(0, 5),
    buocConLai: Math.max(0, park.buoc),
  };
  park.dang = false;
  park.gap = null;
  save();
  return tk;
}
