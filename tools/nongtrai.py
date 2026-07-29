# -*- coding: utf-8 -*-
"""Dung NONG TRAI — MOT DAI NGANG, bon khu xep canh nhau.

Ban do la mot dai ngang: mot loi di duy nhat chay suot tu tay sang dong, bon
khu nam ke tren dai do, thu tu tu trai qua phai:

    nha nguoi choi | ruong trong cay | chuong thu | ho ca | nha kho

Nong trai la SAN SAU can nha: buoc ra cua sau la dung ngay dau dai, ro roi
mot huong di. Ban truoc lam nga tu, loi di toe ra bon phia va moi khu nam mot
goc — di tim viec mat cong quay dau, ma nhin thi khong bao quat duoc gi.

NEN LAY TU CHINH PACK "Cozy Farm" (tools/cozytile.py), khong dung tileset
Tuxemon: cay coi, con vat, nha cua tren nong trai von da la cua pack.

Ban do nay chi lo DIA HINH: co, loi di, ho ca, vien cay. Con ruong, chuong,
may moc deu la VAT THE do nguoi choi tu ke (xem js/engine/nongtrai.js).

Vat the nong trai KHONG chan duong, giong het can nha ben Khu Dan Cu: di xuyen
qua duoc, dung truoc mat bam A la lam viec. Lam vat the chan duong thi ke kin
ruong xong la tu nhot minh o giua.

Goi tu tools/mktmx.py, dung chay truc tiep.
"""
import os

W, H = 30, 16
SLUG = 'nong_trai'
TEN = 'Nông Trại Bờ Suối'

import cozytile as CT
from cozytile import _o, o_vien, rng as _rng

TEP_TILE = CT.TEP_TILE
CO, CAT, DAT, NUOC = CT.CO, CT.CAT, CT.DAT, CT.NUOC
DAI_CAT, DAI_DAT, DAI_NUOC = CT.DAI_CAT, CT.DAI_DAT, CT.DAI_NUOC
BUI, HOA, DA_TANG = CT.BUI, CT.HOA, CT.DA_TANG

# ==== Bo cuc ====
# DUY NHAT mot dai loi di, chay ngang suot ban do. Moi khu deu ap ngay tren dai
# do nen dung o dau cung thay het, khong phai vong ve nga tu.
DUONG_NGANG = (9, 10)
# Cho dat chan khi di nhanh vao nong trai — nam ngay tren loi di. Nong trai
# KHONG co cong bo cong cong nao: duong vao that la cua sau trong nha.
CONG = (14, DUONG_NGANG[1])

AO = (17, 4, 21, 8)             # ho ca: x0, y0, x1, y1 (bao gom hai dau)
NHA_KHO = (23, 4, 5, 5)         # nha kho: x, y, rong, cao (o)
BAC_NONG = (25, DUONG_NGANG[0])  # nguoi coi kho, dung ngay truoc cua
LAI_CA = (19, DUONG_NGANG[0])   # ong lai ca, dung ngay duoi bo ho

# Can nha cua nguoi choi o DAU DAI phia tay, quay mat xuong loi di. Vung 3x3
# giong het lo dat ben Khu Dan Cu, o cua nam giua hang duoi cung.
NHA_SAU = (2, 5)

# Vung ke duoc vat the nong trai (x0, y0, x1, y1) — tru vien cay ra.
VUNG = (2, 3, W - 3, 11)

# Bo cuc mac dinh cua mot nong trai moi: muoi hai o ruong, mot chuong ga.
MAC_DINH = [
    ('ruong', 6, 5), ('ruong', 7, 5), ('ruong', 8, 5), ('ruong', 9, 5),
    ('ruong', 6, 6), ('ruong', 7, 6), ('ruong', 8, 6), ('ruong', 9, 6),
    ('ruong', 6, 7), ('ruong', 7, 7), ('ruong', 8, 7), ('ruong', 9, 7),
    ('chuong_ga', 12, 4),
]


