// TuxeWorld H5 | engine/fishing.js | Câu cá — THEO ĐÚNG core/effects/fishing.py
//
// Bản gốc để cấu hình từng cần câu trong mods/fishing.yaml: tỉ lệ cắn câu,
// khoảng cấp, và bộ lọc loài theo BẬC TIẾN HOÁ (stages) cùng DÁNG THÂN (shapes)
// kèm trọng số. Cần càng xịn thì tỉ lệ càng cao, cá càng to, càng có cửa gặp
// dáng "leviathan" — mấy con thuỷ quái mà đi bộ trong cỏ không bao giờ đụng.
//
// Điều kiện dùng cần (db/item: facing_tile surfable) nằm ở engine/overworld.js.
import { rng } from '../util.js';
import { FISHING } from '../data/fishing.js';
import { SPECIES } from '../data/species.js';
import { newTuxemon } from './monster.js';

// Danh sách loài hợp lệ cho một cần câu, nhóm theo dáng thân
function theoDang(cfg) {
  const nhom = {};
  for (const [id, sp] of Object.entries(SPECIES)) {
    if (sp.glitched) continue;
    if (cfg.shapes.length && !cfg.shapes.includes(sp.shape)) continue;
    if (cfg.stages.length && !cfg.stages.includes(sp.stage)) continue;
    (nhom[sp.shape] = nhom[sp.shape] || []).push(Number(id));
  }
  return nhom;
}

// Bốc một dáng thân theo trọng số của bản gốc; dáng nào không có loài nào thì bỏ
function bocDang(nhom, w) {
  const ds = Object.keys(nhom);
  if (!ds.length) return null;
  const tong = ds.reduce((a, k) => a + (w[k] ?? 1), 0);
  let x = rng.float() * tong;
  for (const k of ds) { x -= (w[k] ?? 1); if (x <= 0) return k; }
  return ds[ds.length - 1];
}

// Thả câu. Trả về { ok: false } nếu cá không cắn, hoặc { ok: true, mon, env }
export function fish(rodId) {
  const cfg = FISHING[rodId];
  if (!cfg) return { ok: false };
  if (!rng.roll(cfg.trigger)) return { ok: false };

  const nhom = theoDang(cfg);
  const dang = bocDang(nhom, cfg.w || {});
  if (!dang) return { ok: false };

  const [lo, hi] = cfg.lv;
  const mon = newTuxemon(rng.pick(nhom[dang]), rng.int(lo, hi));
  return { ok: true, mon, env: cfg.env, envNight: cfg.envNight };
}

// Loài nào câu được bằng cần này (dùng cho test và cho mô tả trong shop)
export function catchable(rodId) {
  const cfg = FISHING[rodId];
  if (!cfg) return [];
  return Object.values(theoDang(cfg)).flat();
}
