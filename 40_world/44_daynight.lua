-- PokeWorld | 40_world/44_daynight.lua | Chu kỳ ngày/đêm và thời tiết
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["daynight.to_day"]   = "Trời sáng rồi!",
  ["daynight.to_night"] = "Màn đêm buông xuống...",
}

PW.daynight = PW.daynight or {}
local D = PW.daynight

-- ============ Adapter CREATA ============
local api = {}

-- CREATA-API: World.getHours() -> giờ trong ngày game (0-23)
function api.get_hours()
  if _G.World and World.getHours then
    local ok, h = pcall(World.getHours)
    if ok and type(h) == "number" then return h end
  end
  return nil
end

-- CREATA-API: World.getWeather() -> "clear"|"rain"|...
function api.get_weather()
  if _G.World and World.getWeather then
    local ok, w = pcall(World.getWeather)
    if ok and type(w) == "string" then return w end
  end
  return nil
end

-- CREATA-API: Chat.broadcast(text)
function api.broadcast(text)
  if _G.Chat and Chat.broadcast then pcall(Chat.broadcast, text) end
end

-- Fallback: 20 phút thực = 1 ngày game (1200 giây), nửa đầu là ngày
local CYCLE_SECONDS = 20 * 60

-- Pha hiện tại: "day" | "night"
function D.phase()
  local h = api.get_hours()
  if h then
    -- 6h-18h là ngày (theo giờ game engine)
    if h >= 6 and h < 18 then return "day" end
    return "night"
  end
  -- Chưa map API: dùng đồng hồ thực
  local t = os.time() % CYCLE_SECONDS
  if t < CYCLE_SECONDS / 2 then return "day" end
  return "night"
end

-- Thời tiết hiện tại: "clear" | "rain" (stub, mặc định clear)
function D.weather()
  local w = api.get_weather()
  if w == "rain" then return "rain" end
  return "clear"
end

-- Theo dõi chuyển pha: mỗi giây so pha, đổi thì phát hooks "day_phase"
local last_phase = nil
PW.hooks.on("tick_second", function()
  local p = D.phase()
  if p ~= last_phase then
    local first = (last_phase == nil)
    last_phase = p
    if not first then
      api.broadcast(PW.T(p == "day" and "daynight.to_day" or "daynight.to_night"))
      if PW.hooks.emit then
        PW.hooks.emit("day_phase", p)
      end
      PW.log.info("daynight: chuyen pha -> %s", p)
    end
  end
end)

-- Thông báo cho module khác khi engine tự phát event day_phase
PW.hooks.on("day_phase", function(phase)
  last_phase = phase
end)
