-- PokeWorld | 00_core/02_log.lua | Logger có cấp độ, tắt được khi release
local PW = _G.PW or {}; _G.PW = PW

local LEVELS = { debug = 1, info = 2, warn = 3 }

local log = { level = LEVELS[(PW.config and PW.config.LOG_LEVEL) or "info"] or 2 }
PW.log = log

local function emit(tag, fmt, ...)
  local msg = fmt
  if select("#", ...) > 0 then
    local ok, res = pcall(string.format, fmt, ...)
    msg = ok and res or (fmt .. " [format error]")
  end
  local line = "[PW][" .. tag .. "] " .. tostring(msg)
  -- CREATA-API: Dev console log — dùng print, editor sẽ hiện trong log panel
  print(line)
end

function log.set_level(name)
  log.level = LEVELS[name] or log.level
end

function log.debug(fmt, ...) if log.level <= 1 then emit("DBG", fmt, ...) end end
function log.info(fmt, ...)  if log.level <= 2 then emit("INF", fmt, ...) end end
function log.warn(fmt, ...)  if log.level <= 3 then emit("WRN", fmt, ...) end end