def dung(goc):
    """Xep ban do bang chinh tileset cua pack. `goc` = thu muc "full version"."""
    if not CT.co_pack(goc):
        raise SystemExit('Khong thay %s trong %s' % (TEP_TILE, goc))

    nen = [0] * (W * H)
    tren = [0] * (W * H)
    solid = [0] * (W * H)
    water = [0] * (W * H)
    g0 = 1

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
    ax0, ay0, ax1, ay1 = AO
    kx, ky, kw, kh = NHA_KHO

    def la_nuoc(x, y):
        return ax0 <= x <= ax1 and ay0 <= y <= ay1

    def la_duong(x, y):
        # Mot dai duy nhat: khong con nhanh doc nao ca.
        return trong_ban_do(x, y) and y in DUONG_NGANG

    def la_nha_kho(x, y):
        return kx <= x < kx + kw and ky <= y < ky + kh

    def la_san(x, y):
        """San dat nen truoc nha kho — chi lat cho nguoi coi kho dung."""
        if la_duong(x, y):
            return False
        return la_nha_kho(x, y) or (kx <= x < kx + kw and y == ky + kh)

    # ==== Nen ====
    # Thu tu quan trong: nuoc -> duong -> san, cai sau chi ve len o CON LA CO.
    for y in range(H):
        for x in range(W):
            if la_nuoc(x, y):
                nen[idx(x, y)] = g0 + NUOC
                water[idx(x, y)] = 1
                solid[idx(x, y)] = 1
            elif la_duong(x, y):
                dat_nen(x, y, CAT)
            elif la_san(x, y):
                dat_nen(x, y, CAT)
            else:
                dat_nen(x, y, CO)

    # Vien: o co nao dinh vung khac thi doi sang o vien cua dai tuong ung.
    # Loi di va san nha kho chung mot chat nen nen gop lam mot dai.
    def la_nen_cung(x, y):
        return la_duong(x, y) or la_san(x, y)

    for y in range(H):
        for x in range(W):
            if la_nuoc(x, y) or la_nen_cung(x, y):
                continue
            o = (o_vien(la_nuoc, x, y, DAI_NUOC)
                 or o_vien(la_nen_cung, x, y, DAI_CAT))
            if o is not None:
                dat_nen(x, y, o)

    # ==== Cay coi quanh ria ====
    o_cay = set()          # moi o cay chiem, ke ca tan la khong chan duong

    def trong_cay(x, y, kieu):
        """Cay 2 o rong x 4 o cao. Hai hang duoi la than — chan duong."""
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
                    continue          # ria tren cho cay tho ra ngoai ban do
                het = False
                if la_nuoc(x + dx, y + dy) or la_nen_cung(x + dx, y + dy):
                    return False
                if tren[idx(x + dx, y + dy)]:
                    return False
                # Chua cho nha nguoi choi, nha kho va cho bac Nong dung
                if (NHA_SAU[0] - 1 <= x + dx <= NHA_SAU[0] + 3
                        and NHA_SAU[1] - 1 <= y + dy <= NHA_SAU[1] + 4):
                    return False
                if (kx - 1 <= x + dx <= kx + kw
                        and ky - 1 <= y + dy <= ky + kh + 1):
                    return False
                # Chua luon bo cuc mac dinh cua nong trai moi
                for _ma, mx, my in MAC_DINH:
                    if mx <= x + dx <= mx + 5 and my <= y + dy <= my + 5:
                        return False
        return not het

    # Vien cay bao quanh, chua may o cong va loi di.
    # Hang tren trong tu y = -1: cay cao 4 o, trong tu y = 0 thi than cham
    # xuong tan hang 3 — dung ngay cho luong ruong mac dinh.
    ria = []
    for x in range(0, W, 2):
        ria += [(x, -1), (x, H - 4)]
    for y in range(4, H - 4, 4):
        ria += [(0, y), (W - 2, y)]
    for x, y in ria:
        if not cho_trong_cay(x, y):
            continue
        trong_cay(x, y, CT.kieu_cay(x, y))

    # ==== Bui, hoa, da rai trong long nong trai ====
    # KHONG chan duong: cho nao cung phai ke duoc ruong voi chuong, khong thi
    # nguoi choi bay bo cuc ra roi moi phat hien co mot buoi cay vo hinh.
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            if (la_nuoc(x, y) or la_nen_cung(x, y)
                    or tren[idx(x, y)] or solid[idx(x, y)]):
                continue
            r = _rng(x + 5, y + 3, 100)
            if r < 5:
                dat_tren(x, y, HOA[_rng(x, y, len(HOA))], chan=False)
            elif r < 7:
                dat_tren(x, y, BUI[_rng(y, x, len(BUI))], chan=False)
            elif r == 7:
                dat_tren(x, y, DA_TANG[_rng(y + 1, x, len(DA_TANG))], chan=False)

    # ==== Don sach nhung o BAT BUOC phai di duoc ====
    def don(x, y):
        # Mat nuoc thi KHONG don: bo ao nam ngay canh loi di, don bua la thung
        # mot o cho loi thang xuong nuoc.
        if trong_ban_do(x, y) and not water[idx(x, y)]:
            tren[idx(x, y)] = 0
            solid[idx(x, y)] = 0

    for y in DUONG_NGANG:
        for x in range(1, W - 1):
            don(x, y)
    for cho in (BAC_NONG, LAI_CA):
        don(cho[0], cho[1])
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            don(cho[0] + dx, cho[1] + dy)
    for y in range(NHA_SAU[1], NHA_SAU[1] + 4):
        for x in range(NHA_SAU[0], NHA_SAU[0] + 3):
            don(x, y)

    # ==== Nha kho ====
    # Anh nha kho la mot tep rieng (assets/nt/nha/nha_nong.png) chu khong o
    # tileset, nen o day chi danh dau CHAN DUONG; phan ve nam ben js/ui/world.js.
    # Hang ngay duoi phai di duoc de con dung ma bam A.
    for y in range(ky, ky + kh):
        for x in range(kx, kx + kw):
            if trong_ban_do(x, y):
                tren[idx(x, y)] = 0
                solid[idx(x, y)] = 1
    for x in range(kx, kx + kw):
        don(x, ky + kh)

    npcs = [
        {'x': BAC_NONG[0], 'y': BAC_NONG[1], 'dir': 'up', 'sprite': 'picnicker',
         'name': 'Bác Nông', 'ai': 'stand', 'mo': 'nongtrai', 'tab': 'cho',
         'lines': ['Hạt giống, cỏ khô, đơn hàng dân làng — trong kho bác có hết.']},
        # Ong lai ca KHONG mo panel: mua can, ban ca deu noi chuyen ngay tai day
        # (js/ui/world.js). Buong can thi ra bo nuoc bam A.
        {'x': LAI_CA[0], 'y': LAI_CA[1], 'dir': 'up', 'sprite': 'beachcomber',
         'name': 'Ông Lái Cá', 'ai': 'stand', 'laiCa': True,
         'lines': ['Hồ này cá hiền, hợp người mới tập câu. Câu được thì bán cho tôi.']},
    ]
    npcs = [n for n in npcs if not solid[idx(n['x'], n['y'])]]

    talks = [
        {'x': CONG[0] - 2, 'y': DUONG_NGANG[1] + 1, 'name': 'Bảng Nông Trại',
         'text': 'NÔNG TRẠI BỜ SUỐI — ruộng, hồ cá, chuồng thú, nhà kho.'},
    ]
    talks = [t for t in talks if not solid[idx(t['x'], t['y'])]]

    # O CAM ke do: loi di, mat nuoc, nha kho, cho bac Nong dung, nha nguoi choi.
    cam = set()
    for y in range(H):
        for x in range(W):
            if water[idx(x, y)] or solid[idx(x, y)] or la_nen_cung(x, y):
                cam.add((x, y))
    cam |= o_cay          # ke ca tan la: ke ruong duoi tan cay thi cay che mat
    for n in npcs:
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                cam.add((n['x'] + dx, n['y'] + dy))
    for y in range(ky, ky + kh + 1):
        for x in range(kx, kx + kw):
            cam.add((x, y))
    for y in range(NHA_SAU[1], NHA_SAU[1] + 4):
        for x in range(NHA_SAU[0], NHA_SAU[0] + 3):
            cam.add((x, y))

    viet_js(cam)

    return {
        'w': W, 'h': H, 'layers': [nen, tren], 'above': None,
        'sets': CT.tile_set(goc, g0),
        'solid': solid, 'water': water, 'warps': [], 'talks': talks,
        'trades': [], 'encs': [], 'items': [],
        'music': 'town', 'env': 'grass', 'envNight': 'night_grass',
        'npcs': npcs,
        'spawn': {'x': CONG[0], 'y': CONG[1] - 1},
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
        '// Nông trại là một DẢI NGANG: đúng một lối đi chạy suốt từ tây sang',
        '// đông, bốn khu kê ngay trên dải đó.',
        'export const LOI_NGANG = %s;' % list(DUONG_NGANG),
        '// Bác Nông đứng trước cửa nhà kho: chợ, đơn hàng và kho nông sản đều ở đó.',
        'export const BAC_NONG = { x: %d, y: %d };' % BAC_NONG,
        'export const AO_CA = { x0: %d, y0: %d, x1: %d, y1: %d };' % AO,
        '// Nhà kho. Ảnh nằm ở assets/nt/nha/nha_nong.png chứ không ở tileset,',
        '// nên bản đồ chỉ đánh dấu chặn đường, còn phần vẽ do js/ui/world.js lo.',
        'export const NHA_KHO = { x: %d, y: %d, w: %d, h: %d };' % NHA_KHO,
        '// Chỗ dựng nhà của người chơi trên nông trại — vùng 3x3 y hệt lô đất',
        '// bên Khu Dân Cư, ô cửa nằm giữa hàng dưới cùng. Nông trại là SÂN SAU',
        '// của căn nhà đó: bước ra cửa sau trong nhà là ra thẳng ngoài ruộng.',
        'export const NHA_SAU = { x: %d, y: %d };' % NHA_SAU,
        '',
        '// Vùng kê được vật thể nông trại — ngoài vùng này là lối đi, ao, viền cây.',
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
        '// Ô KHÔNG kê được dù nằm trong vùng: lối đi, mặt nước, nhà kho, chỗ người',
        '// làm việc đứng. Kê ruộng đè lên đường thì đi không lọt, mà kê đè lên NPC',
        '// thì bấm A ra câu thoại chứ không ra ruộng.',
        'export const CAM = new Set(%s);'
        % ('[' + ', '.join('"%d,%d"' % (x, y) for x, y in trong_vung) + ']'),
        '',
    ]
    with open('js/data/nongtraimap.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(out) + '\n')


def them_vao(out_maps, goc, kdc_slug):
    """Dung ban do nong trai. Khong noi cong bo voi Khu Dan Cu."""
    if not out_maps.get(kdc_slug):
        print('BO QUA nong trai: chua co ban do %s' % kdc_slug)
        return None
    if not CT.co_pack(goc):
        print('BO QUA nong trai: khong thay %s' % TEP_TILE)
        return None
    # KHONG cam cong bo sang Khu Dan Cu. Nong trai la SAN SAU cua can nha:
    # duong vao la cua sau trong nha minh (js/engine/estate.js cam luc buoc vao
    # nha), muon di nhanh thi mo trang Dia Diem.
    return dung(goc)
