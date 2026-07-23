-- PokeWorld | 20_model/20_pokemon.lua | Tạo instance Pokémon: IV, EV, nature, gender, shiny, tính stats
local PW = _G.PW or {}; _G.PW = PW

local pokemon = {}
PW.pokemon = pokemon

-- Thứ tự stat trong mảng iv/ev (khớp schema save)
local STAT_KEYS = { "hp", "atk", "def", "spa", "spd", "spe" }
pokemon.STAT_KEYS = STAT_KEYS

-- Tạo 1 instance mới. opts = { shiny=, iv=, nature=, gender=, ability=, ball=, ot=, ot_name=, moves= }
function pokemon.new(species_id, level, opts)
  opts = opts or {}
  local spec = PW.species[species_id]
  if not spec then
    PW.log.warn("pokemon.new: species %s khong ton tai", tostring(species_id))
    return nil
  end
  local cfg = PW.config
  local rng = PW.rng.secure

  level = PW.util.clamp(level or 5, 1, cfg.MAX_LEVEL)

  -- IV: 0..31 mỗi stat, từ stream secure
  local iv = opts.iv
  if not iv then
    iv = {}
    for i = 1, 6 do iv[i] = rng:int(0, cfg.IV_MAX) end
  end

  -- Nature
  local nature = opts.nature or rng:pick(PW.natures.list)

  -- Gender theo gender_ratio (tỉ lệ đực; -1 = genderless)
  local gender = opts.gender
  if not gender then
    if spec.gender_ratio == -1 then gender = "n"
    elseif rng:roll(spec.gender_ratio) then gender = "m"
    else gender = "f" end
  end

  -- Shiny: 1/SHINY_DENOM, nhân event mult nếu có
  local shiny = opts.shiny
  if shiny == nil then
    local denom = cfg.SHINY_DENOM
    local mult = (PW.events and PW.events.mult and PW.events.mult("shiny")) or 1
    shiny = rng:roll(mult / denom)
  end

  -- Ability
  local ability = opts.ability or rng:pick(spec.abilities or {}) or "none"

  local mon = {
    v = 1, sp = species_id, lv = level,
    exp = PW.exp and PW.exp.for_level(spec.exp_curve, level) or 0,
    nick = nil,
    iv = iv,
    ev = { 0, 0, 0, 0, 0, 0 },
    nature = nature, ability = ability, gender = gender,
    shiny = shiny and true or false,
    ball = opts.ball or "poke_ball",
    ot = opts.ot, ot_name = opts.ot_name,
    moves = opts.moves or pokemon.default_moves(species_id, level),
    hp_cur = 0, status = nil,
    friendship = cfg.FRIENDSHIP_BASE, held = nil,
    caught_at = os.time(), size = "normal",
  }
  mon.hp_cur = pokemon.max_hp(mon)
  return mon
end

-- 4 chiêu gần nhất theo learnset tại level cho trước
function pokemon.default_moves(species_id, level)
  local ls = (PW.learnsets or {})[species_id]
  local learned = {}
  if ls then
    local lvls = {}
    for lv, mv in pairs(ls) do
      if type(lv) == "number" and lv <= level then lvls[#lvls + 1] = { lv = lv, id = mv } end
    end
    table.sort(lvls, function(a, b) return a.lv < b.lv end)
    for _, e in ipairs(lvls) do learned[#learned + 1] = e.id end
  end
  -- Lấy 4 chiêu cuối cùng (mới nhất)
  local moves = {}
  local start = math.max(1, #learned - 3)
  for i = start, #learned do
    local mv = PW.moves[learned[i]]
    moves[#moves + 1] = { id = learned[i], pp = mv and mv.pp or 10 }
  end
  if #moves == 0 then moves[1] = { id = "tackle", pp = 35 } end
  return moves
end

-- Tính 6 stats theo công thức Gen 3+ (IV/EV/nature)
function pokemon.stats(mon)
  local spec = PW.species[mon.sp]
  local out = {}
  for i, key in ipairs(STAT_KEYS) do
    local base = spec.base[key]
    local iv, ev, lv = mon.iv[i] or 0, mon.ev[i] or 0, mon.lv
    if key == "hp" then
      if spec.base.hp == 1 then -- Shedinja-style
        out.hp = 1
      else
        out.hp = math.floor((2 * base + iv + math.floor(ev / 4)) * lv / 100) + lv + 10
      end
    else
      local val = math.floor((2 * base + iv + math.floor(ev / 4)) * lv / 100) + 5
      local nat = PW.natures[mon.nature]
      if nat then
        if nat.up == key and nat.down ~= key then val = math.floor(val * 1.1)
        elseif nat.down == key and nat.up ~= key then val = math.floor(val * 0.9) end
      end
      out[key] = val
    end
  end
  return out
end

function pokemon.max_hp(mon)
  return pokemon.stats(mon).hp
end

-- Tên hiển thị: nickname > tên loài
function pokemon.name(mon)
  if mon.nick and mon.nick ~= "" then return mon.nick end
  local spec = PW.species[mon.sp]
  return PW.T(spec and spec.name_key or "?")
end

-- Hồi đầy máu + trạng thái + PP
function pokemon.heal(mon)
  mon.hp_cur = pokemon.max_hp(mon)
  mon.status = nil
  for _, mv in ipairs(mon.moves or {}) do
    local def = PW.moves[mv.id]
    mv.pp = def and def.pp or mv.pp
  end
end

function pokemon.is_fainted(mon)
  return (mon.hp_cur or 0) <= 0
end

-- Cộng EV khi hạ đối thủ (tôn trọng cap từng stat và tổng)
function pokemon.add_ev(mon, yield)
  if not yield then return end
  local cfg = PW.config
  local total = 0
  for i = 1, 6 do total = total + (mon.ev[i] or 0) end
  for i, key in ipairs(STAT_KEYS) do
    local add = yield[key]
    if add and add > 0 then
      local room_stat = cfg.EV_CAP_STAT - (mon.ev[i] or 0)
      local room_total = cfg.EV_CAP_TOTAL - total
      local gain = math.min(add, room_stat, room_total)
      if gain > 0 then
        mon.ev[i] = (mon.ev[i] or 0) + gain
        total = total + gain
      end
    end
  end
end

-- Học chiêu mới khi lên level. Trả về: "learned" | "full" (đủ 4, cần thay) | nil
function pokemon.try_learn(mon, move_id)
  for _, mv in ipairs(mon.moves) do
    if mv.id == move_id then return nil end -- đã biết
  end
  local def = PW.moves[move_id]
  if not def then return nil end
  if #mon.moves < 4 then
    mon.moves[#mon.moves + 1] = { id = move_id, pp = def.pp }
    return "learned"
  end
  return "full"
end

-- Thay chiêu ở vị trí idx (khi đầy 4 chiêu)
function pokemon.replace_move(mon, idx, move_id)
  local def = PW.moves[move_id]
  if not def or not mon.moves[idx] then return false end
  mon.moves[idx] = { id = move_id, pp = def.pp }
  return true
end

function pokemon.add_friendship(mon, amount)
  mon.friendship = PW.util.clamp((mon.friendship or 0) + amount, 0, PW.config.FRIENDSHIP_MAX)
end
