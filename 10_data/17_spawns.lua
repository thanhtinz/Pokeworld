-- PokeWorld | 10_data/17_spawns.lua | Bảng spawn Pokémon hoang dã theo khu vực
local PW = _G.PW or {}; _G.PW = PW

-- Mỗi zone: mảng { sp=dex, w=trọng số, min/max=level, time="day"|"night"|"any" }
PW.spawns = {
  route_1 = {
    { sp=16,  w=30, min=2, max=5, time="any" },   -- Pidgey
    { sp=19,  w=30, min=2, max=5, time="any" },   -- Rattata
    { sp=10,  w=20, min=2, max=4, time="day" },   -- Caterpie
    { sp=25,  w=5,  min=3, max=6, time="day" },   -- Pikachu (hiếm)
    { sp=133, w=2,  min=4, max=6, time="any" },   -- Eevee (rất hiếm)
  },
  route_2 = {
    { sp=16,  w=25, min=4, max=8, time="any" },   -- Pidgey
    { sp=19,  w=25, min=4, max=8, time="any" },   -- Rattata
    { sp=43,  w=20, min=5, max=9, time="night" }, -- Oddish (ban đêm)
    { sp=66,  w=10, min=6, max=10, time="any" },  -- Machop
    { sp=17,  w=5,  min=9, max=12, time="day" },  -- Pidgeotto (hiếm)
  },
  forest_1 = {
    { sp=10,  w=35, min=3, max=6, time="any" },   -- Caterpie
    { sp=11,  w=15, min=4, max=7, time="any" },   -- Metapod
    { sp=43,  w=20, min=4, max=8, time="any" },   -- Oddish
    { sp=25,  w=8,  min=4, max=7, time="day" },   -- Pikachu
    { sp=12,  w=3,  min=8, max=10, time="day" },  -- Butterfree (hiếm)
    { sp=143, w=1,  min=15, max=18, time="night" }, -- Snorlax (cực hiếm, đêm)
  },
  cave_1 = {
    { sp=41,  w=40, min=6, max=10, time="any" },  -- Zubat
    { sp=74,  w=30, min=6, max=10, time="any" },  -- Geodude
    { sp=66,  w=10, min=7, max=11, time="any" },  -- Machop
    { sp=75,  w=5,  min=12, max=15, time="any" }, -- Graveler (hiếm)
    { sp=42,  w=3,  min=13, max=16, time="night" }, -- Golbat (hiếm, đêm)
  },
  lake_1 = {
    { sp=129, w=45, min=3, max=10, time="any" },  -- Magikarp
    { sp=7,   w=10, min=5, max=9, time="any" },   -- Squirtle
    { sp=41,  w=10, min=6, max=9, time="night" }, -- Zubat ven hồ ban đêm
    { sp=147, w=3,  min=10, max=15, time="night" }, -- Dratini (hiếm, đêm)
    { sp=130, w=1,  min=20, max=25, time="any" }, -- Gyarados (cực hiếm)
  },
  town_1 = {}, -- Thị trấn: không spawn hoang dã
}
