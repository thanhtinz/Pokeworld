#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cat bo sprite nhan vat LPC ve khuon cua TuxeWorld.

Chay:  python3 tools/mklpc.py <duong-dan-kho-LiberatedPixelCup>
Vi du: python3 tools/mklpc.py /tmp/LPC

Nguon: https://github.com/OpenGameArt/LiberatedPixelCup — thu muc
sprite/character. Giay phep doi: CC BY-SA 3.0 va GPL 3.0. Tac gia ghi trong
sprite/original/authors.md va sprite/derivative/authors.md ben kho do; da chep
lai phan chinh vao CREDITS.md.

Ghi de:
  assets/lpc/<nhom>/<ma>.png   tung lop sprite, khuon 3 cot x 4 hang
  js/data/lpc.js               danh muc phan ngoai hinh + quan ao

VI SAO PHAI CAT LAI
Sheet cua LPC la 64x64 mot khung, hang xep theo thu tu len/trai/xuong/phai va
walk co 9 khung. Sprite nhan vat cua game nay (assets/ow) la 3 cot x 4 hang,
hang xep xuong/trai/phai/len, cot 0 dung yen, cot 1-2 hai buoc chan.

Cat khung 64x64 lay 32 cot giua (x 16..48) thi:
  · giu tron nguoi (do da: moi thu deu nam trong x 17..47)
  · anh ra 96x256, dung ti le 3/8 y het sprite cu -> ca duong VE cua man ban do
    (js/engine/owsprite.js, js/ui/world.js) khong phai sua gi.
