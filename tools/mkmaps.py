# -*- coding: utf-8 -*-
"""Cong cu soan ban do PokeWorld.

Chay:  python3 tools/mkmaps.py     (chay tu thu muc goc du an)
Ket qua ghi de len js/data/maps.js — dung sua file do bang tay.

Ban do ve bang luoi ky tu, dat bang cac hinh chu nhat co dinh.
Khong dung ngau nhien / seed: chay bao nhieu lan cung ra ket qua giong het.
Ky hieu: . co  , co hoa  " co cao (gap Pokemon)  - duong dat  s cat
         ~ nuoc  W nuoc sau  # cay  o da  B bang hieu
"""
W, H = 24, 20

def blank(fill='.'):
    return [[fill] * W for _ in range(H)]

def rect(g, x, y, w, h, ch):
    for j in range(y, min(y + h, H)):
        for i in range(x, min(x + w, W)):
            if i >= 0 and j >= 0:
                g[j][i] = ch

def border(g, ch='#'):
    rect(g, 0, 0, W, 1, ch); rect(g, 0, H - 1, W, 1, ch)
    rect(g, 0, 0, 1, H, ch); rect(g, W - 1, 0, 1, H, ch)

def rows(g):
    return [''.join(r) for r in g]

MAPS = {}

# Sprite tren ban do -> anh 2D trong assets/trainers/ (hien khi noi chuyen).
# Ai khong co anh 2D thi de trong, luc do hop thoai phong to sprite ban do len.
FACE = {
    'juan': 'oak', 'roxanne': 'lass', 'liza': 'youngster', 'tate': 'youngster',
    'flannery': 'lass', 'sidney': 'camper_f', 'phoebe': 'school_kid',
    'brawly': 'bug_catcher', 'steven': 'rocket_m', 'wallace': 'rocket_f',
    'wattson': 'hiker', 'winona': 'swimmer_f',
    'nurse_joy': 'nurse', 'mart_clerk': 'clerk',
}


# ---------------- 1. Thi tran khoi dau ----------------
g = blank(); border(g)
rect(g, 3, 7, 18, 1, '-')        # duong ngang truoc Trung tam & Mart
rect(g, 3, 15, 18, 1, '-')       # duong ngang truoc phong thi nghiem & nha
rect(g, 6, 7, 1, 9, '-')         # duong doc noi hai duong ngang
rect(g, 6, 15, 1, 5, '-')        # duong ra cong nam
rect(g, 2, 17, 3, 2, '"')        # bui co
rect(g, 17, 17, 4, 2, '"')
g[3][11] = ','; g[16][19] = ','; g[8][19] = ','
g[13][21] = 'B'
MAPS['town_1'] = dict(
    name='Thị Trấn Khởi Đầu', rows=rows(g), spawn=(11, 16),
    buildings=[
        ('center', 3, 2, 'enter', 'Pokémon Center', 'Cửa tự động mở ra.'),
        ('mart', 15, 3, 'enter', 'Poké Mart', 'Cửa tự động mở ra.'),
        ('lab', 8, 10, 'lab', "Professor Oak's Lab", 'Phòng nghiên cứu Pokémon của Giáo sư Oak.'),
        ('house', 2, 10, 'home', 'Your House', 'Nhà của bạn. Ấm áp thật.'),
        ('house2', 17, 10, 'talk', "Neighbor's House", 'Cửa khoá rồi.'),
    ],
    warps=[(6, 19, 'route_1', 6, 1),
           (5, 6, 'pc_town', 6, 8), (16, 6, 'mart_town', 3, 7)],
    npcs=[
        (15, 16, 'talk', 'juan', 'Professor Oak', 'Cỏ cao là nơi Pokémon hoang trú ngụ. Hãy cẩn thận!'),
        (3, 16, 'talk', 'roxanne', 'Daisy', 'Anh trai tớ đang ở trong phòng nghiên cứu đấy.'),
        (19, 8, 'talk', 'liza', 'Boy', 'Poké Mart mới nhập Poké Ball đó!'),
    ],
)

