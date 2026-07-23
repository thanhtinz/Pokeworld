-- PokeWorld | 40_world/42_follower.lua | Pokémon đi theo sau người chơi
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["follower.on"]        = "%s đang đi theo bạn!",
  ["follower.off"]       = "Pokémon đã quay về bóng.",
  ["follower.bad_slot"]  = "Ô đội hình không hợp lệ. Dùng: .follow <1-6|off>",
  ["follower.help"]      = "Cho Pokémon trong đội đi theo bạn: .follow <slot|off>",
}

PW.follower = PW.follower or {}
local F = PW.follower

-- ============ Adapter CREATA ============
local api = {}

-- CREATA-API: PW.creata.player_pos(uid) -> {x,y,z}|nil
function api.get_player_pos(uid)
  return PW.creata.player_pos(uid)
end

-- CREATA-API: PW.creata.spawn_creature(actor_type_id, pos) -> objid|nil
function api.spawn_actor(model_id, pos)
  return PW.creata.spawn_creature(model_id, pos)
end

-- CREATA-API: PW.creata.despawn(objid)
function api.despawn_actor(actor_id)
  PW.creata.despawn(actor_id)
end

-- CREATA-API: PW.creata.move_to(objid, pos, speed)
function api.move_actor(actor_id, pos)
  PW.creata.move_to(actor_id, pos)
end

-- CREATA-API: PW.creata.send(uid, text)
function api.send_message(uid, text)
  PW.creata.send(uid, text)
end

F.actors = F.actors or {}  -- uid -> {actor_id=, slot=}

-- Đặt follower: slot 1..6 hoặc nil để tắt
function F.set(uid, slot)
  local player = PW.store.get(uid)
  if not player then return end
  player.settings = player.settings or {}

  -- Gỡ actor cũ nếu có
  local cur = F.actors[uid]
  if cur and cur.actor_id then api.despawn_actor(cur.actor_id) end
  F.actors[uid] = nil

  if not slot then
    player.settings.follow_slot = nil
    api.send_message(uid, PW.T("follower.off"))
    PW.store.save(uid)
    return true
  end

  local mon = player.party and player.party[slot]
  if not mon then
    api.send_message(uid, PW.T("follower.bad_slot"))
    return false
  end

  player.settings.follow_slot = slot
  local pos = api.get_player_pos(uid) or { x = 0, y = 0, z = 0 }
  local model_id = (PW.species[mon.species] and PW.species[mon.species].model_id) or mon.species
  local actor_id = api.spawn_actor(model_id, pos)
  F.actors[uid] = { actor_id = actor_id, slot = slot }
  api.send_message(uid, PW.T("follower.on", PW.pokemon.name(mon)))
  PW.store.save(uid)
  return true
end

-- Mỗi giây: kéo follower về phía sau người chơi
PW.hooks.on("tick_second", function()
  for uid, rec in pairs(F.actors) do
    if rec.actor_id then
      local pos = api.get_player_pos(uid)
      if pos then
        -- Đứng lệch 1 ô phía sau (đơn giản hóa, chưa tính hướng nhìn)
        api.move_actor(rec.actor_id, { x = pos.x - 1, y = pos.y, z = pos.z })
      end
    end
  end
end)

-- Người chơi rời room: dọn actor
PW.hooks.on("leave", function(uid)
  local rec = F.actors[uid]
  if rec and rec.actor_id then api.despawn_actor(rec.actor_id) end
  F.actors[uid] = nil
end)

-- Người chơi vào room: khôi phục lựa chọn đã lưu
PW.hooks.on("join", function(uid)
  local player = PW.store.get(uid)
  if player and player.settings and player.settings.follow_slot then
    F.set(uid, player.settings.follow_slot)
  end
end)

-- Lệnh .follow <slot|off>
PW.commands.register{
  name = "follow",
  aliases = {},
  gm = false,
  help = "follower.help",
  fn = function(ctx, args)
    local a = args[1]
    if a == "off" or a == nil then
      F.set(ctx.uid, nil)
      return
    end
    local slot = tonumber(a)
    if not slot or slot < 1 or slot > ((PW.config and PW.config.PARTY_MAX) or 6) then
      api.send_message(ctx.uid, PW.T("follower.bad_slot"))
      return
    end
    F.set(ctx.uid, slot)
  end,
}
