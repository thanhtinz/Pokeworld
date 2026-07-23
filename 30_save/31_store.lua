-- PokeWorld | 30_save/31_store.lua | Wrapper Archive/Cloud API của CREATA: save/load/cache
local PW = _G.PW or {}; _G.PW = PW

local store = {}
PW.store = store

local cache = {}       -- uid -> player data đang load trong RAM
local dirty = {}       -- uid -> true (có thay đổi chưa lưu)
local KEY_PREFIX = "pw_save_"

-- ==== Adapter lưu trữ K/V của CREATA ====
-- CREATA-API: CloudSever (script 2.0) — kho K/V dạng bảng dữ liệu:
--   CloudSever:SetDataListBykey(key, value)            — ghi theo key
--   CloudSever:GetDataListByKey(key, callback)         — đọc ASYNC, callback(ret, k, v)
--                                                        ret: 0 thành công, 2 chưa có data
--   (bảng xếp hạng: setOrderDataBykey / getOrderDataByKeyEx / getOrderDataIndexArea)
-- LƯU Ý QUAN TRỌNG:
--   1. Data chỉ bền vững khi map chạy trên PHÒNG CLOUD SERVER; phòng thường/solo
--      data mất khi đóng room (docs "K/V存储和排行榜").
--   2. UGC 3.0 dùng interface Data.Map thay CloudSever — KHÔNG trộn 2 loại
--      (docs cảnh báo mất data). Nếu map của bạn là UGC 3.0, sửa 2 hàm dưới.
-- Tên method thử theo vài biến thể hoa/thường vì docs ghi không nhất quán.
local WRITE_METHODS = { "SetDataListBykey", "setDataListBykey", "SetDataListByKey", "setDataListByKey" }
local READ_METHODS  = { "GetDataListByKey", "getDataListByKey", "GetDataListBykey", "getDataListBykey" }

local function cloud_obj()
  return _G.CloudSever or _G.CloudServer
end

local function raw_write(key, str)
  local cs = cloud_obj()
  if cs then
    for _, m in ipairs(WRITE_METHODS) do
      if cs[m] then
        local ok, err = pcall(cs[m], cs, key, str)
        if ok then return true end
        PW.log.warn("store: CloudSever:%s loi: %s", m, tostring(err))
      end
    end
  end
  -- Fallback dev / phòng thường: giữ trong RAM để test
  store._dev_mem = store._dev_mem or {}
  store._dev_mem[key] = str
  return true
end

-- Đọc async: cb(str|nil) được gọi khi có kết quả (có thể gọi ngay ở chế độ dev).
local function raw_read_async(key, cb)
  local cs = cloud_obj()
  if cs then
    for _, m in ipairs(READ_METHODS) do
      if cs[m] then
        local ok, err = pcall(cs[m], cs, key, function(ret, k, v)
          if ret == 0 and type(v) == "string" and v ~= "" then cb(v) else cb(nil) end
        end)
        if ok then return end
        PW.log.warn("store: CloudSever:%s loi: %s", m, tostring(err))
      end
    end
  end
  store._dev_mem = store._dev_mem or {}
  cb(store._dev_mem[key])
end
-- ==========================================

-- Lấy data người chơi. Lần đầu trả về default ngay lập tức rồi đọc cloud ASYNC;
-- khi cloud trả về, merge vào ĐÚNG bảng đang cache (giữ tham chiếu mà caller cầm).
function store.get(uid)
  uid = tostring(uid)
  if cache[uid] then return cache[uid] end
  local data = PW.playerdata.default()
  cache[uid] = data
  raw_read_async(KEY_PREFIX .. uid, function(raw)
    if not raw or raw == "" then
      PW.log.info("store: nguoi choi moi %s", uid)
      return
    end
    local decoded, err = PW.ser.decode(raw)
    if not decoded then
      PW.log.warn("store: save cua %s hong (%s) — dung default", uid, tostring(err))
      return
    end
    local migrated = PW.playerdata.migrate(decoded)
    if dirty[uid] then
      -- Người chơi đã kịp thay đổi data trước khi cloud trả về (hiếm):
      -- vẫn ưu tiên save cloud (dữ liệu tích lũy từ các phiên trước)
      PW.log.warn("store: cloud tra ve muon cho %s — ghi de thay doi tam", uid)
    end
    for k in pairs(data) do data[k] = nil end
    for k, v in pairs(migrated) do data[k] = v end
    PW.log.info("store: load save cua %s (v%d)", uid, data.v or 0)
  end)
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
