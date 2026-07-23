-- PokeWorld | 10_data/13_moves.lua | Dữ liệu chiêu thức (47 chiêu)
local PW = _G.PW or {}; _G.PW = PW

-- category: "physical" | "special" | "status"
-- effect: {kind="status", id=..., chance=..} | {kind="stat", target="foe"|"self", stat=.., stages=.., chance=..}
--         | {kind="recoil", frac=..} | {kind="drain", frac=..} | {kind="heal", frac=..} | {kind="flinch", chance=..}
PW.moves = {
  -- Hệ normal
  tackle       = { name_key="mv.tackle", type="normal", category="physical", power=40, acc=100, pp=35, priority=0, effect=nil },
  scratch      = { name_key="mv.scratch", type="normal", category="physical", power=40, acc=100, pp=35, priority=0, effect=nil },
  growl        = { name_key="mv.growl", type="normal", category="status", power=0, acc=100, pp=40, priority=0,
                   effect={kind="stat", target="foe", stat="atk", stages=-1, chance=100} },
  tail_whip    = { name_key="mv.tail_whip", type="normal", category="status", power=0, acc=100, pp=30, priority=0,
                   effect={kind="stat", target="foe", stat="def", stages=-1, chance=100} },
  leer         = { name_key="mv.leer", type="normal", category="status", power=0, acc=100, pp=30, priority=0,
                   effect={kind="stat", target="foe", stat="def", stages=-1, chance=100} },
  quick_attack = { name_key="mv.quick_attack", type="normal", category="physical", power=40, acc=100, pp=30, priority=1, effect=nil },
  hyper_fang   = { name_key="mv.hyper_fang", type="normal", category="physical", power=80, acc=90, pp=15, priority=0,
                   effect={kind="flinch", chance=10} },
  body_slam    = { name_key="mv.body_slam", type="normal", category="physical", power=85, acc=100, pp=15, priority=0,
                   effect={kind="status", id="par", chance=30} },
  double_edge  = { name_key="mv.double_edge", type="normal", category="physical", power=120, acc=100, pp=15, priority=0,
                   effect={kind="recoil", frac=0.33} },
  hyper_beam   = { name_key="mv.hyper_beam", type="normal", category="special", power=150, acc=90, pp=5, priority=0, effect=nil },
  swift        = { name_key="mv.swift", type="normal", category="special", power=60, acc=100, pp=20, priority=0, effect=nil }, -- coi như luôn trúng
  splash       = { name_key="mv.splash", type="normal", category="status", power=0, acc=100, pp=40, priority=0, effect=nil }, -- không có tác dụng
  harden       = { name_key="mv.harden", type="normal", category="status", power=0, acc=100, pp=30, priority=0,
                   effect={kind="stat", target="self", stat="def", stages=1, chance=100} },
  recover      = { name_key="mv.recover", type="normal", category="status", power=0, acc=100, pp=10, priority=0,
                   effect={kind="heal", frac=0.5} },
  rest         = { name_key="mv.rest", type="psychic", category="status", power=0, acc=100, pp=10, priority=0,
                   effect={kind="heal", frac=1.0} }, -- đơn giản hoá: hồi đầy máu, engine tự gán trạng thái ngủ nếu muốn

  -- Hệ fire
  ember        = { name_key="mv.ember", type="fire", category="special", power=40, acc=100, pp=25, priority=0,
                   effect={kind="status", id="brn", chance=10} },
  flamethrower = { name_key="mv.flamethrower", type="fire", category="special", power=90, acc=100, pp=15, priority=0,
                   effect={kind="status", id="brn", chance=10} },

  -- Hệ water
  water_gun    = { name_key="mv.water_gun", type="water", category="special", power=40, acc=100, pp=25, priority=0, effect=nil },
  bubble       = { name_key="mv.bubble", type="water", category="special", power=40, acc=100, pp=30, priority=0,
                   effect={kind="stat", target="foe", stat="spe", stages=-1, chance=10} },
  bubble_beam  = { name_key="mv.bubble_beam", type="water", category="special", power=65, acc=100, pp=20, priority=0,
                   effect={kind="stat", target="foe", stat="spe", stages=-1, chance=10} },
  hydro_pump   = { name_key="mv.hydro_pump", type="water", category="special", power=110, acc=80, pp=5, priority=0, effect=nil },

  -- Hệ grass
  vine_whip    = { name_key="mv.vine_whip", type="grass", category="physical", power=45, acc=100, pp=25, priority=0, effect=nil },
  razor_leaf   = { name_key="mv.razor_leaf", type="grass", category="physical", power=55, acc=95, pp=25, priority=0, effect=nil },
  solar_beam   = { name_key="mv.solar_beam", type="grass", category="special", power=120, acc=100, pp=10, priority=0, effect=nil }, -- đơn giản hoá: đánh ngay 1 lượt
  absorb       = { name_key="mv.absorb", type="grass", category="special", power=20, acc=100, pp=25, priority=0,
                   effect={kind="drain", frac=0.5} },
  mega_drain   = { name_key="mv.mega_drain", type="grass", category="special", power=40, acc=100, pp=15, priority=0,
                   effect={kind="drain", frac=0.5} },
  leech_seed   = { name_key="mv.leech_seed", type="grass", category="special", power=20, acc=90, pp=10, priority=0,
                   effect={kind="drain", frac=0.5} }, -- đơn giản hoá: coi như chiêu hút máu
  sleep_powder = { name_key="mv.sleep_powder", type="grass", category="status", power=0, acc=75, pp=15, priority=0,
                   effect={kind="status", id="slp", chance=100} },
  poison_powder= { name_key="mv.poison_powder", type="poison", category="status", power=0, acc=75, pp=35, priority=0,
                   effect={kind="status", id="psn", chance=100} },
  stun_spore   = { name_key="mv.stun_spore", type="grass", category="status", power=0, acc=75, pp=30, priority=0,
                   effect={kind="status", id="par", chance=100} },

  -- Hệ electric
  thundershock = { name_key="mv.thundershock", type="electric", category="special", power=40, acc=100, pp=30, priority=0,
                   effect={kind="status", id="par", chance=10} },
  thunderbolt  = { name_key="mv.thunderbolt", type="electric", category="special", power=90, acc=100, pp=15, priority=0,
                   effect={kind="status", id="par", chance=10} },
  thunder_wave = { name_key="mv.thunder_wave", type="electric", category="status", power=0, acc=90, pp=20, priority=0,
                   effect={kind="status", id="par", chance=100} },

  -- Hệ flying
  gust         = { name_key="mv.gust", type="flying", category="special", power=40, acc=100, pp=35, priority=0, effect=nil },
  wing_attack  = { name_key="mv.wing_attack", type="flying", category="physical", power=60, acc=100, pp=35, priority=0, effect=nil },

  -- Hệ dark
  bite         = { name_key="mv.bite", type="dark", category="physical", power=60, acc=100, pp=25, priority=0,
                   effect={kind="flinch", chance=30} },

  -- Hệ poison
  poison_sting = { name_key="mv.poison_sting", type="poison", category="physical", power=15, acc=100, pp=35, priority=0,
                   effect={kind="status", id="psn", chance=30} },
  acid         = { name_key="mv.acid", type="poison", category="special", power=40, acc=100, pp=30, priority=0,
                   effect={kind="stat", target="foe", stat="spd", stages=-1, chance=10} },

  -- Hệ bug
  string_shot  = { name_key="mv.string_shot", type="bug", category="status", power=0, acc=95, pp=40, priority=0,
                   effect={kind="stat", target="foe", stat="spe", stages=-2, chance=100} },

  -- Hệ psychic
  confusion    = { name_key="mv.confusion", type="psychic", category="special", power=50, acc=100, pp=25, priority=0,
                   effect={kind="status", id="conf", chance=10} },
  psybeam      = { name_key="mv.psybeam", type="psychic", category="special", power=65, acc=100, pp=20, priority=0,
                   effect={kind="status", id="conf", chance=10} },
  agility      = { name_key="mv.agility", type="psychic", category="status", power=0, acc=100, pp=30, priority=0,
                   effect={kind="stat", target="self", stat="spe", stages=2, chance=100} },

  -- Hệ fighting
  karate_chop  = { name_key="mv.karate_chop", type="fighting", category="physical", power=50, acc=100, pp=25, priority=0, effect=nil },
  low_kick     = { name_key="mv.low_kick", type="fighting", category="physical", power=60, acc=100, pp=20, priority=0, effect=nil }, -- đơn giản hoá: power cố định

  -- Hệ rock / ground
  rock_throw   = { name_key="mv.rock_throw", type="rock", category="physical", power=50, acc=90, pp=15, priority=0, effect=nil },
  magnitude    = { name_key="mv.magnitude", type="ground", category="physical", power=70, acc=100, pp=30, priority=0, effect=nil }, -- đơn giản hoá: power cố định 70

  -- Hệ dragon
  dragon_rage  = { name_key="mv.dragon_rage", type="dragon", category="special", power=40, acc=100, pp=10, priority=0, effect=nil }, -- đơn giản hoá: power 40 thay damage cố định
}
