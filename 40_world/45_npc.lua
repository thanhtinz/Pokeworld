-- PokeWorld | 40_world/45_npc.lua | Bảng NPC thị trấn: giáo sư, y tá, cửa hàng, dạy chiêu
local PW = _G.PW or {}; _G.PW = PW

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["npc.professor_hello"]   = "Chào mừng đến thế giới Pokémon! Hãy chọn bạn đồng hành đầu tiên.",
  ["npc.starter_given"]     = "Bạn đã nhận được %s! Hãy chăm sóc nó thật tốt.",
  ["npc.professor_again"]   = "Hành trình của cháu thế nào rồi? Cố lên nhé!",
  ["npc.nurse_heal"]        = "Đội của bạn đã được hồi phục hoàn toàn. Hẹn gặp lại!",
  ["npc.mart_closed"]       = "Cửa hàng đang chuẩn bị hàng, quay lại sau nhé!",
  ["npc.tutor_todo"]        = "Ta sẽ dạy chiêu cho Pokémon của cháu... sau này nhé!",
  ["npc.heal_help"]         = "Hồi phục đội hình (chỉ dùng trong thị trấn): .heal",
  ["npc.heal_wrong_zone"]   = "Chỉ dùng được lệnh này khi đứng trong thị trấn!",
}

PW.npc = PW.npc or {}
local N = PW.npc

-- ============ Adapter CREATA ============
local api = {}

-- CREATA-API: PW.creata.spawn_creature(actor_type_id, pos) -> objid|nil
function api.spawn_actor(model_id, pos)
  return PW.creata.spawn_creature(model_id, pos)
end

-- CREATA-API: PW.creata.send(uid, text)
function api.send_message(uid, text)
  PW.creata.send(uid, text)
end

-- Định nghĩa NPC — model_id và pos là PLACEHOLDER, chỉnh theo map thật
N.defs = {
  professor = { model_id = "npc_professor", zone = "town_1", kind = "professor", pos = { x = 40, y = 40, z = 0 } },
  nurse     = { model_id = "npc_nurse",     zone = "town_1", kind = "center",    pos = { x = 50, y = 40, z = 0 } },
  mart      = { model_id = "npc_mart",      zone = "town_1", kind = "mart",      pos = { x = 60, y = 40, z = 0 } },
  tutor     = { model_id = "npc_tutor",     zone = "town_1", kind = "tutor",     pos = { x = 70, y = 40, z = 0 } },
}

N.by_actor = N.by_actor or {}  -- actor_id -> npc_id

-- Spawn toàn bộ NPC (99_init gọi)
function N.spawn_all()
  for id, d in pairs(N.defs) do
    local actor_id = api.spawn_actor(d.model_id, d.pos or { x = 0, y = 0, z = 0 })
    if not actor_id then
      actor_id = "npc_" .. id  -- id giả khi chưa map engine
    end
    d.actor_id = actor_id
    N.by_actor[actor_id] = id
    PW.log.debug("npc: spawn %s (%s)", id, tostring(actor_id))
  end
end

-- Starter: 1/4/7 (Bulbasaur/Charmander/Squirtle)
local STARTERS = { 1, 4, 7 }

local function give_starter(uid, player, dex)
  local mon = PW.pokemon.new(dex, 5)
  PW.party.add(player, mon)
  player.flags = player.flags or {}
  player.flags.has_starter = true
  api.send_message(uid, PW.T("npc.starter_given", PW.pokemon.name(mon)))
  if PW.quest_engine then
    -- Bắt đầu quest chính
    if PW.quest_engine.start then
      pcall(PW.quest_engine.start, uid, "main_starter")
    end
  end
  PW.store.save(uid)
end

local function on_professor(uid)
  local player = PW.store.get(uid)
  if not player then return end
  local has = (player.flags and player.flags.has_starter) or (player.party and #player.party > 0)
  if has then
    api.send_message(uid, PW.T("npc.professor_again"))
    return
  end
  api.send_message(uid, PW.T("npc.professor_hello"))
  if PW.ui and PW.ui.starter_pick then
    -- UI chọn starter, callback trả về dex đã chọn
    PW.ui.starter_pick(uid, STARTERS, function(dex)
      give_starter(uid, PW.store.get(uid), dex)
    end)
  else
    -- Chưa có UI: random 1 trong 3
    give_starter(uid, player, PW.rng.main:pick(STARTERS))
  end
end

local function on_nurse(uid)
  local player = PW.store.get(uid)
  if not player then return end
  PW.party.heal_all(player)
  api.send_message(uid, PW.T("npc.nurse_heal"))
  PW.store.save(uid)
end

local function on_mart(uid)
  if PW.ui and PW.ui.shop and PW.ui.shop.open then
    PW.ui.shop.open(uid)
  else
    api.send_message(uid, PW.T("npc.mart_closed"))
  end
end

local function on_tutor(uid)
  -- [PHASE SAU] dạy lại chiêu
  api.send_message(uid, PW.T("npc.tutor_todo"))
end

local handlers = {
  professor = on_professor,
  center = on_nurse,
  mart = on_mart,
  tutor = on_tutor,
}

PW.hooks.on("touch_actor", function(uid, actor_id)
  local npc_id = N.by_actor[actor_id]
  if not npc_id then return end
  local d = N.defs[npc_id]
  local h = d and handlers[d.kind]
  if h then h(uid) end
end)

-- Lệnh .heal — chỉ hợp lệ khi đứng trong town_1
PW.commands.register{
  name = "heal",
  aliases = {},
  gm = false,
  help = "npc.heal_help",
  fn = function(ctx, args)
    local zone = PW.zones and PW.zones.at and PW.zones.at(ctx.pos)
    if zone ~= "town_1" then
      api.send_message(ctx.uid, PW.T("npc.heal_wrong_zone"))
      return
    end
    on_nurse(ctx.uid)
  end,
}
