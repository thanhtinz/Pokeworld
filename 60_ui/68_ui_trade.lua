-- PokeWorld | 60_ui/68_ui_trade.lua | Trao đổi Pokémon giữa 2 người chơi cùng room
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["ui.trade.usage"] = "Dùng: .trade <tên> | .trade accept | .trade deny",
  ["ui.trade.invited"] = "Đã gửi lời mời trade tới %s (hết hạn sau 60 giây).",
  ["ui.trade.incoming"] = "%s muốn trade với bạn! Gõ .trade accept hoặc .trade deny",
  ["ui.trade.no_invite"] = "Không có lời mời trade nào.",
  ["ui.trade.expired"] = "Lời mời trade đã hết hạn.",
  ["ui.trade.denied"] = "Lời mời trade đã bị từ chối.",
  ["ui.trade.accepted"] = "Trade bắt đầu! Hãy chọn Pokémon để đổi.",
  ["ui.trade.pick_mon"] = "Chọn Pokémon để trade",
  ["ui.trade.waiting"] = "Đã chọn %s. Chờ đối phương...",
  ["ui.trade.confirm_title"] = "Xác nhận trade: đưa %s — nhận %s?",
  ["ui.trade.confirm_yes"] = "Đồng ý",
  ["ui.trade.confirm_no"] = "Hủy",
  ["ui.trade.done"] = "Trade thành công! Bạn nhận được %s.",
  ["ui.trade.cancelled"] = "Trade đã bị hủy.",
  ["ui.trade.in_battle"] = "Không thể trade khi đang trong trận đấu.",
  ["ui.trade.busy"] = "Bạn hoặc đối phương đang bận trade khác.",
  ["ui.trade.not_found"] = "Không tìm thấy người chơi '%s' trong room.",
  ["ui.trade.self"] = "Không thể trade với chính mình.",
  ["ui.trade.empty_party"] = "Đối tượng trade cần có ít nhất 1 Pokémon trong đội.",
}

PW.ui = PW.ui or {}
PW.trade = PW.trade or {}
PW.ui.trade = PW.trade -- alias theo yêu cầu
local T = PW.trade

-- Lời mời chờ: target_uid -> {from=, at=}
T.invites = T.invites or {}
-- Phiên trade: uid -> session {a=, b=, offer={[uid]=slot}, confirmed={[uid]=bool}}
T.sessions = T.sessions or {}

local INVITE_TTL = 60

local function mon_name(mon)
  return (PW.pokemon and PW.pokemon.name and PW.pokemon.name(mon)) or tostring(mon and (mon.nick or mon.sp))
end

-- Tên hiển thị của người chơi (adapter guard nil)
local function display_name(uid)
  -- CREATA-API: Player:getNickname(uid) — đi qua module players nếu có
  if PW.players and PW.players.name then
    local ok, n = pcall(PW.players.name, uid)
    if ok and n then return n end
  end
  local pl = PW.store and PW.store.get and PW.store.get(uid)
  if pl and pl.name then return pl.name end
  return tostring(uid)
end

-- Tìm uid theo tên trong room (guard nil nhiều nguồn)
local function resolve_name(name)
  if not name then return nil end
  local lname = string.lower(name)
  if PW.players and PW.players.find_by_name then
    local ok, uid = pcall(PW.players.find_by_name, name)
    if ok and uid then return uid end
  end
  if PW.store and PW.store.all then
    local ok, all = pcall(PW.store.all)
    if ok and all then
      for uid, pl in pairs(all) do
        if pl.name and string.lower(pl.name) == lname then return uid end
      end
    end
  end
  return nil
end

local function in_battle(uid)
  return PW.battle_ctrl and PW.battle_ctrl.get and PW.battle_ctrl.get(uid) ~= nil
end

-- Hủy phiên trade của 1 uid (báo cả 2 bên)
local function cancel_session(uid)
  local s = T.sessions[uid]
  if not s then return end
  T.sessions[s.a] = nil
  T.sessions[s.b] = nil
  PW.ui_common.msg(s.a, PW.T("ui.trade.cancelled"))
  PW.ui_common.msg(s.b, PW.T("ui.trade.cancelled"))
end

-- Thực hiện hoán đổi khi cả 2 confirm
local function execute(s)
  local ui = PW.ui_common
  local pa = PW.store.get(s.a)
  local pb = PW.store.get(s.b)
  local sa, sb = s.offer[s.a], s.offer[s.b]
  local ma, mb = pa.party[sa], pb.party[sb]
  if not ma or not mb then
    cancel_session(s.a)
    return
  end
  -- Hoán đổi mon giữa 2 party
  pa.party[sa] = mb
  pb.party[sb] = ma
  -- Đánh dấu dex caught cho loài nhận được (guard nil module 32)
  if PW.dex then
    if PW.dex.mark_seen then
      PW.dex.mark_seen(pa, mb.sp); PW.dex.mark_seen(pb, ma.sp)
    end
    if PW.dex.mark_caught then
      PW.dex.mark_caught(pa, mb.sp); PW.dex.mark_caught(pb, ma.sp)
    end
  end
  if PW.store.save then
    PW.store.save(s.a); PW.store.save(s.b)
  end
  T.sessions[s.a] = nil
  T.sessions[s.b] = nil
  ui.msg(s.a, string.format(PW.T("ui.trade.done"), mon_name(mb)))
  ui.msg(s.b, string.format(PW.T("ui.trade.done"), mon_name(ma)))
  if PW.log and PW.log.info then
    PW.log.info(string.format("trade: %s <-> %s", tostring(s.a), tostring(s.b)))
  end
end

