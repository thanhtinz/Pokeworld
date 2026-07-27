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
| 32 sprite nhân vật + NPC đi trên bản đồ | `assets/ow/` |
| 32 ảnh 2D nhân vật + NPC cho trận đấu và hội thoại | `assets/trainers/` |
| 20 bản đồ Tiled + tileset (đã gom thành atlas riêng từng bản đồ) | `js/data/maps.js`, `assets/maps/` |

Toàn bộ do `tools/mktuxemon.py`, `tools/mktmx.py`, `tools/mkworld.py` và
`tools/mksprites.py` sinh ra — chạy lại được
bất cứ lúc nào, không sửa tay.

CC BY-SA yêu cầu: ghi công (chính là trang này) và nếu sửa lại ảnh thì bản sửa
cũng phải để CC BY-SA. Icon nhỏ của 15 con được thu từ chính sprite mặt trước
của chúng (bản gốc chỉ có ảnh dấu hỏi dùng chung), nên phần sửa đó cũng theo
CC BY-SA 4.0.

## Nền trận đấu — `assets/arena/`

Từ [pagefaultgames/pokerogue-assets](https://github.com/pagefaultgames/pokerogue-assets)
(`images/arenas`). Mỗi khu vực gồm nền trời-đất và hai cái bệ đứng, được cắt
sát viền để đặt vào bố cục dọc của game.

## Ảnh vật phẩm — `assets/pokesprite/items/`

Từ [msikma/pokesprite](https://github.com/msikma/pokesprite). Chỉ còn giữ
thư mục vật phẩm; phần ảnh Pokémon đã bỏ vì sinh vật nay lấy từ Tuxemon.

## Nguồn khác đã xem qua nhưng chưa dùng

[TeamAquasHideout/Team-Aquas-Asset-Repo](https://github.com/TeamAquasHideout/Team-Aquas-Asset-Repo)
— kho asset cộng đồng cho romhack Gen 3, chia theo từng tác giả, dùng thì phải
ghi công đúng tác giả của từng tệp. Là nguồn tốt nếu sau này cần thêm sprite
nhân vật trên bản đồ hoặc tileset.
