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

W, H = 65, 18
SLUG = 'nong_trai'
TEN = 'Nông Trại Bờ Suối'

import cozytile as CT
from cozytile import _o, o_vien, rng as _rng

TEP_TILE = CT.TEP_TILE
CO, CAT, DAT, NUOC = CT.CO, CT.CAT, CT.DAT, CT.NUOC
DAI_CAT, DAI_DAT, DAI_NUOC = CT.DAI_CAT, CT.DAI_DAT, CT.DAI_NUOC
BUI, HOA, DA_TANG = CT.BUI, CT.HOA, CT.DA_TANG

# ==== Bo cuc ====
# HANG RAO chay quanh CA BAN DO, khong phai quay tung khu. Ca nong trai la mot
# manh dat co rao, ben trong thi thoang — dung nhu may cai nong trai that.
# (Rieng chuong thu va bo ho van co rao rieng: chuong de nhot thu, ho de khoi
# ai buoc xuong nuoc.)
RAO_NGOAI = (1, 3, W - 2, H - 3)     # x, y, rong, cao — vong rao quanh ban do

# DUY NHAT mot dai loi di, chay ngang suot ban do.
DUONG_NGANG = (11, 12)
# CONG BO o dau dai phia tay, duc thang qua vong rao. Noi hai chieu voi ngo bac
# cua Khu Dan Cu.
#
# Truoc day nong trai la SAN SAU can nha nguoi choi: khong co cong nao, vao bang
# cua sau trong nha. Bo cach do roi — nong trai gio la mot khu rieng mo theo cap
# Trainer, chang lien quan gi toi chuyen da mua dat xay nha hay chua.
CONG = (RAO_NGOAI[0], DUONG_NGANG[1])
# Cho dat chan khi vao: o NGAY TRONG cong. Dat chan dung tren o cong thi vua vao
# da buoc len warp, bat sang ban do kia luon.
CHO_VAO = (CONG[0] + 1, DUONG_NGANG[1])

# KHU DAT TRONG khong quay rao: no la mot luoi 50 O RUONG co dinh, o nao mua
# roi thi hien ra thanh dat, o chua mua thi cam bien BAN. Quay rao thi cai rao
# lai cat ngang giua may o dat, ma khu nay von la thu se lon dan ra.
# O ruong xep THUA: cach nhau dung mot o. Xep sat nhau thi ca 50 o dinh lien
# thanh mot mang nau phang, khong con thay tung o dau ca — ma nhin ky thi cai
# ranh co giua may o moi la thu lam no ra hinh cai ruong.
# Cao 7 hang de xep du 4 HANG o ruong khi da cach nhau mot o (hang 4, 6, 8, 10).
KHU_TRONG = (6, 4, 25, 7)       # vung luoi o ruong: x, y, rong, cao (o)
BUOC_O = 2                      # hai o ruong cach nhau bay nhieu o
O_TOI_DA = 50

CHUONG = (33, 5, 6, 6)          # chuong thu KE CA hang rao: x, y, rong, cao
AO = (41, 6, 46, 10)            # mat nuoc: x0, y0, x1, y1 (bao gom hai dau)
NHA_KHO = (49, 6, 5, 5)         # nha kho: x, y, rong, cao (o)
# Cot cuoi cua nha bep phai cach vong rao mot o: san truoc cua duoc don sach
# solid, don trum len cot rao la thung mot lo ra ngoai ban do.
NHA_BEP = (54, 4, 9, 7)         # nha bep: x, y, rong, cao (o)

BAC_NONG = (51, DUONG_NGANG[0])   # nguoi coi kho, dung ngay truoc cua
LAI_CA = (43, DUONG_NGANG[0])     # ong lai ca, dung ngay duoi bo ho

# Long chuong — con vat chi di lai trong day (x0, y0, x1, y1)
VUNG_THU = (CHUONG[0] + 1, CHUONG[1] + 1,
            CHUONG[0] + CHUONG[2] - 2, CHUONG[1] + CHUONG[3] - 2)


def cac_o_ruong():
    """Thu tu 50 o ruong: hang sat loi di truoc, roi lui dan ve phia sau.

    Cac o cach nhau BUOC_O o theo ca hai chieu, nen giua chung luon con mot
    ranh co. Nguoi choi mua tu duoi len nen khu ruong lon dan ra XA loi di —
    nhin ra la mot cai ruong dang duoc mo rong, chu khong phai may o dat roi rac.
    """
    x0, y0, w, h = KHU_TRONG
    ds = []
    for y in range(y0 + h - 1, y0 - 1, -BUOC_O):
        for x in range(x0, x0 + w, BUOC_O):
            ds.append((x, y))
            if len(ds) >= O_TOI_DA:
                return ds
    return ds


O_RUONG = cac_o_ruong()

