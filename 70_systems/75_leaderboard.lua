-- PokeWorld | 70_systems/75_leaderboard.lua | Bảng xếp hạng trong room: badge, dex, tiền
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["lb.title"] = "Bảng xếp hạng — %s",
  ["lb.metric_badge"] = "Huy hiệu",
  ["lb.metric_dex"] = "Pokédex",
  ["lb.metric_money"] = "Tiền",
  ["lb.row"] = "%d. %s — %d",
  ["lb.empty"] = "Chưa có dữ liệu xếp hạng.",
  ["lb.usage"] = "Dùng: .top [badge|dex|money]",
}

PW.leaderboard = PW.leaderboard or {}
local LB = PW.leaderboard

-- TODO: Cloud API — khi CREATA mở API lưu trữ cloud, đồng bộ xếp hạng liên room tại đây.

-- Tính điểm của 1 player theo metric
local function score(player, metric)
  if metric == "badge" then
    local n = 0
    for _, v in pairs(player.badges or {}) do
      if v then n = n + 1 end
    end
    return n
  elseif metric == "dex" then
    if PW.dex and PW.dex.counts then
      local ok, _, caught = pcall(PW.dex.counts, player)
      if ok and caught then return caught end
    end
    local n = 0
    for _ in pairs((player.dex and player.dex.caught) or {}) do n = n + 1 end
    return n
  elseif metric == "money" then
    return player.money or 0
  end
  return 0
end

-- Top n người chơi theo metric: trả về { {uid=, name=, score=}, ... }
function LB.top(metric, n)
  n = n or 5
  local out = {}
  -- Cần PW.store.all(); không có thì trả rỗng (chưa duyệt được toàn bộ player)
  if not (PW.store and PW.store.all) then return out end
  local ok, all = pcall(PW.store.all)
  if not ok or not all then return out end
  for uid, player in pairs(all) do
    out[#out + 1] = { uid = uid, name = player.name or tostring(uid), score = score(player, metric) }
  end
  table.sort(out, function(a, b)
    if a.score ~= b.score then return a.score > b.score end
    return tostring(a.name) < tostring(b.name)
  end)
  while #out > n do table.remove(out) end
  return out
end

-- ============ Đăng ký lệnh ============
PW.pending_commands = PW.pending_commands or {}

table.insert(PW.pending_commands, {
  name = "top",
  desc = "Xếp hạng: .top [badge|dex|money]",
  fn = function(uid, args)
    local metric = (args and args[1]) or "badge"
    if metric ~= "badge" and metric ~= "dex" and metric ~= "money" then
      PW.ui_common.msg(uid, PW.T("lb.usage"))
      return
    end
    local rows = LB.top(metric, 5)
    if #rows == 0 then
      PW.ui_common.msg(uid, PW.T("lb.empty"))
      return
    end
    local lines = { string.format(PW.T("lb.title"), PW.T("lb.metric_" .. metric)) }
    for i = 1, #rows do
      lines[#lines + 1] = string.format(PW.T("lb.row"), i, rows[i].name, rows[i].score)
    end
    PW.ui_common.msg(uid, table.concat(lines, "\n"))
  end,
})
