# -*- coding: utf-8 -*-
"""Cat SPRITE NHA + DO TRANG TRI cho he thong mua dat / xay nha.

Chay:  python3 tools/mkestate.py <duong-dan-kho-Tuxemon>

Ghi de:
  assets/estate/nha_<n>.png    mau nha dat tren khu dat
  assets/estate/do_<n>.png     do trang tri trong nha
  js/data/estate.js            bang gia + kich thuoc (SINH MAY, dung sua tay)

Nguon: gfx/tilesets cua Tuxemon — anh CC BY-SA 4.0, xem CREDITS.md.

CACH CAT
Tileset ve moi mon mot cho, khong theo luoi deu, nen do toa do bang tay la sai.
Tep nay do CUM DIEM ANH LIEN NHAU (flood fill) roi lay khung bao quanh tung
cum — moi mon do dac ra mot cum. Loc theo kich thuoc de bo mau vun.
"""
import json
import os
import sys
from collections import deque

from PIL import Image

SCALE = 3                      # phong cho net tren man hinh dien thoai

# Tep nguon: (ten tileset, so mon lay, khoang kich thuoc chap nhan)
NGUON_DO = ('Furniture_and_Fittings_by_George.png', (12, 12), (64, 80))
# Nha trong sheet dinh sat nhau nen flood fill gop het thanh mot cum — phai
# cat theo KHUNG CO DINH do tay tren anh goc (MK_buildings.png, 512x448).
NGUON_NHA = 'MK_buildings.png'
# Xep theo GIA tang dan cho khop bang TEN_NHA ben duoi
KHUNG_NHA = [
    (160, 144, 238, 208),     # nha go mai nau — re nhat
    (0, 208, 79, 288),        # nha go khung xuong ca
    (0, 144, 79, 208),        # tiem gach do mai ngoi
    (80, 208, 158, 288),      # nha da hai tang — dat nhat
]


def cum(im, min_wh, max_wh):
    """Tra ve danh sach khung bao (x0,y0,x1,y1) cua tung cum diem anh lien nhau."""
    w, h = im.size
    px = im.load()
    da = [[False] * w for _ in range(h)]
    ra = []
    for y in range(h):
        for x in range(w):
            if da[y][x] or px[x, y][3] < 40:
                continue
            q = deque([(x, y)])
            da[y][x] = True
            x0 = x1 = x
            y0 = y1 = y
            n = 0
            while q:
                cx, cy = q.popleft()
                n += 1
                x0 = min(x0, cx); x1 = max(x1, cx)
                y0 = min(y0, cy); y1 = max(y1, cy)
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h and not da[ny][nx] \
                                and px[nx, ny][3] >= 40:
                            da[ny][nx] = True
                            q.append((nx, ny))
            bw, bh = x1 - x0 + 1, y1 - y0 + 1
            if min_wh[0] <= bw <= max_wh[0] and min_wh[1] <= bh <= max_wh[1] and n > 60:
                ra.append((x0, y0, x1 + 1, y1 + 1, n))
    # Mon to ve truoc cho de nhin, roi theo vi tri trong tep cho on dinh
    ra.sort(key=lambda r: (r[1], r[0]))
    return ra


def cat(root, tep, min_wh, max_wh, thu_muc, tien_to, gioi_han):
    p = os.path.join(root, 'mods/tuxemon/gfx/tilesets', tep)
    if not os.path.exists(p):
        raise SystemExit('Khong thay %s' % p)
    im = Image.open(p).convert('RGBA')
    ds = cum(im, min_wh, max_wh)[:gioi_han]
    os.makedirs(thu_muc, exist_ok=True)
    ra = []
    for i, (x0, y0, x1, y1, _) in enumerate(ds):
        con = im.crop((x0, y0, x1, y1))
        ten = '%s_%02d.png' % (tien_to, i)
        con.resize((con.width * SCALE, con.height * SCALE), Image.NEAREST).save(
            os.path.join(thu_muc, ten), optimize=True)
        ra.append({'file': ten, 'w': x1 - x0, 'h': y1 - y0})
    return ra


