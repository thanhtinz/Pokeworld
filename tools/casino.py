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

NGUOI TRONG SANH
Sprite nhan vat lay tu "2D Top Down Pixel Art Characters" — cung tac gia
Jephed, cung giay phep mien phi. Sheet cua ho la 64x128 nhung 4 cot cuoi bo
trong: noi dung that la 3 cot x 4 hang, o 20x32, hang xep xuong/trai/phai/len
— TRUNG KHIT thu tu cua assets/ow nen khong phai xao lai khung nao.

NHUNG PHAI DEM THEM KHOANG TRONG TREN DAU.
Man ban do ve moi sprite cao dung 2 o, nen "nguoi cao bao nhieu" la do THAN
CHIEM MAY PHAN CUA KHUNG quyet dinh. Do ra:
    NPC cu (Tuxemon)   than chiem 0.625 khung -> cao 1.25 o   <- CHUAN
    bo nay cat nguyen  than chiem 0.969 khung -> cao 1.94 o   <- to loi ra
Nen dem them hang trong len TREN dau (chan van cham day khung) cho ti le
than/khung ve 0.625: khung cao 32 -> KHUNG_CAO. Nhan vat nguoi choi cung duoc
dem tuong tu ben tools/mklpc.py.

Ghi ra:
  js/data/casino.js   toa do tung may/ban de engine biet cho nao bam duoc
  assets/ow/bac_*.png sprite may nguoi lam trong sanh
"""
import os
import shutil

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
# Khung cua tung mon do SOI TAN TILESET moi ghi, khong uoc chung: lan dau lay
# ban xanh o hang 6 va 11 — lech len 1-2 hang, vo phai may cai ghe sofa nam
# ngay tren mat ban, nen trong game ban bi cut con ghe thi lo lung.
MAY_QUAY = (49, 1, 1, 3)         # may quay, man hinh mau
MAY_WIN = (51, 1, 1, 3)          # may quay, bang "WIN"
BAN_XANH = (57, 8, 7, 4)         # ban da, vong quay ben PHAI
BAN_XANH2 = (57, 12, 7, 4)       # ban da, vong quay ben TRAI
BAN_TRON = (59, 4, 3, 4)         # ban go tron

# ---- Nguoi trong sanh ----
# (ma tep nguon, ten trong game, ma sprite, x, y, huong, ai, loi thoai)
NGUOI = [
    ('021', 'Anh Chia Bài', 'bac_chia1', 5, 7, 'down', 'stand',
     'Xì dách nhé? Rút tới 21 thôi, quá là mất.'),
    ('017', 'Chị Chia Bài', 'bac_chia2', 20, 7, 'down', 'stand',
     'Bàn tiến lên bên này. Ba nhà kia đánh rát lắm đấy.'),
    ('019', 'Chú Chia Bài', 'bac_chia3', 8, 14, 'left', 'stand',
     'Đô-mi-nô đi cho thư thả. Nối được thì nối, tắc thì bốc.'),
    ('006', 'Bảo Vệ Sảnh', 'bac_gac1', 12, 17, 'up', 'watch',
     'Vào chơi thoải mái. Thua sạch rồi thì đừng làm ầm lên.'),
    ('007', 'Bảo Vệ Cửa', 'bac_gac2', 14, 17, 'up', 'watch',
     'Cửa ra ngay sau lưng tôi. Đi về sớm còn hơn nướng hết.'),
    ('015', 'Cô Lao Công', 'bac_lau', 11, 13, 'down', 'wander',
     'Quét cả ngày. Người ta rơi chip xuống thảm suốt.'),
    ('012', 'Khách Quen', 'bac_khach1', 10, 6, 'down', 'wander',
     'Máy đầu dãy hôm nay nóng lắm, tôi ăn hai lần rồi!'),
    ('026', 'Khách Áo Choàng', 'bac_khach2', 23, 7, 'down', 'stand',
     'Cược nhỏ thôi. Nhà cái nuôi mình chứ mình có nuôi được nó đâu.'),
    ('009', 'Khách Mới', 'bac_khach3', 16, 14, 'left', 'wander',
     'Mới vào lần đầu. Chơi cái nào dễ ăn nhất vậy anh?'),
]

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
    ('domino', 'Đô-mi-nô', BAN_TRON, 4, 13),
]


# Lay NPC cua Tuxemon lam chuan: than chiem 20/32 = 0.625 khung -> cao 1.25 o.
# Than bo nay cao 31 dong, muon dat 0.625 thi khung phai cao 31/0.625 ~ 50.
O_RONG, O_CAO_GOC = 20, 32
KHUNG_CAO = 50


def cat_nguoi(goc):
    """Cat sprite nguoi tu pack ve assets/ow. Tra so tep da ghi."""
    from PIL import Image
    nguon = None
    for dp, _, fs in os.walk(goc):
        if '000.png' in fs and '021.png' in fs:
            nguon = dp
            break
    if not nguon:
        return 0
    ra = 0
    for ma, _, sprite, *_ in NGUOI:
        f = os.path.join(nguon, ma + '.png')
        if not os.path.exists(f):
            continue
        im = Image.open(f).convert('RGBA')
        # 3 cot x 4 hang, o 20x32 (bo 4 cot trong ben phai cua sheet 64px)
        out = Image.new('RGBA', (O_RONG * 3, KHUNG_CAO * 4), (0, 0, 0, 0))
        dem = KHUNG_CAO - O_CAO_GOC          # so hang trong dem len tren dau
        for hang in range(4):
            for cot in range(3):
                o = im.crop((cot * O_RONG, hang * O_CAO_GOC,
                             (cot + 1) * O_RONG, (hang + 1) * O_CAO_GOC))
                out.paste(o, (cot * O_RONG, hang * KHUNG_CAO + dem))
        out.save('assets/ow/%s.png' % sprite, optimize=True)
        ra += 1
    return ra


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
    nguoi_ra = []
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
    # ---- Nguoi lam trong sanh ----
    # O ngay TRUOC may la cho nguoi choi dung de bam. Cho NPC dung vao do la
    # bam may khong duoc nua (facingThing bat trung NPC chu khong trung may).
    cho_bam = set()
    for d in diem:
        for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            cho_bam.add((d['x'] + dx, d['y'] + dy))
    for _, ten, sprite, nx, ny, huong, ai, loi in NGUOI:
        if not (0 <= nx < W and 0 <= ny < H) or solid[i(nx, ny)]:
            print('  BO QUA NPC %s: o (%d,%d) khong dung duoc' % (ten, nx, ny))
            continue
        if (nx, ny) in cho_bam:
            print('  BO QUA NPC %s: (%d,%d) la cho dung de bam may' % (ten, nx, ny))
            continue
        m_npc = {'x': nx, 'y': ny, 'dir': huong, 'sprite': sprite,
                 'name': ten, 'lines': [loi], 'ai': ai}
        nguoi_ra.append(m_npc)

    # Cong ra o ngay o cua
    m['warps'].append({'x': CUA, 'y': H - 1, 'to': 'khu_dan_cu', 'tx': 16, 'ty': 13})
    m['npcs'] = nguoi_ra
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
    n = cat_nguoi(os.path.join(goc, 'nhanvat'))
    viet_js(diem)
    print('OK: sảnh bạc %dx%d, %d ô bấm được, %d người (%d sprite)'
          % (W, H, len(diem), len(m['npcs']), n))
    return {SLUG: m}
