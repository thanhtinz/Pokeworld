# -*- coding: utf-8 -*-
"""Dung KHU DAN CU — ban do rieng cua TuxeWorld de mua dat xay nha.

Truoc day sau lo dat nam nho o goc bac Thi Tran Taba: van la co cua thi tran,
khong co duong vao, khong phan biet dau la dat o dau la dong co. Tep nay sinh
han mot ban do moi, ghep tu tileset ngoai troi cua Tuxemon (CC BY-SA 4.0),
trong do dia hinh phan biet ro:

  - ngo dat nen     : loi di chinh, di duoc
  - san lo + loi vao: sau lo dat de xay nha, cung chat nen voi ngo, di duoc
  - bai co xanh     : phan con lai, di duoc
  - ho nuoc + bo cat: khong di duoc (nuoc thi engine tu chan)
  - vien cay + da   : hang rao tu nhien quanh ban do, khong di duoc

NEN LAY TU PACK "Cozy Farm" (tools/cozytile.py), khong dung tileset Tuxemon
nua: nong trai ngay sau nha da dung bo do, ma nha cua nguoi choi voi nhan vat
cung deu tu pack khac — de bai co Tuxemon o day thi chinh no la thu lech ra.

Khong doc TMX nao ca — ban do nay do minh tu dat tung o, roi day qua dung mot
duong ong (build_atlas / write_js) voi cac ban do lay tu ban goc.

Goi tu tools/mktmx.py, dung chay truc tiep.
"""
import os

W, H = 32, 26
SLUG = 'khu_dan_cu'
TEN = 'Khu Dân Cư Taba'

# ==== O tile lay tu pack Cozy Farm (xem tools/cozytile.py) ====
import cozytile as CT
from cozytile import _o, o_vien, rng as _rng

CO = CT.CO                                       # co day
# San tung lo lat bang DAT NEN, DUNG cai o dat nau sam CT.DAT: o do la o luong
# ruong ngoai nong trai, lat vao san nha thi nhin nhu can nha moc giua ruong.
# Dat nen cung la o lat ngo — san truoc nha noi lien ra ngo, dung the.
CAT = CT.CAT                                     # dat nen — lat ngo va san nha
BUI, HOA, DA_TANG = CT.BUI, CT.HOA, CT.DA_TANG

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
DUONG_DOC = (9, 10)             # hai cot duong da chay suot tu bac xuong nam
CONG = (DUONG_DOC[0], H - 1)    # cong ra thi tran, o canh duoi
# Truoc day day la cong bo len Nong Trai. Bo roi: nong trai la SAN SAU cua
# can nha nguoi choi, vao bang cua sau trong nha chu khong phai bang duong
# cong cong. Van giu con duong da chay len phia bac cho khu do khoi cut ngang.
CONG_BAC = (DUONG_DOC[0], 0)



