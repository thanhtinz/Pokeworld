// TuxeWorld server | src/guild.js | Hệ thống bang hội (guild): tạo, gia nhập, chức vụ, quỹ, cấp bậc
import express from 'express';
import { getDb, find, filter, insert, remove, markDirty, uid } from './db.js';
import { authRequired } from './auth.js';
import { isOnline, emitToUsers } from './hub.js';
import {
  bangNhiemVu, nhanThuong, ghiCong, conLaiTuan, danhSachBossBang, danhBossBang,
} from './guildquest.js';

export const CREATE_COST = 10000;
export const MAX_LEVEL = 20;
export const MAX_ICON = 12;
export const EXP_PER_MONEY = 100;          // góp $100 = 1 exp guild
export const maxMembersFor = (level) => 20 + level * 2;
export const expNeededFor = (level) => level * 1000;
// Bonus cho thành viên: +2% mỗi cấp, tối đa +40%
export const bonusFor = (level) => {
  const mult = Math.min(1.4, 1 + level * 0.02);
  return { expMult: mult, moneyMult: mult };
};

const ROLES = ['leader', 'officer', 'member'];
const rank = (role) => (role === 'leader' ? 3 : role === 'officer' ? 2 : 1);

// ==== Truy vấn cơ bản ====
export function guildOf(userId) {
  return find('guilds', g => g.members.some(m => m.userId === userId));
}
export function memberOf(guild, userId) {
  return guild ? guild.members.find(m => m.userId === userId) || null : null;
}
export function memberIds(guild) {
  return guild ? guild.members.map(m => m.userId) : [];
}
export function guildById(id) {
  return find('guilds', g => g.id === id);
}

const userById = (id) => find('users', u => u.id === id);

// ==== Chat hệ thống của guild ====
// Lưu 1 dòng chat vào guildChat (giữ 200 tin mới nhất mỗi guild) và trả về doc.
export function pushGuildChat(guildId, msg) {
  const doc = insert('guildChat', { id: uid('gch'), guildId, ts: Date.now(), ...msg });
  const rows = filter('guildChat', c => c.guildId === guildId);
  if (rows.length > 200) {
    const keep = new Set(rows.slice(-200).map(c => c.id));
    remove('guildChat', c => c.guildId === guildId && !keep.has(c.id));
  }
  return doc;
}

// Thông báo hệ thống trong guild (vào/rời/lên chức) — lưu + broadcast tới thành viên online
export function guildSystemMsg(guild, text, extraIds = []) {
  const doc = pushGuildChat(guild.id, {
    from: 'HỆ THỐNG', avatar: 'system', text: String(text).slice(0, 300), system: true,
  });
  emitToUsers([...memberIds(guild), ...extraIds], 'guild:msg', doc);
  return doc;
}

// Báo cho thành viên online biết guild có thay đổi (client tự tải lại)
function guildUpdated(guild, extraIds = []) {
  emitToUsers([...memberIds(guild), ...extraIds], 'guild:update', { guildId: guild.id });
  markDirty();
}

// ==== Dữ liệu trả về client ====
export function guildBrief(g) {
  return {
    id: g.id, name: g.name, tag: g.tag, icon: g.icon, level: g.level,
    members: g.members.length, maxMembers: g.maxMembers,
    joinPolicy: g.joinPolicy, desc: g.desc,
  };
}

export function guildFull(g) {
  return {
    ...guildBrief(g),
    announcement: g.announcement, treasury: g.treasury, exp: g.exp,
    expNeeded: g.level >= MAX_LEVEL ? 0 : expNeededFor(g.level),
    createdAt: g.createdAt,
    leader: userById(g.leader)?.username || null,
    bonus: bonusFor(g.level),
    memberList: g.members
      .map(m => {
        const u = userById(m.userId);
        if (!u) return null;
        return {
          userId: m.userId, username: u.username, avatar: u.avatar,
          role: m.role, contribution: m.contribution || 0,
          joinedAt: m.joinedAt, online: isOnline(m.userId), lastSeen: u.lastSeen,
        };
      })
      .filter(Boolean)
      .sort((a, b) => rank(b.role) - rank(a.role) || b.contribution - a.contribution),
    applicants: (g.applicants || [])
      .map(a => {
        const u = userById(a.userId);
        return u ? { userId: a.userId, username: u.username, avatar: u.avatar, ts: a.ts, message: a.message } : null;
      })
      .filter(Boolean),
  };
}

