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

from PIL import Image

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

# Bon kieu mat tien. KHONG doan bang mat: o cua trong tileset co mau xam rieng
# rgb(104,104,116), do mau tung o hang chan nha thi thay bon cai cua nam dung
# cot 3, 8, 13, 18 — tuc la moi day hang rong 5 o, cua luon o cot thu 3.
#   c0, r0 = goc trai tren trong tileset
#   w, h   = co khoi (o)
#   cua_dx = cot cua tinh tu goc trai
#   cua_dy = MAY hang duoi cung la cua (nha nua go co them bac da o hang duoi)
NHA_KIEU = {
    # Nha nua go: cao 5 hang, hang cuoi la chan tuong gian phu + bac da
    'nua_go': dict(c0=0, r0=13, w=5, h=5, cua_dx=3, cua_dy=(3, 4)),
    'gach_do': dict(c0=0, r0=9, w=5, h=4, cua_dx=3, cua_dy=(3,)),
    'gach_tham': dict(c0=5, r0=9, w=5, h=4, cua_dx=3, cua_dy=(3,)),
    'go_sang': dict(c0=10, r0=9, w=5, h=4, cua_dx=3, cua_dy=(3,)),
}
#   (ma dia diem, x o cua, y o cua, ten, kieu mat tien)
TOA = [
    ('nha_nguyen', 4, 8, 'Nhà Nguyện', 'gach_do'),
    ('sanh_bang', 10, 8, 'Sảnh Bang Hội', 'nua_go'),
    ('sanh_bac', 16, 8, 'Sảnh Bạc Kim Long', 'gach_tham'),
    ('den_do_nat', 22, 8, 'Đền Đổ Nát', 'go_sang'),
]
PHO = 10                          # hang mat pho chay ngang
CONG = (13, H - 1)                # cong ra thi tran, o canh duoi

