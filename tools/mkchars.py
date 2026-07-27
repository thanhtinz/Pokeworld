# -*- coding: utf-8 -*-
"""Ghep sprite nhan vat tu bo Mana Seed Character Base (ban demo MIEN PHI).

Chay:  python3 tools/mkchars.py <thu-muc-giai-nen-ban-demo>
Vi du: python3 tools/mkchars.py /tmp/FREE.Mana.Seed.Character.Base.Demo.2.0

Bo goc la he "paper doll": than the, quan ao, toc nam o cac file rieng, xep
chong len nhau theo thu tu 0bas -> 1out -> 4har -> 5hat. Cong cu nay ghep san
thanh MOT anh cho moi nhan vat de game khong phai xep 4 lop luc chay.

Trang p1 goc: 512x512, khung 64x64, 8 cot x 8 hang.
  hang 0-3 = dung yen (cot 0), day/keo/nhay o cac cot sau
  hang 4-7 = di bo, 6 khung (cot 0-5)
  thu tu hang: xuong / len / phai / trai

Anh xuat: 448x256 = 7 cot x 4 hang khung 64x64
  cot 0     = dung yen
  cot 1-6   = di bo
  hang 0..3 = xuong / len / phai / trai

CHU Y GIAY PHEP: chi lay tu ban demo mien phi (file "this is only a demo.txt"
ghi ro "You may use this demo asset commercially or non-commercially").
Cac goi tra phi cua Mana Seed KHONG duoc chep vao kho nay.
"""
import os
import sys
from PIL import Image

CELL = 64
SRC_COLS = 8
OUT_COLS = 7          # 1 khung dung yen + 6 khung di bo

# Nhan vat: (ma, lop than, lop quan ao, lop toc, lop mu)
CHARS = {
    # 'red' = ao xanh quan xanh, toc nau; 'leaf' = ao do, toc nau
    'red':  ('char_a_p1_0bas_humn_v01', 'char_a_p1_1out_pfpn_v01',
             'char_a_p1_4har_dap1_v11', None),
    'leaf': ('char_a_p1_0bas_humn_v02', 'char_a_p1_1out_fstr_v01',
             'char_a_p1_4har_bob1_v11', None),
}

LAYER_DIR = {'0bas': '', '1out': '1out', '4har': '4har', '5hat': '5hat'}


def find(root, stem):
    """Tim file theo ten khong duong dan — bo goc chia thu muc theo lop."""
    code = stem.split('_')[3]              # 0bas / 1out / 4har / 5hat
    path = os.path.join(root, 'char_a_p1', LAYER_DIR[code], stem + '.png')
    if not os.path.exists(path):
        raise SystemExit('Khong thay %s' % path)
    return Image.open(path).convert('RGBA')


def build(root, layers):
    sheets = [find(root, s) for s in layers if s]
    out = Image.new('RGBA', (CELL * OUT_COLS, CELL * 4), (0, 0, 0, 0))
    for row in range(4):
        # cot 0 cua anh xuat = khung dung yen (hang row, cot 0 cua anh goc)
        # cot 1..6 = 6 khung di bo (hang row+4, cot 0..5)
        srcs = [(row, 0)] + [(row + 4, c) for c in range(6)]
        for i, (sr, sc) in enumerate(srcs):
            box = (sc * CELL, sr * CELL, sc * CELL + CELL, sr * CELL + CELL)
            frame = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
            for sh in sheets:
                frame.alpha_composite(sh.crop(box))
            out.paste(frame, (i * CELL, row * CELL))
    return out


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    root = sys.argv[1]
    demo = os.path.join(root, 'this is only a demo.txt')
    if not os.path.exists(demo):
        raise SystemExit(
            'Thu muc nay khong phai ban demo mien phi (thieu "this is only a demo.txt").\n'
            'Chi duoc dung ban demo — goi tra phi khong duoc chep vao kho.')
    os.makedirs('assets/char', exist_ok=True)
    for cid, layers in CHARS.items():
        img = build(root, layers)
        path = 'assets/char/%s.png' % cid
        img.save(path, optimize=True)
        print('%s  %dx%d  %d byte' % (path, img.width, img.height, os.path.getsize(path)))


if __name__ == '__main__':
    main()