// ==== Nghiệp vụ ====
export function createGuild(user, { name, tag, desc, icon }) {
  if (guildOf(user.id)) return [null, 'Bạn đã ở trong một bang hội rồi.'];
  const nm = String(name || '').trim();
  if (nm.length < 3 || nm.length > 20) return [null, 'Tên bang hội phải từ 3 đến 20 ký tự.'];
  const tg = String(tag || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{3,5}$/.test(tg)) return [null, 'Tag phải gồm 3-5 ký tự chữ hoa hoặc số.'];
  if (find('guilds', g => g.tag === tg)) return [null, 'Tag này đã có bang hội sử dụng.'];
  if (find('guilds', g => g.name.toLowerCase() === nm.toLowerCase())) return [null, 'Tên bang hội đã tồn tại.'];
  if (!user.save) return [null, 'Bạn chưa có dữ liệu game.'];
  if ((user.save.money || 0) < CREATE_COST) return [null, `Cần $${CREATE_COST} để lập bang hội.`];

  user.save.money -= CREATE_COST;
  const g = insert('guilds', {
    id: uid('gld'), name: nm, tag: tg,
    desc: String(desc || '').slice(0, 300), icon: clampIcon(icon),
    leader: user.id,
    members: [{ userId: user.id, role: 'leader', joinedAt: Date.now(), contribution: 0 }],
    level: 1, exp: 0, treasury: 0, createdAt: Date.now(),
    announcement: '', joinPolicy: 'open', applicants: [], maxMembers: maxMembersFor(1),
  });
  markDirty();
  return [g, null];
}

function clampIcon(icon) {
  const n = Math.round(Number(icon) || 1);
  return Math.max(1, Math.min(MAX_ICON, n));
}

export function listGuilds(q) {
  const key = String(q || '').trim().toLowerCase();
  return getDb().guilds
    .filter(g => !key || g.name.toLowerCase().includes(key) || g.tag.toLowerCase().includes(key))
    .sort((a, b) => b.level - a.level || b.members.length - a.members.length)
    .slice(0, 50)
    .map(guildBrief);
}

export function joinGuild(user, guildId) {
  if (guildOf(user.id)) return [null, 'Bạn đã ở trong một bang hội rồi.'];
  const g = guildById(guildId);
  if (!g) return [null, 'Không tìm thấy bang hội.'];
  if (g.members.length >= g.maxMembers) return [null, 'Bang hội đã đầy thành viên.'];
  if (g.joinPolicy === 'approval') {
    if ((g.applicants || []).some(a => a.userId === user.id)) return [null, 'Bạn đã nộp đơn, đang chờ duyệt.'];
    g.applicants = g.applicants || [];
    g.applicants.push({ userId: user.id, ts: Date.now(), message: '' });
    markDirty();
    emitToUsers(memberIds(g).filter(id => rank(memberOf(g, id).role) >= 2), 'guild:update', { guildId: g.id });
    return [{ pending: true, guild: guildBrief(g) }, null];
  }
  g.members.push({ userId: user.id, role: 'member', joinedAt: Date.now(), contribution: 0 });
  guildSystemMsg(g, `${user.username} đã gia nhập bang hội.`);
  guildUpdated(g);
  return [{ pending: false, guild: guildBrief(g) }, null];
}

export function respondApplicant(user, guildId, targetId, accept) {
  const g = guildById(guildId);
  if (!g) return [null, 'Không tìm thấy bang hội.'];
  const me = memberOf(g, user.id);
  if (!me || rank(me.role) < 2) return [null, 'Chỉ hội trưởng hoặc phó hội mới duyệt đơn.'];
  const idx = (g.applicants || []).findIndex(a => a.userId === targetId);
  if (idx < 0) return [null, 'Không tìm thấy đơn xin gia nhập.'];
  g.applicants.splice(idx, 1);
  if (!accept) { markDirty(); return [{ accepted: false }, null]; }
  if (guildOf(targetId)) { markDirty(); return [null, 'Người này đã vào bang hội khác.']; }
  if (g.members.length >= g.maxMembers) { markDirty(); return [null, 'Bang hội đã đầy thành viên.']; }
  g.members.push({ userId: targetId, role: 'member', joinedAt: Date.now(), contribution: 0 });
  const u = userById(targetId);
  guildSystemMsg(g, `${u?.username || 'Thành viên mới'} đã được duyệt vào bang hội.`);
  guildUpdated(g);
  return [{ accepted: true }, null];
}

