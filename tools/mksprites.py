# -*- coding: utf-8 -*-
"""Chep sprite nhan vat + NPC cua Tuxemon vao du an.

Chay:  python3 tools/mksprites.py <duong-dan-kho-Tuxemon>
Phai chay SAU tools/mkworld.py.

Nguon: https://github.com/Tuxemon/Tuxemon — anh CC BY-SA 4.0.

Ghi de:
  assets/ow/       sprite di tren ban do, 48x128 = 3 cot x 4 hang o 16x32
                   hang 0 xuong · 1 trai · 2 phai · 3 len
  assets/trainers/ anh 2D dung trong tran dau va hoi thoai, 64x64
                   (bo goc la 128x64 gom mat sau + mat truoc, lay mat truoc)

Chi chep NHUNG SPRITE THAT SU DUOC DUNG (bang MAP_SPRITE ben duoi) chu khong
do het 208 + 357 tep vao kho cho nang.
"""
import os
import re
import shutil
import sys

# Ten dung trong game -> ten tep ben Tuxemon.
# Moi vai chon theo dung nghe nghiep / vai tro, khong lay dai.
MAP_SPRITE = {
    # Nhan vat nguoi choi
    'red': 'adventurer',
    'leaf': 'heroine',
    # Huan luyen vien
    'youngster': 'childactor',
    'lass': 'girl1',
    'bug_catcher': 'picnicker',
    'camper': 'adventurer_green',
    'camper_f': 'heroine_brown',
    'swimmer_f': 'swimmer',
    'swimmer_m': 'swimmer_blue',
    'picnicker': 'florist',
    'rocket_m': 'xerogrunt',
    'rocket_f': 'xerogrunt_red',
    'hiker': 'miner',
    'scientist': 'scientist',
    'brock': 'knight',
    'misty': 'swimmer_green',
    # NPC tren ban do — dat ten theo VAI TRO, moi vai mot sprite rieng
    'professor': 'professor',
    'scientist': 'scientist',
    'kid': 'childactor_blonde',
    'kid2': 'childactor_brown',
    'florist': 'florist',
    'bugcatcher': 'disciple',
    'grunt': 'xerogrunt',
    'grunt_f': 'xerogrunt_red',
    'miner': 'miner',
    'swimmer': 'swimmer',
    'chief': 'ceo',
    'lady': 'fashionista',
    'sailor': 'riverboatcaptain',
    'nurse': 'nurse',
    'clerk': 'shopkeeper',
    'rogue': 'rogue',
    'boss': 'boss',
}


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    root = sys.argv[1]
    ow_src = os.path.join(root, 'mods/tuxemon/sprites')
    tr_src = os.path.join(root, 'mods/tuxemon/gfx/sprites/player')
    if not os.path.isdir(ow_src):
        raise SystemExit('Khong thay %s' % ow_src)

    from PIL import Image
    os.makedirs('assets/ow', exist_ok=True)
    os.makedirs('assets/trainers', exist_ok=True)

    # Xoa sprite cu de khong con lai tep thua cua bo Pokemon
    for d in ('assets/ow', 'assets/trainers'):
        for f in os.listdir(d):
            if f.endswith('.png'):
                os.remove(os.path.join(d, f))

    n_ow = n_tr = 0
    missing = []
    for name, slug in sorted(MAP_SPRITE.items()):
        src = os.path.join(ow_src, slug + '.png')
        if os.path.exists(src):
            shutil.copyfile(src, 'assets/ow/%s.png' % name)
            n_ow += 1
        else:
            missing.append('ow:' + slug)

        # Anh 2D: bo goc 128x64 gom mat sau (trai) + mat truoc (phai)
        p = os.path.join(tr_src, slug + '.png')
        if os.path.exists(p):
            im = Image.open(p).convert('RGBA')
            face = im.crop((im.width // 2, 0, im.width, im.height)) if im.width >= 128 else im
            face.save('assets/trainers/%s.png' % name, optimize=True)
            n_tr += 1
        elif os.path.exists(src):
            # Khong co anh 2D thi phong to khung "dung nhin xuong" cua sprite ban do
            im = Image.open(src).convert('RGBA')
            cell = im.crop((0, 0, im.width // 3, im.height // 4))
            big = cell.resize((cell.width * 2, cell.height * 2), Image.NEAREST)
            out = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
            out.alpha_composite(big, ((64 - big.width) // 2, 64 - big.height))
            out.save('assets/trainers/%s.png' % name, optimize=True)
            n_tr += 1
        else:
            missing.append('2d:' + slug)

    print('OK: %d sprite bản đồ, %d ảnh 2D' % (n_ow, n_tr))
    if missing:
        print('THIẾU:', ', '.join(missing))
    check_used()


def check_used():
    """Doi chieu: moi ten sprite ma du lieu game goi toi deu phai co tep."""
    need = set()
    for f in ('js/data/maps.js', 'js/data/trainers.js', 'js/data/story.js', 'tools/mkmaps.py'):
        if not os.path.exists(f):
            continue
        src = open(f, encoding='utf-8').read()
        need |= set(re.findall(r"sprite: ['\"]([a-z_0-9]+)['\"]", src))
        need |= set(re.findall(r"ow: ['\"]([a-z_0-9]+)['\"]", src))
        need |= set(re.findall(r"img: ['\"]([a-z_0-9]+)['\"]", src))
    have_ow = {f[:-4] for f in os.listdir('assets/ow')}
    have_tr = {f[:-4] for f in os.listdir('assets/trainers')}
    miss_ow = sorted(need - have_ow)
    miss_tr = sorted(need - have_tr)
    if miss_ow:
        print('CHUA CO sprite bản đồ cho:', ', '.join(miss_ow))
    if miss_tr:
        print('CHUA CO ảnh 2D cho:', ', '.join(miss_tr))
    if not miss_ow and not miss_tr:
        print('Mọi tên sprite dữ liệu gọi tới đều có tệp.')


if __name__ == '__main__':
    main()
