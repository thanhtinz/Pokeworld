# -*- coding: utf-8 -*-
"""Dung NONG TRAI — MOT DAI NGANG, sau khu xep ke nhau tren cung mot loi di.

Thu tu tu tay sang dong:

    nha nguoi choi | khu dat trong | chuong thu | ho nuoi ca | nha kho | nha bep

Mot loi di duy nhat chay suot phia duoi, moi khu ap ngay tren no. Dung o loi di
quay mat len la bam duoc vao khu truoc mat — khong phai vong ve nga tu nao.

  · khu dat trong — quay rao kin, chua mot cai cong. O ruong ke trong long no
  · chuong thu    — quay rao kin, chua mot cai cong o hang duoi. Con vat CHI di
                    lai trong long chuong, khong lang ra ca nong trai nua
  · ho nuoi ca    — quay rao ba mat, HO MAT phia loi di de dung tren duong quay
                    mat len la buong can duoc
  · nha kho       — cho, don hang dan lang, kho nong san (bac Nong dung truoc cua)
  · nha bep       — nau an. Nguyen lieu la thu tu trong tu nuoi duoc

Ba bien MUA cam duoi loi di, doi dien tung khu: hat giong, con vat, can cau.
Bam vao bien la ra ngay bang chon tren ban do, khong mo panel.

NEN LAY TU CHINH PACK "Cozy Farm" (tools/cozytile.py), khong dung tileset
Tuxemon: cay coi, con vat, nha cua tren nong trai von da la cua pack.

O ruong, chuong mua them, may che bien deu la VAT THE do nguoi choi tu ke (xem
js/engine/nongtrai.js) va KHONG chan duong: di xuyen qua duoc, dung truoc mat
bam A la lam viec. Lam vat the chan duong thi ke kin ruong xong la tu nhot minh.

Goi tu tools/mktmx.py, dung chay truc tiep.
"""
import os

W, H = 50, 16
SLUG = 'nong_trai'
TEN = 'Nông Trại Bờ Suối'

import cozytile as CT
from cozytile import _o, o_vien, rng as _rng

TEP_TILE = CT.TEP_TILE
CO, CAT, DAT, NUOC = CT.CO, CT.CAT, CT.DAT, CT.NUOC
DAI_CAT, DAI_DAT, DAI_NUOC = CT.DAI_CAT, CT.DAI_DAT, CT.DAI_NUOC
BUI, HOA, DA_TANG = CT.BUI, CT.HOA, CT.DA_TANG

# ==== Bo cuc ====
# DUY NHAT mot dai loi di, chay ngang suot ban do.
DUONG_NGANG = (9, 10)
# Cho dat chan khi di nhanh vao — ngay truoc cua nha minh. Nong trai KHONG co
# cong bo cong cong nao: duong vao that la cua sau trong nha.
CONG = (3, DUONG_NGANG[1])

# Can nha cua nguoi choi o dau dai phia tay. Vung 3x3 giong het lo dat ben Khu
# Dan Cu, o cua nam giua hang duoi cung.
NHA_SAU = (2, 5)

# KHU DAT TRONG khong quay rao: no la mot luoi 50 O RUONG co dinh, o nao mua
# roi thi hien ra thanh dat, o chua mua thi cam bien BAN. Quay rao thi cai rao
# lai cat ngang giua may o dat, ma khu nay von la thu se lon dan ra.
KHU_TRONG = (6, 4, 10, 5)       # luoi o ruong: x, y, rong, cao (o) = 50 o
O_TOI_DA = KHU_TRONG[2] * KHU_TRONG[3]

CHUONG = (17, 3, 6, 6)          # chuong thu KE CA hang rao: x, y, rong, cao
AO = (25, 4, 30, 8)             # mat nuoc: x0, y0, x1, y1 (bao gom hai dau)
NHA_KHO = (33, 4, 5, 5)         # nha kho: x, y, rong, cao (o)
NHA_BEP = (39, 2, 9, 7)         # nha bep: x, y, rong, cao (o)

BAC_NONG = (35, DUONG_NGANG[0])   # nguoi coi kho, dung ngay truoc cua
LAI_CA = (27, DUONG_NGANG[0])     # ong lai ca, dung ngay duoi bo ho