# ==== Hang quan doc pho ====
# Khong dung he thong moi: moi quay la mot NPC dung mot o co dinh, mang san
# truong `mo` — engine da co san duong "NPC lam viec: noi xong thi mo dung man
# hinh cua viec do" (xem js/ui/world.js). Dung dat quay thanh vat the rieng:
# NPC dung de len o do thi facingThing() bat trung NPC chu khong trung quay,
# bam A chi ra moi cau thoai — y het loi may cai may trong song bai.
#   (ma, x, y, ten, sprite, man mo ra, tab, loi chao)
# Ba quay tho moc / tiem qua / tiem quan ao TRUOC dung o Khu Dan Cu. Khu do la
# DAT O, nhet hang quan vao thi di mua dat cu lan vao cho bua — don het ra day.
QUAY = [
    ('tap_hoa', 4, 12, 'Chú Tạp Hoá', 'ceo', 'shop', None,
     'Thuốc men, bóng bắt, đồ lặt vặt — thiếu gì tôi cũng có.'),
    ('lo_ren', 8, 12, 'Bác Thợ Rèn', 'brute', 'craft', None,
     'Mang nguyên liệu lại đây, tôi rèn cho.'),
    ('tho_moc', 12, 12, 'Bác Thợ Mộc', 'nurse', 'estate', 'cho',
     'Bàn ghế giường tủ, thiếu gì tôi cũng có. Ghé xem đi!'),
    ('tiem_qua', 16, 12, 'Cô Hoa', 'florist', 'gifts', None,
     'Hoa tươi, sô-cô-la, nhẫn cưới — tặng ai thì người ta quý mình hơn đấy.'),
    ('tiem_ao', 20, 12, 'Cô Thắm', 'barmaid_red', 'wardrobe', 'tiem',
     'Áo quần giày mũ, cô có đủ. Mặc vào cho tươi tất người ra chứ!'),
]


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

    # Trong khoi 5x5 co may o gan nhu RONG (goc duoi ben phai gian chinh). Dat
    # dai ca khoi thi may o do thanh tuong vo hinh chan duong. Do thang do phu
    # alpha tren chinh tep tileset chu khong doan bang mat.
    tsp = Image.open(os.path.join(tsdir, 'core_buildings.png')).convert('RGBA')
    tspx = tsp.load()

    def _do_phu(c, r):
        return sum(1 for yy in range(16) for xx in range(16)
                   if tspx[c * 16 + xx, r * 16 + yy][3] > 8)

    def dat_nha(x, y, c, r, chan=True):
        if not (0 <= x < W and 0 <= y < H):
            return
        phu = _do_phu(c, r)
        if phu <= 16:                 # o rong: de nguyen nen co, khong chan
            return
        tren[idx(x, y)] = g1 + r * NHA_COT + c
        # Chi chan khi o do THAT SU day tuong; o thua thot (bac da truoc cua)
        # ve thi ve nhung van di qua duoc.
        solid[idx(x, y)] = 1 if (chan and phu > 128) else 0

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
    for _ma, cx, cy, _ten, _k in TOA:
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
    for _ma, cx, cy, _ten, kieu in TOA:
        k = NHA_KIEU[kieu]
        x0 = cx - k['cua_dx']
        y0 = cy - k['cua_dy'][0]      # hang dau cua cai cua trung o cua tren map
        for dy in range(k['h']):
            for dx in range(k['w']):
                la_cua = (dx == k['cua_dx'] and dy in k['cua_dy'])
                dat_nha(x0 + dx, y0 + dy, k['c0'] + dx, k['r0'] + dy,
                        chan=not la_cua)

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
    for _ma, cx, cy, _ten, _k in TOA:
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
    # Duong noi tu bac them xuong mat pho. KHONG don o cua lan bac da truoc
    # cua — hai o do co hinh cua nha, don di la thung mot mang giua tuong.
    for _ma, cx, cy, _ten, _k in TOA:
        bx, by = bac_them(cx, cy)
        for y in range(by + 1, PHO + 1):
            don(bx, y)
        solid[idx(cx, cy)] = 0
        solid[idx(bx, by)] = 0

    talks = [{'x': CONG[0] + 1, 'y': H - 3, 'name': 'Bảng Phố Kim Long',
              'text': 'PHỐ KIM LONG — nhà nguyện, bang hội, sòng bài và lối lên đền.'}]
    for _ma, cx, cy, ten, _k in TOA:
        bx, by = bac_them(cx, cy)
        # Cam CANH bac them: phia tren o cua la than nha, cam vao do thi bien
        # nam trong tuong, khong ai doc duoc.
        for dx in (1, -1):
            if 0 <= bx + dx < W and not solid[idx(bx + dx, by)]:
                talks.append({'x': bx + dx, 'y': by, 'name': 'Biển %s' % ten,
                              'text': '%s — bước vào ô cửa là tới nơi.' % ten})
                break

    for ma, qx, qy, ten, _sp, _man, _tab, _loi in QUAY:
        don(qx, qy)
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            don(qx + dx, qy + dy)
        if qy - 1 >= 0 and not solid[idx(qx, qy - 1)]:
            talks.append({'x': qx, 'y': qy - 1, 'name': 'Biển %s' % ten,
                          'text': '%s — đứng trước mặt bấm A.' % ten})

    npcs = [
        {'x': 13, 'y': PHO + 1, 'dir': 'down', 'sprite': 'ceo', 'name': 'Ông Quản Phố',
         'lines': ['Phố này bốn nhà bốn nghề. Cứ đi vào cửa nào cũng được.'],
         'ai': 'stand'},
        {'x': 24, 'y': PHO, 'dir': 'left', 'sprite': 'catgirl', 'name': 'Cô Bán Dạo',
         'lines': ['Sòng bài ở kia kìa. Đánh vừa thôi nhé.'], 'ai': 'wander'},
        {'x': 2, 'y': PHO + 1, 'dir': 'right', 'sprite': 'granny', 'name': 'Bà Cụ Bán Trầu',
         'lines': ['Ngồi đây cả ngày, ai qua ai lại bà đều biết.'], 'ai': 'stand'},
        {'x': 25, 'y': PHO + 1, 'dir': 'up', 'sprite': 'childactor', 'name': 'Thằng Cu Tí',
         'lines': ['Cháu đang đợi mẹ ra khỏi nhà nguyện!'], 'ai': 'wander'},
    ] + [
        {'x': qx, 'y': qy, 'dir': 'down', 'sprite': sp, 'name': ten,
         'lines': [loi], 'ai': 'stand', 'mo': man,
         **({'tab': tab} if tab else {})}
        for _ma, qx, qy, ten, sp, man, tab, loi in QUAY
    ]
    npcs = [n for n in npcs if not solid[idx(n['x'], n['y'])]]

    # Cong vao tung toa nha; mktmx.py vá lai dich den sau khi bon ban do kia
    # dung xong.
    warps = [{'x': cx, 'y': cy, 'to': ma, 'tx': 0, 'ty': 0}
             for ma, cx, cy, _ten, _k in TOA]

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