# ---------------- 2. Duong so 1 ----------------
g = blank(); border(g)
rect(g, 6, 0, 1, 11, '-')
rect(g, 0, 10, 18, 1, '-')
rect(g, 17, 10, 1, 10, '-')
rect(g, 10, 2, 7, 5, '"')
rect(g, 2, 4, 4, 3, '"')
rect(g, 2, 12, 5, 4, '"')
rect(g, 10, 12, 6, 3, '"')
g[8][3] = '#'; g[8][12] = '#'; g[17][3] = '#'; g[17][13] = '#'
g[16][8] = 'o'; g[6][19] = 'o'
g[1][20] = ','; g[18][2] = ','
MAPS['route_1'] = dict(
    name='Đường Số 1', rows=rows(g), spawn=(6, 2), buildings=[],
    warps=[(6, 0, 'town_1', 6, 18), (17, 19, 'route_2', 5, 1), (0, 10, 'forest_1', 21, 9)],
    npcs=[
        (12, 7, 'trainer', 'tate', 'Youngster Joey', 'Pokémon của tớ mạnh lắm đấy!', 'youngster_joey'),
        (8, 14, 'trainer', 'flannery', 'Lass Nina', 'Dễ thương nhưng không hiền đâu nhé!', 'lass_nina'),
    ],
)

# ---------------- 3. Duong so 2 ----------------
g = blank(); border(g)
rect(g, 5, 0, 1, 8, '-')
rect(g, 5, 7, 19, 1, '-')
rect(g, 18, 7, 1, 13, '-')
rect(g, 1, 5, 3, 2, '"')
rect(g, 9, 2, 7, 2, '"')
rect(g, 5, 9, 7, 3, '"')
rect(g, 5, 15, 7, 2, '"')
rect(g, 2, 12, 2, 1, 'o'); rect(g, 12, 13, 2, 1, 'o')
g[13][20] = '#'; g[3][20] = '#'; g[16][2] = '#'
g[11][15] = ','
MAPS['route_2'] = dict(
    name='Đường Số 2', rows=rows(g), spawn=(5, 2), buildings=[],
    warps=[(5, 0, 'route_1', 17, 18), (23, 7, 'cave_1', 1, 9), (18, 19, 'lake_1', 11, 1)],
    npcs=[
        (14, 10, 'trainer', 'sidney', 'Camper Ethan', 'Đường này ta canh giữ!', 'camper_ethan'),
        (3, 16, 'talk', 'phoebe', 'Bug Catcher', 'Trong rừng phía tây nhiều bọ lắm!'),
    ],
)

# ---------------- 4. Rung xanh tham ----------------
g = blank('#'); border(g)
# duong mon xuyen rung
rect(g, 21, 8, 3, 3, '.')
rect(g, 4, 9, 18, 2, '.')
rect(g, 4, 3, 2, 7, '.')
rect(g, 4, 3, 12, 2, '.')
rect(g, 14, 3, 2, 8, '.')
rect(g, 4, 10, 2, 7, '.')
rect(g, 4, 15, 15, 2, '.')
rect(g, 17, 11, 2, 6, '.')
# vung co cao trong rung
rect(g, 7, 3, 7, 2, '"')
rect(g, 6, 9, 6, 2, '"')
rect(g, 7, 15, 7, 2, '"')
g[12][17] = 'o'; g[6][4] = ','; g[13][5] = ','
MAPS['forest_1'] = dict(
    name='Rừng Xanh Thẳm', rows=rows(g), spawn=(21, 9), buildings=[],
    warps=[(23, 9, 'route_1', 1, 10), (23, 10, 'route_1', 1, 10)],
    npcs=[
        (9, 16, 'trainer', 'brawly', 'Bug Catcher Rick', 'Bọ là nhất!', 'bug_catcher_rick'),
        (10, 4, 'talk', 'steven', 'Rocket Grunt', 'Cút khỏi đây, nhóc!'),
    ],
)

# ---------------- 5. Deo Da (loi di nui) ----------------
g = blank('#'); border(g)
rect(g, 0, 8, 7, 3, 's')
rect(g, 5, 3, 3, 8, 's')
rect(g, 5, 3, 13, 3, 's')
rect(g, 15, 5, 3, 11, 's')
rect(g, 8, 13, 10, 3, 's')
rect(g, 8, 10, 3, 4, 's')
rect(g, 8, 10, 8, 2, 's')
rect(g, 18, 8, 5, 2, 's')
for (x, y) in [(6, 6), (9, 4), (12, 4), (16, 8), (11, 14), (14, 14), (20, 8), (6, 9)]:
    g[y][x] = 'o'
MAPS['cave_1'] = dict(
    name='Lối Mòn Cát', rows=rows(g), spawn=(1, 9), buildings=[],
    warps=[(0, 9, 'route_2', 22, 7)],
    npcs=[
        (17, 14, 'trainer', 'wallace', 'Rocket Duo', 'Bọn ta đang bận đào đá quý!', 'rocket_2'),
        (12, 11, 'talk', 'wattson', 'Hiker', 'Lối mòn này gió lớn, cẩn thận đấy!'),
    ],
)

