-- PokeWorld | 00_core/03_rng.lua | RNG có seed riêng cho shiny/IV (chống soft-reset abuse)
local PW = _G.PW or {}; _G.PW = PW

-- LCG thuần Lua (Numerical Recipes) — độc lập math.random để stream "secure"
-- không bị người chơi đoán/ép qua reset room.
local Rng = {}
Rng.__index = Rng

local A, C, M = 1664525, 1013904223, 4294967296 -- 2^32

function Rng.new(seed)
  return setmetatable({ s = (seed or os.time()) % M }, Rng)
end

local function next_raw(r)
  r.s = (A * r.s + C) % M
  return r.s
end

-- Số nguyên trong [a, b]
function Rng:int(a, b)
  if b < a then a, b = b, a end
  return a + next_raw(self) % (b - a + 1)
end

-- Số thực [0, 1)
function Rng:float()
  return next_raw(self) / M
end

-- true với xác suất p (0..1)
function Rng:roll(p)
  return self:float() < p
end

-- Chọn ngẫu nhiên 1 phần tử mảng
function Rng:pick(arr)
  if not arr or #arr == 0 then return nil end
  return arr[self:int(1, #arr)]
end

PW.rng = {
  new    = Rng.new,
  -- Stream chính: gameplay thường (damage roll, spawn...)
  main   = Rng.new(os.time()),
  -- Stream riêng cho shiny/IV: seed trộn thêm clock để khó soft-reset
  secure = Rng.new((os.time() * 1000 + math.floor((os.clock() * 100000) % 1000)) % M),
}
