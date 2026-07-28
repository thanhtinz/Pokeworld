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
def catTheoChiSo(root, tep, min_wh, max_wh, thu_muc, tien_to, chi_so):
    """Cat dung nhung cum da chon trong sheet, giu nguyen ten tep theo chi so.

    Khac ham cat() o cho: sheet nay to, cat het thi ra 147 mon, phan lon la
    bang hieu / xe co / do phong thi nghiem chu khong phai noi that — nen chi
    lay dung nhung cum minh da xem va dat ten.
    """
    p = os.path.join(root, 'mods/tuxemon/gfx/tilesets', tep)
    if not os.path.exists(p):
        raise SystemExit('Khong thay %s' % p)
    im = Image.open(p).convert('RGBA')
    ds = cum(im, min_wh, max_wh)
    os.makedirs(thu_muc, exist_ok=True)
    ra = {}
    for i in chi_so:
        if i >= len(ds):
            raise SystemExit('Sheet %s chi co %d cum, khong co cum %d'
                             % (tep, len(ds), i))
        x0, y0, x1, y1, _ = ds[i]
        con = im.crop((x0, y0, x1, y1))
        ten = '%s_%03d.png' % (tien_to, i)
        con.resize((con.width * SCALE, con.height * SCALE), Image.NEAREST).save(
            os.path.join(thu_muc, ten), optimize=True)
        ra[i] = {'file': ten, 'w': x1 - x0, 'h': y1 - y0}
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


# Ten dat theo dung thu tu cum cat ra (da xem tan mat contact sheet).
# Truong thu 4 la KIEU TUONG TAC (xem js/engine/furniture.js):
#   nam  = nam len duoc      ngoi = ngoi len duoc
#   ban  = bay do an         den  = bat/tat den
#   tam  = tam rua           nau  = nau an
#   ''   = chi de nhin
# Truong thu 5 la NHOM, dung chia tab ben cua hang bac tho moc.
TEN_DO = [
    ('thung', 'Thùng Gỗ', 600, '', 'kho'),
    ('binh', 'Bình Sứ', 900, '', 'trang_tri'),
    ('gio', 'Giỏ Mây', 500, '', 'kho'),
    ('vach_go', 'Vách Gỗ', 700, '', 'trang_tri'),
    ('tuong', 'Tượng Đá', 3500, '', 'trang_tri'),
    ('chau_tim', 'Chậu Hoa Tím', 1200, '', 'trang_tri'),
    ('chau_vang', 'Chậu Hoa Vàng', 1200, '', 'trang_tri'),
    ('chum', 'Chum Sành', 800, '', 'kho'),
    ('den', 'Đèn Đứng', 2200, 'den', 'trang_tri'),
    ('ban', 'Bàn Gỗ', 1600, 'ban', 'ban_tu'),
    ('giuong_doi', 'Giường Đôi', 4500, 'nam', 'nghi'),
    ('giuong_don', 'Giường Đơn', 3000, 'nam', 'nghi'),
    ('ghe_don', 'Ghế Đôn', 500, 'ngoi', 'nghi'),
    ('leu', 'Lều Vải', 6000, 'nam', 'nghi'),
]

