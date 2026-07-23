-- PokeWorld | 10_data/11_natures.lua | 25 tính cách (nature) chuẩn, tăng/giảm 10% chỉ số
local PW = _G.PW or {}; _G.PW = PW

-- up = chỉ số +10%, down = chỉ số -10%; up==down => trung tính
PW.natures = {
  -- Trung tính
  hardy   = { up="atk", down="atk" },
  docile  = { up="def", down="def" },
  serious = { up="spe", down="spe" },
  bashful = { up="spa", down="spa" },
  quirky  = { up="spd", down="spd" },
  -- Tăng atk
  lonely  = { up="atk", down="def" },
  brave   = { up="atk", down="spe" },
  adamant = { up="atk", down="spa" },
  naughty = { up="atk", down="spd" },
  -- Tăng def
  bold    = { up="def", down="atk" },
  relaxed = { up="def", down="spe" },
  impish  = { up="def", down="spa" },
  lax     = { up="def", down="spd" },
  -- Tăng spe
  timid   = { up="spe", down="atk" },
  hasty   = { up="spe", down="def" },
  jolly   = { up="spe", down="spa" },
  naive   = { up="spe", down="spd" },
  -- Tăng spa
  modest  = { up="spa", down="atk" },
  mild    = { up="spa", down="def" },
  quiet   = { up="spa", down="spe" },
  rash    = { up="spa", down="spd" },
  -- Tăng spd
  calm    = { up="spd", down="atk" },
  gentle  = { up="spd", down="def" },
  sassy   = { up="spd", down="spe" },
  careful = { up="spd", down="spa" },
}

-- Mảng tên để random
PW.natures.list = {
  "hardy", "docile", "serious", "bashful", "quirky",
  "lonely", "brave", "adamant", "naughty",
  "bold", "relaxed", "impish", "lax",
  "timid", "hasty", "jolly", "naive",
  "modest", "mild", "quiet", "rash",
  "calm", "gentle", "sassy", "careful",
}
