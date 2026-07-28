#!/usr/bin/env python3
# TuxeWorld H5 | tools/mkgear.py | Ve trang bi cho Tuxemon + sinh js/data/gear.js
#
# Sau nay muon thay bang art that thi chi phai doi mot cho: bo ham ve di, tro
# DUONG_ANH sang thu muc anh moi. Bang so lieu (chi so, gia, bac sao) khong dinh
# gi toi cach ve.
#
# VI SAO TU VE
# Tuxemon khong co art trang bi (kho gfx chi co vat pham, sinh vat, ban do).
# Cac bo icon CC0 ngoai (OpenGameArt...) thi may nay khong tai ve duoc — chinh
# sach mang cua moi truong chan het tru npm/pypi/github. Nen ve bang hinh khoi
# co ban, y het cach lam cua tools/mkicons.py va tools/mkfood.py.
#
# NANG SAO LA DOI HINH
# Moi mon co NAM ban ve, mot ban cho moi bac sao. Khong phai doi mau cho co le:
#   1 sao  hang tran, khong vien
#   2 sao  vien dong
#   3 sao  vien bac + mot vien da xanh
#   4 sao  vien vang + da do + gai nhon moc ra
#   5 sao  than do sang mau tim, vien vang, da tim to, hao quang quanh mon
import os

from PIL import Image, ImageDraw

SCALE = 3
N = 32                       # canh anh goc, x3 = 96px cho khop icon vat pham

TRONG = (0, 0, 0, 0)
VIEN = (28, 22, 44, 255)

# ==== Bang mau ====
# Ba dong trang bi, moi dong mot tong mau rieng
HO = {
    'vai':  {'ten': 'Vải',  'suc': 1.0, 'gia': 1,
             'm': (168, 120, 80, 255), 'd': (112, 74, 44, 255), 's': (214, 178, 132, 255)},
    'sat':  {'ten': 'Sắt',  'suc': 1.7, 'gia': 4,
             'm': (150, 158, 178, 255), 'd': (92, 100, 124, 255), 's': (206, 214, 232, 255)},
    'rong': {'ten': 'Rồng', 'suc': 2.6, 'gia': 12,
             'm': (150, 58, 64, 255), 'd': (96, 32, 42, 255), 's': (208, 110, 104, 255)},
}

# Bac sao: vien, da quy, gai nhon, hao quang, va co doi mau than hay khong
SAO = {
    1: {'vien': None,                 'da': None,                 'gai': 0, 'hao': 0, 'tim': 0},
    2: {'vien': (196, 132, 58, 255),  'da': None,                 'gai': 0, 'hao': 0, 'tim': 0},
    3: {'vien': (214, 222, 238, 255), 'da': (96, 168, 240, 255),  'gai': 0, 'hao': 0, 'tim': 0},
    4: {'vien': (240, 196, 72, 255),  'da': (232, 86, 64, 255),   'gai': 1, 'hao': 0, 'tim': 0},
    5: {'vien': (240, 196, 72, 255),  'da': (176, 120, 255, 255), 'gai': 1, 'hao': 1, 'tim': 1},
}

HAO_QUANG = (196, 156, 255, 255)


def pha(mau, dich, t):
    """Tron mau goc voi mau dich theo ti le t — dung cho ban 5 sao."""
    return tuple(round(a + (b - a) * t) for a, b in zip(mau[:3], dich[:3])) + (255,)


def bang_mau(ho, sao):
    h = HO[ho]
    m, d, s = h['m'], h['d'], h['s']
    if SAO[sao]['tim']:
        tim = (150, 96, 224, 255)
        m, d, s = pha(m, tim, .62), pha(d, tim, .55), pha(s, tim, .5)
    return {'m': m, 'd': d, 's': s, **SAO[sao]}


def moi():
    im = Image.new('RGBA', (N, N), TRONG)
    return im, ImageDraw.Draw(im)


def vien_ngoai(im):
    """Vien mot diem anh quanh phan da to — cho khoi mau co net bao."""
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
        px[x, y] = VIEN


