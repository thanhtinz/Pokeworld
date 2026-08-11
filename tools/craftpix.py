# -*- coding: utf-8 -*-
"""Nap cac pack ban do top-down cua CraftPix vao lam dia diem moi.

Module nay do tools/mktmx.py goi, khong chay rieng.

Nguon: mua pack mien phi ben https://craftpix.net/freebies/ roi giai nen ra
/tmp/craftpix/<ten-pack>/ (xem README). Cac pack dang dung:

  chapel        Chapel Pixel Art Top Down Asset Pack
  guild         Top Down Pixel Art Guild Hall Asset Pack
  temple        Ruined Temple Top Down Location Pixel Art

KHONG PHAI TMX NAO CUNG DUNG DUOC
Vai pack ve san mot canh DEMO chu khong phai mot can phong choi duoc: pack
"Main Character's Home" xep may mau phong canh nhau tren cung mot khung, tuong
cut ngang, cua mo ra khoang khong. Nhap thang vao game thi nhin nhu chap va
tung manh, nen bo. Muon dung tileset cua pack do thi phai TU XEP tung o nhu
tools/khupho.py dang lam.

GIAY PHEP — DOC KY
CraftPix cho dung tep mien phi trong game (ke ca game ban tien), khong bat ghi
cong, NHUNG CAM ban lai hoac phat tan lai chinh cac tep goc duoi dang bo asset.
Nen o day:
  · KHONG chep tep goc cua pack vao kho nay
  · chi ghi ra ATLAS da nuong cua tung ban do — dung nhung o that su xai, da
    xep lai theo thu tu khac, la mot phan cua game chu khong con la bo asset
Ai fork kho nay thi dung nhat rieng may tep atlas do ra ban lai.

VI SAO PHAI TU DOC TMX
Ban do trong pack la TMX "infinite": du lieu nam trong nhieu the <chunk>, toa
do co ca so am, nen parse_map() cua mktmx.py doc khong ra. Ham doc_tmx() duoi
day gop chunk lai thanh mot luoi dac roi tra ve dict y het parse_map().
"""
import os
import re
import xml.etree.ElementTree as ET

TILE = 16

# Ten lop quyet dinh vai tro cua no. Pack khong co lop va cham rieng nen phai
# suy ra: nen thi di duoc, do dac thi chan.
NEN = re.compile(r'^(floor|ground|carpet|grass|water|road|sand)', re.I)
# Lop ve DE LEN NGUOI: dinh tuong, tan cay — nguoi choi di khuat sau no
TREN = re.compile(r'(_top|top$|roof)', re.I)
# Lop nhan vat cua pack: bo di, game nay dat NPC bang he thong rieng
NGUOI = re.compile(r'(priest|monk|parishioner|citizen|fighter|mage|reader|'
                   r'guildmaster|cultist|talking|character|villager)', re.I)

# Lop nao CHAN duong. Pack khong co lop va cham nen phai suy tu ten lop, va
# chi TUONG moi chan.
#
# Da thu chan them ca do dac (ruong, chong, bay chong, ke...) thi hong: may
# thu do nam rai rac giua san, bam nat mat san thanh nhieu manh roi nhau. Do
# lai: den do nat tu 58 o di duoc lien thong tut con 4 — thanh cai phong kin
# khong nhuc nhich noi. Chan moi tuong thi con 177/135/58 o, di lai thoai mai.
#
# Doi lai la di de len duoc may mon do nho (chum, vun da, ghe dai). May cho
# nay chi vao ngam nen chap nhan duoc; muon chan tung mon thi phai tu xep o
# nhu tools/khupho.py.
CHAN = re.compile(r'wall', re.I)


