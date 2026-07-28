# -*- coding: utf-8 -*-
"""Dung BANG DUONG — ban do rieng cua bang hoi.

Cung cach lam nhu tools/khudancu.py: tu dat tung o roi day qua dung duong ong
atlas cua tools/mktmx.py, khong doc TMX nao.

Ban do chia ba khu, mo dan theo CAP BANG (khach kiem tra truoc khi cho di qua
cong, xem js/ui/world.js):
  · San chinh   — ai vao bang cung toi duoc
  · San tap     — mo o cap 5, la cho goi boss bang
  · Kho bau     — mo o cap 10, cho nhan thuong nhiem vu

Goi tu tools/mktmx.py, dung chay truc tiep.
"""
import os

W, H = 30, 24
SLUG = 'bang_duong'
TEN = 'Bang Đường'

COT = 37


def _o(c, r):
    return r * COT + c


# Nen
DA_SAN = [_o(24, 3), _o(25, 3), _o(26, 3)]       # da xam — san lat da
CO = [_o(0, 3), _o(1, 3), _o(2, 3)]
DAT = [_o(16, 3), _o(17, 3), _o(18, 3)]
CAT = [_o(0, 18), _o(1, 18), _o(2, 18)]

# Vat the
THONG_NHO = [_o(24, 28), _o(24, 29)]
COT_DA = [_o(16, 36), _o(16, 37)]                # cot hang rao da, hai tang
RAO_DA = _o(17, 36)
DA_TANG = [_o(30, 30), _o(31, 30)]
BUI = [_o(24, 30), _o(25, 30), _o(26, 30), _o(27, 30)]
DUOC = [_o(24, 31), _o(25, 31), _o(26, 31)]      # duoc chay
TUONG_DA = _o(29, 33)
GHE = [[_o(30, 33), _o(31, 33)], [_o(30, 34), _o(31, 34)]]
HOA = [_o(28, 25), _o(29, 25), _o(30, 25)]

# Ba khu: (ten, x0, y0, x1, y1, cap bang can co)
KHU = [
    ('san_chinh', 2, 12, 27, 21, 1),
    ('san_tap', 2, 2, 13, 10, 5),
    ('kho_bau', 16, 2, 27, 10, 10),
]
# O cua noi san chinh voi hai khu tren (x, y) — dung o hang ngan cach y = 11
CUA = {'san_tap': (7, 11), 'kho_bau': (22, 11)}
# Cho goi boss bang / nhan thuong nhiem vu
BUC_BOSS = (7, 5)
RUONG_THUONG = (22, 5)
CONG = (14, H - 1)               # cong ra Khu Dan Cu, o canh duoi


def _rng(x, y, n):
    h = (x * 73856093) ^ (y * 19349663) ^ 0x85EBCA6B
    h = (h ^ (h >> 13)) * 1274126177 & 0xFFFFFFFF
    return (h >> 7) % n


