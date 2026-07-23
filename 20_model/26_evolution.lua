-- PokeWorld | 20_model/26_evolution.lua | Kiểm tra + thực thi tiến hóa
local PW = _G.PW or {}; _G.PW = PW

local evolution = {}
PW.evolution = evolution

-- Kiểm tra điều kiện tiến hóa của mon theo trigger.
-- trigger: "level" (sau khi lên level) | "stone" (arg = item_id) | "friendship" | "trade"
-- Trả về dex mới nếu đủ điều kiện, nil nếu không.
function evolution.check(mon, trigger, arg)
  local def = (PW.evolutions or {})[mon.sp]
  if not def then return nil end
  -- Hỗ trợ cả 1 entry lẫn mảng nhiều lựa chọn (kiểu Eevee)
  local options = def.into and { def } or def
  for _, e in ipairs(options) do
    if e.method == "level" and trigger == "level" and mon.lv >= (e.level or 999) then
      return e.into
    elseif e.method == "stone" and trigger == "stone" and arg == e.item then
      return e.into
    elseif e.method == "friendship" and (trigger == "friendship" or trigger == "level")
        and (mon.friendship or 0) >= (e.min or 220) then
      return e.into
    elseif e.method == "trade" and trigger == "trade" then
      return e.into
    end
  end
  return nil
end

-- Thực thi tiến hóa: đổi species, giữ IV/EV/nature/nick, tính lại HP theo tỉ lệ.
-- Trả về true nếu thành công.
function evolution.evolve(mon, new_dex)
  local new_spec = PW.species[new_dex]
  if not new_spec then
    PW.log.warn("evolve: species %s khong ton tai", tostring(new_dex))
    return false
  end
  local old_max = PW.pokemon.max_hp(mon)
  local hp_frac = old_max > 0 and (mon.hp_cur / old_max) or 1
  local old_sp = mon.sp
  mon.sp = new_dex
  local new_max = PW.pokemon.max_hp(mon)
  mon.hp_cur = math.max(1, math.floor(new_max * hp_frac))
  -- Ability: nếu ability cũ không thuộc loài mới thì random lại từ loài mới
  local keep = false
  for _, ab in ipairs(new_spec.abilities or {}) do
    if ab == mon.ability then keep = true break end
  end
  if not keep then
    mon.ability = PW.rng.secure:pick(new_spec.abilities or {}) or mon.ability
  end
  PW.log.info("evolve: %d -> %d (lv %d)", old_sp, new_dex, mon.lv)
  return true
end
