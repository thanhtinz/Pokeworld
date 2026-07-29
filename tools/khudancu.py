# -*- coding: utf-8 -*-
"""Dung KHU DAN CU — ban do rieng cua TuxeWorld de mua dat xay nha.

Truoc day sau lo dat nam nho o goc bac Thi Tran Taba: van la co cua thi tran,
khong co duong vao, khong phan biet dau la dat o dau la dong co. Tep nay sinh
han mot ban do moi, ghep tu tileset ngoai troi cua Tuxemon (CC BY-SA 4.0),
trong do dia hinh phan biet ro:

  - duong da xam    : loi di chinh, di duoc
  - san dat nau     : sau lo dat de xay nha, di duoc
  - bai co xanh     : phan con lai, di duoc
  - ho nuoc + bo cat: khong di duoc (nuoc thi engine tu chan)
  - vien cay + da   : hang rao tu nhien quanh ban do, khong di duoc

Khong doc TMX nao ca — ban do nay do minh tu dat tung o, roi day qua dung mot
duong ong (build_atlas / write_js) voi cac ban do lay tu ban goc.

Goi tu tools/mktmx.py, dung chay truc tiep.
"""
import os

W, H = 32, 26
SLUG = 'khu_dan_cu'
TEN = 'Khu Dân Cư Taba'

# ==== O trong tileset core_outdoor (37 cot) ====
COT = 37
def _o(c, r):
    return r * COT + c

# Nen — moi loai lay ba o gan giong nhau cho do phang li
CO = [_o(0, 3), _o(1, 3), _o(2, 3)]              # co xanh
DAT = [_o(16, 3), _o(17, 3), _o(18, 3)]          # dat nau
DA = [_o(24, 3), _o(25, 3), _o(26, 3)]           # da xam (duong di)
CAT = [_o(0, 18), _o(1, 18), _o(2, 18)]          # cat (bo ho)

# Vat the — dat len lop tren, nen van la co
THONG_NHO = [_o(24, 28), _o(24, 29)]             # thong nho: ngon, goc
THONG_TO = [[_o(25, 27), _o(26, 27)],            # thong to 2x3
            [_o(25, 28), _o(26, 28)],
            [_o(25, 29), _o(26, 29)]]
CAY_TRON = [[_o(28, 35), _o(29, 35)],            # cay tan tron 2x2
            [_o(28, 36), _o(29, 36)]]
BUI = [_o(24, 30), _o(25, 30), _o(26, 30), _o(27, 30)]
DA_TANG = [_o(30, 30), _o(31, 30)]
COC_RAO = _o(17, 27)                             # coc hang rao le
GOC_CAY = _o(29, 33)                             # goc cay cut
GHE = [[_o(30, 33), _o(31, 33)], [_o(30, 34), _o(31, 34)]]
HOA = [_o(28, 25), _o(29, 25), _o(30, 25), _o(28, 26), _o(29, 26)]
NAM = [_o(29, 29), _o(30, 29)]

# ==== Bo cuc ====
# Lo dat: (x, y) la goc trai tren cua vung 3x3 — dung khop voi js/engine/estate.js
LO = [
    ('a1', 'Lô A1 — Đầu ngõ', 20000, 3, 8),
    ('b1', 'Lô B1 — Mặt đường', 45000, 13, 8),
    ('c1', 'Lô C1 — Cuối ngõ', 80000, 22, 8),
    ('a2', 'Lô A2 — Đầu ngõ', 20000, 3, 17),
    ('b2', 'Lô B2 — Mặt đường', 45000, 13, 17),
    ('c2', 'Lô C2 — Cuối ngõ', 80000, 22, 17),
]
DUONG_NGANG = (12, 13)          # hai hang duong da chay ngang
DUONG_DOC = (9, 10)             # hai cot duong da chay xuong cong
HO = (24, 3, 28, 5)             # ho nuoc: x0, y0, x1, y1 (bao gom hai dau)
THO_MOC = (11, 21)              # bac tho moc dung day, quay mat ra duong
TIEM_QUA = (8, 21)              # co ban hoa dung ben kia duong, ban qua tang
TIEM_AO = (14, 21)              # co Tham ban quan ao cho nhan vat
CONG = (DUONG_DOC[0], H - 1)    # o cong o canh duoi ban do


def _rng(x, y, n):
    """So gia ngau nhien nhung on dinh: chay lai bao nhieu lan cung ra the."""
    h = (x * 73856093) ^ (y * 19349663) ^ 0x9E3779B9
    h = (h ^ (h >> 13)) * 1274126177 & 0xFFFFFFFF
    return (h >> 7) % n


