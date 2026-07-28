// TuxeWorld H5 | engine/daycare.js | Nhà Trẻ — port từ tuxemon/entity/daycare.py
//
// Một chỗ gửi tối đa HAI con, chạy một trong hai chế độ:
//   · 1 con, hoặc 2 con KHÔNG ghép đôi được  -> RÈN LUYỆN: mỗi bước đi cộng EXP,
//     đổi lại trừ tiền. Hết tiền thì ngừng cộng chứ không nợ.
//   · 2 con khác giới và cả hai đều đã qua dạng cơ bản -> NHÂN GIỐNG: đi đủ
//     REQUIRED_STEPS bước thì có con non, thừa hưởng chỉ số của bố mẹ.
//
// Bản gốc: entity/daycare.py (Daycare), states/daycare.py (màn hình).
import { rng } from '../util.js';
import { G, save, addMoney, addToParty, markCaught } from '../state.js';
import { newTuxemon, defaultMoves } from './monster.js';
import { gainExp } from './exp.js';
import { SPECIES } from '../data/species.js';
import { EVOLUTIONS } from '../data/evolutions.js';
import { COLD_LIST, WARM_LIST } from '../data/tastes.js';

export const TOI_DA = 2;                 // MAX_PARENTS
export const BUOC_CAN = 10000;           // required_steps
export const EXP_MOI_BUOC = 0.25;        // training_exp_rate
export const TIEN_MOI_EXP = 1.0;         // training_cost_rate

// Chỗ chứa nằm trong bản lưu để tắt game mở lại vẫn còn
export function kho() {
  if (!G.p.daycare) {
    G.p.daycare = { mons: [], buoc: 0, expLe: 0, tongExp: 0, tongTien: 0 };
  }
  const d = G.p.daycare;
  if (!Array.isArray(d.mons)) d.mons = [];
  return d;
}

// ==== Hạng tiến hoá: dạng cơ bản là 1, tiến hoá rồi thì cao hơn ====
// Bản gốc dùng monster.evolution_rank(); bản này suy từ trường 'stage' của loài.
const HANG = { basic: 1, standalone: 1, stage1: 2, stage2: 3 };
export const hangTienHoa = (sp) => HANG[SPECIES[sp]?.stage] || 1;

// Ghép đôi được không — _gender_pair_ok: khác giới, cả hai phải đực/cái thật
// (con vô tính không ghép được) và cả hai đều đã qua dạng cơ bản.
export function ghepDuoc(a, b) {
  if (!a || !b) return false;
  return a.gender !== b.gender
    && ['m', 'f'].includes(a.gender) && ['m', 'f'].includes(b.gender)
    && hangTienHoa(a.sp) > 1 && hangTienHoa(b.sp) > 1;
}

export function cheDo() {
  const d = kho();
  if (!d.mons.length) return 'trong';
  if (d.mons.length === 1 || !ghepDuoc(d.mons[0], d.mons[1])) return 'renluyen';
  if (sanSang()) return 'sansang';
  if (d.buoc >= BUOC_CAN / 2) return 'nuaduong';
  return 'nhangiong';
}

export function sanSang() {
  const d = kho();
  return d.mons.length === 2 && ghepDuoc(d.mons[0], d.mons[1]) && d.buoc >= BUOC_CAN;
}

// ==== Gửi / nhận lại ====
export function gui(slot) {
  const d = kho();
  if (d.mons.length >= TOI_DA) return [null, 'Nhà trẻ chỉ giữ được 2 con.'];
  const mon = G.p.party[slot];
  if (!mon) return [null, 'Không có con nào ở ô đó.'];
  if (G.p.party.length <= 1) return [null, 'Phải chừa lại ít nhất một con để đi đường.'];
  G.p.party.splice(slot, 1);
  d.mons.push(mon);
  if (d.mons.length === 1) d.buoc = 0;     // thêm con đầu thì đếm lại từ đầu
  d.expLe = 0;
  save();
  return [mon, null];
}

export function nhanVe() {
  const d = kho();
  const ds = d.mons.slice();
  d.mons = [];
  d.buoc = 0;
  d.expLe = 0;
  for (const m of ds) addToParty(m);
  save();
  return ds;
}

