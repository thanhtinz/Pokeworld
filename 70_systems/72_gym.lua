-- PokeWorld | 70_systems/72_gym.lua | Huy hiệu gym: trao badge, thứ tự thách đấu, gate Elite Four
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["gym.awarded"] = "Chúc mừng! Bạn nhận được huy hiệu %s!",
  ["gym.badge_list"] = "Huy hiệu (%d/%d):",
  ["gym.badge_have"] = "  ✓ %s",
  ["gym.badge_missing"] = "  — %s (chưa có)",
  ["gym.elite_open"] = "Cổng Elite Four: ĐÃ MỞ!",
  ["gym.elite_locked"] = "Cổng Elite Four: chưa đủ huy hiệu.",
  ["badge_boulder"] = "Huy hiệu Đá",
  ["badge_cascade"] = "Huy hiệu Thác Nước",
}

PW.gym = PW.gym or {}
local G = PW.gym

-- Thứ tự gym phải vượt qua
G.order = { "badge_boulder", "badge_cascade" }

local function badge_name(badge_id)
  -- Ưu tiên loc key trùng id, fallback id
  if PW.loc and PW.loc[badge_id] then return PW.T(badge_id) end
  return tostring(badge_id)
end

local function has_badge(player, badge_id)
  local b = player.badges or {}
  -- badges có thể là set {id=true} hoặc mảng
  if b[badge_id] then return true end
  for i = 1, #b do
    if b[i] == badge_id then return true end
  end
  return false
end

-- Trao badge cho người chơi
function G.award(uid, badge_id)
  local player = PW.store.get(uid)
  player.badges = player.badges or {}
  if has_badge(player, badge_id) then return false end
  player.badges[badge_id] = true
  if PW.store.save then PW.store.save(uid) end
  PW.ui_common.msg(uid, string.format(PW.T("gym.awarded"), badge_name(badge_id)))
  if PW.log and PW.log.info then
    PW.log.info("gym award " .. tostring(badge_id) .. " uid=" .. tostring(uid))
  end
  -- Báo quest engine (guard nil)
  if PW.quest_engine and PW.quest_engine.emit then
    PW.quest_engine.emit(uid, "earn_badge", { id = badge_id })
  end
  return true
end

-- Được phép thách đấu gym này chưa: phải có mọi badge đứng trước trong order
function G.can_challenge(player, badge_id)
  for i = 1, #G.order do
    if G.order[i] == badge_id then return true end
    if not has_badge(player, G.order[i]) then return false end
  end
  -- badge không nằm trong order: cho phép
  return true
end

-- Gate Elite Four: đủ mọi badge trong order
function G.elite_unlocked(player)
  for i = 1, #G.order do
    if not has_badge(player, G.order[i]) then return false end
  end
  return true
end

-- ============ Đăng ký lệnh ============
PW.pending_commands = PW.pending_commands or {}

table.insert(PW.pending_commands, {
  name = "badge",
  desc = "Xem huy hiệu đã có",
  fn = function(uid)
    local player = PW.store.get(uid)
    local have = 0
    local lines = {}
    for i = 1, #G.order do
      local id = G.order[i]
      if has_badge(player, id) then
        have = have + 1
        lines[#lines + 1] = string.format(PW.T("gym.badge_have"), badge_name(id))
      else
        lines[#lines + 1] = string.format(PW.T("gym.badge_missing"), badge_name(id))
      end
    end
    table.insert(lines, 1, string.format(PW.T("gym.badge_list"), have, #G.order))
    lines[#lines + 1] = G.elite_unlocked(player) and PW.T("gym.elite_open") or PW.T("gym.elite_locked")
    PW.ui_common.msg(uid, table.concat(lines, "\n"))
  end,
})
