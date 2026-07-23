-- PokeWorld | 50_battle/54_raid_battle.lua | Khung raid boss HP chung — [PHASE SAU]
local PW = _G.PW or {}; _G.PW = PW

-- [PHASE SAU] Toàn bộ file này là KHUNG TỐI THIỂU cho tính năng raid.
-- Không có gì chạy lúc load; chỉ export API để phase sau hoàn thiện.

PW.loc = PW.loc or {}
local function L(t) for k, v in pairs(t) do PW.loc[k] = v end end
L{
  ["raid.spawn"]    = "Boss raid %s xuất hiện! Chạm vào để tham gia!",
  ["raid.todo"]     = "Tính năng raid sẽ có trong bản cập nhật sau!",
  ["raid.defeated"] = "Boss raid đã bị hạ! Phần thưởng được chia đều cho %d người tham gia.",
}

PW.raid = PW.raid or {}
local R = PW.raid

-- ============ Adapter CREATA ============
local api = {}

-- CREATA-API: World.spawnCreature(model_id, x, y, z) -> actor_id
function api.spawn_actor(model_id, pos)
  if _G.World and World.spawnCreature then
    local ok, id = pcall(World.spawnCreature, model_id, pos.x, pos.y, pos.z)
    if ok then return id end
  end
  return nil
end

-- CREATA-API: World.despawnCreature(actor_id)
function api.despawn_actor(actor_id)
  if _G.World and World.despawnCreature then
    pcall(World.despawnCreature, actor_id)
  end
end

-- CREATA-API: Chat.broadcast(text)
function api.broadcast(text)
  if _G.Chat and Chat.broadcast then pcall(Chat.broadcast, text) end
end

R.current = nil  -- boss đang hoạt động (chỉ 1 boss/room)

-- [PHASE SAU] Spawn 1 boss với HP chung nhân hp_mult
-- TODO: mỗi người chạm vào sẽ mở 1 trận "wild" riêng với bản sao boss,
--       nhưng sát thương gây ra trừ thẳng vào R.current.hp (HP chung);
--       boss.hp <= 0 -> kết thúc mọi trận con, chia thưởng đều cho participants.
function R.start_boss(species, hp_mult, pos)
  local mon = PW.pokemon.new(species, (PW.config and PW.config.MAX_LEVEL) or 50)
  local max_hp = PW.pokemon.max_hp(mon) * (hp_mult or 10)
  local model_id = (PW.species[mon.species] and PW.species[mon.species].model_id) or mon.species
  local actor_id = api.spawn_actor(model_id, pos or { x = 0, y = 0, z = 0 })
  R.current = {
    mon = mon,
    hp = max_hp,          -- HP chung của boss
    max_hp = max_hp,
    actor_id = actor_id,
    participants = {},    -- uid -> tổng dmg đã gây (để chia thưởng)
  }
  api.broadcast(PW.T("raid.spawn", PW.pokemon.name(mon)))
  return R.current
end

-- [PHASE SAU] Người chơi tham gia raid (được gọi khi chạm boss actor)
-- TODO: dựng trận con qua PW.battle_ctrl, hook dmg -> R.damage(uid, dmg)
function R.join(uid)
  -- Chưa hoàn thiện: chỉ báo tin
  if _G.Chat and Chat.sendTo then pcall(Chat.sendTo, uid, PW.T("raid.todo")) end
end

-- [PHASE SAU] Ghi nhận sát thương vào HP chung
function R.damage(uid, dmg)
  local boss = R.current
  if not boss then return end
  boss.participants[uid] = (boss.participants[uid] or 0) + dmg
  boss.hp = boss.hp - dmg
  if boss.hp <= 0 then R.finish() end
end

-- [PHASE SAU] Kết thúc raid: despawn boss, chia thưởng đều
-- TODO: xác định phần thưởng (tiền/item/cơ hội bắt boss) và trao cho từng uid
function R.finish()
  local boss = R.current
  if not boss then return end
  R.current = nil
  if boss.actor_id then api.despawn_actor(boss.actor_id) end
  local n = PW.util.count(boss.participants)
  if n > 0 then
    api.broadcast(PW.T("raid.defeated", n))
    -- TODO: chia thưởng đều cho từng participant tại đây
  end
end
