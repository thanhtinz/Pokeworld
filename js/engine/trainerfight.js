// PokeWorld H5 | engine/trainerfight.js | Nhân vật đánh cùng Pokémon (kiểu Palworld)
//
// Ý tưởng: huấn luyện viên đứng cạnh Pokémon của mình chứ không đứng ngoài xem.
// Mỗi lượt nhân vật tự "yểm trợ" một đòn nhỏ vào Pokémon đối phương, đồng thời
// tích năng lượng. Đủ năng lượng thì người chơi bấm dùng kỹ năng để hồi máu,
// giải trạng thái, tăng chỉ số hoặc tung một đòn hợp kích mạnh.
//
// Đòn yểm trợ cố tình nhỏ (vài % thanh máu) để không phá cân bằng trận đấu —
// nó làm nhân vật có mặt trong trận, không phải thay Pokémon đánh.
import { rng, clamp } from '../util.js';
import { maxHp, isFainted, displayName } from './pokemon.js';
import { trainerLevel, totalStats } from './equipment.js';

export const ENERGY_MAX = 100;
export const ENERGY_START = 40;
export const ENERGY_PER_TURN = 22;

// Kỹ năng mở khoá dần theo cấp huấn luyện viên
export const TRAINER_SKILLS = [
  { id: 'aid',    name: 'Tiếp Sức',      reqLevel: 1,  cost: 40,
    desc: 'Hồi 25% máu tối đa cho Pokémon đang ra trận.' },
  { id: 'strike', name: 'Đòn Hợp Kích',  reqLevel: 4,  cost: 60,
    desc: 'Nhân vật lao vào đánh cùng, sát thương gấp 3 đòn yểm trợ.' },
  { id: 'cure',   name: 'Sơ Cứu',        reqLevel: 7,  cost: 35,
    desc: 'Gỡ mọi trạng thái xấu của Pokémon đang ra trận.' },
  { id: 'rally',  name: 'Cổ Vũ',         reqLevel: 10, cost: 50,
    desc: 'Tăng 1 bậc Tấn công cho Pokémon đang ra trận.' },
  { id: 'guard',  name: 'Che Chắn',      reqLevel: 14, cost: 50,
    desc: 'Tăng 1 bậc Phòng thủ cho Pokémon đang ra trận.' },
];

export const skillById = (id) => TRAINER_SKILLS.find(s => s.id === id) || null;

// Hồ sơ chiến đấu của nhân vật người chơi: lấy cấp + % trang bị đang mặc
export function playerFighter(name, avatar) {
  const lv = trainerLevel();
  const st = totalStats();
  return {
    name,
    avatar,
    lv,
    atkPct: st.atkBonus || 0,
    defPct: st.defBonus || 0,
    energy: ENERGY_START,
    skills: TRAINER_SKILLS.filter(s => lv >= s.reqLevel).map(s => s.id),
  };
}

// Hồ sơ cho huấn luyện viên đối thủ (NPC): không có trang bị, chỉ theo cấp đội hình
export function npcFighter(name, avatar, level) {
  return {
    name,
    avatar,
    lv: Math.max(1, level | 0),
    atkPct: 0,
    defPct: 0,
    energy: ENERGY_START,
    skills: [],
  };
}

// Sát thương một đòn yểm trợ: bám theo máu tối đa của mục tiêu nên không bao giờ
// một phát chết, mà cũng không thành vô nghĩa khi Pokémon lên cấp cao.
export function assistDamage(fighter, target) {
  if (!fighter || !target) return 0;
  const mx = maxHp(target);
  const base = mx * (0.03 + Math.min(0.04, fighter.lv * 0.0015)); // 3% -> 7% theo cấp
  const gear = 1 + (fighter.atkPct || 0) / 200;                   // trang bị góp một nửa số %
  const jitter = 0.85 + rng.float() * 0.3;
  return Math.max(1, Math.floor(base * gear * jitter));
}

// Giảm sát thương Pokémon mình phải chịu nhờ chỉ số phòng thủ của nhân vật
export function damageTakenMult(fighter) {
  if (!fighter) return 1;
  return clamp(1 - (fighter.defPct || 0) / 300, 0.7, 1);
}

export function addEnergy(fighter, n = ENERGY_PER_TURN) {
  if (!fighter) return;
  fighter.energy = clamp(fighter.energy + n, 0, ENERGY_MAX);
}

export function canUse(fighter, skillId) {
  const sk = skillById(skillId);
  if (!fighter || !sk) return [false, 'Kỹ năng không tồn tại.'];
  if (!fighter.skills.includes(skillId)) return [false, `Cần Trainer Lv.${sk.reqLevel}.`];
  if (fighter.energy < sk.cost) return [false, `Cần ${sk.cost} năng lượng.`];
  return [true, null];
}

// Áp dụng kỹ năng. Trả về mảng event giống engine/battle.js để UI phát chung một chỗ.
// stages = object bậc chỉ số của phe mình (battle giữ), foe = Pokémon đối phương.
export function applySkill(fighter, skillId, { mon, foe, stages }) {
  const [ok, err] = canUse(fighter, skillId);
  if (!ok) return { ok: false, error: err, events: [] };
  if (!mon || isFainted(mon)) return { ok: false, error: 'Pokémon đang ra trận không thể nhận hỗ trợ.', events: [] };

  const sk = skillById(skillId);
  const ev = [{ t: 'msg', text: `${fighter.name} dùng ${sk.name}!` }];

  if (skillId === 'aid') {
    const mx = maxHp(mon);
    const before = mon.hpCur;
    mon.hpCur = Math.min(mx, mon.hpCur + Math.floor(mx * 0.25));
    ev.push({ t: 'heal', side: 0, amount: mon.hpCur - before });
    ev.push({ t: 'msg', text: `${displayName(mon)} hồi ${mon.hpCur - before} máu!` });
  } else if (skillId === 'strike') {
    if (!foe || isFainted(foe)) return { ok: false, error: 'Không có mục tiêu.', events: [] };
    const dmg = assistDamage(fighter, foe) * 3;
    foe.hpCur = Math.max(0, foe.hpCur - dmg);
    ev.push({ t: 'assist', side: 0, dmg });
    ev.push({ t: 'msg', text: `${fighter.name} và ${displayName(mon)} hợp kích, gây ${dmg} sát thương!` });
  } else if (skillId === 'cure') {
    if (!mon.status) return { ok: false, error: `${displayName(mon)} không dính trạng thái nào.`, events: [] };
    mon.status = null;
    mon.statusTurns = 0;
    ev.push({ t: 'msg', text: `${displayName(mon)} đã khỏe lại!` });
  } else if (skillId === 'rally' || skillId === 'guard') {
    const key = skillId === 'rally' ? 'atk' : 'def';
    const label = skillId === 'rally' ? 'Tấn công' : 'Phòng thủ';
    const old = stages[key] || 0;
    if (old >= 6) return { ok: false, error: `${label} đã ở mức tối đa.`, events: [] };
    stages[key] = clamp(old + 1, -6, 6);
    ev.push({ t: 'msg', text: `${label} của ${displayName(mon)} tăng lên!` });
  }

  fighter.energy -= sk.cost;
  return { ok: true, error: null, events: ev };
}
