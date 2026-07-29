# -*- coding: utf-8 -*-
"""Dung NONG TRAI — ban do rieng de trong trot, nuoi thu, nhan don hang.

Di het ngo phia BAC cua Khu Dan Cu la toi. Tach han ra mot ban do rieng vi ba
viec nay chiem nhieu cho: rieng khu ruong da an het mot goc ban do, ma nhet
chung vao khu dat o thi lai thanh cai mo hon hop nhu truoc.

Ban do nay chi lo DIA HINH: co, duong da, ao ca, vien cay, cong. Con ruong,
chuong thu, hang rao... deu la VAT THE do nguoi choi tu ke (xem
js/engine/nongtrai.js) — co the thi moi "tu trang tri bo cuc nong trai" duoc.

Vat the nong trai KHONG chan duong, giong het can nha cua nguoi choi ben Khu
Dan Cu: di xuyen qua duoc, dung truoc mat bam A la lam viec. Lam vat the chan
duong thi ke kin ruong xong la tu nhot minh o giua.

Cung cach lam nhu tools/khudancu.py: tu dat tung o roi day qua dung duong ong
atlas cua tools/mktmx.py, khong doc TMX nao.

Goi tu tools/mktmx.py, dung chay truc tiep.
"""
import os

W, H = 30, 24
SLUG = 'nong_trai'
TEN = 'Nông Trại Bờ Suối'

COT = 37


def _o(c, r):
    return r * COT + c


CO = [_o(0, 3), _o(1, 3), _o(2, 3)]              # co xanh
DAT = [_o(16, 3), _o(17, 3), _o(18, 3)]          # dat nau
DA = [_o(24, 3), _o(25, 3), _o(26, 3)]           # da xam (duong di)
CAT = [_o(0, 18), _o(1, 18), _o(2, 18)]          # cat (bo ao)
THONG_NHO = [_o(24, 28), _o(24, 29)]
THONG_TO = [[_o(25, 27), _o(26, 27)],
            [_o(25, 28), _o(26, 28)],
            [_o(25, 29), _o(26, 29)]]
BUI = [_o(24, 30), _o(25, 30), _o(26, 30), _o(27, 30)]
DA_TANG = [_o(30, 30), _o(31, 30)]
COC_RAO = _o(17, 27)
HOA = [_o(28, 25), _o(29, 25), _o(30, 25), _o(28, 26), _o(29, 26)]
NAM = [_o(29, 29), _o(30, 29)]

# ==== Bo cuc ====
DUONG_DOC = (14, 15)            # loi di chinh chay tu cong len
DUONG_NGANG = (11, 12)          # loi di ngang chia ruong voi khu chuong
AO = (22, 3, 27, 6)             # ao ca: x0, y0, x1, y1 (bao gom hai dau)
CONG = (DUONG_DOC[0], H - 1)    # cong xuong Khu Dan Cu

# Nguoi lam viec tren nong trai
BAC_NONG = (12, 13)             # ban hat giong + co kho, mua lai nong san
BANG_DON = (17, 13)             # bang don hang cua dan lang
LAI_CA = (21, 5)                # ong lai ca ngoi canh ao
QUAN_CA = (16, 2, 5, 4)         # quan ca ben bo ao: x, y, rong, cao (o)

# Vung ke duoc vat the nong trai (x0, y0, x1, y1) — tru duong di va ao ra.
# Ghi ra js de man trang tri biet ke toi dau thi dung.
VUNG = (2, 2, W - 3, H - 3)

# Bo cuc mac dinh cua mot nong trai moi: bay o ruong ke thanh hai luong, mot
# chuong ga. Nguoi choi doi lai duoc het, day chi la cho khoi bo ngo.
MAC_DINH = [
    ('ruong', 3, 3), ('ruong', 4, 3), ('ruong', 5, 3), ('ruong', 6, 3),
    ('ruong', 3, 4), ('ruong', 4, 4), ('ruong', 5, 4), ('ruong', 6, 4),
    ('ruong', 3, 5), ('ruong', 4, 5), ('ruong', 5, 5), ('ruong', 6, 5),
    ('chuong_ga', 4, 15),
]


