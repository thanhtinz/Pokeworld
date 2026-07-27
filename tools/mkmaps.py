# -*- coding: utf-8 -*-
"""Cong cu soan ban do PokeWorld.

Chay:  python3 tools/mkmaps.py     (chay tu thu muc goc du an)
Ket qua ghi de len js/data/maps.js — dung sua file do bang tay.

Ban do ve bang luoi ky tu, dat bang cac hinh chu nhat co dinh.
Khong dung ngau nhien / seed: chay bao nhieu lan cung ra ket qua giong het.
Ky hieu: . co  , co hoa  " co cao (gap Pokemon)  - duong dat  s cat
         ~ nuoc  W nuoc sau  # cay  o da  B bang hieu  R vach hang
"""
from collections import deque

# kich thuoc tung khoi nha: (rong, cao, (cot cua, hang cua))
BUILD = {'center': (5, 5, (2, 4)), 'mart': (4, 4, (1, 3)), 'gym': (4, 5, (1, 4)),
         'lab': (7, 5, (4, 4)), 'house': (4, 5, (1, 4)), 'house2': (5, 5, (2, 4))}

# Sprite tren ban do -> anh 2D trong assets/trainers/ (hien khi noi chuyen).
FACE = {
    'juan': 'oak', 'roxanne': 'lass', 'liza': 'youngster', 'tate': 'youngster',
    'flannery': 'lass', 'sidney': 'camper_f', 'phoebe': 'school_kid',
    'brawly': 'bug_catcher', 'steven': 'rocket_m', 'wallace': 'rocket_f',
    'wattson': 'hiker', 'winona': 'swimmer_f', 'norman': 'gentleman',
    'glacia': 'beauty', 'drake': 'sailor', 'roxanne': 'lass',
    'nurse_joy': 'nurse', 'mart_clerk': 'clerk',
}

MAPS = {}


class Grid:
    def __init__(self, w, h, fill='.'):
        self.w, self.h = w, h
        self.g = [[fill] * w for _ in range(h)]

    def rect(self, x, y, w, h, ch):
        for j in range(max(0, y), min(y + h, self.h)):
            for i in range(max(0, x), min(x + w, self.w)):
                self.g[j][i] = ch
        return self

    def border(self, ch='#'):
        return (self.rect(0, 0, self.w, 1, ch).rect(0, self.h - 1, self.w, 1, ch)
                .rect(0, 0, 1, self.h, ch).rect(self.w - 1, 0, 1, self.h, ch))

    def put(self, x, y, ch):
        self.g[y][x] = ch
        return self

    def dots(self, pts, ch):
        for x, y in pts:
            self.g[y][x] = ch
        return self

    # duong di ngang/doc cho gon
    def road_h(self, x, y, length, ch='-'):
        return self.rect(x, y, length, 1, ch)

    def road_v(self, x, y, length, ch='-'):
        return self.rect(x, y, 1, length, ch)

    def rows(self):
        return [''.join(r) for r in self.g]


def add(mid, name, grid, spawn, warps, npcs=(), buildings=(), spots=(), image=None, enc_all=False):
    # enc_all: hang dong khong co co cao, di o dau cung co the gap Pokemon
    MAPS[mid] = dict(name=name, rows=grid.rows() if isinstance(grid, Grid) else grid,
                     spawn=spawn, warps=list(warps), npcs=list(npcs),
                     buildings=list(buildings), spots=list(spots), image=image,
                     enc_all=bool(enc_all))


