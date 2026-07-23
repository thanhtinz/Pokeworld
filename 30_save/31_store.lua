-- PokeWorld | 30_save/31_store.lua | Wrapper Archive/Cloud API của CREATA: save/load/cache
local PW = _G.PW or {}; _G.PW = PW

local store = {}
PW.store = store

local cache = {}       -- uid -> player data đang load trong RAM
local dirty = {}       -- uid -> true (có thay đổi chưa lưu)
local KEY_PREFIX = "pw_save_"

-- ==== Adapter Archive/Cloud của CREATA ====
-- CREATA-API: Archive:setValue(key, str) / Archive:getValue(key)
-- (tên thật cần đối chiếu docs CREATA — Cloud/Archive/DataStorage)
local function raw_write(key, str)
  if _G.Archive and Archive.setValue then
    local ok, err = pcall(Archive.setValue, key, str)
    if not ok then PW.log.warn("store: ghi Archive loi: %s", tostring(err)) end
    return ok
  end
  -- Fallback dev (chưa map API): giữ trong bảng RAM để test offline
  store._dev_mem = store._dev_mem or {}
  store._dev_mem[key] = str
  return true
end

local function raw_read(key)
  if _G.Archive and Archive.getValue then
    local ok, res = pcall(Archive.getValue, key)
    if ok then return res end
    PW.log.warn("store: doc Archive loi: %s", tostring(res))
    return nil
  end
  store._dev_mem = store._dev_mem or {}
  return store._dev_mem[key]
end
-- ==========================================

-- Lấy data người chơi (load từ Archive lần đầu, sau đó cache)
function store.get(uid)
  uid = tostring(uid)
  if cache[uid] then return cache[uid] end
  local raw = raw_read(KEY_PREFIX .. uid)
  local data
  if raw and raw ~= "" then
    local decoded, err = PW.ser.decode(raw)
    if decoded then
      data = PW.playerdata.migrate(decoded)
      PW.log.info("store: load save cua %s (v%d)", uid, data.v)
    else
      PW.log.warn("store: save cua %s hong (%s) — tao moi", uid, tostring(err))
      data = PW.playerdata.default()
    end
  else
    data = PW.playerdata.default()
    PW.log.info("store: nguoi choi moi %s", uid)
  end
  cache[uid] = data
  return data
end

-- Đánh dấu cần lưu (lưu thật theo chu kỳ hoặc khi rời room)
function store.mark_dirty(uid)
  dirty[tostring(uid)] = true
end

-- Lưu ngay 1 người chơi
function store.save(uid)
  uid = tostring(uid)
  local data = cache[uid]
  if not data then return false end
  local str, err = PW.ser.encode(data)
  if not str then
    PW.log.warn("store: encode save %s loi: %s", uid, tostring(err))
    return false
  end
  local ok = raw_write(KEY_PREFIX .. uid, str)
  if ok then dirty[uid] = nil end
  return ok
end

-- Lưu tất cả người chơi đang dirty (gọi định kỳ từ hooks tick)
function store.save_dirty()
  for uid in pairs(dirty) do store.save(uid) end
end

-- Lưu tất cả (khi tắt room / lệnh GM)
function store.save_all()
  for uid in pairs(cache) do store.save(uid) end
end

-- Gỡ khỏi cache khi người chơi rời (lưu trước)
function store.unload(uid)
  uid = tostring(uid)
  store.save(uid)
  cache[uid] = nil
  dirty[uid] = nil
end

-- Duyệt mọi người chơi đang online (cho leaderboard)
function store.all()
  return cache
end

-- Xóa data 1 người (lệnh GM wipe)
function store.wipe(uid)
  uid = tostring(uid)
  cache[uid] = PW.playerdata.default()
  dirty[uid] = true
  store.save(uid)
end
