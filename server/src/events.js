// TuxeWorld server | src/events.js | Sự kiện do admin tự dựng
//
// Một sự kiện gồm:
//   · thông tin chung: tên, mô tả, ảnh băng-rôn, thời gian mở/đóng
//   · ĐỒNG SỰ KIỆN (token): vật phẩm riêng của sự kiện, admin tự tải ảnh lên.
//     Người chơi kiếm được qua nhiệm vụ theo BIẾN CỦA GAME (đánh thắng bao
//     nhiêu trận, bắt bao nhiêu con, đi bao nhiêu bước...) rồi tiêu vào:
//   · ĐỔI THƯỞNG (shop): tích đủ đồng thì đổi lấy quà, mỗi món giới hạn số lần
//   · QUAY THƯỞNG (gacha): tốn đồng mỗi lượt, trúng theo trọng số
//
// Mọi thứ admin tự khai, máy chủ chỉ kiểm tra tính hợp lệ rồi chấm công.
import { getDb, markDirty, uid } from './db.js';
import { sendMail, addNews } from './inbox.js';

const now = () => Date.now();

// Biến của game mà nhiệm vụ sự kiện đọc được. Client gửi lên mốc hiện tại của
// từng biến; máy chủ so với mốc lúc bắt đầu sự kiện để biết đã làm được bao nhiêu.
export const BIEN_GAME = [
  { id: 'wins', name: 'Số trận thắng' },
  { id: 'catches', name: 'Số Tuxemon đã bắt' },
  { id: 'dexSeen', name: 'Số loài đã gặp' },
  { id: 'dexCaught', name: 'Số loài đã bắt' },
  { id: 'steps', name: 'Số bước đã đi' },
  { id: 'money', name: 'Tiền đang có' },
  { id: 'trainerLv', name: 'Cấp huấn luyện viên' },
  { id: 'badges', name: 'Số huy hiệu' },
  { id: 'playDays', name: 'Số ngày đã chơi' },
];

const ID_BIEN = new Set(BIEN_GAME.map(b => b.id));

function chuan(v, max) { return String(v || '').slice(0, max); }

function chuanQua(list) {
  return (list || []).filter(x => x && x.id)
    .map(x => ({ id: chuan(x.id, 40), n: Math.max(1, Math.round(Number(x.n) || 1)) }))
    .slice(0, 20);
}

export function listEvents() {
  return getDb().events || [];
}

export function activeEvents() {
  const t = now();
  return listEvents().filter(e => e.on && (!e.start || e.start <= t) && (!e.end || e.end >= t));
}

export function saveEvent(body, id = null) {
  const db = getDb();
  if (!Array.isArray(db.events)) db.events = [];
  const cu = id ? db.events.find(e => e.id === id) : null;
  if (id && !cu) return [null, 'Không tìm thấy sự kiện.'];

  const ten = chuan(body.name, 60).trim();
  if (!ten) return [null, 'Sự kiện phải có tên.'];

  const e = cu || { id: uid('ev'), createdAt: now() };
  e.name = ten;
  e.desc = chuan(body.desc, 2000);
  e.banner = chuan(body.banner, 300);
  e.on = body.on !== false;
  e.start = Number(body.start) || 0;
  e.end = Number(body.end) || 0;

  // Đồng sự kiện: mã + tên + ảnh admin tải lên
  e.token = {
    id: chuan(body.token?.id || 'token', 40).replace(/[^a-z0-9_]/gi, '').toLowerCase() || 'token',
    name: chuan(body.token?.name || 'Đồng sự kiện', 40),
    img: chuan(body.token?.img, 300),
  };

  // Nhiệm vụ: mỗi mục là {var, need, reward} — làm đủ 'need' của biến 'var' thì
  // nhận 'reward' đồng. Mỗi mốc chỉ nhận một lần.
  e.tasks = (body.tasks || []).filter(t => t && ID_BIEN.has(t.var))
    .map(t => ({
      id: chuan(t.id, 30) || uid('tk'),
      var: t.var,
      need: Math.max(1, Math.round(Number(t.need) || 1)),
      reward: Math.max(1, Math.round(Number(t.reward) || 1)),
      name: chuan(t.name, 80),
    }))
    .slice(0, 30);

  // Đổi thưởng: tốn 'cost' đồng lấy quà, giới hạn 'limit' lần (0 = thoải mái)
  e.shop = (body.shop || []).filter(x => x && (x.itemId || x.money))
    .map(x => ({
      id: chuan(x.id, 30) || uid('sh'),
      name: chuan(x.name, 60),
      img: chuan(x.img, 300),
      cost: Math.max(1, Math.round(Number(x.cost) || 1)),
      limit: Math.max(0, Math.round(Number(x.limit) || 0)),
      itemId: chuan(x.itemId, 40),
      itemN: Math.max(1, Math.round(Number(x.itemN) || 1)),
      money: Math.max(0, Math.round(Number(x.money) || 0)),
    }))
    .slice(0, 40);

  // Quay thưởng: tốn 'gachaCost' đồng một lượt, trúng theo trọng số 'w'
  e.gachaCost = Math.max(1, Math.round(Number(body.gachaCost) || 10));
  e.gacha = (body.gacha || []).filter(x => x && (x.itemId || x.money))
    .map(x => ({
      id: chuan(x.id, 30) || uid('gc'),
      name: chuan(x.name, 60),
      img: chuan(x.img, 300),
      w: Math.max(1, Math.round(Number(x.w) || 1)),
      itemId: chuan(x.itemId, 40),
      itemN: Math.max(1, Math.round(Number(x.itemN) || 1)),
      money: Math.max(0, Math.round(Number(x.money) || 0)),
    }))
    .slice(0, 40);

  if (!cu) db.events.push(e);
  markDirty();
  return [e, null];
}

