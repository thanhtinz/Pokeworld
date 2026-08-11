# -*- coding: utf-8 -*-
"""Cat SPRITE TOA NHA BANG + GIUONG NHA TRO.

Chay:  python3 tools/mknoithat.py <duong-dan-kho-Tuxemon>

Ghi de:
  assets/noithat/bang_<n>.png  ba toa nha cua bang, dung tren ban do Bang Duong
  assets/noithat/do_<n>.png    giuong ke trong nha tro chung
  js/data/noithat.js           bang kich thuoc (SINH MAY, dung sua tay)

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

# Tep nguon: (ten tileset, khoang kich thuoc chap nhan)
NGUON_DO = ('Furniture_and_Fittings_by_George.png', (12, 12), (64, 80))
# Nha trong sheet dinh sat nhau nen flood fill gop het thanh mot cum — phai
# cat theo KHUNG CO DINH do tay tren anh goc (MK_buildings.png, 512x448).
NGUON_NHA = 'MK_buildings.png'
# Toa nha cua BANG HOI dung tren ban do Bang Duong (tools/bangduong.py).
# Khong phai nha o nen khong co gia, chi can anh.
KHUNG_BANG = [
    ('bang_sanh', 'Sảnh Bang', (400, 144, 478, 208)),   # nha da xam, cua chinh
    ('bang_dien', 'Điện Thủ Hộ', (320, 144, 398, 208)),  # nha go, cua lua
    ('bang_kho', 'Kho Bang', (240, 144, 318, 208)),      # kho go
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


def cat(root, tep, min_wh, max_wh, thu_muc, tien_to, gioi_han, giu=None):
    """Cat sheet ra tung cum. `giu` la tap chi so THAT SU ghi ra tep anh.

    Van phai do het cac cum truoc do: thu tu cum quyet dinh mon nao la mon nao,
    bo qua nua chung thi chi so lech het."""
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
        if giu is None or i in giu:
            con.resize((con.width * SCALE, con.height * SCALE), Image.NEAREST).save(
                os.path.join(thu_muc, ten), optimize=True)
        ra.append({'file': ten, 'w': x1 - x0, 'h': y1 - y0})
    return ra


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


# Nha tro chung ke bang chinh sprite noi that nay, khong phai cat them anh
# rieng. Sheet cat ra theo thu tu cum, cai giuong don la cum thu 12.
TEN_DO = [None] * 11 + [('giuong_don', 'Giường Đơn')]
CHI_SO_GIUONG = 11


def js(v):
    return json.dumps(v, ensure_ascii=False)


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    root = sys.argv[1]

    do = cat(root, NGUON_DO[0], NGUON_DO[1], NGUON_DO[2],
             'assets/noithat', 'do', len(TEN_DO), {CHI_SO_GIUONG})
    bang = catKhung(root, NGUON_NHA, [k[2] for k in KHUNG_BANG],
                    'assets/noithat', 'bang')

    out = ["// TuxeWorld H5 | data/noithat.js | SINH TỰ ĐỘNG bởi tools/mknoithat.py",
           "// KHONG SUA TAY. Ảnh cắt từ gfx/tilesets của Tuxemon (CC BY-SA 4.0).",
           "//",
           "// Chỉ còn hai thứ dựng sẵn: ba toà nhà của bang trên bản đồ Bang Đường,",
           "// và cái giường kê trong nhà trọ chung.",
           ""]

    out.append('// Toà nhà của bang hội, dựng trên bản đồ Bang Đường')
    out.append('export const TOA_BANG = {')
    for i, (bid, ten, _k) in enumerate(KHUNG_BANG):
        a = bang[i]
        out.append('  %s: { name: %s, img: %s, w: %d, h: %d },'
                   % (bid, js(ten), js('assets/noithat/' + a['file']), a['w'], a['h']))
    out.append('};')
    out.append('')

    a = do[CHI_SO_GIUONG]
    slug, ten = TEN_DO[CHI_SO_GIUONG]
    out.append('// Giường trong nhà trọ chung — w/h là số Ô nó chiếm')
    out.append('export const GIUONG_TRO = { id: %s, name: %s, img: %s, w: %d, h: %d };'
               % (js(slug), js(ten), js('assets/noithat/' + a['file']),
                  max(1, round(a['w'] / 16)), max(1, round(a['h'] / 16))))
    out.append('')

    with open('js/data/noithat.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(out))
    print('OK: %d toà nhà bang + giường nhà trọ' % len(bang))


if __name__ == '__main__':
    main()
