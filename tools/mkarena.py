# -*- coding: utf-8 -*-
"""Ve nen tran dau cua rieng du an (khong dung anh cat tu game khac).

Chay:  python3 tools/mkarena.py

Ghi de:
  assets/arena/<kieu>_bg.png        nen troi + dat, 320x480 (man doc)
  assets/arena/<kieu>_base_me.png   be dung cua minh
  assets/arena/<kieu>_base_foe.png  be dung cua doi thu

Truoc day bo nay cat tu kho asset cua PokeRogue. Ve lai bang code cho dong bo
voi bang mau cua game va khong phai muon anh cua ai.
"""
import os

from PIL import Image, ImageDraw

# Khung tran dau cua game la MAN DOC, nen nen cung ve doc luon; ve ngang roi
# keo gian ra thi troi va dat bi bet thanh hai vet mau to.
W, H = 320, 480
HORIZON = 212         # duong chan troi

# kieu: (troi tren, troi duoi, dat tren, dat duoi, mau be, vien be)
THEMES = {
    'grass':      ((124, 190, 245), (198, 231, 250), (108, 186, 96), (62, 132, 62),
                   (126, 200, 108), (72, 140, 74)),
    'tall_grass': ((104, 172, 236), (176, 218, 246), (84, 162, 78), (44, 110, 52),
                   (104, 180, 92), (58, 122, 62)),
    'forest':     ((92, 148, 196), (150, 196, 214), (66, 132, 74), (34, 88, 48),
                   (86, 150, 86), (46, 100, 54)),
    'cave':       ((44, 40, 66), (74, 66, 96), (86, 76, 96), (48, 42, 60),
                   (104, 94, 116), (62, 54, 76)),
    'lake':       ((116, 186, 240), (186, 226, 248), (86, 160, 214), (46, 108, 168),
                   (120, 190, 226), (66, 130, 180)),
    'beach':      ((132, 198, 246), (206, 236, 250), (238, 216, 160), (206, 176, 118),
                   (240, 222, 172), (198, 168, 116)),
    'town':       ((120, 184, 238), (200, 228, 248), (140, 178, 120), (96, 138, 88),
                   (150, 186, 130), (100, 142, 92)),
}


def vgrad(d, x0, y0, x1, y1, top, bot):
    """To dan mau tu tren xuong."""
    h = max(1, y1 - y0)
    for i in range(h):
        t = i / h
        d.line([(x0, y0 + i), (x1, y0 + i)],
               fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bot)))


def make_bg(name, th):
    sky_t, sky_b, gr_t, gr_b = th[0], th[1], th[2], th[3]
    im = Image.new('RGBA', (W, H))
    d = ImageDraw.Draw(im)
    vgrad(d, 0, 0, W, HORIZON, sky_t, sky_b)
    vgrad(d, 0, HORIZON, W, H, gr_t, gr_b)
    # Vai vet sang mo cho mat dat do phang. ImageDraw ve len anh RGBA la GHI DE
    # ca alpha, ve mau nua trong suot se thanh vet toi -> pha mau san roi ve dac.
    for i in range(HORIZON + 24, H, 34):
        t = (i - HORIZON) / max(1, H - HORIZON)
        base = tuple(round(a + (b - a) * t) for a, b in zip(gr_t, gr_b))
        d.line([(0, i), (W, i)], fill=tuple(min(255, c + 8) for c in base))
    im.save('assets/arena/%s_bg.png' % name, optimize=True)


def make_base(name, th, w, h, out):
    """Be dung: mot hinh bau duc det co vien."""
    face, edge = th[4], th[5]
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse([0, 0, w - 1, h - 1], fill=edge)
    d.ellipse([2, 2, w - 3, h - 5], fill=face)
    # Vien sang o mep tren cho co khoi
    d.arc([2, 2, w - 3, h - 5], 180, 360, fill=tuple(min(255, c + 26) for c in face), width=2)
    im.save(out, optimize=True)


def main():
    os.makedirs('assets/arena', exist_ok=True)
    for name, th in THEMES.items():
        make_bg(name, th)
        make_base(name, th, 128, 34, 'assets/arena/%s_base_foe.png' % name)
        make_base(name, th, 140, 38, 'assets/arena/%s_base_me.png' % name)
    print('OK: %d bộ nền trận đấu' % len(THEMES))


if __name__ == '__main__':
    main()