export function leaveGuild(user) {
  const g = guildOf(user.id);
  if (!g) return [null, 'Bạn chưa ở trong bang hội nào.'];
  const me = memberOf(g, user.id);
  if (me.role === 'leader' && g.members.length > 1) {
    return [null, 'Hội trưởng phải chuyển quyền cho người khác trước khi rời.'];
  }
  if (g.members.length <= 1) {
    disbandGuildDoc(g);
    return [{ disbanded: true }, null];
  }
  g.members = g.members.filter(m => m.userId !== user.id);
  guildSystemMsg(g, `${user.username} đã rời bang hội.`, [user.id]);
  guildUpdated(g, [user.id]);
  return [{ left: true }, null];
}

export function kickMember(user, targetId) {
  const g = guildOf(user.id);
  if (!g) return [null, 'Bạn chưa ở trong bang hội nào.'];
  const me = memberOf(g, user.id);
  if (rank(me.role) < 2) return [null, 'Chỉ hội trưởng hoặc phó hội mới đuổi được thành viên.'];
  if (targetId === user.id) return [null, 'Không thể tự đuổi chính mình.'];
  const target = memberOf(g, targetId);
  if (!target) return [null, 'Người này không ở trong bang hội.'];
  if (me.role !== 'leader' && rank(target.role) >= 2) {
    return [null, 'Phó hội không thể đuổi hội trưởng hoặc phó hội khác.'];
  }
  g.members = g.members.filter(m => m.userId !== targetId);
  const u = userById(targetId);
  guildSystemMsg(g, `${u?.username || 'Một thành viên'} đã bị đuổi khỏi bang hội.`, [targetId]);
  guildUpdated(g, [targetId]);
  return [{ kicked: true }, null];
}

export function promoteMember(user, targetId, role) {
  const g = guildOf(user.id);
  if (!g) return [null, 'Bạn chưa ở trong bang hội nào.'];
  const me = memberOf(g, user.id);
  if (me.role !== 'leader') return [null, 'Chỉ hội trưởng mới đổi được chức vụ.'];
  if (targetId === user.id) return [null, 'Không thể đổi chức vụ của chính mình.'];
  if (!ROLES.includes(role)) return [null, 'Chức vụ không hợp lệ.'];
  const target = memberOf(g, targetId);
  if (!target) return [null, 'Người này không ở trong bang hội.'];
  const u = userById(targetId);
  if (role === 'leader') {
    target.role = 'leader';
    me.role = 'officer';
    g.leader = targetId;
    guildSystemMsg(g, `${u?.username || 'Thành viên'} đã trở thành hội trưởng mới.`);
  } else {
    target.role = role;
    guildSystemMsg(g, `${u?.username || 'Thành viên'} được đổi chức vụ thành ${role === 'officer' ? 'phó hội' : 'thành viên'}.`);
  }
  guildUpdated(g);
  return [{ role: target.role }, null];
}

// Cộng kinh nghiệm cho bang và lên cấp nếu đủ. Dùng chung cho góp quỹ, nhiệm
// vụ tuần và boss bang — trước đây đoạn này nằm lọt trong donateGuild nên chỗ
// khác muốn cộng exp thì phải chép lại.
export function congExp(g, them) {
  const n = Math.max(0, Math.floor(Number(them) || 0));
  if (!n) return false;
  g.exp += n;
  let leveled = false;
  while (g.level < MAX_LEVEL && g.exp >= expNeededFor(g.level)) {
    g.exp -= expNeededFor(g.level);
    g.level++;
    leveled = true;
  }
  if (g.level >= MAX_LEVEL) g.exp = Math.min(g.exp, expNeededFor(MAX_LEVEL));
  g.maxMembers = maxMembersFor(g.level);
  if (leveled) guildSystemMsg(g, `Bang hội đã lên cấp ${g.level}!`);
  markDirty();
  return leveled;
}

