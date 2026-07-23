-- PokeWorld | 20_model/25_catch.lua | Công thức tỷ lệ bắt: ball modifier, status, critical catch
local PW = _G.PW or {}; _G.PW = PW

local catch = {}
PW.catch = catch

-- Thử bắt mon bằng ball_id. ctx = { rng= }
-- Công thức Gen 3/4 rút gọn:
--   a = (3*maxHP - 2*curHP) * rate * ball / (3*maxHP) * status_bonus
--   bắt chắc nếu a >= 255, ngược lại 4 lần lắc xác suất b = (a/255)^0.25
-- Trả về { caught, shakes (0..3), crit }
function catch.attempt(mon, ball_id, ctx)
  ctx = ctx or {}
  local rng = ctx.rng or PW.rng.main
  local spec = PW.species[mon.sp]
  local item = PW.items and PW.items[ball_id]
  local ball_mult = (item and item.ball_mult) or 1.0

  local max_hp = PW.pokemon.max_hp(mon)
  local cur_hp = math.max(1, mon.hp_cur or max_hp)
  local rate = spec.catch_rate or 45
  local status_bonus = PW.status.catch_bonus(mon)

  local a = (3 * max_hp - 2 * cur_hp) * rate * ball_mult / (3 * max_hp) * status_bonus
  a = math.min(255, a)

  -- Critical catch: tỉ lệ nhỏ, chỉ 1 lần lắc
  local crit = rng:roll(math.min(0.15, a / 255 / 6))

  if a >= 255 then
    return { caught = true, shakes = 3, crit = crit }
  end

  local b = (a / 255) ^ 0.25
  local checks = crit and 1 or 4
  local shakes = 0
  for _ = 1, checks do
    if rng:roll(b) then shakes = shakes + 1 else break end
  end
  local caught = (shakes == checks)
  if not crit and caught then shakes = 3 end
  return { caught = caught, shakes = math.min(shakes, 3), crit = crit }
end
