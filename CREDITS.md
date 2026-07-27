# Nguồn asset

PokeWorld là dự án fan-game phi thương mại. Pokémon, tên nhân vật và hình ảnh
gốc thuộc bản quyền của **Nintendo, Creatures Inc. và GAME FREAK Inc.**
Dự án này không liên kết với các công ty trên và không bán bất cứ thứ gì.

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

## Ảnh Pokémon trong trận — `assets/anim/` và `assets/sprites/`

Đều là sprite Gen 5 (Black/White), nguồn gốc
[veekun.com/dex/downloads](https://veekun.com/dex/downloads).

- `assets/anim/` — ảnh ĐỘNG, dex 1–386, mặt trước và mặt sau. Mặt trước do
  người dùng gửi qua gói Eagle; mặt sau lấy từ
  [PokeAPI/sprites](https://github.com/PokeAPI/sprites) (cùng bộ ảnh, vì
  veekun.com bị chặn từ môi trường dựng dự án). Thiếu #297 ở mặt trước.
- `assets/sprites/shiny/` và `assets/sprites/back/shiny/` — ảnh TĨNH shiny,
  dex 1–649, cắt từ gói `generation5.tar.gz` của veekun do người dùng gửi.
  Dùng ảnh tĩnh cho shiny vì bản động nặng thêm khoảng 26 MB; màu và hướng
  vẫn đúng, có mạng thì tự nâng lên ảnh động của CDN.

## Ảnh Pokémon và vật phẩm — `assets/pokesprite/`

Từ [msikma/pokesprite](https://github.com/msikma/pokesprite).

## Nguồn khác đã xem qua nhưng chưa dùng

[TeamAquasHideout/Team-Aquas-Asset-Repo](https://github.com/TeamAquasHideout/Team-Aquas-Asset-Repo)
— kho asset cộng đồng cho romhack Gen 3, chia theo từng tác giả, dùng thì phải
ghi công đúng tác giả của từng tệp. Là nguồn tốt nếu sau này cần thêm sprite
nhân vật trên bản đồ hoặc tileset.