# Long chuong — con vat chi di lai trong day (x0, y0, x1, y1)
VUNG_THU = (CHUONG[0] + 1, CHUONG[1] + 1,
            CHUONG[0] + CHUONG[2] - 2, CHUONG[1] + CHUONG[3] - 2)


def cac_o_ruong():
    """Thu tu 50 o ruong: hang sat loi di truoc, roi lui dan ve phia sau.

    Nguoi choi mua tu duoi len nen khu ruong lon dan ra XA loi di — nhin ra la
    mot cai ruong dang duoc mo rong, chu khong phai may o dat roi rac.
    """
    x0, y0, w, h = KHU_TRONG
    ds = []
    for y in range(y0 + h - 1, y0 - 1, -1):
        for x in range(x0, x0 + w):
            ds.append((x, y))
    return ds


O_RUONG = cac_o_ruong()

# Bien MUA cam duoi loi di, doi dien tung khu. (ma, x, y)
#   hat — hat giong        thu — con vat        can — can cau
BIEN = [
    ('hat', KHU_TRONG[0] + 4, DUONG_NGANG[1] + 1),
    ('thu', CHUONG[0] + 2, DUONG_NGANG[1] + 1),
    ('can', AO[0] + 2, DUONG_NGANG[1] + 1),
]

# Vung ke duoc vat the nong trai (x0, y0, x1, y1) — tru vien cay ra.
VUNG = (2, 3, W - 3, DUONG_NGANG[1] + 1)

