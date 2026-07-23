-- PokeWorld | 00_core/00_config.lua | Hằng số toàn cục của game
local PW = _G.PW or {}; _G.PW = PW

PW.config = {
  -- Phiên bản save format (tăng khi đổi schema, kèm migration trong 31_store)
  SAVE_VERSION      = 1,

  -- Pokémon / stats
  MAX_LEVEL         = 100,
  SHINY_DENOM       = 4096,      -- tỉ lệ shiny gốc = 1/SHINY_DENOM (nhân với event mult)
  IV_MAX            = 31,
  EV_CAP_STAT       = 252,
  EV_CAP_TOTAL      = 510,
  FRIENDSHIP_BASE   = 70,
  FRIENDSHIP_MAX    = 255,

  -- Đội hình / kho
  PARTY_MAX         = 6,
  BOX_COUNT         = 8,
  BOX_SIZE          = 30,

  -- Kinh tế
  STARTING_MONEY    = 3000,
  MONEY_CAP         = 9999999,
  LOSS_MONEY_FRAC   = 0.05,      -- thua trận wild mất 5% tiền

  -- Spawner
  SPAWN_INTERVAL    = 15,        -- giây giữa 2 đợt spawn mỗi zone
  SPAWN_CAP_PER_ZONE= 6,
  WILD_DESPAWN_SEC  = 300,       -- wild sống tối đa 5 phút nếu không ai chạm

  -- Battle
  RUN_BASE_CHANCE   = 0.5,       -- cơ sở tỉ lệ chạy thoát (điều chỉnh theo speed)
  CRIT_CHANCE       = 1/24,

  -- GM: điền uid (mini number) của host/admin vào đây
  GM_LIST           = {
    ["321231574"] = true,   -- thanhtinz (host)
  },

  -- Debug
  LOG_LEVEL         = "info",    -- "debug" | "info" | "warn"
}

-- Kiểm tra quyền GM (host room luôn được coi là GM nếu API xác định được)
function PW.is_gm(uid)
  if PW.config.GM_LIST[tostring(uid)] then return true end
  -- CREATA-API: Player:isRoomHost(uid) — host mặc định là GM
  if _G.Player and Player.isRoomHost then
    local ok, res = pcall(Player.isRoomHost, uid)
    if ok and res then return true end
  end
  return false
end
