-- PokeWorld | 40_world/40_spawner.lua | Vòng spawn Pokémon hoang dã theo zone
local PW = _G.PW or {}; _G.PW = PW

PW.spawner = PW.spawner or {}
local S = PW.spawner

-- ============ Adapter CREATA (stub, chưa map API thật) ============
local api = {}

-- CREATA-API: World.spawnCreature(model_id, x, y, z) -> actor_id
function api.spawn_actor(model_id, pos)
  if _G.World and World.spawnCreature then
    local ok, id = pcall(World.spawnCreature, model_id, pos.x, pos.y, pos.z)
    if ok then return id end
  end
  return nil
end

-- CREATA-API: World.despawnCreature(actor_id) / Actor:remove()
function api.despawn_actor(actor_id)
  if _G.World and World.despawnCreature then
    pcall(World.despawnCreature, actor_id)
  end
end

-- ============ Trạng thái nội bộ ============
S.by_actor = S.by_actor or {}   -- actor_id -> {mon=, zone=, origin=}
S.zone_count = S.zone_count or {} -- zone -> số wild đang sống
S.rate = S.rate or {}           -- zone -> hệ số spawn (mặc định 1)
S.enabled = (S.enabled == nil) and true or S.enabled
local timer = 0

local function cap()
  return (PW.config and PW.config.SPAWN_CAP_PER_ZONE) or 6
end

local function interval()
  return (PW.config and PW.config.SPAWN_INTERVAL) or 15
end

-- Chọn vị trí spawn ngẫu nhiên trong bounding box của zone
local function random_pos(zone)
  local d = PW.zones and PW.zones.defs and PW.zones.defs[zone]
  if not d then return { x = 0, y = 0, z = 0 } end
  local rng = PW.rng.main
  return {
    x = rng:int(math.min(d.x1, d.x2), math.max(d.x1, d.x2)),
    y = rng:int(math.min(d.y1, d.y2), math.max(d.y1, d.y2)),
    z = d.z or 0,
  }
end

-- Lọc entry spawn theo pha ngày/đêm hiện tại (entry.time = "day"|"night"|nil)
local function eligible_entries(zone)
  local list = PW.spawns and PW.spawns[zone]
  if not list then return nil end
  local phase = (PW.daynight and PW.daynight.phase and PW.daynight.phase()) or "day"
  local out = {}
  for i = 1, #list do
    local e = list[i]
    if not e.time or e.time == phase then out[#out + 1] = e end
  end
  if #out == 0 then return nil end
  return out
end

-- Spawn 1 wild trong zone theo bảng spawn
local function spawn_one(zone)
  local entries = eligible_entries(zone)
  if not entries then return end
  local e = PW.util.weighted(entries)
  if not e then return end
  local lv_min, lv_max = e.min or 2, e.max or 5
  local level = PW.rng.main:int(lv_min, lv_max)
  local mon = PW.pokemon.new(e.species, level)
  local pos = random_pos(zone)
  local model_id = (PW.species[mon.species] and PW.species[mon.species].model_id) or mon.species
  local actor_id = api.spawn_actor(model_id, pos)
  if not actor_id then
    -- Chưa map API engine: dùng id giả để logic vẫn chạy được khi test
    actor_id = "wild_" .. tostring(mon.species) .. "_" .. tostring(PW.rng.main:int(1, 10 ^ 9))
  end
  S.by_actor[actor_id] = { mon = mon, zone = zone, origin = pos }
  S.zone_count[zone] = (S.zone_count[zone] or 0) + 1
  PW.log.debug("spawner: spawn %s lv%d tai %s", tostring(mon.species), level, zone)
  return actor_id
end

-- ============ API public ============

-- Bật/tắt vòng spawn
function S.set_enabled(b) S.enabled = b and true or false end

-- Đặt hệ số spawn theo zone (lệnh GM / sự kiện)
function S.set_rate(zone, mult) S.rate[zone] = mult end

-- Spawn thủ công (lệnh GM): tại vị trí pos, có thể ép shiny
function S.spawn_at(species, level, pos, shiny)
  local mon = PW.pokemon.new(species, level, { shiny = shiny })
  local zone = (PW.zones and PW.zones.at and PW.zones.at(pos)) or "town_1"
  local model_id = (PW.species[mon.species] and PW.species[mon.species].model_id) or mon.species
  local actor_id = api.spawn_actor(model_id, pos)
  if not actor_id then
    actor_id = "wild_gm_" .. tostring(PW.rng.main:int(1, 10 ^ 9))
  end
  S.by_actor[actor_id] = { mon = mon, zone = zone, origin = pos }
  S.zone_count[zone] = (S.zone_count[zone] or 0) + 1
  return actor_id
end

-- Gỡ wild khỏi thế giới và trả về mon (dùng khi bắt đầu battle)
function S.take(actor_id)
  local rec = S.by_actor[actor_id]
  if not rec then return nil end
  S.by_actor[actor_id] = nil
  S.zone_count[rec.zone] = math.max(0, (S.zone_count[rec.zone] or 1) - 1)
  api.despawn_actor(actor_id)
  return rec.mon
end

-- Tra cứu record wild (cho wild_ai)
function S.get(actor_id) return S.by_actor[actor_id] end

-- Xóa toàn bộ wild đang sống
function S.despawn_all()
  for actor_id in pairs(S.by_actor) do
    api.despawn_actor(actor_id)
  end
  S.by_actor = {}
  S.zone_count = {}
end

-- ============ Vòng tick ============
PW.hooks.on("tick_second", function()
  if not S.enabled then return end
  timer = timer + 1
  if timer < interval() then return end
  timer = 0
  if not (PW.zones and PW.zones.players_in) then return end
  for zone in pairs((PW.zones.defs or {})) do
    local players = PW.zones.players_in(zone)
    if players and #players > 0 and PW.spawns and PW.spawns[zone] then
      local n = S.zone_count[zone] or 0
      if n < cap() then
        -- Hệ số rate: rate>1 có thể spawn thêm, rate<1 có thể bỏ lượt
        local mult = S.rate[zone] or 1
        local tries = math.max(1, PW.util.round(mult))
        for _ = 1, tries do
          if (S.zone_count[zone] or 0) >= cap() then break end
          if mult >= 1 or PW.rng.main:roll(mult) then
            spawn_one(zone)
          end
        end
      end
    end
  end
end)