def hao_quang(d, p):
    """Sau cham sang quanh mon — chi ban 5 sao moi co."""
    if not p['hao']:
        return
    for x, y in ((3, 4), (28, 5), (2, 17), (29, 18), (6, 28), (25, 27)):
        d.rectangle((x, y, x + 1, y + 1), fill=HAO_QUANG)


def gai(d, p, cho):
    """Gai nhon moc tren mon — tu 4 sao tro len."""
    if not p['gai']:
        return
    for x, y in cho:
        d.polygon([(x - 2, y), (x, y - 5), (x + 2, y)], fill=p['vien'])


def da_quy(d, p, x, y, r=3):
    if not p['da']:
        return
    d.ellipse((x - r, y - r, x + r, y + r), fill=p['da'])
    d.point((x - 1, y - 1), fill=(255, 255, 255, 255))


# ==== Sau kieu trang bi. Toa do tinh tren luoi 32x32 ====

def ve_mu(d, p):
    gai(d, p, [(11, 8), (21, 8)])
    d.pieslice((6, 5, 26, 27), 180, 360, fill=p['m'])     # vom mu
    d.rectangle((6, 16, 26, 21), fill=p['m'])
    d.rectangle((3, 20, 29, 25), fill=p['d'])             # vanh mu
    d.rectangle((10, 16, 22, 19), fill=p['d'])            # khe nhin
    d.rectangle((8, 8, 12, 15), fill=p['s'])              # bat sang
    if p['vien']:
        d.rectangle((3, 20, 29, 21), fill=p['vien'])
        d.arc((6, 5, 26, 27), 180, 360, fill=p['vien'])
    da_quy(d, p, 16, 11)
    hao_quang(d, p)


def ve_ao(d, p):
    gai(d, p, [(8, 9), (24, 9)])
    d.polygon([(6, 9), (12, 6), (20, 6), (26, 9), (26, 26), (6, 26)], fill=p['m'])
    d.polygon([(12, 6), (16, 13), (20, 6)], fill=p['d'])  # co ao chu V
    d.rectangle((6, 9, 9, 26), fill=p['d'])
    d.rectangle((23, 9, 26, 26), fill=p['d'])
    d.rectangle((11, 15, 14, 25), fill=p['s'])            # vet sang giua nguc
    if p['vien']:
        d.line((6, 26, 26, 26), fill=p['vien'], width=2)
        d.line((6, 9, 12, 6), fill=p['vien'], width=1)
        d.line((20, 6, 26, 9), fill=p['vien'], width=1)
    da_quy(d, p, 16, 18, 4)
    hao_quang(d, p)


def ve_vai(d, p):
    gai(d, p, [(10, 8), (17, 6), (24, 8)])
    d.pieslice((4, 4, 28, 26), 180, 360, fill=p['m'])     # tam giap tren
    d.rectangle((4, 15, 28, 18), fill=p['d'])
    d.pieslice((6, 14, 26, 30), 180, 360, fill=p['m'])    # tam giap duoi
    d.rectangle((6, 22, 26, 25), fill=p['d'])
    d.pieslice((9, 20, 23, 32), 180, 360, fill=p['s'])
    if p['vien']:
        d.arc((4, 4, 28, 26), 180, 360, fill=p['vien'])
        d.arc((6, 14, 26, 30), 180, 360, fill=p['vien'])
    da_quy(d, p, 16, 11)
    hao_quang(d, p)


def ve_tay(d, p):
    gai(d, p, [(9, 12), (22, 14)])
    for i, x in enumerate((9, 13, 17)):                           # ba ngon tay
        d.rounded_rectangle((x, 3 + i % 2, x + 2, 11), radius=1, fill=p['m'])
        d.line((x, 4 + i % 2, x, 10), fill=p['s'])
    d.rounded_rectangle((7, 10, 21, 21), radius=2, fill=p['m'])   # ban tay
    d.polygon([(21, 12), (25, 14), (25, 18), (21, 19)], fill=p['d'])   # ngon cai
    d.rectangle((6, 21, 24, 27), fill=p['d'])                     # co tay
    d.rectangle((6, 21, 24, 22), fill=p['s'])
    if p['vien']:
        d.rectangle((6, 26, 24, 27), fill=p['vien'])
        d.rounded_rectangle((7, 10, 21, 21), radius=2, outline=p['vien'])
    da_quy(d, p, 14, 16)
    hao_quang(d, p)