export function deleteEvent(id) {
  const db = getDb();
  const truoc = (db.events || []).length;
  db.events = (db.events || []).filter(e => e.id !== id);
  markDirty();
  return truoc !== (db.events || []).length;
}

// ==== Phần của người chơi ====
// user.ev[eventId] = { token, done:[taskId], bought:{shopId:n}, base:{var:mốc} }
function hoSo(user, ev) {
  if (!user.ev) user.ev = {};
  if (!user.ev[ev.id]) user.ev[ev.id] = { token: 0, done: [], bought: {}, base: null };
  return user.ev[ev.id];
}

// Client gửi lên bảng biến hiện tại; lần đầu thì chốt làm mốc gốc
export function syncEvent(user, ev, vars) {
  const h = hoSo(user, ev);
  const v = {};
  for (const b of BIEN_GAME) v[b.id] = Math.max(0, Math.round(Number(vars?.[b.id]) || 0));
  if (!h.base) { h.base = v; markDirty(); }

  const xong = [];
  for (const t of ev.tasks || []) {
    if (h.done.includes(t.id)) continue;
    const lam = Math.max(0, (v[t.var] || 0) - (h.base[t.var] || 0));
    if (lam >= t.need) {
      h.done.push(t.id);
      h.token += t.reward;
      xong.push(t);
    }
  }
  if (xong.length) markDirty();
  return { token: h.token, done: h.done, xong, tien: tienDo(h, ev, v) };
}

// Tiến độ từng nhiệm vụ để client vẽ thanh
function tienDo(h, ev, v) {
  return (ev.tasks || []).map(t => ({
    id: t.id,
    lam: Math.min(t.need, Math.max(0, (v[t.var] || 0) - (h.base?.[t.var] || 0))),
    need: t.need,
    xong: h.done.includes(t.id),
  }));
}

export function eventState(user, ev) {
  const h = hoSo(user, ev);
  return { token: h.token, done: h.done, bought: h.bought };
}

// Đổi thưởng
export function buyEvent(user, ev, shopId) {
  const h = hoSo(user, ev);
  const it = (ev.shop || []).find(x => x.id === shopId);
  if (!it) return [null, 'Không có phần thưởng này.'];
  const da = h.bought[shopId] || 0;
  if (it.limit && da >= it.limit) return [null, 'Bạn đã đổi hết lượt món này.'];
  if (h.token < it.cost) return [null, `Còn thiếu ${it.cost - h.token} ${ev.token.name}.`];
  h.token -= it.cost;
  h.bought[shopId] = da + 1;
  markDirty();
  const qua = { money: it.money, items: it.itemId ? [{ id: it.itemId, n: it.itemN }] : [] };
  sendMail(user.id, {
    kind: 'event',
    title: `Phần thưởng ${ev.name}`,
    body: `Bạn đã đổi ${it.name || 'phần thưởng'}.`,
    items: qua.items,
    money: qua.money,
    from: ev.name,
  });
  return [{ token: h.token, qua }, null];
}

// Quay thưởng
export function rollEvent(user, ev, lan = 1) {
  const h = hoSo(user, ev);
  const n = Math.max(1, Math.min(10, Math.round(Number(lan) || 1)));
  if (!(ev.gacha || []).length) return [null, 'Sự kiện này không có vòng quay.'];
  const gia = ev.gachaCost * n;
  if (h.token < gia) return [null, `Còn thiếu ${gia - h.token} ${ev.token.name}.`];
  h.token -= gia;

  const tong = ev.gacha.reduce((a, x) => a + x.w, 0);
  const trung = [];
  for (let i = 0; i < n; i++) {
    let r = Math.random() * tong;
    for (const x of ev.gacha) { r -= x.w; if (r <= 0) { trung.push(x); break; } }
  }
  markDirty();

  const items = [];
  let money = 0;
  for (const x of trung) {
    money += x.money;
    if (!x.itemId) continue;
    const cu = items.find(y => y.id === x.itemId);
    if (cu) cu.n += x.itemN;
    else items.push({ id: x.itemId, n: x.itemN });
  }
  sendMail(user.id, {
    kind: 'event',
    title: `Vòng quay ${ev.name}`,
    body: `Quay ${n} lượt: ${trung.map(x => x.name || x.itemId).join(', ')}.`,
    items, money, from: ev.name,
  });
  return [{ token: h.token, trung: trung.map(x => ({ name: x.name, img: x.img })) }, null];
}

// Mở sự kiện thì đăng luôn một thông báo cho cả máy chủ
export function announceEvent(ev) {
  return addNews({
    kind: 'event',
    title: ev.name,
    body: ev.desc,
    banner: ev.banner,
    expires: ev.end || 0,
  });
}
