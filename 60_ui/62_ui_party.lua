-- PokeWorld | 60_ui/62_ui_party.lua | Giao diện đội hình: xem, summary, đổi vị trí, đặt biệt danh
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["ui.party.title"] = "Đội hình",
  ["ui.party.empty_slot"] = "(trống)",
  ["ui.party.empty"] = "Đội hình trống.",
  ["ui.party.detail"] = "Chọn hành động",
  ["ui.party.summary"] = "Xem chi tiết",
  ["ui.party.move_slot"] = "Đổi vị trí",
  ["ui.party.follow"] = "Đặt đi theo",
  ["ui.party.pick_dest"] = "Đổi tới vị trí nào?",
  ["ui.party.swapped"] = "Đã đổi vị trí %d và %d.",
  ["ui.party.follow_set"] = "%s sẽ đi theo bạn.",
  ["ui.party.bad_slot"] = "Slot không hợp lệ (1-%d).",
  ["ui.party.nick_len"] = "Biệt danh tối đa 12 ký tự.",
  ["ui.party.nick_set"] = "Đã đặt biệt danh %s cho slot %d.",
  ["ui.party.nick_usage"] = "Dùng: .nick <slot> <tên>",
}

PW.ui = PW.ui or {}
PW.ui.party = PW.ui.party or {}
local P = PW.ui.party

local PANEL = "pw_party"

local function party_max()
  return (PW.config and PW.config.PARTY_MAX) or 6
end

-- Dòng hiển thị 1 slot
local function slot_line(mon)
  if not mon then return PW.T("ui.party.empty_slot") end
  local name = (PW.pokemon and PW.pokemon.name and PW.pokemon.name(mon)) or tostring(mon.nick or mon.sp)
  local max = (PW.pokemon and PW.pokemon.max_hp and PW.pokemon.max_hp(mon)) or 1
  local s = string.format("%s Lv.%d %s", name, mon.lv or 1, PW.ui_common.hp_bar(mon.hp_cur or 0, max))
  if mon.status then s = s .. " [" .. tostring(mon.status) .. "]" end
  return s
end

