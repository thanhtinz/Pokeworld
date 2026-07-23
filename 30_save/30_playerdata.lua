-- PokeWorld | 30_save/30_playerdata.lua | Schema dữ liệu người chơi + giá trị mặc định
local PW = _G.PW or {}; _G.PW = PW

local playerdata = {}
PW.playerdata = playerdata

-- Tạo bản save mặc định cho người chơi mới
function playerdata.default()
  return {
    v = PW.config.SAVE_VERSION,
    money = PW.config.STARTING_MONEY,
    badges = {},
    dex = { seen = "", caught = "" },   -- bitmap nén (32_pokedex_store)
    party = {},
    boxes = { [1] = {} },
    bag = { potion = 5, poke_ball = 10 },
    quests = { active = {}, done = {} },
    daily = { last = 0, streak = 0 },
    defeated_trainers = {},
    settings = { follow_slot = nil },
    playtime = 0,
    trainer_level = 1, trainer_exp = 0,
    eggs = {},                          -- trứng đang ấp
    has_starter = false,
  }
end

-- Migration theo version — thêm case khi tăng SAVE_VERSION
local migrations = {
  -- [1] = function(data) ... data.v = 2 ... end,
}

-- Nâng cấp save cũ lên format hiện tại; đồng thời vá field thiếu bằng default.
function playerdata.migrate(data)
  if type(data) ~= "table" then return playerdata.default() end
  while (data.v or 0) < PW.config.SAVE_VERSION do
    local fn = migrations[data.v or 0]
    if not fn then break end
    fn(data)
  end
  -- Vá field thiếu (an toàn khi thêm field mới không cần migration riêng)
  local def = playerdata.default()
  for k, v in pairs(def) do
    if data[k] == nil then data[k] = PW.util.deepcopy(v) end
  end
  data.v = PW.config.SAVE_VERSION
  return data
end
