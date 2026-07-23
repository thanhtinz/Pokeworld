-- PokeWorld | 50_battle/53_pvp_battle.lua | Thách đấu PvP giữa 2 người chơi trong room
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["pvp.help"]         = "Thách đấu PvP: .pvp <tên> | .pvp accept | .pvp deny",
  ["pvp.sent"]         = "Đã gửi lời mời PvP tới %s (hết hạn sau 60 giây).",
  ["pvp.received"]     = "%s thách đấu bạn! Gõ .pvp accept hoặc .pvp deny",
  ["pvp.no_invite"]    = "Bạn không có lời mời PvP nào.",
  ["pvp.denied"]       = "%s đã từ chối lời mời PvP.",
  ["pvp.deny_ok"]      = "Bạn đã từ chối lời mời.",
  ["pvp.expired"]      = "Lời mời PvP đã hết hạn.",
  ["pvp.not_found"]    = "Không tìm thấy người chơi %s trong room.",
  ["pvp.busy"]         = "Một trong hai người đang bận trong trận khác.",
  ["pvp.self"]         = "Không thể tự thách đấu chính mình!",
  ["pvp.no_party"]     = "Cả hai cần có ít nhất 1 Pokémon còn khỏe.",
  ["pvp.start"]        = "Trận PvP giữa %s và %s bắt đầu!",
  ["pvp.win"]          = "%s đã thắng trận PvP!",
  ["pvp.draw"]         = "Trận PvP kết thúc hòa!",
}

PW.pvp = PW.pvp or {}
local P = PW.pvp

-- ============ Adapter CREATA ============
local api = {}

-- CREATA-API: PW.creata.send(uid, text)
function api.send_message(uid, text)
  PW.creata.send(uid, text)
end

-- Danh sách người chơi online: duyệt PW.online (91_hooks cập nhật)
function api.get_players()
  local out = {}
  for uid in pairs(PW.online or {}) do
    out[#out + 1] = uid
  end
  return out
end

-- CREATA-API: PW.creata.player_name(uid) -> tên hiển thị
function api.get_player_name(uid)
  return PW.creata.player_name(uid)
end

local INVITE_TTL = 60  -- giây

P.pending = P.pending or {}  -- target_uid -> {from=, expires=}

-- Tìm uid theo tên (không phân biệt hoa thường)
local function find_by_name(name)
  local lname = string.lower(name or "")
  local players = api.get_players()
  for i = 1, #players do
    local uid = players[i]
    if string.lower(api.get_player_name(uid)) == lname then return uid end
  end
  return nil
end

-- Gửi lời mời
function P.invite(from_uid, target_name)
  local target = find_by_name(target_name)
  if not target then
    api.send_message(from_uid, PW.T("pvp.not_found", tostring(target_name)))
    return
  end
  if target == from_uid then
    api.send_message(from_uid, PW.T("pvp.self"))
    return
  end
  if PW.battle_ctrl.get(from_uid) or PW.battle_ctrl.get(target) then
    api.send_message(from_uid, PW.T("pvp.busy"))
    return
  end
  P.pending[target] = { from = from_uid, expires = os.time() + INVITE_TTL }
  api.send_message(from_uid, PW.T("pvp.sent", api.get_player_name(target)))
  api.send_message(target, PW.T("pvp.received", api.get_player_name(from_uid)))
end

-- Xử lý kết quả PvP (gọi cho từng uid; chỉ báo msg, không thưởng phạt)
local function on_finish(uid, other_uid, result)
  if result.aborted then return end
  if result.winner == nil then
    api.send_message(uid, PW.T("pvp.draw"))
  else
    local winner_uid = result.won and uid or other_uid
    api.send_message(uid, PW.T("pvp.win", api.get_player_name(winner_uid)))
  end
end

-- Chấp nhận lời mời
function P.accept(uid)
  local inv = P.pending[uid]
  if not inv then
    api.send_message(uid, PW.T("pvp.no_invite"))
    return
  end
  P.pending[uid] = nil
  if os.time() > inv.expires then
    api.send_message(uid, PW.T("pvp.expired"))
    return
  end
  local a, b_uid = inv.from, uid
  if PW.battle_ctrl.get(a) or PW.battle_ctrl.get(b_uid) then
    api.send_message(uid, PW.T("pvp.busy"))
    return
  end
  local pa, pb = PW.store.get(a), PW.store.get(b_uid)
  if not (pa and pb and PW.party.first_alive(pa) and PW.party.first_alive(pb)) then
    api.send_message(uid, PW.T("pvp.no_party"))
    api.send_message(a, PW.T("pvp.no_party"))
    return
  end

  local battle = PW.battle.new{
    kind = "pvp",
    sides = {
      { mons = pa.party, id = a, kind = "player" },
      { mons = pb.party, id = b_uid, kind = "player" },
    },
  }

  local na, nb = api.get_player_name(a), api.get_player_name(b_uid)
  api.send_message(a, PW.T("pvp.start", na, nb))
  api.send_message(b_uid, PW.T("pvp.start", na, nb))

  -- Hai uid chia sẻ cùng 1 battle, side_idx riêng
  PW.battle_ctrl.begin(a, battle, {
    kind = "pvp", side_idx = 1,
    on_finish = function(result) on_finish(a, b_uid, result) end,
  })
  PW.battle_ctrl.begin(b_uid, battle, {
    kind = "pvp", side_idx = 2,
    on_finish = function(result) on_finish(b_uid, a, result) end,
  })
end

-- Từ chối lời mời
function P.deny(uid)
  local inv = P.pending[uid]
  if not inv then
    api.send_message(uid, PW.T("pvp.no_invite"))
    return
  end
  P.pending[uid] = nil
  api.send_message(uid, PW.T("pvp.deny_ok"))
  api.send_message(inv.from, PW.T("pvp.denied", api.get_player_name(uid)))
end

-- Dọn lời mời hết hạn
PW.hooks.on("tick_second", function()
  local now = os.time()
  for target, inv in pairs(P.pending) do
    if now > inv.expires then
      P.pending[target] = nil
      api.send_message(inv.from, PW.T("pvp.expired"))
      api.send_message(target, PW.T("pvp.expired"))
    end
  end
end)

-- Người chơi rời room: hủy lời mời liên quan
PW.hooks.on("leave", function(uid)
  P.pending[uid] = nil
  for target, inv in pairs(P.pending) do
    if inv.from == uid then P.pending[target] = nil end
  end
end)

-- Lệnh .pvp
PW.commands.register{
  name = "pvp",
  aliases = {},
  gm = false,
  help = "pvp.help",
  fn = function(ctx, args)
    local a = args[1]
    if a == "accept" then
      P.accept(ctx.uid)
    elseif a == "deny" then
      P.deny(ctx.uid)
    elseif a then
      P.invite(ctx.uid, a)
    else
      api.send_message(ctx.uid, PW.T("pvp.help"))
    end
  end,
}
