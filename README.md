# PokeWorld — Mini World: CREATA

Game Pokémon data-driven chạy trên nền **Mini World: CREATA** (Lua script, phía host room).
Thiết kế chi tiết: xem [`docs/DESIGN.md`](docs/DESIGN.md).

## Nguyên tắc

- **Data-driven**: thêm Pokémon / chiêu / item / quest mới = thêm entry trong bảng Lua ở `10_data/`, không sửa engine.
- **Model thuần**: toàn bộ `20_model/` không gọi API game → test được offline bằng `tools/harness.lua`.
- **Load theo thứ tự tên file**: `00_` → `99_`, số nhỏ không được phụ thuộc số lớn. Trong CREATA editor, tạo script theo đúng thứ tự này.
- **Adapter API**: mọi lời gọi engine CREATA (spawn actor, UI, Archive, chat...) đều gói trong các hàm adapter có comment `-- CREATA-API:`. Khi có docs API thật, chỉ cần map lại các hàm này (tập trung ở `31_store`, `60_ui_common`, `91_hooks` và bảng `api` đầu các file 40/50).

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `00_core/` | config, util, log, RNG (seed riêng chống soft-reset), serializer |
| `10_data/` | PURE DATA: 18 hệ + bảng khắc hệ, 25 nature, 32 species Gen 1, 47 moves, learnsets, evolutions, items, spawns, trainers, quests, i18n tiếng Việt |
| `20_model/` | Engine thuần: tạo Pokémon (IV/EV/nature/shiny), EXP, damage Gen-style, status, state machine battle, catch, evolution, breeding, party/box |
| `30_save/` | Schema save + migration, wrapper Archive, Pokédex bitmap nén |
| `40_world/` | Spawner theo zone/ngày-đêm, AI wild, follower, zones, day/night, NPC |
| `50_battle/` | Điều phối trận: wild, trainer/gym, PvP cùng room, raid (khung) |
| `60_ui/` | UI: battle, party, PC box, Pokédex, bag, shop, quest, trade, GM panel |
| `70_systems/` | Quest engine, daily, gym/badge, economy, event mùa, leaderboard |
| `90_main/` | Router lệnh chat (`.help`, `.gm ...`), hooks event, bootstrap |

## Build file release cho editor

```bash
./tools/build.sh   # tạo dist/PokeWorld_all_in_one.lua (paste 1 script) + dist/PokeWorld_scripts.zip
```

Mỗi lần push lên `main`, GitHub Actions tự test + build + đính 2 file trên vào Release `latest`. Đánh tag `v1.0.0` để ra release chính thức.

## Chạy thử offline (không cần CREATA)

```bash
lua tools/harness.lua        # load toàn bộ script đúng thứ tự + mô phỏng 1 trận
```

## Lệnh trong game

Người chơi: `.help` `.party` `.pc` `.dex` `.bag` `.quest` `.shop` `.heal` `.follow` `.summary` `.nick` `.daily` `.badge` `.money` `.trade` `.pvp` — trong trận: `.move` `.switch` `.ball` `.run`

GM (uid trong `GM_LIST` của `00_config.lua`): `.gm panel` `give` `givepoke` `money` `setlevel` `heal` `spawn` `spawnrate` `spawnoff/on` `despawnall` `event` `boss` `save` `wipe CONFIRM` `inspect` `migrate` `log` `sim` `reloadspawns`

## Việc cần làm khi đưa vào CREATA editor

1. Paste docs API thật của CREATA và map các adapter (`91_hooks.bind_engine`, `31_store`, `60_ui_common`, bảng `api` các file world/battle).
2. Điền `GM_LIST` trong `00_core/00_config.lua`.
3. Chỉnh bounding box zone trong `40_world/43_zones.lua` theo map thật.
4. Gán `model_id` / `cry_id` trong `12_species.lua` theo model có trong editor.
