-- PokeWorld | 20_model/23_status.lua | Trạng thái Burn/Poison/Sleep/Paralyze/Freeze + volatile
local PW = _G.PW or {}; _G.PW = PW

local status = {}
PW.status = status

-- Danh sách trạng thái chính (mon.status = id hoặc nil)
-- brn=bỏng, psn=độc, slp=ngủ, par=tê liệt, frz=đóng băng
status.NAMES = {
  brn = "status.brn", psn = "status.psn", slp = "status.slp",
  par = "status.par", frz = "status.frz",
}

-- Áp trạng thái. Trả về true nếu áp thành công (đang có status khác thì thất bại).
-- rng tùy chọn (cho slp random số lượt).
function status.apply(mon, id, rng)
  if mon.status then return false end
  if not status.NAMES[id] then return false end
  local spec = PW.species[mon.sp]
  -- Miễn nhiễm theo hệ
  for _, t in ipairs(spec.types) do
    if id == "brn" and t == "fire" then return false end
    if id == "psn" and (t == "poison" or t == "steel") then return false end
    if id == "par" and t == "electric" then return false end
    if id == "frz" and t == "ice" then return false end
  end
  mon.status = id
  if id == "slp" then
    rng = rng or PW.rng.main
    mon.status_turns = rng:int(1, 3) -- ngủ 1-3 lượt
  end
  return true
end

function status.cure(mon)
  mon.status = nil
  mon.status_turns = nil
end

-- Kiểm tra có được hành động lượt này không. Trả về ok, reason_key.
function status.can_act(mon, rng)
  rng = rng or PW.rng.main
  if mon.status == "slp" then
    mon.status_turns = (mon.status_turns or 1) - 1
    if mon.status_turns <= 0 then
      status.cure(mon)
      return true, "status.woke_up"
    end
    return false, "status.sleeping"
  end
  if mon.status == "frz" then
    if rng:roll(0.2) then -- 20% tự tan băng mỗi lượt
      status.cure(mon)
      return true, "status.thawed"
    end
    return false, "status.frozen"
  end
  if mon.status == "par" then
    if rng:roll(0.25) then -- 25% tê liệt không đánh được
      return false, "status.para_full"
    end
  end
  return true, nil
end

-- Damage cuối lượt do trạng thái. Trả về { dmg, msg_key }.
function status.end_of_turn(mon)
  local max = PW.pokemon.max_hp(mon)
  if mon.status == "brn" then
    local d = math.max(1, math.floor(max / 16))
    mon.hp_cur = math.max(0, mon.hp_cur - d)
    return { dmg = d, msg_key = "status.brn_dmg" }
  elseif mon.status == "psn" then
    local d = math.max(1, math.floor(max / 8))
    mon.hp_cur = math.max(0, mon.hp_cur - d)
    return { dmg = d, msg_key = "status.psn_dmg" }
  end
  return { dmg = 0 }
end

-- Modifier speed do paralyze (dùng khi xếp thứ tự lượt)
function status.speed_mult(mon)
  if mon.status == "par" then return 0.5 end
  return 1
end

-- Modifier tỉ lệ bắt theo status (dùng trong 25_catch)
function status.catch_bonus(mon)
  if mon.status == "slp" or mon.status == "frz" then return 2.5 end
  if mon.status then return 1.5 end
  return 1
end
