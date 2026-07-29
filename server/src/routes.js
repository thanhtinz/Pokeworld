// TuxeWorld server | src/routes.js | REST API cho client
import express from 'express';
import { diemCauCa } from './ca.data.js';
import { getDb, find, filter, markDirty } from './db.js';
import { registerUser, loginUser, signToken, publicUser, authRequired } from './auth.js';
import { validateSave } from './validate.js';
import {
  sendFriendRequest, respondFriendRequest, listFriends, removeFriend,
  proposeMarriage, respondMarriage, divorce, marriageInfo,
} from './social.js';
import { guildRouter, guildOf } from './guild.js';
import { onlineList } from './hub.js';
import { chatRouter } from './chat.js';
import { homeRouter } from './homes.js';
import { farmRouter } from './farms.js';
import { giftRouter } from './gifts.js';
import { bossRouter, datHookDanhBoss } from './boss.js';
import { ghiCong } from './guildquest.js';
import { publicCosmetics, cosmeticsOf } from './cosmetics.js';
import {
  listMail, readMail, claimMail, claimAllMail, deleteReadMail,
  listNews, markNewsSeen, redeemCode,
} from './inbox.js';
import { activeEvents, eventState, syncEvent, buyEvent, rollEvent, BIEN_GAME } from './events.js';

export const router = express.Router();

// ==== Bang hội + tin nhắn ====
router.use('/guild', guildRouter);
router.use('/chat', chatRouter);
// Thăm nhà bạn + tường nhà
router.use('/home', homeRouter);
router.use('/farm', farmRouter);
// Quà tặng + điểm thân mật
router.use('/gift', giftRouter);
// Boss thế giới + boss từng khu. Đánh xong thì ghi công vào nhiệm vụ tuần của
// bang người đánh — nối bằng hook để boss.js không phải biết tới bang hội.
datHookDanhBoss((user, ra) => ghiCong(guildOf(user.id), user.id, 'boss', ra.sat));
router.use('/boss', bossRouter);

const byName = (name) => {
  const lower = String(name || '').trim().toLowerCase();
  return find('users', u => u.unameLower === lower);
};

// ==== Auth ====
router.post('/auth/register', async (req, res) => {
  const [user, err] = await registerUser(req.body || {});
  if (err) return res.status(400).json({ error: err });
  res.json({ token: signToken({ uid: user.id }), user: publicUser(user) });
});

router.post('/auth/login', async (req, res) => {
  const [user, err] = await loginUser(req.body || {});
  if (err) return res.status(401).json({ error: err });
  res.json({ token: signToken({ uid: user.id }), user: publicUser(user) });
});

// ==== Hồ sơ + save ====
router.get('/me', authRequired, (req, res) => {
  res.json({
    user: publicUser(req.user),
    save: req.user.save || null,
    cosmetics: cosmeticsOf(req.user),
  });
});

// ==== Thời trang admin cấu hình (ai cũng xem được để hiện trong game) ====
router.get('/cosmetics', (req, res) => {
  res.json({ items: publicCosmetics() });
});

router.put('/save', authRequired, (req, res) => {
  const { save, warnings } = validateSave(req.body);
  if (!save) return res.status(400).json({ error: 'Save không hợp lệ.' });
  req.user.save = save;
  req.user.lastSeen = Date.now();
  if (warnings.length) {
    req.user.saveWarnings = warnings.slice(0, 20);
    console.warn(`[save] ${req.user.username}:`, warnings.slice(0, 5).join('; '));
  }
  markDirty();
  res.json({ ok: true, warnings });
});

// ==== Bảng xếp hạng ====
const METRICS = {
  money: u => u.save?.money || 0,
  // Điểm câu cá chấm y hệt công thức bên js/engine/cauca.js (xem ca.data.js)
  cauca: u => diemCauCa(u.save),
  // Uy tín nông trại = tổng điểm mấy đơn dân làng đã giao. Chấm ngay ở đây
  // được vì nó chỉ là một con số cất sẵn trong bản lưu, không phải tính lại.
  nongtrai: u => u.save?.nt?.diem || 0,
  dex: u => Object.keys(u.save?.dex?.caught || {}).length,
  badges: u => (u.save?.badges || []).length,
  level: u => Math.max(0, ...(u.save?.party || []).map(m => m.lv || 0)),
  pvp: u => u.stats?.pvpWin || 0,
};