export function donateGuild(user, amount) {
  const g = guildOf(user.id);
  if (!g) return [null, 'Bạn chưa ở trong bang hội nào.'];
  const amt = Math.floor(Number(amount) || 0);
  if (amt <= 0) return [null, 'Số tiền góp phải lớn hơn 0.'];
  if (!user.save) return [null, 'Bạn chưa có dữ liệu game.'];
  if ((user.save.money || 0) < amt) return [null, 'Bạn không đủ tiền.'];

  user.save.money -= amt;
  g.treasury += amt;
  const me = memberOf(g, user.id);
  me.contribution = (me.contribution || 0) + amt;

  congExp(g, Math.floor(amt / EXP_PER_MONEY));
  // Góp quỹ tính vào nhiệm vụ tuần của bang
  ghiCong(g, user.id, 'gop', amt);
  guildUpdated(g);
  return [{ treasury: g.treasury, level: g.level, exp: g.exp, contribution: me.contribution, money: user.save.money }, null];
}

export function updateSettings(user, { desc, announcement, joinPolicy, icon }) {
  const g = guildOf(user.id);
  if (!g) return [null, 'Bạn chưa ở trong bang hội nào.'];
  const me = memberOf(g, user.id);
  if (rank(me.role) < 2) return [null, 'Chỉ hội trưởng hoặc phó hội mới sửa được thiết lập.'];
  if (desc !== undefined) g.desc = String(desc).slice(0, 300);
  if (announcement !== undefined) g.announcement = String(announcement).slice(0, 300);
  if (joinPolicy !== undefined) {
    if (!['open', 'approval'].includes(joinPolicy)) return [null, 'Chế độ gia nhập không hợp lệ.'];
    g.joinPolicy = joinPolicy;
  }
  if (icon !== undefined) g.icon = clampIcon(icon);
  guildUpdated(g);
  return [guildBrief(g), null];
}

function disbandGuildDoc(g) {
  const ids = memberIds(g);
  remove('guilds', x => x.id === g.id);
  remove('guildChat', c => c.guildId === g.id);
  emitToUsers(ids, 'guild:update', { guildId: g.id, disbanded: true });
  markDirty();
}
export { disbandGuildDoc };

export function disbandGuild(user) {
  const g = guildOf(user.id);
  if (!g) return [null, 'Bạn chưa ở trong bang hội nào.'];
  if (g.leader !== user.id) return [null, 'Chỉ hội trưởng mới giải tán được bang hội.'];
  disbandGuildDoc(g);
  return [{ disbanded: true }, null];
}

export function guildChatHistory(guildId, limit = 50) {
  const n = Math.max(1, Math.min(200, Number(limit) || 50));
  return filter('guildChat', c => c.guildId === guildId).slice(-n);
}

// ==== Router REST (/api/guild) ====
export const guildRouter = express.Router();
guildRouter.use(authRequired);

// ==== Nhiệm vụ bang hội + boss bang hội ====
// PHẢI khai trước route "/:id" bên dưới: Express khớp theo thứ tự, để sau thì
// "/nhiemvu" bị nuốt thành id bang hội.
guildRouter.get('/nhiemvu', (req, res) => {
  const g = guildOf(req.user.id);
  if (!g) return res.status(400).json({ error: 'Bạn chưa ở trong bang hội nào.' });
  res.json({ ds: bangNhiemVu(g), conLai: conLaiTuan(), level: g.level, treasury: g.treasury });
});

guildRouter.post('/nhiemvu/:nvId/nhan', (req, res) => {
  const g = guildOf(req.user.id);
  if (!g) return res.status(400).json({ error: 'Bạn chưa ở trong bang hội nào.' });
  const me = memberOf(g, req.user.id);
  if (rank(me.role) < 2) {
    return res.status(403).json({ error: 'Chỉ hội trưởng hoặc phó hội mới nhận thưởng nhiệm vụ.' });
  }
  const [ra, err] = nhanThuong(g, req.params.nvId, congExp);
  if (err) return res.status(400).json({ error: err });
  guildSystemMsg(g, `Bang nhận thưởng nhiệm vụ: +${ra.exp} kinh nghiệm, +$${ra.quy} quỹ.`);
  guildUpdated(g);
  res.json(ra);
});