# Ten tieng Viet + gia cho tung mon, theo dung thu tu cat ra.
# Mon nao khong dat ten thi lay ten chung.
def catKhung(root, tep, khung, thu_muc, tien_to):
    p = os.path.join(root, 'mods/tuxemon/gfx/tilesets', tep)
    im = Image.open(p).convert('RGBA')
    os.makedirs(thu_muc, exist_ok=True)
    ra = []
    for i, (x0, y0, x1, y1) in enumerate(khung):
        con = im.crop((x0, y0, x1, y1))
        bb = con.split()[3].getbbox() or (0, 0, con.width, con.height)
        con = con.crop(bb)
        ten = '%s_%02d.png' % (tien_to, i)
        con.resize((con.width * SCALE, con.height * SCALE), Image.NEAREST).save(
            os.path.join(thu_muc, ten), optimize=True)
        ra.append({'file': ten, 'w': con.width, 'h': con.height})
    return ra


# Ten dat theo dung thu tu cum cat ra (da xem tan mat contact sheet)
TEN_DO = [
    ('thung', 'Thùng Gỗ', 600), ('binh', 'Bình Sứ', 900),
    ('gio', 'Giỏ Mây', 500), ('vach_go', 'Vách Gỗ', 700),
    ('tuong', 'Tượng Đá', 3500), ('chau_tim', 'Chậu Hoa Tím', 1200),
    ('chau_vang', 'Chậu Hoa Vàng', 1200), ('chum', 'Chum Sành', 800),
    ('den', 'Đèn Đứng', 2200), ('ban', 'Bàn Gỗ', 1600),
    ('giuong_doi', 'Giường Đôi', 4500), ('giuong_don', 'Giường Đơn', 3000),
    ('ghe_don', 'Ghế Đôn', 500), ('leu', 'Lều Vải', 6000),
]

TEN_NHA = [
    ('nha_go', 'Nhà Gỗ', 30000, 'Một gian gỗ mộc, đủ kê cái giường với cái bàn.'),
    ('nha_khung', 'Nhà Khung Gỗ', 90000, 'Rộng hơn hẳn, có cả cửa sổ nhìn ra vườn.'),
    ('nha_ngoi', 'Nhà Mái Ngói', 200000, 'Mái ngói đỏ, nhìn từ ngoài đã thấy tươm tất.'),
    ('nha_da', 'Nhà Đá Hai Tầng', 500000, 'To nhất khu — hàng xóm nhìn sang là biết chủ nhà khá.'),
]


def js(v):
    return json.dumps(v, ensure_ascii=False)


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    root = sys.argv[1]

    do = cat(root, NGUON_DO[0], NGUON_DO[1], NGUON_DO[2],
             'assets/estate', 'do', len(TEN_DO))
    nha = catKhung(root, NGUON_NHA, KHUNG_NHA, 'assets/estate', 'nha')

    out = ["// TuxeWorld H5 | data/estate.js | Nhà đất — SINH TỰ ĐỘNG bởi tools/mkestate.py",
           "// KHONG SUA TAY. Ảnh cắt từ gfx/tilesets của Tuxemon (CC BY-SA 4.0).",
           ""]

    out.append('// Mẫu nhà dựng trên khu đất — giá khác nhau, nhà càng to càng nhiều ô kê đồ')
    out.append('export const HOUSE_BASES = [')
    for i, (slug, ten, gia, mo) in enumerate(TEN_NHA):
        if i >= len(nha):
            break
        a = nha[i]
        o = max(4, min(10, 4 + i * 2))       # so o moi chieu trong nha
        out.append('  { id: %s, name: %s, price: %d, desc: %s, img: %s, w: %d, h: %d, o: %d },'
                   % (js(slug), js(ten), gia, js(mo),
                      js('assets/estate/' + a['file']), a['w'], a['h'], o))
    out.append('];')
    out.append('')

    out.append('// Đồ trang trí: w/h là số Ô nó chiếm trong nhà')
    out.append('export const FURNITURE = [')
    for i, (slug, ten, gia) in enumerate(TEN_DO):
        if i >= len(do):
            break
        a = do[i]
        out.append('  { id: %s, name: %s, price: %d, img: %s, w: %d, h: %d },'
                   % (js(slug), js(ten), gia, js('assets/estate/' + a['file']),
                      max(1, round(a['w'] / 16)), max(1, round(a['h'] / 16))))
    out.append('];')
    out.append('')
    out.append('export const BASE_BY_ID = Object.fromEntries(HOUSE_BASES.map(b => [b.id, b]));')
    out.append('export const FURN_BY_ID = Object.fromEntries(FURNITURE.map(f => [f.id, f]));')
    out.append('')

    with open('js/data/estate.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(out))
    print('OK: %d mẫu nhà, %d món trang trí' % (min(len(nha), len(TEN_NHA)),
                                                min(len(do), len(TEN_DO))))


if __name__ == '__main__':
    main()
