-- PokeWorld | 90_main/91_hooks.lua | Đăng ký toàn bộ event game: join, chat, touch, tick
local PW = _G.PW or {}; _G.PW = PW

-- Registry on/emit đã định nghĩa ở 00_core/05_events.lua — file này chỉ bổ sung
-- handler mặc định + cầu nối engine CREATA.
local hooks = PW.hooks

-- Nạp hàng đợi hook do các module dùng pattern pending (nếu có) trước khi file này load
for _, h in ipairs(PW.pending_hooks or {}) do hooks.on(h.event, h.fn) end
PW.pending_hooks = setmetatable({}, { __newindex = function(_, _, h) hooks.on(h.event, h.fn) end })

-- Danh sách người chơi online: uid -> { name=, joined_at= }
PW.online = PW.online or {}

-- ==== Xử lý mặc định của engine ====

hooks.on("join", function(uid, name)
  PW.online[tostring(uid)] = { name = name or tostring(uid), joined_at = os.time() }
  PW.store.get(uid) -- load save vào cache
  PW.log.info("join: %s (%s)", tostring(name), tostring(uid))
end)

hooks.on("leave", function(uid)
  PW.store.unload(uid) -- tự save trước khi gỡ
  PW.online[tostring(uid)] = nil
  PW.log.info("leave: %s", tostring(uid))
end)

hooks.on("chat", function(uid, name, text)
  return PW.commands.handle_chat(uid, name, text)
end)

-- Autosave mỗi 60 giây + cộng playtime
local autosave_counter = 0
hooks.on("tick_second", function()
  autosave_counter = autosave_counter + 1
  if autosave_counter >= 60 then
    autosave_counter = 0
    PW.store.save_dirty()
    for uid in pairs(PW.online) do
      local p = PW.store.get(uid)
      p.playtime = (p.playtime or 0) + 60
    end
  end
end)

-- ==== Cầu nối với engine CREATA ====
-- Các callback thật của CREATA gọi vào hooks.emit. Tên API cần đối chiếu docs.
-- Gói trong hàm bind để 99_init gọi sau khi mọi module load xong.
function hooks.bind_engine()
  -- CREATA-API: ScriptSupportEvent:registerEvent("Player.Join", fn)
  local SSE = _G.ScriptSupportEvent
  if not (SSE and SSE.registerEvent) then
    PW.log.warn("hooks: chua map API event CREATA — chay che do offline/dev")
    return false
  end
  local function reg(ev_name, fn)
    local ok, err = pcall(SSE.registerEvent, SSE, ev_name, fn)
    if not ok then PW.log.warn("hooks: dang ky %s loi: %s", ev_name, tostring(err)) end
  end
  -- CREATA-API: tên event dưới đây là dự kiến, chỉnh theo docs thật
  reg("Player.Join",       function(e) hooks.emit("join", e.eventobjid, e.playername) end)
  reg("Player.Leave",      function(e) hooks.emit("leave", e.eventobjid) end)
  reg("Player.NewInputContent", function(e) hooks.emit("chat", e.eventobjid, e.playername, e.content) end)
  reg("Actor.ClickActor",  function(e) hooks.emit("touch_actor", e.eventobjid, e.actorid) end)
  reg("Game.RunTime",      function() hooks.emit("tick_second") end)
  return true
end

-- Vòng tick fallback cho môi trường dev (không có engine): 99_init/harness gọi tay
function hooks.dev_tick()
  hooks.emit("tick_second")
end
