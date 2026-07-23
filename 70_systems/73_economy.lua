-- PokeWorld | 70_systems/73_economy.lua | Kinh tế: cộng/trừ tiền có log, trần tiền, lệnh xem số dư
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["economy.balance"] = "Số dư: %d₽",
}

PW.economy = PW.economy or {}
local E = PW.economy

-- Trần tiền
E.MONEY_CAP = 9999999

-- Cộng tiền (amount có thể âm nhưng khuyến nghị dùng spend); trả về số dư mới
function E.add(uid, amount, reason)
  amount = tonumber(amount) or 0
  local player = PW.store.get(uid)
  local before = player.money or 0
  local after = before + amount
  if after > E.MONEY_CAP then after = E.MONEY_CAP end
  if after < 0 then after = 0 end
  player.money = after
  if PW.store.save then PW.store.save(uid) end
  if PW.log and PW.log.info then
    PW.log.info(string.format("economy: uid=%s %+d (%s) %d->%d",
      tostring(uid), amount, tostring(reason or "?"), before, after))
  end
  return after
end

-- Trừ tiền: trả về true nếu đủ tiền, false nếu không (không trừ)
function E.spend(uid, amount)
  amount = tonumber(amount) or 0
  if amount < 0 then return false end
  local player = PW.store.get(uid)
  local before = player.money or 0
  if before < amount then
    if PW.log and PW.log.info then
      PW.log.info(string.format("economy: uid=%s spend %d TỪ CHỐI (có %d)", tostring(uid), amount, before))
    end
    return false
  end
  player.money = before - amount
  if PW.store.save then PW.store.save(uid) end
  if PW.log and PW.log.info then
    PW.log.info(string.format("economy: uid=%s spend -%d %d->%d", tostring(uid), amount, before, player.money))
  end
  return true
end

-- ============ Đăng ký lệnh ============
PW.pending_commands = PW.pending_commands or {}

table.insert(PW.pending_commands, {
  name = "money", aliases = { "tien" },
  desc = "Xem số dư",
  fn = function(uid)
    local player = PW.store.get(uid)
    PW.ui_common.msg(uid, string.format(PW.T("economy.balance"), player.money or 0))
  end,
})
