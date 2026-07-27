// PokeWorld server | src/admin.js | API quản trị + phục vụ trang /admin
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb, find, filter, remove, markDirty, audit, flush } from './db.js';
import { adminRequired } from './auth.js';
import { kickUser, onlineCount } from './realtime.js';
import { guildById, disbandGuildDoc } from './guild.js';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function adminRouter(io) {
  const r = express.Router();

  // Đăng nhập admin bằng biến môi trường
  r.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    const U = process.env.ADMIN_USER || 'admin';
    const P = process.env.ADMIN_PASS || 'changeme';
    if (username !== U || password !== P) {
      return res.status(401).json({ error: 'Sai tài khoản admin.' });
    }
    const token = jwt.sign({ role: 'admin', name: U }, SECRET, { expiresIn: '1d' });
    res.json({ token });
  });

  r.use(adminRequired);

  // Tổng quan
  r.get('/stats', (req, res) => {
    const db = getDb();
    const dayAgo = Date.now() - 86400000;
    res.json({
      users: db.users.length,
      online: onlineCount(),
      newToday: db.users.filter(u => u.createdAt > dayAgo).length,
      activeToday: db.users.filter(u => (u.lastSeen || 0) > dayAgo).length,
      pvpToday: db.pvpHistory.filter(p => p.ts > dayAgo).length,
      banned: db.users.filter(u => u.banned).length,
      marriages: db.marriages.filter(m => !m.pending).length,
      guilds: db.guilds.length,
      config: db.config,
    });
  });

  // Danh sách / tìm người chơi
  r.get('/players', (req, res) => {
    const q = String(req.query.q || '').toLowerCase();
    const rows = getDb().users
      .filter(u => !q || u.unameLower.includes(q))
      .slice(0, 200)
      .map(u => ({
        id: u.id, username: u.username, avatar: u.avatar, banned: !!u.banned,
        banReason: u.banReason, createdAt: u.createdAt, lastSeen: u.lastSeen,
        money: u.save?.money || 0,
        badges: (u.save?.badges || []).length,
        dex: Object.keys(u.save?.dex?.caught || {}).length,
        party: (u.save?.party || []).length,
        stats: u.stats,
        warnings: u.saveWarnings || [],
      }));
    res.json({ rows, total: getDb().users.length });
  });

  r.get('/player/:id', (req, res) => {
    const u = find('users', x => x.id === req.params.id);
    if (!u) return res.status(404).json({ error: 'Không tìm thấy.' });
    const { passHash, ...rest } = u;
    res.json(rest);
  });

  // Khóa / mở khóa tài khoản
  r.post('/player/:id/ban', (req, res) => {
    const u = find('users', x => x.id === req.params.id);
    if (!u) return res.status(404).json({ error: 'Không tìm thấy.' });
    u.banned = !!req.body?.banned;
    u.banReason = String(req.body?.reason || '').slice(0, 200);
    markDirty();
    if (u.banned) kickUser(io, u.id, u.banReason);
    audit(req.admin, u.banned ? 'ban' : 'unban', u.username, u.banReason);
    res.json({ ok: true, banned: u.banned });
  });

  // Tặng tiền / vật phẩm
  r.post('/player/:id/grant', (req, res) => {
    const u = find('users', x => x.id === req.params.id);
    if (!u) return res.status(404).json({ error: 'Không tìm thấy.' });
    if (!u.save) return res.status(400).json({ error: 'Người chơi chưa có dữ liệu game.' });
    const { money, itemId, itemQty } = req.body || {};
    if (money) {
      u.save.money = Math.max(0, Math.min(9999999, (u.save.money || 0) + Number(money)));
    }
    if (itemId) {
      const q = Math.max(1, Math.min(999, Number(itemQty) || 1));
      u.save.bag[itemId] = Math.min(999, (u.save.bag[itemId] || 0) + q);
    }
    markDirty();
    audit(req.admin, 'grant', u.username, JSON.stringify({ money, itemId, itemQty }));
    res.json({ ok: true, money: u.save.money, bag: u.save.bag });
  });

  // Đặt lại mật khẩu
  r.post('/player/:id/password', async (req, res) => {
    const u = find('users', x => x.id === req.params.id);
    if (!u) return res.status(404).json({ error: 'Không tìm thấy.' });
    const pass = String(req.body?.password || '');
    if (pass.length < 6) return res.status(400).json({ error: 'Mật khẩu tối thiểu 6 ký tự.' });
    u.passHash = await bcrypt.hash(pass, 10);
    markDirty();
    audit(req.admin, 'reset-password', u.username, '');
    res.json({ ok: true });
  });

  // Xóa tài khoản
  r.delete('/player/:id', (req, res) => {
    const u = find('users', x => x.id === req.params.id);
    if (!u) return res.status(404).json({ error: 'Không tìm thấy.' });
    remove('users', x => x.id === u.id);
    remove('friendships', f => f.a === u.id || f.b === u.id);
    remove('marriages', m => m.a === u.id || m.b === u.id);
    remove('dms', d => d.from === u.id || d.to === u.id);
    for (const g of [...getDb().guilds]) {
      if (!g.members.some(m => m.userId === u.id)) continue;
      if (g.leader === u.id) disbandGuildDoc(g);
      else { g.members = g.members.filter(m => m.userId !== u.id); markDirty(); }
    }
    audit(req.admin, 'delete-user', u.username, '');
    res.json({ ok: true });
  });

  // ==== Bang hội ====
  r.get('/guilds', (req, res) => {
    const q = String(req.query.q || '').toLowerCase();
    const nameOf = (id) => find('users', u => u.id === id)?.username || '—';
    const rows = getDb().guilds
      .filter(g => !q || g.name.toLowerCase().includes(q) || g.tag.toLowerCase().includes(q))
      .sort((a, b) => b.level - a.level || b.members.length - a.members.length)
      .slice(0, 200)
      .map(g => ({
        id: g.id, name: g.name, tag: g.tag, icon: g.icon, level: g.level, exp: g.exp,
        members: g.members.length, maxMembers: g.maxMembers, treasury: g.treasury,
        leader: nameOf(g.leader), createdAt: g.createdAt, joinPolicy: g.joinPolicy,
        memberList: g.members.map(m => ({
          userId: m.userId, username: nameOf(m.userId), role: m.role,
          contribution: m.contribution || 0, joinedAt: m.joinedAt,
        })),
      }));
    res.json({ rows, total: getDb().guilds.length });
  });

  r.delete('/guild/:id', (req, res) => {
    const g = guildById(req.params.id);
    if (!g) return res.status(404).json({ error: 'Không tìm thấy bang hội.' });
    disbandGuildDoc(g);
    audit(req.admin, 'disband-guild', g.name, g.tag);
    res.json({ ok: true });
  });

  // Cấu hình live (MOTD, hệ số sự kiện)
  r.put('/config', (req, res) => {
    const c = getDb().config;
    const { motd, expMult, moneyMult, shinyMult, serverName } = req.body || {};
    if (motd !== undefined) c.motd = String(motd).slice(0, 300);
    if (serverName !== undefined) c.serverName = String(serverName).slice(0, 40);
    if (expMult !== undefined) c.expMult = Math.max(1, Math.min(10, Number(expMult) || 1));
    if (moneyMult !== undefined) c.moneyMult = Math.max(1, Math.min(10, Number(moneyMult) || 1));
    if (shinyMult !== undefined) c.shinyMult = Math.max(1, Math.min(50, Number(shinyMult) || 1));
    markDirty();
    io.emit('config:update', c);
    audit(req.admin, 'config', '-', JSON.stringify(c));
    res.json({ ok: true, config: c });
  });

  // Thông báo toàn server
  r.post('/broadcast', (req, res) => {
    const text = String(req.body?.text || '').slice(0, 300);
    if (!text) return res.status(400).json({ error: 'Nội dung trống.' });
    io.emit('chat:msg', { username: '📢 HỆ THỐNG', avatar: 'system', text, ts: Date.now(), system: true });
    audit(req.admin, 'broadcast', '-', text);
    res.json({ ok: true });
  });

  // Nhật ký thao tác admin
  r.get('/audit', (req, res) => {
    res.json({ rows: getDb().auditLog.slice(-200).reverse() });
  });

  // Lịch sử PvP
  r.get('/pvp', (req, res) => {
    res.json({ rows: getDb().pvpHistory.slice(-100).reverse() });
  });

  // Lưu DB ngay lập tức
  r.post('/flush', (req, res) => { flush(); res.json({ ok: true }); });

  return r;
}
