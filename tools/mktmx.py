# -*- coding: utf-8 -*-
"""Chuyen ban do Tiled (.tmx) cua Tuxemon sang dinh dang PokeWorld.

Chay:  python3 tools/mktmx.py <duong-dan-kho-Tuxemon> [ten_map ...]
Vi du: python3 tools/mktmx.py /tmp/Tuxemon

Nguon: https://github.com/Tuxemon/Tuxemon — ban do va tileset CC BY-SA 4.0.

Ghi de:
  js/data/maps.js       ban do da chuyen
  assets/maps/<id>.png  ATLAS rieng cua tung ban do

Vi sao moi ban do mot atlas: ban do Tuxemon dung 5-6 tileset cung luc, ghep
lai qua "firstgid". Neu chep ca 6 tileset (3 MB) vao du an thi rat nang trong
khi moi ban do chi dung vai tram o. Cong cu gom DUNG nhung o that su xuat hien
tren ban do do vao mot tam anh nho, roi doi chi so o trong ban do sang chi so
moi trong tam anh do. Luc chay game chi phai tai mot anh cho mot ban do.

Bo cuc du lieu moi cua mot ban do:
  { name, w, h, tile: 16, atlas: 'assets/maps/x.png', cols,
    layers: [[...chi so o, -1 = trong...], ...],   ve tu duoi len
    above: [...],                                   lop ve DE LEN nhan vat
    solid: [0/1...], warps: [...], npcs: [...], spots: [...], spawn: {x,y} }
"""
import os
import re
import sys
import json
import xml.etree.ElementTree as ET

TILE = 16
MAX_ATLAS_COLS = 32

# Ban do lay vao game + ten tieng Viet. Chon mot cum LIEN THONG voi nhau:
# thi tran khoi dau -> nha trong thi tran -> duong ra ngoai -> thi tran ke.
# Diem xuat phat + so ban do toi da lay theo duong di (BFS qua cong dich chuyen).
# Lay ca cum 75 ban do thi du lieu phinh to ma nguoi choi khong di het noi,
# nen chi lay nhung ban do gan diem xuat phat.
START = 'taba_town'
MAX_MAPS = 20

# Ten tieng Viet cho nhung ban do quen thuoc; con lai suy tu slug.
VI_NAME = {
    'taba_town': 'Thị Trấn Taba',
    'cotton_town': 'Thị Trấn Bông',
    'leather_town': 'Thị Trấn Da',
    'paper_town': 'Thị Trấn Giấy',
    'timber_town': 'Thị Trấn Gỗ',
    'candy_town': 'Thị Trấn Kẹo',
    'flower_city': 'Thành Phố Hoa',
    'route1': 'Đường Số 1',
    'route2': 'Đường Số 2',
    'route3': 'Đường Số 3',
    'route4': 'Đường Số 4',
}


def vi_name(slug):
    if slug in VI_NAME:
        return VI_NAME[slug]
    s = slug.replace('_', ' ').title()
    for a, b in (('House', 'Nhà'), ('Shop', 'Cửa Hàng'), ('Center', 'Trung Tâm'),
                 ('Town', 'Thị Trấn'), ('City', 'Thành Phố'), ('Route', 'Đường'),
                 ('Cave', 'Hang'), ('Gym', 'Võ Đường'), ('Hall', 'Hội Trường')):
        s = s.replace(a, b)
    return s


def load_tsx(path, cache):
    """Doc mot tileset: tra (anh, so cot, so o)."""
    if path in cache:
        return cache[path]
    root = ET.parse(path).getroot()
    img = root.find('image')
    if img is None:
        cache[path] = None
        return None
    src = os.path.join(os.path.dirname(path), img.get('source'))
    info = {
        'img': src,
        'cols': int(root.get('columns') or 0),
        'count': int(root.get('tilecount') or 0),
        'tw': int(root.get('tilewidth') or TILE),
        'th': int(root.get('tileheight') or TILE),
    }
    cache[path] = info
    return info


