// PokeWorld server | test/smoke.mjs | Test tự động: REST + socket + PvP + admin
// Chạy: node test/smoke.mjs  (tự khởi động server ở port test, dùng thư mục data tạm)
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { io as ioClient } from 'socket.io-client';

const PORT = 8899;
const BASE = `http://localhost:${PORT}`;
const DATA_DIR = path.join('/tmp', 'pw-test-' + Date.now());
const ADMIN_USER = 'testadmin';
const ADMIN_PASS = 'testpass123';

let fails = 0;
const ok = (name, cond, extra = '') => {
  console.log((cond ? '[OK] ' : '[FAIL] ') + name + (cond ? '' : ' — ' + extra));
  if (!cond) fails++;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function api(pathname, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  const res = await fetch(BASE + pathname, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

// ==== Khởi động server ====
const srv = spawn(process.execPath, ['src/index.js'], {
  cwd: path.join(path.dirname(new URL(import.meta.url).pathname), '..'),
  env: { ...process.env, PORT: String(PORT), DATA_DIR, JWT_SECRET: 'test-secret', ADMIN_USER, ADMIN_PASS },
  stdio: ['ignore', 'pipe', 'pipe'],
});
srv.stderr.on('data', d => process.env.DEBUG && console.error('[srv]', d.toString()));

async function waitUp() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(BASE + '/health');
      if (r.ok) return true;
    } catch { /* chưa lên */ }
    await sleep(200);
  }
  return false;
}

function cleanup(code) {
  srv.kill('SIGTERM');
  setTimeout(() => {
    try { fs.rmSync(DATA_DIR, { recursive: true, force: true }); } catch { /* ignore */ }
    process.exit(code);
  }, 400);
}

