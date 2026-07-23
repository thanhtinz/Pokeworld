-- PokeWorld | 60_ui/69_ui_admin.lua | Bảng điều khiển GM: give item/poke, tiền, heal, spawner, save
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["ui.admin.title"] = "Bảng GM",
  ["ui.admin.denied"] = "Bạn không có quyền GM.",
  ["ui.admin.give_item"] = "Tặng item",
  ["ui.admin.give_poke"] = "Tặng Pokémon",
  ["ui.admin.set_money"] = "Đặt tiền",
  ["ui.admin.heal_all"] = "Hồi máu toàn đội",
  ["ui.admin.toggle_spawner"] = "Bật/tắt spawner",
  ["ui.admin.despawn_all"] = "Xóa mọi wild",
  ["ui.admin.save_all"] = "Lưu tất cả",
  ["ui.admin.pick_item"] = "Chọn item để tặng (x5)",
  ["ui.admin.pick_species"] = "Chọn loài (Lv.5)",
  ["ui.admin.pick_money"] = "Đặt tiền là bao nhiêu?",
  ["ui.admin.done"] = "Đã thực hiện: %s",
  ["ui.admin.missing"] = "Module chưa sẵn sàng: %s",
  ["ui.admin.spawner_state"] = "Spawner: %s",
}

PW.ui = PW.ui or {}
PW.ui.admin = PW.ui.admin or {}
local A = PW.ui.admin

local PANEL = "pw_admin"

-- Kiểm tra GM: ưu tiên PW.is_gm, fallback GM_LIST
local function is_gm(uid)
  if PW.is_gm then
    local ok, r = pcall(PW.is_gm, uid)
    if ok then return r and true or false end
  end
  local list = PW.config and PW.config.GM_LIST
  if not list then return false end
  for i = 1, #list do
    if list[i] == uid or tostring(list[i]) == tostring(uid) then return true end
  end
  return false
end

local function done(uid, what)
  PW.ui_common.msg(uid, string.format(PW.T("ui.admin.done"), what))
end

