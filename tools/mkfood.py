#!/usr/bin/env python3
# TuxeWorld H5 | tools/mkfood.py | Ve icon cho 47 mon an / nguyen lieu
#
# Ban goc Tuxemon chua ve icon cho nhom do an: MOI mon trong db/item deu tro
# vao gfx/items/box.png, nen sau khi chay mkitems.py thi 47 mon nau an va
# nguyen lieu deu ra CUNG MOT cai hop go nau. Mo man Che Tao ra thay 25 dong
# giong het nhau, khong biet dong nao la mon gi.
#
# Tep nay TU VE lay bang hinh khoi co ban (khong lay lai anh cua game nao
# khac), moi mon mot hinh + mot bang mau rieng. Chay SAU mkitems.py vi
# mkitems.py xoa sach thu muc assets/items truoc khi chep.
#
#   python3 tools/mkitems.py && python3 tools/mkfood.py
import os
import re

from PIL import Image, ImageDraw

SCALE = 4
N = 24                      # canh anh goc, dung co voi icon vat pham cua Tuxemon

C = {
    'o': (34, 24, 40, 255),        # vien toi
    'W': (245, 242, 232, 255),     # trang nga
    'S': (176, 170, 190, 255),     # xam
    'K': (0, 0, 0, 0),             # trong suot
    # bang mau do an
    'nau': (150, 100, 58, 255),
    'nau_d': (104, 66, 36, 255),
    'nau_n': (198, 152, 96, 255),
    'vang': (240, 196, 82, 255),
    'vang_d': (196, 148, 44, 255),
    'kem': (250, 232, 186, 255),
    'do': (206, 66, 54, 255),
    'do_d': (150, 40, 34, 255),
    'hong': (232, 138, 140, 255),
    'cam': (238, 148, 56, 255),
    'xanh': (96, 176, 88, 255),
    'xanh_d': (56, 122, 60, 255),
    'xanh_n': (150, 208, 122, 255),
    'luc': (188, 220, 96, 255),
    'lam': (104, 156, 224, 255),
    'tim': (140, 96, 190, 255),
    'tim_d': (86, 56, 124, 255),
    'xam_d': (92, 88, 108, 255),
}


def moi():
    im = Image.new('RGBA', (N, N), C['K'])
    return im, ImageDraw.Draw(im)


def vien(im, mau='o'):
    """Vien mot diem anh quanh phan da to — cho khoi mau co net bao."""
    px = im.load()
    them = []
    for y in range(N):
        for x in range(N):
            if px[x, y][3]:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < N and 0 <= ny < N and px[nx, ny][3] > 200:
                    them.append((x, y))
                    break
    for x, y in them:
        px[x, y] = C[mau]


# ==== Cac hinh dung chung. m = mau chinh, p = mau phu ====

def banh_lat(d, m, p):
    """Mieng banh cat tam giac, co lop kem."""
    d.polygon([(4, 18), (12, 5), (20, 18)], fill=C[m])
    d.polygon([(6, 15), (12, 9), (18, 15)], fill=C[p])
    d.rectangle((4, 18, 20, 20), fill=C['nau_d'])


def banh_tron(d, m, p):
    """Banh nuong tron nhin cheo, co vien vo."""
    d.ellipse((3, 8, 21, 20), fill=C[m])
    d.ellipse((3, 5, 21, 17), fill=C[p])
    d.ellipse((7, 8, 17, 14), fill=C[m])


def chong_banh(d, m, p):
    """Chong banh mong, co sot chay xuong."""
    for i, y in enumerate((16, 12, 8)):
        d.ellipse((4, y, 20, y + 5), fill=C[m] if i % 2 else C[p])
    d.ellipse((9, 5, 15, 9), fill=C['vang_d'])


def banh_su(d, m, p):
    """Banh su kem: hai nua, kem phong o giua."""
    d.ellipse((4, 11, 20, 20), fill=C[m])
    d.rectangle((4, 11, 20, 13), fill=C[p])
    d.ellipse((4, 4, 20, 13), fill=C[m])


def sung_bo(d, m, p):
    """Sung bo: hinh cong, ba khuc."""
    d.arc((3, 4, 21, 22), 200, 340, fill=C[m], width=5)
    d.ellipse((3, 10, 9, 17), fill=C[p])
    d.ellipse((15, 10, 21, 17), fill=C[p])


def banh_quy_bap(d, m, p):
    """Banh quy bap: hai vong xoan."""
    d.ellipse((3, 7, 13, 18), outline=C[m], width=3)
    d.ellipse((11, 7, 21, 18), outline=C[m], width=3)
    d.line((8, 6, 16, 6), fill=C[m], width=3)
    for x, y in ((7, 11), (16, 13), (11, 16)):
        d.point((x, y), fill=C[p])


