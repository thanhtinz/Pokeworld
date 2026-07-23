-- PokeWorld | 70_systems/70_quest_engine.lua | Máy nhiệm vụ: nhận, cập nhật tiến độ, trao thưởng
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["quest.started"] = "Nhiệm vụ mới: %s — %s",
  ["quest.progress"] = "Nhiệm vụ %s: %d/%d",
  ["quest.completed"] = "Hoàn thành nhiệm vụ: %s!",
  ["quest.reward_money"] = "Nhận %d₽.",
  ["quest.reward_item"] = "Nhận %s x%d.",
}

PW.quest_engine = PW.quest_engine or {}
local QE = PW.quest_engine

local function qdef(id) return PW.quests and PW.quests[id] end

local function qname(id)
  local d = qdef(id)
  return (d and (d.name or (d.name_key and PW.T(d.name_key)))) or tostring(id)
end

local function qdesc(id)
  local d = qdef(id)
  return (d and (d.desc or (d.desc_key and PW.T(d.desc_key)))) or ""
end

-- Bắt đầu 1 quest cho người chơi
function QE.start(uid, quest_id)
  local d = qdef(quest_id)
  if not d then
    if PW.log and PW.log.warn then PW.log.warn("quest_engine.start: quest không tồn tại " .. tostring(quest_id)) end
    return false
  end
  local player = PW.store.get(uid)
  player.quests = player.quests or { active = {}, done = {} }
  -- Không nhận lại quest đang làm hoặc đã xong (trừ khi daily đã reset khỏi done)
  if player.quests.active[quest_id] or player.quests.done[quest_id] then return false end
  player.quests.active[quest_id] = { progress = 0 }
  if PW.store.save then PW.store.save(uid) end
  PW.ui_common.msg(uid, string.format(PW.T("quest.started"), qname(quest_id), qdesc(quest_id)))
  return true
end

-- Kiểm tra goal có khớp event không (điều kiện phụ so với payload)
-- Goal types: catch_any, catch_species(sp), defeat_trainer(id), reach_zone(zone), catch_count(n), win_battles(n)
local function goal_matches(goal, event_t, payload)
  if not goal then return false end
  payload = payload or {}
  local gt = goal.t or goal.type
  if gt == "catch_any" then
    return event_t == "catch"
  elseif gt == "catch_species" then
    return event_t == "catch" and payload.sp == goal.sp
  elseif gt == "defeat_trainer" then
    return event_t == "defeat_trainer" and payload.id == goal.id
  elseif gt == "reach_zone" then
    return event_t == "reach_zone" and payload.zone == goal.zone
  elseif gt == "catch_count" then
    return event_t == "catch"
  elseif gt == "win_battles" then
    return event_t == "win_battle"
  end
  -- Goal lạ: khớp trực tiếp theo tên event + điều kiện phụ chung
  if gt == event_t then
    if goal.sp and payload.sp ~= goal.sp then return false end
    if goal.id and payload.id ~= goal.id then return false end
    if goal.zone and payload.zone ~= goal.zone then return false end
    return true
  end
  return false
end

-- Trao thưởng khi hoàn thành
local function grant_rewards(uid, player, d)
  local ui = PW.ui_common
  local reward = d.reward or d.rewards or {}
  if reward.money and reward.money > 0 then
    if PW.economy and PW.economy.add then
      PW.economy.add(uid, reward.money, "quest:" .. tostring(d.id or "?"))
    else
      player.money = (player.money or 0) + reward.money
    end
    ui.msg(uid, string.format(PW.T("quest.reward_money"), reward.money))
  end
  if reward.items then
    player.bag = player.bag or {}
    for item_id, count in pairs(reward.items) do
      player.bag[item_id] = (player.bag[item_id] or 0) + count
      local idef = PW.items and PW.items[item_id]
      ui.msg(uid, string.format(PW.T("quest.reward_item"), (idef and idef.name) or tostring(item_id), count))
    end
  end
end

-- Phát event: duyệt quest active, tăng tiến độ, hoàn thành nếu đủ
function QE.emit(uid, event_t, payload)
  local player = PW.store.get(uid)
  player.quests = player.quests or { active = {}, done = {} }
  local completed = {}

  for quest_id, st in pairs(player.quests.active) do
    local d = qdef(quest_id)
    if d and goal_matches(d.goal, event_t, payload) then
      st.progress = (st.progress or 0) + 1
      local need = (d.goal and d.goal.n) or 1
      if st.progress >= need then
        completed[#completed + 1] = quest_id
      else
        PW.ui_common.msg(uid, string.format(PW.T("quest.progress"), qname(quest_id), st.progress, need))
      end
    end
  end

  -- Hoàn thành ngoài vòng lặp để không sửa bảng đang duyệt
  for i = 1, #completed do
    local quest_id = completed[i]
    local d = qdef(quest_id)
    player.quests.active[quest_id] = nil
    player.quests.done[quest_id] = true
    PW.ui_common.msg(uid, string.format(PW.T("quest.completed"), qname(quest_id)))
    grant_rewards(uid, player, d)
    if PW.log and PW.log.info then
      PW.log.info("quest done: " .. tostring(quest_id) .. " uid=" .. tostring(uid))
    end
  end
  if #completed > 0 and PW.store.save then PW.store.save(uid) end

  -- Tự nhận quest tiếp theo trong chuỗi
  for i = 1, #completed do
    local d = qdef(completed[i])
    if d and d.next then QE.start(uid, d.next) end
  end
end
