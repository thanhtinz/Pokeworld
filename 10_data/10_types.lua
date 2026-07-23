-- PokeWorld | 10_data/10_types.lua | Bảng hệ và khắc hệ chuẩn Gen 6+
local PW = _G.PW or {}; _G.PW = PW

PW.types = {}

-- Danh sách 18 hệ
PW.types.list = {
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
}

-- Bảng khắc hệ: chart[hệ tấn công][hệ phòng thủ] = multiplier (chỉ lưu khác 1.0)
PW.types.chart = {
  normal   = { rock=0.5, steel=0.5, ghost=0 },
  fire     = { grass=2, ice=2, bug=2, steel=2, fire=0.5, water=0.5, rock=0.5, dragon=0.5 },
  water    = { fire=2, ground=2, rock=2, water=0.5, grass=0.5, dragon=0.5 },
  electric = { water=2, flying=2, electric=0.5, grass=0.5, dragon=0.5, ground=0 },
  grass    = { water=2, ground=2, rock=2, fire=0.5, grass=0.5, poison=0.5, flying=0.5, bug=0.5, dragon=0.5, steel=0.5 },
  ice      = { grass=2, ground=2, flying=2, dragon=2, fire=0.5, water=0.5, ice=0.5, steel=0.5 },
  fighting = { normal=2, ice=2, rock=2, dark=2, steel=2, poison=0.5, flying=0.5, psychic=0.5, bug=0.5, fairy=0.5, ghost=0 },
  poison   = { grass=2, fairy=2, poison=0.5, ground=0.5, rock=0.5, ghost=0.5, steel=0 },
  ground   = { fire=2, electric=2, poison=2, rock=2, steel=2, grass=0.5, bug=0.5, flying=0 },
  flying   = { grass=2, fighting=2, bug=2, electric=0.5, rock=0.5, steel=0.5 },
  psychic  = { fighting=2, poison=2, psychic=0.5, steel=0.5, dark=0 },
  bug      = { grass=2, psychic=2, dark=2, fire=0.5, fighting=0.5, poison=0.5, flying=0.5, ghost=0.5, steel=0.5, fairy=0.5 },
  rock     = { fire=2, ice=2, flying=2, bug=2, fighting=0.5, ground=0.5, steel=0.5 },
  ghost    = { psychic=2, ghost=2, dark=0.5, normal=0 },
  dragon   = { dragon=2, steel=0.5, fairy=0 },
  dark     = { psychic=2, ghost=2, fighting=0.5, dark=0.5, fairy=0.5 },
  steel    = { ice=2, rock=2, fairy=2, fire=0.5, water=0.5, electric=0.5, steel=0.5 },
  fairy    = { fighting=2, dragon=2, dark=2, fire=0.5, poison=0.5, steel=0.5 },
}

-- Tính multiplier tổng khi hệ att đánh vào 1 hoặc 2 hệ phòng thủ
-- def_types: mảng hệ, vd {"water","flying"}
function PW.types.eff(att, def_types)
  local row = PW.types.chart[att]
  if not row then return 1 end
  local mult = 1
  for i = 1, #def_types do
    local m = row[def_types[i]]
    if m ~= nil then mult = mult * m end
  end
  return mult
end
