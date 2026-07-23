-- PokeWorld | 50_battle/51_wild_battle.lua | Trận đấu với Pokémon hoang dã
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["battle.start_wild"]   = "Một %s hoang dã xuất hiện!",
  ["battle.no_alive"]     = "Cả đội đã gục ngã! Hãy hồi phục trước đã.",
  ["battle.no_party"]     = "Bạn chưa có Pokémon nào! Hãy gặp Giáo sư ở thị trấn.",
  ["battle.wild_lose"]    = "Bạn đã gục ngã và được đưa về thị trấn... Mất %d tiền.",
  ["battle.caught_party"] = "%s đã vào đội của bạn!",
  ["battle.caught_box"]   = "%s đã được chuyển vào Box!",
}

PW.wild_battle = PW.wild_battle or {}
local W = PW.wild_battle

-- ============ Adapter CREATA ============
local api = {}

-- CREATA-API: PW.creata.send(uid, text)
function api.send_message(uid, text)
  PW.creata.send(uid, text)
end

-- CREATA-API: PW.creata.teleport(uid, pos)
function api.teleport(uid, pos)
  PW.creata.teleport(uid, pos)
end

local LOSE_MONEY = 100  -- tiền mất khi thua trận wild

-- Xử lý kết quả trận wild
local function on_finish(uid, wild_mon, result)
  local player = PW.store.get(uid)
  if not player then return end

  -- Tìm event catch trong danh sách events
  local caught = false
  for i = 1, #(result.events or {}) do
    local ev = result.events[i]
    if ev.t == "catch" and ev.caught then caught = true break end
  end

  if caught then
    local dest = PW.party.add(player, wild_mon)
    local nm = PW.pokemon.name(wild_mon)
    if dest == "party" then
      api.send_message(uid, PW.T("battle.caught_party", nm))
    elseif dest == "box" then
      api.send_message(uid, PW.T("battle.caught_box", nm))
    end
    -- Đánh dấu Pokédex + báo quest
    if PW.dex and PW.dex.mark_caught then
      PW.dex.mark_caught(player, wild_mon.species)
    end
    if PW.quest_engine then
      PW.quest_engine.emit(uid, "catch_any", { species = wild_mon.species })
      PW.quest_engine.emit(uid, "catch_species", { species = wild_mon.species })
    end
  elseif result.won then
    if PW.quest_engine then
      PW.quest_engine.emit(uid, "win_battles", { kind = "wild" })
    end
  elseif not result.aborted and not PW.party.first_alive(player) then
    -- Thua: về town_1, hồi phục, trừ tiền
    local loss = math.min(player.money or 0, LOSE_MONEY)
    player.money = (player.money or 0) - loss
    PW.party.heal_all(player)
    local d = PW.zones and PW.zones.defs and PW.zones.defs.town_1
    if d then
      api.teleport(uid, { x = (d.x1 + d.x2) / 2, y = (d.y1 + d.y2) / 2, z = 0 })
    end
    api.send_message(uid, PW.T("battle.wild_lose", loss))
  end
  -- battle_ctrl.finish sẽ save sau callback này
end

-- Bắt đầu trận wild khi chạm actor
function W.start(uid, actor_id)
  if PW.battle_ctrl.get(uid) then return false end  -- đang trong trận khác
  local player = PW.store.get(uid)
  if not player then return false end
  if not player.party or #player.party == 0 then
    api.send_message(uid, PW.T("battle.no_party"))
    return false
  end
  if not PW.party.first_alive(player) then
    api.send_message(uid, PW.T("battle.no_alive"))
    return false
  end

  local wild_mon = PW.spawner.take(actor_id)
  if not wild_mon then return false end

  local b = PW.battle.new{
    kind = "wild",
    sides = {
      { mons = player.party, id = uid, kind = "player" },
      { mons = { wild_mon }, kind = "wild" },
    },
  }

  api.send_message(uid, PW.T("battle.start_wild", PW.pokemon.name(wild_mon)))
  return PW.battle_ctrl.begin(uid, b, {
    kind = "wild",
    actor_id = actor_id,
    side_idx = 1,
    on_finish = function(result) on_finish(uid, wild_mon, result) end,
  })
end
