# -*- coding: utf-8 -*-
"""Dung KHU PHO — pho co bon toa nha cong cong cua thi tran.

Truoc day bon dia diem (Nha Nguyen, Sanh Bang Hoi, Sanh Bac, Den Do Nat) chi
vao duoc tu Menu, tren ban do khong co cua nao. Ban va dau tien cam cua thang
vao KHU DAN CU — nhung cho do la DAT O cua nguoi choi, dung nha cong cong len
day la chiem cho. Nen tach han ra mot khu rieng.

Bo cuc: mot con pho lat da chay ngang, bon toa nha dung mot ben, cong ra o
canh duoi noi len Khu Dan Cu.

Cung cach lam nhu tools/khudancu.py va tools/bangduong.py: tu dat tung o roi
day qua dung duong ong atlas cua tools/mktmx.py, khong doc TMX nao.

Goi tu tools/mktmx.py, dung chay truc tiep.
"""
import os

W, H = 28, 18
SLUG = 'khu_pho'
TEN = 'Phố Kim Long'

# ==== O trong tileset core_outdoor (37 cot) ====
COT = 37


def _o(c, r):
    return r * COT + c


CO = [_o(0, 3), _o(1, 3), _o(2, 3)]
DA = [_o(24, 3), _o(25, 3), _o(26, 3)]           # da xam — mat pho
DAT = [_o(16, 3), _o(17, 3), _o(18, 3)]
THONG_NHO = [_o(24, 28), _o(24, 29)]
BUI = [_o(24, 30), _o(25, 30), _o(26, 30), _o(27, 30)]
DA_TANG = [_o(30, 30), _o(31, 30)]
HOA = [_o(28, 25), _o(29, 25), _o(30, 25), _o(28, 26), _o(29, 26)]
GHE = [[_o(30, 33), _o(31, 33)], [_o(30, 34), _o(31, 34)]]

# ==== Nha lay tu tileset core_buildings (47 cot) ====
# Khoi 5 rong x 4 cao, cua vom nam o cot 3 cua khoi.
NHA_COT = 47
NHA_W, NHA_H = 5, 4
NHA_CUA_DX = 3
# Ca bon dung CHUNG mot mat tien: chi khoi (0,13) la da soi ky va biet chac
# cot 3 dung la cai cua vom. May khoi khac trong tileset co khoi cot do la cua
# so, dat cong len day thi nguoi choi chui vao cua so. Muon moi toa mot kieu
# thi phai do lai vi tri cua cua tung khoi mot.
#   (ma dia diem, x o cua, y o cua, ten, cot goc, hang goc trong tileset)
TOA = [
    ('nha_nguyen', 4, 8, 'Nhà Nguyện', 0, 13),
    ('sanh_bang', 10, 8, 'Sảnh Bang Hội', 0, 13),
    ('sanh_bac', 16, 8, 'Sảnh Bạc Kim Long', 0, 13),
    ('den_do_nat', 22, 8, 'Đền Đổ Nát', 0, 13),
]
PHO = 10                          # hang mat pho chay ngang
CONG = (13, H - 1)                # cong ra Khu Dan Cu, o canh duoi


def bac_them(cx, cy):
    """O nguoi choi dat chan khi buoc ra: ngay duoi o cua."""
    return (cx, cy + 1)


def _rng(x, y, n):
    return ((x * 7 + y * 13) ^ (x * y)) % n