def _grid_tu_layer(lay, x0, y0, w, h):
    """Gop cac <chunk> cua mot lop thanh mot luoi dac w*h."""
    o = [0] * (w * h)
    data = lay.find('data')
    if data is None:
        return o
    chunks = data.findall('chunk')
    if not chunks:                       # ban do thuong, khong chia chunk
        so = [int(v) for v in data.text.replace('\n', '').split(',') if v.strip()]
        for i, g in enumerate(so):
            if i < len(o):
                o[i] = g
        return o
    for c in chunks:
        cx, cy = int(c.get('x')) - x0, int(c.get('y')) - y0
        cw, ch = int(c.get('width')), int(c.get('height'))
        so = [int(v) for v in c.text.replace('\n', '').split(',') if v.strip()]
        for i, g in enumerate(so):
            if not g:
                continue
            x, y = cx + i % cw, cy + i // cw
            if 0 <= x < w and 0 <= y < h:
                o[y * w + x] = g
    return o


def _bao(root):
    """Khung bao cua ban do infinite: quet het chunk lay min/max."""
    xs, ys, xe, ye = [], [], [], []
    for c in root.iter('chunk'):
        x, y = int(c.get('x')), int(c.get('y'))
        xs.append(x)
        ys.append(y)
        xe.append(x + int(c.get('width')))
        ye.append(y + int(c.get('height')))
    if not xs:
        return 0, 0, int(root.get('width')), int(root.get('height'))
    return min(xs), min(ys), max(xe) - min(xs), max(ye) - min(ys)


def _tilesets(root, tmx_dir, thieu):
    """[(firstgid, info)] theo dung dinh dang build_atlas() cho doi."""
    ra = []
    for ts in root.findall('tileset'):
        first = int(ts.get('firstgid'))
        im = ts.find('image')
        if im is None:
            continue
        p = os.path.normpath(os.path.join(tmx_dir, im.get('source')))
        cols = int(ts.get('columns') or 0)
        count = int(ts.get('tilecount') or 0)
        if not os.path.exists(p):
            # Pack mien phi co khi thieu mot tileset cua tac gia (guild hall
            # tro sang x500.png khong kem theo). Ghi nhan de o goi bo gid do
            # roi lap bang o nen, khong de vo ca ban do.
            thieu.add(os.path.basename(p))
            ra.append((first, None))
            continue
        ra.append((first, {'img': p, 'cols': cols, 'count': count,
                           'tw': int(ts.get('tilewidth') or TILE),
                           'th': int(ts.get('tileheight') or TILE)}))
    return ra


def doc_tmx(path):
    """Doc mot TMX cua pack -> dict giong het parse_map() cua mktmx.py."""
    root = ET.parse(path).getroot()
    tmx_dir = os.path.dirname(path)
    x0, y0, w, h = _bao(root)
    thieu = set()
    sets_raw = _tilesets(root, tmx_dir, thieu)
    # Bo gid cua tileset thieu tep, va don lai danh sach cho build_atlas
    khoang_thieu = []
    sets = []
    for i, (first, info) in enumerate(sets_raw):
        ke = sets_raw[i + 1][0] if i + 1 < len(sets_raw) else 10 ** 9
        if info is None:
            khoang_thieu.append((first, ke))
        else:
            sets.append((first, info))

    def sach(g):
        for a, b in khoang_thieu:
            if a <= g < b:
                return 0
        return g

    nen, do_vat, solid = [], [], [0] * (w * h)
    above = None
    for lay in root.findall('layer'):
        ten = lay.get('name') or ''
        if NGUOI.search(ten):
            continue                      # nhan vat cua pack: khong lay
        o = [sach(g) for g in _grid_tu_layer(lay, x0, y0, w, h)]
        if not any(o):
            continue
        if TREN.search(ten):
            above = o if above is None else [b or a for a, b in zip(above, o)]
            continue
        if NEN.match(ten):
            nen.append(o)
            continue
        # MOI LOP DO DAC GIU RIENG MOT LOP. Truoc day gop hết vào một lớp bằng
        # `b or a`: hai lop cung dat tile len mot o thi lop sau de mat lop
        # truoc, thanh ra tuong bi do trang tri duc thung tung mang, nhin nhu
        # cat hong. Ban do cua game von ve nhieu lop, cu de nguyen la dung.
        do_vat.append(o)
        if not CHAN.search(ten):
            continue                      # đồ đạc lặt vặt: đi đè lên được
        for i, g in enumerate(o):
            if g:
                solid[i] = 1
    # O NAO KHONG CO NEN THI CHAN LUON. Khong lam thi khoang trong quanh can
    # phong (ban do cua pack khong lat het khung) tinh la di duoc: nguoi choi
    # buoc thang ra vung den ngoai nha, va tham chi cai cua ra cung bi dat ra
    # giua cho khong co gi vi no la "o di duoc thap nhat".
    if nen:
        for i in range(w * h):
            if not any(l[i] for l in nen):
                solid[i] = 1
    layers = nen + do_vat
    if not layers:
        layers = [[0] * (w * h)]
    m = {'w': w, 'h': h, 'layers': layers, 'above': above, 'solid': solid,
         'water': [0] * (w * h), 'sets': sets, 'thieu': sorted(thieu),
         'warps': [], 'talks': [], 'npcs': [], 'spots': []}
    return _cat_vien(m)


