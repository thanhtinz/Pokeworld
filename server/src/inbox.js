// TuxeWorld server | src/inbox.js | Hộp thư + Thông báo + Giftcode + Sự kiện
//
// HỘP THƯ (mail): thư gửi riêng cho một người chơi, kèm quà đính kèm. Nguồn thư:
//   giftcode  người chơi nhập mã
//   admin     admin phát quà tay hoặc phát cho tất cả
//   rank      thưởng bảng xếp hạng
//   event     thưởng sự kiện
// Quà nằm trong thư cho tới khi người chơi bấm nhận; nhận rồi thư vẫn còn để
// xem lại nhưng không nhận lại được.
//
// THÔNG BÁO (news): tin chung cho cả máy chủ — admin đăng tin tức hoặc mở sự
// kiện. Không có quà, chỉ để đọc. Ai đọc rồi thì lưu mốc thời gian đã đọc.
import { getDb, markDirty, uid, find, filter } from './db.js';

const now = () => Date.now();
const MAX_MAIL = 100;          // giữ tối đa ngần này thư mỗi người

// ==== Hộp thư ====
export function sendMail(userId, { kind = 'admin', title, body = '', items = [], money = 0, from = 'Hệ thống', expires = 0 }) {
  const db = getDb();
  const u = find('users', x => x.id === userId);
  if (!u) return null;
  if (!Array.isArray(u.mail)) u.mail = [];
  const mail = {
    id: uid(),
    kind,
    title: String(title || 'Thư mới').slice(0, 80),
    body: String(body || '').slice(0, 1000),
    from: String(from || 'Hệ thống').slice(0, 40),
    items: (items || []).filter(x => x && x.id)
      .map(x => ({ id: String(x.id).slice(0, 40), n: Math.max(1, Math.round(Number(x.n) || 1)) }))
      .slice(0, 20),
    money: Math.max(0, Math.round(Number(money) || 0)),
    ts: now(),
    expires: Number(expires) || 0,
    read: false,
    taken: false,
  };
  u.mail.unshift(mail);
  if (u.mail.length > MAX_MAIL) u.mail.length = MAX_MAIL;
  markDirty();
  return mail;
}

// Thư còn hạn (hết hạn thì coi như không có)
const conHan = (m) => !m.expires || m.expires > now();

export function listMail(user) {
  const ds = (user.mail || []).filter(conHan);
  return {
    mail: ds,
    unread: ds.filter(m => !m.read).length,
    unclaimed: ds.filter(m => !m.taken && (m.money > 0 || (m.items || []).length)).length,
  };
}

export function readMail(user, id) {
  const m = (user.mail || []).find(x => x.id === id);
  if (!m) return false;
  m.read = true;
  markDirty();
  return true;
}

// Nhận quà một thư. Trả về { money, items } để client cộng vào bản lưu.
export function claimMail(user, id) {
  const m = (user.mail || []).find(x => x.id === id && conHan(x));
  if (!m) return [null, 'Không tìm thấy thư.'];
  if (m.taken) return [null, 'Thư này đã nhận quà rồi.'];
  if (!m.money && !(m.items || []).length) return [null, 'Thư này không có quà.'];
  m.taken = true;
  m.read = true;
  markDirty();
  return [{ money: m.money, items: m.items }, null];
}

// Nhận hết cho nhanh
export function claimAllMail(user) {
  const co = (user.mail || []).filter(m => conHan(m) && !m.taken
    && (m.money > 0 || (m.items || []).length));
  const gop = { money: 0, items: [] };
  for (const m of co) {
    m.taken = true;
    m.read = true;
    gop.money += m.money;
    for (const it of m.items || []) {
      const cu = gop.items.find(x => x.id === it.id);
      if (cu) cu.n += it.n;
      else gop.items.push({ ...it });
    }
  }
  if (co.length) markDirty();
  return [gop, co.length];
}

