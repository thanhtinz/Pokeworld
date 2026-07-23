-- PokeWorld | 10_data/16_items.lua | Dữ liệu vật phẩm (thuốc, bóng, đá tiến hoá...)
local PW = _G.PW or {}; _G.PW = PW

-- kind: "medicine" | "ball" | "stone" | "candy" | "berry" | "held"
-- effect.heal = số HP hồi ("full" = hồi đầy); effect.cure = trạng thái chữa
PW.items = {
  -- Thuốc hồi máu
  potion        = { name_key="it.potion", kind="medicine", price=300, sell=150, effect={heal=20} },
  super_potion  = { name_key="it.super_potion", kind="medicine", price=700, sell=350, effect={heal=50} },
  hyper_potion  = { name_key="it.hyper_potion", kind="medicine", price=1500, sell=750, effect={heal=120} },
  max_potion    = { name_key="it.max_potion", kind="medicine", price=2500, sell=1250, effect={heal="full"} },
  revive        = { name_key="it.revive", kind="medicine", price=2000, sell=1000, effect={revive=0.5} }, -- hồi sinh với 50% HP

  -- Thuốc chữa trạng thái
  antidote      = { name_key="it.antidote", kind="medicine", price=200, sell=100, effect={cure="psn"} },
  paralyze_heal = { name_key="it.paralyze_heal", kind="medicine", price=300, sell=150, effect={cure="par"} },
  awakening     = { name_key="it.awakening", kind="medicine", price=100, sell=50, effect={cure="slp"} },
  burn_heal     = { name_key="it.burn_heal", kind="medicine", price=300, sell=150, effect={cure="brn"} },
  ice_heal      = { name_key="it.ice_heal", kind="medicine", price=100, sell=50, effect={cure="frz"} },
  full_heal     = { name_key="it.full_heal", kind="medicine", price=400, sell=200, effect={cure="all"} },

  -- Bóng bắt Pokémon
  poke_ball     = { name_key="it.poke_ball", kind="ball", price=200, sell=100, ball_mult=1.0 },
  great_ball    = { name_key="it.great_ball", kind="ball", price=600, sell=300, ball_mult=1.5 },
  ultra_ball    = { name_key="it.ultra_ball", kind="ball", price=1200, sell=600, ball_mult=2.0 },

  -- Đá tiến hoá
  thunder_stone = { name_key="it.thunder_stone", kind="stone", price=3000, sell=1500 },
  water_stone   = { name_key="it.water_stone", kind="stone", price=3000, sell=1500 },
  fire_stone    = { name_key="it.fire_stone", kind="stone", price=3000, sell=1500 },
  leaf_stone    = { name_key="it.leaf_stone", kind="stone", price=3000, sell=1500 },

  -- Khác
  rare_candy    = { name_key="it.rare_candy", kind="candy", price=10000, sell=2400, effect={level=1} }, -- tăng 1 cấp
  oran_berry    = { name_key="it.oran_berry", kind="berry", price=100, sell=50, effect={heal=10} },
  lucky_egg     = { name_key="it.lucky_egg", kind="held", price=10000, sell=5000, effect={exp_mult=1.5} },
  exp_share     = { name_key="it.exp_share", kind="held", price=6000, sell=3000, effect={exp_share=true} },
}
