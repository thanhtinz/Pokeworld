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
    'exit': 'exit',           # Thoat / dang xuat
    'save': 'save',           # Luu
}

# Anh 'player' cua ban goc la bong nguoi DEN THUI. Dat len nen tim than cua game
# nay thi chim nghim, nen doi mau sang cho hop — CC BY-SA cho phep sua, ban sua
# cung theo CC BY-SA (xem CREDITS.md).
DOI_MAU = {'person': ('player', (241, 237, 255))}

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


# Icon menu cua ban goc moi tep mot kieu le: 'backpack' an het 16x16, 'player'
# chi an 12x12 giua khung. Dat canh icon SVG (net nam trong 24x24 chua ~83%)
# thi cai to cai be, nhin nhu bi lech. Cat sat net roi dem lai cho MOI icon an
# dung TI_LE_MUC phan khung -> ca bo bang nhau, tam quang hoc trung nhau.
TI_LE_MUC = 0.83


def copy_menu_icon(src, dst, im=None):
    im = (im or Image.open(src)).convert('RGBA')
    bb = im.split()[3].getbbox() or (0, 0, im.width, im.height)
    muc = im.crop(bb)
    # Khung dich: canh dai cua net chiem dung TI_LE_MUC, phan con lai la le
    canh = max(muc.width, muc.height)
    khung = int(round(canh / TI_LE_MUC))
    ra = Image.new('RGBA', (khung, khung), (0, 0, 0, 0))
    ra.paste(muc, ((khung - muc.width) // 2, (khung - muc.height) // 2))
    ra.resize((khung * SCALE, khung * SCALE), Image.NEAREST).save(dst, optimize=True)


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
            copy_menu_icon(p, 'assets/ui/%s.png' % name)
            n += 1
        else:
            thieu.append(src)

    for ten, (goc, mau) in DOI_MAU.items():
        p2 = os.path.join(ui, 'menu', goc + '.png')
        if os.path.exists(p2):
            im = Image.open(p2).convert('RGBA')
            px = im.load()
            for y in range(im.height):
                for x in range(im.width):
                    r, g, b, a = px[x, y]
                    if a == 0:
                        continue
                    # Giu do dam nhat cua net goc, chi doi tong mau
                    k = 1 - (r + g + b) / 765
                    px[x, y] = (int(mau[0] * k), int(mau[1] * k), int(mau[2] * k), a)
            copy_menu_icon(None, 'assets/ui/%s.png' % ten, im)
            n += 1
        else:
            thieu.append(goc)

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

    # Hoa van hiem (flair) cua ban goc — db/flair/flairs.yaml. Ban nay dung
    # 'stars' lam dau hieu con hiem, thay cho nhan SHINY tu che.
    os.makedirs('assets/ui/flair', exist_ok=True)
    for fl in ('stars',):
        p_fl = os.path.join(root, 'mods/tuxemon/gfx/sprites/flairs/common', fl + '.png')
        if os.path.exists(p_fl):
            copy_scaled(p_fl, 'assets/ui/flair/%s.png' % fl)
            n += 1
        else:
            thieu.append('flair:' + fl)

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
