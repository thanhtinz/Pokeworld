// TuxeWorld H5 | engine/trade.js | Đổi Tuxemon với NPC — theo trade_manager.py
//
// Bản gốc rải sẵn mấy vụ đổi chác trong bản đồ bằng lệnh "trading <đưa>,<nhận>":
// NPC nào đó thích một loài cụ thể, ai có thì đổi cho họ lấy loài khác. Luật
// (execute_scripted_trade):
//   · con nhận được sinh mới ở ĐÚNG CẤP của con vừa đưa đi
//   · nó thay chỗ con cũ ngay trong đội
//   · đánh dấu là "đổi mà có" và ghi luôn vào Tuxedex
// Mỗi NPC chỉ đổi một lần (bản gốc dùng biến <tên>_hastraded).
import { SPECIES, speciesBySlug } from '../data/species.js';
import { newTuxemon } from './monster.js';
import { G, save, markCaught } from '../state.js';

const idCua = (slug) => {
  const sp = speciesBySlug(slug);
  if (!sp) return null;
  return Number(Object.keys(SPECIES).find(k => SPECIES[k] === sp));
};

export const tradeKey = (mapId, npcName, t) => `${mapId}:${npcName}:${t.give}>${t.get}`;

export const tradeDone = (mapId, npcName, t) => !!G.p?.trades?.[tradeKey(mapId, npcName, t)];

// Những con trong đội hợp yêu cầu của NPC (chỉ đội hình — không lôi từ Box ra,
// giống bản gốc chỉ xét party)
export function tradeCandidates(t) {
  const id = idCua(t.give);
  if (id === null) return [];
  // Bản lưu cũ có con ghi mã loài dạng chuỗi, nên so bằng số cho chắc
  return (G.p?.party || []).map((m, i) => ({ i, m })).filter(x => Number(x.m.sp) === id);
}

export const tradeNames = (t) => ({
  give: speciesBySlug(t.give)?.name || t.give,
  get: speciesBySlug(t.get)?.name || t.get,
});

// Thực hiện đổi. slot = vị trí con đưa đi trong đội.
// Trả về { ok, given, got } — got là con mới đã nằm trong đội.
export function doTrade(mapId, npcName, t, slot) {
  const idGet = idCua(t.get);
  const cu = G.p.party[slot];
  if (idGet === null || !cu || Number(cu.sp) !== idCua(t.give)) return { ok: false };

  const moi = newTuxemon(idGet, cu.lv);
  moi.traded = true;                 // Acquisition.TRADED của bản gốc
  G.p.party[slot] = moi;

  if (!G.p.trades) G.p.trades = {};
  G.p.trades[tradeKey(mapId, npcName, t)] = true;
  markCaught(moi.sp);
  save();
  return { ok: true, given: cu, got: moi };
}
