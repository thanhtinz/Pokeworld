// TuxeWorld server | src/gifts.js | Tặng quà và điểm thân mật
//
// Muốn cưới nhau thì phải quen nhau đã: tặng quà cho bạn bè để cộng điểm thân
// mật, đủ MOC_KET_HON điểm mới cầu hôn được.
//
// Bảng quà nằm ở src/gifts.data.js do tools/mkgifts.py sinh cùng lúc với bản
// của client — máy chủ tự tra điểm theo id món, không đọc con số client gửi
// lên. Mỗi cặp mỗi ngày chỉ tính điểm cho QUA_MOI_NGAY món đầu tiên, tặng nữa
// vẫn nhận nhưng không cộng thêm, để không ai bơm điểm bằng máy.
import express from 'express';
import { find, filter, insert, markDirty, uid } from './db.js';
import { authRequired } from './auth.js';
import { friendshipBetween, pairKey, MOC_KET_HON } from './social.js';
import { GIFTS, GIFT_BY_ID, MOC_KET_HON as MOC_DATA, QUA_MOI_NGAY } from './gifts.data.js';

export const giftRouter = express.Router();
export { MOC_KET_HON };

const capKey = pairKey;
const ngay = (ts = Date.now()) => Math.floor(ts / 86400000);

const byName = (name) => {
  const lower = String(name || '').trim().toLowerCase();
  return find('users', u => u.unameLower === lower);
};

// Hai nơi cùng ghi một con số thì trước sau gì cũng lệch — chặn ngay lúc nạp
if (MOC_DATA !== MOC_KET_HON) {
  throw new Error(`Mốc kết hôn lệch nhau: gifts.data.js=${MOC_DATA}, social.js=${MOC_KET_HON}`);
}

export function thanMat(aId, bId) {
  return find('intimacy', x => x.key === capKey(aId, bId));
}

export const diemThanMat = (aId, bId) => thanMat(aId, bId)?.diem || 0;

// Mốc quan hệ theo điểm — chỉ để hiển thị cho vui
export const CAP_DO = [
  { diem: 0, ten: 'Người quen' },
  { diem: 500, ten: 'Bạn bè' },
  { diem: 2000, ten: 'Bạn thân' },
  { diem: 5000, ten: 'Tri kỷ' },
  { diem: MOC_KET_HON, ten: 'Cưới được rồi' },
];

export function capDo(diem) {
  let ra = CAP_DO[0];
  for (const c of CAP_DO) if (diem >= c.diem) ra = c;
  return ra.ten;
}

// Trả về [kết quả, lỗi]
export function tangQua(from, to, giftId) {
  if (from.id === to.id) return [null, 'Tự tặng mình thì tính điểm với ai.'];
  const q = GIFT_BY_ID[giftId];
  if (!q) return [null, 'Không có món quà này.'];
  const fr = friendshipBetween(from.id, to.id);
  if (!fr || fr.status !== 'accepted') return [null, 'Phải là bạn bè mới tặng quà được.'];

  const key = capKey(from.id, to.id);
  let rec = find('intimacy', x => x.key === key);
  if (!rec) {
    rec = insert('intimacy', {
      id: uid('int'), key, a: from.id, b: to.id,
      diem: 0, soQua: 0, ngay: ngay(), trongNgay: 0, ts: Date.now(),
    });
  }
  if (rec.ngay !== ngay()) { rec.ngay = ngay(); rec.trongNgay = 0; }

  const conTinh = Math.max(0, QUA_MOI_NGAY - rec.trongNgay);
  const cong = conTinh > 0 ? q.diem : 0;
  rec.trongNgay += 1;
  rec.soQua += 1;
  rec.diem += cong;
  rec.ts = Date.now();
  markDirty();

  return [{
    gift: { id: q.id, name: q.name, diem: q.diem },
    cong,
    diem: rec.diem,
    capDo: capDo(rec.diem),
    conTinhHomNay: Math.max(0, QUA_MOI_NGAY - rec.trongNgay),
    cuoiDuoc: rec.diem >= MOC_KET_HON,
  }, null];
}

// ==== Route ====
giftRouter.get('/', (req, res) => {
  res.json({ gifts: GIFTS, mocKetHon: MOC_KET_HON, moiNgay: QUA_MOI_NGAY });
});

// Điểm thân mật với từng người bạn
giftRouter.get('/thanmat', authRequired, (req, res) => {
  const me = req.user;
  const rows = filter('friendships', f => (f.a === me.id || f.b === me.id) && f.status === 'accepted');
  const ds = [];
  for (const f of rows) {
    const id = f.a === me.id ? f.b : f.a;
    const u = find('users', x => x.id === id);
    if (!u || u.banned) continue;
    const rec = thanMat(me.id, id);
    const diem = rec?.diem || 0;
    ds.push({
      username: u.username, avatar: u.avatar, diem, capDo: capDo(diem),
      soQua: rec?.soQua || 0,
      conTinhHomNay: Math.max(0, QUA_MOI_NGAY
        - (rec && rec.ngay === ngay() ? rec.trongNgay : 0)),
      cuoiDuoc: diem >= MOC_KET_HON,
    });
  }
  ds.sort((a, b) => b.diem - a.diem);
  res.json({ ds, mocKetHon: MOC_KET_HON });
});

giftRouter.post('/tang', authRequired, (req, res) => {
  const to = byName(req.body?.username);
  if (!to || to.banned) return res.status(404).json({ error: 'Không tìm thấy người chơi.' });
  const [ra, err] = tangQua(req.user, to, String(req.body?.giftId || ''));
  if (err) return res.status(400).json({ error: err });
  res.json(ra);
});
