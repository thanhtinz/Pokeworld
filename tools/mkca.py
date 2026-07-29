#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sinh danh muc CA + icon cho tinh nang cau ca.

    python3 tools/mkca.py

Khong doc kho ngoai nao: icon tu ve bang hinh khoi co ban (giong
tools/mkfood.py va tools/mkicons.py), du lieu thi khai ngay trong tep nay.

Vi sao tu ve: ca khong co san trong kho Tuxemon, ma di kiem pack ngoai thi lai
vuong giay phep. Ve bang code thi khong phu thuoc ai, va sua mot dong la ca bo
doi theo.

Sinh ra:
  assets/ca/<ma>.png     — icon 32x32 tung loai
  js/data/ca.js          — danh muc ca + bang cho cau
"""
import json
import os

from PIL import Image, ImageDraw

RA = 'assets/ca'
DL = 'js/data/ca.js'
O = 32

# ==== Cho cau: moi cho mot bang ca rieng ====
# (ma, ten, mo ta)
CHO = [
    ('ao_nong_trai', 'Ao Nông Trại', 'Ao nước ngay trong nông trại, cá hiền, hợp người mới.'),
    ('song_taba', 'Sông Taba', 'Nước chảy quanh thị trấn, cá to hơn và khó lừa hơn.'),
    ('bien_pepper', 'Biển Pepper', 'Sóng lớn gió to. Chỗ duy nhất câu được cá quý.'),
]

# ==== Danh muc ca ====
# (ma, ten, hiem, cho, dai_min, dai_max, gia_mot_cm, mau than, mau vay, mo ta)
#   hiem: 1 thuong · 2 kha · 3 hiem · 4 huyen thoai
# Gia ban = dai (cm) * gia_mot_cm, nen con cang to ban cang duoc tien.
CA = [
    # --- Hồ ---
    ('ca_ro', 'Cá Rô', 1, 'ao_nong_trai', 8, 22, 4, '#6b7a3a', '#9aad55',
     'Con cá quen mặt nhất ao hồ. Nhỏ mà lì.'),
    ('ca_diec', 'Cá Diếc', 1, 'ao_nong_trai', 10, 26, 5, '#8a8f6a', '#b9bd8e',
     'Thịt lành, dân câu hay bắt được lúc sáng sớm.'),
    ('ca_chep', 'Cá Chép', 2, 'ao_nong_trai', 20, 55, 7, '#9a6b2f', '#d19a4a',
     'Vảy vàng óng. Câu được con to là cả buổi vui.'),
    ('ca_tre', 'Cá Trê', 2, 'ao_nong_trai', 18, 48, 8, '#3f3a33', '#6b6155',
     'Râu dài, trơn tuột, giãy khoẻ hơn vẻ ngoài.'),
    ('ca_qua', 'Cá Quả', 3, 'ao_nong_trai', 30, 70, 11, '#3c4a3a', '#65785c',
     'Săn mồi cỡ bự của hồ. Cắn câu là cần cong hẳn.'),
    # --- Sông ---
    ('ca_bong', 'Cá Bống', 1, 'song_taba', 6, 18, 5, '#7a6a55', '#a89478',
     'Nằm sát đáy, hay rúc vào khe đá.'),
    ('ca_lang', 'Cá Lăng', 2, 'song_taba', 25, 60, 9, '#5a5f6b', '#8b91a0',
     'Cá sông thịt chắc, dân sành ăn săn lùng.'),
    ('ca_chien', 'Cá Chiên', 3, 'song_taba', 35, 85, 13, '#4a4230', '#7d7150',
     'To và dữ. Cần yếu là gãy làm đôi.'),
    ('ca_anh_vu', 'Cá Anh Vũ', 4, 'song_taba', 28, 62, 26, '#8b3a3a', '#d46a5a',
     'Xưa chỉ dành tiến vua. Cả tháng chưa chắc gặp một con.'),
    # --- Biển ---
    ('ca_nuc', 'Cá Nục', 1, 'bien_pepper', 12, 28, 6, '#5f7a8a', '#93b0be',
     'Đi thành đàn, cắn câu liên tục.'),
    ('ca_thu', 'Cá Thu', 2, 'bien_pepper', 30, 75, 10, '#3d5a6b', '#6f93a5',
     'Bơi nhanh như tên. Kéo mỏi cả tay.'),
    ('ca_ngu', 'Cá Ngừ', 3, 'bien_pepper', 50, 120, 15, '#2f4a5e', '#5b7f9a',
     'Nặng như hòn đá, khoẻ như con trâu.'),
    ('ca_mu_do', 'Cá Mú Đỏ', 3, 'bien_pepper', 35, 80, 17, '#9b3730', '#d4675a',
     'Đỏ au, nấp trong rạn. Nhà hàng trả giá cao.'),
    ('ca_rong_bien', 'Cá Rồng Biển', 4, 'bien_pepper', 60, 150, 30, '#2b6b6b', '#4fb3a8',
     'Người ta đồn thấy nó thì cả năm gặp may.'),
]

# Ten hien cua tung bac hiem
HIEM = [(1, 'Thường', '#9aa4b2'), (2, 'Khá', '#5bc0eb'),
        (3, 'Hiếm', '#c77dff'), (4, 'Huyền Thoại', '#ffd43b')]

# Xac suat can cau theo bac hiem (cang hiem cang kho). Chuan hoa trong js.
TRONG_SO = {1: 100, 2: 45, 3: 14, 4: 2}

# Can cau: (ma, ten, gia, bac cau duoc, mau can tren ban do, mo ta)
# `bac` = cau duoc ca toi bac hiem nao. Can xin thi khong bao gio dinh ca quy.
# `mau` = ten lop can trong assets/nv_cau/can (xem tools/cozy.py), de nhan vat
# tren ban do cam dung cai can dang dung chu khong phai lúc nào cũng một cái.
CAN = [
    ('can_tre', 'Cần Tre', 0, 2, 'nau', 'Cần gộc tự vót. Chỉ với tới cá thường và khá.'),
    ('can_go', 'Cần Gỗ', 3500, 3, 'goc', 'Dẻo hơn, kéo được cá hiếm mà không gãy.'),
    ('can_thep', 'Cần Thép', 18000, 4, 'xanh', 'Lõi thép. Cá huyền thoại cũng gồng được.'),
]


def ve_ca(ma, than, vay, dai_max):
    """Ve mot con ca 32x32: than bau duc, duoi tam giac, mat, vay lung."""
    im = Image.new('RGBA', (O, O), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # Ca cang dai thi ve cang to, nhung van nam gon trong o
    r = min(1.0, 0.55 + dai_max / 260.0)
    w = int(20 * r)
    h = int(11 * r)
    x0 = (O - w) // 2 + 2
    y0 = (O - h) // 2
    vien = '#1a1420'
    # duoi
    d.polygon([(x0 - 1, y0 + h // 2), (x0 - 7, y0 - 2), (x0 - 7, y0 + h + 2)],
              fill=vay, outline=vien)
    # than
    d.ellipse([x0, y0, x0 + w, y0 + h], fill=than, outline=vien)
    # vay lung
    d.polygon([(x0 + w // 3, y0 + 1), (x0 + w // 2, y0 - 4),
               (x0 + 2 * w // 3, y0 + 1)], fill=vay, outline=vien)
    # bung sang
    d.ellipse([x0 + 3, y0 + h // 2, x0 + w - 3, y0 + h - 1], fill=vay)
    # mat
    mx, my = x0 + w - 5, y0 + h // 3
    d.ellipse([mx, my, mx + 3, my + 3], fill='#ffffff', outline=vien)
    d.point((mx + 1, my + 1), fill=vien)
    d.point((mx + 2, my + 1), fill=vien)
    os.makedirs(RA, exist_ok=True)
    im.save(os.path.join(RA, ma + '.png'), optimize=True)


def js(v):
    return json.dumps(v, ensure_ascii=False)


def main():
    for f in os.listdir(RA) if os.path.isdir(RA) else []:
        os.remove(os.path.join(RA, f))
    for ma, _t, _h, _c, _mn, mx, _g, than, vay, _mo in CA:
        ve_ca(ma, than, vay, mx)

    dong = [
        '// TuxeWorld H5 | data/ca.js | Danh mục cá + chỗ câu + cần câu',
        '// SINH TU DONG boi tools/mkca.py — KHONG SUA TAY.',
        '//',
        '// Icon vẽ bằng code (assets/ca) chứ không lấy từ kho nào: cá không có',
        '// sẵn trong Tuxemon, mà kiếm pack ngoài thì lại vướng giấy phép.',
        '',
        'export const THU_MUC_CA = %s;' % js(RA),
        '',
        '// Bậc hiếm: càng cao càng khó cắn câu, bán cũng càng được giá.',
        'export const HIEM = [',
    ]
    for b, ten, mau in HIEM:
        dong.append('  { bac: %d, name: %s, mau: %s },' % (b, js(ten), js(mau)))
    dong += ['];', '',
             '// Trọng số cắn câu theo bậc hiếm (chưa chuẩn hoá).',
             'export const TRONG_SO = %s;' % js({str(k): v for k, v in TRONG_SO.items()}),
             '', 'export const CHO_CAU = [']
    for ma, ten, mo in CHO:
        dong.append('  { id: %s, name: %s, desc: %s },' % (js(ma), js(ten), js(mo)))
    dong += ['];', '',
             '// giaCm = tiền trên mỗi cm, nên con càng dài bán càng được giá.',
             'export const CA = [']
    for ma, ten, hiem, cho, mn, mx, gia, than, vay, mo in CA:
        dong.append('  { id: %s, name: %s, hiem: %d, cho: %s, dai: [%d, %d], '
                    'giaCm: %d, mau: %s, desc: %s },'
                    % (js(ma), js(ten), hiem, js(cho), mn, mx, gia, js(than), js(mo)))
    dong += ['];', '',
             'export const CA_BY_ID = Object.fromEntries(CA.map(c => [c.id, c]));',
             '',
             '// Cần câu: `bac` = câu được cá tới bậc hiếm nào, `mau` = lớp cần',
             '// vẽ trên bản đồ lúc thả câu (assets/nv_cau/can).',
             'export const CAN = [']
    for ma, ten, gia, bac, mau, mo in CAN:
        dong.append('  { id: %s, name: %s, gia: %d, bac: %d, mau: %s, desc: %s },'
                    % (js(ma), js(ten), gia, bac, js(mau), js(mo)))
    dong += ['];', '',
             'export const CAN_BY_ID = Object.fromEntries(CAN.map(c => [c.id, c]));',
             '',
             '/** Ảnh icon của một loài cá. */',
             'export const anhCa = (id) => `${THU_MUC_CA}/${id}.png`;',
             '']

    with open(DL, 'w', encoding='utf-8') as f:
        f.write('\n'.join(dong) + '\n')

    # Bang xep hang cham diem o MAY CHU, ma may chu khong doc duoc js/data.
    # Nen xuat them mot ban gon chi co thu can de tinh diem — dung y het cong
    # thuc cua engine/cauca.js, lech mot ly la thu hang sai.
    sv = [
        '// TuxeWorld H5 | server/src/ca.data.js | Bậc hiếm của từng loài cá',
        '// SINH TU DONG boi tools/mkca.py — KHONG SUA TAY.',
        '// Máy chủ dùng bảng này để chấm điểm câu cá cho bảng xếp hạng.',
        'export const HIEM_CA = %s;' % js({m: h for m, _t, h, *_ in CA}),
        '',
        '// Phải khớp y hệt diemCauCa() bên js/engine/cauca.js',
        'export function diemCauCa(save) {',
        '  const dex = save?.ca?.dex || {};',
        '  let d = 0;',
        '  for (const [id, v] of Object.entries(dex)) {',
        '    const h = HIEM_CA[id];',
        '    if (h) d += Math.round((v?.dai || 0) * (1 + (h - 1) * 0.6));',
        '  }',
        '  return d;',
        '}',
    ]
    with open('server/src/ca.data.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(sv) + '\n')

    tong = sum(os.path.getsize(os.path.join(RA, f)) for f in os.listdir(RA))
    print('OK: %d loài cá, %d chỗ câu, %d cần -> %s (%.1f KB icon)'
          % (len(CA), len(CHO), len(CAN), DL, tong / 1024))


if __name__ == '__main__':
    main()
