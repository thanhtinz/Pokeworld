#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cat pack "Cozy Farm" thanh asset nong trai + sinh js/data/nongtrai.js.

    python3 tools/mknongtrai.py /duong/dan/"full version"

Nguon KHONG commit vao repo (giong pack nhan vat va may pack CraftPix): chi
commit anh da nuong ra assets/nt. Xem CREDITS.md.

Bo nguon xep the nay (do bang chinh tep, khong doan):
  farming/crops.png       96x592  — 6 giai doan x 37 loai, o 16x16
  farming/crops_wet.png   96x592  — y het nhung dat da tuoi (dam mau hon)
  farming/seeds.png      112x96   — goi hat, xep hang 7 cai mot
  ui/items.png           160x192  — icon nong san, thu tu dung y "item list.txt"
  animals/<ten>.png               — 4 khung x 5 hang, hang 0 xuong 1 len 2 phai 3 trai
  Buildings/buildings.png         — nha cua, cat theo o 16x16

Ban do trong game van dung tileset ngoai troi cua Tuxemon cho nen dat, chi lay
tu pack nay nhung thu Tuxemon khong co: cay trong, con vat, nha nong. Tron hai
bo NEN thi lech phong cach, con tron VAT THE thi khong — pack CraftPix o Pho
Kim Long cung dang lam vay.

Sinh ra:
  assets/nt/cay/<ma>/<0..5>.png       — sáu giai đoạn, đất khô
  assets/nt/cay/<ma>/w<0..5>.png      — sáu giai đoạn, đất đã tưới
  assets/nt/hat/<ma>.png              — gói hạt giống
  assets/nt/mon/<ma>.png              — icon nông sản
  assets/nt/thu/<ma>.png              — sprite con vật 3 cột x 4 hàng
  assets/nt/nha/<ma>.png              — nhà nông trại, chuồng, sạp chợ
  assets/nt/dat/{tho,uot}.png         — ô đất đã cày (vẽ bằng code)
  js/data/nongtrai.js
