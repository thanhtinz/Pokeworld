# -*- coding: utf-8 -*-
"""Ve BO QUA TANG cho he thong diem than mat.

Chay:  python3 tools/mkgifts.py

Ghi de:
  assets/gifts/<id>.png      anh mon qua (24x24 phong 4 lan)
  js/data/gifts.js           bang qua cho phia nguoi choi
  server/src/gifts.data.js   BAN SAO cho may chu

Vi sao ghi hai tep: may chu phai tu biet mon qua nao dang gia bao nhieu diem,
khong the tin con so client gui len. Hai tep sinh tu CUNG mot bang duoi day
nen khong bao gio lech nhau.

Anh deu TU VE bang hinh khoi co ban — Tuxemon khong co san sprite hoa/nhan.
"""
import json
import os

from PIL import Image, ImageDraw

SCALE = 4
N = 24

C = {
    'o': (27, 22, 48, 255),
    'W': (245, 246, 252, 255),
    'S': (168, 172, 198, 255),
    's': (110, 114, 140, 255),
    'G': (240, 180, 41, 255),
    'g': (179, 130, 26, 255),
    'R': (232, 62, 74, 255),
    'r': (168, 34, 48, 255),
    'P': (240, 128, 190, 255),
    'p': (196, 78, 148, 255),
    'E': (79, 191, 106, 255),
    'e': (44, 122, 68, 255),
    'B': (106, 156, 240, 255),
    'N': (138, 92, 52, 255),
    'n': (94, 60, 32, 255),
    'C': (150, 230, 245, 255),
}


def moi():
    im = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def vien(im):
    """Vien mot diem anh mau toi quanh phan da ve, cho net tren nen bat ky."""
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
        px[x, y] = C['o']


def cuong(d, x0, y0):
    """Mot canh hoa + cuong, dung lai cho ca bong le lan bo hoa."""
    d.line((x0, y0 + 4, x0, y0 + 11), fill=C['e'], width=1)
    d.line((x0, y0 + 7, x0 - 2, y0 + 9), fill=C['E'], width=1)
    d.line((x0, y0 + 8, x0 + 2, y0 + 10), fill=C['E'], width=1)


def ve_hoa_hong(d):
    cuong(d, 12, 8)
    d.ellipse((8, 5, 16, 13), fill=C['R'])
    d.ellipse((10, 7, 14, 11), fill=C['r'])
    d.point((11, 8), fill=C['W'])


def ve_bo_hoa(d):
    for x, mau in ((8, C['R']), (12, C['P']), (16, C['G'])):
        d.line((12, 20, x, 10), fill=C['e'], width=1)
        d.ellipse((x - 3, 5, x + 3, 11), fill=mau)
        d.ellipse((x - 1, 7, x + 1, 9), fill=C['W'])
    d.polygon([(8, 18), (16, 18), (14, 23), (10, 23)], fill=C['N'])


def ve_socola(d):
    d.rounded_rectangle((3, 7, 21, 19), radius=2, fill=C['n'])
    d.rounded_rectangle((3, 5, 21, 15), radius=2, fill=C['N'])
    for x in (8, 13, 18):
        d.line((x, 5, x, 15), fill=C['n'], width=1)
    d.line((3, 10, 21, 10), fill=C['n'], width=1)


def ve_gau_bong(d):
    d.ellipse((5, 3, 10, 8), fill=C['N'])
    d.ellipse((14, 3, 19, 8), fill=C['N'])
    d.ellipse((6, 4, 18, 15), fill=C['N'])
    d.ellipse((9, 9, 15, 14), fill=C['S'])
    d.point((10, 8), fill=C['o'])
    d.point((14, 8), fill=C['o'])
    d.ellipse((8, 15, 16, 21), fill=C['N'])
    d.ellipse((4, 15, 8, 20), fill=C['n'])
    d.ellipse((16, 15, 20, 20), fill=C['n'])


def ve_hop_qua(d):
    d.rectangle((3, 9, 21, 21), fill=C['R'])
    d.rectangle((2, 6, 22, 10), fill=C['r'])
    d.rectangle((10, 6, 14, 21), fill=C['G'])
    d.ellipse((6, 2, 12, 7), fill=C['G'])
    d.ellipse((12, 2, 18, 7), fill=C['G'])


