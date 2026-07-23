-- PokeWorld | 60_ui/65_ui_bag.lua | Giao diện túi đồ: tab theo loại, dùng item trong và ngoài trận
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["ui.bag.title"] = "Túi đồ",
  ["ui.bag.empty"] = "Túi đồ trống.",
  ["ui.bag.tab_medicine"] = "Thuốc",
  ["ui.bag.tab_ball"] = "Bóng",
  ["ui.bag.tab_stone"] = "Đá tiến hóa",
  ["ui.bag.tab_berry"] = "Quả mọng",
  ["ui.bag.tab_held"] = "Đồ cầm",
  ["ui.bag.tab_candy"] = "Kẹo",
  ["ui.bag.tab_other"] = "Khác",
  ["ui.bag.pick_item"] = "Chọn vật phẩm",
  ["ui.bag.pick_mon"] = "Dùng lên con nào?",
  ["ui.bag.used_heal"] = "%s hồi %d HP.",
  ["ui.bag.full_hp"] = "%s đang đầy máu.",
  ["ui.bag.no_effect"] = "Không có tác dụng.",
  ["ui.bag.evolved"] = "%s đã tiến hóa thành %s!",
  ["ui.bag.cannot_evolve"] = "Không thể tiến hóa với đá này.",
  ["ui.bag.level_up"] = "%s lên cấp %d!",
  ["ui.bag.max_level"] = "%s đã đạt cấp tối đa.",
  ["ui.bag.not_usable"] = "Vật phẩm này không dùng được ở đây.",
  ["ui.bag.battle_pick"] = "Dùng item nào trong trận?",
}

PW.ui = PW.ui or {}
PW.ui.bag = PW.ui.bag or {}
local BG = PW.ui.bag

local PANEL = "pw_bag"

local TAB_ORDER = { "medicine", "ball", "stone", "berry", "held", "candy", "other" }

local function item_def(id) return PW.items and PW.items[id] end

local function item_name(id)
  local d = item_def(id)
  return (d and d.name) or tostring(id)
end

local function mon_name(mon)
  return (PW.pokemon and PW.pokemon.name and PW.pokemon.name(mon)) or tostring(mon and (mon.nick or mon.sp))
end

-- Gom bag theo kind → { kind = { {id=,count=}, ... } }
local function group_bag(player)
  local groups = {}
  for id, count in pairs(player.bag or {}) do
    if count and count > 0 then
      local d = item_def(id)
      local kind = (d and d.kind) or "other"
      groups[kind] = groups[kind] or {}
      table.insert(groups[kind], { id = id, count = count })
    end
  end
  for _, list in pairs(groups) do
    table.sort(list, function(a, b) return tostring(a.id) < tostring(b.id) end)
  end
  return groups
end

-- Trừ 1 item khỏi bag
local function consume(player, id)
  player.bag = player.bag or {}
  local c = (player.bag[id] or 0) - 1
  if c <= 0 then player.bag[id] = nil else player.bag[id] = c end
end

-- Menu chọn mon trong party rồi gọi cb(uid, slot, mon)
local function pick_mon(uid, cb)
  local ui = PW.ui_common
  local player = PW.store.get(uid)
  local opts = {}
  for slot = 1, #(player.party or {}) do
    local mon = player.party[slot]
    local max = (PW.pokemon and PW.pokemon.max_hp and PW.pokemon.max_hp(mon)) or 1
    opts[#opts + 1] = {
      label = string.format("%s Lv.%d %s", mon_name(mon), mon.lv or 1, ui.hp_bar(mon.hp_cur or 0, max)),
      slot = slot,
    }
  end
  if #opts == 0 then return end
  ui.menu(uid, PW.T("ui.bag.pick_mon"), opts, function(u, _, opt)
    local pl = PW.store.get(u)
    cb(u, opt.slot, pl.party[opt.slot])
  end)
end

-- Dùng medicine ngoài trận
local function use_medicine(uid, id)
  pick_mon(uid, function(u, slot, mon)
    local ui = PW.ui_common
    if not mon then return end
    local pl = PW.store.get(u)
    local d = item_def(id) or {}
    local max = (PW.pokemon and PW.pokemon.max_hp and PW.pokemon.max_hp(mon)) or 1
    local heal = d.heal or d.hp or 20
    local cured = false
    -- Hồi status nếu thuốc có cure
    if d.cure and mon.status and (d.cure == "all" or d.cure == mon.status) then
      mon.status = nil
      cured = true
    end
    if heal == "full" then heal = max end
    local before = mon.hp_cur or 0
    if before >= max and not cured then
      ui.msg(u, string.format(PW.T("ui.bag.full_hp"), mon_name(mon)))
      return
    end
    mon.hp_cur = math.min(max, before + (tonumber(heal) or 0))
    consume(pl, id)
    if PW.store.save then PW.store.save(u) end
    ui.msg(u, string.format(PW.T("ui.bag.used_heal"), mon_name(mon), mon.hp_cur - before))
  end)
end

-- Dùng đá tiến hóa
local function use_stone(uid, id)
  pick_mon(uid, function(u, slot, mon)
    local ui = PW.ui_common
    if not mon then return end
    local pl = PW.store.get(u)
    local target
    if PW.evolution and PW.evolution.check then
      target = PW.evolution.check(mon, "stone", id)
    end
    if not target then
      ui.msg(u, PW.T("ui.bag.cannot_evolve"))
      return
    end
    local old = mon_name(mon)
    if PW.evolution.evolve then
      PW.evolution.evolve(u, mon, target)
    else
      mon.sp = target -- fallback thô
    end
    consume(pl, id)
    if PW.store.save then PW.store.save(u) end
    ui.msg(u, string.format(PW.T("ui.bag.evolved"), old, mon_name(mon)))
  end)
