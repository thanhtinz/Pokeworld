# -*- coding: utf-8 -*-
"""Cong cu soan ban do PokeWorld.

Chay:  python3 tools/mkmaps.py     (chay tu thu muc goc du an)
Ket qua ghi de len js/data/maps.js — dung sua file do bang tay.

Ban do ve bang luoi ky tu, dat bang cac hinh chu nhat co dinh.
Khong dung ngau nhien / seed: chay bao nhieu lan cung ra ket qua giong het.
Ky hieu: . co  , co hoa  " co cao (gap Pokemon)  - duong dat  s cat
         ~ nuoc  W nuoc sau  # cay  o da  B bang hieu
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


def add(mid, name, grid, spawn, warps, npcs=(), buildings=(), spots=(), image=None):
    MAPS[mid] = dict(name=name, rows=grid.rows() if isinstance(grid, Grid) else grid,
                     spawn=spawn, warps=list(warps), npcs=list(npcs),
                     buildings=list(buildings), spots=list(spots), image=image)


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
        (10, 10, 'talk', 'wattson', 'Old Man', 'Hồi trẻ ta từng leo hết Lối Mòn Cát!'),
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
        (17, 11, 'trainer', 'tate', 'Youngster Joey', 'Pokémon của tớ mạnh lắm đấy!', 'youngster_joey'),
        (11, 20, 'trainer', 'flannery', 'Lass Nina', 'Dễ thương nhưng không hiền đâu nhé!', 'lass_nina'),
        (28, 12, 'trainer', 'brawly', 'Bug Catcher Rick', 'Bọ là nhất!', 'bug_catcher_rick'),
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
        (21, 10, 'trainer', 'sidney', 'Camper Ethan', 'Đường này ta canh giữ!', 'camper_ethan'),
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
        (17, 25, 'trainer', 'brawly', 'Bug Catcher Rick', 'Bọ là nhất!', 'bug_catcher_rick'),
        (13, 5, 'talk', 'steven', 'Rocket Grunt', 'Cút khỏi đây, nhóc!'),
        (23, 19, 'talk', 'drake', 'Woodsman', 'Rừng này dễ lạc lắm, cứ men theo lối mòn.'),
    ])

# ==================== 5. Loi Mon Cat (34x26) ====================
g = Grid(34, 26, '#').border()
g.rect(0, 10, 8, 4, 's')
g.rect(6, 4, 4, 10, 's').rect(6, 4, 16, 4, 's')
g.rect(18, 6, 4, 14, 's').rect(10, 16, 14, 4, 's')
g.rect(10, 12, 5, 8, 's').rect(22, 8, 11, 4, 's')
g.rect(24, 10, 4, 12, 's').rect(14, 20, 14, 4, 's')
g.dots([(8, 6), (12, 5), (16, 6), (20, 11), (12, 18), (26, 14), (30, 10), (17, 22), (23, 21)], 'o')
add('cave_1', 'Lối Mòn Cát', g, (1, 11),
    warps=[(0, 11, 'route_2', 38, 9), (0, 12, 'route_2', 38, 9)],
    npcs=[
        (26, 21, 'trainer', 'wallace', 'Rocket Duo', 'Bọn ta đang bận đào đá quý!', 'rocket_2'),
        (13, 17, 'talk', 'wattson', 'Hiker', 'Lối mòn này gió lớn, cẩn thận đấy!'),
        (30, 9, 'talk', 'roxanne', 'Geologist', 'Đá ở đây toàn loại quý đấy!'),
    ])

# ==================== 6. Ho Guong Troi (36x28) ====================
g = Grid(36, 28).border()
g.rect(4, 4, 28, 13, 's')
g.rect(7, 6, 22, 9, '~').rect(12, 8, 12, 5, 'W')
g.road_v(17, 0, 5)
g.road_h(3, 21, 30).road_v(17, 17, 5)
g.rect(2, 24, 6, 3, '"').rect(28, 24, 6, 3, '"')
g.dots([(3, 3), (33, 3), (5, 19), (31, 19)], ',')
g.put(3, 20, 'B')
add('lake_1', 'Hồ Gương Trời', g, (17, 2),
    warps=[(17, 0, 'route_2', 12, 28), (23, 20, 'pc_lake', 6, 8)],
    buildings=[
        ('gym', 8, 16, 'gym', 'Cerulean Gym', 'Phòng Gym hệ Nước. Sẵn sàng chưa?', 'gym_thuy'),
        ('center', 21, 16, 'enter', 'Pokémon Center', 'Cửa tự động mở ra.'),
        ('house', 28, 16, 'talk', 'Fisherman Hut', 'Mùi cá nồng nặc.'),
    ],
    npcs=[
        (33, 12, 'talk', 'winona', 'Swimmer', 'Nghe nói có Gyarados khổng lồ dưới hồ này...'),
        (6, 24, 'trainer', 'sidney', 'Camper Ethan', 'Đường này ta canh giữ!', 'camper_ethan'),
        (14, 22, 'talk', 'liza', 'Girl', 'Trung tâm Pokémon ngay bên phải đó!'),
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

# ==================== Kiem tra ====================
SOLID = set('~W#oB')
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
       '//            ~ nước  W nước sâu  # cây  o đá  B bảng hiệu',
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
};""", '', 'export const MAPS = {']

for mid, m in MAPS.items():
    out.append('  %s: {' % mid)
    out.append('    name: %s,' % js(m['name']))
    if m['image']:
        out.append('    image: %s,' % js(m['image']))
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
