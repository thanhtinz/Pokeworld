-- PokeWorld | 60_ui/60_ui_common.lua | Adapter UI CREATA + helper chung (menu, phân trang, thanh HP)
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["ui.common.menu_hint"] = "Gõ số để chọn (vd: 1)",
  ["ui.common.invalid_choice"] = "Lựa chọn không hợp lệ.",
  ["ui.common.no_menu"] = "Không có menu nào đang mở.",
  ["ui.common.page"] = "Trang %d/%d",
}

PW.ui_common = PW.ui_common or {}
local C = PW.ui_common

-- Hàng đợi menu đang chờ trả lời: uid -> {options=, cb=}
C.pending_menu = C.pending_menu or {}

-- ============ Adapter CREATA (ủy quyền PW.creata) ============

-- Gửi text tới 1 người chơi
-- CREATA-API: PW.creata.send(uid, text)
function C.msg(uid, text)
  if text == nil then return end
  PW.creata.send(uid, text)
end

-- Mở custom UI panel (panel_id chính là uiid trong editor)
-- CREATA-API: PW.creata.open_ui(uid, uiid)
function C.open_panel(uid, panel_id, data)
  if PW.creata.open_ui(uid, panel_id) then return true end
  -- Fallback: không có UI engine, caller tự render qua chat
  return false
end

-- Đóng custom UI panel
-- CREATA-API: PW.creata.hide_ui(uid, uiid)
function C.close_panel(uid, panel_id)
  if PW.creata.hide_ui(uid, panel_id) then return true end
  return false
end

-- ============ Menu chọn ============

-- Hiển thị menu: options = { {label=, ...}, ... } hoặc mảng chuỗi
-- cb(uid, index, option) được gọi khi người chơi chọn
function C.menu(uid, title, options, cb)
  if not options or #options == 0 then return end
  -- CREATA-API: UI:showMenu(uid, title, labels) — chưa có, dùng fallback chat
  local lines = { "== " .. tostring(title) .. " ==" }
  for i = 1, #options do
    local o = options[i]
    local label = (type(o) == "table") and (o.label or tostring(o[1])) or tostring(o)
    lines[#lines + 1] = string.format("%d. %s", i, label)
  end
  lines[#lines + 1] = PW.T and PW.T("ui.common.menu_hint") or "Gõ số để chọn"
  C.msg(uid, table.concat(lines, "\n"))
  C.pending_menu[uid] = { options = options, cb = cb }
end

-- Router chat gọi khi người chơi gõ 1 số
function C.on_menu_reply(uid, n)
  local pm = C.pending_menu[uid]
  if not pm then
    C.msg(uid, PW.T and PW.T("ui.common.no_menu") or "Không có menu nào đang mở.")
    return false
  end
  n = tonumber(n)
  if not n or n < 1 or n > #pm.options or n ~= math.floor(n) then
    C.msg(uid, PW.T and PW.T("ui.common.invalid_choice") or "Lựa chọn không hợp lệ.")
    return false
  end
  -- Xóa menu trước khi gọi cb (cb có thể mở menu mới)
  C.pending_menu[uid] = nil
  local opt = pm.options[n]
  if pm.cb then
    local ok, err = pcall(pm.cb, uid, n, opt)
    if not ok and PW.log and PW.log.warn then PW.log.warn("menu cb error: " .. tostring(err)) end
  end
  return true
end

-- Hủy menu đang chờ của 1 người chơi
function C.cancel_menu(uid)
  C.pending_menu[uid] = nil
end

-- ============ Router click button UI thật ============
-- Event CREATA "UI.Button.Click" (91_hooks đăng ký, emit "ui_click" nội bộ).
-- Các màn UI gọi C.bind_button("<elementid>", fn(uid)) để nhận click từ
-- button vẽ trong UI editor. elementid là id element cấu hình trong editor.

local button_routes = {}

function C.bind_button(element_id, fn)
  button_routes[tostring(element_id)] = fn
end

PW.hooks.on("ui_click", function(uid, element_id)
  local fn = button_routes[tostring(element_id)]
  if not fn then return end
  local ok, err = pcall(fn, uid)
  if not ok and PW.log then PW.log.warn("ui_click %s loi: %s", tostring(element_id), tostring(err)) end
end)

-- Bind sẵn bộ button chuẩn: trong UI editor chỉ cần đặt id element trùng
-- các tên dưới đây là hoạt động, không phải sửa script.
local function open_screen(mod, fn_name)
  return function(uid)
    local m = PW.ui and PW.ui[mod]
    if m and m[fn_name or "open"] then m[fn_name or "open"](uid) end
  end
end
C.bind_button("btn_party", open_screen("party"))
C.bind_button("btn_bag",   open_screen("bag"))
C.bind_button("btn_dex",   open_screen("dex"))
C.bind_button("btn_quest", open_screen("quest"))
C.bind_button("btn_pc",    open_screen("pc"))
C.bind_button("btn_shop",  open_screen("shop"))

-- Button trong trận: btn_move_1..4, btn_switch, btn_bag_battle, btn_run
for i = 1, 4 do
  C.bind_button("btn_move_" .. i, function(uid)
    if PW.battle_ctrl then PW.battle_ctrl.submit(uid, { t = "move", i = i }) end
  end)
end
C.bind_button("btn_run", function(uid)
  if PW.battle_ctrl then PW.battle_ctrl.submit(uid, { t = "run" }) end
end)
C.bind_button("btn_bag_battle", function(uid)
  if PW.ui and PW.ui.bag and PW.ui.bag.open_in_battle then PW.ui.bag.open_in_battle(uid) end
end)
C.bind_button("btn_switch", function(uid)
  if PW.ui and PW.ui.party then PW.ui.party.open(uid) end
end)

-- ============ Helper ============

-- Cắt trang: trả về slice, total_pages
function C.paginate(list, page, per)
  list = list or {}
  per = per or 10
  local total = math.max(1, math.ceil(#list / per))
  page = math.max(1, math.min(page or 1, total))
  local out = {}
  local from = (page - 1) * per + 1
  for i = from, math.min(from + per - 1, #list) do
    out[#out + 1] = list[i]
  end
  return out, total
end

-- Thanh HP 10 ký tự: "[████░░░░░░] 34/60"
function C.hp_bar(cur, max)
  cur = tonumber(cur) or 0
  max = tonumber(max) or 1
  if max < 1 then max = 1 end
  if cur < 0 then cur = 0 end
  if cur > max then cur = max end
  local filled = math.floor(cur / max * 10 + 0.5)
  if cur > 0 and filled == 0 then filled = 1 end -- còn máu thì luôn hiện ít nhất 1 ô
  local bar = string.rep("█", filled) .. string.rep("░", 10 - filled)
  return string.format("[%s] %d/%d", bar, cur, max)
end