# ==================== 1. Thi tran khoi dau (32x26) ====================
g = Grid(32, 26).border()
g.road_h(3, 9, 26).road_h(3, 19, 26)          # hai duong ngang
g.road_v(8, 9, 11).road_v(18, 9, 11)          # hai duong doc noi chung
g.road_v(15, 19, 7).road_v(16, 19, 7)         # duong ra cong nam
g.rect(2, 21, 5, 4, '"').rect(25, 21, 5, 4, '"')
g.rect(9, 20, 6, 5, 's').rect(10, 21, 4, 3, '~')     # ao nho
g.dots([(11, 3), (21, 3), (5, 12), (28, 12), (20, 24)], ',')
g.put(13, 20, 'B')
add('town_1', 'Thị Trấn Khởi Đầu', g, (15, 22),
    warps=[(15, 25, 'route_1', 8, 1), (16, 25, 'route_1', 8, 1),
           (6, 8, 'pc_town', 6, 8), (13, 8, 'mart_town', 3, 7)],
    buildings=[
        ('center', 4, 4, 'enter', 'Pokémon Center', 'Cửa tự động mở ra.'),
        ('mart', 12, 5, 'enter', 'Poké Mart', 'Cửa tự động mở ra.'),
        ('house', 18, 4, 'talk', "Neighbor's House", 'Cửa khoá rồi.'),
        ('house2', 24, 4, 'talk', 'Old House', 'Bên trong tối om.'),
        ('house', 3, 14, 'home', 'Your House', 'Nhà của bạn. Ấm áp thật.'),
        ('lab', 10, 14, 'lab', "Professor Oak's Lab", 'Phòng nghiên cứu của Giáo sư Oak.'),
        ('house2', 20, 14, 'talk', "Rival's House", 'Nhà của Blue.'),
        ('gym', 26, 14, 'gym', 'Rock Gym', 'Phòng Gym hệ Đá. Sẵn sàng thách đấu chưa?', 'gym_brock'),
    ],
    npcs=[
        (14, 20, 'talk', 'juan', 'Professor Oak', 'Cỏ cao là nơi Pokémon hoang trú ngụ. Hãy cẩn thận!'),
        (5, 20, 'talk', 'roxanne', 'Daisy', 'Anh trai tớ đang ở trong phòng nghiên cứu đấy.'),
        (24, 10, 'talk', 'liza', 'Boy', 'Poké Mart mới nhập Poké Ball đó!'),
        (10, 10, 'talk', 'wattson', 'Old Man', 'Hồi trẻ ta từng đi hết Hang Đá, sâu bên trong còn một hang nữa đấy!'),
        (28, 20, 'talk', 'tate', 'Kid', 'Phòng Gym hệ Đá khó lắm, cẩn thận nhé!'),
    ])

# ==================== 2. Duong so 1 (40x30) ====================
g = Grid(40, 30).border()
g.road_v(8, 0, 13).road_h(0, 12, 32).road_v(31, 12, 10)
g.road_h(10, 21, 22).road_v(10, 21, 9)
g.rect(2, 3, 5, 6, '"').rect(12, 2, 9, 7, '"').rect(24, 3, 8, 6, '"')
g.rect(2, 15, 5, 5, '"').rect(13, 15, 8, 5, '"').rect(24, 15, 6, 4, '"')
g.rect(13, 24, 8, 4, '"').rect(24, 23, 7, 5, '"')
g.dots([(4, 11), (22, 11), (35, 8), (35, 20), (6, 23), (36, 26)], 'o')
g.dots([(10, 10), (27, 11), (5, 27), (34, 15)], ',')
g.rect(35, 3, 3, 4, '#').rect(3, 12, 3, 2, '#').rect(22, 26, 4, 2, '#')
g.put(9, 11, 'B')
add('route_1', 'Đường Số 1', g, (8, 2),
    warps=[(8, 0, 'town_1', 15, 24), (10, 29, 'route_2', 6, 1), (0, 12, 'forest_1', 33, 14)],
    npcs=[
        (17, 11, 'trainer', 'tate', 'Youngster Joey', 'Pokémon của tớ mạnh lắm đấy!', 'youngster_minh'),
        (11, 20, 'trainer', 'flannery', 'Lass Nina', 'Dễ thương nhưng không hiền đâu nhé!', 'lass_lan'),
        (28, 12, 'trainer', 'brawly', 'Bug Catcher Rick', 'Bọ là nhất!', 'bugcatcher_tung'),
        (33, 21, 'talk', 'norman', 'Hiker', 'Đi thẳng xuống nam là tới Đường Số 2.'),
    ])

