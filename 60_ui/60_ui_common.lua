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

-- ============ Adapter CREATA (stub, chưa map API thật) ============

-- Gửi text tới 1 người chơi
-- CREATA-API: Chat:sendSystemMsg(uid, text) / Player:notify(text)
function C.msg(uid, text)
  if text == nil then return end
  local sent = false
  if _G.Chat and Chat.sendSystemMsg then
    local ok = pcall(Chat.sendSystemMsg, Chat, uid, text)
    sent = ok
  end
  if not sent and _G.Player and Player.notify then
    local ok = pcall(Player.notify, Player, uid, text)
    sent = ok
  end
  if not sent then
    -- Fallback: in ra console host
    pcall(print, "[PW->" .. tostring(uid) .. "] " .. tostring(text))
  end
end

-- Mở custom UI panel
-- CREATA-API: Customui:showUI(uid, panel_id) / UI:createPanel(uid, panel_id, data)
function C.open_panel(uid, panel_id, data)
  if _G.Customui and Customui.showUI then
    local ok = pcall(Customui.showUI, Customui, uid, panel_id, data)
    if ok then return true end
  end
  if _G.UI and UI.createPanel then
    local ok = pcall(UI.createPanel, UI, uid, panel_id, data)
    if ok then return true end
  end
  -- Fallback: không có UI engine, caller tự render qua chat
  return false
end

-- Đóng custom UI panel
-- CREATA-API: Customui:hideUI(uid, panel_id) / UI:closePanel(uid, panel_id)
function C.close_panel(uid, panel_id)
  if _G.Customui and Customui.hideUI then
    local ok = pcall(Customui.hideUI, Customui, uid, panel_id)
    if ok then return true end
  end
  if _G.UI and UI.closePanel then
    local ok = pcall(UI.closePanel, UI, uid, panel_id)
    if ok then return true end
  end
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
