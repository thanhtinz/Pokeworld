-- PokeWorld | 90_main/90_commands.lua | Router lệnh chat (.lệnh) + lệnh GM
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["cmd.unknown"]      = "Lệnh không tồn tại. Gõ .help để xem danh sách.",
  ["cmd.gm_only"]      = "Lệnh này chỉ dành cho GM.",
  ["cmd.help_header"]  = "== Lệnh PokeWorld (trang %d/%d) ==",
  ["cmd.help_line"]    = ".%s — %s",
  ["cmd.gm_give"]      = "Đã đưa %s x%d cho %s.",
  ["cmd.gm_givepoke"]  = "Đã tặng %s (lv %d) cho %s.",
  ["cmd.gm_money"]     = "Tiền của %s: %d.",
  ["cmd.gm_done"]      = "Đã thực hiện.",
  ["cmd.gm_bad_args"]  = "Sai tham số. Xem .help.",
  ["cmd.gm_no_player"] = "Không tìm thấy người chơi %s.",
  ["cmd.gm_sim_head"]  = "== Mô phỏng %s vs %s ==",
}

local commands = {}
PW.commands = commands

local registry = {}   -- name -> def
local alias_map = {}  -- alias -> name

-- def = { name=, aliases={}, gm=bool, help="loc_key", fn=function(ctx, args) }
function commands.register(def)
  registry[def.name] = def
  for _, a in ipairs(def.aliases or {}) do alias_map[a] = def.name end
end

-- Nạp hàng đợi lệnh do các module 40-70 đăng ký trước khi router load
for _, def in ipairs(PW.pending_commands or {}) do commands.register(def) end
PW.pending_commands = setmetatable({}, { __newindex = function(_, _, def) commands.register(def) end })

local function msg(uid, text)
  if PW.ui_common and PW.ui_common.msg then PW.ui_common.msg(uid, text)
  else print("[PW->" .. tostring(uid) .. "] " .. text) end
end

-- Tìm uid theo tên hiển thị (adapter danh sách người chơi)
-- CREATA-API: Player:getAllPlayers() / Player:getNickname(uid)
function commands.find_player(name)
  if PW.online then
    for uid, info in pairs(PW.online) do
      if info.name and info.name:lower() == name:lower() then return uid, info end
    end
  end
  return nil
end

-- Xử lý 1 dòng chat. Trả về true nếu là lệnh (đã xử lý, chặn hiển thị chat).
function commands.handle_chat(uid, name, text)
  if type(text) ~= "string" or text:sub(1, 1) ~= "." then
    -- Trả lời menu dạng số cho fallback chat-menu
    local n = tonumber(text)
    if n and PW.ui_common and PW.ui_common.on_menu_reply then
      return PW.ui_common.on_menu_reply(uid, n)
    end
    return false
  end
  local parts = PW.util.split(text:sub(2))
  if #parts == 0 then return false end
  local cmd = parts[1]:lower()
  table.remove(parts, 1)

  local ctx = { uid = uid, name = name, pos = commands.player_pos and commands.player_pos(uid) or nil }

  -- Nhánh GM: .gm <lệnh con> ...
  if cmd == "gm" then
    if not PW.is_gm(uid) then msg(uid, PW.T("cmd.gm_only")) return true end
    local sub = (parts[1] or "panel"):lower()
    table.remove(parts, 1)
    local def = registry["gm_" .. sub]
    if def then
      local ok, err = pcall(def.fn, ctx, parts)
      if not ok then PW.log.warn("lenh gm_%s loi: %s", sub, tostring(err)) end
    else
      msg(uid, PW.T("cmd.unknown"))
    end
    return true
  end

  local def = registry[cmd] or registry[alias_map[cmd] or ""]
  if not def then msg(uid, PW.T("cmd.unknown")) return true end
  if def.gm and not PW.is_gm(uid) then msg(uid, PW.T("cmd.gm_only")) return true end
  local ok, err = pcall(def.fn, ctx, parts)
  if not ok then PW.log.warn("lenh %s loi: %s", cmd, tostring(err)) end
  return true
end

-- ==== Lệnh chung ====