// ==== Thẻ huấn luyện viên của người khác ====
// Chỉ trả những gì người chơi vốn đã khoe công khai (bảng xếp hạng, khung chat)
// — KHÔNG có tiền, túi đồ hay đội hình, để nhìn thẻ không đoán ra được gì
// dùng vào việc xấu.
router.get('/profile/:username', (req, res) => {
  const ten = String(req.params.username || '').toLowerCase();
  const u = find('users', x => x.unameLower === ten);
  if (!u || u.banned) return res.status(404).json({ error: 'Không tìm thấy người chơi.' });
  const sv = u.save || {};
  const g = guildOf(u.id);
  res.json({
    username: u.username,
    avatar: u.avatar,
    look: sv.look || null,
    cosmetics: cosmeticsOf(u),
    trainer: sv.trainer || { level: 1, exp: 0 },
    badges: sv.badges || [],
    dexSeen: Object.keys(sv.dex?.seen || {}).length,
    dexCaught: Object.keys(sv.dex?.caught || {}).length,
    wins: sv.stats?.wins || 0,
    playSince: sv.stats?.playSince || u.createdAt,
    playMin: sv.stats?.playMin || 0,
    pvp: { win: u.stats?.pvpWin || 0, lose: u.stats?.pvpLose || 0 },
    guild: g ? { name: g.name, tag: g.tag } : null,
    lastSeen: u.lastSeen,
  });
});

// Ai đang online mà CHƯA CÓ NHÀ thì ngủ chung ở nhà trọ. Trả về danh sách để
// bên khách vẽ mỗi người một cái giường trong phòng trọ.
router.get('/nhatro', authRequired, (req, res) => {
  const ds = [];
  for (const o of onlineList(40)) {
    if (o.userId === req.user.id) continue;
    const u = find('users', x => x.id === o.userId);
    if (!u || u.banned) continue;
    // Có nhà rồi thì ngủ ở nhà mình, không nằm nhà trọ nữa
    if (u.save?.estate?.base && !u.save.estate.xongLuc) continue;
    if (u.save?.estate?.base && u.save.estate.xongLuc
        && u.save.estate.xongLuc <= Date.now()) continue;
    ds.push({ username: o.username, avatar: o.avatar });
  }
  res.json({ ds });
});

