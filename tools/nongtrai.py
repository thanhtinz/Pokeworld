# -*- coding: utf-8 -*-
"""Dung NONG TRAI — ban do rieng de trong trot, nuoi thu, nhan don hang.

NEN LAY TU CHINH PACK "Cozy Farm", khong dung tileset Tuxemon nua. Lan dau
tranh tron hai bo nen cho khoi lech phong cach — nhung nong trai von da day
cay, con vat, nha cua CUA PACK roi, nen cai lech ra lai la nen co cua Tuxemon.
Bay gio ca ban do mot bo: co, duong dat, ao nuoc, cay coi deu cua pack, va
dung dung bo autotile cua ho nen bo co - duong - nuoc noi vao nhau muot chu
khong con la may hinh chu nhat dan canh nhau.

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

import cozytile as CT
from cozytile import _o, o_vien, rng as _rng

TEP_TILE = CT.TEP_TILE
CO, CAT, DAT, NUOC = CT.CO, CT.CAT, CT.DAT, CT.NUOC
DAI_CAT, DAI_DAT, DAI_NUOC = CT.DAI_CAT, CT.DAI_DAT, CT.DAI_NUOC
BUI, HOA, DA_TANG = CT.BUI, CT.HOA, CT.DA_TANG

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
# Cho dung nha cua nguoi choi: nong trai la SAN SAU cua can nha do, nen can nha
# quay lung ra ruong, dung sat mep nam. Vung 3x3 giong het lo dat ben Khu Dan
# Cu, o cua nam giua hang duoi cung.
NHA_SAU = (10, 17)

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

    def la_nuoc(x, y):
        return ax0 <= x <= ax1 and ay0 <= y <= ay1

    def la_duong(x, y):
        return trong_ban_do(x, y) and (x in DUONG_DOC or y in DUONG_NGANG)

    def la_san(x, y):
        for cx, cy in (BAC_NONG, BANG_DON):
            if cx - 1 <= x <= cx + 1 and cy <= y <= cy + 1 and not la_duong(x, y):
                return True
        return False

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
                dat_nen(x, y, DAT)
            else:
                dat_nen(x, y, CO)

    # Vien: o co nao dinh vung khac thi doi sang o vien cua dai tuong ung.
    # Nuoc xet TRUOC vi bo ao dep hon bo duong, ma hai vung khong dinh nhau.
    for y in range(H):
        for x in range(W):
            if la_nuoc(x, y) or la_duong(x, y) or la_san(x, y):
                continue
            o = (o_vien(la_nuoc, x, y, DAI_NUOC)
                 or o_vien(la_san, x, y, DAI_DAT)
                 or o_vien(la_duong, x, y, DAI_CAT))
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
                    continue          # ria tren cho cay thò ra ngoài bản đồ
                het = False
                if la_nuoc(x + dx, y + dy) or la_duong(x + dx, y + dy):
                    return False
                if la_san(x + dx, y + dy) or tren[idx(x + dx, y + dy)]:
                    return False
                # Chua cho nha nguoi choi va quan ca
                if (NHA_SAU[0] - 1 <= x + dx <= NHA_SAU[0] + 3
                        and NHA_SAU[1] - 1 <= y + dy <= NHA_SAU[1] + 4):
                    return False
                if (QUAN_CA[0] - 1 <= x + dx <= QUAN_CA[0] + QUAN_CA[2]
                        and QUAN_CA[1] - 1 <= y + dy <= QUAN_CA[1] + QUAN_CA[3]):
                    return False
                # Chua luon bo cuc mac dinh cua nong trai moi
                for ma, mx, my in MAC_DINH:
                    if mx <= x + dx <= mx + 5 and my <= y + dy <= my + 5:
                        return False
        return not het

    # Hai hang cay bao quanh, chua may o cong va loi di
    # Hang tren trong tu y = -1: cay cao 4 o, trong tu y = 0 thi than cham
    # xuong tan hang 3 — dung ngay cho luong ruong mac dinh.
    ria = []
    for x in range(0, W, 2):
        ria += [(x, -1), (x, H - 4)]
    for y in range(4, H - 4, 4):
        ria += [(0, y), (W - 2, y)]
    for x, y in ria:
        if x in DUONG_DOC or x + 1 in DUONG_DOC:
            continue                              # chua loi di doc
        if not cho_trong_cay(x, y):
            continue
        trong_cay(x, y, CT.kieu_cay(x, y))

    # ==== Bui, hoa, da rai trong long nong trai ====
    # KHONG chan duong: cho nao cung phai ke duoc ruong voi chuong, khong thi
    # nguoi choi bay bo cuc ra roi moi phat hien co mot buoi cay vo hinh.
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            if (la_nuoc(x, y) or la_duong(x, y) or la_san(x, y)
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
        # Mat nuoc thi KHONG don: ao nam ngay canh cho ong lai ca dung, don
        # bua la thung mot o cho loi thang xuong nuoc.
        if trong_ban_do(x, y) and not water[idx(x, y)]:
            tren[idx(x, y)] = 0
            solid[idx(x, y)] = 0

    for x in DUONG_DOC:
        for y in range(H):
            don(x, y)
    for y in DUONG_NGANG:
        for x in range(1, W - 1):
            don(x, y)
    for cho in (BAC_NONG, BANG_DON, LAI_CA):
        don(cho[0], cho[1])
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            don(cho[0] + dx, cho[1] + dy)
    for y in range(NHA_SAU[1], NHA_SAU[1] + 4):
        for x in range(NHA_SAU[0], NHA_SAU[0] + 3):
            don(x, y)

    # ==== Quan ca ben bo ao ====
    # Anh quan la mot tep rieng (assets/ca/quan.png, cat tu pack Cozy Fishing)
    # chu khong o tileset, nen o day chi danh dau CHAN DUONG; phan ve nam ben
    # js/ui/world.js. Hang ngay duoi quan phai di duoc de con dung ma ngam.
    qx, qy, qw, qh = QUAN_CA
    for y in range(qy, qy + qh):
        for x in range(qx, qx + qw):
            if trong_ban_do(x, y):
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

    talks = [
        {'x': DUONG_DOC[1] + 1, 'y': H - 3, 'name': 'Bảng Nông Trại',
         'text': 'NÔNG TRẠI BỜ SUỐI — cày cấy, nuôi thú, nhận đơn của dân làng.'},
        {'x': BAC_NONG[0], 'y': BAC_NONG[1] - 1, 'name': 'Biển Nhà Kho',
         'text': 'Chỗ bác Nông — bán hạt giống với cỏ khô, thu mua nông sản.'},
        {'x': BANG_DON[0], 'y': BANG_DON[1] - 1, 'name': 'Bảng Đơn Hàng',
         'text': 'Dân làng dán đơn ở đây. Giao đủ hàng thì nhận tiền.'},
    ]
    talks = [t for t in talks if not solid[idx(t['x'], t['y'])]]

    # O CAM ke do: loi di, mat nuoc, cho ba nguoi lam viec dung, quan ca, nha.
    cam = set()
    for y in range(H):
        for x in range(W):
            if water[idx(x, y)] or solid[idx(x, y)] or la_duong(x, y):
                cam.add((x, y))
    cam |= o_cay          # ke ca tan la: ke ruong duoi tan cay thi cay che mat
    for cx, cy in (BAC_NONG, BANG_DON, LAI_CA):
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                cam.add((cx + dx, cy + dy))
    for y in range(QUAN_CA[1], QUAN_CA[1] + QUAN_CA[3] + 1):
        for x in range(QUAN_CA[0], QUAN_CA[0] + QUAN_CA[2]):
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
        'export const BAC_NONG = { x: %d, y: %d };' % BAC_NONG,
        'export const BANG_DON = { x: %d, y: %d };' % BANG_DON,
        'export const AO_CA = { x0: %d, y0: %d, x1: %d, y1: %d };' % AO,
        '// Quán cá bên bờ ao. Ảnh nằm ở assets/ca/quan.png (cắt từ pack Cozy',
        '// Fishing) chứ không ở tileset, nên bản đồ chỉ đánh dấu chặn đường,',
        '// còn phần vẽ do js/ui/world.js lo.',
        'export const QUAN_CA = { x: %d, y: %d, w: %d, h: %d };' % QUAN_CA,
        '// Chỗ dựng nhà của người chơi trên nông trại — vùng 3x3 y hệt lô đất',
        '// bên Khu Dân Cư, ô cửa nằm giữa hàng dưới cùng. Nông trại là SÂN SAU',
        '// của căn nhà đó: bước ra cửa sau trong nhà là ra thẳng ngoài ruộng.',
        'export const NHA_SAU = { x: %d, y: %d };' % NHA_SAU,
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