def banh_mi(d, m, p):
    """O banh: bau duc, ba vet rach."""
    d.ellipse((2, 7, 22, 18), fill=C[m])
    for x in (7, 11, 15):
        d.line((x, 9, x + 2, 13), fill=C[p])


def thit_xuong(d, m, p):
    """Mieng thit con xuong tho ra."""
    d.ellipse((3, 6, 18, 19), fill=C[m])
    d.ellipse((6, 9, 15, 16), fill=C[p])
    d.line((16, 10, 21, 5), fill=C['W'], width=3)
    d.ellipse((19, 3, 23, 7), fill=C['W'])


def beefsteak(d, m, p):
    """Tang thit day, co vien mo trang."""
    d.rounded_rectangle((3, 6, 21, 18), radius=4, fill=C[m])
    d.rounded_rectangle((6, 9, 18, 15), radius=3, fill=C[p])
    d.arc((3, 6, 21, 18), 20, 160, fill=C['kem'], width=2)


def vien_thit(d, m, p):
    """Ba vien thit tron xep dia."""
    d.ellipse((2, 15, 22, 21), fill=C['W'])
    d.ellipse((3, 9, 11, 17), fill=C[m])
    d.ellipse((12, 9, 20, 17), fill=C[m])
    d.ellipse((7, 4, 15, 12), fill=C[p])


def canh_ga(d, m, p):
    """Hai canh chien xep cheo."""
    for dx in (0, 7):
        d.ellipse((3 + dx, 5, 11 + dx, 15), fill=C[m])
        d.line((7 + dx, 14, 7 + dx, 20), fill=C['W'], width=2)
    d.ellipse((7, 8, 12, 12), fill=C[p])


def dia_thuc_an(d, m, p):
    """Dia thuc an: nen dia trang, do dun len o giua."""
    d.ellipse((1, 12, 23, 21), fill=C['W'])
    d.ellipse((3, 13, 21, 20), fill=C['S'])
    d.ellipse((4, 6, 20, 17), fill=C[m])
    d.ellipse((8, 8, 14, 12), fill=C[p])


def to_sup(d, m, p):
    """To sup boc hoi."""
    d.ellipse((2, 9, 22, 13), fill=C[m])
    d.polygon([(2, 11), (22, 11), (18, 21), (6, 21)], fill=C['W'])
    d.ellipse((3, 8, 21, 13), fill=C[p])
    d.arc((9, 1, 15, 8), 90, 270, fill=C['S'], width=1)


def ly_kem(d, m, p):
    """Ly kem/pudding, co chop kem tren mieng ly."""
    d.polygon([(5, 10), (19, 10), (17, 21), (7, 21)], fill=C['W'])
    d.polygon([(5, 10), (19, 10), (18, 15), (6, 15)], fill=C[m])
    d.ellipse((6, 5, 18, 12), fill=C[p])


def trung(d, m, p):
    """Hai qua trung."""
    d.ellipse((2, 8, 13, 20), fill=C[m])
    d.ellipse((11, 4, 22, 17), fill=C[m])
    d.ellipse((14, 7, 19, 12), fill=C[p])


def la(d, m, p):
    """Nam la xoe."""
    for ax, ay, bx, by in ((2, 10, 14, 20), (6, 4, 18, 14), (10, 10, 22, 20)):
        d.ellipse((ax, ay, bx, by), fill=C[m])
    d.line((8, 18, 16, 8), fill=C[p], width=1)


def hoa(d, m, p):
    """Bong hoa nam canh."""
    for dx, dy in ((0, -6), (6, -2), (4, 5), (-4, 5), (-6, -2)):
        d.ellipse((9 + dx, 10 + dy, 15 + dx, 16 + dy), fill=C[m])
    d.ellipse((9, 10, 15, 16), fill=C[p])


def cu(d, m, p):
    """Cu co la: than thuon, ngon la o tren."""
    d.polygon([(8, 6), (16, 6), (13, 21), (11, 21)], fill=C[m])
    d.ellipse((5, 2, 12, 8), fill=C['xanh'])
    d.ellipse((12, 2, 19, 8), fill=C['xanh_d'])
    d.line((10, 10, 14, 10), fill=C[p])
    d.line((10, 14, 13, 14), fill=C[p])


def cu_qua(d, m, p):
    """Chum cu tron."""
    d.ellipse((2, 10, 12, 21), fill=C[m])
    d.ellipse((12, 10, 22, 21), fill=C[m])
    d.ellipse((7, 4, 17, 15), fill=C[p])
    d.line((12, 4, 12, 1), fill=C['xanh'], width=2)


