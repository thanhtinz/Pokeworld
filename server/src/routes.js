// PokeWorld server | src/routes.js | REST API cho client
import express from 'express';
import { getDb, find, filter, markDirty } from './db.js';
import { registerUser, loginUser, signToken, publicUser, authRequired } from './auth.js';
import { validateSave } from './validate.js';
import {
  sendFriendRequest, respondFriendRequest, listFriends, removeFriend,
  proposeMarriage, respondMarriage, divorce, marriageInfo,
} from './social.js';
import { guildRouter } from './guild.js';
import { chatRouter } from './chat.js';

export const router = express.Router();

// ==== Bang hội + tin nhắn ====
router.use('/guild', guildRouter);
router.use('/chat', chatRouter);

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
  res.json({ user: publicUser(req.user), save: req.user.save || null });
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
  dex: u => Object.keys(u.save?.dex?.caught || {}).length,
  badges: u => (u.save?.badges || []).length,
  level: u => Math.max(0, ...(u.save?.party || []).map(m => m.lv || 0)),
  pvp: u => u.stats?.pvpWin || 0,
};

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
    expMult: c.expMult, moneyMult: c.moneyMult, shinyMult: c.shinyMult,
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
    party: (u.save?.party || []).map(m => ({ sp: m.sp, lv: m.lv, shiny: !!m.shiny, nick: m.nick })),
  });
});