def ve_giay(d, p):
    gai(d, p, [(12, 8)])
    d.rectangle((9, 6, 20, 22), fill=p['m'])              # ong giay
    d.polygon([(9, 18), (20, 18), (28, 24), (28, 28), (6, 28), (6, 22)], fill=p['m'])
    d.rectangle((6, 26, 28, 28), fill=p['d'])             # de giay
    d.rectangle((9, 6, 20, 9), fill=p['d'])               # mieng ong
    d.rectangle((11, 11, 14, 17), fill=p['s'])
    if p['vien']:
        d.rectangle((6, 25, 28, 26), fill=p['vien'])
        d.rectangle((9, 6, 20, 7), fill=p['vien'])
    da_quy(d, p, 22, 23)
    hao_quang(d, p)


def ve_phu(d, p):
    # Day chuyen: vong day + mat da treo o giua
    d.arc((6, 3, 26, 23), 190, 350, fill=p['m'], width=3)
    d.arc((7, 4, 25, 22), 200, 340, fill=p['s'], width=1)
    gai(d, p, [(11, 17), (21, 17)])
    d.polygon([(16, 13), (24, 20), (16, 29), (8, 20)], fill=p['m'])   # mat treo
    d.polygon([(16, 16), (21, 20), (16, 26), (11, 20)], fill=p['d'])
    if p['vien']:
        d.line((16, 13, 24, 20), fill=p['vien'])
        d.line((24, 20, 16, 29), fill=p['vien'])
        d.line((16, 29, 8, 20), fill=p['vien'])
        d.line((8, 20, 16, 13), fill=p['vien'])
    da_quy(d, p, 16, 21, 4 if p['da'] else 3)
    hao_quang(d, p)


def ve_da_cuong(d):
    """Da cuong hoa: manh da lua hinh thoi, co van sang."""
    d.polygon([(16, 2), (27, 14), (16, 30), (5, 14)], fill=(232, 128, 56, 255))
    d.polygon([(16, 6), (23, 14), (16, 25), (9, 14)], fill=(250, 196, 96, 255))
    d.polygon([(16, 10), (19, 15), (16, 21), (13, 15)], fill=(255, 246, 200, 255))


def ve_da_sao(d):
    """Da ngoi sao: ngoi sao nam canh long trong vien tron."""
    d.ellipse((3, 3, 28, 28), fill=(96, 64, 168, 255))
    d.ellipse((6, 6, 25, 25), fill=(150, 110, 232, 255))
    d.polygon([(16, 5), (19, 13), (28, 13), (21, 18), (24, 27),
               (16, 22), (8, 27), (11, 18), (4, 13), (13, 13)],
              fill=(250, 224, 120, 255))
    d.polygon([(16, 10), (18, 15), (23, 15), (19, 18), (20, 23),
               (16, 20), (12, 23), (13, 18), (9, 15), (14, 15)],
              fill=(255, 250, 214, 255))


# ==== Sau o trang bi: o nao cong chi so nao ====
# Chia deu sau chi so cua Tuxemon, moi o mot chi so, khong o nao trung o nao.
O = [
    # ma      ten          chi so     ve       goc   gia goc
    ('mu',   'Mũ',        'dodge',   ve_mu,   12,   1200),
    ('ao',   'Áo Giáp',   'armour',  ve_ao,   16,   1600),
    ('vai',  'Giáp Vai',  'hp',      ve_vai,  45,   1400),
    ('tay',  'Găng Tay',  'melee',   ve_tay,  14,   1300),
    ('giay', 'Giày',      'speed',   ve_giay, 12,   1100),
    ('phu',  'Trang Sức', 'ranged',  ve_phu,  14,   1500),
]