"""
import json
import os
import sys

from PIL import Image

O = 64                     # canh mot khung ben LPC
CAT_X = 16                 # cat 32 cot giua cua khung
RONG, CAO = 32, 64         # canh mot khung ben minh

# Hang cua minh (xuong/trai/phai/len) lay tu hang nao ben LPC (len/trai/xuong/phai)
HANG = [2, 1, 3, 0]
# Cot cua minh: dung yen, buoc trai, buoc phai
COT = [0, 2, 6]

RA = 'assets/lpc'


# ==== Danh muc: sua o day la doi ca bo, khong phai sua ma nguon nao khac ====

# Dang nguoi. Quan ao chi co ban cho nam/nu nen hai dang con lai muon do cua nam.
GIOI = [('nam', 'Nam'), ('nu', 'Nữ')]

# Dang nguoi, xep theo GIOI TINH: chon gioi tinh truoc roi moi chon dang.
#   (ma, ten, thu muc ben LPC, lay quan ao ban nao, thuoc gioi nao)
#
# Cot 'lay quan ao ban nao' do khong doan: da do do phu cua tung bo do len
# tung than nguoi. Ao cat cho NU dat 0.991 tren than androgynous, con ao cat
# cho NAM chi duoc 0.811 — nen than do phai an theo tu do cua nu. Nguoc lai
# than luc luong an theo tu do cua nam (0.996).
#
# Chon gioi tinh la xong dang nguoi luon: moi gioi mot than, khong bat nguoi
# choi chon them lan nua.
THAN = [
    ('nam',   'Nam',  'Human_male',   'nam', 'nam'),
    ('nu',    'Nữ',   'Human_female', 'nu',  'nu'),
]

DA = [
    ('ivory',  'Ngà',      'Ivory'),
    ('gold',   'Vàng Ấm',  'Gold'),
    ('copper', 'Đồng',     'Copper'),
    ('sienna', 'Nâu Đỏ',   'Sienna'),
    ('coffee', 'Nâu Đậm',  'Coffee'),
    ('dove',   'Xám Nhạt', 'Dove'),
]

TAI = [('big', 'Tai To', 'Big'), ('nhon', 'Tai Nhọn', 'Pointed'),
       ('dainhon', 'Tai Nhọn Dài', 'PointedLong')]

MUI = [('hech', 'Mũi Hếch', 'Button'), ('to', 'Mũi To', 'Large'),
       ('thang', 'Mũi Thẳng', 'Straight')]

BIEU_CAM = [('gian', 'Cau Có', 'Angry'), ('khoc', 'Mếu Máo', 'Crying'),
            ('vui', 'Tươi Cười', 'Happy'), ('buon', 'Buồn Rầu', 'Sad')]

MAT = [('xanhduong', 'Xanh Dương', 'Blue'), ('nau', 'Nâu', 'Brown'),
       ('xam', 'Xám', 'Gray'), ('xanhla', 'Xanh Lá', 'Green'),
       ('cam', 'Cam', 'Orange'), ('tim', 'Tím', 'Purple'),
       ('do', 'Đỏ', 'Red'), ('vang', 'Vàng', 'Yellow')]

TOC_KIEU = [
    ('thang', 'Tóc Thẳng', 'Plain'), ('dai', 'Tóc Dài', 'Long'),
    ('mai', 'Tóc Mái', 'Bangs'), ('duoi', 'Tóc Đuôi Ngựa', 'Ponytail'),
    ('xoan', 'Tóc Xoăn', 'Curly'), ('afro', 'Tóc Xù', 'Afro'),
    ('roi', 'Tóc Rối', 'Messy'), ('tem', 'Tóc Tém', 'Pixie'),
    ('tet', 'Tóc Tết', 'Braid'), ('haichum', 'Hai Chùm', 'Bunches'),
    ('mohican', 'Mohican', 'Mohawk'), ('congchua', 'Tóc Công Chúa', 'Princess'),
]
TOC_MAU = [('den', 'Đen', 'Black'), ('nau', 'Nâu', 'Brown'),
           ('hatde', 'Hạt Dẻ', 'Chestnut'), ('vang', 'Vàng', 'Blonde'),
           ('do', 'Đỏ', 'Red'), ('bac', 'Bạc', 'Gray')]

# Rau chi co ben Human_male, va tung mau la MOT TEP sheet lon 13x21 khung
RAU_KIEU = [('quaiham', 'Râu Quai Nón', 'Beard'), ('mep', 'Ria Mép', 'Mustache'),
            ('lomchom', 'Râu Lởm Chởm', 'Stubble'),
            ('vuot', 'Ria Vuốt', 'Handlebar'), ('phap', 'Ria Kiểu Pháp', 'Frenchstache')]
RAU_MAU = [('den', 'Đen', 'raven'), ('nau', 'Nâu', 'brunette'),
           ('vang', 'Vàng', 'blonde2'), ('bac', 'Bạc', 'gray')]

# ==== Quan ao ====
# LPC ve do RIENG cho tung dang nguoi, khong phai cung mot mon hai ban — danh
# muc do cua nam va cua nu la hai bo khac han nhau. Nen moi mon deu ghi ro
# `than` no thuoc ve; tiem chi bay ban do hop voi dang nguoi cua nguoi choi.
#
# (ma, ten, o, than, duong dan trong Clothes/, gia, bo do mau)
# gia = 0 la do cua bo mau, cho san luc tao nhan vat, KHONG bay ban.
DO = [
    # ---- Dang nam ----
    ('n_ao_xanh', 'Áo Tay Dài Xanh', 'ao', 'nam', 'Torso/Long-Sleeve Shirt/Blue', 0, 1),
    ('n_ao_batay', 'Áo Ba Lỗ', 'ao', 'nam', 'Torso/Sleeveless Shirt/Navy', 0, 2),
    ('n_ao_somi', 'Áo Sơ Mi', 'ao', 'nam', 'Torso/Dress Shirt', 0, 3),
    ('n_ao_den', 'Áo Tay Dài Đen', 'ao', 'nam', 'Torso/Long-Sleeve Shirt/Black', 900, 0),
    ('n_ao_luc', 'Áo Tay Dài Lục', 'ao', 'nam', 'Torso/Long-Sleeve Shirt/Forest', 900, 0),
    ('n_ao_tim', 'Áo Tay Dài Tím', 'ao', 'nam', 'Torso/Long-Sleeve Shirt/Lavender', 900, 0),
    ('n_ao_xam', 'Áo Tay Dài Xám', 'ao', 'nam', 'Torso/Long-Sleeve Shirt/Gray', 900, 0),
    ('n_ao_la', 'Áo Tay Dài Xanh Lá', 'ao', 'nam', 'Torso/Long-Sleeve Shirt/Green', 900, 0),
    ('n_ao_somi_soc', 'Áo Sơ Mi Sọc', 'ao', 'nam', 'Torso/Dress Shirt with Stripes', 1600, 0),
    ('n_ao_xich', 'Áo Giáp Xích', 'ao', 'nam', 'Torso/Chainmail Shirt', 5200, 0),
    ('n_quan_tay', 'Quần Tây', 'quan', 'nam', 'Legs/Slacks/Green', 0, 1),
    ('n_quan_om', 'Quần Ôm Đen', 'quan', 'nam', 'Legs/Tight Pants/Black', 0, 2),
    ('n_quan_thung', 'Quần Thụng', 'quan', 'nam', 'Legs/Baggy Pants', 0, 3),
    ('n_quan_om_xanh', 'Quần Ôm Xanh', 'quan', 'nam', 'Legs/Tight Pants/Blue', 800, 0),
    ('n_quan_soc', 'Quần Tây Sọc', 'quan', 'nam', 'Legs/Slacks with Stripes/formal_pants stripes.png', 1400, 0),
    ('n_ao_choang', 'Áo Choàng Dài', 'quan', 'nam', 'Legs/Robe Skirt', 1800, 0),
    ('n_giap_ong_bac', 'Giáp Ống Bạc', 'quan', 'nam', 'Legs/Greaves/Silver', 4200, 0),
    ('n_giap_ong_vang', 'Giáp Ống Vàng', 'quan', 'nam', 'Legs/Greaves/Gold', 6800, 0),
    ('n_giay_da', 'Giày Da', 'giay', 'nam', 'Feet/Shoes/Brown', 0, 0),
    ('n_ung_bac', 'Ủng Giáp Bạc', 'giay', 'nam', 'Feet/Armored Boots/Silver', 3600, 0),
    ('n_ung_vang', 'Ủng Giáp Vàng', 'giay', 'nam', 'Feet/Armored Boots/Gold', 5900, 0),
    ('n_mu_dua', 'Mũ Quả Dưa', 'mu', 'nam', 'Head/Bowler', 1500, 0),
    ('n_mu_cao', 'Mũ Chóp Cao', 'mu', 'nam', 'Head/Top Hat', 2600, 0),
    ('n_mu_longvu', 'Mũ Lông Vũ', 'mu', 'nam', 'Head/Feather Cap', 2200, 0),
    ('n_mu_trumda', 'Mũ Trùm Da', 'mu', 'nam', 'Head/Leather Hood', 1900, 0),
    ('n_mu_trumxich', 'Mũ Trùm Xích', 'mu', 'nam', 'Head/Chain Hood', 3400, 0),
    ('n_mu_trumsat', 'Mũ Trùm Sắt', 'mu', 'nam', 'Head/Kettle Hood', 3000, 0),
    ('n_mu_tru', 'Mũ Trụ', 'mu', 'nam', 'Head/Kettle Helmet', 4100, 0),
    ('n_mu_trukin', 'Mũ Trụ Kín', 'mu', 'nam', 'Head/Full Helm', 6200, 0),
    ('n_mu_trugai', 'Mũ Trụ Gai', 'mu', 'nam', 'Head/Spiked Helm', 7400, 0),
    ('n_no_co', 'Nơ Cổ', 'co', 'nam', 'Neck/Bowtie', 700, 0),
    ('n_ca_vat', 'Cà Vạt', 'co', 'nam', 'Neck/Tie', 800, 0),
    ('n_khan', 'Khăn Quàng Đỏ', 'co', 'nam', 'Neck/Scarf/Red', 1200, 0),
    ('n_tl_vai', 'Thắt Lưng Vải', 'that_lung', 'nam', 'Waist/Cloth Belt', 600, 0),
    ('n_tl_da', 'Thắt Lưng Da', 'that_lung', 'nam', 'Waist/Leather Belt', 1100, 0),
    ('n_tl_le', 'Thắt Lưng Lễ Phục', 'that_lung', 'nam', 'Waist/Formal Belt', 1700, 0),
    ('n_giap_vai', 'Giáp Vai', 'vai', 'nam', 'Shoulders/Pauldrons', 3800, 0),
    ('n_giap_vai_le', 'Giáp Vai Lệch', 'vai', 'nam', 'Shoulders/Single Shoulder', 2400, 0),
    ('n_bao_tay', 'Bao Tay Da', 'tay', 'nam', 'Arms/Bracers', 1300, 0),
    ('n_bao_tay_bac', 'Bao Tay Bạc', 'tay', 'nam', 'Arms/Vambrace/Silver', 3100, 0),
    ('n_bao_tay_vang', 'Bao Tay Vàng', 'tay', 'nam', 'Arms/Vambrace/Gold', 5000, 0),
    ('n_gang_bac', 'Găng Giáp Bạc', 'gang', 'nam', 'Hands/Gauntlets/Silver', 2900, 0),
    ('n_gang_vang', 'Găng Giáp Vàng', 'gang', 'nam', 'Hands/Gauntlets/Gold', 4700, 0),
    # ---- Dang nu ----
    ('u_ao_xanh', 'Áo Kiểu Tay Dài Xanh', 'ao', 'nu', 'Torso/Long-Sleeve Blouse/Blue', 0, 1),
    ('u_ao_batay', 'Áo Ba Lỗ Xanh Lá', 'ao', 'nu', 'Torso/Sleeveless Shirt/Green', 0, 2),
    ('u_dam_xe', 'Đầm Xẻ Đen', 'ao', 'nu', 'Torso/Slit Dress/Black', 0, 3),
    ('u_ao_kieu_den', 'Áo Kiểu Đen', 'ao', 'nu', 'Torso/Blouse/Black', 900, 0),
    ('u_ao_kieu_luc', 'Áo Kiểu Lục', 'ao', 'nu', 'Torso/Blouse/Forest', 900, 0),
    ('u_ao_co_tron', 'Áo Cổ Tròn Tím', 'ao', 'nu', 'Torso/Scoop Neck/Lavender', 1100, 0),
    ('u_ao_cuop_bien', 'Áo Cướp Biển', 'ao', 'nu', 'Torso/Pirate Shirt/Gray', 1900, 0),
    ('u_dam_ai', 'Đầm Ai-len Lục', 'ao', 'nu', 'Torso/Irish Dress/Forest', 2600, 0),
    ('u_ao_daitay_do', 'Áo Tay Dài Nâu', 'ao', 'nu', 'Torso/Long-Sleeve Shirt/Leather', 900, 0),
    ('u_ao_xich', 'Áo Giáp Xích', 'ao', 'nu', 'Torso/Chainmail Shirt', 5200, 0),
    ('u_quan_den', 'Quần Đen', 'quan', 'nu', 'Legs/Pants/Black', 0, 1),
    ('u_quan_ngan', 'Quần Đùi', 'quan', 'nu', 'Legs/Short Shorts/Blue Gray', 0, 2),
    ('u_quan_xam', 'Quần Xám', 'quan', 'nu', 'Legs/Pants/Gray', 800, 0),
    ('u_vay_but', 'Váy Bút Chì', 'quan', 'nu', 'Legs/Straight Skirt/Maroon', 1300, 0),
    ('u_vay_xe', 'Váy Xẻ Tím', 'quan', 'nu', 'Legs/Slit Skirt/Lavender', 1600, 0),
    ('u_vay_xoe', 'Váy Xoè Xanh', 'quan', 'nu', 'Legs/Belle Skirt/Blue', 2100, 0),
    ('u_vay_chien', 'Váy Chiến Binh', 'quan', 'nu', 'Legs/Legion Skirt', 3300, 0),
    ('u_giap_ong_bac', 'Giáp Ống Bạc', 'quan', 'nu', 'Legs/Greaves/Silver', 4200, 0),
    ('u_giay_da', 'Giày Da', 'giay', 'nu', 'Feet/Shoes/Leather', 0, 0),
    ('u_giay_den', 'Giày Đen', 'giay', 'nu', 'Feet/Shoes/Black', 700, 0),
    ('u_dep', 'Dép Quai Hậu', 'giay', 'nu', 'Feet/Sandals', 600, 0),
    ('u_dep_le', 'Dép Lê', 'giay', 'nu', 'Feet/Slippers', 500, 0),
    ('u_giay_mem', 'Giày Mềm', 'giay', 'nu', 'Feet/Ghillies', 1400, 0),
    ('u_bot_cao', 'Bốt Cao Cổ', 'giay', 'nu', 'Feet/Long Boots', 2300, 0),
    ('u_ung_bac', 'Ủng Giáp Bạc', 'giay', 'nu', 'Feet/Armored Boots/Silver', 3600, 0),
    ('u_mu_longvu', 'Mũ Lông Vũ', 'mu', 'nu', 'Head/Feather Cap', 2200, 0),
    ('u_mu_phu_thuy', 'Mũ Phù Thuỷ', 'mu', 'nu', 'Head/Magician Hat', 2800, 0),
    ('u_vuong_mien', 'Vương Miện', 'mu', 'nu', 'Head/Tiara', 4500, 0),
    ('u_mu_trumda', 'Mũ Trùm Da', 'mu', 'nu', 'Head/Leather Hood', 1900, 0),
    ('u_mu_trumxich', 'Mũ Trùm Xích', 'mu', 'nu', 'Head/Chain Hood', 3400, 0),
    ('u_mu_tru', 'Mũ Trụ', 'mu', 'nu', 'Head/Kettle Helmet', 4100, 0),
    ('u_mu_trukin', 'Mũ Trụ Kín', 'mu', 'nu', 'Head/Full Helm', 6200, 0),
    ('u_mu_chien', 'Mũ Chiến Binh', 'mu', 'nu', 'Head/Legion Helm 1/Steel', 5400, 0),
    ('u_day_chuyen', 'Dây Chuyền', 'co', 'nu', 'Neck/Necklace', 1500, 0),
    ('u_mat_day', 'Mặt Dây Chuyền', 'co', 'nu', 'Neck/Pendant', 2000, 0),
    ('u_tl_vai', 'Thắt Lưng Vải', 'that_lung', 'nu', 'Waist/Cloth Belt', 600, 0),
    ('u_tl_da', 'Thắt Lưng Da', 'that_lung', 'nu', 'Waist/Leather Belt', 1100, 0),
    ('u_giap_vai', 'Giáp Vai', 'vai', 'nu', 'Shoulders/Pauldrons', 3800, 0),
    ('u_bao_tay', 'Bao Tay Da', 'tay', 'nu', 'Arms/Bracers', 1300, 0),
    ('u_bao_tay_bac', 'Bao Tay Bạc', 'tay', 'nu', 'Arms/Vambrace/Silver', 3100, 0),
    ('u_gang_bac', 'Găng Giáp Bạc', 'gang', 'nu', 'Hands/Gauntlets/Silver', 2900, 0),
]

# Ten o quan ao + thu tu ve (truoc ra sau). Thu tu nay theo huong dan cua LPC.
O_DO = [
    ('quan', 'Quần'), ('giay', 'Giày'), ('ao', 'Áo'), ('that_lung', 'Thắt Lưng'),
    ('tay', 'Bao Tay'), ('vai', 'Giáp Vai'), ('co', 'Cổ'), ('gang', 'Găng'),
    ('mu', 'Mũ'),
]

BO_MAU = [
    (1, 'Bộ Đi Học', 'Gọn gàng, hợp lúc mới lên đường'),
    (2, 'Bộ Năng Động', 'Nhẹ và thoáng, tiện chạy nhảy'),
    (3, 'Bộ Lịch Sự', 'Chỉn chu, ra dáng người có nghề'),
]


# ==== Doc va cat ====

def doc_walk(root, duong):
    """Tra ve anh 9 cot x 4 hang khung walk cua LPC.

    Nhan hai kieu nguon:
      · mot THU MUC co walk.png  (576x256 — dung bo walk)
      · mot TEP sheet lon 13x21 khung (832x1344) — cat bon hang walk (8..11)
    """
    p = os.path.join(root, 'sprite/character', duong)
    if os.path.isdir(p):
        p = os.path.join(p, 'walk.png')
    if not os.path.exists(p):
        return None
    im = Image.open(p).convert('RGBA')
    if im.size == (832, 1344):
        return im.crop((0, 8 * O, 9 * O, 12 * O))
    # Bo walk cua LPC co ban 9 khung, nhung nhieu mon do cu chi co 8 — van du
    # vi minh chi lay khung 0, 2 va 6.
    if im.size[0] >= (max(COT) + 1) * O and im.size[1] >= 4 * O:
        return im.crop((0, 0, im.size[0] - im.size[0] % O, 4 * O))
    return None


def cat(im):
    """9x4 khung LPC -> 3x4 khung cua minh, moi khung 32x64."""
    ra = Image.new('RGBA', (RONG * 3, CAO * 4), (0, 0, 0, 0))
    for hang, lpc_h in enumerate(HANG):
        for cot, lpc_c in enumerate(COT):
            k = im.crop((lpc_c * O + CAT_X, lpc_h * O,
                         lpc_c * O + CAT_X + RONG, lpc_h * O + CAO))
            ra.paste(k, (cot * RONG, hang * CAO))
    return ra


def mau_chinh(ten, loc_vien=True):
    """Mau dai dien cua mot lop, doc nguoc lai tu tep da cat.

    Man tao nhan vat bay 'Nau Do', 'Xam Nhat'... bang CHU thi nguoi choi phai
    bam tung cai moi biet no ra sao. Lay dung mau cua lop ra lam o mau thi
    nhin phat la thay.

    Bo pixel vien (gan den) va pixel gan trang: hai thu do lop nao cung co,
    de lai thi mau toc nao cung ra den si.
    """
    p = os.path.join(RA, ten + '.png')
    if not os.path.exists(p):
        return '#888888'
    im = Image.open(p).convert('RGBA')
    dem = {}
    for r, g, b, a in im.getdata():
        if a < 200:
            continue
        if loc_vien and (max(r, g, b) < 60 or min(r, g, b) > 235):
            continue
        dem[(r, g, b)] = dem.get((r, g, b), 0) + 1
    if not dem:
        return '#888888'
    r, g, b = max(dem, key=dem.get)
    return '#%02x%02x%02x' % (r, g, b)


def mau_ruc(ten):
    """Mau RUC NHAT cua lop — dung cho mat: trong mat chi vai chuc pixel, lay
    mau hay gap nhat thi ra long trang chu khong ra mau mat."""
    p = os.path.join(RA, ten + '.png')
    if not os.path.exists(p):
        return '#888888'
    im = Image.open(p).convert('RGBA')
    tot, diem = None, -1
    for r, g, b, a in im.getdata():
        if a < 200:
            continue
        d = max(r, g, b) - min(r, g, b)          # do bao hoa tho
        if d > diem:
            tot, diem = (r, g, b), d
    return '#%02x%02x%02x' % tot if tot else '#888888'


def luu(root, duong, ten, thieu):
    im = doc_walk(root, duong)
    if im is None:
        thieu.append(duong)
        return False
    p = os.path.join(RA, ten + '.png')
    os.makedirs(os.path.dirname(p), exist_ok=True)
    cat(im).save(p, optimize=True)
    return True


def js(v):
    return json.dumps(v, ensure_ascii=False)


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    root = sys.argv[1]
    if not os.path.isdir(os.path.join(root, 'sprite/character')):
        raise SystemExit('Khong thay sprite/character trong %s' % root)

    for f in [os.path.join(dp, f) for dp, _, fs in os.walk(RA) for f in fs]:
        os.remove(f)
    thieu = []
    n = 0

    # Than nguoi theo tung mau da
    for ma, _, thu, _, _ in THAN:
        for mda, _, cda in DA:
            n += luu(root, f'Body/Base/{thu}/{cda}', f'base/{ma}_{mda}', thieu)

    # Phan tren dau: lay tu cay Human_female vi ben do du mau nhat, va dau cua
    # moi dang nguoi ben LPC deu dat cung mot cho nen dung chung duoc.
    for nhom, ds, goc in (('tai', TAI, 'Body/Ears/Human_female'),
                          ('mui', MUI, 'Body/Nose/Human_female'),
                          ('bieucam', BIEU_CAM, 'Body/Expression/Human_female')):
        for ma, _, kieu in ds:
            for mda, _, cda in DA:
                n += luu(root, f'{goc}/{kieu}/{cda}', f'{nhom}/{ma}_{mda}', thieu)

    for ma, _, kieu in MAT:
        n += luu(root, f'Body/Eyes/Human_female/{kieu}', f'mat/{ma}', thieu)

    for ma, _, kieu in TOC_KIEU:
        for mm, _, cm in TOC_MAU:
            n += luu(root, f'Body/Hair/Human_female/{kieu}/{cm}', f'toc/{ma}_{mm}', thieu)

    for ma, _, kieu in RAU_KIEU:
        for mm, _, cm in RAU_MAU:
            n += luu(root, f'Body/Facial Hair/Human_male/{kieu}/{cm}.png',
                     f'rau/{ma}_{mm}', thieu)

    # Quan ao: LPC ve rieng cho tung dang, moi mon chi co mot ban
    THU_DANG = {'nam': 'Human_male', 'nu': 'Human_female'}
    for ma, _, o, than, duong, _, _ in DO:
        phan, con = duong.split('/', 1)
        n += luu(root, f'Clothes/{phan}/{THU_DANG[than]}/{con}', f'do/{ma}', thieu)

    # ==== js/data/lpc.js ====
    def bang(ds, mau=None):
        ra = []
        for a, b, *_ in ds:
            if mau:
                ra.append('{ id: %s, name: %s, mau: %s }' % (js(a), js(b), js(mau(a))))
            else:
                ra.append('{ id: %s, name: %s }' % (js(a), js(b)))
        return '[' + ', '.join(ra) + ']'

    # O mau cho nhung muc CHON MAU. Kieu toc, kieu tai... thi khong can vi
    # khac nhau o hinh dang chu khong phai mau.
    MAU = {
        'DA': lambda a: mau_chinh('base/nam_%s' % a),
        'TOC_MAU': lambda a: mau_chinh('toc/%s_%s' % (TOC_KIEU[0][0], a)),
        'RAU_MAU': lambda a: mau_chinh('rau/%s_%s' % (RAU_KIEU[0][0], a)),
        'MAT': lambda a: mau_ruc('mat/%s' % a),
    }

    dong = [
        '// TuxeWorld H5 | data/lpc.js | Danh mục ngoại hình + quần áo nhân vật',
        '// SINH TU DONG boi tools/mklpc.py — KHONG SUA TAY.',
        '//',
        '// Ảnh cắt từ bộ sprite nhân vật của Liberated Pixel Cup',
        '// (github.com/OpenGameArt/LiberatedPixelCup, CC BY-SA 3.0 / GPL 3.0).',
        '// Mỗi tệp là một LỚP rời: thân, tai, mắt, mũi, biểu cảm, tóc, râu, đồ mặc.',
        '// engine/avatar.js chồng các lớp lại thành một sprite hoàn chỉnh.',
        '',
        'export const THU_MUC = %s;' % js(RA),
        '',
        '// Giới tính chọn TRƯỚC, rồi mới tới dáng người trong giới đó.',
        'export const GIOI = %s;' % ('[' + ', '.join(
            '{ id: %s, name: %s }' % (js(a), js(b)) for a, b in GIOI) + ']'),
        '',
        '// Dáng người. `do` = lấy quần áo bản của dáng nào (LPC chỉ vẽ đồ cho',
        '// nam/nữ), `gioi` = thuộc giới tính nào.',
        'export const THAN = [',
    ]
    for ma, ten, _, kieu_do, gioi in THAN:
        dong.append('  { id: %s, name: %s, do: %s, gioi: %s },'
                    % (js(ma), js(ten), js(kieu_do), js(gioi)))
    dong += ['];', '']
    for ten_bien, ds in (('DA', DA), ('TAI', TAI), ('MUI', MUI),
                         ('BIEU_CAM', BIEU_CAM), ('MAT', MAT),
                         ('TOC_KIEU', TOC_KIEU), ('TOC_MAU', TOC_MAU),
                         ('RAU_KIEU', RAU_KIEU), ('RAU_MAU', RAU_MAU)):
        dong.append('export const %s = %s;' % (ten_bien, bang(ds, MAU.get(ten_bien))))
    dong += ['', '// Ô quần áo, xếp theo THỨ TỰ VẼ (trước ra sau)',
             'export const O_DO = [']
    for ma, ten in O_DO:
        dong.append('  { id: %s, name: %s },' % (js(ma), js(ten)))
    dong += ['];', '',
             '// than = đồ này vẽ cho dáng nào (LPC vẽ riêng cho nam và nữ).',
             '// gia = 0 nghĩa là đồ của bộ mẫu, cho sẵn lúc tạo nhân vật, không bán.',
             'export const DO = [']
    for ma, ten, o, than, _, gia, bo in DO:
        dong.append('  { id: %s, name: %s, o: %s, than: %s, gia: %d, bo: %d },'
                    % (js(ma), js(ten), js(o), js(than), gia, bo))
    dong += ['];', '',
             'export const DO_BY_ID = Object.fromEntries(DO.map(d => [d.id, d]));', '',
             '// Ba bộ đồ mẫu cho chọn lúc tạo nhân vật. Giày da tặng kèm cả ba bộ.',
             'export const BO_MAU = [']
    for so, ten, mo in BO_MAU:
        dong.append('  { so: %d, name: %s, desc: %s },' % (so, js(ten), js(mo)))
    dong += ['];', '',
             '// Món của bộ mẫu số `so` cho dáng `than` (kèm đôi giày miễn phí)',
             'export const monBoMau = (than, so) =>',
             '  DO.filter(d => d.than === than && d.gia === 0 && (d.bo === so || d.bo === 0))',
             '    .map(d => d.id);', '']

    with open('js/data/lpc.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(dong) + '\n')

    tong = sum(os.path.getsize(os.path.join(dp, f))
               for dp, _, fs in os.walk(RA) for f in fs)
    print('OK: %d lớp sprite -> %s (%.1f MB)' % (n, RA, tong / 1024 / 1024))
    print('OK: %d dáng người, %d màu da, %d kiểu tóc, %d món quần áo'
          % (len(THAN), len(DA), len(TOC_KIEU), len(DO)))
    if thieu:
        print('THIẾU %d nguồn:' % len(thieu))
        for d in thieu[:12]:
            print('  ', d)


if __name__ == '__main__':
    main()
