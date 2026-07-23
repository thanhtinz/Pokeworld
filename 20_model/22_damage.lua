-- PokeWorld | 20_model/22_damage.lua | Công thức damage Gen-style: STAB, crit, khắc hệ
local PW = _G.PW or {}; _G.PW = PW

local damage = {}
PW.damage = damage

-- Tính damage 1 đòn. ctx (tùy chọn) = { rng=, att_stages=, def_stages=, weather= }
-- Trả về: { dmg, crit, eff (multiplier khắc hệ), missed }
function damage.calc(att, def, move_id, ctx)
  ctx = ctx or {}
  local rng = ctx.rng or PW.rng.main
  local move = PW.moves[move_id]
  if not move then return { dmg = 0, crit = false, eff = 1, missed = true } end

  -- Chiêu status không gây damage
  if move.category == "status" or not move.power or move.power <= 0 then
    return { dmg = 0, crit = false, eff = 1, missed = false }
  end

  -- Trượt?
  local acc = move.acc
  if acc and acc < 100 and not rng:roll(acc / 100) then
    return { dmg = 0, crit = false, eff = 1, missed = true }
  end

  local att_stats = PW.pokemon.stats(att)
  local def_stats = PW.pokemon.stats(def)

  local a, d
  if move.category == "physical" then
    a, d = att_stats.atk, def_stats.def
    -- Burn giảm nửa Atk vật lý
    if att.status == "brn" then a = math.floor(a / 2) end
  else
    a, d = att_stats.spa, def_stats.spd
  end
  -- Áp stage buff/debuff trong trận nếu có (stage -6..+6)
  local function stage_mult(s)
    s = PW.util.clamp(s or 0, -6, 6)
    if s >= 0 then return (2 + s) / 2 else return 2 / (2 - s) end
  end
  a = math.floor(a * stage_mult(ctx.att_stage))
  d = math.floor(d * stage_mult(ctx.def_stage))

  -- Crit
  local crit = rng:roll(PW.config.CRIT_CHANCE)
  if crit then a = math.floor(a * 1.5) end -- đơn giản hóa: crit nhân 1.5 vào đòn cuối

  -- Công thức gốc
  local base = math.floor(math.floor(math.floor(2 * att.lv / 5 + 2) * move.power * a / math.max(1, d)) / 50) + 2

  -- STAB
  local spec_att = PW.species[att.sp]
  local stab = 1
  for _, t in ipairs(spec_att.types) do
    if t == move.type then stab = 1.5 break end
  end

  -- Khắc hệ
  local spec_def = PW.species[def.sp]
  local eff = PW.types.eff(move.type, spec_def.types)

  -- Random 85..100%
  local roll = rng:int(85, 100) / 100

  local dmg = math.floor(base * stab * eff * roll)
  if crit then dmg = math.floor(dmg * 1.5) end
  if eff > 0 and dmg < 1 then dmg = 1 end
  if eff == 0 then dmg = 0 end

  return { dmg = dmg, crit = crit, eff = eff, missed = false }
end

-- Key thông báo hiệu quả cho UI ("battle.eff_super" / "battle.eff_notvery" / "battle.eff_immune")
function damage.eff_key(eff)
  if eff == 0 then return "battle.eff_immune" end
  if eff > 1 then return "battle.eff_super" end
  if eff < 1 then return "battle.eff_notvery" end
  return nil
end