export function deleteReadMail(user) {
  const truoc = (user.mail || []).length;
  user.mail = (user.mail || []).filter(m => !m.read || (!m.taken && (m.money > 0 || (m.items || []).length)));
  if (user.mail.length !== truoc) markDirty();
  return truoc - user.mail.length;
}

// ==== Thông báo chung ====
export function addNews({ kind = 'news', title, body = '', banner = '', pin = false, expires = 0 }) {
  const db = getDb();
  if (!Array.isArray(db.news)) db.news = [];
  const n = {
    id: uid(),
    kind,                                   // 'news' tin tức | 'event' sự kiện
    title: String(title || '').slice(0, 100),
    body: String(body || '').slice(0, 3000),
    banner: String(banner || '').slice(0, 300),
    pin: !!pin,
    ts: now(),
    expires: Number(expires) || 0,
  };
  db.news.unshift(n);
  if (db.news.length > 200) db.news.length = 200;
  markDirty();
  return n;
}

export function listNews(user) {
  const db = getDb();
  const ds = (db.news || []).filter(conHan);
  const seen = Number(user?.newsSeen || 0);
  return {
    news: ds,
    unread: ds.filter(n => n.ts > seen).length,
  };
}

export function markNewsSeen(user) {
  user.newsSeen = now();
  markDirty();
}

export function deleteNews(id) {
  const db = getDb();
  const truoc = (db.news || []).length;
  db.news = (db.news || []).filter(n => n.id !== id);
  markDirty();
  return truoc !== db.news.length;
}

// ==== Giftcode ====
// {code, reward:{money, items:[{id,n}]}, max (0 = không giới hạn), perUser, used:[userId], expires, note}
export function addCode({ code, money = 0, items = [], max = 0, expires = 0, note = '' }) {
  const db = getDb();
  if (!Array.isArray(db.codes)) db.codes = [];
  const ma = chuanHoaMa(code);
  if (!ma) return [null, 'Mã không hợp lệ.'];
  if (db.codes.some(c => c.code === ma)) return [null, 'Mã này đã tồn tại.'];
  const c = {
    id: uid(),
    code: ma,
    money: Math.max(0, Math.round(Number(money) || 0)),
    items: (items || []).filter(x => x && x.id)
      .map(x => ({ id: String(x.id).slice(0, 40), n: Math.max(1, Math.round(Number(x.n) || 1)) }))
      .slice(0, 20),
    max: Math.max(0, Math.round(Number(max) || 0)),
    expires: Number(expires) || 0,
    note: String(note || '').slice(0, 200),
    used: [],
    createdAt: now(),
  };
  db.codes.push(c);
  markDirty();
  return [c, null];
}

export const chuanHoaMa = (s) =>
  String(s || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24);

export function listCodes() {
  return (getDb().codes || []).map(c => ({ ...c, usedCount: c.used.length }));
}

export function deleteCode(id) {
  const db = getDb();
  const truoc = (db.codes || []).length;
  db.codes = (db.codes || []).filter(c => c.id !== id);
  markDirty();
  return truoc !== db.codes.length;
}

// Người chơi nhập mã: đúng thì gửi thẳng một lá thư kèm quà
export function redeemCode(user, raw) {
  const ma = chuanHoaMa(raw);
  if (!ma) return [null, 'Nhập mã đi đã.'];
  const db = getDb();
  const c = (db.codes || []).find(x => x.code === ma);
  if (!c) return [null, 'Mã không tồn tại.'];
  if (c.expires && c.expires < now()) return [null, 'Mã đã hết hạn.'];
  if (c.used.includes(user.id)) return [null, 'Bạn đã dùng mã này rồi.'];
  if (c.max && c.used.length >= c.max) return [null, 'Mã đã hết lượt.'];
  c.used.push(user.id);
  const mail = sendMail(user.id, {
    kind: 'giftcode',
    title: `Quà từ mã ${c.code}`,
    body: c.note || 'Cảm ơn bạn đã đồng hành cùng TuxeWorld!',
    items: c.items,
    money: c.money,
    from: 'Giftcode',
  });
  markDirty();
  return [mail, null];
}