# Bo thu hai, cat tu 'core_set pieces.png' — sheet nay nhieu do noi that hon
# han, du de nguoi choi co cai ma chon. So dau la CHI SO CUM trong sheet do
# (thu tu cum on dinh vi ham cum() sap xep theo vi tri).
NGUON_DO2 = ('core_set pieces.png', (8, 8), (96, 96))
TEN_DO2 = [
    (7, 'ghe_do_tron', 'Ghế Đỏ Tròn', 700, 'ngoi', 'nghi'),
    (13, 'bon_cau', 'Bồn Cầu', 1800, '', 'bep_tam'),
    (14, 'bon_rua', 'Bồn Rửa Mặt', 2200, 'tam', 'bep_tam'),
    (15, 'quay_bep_nho', 'Quầy Bếp Nhỏ', 3200, 'nau', 'bep_tam'),
    (17, 'thang_sat', 'Thang Sắt', 1400, '', 'trang_tri'),
    (19, 'may_giat', 'Máy Giặt', 5200, '', 'bep_tam'),
    (20, 'ruong_go', 'Rương Gỗ', 1500, '', 'kho'),
    (21, 'tu_quan_ao', 'Tủ Quần Áo', 3800, '', 'ban_tu'),
    (22, 'ban_lam_viec', 'Bàn Làm Việc', 4200, 'ban', 'ban_tu'),
    (33, 'tu_lanh', 'Tủ Lạnh', 6000, 'nau', 'bep_tam'),
    (35, 'thung_rac', 'Thùng Rác', 400, '', 'kho'),
    (38, 'dai_phun', 'Đài Phun Nước', 15000, '', 'trang_tri'),
    (48, 'chau_dau', 'Chậu Dâu', 1100, '', 'trang_tri'),
    (49, 'chau_nho', 'Chậu Nho', 1100, '', 'trang_tri'),
    (50, 'chau_ngoc', 'Chậu Ngọc', 1300, '', 'trang_tri'),
    (51, 'chau_biec', 'Chậu Biếc', 1100, '', 'trang_tri'),
    (52, 'don_xanh_duong', 'Đôn Xanh Dương', 600, 'ngoi', 'nghi'),
    (53, 'don_xanh_la', 'Đôn Xanh Lá', 600, 'ngoi', 'nghi'),
    (54, 'don_hong', 'Đôn Hồng', 600, 'ngoi', 'nghi'),
    (55, 'don_vang', 'Đôn Vàng', 600, 'ngoi', 'nghi'),
    (56, 'bon_tam', 'Bồn Tắm', 9000, 'tam', 'bep_tam'),
    (65, 'rao_chan', 'Rào Chắn', 500, '', 'kho'),
    (66, 'cay_canh', 'Cây Cảnh', 2600, '', 'trang_tri'),
    (67, 'quay_du', 'Quầy Dù', 7000, '', 'trang_tri'),
    (70, 'tranh_bien', 'Tranh Biển', 1900, '', 'trang_tri'),
    (86, 'ghe_tua', 'Ghế Tựa', 1200, 'ngoi', 'nghi'),
    (87, 'ghe_go', 'Ghế Gỗ', 900, 'ngoi', 'nghi'),
    (88, 'ban_tron', 'Bàn Tròn', 2400, 'ban', 'ban_tu'),
    (97, 'ghe_bang', 'Ghế Băng', 2000, 'ngoi', 'nghi'),
    (98, 'tu_ngan_keo', 'Tủ Ngăn Kéo', 4000, '', 'ban_tu'),
    (100, 'giuong_xanh_doi', 'Giường Xanh Đôi', 6500, 'nam', 'nghi'),
    (101, 'giuong_xanh_don', 'Giường Xanh Đơn', 4200, 'nam', 'nghi'),
    (102, 'quay_bep', 'Quầy Bếp', 7500, 'nau', 'bep_tam'),
    (103, 'tu_bep', 'Tủ Bếp', 5000, 'nau', 'bep_tam'),
    (104, 'ke_sach', 'Kệ Sách', 3400, '', 'ban_tu'),
    (106, 'lo_suoi', 'Lò Sưởi', 8800, '', 'trang_tri'),
    (107, 'chau_hoa_nho', 'Chậu Hoa Nhỏ', 600, '', 'trang_tri'),
    (109, 'tranh_chan_dung', 'Tranh Chân Dung', 2100, '', 'trang_tri'),
    (110, 'tranh_tinh_vat', 'Tranh Tĩnh Vật', 1800, '', 'trang_tri'),
    (111, 'tranh_ban_do', 'Tranh Bản Đồ', 2000, '', 'trang_tri'),
    (112, 'bang_den', 'Bảng Đen', 2800, '', 'trang_tri'),
    (114, 'quay_go', 'Quầy Gỗ', 9500, 'ban', 'ban_tu'),
    (116, 'ke_hang', 'Kệ Hàng', 11000, '', 'ban_tu'),
    (119, 'tranh_phong_canh', 'Tranh Phong Cảnh', 3000, '', 'trang_tri'),
    (121, 'gio_do', 'Giỏ Đồ', 450, '', 'kho'),
    (123, 'tuong_thien_than', 'Tượng Thiên Thần', 6500, '', 'trang_tri'),
    (124, 'chau_da', 'Chậu Đá', 900, '', 'trang_tri'),
    (125, 'chau_qua', 'Chậu Quả', 1000, '', 'trang_tri'),
    (126, 'chum_dat', 'Chum Đất', 700, '', 'kho'),
    (127, 'co_theu', 'Cờ Thêu', 1600, '', 'trang_tri'),
    (129, 'den_chum', 'Đèn Chùm', 4800, 'den', 'trang_tri'),
    (130, 'cua_so', 'Cửa Sổ', 1500, '', 'trang_tri'),
    (131, 'dem_do', 'Đệm Ngồi Đỏ', 550, 'ngoi', 'nghi'),
    (133, 'ban_vang', 'Bàn Vàng', 1900, 'ban', 'ban_tu'),
    (136, 'tham_tron', 'Thảm Tròn', 2300, '', 'trang_tri'),
    (139, 'giuong_do_doi', 'Giường Đỏ Đôi', 6500, 'nam', 'nghi'),
    (140, 'giuong_do_don', 'Giường Đỏ Đơn', 4200, 'nam', 'nghi'),
    (142, 'sofa_do', 'Ghế Sofa Đỏ', 5500, 'ngoi', 'nghi'),
    (143, 'ghe_dau', 'Ghế Đẩu', 500, 'ngoi', 'nghi'),
]

