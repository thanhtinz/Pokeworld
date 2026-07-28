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
SANG = (255, 255, 255, 110)


def pha(mau, dich, t):
    """Tron mau goc voi mau dich theo ti le t — dung cho ban 5 sao."""
    return tuple(round(a + (b - a) * t) for a, b in zip(mau[:3], dich[:3])) + (255,)


def bang_mau(ho, sao):
    h = HO[ho]
    m, d, s = h['m'], h['d'], h['s']
    if SAO[sao]['tim']:
        tim = (150, 96, 224, 255)
        m, d, s = pha(m, tim, .34), pha(d, tim, .30), pha(s, tim, .26)
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


def vien_trong(im, mau):
    """To mep TRONG cua hinh bang mau vien.

    Ve tay tung duong vien cho sau kieu do x nam bac sao thi vua dai vua de
    lech. Cach nay lay ngay duong bao that cua hinh da ve nen bac sao nao,
    kieu do nao cung ra net vien om sat.
    """
    if not mau:
        return
    px = im.load()
    mep = []
    for y in range(N):
        for x in range(N):
            if px[x, y][3] < 200:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < N and 0 <= ny < N) or px[nx, ny][3] < 200:
                    mep.append((x, y))
                    break
    for x, y in mep:
        px[x, y] = mau


def hao_quang(d, p):
    """Sau cham sang quanh mon — chi ban 5 sao moi co."""
    if not p['hao']:
        return
    for x, y in ((2, 6), (29, 7), (1, 18), (30, 19), (5, 29), (26, 28)):
        d.rectangle((x, y, x + 1, y + 1), fill=HAO_QUANG)
    for x, y in ((4, 11), (27, 12), (8, 30), (23, 30)):
        d.point((x, y), fill=HAO_QUANG)


def canh(d, p, tam_x, tam_y, rong=7):
    """Doi canh nho hai ben — tu 4 sao tro len.

    Ve o LOP DUOI mon do (xem main), khong thi canh de len giua mon, nhin
    thanh hai cuc vang chan het hinh.
    """
    if not p['gai']:
        return
    for h in (-1, 1):
        x = tam_x + h * rong
        d.polygon([(x - h, tam_y + 3),
                   (x + h * 2, tam_y - 2), (x + h * 4, tam_y - 4),
                   (x + h * 3, tam_y - 1),
                   (x + h * 6, tam_y - 2), (x + h * 4, tam_y + 1),
                   (x + h * 5, tam_y + 3), (x + h * 1, tam_y + 4)],
                  fill=p['vien'])


def da_quy(d, p, x, y, r=3):
    """Vien da: co be nen toi lam de, ruot sang, mot cham loe."""
    if not p['da']:
        return
    d.ellipse((x - r - 1, y - r - 1, x + r + 1, y + r + 1), fill=(38, 30, 56, 255))
    d.ellipse((x - r, y - r, x + r, y + r), fill=p['da'])
    d.ellipse((x - r + 1, y - r + 1, x, y), fill=SANG)
    d.point((x - 1, y - 1), fill=(255, 255, 255, 255))


# ==== Sau kieu trang bi ====
# Moi ham chi ve KHOI CHINH + do bong. Vien theo bac sao do vien_trong() lam
# sau, nen o day khong phai ke tay tung duong vien cho tung bac.

def ve_mu(d, p):
    """Mu tru: vom tron, chom long tren dinh, khe nhin va hai mieng che ma."""
    d.polygon([(9, 27), (9, 20), (23, 20), (23, 27), (19, 24), (13, 24)], fill=p['d'])
    d.pieslice((5, 5, 27, 29), 180, 360, fill=p['m'])      # vom mu
    d.rectangle((5, 17, 27, 21), fill=p['m'])
    d.polygon([(5, 17), (11, 6), (13, 6), (10, 21)], fill=p['s'])   # bat sang
    d.polygon([(21, 7), (26, 15), (26, 21), (23, 21)], fill=p['d'])  # bong toi
    d.rectangle((4, 20, 28, 24), fill=p['d'])              # vanh mu
    d.rectangle((4, 20, 28, 21), fill=p['s'])
    d.rectangle((10, 14, 22, 19), fill=(30, 24, 44, 255))  # khe nhin
    d.rectangle((15, 12, 17, 20), fill=p['m'])             # song mui
    d.rectangle((14, 2, 18, 8), fill=p['d'])               # de chom long
    d.polygon([(15, 4), (16, 0), (17, 4)], fill=p['s'])


def ve_ao(d, p):
    """Giap nguc: hai vai bau, eo thon, song giua, that lung o duoi."""
    than = [(3, 12), (6, 7), (11, 5), (16, 9), (21, 5), (26, 7), (29, 12),
            (26, 19), (24, 28), (8, 28), (6, 19)]
    d.polygon(than, fill=p['m'])
    d.polygon([(3, 12), (6, 7), (10, 6), (8, 19), (10, 28), (8, 28), (6, 19)],
              fill=p['d'])                                  # bong toi ben trai
    d.polygon([(26, 8), (29, 12), (26, 19), (24, 27), (22, 27), (24, 19)],
              fill=p['s'])                                  # bat sang ben phai
    d.polygon([(11, 5), (16, 12), (21, 5), (19, 5), (16, 9), (13, 5)], fill=p['d'])
    d.rectangle((15, 11, 17, 23), fill=p['d'])              # song giua nguc
    d.polygon([(10, 12), (14, 13), (14, 18), (10, 17)], fill=p['s'])   # bau nguc
    d.polygon([(18, 13), (22, 12), (22, 17), (18, 18)], fill=p['s'])
    d.rectangle((8, 23, 24, 26), fill=p['d'])               # that lung
    d.rectangle((14, 22, 18, 27), fill=p['s'])              # khoa that lung


