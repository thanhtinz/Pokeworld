# -*- coding: utf-8 -*-
"""Bo tile ngoai troi cua pack "Cozy Farm" — dung chung cho may ban do TU DUNG.

Nhung ban do cua rieng TuxeWorld (Nong Trai, Khu Dan Cu, Bang Duong...) truoc
day ghep tu tileset ngoai troi cua Tuxemon. Nhung nhan vat, cay trong, con vat,
nha cua tren do lai la cua pack, nen cai lech ra chinh la bai co Tuxemon. Gom
het ve mot bo thi ca vung "TuxeWorld rieng" moi dong bo.

BAN DO NHAP TU TUXEMON THI KHONG DOI DUOC. Chung ve bang autotile rieng cua
Tuxemon (vach da, nha, bo bien) — pack nay khong co tile tuong duong, thay bua
la vo het duong vien.

Nguon pack KHONG commit vao kho: tools/mktmx.py chi nuong dung nhung o ban do
that su dung toi thanh assets/maps/<slug>.png. Xem CREDITS.md.
"""
import os

TEP_TILE = 'tiles/tiles.png'
COT = 54                    # tileset rong 54 o
HANG = 50
TILE = 16


def _o(c, r):
    return r * COT + c


def tile_set(goc, gid=1):
    """Muc 'sets' cua ban do, tro thang vao tep tileset cua pack."""
    return [(gid, {'img': os.path.join(goc, TEP_TILE), 'cols': COT,
                   'count': COT * HANG, 'tw': TILE, 'th': TILE})]


def co_pack(goc):
    return bool(goc) and os.path.isfile(os.path.join(goc, TEP_TILE))


# ==== O nen ====
CO = _o(1, 1)               # co day
CAT = _o(5, 6)              # dat cat — lat loi di
DAT = _o(5, 9)              # dat nau sam — san, thua ruong
NUOC = _o(12, 13)           # mat nuoc

# ==== Ba dai autotile "co chong len X" ====
# Moi dai ba hang: khoi 3x3 vien quanh mot mang co, kem 2x2 o goc lom o cot 3-4.
DAI_CAT = 6
DAI_DAT = 9
DAI_NUOC = 12

# ==== Vat the ====
CAY_TO = [(0, 24), (2, 24)]                      # cay tan tron, khoi 2x4
CAY_THONG = (4, 24)                              # cay thong, khoi 2x4
BUI = [_o(5, 26), _o(6, 26), _o(7, 26), _o(8, 26)]
HOA = [_o(6, 27), _o(7, 27), _o(8, 27), _o(6, 28), _o(7, 28), _o(8, 28)]
DA_TANG = [_o(9, 28), _o(10, 28), _o(11, 28), _o(12, 28)]
GHE = [(9, 27), (11, 27)]                        # ghe dai, khoi 2x1

# Hang rao go. Mot doan ngang = dau + than lap lai + duoi; cot doc dung o cot.
RAO_NGANG = (_o(4, 31), _o(5, 31), _o(6, 31))    # dau, than, duoi
RAO_DOC = _o(2, 31)
RAO_COT = _o(3, 31)                              # coc le


def o_vien(la, x, y, R):
    """O co nam canh mot vung khac — tra o vien dung huong trong dai autotile.

    Bon o goc lom da soi tan mat moi chon: dung thu mot cai ao, uom ca bon o
    vao tung huong roi nhin, chi o (3, R+1) noi lien duoc duong vien, ba o kia
    deu gay ra mot cai nem thua. Nen bon huong goc lom dung chung dung o do.

    Tra None neu o nay khong dinh vung do (cu de nguyen co).
    """
    n, s = la(x, y - 1), la(x, y + 1)
    w, e = la(x - 1, y), la(x + 1, y)
    if n and w:
        return _o(0, R)
    if n and e:
        return _o(2, R)
    if s and w:
        return _o(0, R + 2)
    if s and e:
        return _o(2, R + 2)
    if n:
        return _o(1, R)
    if s:
        return _o(1, R + 2)
    if w:
        return _o(0, R + 1)
    if e:
        return _o(2, R + 1)
    if (la(x + 1, y + 1) or la(x - 1, y + 1)
            or la(x + 1, y - 1) or la(x - 1, y - 1)):
        return _o(3, R + 1)
    return None


def rng(x, y, n):
    """So gia ngau nhien nhung on dinh: chay lai bao nhieu lan cung ra the."""
    h = (x * 73856093) ^ (y * 19349663) ^ 0x9E3779B9
    h = (h ^ (h >> 13)) * 1274126177 & 0xFFFFFFFF
    return (h >> 7) % n


def o_cay(kieu, dx, dy):
    """O thu (dx, dy) cua mot khoi cay 2 rong x 4 cao."""
    c0, r0 = kieu
    return _o(c0 + dx, r0 + dy)


def kieu_cay(x, y):
    """Chon kieu cay theo toa do — deu deu ma khong lap lai mot kieu."""
    return CAY_THONG if rng(x, y, 3) == 0 else CAY_TO[rng(y, x, len(CAY_TO))]
