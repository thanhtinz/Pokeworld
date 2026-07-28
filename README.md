# TuxeWorld — Game bắt sinh vật Online (H5)

Game **idle + cốt truyện** chạy trên trình duyệt, màn hình dọc cho điện thoại, cài được như app (PWA). Toàn bộ sinh vật, chiêu thức, bản đồ và công thức chiến đấu lấy từ [**Tuxemon**](https://github.com/Tuxemon/Tuxemon) — game mã nguồn mở giấy phép GPL-3.0, đồ hoạ CC BY-SA 4.0. Kiến trúc **client tĩnh + server online**: test miễn phí trên GitHub Pages, đem lên VPS là thành game online nhiều người chơi.

**🎮 Bản test (GitHub Pages):** https://thanhtinz.github.io/Pokeworld/

## Tính năng

### Client (chơi được ngay, offline)
- 🔑 Tài khoản trên máy: đăng ký/đăng nhập, chọn nhân vật, nhiều hồ sơ 1 máy
- 📖 **Cốt truyện nhiều chương** — cutscene chân dung nhân vật, hộp thoại, khoá khu vực theo tiến trình
- 🗺️ Bản đồ đi bộ dựng từ tệp `.tmx` gốc của Tuxemon: NPC có AI (đứng canh, đi tuần, dạo quanh), cổng dịch chuyển, bảng gặp sinh vật theo từng bản đồ
- 🍃 **Idle farm**: đội hình tự đánh, tiền + EXP tự chảy, offline 8 giờ vẫn tích luỹ, tự học chiêu/tiến hoá
- ⚔️ Chiến đấu **đúng công thức bản gốc**: 13 hệ, 6 chỉ số (HP/Giáp/Né/Cận chiến/Tầm xa/Tốc), IV 0–15, TP thay EV, khẩu vị thay tính cách, tầm đánh melee/touch/ranged/reach/reliable, hồi chiêu (recharge) thay PP, 33 trạng thái, chạy trốn theo `attempt_escape`
- ⚪ Bắt sinh vật theo công thức rung của bản gốc, Tuxedex, túi đồ dạng ô, shop, nhiệm vụ, điểm danh chuỗi ngày
- 🎨 Asset thật của Tuxemon: sprite sinh vật, chân dung NPC, icon giao diện, hiệu ứng chiêu, nhạc nền và tiếng động từng chiêu
- 🎀 Trang trí: skin nhân vật, danh hiệu, avatar, khung avatar, bong bóng chat, skin sinh vật
- 🔓 Mở khoá tính năng theo cấp huấn luyện viên

### Server (thư mục `server/` — chạy trên VPS)
- 🌐 Tài khoản online (bcrypt + JWT), save trên server + validate chống sửa dữ liệu
- 🏆 Bảng xếp hạng · 👥 Bạn bè · 💍 Kết hôn · 💬 Chat thế giới · ⚔️ **PvP realtime** · 🏰 Bang hội
- 🛡️ **Admin panel** `/admin`: quản lý người chơi (ban/tặng quà/reset), bật sự kiện x2, audit log
- 🐳 Docker + docker-compose — deploy VPS 1 lệnh. Chi tiết: [`docs/SERVER.md`](docs/SERVER.md)

## Cấu trúc dự án

```
index.html, css/, sw.js       # client shell + PWA
js/data/                      # PURE DATA (tự sinh từ tools/): species, moves, types, maps, encounters...
js/engine/                    # logic thuần: monster, battle, damage, status, catch, escape, exp, evolution
js/ui/                        # màn hình: login, home(idle), battle, party, dex, bag, shop, quest, menu
js/net/                       # lớp kết nối server (REST + socket) — offline nếu chưa cấu hình
server/                       # backend Node.js: API, socket, PvP, admin panel, Docker
tools/                        # script Python sinh data + asset TỪ kho Tuxemon (đừng sửa tay tệp sinh ra)
tests/smoke.mjs               # test data+engine (CI chạy trước deploy)
```

## Dev

```bash
python3 -m http.server 8000     # chạy client: http://localhost:8000
node tests/smoke.mjs            # test client (data + engine)
cd server && npm i && npm start # chạy server local
node server/test/smoke.mjs      # test server (API + socket + PvP)
```

Sinh lại data/asset từ kho gốc:

```bash
git clone https://github.com/Tuxemon/Tuxemon /tmp/Tuxemon
python3 tools/mktuxemon.py /tmp/Tuxemon    # loài, chiêu, hệ, trạng thái, tiến hoá
python3 tools/mktmx.py /tmp/Tuxemon        # bản đồ, NPC, cổng, bảng gặp
python3 tools/mkui.py /tmp/Tuxemon         # icon giao diện
python3 tools/mksounds.py /tmp/Tuxemon     # nhạc nền + tiếng chiêu
python3 tools/mkvfx.py /tmp/Tuxemon        # hiệu ứng chiêu
```

Deploy client: push `main` → CI test + tự đồng bộ nhánh `gh-pages` (GitHub Pages).
Deploy server: xem [`docs/SERVER.md`](docs/SERVER.md).

## Lộ trình

- [x] Engine + data theo Tuxemon, idle, cốt truyện, tài khoản local, PWA
- [x] Bản đồ đi bộ + NPC có AI dựng từ tệp gốc
- [ ] Server online: BXH, bạn bè, kết hôn, chat, PvP, admin (đang làm)
- [ ] Nối client ↔ server, màn Online trong game
- [ ] Mở rộng cốt truyện, shop nâng cao
- [ ] Gacha skin bằng tiền tệ KIẾM TRONG GAME (không nạp tiền thật)

> ⚠️ Game phi lợi nhuận, không thu phí dưới mọi hình thức. Nguồn gốc và giấy phép của toàn bộ asset ghi trong [`CREDITS.md`](CREDITS.md).