commands.register{ name = "help", aliases = {}, help = "help.help", fn = function(ctx, args)
  local page = tonumber(args[1]) or 1
  local names = {}
  for n, d in pairs(registry) do
    if not d.gm and not n:match("^gm_") then names[#names + 1] = n end
  end
  table.sort(names)
  local per = 10
  local total = math.max(1, math.ceil(#names / per))
  page = PW.util.clamp(page, 1, total)
  msg(ctx.uid, PW.T("cmd.help_header", page, total))
  for i = (page - 1) * per + 1, math.min(page * per, #names) do
    local d = registry[names[i]]
    msg(ctx.uid, PW.T("cmd.help_line", names[i], PW.T(d.help or "")))
  end
end }

-- ==== Lệnh GM (đăng ký với prefix gm_) ====

commands.register{ name = "gm_give", gm = true, fn = function(ctx, args)
  local target_name, item_id, n = args[1], args[2], tonumber(args[3]) or 1
  local uid = commands.find_player(target_name or "")
  if not uid then msg(ctx.uid, PW.T("cmd.gm_no_player", tostring(target_name))) return end
  if not (PW.items and PW.items[item_id]) then msg(ctx.uid, PW.T("cmd.gm_bad_args")) return end
  local p = PW.store.get(uid)
  p.bag[item_id] = (p.bag[item_id] or 0) + n
  PW.store.mark_dirty(uid)
  msg(ctx.uid, PW.T("cmd.gm_give", PW.T(PW.items[item_id].name_key), n, target_name))
end }

commands.register{ name = "gm_givepoke", gm = true, fn = function(ctx, args)
  local target_name, sp, lv = args[1], tonumber(args[2]), tonumber(args[3]) or 5
  local shiny = args[4] == "shiny" or args[4] == "true"
  local uid = commands.find_player(target_name or "")
  if not uid then msg(ctx.uid, PW.T("cmd.gm_no_player", tostring(target_name))) return end
  if not (sp and PW.species[sp]) then msg(ctx.uid, PW.T("cmd.gm_bad_args")) return end
  local p = PW.store.get(uid)
  local mon = PW.pokemon.new(sp, lv, { shiny = shiny, ot = uid, ot_name = target_name })
  PW.party.add(p, mon)
  if PW.dex then PW.dex.mark_caught(p, sp) end
  PW.store.mark_dirty(uid)
  msg(ctx.uid, PW.T("cmd.gm_givepoke", PW.pokemon.name(mon), lv, target_name))
end }

commands.register{ name = "gm_money", gm = true, fn = function(ctx, args)
  local target_name, amount = args[1], tonumber(args[2])
  local uid = commands.find_player(target_name or "")
  if not uid or not amount then msg(ctx.uid, PW.T("cmd.gm_bad_args")) return end
  local p = PW.store.get(uid)
  p.money = PW.util.clamp(p.money + amount, 0, PW.config.MONEY_CAP)
  PW.store.mark_dirty(uid)
  msg(ctx.uid, PW.T("cmd.gm_money", target_name, p.money))
end }

commands.register{ name = "gm_setlevel", gm = true, fn = function(ctx, args)
  local target_name, slot, lv = args[1], tonumber(args[2]), tonumber(args[3])
  local uid = commands.find_player(target_name or "")
  if not uid or not slot or not lv then msg(ctx.uid, PW.T("cmd.gm_bad_args")) return end
  local p = PW.store.get(uid)
  local mon = p.party[slot]
  if not mon then msg(ctx.uid, PW.T("cmd.gm_bad_args")) return end
  mon.lv = PW.util.clamp(lv, 1, PW.config.MAX_LEVEL)
  local spec = PW.species[mon.sp]
  mon.exp = PW.exp.for_level(spec.exp_curve, mon.lv)
  PW.pokemon.heal(mon)
  PW.store.mark_dirty(uid)
  msg(ctx.uid, PW.T("cmd.gm_done"))
end }

commands.register{ name = "gm_heal", gm = true, fn = function(ctx, args)
  local target = args[1] or "all"
  if target == "all" then
    for uid in pairs(PW.store.all()) do PW.party.heal_all(PW.store.get(uid)) end
  else
    local uid = commands.find_player(target)
    if not uid then msg(ctx.uid, PW.T("cmd.gm_no_player", target)) return end
    PW.party.heal_all(PW.store.get(uid))
  end
  msg(ctx.uid, PW.T("cmd.gm_done"))
end }

commands.register{ name = "gm_spawn", gm = true, fn = function(ctx, args)
  local sp, lv = tonumber(args[1]), tonumber(args[2]) or 5
  local shiny = args[3] == "shiny" or args[3] == "true"
  if not (sp and PW.species[sp]) then msg(ctx.uid, PW.T("cmd.gm_bad_args")) return end
  if PW.spawner then PW.spawner.spawn_at(sp, lv, ctx.pos or { x = 0, y = 0, z = 0 }, shiny) end
  msg(ctx.uid, PW.T("cmd.gm_done"))
end }

commands.register{ name = "gm_spawnrate", gm = true, fn = function(ctx, args)
  local zone, pct = args[1], tonumber((args[2] or ""):match("(%d+)"))
  if not zone or not pct then msg(ctx.uid, PW.T("cmd.gm_bad_args")) return end
  if PW.spawner then PW.spawner.set_rate(zone, pct / 100) end
  msg(ctx.uid, PW.T("cmd.gm_done"))
end }

commands.register{ name = "gm_spawnoff", gm = true, fn = function(ctx)
  if PW.spawner then PW.spawner.set_enabled(false) end
  msg(ctx.uid, PW.T("cmd.gm_done"))
end }

commands.register{ name = "gm_spawnon", gm = true, fn = function(ctx)
  if PW.spawner then PW.spawner.set_enabled(true) end
  msg(ctx.uid, PW.T("cmd.gm_done"))
end }

commands.register{ name = "gm_despawnall", gm = true, fn = function(ctx)
  if PW.spawner then PW.spawner.despawn_all() end
  msg(ctx.uid, PW.T("cmd.gm_done"))
end }

commands.register{ name = "gm_event", gm = true, fn = function(ctx, args)
  local id, state = args[1], args[2]
  if not id or not PW.events then msg(ctx.uid, PW.T("cmd.gm_bad_args")) return end
  PW.events.set(id, state == "on")
  msg(ctx.uid, PW.T("cmd.gm_done"))
end }

commands.register{ name = "gm_boss", gm = true, fn = function(ctx, args)
  local sp, mult = tonumber(args[1]), tonumber(args[2]) or 10
  if not (sp and PW.species[sp]) then msg(ctx.uid, PW.T("cmd.gm_bad_args")) return end
  if PW.raid then PW.raid.start_boss(sp, mult, ctx.pos) end
  msg(ctx.uid, PW.T("cmd.gm_done"))
end }

commands.register{ name = "gm_save", gm = true, fn = function(ctx, args)
  local target = args[1] or "all"
  if target == "all" then PW.store.save_all()
  else
    local uid = commands.find_player(target)
    if uid then PW.store.save(uid) end
  end
  msg(ctx.uid, PW.T("cmd.gm_done"))
end }

commands.register{ name = "gm_wipe", gm = true, fn = function(ctx, args)
  local target, confirm = args[1], args[2]
  if confirm ~= "CONFIRM" then msg(ctx.uid, ".gm wipe <player> CONFIRM") return end
  local uid = commands.find_player(target or "")
  if not uid then msg(ctx.uid, PW.T("cmd.gm_no_player", tostring(target))) return end
  PW.store.wipe(uid)
  msg(ctx.uid, PW.T("cmd.gm_done"))
end }

commands.register{ name = "gm_inspect", gm = true, fn = function(ctx, args)
  local uid = commands.find_player(args[1] or "")
  if not uid then msg(ctx.uid, PW.T("cmd.gm_no_player", tostring(args[1]))) return end
  local str = PW.ser.encode(PW.store.get(uid))
  PW.log.info("inspect %s: %s", tostring(uid), tostring(str))
  msg(ctx.uid, PW.T("cmd.gm_done"))
end }

commands.register{ name = "gm_migrate", gm = true, fn = function(ctx)
  for uid in pairs(PW.store.all()) do
    PW.playerdata.migrate(PW.store.get(uid))
    PW.store.mark_dirty(uid)
  end
  msg(ctx.uid, PW.T("cmd.gm_done"))
end }

commands.register{ name = "gm_log", gm = true, fn = function(ctx, args)
  PW.log.set_level(args[1] or "info")
  msg(ctx.uid, PW.T("cmd.gm_done"))
end }

commands.register{ name = "gm_panel", gm = true, fn = function(ctx)
  if PW.ui and PW.ui.admin then PW.ui.admin.open(ctx.uid) end
end }

commands.register{ name = "gm_reloadspawns", gm = true, fn = function(ctx)
  -- CREATA không hot-reload script data — chỉ reset trạng thái spawner
  if PW.spawner then PW.spawner.despawn_all() end
  msg(ctx.uid, PW.T("cmd.gm_done"))
end }

-- .gm sim <atk_sp> <def_sp>: chạy 1 trận mô phỏng thuần model, in ra log
commands.register{ name = "gm_sim", gm = true, fn = function(ctx, args)
  local sp_a, sp_b = tonumber(args[1]), tonumber(args[2])
  if not (sp_a and sp_b and PW.species[sp_a] and PW.species[sp_b]) then
    msg(ctx.uid, PW.T("cmd.gm_bad_args")) return
  end
  local a = PW.pokemon.new(sp_a, 20)
  local b = PW.pokemon.new(sp_b, 20)
  PW.log.info(PW.T("cmd.gm_sim_head", PW.pokemon.name(a), PW.pokemon.name(b)))
  local btl = PW.battle.new{ kind = "wild", sides = {
    { mons = { a }, kind = "wild" }, { mons = { b }, kind = "wild" },
  } }
  for turn = 1, 50 do
    if btl.over then break end
    local res = btl:resolve()
    for _, e in ipairs(res.events) do
      if e.t == "msg" then PW.log.info("  %s", PW.T(e.key, unpack(e.args or {})))
      elseif e.t == "dmg" then PW.log.info("  -> side %d nhan %d dmg", e.side, e.dmg)
      elseif e.t == "end" then PW.log.info("  KET THUC: side %s thang", tostring(e.winner)) end
    end
  end
  msg(ctx.uid, PW.T("cmd.gm_done"))
end }