# ---------------- 6. Ho Guong Troi ----------------
g = blank(); border(g)
rect(g, 3, 3, 17, 8, 's')
rect(g, 5, 4, 13, 6, '~')
rect(g, 7, 6, 9, 3, 'W')
rect(g, 11, 0, 1, 3, '-')
rect(g, 2, 17, 20, 1, '-')
rect(g, 11, 11, 1, 7, '-')
rect(g, 2, 13, 4, 2, '"')
rect(g, 18, 13, 4, 2, '"')
g[2][2] = ','; g[15][21] = ','
g[16][2] = 'B'
MAPS['lake_1'] = dict(
    name='Hồ Gương Trời', rows=rows(g), spawn=(11, 2), buildings=[
        ('gym', 5, 12, 'gym', 'Cerulean Gym', 'Phòng Gym hệ Nước. Sẵn sàng chưa?', 'gym_thuy'),
        ('center', 14, 12, 'enter', 'Pokémon Center', 'Cửa tự động mở ra.'),
    ],
    warps=[(11, 0, 'route_2', 18, 18), (16, 16, 'pc_lake', 6, 8)],
    npcs=[
        (20, 8, 'talk', 'winona', 'Swimmer', 'Nghe nói có Gyarados khổng lồ dưới hồ này...'),
    ],
)


# ---------------- Trong nha: dung anh that lam nen, luoi chi de chan duong ----------------
PC_ROWS = [
    '##############',
    '##############',
    '##############',
    '##############',
    '#............#',
    '##...........#',
    '##........####',
    '##........####',
    '######..######',
]
MART_ROWS = [
    '###########',
    '###########',
    '###.......#',
    '###.......#',
    '###...##..#',
    '......##..#',
    '......##..#',
    '###..######',
]

def pokecenter(mid, name, back, bx, by):
    MAPS[mid] = dict(
        name=name, rows=PC_ROWS, spawn=(6, 8), buildings=[],
        image='assets/interiors/pokecenter.png',
        warps=[(6, 8, back, bx, by), (7, 8, back, bx, by)],
        npcs=[(6, 2, 'deco', 'nurse_joy', 'Nurse Joy', '')],
        spots=[(6, 3, 'heal', 'Nurse Joy', 'Chào mừng tới Trung tâm Pokémon! Để tôi chăm sóc đội của bạn nhé.', 'nurse_joy'),
               (9, 3, 'pc', 'PC', 'Máy gửi Pokémon. Mở hộp chứa nhé?', None)],
    )

def martmap(mid, name, back, bx, by):
    MAPS[mid] = dict(
        name=name, rows=MART_ROWS, spawn=(3, 7), buildings=[],
        image='assets/interiors/mart.png',
        warps=[(3, 7, back, bx, by), (4, 7, back, bx, by)],
        npcs=[(1, 2, 'deco', 'mart_clerk', 'Clerk', '')],
        spots=[(2, 3, 'shop', 'Poké Mart', 'Chào mừng! Bạn cần mua gì nào?', 'mart_clerk')],
    )

pokecenter('pc_town', 'Trung Tâm Pokémon', 'town_1', 5, 7)
martmap('mart_town', 'Poké Mart', 'town_1', 16, 7)
pokecenter('pc_lake', 'Trung Tâm Pokémon', 'lake_1', 16, 17)

# ---------------- Kiem tra & xuat ----------------
for mid, m in MAPS.items():
    mw = len(m['rows'][0])
    for i, r in enumerate(m['rows']):
        assert len(r) == mw, (mid, i, len(r), 'khong bang hang dau')
    sx, sy = m['spawn']
    assert m['rows'][sy][sx] in '.,-s', (mid, 'spawn', m['rows'][sy][sx])
    for w in m['warps']:
        assert w[2] in MAPS, (mid, 'warp dich', w)
print('OK: tat ca ban do hop le')

BUILD = {'center': (5,5,(2,4)), 'mart': (4,4,(1,3)), 'gym': (4,5,(1,4)),
         'lab': (7,5,(4,4)), 'house': (4,5,(1,4)), 'house2': (5,5,(2,4))}