def _cat_vien(m, chua=1):
    """Cat bo phan rong quanh ban do.

    TMX infinite luu theo chunk 16x16 nen khung bao thuong phinh ra tan dau
    dau: nha nguyen ve het 24x14 o ma khung lai la 32x32, con lai la mot vien
    den to tuong khong di vao duoc. Cat sat lay noi dung, chua lai `chua` o
    lam le.
    """
    w, h = m['w'], m['h']
    co = [any(lay[y * w + x] for lay in m['layers'])
          or (m['above'][y * w + x] if m['above'] else 0)
          for y in range(h) for x in range(w)]
    xs = [x for y in range(h) for x in range(w) if co[y * w + x]]
    ys = [y for y in range(h) for x in range(w) if co[y * w + x]]
    if not xs:
        return m
    x0 = max(0, min(xs) - chua)
    y0 = max(0, min(ys) - chua)
    x1 = min(w, max(xs) + 1 + chua)
    y1 = min(h, max(ys) + 1 + chua)
    if (x0, y0, x1, y1) == (0, 0, w, h):
        return m
    nw, nh = x1 - x0, y1 - y0
    cat = lambda o: [o[y * w + x] for y in range(y0, y1) for x in range(x0, x1)]
    m['layers'] = [cat(l) for l in m['layers']]
    m['above'] = cat(m['above']) if m['above'] else None
    m['solid'] = cat(m['solid'])
    m['water'] = [0] * (nw * nh)
    m['w'], m['h'] = nw, nh
    return m


# ==== Danh muc dia diem ====
# (slug, ten, thu muc pack, duong TMX, nhac nen)
CAC_MAP = [
    ('nha_nguyen', 'Nhà Nguyện', 'chapel',
     'Tiled_files/Interior.tmx', 'grove'),
    ('sanh_bang', 'Sảnh Bang Hội', 'guild',
     'Tiled_files/Interior_1st_floor.tmx', 'town'),
    ('den_do_nat', 'Đền Đổ Nát', 'temple',
     'Tiled_files/Ruined_temple_interior.tmx', 'arena'),
]


# Ban do quay ve khi buoc ra cua, neu vao thang chu khong qua man Dia Diem
VE_MAC_DINH = 'khu_pho'


def _vung_di_duoc(m, x0, y0):
    """Loang tu mot o ra, tra tap hop nhung o di toi duoc."""
    w, h = m['w'], m['h']
    tham = set()
    hang = [(x0, y0)]
    while hang:
        x, y = hang.pop()
        if (x, y) in tham or not (0 <= x < w and 0 <= y < h):
            continue
        if m['solid'][y * w + x]:
            continue
        tham.add((x, y))
        hang += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    return tham


