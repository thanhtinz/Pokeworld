# PokeWorld — Mini World: CREATA
## Tài liệu kiến trúc v0.1

> Nền tảng: Mini World: CREATA — Developer Editor, Lua script, chạy phía host room.
> Nguyên tắc: **data-driven** — thêm Pokémon/chiêu/item mới chỉ là thêm entry trong bảng Lua, không sửa engine.
> Phạm vi khởi điểm: Gen 1 rút gọn ~30–50 species, engine thiết kế sẵn để scale lên 1000+.

---

## 1. CẤU TRÚC FOLDER / MODULE

CREATA quản lý script theo danh sách script trong editor, không phải filesystem thật.
Cấu trúc dưới đây là **quy ước đặt tên script** (prefix = "folder") để giữ trật tự,
mỗi dòng = 1 script Lua trong editor. Thứ tự load: `00_` → `99_`.

```
PokeWorld/
│
├── 00_core/                      # Không phụ thuộc gì, load đầu tiên
│   ├── 00_config.lua             # Hằng số toàn cục: max level, shiny rate, cap EV...
│   ├── 01_util.lua               # deepcopy, clamp, weighted random, string split
│   ├── 02_log.lua                # Logger có cấp độ (debug/info/warn), tắt được khi release
│   ├── 03_rng.lua                # RNG có seed riêng cho shiny/IV (chống soft-reset abuse)
│   └── 04_serializer.lua         # table <-> string để lưu Archive (format version hóa)
│
├── 10_data/                      # PURE DATA — chỉ bảng Lua, không logic
│   ├── 10_types.lua              # 18 hệ + type chart (khắc hệ 18x18)
│   ├── 11_natures.lua            # 25 nature, +10%/-10% stat
│   ├── 12_species.lua            # Bảng species chính (xem schema §3)
│   ├── 13_moves.lua              # Bảng chiêu: power, acc, PP, hiệu ứng, category
│   ├── 14_learnsets.lua          # species_id -> { [level] = move_id, tm = {...} }
│   ├── 15_evolutions.lua         # species_id -> điều kiện tiến hóa
│   ├── 16_items.lua              # Potion, Ball, Stone, Berry, TM, Held Item
│   ├── 17_spawns.lua             # Bảng spawn theo biome/zone/thời gian/thời tiết
│   ├── 18_trainers.lua           # NPC trainer + gym leader: đội hình, thưởng
│   ├── 19_quests.lua             # Main/side/daily quest data
│   └── 1A_loc_vi.lua             # i18n: toàn bộ text tiếng Việt (EN thêm sau)
│
├── 20_model/                     # Logic thuần, KHÔNG đụng API game — test được offline
│   ├── 20_pokemon.lua            # Tạo instance: IV, EV, nature, gender, shiny, stats calc
│   ├── 21_exp.lua                # Đường cong EXP, level up, EXP share
│   ├── 22_damage.lua             # Công thức damage Gen-style, STAB, crit, khắc hệ
│   ├── 23_status.lua             # Burn/Poison/Sleep/Paralyze/Freeze + volatile
│   ├── 24_battle_state.lua       # State machine trận đấu (turn queue, action resolve)
│   ├── 25_catch.lua              # Công thức tỷ lệ bắt, ball modifier, critical catch
│   ├── 26_evolution.lua          # Kiểm tra + thực thi tiến hóa
│   ├── 27_breeding.lua           # Egg group, egg move, IV inherit, hatch steps
│   └── 28_party.lua              # Party 6 con + PC box (thêm/rút/swap/heal)
│
├── 30_save/                      # Persistence
│   ├── 30_playerdata.lua         # Schema dữ liệu người chơi + default
│   ├── 31_store.lua              # Wrapper Archive/Cloud API của CREATA (save/load/migrate)
│   └── 32_pokedex_store.lua      # seen/caught bitmap (nén để tiết kiệm dung lượng)
│
├── 40_world/                     # Gắn với map/actor trong game
│   ├── 40_spawner.lua            # Vòng spawn: chọn species theo bảng 17, sinh actor
│   ├── 41_wild_ai.lua            # Hành vi Pokémon hoang: đi lang thang, chạm -> battle
│   ├── 42_follower.lua           # Pokémon đi theo người chơi (actor follow + animation)
│   ├── 43_zones.lua              # Định nghĩa vùng: route/town/cave/safari (bounding box)
│   ├── 44_daynight.lua           # Hook chu kỳ ngày đêm + thời tiết -> spawner
│   └── 45_npc.lua                # Professor, Mart, Center, Tutor, Name Rater, Quest NPC
│
├── 50_battle/                    # Cầu nối model 24 <-> game thật
│   ├── 50_battle_ctrl.lua        # Điều phối 1 trận: khóa di chuyển, camera, kết thúc
│   ├── 51_wild_battle.lua        # Wild encounter (bắt được, chạy được)
│   ├── 52_trainer_battle.lua     # Trainer/Gym (không bắt, không chạy)
│   ├── 53_pvp_battle.lua         # PvP trong cùng room (challenge -> accept)
│   └── 54_raid_battle.lua        # [Phase sau] Boss HP chung nhiều người
│
├── 60_ui/                        # Toàn bộ UI custom trong CREATA
│   ├── 60_ui_common.lua          # Helper mở/đóng panel, button bind, pagination
│   ├── 61_ui_battle.lua          # Màn battle: HP bar, 4 nút chiêu, bag, party, run
│   ├── 62_ui_party.lua           # Xem đội, chi tiết stats/IV/EV, đổi vị trí
│   ├── 63_ui_pc.lua              # PC box
│   ├── 64_ui_pokedex.lua         # Pokédex: seen/caught, thông tin, evolution tree
│   ├── 65_ui_bag.lua             # Túi đồ theo tab
│   ├── 66_ui_shop.lua            # Poké Mart
│   ├── 67_ui_quest.lua           # Danh sách quest + tiến độ
│   ├── 68_ui_trade.lua           # Trade in-room 2 người
│   └── 69_ui_admin.lua           # GM panel (chỉ hiện với host/GM list)
│
├── 70_systems/                   # Hệ thống meta
│   ├── 70_quest_engine.lua       # Trigger/track/reward quest từ bảng 19
│   ├── 71_daily.lua              # Daily login, daily quest reset
│   ├── 72_gym.lua                # Badge, thứ tự gym, Elite Four gate
│   ├── 73_economy.lua            # PokéDollar earn/spend, sink
│   ├── 74_events.lua             # Event theo mùa (bật/tắt bằng config)
│   └── 75_leaderboard.lua        # Bảng xếp hạng trong room (cloud nếu API cho phép)
│
└── 90_main/
    ├── 90_commands.lua           # Router lệnh chat (xem §2)
    ├── 91_hooks.lua              # Đăng ký toàn bộ event game: join, chat, touch, tick
    └── 99_init.lua               # Bootstrap: load data, validate, khởi động spawner
```

