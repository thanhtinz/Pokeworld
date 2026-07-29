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

## Liberated Pixel Cup — nhân vật ghép lớp

Nhân vật người chơi không còn là một tệp sprite cố định mà ghép từ nhiều lớp
rời, lấy từ **[OpenGameArt/LiberatedPixelCup](https://github.com/OpenGameArt/LiberatedPixelCup)**
(thư mục `sprite/`).

- Giấy phép: **CC BY-SA 3.0** *hoặc* **GPL 3.0** (song song, chọn một).
- Tác giả: Stephen Challener (Redshrike), Manuel Riecke (MrBeast),
  Johannes Sjölund (wulax), makrohn, David Conway Jr. (Jaidyn Reiman),
  William Thompson, Nila122 — danh sách đầy đủ ở `sprite/original/authors.md`
  và `sprite/derivative/authors.md` bên kho của họ.

| Lấy gì | Vào đâu |
|---|---|
| 2 dáng người (nam/nữ) × 6 màu da, tai, mũi, mắt, biểu cảm, tóc, râu | `assets/lpc/` |
| 84 món quần áo chia 9 ô (áo, quần, giày, mũ, thắt lưng, bao tay, giáp vai, cổ, găng) | `assets/lpc/do/` |

Khung gốc của LPC là 64×64, mỗi phần một tấm riêng. `tools/mklpc.py` cắt về
đúng khuôn 3 cột × 4 hàng (32×64 mỗi khung) mà `js/engine/owsprite.js` đang
dùng, rồi `js/engine/avatar.js` chồng các lớp lại thành một ảnh duy nhất.
Tổng cộng **256 lớp, khoảng 0,6 MB** — chỉ chép đúng phần thật sự bày ra trong
màn tạo nhân vật và tiệm quần áo.

Vì là CC BY-SA / GPL nên phần asset nhân vật của game này cũng phải giữ nguyên
giấy phép đó khi phát hành lại.

## CraftPix — ba địa điểm

Ba chỗ ghé thăm trong mục **Địa Điểm** dựng từ các pack top-down miễn phí của
**[CraftPix](https://craftpix.net/freebies/)** (ô 16×16, đúng cỡ ô của game):

| Địa điểm | Pack |
|---|---|
| Nhà Nguyện | Chapel Pixel Art Top Down Asset Pack |
| Sảnh Bang Hội | Top Down Pixel Art Guild Hall Asset Pack |
| Đền Đổ Nát | Ruined Temple Top Down Location Pixel Art |

**Giấy phép khác hẳn phần còn lại — đọc kỹ.** CraftPix cho dùng tệp miễn phí
trong game, kể cả game bán tiền, không bắt ghi công (ghi thì họ cảm ơn), NHƯNG
**cấm bán lại hoặc phát tán lại chính các tệp gốc dưới dạng bộ asset**. Xem
[craftpix.net/file-licenses](https://craftpix.net/file-licenses/).

Nên trong kho này:

- **không có tệp gốc nào của pack** — muốn dựng lại thì tự tải pack về máy
- chỉ có **atlas đã nướng của từng bản đồ** (`assets/maps/nha_nguyen.png`,
  `sanh_bang.png`, `den_do_nat.png`): mỗi tệp chỉ gom đúng những ô bản đồ đó
  thật sự dùng, xếp lại theo thứ tự khác, là một phần của game chứ không còn
  là bộ asset

Ai fork kho này thì **đừng nhặt riêng mấy tệp atlas đó ra bán lại** — phần này
KHÔNG phải CC BY-SA như art của Tuxemon.

Hai pack tải về nhưng **chưa dùng**: *Free Pixel Art Plants For Farm* (bộ cây
trồng, không phải bản đồ) và *Main Character's Home* — bản đồ mẫu của pack đó
xếp mấy mẫu phòng cạnh nhau trên cùng một khung, tường cụt ngang, cửa mở ra
khoảng không; nhập thẳng vào game thì nhìn như chắp vá nên đã bỏ. Muốn dùng
tileset của nó thì phải tự xếp từng ô như `tools/khudancu.py`.

## CraftPix / Jephed — Sảnh Bạc Kim Long

Bản đồ sòng bài dựng từ **2D Top Down Pixel Art Tileset Casino** của
**Jephed — Game Between The Lines**
([gamebetweenthelines.com](https://gamebetweenthelines.com/)).
`ReadMe.txt` của pack ghi rõ: miễn phí cho cả mục đích thương mại lẫn phi
thương mại, ghi công thì tốt — chính là dòng này.

Người làm trong sảnh (chia bài, bảo vệ, lao công, khách) lấy từ
**2D Top Down Pixel Art Characters** — cũng của Jephed, cũng miễn phí cho cả
mục đích thương mại. Sheet của họ là 64×128 nhưng 4 cột cuối bỏ trống: nội
dung thật là 3 cột × 4 hàng, ô 20×32, hàng xếp xuống/trái/phải/lên — **trùng
khít** thứ tự của `assets/ow` nên chỉ cần cắt bỏ phần trống bên phải.

`tools/casino.py` tự xếp từng ô (thảm, tường, máy quay, bàn) rồi nướng ra
`assets/maps/sanh_bac.png`, và cắt 9 sprite người vào `assets/ow/bac_*.png`.
Chỉ chép **9 nhân vật thật sự dùng** trong 40 cái của pack; tileset thì không
chép tệp gốc, chỉ có atlas gồm đúng những ô bản đồ này dùng.

Còn bốn pack **Pixel Fantasy của Caz** (máy quay, bài tây, coin flip, icon
Valentine) vẫn **chưa dùng**. EULA nằm trong một tệp Google Docs mà ở
đây mở không được. Caz có bộ miễn phí để CC BY 4.0, nhưng bộ trả tiền thì **cấm
chia lại cho người chưa mua**. Không đọc được đúng điều khoản của mấy pack này
thì không dám đẩy ảnh của họ lên một kho công khai — nên phần bài, xúc xắc, máy
quay trong game hiện vẽ bằng CSS. Nếu đây đúng là bộ miễn phí CC BY 4.0 thì nói
một tiếng, thay vào là xong.

Pack **Cozy People của shubibubi** (itch.io) — sprite nhân vật 32×32 tách lớp
sẵn: nước da, mắt, tóc 13 kiểu × 14 màu, quần áo, phụ kiện. Đây là bộ **hợp
phong cách nhất** với NPC của Tuxemon: thân người cao 20px trong ô 32, đúng
bằng tỉ lệ 0,625 của bản gốc, nên cắm vào là cùng một cỡ pixel, không phải co
giãn gì.

Pack đã mua nên được dùng thương mại thoải mái, chỉ **cấm phát tán lại chính
cái pack**. Ranh giới trong kho này giống hệt mấy pack CraftPix: **không chép
tệp gốc của pack vào đây** — không có bảng gộp `char_all.png`, không có thư
mục `greyscale/`, không có mấy bộ animation không dùng (chặt cây, cuốc đất,
đào, chém...). Chỉ commit hai thư mục đã cắt lại theo đúng định dạng sprite
riêng của game: `assets/nv/` (nhịp đi bộ, 96×128) và `assets/nv_cau/` (nhịp
quăng cần, 160×128 — dùng cho tính năng câu cá). Đó là art của game chứ không
phải cái pack.

Sinh lại bằng:

```bash
python3 tools/cozy.py "/duong/dan/Character v.2"
```

Pack **Cozy Farm của shubibubi** (itch.io) — cùng tác giả, cùng cỡ ô 16px với
tileset của Tuxemon: cây trồng 37 loại × 6 giai đoạn (có cả bản đất khô và đất
đã tưới), gói hạt giống, icon nông sản, con vật (gà, bò, dê, cừu, lợn, thỏ, gà
tây), máy chế biến (bơ, phô mai, mayo, guồng sợi, máy dệt — nguồn là ảnh GIF
nên bộ sinh duyệt từng khung rồi xếp lại thành một dải ngang) và nhà cửa nông
trại.

Giấy phép y hệt pack nhân vật: mua rồi thì dùng thương mại thoải mái, **cấm phát
tán lại chính cái pack**. Nên ở đây cũng chỉ commit phần đã cắt ra `assets/nt/`
theo đúng định dạng riêng của game, không chép tệp gốc nào.

**Nền mấy bản đồ TỰ DỰNG cũng của pack này** — hiện là Nông Trại và Khu Dân Cư
(`tools/cozytile.py` giữ bảng ô dùng chung). Bản đầu tôi cố ý dùng tileset ngoài
trời của Tuxemon cho nền, sợ trộn hai bộ nền thì lệch phong cách — hoá ra ngược:
mấy khu đó vốn đã đầy nhân vật, cây trồng, con vật, nhà cửa CỦA PACK, nên cái
lệch ra lại chính là bãi cỏ Tuxemon. Giờ cả bản đồ một bộ, và dùng đúng bộ
autotile của họ nên cỏ ↔ đường đất ↔ mặt ao nối vào nhau mượt chứ không còn là
mấy hình chữ nhật dán cạnh nhau.

**Bốn mươi bản đồ NHẬP TỪ TUXEMON thì giữ nguyên tileset gốc.** Chúng vẽ bằng
autotile riêng của Tuxemon — vách đá, mái nhà, bờ biển, cỏ cao — mà pack này
không có ô tương đương; thay bừa là vỡ hết đường viền của cả bốn mươi bản đồ.

Bộ autotile của pack xếp mỗi dải ba hàng: khối 3×3 viền quanh một mảng cỏ, kèm
2×2 ô góc lõm ở cột 3-4. Bốn ô góc lõm thì **thử từng ô rồi nhìn tận mắt** mới
chọn được — dựng thử một cái ao, ướm cả bốn ô vào từng hướng, chỉ ô `(3, R+1)`
là nối liền đường viền, ba ô kia đều gãy ra một cái nêm thừa. Bốn hướng góc lõm
dùng chung đúng ô đó.

Riêng **ô đất trồng** thì bản "đã tưới" làm tối theo hệ số ĐO TỪ CHÍNH PACK (so
`crops.png` với `crops_wet.png`, chỉ lấy pixel màu đất), nên ô đất ướt với cây
ướt cùng một tông.

```bash
python3 tools/mknongtrai.py "/duong/dan/full version"
```

Pack **Cozy Fishing của shubibubi** (itch.io) — cũng cùng tác giả. Lấy ba thứ:
icon 14 loài cá (cắt từ `fish_all.png`, đánh số đúng theo `fish list.txt` của
pack), dải bóng cá bơi dưới nước 15 khung, và cái quán cá bên bờ ao.

`license.txt` của pack ghi rõ: dùng được cho mọi dự án thương mại lẫn phi
thương mại, sửa thoải mái, **cấm bán lại / phát tán lại chính cái pack**. Nên
ở đây cũng chỉ commit phần đã cắt ra `assets/ca/`.

Trước đây icon cá vẽ bằng hình khối trong `tools/mkca.py` vì Tuxemon không có
con cá nào. Nay cắt từ pack, nhưng **giữ nguyên đường vẽ bằng code**: chạy
`tools/mkca.py` mà không truyền đường dẫn pack thì nó tự vẽ lại như cũ, để ai
clone kho về mà không có pack vẫn sinh lại được bộ dữ liệu.

```bash
python3 tools/mkca.py "/duong/dan/fishing_full"
```

## Của riêng dự án

| Thứ gì | Làm bằng |
|---|---|
| Chữ tiêu đề TuxeWorld (`assets/img/title.png`) | font pixel tự dựng trong script |
| Icon nào bản gốc không có (bản đồ, menu, nhiệm vụ, bang hội...) | SVG vẽ tay trong `js/ui/icons.js` |
| Icon giao diện dạng pixel (đồng tiền, lịch, đe rèn, quả trứng, la bàn...) | `tools/mkicons.py`, vẽ bằng hình khối cơ bản |
| Icon 47 món ăn và nguyên liệu | `tools/mkfood.py` — bản gốc để cả 47 món trỏ chung vào `gfx/items/box.png` nên không có gì để chép |
| Quà tặng, sprite phương tiện, dữ liệu boss | `tools/mkgifts.py`, `tools/mkmounts.py`, `tools/mkboss.py` |

Các bản đầu của dự án có mượn ảnh cắt từ game thương mại (nền trận đấu, ảnh
vật phẩm) — đã bỏ sạch, nay chỉ còn asset của chính Tuxemon và đồ tự vẽ.

## Nguồn khác đã xem qua nhưng chưa dùng

[TeamAquasHideout/Team-Aquas-Asset-Repo](https://github.com/TeamAquasHideout/Team-Aquas-Asset-Repo)
— kho asset cộng đồng cho romhack Gen 3, chia theo từng tác giả, dùng thì phải
ghi công đúng tác giả của từng tệp. Là nguồn tốt nếu sau này cần thêm sprite
nhân vật trên bản đồ hoặc tileset.
