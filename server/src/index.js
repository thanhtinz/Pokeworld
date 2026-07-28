// TuxeWorld server | src/index.js | Điểm khởi động: Express + Socket.IO + trang admin
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';

import { loadDb, startAutosave, stopAutosave, getDb } from './db.js';
import { router as apiRouter } from './routes.js';
import { setupRealtime, onlineCount } from './realtime.js';
import { EVENT_DIR } from './uploads.js';
import { adminRouter } from './admin.js';
import { ensureDir as ensureCosmeticDir, UPLOAD_DIR } from './cosmetics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8790);

loadDb();
startAutosave(5000);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Kiểm tra sức khỏe (dùng cho docker healthcheck / uptime monitor)
app.get('/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), online: onlineCount(), users: getDb().users.length });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use('/api', apiRouter);
app.use('/api/admin', adminRouter(io));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// Ảnh thời trang admin tải lên — client tải thẳng từ đây
ensureCosmeticDir();
app.use('/uploads/cosmetics', express.static(UPLOAD_DIR, { maxAge: '1h' }));
app.use('/uploads/events', express.static(EVENT_DIR, { maxAge: '1h' }));

app.get('/', (req, res) => {
  res.json({
    name: getDb().config.serverName || 'TuxeWorld',
    motd: getDb().config.motd,
    online: onlineCount(),
    endpoints: ['/api', '/admin', '/health'],
  });
});

setupRealtime(io);

server.listen(PORT, () => {
  console.log(`[TuxeWorld] server chạy tại http://localhost:${PORT}`);
  console.log(`[TuxeWorld] trang admin: http://localhost:${PORT}/admin`);
});

// Lưu dữ liệu trước khi tắt (docker stop / Ctrl+C)
const shutdown = (sig) => {
  console.log(`\n[TuxeWorld] ${sig} — đang lưu dữ liệu...`);
  stopAutosave();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export { app, server, io };
