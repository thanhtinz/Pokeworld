# -*- coding: utf-8 -*-
"""Cat SPRITE PHUONG TIEN cho he thong xe co.

Chay:  python3 tools/mkmounts.py <duong-dan-kho-Tuxemon>

Ghi de:
  assets/mounts/<id>_<huong>.png   bon huong cua tung chiec xe
  js/data/vehicles.js              bang xe + gia + toc do (SINH MAY, dung sua tay)

Nguon: 'Car,_Black_by_Isaiah658' nam trong core_outdoor.png cua Tuxemon
(CC BY-SA 4.0, xem CREDITS.md). Sheet nay ve san chiec xe theo bon huong nen
lay thang, khong phai tu ve.

Ba mau xe deu tu MOT chiec goc: hai chiec sau son lai PHAN THAN. Than xe la
mau xam sam (bao hoa thap, do sang trung binh) nen nhan ra duoc; kinh thi xanh
lo (bao hoa cao), banh va vien thi den (rat toi), den pha thi trang — ba thu
do deu de nguyen.

Truoc day cho nay xoay hue toan bo diem anh bao hoa cao, ket qua la chi doi
mau KINH con than xe van den nguyen — ba chiec nhin y het nhau.
"""
import colorsys
import json
import os
import sys

from PIL import Image

SCALE = 3
TILE = 16

# Khung tren core_outdoor.png, tinh bang O (cot0, hang0, cot1, hang1)
KHUNG_XE = {
    'up':    (14, 42, 16, 45),
    'down':  (14, 45, 16, 48),
    'right': (17, 42, 20, 45),
    'left':  (17, 45, 20, 48),
}

# (id, ten, gia, he so toc do, mau than (hue 0-1), mo ta)
XE = [
    ('xe_den', 'Xe Hơi Đen', 60000, 1.55, None,
     'Chiếc xe phổ thông, đi nhanh hơn đi bộ kha khá.'),
    ('xe_do', 'Xe Thể Thao Đỏ', 150000, 1.75, 0.99,
     'Máy khoẻ hơn, phóng một cái là tới nơi.'),
    ('xe_xanh', 'Xe Điện Xanh', 260000, 1.95, 0.56,
     'Chạy êm và nhanh nhất — đắt thì phải khác chứ.'),
]


V_THAN = (0.10, 0.58)          # khoang do sang cua vo xe
S_THAN = 0.28                  # tren nguong nay la kinh/den, khong phai vo


def son_lai(im, hue):
    """Son lai than xe sang mau khac, giu nguyen kinh - banh - den pha."""
    ra = im.copy()
    px = ra.load()
    for y in range(ra.height):
        for x in range(ra.width):
            r, g, b, a = px[x, y]
            if a < 20:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s >= S_THAN or not (V_THAN[0] <= v <= V_THAN[1]):
                continue
            # Giu nguyen do sang tuong doi cua tung tam vo -> van con khoi
            r2, g2, b2 = colorsys.hsv_to_rgb(hue, 0.72, min(1.0, v * 1.55 + 0.12))
            px[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    return ra


def js(v):
    return json.dumps(v, ensure_ascii=False)


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    root = sys.argv[1]
    p = os.path.join(root, 'mods/tuxemon/gfx/tilesets/core_outdoor.png')
    if not os.path.exists(p):
        raise SystemExit('Khong thay %s' % p)
    sheet = Image.open(p).convert('RGBA')
    os.makedirs('assets/mounts', exist_ok=True)

    goc = {}
    for huong, (c0, r0, c1, r1) in KHUNG_XE.items():
        con = sheet.crop((c0 * TILE, r0 * TILE, c1 * TILE, r1 * TILE))
        bb = con.split()[3].getbbox()
        goc[huong] = con.crop(bb) if bb else con

    out = ['// TuxeWorld H5 | data/vehicles.js | Phương tiện — SINH TỰ ĐỘNG bởi tools/mkmounts.py',
           '// KHONG SUA TAY. Ảnh cắt từ core_outdoor.png của Tuxemon (CC BY-SA 4.0).',
           '',
           '// speed = hệ số nhân tốc độ đi bộ. img = ảnh theo bốn hướng.',
           'export const VEHICLES = [']
    for vid, ten, gia, toc, xoay, mo in XE:
        anh = {}
        for huong, im in goc.items():
            ra = son_lai(im, xoay) if xoay is not None else im
            ten_tep = '%s_%s.png' % (vid, huong)
            ra.resize((ra.width * SCALE, ra.height * SCALE), Image.NEAREST).save(
                os.path.join('assets/mounts', ten_tep), optimize=True)
            anh[huong] = 'assets/mounts/' + ten_tep
        out.append('  { id: %s, name: %s, price: %d, speed: %s, desc: %s, img: %s },'
                   % (js(vid), js(ten), gia, js(toc), js(mo), js(anh)))
    out += ['];', '',
            'export const VEHICLE_BY_ID = Object.fromEntries(VEHICLES.map(v => [v.id, v]));',
            '']
    with open('js/data/vehicles.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(out))
    print('OK: %d phương tiện × 4 hướng' % len(XE))


if __name__ == '__main__':
    main()