"""
import json
import os
import sys

from PIL import Image, ImageDraw

O = 16                      # canh mot o cua pack (bang TILE cua game)
RA = 'assets/nt'
DL = 'js/data/nongtrai.js'

# Hang cua game <- hang cua pack. Game: 0 xuong 1 trai 2 phai 3 len.
# Pack: 0 xuong 1 len 2 phai 3 trai (giong pack nhan vat).
HANG_THU = [0, 3, 2, 1]
# Cot cua game <- khung cua pack. Khung 0 la lúc đứng yên, 1 va 3 la hai buoc.
COT_THU = [0, 1, 3]

# ==== Cay trong ====
# (ma, ten, hang trong crops.png, chi so trong items.png/seeds.png,
#  gia hat, gia ban mot qua, so phut lon het mot giai doan)
# Cay cang lau an cang duoc gia — de nguoi choi phai chon: trong nhanh lay von
# hay trong lau lay lai.
CAY = [
    ('cu_cai', 'Củ Cải', 7, 7, 25, 14, 2),
    ('ca_rot', 'Cà Rốt', 0, 0, 40, 22, 3),
    ('xa_lach', 'Xà Lách', 8, 8, 50, 28, 4),
    ('khoai_tay', 'Khoai Tây', 5, 5, 70, 40, 5),
    ('ca_chua', 'Cà Chua', 1, 1, 100, 58, 7),
    ('lua_mi', 'Lúa Mì', 9, 9, 130, 76, 9),
    ('ngo', 'Ngô', 4, 4, 170, 100, 11),
    ('dau_tay', 'Dâu Tây', 2, 2, 230, 138, 14),
    ('ca_tim', 'Cà Tím', 10, 10, 300, 182, 18),
    ('bi_do', 'Bí Đỏ', 3, 3, 400, 245, 23),
    ('dua_hau', 'Dưa Hấu', 6, 6, 550, 340, 30),
]
GIAI_DOAN = 6               # crops.png co 6 cot: gieo -> chin

# ==== Con vat ====
# (ma, ten, ten tep trong animals/, canh o, ma san pham, giá mua,
#  số phút ra một lứa sản phẩm)
THU = [
    ('ga', 'Gà Mái', 'chicken animation.png', 16, 'trung_trang', 1200, 8),
    ('ga_nau', 'Gà Nâu', 'chicken_brown animation.png', 16, 'trung_nau', 1800, 10),
    ('tho', 'Thỏ', 'bunny_animations.png', 17, 'len_trang', 2600, 14),
    ('cuu', 'Cừu', 'sheep animation.png', 17, 'len_xam', 4200, 18),
    ('de', 'Dê', 'goat animation.png', 19, 'sua_de', 6000, 22),
    ('lon', 'Lợn', 'pig animation.png', 20, 'thit_xong_khoi', 8500, 28),
    ('ga_tay', 'Gà Tây', 'turkey animation.png', 17, 'long_ga_tay', 11000, 34),
    ('bo', 'Bò Sữa', 'cow animation.png', 24, 'sua_bo', 16000, 40),
]

# ==== Nong san khong phai cay trong ====
# (ma, ten, chi so trong ui/items.png, gia ban)
# Chi so = hang * 10 + cot, dung thu tu cua "item list.txt" trong pack.
MON_THEM = [
    ('sua_bo', 'Sữa Bò', 30, 420),
    ('sua_de', 'Sữa Dê', 31, 300),
    ('thit_xong_khoi', 'Thịt Xông Khói', 36, 260),
    ('long_ga_tay', 'Lông Gà Tây', 39, 190),
    ('trung_trang', 'Trứng Gà', 40, 60),
    ('trung_nau', 'Trứng Nâu', 42, 95),
    ('len_trang', 'Lông Thỏ', 50, 140),
    ('len_xam', 'Len Cừu', 51, 230),
    ('co_kho', 'Cỏ Khô', 56, 30),
]

# ==== Nha cua tren nong trai ====
# (ma, ten, c0, r0, w, h) — o goc trai tren trong Buildings/buildings.png
NHA = [
    ('nha_nong', 'Nhà Nông Trại', 0, 28, 5, 5),
    ('chuong_ga', 'Chuồng Gà', 0, 12, 4, 5),
    ('chuong_bo', 'Chuồng Bò', 0, 43, 6, 5),
    ('nha_kinh', 'Nhà Kính', 0, 20, 7, 5),
    ('sap_cho', 'Sạp Chợ', 0, 63, 6, 4),
]

# Co kho: thuc an cho thu. Mua o cho bac Nong, moi lua san pham an mot bo.
GIA_CO_KHO = 45

# ==== Vat the ke duoc tren nong trai ====
# (ma, ten, loai, gia, suc chua them)
# loai:
#   ruong     — o dat gieo hat duoc
#   chuong    — khong gieo duoc, nhung nuoi them duoc bay nhieu con
#   trang_tri — chi de nhin
# `w`/`h` cua cong trinh lay thang tu NHA o tren, ruong thi 1x1.
VAT_THE = [
    ('ruong', 'Ô Ruộng', 'ruong', 300, 0),
    ('chuong_ga', 'Chuồng Gà', 'chuong', 5000, 4),
    ('chuong_bo', 'Chuồng Bò', 'chuong', 14000, 3),
    ('nha_kinh', 'Nhà Kính', 'trang_tri', 22000, 0),
    ('nha_nong', 'Nhà Nông Trại', 'trang_tri', 9000, 0),
    ('sap_cho', 'Sạp Chợ', 'trang_tri', 12000, 0),
]
# Nuoi duoc bay nhieu con khi chua ke chuong nao
SUC_CHUA_GOC = 2


def js(v):
    return json.dumps(v, ensure_ascii=False)


def luu(im, *phan):
    duong = os.path.join(RA, *phan)
    os.makedirs(os.path.dirname(duong), exist_ok=True)
    im.save(duong, optimize=True)


def ve_o_dat():
    """O dat da cay — ve bang code chu khong cat tu pack.

    Ly do: sprite cay trong pack da co san u dat cua rieng no, con o dat TRONG
    (cay xong chua gieo) thi pack khong co o nao rieng. Ve mot o 16x16 co luong
    cay thi vua khop, ma sua mot dong la ca hai bien the doi theo.
    """
    for ten, nen, luong, vien in (('tho', '#8a6642', '#6f5133', '#5a4128'),
                                  ('uot', '#5d452c', '#48351f', '#372718')):
        im = Image.new('RGBA', (O, O), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.rectangle([1, 1, O - 2, O - 2], fill=nen, outline=vien)
        # ba luong cay chay ngang cho ra dang dat moi xoi
        for y in (4, 8, 12):
            d.line([(3, y), (O - 4, y)], fill=luong)
        luu(im, 'dat', ten + '.png')


def cat_cay(goc):
    """Sau giai doan cua tung cay, ca ban dat kho lan dat da tuoi."""
    kho = Image.open(os.path.join(goc, 'farming/crops.png')).convert('RGBA')
    uot = Image.open(os.path.join(goc, 'farming/crops_wet.png')).convert('RGBA')
    n = 0
    for ma, _ten, hang, _i, *_ in CAY:
        for gd in range(GIAI_DOAN):
            for sheet, dau in ((kho, ''), (uot, 'w')):
                o = sheet.crop((gd * O, hang * O, gd * O + O, hang * O + O))
                luu(o, 'cay', ma, '%s%d.png' % (dau, gd))
                n += 1
    return n


def cat_hat(goc):
    """Goi hat giong — seeds.png xep hang 7 cai mot, cung thu tu voi crops."""
    sheet = Image.open(os.path.join(goc, 'farming/seeds.png')).convert('RGBA')
    cot = sheet.width // O
    for ma, _ten, _h, i, *_ in CAY:
        o = sheet.crop(((i % cot) * O, (i // cot) * O,
                        (i % cot) * O + O, (i // cot) * O + O))
        luu(o, 'hat', ma + '.png')
    return len(CAY)


def cat_mon(goc):
    """Icon nong san: cay trong lay dung chi so cua no, con lai theo MON_THEM."""
    sheet = Image.open(os.path.join(goc, 'ui/items.png')).convert('RGBA')
    cot = sheet.width // O

    def mot(ma, i):
        o = sheet.crop(((i % cot) * O, (i // cot) * O,
                        (i % cot) * O + O, (i // cot) * O + O))
        luu(o, 'mon', ma + '.png')

    for ma, _ten, _h, i, *_ in CAY:
        mot(ma, i)
    for ma, _ten, i, _g in MON_THEM:
        mot(ma, i)
    return len(CAY) + len(MON_THEM)


def cat_thu(goc):
    """Con vat ve khuon 3 cot x 4 hang giong sprite di ban do cua game."""
    for ma, _ten, tep, o, *_ in THU:
        sheet = Image.open(os.path.join(goc, 'animals', tep)).convert('RGBA')
        im = Image.new('RGBA', (o * 3, o * 4), (0, 0, 0, 0))
        for r, hp in enumerate(HANG_THU):
            for c, kp in enumerate(COT_THU):
                im.paste(sheet.crop((kp * o, hp * o, kp * o + o, hp * o + o)),
                         (c * o, r * o))
        luu(im, 'thu', ma + '.png')
    return len(THU)


def cat_nha(goc):
    """Nha cua + o dac: do alpha tung o de biet o nao chan duong.

    Giong tools/khupho.py: o gan nhu trong suot thi khong tinh la nha (khong
    thi mai nha nho ra mot goc cung thanh buc tuong vo hinh), o dam thi chan.
    """
    sheet = Image.open(os.path.join(goc, 'Buildings/buildings.png')).convert('RGBA')
    ra = []
    for ma, ten, c0, r0, w, h in NHA:
        im = sheet.crop((c0 * O, r0 * O, (c0 + w) * O, (r0 + h) * O))
        luu(im, 'nha', ma + '.png')
        # Ban do dac: 1 = chan, 0 = di qua duoc
        dac = []
        px = im.load()
        for r in range(h):
            hang = []
            for c in range(w):
                phu = sum(1 for dx in range(O) for dy in range(O)
                          if px[c * O + dx, r * O + dy][3] > 32)
                hang.append(1 if phu > O * O // 2 else 0)
            dac.append(hang)
        ra.append((ma, ten, w, h, dac))
    return ra


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    goc = sys.argv[1]
    if not os.path.isdir(os.path.join(goc, 'farming')):
        raise SystemExit('Khong thay thu muc farming trong %s' % goc)

    for dp, _, fs in os.walk(RA):
        for f in fs:
            os.remove(os.path.join(dp, f))

    n = cat_cay(goc) + cat_hat(goc) + cat_mon(goc) + cat_thu(goc)
    nha = cat_nha(goc)
    ve_o_dat()

    dong = [
        '// TuxeWorld H5 | data/nongtrai.js | Cây trồng, con vật, nhà nông trại',
        '// SINH TU DONG boi tools/nongtrai.py — KHONG SUA TAY.',
        '//',
        '// Art cắt từ pack "Cozy Farm" (đã mua, không phát tán lại bản gốc).',
        '// Nền bản đồ vẫn là tileset ngoài trời của Tuxemon: trộn hai bộ NỀN thì',
        '// lệch phong cách, còn trộn VẬT THỂ thì không.',
        '',
        'export const THU_MUC = %s;' % js(RA),
        'export const O = %d;             // cạnh một ô art, đúng bằng TILE của game' % O,
        'export const GIAI_DOAN = %d;     // số giai đoạn lớn của một cây' % GIAI_DOAN,
        '',
        '// Cây trồng. `phut` = mỗi giai đoạn lâu bấy nhiêu phút THẬT, nên tắt',
        '// game cây vẫn lớn. Cây lâu ăn thì bán được giá hơn hẳn.',
        'export const CAY = [',
    ]
    for ma, ten, _h, _i, gia_hat, gia_ban, phut in CAY:
        dong.append('  { id: %s, name: %s, giaHat: %d, giaBan: %d, phut: %d },'
                    % (js(ma), js(ten), gia_hat, gia_ban, phut))
    dong += ['];', '',
             'export const CAY_BY_ID = Object.fromEntries(CAY.map(c => [c.id, c]));',
             '',
             '// Con vật. `phut` = bao lâu ra một lứa sản phẩm, `an` = mỗi lứa ăn',
             '// mấy bó cỏ khô. Không cho ăn thì đứng không, chẳng ra gì cả.',
             'export const THU = [']
    for ma, ten, _t, o, sp, gia, phut in THU:
        dong.append('  { id: %s, name: %s, o: %d, sanPham: %s, gia: %d, phut: %d, an: 1 },'
                    % (js(ma), js(ten), o, js(sp), gia, phut))
    dong += ['];', '',
             'export const THU_BY_ID = Object.fromEntries(THU.map(t => [t.id, t]));',
             '',
             '// Mọi thứ cất được trong kho nông trại: nông sản + sản phẩm con vật.',
             'export const MON = [']
    for ma, ten, _h, _i, _gh, gia_ban, _p in CAY:
        dong.append('  { id: %s, name: %s, gia: %d, tu: "cay" },'
                    % (js(ma), js(ten), gia_ban))
    for ma, ten, _i, gia in MON_THEM:
        dong.append('  { id: %s, name: %s, gia: %d, tu: "thu" },' % (js(ma), js(ten), gia))
    dong += ['];', '',
             'export const MON_BY_ID = Object.fromEntries(MON.map(m => [m.id, m]));',
             '',
             '// Cỏ khô mua ở chỗ bác Nông, dùng cho thú ăn.',
             'export const GIA_CO_KHO = %d;' % GIA_CO_KHO,
             '// Chưa kê chuồng nào thì nuôi được bấy nhiêu con.',
             'export const SUC_CHUA_GOC = %d;' % SUC_CHUA_GOC,
             '',
             '// Nhà trên nông trại. `dac` = bản đồ ô chắn đường, đo bằng độ phủ',
             '// alpha của chính tấm ảnh chứ không gõ tay.',
             'export const NHA = [']
    for ma, ten, w, h, dac in nha:
        dong.append('  { id: %s, name: %s, w: %d, h: %d, dac: %s },'
                    % (js(ma), js(ten), w, h, js(dac)))
    dong += ['];', '',
             'export const NHA_BY_ID = Object.fromEntries(NHA.map(n => [n.id, n]));',
             '',
             '// Thứ kê được lên nông trại. Ruộng là ô 1x1 vẽ bằng ảnh đất, còn lại',
             '// mượn nguyên kích thước của công trình trong NHA.',
             'export const VAT_THE = [',
             ] + [
             '  { id: %s, name: %s, loai: %s, gia: %d, chua: %d, w: %d, h: %d },'
             % (js(ma), js(ten), js(loai), gia, chua,
                dict((n[0], n[2]) for n in nha).get(ma, 1),
                dict((n[0], n[3]) for n in nha).get(ma, 1))
             for ma, ten, loai, gia, chua in VAT_THE
             ] + [
             '];',
             '',
             'export const VAT_BY_ID = Object.fromEntries(VAT_THE.map(v => [v.id, v]));',
             '',
             '/** Ảnh một giai đoạn của cây; `uot` = ô đã tưới. */',
             'export const anhCay = (id, gd, uot) =>',
             '  `${THU_MUC}/cay/${id}/${uot ? "w" : ""}${gd}.png`;',
             'export const anhHat = (id) => `${THU_MUC}/hat/${id}.png`;',
             'export const anhMon = (id) => `${THU_MUC}/mon/${id}.png`;',
             'export const anhThu = (id) => `${THU_MUC}/thu/${id}.png`;',
             'export const anhNha = (id) => `${THU_MUC}/nha/${id}.png`;',
             'export const anhDat = (uot) => `${THU_MUC}/dat/${uot ? "uot" : "tho"}.png`;',
             '']

    with open(DL, 'w', encoding='utf-8') as f:
        f.write('\n'.join(dong) + '\n')

    tong = sum(os.path.getsize(os.path.join(dp, f))
               for dp, _, fs in os.walk(RA) for f in fs)
    print('OK: %d ảnh + %d nhà -> %s (%.1f KB)' % (n, len(nha), RA, tong / 1024))
    print('OK: %d cây, %d con vật, %d món -> %s'
          % (len(CAY), len(THU), len(CAY) + len(MON_THEM), DL))


if __name__ == '__main__':
    main()
