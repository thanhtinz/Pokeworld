#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cat bo sprite nhan vat 32x32 (pack "Character v.2") thanh tung LOP roi.

    python3 tools/cozy.py /duong/dan/"Character v.2"

Vi sao doi tu LPC sang bo nay: LPC ve o 32x64, con NPC cua Tuxemon o 16x32.
Ke ca khi keo ve cung chieu cao tren man hinh thi pixel cua LPC van nho gap
doi, nen nhan vat chinh trong muot con ca the gioi thi cuc mich — nhin khong
an nhap. Bo nay ve o 32x32, than nguoi cao 20px, dung bang NPC Tuxemon (20/32
= 0.625) nen cam thang vao khong phai co gian gi het.

Nguon KHONG commit vao repo (giong may pack CraftPix): chi commit anh da nuong
ra assets/nv. Xem ATTRIBUTIONS.md.

Bo nguon xep: 8 khung di x 4 hang, hang 0 xuong · 1 len · 2 phai · 3 trai.
Game thi doc 3 cot x 4 hang, hang 0 xuong · 1 trai · 2 phai · 3 len (xem
engine/owsprite.js). Nen phai dao ca hang lan cot.
"""
import json
import os
import sys

from PIL import Image

O = 32                      # canh mot o vuong cua bo nguon
RA = 'assets/nv'            # noi do anh da nuong
DL = 'js/data/nhanvat.js'

# Hang cua game <- hang cua pack. Game: 0 xuong 1 trai 2 phai 3 len.
HANG = [0, 3, 2, 1]
# Cot cua game <- khung cua pack. Khung 3 la luc hai chan chum lai (dung yen),
# khung 1 va 5 la hai buoc nguoc nhau.
COT = [3, 1, 5]

# ==== Bang mau, lay dung thu tu trong list.txt cua pack ====
MAU_TOC = [
    ('den', 'Đen'), ('vang', 'Vàng'), ('nau', 'Nâu'), ('naunhat', 'Nâu Nhạt'),
    ('dong', 'Đồng'), ('lucbao', 'Lục Bảo'), ('xanhla', 'Xanh Lá'),
    ('xam', 'Xám'), ('tunhat', 'Tím Nhạt'), ('xanhtham', 'Xanh Thẫm'),
    ('hong', 'Hồng'), ('tim', 'Tím'), ('do', 'Đỏ'), ('ngoclam', 'Ngọc Lam'),
]
MAU_DO = [
    ('den', 'Đen'), ('xanhduong', 'Xanh Dương'), ('xanhnhat', 'Xanh Nhạt'),
    ('nau', 'Nâu'), ('xanhla', 'Xanh Lá'), ('lanhat', 'Lá Nhạt'),
    ('hong', 'Hồng'), ('tim', 'Tím'), ('do', 'Đỏ'), ('trangxam', 'Trắng Xám'),
]
MAU_MAT = [
    ('den', 'Đen'), ('xanhduong', 'Xanh Dương'), ('xanhnhat', 'Xanh Nhạt'),
    ('nau', 'Nâu'), ('nautham', 'Nâu Thẫm'), ('naunhat', 'Nâu Nhạt'),
    ('xanhla', 'Xanh Lá'), ('latham', 'Lá Thẫm'), ('lanhat', 'Lá Nhạt'),
    ('xam', 'Xám'), ('xamnhat', 'Xám Nhạt'), ('hong', 'Hồng'),
    ('hongnhat', 'Hồng Nhạt'), ('do', 'Đỏ'),
]
# Ma hong + son moi chi co 5 muc, xep tu nhat toi dam
MAU_NHAT = [('m%d' % i, 'Mức %d' % i) for i in range(1, 6)]

# ==== Kieu toc ====
# gioi = '' nghia la bay cho ca hai gioi, con lai loc theo gioi da chon.
TOC = [
    ('buzzcut', 'Tóc Húi Cua', 'nam'), ('gentleman', 'Tóc Chải Lệch', 'nam'),
    ('emo', 'Tóc Che Mắt', ''), ('curly', 'Tóc Xoăn', ''),
    ('bob', 'Tóc Bob', ''), ('wavy', 'Tóc Gợn Sóng', ''),
    ('french_curl', 'Xoăn Kiểu Pháp', 'nu'), ('midiwave', 'Sóng Lỡ Vai', 'nu'),
    ('long_straight', 'Tóc Dài Thẳng', 'nu'), ('extra_long', 'Tóc Cực Dài', 'nu'),
    ('ponytail', 'Tóc Đuôi Ngựa', 'nu'), ('braids', 'Tóc Tết', 'nu'),
    ('spacebuns', 'Hai Búi', 'nu'),
]

# ==== Quan ao ====
# (ten tep, ma, ten hien, o mac, gia, bo do mau)
# gia = 0 -> do cua bo mau, cho san luc tao nhan vat, khong ban trong tiem.
# bo  = 0 -> tang kem ca ba bo mau.
AO = [
    ('basic', 'ao_thun', 'Áo Thun', 0, 0),
    ('stripe', 'ao_soc', 'Áo Sọc', 120, 0),
    ('sporty', 'ao_the_thao', 'Áo Thể Thao', 0, 2),
    ('spaghetti', 'ao_hai_day', 'Áo Hai Dây', 140, 0),
    ('floral', 'ao_hoa', 'Áo Hoa', 180, 0),
    ('sailor', 'ao_thuy_thu', 'Áo Thuỷ Thủ', 220, 0),
    ('sailor_bow', 'ao_thuy_thu_no', 'Áo Thuỷ Thủ Nơ', 240, 0),
    ('skull', 'ao_dau_lau', 'Áo Đầu Lâu', 260, 0),
    ('overalls', 'ao_yem', 'Áo Yếm', 200, 0),
    ('suit', 'ao_vest', 'Áo Vest', 0, 3),
    ('dress', 'vay_lien', 'Váy Liền', 280, 0),
    ('clown', 'do_he', 'Đồ Hề', 420, 0),
    ('pumpkin', 'do_bi_ngo', 'Đồ Bí Ngô', 460, 0),
    ('spooky', 'do_ma', 'Đồ Ma', 500, 0),
    ('witch', 'do_phu_thuy', 'Đồ Phù Thuỷ', 520, 0),
]
QUAN = [
    ('pants', 'quan_dai', 'Quần Dài', 0, 0),
    ('pants_suit', 'quan_au', 'Quần Âu', 0, 3),
    ('skirt', 'chan_vay', 'Chân Váy', 150, 0),
]
GIAY = [('shoes', 'giay', 'Giày', 0, 0)]

# ==== Phu kien ====
# Rau ve theo 14 mau toc nen tach rieng; con lai moi mon mot ban.
PHU = [
    ('glasses', 'kinh', 'kinh_can', 'Kính Cận', 90, len(MAU_DO)),
    ('glasses_sun', 'kinh', 'kinh_ram', 'Kính Râm', 110, len(MAU_DO)),
    ('hat_cowboy', 'mu', 'mu_cao_boi', 'Mũ Cao Bồi', 260, 1),
    ('hat_lucky', 'mu', 'mu_may_man', 'Mũ May Mắn', 300, 1),
    ('hat_witch', 'mu', 'mu_phu_thuy', 'Mũ Phù Thuỷ', 340, 1),
    ('hat_pumpkin', 'mu', 'mu_bi_ngo', 'Mũ Bí Ngô', 320, 1),
    ('hat_pumpkin_purple', 'mu', 'mu_bi_ngo_tim', 'Mũ Bí Ngô Tím', 320, 1),
    ('earring_red', 'khuyen', 'khuyen_do', 'Khuyên Đỏ', 80, 1),
    ('earring_red_silver', 'khuyen', 'khuyen_do_bac', 'Khuyên Đỏ Bạc', 100, 1),
    ('earring_emerald', 'khuyen', 'khuyen_luc', 'Khuyên Lục Bảo', 80, 1),
    ('earring_emerald_silver', 'khuyen', 'khuyen_luc_bac', 'Khuyên Lục Bạc', 100, 1),
    ('mask_clown_red', 'matna', 'mat_na_he_do', 'Mặt Nạ Hề Đỏ', 200, 1),
    ('mask_clown_blue', 'matna', 'mat_na_he_xanh', 'Mặt Nạ Hề Xanh', 200, 1),
    ('mask_spooky', 'matna', 'mat_na_ma', 'Mặt Nạ Ma', 240, 1),
]

# O mac, xep dung THU TU VE cua pack (xem info.txt):
#   nguoi -> mat -> ao/quan/giay -> toc -> rau -> kinh -> mu
O_DO = [
    ('quan', 'Quần'), ('giay', 'Giày'), ('ao', 'Áo'),
    ('khuyen', 'Khuyên Tai'), ('matna', 'Mặt Nạ'),
    ('kinh', 'Kính'), ('mu', 'Mũ'),
]

BO_MAU = [
    (1, 'Bộ Đi Học', 'Áo thun quần dài, gọn gàng lúc mới lên đường'),
    (2, 'Bộ Năng Động', 'Áo thể thao, nhẹ và thoáng, tiện chạy nhảy'),
    (3, 'Bộ Lịch Sự', 'Vest quần âu, chỉn chu ra dáng người có nghề'),
]


def nguon(goc, nhom, ten):
    """Mo mot tam sheet 'di bo' cua pack."""
    p = os.path.join(goc, 'separate/walk', nhom, ten + '_walk.png') if nhom \
        else os.path.join(goc, 'separate/walk', ten + '_walk.png')
    return Image.open(p).convert('RGBA')


def cat(sheet, khoi, ra):
    """Cat mot khoi mau ra thanh tam 96x128 dung quy uoc cua game.

    khoi = so thu tu bang mau (moi bang mau chiem 8 cot lien nhau).
    """
    im = Image.new('RGBA', (O * 3, O * 4), (0, 0, 0, 0))
    for r, hp in enumerate(HANG):
        for c, kp in enumerate(COT):
            x = (khoi * 8 + kp) * O
            im.paste(sheet.crop((x, hp * O, x + O, hp * O + O)), (c * O, r * O))
    duong = os.path.join(RA, ra + '.png')
    os.makedirs(os.path.dirname(duong), exist_ok=True)
    im.save(duong, optimize=True)
    return 1


def mau_chinh(ra):
    """Mau hay gap nhat trong tam anh — dung lam o mau bay ra man chon."""
    im = Image.open(os.path.join(RA, ra + '.png')).convert('RGBA')
    dem = {}
    for r, g, b, a in list(im.convert("RGBA").getdata()):
        if a > 200:
            dem[(r, g, b)] = dem.get((r, g, b), 0) + 1
    if not dem:
        return '#888888'
    # Bo qua mau qua toi (vien den) cho o mau khong bi den si
    sang = {k: v for k, v in dem.items() if sum(k) > 150} or dem
    r, g, b = max(sang, key=sang.get)
    return '#%02x%02x%02x' % (r, g, b)


def mau_da(ra):
    """Mau da: lay o giua mat khung dung nhin thang cho khoi dinh toc/vien."""
    im = Image.open(os.path.join(RA, ra + '.png')).convert('RGBA')
    dem = {}
    for y in range(14, 22):
        for x in range(11, 21):
            r, g, b, a = im.getpixel((x, y))
            if a > 200:
                dem[(r, g, b)] = dem.get((r, g, b), 0) + 1
    if not dem:
        return mau_chinh(ra)
    r, g, b = max(dem, key=dem.get)
    return '#%02x%02x%02x' % (r, g, b)


def sang(hex_mau):
    r = int(hex_mau[1:3], 16); g = int(hex_mau[3:5], 16); b = int(hex_mau[5:7], 16)
    return 0.299 * r + 0.587 * g + 0.114 * b


def js(v):
    return json.dumps(v, ensure_ascii=False)


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    goc = sys.argv[1]
    if not os.path.isdir(os.path.join(goc, 'separate/walk')):
        raise SystemExit('Khong thay separate/walk trong %s' % goc)

    for dp, _, fs in os.walk(RA):
        for f in fs:
            os.remove(os.path.join(dp, f))
    n = 0

    # ---- Nguoi (8 tong da) ----
    for i in range(1, 9):
        n += cat(nguon(goc, '', 'char%d' % i), 0, 'nguoi/tong%d' % i)
    # Doi ten theo do sang that cua nuoc da, khong doan theo so thu tu tep
    tong = sorted((mau_da('nguoi/tong%d' % i), i) for i in range(1, 9))
    tong.sort(key=lambda x: -sang(x[0]))
    TEN_DA = ['Sáng', 'Ngà', 'Vàng Ấm', 'Rám Nắng', 'Đồng', 'Nâu', 'Nâu Đậm', 'Sẫm']
    DA = [('da%d' % (k + 1), TEN_DA[k], t[1], t[0]) for k, t in enumerate(tong)]

    # ---- Mat, ma hong, son moi ----
    sheet = nguon(goc, 'eyes', 'eyes')
    for i, (ma, _) in enumerate(MAU_MAT):
        n += cat(sheet, i, 'mat/%s' % ma)
    for tep, nhom in (('blush', 'mahong'), ('lipstick', 'sonmoi')):
        sheet = nguon(goc, 'eyes', tep)
        for i, (ma, _) in enumerate(MAU_NHAT):
            n += cat(sheet, i, '%s/%s' % (nhom, ma))

    # ---- Toc + rau ----
    for tep, _, _g in TOC:
        sheet = nguon(goc, 'hair', tep)
        for i, (ma, _) in enumerate(MAU_TOC):
            n += cat(sheet, i, 'toc/%s_%s' % (tep, ma))
    sheet = nguon(goc, 'acc', 'beard')
    for i, (ma, _) in enumerate(MAU_TOC):
        n += cat(sheet, i, 'rau/%s' % ma)

    # ---- Quan ao ----
    DO = []
    for ds, o in ((AO, 'ao'), (QUAN, 'quan'), (GIAY, 'giay')):
        for tep, ma, ten, gia, bo in ds:
            sheet = nguon(goc, 'clothes', tep)
            somau = sheet.width // O // 8
            for i in range(somau):
                mm = MAU_DO[i][0] if somau > 1 else 'goc'
                n += cat(sheet, i, '%s/%s_%s' % (o, ma, mm))
            DO.append((ma, ten, o, gia, bo, somau))

    # ---- Phu kien ----
    for tep, o, ma, ten, gia, somau in PHU:
        sheet = nguon(goc, 'acc', tep)
        that = sheet.width // O // 8
        for i in range(that):
            mm = MAU_DO[i][0] if that > 1 else 'goc'
            n += cat(sheet, i, '%s/%s_%s' % (o, ma, mm))
        DO.append((ma, ten, o, gia, 0, that))

    # ==== js/data/nhanvat.js ====
    def bang(ds, mau=None, gioi_o=None):
        ra = []
        for h in ds:
            if mau:
                ra.append('{ id: %s, name: %s, mau: %s }' % (js(h[0]), js(h[1]), js(mau(h[0]))))
            elif gioi_o is not None:
                ra.append('{ id: %s, name: %s, gioi: %s }' % (js(h[0]), js(h[1]), js(h[gioi_o])))
            else:
                ra.append('{ id: %s, name: %s }' % (js(h[0]), js(h[1])))
        return '[' + ', '.join(ra) + ']'

    dong = [
        '// TuxeWorld H5 | data/nhanvat.js | Danh mục ngoại hình + quần áo nhân vật',
        '// SINH TU DONG boi tools/cozy.py — KHONG SUA TAY.',
        '//',
        '// Ô 32x32, thân người cao 20px — đúng bằng tỉ lệ NPC của Tuxemon (0.625)',
        '// nên nhân vật chính và NPC cùng một cỡ pixel, không cái nào mịn hơn cái nào.',
        '// Mỗi tệp là một LỚP rời; engine/avatar.js chồng lên nhau thành sprite.',
        '',
        'export const THU_MUC = %s;' % js(RA),
        '',
        '// Giới tính chọn TRƯỚC. Bộ sprite này vẽ chung một thân cho cả hai giới,',
        '// nên giới tính chỉ dùng để LỌC danh sách kiểu tóc và bộ đồ gợi ý.',
        'export const GIOI = [{ id: "nam", name: "Nam" }, { id: "nu", name: "Nữ" }];',
        '',
        '// Nước da: tệp nguồn char1..char8 không xếp theo độ sáng, nên bảng này',
        '// đã sắp lại từ sáng tới sẫm và `tep` mới là số thứ tự tệp thật.',
        'export const DA = [',
    ]
    for ma, ten, tep, mau in DA:
        dong.append('  { id: %s, name: %s, tep: %d, mau: %s },'
                    % (js(ma), js(ten), tep, js(mau)))
    dong += ['];', '']
    dong.append('export const MAT = %s;'
                % bang(MAU_MAT, lambda a: mau_chinh('mat/%s' % a)))
    dong.append('export const MA_HONG = %s;' % bang(MAU_NHAT))
    dong.append('export const SON_MOI = %s;' % bang(MAU_NHAT))
    dong.append('export const TOC_KIEU = %s;' % bang(TOC, gioi_o=2))
    dong.append('export const TOC_MAU = %s;'
                % bang(MAU_TOC, lambda a: mau_chinh('toc/%s_%s' % (TOC[0][0], a))))
    dong.append('export const RAU_MAU = %s;'
                % bang(MAU_TOC, lambda a: mau_chinh('rau/%s' % a)))
    dong.append('export const DO_MAU = %s;'
                % bang(MAU_DO, lambda a: mau_chinh('ao/ao_thun_%s' % a)))
    dong += ['', '// Ô mặc, xếp theo THỨ TỰ VẼ (trước ra sau)', 'export const O_DO = [']
    for ma, ten in O_DO:
        dong.append('  { id: %s, name: %s },' % (js(ma), js(ten)))
    dong += ['];', '',
             '// somau = món này có mấy bản màu (1 nghĩa là chỉ một bản, hậu tố "goc").',
             '// gia = 0 nghĩa là đồ của bộ mẫu, cho sẵn lúc tạo nhân vật, không bán.',
             'export const DO = [']
    for ma, ten, o, gia, bo, somau in DO:
        dong.append('  { id: %s, name: %s, o: %s, gia: %d, bo: %d, somau: %d },'
                    % (js(ma), js(ten), js(o), gia, bo, somau))
    dong += ['];', '',
             'export const DO_BY_ID = Object.fromEntries(DO.map(d => [d.id, d]));', '',
             '// Ba bộ đồ mẫu cho chọn lúc tạo nhân vật. Giày tặng kèm cả ba bộ.',
             'export const BO_MAU = [']
    for so, ten, mo in BO_MAU:
        dong.append('  { so: %d, name: %s, desc: %s },' % (so, js(ten), js(mo)))
    dong += ['];', '',
             '// Món của bộ mẫu số `so`, kèm mấy món tặng chung (bo === 0).',
             'export const monBoMau = (so) =>',
             '  DO.filter(d => d.gia === 0 && (d.bo === so || d.bo === 0)).map(d => d.id);',
             '']

    with open(DL, 'w', encoding='utf-8') as f:
        f.write('\n'.join(dong) + '\n')

    tong_b = sum(os.path.getsize(os.path.join(dp, f))
                 for dp, _, fs in os.walk(RA) for f in fs)
    print('OK: %d lớp sprite -> %s (%.1f MB)' % (n, RA, tong_b / 1024 / 1024))
    print('OK: %d nước da, %d kiểu tóc x %d màu, %d món đồ -> %s'
          % (len(DA), len(TOC), len(MAU_TOC), len(DO), DL))


if __name__ == '__main__':
    main()