DUONG_ANH = 'assets/gear'


def js(v):
    import json
    return json.dumps(v, ensure_ascii=False)


def main():
    os.makedirs(DUONG_ANH, exist_ok=True)
    for f in os.listdir(DUONG_ANH):
        if f.endswith('.png'):
            os.remove(os.path.join(DUONG_ANH, f))

    # Hai loai da nang cap (engine/gear.js dung ten nay)
    for ten, ve in (('da_cuong', ve_da_cuong), ('da_sao', ve_da_sao)):
        im, d = moi()
        ve(d)
        vien_ngoai(im)
        im.resize((N * SCALE, N * SCALE), Image.NEAREST).save(
            os.path.join(DUONG_ANH, ten + '.png'), optimize=True)

    mon = []
    for o, ten_o, chi_so, ve, goc, gia_goc in O:
        for ho, h in HO.items():
            ma = '%s_%s' % (o, ho)
            for sao in sorted(SAO):
                im, d = moi()
                ve(d, bang_mau(ho, sao))
                vien_ngoai(im)
                im.resize((N * SCALE, N * SCALE), Image.NEAREST).save(
                    os.path.join(DUONG_ANH, '%s_%d.png' % (ma, sao)), optimize=True)
            mon.append({
                'id': ma, 'o': o, 'ho': ho,
                'name': '%s %s' % (ten_o, h['ten']),
                'stat': chi_so,
                'base': round(goc * h['suc']),
                'gia': round(gia_goc * h['gia'] / 100) * 100,
            })

    dong = [
        '// TuxeWorld H5 | data/gear.js | Trang bị cho Tuxemon',
        '// SINH TU DONG boi tools/mkgear.py — KHONG SUA TAY.',
        '//',
        '// Mỗi món có NĂM ảnh, một ảnh cho mỗi bậc sao: nâng sao là món đổi hình',
        '// hẳn chứ không chỉ đổi con số (1 sao hàng trần → 5 sao thân tím, viền',
        '// vàng, đá quý to, hào quang quanh món).',
        '//',
        '// base = chỉ số cộng thêm lúc 1 sao +0. Công thức đủ nằm ở engine/gear.js.',
        '',
        'export const O_TRANG_BI = [',
    ]
    for o, ten_o, chi_so, _, _, _ in O:
        dong.append('  { id: %s, name: %s, stat: %s },' % (js(o), js(ten_o), js(chi_so)))
    dong += ['];', '',
             'export const HO_TRANG_BI = {']
    for ho, h in HO.items():
        dong.append('  %s: { name: %s, suc: %s },' % (ho, js(h['ten']), h['suc']))
    dong += ['};', '',
             '// Ảnh theo bậc sao: anhGear(id, sao)',
             "export const anhGear = (id, sao) =>",
             "  `%s/${id}_${Math.max(1, Math.min(%d, sao || 1))}.png`;" % (DUONG_ANH, max(SAO)),
             '',
             'export const SAO_TOI_DA = %d;' % max(SAO),
             '',
             'export const GEAR = [']
    for m in mon:
        dong.append('  { id: %s, o: %s, ho: %s, name: %s, stat: %s, base: %d, gia: %d },'
                    % (js(m['id']), js(m['o']), js(m['ho']), js(m['name']),
                       js(m['stat']), m['base'], m['gia']))
    dong += ['];', '',
             'export const GEAR_BY_ID = Object.fromEntries(GEAR.map(g => [g.id, g]));',
             'export const O_BY_ID = Object.fromEntries(O_TRANG_BI.map(o => [o.id, o]));',
             '']
    with open('js/data/gear.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(dong))

    print('OK: %d món trang bị × %d bậc sao = %d ảnh -> %s'
          % (len(mon), max(SAO), len(mon) * max(SAO), DUONG_ANH))


if __name__ == '__main__':
    main()