def _rng(x, y, n):
    h = (x * 73856093) ^ (y * 19349663) ^ 0x9E3779B9
    h = (h ^ (h >> 13)) * 1274126177 & 0xFFFFFFFF
    return (h >> 7) % n


def dung(root, tsx_cache, load_tsx):
    """Tra ve mot dict giong het parse_map() de dung chung duong ong."""
    tsdir = os.path.join(root, 'mods/tuxemon/gfx/tilesets')
    ngoai = load_tsx(os.path.join(tsdir, 'core_outdoor.tsx'), tsx_cache)
    nuoc_ts = load_tsx(os.path.join(tsdir, 'core_outdoor_water.tsx'), tsx_cache)
    if not ngoai or not nuoc_ts:
        raise SystemExit('Thiếu core_outdoor.tsx hoặc core_outdoor_water.tsx')
    g0 = 1
    g1 = 1 + ngoai['count']
    sets = [(g0, ngoai), (g1, nuoc_ts)]
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
    for x in DUONG_DOC:
        for y in range(H):
            dat_nen(x, y, DA)
    for y in DUONG_NGANG:
        for x in range(2, W - 2):
            dat_nen(x, y, DA)

    # --- san dat quanh cho lam viec (bac nong, bang don) ---
    for cx, cy in (BAC_NONG, BANG_DON):
        for y in range(cy - 1, cy + 2):
            for x in range(cx - 1, cx + 2):
                if 0 <= x < W and 0 <= y < H:
                    dat_nen(x, y, DAT)

    # --- ao ca + bo cat ---
    ax0, ay0, ax1, ay1 = AO
    for y in range(ay0 - 1, ay1 + 2):
        for x in range(ax0 - 1, ax1 + 2):
            if x in (ax0 - 1, ax1 + 1) and y in (ay0 - 1, ay1 + 1):
                continue                          # bo bon goc cho bot vuong
            if 0 <= x < W and 0 <= y < H:
                dat_nen(x, y, CAT)
    for y in range(ay0, ay1 + 1):
        for x in range(ax0, ax1 + 1):
            nen[idx(x, y)] = g1 + O_NUOC
            water[idx(x, y)] = 1
            solid[idx(x, y)] = 1

    # --- vien cay quanh ban do ---
    def trong_thong_to(x, y):
        for dy, hang in enumerate(THONG_TO):
            for dx, o in enumerate(hang):
                if x + dx < W and y + dy < H:
                    dat_tren(x + dx, y + dy, o)

    cap = []
    for x in range(W):
        cap += [(x, 0), (x, H - 2)]
    for y in range(2, H - 2, 2):
        cap += [(0, y), (1, y), (W - 2, y), (W - 1, y)]
    for x, y in cap:
        if x in DUONG_DOC and y >= H - 2:
            continue                              # chua cong xuong khu dan cu
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
    for x, y in ((4, 0), (20, 0)):
        trong_thong_to(x, y)

    # --- hang coc rao vien lay khu ruong, cho ra dang nong trai ---
    # Coc rao khong chan duong: no nam trong vung ke vat the.
    for x in range(2, 8):
        dat_tren(x, 2, COC_RAO, chan=False)

    # --- trang tri cho con lai ---
    def trong(x, y):
        return (nen[idx(x, y)] in [g0 + o for o in CO]
                and not tren[idx(x, y)] and not solid[idx(x, y)])

    for y in range(2, H - 2):
        for x in range(2, W - 2):
            if not trong(x, y):
                continue
            # Trong long nong trai KHONG dat gi chan duong: cho nao cung phai
            # ke duoc ruong voi chuong, khong thi nguoi choi bay bo cuc ra roi
            # moi phat hien co mot buoi cay vo hinh nam giua.
            r = _rng(x + 5, y + 3, 100)
            if r < 7:
                dat_tren(x, y, HOA[_rng(x, y, len(HOA))], chan=False)
            elif r < 9:
                dat_tren(x, y, NAM[_rng(y, x, len(NAM))], chan=False)

    # --- don sach nhung o BAT BUOC phai di duoc ---
    def don(x, y):
        # Mat nuoc thi KHONG don: ao nam ngay canh cho ong lai ca dung, don
        # bua la thung mot o cho loi thang xuong nuoc.
        if 0 <= x < W and 0 <= y < H and not water[idx(x, y)]:
            tren[idx(x, y)] = 0
            solid[idx(x, y)] = 0

    for x in DUONG_DOC:
        for y in range(H):
            don(x, y)
    for y in DUONG_NGANG:
        for x in range(2, W - 2):
            don(x, y)
    for cho in (BAC_NONG, BANG_DON, LAI_CA):
        don(cho[0], cho[1])
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            don(cho[0] + dx, cho[1] + dy)

    # --- quan ca ben bo ao ---
    # Anh quan la mot tep rieng (assets/ca/quan.png, cat tu pack Cozy Fishing)
    # chu khong phai o tileset, nen o day chi danh dau CHAN DUONG; phan ve nam
    # ben js/ui/world.js. Hang ngay duoi quan phai di duoc de con dung ma ngam.
    qx, qy, qw, qh = QUAN_CA
    for y in range(qy, qy + qh):
        for x in range(qx, qx + qw):
            if 0 <= x < W and 0 <= y < H:
                tren[idx(x, y)] = 0
                solid[idx(x, y)] = 1
    for x in range(qx, qx + qw):
        don(x, qy + qh)

    npcs = [
        {'x': BAC_NONG[0], 'y': BAC_NONG[1], 'dir': 'down', 'sprite': 'picnicker',
         'name': 'Bác Nông', 'ai': 'stand', 'mo': 'nongtrai', 'tab': 'cho',
         'lines': ['Hạt giống, cỏ khô, nông sản — bác mua bán hết.']},
        {'x': BANG_DON[0], 'y': BANG_DON[1], 'dir': 'down', 'sprite': 'lady',
         'name': 'Chị Thu Mua', 'ai': 'stand', 'mo': 'nongtrai', 'tab': 'don',
         'lines': ['Dân làng đang cần mấy thứ này. Gom đủ thì mang lại cho chị.']},
        {'x': LAI_CA[0], 'y': LAI_CA[1], 'dir': 'right', 'sprite': 'beachcomber',
         'name': 'Ông Lái Cá', 'ai': 'stand', 'mo': 'cauca',
         'lines': ['Ao này cá hiền, hợp người mới tập câu. Câu được thì bán cho tôi.']},
        {'x': 8, 'y': 16, 'dir': 'down', 'sprite': 'homemaker', 'name': 'Cô Sáu',
         'ai': 'wander',
         'lines': ['Cây nào cũng phải tưới. Không tưới thì đứng đó cả ngày chẳng lớn.']},
        {'x': 24, 'y': 16, 'dir': 'left', 'sprite': 'childactor', 'name': 'Bé Na',
         'ai': 'wander', 'lines': ['Cháu thích nhất là lúc gà đẻ trứng!']},
    ]
    npcs = [n for n in npcs if not solid[idx(n['x'], n['y'])]]

    # O CAM ke do: loi di, mat nuoc, cho ba nguoi lam viec dung va o ngay truoc
    # mat ho. Ke ruong de len duong thi di khong lot, ma ke de len NPC thi bam A
    # ra cau thoai chu khong ra ruong — NPC an truoc vat the.
    cam = set()
    for x in DUONG_DOC:
        for y in range(H):
            cam.add((x, y))
    for y in DUONG_NGANG:
        for x in range(W):
            cam.add((x, y))
    for y in range(H):
        for x in range(W):
            if water[idx(x, y)] or solid[idx(x, y)]:
                cam.add((x, y))
    for cx, cy in (BAC_NONG, BANG_DON, LAI_CA):
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                cam.add((cx + dx, cy + dy))
    for y in range(QUAN_CA[1], QUAN_CA[1] + QUAN_CA[3] + 1):
        for x in range(QUAN_CA[0], QUAN_CA[0] + QUAN_CA[2]):
            cam.add((x, y))

    talks = [
        {'x': DUONG_DOC[1] + 1, 'y': H - 3, 'name': 'Bảng Nông Trại',
         'text': 'NÔNG TRẠI BỜ SUỐI — cày cấy, nuôi thú, nhận đơn của dân làng.'},
        {'x': BAC_NONG[0], 'y': BAC_NONG[1] - 1, 'name': 'Biển Nhà Kho',
         'text': 'Chỗ bác Nông — bán hạt giống với cỏ khô, thu mua nông sản.'},
        {'x': BANG_DON[0], 'y': BANG_DON[1] - 1, 'name': 'Bảng Đơn Hàng',
         'text': 'Dân làng dán đơn ở đây. Giao đủ hàng thì nhận tiền.'},
    ]
    talks = [t for t in talks if not solid[idx(t['x'], t['y'])]]

    viet_js(cam)

    return {
        'w': W, 'h': H, 'sets': sets, 'layers': [nen, tren], 'above': None,
        'solid': solid, 'water': water, 'warps': [], 'talks': talks,
        'trades': [], 'encs': [], 'items': [],
        'music': 'town', 'env': 'grass', 'envNight': 'night_grass',
        'npcs': npcs,
    }