guildRouter.get('/boss', (req, res) => {
  const g = guildOf(req.user.id);
  if (!g) return res.status(400).json({ error: 'Bạn chưa ở trong bang hội nào.' });
  res.json({ ds: danhSachBossBang(g, req.user.id), level: g.level });
});

guildRouter.post('/boss/:bossId/danh', (req, res) => {
  const g = guildOf(req.user.id);
  if (!g) return res.status(400).json({ error: 'Bạn chưa ở trong bang hội nào.' });
  const [ra, err] = danhBossBang(req.user, g, req.params.bossId, req.body?.dmg, congExp);
  if (err) return res.status(400).json({ error: err });
  if (ra.ha) {
    guildSystemMsg(g, `Bang đã hạ ${ra.boss}! Quỹ bang +$${ra.quyBang}.`);
    guildUpdated(g);
  }
  res.json(ra);
});


guildRouter.post('/create', (req, res) => {
  const [g, err] = createGuild(req.user, req.body || {});
  if (err) return res.status(400).json({ error: err });
  res.json({ ok: true, guild: guildFull(g) });
});

guildRouter.get('/list', (req, res) => {
  res.json({ rows: listGuilds(req.query.q) });
});

guildRouter.get('/mine', (req, res) => {
  const g = guildOf(req.user.id);
  if (!g) return res.json({ guild: null, bonus: { expMult: 1, moneyMult: 1 } });
  res.json({ guild: guildFull(g), role: memberOf(g, req.user.id).role, bonus: bonusFor(g.level) });
});

// Lịch sử chat guild — đặt trước '/:id' để không bị nuốt route
guildRouter.get('/chat', (req, res) => {
  const g = guildOf(req.user.id);
  if (!g) return res.status(400).json({ error: 'Bạn chưa ở trong bang hội nào.' });
  res.json({ rows: guildChatHistory(g.id, req.query.limit) });
});

guildRouter.post('/leave', (req, res) => {
  const [doc, err] = leaveGuild(req.user);
  if (err) return res.status(400).json({ error: err });
  res.json({ ok: true, result: doc });
});

guildRouter.post('/donate', (req, res) => {
  const [doc, err] = donateGuild(req.user, req.body?.amount);
  if (err) return res.status(400).json({ error: err });
  res.json({ ok: true, ...doc });
});

guildRouter.post('/disband', (req, res) => {
  const [doc, err] = disbandGuild(req.user);
  if (err) return res.status(400).json({ error: err });
  res.json({ ok: true, result: doc });
});

guildRouter.put('/settings', (req, res) => {
  const [doc, err] = updateSettings(req.user, req.body || {});
  if (err) return res.status(400).json({ error: err });
  res.json({ ok: true, guild: doc });
});

guildRouter.post('/kick/:userId', (req, res) => {
  const [doc, err] = kickMember(req.user, req.params.userId);
  if (err) return res.status(400).json({ error: err });
  res.json({ ok: true, result: doc });
});

guildRouter.post('/promote/:userId', (req, res) => {
  const [doc, err] = promoteMember(req.user, req.params.userId, String(req.body?.role || ''));
  if (err) return res.status(400).json({ error: err });
  res.json({ ok: true, result: doc });
});

guildRouter.get('/:id', (req, res) => {
  const g = guildById(req.params.id);
  if (!g) return res.status(404).json({ error: 'Không tìm thấy bang hội.' });
  res.json({
    guild: {
      ...guildBrief(g), announcement: g.announcement, createdAt: g.createdAt,
      leader: userById(g.leader)?.username || null, bonus: bonusFor(g.level),
    },
  });
});

guildRouter.post('/:id/join', (req, res) => {
  const [doc, err] = joinGuild(req.user, req.params.id);
  if (err) return res.status(400).json({ error: err });
  res.json({ ok: true, ...doc });
});

guildRouter.post('/:id/applicant/:userId', (req, res) => {
  const [doc, err] = respondApplicant(req.user, req.params.id, req.params.userId, !!req.body?.accept);
  if (err) return res.status(400).json({ error: err });
  res.json({ ok: true, result: doc });
});
