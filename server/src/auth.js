// TuxeWorld server | src/auth.js | Đăng ký/đăng nhập, băm mật khẩu, JWT, middleware
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { find, insert, markDirty, uid } from './db.js';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const EXPIRES = '7d';

export const signToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES });

export function verifyToken(token) {
  try { return jwt.verify(token, SECRET); } catch { return null; }
}

// Thông tin user gửi ra client — KHÔNG bao giờ kèm passHash
export function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id, username: u.username, avatar: u.avatar, role: u.role || 'player',
    createdAt: u.createdAt, lastSeen: u.lastSeen,
    stats: u.stats || { pvpWin: 0, pvpLose: 0 },
    cosmetics: Array.isArray(u.cosmetics) ? u.cosmetics : [],
  };
}

export async function registerUser({ username, password, avatar }) {
  username = String(username || '').trim();
  if (!/^[\p{L}\p{N}_ ]{2,16}$/u.test(username)) {
    return [null, 'Tên tài khoản 2-16 ký tự, chỉ chữ/số/gạch dưới.'];
  }
  if (String(password || '').length < 6) return [null, 'Mật khẩu tối thiểu 6 ký tự.'];
  const lower = username.toLowerCase();
  if (find('users', u => u.unameLower === lower)) return [null, 'Tên tài khoản đã tồn tại.'];

  const user = insert('users', {
    id: uid('usr'),
    username,
    unameLower: lower,
    passHash: await bcrypt.hash(password, 10),
    avatar: avatar === 'leaf' ? 'leaf' : 'red',
    role: 'player',
    banned: false,
    banReason: '',
    createdAt: Date.now(),
    lastSeen: Date.now(),
    save: null,
    stats: { pvpWin: 0, pvpLose: 0 },
  });
  return [user, null];
}

export async function loginUser({ username, password }) {
  const lower = String(username || '').trim().toLowerCase();
  const user = find('users', u => u.unameLower === lower);
  if (!user) return [null, 'Sai tên tài khoản hoặc mật khẩu.'];
  const ok = await bcrypt.compare(String(password || ''), user.passHash);
  if (!ok) return [null, 'Sai tên tài khoản hoặc mật khẩu.'];
  if (user.banned) return [null, `Tài khoản bị khóa: ${user.banReason || 'vi phạm quy định'}`];
  user.lastSeen = Date.now();
  markDirty();
  return [user, null];
}

// ==== Middleware ====
export function authRequired(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  const payload = token && verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Chưa đăng nhập.' });
  const user = find('users', u => u.id === payload.uid);
  if (!user) return res.status(401).json({ error: 'Tài khoản không tồn tại.' });
  if (user.banned) return res.status(403).json({ error: `Tài khoản bị khóa: ${user.banReason}` });
  req.user = user;
  next();
}

export function adminRequired(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  const payload = token && verifyToken(token);
  if (!payload || payload.role !== 'admin') return res.status(403).json({ error: 'Cần quyền admin.' });
  req.admin = payload.name || 'admin';
  next();
}
