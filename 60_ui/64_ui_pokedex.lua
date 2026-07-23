-- PokeWorld | 60_ui/64_ui_pokedex.lua | Giao diện Pokédex: danh sách seen/caught và chi tiết loài
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["ui.dex.title"] = "Pokédex — thấy %d / bắt %d",
  ["ui.dex.next_page"] = "Trang sau",
  ["ui.dex.prev_page"] = "Trang trước",
  ["ui.dex.not_caught"] = "Bạn chưa bắt được loài này, không xem chi tiết được.",
  ["ui.dex.detail_types"] = "Hệ: %s",
  ["ui.dex.detail_stats"] = "Chỉ số gốc: %s",
  ["ui.dex.evo_chain"] = "Tiến hóa: %s",
  ["ui.dex.evo_none"] = "Không tiến hóa.",
}

PW.ui = PW.ui or {}
PW.ui.dex = PW.ui.dex or {}
local D = PW.ui.dex

local PANEL = "pw_dex"
local PER_PAGE = 10

local function sp_name(dex)
  local sp = PW.species and PW.species[dex]
  return (sp and sp.name) or ("#" .. tostring(dex))
end

-- Danh sách dex đã sắp xếp của mọi loài có trong data
local function all_dex()
  local out = {}
  for dex in pairs(PW.species or {}) do out[#out + 1] = dex end
  table.sort(out)
  return out
end

-- Chuỗi tiến hóa từ PW.evolutions: đi tới hết nhánh (lấy nhánh đầu)
local function evo_chain_str(dex)
  local parts = { sp_name(dex) }
  local cur = dex
  local guard = 0
  while guard < 6 do
    guard = guard + 1
    local evos = PW.evolutions and PW.evolutions[cur]
    if not evos then break end
    -- evos có thể là mảng entry hoặc entry đơn {to=...}
    local entry = evos[1] or evos
    local nxt = entry and (entry.to or entry.into)
    if not nxt then break end
    parts[#parts + 1] = sp_name(nxt)
    cur = nxt
  end
  if #parts <= 1 then return nil end
  return table.concat(parts, " → ")
end

-- Chi tiết 1 loài đã bắt
local function show_detail(uid, dex)
  local ui = PW.ui_common
  local sp = PW.species and PW.species[dex]
  if not sp then return end
  local lines = { string.format("== #%03d %s ==", dex, sp_name(dex)) }
  if sp.types then
    lines[#lines + 1] = string.format(PW.T("ui.dex.detail_types"), table.concat(sp.types, "/"))
  end
  local base = sp.base or sp.stats
  if base then
    local labels = { "HP", "Atk", "Def", "SpA", "SpD", "Spe" }
    local keys = { "hp", "atk", "def", "spa", "spd", "spe" }
    local parts = {}
    for i = 1, 6 do
      local v = base[i] or base[keys[i]]
      if v then parts[#parts + 1] = labels[i] .. " " .. tostring(v) end
    end
    lines[#lines + 1] = string.format(PW.T("ui.dex.detail_stats"), table.concat(parts, " | "))
  end
  local chain = evo_chain_str(dex)
  if chain then
    lines[#lines + 1] = string.format(PW.T("ui.dex.evo_chain"), chain)
  else
    lines[#lines + 1] = PW.T("ui.dex.evo_none")
  end
  ui.msg(uid, table.concat(lines, "\n"))
end

-- Mở Pokédex ở trang page
function D.open(uid, page)
  local ui = PW.ui_common
  local player = PW.store.get(uid)
  local pdex = player.dex or { seen = {}, caught = {} }
  local seen_n, caught_n = 0, 0
  if PW.dex and PW.dex.counts then
    seen_n, caught_n = PW.dex.counts(player)
  else
    for _ in pairs(pdex.seen or {}) do seen_n = seen_n + 1 end
    for _ in pairs(pdex.caught or {}) do caught_n = caught_n + 1 end
  end

  local list = all_dex()
  local slice, total = ui.paginate(list, page, PER_PAGE)
  page = math.max(1, math.min(page or 1, total))

  ui.open_panel(uid, PANEL, nil)
  local opts = {}
  for i = 1, #slice do
    local dex = slice[i]
    -- Icon: ✓ đã bắt, ● đã thấy, — chưa gặp
    local icon, name = "—", "???"
    if (pdex.caught or {})[dex] then
      icon, name = "✓", sp_name(dex)
    elseif (pdex.seen or {})[dex] then
      icon, name = "●", sp_name(dex)
    end
    opts[#opts + 1] = { label = string.format("%s #%03d %s", icon, dex, name), dex = dex, act = "mon" }
  end
  if page < total then opts[#opts + 1] = { label = PW.T("ui.dex.next_page"), act = "next" } end
  if page > 1 then opts[#opts + 1] = { label = PW.T("ui.dex.prev_page"), act = "prev" } end

  local title = string.format(PW.T("ui.dex.title"), seen_n, caught_n)
    .. " " .. string.format(PW.T("ui.common.page"), page, total)
  ui.menu(uid, title, opts, function(u, _, opt)
    if opt.act == "next" then
      D.open(u, page + 1)
    elseif opt.act == "prev" then
      D.open(u, page - 1)
    elseif opt.act == "mon" then
      local pl = PW.store.get(u)
      if (pl.dex and pl.dex.caught or {})[opt.dex] then
        show_detail(u, opt.dex)
      else
        ui.msg(u, PW.T("ui.dex.not_caught"))
      end
    end
  end)
end

-- ============ Đăng ký lệnh ============
PW.pending_commands = PW.pending_commands or {}

table.insert(PW.pending_commands, {
  name = "dex", aliases = { "pokedex" },
  desc = "Mở Pokédex",
  fn = function(uid, args)
    D.open(uid, tonumber(args and args[1]) or 1)
  end,
})