try {
  ok('server khởi động', await waitUp());

  // ==== Đăng ký / đăng nhập ====
  const r1 = await api('/api/auth/register', { method: 'POST', body: { username: 'AshK', password: 'secret1', avatar: 'red' } });
  ok('đăng ký user 1', r1.status === 200 && !!r1.data.token, JSON.stringify(r1.data));
  const tokenA = r1.data.token;

  const r2 = await api('/api/auth/register', { method: 'POST', body: { username: 'MistyW', password: 'secret2', avatar: 'leaf' } });
  ok('đăng ký user 2', r2.status === 200 && !!r2.data.token);
  const tokenB = r2.data.token;

  const dup = await api('/api/auth/register', { method: 'POST', body: { username: 'ashk', password: 'secret3' } });
  ok('chặn trùng tên (không phân biệt hoa thường)', dup.status === 400);

  const weak = await api('/api/auth/register', { method: 'POST', body: { username: 'Zed', password: '123' } });
  ok('chặn mật khẩu ngắn', weak.status === 400);

  const badLogin = await api('/api/auth/login', { method: 'POST', body: { username: 'AshK', password: 'sai-mat-khau' } });
  ok('chặn sai mật khẩu', badLogin.status === 401);

  const goodLogin = await api('/api/auth/login', { method: 'POST', body: { username: 'AshK', password: 'secret1' } });
  ok('đăng nhập đúng', goodLogin.status === 200 && !!goodLogin.data.token);

  // ==== Save + validate chống hack ====
  const hackedSave = {
    name: 'AshK', money: 999999999,        // vượt trần
    party: [{ sp: 25, lv: 999, iv: [99, 99, 99, 99, 99, 99], ev: [999, 0, 0, 0, 0, 0], moves: [{ id: 'thunderbolt', pp: 15 }], hpCur: 50, exp: 0 }],
    box: [], bag: { potion: 99999, 'hack<script>': 5 }, badges: ['badge_boulder'],
    dex: { seen: { 25: true, 9999: true }, caught: { 25: true } },
  };
  const saveRes = await api('/api/save', { method: 'PUT', body: hackedSave, token: tokenA });
  ok('lưu save trả về ok', saveRes.status === 200 && saveRes.data.ok);
  ok('validate có cảnh báo', (saveRes.data.warnings || []).length > 0);

  const me = await api('/api/me', { token: tokenA });
  ok('tiền bị kẹp về trần', me.data.save.money === 9999999, String(me.data.save.money));
  ok('level bị kẹp về 100', me.data.save.party[0].lv === 100);
  ok('IV bị kẹp về 31', me.data.save.party[0].iv[0] === 31);
  ok('item số lượng bị kẹp 999', me.data.save.bag.potion === 999);
  ok('dex số hiệu lạ bị loại', !me.data.save.dex.seen['9999']);

  await api('/api/save', { method: 'PUT', token: tokenB, body: { name: 'MistyW', money: 5000, party: [{ sp: 7, lv: 20, iv: [10, 10, 10, 10, 10, 10], ev: [0, 0, 0, 0, 0, 0], moves: [{ id: 'water_gun', pp: 25 }], hpCur: 40, exp: 0 }], box: [], bag: {}, badges: [], dex: { seen: { 7: true }, caught: { 7: true } } } });

  const noAuth = await api('/api/me');
  ok('chặn truy cập không token', noAuth.status === 401);

  // ==== Bảng xếp hạng ====
  const lb = await api('/api/leaderboard?metric=money');
  ok('bảng xếp hạng có 2 người', lb.data.rows.length === 2, JSON.stringify(lb.data.rows));
  ok('xếp hạng đúng thứ tự', lb.data.rows[0].username === 'AshK');

  // ==== Bạn bè ====
  const fr = await api('/api/friends/request', { method: 'POST', body: { username: 'MistyW' }, token: tokenA });
  ok('gửi lời mời kết bạn', fr.status === 200);

  const inbox = await api('/api/friends', { token: tokenB });
  ok('nhận được lời mời', inbox.data.incoming.length === 1, JSON.stringify(inbox.data));
  const reqId = inbox.data.incoming[0]?.requestId;

  const acc = await api('/api/friends/respond', { method: 'POST', body: { requestId: reqId, accept: true }, token: tokenB });
  ok('chấp nhận kết bạn', acc.status === 200);

  const flist = await api('/api/friends', { token: tokenA });
  ok('danh sách bạn bè có 1 người', flist.data.friends.length === 1 && flist.data.friends[0].username === 'MistyW');

  // ==== Kết hôn ====
  const prop = await api('/api/marriage/propose', { method: 'POST', body: { username: 'MistyW' }, token: tokenA });
  ok('cầu hôn (đã là bạn bè)', prop.status === 200, JSON.stringify(prop.data));

  const mInfo = await api('/api/marriage', { token: tokenB });
  ok('nhận lời cầu hôn', !!mInfo.data.pendingIncoming);

  const mAcc = await api('/api/marriage/respond', { method: 'POST', body: { accept: true }, token: tokenB });
  ok('đồng ý kết hôn', mAcc.status === 200);

  const married = await api('/api/marriage', { token: tokenA });
  ok('trạng thái đã kết hôn', married.data.married && married.data.partner.username === 'MistyW');

  // ==== Socket: chat + presence + PvP ====
  const sockA = ioClient(BASE, { auth: { token: tokenA }, transports: ['websocket'] });
  const sockB = ioClient(BASE, { auth: { token: tokenB }, transports: ['websocket'] });
  const waitFor = (sock, ev, ms = 5000) => new Promise(res => {
    const t = setTimeout(() => res(null), ms);
    sock.once(ev, d => { clearTimeout(t); res(d); });
  });

  const welA = await waitFor(sockA, 'welcome');
  const welB = await waitFor(sockB, 'welcome');
  ok('socket kết nối + welcome', !!welA && !!welB);

  const chatPromise = waitFor(sockB, 'chat:msg');
  sockA.emit('chat:send', { text: 'Xin chào mọi người!' });
  const chatMsg = await chatPromise;
  ok('chat thế giới nhận được', chatMsg?.text === 'Xin chào mọi người!' && chatMsg.username === 'AshK');

  // Chống spam
  const spamErr = waitFor(sockA, 'chat:error', 2000);
  sockA.emit('chat:send', { text: 'spam 1' });
  sockA.emit('chat:send', { text: 'spam 2' });
  ok('chống spam chat', !!(await spamErr));

  // PvP
  const invited = waitFor(sockB, 'pvp:invited');
  sockA.emit('pvp:challenge', { username: 'MistyW' });
  const inv = await invited;
  ok('gửi lời mời PvP', inv?.from === 'AshK');

  const startA = waitFor(sockA, 'pvp:start');
  const startB = waitFor(sockB, 'pvp:start');
  sockB.emit('pvp:accept');
  const [sA, sB] = [await startA, await startB];
  ok('cả hai vào trận', !!sA && !!sB);
  ok('cùng seed ngẫu nhiên', sA?.seed === sB?.seed, `${sA?.seed} vs ${sB?.seed}`);
  ok('phân side đúng', sA?.side === 0 && sB?.side === 1);
  ok('nhận được đội hình đối thủ', sA?.opponent?.party?.length === 1 && sA.opponent.username === 'MistyW');

  const actionB = waitFor(sockB, 'pvp:action');
  sockA.emit('pvp:action', { t: 'move', i: 0, turn: 1 });
  const act = await actionB;
  ok('chuyển tiếp hành động PvP', act?.t === 'move' && act.turn === 1);

  const endA = waitFor(sockA, 'pvp:end');
  const endB = waitFor(sockB, 'pvp:end');
  sockA.emit('pvp:result', { winner: 'AshK' });
  sockB.emit('pvp:result', { winner: 'AshK' });
  const [eA, eB] = [await endA, await endB];
  ok('kết thúc trận khi 2 bên báo khớp', eA?.winner === 'AshK' && eB?.winner === 'AshK' && !eA.disputed);

  await sleep(200);
  const meAfter = await api('/api/me', { token: tokenA });
  ok('ghi nhận thắng PvP vào hồ sơ', meAfter.data.user.stats.pvpWin === 1, JSON.stringify(meAfter.data.user.stats));

  // ==== Admin ====
  const badAdmin = await api('/api/admin/login', { method: 'POST', body: { username: ADMIN_USER, password: 'sai' } });
  ok('chặn sai mật khẩu admin', badAdmin.status === 401);

  const adm = await api('/api/admin/login', { method: 'POST', body: { username: ADMIN_USER, password: ADMIN_PASS } });
  ok('đăng nhập admin', adm.status === 200 && !!adm.data.token);
  const admToken = adm.data.token;

  const notAdmin = await api('/api/admin/stats', { token: tokenA });
  ok('token người chơi không vào được admin', notAdmin.status === 403);

  const stats = await api('/api/admin/stats', { token: admToken });
  ok('thống kê admin', stats.data.users === 2 && stats.data.online === 2, JSON.stringify(stats.data));

  const players = await api('/api/admin/players?q=ash', { token: admToken });
  ok('tìm người chơi', players.data.rows.length === 1 && players.data.rows[0].username === 'AshK');
  const ashId = players.data.rows[0].id;

  const grant = await api(`/api/admin/player/${ashId}/grant`, { method: 'POST', body: { money: -9000000, itemId: 'rare_candy', itemQty: 5 }, token: admToken });
  ok('admin tặng vật phẩm/tiền', grant.status === 200 && grant.data.bag.rare_candy === 5);

  const cfg = await api('/api/admin/config', { method: 'PUT', body: { motd: 'Sự kiện x2 EXP!', expMult: 2 }, token: admToken });
  ok('admin đổi cấu hình live', cfg.status === 200 && cfg.data.config.expMult === 2);

  const pubCfg = await api('/api/config');
  ok('client thấy cấu hình mới', pubCfg.data.expMult === 2 && pubCfg.data.motd === 'Sự kiện x2 EXP!');

  const banRes = await api(`/api/admin/player/${ashId}/ban`, { method: 'POST', body: { banned: true, reason: 'Test khóa' }, token: admToken });
  ok('admin khóa tài khoản', banRes.status === 200 && banRes.data.banned);

  const bannedLogin = await api('/api/auth/login', { method: 'POST', body: { username: 'AshK', password: 'secret1' } });
  ok('người bị khóa không đăng nhập được', bannedLogin.status === 401 && /khóa/i.test(bannedLogin.data.error || ''));

  const bannedApi = await api('/api/me', { token: tokenA });
  ok('token cũ bị chặn sau khi khóa', bannedApi.status === 403);

  const unban = await api(`/api/admin/player/${ashId}/ban`, { method: 'POST', body: { banned: false }, token: admToken });
  ok('admin mở khóa', unban.status === 200 && !unban.data.banned);

  const reLogin = await api('/api/auth/login', { method: 'POST', body: { username: 'AshK', password: 'secret1' } });
  ok('đăng nhập lại sau mở khóa', reLogin.status === 200);

  const audit = await api('/api/admin/audit', { token: admToken });
  ok('nhật ký admin ghi đủ thao tác', audit.data.rows.length >= 4, String(audit.data.rows.length));

  const pvpLog = await api('/api/admin/pvp', { token: admToken });
  ok('lịch sử PvP được lưu', pvpLog.data.rows.length === 1);

  // ==== Lưu xuống đĩa ====
  await api('/api/admin/flush', { method: 'POST', token: admToken });
  ok('DB ghi ra file', fs.existsSync(path.join(DATA_DIR, 'db.json')));

  sockA.close(); sockB.close();
  await sleep(300);
} catch (e) {
  console.error('[FAIL] ngoại lệ:', e);
  fails++;
}

console.log(fails === 0 ? '\n=== SERVER SMOKE OK ===' : `\n=== ${fails} TEST LỖI ===`);
cleanup(fails === 0 ? 0 : 1);