def ve_vai(d, p):
    """Giap vai: ba tam det chong nhau, tam duoi rong nhat, co dai deo.

    Ve pieslice chong sat nhau thi ba tam dinh lien thanh mot khoi hinh chuong.
    Tach hang bang khe ho mot diem anh de nhin ra ba tam rieng.
    """
    for y, x0, x1 in ((6, 10, 22), (13, 6, 26), (20, 2, 30)):
        d.rounded_rectangle((x0, y, x1, y + 6), radius=3, fill=p['m'])
        d.rectangle((x0 + 1, y + 4, x1 - 1, y + 6), fill=p['d'])   # mep duoi tam
        d.rectangle((x0 + 2, y + 1, x0 + 5, y + 4), fill=p['s'])   # bat sang
        d.point((x1 - 3, y + 2), fill=p['d'])                      # dinh tan


def ve_tay(d, p):
    """Bao tay: bon ngon, mu bao khop, ong tay loe o co."""
    for i, x in enumerate((8, 12, 16)):
        d.rectangle((x, 3 + (i == 1) * -1, x + 3, 12), fill=p['m'])
        d.rectangle((x, 3 + (i == 1) * -1, x, 12), fill=p['s'])
        d.rectangle((x, 5, x + 3, 6), fill=p['d'])           # dot ngon
    d.polygon([(20, 9), (25, 12), (25, 17), (20, 18)], fill=p['m'])   # ngon cai
    d.rectangle((7, 11, 21, 22), fill=p['m'])                # ban tay
    d.rectangle((7, 11, 9, 22), fill=p['s'])
    d.rectangle((7, 12, 21, 15), fill=p['d'])                # mu bao khop
    for x in (9, 13, 17):
        d.point((x, 13), fill=p['s'])
    d.polygon([(5, 22), (23, 22), (25, 29), (3, 29)], fill=p['d'])    # ong tay
    d.polygon([(5, 22), (9, 22), (8, 29), (3, 29)], fill=p['m'])


def ve_giay(d, p):
    """Ung: ong cao, mu bao mui, de day va got sau."""
    d.rectangle((9, 4, 20, 20), fill=p['m'])                 # ong ung
    d.rectangle((9, 4, 11, 20), fill=p['s'])
    d.rectangle((9, 4, 20, 6), fill=p['d'])                  # mieng ong
    d.rectangle((8, 10, 21, 12), fill=p['d'])                # dai buoc
    d.polygon([(9, 17), (20, 17), (28, 23), (28, 26), (6, 26)], fill=p['m'])
    d.polygon([(20, 18), (27, 23), (27, 25), (20, 25)], fill=p['s'])  # mui giay
    d.rectangle((5, 26, 28, 29), fill=p['d'])                # de giay
    d.rectangle((5, 26, 12, 29), fill=(46, 36, 62, 255))     # got


def ve_phu(d, p):
    """Day chuyen: chuoi mat xich + mat da hinh giot treo o giua."""
    d.arc((5, 2, 27, 24), 190, 350, fill=p['m'], width=3)     # soi day lien mach
    d.arc((6, 3, 26, 23), 196, 344, fill=p['s'], width=1)
    for x, y in ((8, 8), (13, 4), (19, 4), (24, 8)):          # mat xich noi len
        d.point((x, y), fill=p['s'])
    d.polygon([(16, 11), (20, 15), (16, 18), (12, 15)], fill=p['d'])   # ngam treo
    d.polygon([(16, 14), (25, 21), (16, 30), (7, 21)], fill=p['m'])    # mat da
    d.polygon([(16, 14), (11, 19), (11, 24), (16, 30)], fill=p['s'])
    d.polygon([(16, 17), (22, 21), (16, 27), (10, 21)], fill=p['d'])


# Cho dat da quy va canh tren tung kieu do
DIEM = {
    'mu':   {'da': (16, 9, 3),  'canh': (16, 11, 9)},
    'ao':   {'da': (16, 16, 4), 'canh': (16, 10, 12)},
    'vai':  {'da': (16, 9, 3),  'canh': (16, 14, 13)},
    'tay':  {'da': (14, 18, 3), 'canh': (15, 15, 10)},
    'giay': {'da': (14, 13, 3), 'canh': (15, 14, 10)},
    'phu':  {'da': (16, 21, 4), 'canh': (16, 21, 8)},
}


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
                p = bang_mau(ho, sao)
                ve(d, p)
                vien_trong(im, p['vien'])       # vien om theo dung duong bao
                if p['gai']:
                    # Canh nam DUOI mon do, khong thi no de len giua hinh
                    nen = Image.new('RGBA', (N, N), TRONG)
                    cx, cy, rong = DIEM[o]['canh']
                    canh(ImageDraw.Draw(nen), p, cx, cy, rong)
                    vien_ngoai(nen)
                    im = Image.alpha_composite(nen, im)
                d2 = ImageDraw.Draw(im)
                gx, gy, gr = DIEM[o]['da']
                da_quy(d2, p, gx, gy, gr)
                hao_quang(d2, p)
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
