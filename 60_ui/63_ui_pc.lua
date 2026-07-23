-- PokeWorld | 60_ui/63_ui_pc.lua | Giao diện PC Box: xem box, gửi và rút Pokémon
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["ui.pc.title"] = "PC Box %d (%s)",
  ["ui.pc.menu"] = "PC — chọn thao tác",
  ["ui.pc.view"] = "Xem box",
  ["ui.pc.deposit"] = "Gửi Pokémon vào box",
  ["ui.pc.withdraw"] = "Rút Pokémon từ box",
  ["ui.pc.next_page"] = "Trang sau",
  ["ui.pc.prev_page"] = "Trang trước",
  ["ui.pc.next_box"] = "Box tiếp theo",
  ["ui.pc.pick_mon_deposit"] = "Gửi con nào vào box?",
  ["ui.pc.pick_mon_withdraw"] = "Rút con nào?",
  ["ui.pc.deposited"] = "Đã gửi %s vào Box %d.",
  ["ui.pc.withdrawn"] = "Đã rút %s về đội.",
  ["ui.pc.box_empty"] = "Box này trống.",
  ["ui.pc.party_last"] = "Không thể gửi con cuối cùng trong đội.",
  ["ui.pc.party_full"] = "Đội đã đầy, không thể rút.",
  ["ui.pc.not_here"] = "PC chỉ dùng được ở Trung tâm Pokémon (thị trấn).",
  ["ui.pc.debug_zone"] = "[debug] Chưa có hệ thống zone — cho phép mở PC.",
}

PW.ui = PW.ui or {}
PW.ui.pc = PW.ui.pc or {}
local PC = PW.ui.pc

local PANEL = "pw_pc"
local PER_PAGE = 8

local function box_count()
  return (PW.config and PW.config.BOX_COUNT) or 8
end

local function mon_label(mon)
  if not mon then return "---" end
  local name = (PW.pokemon and PW.pokemon.name and PW.pokemon.name(mon)) or tostring(mon.nick or mon.sp)
  return string.format("%s Lv.%d", name, mon.lv or 1)
end

-- Xem 1 box với phân trang
local function view_box(uid, box, page)
  local ui = PW.ui_common
  local player = PW.store.get(uid)
  player.boxes = player.boxes or {}
  local list = player.boxes[box] or {}
  local slice, total = ui.paginate(list, page, PER_PAGE)
  page = math.max(1, math.min(page or 1, total))

  local title = string.format(PW.T("ui.pc.title"), box, string.format(PW.T("ui.common.page"), page, total))
  local opts = {}
  for i = 1, #slice do
    local idx = (page - 1) * PER_PAGE + i
    opts[#opts + 1] = { label = mon_label(slice[i]), act = "mon", idx = idx }
  end
  if #list == 0 then
    ui.msg(uid, PW.T("ui.pc.box_empty"))
  end
  if page < total then opts[#opts + 1] = { label = PW.T("ui.pc.next_page"), act = "next" } end
  if page > 1 then opts[#opts + 1] = { label = PW.T("ui.pc.prev_page"), act = "prev" } end
  opts[#opts + 1] = { label = PW.T("ui.pc.next_box"), act = "nextbox" }
  ui.menu(uid, title, opts, function(u, _, opt)
    if opt.act == "mon" then
      -- Chọn 1 con trong box → rút
      local mon = (PW.store.get(u).boxes[box] or {})[opt.idx]
      if not mon then return end
      local pl = PW.store.get(u)
      if #(pl.party or {}) >= ((PW.config and PW.config.PARTY_MAX) or 6) then
        ui.msg(u, PW.T("ui.pc.party_full"))
        return
      end
      if PW.party and PW.party.withdraw then
        PW.party.withdraw(pl, box, opt.idx)
        if PW.store.save then PW.store.save(u) end
        ui.msg(u, string.format(PW.T("ui.pc.withdrawn"), mon_label(mon)))
      end
    elseif opt.act == "next" then
      view_box(u, box, page + 1)
    elseif opt.act == "prev" then
      view_box(u, box, page - 1)
    elseif opt.act == "nextbox" then
      local nb = box + 1
      if nb > box_count() then nb = 1 end
      view_box(u, nb, 1)
    end
  end)
end

-- Menu gửi mon từ party vào box
local function deposit_menu(uid, box)
  local ui = PW.ui_common
  local player = PW.store.get(uid)
  local party = player.party or {}
  if #party <= 1 then
    ui.msg(uid, PW.T("ui.pc.party_last"))
    return
  end
  local opts = {}
  for slot = 1, #party do
    opts[#opts + 1] = { label = mon_label(party[slot]), slot = slot }
  end
  ui.menu(uid, PW.T("ui.pc.pick_mon_deposit"), opts, function(u, _, opt)
    local pl = PW.store.get(u)
    if #(pl.party or {}) <= 1 then
      ui.msg(u, PW.T("ui.pc.party_last"))
      return
    end
    local mon = pl.party[opt.slot]
    if PW.party and PW.party.deposit then
      PW.party.deposit(pl, opt.slot, box)
      if PW.store.save then PW.store.save(u) end
      ui.msg(u, string.format(PW.T("ui.pc.deposited"), mon_label(mon), box))
    end
  end)
end

-- Mở PC: menu chính
function PC.open(uid)
  local ui = PW.ui_common
  ui.open_panel(uid, PANEL, nil)
  local opts = {
    { label = PW.T("ui.pc.view"), act = "view" },
    { label = PW.T("ui.pc.deposit"), act = "deposit" },
    { label = PW.T("ui.pc.withdraw"), act = "withdraw" },
  }
  ui.menu(uid, PW.T("ui.pc.menu"), opts, function(u, _, opt)
    if opt.act == "view" or opt.act == "withdraw" then
      view_box(u, 1, 1)
    elseif opt.act == "deposit" then
      deposit_menu(u, 1)
    end
  end)
end

-- ============ Đăng ký lệnh ============
PW.pending_commands = PW.pending_commands or {}

table.insert(PW.pending_commands, {
  name = "pc",
  desc = "Mở PC Box (chỉ ở thị trấn)",
  fn = function(uid)
    -- Chỉ mở khi ở zone town_1; chưa có zones thì cho mở kèm cảnh báo debug
    if PW.zones and PW.zones.at then
      local z = PW.zones.at(uid)
      if z ~= "town_1" then
        PW.ui_common.msg(uid, PW.T("ui.pc.not_here"))
        return
      end
    else
      PW.ui_common.msg(uid, PW.T("ui.pc.debug_zone"))
    end
    PC.open(uid)
  end,
})