# NGUOI BAN HANG dung duoi loi di, doi dien tung khu. Truoc day chi la mot cai
# coc go cam bien — bam vao cai coc de mua hat thi lam gi co ai ban cho.
#   (ma hang, ten, sprite, x, y)
NGUOI_BAN = [
    ('hat', 'Cô Hạt Giống', 'homemaker', KHU_TRONG[0] + 4, DUONG_NGANG[1] + 1),
    ('thu', 'Anh Lái Thú', 'cooldude', CHUONG[0] + 2, DUONG_NGANG[1] + 1),
]

# Vung ke duoc vat the nong trai (x0, y0, x1, y1) — tru vien cay ra.
VUNG = (2, RAO_NGOAI[1] + 1, W - 3, DUONG_NGANG[1] + 2)

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

    def la_nuoc(x, y):
        return ax0 <= x <= ax1 and ay0 <= y <= ay1

    def la_duong(x, y):
        # Mot dai duy nhat: khong nhanh doc nao ca.
        return trong_ban_do(x, y) and y in DUONG_NGANG

    def trong_nha(x, y, n):
        return n[0] <= x < n[0] + n[2] and n[1] <= y < n[1] + n[3]

    def la_nen_cung(x, y):
        """CHI loi di duoc lat dat nen. Khong gi khac.

        Truoc day san truoc hai toa nha cung lat dat nen — cung mot o tile voi
        loi di. Thanh ra loi di voi san dinh lien thanh mot mang nau, dung giua
        do thi khong biet cho nao la duong di duoc cho nao khong. Nha cua cu
        dung tren co, mat tien cua chung da co be nen ve san roi.
        """
        return la_duong(x, y)

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

    def quay_rao(o, co_cong=True):
        ox, oy, ow, oh = o
        cong = set()
        if co_cong:
            cong = {(ox + ow // 2 - 1, oy + oh - 1), (ox + ow // 2, oy + oh - 1)}
        rao_ngang(ox, ox + ow - 1, oy)
        rao_ngang(ox, ox + ow - 1, oy + oh - 1, bo=cong)
        rao_doc(ox, oy + 1, oy + oh - 2)
        rao_doc(ox + ow - 1, oy + 1, oy + oh - 2)
        return cong

    # VONG RAO QUANH CA BAN DO. Khong chua cong nao: nong trai la san sau can
    # nha, duong vao la cua sau trong nha chu khong phai mot cai cong ngoai dong
    # — de cai cong ma khong noi di dau thi con to hon la khong de.
    quay_rao(RAO_NGOAI, co_cong=False)

    # Chuong quay rao rieng de nhot thu. Khu dat trong de tran: rao chi cat
    # ngang giua may o dat roi khien no khong lon ra duoc.
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
        # Ngay trong lan vong rao ngoai: chua cho no, khong thi bui hoa moc len
        # chinh o hang rao
        rx, ry, rw, rh = RAO_NGOAI
        if x in (rx, rx + rw - 1) and ry <= y <= ry + rh - 1:
            return True
        if y in (ry, ry + rh - 1) and rx <= x <= rx + rw - 1:
            return True
        if tren[idx(x, y)]:
            return True
        for n in (NHA_KHO, NHA_BEP):
            if n[0] - 1 <= x <= n[0] + n[2] and n[1] - 1 <= y <= n[1] + n[3] + 1:
                return True
        for o in (KHU_TRONG, CHUONG):
            if o[0] - 1 <= x <= o[0] + o[2] and o[1] - 1 <= y <= o[1] + o[3]:
                return True
        if ax0 - 2 <= x <= ax1 + 2 and ay0 - 2 <= y <= ay1 + 1:
            return True
        for _ma, _t, _sp, sx, sy in NGUOI_BAN:
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

    # Cay dung NGOAI vong rao, doc canh bac: nhin ra la rung o phia sau nong
    # trai. Truoc cay lam luon vai vien ban do — gio rao lam viec do roi, cay
    # chen vao trong chi an cho ke ruong.
    for x in range(0, W, 2):
        # Cay cao 4 o, than o hai hang duoi. Trong tu day thi than dung sat
        # ngoai hang rao, con tan la tho ra ngoai mep ban do.
        y = RAO_NGOAI[1] - 4
        if cho_trong_cay(x, y):
            trong_cay(x, y, CT.kieu_cay(x, y))

    # ==== Bui, hoa, da rai cho con trong ====
    # KHONG chan duong: cho nao cung phai ke duoc ruong voi chuong, khong thi
    # nguoi choi bay bo cuc ra roi moi phat hien co mot buoi cay vo hinh.
    for y in range(RAO_NGOAI[1] + 1, RAO_NGOAI[1] + RAO_NGOAI[3] - 1):
        for x in range(RAO_NGOAI[0] + 1, RAO_NGOAI[0] + RAO_NGOAI[2] - 1):
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

    # Chua hai cot rao hai dau: don ca den mep la thung mot lo ra ngoai ban do.
    for y in DUONG_NGANG:
        for x in range(RAO_NGOAI[0] + 1, RAO_NGOAI[0] + RAO_NGOAI[2] - 1):
            don(x, y)
    for cho in (BAC_NONG, LAI_CA):
        don(cho[0], cho[1])
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            don(cho[0] + dx, cho[1] + dy)
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

    # ==== Cong bo ====
    # Duc thang qua vong rao o hai hang loi di. Vong don loi di phia tren chua
    # hai cot rao hai dau lai, nen phai mo tay dung hai o nay.
    for y in DUONG_NGANG:
        don(CONG[0], y)

    npcs = [
        {'x': BAC_NONG[0], 'y': BAC_NONG[1], 'dir': 'up', 'sprite': 'picnicker',
         'name': 'Bác Nông', 'ai': 'stand', 'mo': 'nongtrai', 'tab': 'cho',
         'lines': ['Đơn hàng dân làng, kho nông sản — trong kho bác giữ hết.']},
        # Ong lai ca KHONG mo panel: mua can, ban ca deu noi chuyen ngay tai day
        # (js/ui/world.js). Buong can thi quay mat ra ho bam A.
        {'x': LAI_CA[0], 'y': LAI_CA[1], 'dir': 'up', 'sprite': 'beachcomber',
         'name': 'Ông Lái Cá', 'ai': 'stand', 'laiCa': True,
         'lines': ['Hồ này cá hiền, hợp người mới tập câu. Câu được thì bán cho tôi.']},
    ] + [
        {'x': sx, 'y': sy, 'dir': 'up', 'sprite': sp, 'name': ten, 'ai': 'stand',
         'banHang': ma, 'lines': [LOI_BAN[ma]]}
        for ma, ten, sp, sx, sy in NGUOI_BAN
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
        'spawn': {'x': CHO_VAO[0], 'y': CHO_VAO[1]},
    }


LOI_BAN = {
    'hat': 'Hạt giống đây! Mua rồi thì gieo vào ô ruộng của mình nhé.',
    'thu': 'Gà vịt thả rông cả nông trại được, còn bò dê lợn thì phải có chuồng.',
}


def viet_js(cam=()):
    """Ghi js/data/nongtraimap.js — toa do de ben engine dung lai."""
    out = [
        '// TuxeWorld H5 | data/nongtraimap.js | TỰ SINH TỪ tools/nongtrai.py, đừng sửa tay',
        '// Toạ độ trên bản đồ nông trại, sinh cùng lúc với chính bản đồ nên không',
        '// bao giờ lệch khỏi nền đất đã kẻ sẵn.',
        '',
        'export const NONG_TRAI_MAP = "%s";' % SLUG,
        '// Ô cổng bộ ở đầu dải phía tây, nối hai chiều với ngõ bắc Khu Dân Cư.',
        'export const CONG_RA = { x: %d, y: %d };' % CONG,
        '// Ô đặt chân khi vào — ngay TRONG cổng, không phải trên ô cổng.',
        'export const CHO_VAO = { x: %d, y: %d };' % CHO_VAO,
        '// Hàng rào quây quanh CẢ bản đồ (không có cổng: đường vào là cửa sau',
        '// trong nhà). x, y, rộng, cao tính theo ô.',
        'export const RAO_NGOAI = { x: %d, y: %d, w: %d, h: %d };' % RAO_NGOAI,
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
        '',
        '// Người bán hàng đứng dưới lối đi, đối diện từng khu. Nói chuyện là ra',
        '// bảng chọn ngay trên bản đồ chứ không mở panel.',
        'export const NGUOI_BAN = [',
    ]
    for ma, ten, _sp, x, y in NGUOI_BAN:
        out.append('  { ma: "%s", ten: "%s", x: %d, y: %d },' % (ma, ten, x, y))
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
    """Dung ban do nong trai, noi cong hai chieu voi ngo bac Khu Dan Cu."""
    kdc = out_maps.get(kdc_slug)
    if not kdc:
        print('BO QUA nong trai: chua co ban do %s' % kdc_slug)
        return None
    if not CT.co_pack(goc):
        print('BO QUA nong trai: khong thay %s' % TEP_TILE)
        return None
    m = dung(goc)
    import khudancu
    bx, by = khudancu.CONG_BAC          # o cong o canh bac Khu Dan Cu
    cx, cy = CONG
    # Hai o cong ben nong trai (hai hang loi di) deu do ve mot cho ben Khu Dan Cu.
    # `moKhoa` la ten tinh nang trong js/engine/unlock.js — engine chan cong lai
    # neu chua du cap, chu khong phai an cai cong di: an thi nguoi choi khong bao
    # gio biet la co duong o day.
    m['warps'] = [{'x': cx, 'y': y, 'to': kdc_slug, 'tx': bx, 'ty': by + 1}
                  for y in DUONG_NGANG]
    for x in (bx, bx + 1):
        kdc['warps'].append({'x': x, 'y': by, 'to': SLUG, 'tx': cx + 1, 'ty': cy,
                             'moKhoa': 'nongtrai'})
    return m
