# -*- coding: utf-8 -*-
"""Dung PHONG TRONG cho nha nguoi choi va nha tro chung.

Truoc day nha cua nguoi choi muon thang ban do noi that cua Tuxemon
(flower_house1, candy_center...). Nhung may ban do do VE SAN quay, ke, giuong,
may moc — nguoi choi ke them do cua minh vao la de len nhau, nhin nhu loi.

Tep nay dung han phong RONG: lay dung mau gach nen va mau tuong CUA CHINH BAN
DO GOC do (nen nhin van dung tong mau quen thuoc), roi ke lai thanh mot can
phong chu nhat trong khong — bao nhieu do trong nha la do nguoi choi kê.

Goi tu tools/mktmx.py, dung chay truc tiep.
"""
from collections import Counter

# (slug moi, ten tieng Viet, ban do goc muon mau, rong, cao)
PHONG = [
    ('nha_go_trong', 'Nhà Gỗ', 'taba_house1', 11, 9),
    ('nha_khung_trong', 'Nhà Khung Gỗ', 'cotton_misa_house', 14, 11),
    ('nha_ngoi_trong', 'Nhà Mái Ngói', 'taba_house2', 17, 13),
    ('nha_da_trong', 'Nhà Đá Hai Tầng', 'mansion', 21, 15),
    ('nha_tro', 'Nhà Trọ Chung', 'wayfarer_inn1', 22, 14),
]

TEN = {p[0]: p[1] for p in PHONG}


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


def dung(m_goc, w, h, npcs=None, talks=None, cua_sau=True):
    """Tra ve dict giong parse_map(): mot can phong chu nhat trong khong.

    `cua_sau` = duc mot o CUA SAU giua buc tuong tren cung. Nong trai la SAN SAU
    cua nha nguoi choi: buoc ra cua sau la ra thang ngoai ruong. Nha tro chung
    thi khong co cua nay (khong ai co nong trai sau nha tro).
    """
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
    if cua_sau:
        # Duc thung ca HAI hang tuong: tuong day hai hang, duc moi hang tren thi
        # dung truoc cua van bi hang duoi chan, khong buoc ra duoc.
        cx = w // 2
        for y in (0, 1):
            i = y * w + cx
            lop[i] = nen
            solid[i] = 0
    return {
        'w': w, 'h': h, 'sets': m_goc['sets'], 'layers': [lop], 'above': None,
        'solid': solid, 'water': [0] * (w * h), 'warps': [], 'talks': talks or [],
        'trades': [], 'encs': [], 'items': [],
        'music': 'town', 'env': 'interior', 'envNight': 'interior',
        'trong': True,                # phong nay o TRONG NHA — man ban do soi
                                      # cua ra dua vao co nay
        'npcs': npcs or [],
    }


def viet_js():
    dong = [
        '// TuxeWorld H5 | data/phongtrong.js | TỰ SINH TỪ tools/phongtrong.py, đừng sửa tay',
        '// Phòng trống dựng riêng cho nhà người chơi và nhà trọ chung — không',
        '// mượn bản đồ nội thất của bản gốc nữa vì mấy bản đồ đó vẽ sẵn đồ đạc,',
        '// kê thêm đồ của mình vào là đè lên nhau.',
        '',
        'export const PHONG_NHA = {',
    ]
    for slug, _ten, _goc, _w, _h in PHONG:
        if slug == 'nha_tro':
            continue
        dong.append('  %s: "%s",' % (slug.replace('_trong', ''), slug))
    dong += [
        '};',
        '',
        'export const MAP_NHA_TRO = "nha_tro";',
        '',
        '// Ô cửa sau của một căn phòng: đục giữa bức tường trên cùng. Bước ra',
        '// cửa này là ra sân sau — tức là nông trại. Nhà trọ chung không có.',
        'export const oCuaSau = (m) => ({ x: Math.floor(m.w / 2), y: 0 });',
        '',
    ]
    with open('js/data/phongtrong.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(dong))


def them_vao(out_maps, parse_map, chon_tep, mdir, tsx_cache):
    """Dung het cac phong va nhet vao bang ban do. Tra danh sach slug moi."""
    ra = []
    for slug, ten, goc, w, h in PHONG:
        p = chon_tep(mdir, goc)
        if not p:
            print('BO QUA phong', slug, '- khong co ban do goc', goc)
            continue
        m = dung(parse_map(p, tsx_cache), w, h, cua_sau=(slug != 'nha_tro'))
        m['_ten'] = ten
        out_maps[slug] = m
        ra.append(slug)
    viet_js()
    return ra
