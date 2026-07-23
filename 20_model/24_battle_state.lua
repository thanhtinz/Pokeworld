-- PokeWorld | 20_model/24_battle_state.lua | State machine trận đấu: hàng đợi lượt, resolve action
local PW = _G.PW or {}; _G.PW = PW

local battle = {}
PW.battle = battle

local Battle = {}
Battle.__index = Battle

-- Tạo trận mới.
-- args = { kind = "wild"|"trainer"|"pvp",
--          sides = { {mons={...}, id=, kind="player"|"wild"|"trainer"}, {...} },
--          rng = (tùy chọn) }
function battle.new(args)
  local b = setmetatable({
    kind    = args.kind or "wild",
    sides   = {},
    rng     = args.rng or PW.rng.main,
    turn    = 1,
    over    = false,
    winner  = nil,
    pending = {}, -- action đã submit theo side idx
  }, Battle)
  for i, s in ipairs(args.sides) do
    b.sides[i] = {
      mons = s.mons, id = s.id, kind = s.kind or "player",
      active = nil,
      stages = { atk = 0, def = 0, spa = 0, spd = 0, spe = 0 }, -- stage của con đang ra sân
    }
    -- Con đầu tiên còn sống ra sân
    for slot, m in ipairs(s.mons) do
      if not PW.pokemon.is_fainted(m) then b.sides[i].active = slot break end
    end
  end
  return b
end

local function active_mon(b, i)
  local s = b.sides[i]
  return s.mons[s.active], s.active
end

local function other(i) return i == 1 and 2 or 1 end