router.get('/leaderboard', (req, res) => {
  const metric = String(req.query.metric || 'money');
  const fn = METRICS[metric] || METRICS.money;
  const rows = getDb().users
    .filter(u => u.save && !u.banned)
    .map(u => ({ username: u.username, avatar: u.avatar, value: fn(u), lastSeen: u.lastSeen }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 50);
  res.json({ metric, rows });
});

// ==== Bạn bè ====
router.get('/friends', authRequired, (req, res) => res.json(listFriends(req.user)));

router.post('/friends/request', authRequired, (req, res) => {
  const target = byName(req.body?.username);
  if (!target) return res.status(404).json({ error: 'Không tìm thấy người chơi.' });
  const [doc, err] = sendFriendRequest(req.user, target);
  if (err) return res.status(400).json({ error: err });
  res.json({ ok: true, request: doc });
});

router.post('/friends/respond', authRequired, (req, res) => {
  const [doc, err] = respondFriendRequest(req.user, req.body?.requestId, !!req.body?.accept);
  if (err) return res.status(400).json({ error: err });
  res.json({ ok: true, result: doc });
});

router.delete('/friends/:username', authRequired, (req, res) => {
  const target = byName(req.params.username);
  if (!target) return res.status(404).json({ error: 'Không tìm thấy người chơi.' });
  res.json({ ok: removeFriend(req.user, target.id) });
});

// ==== Kết hôn ====
router.get('/marriage', authRequired, (req, res) => res.json(marriageInfo(req.user)));

router.post('/marriage/propose', authRequired, (req, res) => {
  const target = byName(req.body?.username);
  if (!target) return res.status(404).json({ error: 'Không tìm thấy người chơi.' });
  const [doc, err] = proposeMarriage(req.user, target);
  if (err) return res.status(400).json({ error: err });
  res.json({ ok: true, proposal: doc });
});

router.post('/marriage/respond', authRequired, (req, res) => {
  const [doc, err] = respondMarriage(req.user, !!req.body?.accept);
  if (err) return res.status(400).json({ error: err });
  res.json({ ok: true, result: doc });
});

router.delete('/marriage', authRequired, (req, res) => {
  const [doc, err] = divorce(req.user);
  if (err) return res.status(400).json({ error: err });
  res.json({ ok: true, result: doc });
});

// ==== Cấu hình công khai (admin chỉnh live) ====
router.get('/config', (req, res) => {
  const c = getDb().config;
  res.json({
    serverName: c.serverName, motd: c.motd,
    expMult: c.expMult, moneyMult: c.moneyMult, flairMult: c.flairMult,
    online: global.__pwOnlineCount || 0,
  });
});

// Hồ sơ công khai của người chơi khác
router.get('/player/:username', (req, res) => {
  const u = byName(req.params.username);
  if (!u || u.banned) return res.status(404).json({ error: 'Không tìm thấy người chơi.' });
  res.json({
    username: u.username, avatar: u.avatar, lastSeen: u.lastSeen,
    stats: u.stats, badges: u.save?.badges || [],
    dexCaught: Object.keys(u.save?.dex?.caught || {}).length,
    party: (u.save?.party || []).map(m => ({ sp: m.sp, lv: m.lv, flair: m.flair || null, nick: m.nick })),
  });
});

// ==== Hộp thư ====
router.get('/mail', authRequired, (req, res) => {
  res.json(listMail(req.user));
});

router.post('/mail/:id/read', authRequired, (req, res) => {
  res.json({ ok: readMail(req.user, req.params.id) });
});

router.post('/mail/:id/claim', authRequired, (req, res) => {
  const [qua, err] = claimMail(req.user, req.params.id);
  if (err) return res.status(400).json({ error: err });
  res.json({ ok: true, qua });
});

router.post('/mail/claim-all', authRequired, (req, res) => {
  const [gop, n] = claimAllMail(req.user);
  res.json({ ok: true, qua: gop, n });
});

router.post('/mail/clean', authRequired, (req, res) => {
  res.json({ ok: true, n: deleteReadMail(req.user) });
});

// ==== Thông báo ====
router.get('/news', authRequired, (req, res) => {
  res.json(listNews(req.user));
});

router.post('/news/seen', authRequired, (req, res) => {
  markNewsSeen(req.user);
  res.json({ ok: true });
});

// ==== Giftcode ====
router.post('/code', authRequired, (req, res) => {
  const [mail, err] = redeemCode(req.user, req.body?.code);
  if (err) return res.status(400).json({ error: err });
  res.json({ ok: true, mail });
});

// ==== Sự kiện ====
router.get('/events', authRequired, (req, res) => {
  const ds = activeEvents().map(e => ({ ...e, me: eventState(req.user, e) }));
  res.json({ events: ds, vars: BIEN_GAME });
});

router.post('/events/:id/sync', authRequired, (req, res) => {
  const ev = activeEvents().find(e => e.id === req.params.id);
  if (!ev) return res.status(404).json({ error: 'Sự kiện đã đóng.' });
  res.json(syncEvent(req.user, ev, req.body?.vars || {}));
});

router.post('/events/:id/buy', authRequired, (req, res) => {
  const ev = activeEvents().find(e => e.id === req.params.id);
  if (!ev) return res.status(404).json({ error: 'Sự kiện đã đóng.' });
  const [r, err] = buyEvent(req.user, ev, req.body?.shopId);
  if (err) return res.status(400).json({ error: err });
  res.json({ ok: true, ...r });
});

router.post('/events/:id/roll', authRequired, (req, res) => {
  const ev = activeEvents().find(e => e.id === req.params.id);
  if (!ev) return res.status(404).json({ error: 'Sự kiện đã đóng.' });
  const [r, err] = rollEvent(req.user, ev, req.body?.n);
  if (err) return res.status(400).json({ error: err });
  res.json({ ok: true, ...r });
});
