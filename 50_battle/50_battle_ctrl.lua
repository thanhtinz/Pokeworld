-- PokeWorld | 50_battle/50_battle_ctrl.lua | Điều phối vòng đời trận đấu của người chơi
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["battle.no_battle"]     = "Bạn đang không ở trong trận đấu nào.",
  ["battle.in_battle"]     = "Bạn đang trong trận đấu rồi!",
  ["battle.dmg"]           = "%s nhận %d sát thương!",
  ["battle.crit"]          = "Chí mạng!",
  ["battle.super_eff"]     = "Hiệu quả cao!",
  ["battle.not_eff"]       = "Không hiệu quả lắm...",
  ["battle.no_eff"]        = "Không có tác dụng...",
  ["battle.faint"]         = "%s đã gục ngã!",
  ["battle.exp_gain"]      = "%s nhận %d EXP!",
  ["battle.level_up"]      = "%s lên cấp %d!",
  ["battle.catch_ok"]      = "Tuyệt! Đã bắt được %s!",
  ["battle.catch_fail"]    = "Ôi không! Nó thoát ra sau %d lần lắc!",
  ["battle.run_ok"]        = "Chạy thoát thành công!",
  ["battle.run_fail"]      = "Không thể chạy thoát!",
  ["battle.evolved"]       = "%s đã tiến hóa thành %s!",
  ["battle.cmd_move"]      = "Dùng chiêu trong trận: .move <1-4>",
  ["battle.cmd_switch"]    = "Đổi Pokémon trong trận: .switch <slot>",
  ["battle.cmd_ball"]      = "Ném bóng bắt: .ball <item_id>",
  ["battle.cmd_run"]       = "Bỏ chạy khỏi trận: .run",
  ["battle.bad_arg"]       = "Tham số không hợp lệ.",
}

PW.battle_ctrl = PW.battle_ctrl or {}
local C = PW.battle_ctrl

-- ============ Adapter CREATA ============
local api = {}

-- CREATA-API: PW.creata.lock_move(uid, locked)
function api.lock_movement(uid, locked)
  PW.creata.lock_move(uid, locked)
end

-- CREATA-API: PW.creata.send(uid, text)
function api.send_message(uid, text)
  PW.creata.send(uid, text)
end

C.active = C.active or {}  -- uid -> {battle=, side_idx=, kind=, actor_id=, trainer_id=, meta=}

-- Bắt đầu 1 trận cho uid. meta = {kind=, actor_id=, trainer_id=, side_idx=, on_finish=fn}
function C.begin(uid, battle, meta)
  meta = meta or {}
  if C.active[uid] then
    api.send_message(uid, PW.T("battle.in_battle"))
    return false
  end
  C.active[uid] = {
    battle = battle,
    side_idx = meta.side_idx or 1,
    kind = meta.kind or (battle and battle.kind) or "wild",
    actor_id = meta.actor_id,
    trainer_id = meta.trainer_id,
    meta = meta,
  }
  api.lock_movement(uid, true)
  if PW.ui and PW.ui.battle and PW.ui.battle.open then
    PW.ui.battle.open(uid, battle)
  end
  PW.log.info("battle_ctrl: begin uid=%s kind=%s", tostring(uid), tostring(meta.kind))
  return true
end

function C.get(uid) return C.active[uid] end