-- Side AI (wild/trainer) tự chọn action
local function ai_action(b, i)
  local mon = active_mon(b, i)
  if not mon then return { t = "pass" } end
  -- Chọn chiêu còn PP ngẫu nhiên; trainer ưu tiên chiêu khắc hệ
  local usable = {}
  for idx, mv in ipairs(mon.moves) do
    if (mv.pp or 0) > 0 then usable[#usable + 1] = idx end
  end
  if #usable == 0 then return { t = "struggle" } end
  if b.sides[i].kind == "trainer" then
    local foe = active_mon(b, other(i))
    local best, best_eff = nil, -1
    for _, idx in ipairs(usable) do
      local mv = PW.moves[mon.moves[idx].id]
      if mv and mv.power then
        local eff = PW.types.eff(mv.type, PW.species[foe.sp].types)
        if eff > best_eff then best, best_eff = idx, eff end
      end
    end
    if best then return { t = "move", i = best } end
  end
  return { t = "move", i = b.rng:pick(usable) }
end

-- Người chơi (hoặc controller) submit action cho side idx
-- action = {t="move", i=} | {t="switch", slot=} | {t="item", id=, target_slot=} | {t="ball", id=} | {t="run"}
function Battle:submit(side_idx, action)
  if self.over then return false, "battle.already_over" end
  -- Chặn hành vi không hợp lệ theo loại trận
  if action.t == "ball" and self.kind ~= "wild" then return false, "battle.no_catch" end
  if action.t == "run" and self.kind == "trainer" then return false, "battle.no_run" end
  if action.t == "move" then
    local mon = active_mon(self, side_idx)
    local mv = mon and mon.moves[action.i]
    if not mv then return false, "battle.bad_move" end
    if (mv.pp or 0) <= 0 then return false, "battle.no_pp" end
  end
  if action.t == "switch" then
    local s = self.sides[side_idx]
    local target = s.mons[action.slot]
    if not target or PW.pokemon.is_fainted(target) or action.slot == s.active then
      return false, "battle.bad_switch"
    end
  end
  self.pending[side_idx] = action
  return true
end

-- Đủ action để resolve chưa? (side AI tự điền)
function Battle:ready()
  for i, s in ipairs(self.sides) do
    if not self.pending[i] then
      if s.kind == "wild" or s.kind == "trainer" then
        self.pending[i] = ai_action(self, i)
      else
        return false
      end
    end
  end
  return true
end

-- Độ ưu tiên của action: run/switch/item trước, move theo priority + speed
local function action_order(b)
  local entries = {}
  for i = 1, #b.sides do
    local a = b.pending[i]
    local pri = 0
    if a.t == "run" or a.t == "ball" or a.t == "item" or a.t == "switch" then
      pri = 10
    elseif a.t == "move" then
      local mon = active_mon(b, i)
      local mv = PW.moves[mon.moves[a.i].id]
      pri = (mv and mv.priority or 0)
    end
    local mon = active_mon(b, i)
    local spe = mon and (PW.pokemon.stats(mon).spe * PW.status.speed_mult(mon)) or 0
    entries[#entries + 1] = { side = i, pri = pri, spe = spe }
  end
  table.sort(entries, function(x, y)
    if x.pri ~= y.pri then return x.pri > y.pri end
    if x.spe ~= y.spe then return x.spe > y.spe end
    return b.rng:roll(0.5) -- speed tie: random
  end)
  return entries
end

local function push(ev, e) ev[#ev + 1] = e end

-- Xử lý faint của side i; trả về true nếu side hết mon (thua)
local function handle_faint(b, i, ev)
  local s = b.sides[i]
  local mon = s.mons[s.active]
  push(ev, { t = "faint", side = i, slot = s.active })
  -- Cho EXP nếu phía kia là người chơi
  local oi = other(i)
  if b.sides[oi].kind == "player" and (s.kind == "wild" or s.kind == "trainer") then
    local winner_mon = active_mon(b, oi)
    if winner_mon and not PW.pokemon.is_fainted(winner_mon) then
      local amount = PW.exp.yield(mon, 1)
      local levels = PW.exp.gain(winner_mon, amount)
      PW.pokemon.add_ev(winner_mon, PW.species[mon.sp].ev_yield)
      push(ev, { t = "exp", side = oi, slot = b.sides[oi].active, amount = amount, levels = levels })
      -- Chiêu mới tại các level vừa đạt
      for _, lv in ipairs(levels) do
        for _, mv_id in ipairs(PW.exp.moves_at_level(winner_mon.sp, lv)) do
          local res = PW.pokemon.try_learn(winner_mon, mv_id)
          if res then push(ev, { t = "learn", side = oi, slot = b.sides[oi].active, move = mv_id, full = (res == "full") }) end
        end
      end
    end
  end
  -- Tự động đưa con kế tiếp ra sân (AI); người chơi sẽ được UI hỏi
  local next_slot = nil
  for slot, m in ipairs(s.mons) do
    if not PW.pokemon.is_fainted(m) then next_slot = slot break end
  end
  if next_slot then
    if s.kind ~= "player" then
      s.active = next_slot
      s.stages = { atk = 0, def = 0, spa = 0, spd = 0, spe = 0 }
      push(ev, { t = "send_out", side = i, slot = next_slot })
    else
      s.must_switch = true -- UI bắt người chơi chọn con kế
    end
    return false
  end
  return true -- hết mon
end

local function end_battle(b, winner, ev)
  b.over = true
  b.winner = winner
  push(ev, { t = "end", winner = winner })
end

-- Thực thi 1 move của side i lên side kia
local function do_move(b, i, move_idx, ev)
  local mon = active_mon(b, i)
  local oi = other(i)
  local foe = active_mon(b, oi)
  if not mon or not foe then return end

  local ok, reason = PW.status.can_act(mon, b.rng)
  if reason then push(ev, { t = "msg", key = reason, args = { PW.pokemon.name(mon) } }) end
  if not ok then return end

  local slot_mv = mon.moves[move_idx]
  local mv_id, mv
  if move_idx == "struggle" then
    mv_id, mv = "struggle", { type = "normal", category = "physical", power = 50, acc = 100 }
  else
    mv_id = slot_mv.id
    mv = PW.moves[mv_id]
    slot_mv.pp = math.max(0, (slot_mv.pp or 0) - 1)
  end
  push(ev, { t = "msg", key = "battle.used_move", args = { PW.pokemon.name(mon), PW.T((mv.name_key or ("mv." .. mv_id))) } })

  local ctx = {
    rng = b.rng,
    att_stage = mv.category == "physical" and b.sides[i].stages.atk or b.sides[i].stages.spa,
    def_stage = mv.category == "physical" and b.sides[oi].stages.def or b.sides[oi].stages.spd,
  }
  local res = PW.damage.calc(mon, foe, mv_id, ctx)
  if move_idx == "struggle" then -- struggle không có trong bảng moves: tính tay
    local st_a, st_d = PW.pokemon.stats(mon), PW.pokemon.stats(foe)
    local dmg = math.floor((math.floor(math.floor(2 * mon.lv / 5 + 2) * 50 * st_a.atk / math.max(1, st_d.def)) / 50) + 2)
    res = { dmg = dmg, crit = false, eff = 1, missed = false }
  end

  if res.missed then
    push(ev, { t = "msg", key = "battle.missed", args = { PW.pokemon.name(mon) } })
    return
  end

  if res.dmg > 0 then
    foe.hp_cur = math.max(0, foe.hp_cur - res.dmg)
    push(ev, { t = "dmg", side = oi, slot = b.sides[oi].active, dmg = res.dmg, crit = res.crit, eff = res.eff })
    if res.crit then push(ev, { t = "msg", key = "battle.crit" }) end
    local ek = PW.damage.eff_key(res.eff)
    if ek then push(ev, { t = "msg", key = ek }) end
    -- Recoil / drain
    local eff_def = mv.effect
    if eff_def and eff_def.kind == "recoil" then
      local rec = math.max(1, math.floor(res.dmg * eff_def.frac))
      mon.hp_cur = math.max(0, mon.hp_cur - rec)
      push(ev, { t = "dmg", side = i, slot = b.sides[i].active, dmg = rec, crit = false, eff = 1 })
      push(ev, { t = "msg", key = "battle.recoil", args = { PW.pokemon.name(mon) } })
    elseif eff_def and eff_def.kind == "drain" then
      local heal = math.max(1, math.floor(res.dmg * eff_def.frac))
      mon.hp_cur = math.min(PW.pokemon.max_hp(mon), mon.hp_cur + heal)
      push(ev, { t = "heal", side = i, slot = b.sides[i].active, amount = heal })
    end
  end

  -- Hiệu ứng phụ
  local eff_def = mv.effect
  if eff_def and res.eff ~= 0 then
    local chance = (eff_def.chance or 100) / 100
    if eff_def.kind == "status" and b.rng:roll(chance) and not PW.pokemon.is_fainted(foe) then
      if PW.status.apply(foe, eff_def.id, b.rng) then
        push(ev, { t = "msg", key = "status.applied_" .. eff_def.id, args = { PW.pokemon.name(foe) } })
      end
    elseif eff_def.kind == "stat" and b.rng:roll(chance) then
      local target_side = (eff_def.target == "self") and i or oi
      local st = b.sides[target_side].stages
      local old = st[eff_def.stat] or 0
      st[eff_def.stat] = PW.util.clamp(old + eff_def.stages, -6, 6)
      if st[eff_def.stat] ~= old then
        push(ev, { t = "msg", key = eff_def.stages > 0 and "battle.stat_up" or "battle.stat_down",
                   args = { PW.pokemon.name(active_mon(b, target_side)), PW.T("stat." .. eff_def.stat) } })
      end
    elseif eff_def.kind == "heal" then
      local amount = math.floor(PW.pokemon.max_hp(mon) * eff_def.frac)
      mon.hp_cur = math.min(PW.pokemon.max_hp(mon), mon.hp_cur + amount)
      push(ev, { t = "heal", side = i, slot = b.sides[i].active, amount = amount })
    elseif eff_def.kind == "flinch" and b.rng:roll(chance) then
      b.sides[oi].flinched = true
    end
  end
end

-- Resolve 1 lượt đầy đủ. Trả về { events = {...}, over = bool, winner = side_idx|nil }
function Battle:resolve()
  local ev = {}
  if self.over then return { events = ev, over = true, winner = self.winner } end
  if not self:ready() then return { events = ev, over = false } end

  local order = action_order(self)
  for _, entry in ipairs(order) do
    if self.over then break end
    local i = entry.side
    local oi = other(i)
    local a = self.pending[i]
    local s = self.sides[i]
    local mon = active_mon(self, i)

    if mon and PW.pokemon.is_fainted(mon) then
      -- Con vừa gục trong lượt này, bỏ qua action
    elseif s.flinched then
      s.flinched = nil
      push(ev, { t = "msg", key = "battle.flinched", args = { PW.pokemon.name(mon) } })
    elseif a.t == "run" then
      -- Tỉ lệ chạy theo speed 2 bên
      local my_spe = PW.pokemon.stats(mon).spe
      local foe_mon = active_mon(self, oi)
      local foe_spe = foe_mon and PW.pokemon.stats(foe_mon).spe or 1
      local chance = PW.util.clamp(PW.config.RUN_BASE_CHANCE + (my_spe - foe_spe) / 200, 0.1, 0.95)
      if self.kind == "pvp" then chance = 1 end -- pvp: đầu hàng luôn được
      local ok = self.rng:roll(chance)
      push(ev, { t = "run", ok = ok, side = i })
      if ok then
        end_battle(self, oi, ev)
      else
        push(ev, { t = "msg", key = "battle.run_fail" })
      end
    elseif a.t == "switch" then
      s.active = a.slot
      s.stages = { atk = 0, def = 0, spa = 0, spd = 0, spe = 0 }
      s.must_switch = nil
      push(ev, { t = "send_out", side = i, slot = a.slot })
    elseif a.t == "item" then
      -- Item dùng trong trận: controller (50_battle_ctrl) đã trừ khỏi bag,
      -- ở đây chỉ áp hiệu ứng lên mon chỉ định
      local item = PW.items and PW.items[a.id]
      local target = s.mons[a.target_slot or s.active]
      if item and item.effect and target then
        if item.effect.heal then
          local amount = item.effect.heal
          local max = PW.pokemon.max_hp(target)
          if amount == "full" then amount = max end
          local before = target.hp_cur
          target.hp_cur = math.min(max, target.hp_cur + amount)
          push(ev, { t = "heal", side = i, slot = a.target_slot or s.active, amount = target.hp_cur - before })
        end
        if item.effect.cure then
          PW.status.cure(target)
        end
        push(ev, { t = "msg", key = "battle.used_item", args = { PW.T(item.name_key) } })
      end
    elseif a.t == "ball" then
      local foe_mon = active_mon(self, oi)
      local res = PW.catch.attempt(foe_mon, a.id, { rng = self.rng })
      push(ev, { t = "catch", caught = res.caught, shakes = res.shakes, crit = res.crit })
      if res.caught then
        foe_mon.ball = a.id
        end_battle(self, i, ev)
        self.caught_mon = foe_mon
      end
    elseif a.t == "move" or a.t == "struggle" then
      do_move(self, i, a.t == "struggle" and "struggle" or a.i, ev)
      -- Kiểm tra gục sau đòn
      local foe_mon = active_mon(self, oi)
      if foe_mon and PW.pokemon.is_fainted(foe_mon) then
        if handle_faint(self, oi, ev) then end_battle(self, i, ev) end
      end
      local self_mon = active_mon(self, i)
      if self_mon and PW.pokemon.is_fainted(self_mon) then -- recoil tự gục
        if handle_faint(self, i, ev) then end_battle(self, oi, ev) end
      end
    end
  end

  -- Cuối lượt: damage trạng thái
  if not self.over then
    for i = 1, #self.sides do
      local mon = active_mon(self, i)
      if mon and not PW.pokemon.is_fainted(mon) then
        local r = PW.status.end_of_turn(mon)
        if r.dmg > 0 then
          push(ev, { t = "dmg", side = i, slot = self.sides[i].active, dmg = r.dmg, crit = false, eff = 1 })
          push(ev, { t = "msg", key = r.msg_key, args = { PW.pokemon.name(mon) } })
          if PW.pokemon.is_fainted(mon) then
            if handle_faint(self, i, ev) then end_battle(self, other(i), ev) end
          end
        end
      end
    end
  end

  self.pending = {}
  self.turn = self.turn + 1
  return { events = ev, over = self.over, winner = self.winner }
end
