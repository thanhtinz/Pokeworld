-- PokeWorld | 40_world/41_wild_ai.lua | Hành vi wild: lang thang quanh điểm spawn, chạm vào thì vào battle
local PW = _G.PW or {}; _G.PW = PW

PW.wild_ai = PW.wild_ai or {}
local A = PW.wild_ai

-- ============ Adapter CREATA ============
local api = {}

-- CREATA-API: PW.creata.move_to(objid, pos, speed)
function api.move_actor(actor_id, pos)
  PW.creata.move_to(actor_id, pos)
end

A.WANDER_RADIUS = 5      -- bán kính lang thang quanh điểm spawn
A.WANDER_CHANCE = 0.35   -- xác suất đi mỗi giây (không đi liên tục cho tự nhiên)

-- Mỗi giây: mỗi wild có xác suất bước sang ô ngẫu nhiên quanh origin
PW.hooks.on("tick_second", function()
  local S = PW.spawner
  if not (S and S.by_actor) then return end
  local rng = PW.rng.main
  for actor_id, rec in pairs(S.by_actor) do
    if rng:roll(A.WANDER_CHANCE) then
      local o = rec.origin or { x = 0, y = 0, z = 0 }
      local r = A.WANDER_RADIUS
      local pos = {
        x = o.x + rng:int(-r, r),
        y = o.y + rng:int(-r, r),
        z = o.z or 0,
      }
      api.move_actor(actor_id, pos)
    end
  end
end)

-- Người chơi chạm vào wild actor -> vào trận wild
PW.hooks.on("touch_actor", function(uid, actor_id)
  local S = PW.spawner
  if not (S and S.get and S.get(actor_id)) then return end
  if PW.wild_battle and PW.wild_battle.start then
    PW.wild_battle.start(uid, actor_id)
  end
end)