**Quy tắc phụ thuộc:** số nhỏ không được require số lớn hơn.
`20_model` không được gọi API game — nhờ vậy toàn bộ engine battle/catch/breed
test được bằng harness log thuần Lua trước khi đụng tới editor (giống pattern mock ESM của SerpLumen).

---

## 2. COMMAND TREE

CREATA không có hệ command server như Minecraft — lệnh đi qua **chat hook** (parse chuỗi bắt đầu `.`)
và song song luôn có nút UI tương ứng. Chat command là đường tắt + công cụ GM.

Cú pháp: `.<lệnh> [tham số]` — không phân biệt hoa thường, có alias tiếng Việt.

```
NGƯỜI CHƠI
├── .help [trang]                 # Danh sách lệnh
├── .party        (.doi)          # Mở UI đội hình
├── .pc                           # Mở PC box (chỉ gần máy PC hoặc Poké Center)
├── .dex          (.pokedex)      # Mở Pokédex
├── .bag          (.tui)          # Mở túi đồ
├── .quest        (.nv)           # Mở nhiệm vụ
├── .shop                         # Mở shop (chỉ gần NPC Mart)
├── .heal                         # Hồi máu đội (chỉ gần Poké Center)
├── .follow <slot|off>            # Chọn Pokémon đi theo / tắt
├── .summary <slot>               # Xem chi tiết 1 con (stats, IV, EV, nature, chiêu)
├── .nick <slot> <tên>            # Đặt biệt danh
├── .daily                        # Nhận thưởng đăng nhập
├── .badge                        # Xem badge đã có
├── .money        (.tien)         # Xem số dư PokéDollar
│
├── TRADE / SOCIAL (trong cùng room)
│   ├── .trade <người chơi>       # Gửi lời mời trade
│   ├── .trade accept / deny
│   └── .pvp <người chơi>         # Thách đấu PvP
│       └── .pvp accept / deny
│
└── BATTLE (khi đang trong trận — chủ yếu dùng UI, lệnh là fallback)
    ├── .move <1-4>
    ├── .switch <slot>
    ├── .ball <item_id>
    └── .run

GM / HOST  (prefix .gm — chỉ hoạt động nếu uid nằm trong GM_LIST của 00_config)
├── .gm panel                     # Mở UI admin (69)
├── .gm give <player> <item> [số lượng]
├── .gm givepoke <player> <species> [level] [shiny]
├── .gm money <player> <±số tiền>
├── .gm setlevel <player> <slot> <level>
├── .gm heal <player|all>
│
├── SPAWN
│   ├── .gm spawn <species> [level] [shiny]     # Spawn tại vị trí GM
│   ├── .gm spawnrate <zone> <x%>               # Chỉnh rate tạm thời
│   ├── .gm spawnoff / spawnon                  # Tắt/bật spawner toàn map
│   └── .gm despawnall                          # Dọn toàn bộ wild actor
│
├── EVENT
│   ├── .gm event <id> on|off
│   └── .gm boss <species> [hp_multi]           # Triệu hồi world boss
│
├── DATA
│   ├── .gm save <player|all>                   # Ép lưu ngay
│   ├── .gm wipe <player> CONFIRM               # Xóa data 1 người (2 bước)
│   ├── .gm inspect <player>                    # Dump data ra log
│   └── .gm migrate                             # Chạy migration save format
│
└── DEBUG
    ├── .gm log <debug|info|warn>
    ├── .gm sim <atk_species> <def_species>     # Chạy 1 trận mô phỏng ra log
    └── .gm reloadspawns                        # Nạp lại bảng 17 (nếu hot-reload được)
```

