-- PokeWorld | 00_core/06_creata.lua | Adapter trung tâm cho API engine Mini World: CREATA
-- Toàn bộ tên API dưới đây lấy từ docs developer + script mẫu cộng đồng:
--   ScriptSupportEvent:registerEvent, Chat:sendSystemMsg, Player:getPosition,
--   Player:notifyGameInfo2Self, Player:openUIView/hideUIView, Customui:setText,
--   World:spawnCreature/despawnCreature, Actor:tryMoveToPos/setPosition/killSelf...
-- Mọi hàm đều guard nil + pcall: chưa chạy trong CREATA thì degrade về log/print
-- để test offline bằng tools/harness.lua.
local PW = _G.PW or {}; _G.PW = PW

local creata = {}
PW.creata = creata

-- Có đang chạy trong engine CREATA thật không?
function creata.available()
  return _G.ScriptSupportEvent ~= nil
end

local function try(obj_name, method, ...)
  local obj = _G[obj_name]
  local fn = obj and obj[method]
  if not fn then return false end
  local res = { pcall(fn, obj, ...) }
  if not res[1] then
    if PW.log then PW.log.warn("creata: %s:%s loi: %s", obj_name, method, tostring(res[2])) end
    return false
  end
  return true, unpack(res, 2)
end

-- ==== Chat / thông báo ====

-- Gửi tin hệ thống tới 1 người chơi (objid). CREATA-API: Chat:sendSystemMsg(text, objid)
function creata.send(uid, text)
  if try("Chat", "sendSystemMsg", text, uid) then return true end
  print("[PW->" .. tostring(uid) .. "] " .. tostring(text))
  return false
end

-- Gửi tin cho cả room. CREATA-API: Chat:sendSystemMsg(text) (không kèm objid)
function creata.broadcast(text)
  if try("Chat", "sendSystemMsg", text) then return true end
  print("[PW->ALL] " .. tostring(text))
  return false
end

-- Chữ nổi giữa màn hình 1 người chơi. CREATA-API: Player:notifyGameInfo2Self(objid, text)
function creata.notify(uid, text)
  if try("Player", "notifyGameInfo2Self", uid, text) then return true end
  return creata.send(uid, text)
end

-- ==== Người chơi ====

-- CREATA-API: Player:getPosition(objid) -> ret, x, y, z
function creata.player_pos(uid)
  local ok, ret, x, y, z = try("Player", "getPosition", uid)
  if ok and x then return { x = x, y = y, z = z } end
  return nil
end

-- Tên hiển thị. CREATA-API: Player:getNickname(objid) -> ret, name (tên hàm cần xác nhận thêm)
function creata.player_name(uid)
  local ok, ret, name = try("Player", "getNickname", uid)
  if ok and type(name) == "string" then return name end
  local info = PW.online and PW.online[tostring(uid)]
  return info and info.name or tostring(uid)
end

-- Dịch chuyển người chơi. CREATA-API: Actor:setPosition(objid, x, y, z)
function creata.teleport(uid, pos)
  return (try("Actor", "setPosition", uid, pos.x, pos.y, pos.z))
end

-- Khóa/mở di chuyển: CREATA chưa thấy API trực tiếp — dùng buff/thuộc tính tốc độ nếu có.
-- CREATA-API: Actor:setActionAttrState(objid, attr, bool) (cần xác nhận enum attr)
function creata.lock_move(uid, locked)
  return (try("Actor", "setActionAttrState", uid, 1, not locked))
end

-- Phát nhạc/âm thanh cho người chơi. CREATA-API: Player:playMusic(objid, id, vol, pitch, loop)
function creata.play_music(uid, sound_id)
  return (try("Player", "playMusic", uid, sound_id, 100, 1, false))
end

-- ==== Sinh vật / actor ====

