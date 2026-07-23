-- PokeWorld | 30_save/32_pokedex_store.lua | Pokédex seen/caught dạng bitmap nén chuỗi hex
local PW = _G.PW or {}; _G.PW = PW

local dex = {}
PW.dex = dex

-- Bitmap lưu dạng chuỗi hex, mỗi ký tự = 4 bit (dex 1..4 nằm ở ký tự 1...).
-- Tiết kiệm hơn nhiều so với bảng {[dex]=true} khi scale 1000+ loài.

local HEX = "0123456789abcdef"

local function get_bit(bitmap, dex_no)
  local char_idx = math.floor((dex_no - 1) / 4) + 1
  if char_idx > #bitmap then return false end
  local c = bitmap:sub(char_idx, char_idx)
  local val = (HEX:find(c, 1, true) or 1) - 1
  local bit_pos = (dex_no - 1) % 4
  return math.floor(val / 2 ^ bit_pos) % 2 == 1
end

local function set_bit(bitmap, dex_no)
  local char_idx = math.floor((dex_no - 1) / 4) + 1
  -- Nới chuỗi nếu chưa đủ dài
  while #bitmap < char_idx do bitmap = bitmap .. "0" end
  local c = bitmap:sub(char_idx, char_idx)
  local val = (HEX:find(c, 1, true) or 1) - 1
  local bit_pos = (dex_no - 1) % 4
  if math.floor(val / 2 ^ bit_pos) % 2 == 0 then
    val = val + 2 ^ bit_pos
  end
  local nc = HEX:sub(val + 1, val + 1)
  return bitmap:sub(1, char_idx - 1) .. nc .. bitmap:sub(char_idx + 1)
end

function dex.mark_seen(player, dex_no)
  player.dex.seen = set_bit(player.dex.seen or "", dex_no)
end

function dex.mark_caught(player, dex_no)
  player.dex.seen = set_bit(player.dex.seen or "", dex_no)
  player.dex.caught = set_bit(player.dex.caught or "", dex_no)
end

function dex.is_seen(player, dex_no)
  return get_bit(player.dex.seen or "", dex_no)
end

function dex.is_caught(player, dex_no)
  return get_bit(player.dex.caught or "", dex_no)
end

-- Đếm seen/caught (chỉ đếm các loài có trong data)
function dex.counts(player)
  local seen, caught = 0, 0
  for no in pairs(PW.species or {}) do
    if dex.is_seen(player, no) then seen = seen + 1 end
    if dex.is_caught(player, no) then caught = caught + 1 end
  end
  return seen, caught
end