# ==================== 3. Duong so 2 (40x30) ====================
g = Grid(40, 30).border()
g.road_v(6, 0, 10).road_h(6, 9, 34).road_v(31, 9, 12)
g.road_h(12, 20, 20).road_v(12, 20, 10)
g.rect(2, 2, 4, 6, '"').rect(9, 2, 9, 6, '"').rect(22, 2, 8, 6, '"')
g.rect(2, 12, 6, 6, '"').rect(15, 12, 8, 6, '"').rect(25, 13, 5, 5, '"')
g.rect(14, 23, 9, 5, '"').rect(25, 22, 6, 6, '"')
g.rect(33, 3, 5, 5, 'o').rect(34, 13, 4, 4, 'o')
g.dots([(8, 11), (20, 10), (10, 19), (24, 21), (5, 26), (37, 26)], 'o')
g.dots([(4, 10), (28, 11), (19, 22), (33, 25)], ',')
g.rect(2, 20, 3, 3, '#').rect(35, 20, 3, 2, '#')
add('route_2', 'Đường Số 2', g, (6, 2),
    warps=[(6, 0, 'route_1', 10, 28), (39, 9, 'cave_1', 1, 11), (12, 29, 'lake_1', 17, 1)],
    npcs=[
        (21, 10, 'trainer', 'sidney', 'Camper Ethan', 'Đường này ta canh giữ!', 'hiker_dung'),
        (13, 19, 'trainer', 'wallace', 'Rocket Duo', 'Bọn ta đang bận đào đá quý!', 'rocket_2'),
        (28, 9, 'talk', 'phoebe', 'Bug Catcher', 'Trong rừng phía tây nhiều bọ lắm!'),
        (14, 27, 'talk', 'glacia', 'Lady', 'Hồ Gương Trời ngay dưới kia, đẹp lắm!'),
    ])

# ==================== 4. Rung xanh tham (36x30) ====================
g = Grid(36, 30, '#').border()
g.rect(31, 13, 5, 3, '.')                       # cua vao tu Duong So 1
g.rect(6, 13, 26, 3, '.')
g.rect(6, 4, 3, 12, '.').rect(6, 4, 18, 3, '.')
g.rect(21, 4, 3, 10, '.')
g.rect(6, 15, 3, 11, '.').rect(6, 24, 22, 3, '.')
g.rect(25, 16, 3, 11, '.')
g.rect(12, 8, 10, 3, '.').rect(12, 8, 3, 8, '.')
g.rect(15, 18, 13, 3, '.').rect(15, 15, 3, 5, '.')
g.rect(9, 4, 12, 3, '"').rect(9, 13, 9, 3, '"')
g.rect(15, 24, 12, 3, '"').rect(16, 18, 9, 3, '"')
g.rect(12, 8, 8, 3, '"')
g.dots([(28, 14), (7, 20), (26, 22), (19, 15)], 'o')
g.dots([(7, 8), (26, 25), (13, 26)], ',')
add('forest_1', 'Rừng Xanh Thẳm', g, (33, 14),
    warps=[(35, 13, 'route_1', 1, 12), (35, 14, 'route_1', 1, 12), (35, 15, 'route_1', 1, 12)],
    npcs=[
        (17, 25, 'trainer', 'brawly', 'Bug Catcher Rick', 'Bọ là nhất!', 'bugcatcher_tung'),
        (13, 5, 'talk', 'steven', 'Rocket Grunt', 'Cút khỏi đây, nhóc!'),
        (23, 19, 'talk', 'drake', 'Woodsman', 'Rừng này dễ lạc lắm, cứ men theo lối mòn.'),
    ])

# ==================== 5. Hang Da (34x26) ====================
g = Grid(34, 26, 'R').border('R')
g.rect(0, 10, 8, 4, 's')
g.rect(6, 4, 4, 10, 's').rect(6, 4, 16, 4, 's')
g.rect(18, 6, 4, 14, 's').rect(10, 16, 14, 4, 's')
g.rect(10, 12, 5, 8, 's').rect(22, 8, 11, 4, 's')
g.rect(24, 10, 4, 12, 's').rect(14, 20, 14, 4, 's')
g.rect(32, 10, 2, 2, 's')                       # loi sang Hang Sau Tham
g.dots([(8, 6), (12, 5), (16, 6), (20, 11), (12, 18), (26, 14), (30, 10), (17, 22), (23, 21)], 'o')
add('cave_1', 'Hang Đá', g, (1, 11), enc_all=True,
    warps=[(0, 11, 'route_2', 38, 9), (0, 12, 'route_2', 38, 9),
           (33, 10, 'cave_2', 2, 13), (33, 11, 'cave_2', 2, 13)],
    npcs=[
        (26, 21, 'trainer', 'wallace', 'Rocket Duo', 'Bọn ta đang bận đào đá quý!', 'rocket_2'),
        (13, 17, 'talk', 'wattson', 'Hiker', 'Đi hết hang này về phía đông còn một hang sâu hơn nữa!'),
        (30, 9, 'talk', 'roxanne', 'Geologist', 'Đá ở đây toàn loại quý đấy!'),
    ])