-- Khi 1 bên đã chọn xong mon: nếu cả 2 chọn → mở menu confirm cho cả 2
local function try_confirm_phase(s)
  local ui = PW.ui_common
  if not (s.offer[s.a] and s.offer[s.b]) then return end
  local pa = PW.store.get(s.a)
  local pb = PW.store.get(s.b)
  local ma = pa.party[s.offer[s.a]]
  local mb = pb.party[s.offer[s.b]]
  if not ma or not mb then cancel_session(s.a); return end

  local function ask(uid, give, get)
    local opts = {
      { label = PW.T("ui.trade.confirm_yes"), yes = true },
      { label = PW.T("ui.trade.confirm_no"), yes = false },
    }
    ui.menu(uid, string.format(PW.T("ui.trade.confirm_title"), mon_name(give), mon_name(get)), opts,
      function(u, _, opt)
        local ss = T.sessions[u]
        if not ss then return end
        if not opt.yes then
          cancel_session(u)
          return
        end
        ss.confirmed[u] = true
        if ss.confirmed[ss.a] and ss.confirmed[ss.b] then
          execute(ss)
        end
      end)
  end
  ask(s.a, ma, mb)
  ask(s.b, mb, ma)
end

-- Menu chọn mon từ party của 1 bên
local function pick_phase(uid)
  local ui = PW.ui_common
  local s = T.sessions[uid]
  if not s then return end
  local player = PW.store.get(uid)
  local opts = {}
  for slot = 1, #(player.party or {}) do
    local mon = player.party[slot]
    opts[#opts + 1] = { label = string.format("%s Lv.%d", mon_name(mon), mon.lv or 1), slot = slot }
  end
  if #opts == 0 then
    cancel_session(uid)
    return
  end
  ui.menu(uid, PW.T("ui.trade.pick_mon"), opts, function(u, _, opt)
    local ss = T.sessions[u]
    if not ss then return end
    ss.offer[u] = opt.slot
    local pl = PW.store.get(u)
    ui.msg(u, string.format(PW.T("ui.trade.waiting"), mon_name(pl.party[opt.slot])))
    try_confirm_phase(ss)
  end)
end

-- ============ API mời / trả lời ============

function T.invite(uid, target_name)
  local ui = PW.ui_common
  if in_battle(uid) then ui.msg(uid, PW.T("ui.trade.in_battle")); return end
  local target = resolve_name(target_name)
  if not target then
    ui.msg(uid, string.format(PW.T("ui.trade.not_found"), tostring(target_name)))
    return
  end
  if target == uid then ui.msg(uid, PW.T("ui.trade.self")); return end
  if T.sessions[uid] or T.sessions[target] then ui.msg(uid, PW.T("ui.trade.busy")); return end
  T.invites[target] = { from = uid, at = os.time() }
  ui.msg(uid, string.format(PW.T("ui.trade.invited"), display_name(target)))
  ui.msg(target, string.format(PW.T("ui.trade.incoming"), display_name(uid)))
end

function T.accept(uid)
  local ui = PW.ui_common
  local inv = T.invites[uid]
  if not inv then ui.msg(uid, PW.T("ui.trade.no_invite")); return end
  T.invites[uid] = nil
  if os.time() - inv.at > INVITE_TTL then
    ui.msg(uid, PW.T("ui.trade.expired"))
    return
  end
  if in_battle(uid) or in_battle(inv.from) then
    ui.msg(uid, PW.T("ui.trade.in_battle"))
    return
  end
  if T.sessions[uid] or T.sessions[inv.from] then ui.msg(uid, PW.T("ui.trade.busy")); return end
  -- Cả 2 phải có ít nhất 1 mon
  local pa = PW.store.get(inv.from)
  local pb = PW.store.get(uid)
  if #(pa.party or {}) == 0 or #(pb.party or {}) == 0 then
    ui.msg(uid, PW.T("ui.trade.empty_party"))
    ui.msg(inv.from, PW.T("ui.trade.empty_party"))
    return
  end
  local s = { a = inv.from, b = uid, offer = {}, confirmed = {} }
  T.sessions[s.a] = s
  T.sessions[s.b] = s
  ui.msg(s.a, PW.T("ui.trade.accepted"))
  ui.msg(s.b, PW.T("ui.trade.accepted"))
  pick_phase(s.a)
  pick_phase(s.b)
end

function T.deny(uid)
  local ui = PW.ui_common
  local inv = T.invites[uid]
  if not inv then ui.msg(uid, PW.T("ui.trade.no_invite")); return end
  T.invites[uid] = nil
  ui.msg(uid, PW.T("ui.trade.denied"))
  ui.msg(inv.from, PW.T("ui.trade.denied"))
end

-- ============ Hook dọn lời mời hết hạn ============
PW.pending_hooks = PW.pending_hooks or {}
table.insert(PW.pending_hooks, {
  event = "tick_second",
  fn = function()
    local now = os.time()
    for target, inv in pairs(T.invites) do
      if now - inv.at > INVITE_TTL then
        T.invites[target] = nil
        PW.ui_common.msg(inv.from, PW.T("ui.trade.expired"))
        PW.ui_common.msg(target, PW.T("ui.trade.expired"))
      end
    end
  end,
})

-- ============ Đăng ký lệnh ============
PW.pending_commands = PW.pending_commands or {}

table.insert(PW.pending_commands, {
  name = "trade",
  desc = "Trade: .trade <tên> | .trade accept | .trade deny",
  fn = function(uid, args)
    local arg = args and args[1]
    if not arg then
      PW.ui_common.msg(uid, PW.T("ui.trade.usage"))
    elseif arg == "accept" then
      T.accept(uid)
    elseif arg == "deny" then
      T.deny(uid)
    else
      T.invite(uid, arg)
    end
  end,
})
