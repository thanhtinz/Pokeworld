# PokeWorld — Game Pokémon Online (H5)

Game Pokémon **idle + cốt truyện** chạy trên trình duyệt, màn hình dọc cho điện thoại, cài được như app (PWA). Kiến trúc **client tĩnh + server online**: test miễn phí trên GitHub Pages, đem lên VPS là thành game online nhiều người chơi.

**🎮 Bản test (GitHub Pages):** https://thanhtinz.github.io/Pokeworld/

## Tính năng

### Client (chơi được ngay, offline)
- 🔑 Tài khoản trên máy: đăng ký/đăng nhập, chọn nhân vật **Nam (Red) / Nữ (Leaf)**, nhiều hồ sơ 1 máy
- 📖 **Cốt truyện 8 chương**: Professor Oak, rival Blue, Team Rocket, trùm Giovanni — cutscene chân dung nhân vật, hộp thoại PMD, khóa khu vực theo tiến trình
- 🍃 **Idle farm**: Pokémon tự đánh quái, tiền + EXP tự chảy, offline 8 giờ vẫn tích lũy, tự học chiêu/tiến hóa
- ⚔️ Trận đánh tay đầy đủ với trainer/gym: công thức chuẩn Gen (khắc hệ 18×18, IV/EV, nature, status, STAB, crit)
- ⚪ Bắt Pokémon (công thức catch + ball + trạng thái), shiny, Pokédex, túi đồ, shop, nhiệm vụ, điểm danh chuỗi ngày
- 🎨 Asset thật: sprite Pokémon pixel động (PokeAPI), trainer FRLG, chân dung + UI Mystery Dungeon

### Server (thư mục `server/` — chạy trên VPS)
- 🌐 Tài khoản online (bcrypt + JWT), save trên server + validate chống hack
- 🏆 Bảng xếp hạng · 👥 Bạn bè · 💍 Kết hôn · 💬 Chat thế giới · ⚔️ **PvP realtime**
- 🛡️ **Admin panel** `/admin`: quản lý người chơi (ban/tặng quà/reset), bật sự kiện x2, audit log
- 🐳 Docker + docker-compose — deploy VPS 1 lệnh. Chi tiết: [`docs/SERVER.md`](docs/SERVER.md)

## Cấu trúc dự án

```
index.html, css/, sw.js       # client shell + PWA
js/data/                      # PURE DATA: species, moves, types, zones, trainers, quests, story
js/engine/                    # logic thuần: pokemon, battle, catch, exp, evolution, idle, story, accounts
js/ui/                        # màn hình: login, home(idle), battle, party, dex, bag, shop, quest, menu
js/net/                       # lớp kết nối server (REST + socket) — offline nếu chưa cấu hình
server/                       # backend Node.js: API, socket, PvP, admin panel, Docker
tests/smoke.mjs               # test data+engine (CI chạy trước deploy)
tools/, docs/                 # build phụ trợ, tài liệu
```

## Dev

```bash
python3 -m http.server 8000     # chạy client: http://localhost:8000
node tests/smoke.mjs            # test client (data + engine)
cd server && npm i && npm start # chạy server local
node server/test/smoke.mjs      # test server (API + socket + PvP)
```

Deploy client: push `main` → CI test + tự đồng bộ nhánh `gh-pages` (GitHub Pages).
Deploy server: xem [`docs/SERVER.md`](docs/SERVER.md).

## Lộ trình

- [x] Engine + data Gen 1, idle, cốt truyện, tài khoản local, PWA
- [ ] Đủ 151 Pokémon Kanto (đang làm)
- [ ] Server online: BXH, bạn bè, kết hôn, chat, PvP, admin (đang làm)
- [ ] Nối client ↔ server, màn Online trong game
- [ ] Mở rộng cốt truyện + 8 gym + Elite Four, shop nâng cao
- [ ] Gacha skin bằng tiền tệ KIẾM TRONG GAME (không nạp tiền thật)

> ⚠️ Fan game phi lợi nhuận, không thu phí dưới mọi hình thức. Pokémon © Nintendo/Game Freak/Creatures. Sprite dùng cho mục đích học tập.