# ==================== 6. Ho Guong Troi (36x28) ====================
g = Grid(36, 28).border()
g.rect(4, 4, 28, 13, 's')
g.rect(7, 6, 22, 9, '~').rect(12, 8, 12, 5, 'W')
g.road_v(17, 0, 5)
g.road_h(3, 21, 30).road_v(17, 17, 5).road_v(17, 21, 7)
g.rect(2, 24, 6, 3, '"').rect(28, 24, 6, 3, '"')
g.dots([(3, 3), (33, 3), (5, 19), (31, 19)], ',')
g.put(3, 20, 'B')
add('lake_1', 'Hồ Gương Trời', g, (17, 2),
    warps=[(17, 0, 'route_2', 12, 28), (23, 20, 'pc_lake', 6, 8), (17, 27, 'route_3', 19, 1)],
    buildings=[
        ('gym', 8, 16, 'gym', 'Cerulean Gym', 'Phòng Gym hệ Nước. Sẵn sàng chưa?', 'gym_thuy'),
        ('center', 21, 16, 'enter', 'Pokémon Center', 'Cửa tự động mở ra.'),
        ('house', 28, 16, 'talk', 'Fisherman Hut', 'Mùi cá nồng nặc.'),
    ],
    npcs=[
        (33, 12, 'talk', 'winona', 'Swimmer', 'Nghe nói có Gyarados khổng lồ dưới hồ này...'),
        (6, 24, 'trainer', 'sidney', 'Camper Ethan', 'Đường này ta canh giữ!', 'hiker_dung'),
        (14, 22, 'talk', 'liza', 'Girl', 'Trung tâm Pokémon ngay bên phải đó!'),
    ])

# ==================== 7. Duong so 3 (38x30) ====================
# Noi Ho Guong Troi len phia bac toi Lang Ven Nui. Nhieu co cao hai ben duong.
g = Grid(38, 30).border()
g.road_v(19, 0, 14).road_h(5, 13, 28).road_v(5, 13, 17)
g.road_h(5, 27, 26).road_v(30, 13, 17)
g.rect(2, 3, 6, 8, '"').rect(10, 2, 7, 9, '"').rect(22, 3, 6, 7, '"')
g.rect(2, 16, 6, 9, '"').rect(11, 15, 7, 10, '"').rect(21, 16, 7, 9, '"')
g.rect(31, 3, 5, 8, '#').rect(32, 16, 4, 8, '#')
g.dots([(9, 12), (18, 12), (27, 12), (9, 26), (17, 26), (25, 26), (34, 13)], 'o')
g.dots([(4, 12), (21, 11), (7, 26), (29, 25), (20, 15)], ',')
g.put(20, 12, 'B')
add('route_3', 'Đường Số 3', g, (19, 2),
    warps=[(19, 0, 'lake_1', 17, 26), (5, 29, 'meadow_1', 18, 1), (30, 29, 'town_2', 16, 1)],
    npcs=[
        (18, 13, 'trainer', 'sidney', 'Camper Liam', 'Cắm trại ở đây mát lắm, đấu một trận không?', 'camper_route3'),
        (6, 20, 'talk', 'wattson', 'Hiker', 'Xuống tây nam là Đồng Hoa Nắng, đông nam là Làng Ven Núi.'),
        (28, 13, 'talk', 'winona', 'Swimmer', 'Tớ vừa bơi từ hồ lên, mệt quá!'),
        (12, 26, 'trainer', 'winona', 'Swimmer Marina', 'Tớ lên bờ nghỉ chút, đấu thử nhé!', 'sailor_route3'),
    ])