for mid, m in MAPS.items():
    occupied = set()
    for b in m['buildings']:
        bw, bh, (dx, dy) = BUILD[b[0]]
        bx, by = b[1], b[2]
        assert bx >= 1 and by >= 1 and bx + bw <= W - 1 and by + bh <= H - 1, (mid, b[0], 'ra ngoai bien')
        for j in range(by, by + bh):
            for i in range(bx, bx + bw):
                assert (i, j) not in occupied, (mid, b[0], 'chong len nha khac', i, j)
                occupied.add((i, j))
        fx, fy = bx + dx, by + dy + 1
        assert m['rows'][fy][fx] in '.,-s', (mid, b[0], 'truoc cua khong di duoc', fx, fy, m['rows'][fy][fx])
    for n in m['npcs']:
        if n[2] == 'deco':
            continue          # NPC trang tri dung sau quay, khong can o trong
        assert (n[0], n[1]) not in occupied, (mid, n[4], 'dung trong nha')
        assert m['rows'][n[1]][n[0]] in '.,-s"', (mid, n[4], 'dung tren o chan duong')
    door_tiles = set()
    for bb in m['buildings']:
        bw, bh, (ddx, ddy) = BUILD[bb[0]]
        door_tiles.add((bb[1] + ddx, bb[2] + ddy))
    for w in m['warps']:
        # cong o ngay o cua nha la binh thuong (buoc vao la di vao trong)
        assert (w[0], w[1]) not in occupied or (w[0], w[1]) in door_tiles, (mid, 'cong nam trong nha')
        t = MAPS[w[2]]
        if (w[0], w[1]) not in door_tiles:
            assert m['rows'][w[1]][w[0]] in '.,-s"', (mid, 'cong tren o chan duong', w)
        assert t['rows'][w[4]][w[3]] in '.,-s"', (mid, 'diem den chan duong', w)
    assert (m['spawn'][0], m['spawn'][1]) not in occupied, (mid, 'diem xuat hien trong nha')
print('OK: nha, NPC, cong deu hop le')


def js_str(s):
    return "'" + s.replace('\\', '\\\\').replace("'", "\\'") + "'"

out = []
out.append("// PokeWorld H5 | data/maps.js | Bản đồ đi lại được — TỰ SINH TỪ tools/mkmaps.py, đừng sửa tay")
out.append("// Ký hiệu ô: . cỏ  , cỏ hoa  \" cỏ cao (gặp Pokémon)  - đường đất  s cát")
out.append("//            ~ nước  W nước sâu  # cây  o đá  B bảng hiệu")
out.append("import { BUILDINGS } from './tiles.js';")
out.append("")
out.append("export const TILE_SIZE = 16;")
out.append("")
out.append("// Ký tự -> loại địa hình. solid: chắn đường. enc: đi vào có thể gặp Pokémon.")
out.append("""export const TERRAIN = {
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
};""")
out.append("")
out.append("export const MAPS = {")
for mid, m in MAPS.items():
    out.append("  %s: {" % mid)
    out.append("    name: %s," % js_str(m['name']))
    if m.get('image'):
        out.append("    image: %s," % js_str(m['image']))
    out.append("    spawn: { x: %d, y: %d }," % m['spawn'])
    out.append("    rows: [")
    for r in m['rows']:
        out.append("      %s," % js_str(r))
    out.append("    ],")
    if m['buildings']:
        out.append("    buildings: [")
        for b in m['buildings']:
            tid = (", trainerId: %s" % js_str(b[6])) if len(b) > 6 else ""
            out.append("      { b: %s, x: %d, y: %d, kind: %s, name: %s, text: %s%s },"
                       % (js_str(b[0]), b[1], b[2], js_str(b[3]), js_str(b[4]), js_str(b[5]), tid))
        out.append("    ],")
    else:
        out.append("    buildings: [],")
    out.append("    warps: [")
    for w in m['warps']:
        out.append("      { x: %d, y: %d, to: %s, tx: %d, ty: %d }," % (w[0], w[1], js_str(w[2]), w[3], w[4]))
    out.append("    ],")
    if m.get('spots'):
        out.append("    spots: [")
        for sp in m['spots']:
            spr = (", sprite: %s" % js_str(sp[5])) if len(sp) > 5 and sp[5] else ""
            fc = (", face: %s" % js_str(FACE[sp[5]])) if len(sp) > 5 and FACE.get(sp[5]) else ""
            out.append("      { x: %d, y: %d, kind: %s, name: %s, text: %s%s%s },"
                       % (sp[0], sp[1], js_str(sp[2]), js_str(sp[3]), js_str(sp[4]), spr, fc))
        out.append("    ],")
    out.append("    npcs: [")
    for n in m['npcs']:
        tid = (", trainerId: %s" % js_str(n[6])) if len(n) > 6 else ""
        fc = (", face: %s" % js_str(FACE[n[3]])) if FACE.get(n[3]) else ""
        out.append("      { x: %d, y: %d, kind: %s, sprite: %s, name: %s, text: %s%s%s },"
                   % (n[0], n[1], js_str(n[2]), js_str(n[3]), js_str(n[4]), js_str(n[5]), fc, tid))
    out.append("    ],")
    out.append("  },")
out.append("};")
out.append("""
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
}""")

open('/home/user/Pokeworld/js/data/maps.js', 'w').write('\n'.join(out) + '\n')
print('da ghi js/data/maps.js')
