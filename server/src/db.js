// PokeWorld server | src/db.js | Kho dữ liệu JSON có ghi an toàn (atomic) — interface kiểu collection
// Đổi sang Postgres/SQLite sau này chỉ cần thay thân các hàm dưới, giữ nguyên chữ ký.
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || './data';
const FILE = path.join(DATA_DIR, 'db.json');

// Cấu trúc DB: mỗi collection là 1 mảng object có trường id
const EMPTY = {
  users: [],          // {id, username, unameLower, passHash, avatar, role, banned, banReason, createdAt, lastSeen, save, stats:{pvpWin,pvpLose}}
  friendships: [],    // {id, a, b, status:'pending'|'accepted', from, createdAt}
  marriages: [],      // {id, a, b, since}
  pvpHistory: [],     // {id, winner, loser, disputed, ts}
  auditLog: [],       // {id, ts, admin, action, target, detail}
  config: {},         // MOTD + event multipliers do admin chỉnh
};

let db = null;
let dirty = false;

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function loadDb() {
  ensureDir();
  if (fs.existsSync(FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
      db = { ...structuredClone(EMPTY), ...parsed };
    } catch (e) {
      // File hỏng: giữ lại bản lỗi để điều tra, khởi tạo DB mới
      const bak = FILE + '.corrupt-' + Date.now();
      try { fs.renameSync(FILE, bak); } catch { /* ignore */ }
      console.error('[db] file hỏng, đã đổi tên thành', bak, e.message);
      db = structuredClone(EMPTY);
    }
  } else {
    db = structuredClone(EMPTY);
  }
  // Config mặc định
  db.config = {
    motd: 'Chào mừng đến PokeWorld Online!',
    expMult: 1,
    moneyMult: 1,
    shinyMult: 1,
    serverName: 'PokeWorld',
    ...db.config,
  };
  return db;
}

export function getDb() {
  if (!db) loadDb();
  return db;
}

// Ghi atomic: viết file tạm rồi rename (rename là thao tác nguyên tử trên cùng ổ đĩa)
export function flush() {
  if (!db) return;
  ensureDir();
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, FILE);
  dirty = false;
}

export function markDirty() { dirty = true; }

// Tự lưu định kỳ khi có thay đổi
let timer = null;
export function startAutosave(ms = 5000) {
  if (timer) return;
  timer = setInterval(() => { if (dirty) flush(); }, ms);
  timer.unref?.();
}
export function stopAutosave() {
  if (timer) { clearInterval(timer); timer = null; }
  flush();
}

// ==== Helper collection ====
export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export function find(coll, predicate) {
  return getDb()[coll].find(predicate) || null;
}
export function filter(coll, predicate) {
  return getDb()[coll].filter(predicate);
}
export function insert(coll, doc) {
  if (!doc.id) doc.id = uid(coll.slice(0, 3));
  getDb()[coll].push(doc);
  markDirty();
  return doc;
}
export function remove(coll, predicate) {
  const arr = getDb()[coll];
  const before = arr.length;
  getDb()[coll] = arr.filter(d => !predicate(d));
  if (getDb()[coll].length !== before) markDirty();
  return before - getDb()[coll].length;
}
export function count(coll, predicate) {
  return predicate ? filter(coll, predicate).length : getDb()[coll].length;
}

// Ghi log hành động admin (giữ tối đa 1000 dòng gần nhất)
export function audit(admin, action, target, detail) {
  const d = getDb();
  d.auditLog.push({ id: uid('log'), ts: Date.now(), admin, action, target, detail });
  if (d.auditLog.length > 1000) d.auditLog = d.auditLog.slice(-1000);
  markDirty();
}
