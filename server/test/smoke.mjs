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

  // ==== Bang hội ====
  // AshK vừa bị trừ tiền còn 999999₽; nạp lại mốc tiền cố định để kiểm tra trừ phí chính xác
  await api('/api/save', { method: 'PUT', token: tokenA, body: { name: 'AshK', money: 200000, party: [{ sp: 25, lv: 50, iv: [31, 31, 31, 31, 31, 31], ev: [0, 0, 0, 0, 0, 0], moves: [{ id: 'thunderbolt', pp: 15 }], hpCur: 100, exp: 0 }], box: [], bag: {}, badges: [], dex: { seen: { 25: true }, caught: { 25: true } } } });

  const gCreate = await api('/api/guild/create', { method: 'POST', body: { name: 'Doi Sam Set', tag: 'zap', desc: 'Bang hoi test', icon: 3 }, token: tokenA });
  ok('tạo bang hội', gCreate.status === 200 && gCreate.data.guild?.tag === 'ZAP', JSON.stringify(gCreate.data));
  const guildId = gCreate.data.guild?.id;

  const afterCreate = await api('/api/me', { token: tokenA });
  ok('trừ 10000₽ phí lập bang hội', afterCreate.data.save.money === 190000, String(afterCreate.data.save.money));

  const dupTag = await api('/api/guild/create', { method: 'POST', body: { name: 'Bang Khac', tag: 'ZAP' }, token: tokenB });
  ok('chặn tag trùng', dupTag.status === 400, JSON.stringify(dupTag.data));

  const twice = await api('/api/guild/create', { method: 'POST', body: { name: 'Bang Thu Hai', tag: 'TWO' }, token: tokenA });
  ok('chặn tạo guild thứ 2', twice.status === 400);

  const badTag = await api('/api/guild/create', { method: 'POST', body: { name: 'Bang Loi', tag: 'X' }, token: tokenB });
  ok('chặn tag sai định dạng', badTag.status === 400);

  const gList = await api('/api/guild/list?q=zap', { token: tokenB });
  ok('tìm bang hội trong danh sách', gList.data.rows.length === 1 && gList.data.rows[0].tag === 'ZAP');

  const gPub = await api(`/api/guild/${guildId}`, { token: tokenB });
  ok('xem thông tin công khai bang hội', gPub.data.guild?.name === 'Doi Sam Set' && gPub.data.guild.leader === 'AshK');

  // Chuyển sang chế độ duyệt đơn
  const setApproval = await api('/api/guild/settings', { method: 'PUT', body: { joinPolicy: 'approval', announcement: 'Chao mung' }, token: tokenA });
  ok('đổi chế độ gia nhập sang duyệt đơn', setApproval.status === 200 && setApproval.data.guild.joinPolicy === 'approval');

  const applyB = await api(`/api/guild/${guildId}/join`, { method: 'POST', token: tokenB });
  ok('nộp đơn xin vào bang hội', applyB.status === 200 && applyB.data.pending === true, JSON.stringify(applyB.data));

  const mineWithApp = await api('/api/guild/mine', { token: tokenA });
  ok('leader thấy đơn xin vào', mineWithApp.data.guild.applicants.length === 1 && mineWithApp.data.guild.applicants[0].username === 'MistyW');

  const mistyId = mineWithApp.data.guild.applicants[0].userId;
  const approve = await api(`/api/guild/${guildId}/applicant/${mistyId}`, { method: 'POST', body: { accept: true }, token: tokenA });
  ok('leader duyệt đơn', approve.status === 200 && approve.data.result.accepted);

  const mine2 = await api('/api/guild/mine', { token: tokenA });
  ok('số thành viên tăng lên 2', mine2.data.guild.memberList.length === 2, JSON.stringify(mine2.data.guild.memberList));
  ok('thành viên mới có vai trò member', mine2.data.guild.memberList.find(m => m.username === 'MistyW')?.role === 'member');

  const mineB = await api('/api/guild/mine', { token: tokenB });
  ok('thành viên xem được bang hội của mình', mineB.data.guild?.tag === 'ZAP' && mineB.data.role === 'member');
  ok('bonus guild theo cấp', Math.abs(mineB.data.bonus.expMult - 1.02) < 1e-9, JSON.stringify(mineB.data.bonus));

  // Góp quỹ: 30000₽ -> 300 exp -> lên cấp 2 (cần 1000 exp/cấp thì chưa lên), thử mốc lớn hơn
  const don1 = await api('/api/guild/donate', { method: 'POST', body: { amount: 30000 }, token: tokenA });
  ok('góp quỹ thành công', don1.status === 200 && don1.data.treasury === 30000, JSON.stringify(don1.data));
  ok('trừ tiền người góp', don1.data.money === 160000);
  ok('cộng cống hiến', don1.data.contribution === 30000);
  ok('cộng exp guild (1 exp/100₽)', don1.data.exp === 300 && don1.data.level === 1, JSON.stringify(don1.data));

  const tooMuch = await api('/api/guild/donate', { method: 'POST', body: { amount: 999999 }, token: tokenA });
  ok('chặn góp quá số tiền đang có', tooMuch.status === 400);

  const don2 = await api('/api/guild/donate', { method: 'POST', body: { amount: 70000 }, token: tokenA });
  ok('guild lên cấp khi đủ exp', don2.data.level === 2 && don2.data.exp === 0, JSON.stringify(don2.data));

  const mine3 = await api('/api/guild/mine', { token: tokenA });
  ok('maxMembers tăng theo cấp', mine3.data.guild.maxMembers === 24, String(mine3.data.guild.maxMembers));
  ok('bonus tăng theo cấp', Math.abs(mine3.data.bonus.expMult - 1.04) < 1e-9);

  // ==== Chat bang hội qua socket ====
  // Kết nối lại: socket của AshK đã bị ngắt trong phần test khóa tài khoản ở trên
  sockA.close(); sockB.close();
  await sleep(300);
  const sockA2 = ioClient(BASE, { auth: { token: tokenA }, transports: ['websocket'] });
  const sockB2 = ioClient(BASE, { auth: { token: tokenB }, transports: ['websocket'] });
  ok('kết nối lại socket sau khi mở khóa', !!(await waitFor(sockA2, 'welcome')) && !!(await waitFor(sockB2, 'welcome')));

  const gMsgA = waitFor(sockA2, 'guild:msg');
  const gMsgB = waitFor(sockB2, 'guild:msg');
  sockB2.emit('guild:send', { text: 'Chao ca bang!' });
  const [gA, gB] = [await gMsgA, await gMsgB];
  ok('cả 2 thành viên nhận chat bang hội', gA?.text === 'Chao ca bang!' && gB?.text === 'Chao ca bang!' && gA.from === 'MistyW');

  const gHist = await api('/api/guild/chat?limit=50', { token: tokenA });
  ok('lịch sử chat bang hội có tin vừa gửi', gHist.data.rows.some(r => r.text === 'Chao ca bang!'));
  ok('chat bang hội có tin hệ thống khi thành viên vào', gHist.data.rows.some(r => r.system));

  // Người ngoài guild
  const r3 = await api('/api/auth/register', { method: 'POST', body: { username: 'BrockH', password: 'secret4', avatar: 'red' } });
  ok('đăng ký user 3', r3.status === 200);
  const tokenC = r3.data.token;
  const sockC = ioClient(BASE, { auth: { token: tokenC }, transports: ['websocket'] });
  await waitFor(sockC, 'welcome');

  const outErr = waitFor(sockC, 'chat:error', 2000);
  sockC.emit('guild:send', { text: 'Toi khong o bang nao' });
  ok('người ngoài guild không chat được', !!(await outErr));

  const outHist = await api('/api/guild/chat', { token: tokenC });
  ok('người ngoài guild không xem được lịch sử', outHist.status === 400);

  // ==== Chức vụ / đuổi / rời ====
  const promo = await api(`/api/guild/promote/${mistyId}`, { method: 'POST', body: { role: 'officer' }, token: tokenA });
  ok('leader thăng chức officer', promo.status === 200 && promo.data.result.role === 'officer');

  const promoByMember = await api(`/api/guild/promote/${mistyId}`, { method: 'POST', body: { role: 'member' }, token: tokenB });
  ok('không phải leader thì không đổi chức vụ được', promoByMember.status === 400);

  // BrockH vào guild (mở lại chế độ open), rồi bị officer đuổi
  await api('/api/guild/settings', { method: 'PUT', body: { joinPolicy: 'open' }, token: tokenA });
  const joinC = await api(`/api/guild/${guildId}/join`, { method: 'POST', token: tokenC });
  ok('vào thẳng guild khi joinPolicy = open', joinC.status === 200 && joinC.data.pending === false);

  const brockId = (await api('/api/guild/mine', { token: tokenA })).data.guild.memberList.find(m => m.username === 'BrockH')?.userId;
  const kickLeader = await api(`/api/guild/kick/${(await api('/api/guild/mine', { token: tokenA })).data.guild.memberList.find(m => m.role === 'leader').userId}`, { method: 'POST', token: tokenB });
  ok('officer không đuổi được leader', kickLeader.status === 400);

  const kickC = await api(`/api/guild/kick/${brockId}`, { method: 'POST', token: tokenB });
  ok('officer đuổi được thành viên thường', kickC.status === 200);

  const mine4 = await api('/api/guild/mine', { token: tokenA });
  ok('guild còn 2 thành viên sau khi đuổi', mine4.data.guild.memberList.length === 2);

  const leaderLeave = await api('/api/guild/leave', { method: 'POST', token: tokenA });
  ok('leader chưa chuyển quyền thì không rời được', leaderLeave.status === 400);

  const leaveB = await api('/api/guild/leave', { method: 'POST', token: tokenB });
  ok('thành viên rời bang hội', leaveB.status === 200 && leaveB.data.result.left);

  const mineBAfter = await api('/api/guild/mine', { token: tokenB });
  ok('người đã rời không còn bang hội', mineBAfter.data.guild === null);

  // ==== Tin nhắn riêng (DM) ====
  const dmIn = waitFor(sockB2, 'dm:msg');
  sockA2.emit('dm:send', { to: 'MistyW', text: 'Chao ban nhe!' });
  const dmMsg = await dmIn;
  ok('người nhận nhận được DM', dmMsg?.text === 'Chao ban nhe!' && dmMsg.from === 'AshK', JSON.stringify(dmMsg));

  await sleep(1100);
  const dmIn2 = waitFor(sockA2, 'dm:msg');
  sockB2.emit('dm:send', { to: 'AshK', text: 'Chao lai ban!' });
  ok('gửi DM chiều ngược lại', (await dmIn2)?.text === 'Chao lai ban!');

  const dmListA = await api('/api/chat/dm', { token: tokenA });
  ok('danh sách hội thoại có MistyW', dmListA.data.rows.length === 1 && dmListA.data.rows[0].username === 'MistyW', JSON.stringify(dmListA.data.rows));
  ok('đếm tin chưa đọc', dmListA.data.rows[0].unread === 1, String(dmListA.data.rows[0].unread));
  ok('tin cuối đúng nội dung', dmListA.data.rows[0].last.text === 'Chao lai ban!');

  const dmHistA = await api('/api/chat/dm/MistyW?limit=50', { token: tokenA });
  ok('lịch sử DM đủ 2 tin', dmHistA.data.rows.length === 2 && dmHistA.data.rows[0].text === 'Chao ban nhe!');

  const dmListA2 = await api('/api/chat/dm', { token: tokenA });
  ok('mở hội thoại thì hết tin chưa đọc', dmListA2.data.rows[0].unread === 0);

  await sleep(1100);
  const dmSpam = waitFor(sockA2, 'chat:error', 2000);
  sockA2.emit('dm:send', { to: 'MistyW', text: 'spam 1' });
  sockA2.emit('dm:send', { to: 'MistyW', text: 'spam 2' });
  ok('chống spam DM (1 tin/giây)', !!(await dmSpam));

  await sleep(1100);
  const dmNoUser = waitFor(sockA2, 'chat:error', 2000);
  sockA2.emit('dm:send', { to: 'KhongTonTai', text: 'hello' });
  ok('DM tới người không tồn tại bị chặn', !!(await dmNoUser));

  // ==== Admin: bang hội ====
  const admGuilds = await api('/api/admin/guilds', { token: admToken });
  ok('admin xem danh sách bang hội', admGuilds.data.rows.length === 1 && admGuilds.data.rows[0].tag === 'ZAP', JSON.stringify(admGuilds.data.rows));
  ok('admin thấy quỹ và hội trưởng', admGuilds.data.rows[0].treasury === 100000 && admGuilds.data.rows[0].leader === 'AshK');
  ok('admin thấy danh sách thành viên', admGuilds.data.rows[0].memberList.length === 1);

  const admStats2 = await api('/api/admin/stats', { token: admToken });
  ok('thống kê admin đếm bang hội', admStats2.data.guilds === 1);

  const disband = await api(`/api/admin/guild/${guildId}`, { method: 'DELETE', token: admToken });
  ok('admin giải tán bang hội', disband.status === 200);

  const admGuilds2 = await api('/api/admin/guilds', { token: admToken });
  ok('bang hội đã bị xóa', admGuilds2.data.rows.length === 0);

  const mineAfterDisband = await api('/api/guild/mine', { token: tokenA });
  ok('leader không còn bang hội sau khi giải tán', mineAfterDisband.data.guild === null);

  sockC.close(); sockA2.close(); sockB2.close();

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