-- Danh sách uid gắn với 1 battle (pvp có 2 uid chung 1 battle)
local function uids_of(battle)
  local out = {}
  for uid, rec in pairs(C.active) do
    if rec.battle == battle then out[#out + 1] = uid end
  end
  return out
end

-- Tên mon đang active của side
local function active_name(battle, side_idx)
  local side = battle.sides and battle.sides[side_idx]
  if not side then return "?" end
  local mon = side.mons and side.mons[side.active or 1]
  if not mon then return "?" end
  return PW.pokemon.name(mon)
end

-- Dịch 1 event thành text gửi cho các uid trong trận
local function broadcast_event(battle, ev, uids)
  local msgs = {}
  if ev.t == "msg" then
    msgs[#msgs + 1] = PW.T(ev.key, unpack(ev.args or {}))
  elseif ev.t == "dmg" then
    local side = battle.sides[ev.side]
    local mon = side and side.mons and side.mons[ev.slot]
    local nm = mon and PW.pokemon.name(mon) or "?"
    msgs[#msgs + 1] = PW.T("battle.dmg", nm, ev.dmg or 0)
    if ev.crit then msgs[#msgs + 1] = PW.T("battle.crit") end
    if ev.eff then
      if ev.eff == 0 then msgs[#msgs + 1] = PW.T("battle.no_eff")
      elseif ev.eff > 1 then msgs[#msgs + 1] = PW.T("battle.super_eff")
      elseif ev.eff < 1 then msgs[#msgs + 1] = PW.T("battle.not_eff") end
    end
  elseif ev.t == "faint" then
    local side = battle.sides[ev.side]
    local mon = side and side.mons and side.mons[ev.slot]
    msgs[#msgs + 1] = PW.T("battle.faint", mon and PW.pokemon.name(mon) or "?")
  elseif ev.t == "exp" then
    local side = battle.sides[ev.side]
    local mon = side and side.mons and side.mons[ev.slot]
    local nm = mon and PW.pokemon.name(mon) or "?"
    msgs[#msgs + 1] = PW.T("battle.exp_gain", nm, ev.amount or 0)
    for i = 1, #(ev.levels or {}) do
      msgs[#msgs + 1] = PW.T("battle.level_up", nm, ev.levels[i])
    end
  elseif ev.t == "catch" then
    if ev.caught then
      msgs[#msgs + 1] = PW.T("battle.catch_ok", active_name(battle, 2))
    else
      msgs[#msgs + 1] = PW.T("battle.catch_fail", ev.shakes or 0)
    end
  elseif ev.t == "run" then
    msgs[#msgs + 1] = PW.T(ev.ok and "battle.run_ok" or "battle.run_fail")
  end
  for i = 1, #uids do
    for j = 1, #msgs do api.send_message(uids[i], msgs[j]) end
  end
end

-- Kết thúc trận cho uid: mở khóa, đóng UI, tiến hóa, save
function C.finish(uid, result)
  local rec = C.active[uid]
  if not rec then return end
  C.active[uid] = nil
  api.lock_movement(uid, false)
  if PW.ui and PW.ui.battle and PW.ui.battle.close then
    PW.ui.battle.close(uid)
  end

  local player = PW.store.get(uid)
  if player and player.party then
    -- Check tiến hóa theo level cho từng mon trong đội
    for i = 1, #player.party do
      local mon = player.party[i]
      local new_dex = PW.evolution.check(mon, "level")
      if new_dex then
        local old_name = PW.pokemon.name(mon)
        PW.evolution.evolve(mon, new_dex)
        api.send_message(uid, PW.T("battle.evolved", old_name, PW.pokemon.name(mon)))
      end
    end
  end

  -- Callback đặc thù (wild/trainer/pvp tự xử lý thưởng riêng)
  if rec.meta and rec.meta.on_finish then
    local ok, err = pcall(rec.meta.on_finish, result or {})
    if not ok then PW.log.warn("battle_ctrl: on_finish loi: %s", tostring(err)) end
  end

  PW.store.save(uid)
  PW.log.info("battle_ctrl: finish uid=%s", tostring(uid))
end

-- Đẩy action của uid vào battle; đủ 2 phía thì resolve và phát events
function C.submit(uid, action)
  local rec = C.active[uid]
  if not rec then
    api.send_message(uid, PW.T("battle.no_battle"))
    return false
  end
  local b = rec.battle
  b:submit(rec.side_idx, action)
  if not b:ready() then return true end

  local res = b:resolve()
  local uids = uids_of(b)
  for i = 1, #(res.events or {}) do
    local ev = res.events[i]
    broadcast_event(b, ev, uids)
    -- Cập nhật HP trên UI sau mỗi event sát thương
    if ev.t == "dmg" and PW.ui and PW.ui.battle and PW.ui.battle.update_hp then
      PW.ui.battle.update_hp(uids, b, ev.side, ev.slot)
    end
  end

  if res.over then
    -- Kết thúc cho mọi uid gắn với battle này (pvp: 2 người)
    for i = 1, #uids do
      local u = uids[i]
      local r = C.active[u]
      local result = {
        winner = res.winner,
        won = (res.winner ~= nil and r ~= nil and res.winner == r.side_idx) or false,
        events = res.events,
      }
      C.finish(u, result)
    end
  end
  return true
end

-- ============ Lệnh fallback khi chưa có UI ============
PW.commands.register{
  name = "move", aliases = {}, gm = false, help = "battle.cmd_move",
  fn = function(ctx, args)
    local i = tonumber(args[1])
    if not i or i < 1 or i > 4 then
      api.send_message(ctx.uid, PW.T("battle.bad_arg")); return
    end
    C.submit(ctx.uid, { t = "move", i = i })
  end,
}

PW.commands.register{
  name = "switch", aliases = {}, gm = false, help = "battle.cmd_switch",
  fn = function(ctx, args)
    local slot = tonumber(args[1])
    if not slot then
      api.send_message(ctx.uid, PW.T("battle.bad_arg")); return
    end
    C.submit(ctx.uid, { t = "switch", slot = slot })
  end,
}

PW.commands.register{
  name = "ball", aliases = {}, gm = false, help = "battle.cmd_ball",
  fn = function(ctx, args)
    local id = args[1]
    if not id then
      api.send_message(ctx.uid, PW.T("battle.bad_arg")); return
    end
    local rec = C.active[ctx.uid]
    if rec and rec.kind ~= "wild" then
      -- Không được ném bóng trong trận trainer/pvp
      api.send_message(ctx.uid, PW.T("battle.bad_arg")); return
    end
    C.submit(ctx.uid, { t = "ball", id = id })
  end,
}

PW.commands.register{
  name = "run", aliases = {}, gm = false, help = "battle.cmd_run",
  fn = function(ctx, args)
    local rec = C.active[ctx.uid]
    if rec and rec.kind ~= "wild" then
      api.send_message(ctx.uid, PW.T("battle.bad_arg")); return
    end
    C.submit(ctx.uid, { t = "run" })
  end,
}

-- Người chơi rời room giữa trận: hủy trận
PW.hooks.on("leave", function(uid)
  if C.active[uid] then
    C.finish(uid, { won = false, aborted = true })
  end
end)
