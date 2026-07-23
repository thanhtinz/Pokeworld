-- PokeWorld | 50_battle/52_trainer_battle.lua | Trận đấu với NPC trainer / gym
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["battle.start_trainer"]  = "Trainer %s muốn thách đấu!",
  ["battle.trainer_win"]    = "Bạn đã thắng trainer %s! Nhận %d tiền.",
  ["battle.trainer_rematch"]= "Bạn đã thắng lại %s (không có thưởng).",
  ["battle.trainer_lose"]   = "Bạn đã thua trainer %s...",
  ["battle.badge_get"]      = "Bạn nhận được huy hiệu %s!",
  ["battle.item_get"]       = "Nhận được %s x%d!",
  ["battle.trainer_unknown"]= "Không tìm thấy trainer này.",
}

PW.trainer_battle = PW.trainer_battle or {}
local T = PW.trainer_battle

-- ============ Adapter CREATA ============
local api = {}

-- CREATA-API: Chat.sendTo(uid, text)
function api.send_message(uid, text)
  if _G.Chat and Chat.sendTo then pcall(Chat.sendTo, uid, text) end
end

-- Dựng đội của trainer từ def (schema 18_trainers: party = { {sp=, lv=}, ... })
local function build_team(def)
  local mons = {}
  for i = 1, #(def.party or {}) do
    local e = def.party[i]
    mons[#mons + 1] = PW.pokemon.new(e.sp, e.lv)
  end
  return mons
end

-- Tên hiển thị của trainer
local function tname(def, trainer_id)
  return def.name_key and PW.T(def.name_key) or tostring(trainer_id)
end

-- Trao thưởng lần thắng đầu
local function give_rewards(uid, player, trainer_id, def)
  local money = def.reward_money or 0
  player.money = (player.money or 0) + money
  api.send_message(uid, PW.T("battle.trainer_win", tname(def, trainer_id), money))

  -- Item thưởng (schema 18_trainers: reward_item = {id=, n=})
  if def.reward_item then
    player.bag = player.bag or {}
    local it = def.reward_item
    player.bag[it.id] = (player.bag[it.id] or 0) + (it.n or 1)
    local item_def = PW.items and PW.items[it.id]
    api.send_message(uid, PW.T("battle.item_get", item_def and PW.T(item_def.name_key) or tostring(it.id), it.n or 1))
  end

  -- Huy hiệu gym
  if def.kind == "gym" and def.badge then
    if PW.gym and PW.gym.award then
      PW.gym.award(uid, def.badge)
    else
      player.badges = player.badges or {}
      player.badges[def.badge] = true
    end
    api.send_message(uid, PW.T("battle.badge_get", tostring(def.badge)))
  end
end

-- Xử lý kết quả trận trainer
local function on_finish(uid, trainer_id, def, result)
  local player = PW.store.get(uid)
  if not player then return end
  if result.won then
    player.defeated_trainers = player.defeated_trainers or {}
    if not player.defeated_trainers[trainer_id] then
      player.defeated_trainers[trainer_id] = true
      give_rewards(uid, player, trainer_id, def)
    else
      api.send_message(uid, PW.T("battle.trainer_rematch", tname(def, trainer_id)))
    end
    if PW.quest_engine then
      PW.quest_engine.emit(uid, "defeat_trainer", { id = trainer_id })
      PW.quest_engine.emit(uid, "win_battles", { kind = "trainer" })
    end
  elseif not result.aborted then
    api.send_message(uid, PW.T("battle.trainer_lose", tname(def, trainer_id)))
  end
end

-- Bắt đầu trận trainer
function T.start(uid, trainer_id)
  if PW.battle_ctrl.get(uid) then return false end
  local def = PW.trainers[trainer_id]
  if not def then
    api.send_message(uid, PW.T("battle.trainer_unknown"))
    return false
  end
  local player = PW.store.get(uid)
  if not player or not player.party or #player.party == 0 then return false end
  if not PW.party.first_alive(player) then return false end

  local b = PW.battle.new{
    kind = "trainer",  -- battle model tự chặn bắt/chạy; vẫn guard thêm ở battle_ctrl
    sides = {
      { mons = player.party, id = uid, kind = "player" },
      { mons = build_team(def), id = trainer_id, kind = "trainer" },
    },
  }

  api.send_message(uid, PW.T("battle.start_trainer", tname(def, trainer_id)))
  return PW.battle_ctrl.begin(uid, b, {
    kind = "trainer",
    trainer_id = trainer_id,
    side_idx = 1,
    on_finish = function(result) on_finish(uid, trainer_id, def, result) end,
  })
end

-- Cho NPC spawner gắn: chạm vào trainer NPC -> vào trận
function T.on_touch(uid, trainer_id)
  return T.start(uid, trainer_id)
end