---

## 3. SCHEMA DATA CHÍNH (rút gọn)

### species (12_species.lua)
```lua
[25] = {  -- key = dex number
  name_key   = "sp.pikachu",          -- tra 1A_loc
  types      = {"electric"},
  base       = {hp=35, atk=55, def=40, spa=50, spd=50, spe=90},
  catch_rate = 190,
  exp_curve  = "medium_fast",
  gender_ratio = 0.5,                 -- tỉ lệ đực; -1 = genderless
  abilities  = {"static"}, hidden_ability = "lightning_rod",
  egg_groups = {"field", "fairy"},
  height = 0.4, weight = 6.0,
  ev_yield   = {spe = 2},
  model_id   = "mdl_pikachu",         -- id model trong editor
  cry_id     = "snd_cry_025",
}
```

### Pokémon instance (20_pokemon.lua tạo ra, 04 serialize)
```lua
{ v=1, sp=25, lv=12, exp=1420, nick=nil,
  iv={31,20,15,10,25,31}, ev={0,0,0,0,0,4},
  nature="jolly", ability="static", gender="m",
  shiny=false, ball="poke", ot="<uid>", ot_name="TT",
  moves={ {id="thundershock",pp=30}, {id="growl",pp=40} },
  hp_cur=34, status=nil, friendship=70, held=nil,
  caught_at=1721700000, size="normal" }
```

### Player save (30_playerdata.lua)
```lua
{ v=1, money=3000, badges={}, dex={seen="...",caught="..."},  -- bitmap nén
  party={...}, boxes={ [1]={...} }, bag={ potion=5, poke_ball=10 },
  quests={ active={}, done={} }, daily={ last=0, streak=0 },
  settings={ follow_slot=1 }, playtime=0, trainer_level=1, trainer_exp=0 }
```

---

## 4. RANH GIỚI KỸ THUẬT (chốt sớm để không vỡ kế hoạch)

| Hạng mục | Trạng thái |
|---|---|
| Battle turn-based, stats đầy đủ, catch, evo, breed, dex, quest, gym, shop | ✅ Làm được |
| Trade / PvP **trong cùng room** | ✅ Làm được |
| Pet follow + ride (nếu model có seat) | ✅ / ⚠️ tùy model |
| GTS, Auction, Mail **cross-room** | ❌ Không backend — cắt hoặc chờ API cloud |
| Ranked toàn server, Battle Pass online | ❌ Cắt |
| Anti-cheat thật | ⚠️ Script chạy phía host — chỉ chống được abuse cơ bản (validate input, seed RNG) |
| Mega / Dynamax / Tera | 🔜 Phase cuối, cần model riêng |
| 1000+ species | ⚠️ Engine chịu được, bottleneck là model/animation |

---

## 5. THỨ TỰ TRIỂN KHAI

1. `00_core` + `10_data` (types, natures, 10 species đầu, ~25 moves)
2. `20_pokemon` + `22_damage` + `24_battle_state` → test bằng `.gm sim` ra log
3. `30_save` + `28_party`
4. `61_ui_battle` + `51_wild_battle` + `25_catch`
5. `40_spawner` + `43_zones`
6. UI còn lại (party/pc/dex/bag)
7. Trainer/Gym, quest engine
8. Trade, PvP, breeding
9. Event, boss, leaderboard, polish

> Trước khi vào bước 1: cần đối chiếu tên API thật của CREATA
> (chat hook, UI API, storage API, actor spawn) — paste docs/API reference vào chat
> để map các wrapper trong `31_store`, `60_ui_common`, `91_hooks` cho đúng.