// ==== Mỗi bước đi ngoài bản đồ gọi vào đây ====
// Trả về sự kiện để màn hình báo: {t:'exp'|'nuaduong'|'sansang'}
export function moiBuoc(soBuoc = 1) {
  const d = kho();
  if (!d.mons.length) return null;

  // RÈN LUYỆN
  if (d.mons.length === 1 || !ghepDuoc(d.mons[0], d.mons[1])) {
    // Cộng dồn phần lẻ, không thì 0.25 EXP/bước bị cắt cụt thành 0 mãi mãi
    d.expLe += soBuoc * EXP_MOI_BUOC;
    const them = Math.floor(d.expLe);
    if (them <= 0) return null;
    const phi = Math.floor(them * TIEN_MOI_EXP);
    // Xét tiền TRƯỚC khi cộng EXP — thiếu thì giữ nguyên phần lẻ, chờ có tiền
    if (phi > (G.p.money || 0)) return { t: 'hettien' };
    d.expLe -= them;
    if (phi > 0) addMoney(-phi);
    for (const m of d.mons) gainExp(m, them);
    d.tongExp += them;
    d.tongTien += phi;
    save();
    return { t: 'exp', exp: them, tien: phi };
  }

  // NHÂN GIỐNG
  const truoc = d.buoc;
  d.buoc += soBuoc;
  save();
  const nua = Math.floor(BUOC_CAN / 2);
  if (truoc < nua && d.buoc >= nua) return { t: 'nuaduong' };
  if (truoc < BUOC_CAN && d.buoc >= BUOC_CAN) return { t: 'sansang' };
  return null;
}

// ==== Sinh con non ====
// Chọn "con giống" theo đúng thứ tự ưu tiên của bản gốc (_determine_seed)
function conGiong(me, cha) {
  const r = (m) => hangTienHoa(m.sp);
  if (r(me) !== r(cha)) return r(me) > r(cha) ? me : cha;
  const tong = (m) => Object.values(SPECIES[m.sp]?.base || {}).reduce((a, x) => a + x, 0);
  if (tong(me) !== tong(cha)) return tong(me) > tong(cha) ? me : cha;
  return rng.float() < 0.5 ? me : cha;
}

// Lần ngược chuỗi tiến hoá về dạng gốc — bản gốc lấy các mục stage BASIC trong
// monster.history rồi bốc ngẫu nhiên một cái.
export function dangGoc(sp) {
  const cha = new Map();
  for (const [tu, ds] of Object.entries(EVOLUTIONS)) {
    for (const e of ds) if (e.into !== undefined) cha.set(e.into, Number(tu));
  }
  let cur = Number(sp);
  const daQua = new Set([cur]);
  while (cha.has(cur)) {
    const tren = cha.get(cur);
    if (daQua.has(tren)) break;          // dữ liệu vòng tròn thì dừng
    daQua.add(tren);
    cur = tren;
  }
  return cur;
}

export function layConNon() {
  const d = kho();
  if (!sanSang()) return [null, 'Chưa tới lúc.'];
  const me = d.mons.find(m => m.gender === 'f');
  const cha = d.mons.find(m => m.gender === 'm');
  if (!me || !cha) return [null, 'Cặp này không sinh được.'];

  const giong = conGiong(me, cha);
  const kia = giong === me ? cha : me;
  const lv = Math.max(1, Math.floor((me.lv + cha.lv) / 2));
  const con = newTuxemon(dangGoc(giong.sp), lv);
  if (!con) return [null, 'Không tạo được con non.'];

  // IV: mỗi chỉ số lấy giá trị CAO HƠN của bố mẹ
  con.iv = con.iv.map((_, i) => Math.max(me.iv?.[i] || 0, cha.iv?.[i] || 0));

  // Thừa hưởng một chiêu ngẫu nhiên của con còn lại, nếu chưa có sẵn
  const chieuKia = (kia.moves || []).map(m => m.id);
  if (chieuKia.length) {
    const them = chieuKia[Math.floor(rng.float() * chieuKia.length)];
    if (!con.moves.some(m => m.id === them)) {
      if (con.moves.length < 4) con.moves.push({ id: them, cd: 0 });
      else con.moves[con.moves.length - 1] = { id: them, cd: 0 };
    }
  }

  // Khẩu vị: bốc của bố hoặc mẹ, có xác suất đột biến sang vị khác
  con.tasteWarm = dotBien(rng.float() < 0.5 ? me.tasteWarm : cha.tasteWarm, WARM_LIST);
  con.tasteCold = dotBien(rng.float() < 0.5 ? me.tasteCold : cha.tasteCold, COLD_LIST);
  con.hpCur = undefined;                 // để newTuxemon/stats tính lại máu đầy
  con.bred = true;                       // Acquisition.BRED của bản gốc

  d.buoc = 0;
  addToParty(con);
  markCaught(con.sp);
  save();
  return [con, null];
}

// _mutate_taste: 30% đổi sang một vị khác (bỏ vị "nhạt")
function dotBien(vi, ds) {
  if (rng.float() >= 0.3) return vi;
  const khac = ds.filter(x => x !== vi && x !== 'tasteless' && x !== 'bland');
  return khac.length ? khac[Math.floor(rng.float() * khac.length)] : vi;
}