# ==================== 8. Dong Hoa Nang (34x28) ====================
# Vung dat thoang, toan hoa va co cao — cho san Pokemon he Co / Bay.
g = Grid(34, 28, ',').border('#')
g.road_h(2, 14, 30).road_v(18, 0, 28)
g.rect(3, 3, 12, 9, '"').rect(19, 3, 12, 9, '"')
g.rect(3, 17, 12, 9, '"').rect(20, 17, 11, 9, '"')
g.rect(2, 2, 30, 1, ',').rect(2, 25, 30, 1, ',')
g.road_h(2, 14, 30).road_v(18, 0, 28)
g.rect(8, 6, 4, 3, '~').rect(24, 20, 5, 3, '~')
g.dots([(6, 13), (26, 13), (10, 15), (28, 16), (5, 23), (30, 6)], 'o')
g.put(17, 13, 'B')
add('meadow_1', 'Đồng Hoa Nắng', g, (18, 2),
    warps=[(18, 0, 'route_3', 5, 28)],
    npcs=[
        (16, 14, 'talk', 'glacia', 'Flower Girl', 'Hoa ở đây nở quanh năm, Pokémon hệ Cỏ mê lắm!'),
        (20, 14, 'trainer', 'flannery', 'Picnicker Hazel', 'Đi dã ngoại mà gặp đối thủ, vui quá!', 'lass_rainbow'),
        (18, 24, 'talk', 'liza', 'Kid', 'Tớ thấy một con chim to đùng bay ngang qua đây!'),
    ])

# ==================== 9. Lang Ven Nui (30x26) ====================
g = Grid(30, 26).border()
g.road_h(3, 8, 24).road_h(3, 18, 24)
g.road_v(15, 0, 26).road_v(16, 0, 26)
g.road_v(6, 8, 11).road_v(23, 8, 11)
g.rect(2, 21, 5, 3, '"').rect(24, 21, 4, 3, '"')
g.rect(2, 11, 3, 5, 's').rect(26, 11, 3, 5, 's')
g.dots([(9, 20), (20, 20), (5, 9), (25, 9)], ',')
g.put(14, 20, 'B')
add('town_2', 'Làng Ven Núi', g, (15, 21),
    warps=[(15, 0, 'route_3', 30, 28), (16, 0, 'route_3', 30, 28),
           (8, 7, 'pc_town2', 6, 8), (19, 7, 'mart_town2', 3, 7),
           (15, 25, 'beach_1', 17, 1), (16, 25, 'beach_1', 17, 1)],
    buildings=[
        ('center', 6, 3, 'enter', 'Pokémon Center', 'Cửa tự động mở ra.'),
        ('mart', 18, 4, 'enter', 'Poké Mart', 'Cửa tự động mở ra.'),
        ('house', 24, 3, 'talk', 'Miner Home', 'Chủ nhà đi làm mỏ rồi.'),
        ('house2', 7, 13, 'talk', 'Village Hall', 'Nhà văn hoá của làng.'),
        ('house', 20, 13, 'talk', 'Fisher Home', 'Lưới cá phơi trước cửa.'),
    ],
    npcs=[
        (12, 19, 'talk', 'norman', 'Village Chief', 'Làng ta nằm giữa núi và biển, đi đâu cũng tiện.'),
        (19, 19, 'talk', 'roxanne', 'Girl', 'Bãi biển phía nam đẹp lắm, nhất là lúc hoàng hôn.'),
        (5, 19, 'talk', 'tate', 'Boy', 'Hang sâu trong núi tối lắm, đừng vào một mình!'),
        (25, 19, 'trainer', 'steven', 'Rocket Grunt', 'Làng này sắp thuộc về Rocket!', 'rocket_grunt_3'),
    ])