def _nhan(d, vong, da):
    d.ellipse((7, 11, 17, 21), outline=vong, width=2)
    d.polygon([(12, 3), (16, 8), (12, 12), (8, 8)], fill=da)
    d.polygon([(12, 3), (14, 8), (12, 10)], fill=C['W'])


def ve_nhan_bac(d):
    _nhan(d, C['S'], C['C'])


def ve_nhan_vang(d):
    _nhan(d, C['G'], C['R'])


def ve_nhan_kim_cuong(d):
    _nhan(d, C['G'], C['W'])
    d.point((12, 6), fill=C['C'])
    d.point((10, 20), fill=C['W'])


# (id, ten, gia, diem than mat, mo ta, ham ve)
QUA = [
    ('hoa_hong', 'Bông Hồng', 500, 50,
     'Một bông thôi, nhưng ngày nào cũng tặng thì khác hẳn.', ve_hoa_hong),
    ('bo_hoa', 'Bó Hoa', 1400, 150,
     'Bó ba màu, cầm sang nhà người ta là thấy sáng cả gian.', ve_bo_hoa),
    ('socola', 'Sô-cô-la', 2400, 260,
     'Ngọt vừa phải, hợp mấy hôm trời lạnh.', ve_socola),
    ('gau_bong', 'Gấu Bông', 4500, 500,
     'To gần bằng cái gối. Ai nhận cũng cười.', ve_gau_bong),
    ('hop_qua', 'Hộp Quà', 8000, 900,
     'Không nói trong hộp có gì — thế mới là quà.', ve_hop_qua),
    ('nhan_bac', 'Nhẫn Bạc', 16000, 1800,
     'Bắt đầu nghiêm túc rồi đấy.', ve_nhan_bac),
    ('nhan_vang', 'Nhẫn Vàng', 34000, 4000,
     'Món này tặng là người ta hiểu ý.', ve_nhan_vang),
    ('nhan_kim_cuong', 'Nhẫn Kim Cương', 85000, 10000,
     'Đủ để hỏi một câu quan trọng.', ve_nhan_kim_cuong),
]

# Ngưỡng điểm thân mật mới cầu hôn được
MOC_KET_HON = 10000
# Mỗi cặp mỗi ngày nhận tối đa ngần này món — tặng nữa vẫn được, chỉ hết điểm
QUA_MOI_NGAY = 20


def js(v):
    return json.dumps(v, ensure_ascii=False)


def bang():
    return [{'id': i, 'name': t, 'price': g, 'diem': d, 'desc': m}
            for i, t, g, d, m, _ in QUA]


def main():
    os.makedirs('assets/gifts', exist_ok=True)
    for qid, _t, _g, _d, _m, ve in QUA:
        im, d = moi()
        ve(d)
        vien(im)
        im.resize((N * SCALE, N * SCALE), Image.NEAREST).save(
            'assets/gifts/%s.png' % qid, optimize=True)

    dong = ['export const MOC_KET_HON = %d;' % MOC_KET_HON,
            'export const QUA_MOI_NGAY = %d;' % QUA_MOI_NGAY,
            '',
            'export const GIFTS = [']
    for q in bang():
        dong.append('  { id: %s, name: %s, price: %d, diem: %d, desc: %s, img: %s },'
                    % (js(q['id']), js(q['name']), q['price'], q['diem'], js(q['desc']),
                       js('assets/gifts/%s.png' % q['id'])))
    dong += ['];', '',
             'export const GIFT_BY_ID = Object.fromEntries(GIFTS.map(q => [q.id, q]));',
             '']

    dau = ['// TuxeWorld H5 | data/gifts.js | Quà tặng — SINH TỰ ĐỘNG bởi tools/mkgifts.py',
           '// KHONG SUA TAY. Ảnh tự vẽ, không lấy từ kho nào.',
           '']
    with open('js/data/gifts.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(dau + dong))

    dau2 = ['// TuxeWorld server | src/gifts.data.js | BẢN SAO của js/data/gifts.js',
            '// SINH TỰ ĐỘNG bởi tools/mkgifts.py — KHONG SUA TAY.',
            '// Máy chủ phải tự biết mỗi món đáng bao nhiêu điểm, không tin số client gửi lên.',
            '']
    # Giu y het phan than cho hai ben khong the lech nhau (truong img thua
    # ben may chu nhung khong hai gi, doi lai la mot ban sao dung nghia)
    with open('server/src/gifts.data.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(dau2 + dong))
    print('OK: %d món quà' % len(QUA))


if __name__ == '__main__':
    main()