-- Render summary chi tiết 1 con: stats/IV/EV/nature/chiêu
local function render_summary(uid, mon)
  local ui = PW.ui_common
  if not mon then return end
  local name = (PW.pokemon and PW.pokemon.name and PW.pokemon.name(mon)) or tostring(mon.sp)
  local sp = PW.species and PW.species[mon.sp]
  local lines = { "== " .. name .. " (Lv." .. tostring(mon.lv or 1) .. ") ==" }
  if sp and sp.types then
    lines[#lines + 1] = "Hệ: " .. table.concat(sp.types, "/")
  end
  if mon.shiny then lines[#lines + 1] = "★ SHINY ★" end
  lines[#lines + 1] = "Tính cách: " .. tostring(mon.nature or "?") .. "  Đặc tính: " .. tostring(mon.ability or "?")
  local max = (PW.pokemon and PW.pokemon.max_hp and PW.pokemon.max_hp(mon)) or 1
  lines[#lines + 1] = "HP: " .. ui.hp_bar(mon.hp_cur or 0, max)
  local stats = PW.pokemon and PW.pokemon.stats and PW.pokemon.stats(mon)
  if stats then
    -- stats có thể là mảng 6 số hoặc bảng key
    local labels = { "HP", "Atk", "Def", "SpA", "SpD", "Spe" }
    local keys = { "hp", "atk", "def", "spa", "spd", "spe" }
    local parts = {}
    for i = 1, 6 do
      local v = stats[i] or stats[keys[i]]
      if v then parts[#parts + 1] = labels[i] .. " " .. tostring(v) end
    end
    if #parts > 0 then lines[#lines + 1] = "Chỉ số: " .. table.concat(parts, " | ") end
  end
  if mon.iv then lines[#lines + 1] = "IV: " .. table.concat(mon.iv, "/") end
  if mon.ev then lines[#lines + 1] = "EV: " .. table.concat(mon.ev, "/") end
  lines[#lines + 1] = "Thân thiết: " .. tostring(mon.friendship or 0) .. "  Bóng: " .. tostring(mon.ball or "?")
  if mon.held then lines[#lines + 1] = "Đang cầm: " .. tostring(mon.held) end
  lines[#lines + 1] = "Chiêu:"
  for i = 1, #(mon.moves or {}) do
    local mv = mon.moves[i]
    local def = PW.moves and PW.moves[mv.id]
    local mname = (def and def.name) or tostring(mv.id)
    local pp_max = (def and def.pp) or mv.pp or 0
    lines[#lines + 1] = string.format("  - %s (PP %d/%d)", tostring(mname), mv.pp or 0, pp_max)
  end
  ui.msg(uid, table.concat(lines, "\n"))
end

-- Menu chi tiết sau khi chọn 1 con
local function open_detail_menu(uid, slot)
  local ui = PW.ui_common
  local player = PW.store.get(uid)
  local mon = player.party[slot]
  if not mon then return end
  local opts = {
    { label = PW.T("ui.party.summary"), act = "summary" },
    { label = PW.T("ui.party.move_slot"), act = "swap" },
    { label = PW.T("ui.party.follow"), act = "follow" },
  }
  ui.menu(uid, slot_line(mon), opts, function(u, _, opt)
    if opt.act == "summary" then
      render_summary(u, mon)
    elseif opt.act == "swap" then
      -- Chọn slot đích
      local dest_opts = {}
      for s = 1, party_max() do
        dest_opts[#dest_opts + 1] = { label = string.format("Slot %d: %s", s, slot_line(player.party[s])), slot = s }
      end
      ui.menu(u, PW.T("ui.party.pick_dest"), dest_opts, function(u2, _, o2)
        if PW.party and PW.party.swap then
          PW.party.swap(player, slot, o2.slot)
          if PW.store.save then PW.store.save(u2) end
        end
        ui.msg(u2, string.format(PW.T("ui.party.swapped"), slot, o2.slot))
      end)
    elseif opt.act == "follow" then
      -- Đặt con đi theo (module follower guard nil)
      if PW.follower and PW.follower.set then
        PW.follower.set(u, slot)
      end
      player.settings = player.settings or {}
      player.settings.follow_slot = slot
      if PW.store.save then PW.store.save(u) end
      local name = (PW.pokemon and PW.pokemon.name and PW.pokemon.name(mon)) or tostring(mon.sp)
      ui.msg(u, string.format(PW.T("ui.party.follow_set"), name))
    end
  end)
end

-- Mở UI đội hình
function P.open(uid)
  local ui = PW.ui_common
  local player = PW.store.get(uid)
  local party = player.party or {}
  if #party == 0 then
    ui.msg(uid, PW.T("ui.party.empty"))
    return
  end
  ui.open_panel(uid, PANEL, party)
  local opts = {}
  for slot = 1, party_max() do
    local mon = party[slot]
    if mon then
      opts[#opts + 1] = { label = string.format("%d. %s", slot, slot_line(mon)), slot = slot }
    end
  end
  ui.menu(uid, PW.T("ui.party.title"), opts, function(u, _, opt)
    open_detail_menu(u, opt.slot)
  end)
end

-- ============ Đăng ký lệnh ============
PW.pending_commands = PW.pending_commands or {}

table.insert(PW.pending_commands, {
  name = "party", aliases = { "doi" },
  desc = "Mở đội hình",
  fn = function(uid) P.open(uid) end,
})

table.insert(PW.pending_commands, {
  name = "summary",
  desc = "Xem chi tiết 1 slot: .summary <slot>",
  fn = function(uid, args)
    local slot = tonumber(args and args[1])
    local player = PW.store.get(uid)
    if not slot or slot < 1 or slot > party_max() or not player.party[slot] then
      PW.ui_common.msg(uid, string.format(PW.T("ui.party.bad_slot"), party_max()))
      return
    end
    render_summary(uid, player.party[slot])
  end,
})

table.insert(PW.pending_commands, {
  name = "nick",
  desc = "Đặt biệt danh: .nick <slot> <tên>",
  fn = function(uid, args)
    local ui = PW.ui_common
    local slot = tonumber(args and args[1])
    local nick = args and args[2]
    if not slot or not nick then
      ui.msg(uid, PW.T("ui.party.nick_usage"))
      return
    end
    local player = PW.store.get(uid)
    if slot < 1 or slot > party_max() or not player.party[slot] then
      ui.msg(uid, string.format(PW.T("ui.party.bad_slot"), party_max()))
      return
    end
    if #nick > 12 then
      ui.msg(uid, PW.T("ui.party.nick_len"))
      return
    end
    player.party[slot].nick = nick
    if PW.store.save then PW.store.save(uid) end
    ui.msg(uid, string.format(PW.T("ui.party.nick_set"), nick, slot))
  end,
})
