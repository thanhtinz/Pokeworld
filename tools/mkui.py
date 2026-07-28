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

# Bong bong cam xuc tren dau NPC (gfx/bubbles) — chep het, ban do dung nhieu loai
BUBBLES = ['angry', 'confused', 'dots', 'drop', 'exclamation', 'fireworks',
           'heart', 'money', 'note', 'question', 'sleep', 'tuxeball']

# Icon nho trong gfx/ui/icons: chep nguyen thu muc, doi ten cho de goi
# party  : cham tron bao con trong doi (trong / khoe / dinh trang thai / da guc)
# bond   : trai tim do than thiet
# plusminus: dau + / - khi chi so len xuong trong tran
ICON_DIRS = {
    'party': {'party_empty': 'empty', 'party_icon01': 'alive',
              'party_icon02': 'status', 'party_icon03': 'faint'},
    'bond': {'bond1': '1', 'bond2': '2', 'bond3': '3', 'bond4': '4'},
    'plusminus': {'plus': 'plus', 'minus': 'minus'},
    # mui ten toc do cua chieu: -3..+3 (db.py SpeedLabel)
    'speed': {'extremely_slow': '-3', 'very_slow': '-2', 'slow': '-1',
              'normal': '0', 'fast': '1', 'very_fast': '2', 'extremely_fast': '3'},
}

# Icon trang thai: chep het theo dung slug ben ban goc (js/data/statuses.js)


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

    for thu_muc, ten_moi in ICON_DIRS.items():
        d = os.path.join(ui, 'icons', thu_muc)
        if not os.path.isdir(d):
            thieu.append(thu_muc)
            continue
        os.makedirs('assets/ui/%s' % thu_muc, exist_ok=True)
        for goc, moi in ten_moi.items():
            p2 = os.path.join(d, goc + '.png')
            if os.path.exists(p2):
                copy_scaled(p2, 'assets/ui/%s/%s.png' % (thu_muc, moi))
                n += 1
            else:
                thieu.append(goc)

    os.makedirs('assets/ui/bubble', exist_ok=True)
    for bname in BUBBLES:
        p = os.path.join(root, 'mods/tuxemon/gfx/bubbles', bname + '.png')
        if os.path.exists(p):
            copy_scaled(p, 'assets/ui/bubble/%s.png' % bname)
            n += 1
        else:
            thieu.append(bname)

    for f in sorted(os.listdir(os.path.join(ui, 'icons/status'))):
        if not f.startswith('icon_') or not f.endswith('.png'):
            continue
        slug = f[len('icon_'):-len('.png')]
        copy_scaled(os.path.join(ui, 'icons/status', f), 'assets/ui/status/%s.png' % slug)
        n += 1

    print('OK: %d anh giao dien' % n)
    if thieu:
        print('  (khong thay: %s — cho nao thieu anh thi game van dung icon SVG)' % ', '.join(thieu))


if __name__ == '__main__':
    main()
