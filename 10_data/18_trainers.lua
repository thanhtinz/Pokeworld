-- PokeWorld | 10_data/18_trainers.lua | Dữ liệu NPC trainer và gym leader
local PW = _G.PW or {}; _G.PW = PW

-- kind: "trainer" | "gym"
PW.trainers = {
  -- Trainer thường
  youngster_minh = {
    name_key = "tr.youngster_minh", kind = "trainer", zone = "route_1",
    party = { {sp=19, lv=5}, {sp=16, lv=6} },
    reward_money = 200,
    dialog_intro = "tr.youngster_minh.intro", dialog_lose = "tr.youngster_minh.lose",
  },
  lass_lan = {
    name_key = "tr.lass_lan", kind = "trainer", zone = "route_1",
    party = { {sp=10, lv=5}, {sp=43, lv=6} },
    reward_money = 220,
    dialog_intro = "tr.lass_lan.intro", dialog_lose = "tr.lass_lan.lose",
  },
  bugcatcher_tung = {
    name_key = "tr.bugcatcher_tung", kind = "trainer", zone = "forest_1",
    party = { {sp=10, lv=7}, {sp=11, lv=8}, {sp=12, lv=9} },
    reward_money = 350,
    dialog_intro = "tr.bugcatcher_tung.intro", dialog_lose = "tr.bugcatcher_tung.lose",
  },
  hiker_dung = {
    name_key = "tr.hiker_dung", kind = "trainer", zone = "cave_1",
    party = { {sp=74, lv=10}, {sp=66, lv=11} },
    reward_money = 500,
    dialog_intro = "tr.hiker_dung.intro", dialog_lose = "tr.hiker_dung.lose",
  },

  -- Gym leader
  gym_brock = {
    name_key = "tr.gym_brock", kind = "gym", badge = "badge_boulder", zone = "town_1",
    party = { {sp=74, lv=12}, {sp=75, lv=14} },
    reward_money = 1500, reward_item = { id="potion", n=3 },
    dialog_intro = "tr.gym_brock.intro", dialog_lose = "tr.gym_brock.lose",
  },
  gym_thuy = {
    name_key = "tr.gym_thuy", kind = "gym", badge = "badge_cascade", zone = "lake_1",
    party = { {sp=8, lv=18}, {sp=130, lv=21} },
    reward_money = 2100, reward_item = { id="super_potion", n=2 },
    dialog_intro = "tr.gym_thuy.intro", dialog_lose = "tr.gym_thuy.lose",
  },
}
