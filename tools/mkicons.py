# -*- coding: utf-8 -*-
"""Ve BO ICON GIAO DIEN kieu pixel cho TuxeWorld.

Chay:  python3 tools/mkicons.py

Ghi de: assets/ui/icon/<ten>.png  (16x16 phong 4 lan = 64x64)

VI SAO CO TEP NAY
Icon menu truoc day ve bang SVG net manh, dat canh anh pixel cua Tuxemon (ba lo,
nhat ky, doi hinh...) thi le tong hoan toan — cai thi net vien mong, cai thi khoi
mau day. Bo icon nay ve o 16x16 dung bang mau cua game roi vien mot diem anh
toi, nen dat canh art cua Tuxemon la ăn nhap.

Tat ca deu TU VE bang hinh khoi co ban (khong lay lai anh cua game nao khac).
"""
import os

from PIL import Image, ImageDraw

SCALE = 4
N = 16                     # canh anh goc

# Bang mau lay tu css/style.css cho khop giao dien
C = {
    'o': (27, 22, 48, 255),        # vien toi
    'W': (232, 234, 245, 255),     # trang nga
    'S': (150, 155, 185, 255),     # xam nhat
    'G': (240, 180, 41, 255),      # vang
    'g': (179, 130, 26, 255),      # vang dam
    'R': (240, 90, 54, 255),       # cam do
    'r': (184, 60, 34, 255),       # cam do dam
    'B': (106, 156, 240, 255),     # xanh duong
    'b': (63, 102, 173, 255),
    'E': (79, 191, 106, 255),      # xanh la
    'e': (47, 128, 70, 255),
    'P': (155, 123, 255, 255),     # tim
    'p': (106, 79, 208, 255),
    'K': (0, 0, 0, 0),             # trong suot
}


def moi():
    im = Image.new('RGBA', (N, N), C['K'])
    return im, ImageDraw.Draw(im)


def vien(im, mau='o'):
    """Vien mot diem anh quanh toan bo phan da to — cho khoi mau co net bao."""
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


# ==== Tung icon: ve bang hinh khoi, toa do tinh tren luoi 16x16 ====

def ve_coin(d):
    d.ellipse((2, 2, 13, 13), fill=C['G'])
    d.ellipse((3, 3, 12, 12), outline=C['g'])
    # Ky hieu tien te ₽: cham tay tung diem cho net khong bi mo o co 16px
    for x, y in [(6, 4), (7, 4), (8, 4),
                 (6, 5), (9, 5),
                 (6, 6), (9, 6),
                 (6, 7), (7, 7), (8, 7),
                 (5, 8), (6, 8), (7, 8), (8, 8),
                 (6, 9), (6, 10), (6, 11)]:
        d.point((x, y), fill=C['g'])


def ve_map(d):
    # ba manh ban do gap lai, manh giua tut xuong
    d.polygon([(1, 4), (5, 2), (5, 12), (1, 14)], fill=C['E'])
    d.polygon([(5, 2), (10, 4), (10, 14), (5, 12)], fill=C['e'])
    d.polygon([(10, 4), (14, 2), (14, 12), (10, 14)], fill=C['E'])
    d.line((7, 6, 8, 9), fill=C['W'])       # duong di
    d.point((8, 11), fill=C['R'])


def ve_chat(d):
    d.rounded_rectangle((2, 3, 13, 11), radius=2, fill=C['B'])
    d.polygon([(4, 11), (8, 11), (4, 14)], fill=C['B'])
    for x in (5, 7, 9):
        d.point((x, 7), fill=C['W'])


def ve_gift(d):
    d.rectangle((3, 6, 12, 13), fill=C['R'])
    d.rectangle((2, 4, 13, 6), fill=C['r'])
    d.rectangle((7, 4, 8, 13), fill=C['G'])   # no ruy bang
    d.polygon([(7, 4), (4, 1), (3, 4)], fill=C['G'])
    d.polygon([(8, 4), (11, 1), (12, 4)], fill=C['G'])


def ve_quest(d):
    d.rounded_rectangle((3, 2, 12, 14), radius=1, fill=C['W'])
    d.rectangle((5, 1, 10, 3), fill=C['S'])
    for y in (6, 9, 12):
        d.line((5, y, 6, y + 1), fill=C['E'])
        d.line((6, y + 1, 8, y - 1), fill=C['E'])
        d.line((9, y, 11, y), fill=C['S'])


def ve_shop(d):
    d.rectangle((2, 7, 13, 14), fill=C['W'])
    d.rectangle((6, 10, 9, 14), fill=C['b'])   # cua ra vao
    # mai hien soc
    for i, x in enumerate(range(1, 15, 2)):
        d.rectangle((x, 3, x + 1, 6), fill=C['R'] if i % 2 == 0 else C['W'])
    d.rectangle((1, 3, 14, 3), fill=C['r'])


def ve_trophy(d):
    d.polygon([(4, 2), (11, 2), (10, 8), (5, 8)], fill=C['G'])
    d.arc((1, 2, 5, 7), 90, 270, fill=C['g'])
    d.arc((10, 2, 14, 7), 270, 90, fill=C['g'])
    d.rectangle((7, 8, 8, 11), fill=C['g'])
    d.rectangle((4, 12, 11, 14), fill=C['g'])


def ve_guild(d):
    d.polygon([(8, 1), (14, 4), (14, 9), (8, 15), (2, 9), (2, 4)], fill=C['P'])
    d.line((5, 8, 7, 10), fill=C['W'])
    d.line((7, 10, 11, 5), fill=C['W'])


