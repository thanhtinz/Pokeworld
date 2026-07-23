-- PokeWorld | 20_model/21_exp.lua | Đường cong EXP, lên level, chia EXP
local PW = _G.PW or {}; _G.PW = PW

local exp = {}
PW.exp = exp

-- Tổng EXP cần để đạt level lv theo từng đường cong (chuẩn Gen)
local curves = {
  fast        = function(lv) return math.floor(4 * lv ^ 3 / 5) end,
  medium_fast = function(lv) return lv ^ 3 end,
  medium_slow = function(lv)
    return math.floor(6 * lv ^ 3 / 5 - 15 * lv ^ 2 + 100 * lv - 140)
  end,
  slow        = function(lv) return math.floor(5 * lv ^ 3 / 4) end,
}

function exp.for_level(curve, lv)
  if lv <= 1 then return 0 end
  local fn = curves[curve] or curves.medium_fast
  return math.max(0, fn(lv))
end

-- EXP đối thủ cho khi bị hạ (công thức rút gọn Gen 1): base_exp * lv / 7 / số người tham chiến
function exp.yield(defeated_mon, n_participants)
  local spec = PW.species[defeated_mon.sp]
  local base = (spec and spec.base_exp) or 60
  local n = math.max(1, n_participants or 1)
  local amount = math.floor(base * defeated_mon.lv / 7 / n)
  local mult = (PW.events and PW.events.mult and PW.events.mult("exp")) or 1
  return math.max(1, math.floor(amount * mult))
end

-- Cộng EXP, xử lý lên nhiều level. Trả về mảng các level mới đạt (rỗng nếu không lên).
function exp.gain(mon, amount)
  local spec = PW.species[mon.sp]
  if not spec then return {} end
  -- Lucky Egg
  if mon.held == "lucky_egg" then amount = math.floor(amount * 1.5) end
  local cfg = PW.config
  local new_levels = {}
  if mon.lv >= cfg.MAX_LEVEL then return new_levels end
  mon.exp = (mon.exp or 0) + amount
  while mon.lv < cfg.MAX_LEVEL and mon.exp >= exp.for_level(spec.exp_curve, mon.lv + 1) do
    local old_max = PW.pokemon.max_hp(mon)
    mon.lv = mon.lv + 1
    -- Lên level: HP hiện tại tăng theo phần chênh max HP
    local new_max = PW.pokemon.max_hp(mon)
    mon.hp_cur = math.min(new_max, (mon.hp_cur or 0) + (new_max - old_max))
    new_levels[#new_levels + 1] = mon.lv
    PW.pokemon.add_friendship(mon, 2)
  end
  if mon.lv >= cfg.MAX_LEVEL then
    mon.exp = exp.for_level(spec.exp_curve, cfg.MAX_LEVEL)
  end
  return new_levels
end

-- Chiêu mới có thể học tại level này
function exp.moves_at_level(species_id, lv)
  local ls = (PW.learnsets or {})[species_id]
  local out = {}
  if ls then
    for l, mv in pairs(ls) do
      if l == lv then out[#out + 1] = mv end
    end
  end
  return out
end

-- Tiến độ EXP tới level kế: trả về cur, need (cho UI vẽ thanh exp)
function exp.progress(mon)
  local spec = PW.species[mon.sp]
  if not spec or mon.lv >= PW.config.MAX_LEVEL then return 0, 1 end
  local lo = exp.for_level(spec.exp_curve, mon.lv)
  local hi = exp.for_level(spec.exp_curve, mon.lv + 1)
  return (mon.exp or lo) - lo, hi - lo
end