# Nong trai moi thi TRONG KHONG: chua mua o ruong nao ca. O ruong KHONG con la
# thu tu ke: cho dat san mot luoi 50 o, moi luot chi hien BIEN BAN o o ke tiep.
# Tu ke thi nguoi choi phai tu nghi ra bo cuc truoc khi biet minh dang lam gi,
# ma ke lech mot o la ca cai ruong lo cho.
MAC_DINH = []


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
    cx, cy, cw, ch = CHUONG
    kx, ky, kw, kh = NHA_KHO
    bx, by, bw, bh = NHA_BEP

    def la_nuoc(x, y):
        return ax0 <= x <= ax1 and ay0 <= y <= ay1

    def la_duong(x, y):
        # Mot dai duy nhat: khong nhanh doc nao ca.
        return trong_ban_do(x, y) and y in DUONG_NGANG

    def trong_nha(x, y, n):
        return n[0] <= x < n[0] + n[2] and n[1] <= y < n[1] + n[3]

    def la_nha(x, y):
        return trong_nha(x, y, NHA_KHO) or trong_nha(x, y, NHA_BEP)

    def la_san(x, y):
        """Nen dat truoc cua hai toa nha — de cua khoi moc thang tu bai co."""
        if la_duong(x, y):
            return False
        if la_nha(x, y):
            return True
        return ((kx <= x < kx + kw and y == ky + kh)
                or (bx <= x < bx + bw and y == by + bh))

    def la_nen_cung(x, y):
        """Moi thu lat cung mot chat dat nen: loi di + san truoc nha."""
        return la_duong(x, y) or la_san(x, y)

    # ==== Nen ====
    for y in range(H):
        for x in range(W):
            if la_nuoc(x, y):
                nen[idx(x, y)] = g0 + NUOC
                water[idx(x, y)] = 1
                solid[idx(x, y)] = 1
            elif la_nen_cung(x, y):
                dat_nen(x, y, CAT)
            else:
                dat_nen(x, y, CO)

    # Vien: o co nao dinh vung khac thi doi sang o vien cua dai tuong ung.
    # Nuoc xet TRUOC vi bo ho dep hon bo duong.
    for y in range(H):
        for x in range(W):
            if la_nuoc(x, y) or la_nen_cung(x, y):
                continue
            o = (o_vien(la_nuoc, x, y, DAI_NUOC)
                 or o_vien(la_nen_cung, x, y, DAI_CAT))
            if o is not None:
                dat_nen(x, y, o)

    # ==== Hang rao ====
    # Chuong quay KIN bon mat, chua hai o lam cong o hang duoi. Rao CHAN DUONG
    # that: co the con vat moi khong lang ra khoi chuong duoc.
    dau, than, duoi = CT.RAO_NGANG
    cong_chuong = set()          # moi o cong da chua ra, gom lai de don sau

    def rao_ngang(x0, x1, y, bo=()):
        for i, x in enumerate(range(x0, x1 + 1)):
            if not trong_ban_do(x, y) or (x, y) in bo:
                continue
            o = dau if i == 0 else (duoi if x == x1 else than)
            dat_tren(x, y, o)

    def rao_doc(x, y0, y1, bo=()):
        for y in range(y0, y1 + 1):
            if trong_ban_do(x, y) and (x, y) not in bo:
                dat_tren(x, y, CT.RAO_DOC)

    def quay_rao(o):
        ox, oy, ow, oh = o
        cong = {(ox + ow // 2 - 1, oy + oh - 1), (ox + ow // 2, oy + oh - 1)}
        rao_ngang(ox, ox + ow - 1, oy)
        rao_ngang(ox, ox + ow - 1, oy + oh - 1, bo=cong)
        rao_doc(ox, oy + 1, oy + oh - 2)
        rao_doc(ox + ow - 1, oy + 1, oy + oh - 2)
        return cong

    # CHI chuong duoc quay rao. Khu dat trong de tran, rao chi cat ngang giua
    # may o dat roi khien no khong lon ra duoc.
    cong_chuong |= quay_rao(CHUONG)

    # Ho quay ba mat, HO MAT phia loi di: dung tren duong quay mat len la
    # buong can duoc. Rao kin het bon mat thi khong con cho nao cham toi nuoc.
    rao_ngang(ax0 - 1, ax1 + 1, ay0 - 1)
    rao_doc(ax0 - 1, ay0, ay1)
    rao_doc(ax1 + 1, ay0, ay1)

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

    # Vung phai chua trong cho cay: nha cua, chuong, ho, ruong mac dinh, bien.
    def da_co_chu(x, y):
        if la_nuoc(x, y) or la_nen_cung(x, y):
            return True
        if tren[idx(x, y)]:
            return True
        if (NHA_SAU[0] - 1 <= x <= NHA_SAU[0] + 3
                and NHA_SAU[1] - 1 <= y <= NHA_SAU[1] + 4):
            return True
        for n in (NHA_KHO, NHA_BEP):
            if n[0] - 1 <= x <= n[0] + n[2] and n[1] - 1 <= y <= n[1] + n[3] + 1:
                return True
        for o in (KHU_TRONG, CHUONG):
            if o[0] - 1 <= x <= o[0] + o[2] and o[1] - 1 <= y <= o[1] + o[3]:
                return True
        if ax0 - 2 <= x <= ax1 + 2 and ay0 - 2 <= y <= ay1 + 1:
            return True
        for _ma, sx, sy in BIEN:
            if sx - 1 <= x <= sx + 1 and sy - 1 <= y <= sy + 1:
                return True
        return False

    def cho_trong_cay(x, y):
        het = True
        for dy in range(4):
            for dx in range(2):
                if not trong_ban_do(x + dx, y + dy):
                    continue          # ria tren cho cay tho ra ngoai ban do
                het = False
                if da_co_chu(x + dx, y + dy):
                    return False
        return not het

    ria = []
    for x in range(0, W, 2):
        ria += [(x, -1), (x, H - 4)]
    for y in range(4, H - 4, 4):
        ria += [(0, y), (W - 2, y)]
    for x, y in ria:
        if not cho_trong_cay(x, y):
            continue
        trong_cay(x, y, CT.kieu_cay(x, y))

    # ==== Bui, hoa, da rai cho con trong ====
    # KHONG chan duong: cho nao cung phai ke duoc ruong voi chuong, khong thi
    # nguoi choi bay bo cuc ra roi moi phat hien co mot buoi cay vo hinh.
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            if da_co_chu(x, y) or solid[idx(x, y)]:
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
        # Mat nuoc thi KHONG don: bo ho nam ngay canh loi di, don bua la thung
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
    # Cua nha nguoi choi va them buoc ra
    for y in range(NHA_SAU[1], NHA_SAU[1] + 4):
        for x in range(NHA_SAU[0], NHA_SAU[0] + 3):
            don(x, y)
    # Long hai o quay rao va may cai cong
    for y in range(VUNG_THU[1], VUNG_THU[3] + 1):
        for x in range(VUNG_THU[0], VUNG_THU[2] + 1):
            don(x, y)
    for x, y in O_RUONG:
        don(x, y)
    for x, y in cong_chuong:
        don(x, y)

    # ==== Hai toa nha co dinh ====
    # Anh nha nam o assets/nt/nha/*.png chu khong o tileset, nen o day chi danh
    # dau CHAN DUONG; phan ve nam ben js/ui/world.js. Hang ngay duoi phai di
    # duoc de con dung ma bam A.
    for n in (NHA_KHO, NHA_BEP):
        for y in range(n[1], n[1] + n[3]):
            for x in range(n[0], n[0] + n[2]):
                if trong_ban_do(x, y):
                    tren[idx(x, y)] = 0
                    solid[idx(x, y)] = 1
        for x in range(n[0], n[0] + n[2]):
            don(x, n[1] + n[3])

    # ==== Bien MUA ====
    # Chi la mot cai coc go cho de nhin; phan chu do js/ui/world.js ve.
    for _ma, sx, sy in BIEN:
        if trong_ban_do(sx, sy):
            dat_tren(sx, sy, CT.RAO_COT)

    npcs = [
        {'x': BAC_NONG[0], 'y': BAC_NONG[1], 'dir': 'up', 'sprite': 'picnicker',
         'name': 'Bác Nông', 'ai': 'stand', 'mo': 'nongtrai', 'tab': 'cho',
         'lines': ['Đơn hàng dân làng, kho nông sản — trong kho bác giữ hết.']},
        # Ong lai ca KHONG mo panel: mua can, ban ca deu noi chuyen ngay tai day
        # (js/ui/world.js). Buong can thi quay mat ra ho bam A.
        {'x': LAI_CA[0], 'y': LAI_CA[1], 'dir': 'up', 'sprite': 'beachcomber',
         'name': 'Ông Lái Cá', 'ai': 'stand', 'laiCa': True,
         'lines': ['Hồ này cá hiền, hợp người mới tập câu. Câu được thì bán cho tôi.']},
    ]
    npcs = [n for n in npcs if not solid[idx(n['x'], n['y'])]]

    talks = []

    # O CAM ke do: loi di, mat nuoc, hang rao, nha, bien, cho NPC dung, nha minh.
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
    for n in (NHA_KHO, NHA_BEP):
        for y in range(n[1], n[1] + n[3] + 1):
            for x in range(n[0], n[0] + n[2]):
                cam.add((x, y))
    for y in range(NHA_SAU[1], NHA_SAU[1] + 4):
        for x in range(NHA_SAU[0], NHA_SAU[0] + 3):
            cam.add((x, y))
    for _ma, sx, sy in BIEN:
        cam.add((sx, sy))
    # 50 o ruong la cho DA DANH SAN cho dat trong: ke may hay chuong de len thi
    # mua o dat den luot do la dam vao nhau.
    cam |= set(O_RUONG)

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


TEN_BIEN = {'hat': 'Mua Hạt Giống', 'thu': 'Mua Con Vật', 'can': 'Mua Cần Câu'}


def viet_js(cam=()):
    """Ghi js/data/nongtraimap.js — toa do de ben engine dung lai."""
    out = [
        '// TuxeWorld H5 | data/nongtraimap.js | TỰ SINH TỪ tools/nongtrai.py, đừng sửa tay',
        '// Toạ độ trên bản đồ nông trại, sinh cùng lúc với chính bản đồ nên không',
        '// bao giờ lệch khỏi nền đất đã kẻ sẵn.',
        '',
        'export const NONG_TRAI_MAP = "%s";' % SLUG,
        '// Chỗ đặt chân khi đi nhanh vào — ngay trước cửa nhà mình.',
        'export const CONG_RA = { x: %d, y: %d };' % CONG,
        '// Nông trại là một DẢI NGANG: đúng một lối đi chạy suốt từ tây sang',
        '// đông, sáu khu kê ngay trên dải đó.',
        'export const LOI_NGANG = %s;' % list(DUONG_NGANG),
        '',
        '// Khu đất trồng: một lưới ô ruộng, KHÔNG quây rào.',
        'export const KHU_TRONG = { x: %d, y: %d, w: %d, h: %d };' % KHU_TRONG,
        '// Đúng %d ô ruộng, xếp theo THỨ TỰ MUA: hàng sát lối đi trước rồi lùi' % O_TOI_DA,
        '// dần về phía sau. Mỗi lượt chỉ ô kế tiếp hiện biển bán.',
        'export const O_TOI_DA = %d;' % O_TOI_DA,
        'export const O_RUONG = ['
        + ', '.join('{ x: %d, y: %d }' % (x, y) for x, y in O_RUONG) + '];',
        '// Chuồng thú quây rào, kể cả hàng rào. Con vật chỉ đi trong VUNG_THU.',
        'export const CHUONG = { x: %d, y: %d, w: %d, h: %d };' % CHUONG,
        'export const VUNG_THU = { x0: %d, y0: %d, x1: %d, y1: %d };' % VUNG_THU,
        '// Mặt nước hồ nuôi cá. Hồ hở mặt phía lối đi để buông cần được.',
        'export const AO_CA = { x0: %d, y0: %d, x1: %d, y1: %d };' % AO,
        '// Hai toà nhà cố định. Ảnh nằm ở assets/nt/nha/*.png chứ không ở',
        '// tileset, nên bản đồ chỉ đánh dấu chặn đường, phần vẽ do',
        '// js/ui/world.js lo.',
        'export const NHA_KHO = { x: %d, y: %d, w: %d, h: %d };' % NHA_KHO,
        'export const NHA_BEP = { x: %d, y: %d, w: %d, h: %d };' % NHA_BEP,
        'export const BAC_NONG = { x: %d, y: %d };' % BAC_NONG,
        '// Chỗ dựng nhà của người chơi trên nông trại — vùng 3x3 y hệt lô đất',
        '// bên Khu Dân Cư, ô cửa nằm giữa hàng dưới cùng. Nông trại là SÂN SAU',
        '// của căn nhà đó: bước ra cửa sau trong nhà là ra thẳng ngoài ruộng.',
        'export const NHA_SAU = { x: %d, y: %d };' % NHA_SAU,
        '',
        '// Biển MUA cắm dưới lối đi, đối diện từng khu. Bấm vào là ra bảng chọn',
        '// ngay trên bản đồ chứ không mở panel.',
        'export const BIEN = [',
    ]
    for ma, x, y in BIEN:
        out.append('  { ma: "%s", ten: "%s", x: %d, y: %d },' % (ma, TEN_BIEN[ma], x, y))
    out += [
        '];',
        '',
        '// Vùng kê được vật thể nông trại — ngoài vùng này là lối đi, hồ, viền cây.',
        'export const VUNG = { x0: %d, y0: %d, x1: %d, y1: %d };' % VUNG,
        '',
        '// Nông trại mới thì trống không: đất là phải mua. Khu đất trồng đã quây',
        '// rào sẵn, nhưng từng ô ruộng phải mua ở biển MUA rồi tự kê vào.',
        'export const MAC_DINH = [',
    ]
    for ma, x, y in MAC_DINH:
        out.append('  { id: "%s", x: %d, y: %d },' % (ma, x, y))
    trong_vung = sorted((x, y) for x, y in cam
                        if VUNG[0] <= x <= VUNG[2] and VUNG[1] <= y <= VUNG[3])
    out += [
        '];',
        '',
        '// Ô KHÔNG kê được dù nằm trong vùng: lối đi, mặt nước, hàng rào, nhà,',
        '// biển, chỗ người làm việc đứng. Kê ruộng đè lên đường thì đi không lọt,',
        '// mà kê đè lên NPC thì bấm A ra câu thoại chứ không ra ruộng.',
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