def vo_cay(d, m, p):
    """Mieng vo cay cuon."""
    d.polygon([(4, 4), (18, 6), (20, 20), (6, 18)], fill=C[m])
    for y in (8, 12, 16):
        d.line((6, y, 18, y + 1), fill=C[p])


def bo(d, m, p):
    """Thoi bo cat mot lat."""
    d.polygon([(3, 9), (17, 5), (21, 9), (21, 17), (7, 21), (3, 17)], fill=C[m])
    d.polygon([(3, 9), (17, 5), (21, 9), (7, 13)], fill=C[p])


def mo(d, m, p):
    """Cuc mo hai thuy co tia sang — de khoi nhin giong qua trung op la."""
    d.ellipse((2, 9, 14, 21), fill=C[m])
    d.ellipse((10, 6, 22, 18), fill=C[m])
    d.ellipse((12, 8, 18, 13), fill=C[p])
    d.ellipse((5, 13, 9, 17), fill=C[p])
    for ax, ay, bx, by in ((4, 2, 8, 6), (17, 19, 21, 23)):
        d.line((ax, (ay + by) // 2, bx, (ay + by) // 2), fill=C['W'])
        d.line(((ax + bx) // 2, ay, (ax + bx) // 2, by), fill=C['W'])


def tui_bot(d, m, p):
    """Tui bot buoc mieng."""
    d.polygon([(5, 9), (19, 9), (21, 21), (3, 21)], fill=C[m])
    d.rectangle((8, 6, 16, 10), fill=C[p])
    d.line((12, 2, 12, 6), fill=C['nau_d'], width=2)


def tinh_the(d, m, p):
    """Nhum tinh the (muoi)."""
    d.polygon([(6, 20), (9, 8), (12, 20)], fill=C[m])
    d.polygon([(12, 20), (16, 4), (20, 20)], fill=C[p])
    d.polygon([(2, 20), (5, 13), (8, 20)], fill=C[m])


def ot(d, m, p):
    """Qua ot co cuong."""
    d.polygon([(9, 6), (15, 8), (16, 16), (12, 21), (8, 16)], fill=C[m])
    d.polygon([(10, 8), (13, 9), (13, 15), (11, 18)], fill=C[p])
    d.line((12, 6, 12, 2), fill=C['xanh_d'], width=2)
    d.line((9, 3, 15, 3), fill=C['xanh'], width=2)


def khoai_chien(d, m, p):
    """Hop khoai chien."""
    d.polygon([(5, 12), (19, 12), (17, 22), (7, 22)], fill=C['do'])
    for x in (6, 10, 14, 18):
        d.line((x, 12, x - 1, 3), fill=C[m], width=2)
    d.rectangle((5, 12, 19, 15), fill=C[p])


def taco(d, m, p):
    """Vo taco gap doi, co nhan."""
    d.pieslice((3, 6, 21, 24), 180, 360, fill=C[m])
    d.arc((3, 6, 21, 24), 180, 360, fill=C['nau_d'], width=2)
    d.ellipse((6, 8, 12, 13), fill=C[p])
    d.ellipse((12, 8, 18, 13), fill=C['xanh'])


def cuon(d, m, p):
    """Hai khuc cuon cat ngang."""
    d.ellipse((2, 8, 12, 19), fill=C[m])
    d.ellipse((4, 10, 10, 17), fill=C[p])
    d.ellipse((12, 6, 22, 17), fill=C[m])
    d.ellipse((14, 8, 20, 15), fill=C[p])


def chai(d, m, p):
    """Chai nuoc co nut."""
    d.rounded_rectangle((6, 9, 18, 21), radius=3, fill=C[m])
    d.rectangle((10, 4, 14, 10), fill=C[m])
    d.rectangle((9, 2, 15, 5), fill=C['nau'])
    d.rectangle((8, 13, 16, 19), fill=C[p])


def long_vu(d, m, p):
    """Chiec long vu."""
    d.polygon([(18, 3), (21, 6), (8, 19), (4, 21), (6, 17)], fill=C[m])
    d.line((18, 4, 5, 20), fill=C[p])
    for i in range(4):
        d.line((16 - i * 3, 5 + i * 3, 12 - i * 3, 6 + i * 3), fill=C[p])


def dia_hong(d, m, p):
    """Mon hong: dia do an am mau, boc khoi doc."""
    d.ellipse((1, 12, 23, 21), fill=C['S'])
    d.ellipse((4, 7, 20, 17), fill=C[m])
    d.ellipse((8, 9, 14, 13), fill=C[p])
    for x in (8, 15):
        d.arc((x - 2, 1, x + 2, 7), 90, 270, fill=C[p], width=1)


# ==== 47 mon: slug -> (hinh, mau chinh, mau phu) ====
MON = {
    # Mon nau chin
    'cheesecake':        (banh_lat, 'kem', 'vang'),
    'mille_feuille':     (banh_lat, 'nau_n', 'kem'),
    'phyllo':            (banh_lat, 'vang', 'kem'),
    'pie':               (banh_tron, 'nau', 'vang_d'),
    'honey_cake':        (banh_tron, 'vang_d', 'vang'),
    'pancakes':          (chong_banh, 'nau_n', 'vang'),
    'crepes':            (chong_banh, 'kem', 'vang'),
    'cream_puffs':       (banh_su, 'nau_n', 'kem'),
    'pastry':            (banh_su, 'vang', 'hong'),
    'croissants':        (sung_bo, 'vang_d', 'vang'),
    'pretzels':          (banh_quy_bap, 'nau', 'W'),
    'pita':              (banh_mi, 'nau_n', 'nau_d'),
    'rub_chicken':       (thit_xuong, 'vang_d', 'cam'),
    'flamehorn_shank':   (thit_xuong, 'do_d', 'do'),
    'rub_ribs':          (thit_xuong, 'nau', 'do'),
    'rub_steak':         (beefsteak, 'do_d', 'do'),
    'rub_pork_chops':    (beefsteak, 'hong', 'do'),
    'meatballs':         (vien_thit, 'nau_d', 'nau'),
    'wings':             (canh_ga, 'cam', 'vang'),
    'hash':              (dia_thuc_an, 'nau_n', 'cam'),
    'mashed_potatoes':   (dia_thuc_an, 'kem', 'vang'),
    'potato_casserole':  (dia_thuc_an, 'vang_d', 'do'),
    'potato_fries':      (khoai_chien, 'vang', 'W'),
    'shell_tacos':       (taco, 'vang_d', 'do'),
    'zestroot_wraps':    (cuon, 'xanh_n', 'do'),
    'souffle':           (ly_kem, 'kem', 'nau_n'),
    'pudding':           (ly_kem, 'nau_d', 'kem'),
    # Nguyen lieu
    'mistflour_eggs':    (trung, 'W', 'kem'),
    'field_greens':      (la, 'xanh', 'xanh_d'),
    'beastmoss':         (la, 'xanh_d', 'luc'),
    'moo_bloom':         (hoa, 'W', 'vang'),
    'sweetroot':         (cu, 'cam', 'vang'),
    'stonefruit_bulbs':  (cu_qua, 'nau_n', 'kem'),
    'root_beast_bark':   (vo_cay, 'nau_d', 'nau'),
    'suncrust_butter':   (bo, 'vang', 'kem'),
    'glowfat':           (mo, 'kem', 'vang'),
    'meal_dust':         (tui_bot, 'nau_n', 'kem'),
    'spice_dust':        (tui_bot, 'do_d', 'cam'),
    'crackle_salt':      (tinh_the, 'W', 'S'),
    'starpepper':        (ot, 'do', 'do_d'),
    'sky_feather':       (long_vu, 'lam', 'W'),
    'zestsap':           (chai, 'luc', 'xanh_n'),
    'alpha_seep':        (chai, 'tim', 'tim_d'),
    # Mon hong: an vao mat mau, nen nhin phai thay ghe
    'bite_of_despair':   (dia_hong, 'tim_d', 'tim'),
    'dread_omelette':    (dia_hong, 'xam_d', 'luc'),
    'inferno_custard':   (dia_hong, 'do_d', 'cam'),
    'whispersoup':       (to_sup, 'tim_d', 'tim'),
}


def main():
    ra = 'assets/items'
    os.makedirs(ra, exist_ok=True)
    # CHI ve nhung mon game that su co: mkitems.py doc db/item roi ghi ra
    # js/data/items.js. Ve bua ca bang thi thua ra mot dong anh cua nhung mon
    # da bo (nguyen lieu nau an, may mon "nau hong") — nam trong kho khong ai
    # goi tới.
    co = set()
    try:
        with open('js/data/items.js', encoding='utf-8') as f:
            co = set(re.findall(r'^  ([a-z0-9_]+): \{', f.read(), re.M))
    except OSError:
        pass
    n = 0
    for slug, (ve, m, p) in sorted(MON.items()):
        if co and slug not in co:
            continue
        n += 1
        im, d = moi()
        ve(d, m, p)
        vien(im)
        im.resize((N * SCALE, N * SCALE), Image.NEAREST).save(
            os.path.join(ra, slug + '.png'), optimize=True)
    print('OK: %d icon món ăn -> %s' % (n, ra))


if __name__ == '__main__':
    main()
