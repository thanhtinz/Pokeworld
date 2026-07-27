# Nguồn tài nguyên

Game này dùng sinh vật, hệ và chiêu thức của **[Tuxemon](https://github.com/Tuxemon/Tuxemon)**
— một game mã nguồn mở kiểu Pokémon.

- Mã nguồn Tuxemon: GPL-3.0
- Hình ảnh sinh vật và dữ liệu: **CC BY-SA 4.0**, xem `ATTRIBUTIONS.md` bên kho
  của họ để biết từng tác giả.

Cụ thể đã lấy:

| Lấy gì | Vào đâu |
|---|---|
| 411 sinh vật: sprite trước, sprite sau, icon | `assets/mon/` |
| 13 hệ + bảng khắc chế + icon hệ | `js/data/types.js`, `assets/types/` |
| 256 chiêu thức | `js/data/moves.js` |
| Bảng học chiêu, chuỗi tiến hoá, chỉ số theo dáng thân | `js/data/learnsets.js`, `js/data/evolutions.js`, `js/data/species.js` |
| 50 sprite nhân vật + NPC đi trên bản đồ | `assets/ow/` |
| 50 ảnh 2D nhân vật + NPC cho trận đấu và hội thoại | `assets/trainers/` |
| 67 NPC đứng trên bản đồ (vị trí + hướng lấy từ sự kiện của bản đồ gốc) | `js/data/maps.js` |
| 20 vật phẩm + icon (tuxeball, thuốc, đá tiến hoá) | `js/data/items.js`, `assets/items/` |
| Nền trận đấu (ghép lại cho màn dọc) | `assets/arena/` |
| 15 hiệu ứng chiêu thức | `assets/vfx/`, `js/data/vfx.js` |
| 20 bản đồ Tiled + tileset (đã gom thành atlas riêng từng bản đồ) | `js/data/maps.js`, `assets/maps/` |
| Phím chữ thập và nút A/B (đã tô lại theo màu game) | `assets/ui/` |
| Icon giao diện: ba lô, nhật ký, đội hình, cài đặt | `assets/ui/` |
| Icon tầm đánh của chiêu (melee/touch/ranged/reach/reliable) | `assets/ui/range/` |
| 33 trạng thái + icon (độc, bỏng, mê hoặc, vỏ cứng...) | `js/data/statuses.js`, `assets/ui/status/` |

Cả **luật chơi** cũng lấy theo bản gốc: công thức sát thương theo tầm đánh,
chỉ số theo dáng thân, đường kinh nghiệm, công thức bắt, khẩu vị thay cho tính
cách, bảng trạng thái và hiệu ứng phụ của chiêu — xem `js/engine/damage.js`,
`js/engine/pokemon.js`, `js/engine/exp.js`, `js/engine/catchmon.js`,
`js/engine/status.js`, mỗi tệp có ghi rõ lấy từ đâu bên bản gốc.

Toàn bộ do `tools/mktuxemon.py`, `tools/mktmx.py`, `tools/mkworld.py`,
`tools/mksprites.py`, `tools/mkitems.py`, `tools/mkarena.py`, `tools/mksounds.py`,
`tools/mkvfx.py` và `tools/mkui.py` sinh ra — chạy lại được bất cứ lúc
nào, không sửa tay.

CC BY-SA yêu cầu: ghi công (chính là trang này) và nếu sửa lại ảnh thì bản sửa
cũng phải để CC BY-SA. Icon nhỏ của 15 con được thu từ chính sprite mặt trước
của chúng (bản gốc chỉ có ảnh dấu hỏi dùng chung), nên phần sửa đó cũng theo
CC BY-SA 4.0.

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
| Icon giao diện | SVG vẽ tay trong `js/ui/icons.js` |

Trước đây nền trận đấu lấy từ kho asset của PokéRogue và ảnh vật phẩm lấy từ
pokesprite (đều là ảnh cắt từ game Pokémon) — nay đã bỏ hết, thay bằng đồ tự vẽ
và vật phẩm của chính Tuxemon.

## Nguồn khác đã xem qua nhưng chưa dùng

[TeamAquasHideout/Team-Aquas-Asset-Repo](https://github.com/TeamAquasHideout/Team-Aquas-Asset-Repo)
— kho asset cộng đồng cho romhack Gen 3, chia theo từng tác giả, dùng thì phải
ghi công đúng tác giả của từng tệp. Là nguồn tốt nếu sau này cần thêm sprite
nhân vật trên bản đồ hoặc tileset.
