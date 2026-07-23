-- PokeWorld | tools/harness.lua | Harness dev: load toàn bộ script đúng thứ tự rồi chạy smoke test
-- Chạy: lua tools/harness.lua  (từ thư mục gốc repo)

local DIRS = { "00_core", "10_data", "20_model", "30_save", "40_world", "50_battle", "60_ui", "70_systems", "90_main" }

-- Liệt kê file .lua trong 1 thư mục (cần ls; harness chỉ dùng khi dev ngoài CREATA)
local function list_lua(dir)
  local files = {}
  local p = io.popen('ls "' .. dir .. '"/*.lua 2>/dev/null')
  if p then
    for line in p:lines() do files[#files + 1] = line end
    p:close()
  end
  table.sort(files)
  return files
end

print("=== PokeWorld harness: load scripts ===")
local n = 0
for _, dir in ipairs(DIRS) do
  for _, f in ipairs(list_lua(dir)) do
    local ok, err = pcall(dofile, f)
    if not ok then
      print("LOI LOAD " .. f .. ": " .. tostring(err))
      os.exit(1)
    end
    n = n + 1
  end
end
print("=== Da load " .. n .. " script ===")

local PW = _G.PW

-- ==== Smoke test ====
local fails = 0
local function check(name, cond)
  if cond then print("[OK] " .. name)
  else fails = fails + 1 print("[FAIL] " .. name) end
end

-- Tạo Pokémon + stats
local pika = PW.pokemon.new(25, 20, { iv = {31,31,31,31,31,31}, nature = "jolly" })
check("tao pikachu lv20", pika ~= nil and pika.lv == 20)
local st = PW.pokemon.stats(pika)
check("stats hop ly (spe jolly ~ 60)", st.spe > 50 and st.hp > 30)

-- Damage + khắc hệ
local geo = PW.pokemon.new(74, 20)
local eff = PW.types.eff("electric", PW.species[74].types)
check("electric vs rock/ground = 0", eff == 0)
check("water vs rock/ground = 4", PW.types.eff("water", PW.species[74].types) == 4)

-- Battle sim trọn trận
local a = PW.pokemon.new(4, 20)  -- Charmander
local b = PW.pokemon.new(1, 20)  -- Bulbasaur
local btl = PW.battle.new{ kind = "wild", sides = {
  { mons = { a }, kind = "wild" }, { mons = { b }, kind = "wild" } } }
local turns = 0
while not btl.over and turns < 100 do
  btl:resolve()
  turns = turns + 1
end
check("battle ket thuc trong 100 luot (turns=" .. turns .. ", winner=" .. tostring(btl.winner) .. ")", btl.over)

-- Catch
local weak = PW.pokemon.new(10, 3) -- Caterpie
weak.hp_cur = 1
local caught_any = false
for _ = 1, 20 do
  if PW.catch.attempt(weak, "ultra_ball", {}).caught then caught_any = true break end
end
check("bat duoc caterpie 1hp voi ultra ball (20 lan thu)", caught_any)

-- EXP + evolution
local char = PW.pokemon.new(4, 15)
PW.exp.gain(char, PW.exp.for_level("medium_slow", 16) - char.exp + 10)
check("charmander len lv16", char.lv >= 16)
local evo = PW.evolution.check(char, "level")
check("charmander du dieu kien tien hoa -> 5", evo == 5)
check("evolve thanh charmeleon", PW.evolution.evolve(char, evo) and char.sp == 5)

-- Serializer round-trip
local p = PW.playerdata.default()
p.party[1] = pika
local enc = PW.ser.encode(p)
local dec = PW.ser.decode(enc)
check("serializer round-trip", dec ~= nil and dec.money == p.money and dec.party[1].sp == 25)

-- Save/load qua store (dev memory)
local player = PW.store.get("test_uid")
PW.party.add(player, PW.pokemon.new(7, 5))
check("party.add", #player.party == 1)
PW.store.save("test_uid")
check("dex bitmap", (function()
  PW.dex.mark_caught(player, 25)
  local s, c = PW.dex.counts(player)
  return c == 1 and PW.dex.is_caught(player, 25) and not PW.dex.is_caught(player, 26)
end)())

-- Breeding
local mom = PW.pokemon.new(25, 20, { gender = "f" })
local dad = PW.pokemon.new(25, 20, { gender = "m" })
local egg = PW.breeding.make_egg(mom, dad)
check("breeding tao trung pichu... (base=25 vi chua co pichu)", egg ~= nil and egg.sp == 25)

-- Command router (mô phỏng chat)
PW.hooks.emit("join", "gm_uid", "TestGM")
PW.config.GM_LIST["gm_uid"] = true
check("lenh .help chay khong loi", PW.commands.handle_chat("gm_uid", "TestGM", ".help"))
check("lenh .gm sim chay khong loi", PW.commands.handle_chat("gm_uid", "TestGM", ".gm sim 4 7"))

print(fails == 0 and "=== TAT CA SMOKE TEST OK ===" or ("=== " .. fails .. " TEST FAIL ==="))
os.exit(fails == 0 and 0 or 1)
