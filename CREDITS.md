# Nguồn tài nguyên

Game này dùng sinh vật, hệ và chiêu thức của **[Tuxemon](https://github.com/Tuxemon/Tuxemon)**
— một game bắt sinh vật mã nguồn mở.

- Mã nguồn Tuxemon: GPL-3.0
- Hình ảnh sinh vật và dữ liệu: **CC BY-SA 4.0**, xem `ATTRIBUTIONS.md` bên kho
  của họ để biết từng tác giả.

Cụ thể đã lấy:

| Lấy gì | Vào đâu |
|---|---|
| 411 sinh vật: sprite trước, sprite sau, icon | `assets/mon/` |
| 13 hệ + bảng khắc chế + icon hệ | `js/data/types.js`, `assets/types/` |
| 256 chiêu thức | `js/data/moves.js` |
| Bảng học chiêu, chỉ số theo dáng thân | `js/data/learnsets.js`, `js/data/species.js` |
| Chuỗi tiến hoá kèm điều kiện (cấp, vật phẩm, giới tính, thân thiết, chỉ số) | `js/data/evolutions.js` |
| 50 sprite nhân vật + NPC đi trên bản đồ | `assets/ow/` |
| 50 ảnh 2D nhân vật + NPC cho trận đấu và hội thoại | `assets/trainers/` |
| 94 NPC đứng trên bản đồ (vị trí + hướng lấy từ sự kiện của bản đồ gốc) | `js/data/maps.js` |
| Icon vật phẩm | `assets/items/` |
| 40 nền trận đấu theo môi trường, có cả cảnh đêm (ghép lại cho màn dọc) | `assets/arena/`, `js/data/arenas.js` |
| 12 bong bóng cảm xúc trên đầu NPC | `assets/ui/bubble/` |
| Icon bi đội hình, trái tim thân thiết, dấu +/-, mũi tên tốc độ chiêu | `assets/ui/party/`, `assets/ui/bond/`, `assets/ui/plusminus/`, `assets/ui/speed/` |
| 143 tiếng kêu riêng cho 411 loài (lúc ra trận, lúc gục) | `assets/sfx/cry/`, `js/data/sounds.js` |
| Ghi chép Tuxedex của 407 loài (nguyên văn tiếng Anh của bản gốc) | `js/data/species.js` |
| Nơi sống và đặc điểm của từng loài | `js/data/species.js`, `js/data/traits.js` |
| 25 loại Tuxeball + hệ số bắt của từng loại | `js/data/capdev.js` |
| 92 vật phẩm kèm hiệu ứng, điều kiện dùng và đồ mang theo | `js/data/items.js` |
| 15 hiệu ứng chiêu thức | `assets/vfx/`, `js/data/vfx.js` |
| 40 bản đồ Tiled + tileset (đã gom thành atlas riêng từng bản đồ) | `js/data/maps.js`, `assets/maps/` |
| Phím chữ thập và nút A/B (đã tô lại theo màu game) | `assets/ui/` |
| Icon giao diện: ba lô, nhật ký, đội hình, cài đặt, nhân vật, thoát, lưu | `assets/ui/` |
| Icon tầm đánh của chiêu (melee/touch/ranged/reach/reliable) | `assets/ui/range/` |
| 33 trạng thái + icon (độc, bỏng, mê hoặc, vỏ cứng...) | `js/data/statuses.js`, `assets/ui/status/` |
| Bệnh dịch lây qua chiêu thức | `js/data/plagues.js` |
| Bảng gặp Tuxemon hoang của từng bản đồ | `js/data/encounters.js` |
| Giá mua/bán trong cửa hàng | `js/data/items.js` |
| 10 bản nhạc nền + bản đồ nào chơi bản nào | `assets/music/`, `js/data/maps.js` |
| 29 tiếng động riêng của chiêu thức | `assets/sfx/tech/`, `js/data/sounds.js` |
| 136 hiệu ứng hình riêng của chiêu thức | `assets/vfx/tech/`, `js/data/vfx.js` |

Cả **luật chơi** cũng lấy theo bản gốc: công thức sát thương theo tầm đánh,
chỉ số theo dáng thân, đường kinh nghiệm, công thức bắt và chạy trốn, hiệu ứng
vật phẩm, khẩu vị thay cho tính
cách, bảng trạng thái và hiệu ứng phụ của chiêu — xem `js/engine/damage.js`,
`js/engine/monster.js`, `js/engine/exp.js`, `js/engine/catchmon.js`,
`js/engine/status.js`, `js/engine/escape.js`, `js/engine/useitem.js`,
`js/engine/ai.js`, mỗi tệp có ghi rõ lấy từ đâu bên bản gốc.

Toàn bộ do `tools/mktuxemon.py`, `tools/mktmx.py`, `tools/mkworld.py`,
`tools/mksprites.py`, `tools/mkitems.py`, `tools/mkarena.py`, `tools/mksounds.py`,
`tools/mkvfx.py` và `tools/mkui.py` sinh ra — chạy lại được bất cứ lúc
nào, không sửa tay.

CC BY-SA yêu cầu: ghi công (chính là trang này) và nếu sửa lại ảnh thì bản sửa
cũng phải để CC BY-SA. Icon nhỏ của 15 con được thu từ chính sprite mặt trước
của chúng (bản gốc chỉ có ảnh dấu hỏi dùng chung), nên phần sửa đó cũng theo
CC BY-SA 4.0. Icon "nhân vật" của bản gốc là bóng người đen thui, chìm nghỉm
trên nền tối của game này nên đã đổi tông sang màu sáng — bản đổi màu đó cũng
theo CC BY-SA 4.0.

## Âm thanh — `assets/sfx/`, `assets/music/`

Đi kèm kho Tuxemon:

- Hiệu ứng: **Kelvin Shadewing's Soundpack Vol.1** —
  [kelvinshadewing.net](http://www.kelvinshadewing.net). Bộ này cho dùng cho mọi
  mục đích kể cả thương mại, miễn ghi công và dẫn link về trang tác giả (đúng
  như dòng này).
- Nhạc nền: các bản trong `mods/tuxemon/music` của Tuxemon — Eric Skiff và
  cộng đồng, **CC BY-SA 4.0**.

Chỉ chép những tệp thật sự dùng (`tools/mksounds.py`), tổng khoảng 2 MB.

## Của riêng dự án

| Thứ gì | Làm bằng |
|---|---|
| Chữ tiêu đề TuxeWorld (`assets/img/title.png`) | font pixel tự dựng trong script |
| Icon nào bản gốc không có (bản đồ, menu, nhiệm vụ, bang hội...) | SVG vẽ tay trong `js/ui/icons.js` |
| Icon giao diện dạng pixel (đồng tiền, lịch, đe rèn, quả trứng, la bàn...) | `tools/mkicons.py`, vẽ bằng hình khối cơ bản |
| Icon 47 món ăn và nguyên liệu | `tools/mkfood.py` — bản gốc để cả 47 món trỏ chung vào `gfx/items/box.png` nên không có gì để chép |
| Trang bị cho Tuxemon (18 món × 5 bậc sao = 90 ảnh) + hai loại đá nâng cấp | `tools/mkgear.py` — Tuxemon không có art trang bị, và máy dựng bản này không tải được asset ngoài |
| Quà tặng, sprite phương tiện, dữ liệu boss | `tools/mkgifts.py`, `tools/mkmounts.py`, `tools/mkboss.py` |

Các bản đầu của dự án có mượn ảnh cắt từ game thương mại (nền trận đấu, ảnh
vật phẩm) — đã bỏ sạch, nay chỉ còn asset của chính Tuxemon và đồ tự vẽ.

## Nguồn khác đã xem qua nhưng chưa dùng

[TeamAquasHideout/Team-Aquas-Asset-Repo](https://github.com/TeamAquasHideout/Team-Aquas-Asset-Repo)
— kho asset cộng đồng cho romhack Gen 3, chia theo từng tác giả, dùng thì phải
ghi công đúng tác giả của từng tệp. Là nguồn tốt nếu sau này cần thêm sprite
nhân vật trên bản đồ hoặc tileset.

### Bộ icon trang bị CC0 (định dùng, chưa tải được)

Trang bị hiện do `tools/mkgear.py` tự vẽ. Mấy bộ dưới đây hợp hơn hẳn nếu sau
này muốn thay art thật — tất cả đều **CC0** (miễn phí, không cần ghi công, dùng
được cả cho mục đích thương mại). Máy dựng bản này chặn mạng ra ngoài nên chưa
tải về được; muốn dùng thì tải tay rồi bỏ vào `assets/gear/` theo đúng tên tệp
mà `mkgear.py` đang sinh, không phải sửa dòng mã nào khác.

| Bộ | Có gì | Địa chỉ |
|---|---|---|
| Armor Icons by Equipment Slot | 5 ô (đầu, thân, tay, chân, giày) × 5 chất liệu (vải, áo choàng, da, giáp xích, giáp tấm), 64×64 — chính là thứ hợp nhất cho hệ nâng sao vì năm chất liệu xếp thành năm bậc | [opengameart.org](https://opengameart.org/content/armor-icons-by-equipment-slot) |
| CC0 Jewelry Icons | Dây chuyền, nhẫn, bùa 32×32 | [opengameart.org](https://opengameart.org/content/cc0-jewelry-icons) |
| CC0 Hand Wear Icons | Găng tay, bao tay giáp 32×32 | [opengameart.org](https://opengameart.org/content/cc0-hand-wear-icons) |
| CC0 Gem Icons | Đá quý — hợp làm đá cường hoá / đá ngôi sao | [opengameart.org](https://opengameart.org/content/cc0-gem-icons) |
| Idylwild's Armory | Giáp + 4 nhẫn + 4 bùa theo bốn hạng đồng/sắt/bạc/vàng | [opengameart.org](https://opengameart.org/content/idylwilds-armory) |
| Ring Collection 32×32 | 222 chiếc nhẫn đủ kiểu | [opengameart.org](https://opengameart.org/content/ring-collection-32x32-pixels-222-assorted-color-styles) |
