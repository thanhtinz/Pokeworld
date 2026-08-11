# -*- coding: utf-8 -*-
"""Dung PHONG TRONG — ba gian trong ba toa nha cua bang.

Ban do noi that cua Tuxemon (flower_house1, candy_center...) deu VE SAN quay,
ke, giuong, may moc — dat NPC lam viec vao la de len do, nhin nhu loi.

Tep nay dung han phong RONG: lay dung mau gach nen va mau tuong CUA CHINH BAN
DO GOC do (nen nhin van dung tong mau quen thuoc), roi ke lai thanh mot can
phong chu nhat trong khong.

Goi tu tools/bangduong.py, dung chay truc tiep.
"""
from collections import Counter

def _tren_cung(m):
    """Gid nhin thay o tung o (lop tren de len lop duoi)."""
    top = [0] * (m['w'] * m['h'])
    for lay in m['layers']:
        for i, g in enumerate(lay):
            if g:
                top[i] = g
    return top


def mau_phong(m):
    """Rut ra (gid nen, gid tuong tren, gid tuong duoi) tu mot ban do noi that."""
    top = _tren_cung(m)
    W = m['w']
    dem = Counter(g for i, g in enumerate(top) if g and not m['solid'][i])
    nen = dem.most_common(1)[0][0]
    # Hai hang dau cua ban do noi that la buc tuong sau lung. Lay o PHO BIEN
    # NHAT cua tung hang chu khong lay o giua — o giua hay roi trung cua ra vao
    # hoac mot mon do, thanh ra ca buc tuong bi lat bang mot canh cua.
    def pho_bien(hang):
        d = Counter(top[hang * W + x] for x in range(W)
                    if top[hang * W + x] and m['solid'][hang * W + x])
        if not d:
            d = Counter(top[hang * W + x] for x in range(W) if top[hang * W + x])
        return d.most_common(1)[0][0] if d else nen

    return nen, pho_bien(0), pho_bien(1)


def dung(m_goc, w, h, npcs=None, talks=None):
    """Tra ve dict giong parse_map(): mot can phong chu nhat trong khong."""
    nen, t_tren, t_duoi = mau_phong(m_goc)
    lop = [0] * (w * h)
    solid = [0] * (w * h)
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if y == 0:
                lop[i] = t_tren
                solid[i] = 1
            elif y == 1:
                lop[i] = t_duoi
                solid[i] = 1
            else:
                lop[i] = nen
    return {
        'w': w, 'h': h, 'sets': m_goc['sets'], 'layers': [lop], 'above': None,
        'solid': solid, 'water': [0] * (w * h), 'warps': [], 'talks': talks or [],
        'trades': [], 'encs': [], 'items': [],
        'music': 'town', 'env': 'interior', 'envNight': 'interior',
        'trong': True,                # phong nay o TRONG NHA — man ban do soi
                                      # cua ra dua vao co nay
        'npcs': npcs or [],
    }