def parse_map(path, tsx_cache):
    root = ET.parse(path).getroot()
    w = int(root.get('width'))
    h = int(root.get('height'))

    # tileset: firstgid -> thong tin
    sets = []
    for ts in root.findall('tileset'):
        first = int(ts.get('firstgid'))
        src = ts.get('source')
        if not src:
            continue
        info = load_tsx(os.path.join(os.path.dirname(path), src), tsx_cache)
        if info:
            sets.append((first, info))
    sets.sort(key=lambda x: x[0])

    layers = []
    above = None
    for layer in root.findall('layer'):
        data = layer.find('data')
        if data is None:
            continue
        nums = decode_layer(data, w, h)
        if not nums:
            continue
        name = (layer.get('name') or '').lower()
        if 'above' in name:
            above = nums
        else:
            layers.append(nums)

    # va cham + su kien
    solid = [0] * (w * h)
    warps, talks = [], []
    for og in root.findall('objectgroup'):
        gname = (og.get('name') or '').lower()
        for obj in og.findall('object'):
            ox = int(float(obj.get('x') or 0)) // TILE
            oy = int(float(obj.get('y') or 0)) // TILE
            ow = max(1, int(float(obj.get('width') or TILE)) // TILE)
            oh = max(1, int(float(obj.get('height') or TILE)) // TILE)
            props = {p.get('name'): p.get('value') for p in obj.findall('./properties/property')}
            acts = [v for k, v in props.items() if k.startswith('act')]

            if 'collision' in gname and not acts:
                for j in range(oy, min(h, oy + oh)):
                    for i in range(ox, min(w, ox + ow)):
                        solid[j * w + i] = 1
                continue

            for a in acts:
                m = re.match(r'transition_teleport\s+player,\s*([^,]+),\s*(\d+),\s*(\d+)', a)
                if m:
                    warps.append({'x': ox, 'y': oy,
                                  'to': os.path.splitext(m.group(1).strip())[0],
                                  'tx': int(m.group(2)), 'ty': int(m.group(3))})
                    break
                if a.startswith('translated_dialog') or a.startswith('dialog'):
                    talks.append({'x': ox, 'y': oy, 'name': obj.get('name') or 'Bảng hiệu'})
                    break

    return {'w': w, 'h': h, 'sets': sets, 'layers': layers, 'above': above,
            'solid': solid, 'warps': warps, 'talks': talks}


def decode_layer(data, w, h):
    """Doc mot lop o: Tiled luu csv HOAC base64 (co the nen zlib/gzip)."""
    enc = (data.get('encoding') or '').lower()
    if enc == 'csv':
        return [int(x) for x in data.text.replace('\n', '').split(',') if x.strip()]
    if enc == 'base64':
        import base64
        import struct
        raw = base64.b64decode((data.text or '').strip())
        comp = (data.get('compression') or '').lower()
        if comp == 'zlib':
            import zlib
            raw = zlib.decompress(raw)
        elif comp == 'gzip':
            import gzip
            raw = gzip.decompress(raw)
        elif comp:
            return []                       # zstd: khong ho tro
        n = w * h
        # GID 32 bit little-endian; 3 bit cao la co lat anh, bo di
        return [g & 0x1FFFFFFF for g in struct.unpack('<%dI' % n, raw[:4 * n])]
    return []


def build_atlas(m, out_png):
    """Gom cac o that su dung vao mot atlas, tra (bang doi gid, so cot)."""
    from PIL import Image
    used = set()
    for lay in m['layers'] + ([m['above']] if m['above'] else []):
        used.update(g for g in lay if g > 0)
    used = sorted(used)

    remap = {}
    tiles = []
    for gid in used:
        # tileset nao chua gid nay
        base, info = None, None
        for first, nfo in m['sets']:
            if gid >= first:
                base, info = first, nfo
            else:
                break
        if not info or not info['cols']:
            continue
        idx = gid - base
        if idx >= info['count']:
            continue
        sx = (idx % info['cols']) * info['tw']
        sy = (idx // info['cols']) * info['th']
        remap[gid] = len(tiles)
        tiles.append((info['img'], sx, sy, info['tw'], info['th']))

    cols = min(MAX_ATLAS_COLS, max(1, len(tiles)))
    rows = (len(tiles) + cols - 1) // cols
    atlas = Image.new('RGBA', (cols * TILE, max(1, rows) * TILE), (0, 0, 0, 0))
    cache = {}
    for i, (img, sx, sy, tw, th) in enumerate(tiles):
        if img not in cache:
            cache[img] = Image.open(img).convert('RGBA')
        src = cache[img]
        cell = src.crop((sx, sy, sx + tw, sy + th))
        if (tw, th) != (TILE, TILE):
            cell = cell.resize((TILE, TILE), Image.NEAREST)
        atlas.paste(cell, ((i % cols) * TILE, (i // cols) * TILE))
    os.makedirs(os.path.dirname(out_png), exist_ok=True)
    atlas.save(out_png, optimize=True)
    return remap, cols


def js(v):
    return json.dumps(v, ensure_ascii=False)


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    root = sys.argv[1]
    mdir = os.path.join(root, 'mods/tuxemon/maps')
    if not os.path.isdir(mdir):
        raise SystemExit('Khong thay %s' % mdir)

    tsx_cache = {}
    want = pick_maps(mdir)
    names = {s: vi_name(s) for s in want}
    out_maps = {}
    for slug in want:
        p = os.path.join(mdir, slug + '.tmx')
        if not os.path.exists(p):
            print('BO QUA (khong co tep):', slug)
            continue
        m = parse_map(p, tsx_cache)
        remap, cols = build_atlas(m, 'assets/maps/%s.png' % slug)
        conv = lambda lay: [remap.get(g, -1) if g > 0 else -1 for g in lay]
        out_maps[slug] = {
            'name': names[slug], 'w': m['w'], 'h': m['h'], 'cols': cols,
            'layers': [conv(l) for l in m['layers']],
            'above': conv(m['above']) if m['above'] else None,
            'solid': m['solid'],
            'warps': [w for w in m['warps'] if w['to'] in want],
            'talks': m['talks'],
        }

    write_js(out_maps, want)
    print('OK: %d bản đồ' % len(out_maps))
    for k, v in out_maps.items():
        print('  %-22s %dx%d · %d lớp · %d cổng · %d bảng'
              % (k, v['w'], v['h'], len(v['layers']), len(v['warps']), len(v['talks'])))


def pick_maps(mdir):
    """Di theo cong dich chuyen tu diem xuat phat, lay toi da MAX_MAPS ban do."""
    import collections
    order, seen = [], {START}
    q = collections.deque([START])
    while q and len(order) < MAX_MAPS:
        cur = q.popleft()
        p = os.path.join(mdir, cur + '.tmx')
        if not os.path.exists(p):
            continue
        order.append(cur)
        src = open(p, encoding='utf-8', errors='ignore').read()
        for m in re.finditer(r'transition_teleport\s+player,\s*([^,]+)\.tmx', src):
            nxt = m.group(1).strip()
            if nxt not in seen and os.path.exists(os.path.join(mdir, nxt + '.tmx')):
                seen.add(nxt)
                q.append(nxt)
    return order


def write_js(maps, want):
    out = ["// TuxeWorld H5 | data/maps.js | Bản đồ — TỰ SINH TỪ tools/mktmx.py, đừng sửa tay",
           '// Nguồn: bản đồ và tileset của Tuxemon (CC BY-SA 4.0).',
           '// Mỗi bản đồ có ATLAS riêng: chỉ gom những ô thật sự dùng nên nhẹ hơn nhiều',
           '// so với chép cả 6 tileset gốc.', '',
           'export const TILE_SIZE = 16;', '',
           'export const MAPS = {']
    for slug, m in maps.items():
        spawn = pick_spawn(m)
        out.append('  %s: {' % slug)
        out.append('    name: %s, w: %d, h: %d, cols: %d,' % (js(m['name']), m['w'], m['h'], m['cols']))
        out.append('    atlas: %s,' % js('assets/maps/%s.png' % slug))
        out.append('    spawn: { x: %d, y: %d },' % spawn)
        out.append('    layers: [')
        for lay in m['layers']:
            out.append('      %s,' % js(lay))
        out.append('    ],')
        out.append('    above: %s,' % (js(m['above']) if m['above'] else 'null'))
        out.append('    solid: %s,' % js(m['solid']))
        out.append('    warps: %s,' % js(m['warps']))
        out.append('    talks: %s,' % js(m['talks']))
        out.append('  },')
    out.append('};')
    out.append('''
export const mapWidth = (map) => map.w;
export const mapHeight = (map) => map.h;

// Ô này có chắn đường không? Ngoài biên coi như tường.
export function isSolid(map, x, y) {
  if (!map || x < 0 || y < 0 || x >= map.w || y >= map.h) return true;
  return !!map.solid[y * map.w + x];
}

export const warpAt = (map, x, y) =>
  (map.warps || []).find(w => w.x === x && w.y === y) || null;

export const talkAt = (map, x, y) =>
  (map.talks || []).find(t => t.x === x && t.y === y) || null;''')
    open('js/data/maps.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')


def pick_spawn(m):
    """Cho nguoi choi dung o o di duoc gan giua ban do nhat."""
    w, h = m['w'], m['h']
    cx, cy = w // 2, h // 2
    best, bd = (1, 1), 10 ** 9
    for y in range(h):
        for x in range(w):
            if m['solid'][y * w + x]:
                continue
            d = (x - cx) ** 2 + (y - cy) ** 2
            if d < bd:
                bd, best = d, (x, y)
    return best


if __name__ == '__main__':
    main()
