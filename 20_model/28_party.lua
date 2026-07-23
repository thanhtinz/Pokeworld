-- PokeWorld | 20_model/28_party.lua | Party 6 con + PC box: thêm/rút/đổi chỗ/hồi máu
local PW = _G.PW or {}; _G.PW = PW

local party = {}
PW.party = party

-- Thêm mon vào party; đầy thì đẩy vào box còn chỗ.
-- Trả về "party" | "box" | nil (hết chỗ hoàn toàn)
function party.add(player, mon)
  if #player.party < PW.config.PARTY_MAX then
    player.party[#player.party + 1] = mon
    return "party"
  end
  for b = 1, PW.config.BOX_COUNT do
    player.boxes[b] = player.boxes[b] or {}
    if #player.boxes[b] < PW.config.BOX_SIZE then
      player.boxes[b][#player.boxes[b] + 1] = mon
      return "box"
    end
  end
  return nil
end

-- Đổi chỗ 2 slot trong party
function party.swap(player, a, b)
  local p = player.party
  if not p[a] or not p[b] or a == b then return false end
  p[a], p[b] = p[b], p[a]
  return true
end

-- Gửi mon từ party vào box (không cho gửi con cuối cùng còn sống)
function party.deposit(player, slot, box_idx)
  local mon = player.party[slot]
  if not mon then return false, "party.no_mon" end
  -- Đếm con còn sống ngoài con này
  local alive_others = 0
  for i, m in ipairs(player.party) do
    if i ~= slot and not PW.pokemon.is_fainted(m) then alive_others = alive_others + 1 end
  end
  if alive_others == 0 then return false, "party.last_alive" end
  box_idx = box_idx or 1
  player.boxes[box_idx] = player.boxes[box_idx] or {}
  local box = player.boxes[box_idx]
  if #box >= PW.config.BOX_SIZE then return false, "party.box_full" end
  table.remove(player.party, slot)
  box[#box + 1] = mon
  return true
end

-- Rút mon từ box về party
function party.withdraw(player, box_idx, idx)
  local box = player.boxes[box_idx or 1]
  local mon = box and box[idx]
  if not mon then return false, "party.no_mon" end
  if #player.party >= PW.config.PARTY_MAX then return false, "party.party_full" end
  table.remove(box, idx)
  player.party[#player.party + 1] = mon
  return true
end

-- Hồi máu toàn đội (Poké Center)
function party.heal_all(player)
  for _, mon in ipairs(player.party) do PW.pokemon.heal(mon) end
end

-- Slot đầu tiên còn sống, nil nếu cả đội gục
function party.first_alive(player)
  for i, mon in ipairs(player.party) do
    if not PW.pokemon.is_fainted(mon) then return i end
  end
  return nil
end

-- Cả đội đã gục hết?
function party.all_fainted(player)
  return party.first_alive(player) == nil
end