def dung(goc):
    """Tra ve mot dict giong het parse_map() de dung chung duong ong."""
    if not CT.co_pack(goc):
        raise SystemExit('Khong thay %s trong %s' % (CT.TEP_TILE, goc))
    g0 = 1

    nen = [0] * (W * H)
    tren = [0] * (W * H)
    solid = [0] * (W * H)
    water = [0] * (W * H)

    def idx(x, y):
        return y * W + x

    def trong_ban_do(x, y):
        return 0 <= x < W and 0 <= y < H

    def dat_nen(x, y, o):
        nen[idx(x, y)] = g0 + o

    def dat_tren(x, y, o, chan=True):
        tren[idx(x, y)] = g0 + o
        if chan:
            solid[idx(x, y)] = 1

    # ==== Vung dia hinh ====
    def la_duong(x, y):
        if not trong_ban_do(x, y):
            return False
        if x in DUONG_DOC:
            return True
        return y in DUONG_NGANG and 2 <= x < W - 2

    def la_lo(x, y):
        """San dat = DUNG vung 3x3 cua lo, khong rong hon.

        Truoc san rong 5x5 con rao vay o vong 3x3+1 — thanh ra rao nam de len
        mep san, con dat thi loi ra ca mot vong ben ngoai rao. Thu san ve dung
        o lo thi vong rao roi vao dai chuyen tiep co-dat, tuc la nam NGOAI san.
        """
        for _id, _ten, _gia, lx, ly in LO:
            if lx <= x <= lx + 2 and ly <= y <= ly + 2:
                return True
        return False

    def la_loi(x, y):
        """Hai o lat truoc cong moi lo, dan tu cong vao cua nha."""
        return any(x == lx + 1 and (y == ly + 3 or y == ly + 4)
                   for _id, _ten, _gia, lx, ly in LO)

    def la_san(x, y):
        return la_duong(x, y) or la_lo(x, y) or la_loi(x, y)

    # ==== Nen ====
    # Ngo, san lo va loi vao deu chung mot chat nen, nen chi mot dai autotile:
    # cho nao giap co thi lay o vien cua dai do.
    for y in range(H):
        for x in range(W):
            dat_nen(x, y, CAT if la_san(x, y) else CO)

    for y in range(H):
        for x in range(W):
            if la_san(x, y):
                continue
            o = o_vien(la_san, x, y, CT.DAI_CAT)
            if o is not None:
                dat_nen(x, y, o)

    # ==== Hang rao quanh tung lo ====
    # Rao chi de NHIN — khong chan duong, khong thi buoc vao lo cua minh
    # khong noi. Hai canh ngang o tren va duoi, hai coc o hai ben.
    dau, than, duoi = CT.RAO_NGANG
    for _id, _ten, _gia, lx, ly in LO:
        cong = (lx + 1, ly + 3)                   # chua mot o lam loi vao cua
        for hang in (ly - 1, ly + 3):
            for i2, x in enumerate(range(lx - 1, lx + 4)):
                if not trong_ban_do(x, hang) or (x, hang) == cong:
                    continue
                o = dau if i2 == 0 else (duoi if i2 == 4 else than)
                dat_tren(x, hang, o, chan=False)
        for y in range(ly, ly + 3):
            for x in (lx - 1, lx + 3):
                if trong_ban_do(x, y):
                    dat_tren(x, y, CT.RAO_DOC, chan=False)

    # ==== Cay coi quanh ria ====
    o_cay = set()

    def trong_cay(x, y, kieu):
        for dy in range(4):
            for dx in range(2):
                if not trong_ban_do(x + dx, y + dy):
                    continue
                dat_tren(x + dx, y + dy, CT.o_cay(kieu, dx, dy), chan=(dy >= 2))
                o_cay.add((x + dx, y + dy))

    def cho_trong_cay(x, y):
        het = True
        for dy in range(4):
            for dx in range(2):
                if not trong_ban_do(x + dx, y + dy):
                    continue
                het = False
                if la_san(x + dx, y + dy):
                    return False
                if tren[idx(x + dx, y + dy)]:
                    return False
        return not het

    # Hang tren trong tu y = -1: cay cao 4 o, trong tu y = 0 thi than cay cham
    # xuong tan hang 3, ma hang 7 da la san lo dat roi.
    ria = []
    for x in range(0, W, 2):
        ria += [(x, -1), (x, H - 4)]
    for y in range(3, H - 4, 4):
        ria += [(0, y), (W - 2, y)]
    for x, y in ria:
        if x in DUONG_DOC or x + 1 in DUONG_DOC:
            continue                              # chua ngo doc
        if cho_trong_cay(x, y):
            trong_cay(x, y, CT.kieu_cay(x, y))

    # ==== Ghe da doc ngo ====
    for gx, gy in ((6, 15), (19, 15)):
        for dx, (c0, r0) in enumerate([CT.GHE[0]]):
            for i2 in range(2):
                if trong_ban_do(gx + i2, gy) and not tren[idx(gx + i2, gy)]:
                    dat_tren(gx + i2, gy, _o(c0 + i2, r0), chan=False)

    # ==== Bui, hoa, da rai cho con lai ====
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            if (la_san(x, y)
                    or tren[idx(x, y)] or solid[idx(x, y)]):
                continue
            r = _rng(x + 7, y + 11, 100)
            if r < 5:
                dat_tren(x, y, HOA[_rng(x, y, len(HOA))], chan=False)
            elif r < 7:
                dat_tren(x, y, BUI[_rng(y, x, len(BUI))], chan=False)
            elif r == 7:
                dat_tren(x, y, DA_TANG[_rng(y + 1, x, len(DA_TANG))], chan=False)

    # ==== Don sach nhung o BAT BUOC phai di duoc ====
    def don(x, y):
        if trong_ban_do(x, y):
            tren[idx(x, y)] = 0
            solid[idx(x, y)] = 0

    for y in DUONG_NGANG:
        for x in range(2, W - 2):
            don(x, y)
    for x in DUONG_DOC:
        for y in range(H):
            don(x, y)
    for _id, _ten, _gia, lx, ly in LO:
        for y in range(ly, ly + 3):
            for x in range(lx, lx + 3):
                don(x, y)
        don(lx + 1, ly + 3)                       # loi vao cua truoc nha
        don(lx + 1, ly + 4)

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
         'lines': ['Đi hết ngõ này là ra lại thị trấn. Ngược lên phía bắc thì ra nông trại.'],
         'ai': 'wander'},
    ]
    npcs = [n for n in npcs if not solid[idx(n['x'], n['y'])]]

    talks = [
        {'x': DUONG_DOC[0], 'y': H - 3, 'name': 'Bảng Khu Dân Cư',
         'text': 'KHU DÂN CƯ TABA — đất nền đã chia lô, mời bà con vào xem.'},
        {'x': DUONG_DOC[1] + 1, 'y': 15, 'name': 'Biển Chỉ Đường',
         'text': 'Nông trại nằm sau nhà bạn — vào nhà rồi bước ra cửa sau. '
                 'Chợ búa hàng quán thì ra Phố Kim Long.'},
    ]
    talks = [t for t in talks if not solid[idx(t['x'], t['y'])]]

    return {
        'w': W, 'h': H, 'sets': CT.tile_set(goc, g0), 'layers': [nen, tren],
        'above': None, 'solid': solid, 'water': water, 'warps': [], 'talks': talks,
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


def viet_js(lo, duong, cong_bac):
    """Ghi js/data/khudancu.js — toa do de ben engine dung lai."""
    out = ['// TuxeWorld H5 | data/khudancu.js | TỰ SINH TỪ tools/khudancu.py, đừng sửa tay',
           '// Toạ độ các lô đất trong bản đồ khu dân cư, sinh cùng lúc với bản đồ nên',
           '// không bao giờ lệch khỏi nền đất đã kẻ sẵn.',
           '//',
           '// Khu này là ĐẤT Ở THUẦN TUÝ: không hàng quán, không hồ câu. Tiệm xá',
           '// dời hết ra Phố Kim Long, hồ câu dời lên Nông Trại — trước gom chung',
           '// một chỗ nên đi mua đất mà cứ lẫn vào chợ búa.',
           '',
           'export const KHU_DAT_MAP = "%s";' % SLUG,
           'export const LOTS = [']
    for _id, ten, gia, x, y in lo:
        out.append('  { id: "%s", name: "%s", price: %d, x: %d, y: %d },'
                   % (_id, ten, gia, x, y))
    out += [
        '];',
        '// Ô cổng ra thị trấn — dùng để chỉ đường cho người chơi',
        'export const CONG_RA = { x: %d, y: %d };' % duong,
        '// Ô cổng lên Nông Trại, ở cạnh trên bản đồ',
        'export const CONG_BAC = { x: %d, y: %d };' % cong_bac,
        '',
    ]
    with open('js/data/khudancu.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(out) + '\n')


def them_vao(out_maps, goc):
    """Dung ban do, noi cong hai chieu voi Thi Tran Taba, ghi tep toa do."""
    taba = out_maps.get('taba_town')
    if not taba:
        print('BO QUA khu dan cu: chua co ban do taba_town')
        return None
    cho = cho_cong_ve_taba(taba)
    if not cho:
        print('BO QUA khu dan cu: khong tim duoc cho dat cong o Taba')
        return None
    tx, ty = cho
    m = dung(goc)
    cx, cy = CONG
    # Di xuong het ngo la ve thi tran; buoc vao cong o thi tran la len dau ngo
    m['warps'] = [{'x': cx, 'y': cy, 'to': 'taba_town', 'tx': tx, 'ty': ty + 1},
                  {'x': cx + 1, 'y': cy, 'to': 'taba_town', 'tx': tx, 'ty': ty + 1}]
    taba['warps'].append({'x': tx, 'y': ty, 'to': SLUG, 'tx': cx, 'ty': cy - 1})
    if ty > 0 and not taba['solid'][(ty - 1) * taba['w'] + tx]:
        taba['talks'].append({'x': tx, 'y': ty - 1, 'name': 'Biển Chỉ Đường',
                              'text': 'Khu Dân Cư Taba — đất nền chia lô, đi hướng này.'})
    viet_js(LO, CONG, CONG_BAC)
    return m
