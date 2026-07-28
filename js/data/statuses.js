// TuxeWorld H5 | data/statuses.js | Trạng thái — TỰ SINH TỪ tools/mktuxemon.py
// Nguồn: Tuxemon db/status (CC BY-SA 4.0). Đừng sửa tay.
// kind = kiểu tác động (xem js/engine/status.js), p = tham số của bản gốc,
// mods = nhân chỉ số, immune = hệ miễn nhiễm, keep = còn sau khi hết trận,
// onTech/onItem = dùng chiêu (hoặc dùng đồ) xong thì đổi sang trạng thái nào.

export const STATUSES = {
  "blinded": { name: "Mù", cat: "negative", kind: "statchange", p: [], mods: {"speed": 0.5, "dodge": 0.5}, immune: [] },
  "burn": { name: "Bỏng", cat: "negative", kind: "burnt", p: ["8", "weakest"], mods: {}, immune: ["fire"], keep: true, tmod: {"fire": 0.0, "frost": 2.0} },
  "chargedup": { name: "Tích lực", cat: "positive", kind: "chargedup", p: [], mods: {"armour": 2, "dodge": 2, "melee": 2, "ranged": 2, "speed": 2}, immune: [], onTech: "exhausted" },
  "charging": { name: "Đang dồn lực", cat: "positive", kind: "charging", p: [], mods: {}, immune: [], onTech: "chargedup", onItem: "chargedup" },
  "charmed": { name: "Mê hoặc", cat: "negative", kind: "charmed", p: ["0.5"], mods: {}, immune: [] },
  "confused": { name: "Rối trí", cat: "negative", kind: "confused", p: ["0.5"], mods: {}, immune: [] },
  "diehard": { name: "Lì đòn", cat: "positive", kind: "diehard", p: ["1"], mods: {}, immune: [] },
  "elementalshield": { name: "Khiên nguyên tố", cat: "positive", kind: "elemental_shield", p: ["16", "special"], mods: {}, immune: [] },
  "enraged": { name: "Nổi giận", cat: "positive", kind: "statchange", p: [], mods: {"melee": 2, "ranged": 0.5}, immune: [] },
  "exhausted": { name: "Kiệt sức", cat: "negative", kind: "exhausted", p: [], mods: {"melee": 0.5, "ranged": 0.5}, immune: [] },
  "feedback": { name: "Phản đòn", cat: "positive", kind: "feedback", p: ["8", "ranged:reach"], mods: {}, immune: [] },
  "festering": { name: "Mưng mủ", cat: "negative", kind: "festering", p: [], mods: {}, immune: [] },
  "flinching": { name: "Chùn tay", cat: "negative", kind: "flinching", p: ["0.5"], mods: {}, immune: [] },
  "focused": { name: "Tập trung", cat: "positive", kind: "statchange", p: [], mods: {"dodge": 1.5}, immune: [] },
  "grabbed": { name: "Bị ghì", cat: "negative", kind: "grabbed", p: ["2", "ranged:reach"], mods: {}, immune: [] },
  "hardshell": { name: "Vỏ cứng", cat: "positive", kind: "statchange", p: [], mods: {"armour": 1.5}, immune: [] },
  "harpooned": { name: "Dính lao", cat: "negative", kind: "harpooned", p: ["8"], mods: {}, immune: [] },
  "lifegift": { name: "Ban sinh lực", cat: "negative", kind: "lifegift", p: ["16"], mods: {}, immune: [] },
  "lifeleech": { name: "Hút máu", cat: "negative", kind: "lifeleech", p: ["16"], mods: {}, immune: [] },
  "lockdown": { name: "Bị khoá", cat: "negative", kind: "lockdown", p: [], mods: {}, immune: [] },
  "noddingoff": { name: "Ngủ gật", cat: "negative", kind: "noddingoff", p: ["0.5"], mods: {}, immune: [] },
  "poison": { name: "Trúng độc", cat: "negative", kind: "poisoned", p: ["8", "weakest"], mods: {}, immune: ["venom"], keep: true, tmod: {"venom": 0.0} },
  "prickly": { name: "Gai góc", cat: "positive", kind: "prickly", p: ["8", "touch:melee"], mods: {}, immune: [] },
  "recover": { name: "Hồi phục", cat: "positive", kind: "recover", p: ["16"], mods: {}, immune: [] },
  "retaliate": { name: "Đáp trả", cat: "positive", kind: "retaliate", p: [], mods: {}, immune: [] },
  "revenge": { name: "Báo thù", cat: "positive", kind: "revenge", p: [], mods: {}, immune: [] },
  "slow": { name: "Chậm chạp", cat: "negative", kind: "statchange", p: [], mods: {"speed": 0.5}, immune: [] },
  "sniping": { name: "Nhắm bắn", cat: "positive", kind: "statchange", p: [], mods: {"melee": 0.5, "ranged": 2}, immune: [] },
  "softened": { name: "Mềm nhũn", cat: "negative", kind: "statchange", p: [], mods: {"armour": 0.5, "speed": 0.5}, immune: [] },
  "spiky": { name: "Đầy gai", cat: "negative", kind: "spiky", p: ["8"], mods: {}, immune: [] },
  "stuck": { name: "Kẹt cứng", cat: "negative", kind: "stuck", p: ["2", "melee:touch"], mods: {}, immune: [] },
  "wasting": { name: "Suy kiệt", cat: "negative", kind: "wasting", p: ["16"], mods: {}, immune: [] },
  "wild": { name: "Hoang dại", cat: "negative", kind: "wild", p: ["0.25", "8"], mods: {}, immune: [] },
};

export const statusName = (id) => (STATUSES[id] && STATUSES[id].name) || id;
