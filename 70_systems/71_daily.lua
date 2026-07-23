-- PokeWorld | 70_systems/71_daily.lua | Điểm danh hằng ngày: streak, thưởng theo mốc, reset quest daily
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["daily.claimed"] = "Điểm danh ngày %d (streak %d)! Nhận %d₽%s",
  ["daily.already"] = "Hôm nay bạn đã điểm danh rồi. Streak hiện tại: %d.",
  ["daily.item_part"] = " + %s x%d",
  ["daily.quest_reset"] = "Nhiệm vụ hằng ngày đã được làm mới.",
}

PW.daily = PW.daily or {}
local D = PW.daily

-- Bảng thưởng 7 mốc (lặp lại theo chu kỳ khi streak > 7)
-- Mỗi mốc: {money=, items={id=count}}
D.rewards = {
  { money = 500, items = { poke_ball = 1 } },
  { money = 700, items = { poke_ball = 2 } },
  { money = 1000, items = { potion = 1 } },
  { money = 1200, items = { poke_ball = 3 } },
  { money = 1500, items = { potion = 2 } },
  { money = 2000, items = { great_ball = 2 } },
  { money = 3000, items = { rare_candy = 1 } },
}

-- Chuyển os.date("*t") thành số yyyymmdd
local function daykey(t)
  return t.year * 10000 + t.month * 100 + t.day
end

-- Số ngày kể từ epoch (để so "liền kề")
local function daynum(t)
  return math.floor(os.time({ year = t.year, month = t.month, day = t.day, hour = 12 }) / 86400)
end

-- Từ yyyymmdd → daynum (guard số lạ)
local function key_to_daynum(key)
  if not key or key == 0 then return nil end
  local y = math.floor(key / 10000)
  local m = math.floor(key / 100) % 100
  local d = key % 100
  if y < 1970 or m < 1 or m > 12 or d < 1 or d > 31 then return nil end
  return daynum({ year = y, month = m, day = d })
end

-- Reset quest daily: xóa quest kind=="daily" khỏi done để nhận lại
local function reset_daily_quests(player)
  local changed = false
  for quest_id in pairs((player.quests and player.quests.done) or {}) do
    local d = PW.quests and PW.quests[quest_id]
    if d and d.kind == "daily" then
      player.quests.done[quest_id] = nil
      changed = true
    end
  end
  return changed
end

-- Nhận thưởng điểm danh
function D.claim(uid)
  local ui = PW.ui_common
  local player = PW.store.get(uid)
  player.daily = player.daily or { last = 0, streak = 0 }

  local now = os.date("*t")
  local today_key = daykey(now)
  if player.daily.last == today_key then
    ui.msg(uid, string.format(PW.T("daily.already"), player.daily.streak or 0))
    return
  end

  -- Streak: +1 nếu ngày trước là hôm qua, ngược lại reset về 1
  local last_dn = key_to_daynum(player.daily.last)
  local today_dn = daynum(now)
  if last_dn and today_dn - last_dn == 1 then
    player.daily.streak = (player.daily.streak or 0) + 1
  else
    player.daily.streak = 1
  end
  player.daily.last = today_key

  -- Thưởng theo mốc 1..7 (chu kỳ)
  local tier = ((player.daily.streak - 1) % 7) + 1
  local reward = D.rewards[tier]
  local money = reward.money or 0
  if PW.economy and PW.economy.add then
    PW.economy.add(uid, money, "daily")
  else
    player.money = (player.money or 0) + money
  end
  local item_txt = ""
  player.bag = player.bag or {}
  for item_id, count in pairs(reward.items or {}) do
    player.bag[item_id] = (player.bag[item_id] or 0) + count
    local idef = PW.items and PW.items[item_id]
    item_txt = item_txt .. string.format(PW.T("daily.item_part"), (idef and idef.name) or tostring(item_id), count)
  end

  -- Reset quest daily để nhận lại
  if reset_daily_quests(player) then
    ui.msg(uid, PW.T("daily.quest_reset"))
  end

  if PW.store.save then PW.store.save(uid) end
  ui.msg(uid, string.format(PW.T("daily.claimed"), tier, player.daily.streak, money, item_txt))
  if PW.log and PW.log.info then
    PW.log.info("daily claim uid=" .. tostring(uid) .. " streak=" .. tostring(player.daily.streak))
  end
end

-- ============ Đăng ký lệnh ============
PW.pending_commands = PW.pending_commands or {}

table.insert(PW.pending_commands, {
  name = "daily",
  desc = "Điểm danh nhận thưởng hằng ngày",
  fn = function(uid) D.claim(uid) end,
})
