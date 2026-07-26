# PokeWorld H5

Game Pokémon dạng **web H5** — chơi ngay trên trình duyệt, tối ưu **màn hình dọc** cho điện thoại, hoạt ảnh nhẹ nhàng. Cài được lên màn hình chính như app (PWA), chơi offline sau lần tải đầu.

**Chơi ngay:** https://thanhtinz.github.io/Pokeworld/

## Tính năng

- 🌱 Chọn starter (Bulbasaur / Charmander / Squirtle), 32 loài Gen 1
- 🍃 Khám phá 6 khu vực (đồng cỏ, rừng, hang, hồ) — gặp Pokémon hoang ngẫu nhiên
- ⚔️ Đấu theo lượt chuẩn công thức Gen: khắc hệ 18x18, STAB, crit, IV/EV, nature, trạng thái (bỏng/độc/ngủ/tê/băng)
- ⚪ Bắt Pokémon (công thức catch rate + ball + trạng thái), shiny 1/1024
- 📈 EXP 4 đường cong, học chiêu theo level, tiến hóa (level / đá)
- 🏅 Trainer + Gym, huy hiệu
- 📖 Pokédex seen/caught, 🎒 túi đồ, 🛒 cửa hàng, 📜 nhiệm vụ, 🎁 điểm danh chuỗi ngày
- 💾 Save tự động vào máy (localStorage)

## Công nghệ

- Vanilla JS (ES modules) — **không framework, không build step**
- Sprite từ [PokeAPI](https://github.com/PokeAPI/sprites) (CDN)
- PWA: manifest + service worker (cache shell + sprite)
- Deploy tự động lên GitHub Pages qua GitHub Actions mỗi lần push `main`

## Cấu trúc

```
index.html            # shell + bottom nav
css/style.css         # toàn bộ style (dark, portrait, max 480px)
js/main.js            # router màn hình
js/state.js           # save/load, tiền, túi, quest engine, daily
js/util.js            # rng, sprite url, esc
js/data/              # PURE DATA: species, moves, types, zones, trainers, quests...
js/engine/            # logic thuần: pokemon, exp, damage, status, battle, catch, evolution
js/ui/                # các màn hình: home, battle, party, dex, bag, shop, quest, menu, starter
tests/smoke.mjs       # smoke test chạy bằng node (CI chạy trước khi deploy)
```

## Dev

```bash
python3 -m http.server 8000    # mở http://localhost:8000
node tests/smoke.mjs           # test data + engine không cần trình duyệt
```

> Fan game phi lợi nhuận. Pokémon © Nintendo/Game Freak — sprite dùng cho mục đích học tập.