end

-- Dùng kẹo: +1 level qua PW.exp
local function use_candy(uid, id)
  pick_mon(uid, function(u, slot, mon)
    local ui = PW.ui_common
    if not mon then return end
    local pl = PW.store.get(u)
    local max_lv = (PW.config and PW.config.MAX_LEVEL) or 100
    if (mon.lv or 1) >= max_lv then
      ui.msg(u, string.format(PW.T("ui.bag.max_level"), mon_name(mon)))
      return
    end
    mon.lv = (mon.lv or 1) + 1
    -- Đồng bộ exp với mốc level mới
    if PW.exp and PW.exp.for_level then
      local sp = PW.species and PW.species[mon.sp]
      local curve = (sp and sp.curve) or "medium"
      mon.exp = PW.exp.for_level(curve, mon.lv)
    end
    -- Cập nhật HP theo max mới (giữ tỉ lệ thiếu)
    if PW.pokemon and PW.pokemon.max_hp then
      local new_max = PW.pokemon.max_hp(mon)
      mon.hp_cur = math.min(new_max, (mon.hp_cur or new_max) + 1)
    end
    consume(pl, id)
    if PW.store.save then PW.store.save(u) end
    ui.msg(u, string.format(PW.T("ui.bag.level_up"), mon_name(mon), mon.lv))
    -- Kiểm tra tiến hóa theo level
    if PW.evolution and PW.evolution.check then
      local target = PW.evolution.check(mon, "level")
      if target and PW.evolution.evolve then
        local old = mon_name(mon)
        PW.evolution.evolve(u, mon, target)
        if PW.store.save then PW.store.save(u) end
        ui.msg(u, string.format(PW.T("ui.bag.evolved"), old, mon_name(mon)))
      end
    end
  end)
end

-- Menu item trong 1 tab
local function open_tab(uid, kind, items)
  local ui = PW.ui_common
  local opts = {}
  for i = 1, #items do
    local it = items[i]
    opts[#opts + 1] = { label = string.format("%s x%d", item_name(it.id), it.count), id = it.id }
  end
  ui.menu(uid, PW.T("ui.bag.pick_item"), opts, function(u, _, opt)
    if kind == "medicine" or kind == "berry" then
      use_medicine(u, opt.id)
    elseif kind == "stone" then
      use_stone(u, opt.id)
    elseif kind == "candy" then
      use_candy(u, opt.id)
    else
      -- ball/held/khác: không dùng ngoài trận
      ui.msg(u, PW.T("ui.bag.not_usable"))
    end
  end)
end

-- Mở túi ngoài trận
function BG.open(uid)
  local ui = PW.ui_common
  local player = PW.store.get(uid)
  local groups = group_bag(player)
  ui.open_panel(uid, PANEL, nil)
  local opts = {}
  for _, kind in ipairs(TAB_ORDER) do
    local list = groups[kind]
    if list and #list > 0 then
      local label = PW.T("ui.bag.tab_" .. kind)
      opts[#opts + 1] = { label = string.format("%s (%d)", label, #list), kind = kind, items = list }
    end
  end
  if #opts == 0 then
    ui.msg(uid, PW.T("ui.bag.empty"))
    return
  end
  ui.menu(uid, PW.T("ui.bag.title"), opts, function(u, _, opt)
    open_tab(u, opt.kind, opt.items)
  end)
end

-- Mở túi trong trận: chọn item → submit qua battle_ctrl
function BG.open_in_battle(uid)
  local ui = PW.ui_common
  local player = PW.store.get(uid)
  local groups = group_bag(player)
  local opts = {}
  -- Trong trận chỉ dùng được medicine/berry/ball
  for _, kind in ipairs({ "medicine", "berry", "ball" }) do
    for _, it in ipairs(groups[kind] or {}) do
      opts[#opts + 1] = { label = string.format("%s x%d", item_name(it.id), it.count), id = it.id, kind = kind }
    end
  end
  if #opts == 0 then
    ui.msg(uid, PW.T("ui.bag.empty"))
    return
  end
  ui.menu(uid, PW.T("ui.bag.battle_pick"), opts, function(u, _, opt)
    if not (PW.battle_ctrl and PW.battle_ctrl.submit) then return end
    if opt.kind == "ball" then
      PW.battle_ctrl.submit(u, { t = "ball", id = opt.id })
    else
      -- Thuốc: chọn mon mục tiêu trong party
      pick_mon(u, function(u2, slot)
        PW.battle_ctrl.submit(u2, { t = "item", id = opt.id, target_slot = slot })
      end)
    end
  end)
end

-- ============ Đăng ký lệnh ============
PW.pending_commands = PW.pending_commands or {}

table.insert(PW.pending_commands, {
  name = "bag", aliases = { "tui" },
  desc = "Mở túi đồ",
  fn = function(uid)
    -- Đang trong trận thì mở túi chế độ trận
    local b = PW.battle_ctrl and PW.battle_ctrl.get and PW.battle_ctrl.get(uid)
    if b then BG.open_in_battle(uid) else BG.open(uid) end
  end,
})