def ve_friends(d):
    # nguoi dung sau (ben phai) ve truoc de nguoi truoc de len tren
    d.ellipse((9, 3, 13, 7), fill=C['E'])
    d.pieslice((8, 8, 15, 16), 180, 360, fill=C['e'])
    d.ellipse((2, 4, 7, 9), fill=C['B'])
    d.pieslice((1, 9, 9, 18), 180, 360, fill=C['b'])


def ve_heart(d):
    d.ellipse((2, 3, 8, 9), fill=C['R'])
    d.ellipse((7, 3, 13, 9), fill=C['R'])
    d.polygon([(2, 7), (13, 7), (8, 14), (7, 14)], fill=C['R'])
    d.point((5, 5), fill=C['W'])


def ve_flag(d):
    d.rectangle((2, 1, 3, 15), fill=C['S'])
    d.rectangle((1, 14, 5, 15), fill=C['S'])            # chan cot
    # la co bay: hai mep luon song cho co dang
    d.polygon([(4, 2), (14, 2), (12, 5), (14, 8), (4, 8)], fill=C['R'])
    d.polygon([(4, 5), (13, 5), (12, 6), (13, 8), (4, 8)], fill=C['r'])


def ve_server(d):
    d.ellipse((2, 2, 13, 13), fill=C['B'])
    d.ellipse((2, 2, 13, 13), outline=C['b'])
    d.line((2, 7, 13, 7), fill=C['b'])
    d.arc((5, 2, 10, 13), 0, 360, fill=C['b'])
    d.point((11, 4), fill=C['W'])


def ve_heal(d):
    d.rectangle((6, 2, 9, 13), fill=C['E'])
    d.rectangle((2, 6, 13, 9), fill=C['E'])
    d.rectangle((7, 3, 8, 4), fill=C['W'])


def ve_battle(d):
    d.line((3, 2, 11, 11), fill=C['S'], width=1)
    d.line((4, 2, 12, 11), fill=C['W'], width=1)
    d.polygon([(10, 11), (13, 14), (11, 14)], fill=C['r'])
    d.line((12, 2, 4, 11), fill=C['S'], width=1)
    d.line((11, 2, 3, 11), fill=C['W'], width=1)
    d.polygon([(5, 11), (2, 14), (4, 14)], fill=C['r'])


def ve_mail(d):
    d.rectangle((1, 3, 14, 12), fill=C['W'])
    d.rectangle((1, 3, 14, 12), outline=C['S'])
    # nap thu gap chu V
    d.line((1, 3, 8, 8), fill=C['S'])
    d.line((8, 8, 14, 3), fill=C['S'])
    d.line((1, 4, 8, 9), fill=C['S'])
    d.line((8, 9, 14, 4), fill=C['S'])


def ve_bell(d):
    d.pieslice((3, 2, 12, 12), 180, 360, fill=C['G'])
    d.rectangle((3, 7, 12, 11), fill=C['G'])
    d.rectangle((2, 11, 13, 12), fill=C['g'])
    d.rectangle((7, 0, 8, 2), fill=C['g'])       # quai chuong
    d.rectangle((6, 13, 9, 14), fill=C['g'])     # qua lac
    d.line((5, 4, 5, 9), fill=C['W'])            # danh sang


def ve_ball(d):
    # Tuxeball cua ban goc: dia trang-xanh co khe chu thap, KHONG phai qua
    # do-trang cua Pokemon
    d.ellipse((2, 2, 13, 13), fill=C['W'])
    d.ellipse((4, 4, 11, 11), fill=C['B'])
    d.ellipse((6, 6, 9, 9), fill=C['b'])
    d.line((8, 2, 8, 5), fill=C['W'])
    d.line((8, 10, 8, 13), fill=C['W'])
    d.line((2, 8, 5, 8), fill=C['W'])
    d.line((10, 8, 13, 8), fill=C['W'])


def ve_star(d):
    # ngoi sao 5 canh cho the huan luyen vien — anh 'stars' cua ban goc la chum
    # lap lanh, thu nho con 14px thi khong doc ra la may sao
    d.polygon([(8, 1), (10, 6), (15, 6), (11, 9), (13, 14),
               (8, 11), (3, 14), (5, 9), (1, 6), (6, 6)], fill=C['G'])
    d.polygon([(8, 3), (9, 7), (12, 7), (9, 9)], fill=C['W'])


def ve_walk(d):
    d.ellipse((6, 1, 9, 4), fill=C['W'])
    d.polygon([(6, 5), (9, 5), (10, 9), (7, 9)], fill=C['B'])
    d.line((7, 9, 5, 14), fill=C['b'], width=1)
    d.line((9, 9, 11, 14), fill=C['b'], width=1)
    d.line((9, 6, 12, 7), fill=C['B'], width=1)


ICONS = {
    'coin': ve_coin, 'map': ve_map, 'chat': ve_chat, 'gift': ve_gift,
    'quest': ve_quest, 'shop': ve_shop, 'trophy': ve_trophy, 'guild': ve_guild,
    'friends': ve_friends, 'heart': ve_heart, 'flag': ve_flag,
    'server': ve_server, 'heal': ve_heal, 'battle': ve_battle, 'walk': ve_walk, 'star': ve_star, 'ball': ve_ball,
    'mail': ve_mail, 'bell': ve_bell,
}


def main():
    out = 'assets/ui/icon'
    os.makedirs(out, exist_ok=True)
    for ten, ve in sorted(ICONS.items()):
        im, d = moi()
        ve(d)
        vien(im)
        im.resize((N * SCALE, N * SCALE), Image.NEAREST).save(
            os.path.join(out, ten + '.png'), optimize=True)
    print('OK: %d icon giao dien pixel -> %s' % (len(ICONS), out))


if __name__ == '__main__':
    main()
