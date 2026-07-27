# -*- coding: utf-8 -*-
"""Chep ANH GIAO DIEN cua Tuxemon vao du an.

Chay:  python3 tools/mkui.py <duong-dan-kho-Tuxemon>

Nguon: https://github.com/Tuxemon/Tuxemon — anh CC BY-SA 4.0.

Ghi de:
  assets/ui/<ten>.png        icon menu (tui do, nhat ky, nhan vat, cai dat...)
  assets/ui/range/<ten>.png  tam danh cua chieu (melee/touch/ranged/reach/reliable)
  assets/ui/status/<ten>.png icon trang thai (bong, doc, ngu, te, bang)

Anh goc rat be (16x16, 9x9) — man hinh dien thoai co 3 diem anh vat ly cho 1
diem anh CSS nen phong len 4 lan bang NEAREST, trinh duyet thu nho lai van net.
Chi chep NHUNG ANH GAME NAY THAT SU DUNG, khong do het thu muc vao kho.
"""
import os
import sys

from PIL import Image

SCALE = 4

# Icon menu: ten trong game -> tep ben Tuxemon (gfx/ui/menu)
# 'player' cua ban goc la bong nguoi den thui, dat len nen toi cua game nay thi
# chim nghim nen KHONG lay — cho do van dung hinh ve SVG.
MENU = {
    'bag': 'backpack',        # Tui do
    'book': 'journal',        # Tuxedex
    'gear': 'settings',       # Cai dat
    'team': 'tuxemon',        # Doi hinh
}

# Tam danh cua chieu (gfx/ui/icons/range)
RANGES = ['melee', 'touch', 'ranged', 'reach', 'reliable']

# Trang thai game dang dung -> icon ben Tuxemon (gfx/ui/icons/status)
STATUS = {
    'brn': 'icon_burn',
    'psn': 'icon_poison',
    'slp': 'icon_dozing',
    'par': 'icon_lockdown',      # te liet -> khong cua quay duoc
    'frz': 'icon_stuck',         # dong bang -> dinh cung mot cho
}


def copy_scaled(src, dst):
    im = Image.open(src).convert('RGBA')
    im.resize((im.width * SCALE, im.height * SCALE), Image.NEAREST).save(dst, optimize=True)


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    root = sys.argv[1]
    ui = os.path.join(root, 'mods/tuxemon/gfx/ui')
    if not os.path.isdir(ui):
        raise SystemExit('Khong thay %s — dua vao duong dan goc kho Tuxemon.' % ui)

    n = 0
    thieu = []
    os.makedirs('assets/ui/range', exist_ok=True)
    os.makedirs('assets/ui/status', exist_ok=True)

    for name, src in MENU.items():
        p = os.path.join(ui, 'menu', src + '.png')
        if os.path.exists(p):
            copy_scaled(p, 'assets/ui/%s.png' % name)
            n += 1
        else:
            thieu.append(src)

    for r in RANGES:
        p = os.path.join(ui, 'icons/range', r + '.png')
        if os.path.exists(p):
            copy_scaled(p, 'assets/ui/range/%s.png' % r)
            n += 1
        else:
            thieu.append(r)

    for name, src in STATUS.items():
        p = os.path.join(ui, 'icons/status', src + '.png')
        if os.path.exists(p):
            copy_scaled(p, 'assets/ui/status/%s.png' % name)
            n += 1
        else:
            thieu.append(src)

    print('OK: %d anh giao dien' % n)
    if thieu:
        print('  (khong thay: %s — cho nao thieu anh thi game van dung icon SVG)' % ', '.join(thieu))


if __name__ == '__main__':
    main()
