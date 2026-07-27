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

Toàn bộ do `tools/mktuxemon.py` và `tools/mkworld.py` sinh ra — chạy lại được
bất cứ lúc nào, không sửa tay.

CC BY-SA yêu cầu: ghi công (chính là trang này) và nếu sửa lại ảnh thì bản sửa
cũng phải để CC BY-SA. Icon nhỏ của 15 con được thu từ chính sprite mặt trước
của chúng (bản gốc chỉ có ảnh dấu hỏi dùng chung), nên phần sửa đó cũng theo
CC BY-SA 4.0.

## Ảnh 2D huấn luyện viên — `assets/trainers/`

Cắt ra từ [pagefaultgames/pokerogue-assets](https://github.com/pagefaultgames/pokerogue-assets)
(dự án PokéRogue). Chỉ lấy tệp `.png`; các tệp `.json` đi kèm phát hành theo
giấy phép AGPL-3.0 nên **không** sao chép vào đây. Khung đứng yên được tách ra
bằng `tools/extract_trainers.py` — tự dò vùng liên thông trong ảnh, không dùng
dữ liệu toạ độ của họ.

Ngoại lệ giữ nguyên bản FireRed/LeafGreen: `oak.png` (PokéRogue không có
Giáo sư Oak) và `red.png` / `leaf.png` — hai ảnh này là nhân vật người chơi
tên Red và Leaf, hiện ở màn tạo nhân vật nên giữ đúng bản gốc.

## Nền trận đấu — `assets/arena/`

Từ [pagefaultgames/pokerogue-assets](https://github.com/pagefaultgames/pokerogue-assets)
(`images/arenas`). Mỗi khu vực gồm nền trời-đất và hai cái bệ đứng, được cắt
sát viền để đặt vào bố cục dọc của game.

## Sprite nhân vật trên bản đồ — `assets/ow/`

Cắt từ các sheet Pokémon Emerald trên [The Spriters Resource](https://www.spriters-resource.com/),
do người dùng cung cấp. Người rip: MufasaKong, Random Talking Bush, P-P,
Fuxs The Fox.

## Bộ tile bản đồ — `assets/tiles/terrain.png`

Từ [dorianleveque/Pokemap](https://github.com/dorianleveque/Pokemap).
Ô số 20 do dự án này sửa lại: lấy bụi cỏ của ô 25 và đổi nền cát thành nền cỏ.

## Nội thất — `assets/interiors/`

Cắt từ sheet "Pokémon Centre & Mart" (Pokémon Emerald) trên The Spriters
Resource. Người rip: Nintendofreak106.

## Ảnh vật phẩm — `assets/pokesprite/items/`

Từ [msikma/pokesprite](https://github.com/msikma/pokesprite). Chỉ còn giữ
thư mục vật phẩm; phần ảnh Pokémon đã bỏ vì sinh vật nay lấy từ Tuxemon.

## Nguồn khác đã xem qua nhưng chưa dùng

[TeamAquasHideout/Team-Aquas-Asset-Repo](https://github.com/TeamAquasHideout/Team-Aquas-Asset-Repo)
— kho asset cộng đồng cho romhack Gen 3, chia theo từng tác giả, dùng thì phải
ghi công đúng tác giả của từng tệp. Là nguồn tốt nếu sau này cần thêm sprite
nhân vật trên bản đồ hoặc tileset.