def viet_js(cam=()):
    """Ghi js/data/nongtraimap.js — toa do de ben engine dung lai."""
    out = [
        '// TuxeWorld H5 | data/nongtraimap.js | TỰ SINH TỪ tools/nongtrai.py, đừng sửa tay',
        '// Toạ độ trên bản đồ nông trại, sinh cùng lúc với chính bản đồ nên không',
        '// bao giờ lệch khỏi nền đất đã kẻ sẵn.',
        '',
        'export const NONG_TRAI_MAP = "%s";' % SLUG,
        'export const CONG_RA = { x: %d, y: %d };' % CONG,
        'export const BAC_NONG = { x: %d, y: %d };' % BAC_NONG,
        'export const BANG_DON = { x: %d, y: %d };' % BANG_DON,
        'export const AO_CA = { x0: %d, y0: %d, x1: %d, y1: %d };' % AO,
        '// Quán cá bên bờ ao. Ảnh nằm ở assets/ca/quan.png (cắt từ pack Cozy',
        '// Fishing) chứ không ở tileset, nên bản đồ chỉ đánh dấu chặn đường,',
        '// còn phần vẽ do js/ui/world.js lo.',
        'export const QUAN_CA = { x: %d, y: %d, w: %d, h: %d };' % QUAN_CA,
        '',
        '// Vùng kê được vật thể nông trại — ngoài vùng này là đường đi, ao, viền cây.',
        'export const VUNG = { x0: %d, y0: %d, x1: %d, y1: %d };' % VUNG,
        '',
        '// Bố cục mặc định của nông trại mới. Người chơi đổi lại được hết.',
        'export const MAC_DINH = [',
    ]
    for ma, x, y in MAC_DINH:
        out.append('  { id: "%s", x: %d, y: %d },' % (ma, x, y))
    trong_vung = sorted((x, y) for x, y in cam
                        if VUNG[0] <= x <= VUNG[2] and VUNG[1] <= y <= VUNG[3])
    out += [
        '];',
        '',
        '// Ô KHÔNG kê được dù nằm trong vùng: lối đi, mặt nước, chỗ người làm',
        '// việc đứng. Kê ruộng đè lên đường thì đi không lọt, mà kê đè lên NPC',
        '// thì bấm A ra câu thoại chứ không ra ruộng.',
        'export const CAM = new Set(%s);'
        % ('[' + ', '.join('"%d,%d"' % (x, y) for x, y in trong_vung) + ']'),
        '',
    ]
    with open('js/data/nongtraimap.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(out) + '\n')


def them_vao(out_maps, root, tsx_cache, load_tsx, kdc_slug, kdc_cong):
    """Dung ban do, noi cong hai chieu voi Khu Dan Cu, ghi tep toa do."""
    kdc = out_maps.get(kdc_slug)
    if not kdc:
        print('BỎ QUA nông trại: chưa có bản đồ %s' % kdc_slug)
        return None
    m = dung(root, tsx_cache, load_tsx)
    cx, cy = CONG
    kx, ky = kdc_cong
    m['warps'] = [{'x': cx, 'y': cy, 'to': kdc_slug, 'tx': kx, 'ty': ky + 1},
                  {'x': cx + 1, 'y': cy, 'to': kdc_slug, 'tx': kx, 'ty': ky + 1}]
    kdc['warps'].append({'x': kx, 'y': ky, 'to': SLUG, 'tx': cx, 'ty': cy - 1})
    kdc['warps'].append({'x': kx + 1, 'y': ky, 'to': SLUG, 'tx': cx, 'ty': cy - 1})
    return m
