-- PokeWorld | 90_main/99_init.lua | Bootstrap: validate data, đăng ký engine, khởi động spawner
local PW = _G.PW or {}; _G.PW = PW

local init = {}
PW.init = init

-- ==== Validate data lúc khởi động (fail sớm, log rõ) ====
local function validate_data()
  local errors = 0
  local function bad(fmt, ...)
    errors = errors + 1
    PW.log.warn("VALIDATE: " .. fmt, ...)
  end

  -- Species tham chiếu đủ trường
  for no, spec in pairs(PW.species or {}) do
    if not spec.base or not spec.base.hp then bad("species %d thieu base stats", no) end
    if not PW.loc[spec.name_key or ""] then bad("species %d thieu loc %s", no, tostring(spec.name_key)) end
    for _, t in ipairs(spec.types or {}) do
      local found = false
      for _, lt in ipairs(PW.types.list) do if lt == t then found = true break end end
      if not found then bad("species %d he la: %s", no, t) end
    end
  end

  -- Learnsets / evolutions / spawns / trainers trỏ tới species + moves tồn tại
  for no, ls in pairs(PW.learnsets or {}) do
    if not PW.species[no] then bad("learnset cho species %d khong ton tai", no) end
    for lv, mv in pairs(ls) do
      if type(lv) == "number" and not PW.moves[mv] then bad("learnset %d: move %s khong co", no, tostring(mv)) end
    end
  end
  for no, def in pairs(PW.evolutions or {}) do
    local options = def.into and { def } or def
    for _, e in ipairs(options) do
      if e.into and not PW.species[e.into] then bad("evolution %d -> %s khong ton tai", no, tostring(e.into)) end
    end
  end
  for zone, list in pairs(PW.spawns or {}) do
    for _, e in ipairs(list) do
      if not PW.species[e.sp] then bad("spawn %s: species %s khong co", zone, tostring(e.sp)) end
    end
  end
  for id, tr in pairs(PW.trainers or {}) do
    for _, m in ipairs(tr.party or tr.team or {}) do
      if not PW.species[m.sp] then bad("trainer %s: species %s khong co", id, tostring(m.sp)) end
    end
  end

  return errors
end

-- ==== Bootstrap ====
function init.start()
  PW.log.info("PokeWorld khoi dong...")
  PW.log.info("data: %d species, %d moves, %d items, %d quests",
    PW.util.count(PW.species), PW.util.count(PW.moves),
    PW.util.count(PW.items), PW.util.count(PW.quests))

  local errors = validate_data()
  if errors > 0 then
    PW.log.warn("validate: %d loi data — kiem tra log o tren", errors)
  else
    PW.log.info("validate: data OK")
  end

  -- Gắn event engine CREATA (false = chạy chế độ dev offline)
  local engine_ok = PW.hooks.bind_engine()

  -- Spawn NPC tĩnh
  if PW.npc and PW.npc.spawn_all then
    local ok, err = pcall(PW.npc.spawn_all)
    if not ok then PW.log.warn("npc.spawn_all loi: %s", tostring(err)) end
  end

  PW.log.info("PokeWorld san sang (engine: %s)", engine_ok and "CREATA" or "dev/offline")
end

-- CREATA load script tuần tự — file này là cuối cùng nên gọi start luôn
init.start()