def dung(root, tsx_cache, load_tsx, TILE=16):
    """Tra ve mot dict giong het parse_map() de dung chung duong ong."""
    tsdir = os.path.join(root, 'mods/tuxemon/gfx/tilesets')
    ngoai = load_tsx(os.path.join(tsdir, 'core_outdoor.tsx'), tsx_cache)
    nuoc_ts = load_tsx(os.path.join(tsdir, 'core_outdoor_water.tsx'), tsx_cache)
    if not ngoai or not nuoc_ts:
        raise SystemExit('Thiếu core_outdoor.tsx hoặc core_outdoor_water.tsx')
    g0 = 1
    g1 = 1 + ngoai['count']
    sets = [(g0, ngoai), (g1, nuoc_ts)]
    # O nuoc phang, tileset co danh dau 'surfable' nen engine biet la mat nuoc
    O_NUOC = 10

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

    # --- nen co ---
    for y in range(H):
        for x in range(W):
            dat_nen(x, y, CO)

    # --- duong da ---
    for y in DUONG_NGANG:
        for x in range(2, W - 2):
            dat_nen(x, y, DA)
    for x in DUONG_DOC:
        for y in range(DUONG_NGANG[0], H):
            dat_nen(x, y, DA)

    # --- san dat cua tung lo (5x5, om lay vung 3x3 cua can nha) ---
    for _id, _ten, _gia, lx, ly in LO:
        for y in range(ly - 1, ly + 4):
            for x in range(lx - 1, lx + 4):
                if 0 <= x < W and 0 <= y < H:
                    dat_nen(x, y, DAT)
        # bon coc rao o bon goc san cho ra dang mot thua dat
        for cx, cy in ((lx - 1, ly - 1), (lx + 3, ly - 1),
                       (lx - 1, ly + 3), (lx + 3, ly + 3)):
            if 0 <= cx < W and 0 <= cy < H:
                dat_tren(cx, cy, COC_RAO)

    # --- ho nuoc + bo cat ---
    hx0, hy0, hx1, hy1 = HO
    for y in range(hy0 - 1, hy1 + 2):
        for x in range(hx0 - 1, hx1 + 2):
            # Bo bon goc cho bo ho bot vuong vuc
            if x in (hx0 - 1, hx1 + 1) and y in (hy0 - 1, hy1 + 1):
                continue
            if 0 <= x < W and 0 <= y < H:
                dat_nen(x, y, CAT)
    for y in range(hy0, hy1 + 1):
        for x in range(hx0, hx1 + 1):
            nen[idx(x, y)] = g1 + O_NUOC
            water[idx(x, y)] = 1
            solid[idx(x, y)] = 1

    # --- vien cay quanh ban do ---
    def trong_thong_to(x, y):
        for dy, hang in enumerate(THONG_TO):
            for dx, o in enumerate(hang):
                if x + dx < W and y + dy < H:
                    dat_tren(x + dx, y + dy, o)

    def trong_cay_tron(x, y):
        for dy, hang in enumerate(CAY_TRON):
            for dx, o in enumerate(hang):
                if x + dx < W and y + dy < H:
                    dat_tren(x + dx, y + dy, o)

    # Vien day hai o, nen xep theo TUNG CAP O DOC de trong duoc cay thong hai
    # tang (ngon o tren, goc o duoi) chu khong phai rai toan goc cay cut.
    cap = []
    for x in range(W):
        cap += [(x, 0), (x, H - 2)]
    for y in range(2, H - 2, 2):
        cap += [(0, y), (1, y), (W - 2, y), (W - 1, y)]
    for x, y in cap:
        if x in DUONG_DOC and y >= H - 2:
            continue                              # chua cong ra ngoai
        r = _rng(x, y, 10)
        if r < 6:
            dat_tren(x, y, THONG_NHO[0])
            dat_tren(x, y + 1, THONG_NHO[1])
        elif r < 8:
            dat_tren(x, y, BUI[_rng(y, x, len(BUI))])
            dat_tren(x, y + 1, BUI[_rng(x, y, len(BUI))])
        else:
            dat_tren(x, y, DA_TANG[_rng(y, x, len(DA_TANG))])
            dat_tren(x, y + 1, BUI[_rng(y + 1, x, len(BUI))])
    # vai cay to nhu cho vien day dan hon
    for x, y in ((3, 0), (12, 0), (20, 0), (27, 0)):
        trong_thong_to(x, y)
    for x, y in ((5, H - 3), (25, H - 3)):
        trong_cay_tron(x, y)

    # --- trang tri cho con lai ---
    def trong(x, y):
        return (nen[idx(x, y)] in [g0 + o for o in CO]
                and not tren[idx(x, y)] and not solid[idx(x, y)])

    for y in range(2, H - 2):
        for x in range(2, W - 2):
            if not trong(x, y):
                continue
            r = _rng(x + 7, y + 11, 100)
            if r < 6:
                dat_tren(x, y, HOA[_rng(x, y, len(HOA))], chan=False)
            elif r < 8:
                dat_tren(x, y, NAM[_rng(y, x, len(NAM))], chan=False)
            elif r < 11:
                dat_tren(x, y, BUI[_rng(y + 3, x, len(BUI))])
            elif r == 11:
                dat_tren(x, y, GOC_CAY)
    # ghe da doc duong, ngoi nghi giua hai day nha
    for gx, gy in ((6, 14), (19, 14)):
        for dy, hang in enumerate(GHE):
            for dx, o in enumerate(hang):
                dat_tren(gx + dx, gy + dy, o)

    # --- don sach nhung o BAT BUOC phai di duoc ---
    # (lo dat, duong, o cua nha, cho dung truoc bac tho moc)
    def don(x, y):
        if 0 <= x < W and 0 <= y < H:
            tren[idx(x, y)] = 0
            solid[idx(x, y)] = 0

    for y in DUONG_NGANG:
        for x in range(2, W - 2):
            don(x, y)
    for x in DUONG_DOC:
        for y in range(DUONG_NGANG[0], H):
            don(x, y)
    for _id, _ten, _gia, lx, ly in LO:
        for y in range(ly, ly + 3):
            for x in range(lx, lx + 3):
                don(x, y)
        don(lx + 1, ly + 3)                       # loi vao cua truoc nha
        don(lx + 1, ly + 4)
    for cho in (THO_MOC, TIEM_QUA, TIEM_AO):
        don(cho[0], cho[1])
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            don(cho[0] + dx, cho[1] + dy)

    # --- nguoi trong khu ---
    npcs = [
        {'x': 6, 'y': 11, 'dir': 'down', 'sprite': 'homemaker', 'name': 'Cô Mai',
         'lines': ['Khu này yên tĩnh lắm. Mua lô nào thì cắm biển BÁN đó nhé.'],
         'ai': 'stand'},
        {'x': 24, 'y': 11, 'dir': 'down', 'sprite': 'cooldude', 'name': 'Anh Bảy',
         'lines': ['Xây nhà là phải chờ. Sốt ruột thì đưa thêm tiền, thợ làm nhanh cho.'],
         'ai': 'stand'},
        {'x': 16, 'y': 22, 'dir': 'up', 'sprite': 'lady', 'name': 'Chị Lan',
         'lines': ['Trong nhà kê được kha khá đồ đấy. Nhà to thì kê được nhiều hơn.'],
         'ai': 'wander'},
        {'x': 27, 'y': 21, 'dir': 'left', 'sprite': 'bob', 'name': 'Chú Tám',
         'lines': ['Đi hết ngõ này là ra lại thị trấn.'],
         'ai': 'wander'},
    ]
    npcs = [n for n in npcs if not solid[idx(n['x'], n['y'])]]

    talks = [
        {'x': DUONG_DOC[0], 'y': H - 3, 'name': 'Bảng Khu Dân Cư',
         'text': 'KHU DÂN CƯ TABA — đất nền đã chia lô, mời bà con vào xem.'},
        {'x': THO_MOC[0], 'y': THO_MOC[1] - 1, 'name': 'Biển Xưởng Mộc',
         'text': 'Xưởng mộc bác Tư — nhận đóng bàn ghế giường tủ.'},
        {'x': TIEM_QUA[0], 'y': TIEM_QUA[1] - 1, 'name': 'Biển Tiệm Quà',
         'text': 'Tiệm quà cô Hoa — hoa tươi, sô-cô-la, nhẫn cưới.'},
        {'x': TIEM_AO[0], 'y': TIEM_AO[1] - 1, 'name': 'Biển Tiệm Quần Áo',
         'text': 'Tiệm quần áo cô Thắm — áo, quần, giày, mũ, đủ cả.'},
    ]
    talks = [t for t in talks if not solid[idx(t['x'], t['y'])]]

    return {
        'w': W, 'h': H, 'sets': sets, 'layers': [nen, tren], 'above': None,
        'solid': solid, 'water': water, 'warps': [], 'talks': talks,
        'trades': [], 'encs': [], 'items': [],
        'music': 'town', 'env': 'grass', 'envNight': 'night_grass',
        'npcs': npcs,
    }


