// PokeWorld server | src/cosmetics.js | Kho thời trang do admin quản lý
//
// Hai việc ở đây:
//   1. Catalogue: admin tự thêm danh hiệu / khung avatar / khung chat / skin và
//      TẢI ẢNH lên cho từng món. Client tải danh sách này về rồi ghép đè lên bộ
//      mặc định trong js/data/cosmetics.js — món nào có ảnh thì hiện ảnh.
//   2. Trao tay: món đặt điều kiện 'manual' thì không tự mở được, admin phải
//      trao cho từng người chơi. Danh sách đã trao nằm NGOÀI bản lưu của client
//      (u.cosmetics) nên client đồng bộ save cũng không ghi đè mất.
import fs from 'fs';
import path from 'path';
import { getDb, markDirty } from './db.js';

const DATA_DIR = process.env.DATA_DIR || './data';
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads', 'cosmetics');
const WEB_DIR = '/uploads/cosmetics';

export const KINDS = ['title', 'avatarFrame', 'chatFrame', 'skin'];
// Cách mở khoá: có sẵn | bắt đủ số | thắng đủ trận | đủ huy hiệu | đủ cấp | admin trao tay
export const HOWS = ['start', 'catch', 'win', 'badge', 'level', 'manual'];

const EXT = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const clean = (s, n) => String(s ?? '').trim().slice(0, n);
// "Tết 2026!" -> "tet_2026": bỏ dấu tiếng Việt trước rồi mới lọc, nếu không mỗi
// chữ có dấu thành một gạch dưới và mã món ra rất khó đọc.
const slug = (s) => clean(s, 40)
  .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
  .toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');

export function ensureDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Khoá định danh một món: "kind:id" — id có thể trùng giữa các loại ('none').
export const keyOf = (kind, id) => `${kind}:${id}`;

export function listCosmetics() {
  return getDb().cosmetics;
}

export function findCosmetic(key) {
  return getDb().cosmetics.find(c => keyOf(c.kind, c.id) === key) || null;
}

// Thêm mới hoặc sửa. Trả về [doc, error].
export function upsertCosmetic(body = {}) {
  const kind = KINDS.includes(body.kind) ? body.kind : null;
  if (!kind) return [null, 'Loại thời trang không hợp lệ.'];
  const id = slug(body.id);
  if (!id) return [null, 'Mã món phải có chữ/số (a-z, 0-9, _).'];
  const name = clean(body.name, 30);
  if (!name) return [null, 'Thiếu tên hiển thị.'];

  const how = HOWS.includes(body.how) ? body.how : 'manual';
  const n = Math.max(0, Math.min(9999, Math.round(Number(body.n) || 0)));
  const color = /^#[0-9a-fA-F]{3,8}$/.test(body.color || '') ? body.color : '#ffd43b';

  const key = keyOf(kind, id);
  let doc = findCosmetic(key);
  if (!doc) {
    doc = { id, kind, createdAt: Date.now(), img: null };
    getDb().cosmetics.push(doc);
  }
  Object.assign(doc, { name, how, n, color, css: clean(body.css, 20) || null });
  markDirty();
  return [doc, null];
}

export function removeCosmetic(key) {
  const db = getDb();
  const doc = findCosmetic(key);
  if (!doc) return false;
  if (doc.img) {
    try { fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(doc.img))); } catch { /* đã mất thì thôi */ }
  }
  db.cosmetics = db.cosmetics.filter(c => keyOf(c.kind, c.id) !== key);
  // Gỡ luôn khỏi tay những người đã được trao, tránh treo món không còn tồn tại
  for (const u of db.users) {
    if (u.cosmetics?.includes(key)) u.cosmetics = u.cosmetics.filter(k => k !== key);
  }
  markDirty();
  return true;
}

// Lưu ảnh cho một món. buf = Buffer thô, mime lấy từ Content-Type.
export function saveImage(key, buf, mime) {
  const doc = findCosmetic(key);
  if (!doc) return [null, 'Không tìm thấy món này.'];
  const ext = EXT[String(mime || '').split(';')[0].trim()];
  if (!ext) return [null, 'Chỉ nhận ảnh PNG, JPG, GIF hoặc WEBP.'];
  if (!buf || !buf.length) return [null, 'Tệp rỗng.'];

  ensureDir();
  // Xoá tệp cũ trước: đổi từ .png sang .webp mà không xoá thì tệp cũ nằm lại mãi
  if (doc.img) {
    try { fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(doc.img))); } catch { /* ignore */ }
  }
  const file = `${doc.kind}_${doc.id}_${Date.now().toString(36)}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, file), buf);
  doc.img = `${WEB_DIR}/${file}`;
  markDirty();
  return [doc, null];
}

export function clearImage(key) {
  const doc = findCosmetic(key);
  if (!doc) return false;
  if (doc.img) {
    try { fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(doc.img))); } catch { /* ignore */ }
  }
  doc.img = null;
  markDirty();
  return true;
}

// Bản gửi cho client: bỏ những trường chỉ admin cần
export function publicCosmetics() {
  return getDb().cosmetics.map(c => ({
    id: c.id, kind: c.kind, name: c.name, color: c.color,
    css: c.css || null, how: c.how, n: c.n || 0, img: c.img || null,
  }));
}

// ==== Trao tay ====
// Trả về [danh sách khoá đang có, error]
export function grantCosmetic(user, key, give = true) {
  if (!user) return [null, 'Không tìm thấy người chơi.'];
  const [kind, id] = String(key || '').split(':');
  if (!KINDS.includes(kind) || !id) return [null, 'Mã món không hợp lệ.'];
  if (!Array.isArray(user.cosmetics)) user.cosmetics = [];
  const has = user.cosmetics.includes(key);
  if (give && !has) user.cosmetics.push(key);
  if (!give && has) user.cosmetics = user.cosmetics.filter(k => k !== key);
  markDirty();
  return [user.cosmetics, null];
}

export const cosmeticsOf = (user) => (Array.isArray(user?.cosmetics) ? user.cosmetics : []);
