// TuxeWorld server | src/uploads.js | Tải ảnh chung cho sự kiện / tin tức
//
// Ảnh thời trang có kho riêng gắn với từng món (src/cosmetics.js). Sự kiện thì
// admin dựng tự do nên cần một kho ảnh chung: tải lên là trả về đường dẫn web,
// admin dán đường dẫn đó vào ô ảnh của đồng sự kiện / phần thưởng / băng-rôn.
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || './data';
export const EVENT_DIR = path.join(DATA_DIR, 'uploads', 'events');
const WEB_DIR = '/uploads/events';

const EXT = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

export function ensureDir() {
  fs.mkdirSync(EVENT_DIR, { recursive: true });
}

// buf = Buffer thô, mime lấy từ Content-Type. Trả [đường dẫn web, lỗi]
export function saveUpload(buf, mime, ten = 'img') {
  const ext = EXT[String(mime || '').split(';')[0].trim()];
  if (!ext) return [null, 'Chỉ nhận ảnh PNG, JPG, GIF hoặc WEBP.'];
  if (!buf || !buf.length) return [null, 'Tệp rỗng.'];
  ensureDir();
  const an = String(ten).replace(/[^a-z0-9_-]/gi, '').slice(0, 24) || 'img';
  const file = `${an}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}${ext}`;
  fs.writeFileSync(path.join(EVENT_DIR, file), buf);
  return [`${WEB_DIR}/${file}`, null];
}

export function listUploads() {
  ensureDir();
  return fs.readdirSync(EVENT_DIR)
    .filter(f => Object.values(EXT).some(e => f.endsWith(e)))
    .map(f => ({ file: f, url: `${WEB_DIR}/${f}`,
      ts: fs.statSync(path.join(EVENT_DIR, f)).mtimeMs }))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 200);
}

export function removeUpload(file) {
  const an = path.basename(String(file || ''));
  try { fs.unlinkSync(path.join(EVENT_DIR, an)); return true; } catch { return false; }
}