# ==================== 10. Bai Bien Hoang Hon (36x28) ====================
g = Grid(36, 28, 's').border('#')
g.rect(1, 1, 34, 6, '.')
g.rect(2, 18, 32, 5, '~').rect(1, 21, 33, 6, 'W')
g.rect(34, 1, 1, 26, '#')
g.rect(1, 7, 34, 11, 's')
g.road_v(17, 0, 7)
g.rect(4, 2, 5, 4, '"').rect(27, 2, 6, 4, '"')
g.dots([(6, 9), (12, 12), (20, 10), (28, 13), (9, 16), (24, 16), (31, 9), (15, 15)], 'o')
g.dots([(3, 3), (21, 4), (13, 3)], ',')
g.put(16, 6, 'B')
add('beach_1', 'Bãi Biển Hoàng Hôn', g, (17, 2),
    warps=[(17, 0, 'town_2', 15, 24)],
    npcs=[
        (18, 8, 'talk', 'drake', 'Old Sailor', 'Ta lênh đênh bốn mươi năm, chưa từng thấy sóng dữ như hôm qua.'),
        (10, 11, 'trainer', 'winona', 'Swimmer Douglas', 'Dưới nước tớ là số một!', 'swimmer_light'),
        (27, 10, 'talk', 'phoebe', 'Kid', 'Sò biển ở đây bắt được Pokémon vỏ cứng đó!'),
    ])

# ==================== 11. Hang Sau Tham (32x28) ====================
# Me cung da: hanh lang hep, nhieu nga re, khong co loi tat.
g = Grid(32, 28, 'R').border('R')
g.rect(0, 12, 7, 3, 's')                        # cua vao tu Loi Mon Cat
g.rect(5, 3, 3, 12, 's').rect(5, 3, 14, 3, 's')
g.rect(16, 5, 3, 9, 's').rect(9, 11, 10, 3, 's')
g.rect(9, 14, 3, 9, 's').rect(9, 20, 17, 3, 's')
g.rect(23, 6, 3, 15, 's').rect(19, 6, 7, 3, 's')
g.rect(12, 23, 3, 4, 's').rect(12, 24, 14, 3, 's')
g.rect(26, 12, 4, 3, 's').rect(27, 12, 3, 13, 's')
g.dots([(6, 8), (17, 8), (11, 12), (24, 11), (10, 17), (20, 21), (28, 18), (13, 25), (22, 25)], 'o')
add('cave_2', 'Hang Sâu Thẳm', g, (2, 13), enc_all=True,
    warps=[(0, 13, 'cave_1', 32, 11)],
    npcs=[
        (24, 20, 'trainer', 'wattson', 'Hiker Marcos', 'Leo núi cả đời, chưa sợ ai bao giờ!', 'camper_victory'),
        (17, 12, 'trainer', 'roxanne', 'Researcher Mio', 'Tôi đang đo địa chấn, đừng làm phiền!', 'channeler_unknown'),
        (28, 24, 'talk', 'steven', 'Rocket Grunt', 'Chỗ này là của bọn ta, biến đi!'),
    ])

# ==================== Trong nha: anh that lam nen ====================
PC_ROWS = [
    '##############', '##############', '##############', '##############',
    '#............#', '##...........#', '##........####', '##........####',
    '######..######',
]
MART_ROWS = [
    '###########', '###########', '###.......#', '###.......#',
    '###...##..#', '......##..#', '......##..#', '###..######',
]

def pokecenter(mid, back, bx, by):
    add(mid, 'Trung Tâm Pokémon', PC_ROWS, (6, 8),
        warps=[(6, 8, back, bx, by), (7, 8, back, bx, by)],
        npcs=[(6, 2, 'deco', 'nurse_joy', 'Nurse Joy', '')],
        spots=[(6, 3, 'heal', 'Nurse Joy', 'Chào mừng tới Trung tâm Pokémon! Để tôi chăm sóc đội của bạn nhé.', 'nurse_joy'),
               (9, 3, 'pc', 'PC', 'Máy gửi Pokémon. Mở hộp chứa nhé?', None)],
        image='assets/interiors/pokecenter.png')

def martmap(mid, back, bx, by):
    add(mid, 'Poké Mart', MART_ROWS, (3, 7),
        warps=[(3, 7, back, bx, by), (4, 7, back, bx, by)],
        npcs=[(1, 2, 'deco', 'mart_clerk', 'Clerk', '')],
        spots=[(2, 3, 'shop', 'Poké Mart', 'Chào mừng! Bạn cần mua gì nào?', 'mart_clerk')],
        image='assets/interiors/mart.png')