# Ten nhom hien tren tab cua hang
NHOM = [
    ('nghi', 'Giường & ghế'),
    ('ban_tu', 'Bàn & tủ'),
    ('bep_tam', 'Bếp & tắm'),
    ('trang_tri', 'Trang trí'),
    ('kho', 'Lặt vặt'),
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
    do2 = catTheoChiSo(root, NGUON_DO2[0], NGUON_DO2[1], NGUON_DO2[2],
                       'assets/estate', 'sp', [r[0] for r in TEN_DO2])
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

    out.append('// Nhóm đồ — dùng chia tab bên cửa hàng bác thợ mộc')
    out.append('export const NHOM_DO = [')
    for ma, ten in NHOM:
        out.append('  { id: %s, name: %s },' % (js(ma), js(ten)))
    out.append('];')
    out.append('')

    out.append('// Đồ trang trí: w/h là số Ô nó chiếm trong nhà.')
    out.append('// kind = kiểu tương tác khi đứng cạnh món trong nhà mình.')
    out.append('export const FURNITURE = [')

    def dong(slug, ten, gia, kieu, nhom, a):
        out.append('  { id: %s, name: %s, price: %d, img: %s, w: %d, h: %d,'
                   ' kind: %s, nhom: %s },'
                   % (js(slug), js(ten), gia, js('assets/estate/' + a['file']),
                      max(1, round(a['w'] / 16)), max(1, round(a['h'] / 16)),
                      js(kieu), js(nhom)))

    for i, (slug, ten, gia, kieu, nhom) in enumerate(TEN_DO):
        if i >= len(do):
            break
        dong(slug, ten, gia, kieu, nhom, do[i])
    for i, slug, ten, gia, kieu, nhom in TEN_DO2:
        dong(slug, ten, gia, kieu, nhom, do2[i])
    out.append('];')
    out.append('')
    out.append('export const BASE_BY_ID = Object.fromEntries(HOUSE_BASES.map(b => [b.id, b]));')
    out.append('export const FURN_BY_ID = Object.fromEntries(FURNITURE.map(f => [f.id, f]));')
    out.append('')

    with open('js/data/estate.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(out))
    print('OK: %d mẫu nhà, %d món trang trí'
          % (min(len(nha), len(TEN_NHA)), min(len(do), len(TEN_DO)) + len(TEN_DO2)))


if __name__ == '__main__':
    main()
