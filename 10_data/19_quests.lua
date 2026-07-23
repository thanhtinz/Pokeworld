-- PokeWorld | 10_data/19_quests.lua | Dữ liệu nhiệm vụ (2 main, 4 side, 2 daily)
local PW = _G.PW or {}; _G.PW = PW

-- kind: "main" | "side" | "daily"
-- goal.t: catch_any | catch_species | defeat_trainer | reach_zone | catch_count | win_battles
PW.quests = {
  -- Nhiệm vụ chính
  main_starter = {
    kind = "main", name_key = "q.main_starter", desc_key = "q.main_starter.desc",
    goal = { t="catch_any", n=1 },
    reward = { money=500, items={ {id="poke_ball", n=5} } },
    next = "main_gym1",
  },
  main_gym1 = {
    kind = "main", name_key = "q.main_gym1", desc_key = "q.main_gym1.desc",
    goal = { t="defeat_trainer", id="gym_brock" },
    reward = { money=2000, items={ {id="great_ball", n=3}, {id="super_potion", n=2} } },
    next = nil,
  },

  -- Nhiệm vụ phụ
  side_pikachu = {
    kind = "side", name_key = "q.side_pikachu", desc_key = "q.side_pikachu.desc",
    goal = { t="catch_species", sp=25 },
    reward = { money=800, items={ {id="thunder_stone", n=1} } },
  },
  side_forest = {
    kind = "side", name_key = "q.side_forest", desc_key = "q.side_forest.desc",
    goal = { t="reach_zone", zone="forest_1" },
    reward = { money=300, items={ {id="oran_berry", n=5} } },
  },
  side_bughunt = {
    kind = "side", name_key = "q.side_bughunt", desc_key = "q.side_bughunt.desc",
    goal = { t="defeat_trainer", id="bugcatcher_tung" },
    reward = { money=600, items={ {id="antidote", n=3} } },
  },
  side_magikarp = {
    kind = "side", name_key = "q.side_magikarp", desc_key = "q.side_magikarp.desc",
    goal = { t="catch_species", sp=129 },
    reward = { money=500, items={ {id="rare_candy", n=1} } },
  },

  -- Nhiệm vụ hằng ngày
  daily_catch3 = {
    kind = "daily", name_key = "q.daily_catch3", desc_key = "q.daily_catch3.desc",
    goal = { t="catch_count", n=3 },
    reward = { money=400, items={ {id="poke_ball", n=3} } },
  },
  daily_win5 = {
    kind = "daily", name_key = "q.daily_win5", desc_key = "q.daily_win5.desc",
    goal = { t="win_battles", n=5 },
    reward = { money=600, items={ {id="potion", n=2} } },
  },
}
