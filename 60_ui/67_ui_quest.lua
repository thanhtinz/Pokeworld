-- PokeWorld | 60_ui/67_ui_quest.lua | Giao diện nhiệm vụ: liệt kê quest đang làm và đã xong
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["ui.quest.title"] = "Nhiệm vụ",
  ["ui.quest.active_header"] = "-- Đang làm --",
  ["ui.quest.done_header"] = "-- Đã hoàn thành --",
  ["ui.quest.none_active"] = "(không có nhiệm vụ nào)",
  ["ui.quest.none_done"] = "(chưa hoàn thành nhiệm vụ nào)",
  ["ui.quest.progress"] = "  %s — %s (%d/%d)",
}

PW.ui = PW.ui or {}
PW.ui.quest = PW.ui.quest or {}
local Q = PW.ui.quest

local PANEL = "pw_quest"

local function quest_def(id) return PW.quests and PW.quests[id] end

local function quest_name(id)
  local d = quest_def(id)
  return (d and (d.name or (d.name_key and PW.T(d.name_key)))) or tostring(id)
end

local function quest_desc(id)
  local d = quest_def(id)
  return (d and (d.desc or (d.desc_key and PW.T(d.desc_key)))) or ""
end

-- Mở danh sách nhiệm vụ
function Q.open(uid)
  local ui = PW.ui_common
  local player = PW.store.get(uid)
  local quests = player.quests or { active = {}, done = {} }
  ui.open_panel(uid, PANEL, nil)

  local lines = { "== " .. PW.T("ui.quest.title") .. " ==" }

  -- Quest đang làm với tiến độ n/N
  lines[#lines + 1] = PW.T("ui.quest.active_header")
  local has_active = false
  for id, st in pairs(quests.active or {}) do
    has_active = true
    local d = quest_def(id)
    local goal_n = (d and d.goal and (d.goal.n or 1)) or 1
    local prog = (type(st) == "table" and (st.progress or 0)) or 0
    lines[#lines + 1] = string.format(PW.T("ui.quest.progress"),
      quest_name(id), quest_desc(id), math.min(prog, goal_n), goal_n)
  end
  if not has_active then lines[#lines + 1] = "  " .. PW.T("ui.quest.none_active") end

  -- Quest đã xong
  lines[#lines + 1] = PW.T("ui.quest.done_header")
  local has_done = false
  for id in pairs(quests.done or {}) do
    has_done = true
    lines[#lines + 1] = "  ✓ " .. quest_name(id)
  end
  if not has_done then lines[#lines + 1] = "  " .. PW.T("ui.quest.none_done") end

  ui.msg(uid, table.concat(lines, "\n"))
end

-- ============ Đăng ký lệnh ============
PW.pending_commands = PW.pending_commands or {}

table.insert(PW.pending_commands, {
  name = "quest", aliases = { "nv" },
  desc = "Xem danh sách nhiệm vụ",
  fn = function(uid) Q.open(uid) end,
})
