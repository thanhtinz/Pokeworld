-- PokeWorld | 00_core/01_util.lua | Hàm tiện ích dùng chung
local PW = _G.PW or {}; _G.PW = PW

local util = {}
PW.util = util

-- Sao chép sâu 1 bảng (không xử lý vòng lặp tham chiếu — data game không có)
function util.deepcopy(t)
  if type(t) ~= "table" then return t end
  local out = {}
  for k, v in pairs(t) do out[k] = util.deepcopy(v) end
  return out
end

-- Sao chép nông
function util.shallow(t)
  local out = {}
  for k, v in pairs(t) do out[k] = v end
  return out
end

function util.clamp(x, a, b)
  if x < a then return a end
  if x > b then return b end
  return x
end

function util.round(x)
  return math.floor(x + 0.5)
end

-- Tách chuỗi theo ký tự phân cách (mặc định khoảng trắng)
function util.split(s, sep)
  sep = sep or "%s"
  local out = {}
  for tok in string.gmatch(s or "", "([^" .. sep .. "]+)") do
    out[#out + 1] = tok
  end
  return out
end

-- Đếm số phần tử của bảng bất kỳ (kể cả key không liên tục)
function util.count(t)
  local n = 0
  for _ in pairs(t or {}) do n = n + 1 end
  return n
end

-- Danh sách key của bảng
function util.keys(t)
  local out = {}
  for k in pairs(t or {}) do out[#out + 1] = k end
  return out
end

-- Chọn ngẫu nhiên theo trọng số: list = { {w=30, ...}, {w=5, ...} }
-- rng (tùy chọn) là stream của PW.rng; mặc định dùng math.random
function util.weighted(list, rng)
  local total = 0
  for _, e in ipairs(list or {}) do total = total + (e.w or 1) end
  if total <= 0 then return nil end
  local roll
  if rng then roll = rng:int(1, total) else roll = math.random(1, total) end
  local acc = 0
  for _, e in ipairs(list) do
    acc = acc + (e.w or 1)
    if roll <= acc then return e end
  end
  return list[#list]
end

-- Ghép mảng b vào cuối mảng a (tại chỗ)
function util.extend(a, b)
  for _, v in ipairs(b or {}) do a[#a + 1] = v end
  return a
end

-- Tra i18n + format. Fallback: trả về chính key nếu thiếu bản dịch.
function PW.T(key, ...)
  local s = (PW.loc or {})[key]
  if not s then return key end
  if select("#", ...) > 0 then
    local ok, res = pcall(string.format, s, ...)
    if ok then return res end
  end
  return s
end