def cho_cong_ve_taba(taba):
    """Tim mot o trong o ria bac Thi Tran Taba de dat cong sang khu dan cu.

    Ba dieu kien:
      - o do va ba o quanh no deu trong (buoc vao roi con di tiep duoc);
      - khong dam vao cong / NPC / bang hieu san co;
      - PHAI nam trong vung di lai chinh cua thi tran. Thieu cai nay thi cong
        de roi vao mot goc bi cay va vach da vay kin — nguoi choi khong bao gio
        di toi duoc, ma test cung khong bat ra vi ban do van "co cong".
    """
    w, h = taba['w'], taba['h']
    solid = taba['solid']

    # Vung di lai lon nhat cua thi tran
    da = [False] * (w * h)
    lon = set()
    for y0 in range(h):
        for x0 in range(w):
            if da[y0 * w + x0] or solid[y0 * w + x0]:
                continue
            vung, ngan = set(), [(x0, y0)]
            da[y0 * w + x0] = True
            while ngan:
                x, y = ngan.pop()
                vung.add((x, y))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if not (0 <= nx < w and 0 <= ny < h):
                        continue
                    if solid[ny * w + nx] or da[ny * w + nx]:
                        continue
                    da[ny * w + nx] = True
                    ngan.append((nx, ny))
            if len(vung) > len(lon):
                lon = vung

    ban = {(n['x'], n['y']) for n in taba['npcs']}
    ban |= {(t['x'], t['y']) for t in taba['talks']}
    for wp in taba['warps']:
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                ban.add((wp['x'] + dx, wp['y'] + dy))
    # Cang gan ria bac cang tot, roi mai den cang gan giua cang tot
    ung = []
    for y in range(1, h // 2):
        for x in range(3, w - 3):
            o = [(x, y), (x, y + 1), (x - 1, y), (x + 1, y), (x, y - 1)]
            if any(p in ban for p in o):
                continue
            if any(p not in lon for p in o):
                continue
            ung.append((y, abs(x - w // 2), x))
    if not ung:
        return None
    ung.sort()
    return ung[0][2], ung[0][0]


def viet_js(lo, tho_moc, duong):
    """Ghi js/data/khudancu.js — toa do de ben engine dung lai."""
    out = ['// TuxeWorld H5 | data/khudancu.js | TỰ SINH TỪ tools/khudancu.py, đừng sửa tay',
           '// Toạ độ các lô đất trong bản đồ khu dân cư, sinh cùng lúc với bản đồ nên',
           '// không bao giờ lệch khỏi nền đất đã kẻ sẵn.',
           '',
           'export const KHU_DAT_MAP = "%s";' % SLUG,
           'export const LOTS = [']
    for _id, ten, gia, x, y in lo:
        out.append('  { id: "%s", name: "%s", price: %d, x: %d, y: %d },'
                   % (_id, ten, gia, x, y))
    out += [
        '];',
        '// Bác thợ mộc bán nội thất đứng ở đây',
        'export const THO_MOC = { x: %d, y: %d };' % tho_moc,
        '// Cô bán quà tặng đứng ở đây',
        'export const TIEM_QUA = { x: %d, y: %d };' % TIEM_QUA,
        '// Cô bán quần áo cho nhân vật đứng ở đây',
        'export const TIEM_AO = { x: %d, y: %d };' % TIEM_AO,
        '// Ô cổng ra thị trấn — dùng để chỉ đường cho người chơi',
        'export const CONG_RA = { x: %d, y: %d };' % duong,
        '',
    ]
    with open('js/data/khudancu.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(out) + '\n')


def them_vao(out_maps, root, tsx_cache, load_tsx):
    """Dung ban do, noi cong hai chieu voi Thi Tran Taba, ghi tep toa do."""
    taba = out_maps.get('taba_town')
    if not taba:
        print('BỎ QUA khu dân cư: chưa có bản đồ taba_town')
        return None
    cho = cho_cong_ve_taba(taba)
    if not cho:
        print('BỎ QUA khu dân cư: không tìm được chỗ đặt cổng ở Taba')
        return None
    tx, ty = cho
    m = dung(root, tsx_cache, load_tsx)
    cx, cy = CONG
    # Di xuong het ngo la ve thi tran; buoc vao cong o thi tran la len dau ngo
    m['warps'] = [{'x': cx, 'y': cy, 'to': 'taba_town', 'tx': tx, 'ty': ty + 1},
                  {'x': cx + 1, 'y': cy, 'to': 'taba_town', 'tx': tx, 'ty': ty + 1}]
    taba['warps'].append({'x': tx, 'y': ty, 'to': SLUG, 'tx': cx, 'ty': cy - 1})
    if ty > 0 and not taba['solid'][(ty - 1) * taba['w'] + tx]:
        taba['talks'].append({'x': tx, 'y': ty - 1, 'name': 'Biển Chỉ Đường',
                              'text': 'Khu Dân Cư Taba — đất nền chia lô, đi hướng này.'})
    viet_js(LO, THO_MOC, CONG)
    return m
