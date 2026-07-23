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

-- Ấp trứng theo bước chân (Player.MoveOneBlockSize)
PW.loc = PW.loc or {}
PW.loc["breed.hatched"] = PW.loc["breed.hatched"] or "Trứng nở rồi! %s chào đời!"
hooks.on("player_step", function(uid)
  local p = PW.store.get(uid)
  if not p or not p.eggs or #p.eggs == 0 then return end
  for i = #p.eggs, 1, -1 do
    if PW.breeding.step(p.eggs[i], 1) then
      local egg = table.remove(p.eggs, i)
      local info = PW.online[tostring(uid)]
      local mon = PW.breeding.hatch(egg, uid, info and info.name)
      if mon then
        PW.party.add(p, mon)
        if PW.dex then PW.dex.mark_caught(p, mon.sp) end
        PW.creata.send(uid, PW.T("breed.hatched", PW.pokemon.name(mon)))
      end
      PW.store.mark_dirty(uid)
    end
  end
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
  -- CREATA-API: ScriptSupportEvent:registerEvent(ten_event, fn) — đã xác minh từ docs/script mẫu
  local SSE = _G.ScriptSupportEvent
  if not (SSE and SSE.registerEvent) then
    PW.log.warn("hooks: chua map API event CREATA — chay che do offline/dev")
    return false
  end
  local function reg(ev_name, fn)
    local ok, err = pcall(SSE.registerEvent, SSE, ev_name, fn)
    if not ok then PW.log.warn("hooks: dang ky %s loi: %s", ev_name, tostring(err)) end
  end

  -- Người chơi vào/rời room
  reg("Game.AnyPlayer.EnterGame", function(e)
    hooks.emit("join", e.eventobjid, PW.creata.player_name(e.eventobjid))
  end)
  reg("Game.AnyPlayer.LeaveGame", function(e)
    hooks.emit("leave", e.eventobjid)
  end)

  -- Chat: e.content là nội dung người chơi gõ
  reg("Player.NewInputContent", function(e)
    local name = (PW.online[tostring(e.eventobjid)] or {}).name or PW.creata.player_name(e.eventobjid)
    hooks.emit("chat", e.eventobjid, name, e.content)
  end)

  -- Người chơi click vào sinh vật: e.targetactorid là objid sinh vật bị click
  reg("Player.ClickActor", function(e)
    hooks.emit("touch_actor", e.eventobjid, e.targetactorid)
  end)

  -- Tick định kỳ của game (Game.RunTime bắn theo giây chạy game)
  local last_sec = -1
  reg("Game.RunTime", function(e)
    local sec = e and e.second
    if sec == nil or sec ~= last_sec then
      last_sec = sec or last_sec
      hooks.emit("tick_second")
    end
  end)

  -- Người chơi đi được 1 block: dùng đếm bước ấp trứng (27_breeding)
  reg("Player.MoveOneBlockSize", function(e)
    hooks.emit("player_step", e.eventobjid)
  end)

  -- Vào/ra vùng Area tạo trong editor (tùy chọn — nếu map dùng Area thay
  -- bounding box của 43_zones thì map areaid -> zone id tại đây)
  reg("Player.AreaIn",  function(e) hooks.emit("area_in", e.eventobjid, e.areaid) end)
  reg("Player.AreaOut", function(e) hooks.emit("area_out", e.eventobjid, e.areaid) end)

  -- Click button trong Custom UI (UI editor). Tên field id element khác nhau
  -- giữa các bản docs — thử lần lượt các biến thể đã thấy.
  reg("UI.Button.Click", function(e)
    local element_id = e.uielement or e.btnelement or e.elementid or e.uielementid
    hooks.emit("ui_click", e.eventobjid, element_id)
  end)

  -- Khởi động game
  reg("Game.Start", function() hooks.emit("game_start") end)
  return true
end

-- Vòng tick fallback cho môi trường dev (không có engine): 99_init/harness gọi tay
function hooks.dev_tick()
  hooks.emit("tick_second")
end
