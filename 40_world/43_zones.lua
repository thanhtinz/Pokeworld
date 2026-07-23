-- PokeWorld | 40_world/43_zones.lua | Định nghĩa vùng bản đồ và theo dõi người chơi theo zone
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["zone.route_1"] = "Đường số 1",
  ["zone.route_2"] = "Đường số 2",
  ["zone.forest_1"] = "Rừng Xanh",
  ["zone.cave_1"] = "Hang Đá",
  ["zone.lake_1"] = "Hồ Trong",
  ["zone.town_1"] = "Thị Trấn Khởi Đầu",
  ["zone.enter"] = "Bạn đã đến %s.",
}

PW.zones = PW.zones or {}
local Z = PW.zones

-- ============ Adapter CREATA ============
local api = {}

-- CREATA-API: Player.getAll() -> mảng uid / Room.getPlayers()
function api.get_players()
  if _G.Player and Player.getAll then
    local ok, list = pcall(Player.getAll)
    if ok and type(list) == "table" then return list end
  end
  return {}
end

-- CREATA-API: Player.getPosition(uid) -> x, y, z
function api.get_player_pos(uid)
  if _G.Player and Player.getPosition then
    local ok, x, y, z = pcall(Player.getPosition, uid)
    if ok and x then return { x = x, y = y, z = z or 0 } end
  end
  return nil
end

-- CREATA-API: Chat.sendTo(uid, text)
function api.send_message(uid, text)
  if _G.Chat and Chat.sendTo then pcall(Chat.sendTo, uid, text) end
end

-- Bounding box các zone — TỌA ĐỘ PLACEHOLDER, cần chỉnh lại theo map thật!
Z.defs = {
  town_1   = { x1 = 0,    y1 = 0,    x2 = 100,  y2 = 100,  name_key = "zone.town_1",   kind = "town" },
  route_1  = { x1 = 100,  y1 = 0,    x2 = 250,  y2 = 100,  name_key = "zone.route_1",  kind = "route" },
  route_2  = { x1 = 250,  y1 = 0,    x2 = 400,  y2 = 100,  name_key = "zone.route_2",  kind = "route" },
  forest_1 = { x1 = 100,  y1 = 100,  x2 = 250,  y2 = 250,  name_key = "zone.forest_1", kind = "forest" },
  cave_1   = { x1 = 250,  y1 = 100,  x2 = 400,  y2 = 250,  name_key = "zone.cave_1",   kind = "cave" },
  lake_1   = { x1 = 0,    y1 = 100,  x2 = 100,  y2 = 250,  name_key = "zone.lake_1",   kind = "lake" },
}

-- Zone tại 1 vị trí (nil nếu ngoài mọi zone)
function Z.at(pos)
  if not pos then return nil end
  for id, d in pairs(Z.defs) do
    if pos.x >= d.x1 and pos.x <= d.x2 and pos.y >= d.y1 and pos.y <= d.y2 then
      return id
    end
  end
  return nil
end

-- Cache: zone -> mảng uid; uid -> zone hiện tại
local cache = {}          -- zone -> {uid, ...}
Z.player_zone = Z.player_zone or {} -- uid -> zone

function Z.players_in(zone)
  return cache[zone] or {}
end

-- Cập nhật mỗi giây: quét vị trí người chơi, phát hiện đổi zone
PW.hooks.on("tick_second", function()
  local new_cache = {}
  local players = api.get_players()
  for i = 1, #players do
    local uid = players[i]
    local pos = api.get_player_pos(uid)
    local zone = pos and Z.at(pos) or nil
    if zone then
      new_cache[zone] = new_cache[zone] or {}
      local list = new_cache[zone]
      list[#list + 1] = uid
    end
    local prev = Z.player_zone[uid]
    if zone ~= prev then
      Z.player_zone[uid] = zone
      if zone then
        -- Thông báo tên vùng + báo tiến độ quest
        local d = Z.defs[zone]
        api.send_message(uid, PW.T("zone.enter", PW.T(d.name_key)))
        if PW.quest_engine then
          PW.quest_engine.emit(uid, "reach_zone", { zone = zone })
        end
        -- Phát event tùy ý nếu hooks hỗ trợ emit
        if PW.hooks.emit then
          PW.hooks.emit("player_move_zone", uid, prev, zone)
        end
      end
    end
  end
  cache = new_cache
end)

-- Dọn cache khi người chơi rời room
PW.hooks.on("leave", function(uid)
  Z.player_zone[uid] = nil
end)
