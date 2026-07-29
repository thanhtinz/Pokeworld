# -*- coding: utf-8 -*-
"""Dung ban do Sanh Bac Kim Long tu tileset casino cua Jephed.

Module nay do tools/mktmx.py goi, khong chay rieng.

Nguon tileset: "2D Top Down Pixel Art Tileset Casino" — Jephed, Game Between
The Lines (https://gamebetweenthelines.com/). ReadMe cua pack ghi ro: mien phi
cho ca muc dich thuong mai lan phi thuong mai, ghi cong thi tot.
Giai nen vao /tmp/craftpix/casino/ (xem README).

VI SAO TU XEP TAY CHU KHONG NHAP TMX
Pack nay khong kem ban do mau. Ma may ban do mau cua pack khac (thu roi) von
la canh DEMO: tuong cut ngang, cua mo ra khoang khong, nhap thang vao game thi
nhin nhu chap va. Xep tay tung o thi kiem soat duoc het — giong cach
tools/khudancu.py dung Khu Dan Cu.

Ghi ra:
  js/data/casino.js   toa do tung may/ban de engine biet cho nao bam duoc
"""
import os

TILE = 16
SLUG = 'sanh_bac'
TEN = 'Sảnh Bạc Kim Long'
W, H = 26, 20

# Ten tep tileset trong thu muc pack
TEP = '2D_TopDown_Tileset_Casino_1024x512.png'
TS_COT = 64                      # tileset rong 64 o

# ---- O da soi tan mat roi moi chon (xem tools/, anh doi chieu trong scratch)
THAM = (3, 1)                    # tham do
THAM2 = (3, 5)                   # tham do, kieu hai
TUONG_TREN = (16, 17)            # than tuong (den, vien kem)
TUONG_CHAN = (20, 25)            # chan tuong (do)
NEN_NGOAI = (13, 30)             # gach ngoai cua

# Do dac: (cot, hang, rong, cao) cat thang tu tileset
MAY_QUAY = (49, 1, 1, 3)
MAY_WIN = (51, 1, 1, 3)
BAN_XANH = (57, 6, 7, 4)
BAN_XANH2 = (57, 11, 7, 4)
QUAY_BAR = (33, 4, 6, 3)

# Cho dat tung tro. `bam` = o nguoi choi quay mat vao thi bam duoc.
# Toa do dat theo goc trai-tren cua mon do.
# Cot giua de trong lam loi di tu cua vao, khong ke ban chan ngang.
CHO = [
    ('slots', 'Máy Quay', MAY_QUAY, 3, 3),
    ('slots', 'Máy Quay', MAY_WIN, 5, 3),
    ('slots', 'Máy Quay', MAY_QUAY, 7, 3),
    ('coinflip', 'Sấp Ngửa', MAY_WIN, 18, 3),
    ('coinflip', 'Sấp Ngửa', MAY_QUAY, 20, 3),
    ('blackjack', 'Xì Dách', BAN_XANH, 2, 8),
    ('tienlen', 'Tiến Lên', BAN_XANH2, 17, 8),
    ('domino', 'Đô-mi-nô', BAN_XANH, 2, 13),
]


def gid(o):
    """(cot, hang) -> gid trong tileset mot tam."""
    return o[1] * TS_COT + o[0] + 1


