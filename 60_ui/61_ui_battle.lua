-- PokeWorld | 60_ui/61_ui_battle.lua | Giao diện trận đấu: hiển thị HP, menu chiêu và hành động
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["ui.battle.title"] = "Trận đấu",
  ["ui.battle.vs"] = "%s (Lv.%d)  đấu với  %s (Lv.%d)",
  ["ui.battle.actions"] = "Hành động",
  ["ui.battle.moves"] = "Chọn chiêu",
  ["ui.battle.fight"] = "Chiến đấu",
  ["ui.battle.bag"] = "Túi đồ",
  ["ui.battle.party"] = "Đội hình",
  ["ui.battle.run"] = "Bỏ chạy",
  ["ui.battle.no_battle"] = "Bạn không ở trong trận đấu.",
  ["ui.battle.switch_to"] = "Đổi ra Pokémon nào?",
  ["ui.battle.no_pp"] = "Chiêu này hết PP!",
  ["ui.battle.status"] = " [%s]",
}

PW.ui = PW.ui or {}
PW.ui.battle = PW.ui.battle or {}
local B = PW.ui.battle

local PANEL = "pw_battle"

-- Lấy tên hiển thị + hệ của 1 chiêu
local function move_label(mv)
  local def = PW.moves and PW.moves[mv.id]
  local name = (def and (def.name or def.name_key and PW.T(def.name_key))) or tostring(mv.id)
  local mtype = (def and def.type) or "?"
  local pp_max = (def and def.pp) or mv.pp or 0
  return string.format("%s (%s) PP %d/%d", tostring(name), tostring(mtype), mv.pp or 0, pp_max)
end

-- Dòng mô tả 1 con trong trận: tên, lv, hp bar, status
local function mon_line(mon)
  if not mon then return "---" end
  local ui = PW.ui_common
  local name = (PW.pokemon and PW.pokemon.name and PW.pokemon.name(mon)) or tostring(mon.nick or mon.sp)
  local max = (PW.pokemon and PW.pokemon.max_hp and PW.pokemon.max_hp(mon)) or 1
  local s = string.format("%s Lv.%d %s", name, mon.lv or 1, ui.hp_bar(mon.hp_cur or 0, max))
  if mon.status then s = s .. string.format(PW.T("ui.battle.status"), tostring(mon.status)) end
  return s
end

-- Lấy con của người chơi + con đối thủ từ battle state (guard nhiều schema)
local function actors(uid, battle)
  local mine = battle.player_mon or battle.mine or (battle.sides and battle.sides[uid] and battle.sides[uid].active)
  local foe = battle.enemy_mon or battle.foe or battle.wild or (battle.sides and battle.sides.enemy and battle.sides.enemy.active)
  return mine, foe
end

-- Render trạng thái trận qua chat (fallback khi panel không mở được)
local function render_chat(uid, battle)
  local ui = PW.ui_common
  local mine, foe = actors(uid, battle)
  local lines = { "== " .. PW.T("ui.battle.title") .. " ==" }
  lines[#lines + 1] = "Đối thủ: " .. mon_line(foe)
  lines[#lines + 1] = "Của bạn: " .. mon_line(mine)
  ui.msg(uid, table.concat(lines, "\n"))
end

-- Menu chọn chiêu → submit {t="move", i=}
local function open_move_menu(uid, battle)
  local ui = PW.ui_common
  local mine = actors(uid, battle)
  local moves = (mine and mine.moves) or {}
  local opts = {}
  for i = 1, #moves do
    opts[#opts + 1] = { label = move_label(moves[i]), i = i, pp = moves[i].pp }
  end
  if #opts == 0 then return end
  ui.menu(uid, PW.T("ui.battle.moves"), opts, function(u, _, opt)
    if (opt.pp or 0) <= 0 then
      ui.msg(u, PW.T("ui.battle.no_pp"))
      open_move_menu(u, battle)
      return
    end
    if PW.battle_ctrl and PW.battle_ctrl.submit then
      PW.battle_ctrl.submit(u, { t = "move", i = opt.i })
    end
  end)
end

-- Menu đổi mon → submit {t="switch", slot=}
local function open_switch_menu(uid)
  local ui = PW.ui_common
  local player = PW.store and PW.store.get and PW.store.get(uid)
  local party = (player and player.party) or {}
  local opts = {}
  for slot = 1, #party do
    local mon = party[slot]
    opts[#opts + 1] = { label = mon_line(mon), slot = slot }
  end
  if #opts == 0 then return end
  ui.menu(uid, PW.T("ui.battle.switch_to"), opts, function(u, _, opt)
    if PW.battle_ctrl and PW.battle_ctrl.submit then
      PW.battle_ctrl.submit(u, { t = "switch", slot = opt.slot })
    end
  end)
end

-- Menu hành động chính: Fight / Bag / Party / Run
local function open_action_menu(uid, battle)
  local ui = PW.ui_common
  local opts = {
    { label = PW.T("ui.battle.fight"), act = "fight" },
    { label = PW.T("ui.battle.bag"), act = "bag" },
    { label = PW.T("ui.battle.party"), act = "party" },
    { label = PW.T("ui.battle.run"), act = "run" },
  }
  ui.menu(uid, PW.T("ui.battle.actions"), opts, function(u, _, opt)
    if opt.act == "fight" then
      open_move_menu(u, battle)
    elseif opt.act == "bag" then
      -- Mở túi ở chế độ trong trận (65 render, action submit qua battle_ctrl)
      if PW.ui.bag and PW.ui.bag.open_in_battle then
        PW.ui.bag.open_in_battle(u)
      elseif PW.ui.bag and PW.ui.bag.open then
        PW.ui.bag.open(u)
      end
    elseif opt.act == "party" then
      open_switch_menu(u)
    elseif opt.act == "run" then
      if PW.battle_ctrl and PW.battle_ctrl.submit then
        PW.battle_ctrl.submit(u, { t = "run" })
      end
    end
  end)
end

-- Mở UI trận: panel stub + fallback chat
function B.open(uid, battle)
  if not battle then
    PW.ui_common.msg(uid, PW.T("ui.battle.no_battle"))
    return
  end
  local ok = PW.ui_common.open_panel(uid, PANEL, battle)
  if not ok then render_chat(uid, battle) end
  open_action_menu(uid, battle)
end

-- Cập nhật giữa các lượt
function B.update(uid, battle)
  if not battle then return end
  local ok = PW.ui_common.open_panel(uid, PANEL, battle)
  if not ok then render_chat(uid, battle) end
  open_action_menu(uid, battle)
end

-- Đóng UI khi trận kết thúc
function B.close(uid)
  PW.ui_common.close_panel(uid, PANEL)
  PW.ui_common.cancel_menu(uid)
end