-- Spawn sinh vật. CREATA-API: World:spawnCreature(x, y, z, actorid, num) -> ret, objids
function creata.spawn_creature(actor_type_id, pos)
  local ok, ret, objids = try("World", "spawnCreature", pos.x, pos.y, pos.z, actor_type_id, 1)
  if ok and objids then
    -- objids có thể là bảng danh sách id
    if type(objids) == "table" then return objids[1] end
    return objids
  end
  return nil
end

-- Xóa sinh vật. CREATA-API: World:despawnCreature(objid) (hoặc Actor:killSelf(objid))
function creata.despawn(objid)
  if try("World", "despawnCreature", objid) then return true end
  return (try("Actor", "killSelf", objid))
end

-- Di chuyển sinh vật tới điểm. CREATA-API: Actor:tryMoveToPos(objid, x, y, z, speed)
function creata.move_to(objid, pos, speed)
  return (try("Actor", "tryMoveToPos", objid, pos.x, pos.y, pos.z, speed or 1))
end

-- Đặt vị trí actor tức thời. CREATA-API: Actor:setPosition(objid, x, y, z)
function creata.set_pos(objid, pos)
  return (try("Actor", "setPosition", objid, pos.x, pos.y, pos.z))
end

-- Vị trí actor. CREATA-API: Actor:getPosition(objid) -> ret, x, y, z
function creata.actor_pos(objid)
  local ok, ret, x, y, z = try("Actor", "getPosition", objid)
  if ok and x then return { x = x, y = y, z = z } end
  return nil
end

-- Hiệu ứng + âm thanh tại vị trí.
-- CREATA-API: World:playParticalEffect(x,y,z,id,scale) / World:playSoundEffectOnPos(pos,id,vol,pitch,loop)
function creata.effect(pos, particle_id)
  return (try("World", "playParticalEffect", pos.x, pos.y, pos.z, particle_id, 1))
end
function creata.sound(pos, sound_id)
  return (try("World", "playSoundEffectOnPos", { x = pos.x, y = pos.y, z = pos.z }, sound_id, 100, 1, false))
end

-- ==== Thế giới ====

-- Giờ trong game. CREATA-API: World:getHours() -> ret, hour (tên cần xác nhận)
function creata.hours()
  local ok, ret, h = try("World", "getHours")
  if ok then return h or ret end
  return nil
end

-- ==== Custom UI ====
-- UI làm trong editor có UIID; element trong UI có elementid.

-- CREATA-API: Player:openUIView(objid, uiid)
function creata.open_ui(uid, uiid)
  return (try("Player", "openUIView", uid, uiid))
end

-- CREATA-API: Player:hideUIView(objid, uiid)
function creata.hide_ui(uid, uiid)
  return (try("Player", "hideUIView", uid, uiid))
end

-- CREATA-API: Customui:setText(objid, uiid, elementid, text)
function creata.ui_text(uid, uiid, elementid, text)
  return (try("Customui", "setText", uid, uiid, elementid, text))
end

-- ==== Bảng xếp hạng cloud (chỉ hoạt động trên phòng cloud server) ====

local function cloud_try(methods, ...)
  for _, obj_name in ipairs({ "CloudSever", "CloudServer" }) do
    for _, m in ipairs(methods) do
      local r = { try(obj_name, m, ...) }
      if r[1] then return unpack(r) end
    end
  end
  return false
end

-- Ghi điểm xếp hạng theo key (thường key = uid người chơi).
-- CREATA-API: CloudSever:setOrderDataBykey(key, value)
function creata.rank_set(key, value)
  return (cloud_try({ "setOrderDataBykey", "SetOrderDataBykey", "setOrderDataByKey" }, tostring(key), value))
end

-- Lấy 1 dải hạng [start_ix, start_ix+count-1], cb nhận danh sách entry
-- (mỗi entry có k = key, v = điểm kèm v.nick = tên, ix = hạng).
-- CREATA-API: CloudSever:getOrderDataIndexArea(start, count, callback)
function creata.rank_top(start_ix, count, cb)
  return (cloud_try({ "getOrderDataIndexArea", "GetOrderDataIndexArea" }, start_ix, count, cb))
end
