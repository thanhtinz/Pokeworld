# TuxeWorld — Game bắt sinh vật Online (H5)

Game **đi bộ bắt sinh vật + cốt truyện** chạy trên trình duyệt, màn hình dọc cho điện thoại, cài được như app (PWA). Toàn bộ sinh vật, chiêu thức, bản đồ và công thức chiến đấu lấy từ [**Tuxemon**](https://github.com/Tuxemon/Tuxemon) — game mã nguồn mở giấy phép GPL-3.0, đồ hoạ CC BY-SA 4.0. Kiến trúc **client tĩnh + server online**: test miễn phí trên GitHub Pages, đem lên VPS là thành game online nhiều người chơi.

**🎮 Bản test (GitHub Pages):** https://thanhtinz.github.io/Pokeworld/

## Tính năng

### Client (chơi được ngay, offline)
- 🔑 Tài khoản trên máy: đăng ký/đăng nhập, chọn nhân vật, nhiều hồ sơ 1 máy
- 📖 **Cốt truyện nhiều chương** — cutscene chân dung nhân vật, hộp thoại, khoá khu vực theo tiến trình
- 🗺️ **40 bản đồ** dựng từ tệp `.tmx` gốc của Tuxemon: 94 NPC có AI theo `WanderBehavior` của bản gốc (đứng canh, đi tuần, dạo quanh, bong bóng cảm xúc), cổng dịch chuyển, 14 vùng bắt được 98 loài
- 🎒 Túi đồ dạng ô với **137 vật phẩm** của bản gốc: 25 loại Tuxeball (theo hệ, giới tính, giờ giấc, đỏ đen...), thuốc, đá tiến hoá, món ăn đổi thân thiết, trà cho EXP, 14 đĩa chiêu + 5 đĩa hệ dạy chiêu mới, 13 quả đổi hệ, 8 bùa hộ mệnh chặn trạng thái, Máy Truyền EXP chia cho cả đội
- ⚔️ Chiến đấu **đúng công thức bản gốc**: 13 hệ, 6 chỉ số (HP/Giáp/Né/Cận chiến/Tầm xa/Tốc), IV 0–15, TP thay EV, khẩu vị thay tính cách, tầm đánh melee/touch/ranged/reach/reliable, hồi chiêu (recharge) thay PP, tốc độ chiêu quyết định thứ tự ra đòn, 33 trạng thái (có loại nối máu hai bên, có loại bào máu cả lúc đi bộ), bệnh dịch lây qua chiêu, chạy trốn theo `attempt_escape`, AI chấm điểm chiêu và biết uống thuốc
- ⚪ Bắt sinh vật theo công thức rung của bản gốc; **Tuxedex 407 loài** có ghi chép, nơi sống, đặc điểm, tìm và lọc theo hệ; shop, nhiệm vụ, điểm danh chuỗi ngày
- 🎨 Asset thật của Tuxemon: sprite sinh vật, chân dung NPC, icon giao diện, hiệu ứng chiêu, 40 nền trận đấu (có cảnh đêm), 10 bản nhạc, tiếng động từng chiêu và **tiếng kêu riêng cho từng loài**
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
js/ui/                        # màn hình: login, home, world, battle, party, dex, bag, shop, quest, menu
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
python3 tools/mkitems.py /tmp/Tuxemon      # vật phẩm + hệ số Tuxeball
python3 tools/mkarena.py /tmp/Tuxemon      # nền trận đấu theo môi trường
python3 tools/mkworld.py /tmp/Tuxemon      # khu vực, bảng gặp, huấn luyện viên
```

Deploy client: push `main` → CI test + tự đồng bộ nhánh `gh-pages` (GitHub Pages).
Deploy server: xem [`docs/SERVER.md`](docs/SERVER.md).

## Lộ trình

- [x] Engine + data theo Tuxemon (chiến đấu, bắt, trạng thái, vật phẩm, tiến hoá, AI), tài khoản local, PWA
- [x] Bản đồ đi bộ + NPC có AI dựng từ tệp gốc
- [ ] Server online: BXH, bạn bè, kết hôn, chat, PvP, admin (đang làm)
- [ ] Nối client ↔ server, màn Online trong game
- [ ] Mở rộng cốt truyện, shop nâng cao
- [ ] Gacha skin bằng tiền tệ KIẾM TRONG GAME (không nạp tiền thật)

> ⚠️ Game phi lợi nhuận, không thu phí dưới mọi hình thức. Nguồn gốc và giấy phép của toàn bộ asset ghi trong [`CREDITS.md`](CREDITS.md).
