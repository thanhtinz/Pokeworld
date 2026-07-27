# -*- coding: utf-8 -*-
"""Dung nen tran dau tu anh nen cua Tuxemon.

Chay:  python3 tools/mkarena.py <duong-dan-kho-Tuxemon>

Nguon: https://github.com/Tuxemon/Tuxemon — gfx/ui/combat, CC BY-SA 4.0.

Ghi de:
  assets/arena/<kieu>_bg.png        nen doc 320x480

Khong con sinh "be dung" nua: Tuxemon goc khong ve be, con nao cung dung thang
tren nen, nen giao dien chi ve mot vet bong mem duoi chan bang CSS.

Anh goc cua Tuxemon la canh NGANG 256x108 (danh cho man ngang). Khung tran dau
cua game nay la MAN DOC, nen cong cu ghep lai: canh goc dat o phan tren, phan
duoi keo dai bang chinh hang pixel duoi cung cua canh do (thanh bai dat truoc
mat) va toi dan xuong cho co chieu sau. cai be cung lay tu chinh anh
nen nen nhin lien mot khoi.
"""
import os
import sys

from PIL import Image, ImageDraw

W, H = 320, 480

# kieu trong game -> ten anh nen ben Tuxemon
SCENES = {
    'grass': 'grass_background',
    'tall_grass': 'plain_background',
    'forest': 'forest_background',
    'cave': 'cave_background',
    'lake': 'sea_background',
    'beach': 'beach_background',
    'town': 'valley_background',
}


def build(src_path, name):
    scene = Image.open(src_path).convert('RGBA')
    top = scene.resize((W, round(scene.height * W / scene.width)), Image.NEAREST)

    out = Image.new('RGBA', (W, H))
    out.paste(top, (0, 0))

    # Keo dai mat dat bang hang pixel duoi cung
    strip = top.crop((0, top.height - 1, W, top.height)).resize((W, H - top.height), Image.NEAREST)
    out.paste(strip, (0, top.height))

    # To toi dan cho co chieu sau. PIL CHI pha alpha tren anh RGB — ve mau nua
    # trong suot thang len anh RGBA la ghi de, ca vung se thanh den.
    out = out.convert('RGB')
    d = ImageDraw.Draw(out, 'RGBA')
    for i in range(top.height, H):
        t = (i - top.height) / max(1, H - top.height)
        d.line([(0, i), (W, i)], fill=(0, 0, 0, int(38 * t)))

    out.save('assets/arena/%s_bg.png' % name, optimize=True)


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    gfx = os.path.join(sys.argv[1], 'mods/tuxemon/gfx/ui/combat')
    if not os.path.isdir(gfx):
        raise SystemExit('Khong thay %s' % gfx)

    os.makedirs('assets/arena', exist_ok=True)
    for f in os.listdir('assets/arena'):
        if f.endswith('.png'):
            os.remove(os.path.join('assets/arena', f))

    n = 0
    for name, scene in SCENES.items():
        src = os.path.join(gfx, scene + '.png')
        if not os.path.exists(src):
            print('THIEU:', scene)
            continue
        build(src, name)
        n += 1
    print('OK: %d bộ nền trận đấu' % n)


if __name__ == '__main__':
    main()