def dung(root, tsx_cache, load_tsx):
    tsdir = os.path.join(root, 'mods/tuxemon/gfx/tilesets')
    ngoai = load_tsx(os.path.join(tsdir, 'core_outdoor.tsx'), tsx_cache)
    if not ngoai:
        raise SystemExit('Thiếu core_outdoor.tsx')
    g0 = 1
    sets = [(g0, ngoai)]

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

    # Nen co, rieng ba khu thi lat da
    for y in range(H):
        for x in range(W):
            dat_nen(x, y, CO)
    for _ten, x0, y0, x1, y1, _cap in KHU:
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                dat_nen(x, y, DA_SAN)

    # Loi vao tu cong len san chinh
    for y in range(12, H):
        for x in (CONG[0], CONG[0] + 1):
            dat_nen(x, y, DAT)

    # Tuong da bao quanh tung khu, chua dung mot o lam cua
    for ten, x0, y0, x1, y1, _cap in KHU:
        cua = CUA.get(ten)
        for x in range(x0 - 1, x1 + 2):
            for y in (y0 - 1, y1 + 1):
                if not (0 <= x < W and 0 <= y < H):
                    continue
                if cua and (x, y) == cua:
                    continue
                if ten == 'san_chinh' and x in (CONG[0], CONG[0] + 1) and y == y1 + 1:
                    continue                     # chua loi ra cong
                if ten == 'san_chinh' and cua is None and (x, y) in CUA.values():
                    continue
                if (x, y) in CUA.values():
                    continue
                dat_tren(x, y, RAO_DA)
        for y in range(y0 - 1, y1 + 2):
            for x in (x0 - 1, x1 + 1):
                if 0 <= x < W and 0 <= y < H and (x, y) not in CUA.values():
                    dat_tren(x, y, COT_DA[0])

    # Vien cay quanh ban do
    vien = []
    for x in range(W):
        vien += [(x, 0), (x, H - 2)]
    for y in range(2, H - 2, 2):
        vien += [(0, y), (W - 1, y)]
    for x, y in vien:
        if x in (CONG[0], CONG[0] + 1) and y >= H - 2:
            continue
        r = _rng(x, y, 10)
        if r < 6:
            dat_tren(x, y, THONG_NHO[0])
            if y + 1 < H:
                dat_tren(x, y + 1, THONG_NHO[1])
        else:
            dat_tren(x, y, DA_TANG[_rng(y, x, len(DA_TANG))])
            if y + 1 < H:
                dat_tren(x, y + 1, BUI[_rng(x, y, len(BUI))])

    # Duoc hai bên cửa, ghế đá ở sân chính
    for cx, cy in CUA.values():
        for dx in (-1, 1):
            if 0 <= cx + dx < W:
                dat_tren(cx + dx, cy, DUOC[_rng(cx, cy, len(DUOC))])
    for gx, gy in ((5, 17), (22, 17)):
        for dy, hang in enumerate(GHE):
            for dx, o in enumerate(hang):
                dat_tren(gx + dx, gy + dy, o)
    for x, y in ((10, 14), (19, 14), (10, 20), (19, 20)):
        dat_tren(x, y, HOA[_rng(x, y, len(HOA))], chan=False)

    # Bục gọi boss và rương thưởng — hai thứ này phải bấm được nên KHÔNG chắn
    dat_tren(BUC_BOSS[0], BUC_BOSS[1], TUONG_DA)
    dat_tren(RUONG_THUONG[0], RUONG_THUONG[1], TUONG_DA)

    # Dọn những ô bắt buộc phải đi được
    def don(x, y):
        if 0 <= x < W and 0 <= y < H:
            tren[idx(x, y)] = 0
            solid[idx(x, y)] = 0

    for y in range(12, H):
        for x in (CONG[0], CONG[0] + 1):
            don(x, y)
    for cx, cy in CUA.values():
        don(cx, cy)
        don(cx, cy - 1)
        don(cx, cy + 1)
    for cho in (BUC_BOSS, RUONG_THUONG):
        for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            don(cho[0] + dx, cho[1] + dy)

    talks = [
        {'x': CONG[0], 'y': H - 3, 'name': 'Bảng Bang Đường',
         'text': 'BANG ĐƯỜNG — sân tập mở ở cấp 5, kho báu mở ở cấp 10.'},
    ]

    return {
        'w': W, 'h': H, 'sets': sets, 'layers': [nen, tren], 'above': None,
        'solid': solid, 'water': water, 'warps': [], 'talks': talks,
        'trades': [], 'encs': [], 'items': [],
        'music': 'town', 'env': 'grass', 'envNight': 'night_grass',
        'npcs': [],
    }


def viet_js():
    dong = [
        '// TuxeWorld H5 | data/bangduong.js | TỰ SINH TỪ tools/bangduong.py, đừng sửa tay',
        '// Toạ độ trong Bang Đường. Cửa hai khu trên khoá theo CẤP BANG.',
        '',
        'export const BANG_MAP = "%s";' % SLUG,
        'export const CUA_KHU = [',
    ]
    for ten, _x0, _y0, _x1, _y1, cap in KHU:
        cua = CUA.get(ten)
        if not cua:
            continue
        nhan = {'san_tap': 'Sân Tập', 'kho_bau': 'Kho Báu'}[ten]
        dong.append('  { id: "%s", name: "%s", x: %d, y: %d, cap: %d },'
                    % (ten, nhan, cua[0], cua[1], cap))
    dong += [
        '];',
        '// Bục gọi boss bang (trong Sân Tập)',
        'export const BUC_BOSS = { x: %d, y: %d };' % BUC_BOSS,
        '// Rương thưởng nhiệm vụ bang (trong Kho Báu)',
        'export const RUONG_THUONG = { x: %d, y: %d };' % RUONG_THUONG,
        '// Ô cổng ra ngoài',
        'export const CONG_RA = { x: %d, y: %d };' % CONG,
        '',
    ]
    with open('js/data/bangduong.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(dong))


def them_vao(out_maps, root, tsx_cache, load_tsx, tu_map, tu_o):
    """Dung ban do va noi cong hai chieu voi mot ban do da co."""
    goc = out_maps.get(tu_map)
    if not goc:
        print('BO QUA bang duong: chua co ban do', tu_map)
        return None
    tx, ty = tu_o
    m = dung(root, tsx_cache, load_tsx)
    cx, cy = CONG
    m['warps'] = [{'x': cx, 'y': cy, 'to': tu_map, 'tx': tx, 'ty': ty + 1},
                  {'x': cx + 1, 'y': cy, 'to': tu_map, 'tx': tx, 'ty': ty + 1}]
    goc['warps'].append({'x': tx, 'y': ty, 'to': SLUG, 'tx': cx, 'ty': cy - 1})
    goc['talks'].append({'x': tx, 'y': ty - 1, 'name': 'Biển Bang Đường',
                         'text': 'Bang Đường — chỗ hội họp của các bang hội.'})
    viet_js()
    return m
