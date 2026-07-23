-- PokeWorld | 60_ui/66_ui_shop.lua | Giao diện cửa hàng: mua theo số lượng, bán lại từ túi
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["ui.shop.title"] = "Cửa hàng — bạn có %d₽",
  ["ui.shop.buy"] = "Mua",
  ["ui.shop.sell"] = "Bán",
  ["ui.shop.pick_buy"] = "Mua gì?",
  ["ui.shop.pick_qty"] = "Mua %s — số lượng?",
  ["ui.shop.pick_sell"] = "Bán gì?",
  ["ui.shop.bought"] = "Đã mua %d %s với giá %d₽.",
  ["ui.shop.sold"] = "Đã bán %d %s, nhận %d₽.",
  ["ui.shop.no_money"] = "Không đủ tiền (cần %d₽).",
  ["ui.shop.nothing_sell"] = "Không có gì để bán.",
  ["ui.shop.not_here"] = "Cửa hàng chỉ mở gần Mart (thị trấn).",
  ["ui.shop.debug_zone"] = "[debug] Chưa có hệ thống zone — cho phép mở shop.",
  ["ui.shop.qty_all"] = "Tất cả (%d)",
}

PW.ui = PW.ui or {}
PW.ui.shop = PW.ui.shop or {}
local S = PW.ui.shop

local PANEL = "pw_shop"

local function item_def(id) return PW.items and PW.items[id] end
local function item_name(id)
  local d = item_def(id)
  return (d and d.name) or tostring(id)
end

-- Danh mục bán: mọi item có price, trừ kind="held"
local function catalog()
  local out = {}
  for id, d in pairs(PW.items or {}) do
    if d.price and d.price > 0 and d.kind ~= "held" then
      out[#out + 1] = { id = id, price = d.price }
    end
  end
  table.sort(out, function(a, b)
    if a.price ~= b.price then return a.price < b.price end
    return tostring(a.id) < tostring(b.id)
  end)
  return out
end

-- Cộng tiền / trừ tiền qua PW.economy (guard nil, fallback trực tiếp)
local function add_money(uid, amount, reason)
  if PW.economy and PW.economy.add then
    PW.economy.add(uid, amount, reason)
  else
    local pl = PW.store.get(uid)
    pl.money = (pl.money or 0) + amount
    if PW.store.save then PW.store.save(uid) end
  end
end

local function spend_money(uid, amount)
  if PW.economy and PW.economy.spend then
    return PW.economy.spend(uid, amount)
  end
  local pl = PW.store.get(uid)
  if (pl.money or 0) < amount then return false end
  pl.money = pl.money - amount
  if PW.store.save then PW.store.save(uid) end
  return true
end

-- Chọn số lượng rồi mua
local function buy_qty(uid, id, price)
  local ui = PW.ui_common
  local opts = {
    { label = "x1 (" .. price .. "₽)", qty = 1 },
    { label = "x5 (" .. (price * 5) .. "₽)", qty = 5 },
    { label = "x10 (" .. (price * 10) .. "₽)", qty = 10 },
  }
  ui.menu(uid, string.format(PW.T("ui.shop.pick_qty"), item_name(id)), opts, function(u, _, opt)
    local cost = price * opt.qty
    if not spend_money(u, cost) then
      ui.msg(u, string.format(PW.T("ui.shop.no_money"), cost))
      return
    end
    local pl = PW.store.get(u)
    pl.bag = pl.bag or {}
    pl.bag[id] = (pl.bag[id] or 0) + opt.qty
    if PW.store.save then PW.store.save(u) end
    ui.msg(u, string.format(PW.T("ui.shop.bought"), opt.qty, item_name(id), cost))
  end)
end

-- Menu mua
local function open_buy(uid)
  local ui = PW.ui_common
  local list = catalog()
  local opts = {}
  for i = 1, #list do
    local e = list[i]
    opts[#opts + 1] = { label = string.format("%s — %d₽", item_name(e.id), e.price), id = e.id, price = e.price }
  end
  ui.menu(uid, PW.T("ui.shop.pick_buy"), opts, function(u, _, opt)
    buy_qty(u, opt.id, opt.price)
  end)
end

-- Menu bán: item trong bag có giá sell (hoặc price/2)
local function open_sell(uid)
  local ui = PW.ui_common
  local player = PW.store.get(uid)
  local opts = {}
  for id, count in pairs(player.bag or {}) do
    local d = item_def(id)
    local sell = d and (d.sell or (d.price and math.floor(d.price / 2)))
    if count > 0 and sell and sell > 0 then
      opts[#opts + 1] = { label = string.format("%s x%d — %d₽/cái", item_name(id), count, sell), id = id, sell = sell, count = count }
    end
  end
  if #opts == 0 then
    ui.msg(uid, PW.T("ui.shop.nothing_sell"))
    return
  end
  table.sort(opts, function(a, b) return tostring(a.id) < tostring(b.id) end)
  ui.menu(uid, PW.T("ui.shop.pick_sell"), opts, function(u, _, opt)
    -- Chọn số lượng bán
    local qopts = { { label = "x1", qty = 1 } }
    if opt.count >= 5 then qopts[#qopts + 1] = { label = "x5", qty = 5 } end
    if opt.count >= 10 then qopts[#qopts + 1] = { label = "x10", qty = 10 } end
    qopts[#qopts + 1] = { label = string.format(PW.T("ui.shop.qty_all"), opt.count), qty = opt.count }
    ui.menu(u, item_name(opt.id), qopts, function(u2, _, q)
      local pl = PW.store.get(u2)
      local have = (pl.bag and pl.bag[opt.id]) or 0
      local qty = math.min(q.qty, have)
      if qty <= 0 then return end
      local gain = opt.sell * qty
      pl.bag[opt.id] = have - qty
      if pl.bag[opt.id] <= 0 then pl.bag[opt.id] = nil end
      add_money(u2, gain, "shop_sell")
      if PW.store.save then PW.store.save(u2) end
      ui.msg(u2, string.format(PW.T("ui.shop.sold"), qty, item_name(opt.id), gain))
    end)
  end)
end

-- Mở shop
function S.open(uid)
  local ui = PW.ui_common
  local player = PW.store.get(uid)
  ui.open_panel(uid, PANEL, nil)
  local opts = {
    { label = PW.T("ui.shop.buy"), act = "buy" },
    { label = PW.T("ui.shop.sell"), act = "sell" },
  }
  ui.menu(uid, string.format(PW.T("ui.shop.title"), player.money or 0), opts, function(u, _, opt)
    if opt.act == "buy" then open_buy(u) else open_sell(u) end
  end)
end

-- ============ Đăng ký lệnh ============
PW.pending_commands = PW.pending_commands or {}

table.insert(PW.pending_commands, {
  name = "shop",
  desc = "Mở cửa hàng (chỉ gần Mart)",
  fn = function(uid)
    -- Check zone town_1, guard nil
    if PW.zones and PW.zones.at then
      local z = PW.zones.at(uid)
      if z ~= "town_1" then
        PW.ui_common.msg(uid, PW.T("ui.shop.not_here"))
        return
      end
    else
      PW.ui_common.msg(uid, PW.T("ui.shop.debug_zone"))
    end
    S.open(uid)
  end,
})