def cua_ra(m, tu):
    """O di duoc THAP NHAT va gan giua nhat, TINH TRONG VUNG noi voi cho dat
    chan.

    Khong rang buoc "noi voi ben trong" thi de vo mieng: nha rieng co mot o
    trong nam le loi duoi bac them, thap nhat that nhung tu trong nha khong
    boi ra do duoc — cam cua o day la cam vao cho khong ai toi noi.
    """
    w = m['w']
    vung = _vung_di_duoc(m, tu[0], tu[1])
    if not vung:
        return None
    giua = w // 2
    ymax = max(y for _, y in vung)
    hang = [x for x, y in vung if y == ymax]
    return min(hang, key=lambda x: abs(x - giua)), ymax


def cho_dung(m):
    """O trong gan giua nhat, TINH TRONG VUNG DI DUOC RONG NHAT.

    Khong loc theo vung thi de vo mieng: nha rieng co mot o trong nam le loi
    duoi bac them, gan tam ban do hon ca nen duoc chon lam cho dat chan — ma
    tu o do khong di duoc di dau, ca can nha thanh khong voi toi.
    """
    w, h = m['w'], m['h']
    chua_xet = {(x, y) for y in range(h) for x in range(w)
                if not m['solid'][y * w + x]}
    lon_nhat = set()
    while chua_xet:
        vung = _vung_di_duoc(m, *next(iter(chua_xet)))
        chua_xet -= vung
        if len(vung) > len(lon_nhat):
            lon_nhat = vung
    if not lon_nhat:
        return 1, 1
    gx, gy = w // 2, h // 2
    return min(lon_nhat, key=lambda o: (o[0] - gx) ** 2 + (o[1] - gy) ** 2)


def _cho_ha_canh(m):
    """Cho dat chan tren ban do quay ve. Luc nay mktmx chua goi pick_spawn()
    nen khong chac da co khoa 'spawn' — phai tu tim mot o di duoc."""
    sp = m.get('spawn')
    if sp:
        return sp['x'], sp['y']
    w, h = m['w'], m['h']
    for y in range(h // 2, h):
        for x in range(w // 2, w):
            if not m['solid'][y * w + x]:
                return x, y
    return 1, 1


def them_vao(out_maps, goc):
    """Dung cac ban do tu pack. `goc` = thu muc chua cac pack da giai nen.

    Tra ve dict {slug: map} de mktmx.py nuong atlas va ghi vao maps.js.
    """
    ra = {}
    if not goc or not os.path.isdir(goc):
        return ra
    for slug, ten, pack, duong, nhac in CAC_MAP:
        p = os.path.join(goc, pack, duong)
        if not os.path.exists(p):
            print('BỎ QUA %s: không thấy %s' % (slug, p))
            continue
        m = doc_tmx(p)
        m['name'] = ten
        m['music'] = nhac
        m['env'] = 'grass'
        m['envNight'] = 'night_grass'
        m['trong'] = 1                    # đều là chỗ trong nhà -> hiện lối ra
        x, y = cho_dung(m)
        m['spawn'] = {'x': x, 'y': y}
        # Cong di ra PHAI co san trong du lieu: may ban do nay danh dau la
        # "trong nha", ma trong nha khong cong nao thi nguoi choi kep cung.
        # engine/diadiem.js chi doi lai DICH DEN cua no cho khop cho vua dung.
        cua = cua_ra(m, (x, y))
        ve = out_maps.get(VE_MAC_DINH)
        if cua and ve:
            vx, vy = _cho_ha_canh(ve)
            m['warps'].append({'x': cua[0], 'y': cua[1], 'to': VE_MAC_DINH,
                               'tx': vx, 'ty': vy})
        if m['thieu']:
            print('  %s: pack thiếu %s, đã bỏ trống mấy ô đó'
                  % (slug, ', '.join(m['thieu'])))
        ra[slug] = m
    return ra
