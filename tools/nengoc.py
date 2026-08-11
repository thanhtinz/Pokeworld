# -*- coding: utf-8 -*-
"""Bang o NEN lay dung tu ban do goc cua Tuxemon (core_outdoor.png).

Hai ban do tu dung — Pho Kim Long va Bang Duong — truoc day tu chon o nen bang
mat: co mot mau, duong mot mau, dat mot mau, dan canh nhau thanh may hinh chu
nhat cat vuong. Dat canh ban do goc thi lo ngay: ban goc duong mon nao cung co
VIEN BO quanh, rung thi la mot mang tan cay lien nhau chu khong phai mot cay
thong lap lai.

Bang duoi do THANG tu tep taba_town.tmx ra: dem o nao hay dung nhat, roi soi
tung cho duong mon queo de biet o goc lom nao ung voi huong nao. Nho the hai
ban do tu dung nhin cung mot he ngon ngu voi bon muoi ban do nhap ve.

Toa do la (cot, hang) trong core_outdoor.png — 37 cot.
"""

COT = 37


def o(c, r):
    """Chi so o trong tileset core_outdoor."""
    return r * COT + c


# ==== Nen ====
CO = [o(0, 3), o(1, 3), o(2, 3)]          # co: ba bien the cho do deu tam tap

# Duong mon: khoi 3x3 o cot 5-7, hang 3-5. Bon o goc LOM nam o cot 6-7 hang 6-7.
#   (5,3) (6,3) (7,3)      (6,6) (7,6)
#   (5,4) (6,4) (7,4)      (6,7) (7,7)
#   (5,5) (6,5) (7,5)
DUONG_GIUA = o(6, 4)
# Goc lom: thieu o cheo nao thi dung o nao (soi tu chinh ban do goc)
GOC_LOM = {
    'tren_trai': o(7, 7), 'tren_phai': o(6, 7),
    'duoi_trai': o(7, 6), 'duoi_phai': o(6, 6),
}

# ==== Rung ====
# Tan cay phu kin: mot khoi 2x2 lap lai, hang tren cung la ngon cay.
TAN_CAY = [[o(25, 28), o(26, 28)], [o(25, 29), o(26, 29)]]
NGON_CAY = [o(25, 27), o(26, 27)]

# ==== Do vun rai tren co ====
HOA = [o(28, 25), o(29, 25), o(30, 25), o(28, 26), o(29, 26)]
BUI = [o(24, 30), o(25, 30), o(26, 30), o(27, 30)]
DA_TANG = [o(30, 30), o(31, 30)]
GHE = [[o(30, 33), o(31, 33)], [o(30, 34), o(31, 34)]]


def rng(x, y, n):
    """So ngau nhien on dinh theo toa do — dung lai bao nhieu lan cung ra the."""
    return ((x * 7 + y * 13) ^ (x * y)) % n


def o_co(x, y):
    return CO[rng(x, y, len(CO))]


def o_tan_cay(x, y):
    return TAN_CAY[y % 2][x % 2]


def o_duong(x, y, la_duong):
    """O duong mon tai (x,y), chon theo hang xom — `la_duong(x,y)` -> bool.

    Vien bo lay theo bon canh; bon canh deu la duong ma mot o CHEO khong phai
    thi dung o goc lom, khong thi cho ngoat cua duong ho ra mot cai neu.
    """
    tren = la_duong(x, y - 1)
    duoi = la_duong(x, y + 1)
    trai = la_duong(x - 1, y)
    phai = la_duong(x + 1, y)
    if tren and duoi and trai and phai:
        if not la_duong(x - 1, y - 1):
            return GOC_LOM['tren_trai']
        if not la_duong(x + 1, y - 1):
            return GOC_LOM['tren_phai']
        if not la_duong(x - 1, y + 1):
            return GOC_LOM['duoi_trai']
        if not la_duong(x + 1, y + 1):
            return GOC_LOM['duoi_phai']
        return DUONG_GIUA
    c = 5 if not trai else 7 if not phai else 6
    h = 3 if not tren else 5 if not duoi else 4
    return o(c, h)
