-- PokeWorld | 70_systems/74_events.lua | Sự kiện mùa: bật/tắt event, hệ số nhân shiny/exp
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["events.shiny_fest"] = "Lễ hội Shiny",
  ["events.exp_weekend"] = "Cuối tuần EXP",
  ["events.on"] = "Sự kiện %s: BẬT",
  ["events.off"] = "Sự kiện %s: TẮT",
}

PW.events = PW.events or {}
local EV = PW.events

-- Định nghĩa event mùa
EV.defs = {
  shiny_fest = { name_key = "events.shiny_fest", shiny_mult = 4 },
  exp_weekend = { name_key = "events.exp_weekend", exp_mult = 2 },
}

-- Trạng thái đang bật: id -> true
EV.active = EV.active or {}

-- Bật/tắt event
function EV.set(id, on)
  if not EV.defs[id] then
    if PW.log and PW.log.warn then PW.log.warn("events.set: event lạ " .. tostring(id)) end
    return false
  end
  EV.active[id] = on and true or nil
  if PW.log and PW.log.info then
    PW.log.info("events: " .. tostring(id) .. " = " .. tostring(on and "on" or "off"))
  end
  return true
end

-- Hệ số nhân tổng của các event đang bật cho 1 loại ("shiny" | "exp")
-- Mặc định 1; tích các mult của event bật có key <kind>_mult
function EV.mult(kind)
  local key = tostring(kind) .. "_mult"
  local m = 1
  for id in pairs(EV.active) do
    local d = EV.defs[id]
    if d and d[key] then m = m * d[key] end
  end
  return m
end