-- Tặng item: menu chọn từ toàn bộ PW.items, cộng x5 vào bag GM
local function gm_give_item(uid)
  local ui = PW.ui_common
  local ids = {}
  for id in pairs(PW.items or {}) do ids[#ids + 1] = id end
  table.sort(ids, function(a, b) return tostring(a) < tostring(b) end)
  local opts = {}
  for i = 1, #ids do
    local d = PW.items[ids[i]]
    opts[#opts + 1] = { label = (d and d.name) or tostring(ids[i]), id = ids[i] }
  end
  if #opts == 0 then
    ui.msg(uid, string.format(PW.T("ui.admin.missing"), "PW.items"))
    return
  end
  ui.menu(uid, PW.T("ui.admin.pick_item"), opts, function(u, _, opt)
    local pl = PW.store.get(u)
    pl.bag = pl.bag or {}
    pl.bag[opt.id] = (pl.bag[opt.id] or 0) + 5
    if PW.store.save then PW.store.save(u) end
    done(u, "give item " .. tostring(opt.id) .. " x5")
  end)
end

-- Tặng Pokémon: chọn loài, tạo Lv.5 vào party
local function gm_give_poke(uid)
  local ui = PW.ui_common
  local list = {}
  for dex in pairs(PW.species or {}) do list[#list + 1] = dex end
  table.sort(list)
  local opts = {}
  for i = 1, #list do
    local sp = PW.species[list[i]]
    opts[#opts + 1] = { label = string.format("#%03d %s", list[i], (sp and sp.name) or "?"), dex = list[i] }
  end
  if #opts == 0 then
    ui.msg(uid, string.format(PW.T("ui.admin.missing"), "PW.species"))
    return
  end
  ui.menu(uid, PW.T("ui.admin.pick_species"), opts, function(u, _, opt)
    if not (PW.pokemon and PW.pokemon.new) then
      ui.msg(u, string.format(PW.T("ui.admin.missing"), "PW.pokemon.new"))
      return
    end
    local mon = PW.pokemon.new(opt.dex, 5)
    local pl = PW.store.get(u)
    if PW.party and PW.party.add then
      PW.party.add(pl, mon)
    else
      table.insert(pl.party, mon)
    end
    if PW.dex then
      if PW.dex.mark_seen then PW.dex.mark_seen(pl, opt.dex) end
      if PW.dex.mark_caught then PW.dex.mark_caught(pl, opt.dex) end
    end
    if PW.store.save then PW.store.save(u) end
    done(u, "give poke #" .. tostring(opt.dex))
  end)
end

-- Đặt tiền: menu mốc nhanh
local function gm_set_money(uid)
  local ui = PW.ui_common
  local amounts = { 0, 1000, 10000, 100000, 999999 }
  local opts = {}
  for i = 1, #amounts do
    opts[#opts + 1] = { label = tostring(amounts[i]) .. "₽", amount = amounts[i] }
  end
  ui.menu(uid, PW.T("ui.admin.pick_money"), opts, function(u, _, opt)
    local pl = PW.store.get(u)
    pl.money = opt.amount
    if PW.store.save then PW.store.save(u) end
    done(u, "set money " .. tostring(opt.amount))
  end)
end

-- Mở panel GM
function A.open(uid)
  local ui = PW.ui_common
  if not is_gm(uid) then
    ui.msg(uid, PW.T("ui.admin.denied"))
    return
  end
  ui.open_panel(uid, PANEL, nil)
  local opts = {
    { label = PW.T("ui.admin.give_item"), act = "item" },
    { label = PW.T("ui.admin.give_poke"), act = "poke" },
    { label = PW.T("ui.admin.set_money"), act = "money" },
    { label = PW.T("ui.admin.heal_all"), act = "heal" },
    { label = PW.T("ui.admin.toggle_spawner"), act = "spawner" },
    { label = PW.T("ui.admin.despawn_all"), act = "despawn" },
    { label = PW.T("ui.admin.save_all"), act = "save" },
  }
  ui.menu(uid, PW.T("ui.admin.title"), opts, function(u, _, opt)
    if not is_gm(u) then return end
    if opt.act == "item" then
      gm_give_item(u)
    elseif opt.act == "poke" then
      gm_give_poke(u)
    elseif opt.act == "money" then
      gm_set_money(u)
    elseif opt.act == "heal" then
      local pl = PW.store.get(u)
      if PW.party and PW.party.heal_all then
        PW.party.heal_all(pl)
        if PW.store.save then PW.store.save(u) end
        done(u, "heal all")
      else
        ui.msg(u, string.format(PW.T("ui.admin.missing"), "PW.party.heal_all"))
      end
    elseif opt.act == "spawner" then
      if PW.spawner then
        PW.spawner.enabled = not PW.spawner.enabled
        ui.msg(u, string.format(PW.T("ui.admin.spawner_state"), PW.spawner.enabled and "ON" or "OFF"))
      else
        ui.msg(u, string.format(PW.T("ui.admin.missing"), "PW.spawner"))
      end
    elseif opt.act == "despawn" then
      if PW.spawner and PW.spawner.despawn_all then
        PW.spawner.despawn_all()
        done(u, "despawn all")
      else
        ui.msg(u, string.format(PW.T("ui.admin.missing"), "PW.spawner.despawn_all"))
      end
    elseif opt.act == "save" then
      if PW.store and PW.store.save_all then
        PW.store.save_all()
        done(u, "save all")
      elseif PW.store and PW.store.all and PW.store.save then
        for id in pairs(PW.store.all() or {}) do PW.store.save(id) end
        done(u, "save all")
      else
        ui.msg(u, string.format(PW.T("ui.admin.missing"), "PW.store.save_all"))
      end
    end
  end)
end

-- ============ Đăng ký lệnh ============
PW.pending_commands = PW.pending_commands or {}

table.insert(PW.pending_commands, {
  name = "gm", gm = true,
  desc = "Bảng GM: .gm panel",
  fn = function(uid, args)
    local sub = args and args[1]
    if sub == "panel" or sub == nil then
      A.open(uid)
    end
  end,
})