def dung(root, tsx_cache, load_tsx):
    """Tra ve mot dict giong het parse_map() de dung chung duong ong."""
    tsdir = os.path.join(root, 'mods/tuxemon/gfx/tilesets')
    ngoai = load_tsx(os.path.join(tsdir, 'core_outdoor.tsx'), tsx_cache)
    nha_ts = load_tsx(os.path.join(tsdir, 'core_buildings.tsx'), tsx_cache)
    if not ngoai or not nha_ts:
        raise SystemExit('Thiếu core_outdoor.tsx hoặc core_buildings.tsx')
    g0 = 1
    g1 = 1 + ngoai['count']
    sets = [(g0, ngoai), (g1, nha_ts)]

    nen = [0] * (W * H)
    tren = [0] * (W * H)
    solid = [0] * (W * H)
    water = [0] * (W * H)

    def idx(x, y):
        return y * W + x

    def dat_nen(x, y, bo):
        nen[idx(x, y)] = g0 + bo[_rng(x, y, len(bo))]

    def dat_tren(x, y, o, chan=True):
        tren[idx(x, y)] = g0 + o
        if chan:
            solid[idx(x, y)] = 1

    def dat_nha(x, y, c, r, chan=True):
        if not (0 <= x < W and 0 <= y < H):
            return
        tren[idx(x, y)] = g1 + r * NHA_COT + c
        solid[idx(x, y)] = 1 if chan else 0

    # --- nen: co khap noi, mat pho lat da ---
    for y in range(H):
        for x in range(W):
            dat_nen(x, y, CO)
    for y in (PHO, PHO + 1):
        for x in range(1, W - 1):
            dat_nen(x, y, DA)
    # ngo doc tu mat pho xuong cong
    for y in range(PHO, H):
        for x in (CONG[0], CONG[0] + 1):
            dat_nen(x, y, DA)
    # san dat truoc tung toa nha
    for _ma, cx, cy, _ten, _c, _r in TOA:
        for y in range(cy + 1, PHO):
            for x in range(cx - 1, cx + 2):
                if 0 <= x < W:
                    dat_nen(x, y, DAT)

    # --- vien cay quanh ban do ---
    for x in range(W):
        for y in (0, H - 1):
            if (x, y) != CONG and (x, y) != (CONG[0] + 1, H - 1):
                dat_tren(x, y, THONG_NHO[_rng(x, y, 2)])
    for y in range(H):
        for x in (0, W - 1):
            dat_tren(x, y, THONG_NHO[_rng(x, y, 2)])

    # --- bon toa nha ---
    for _ma, cx, cy, _ten, c0, r0 in TOA:
        x0 = cx - NHA_CUA_DX
        y0 = cy - (NHA_H - 1)
        for dy in range(NHA_H):
            for dx in range(NHA_W):
                la_cua = (dx == NHA_CUA_DX and dy == NHA_H - 1)
                dat_nha(x0 + dx, y0 + dy, c0 + dx, r0 + dy, chan=not la_cua)

    # --- vat trang tri doc pho, tranh loi di ---
    def trong(x, y):
        return (0 <= x < W and 0 <= y < H and not solid[idx(x, y)]
                and not (PHO <= y <= PHO + 1)
                and not any(abs(x - t[1]) <= 1 and t[2] <= y <= PHO for t in TOA))

    for gx, gy in ((2, 13), (25, 13)):
        for dy, hang in enumerate(GHE):
            for dx, o in enumerate(hang):
                if trong(gx + dx, gy + dy):
                    dat_tren(gx + dx, gy + dy, o)
    for x, y in ((6, 14), (11, 15), (18, 14), (21, 15), (8, 12), (24, 15)):
        if trong(x, y):
            dat_tren(x, y, BUI[_rng(x, y, len(BUI))], chan=False)
    for x, y in ((3, 16), (20, 12), (26, 12)):
        if trong(x, y):
            dat_tren(x, y, DA_TANG[_rng(x, y, 2)])
    for _ma, cx, cy, _ten, _c, _r in TOA:
        for dx in (-1, 1):
            if trong(cx + dx, cy + 1):
                dat_tren(cx + dx, cy + 1, HOA[_rng(cx, cy, len(HOA))], chan=False)

    # --- don sach nhung o BAT BUOC phai di duoc ---
    def don(x, y):
        if 0 <= x < W and 0 <= y < H:
            tren[idx(x, y)] = 0
            solid[idx(x, y)] = 0

    for y in (PHO, PHO + 1):
        for x in range(1, W - 1):
            don(x, y)
    for y in range(PHO, H - 1):
        for x in (CONG[0], CONG[0] + 1):
            don(x, y)
    don(*CONG)
    don(CONG[0] + 1, H - 1)
    # Bac them truoc tung cua + duong noi xuong mat pho
    for _ma, cx, cy, _ten, _c, _r in TOA:
        bx, by = bac_them(cx, cy)
        for y in range(by, PHO + 1):
            don(bx, y)
        solid[idx(cx, cy)] = 0        # o cua giu hinh cai vom nhung di duoc

    talks = [{'x': CONG[0] + 1, 'y': H - 3, 'name': 'Bảng Phố Kim Long',
              'text': 'PHỐ KIM LONG — nhà nguyện, bang hội, sòng bài và lối lên đền.'}]
    for _ma, cx, cy, ten, _c, _r in TOA:
        bx, by = bac_them(cx, cy)
        # Cam CANH bac them: phia tren o cua la than nha, cam vao do thi bien
        # nam trong tuong, khong ai doc duoc.
        for dx in (1, -1):
            if 0 <= bx + dx < W and not solid[idx(bx + dx, by)]:
                talks.append({'x': bx + dx, 'y': by, 'name': 'Biển %s' % ten,
                              'text': '%s — bước vào ô cửa là tới nơi.' % ten})
                break

    npcs = [
        {'x': 13, 'y': PHO + 1, 'dir': 'down', 'sprite': 'ceo', 'name': 'Ông Quản Phố',
         'lines': ['Phố này bốn nhà bốn nghề. Cứ đi vào cửa nào cũng được.'],
         'ai': 'stand'},
        {'x': 20, 'y': PHO, 'dir': 'left', 'sprite': 'catgirl', 'name': 'Cô Bán Dạo',
         'lines': ['Sòng bài ở kia kìa. Đánh vừa thôi nhé.'], 'ai': 'wander'},
    ]
    npcs = [n for n in npcs if not solid[idx(n['x'], n['y'])]]

    # Cong vao tung toa nha; mktmx.py vá lai dich den sau khi bon ban do kia
    # dung xong.
    warps = [{'x': cx, 'y': cy, 'to': ma, 'tx': 0, 'ty': 0}
             for ma, cx, cy, _ten, _c, _r in TOA]

    return {
        'w': W, 'h': H, 'sets': sets, 'layers': [nen, tren], 'above': None,
        'solid': solid, 'water': water, 'warps': warps, 'talks': talks,
        'trades': [], 'encs': [], 'items': [],
        'music': 'town', 'env': 'grass', 'envNight': 'night_grass',
        'npcs': npcs,
    }


def them_vao(out_maps, root, tsx_cache, load_tsx, tu_map, tu_o):
    """Dung ban do va noi cong hai chieu voi mot ban do da co."""
    goc = out_maps.get(tu_map)
    if not goc:
        print('BỎ QUA khu phố: chưa có bản đồ', tu_map)
        return None
    tx, ty = tu_o
    m = dung(root, tsx_cache, load_tsx)
    cx, cy = CONG
    m['warps'] = [{'x': cx, 'y': cy, 'to': tu_map, 'tx': tx, 'ty': ty + 1},
                  {'x': cx + 1, 'y': cy, 'to': tu_map, 'tx': tx, 'ty': ty + 1}
                  ] + m.get('warps', [])
    goc['warps'].append({'x': tx, 'y': ty, 'to': SLUG, 'tx': cx, 'ty': cy - 1})
    if ty + 1 < goc['h'] and not goc['solid'][(ty + 1) * goc['w'] + tx]:
        goc['talks'].append({'x': tx, 'y': ty + 1, 'name': 'Biển Chỉ Đường',
                             'text': 'Phố Kim Long — nhà nguyện, bang hội, sòng bài, đi hướng này.'})
    return m