def dung(goc):
    """Xep ban do. `goc` = thu muc chua cac pack (tim /casino/ trong do)."""
    tep = None
    for dp, _, fs in os.walk(os.path.join(goc, 'casino')):
        if TEP in fs:
            tep = os.path.join(dp, TEP)
            break
    if not tep:
        return None, []

    nen = [0] * (W * H)
    do = [0] * (W * H)
    tren = [0] * (W * H)          # lop ve de len nguoi (dinh tuong, dinh may)
    solid = [0] * (W * H)
    i = lambda x, y: y * W + x

    # San: trai tham do, xen ke cho do don dieu
    for y in range(3, H - 2):
        for x in range(1, W - 1):
            nen[i(x, y)] = gid(THAM if (x + y) % 2 == 0 else THAM2)
    # Vien ngoai cua o mep duoi
    for x in range(1, W - 1):
        nen[i(x, H - 1)] = gid(NEN_NGOAI)

    # Tuong: hai hang than o tren, mot hang chan
    for x in range(W):
        for y in (0, 1):
            tren[i(x, y)] = gid(TUONG_TREN)
        do[i(x, 2)] = gid(TUONG_CHAN)
    for y in range(H):
        if y < 3:
            continue
        for x in (0, W - 1):
            do[i(x, y)] = gid(TUONG_CHAN)
    # Tuong duoi, chua mot o cua o giua
    CUA = W // 2
    for x in range(W):
        if x != CUA:
            do[i(x, H - 2)] = gid(TUONG_CHAN)

    for y in range(H):
        for x in range(W):
            if do[i(x, y)] or tren[i(x, y)]:
                solid[i(x, y)] = 1
            if not nen[i(x, y)]:
                solid[i(x, y)] = 1        # ngoai san thi khong di duoc
    # O cua: phai co NEN, khong thi la o di duoc ma trong khong, nguoi choi
    # dung tren mot manh den
    nen[i(CUA, H - 2)] = gid(NEN_NGOAI)
    solid[i(CUA, H - 2)] = 0
    solid[i(CUA, H - 1)] = 0

    # ---- Dat do dac ----
    im = None
    diem = []                     # [{id, tro, ten, x, y}] o bam duoc
    for tro, ten, (sx, sy, sw, sh), x, y in CHO:
        for dy in range(sh):
            for dx in range(sw):
                gx, gy = x + dx, y + dy
                if not (0 <= gx < W and 0 <= gy < H):
                    continue
                g = gid((sx + dx, sy + dy))
                # Hang cuoi cua mon do ve cung lop voi do dac, phan tren ve de
                # len nguoi cho co chieu sau
                if dy == sh - 1:
                    do[i(gx, gy)] = g
                else:
                    tren[i(gx, gy)] = g
                solid[i(gx, gy)] = 1
        # O bam: ca hang duoi cung cua mon do
        for dx in range(sw):
            gx = x + dx
            if 0 <= gx < W:
                diem.append({'tro': tro, 'ten': ten, 'x': gx, 'y': y + sh - 1})

    m = {
        'w': W, 'h': H,
        'layers': [nen, do],
        'above': tren,
        'solid': solid,
        'water': [0] * (W * H),
        'sets': [(1, {'img': tep, 'cols': TS_COT, 'count': TS_COT * 32,
                      'tw': TILE, 'th': TILE})],
        'warps': [], 'talks': [], 'npcs': [], 'spots': [],
        'name': TEN, 'music': 'town', 'env': 'grass', 'envNight': 'night_grass',
        'trong': 1,
        'spawn': {'x': CUA, 'y': H - 3},
    }
    # Cong ra o ngay o cua
    m['warps'].append({'x': CUA, 'y': H - 1, 'to': 'khu_dan_cu', 'tx': 16, 'ty': 13})
    return m, diem


def viet_js(diem):
    dong = [
        '// TuxeWorld H5 | data/casino.js | Chỗ đặt máy trong sảnh bạc',
        '// SINH TU DONG boi tools/casino.py — KHONG SUA TAY.',
        '',
        'export const SANH = %r;' % SLUG,
        '',
        '// Ô nào đứng quay mặt vào thì bấm A chơi được trò đó',
        'export const MAY = [',
    ]
    for d in diem:
        dong.append('  { tro: "%s", ten: "%s", x: %d, y: %d },'
                    % (d['tro'], d['ten'], d['x'], d['y']))
    dong += ['];', '',
             'export const MAY_TAI = (x, y) =>',
             '  MAY.find(m => m.x === x && m.y === y) || null;', '']
    with open('js/data/casino.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(dong) + '\n')


def them_vao(out_maps, goc):
    """Tra {slug: map} de mktmx.py nuong atlas roi ghi vao maps.js."""
    if not goc or not os.path.isdir(goc):
        return {}
    m, diem = dung(goc)
    if not m:
        print('BỎ QUA sảnh bạc: không thấy %s trong %s/casino' % (TEP, goc))
        return {}
    viet_js(diem)
    print('OK: sảnh bạc %dx%d, %d ô bấm được' % (W, H, len(diem)))
    return {SLUG: m}
