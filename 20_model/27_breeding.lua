-- PokeWorld | 20_model/27_breeding.lua | Egg group, thừa kế IV, trứng và ấp trứng
local PW = _G.PW or {}; _G.PW = PW

local breeding = {}
PW.breeding = breeding

-- Kiểm tra 2 mon có ghép cặp được không
function breeding.compatible(a, b)
  if a.sp == nil or b.sp == nil then return false end
  local sa, sb = PW.species[a.sp], PW.species[b.sp]
  if not sa or not sb then return false end
  -- Cần 1 đực + 1 cái (chưa hỗ trợ Ditto)
  if not ((a.gender == "m" and b.gender == "f") or (a.gender == "f" and b.gender == "m")) then
    return false
  end
  -- Chung ít nhất 1 egg group, không thuộc nhóm "undiscovered"
  for _, ga in ipairs(sa.egg_groups or {}) do
    if ga == "undiscovered" then return false end
    for _, gb in ipairs(sb.egg_groups or {}) do
      if gb == "undiscovered" then return false end
      if ga == gb then return true end
    end
  end
  return false
end

-- Loài gốc của chuỗi tiến hóa (con nở ra là dạng đầu chuỗi của mẹ)
local function base_species(dex)
  local changed = true
  while changed do
    changed = false
    for from, def in pairs(PW.evolutions or {}) do
      local options = def.into and { def } or def
      for _, e in ipairs(options) do
        if e.into == dex then dex = from changed = true break end
      end
      if changed then break end
    end
  end
  return dex
end

-- Tạo trứng từ cặp bố mẹ. Trả về egg = { sp=, steps=, iv=, nature= } hoặc nil.
function breeding.make_egg(mother, father)
  if not breeding.compatible(mother, father) then return nil end
  local rng = PW.rng.secure
  local mom = (mother.gender == "f") and mother or father
  local dad = (mom == mother) and father or mother

  local child_sp = base_species(mom.sp)

  -- Thừa kế IV: 3 IV ngẫu nhiên lấy từ bố hoặc mẹ, còn lại random
  local iv = {}
  for i = 1, 6 do iv[i] = rng:int(0, PW.config.IV_MAX) end
  local inherited = {}
  local n = 0
  while n < 3 do
    local slot = rng:int(1, 6)
    if not inherited[slot] then
      inherited[slot] = true
      local parent = rng:roll(0.5) and mom or dad
      iv[slot] = parent.iv[slot] or iv[slot]
      n = n + 1
    end
  end

  -- Nature: 50% theo mẹ (đơn giản hóa Everstone), 50% random
  local nature = rng:roll(0.5) and mom.nature or rng:pick(PW.natures.list)

  -- Egg move: chiêu level-up của loài con mà bố đang biết (đơn giản hóa)
  local egg_moves = {}
  local child_ls = (PW.learnsets or {})[child_sp] or {}
  local known = {}
  for _, mv in pairs(child_ls) do if type(mv) == "string" then known[mv] = true end end
  for _, mv in ipairs(dad.moves or {}) do
    if known[mv.id] then egg_moves[#egg_moves + 1] = mv.id end
  end

  local spec = PW.species[child_sp]
  return {
    sp = child_sp,
    steps = (spec and spec.hatch_steps) or 2560, -- số bước cần đi để nở
    iv = iv, nature = nature,
    egg_moves = egg_moves,
  }
end

-- Nở trứng thành mon level 1
function breeding.hatch(egg, ot, ot_name)
  local mon = PW.pokemon.new(egg.sp, 1, {
    iv = egg.iv, nature = egg.nature, ot = ot, ot_name = ot_name,
  })
  if mon and egg.egg_moves then
    for _, mv_id in ipairs(egg.egg_moves) do PW.pokemon.try_learn(mon, mv_id) end
  end
  return mon
end

-- Giảm bước ấp (gọi từ vòng tick theo bước chân người chơi). Trả về true khi nở.
function breeding.step(egg, n)
  egg.steps = math.max(0, (egg.steps or 0) - (n or 1))
  return egg.steps <= 0
end