pokecenter('pc_town', 'town_1', 6, 9)
martmap('mart_town', 'town_1', 13, 9)
pokecenter('pc_lake', 'lake_1', 23, 21)
pokecenter('pc_town2', 'town_2', 8, 8)
martmap('mart_town2', 'town_2', 19, 8)

# ==================== Kiem tra ====================
SOLID = set('~W#oBR')
WALK = set('.,"-s')

def door_tiles(m):
    out = set()
    for b in m['buildings']:
        bw, bh, (dx, dy) = BUILD[b[0]]
        out.add((b[1] + dx, b[2] + dy))
    return out

for mid, m in MAPS.items():
    w = len(m['rows'][0]); h = len(m['rows'])
    for i, r in enumerate(m['rows']):
        assert len(r) == w, (mid, 'hang %d dai %d, phai la %d' % (i, len(r), w))

    # o bi nha de len
    occupied = set()
    for b in m['buildings']:
        bw, bh, (dx, dy) = BUILD[b[0]]
        assert 1 <= b[1] and 1 <= b[2] and b[1] + bw <= w - 1 and b[2] + bh <= h - 1, (mid, b[4], 'ra ngoai bien')
        for j in range(b[2], b[2] + bh):
            for i in range(b[1], b[1] + bw):
                assert (i, j) not in occupied, (mid, b[4], 'chong len nha khac tai', i, j)
                occupied.add((i, j))
        fx, fy = b[1] + dx, b[2] + dy + 1
        assert m['rows'][fy][fx] in WALK, (mid, b[4], 'truoc cua khong di duoc', (fx, fy))

    doors = door_tiles(m)
    npc_at = {(n[0], n[1]) for n in m['npcs']}

    def walkable(x, y):
        if not (0 <= x < w and 0 <= y < h):
            return False
        if (x, y) in occupied and (x, y) not in doors:
            return False
        return m['rows'][y][x] in WALK

    # tu diem xuat hien co di toi moi noi khong
    sx, sy = m['spawn']
    assert walkable(sx, sy), (mid, 'diem xuat hien chan duong')
    seen = {(sx, sy)}
    q = deque([(sx, sy)])
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if (nx, ny) in seen or (nx, ny) in npc_at or not walkable(nx, ny):
                continue
            seen.add((nx, ny)); q.append((nx, ny))
    total = sum(1 for y in range(h) for x in range(w) if walkable(x, y))
    lost = [(x, y) for y in range(h) for x in range(w)
            if walkable(x, y) and (x, y) not in seen and (x, y) not in npc_at]
    assert not lost, (mid, 'o di duoc nhung khong toi noi:', lost[:10])

    for n in m['npcs']:
        if n[2] == 'deco':
            continue
        assert (n[0], n[1]) not in occupied, (mid, n[4], 'dung trong nha')
        assert m['rows'][n[1]][n[0]] in WALK, (mid, n[4], 'dung tren o chan duong')
        assert any((n[0] + dx, n[1] + dy) in seen for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))), \
            (mid, n[4], 'khong ai toi noi de noi chuyen')

    for sp in m['spots']:
        assert any((sp[0] + dx, sp[1] + dy) in seen for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))), \
            (mid, sp[3], 'quay khong ai toi duoc')

    for wp in m['warps']:
        assert (wp[0], wp[1]) in doors or m['rows'][wp[1]][wp[0]] in WALK, (mid, 'cong tren o chan duong', wp)
        assert (wp[0], wp[1]) in seen or (wp[0], wp[1]) in doors, (mid, 'cong khong toi duoc', wp)
        t = MAPS[wp[2]]
        assert t['rows'][wp[4]][wp[3]] in WALK, (mid, 'diem den chan duong', wp)

print('OK: %d ban do, kich thuoc %s' % (
    len(MAPS), ', '.join('%s %dx%d' % (k, len(v['rows'][0]), len(v['rows'])) for k, v in MAPS.items())))

# ==================== Xuat ====================
def js(s):
    return "'" + str(s).replace('\\', '\\\\').replace("'", "\\'") + "'"

