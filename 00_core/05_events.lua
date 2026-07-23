-- PokeWorld | 00_core/05_events.lua | Registry event nội bộ (on/emit) — load sớm để mọi module đăng ký được
local PW = _G.PW or {}; _G.PW = PW

local hooks = {}
PW.hooks = hooks

local listeners = {} -- event -> { fn, fn, ... }

-- Đăng ký listener cho event nội bộ
-- Event chuẩn: "join","leave","chat","touch_actor","tick_second","day_phase","player_move_zone"
function hooks.on(event, fn)
  listeners[event] = listeners[event] or {}
  table.insert(listeners[event], fn)
end

-- Phát event tới mọi listener (lỗi 1 listener không làm sập listener khác)
function hooks.emit(event, ...)
  for _, fn in ipairs(listeners[event] or {}) do
    local ok, err = pcall(fn, ...)
    if not ok and PW.log then PW.log.warn("hook %s loi: %s", event, tostring(err)) end
  end
end

-- Stub đăng ký lệnh: gom vào hàng đợi, router thật (90_commands) sẽ nạp lại
-- và thay thế register bằng bản chính khi load tới.
PW.pending_commands = PW.pending_commands or {}
PW.commands = PW.commands or {
  register = function(def) table.insert(PW.pending_commands, def) end,
}