out = ["// PokeWorld H5 | data/maps.js | Bản đồ đi lại được — TỰ SINH TỪ tools/mkmaps.py, đừng sửa tay",
       '// Ký hiệu ô: . cỏ  , cỏ hoa  " cỏ cao (gặp Pokémon)  - đường đất  s cát',
       '//            ~ nước  W nước sâu  # cây  o đá  B bảng hiệu  R vách hang',
       "import { BUILDINGS } from './tiles.js';", '',
       'export const TILE_SIZE = 16;', '',
       '// Ký tự -> loại địa hình. solid: chắn đường. enc: đi vào có thể gặp Pokémon.',
       """export const TERRAIN = {
  '.': { kind: 'grass' },
  ',': { kind: 'grass', decor: 'flower' },
  '"': { kind: 'grass', decor: 'tall', enc: true },
  '-': { kind: 'path' },
  's': { kind: 'sand' },
  '~': { kind: 'water', solid: true },
  'W': { kind: 'deep', solid: true },
  '#': { kind: 'tree', solid: true },
  'o': { kind: 'grass', decor: 'rock', solid: true },
  'B': { kind: 'grass', decor: 'sign', solid: true },
  'R': { kind: 'rockwall', solid: true },
};""", '', 'export const MAPS = {']

for mid, m in MAPS.items():
    out.append('  %s: {' % mid)
    out.append('    name: %s,' % js(m['name']))
    if m['image']:
        out.append('    image: %s,' % js(m['image']))
    if m['enc_all']:
        out.append('    encAll: true,   // hang dong: di o nao cung co the gap Pokemon')
    out.append('    spawn: { x: %d, y: %d },' % m['spawn'])
    out.append('    rows: [')
    out += ['      %s,' % js(r) for r in m['rows']]
    out.append('    ],')
    out.append('    buildings: [')
    for b in m['buildings']:
        tid = (', trainerId: %s' % js(b[6])) if len(b) > 6 else ''
        out.append('      { b: %s, x: %d, y: %d, kind: %s, name: %s, text: %s%s },'
                   % (js(b[0]), b[1], b[2], js(b[3]), js(b[4]), js(b[5]), tid))
    out.append('    ],')
    if m['spots']:
        out.append('    spots: [')
        for sp in m['spots']:
            spr = (', sprite: %s' % js(sp[5])) if len(sp) > 5 and sp[5] else ''
            fc = (', face: %s' % js(FACE[sp[5]])) if len(sp) > 5 and FACE.get(sp[5]) else ''
            out.append('      { x: %d, y: %d, kind: %s, name: %s, text: %s%s%s },'
                       % (sp[0], sp[1], js(sp[2]), js(sp[3]), js(sp[4]), spr, fc))
        out.append('    ],')
    out.append('    warps: [')
    for wp in m['warps']:
        out.append('      { x: %d, y: %d, to: %s, tx: %d, ty: %d },' % (wp[0], wp[1], js(wp[2]), wp[3], wp[4]))
    out.append('    ],')
    out.append('    npcs: [')
    for n in m['npcs']:
        tid = (', trainerId: %s' % js(n[6])) if len(n) > 6 else ''
        fc = (', face: %s' % js(FACE[n[3]])) if FACE.get(n[3]) else ''
        out.append('      { x: %d, y: %d, kind: %s, sprite: %s, name: %s, text: %s%s%s },'
                   % (n[0], n[1], js(n[2]), js(n[3]), js(n[4]), js(n[5]), fc, tid))
    out.append('    ],')
    out.append('  },')
out.append('};')
out.append('''
export const mapWidth = (map) => map.rows[0].length;
export const mapHeight = (map) => map.rows.length;

// Tra ký tự địa hình. Ngoài biên coi như cây.
export function charAt(map, x, y) {
  const row = map.rows[y];
  if (!row || x < 0 || x >= row.length) return '#';
  return row[x];
}

export function terrainAt(map, x, y) {
  return TERRAIN[charAt(map, x, y)] || TERRAIN['.'];
}

// Ô cửa của từng toà nhà: { 'x,y': {...building} }
export function doorsOf(map) {
  const out = {};
  for (const b of map.buildings || []) {
    const def = BUILDINGS[b.b];
    if (!def) continue;
    out[`${b.x + def.door[0]},${b.y + def.door[1]}`] = b;
  }
  return out;
}''')

open('js/data/maps.js', 'w').write('\n'.join(out) + '\n')
print('da ghi js/data/maps.js')
