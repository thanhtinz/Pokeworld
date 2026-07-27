# -*- coding: utf-8 -*-
"""Chuyen toan bo du lieu sinh vat cua Tuxemon sang dinh dang PokeWorld.

Chay:  python3 tools/mktuxemon.py <duong-dan-kho-Tuxemon>
Vi du: python3 tools/mktuxemon.py /tmp/Tuxemon

Nguon: https://github.com/Tuxemon/Tuxemon
  - Ma nguon cua ho: GPL-3.0
  - Hinh anh + du lieu sinh vat: CC BY-SA 4.0 (xem ATTRIBUTIONS.md ben do)

Cong cu GHI DE cac file duoi day — dung sua tay:
  js/data/types.js       13 he + bang khac che lay nguyen tu Tuxemon
  js/data/species.js     toan bo sinh vat: he, chi so goc, chieu cao, ti le bat
  js/data/moves.js       chieu thuc
  js/data/learnsets.js   bang hoc chieu theo cap
  js/data/evolutions.js  chuoi tien hoa
  assets/mon/<id>.png    sprite mat truoc / _b mat sau / _i icon

Chi so goc: Tuxemon khong luu chi so tren tung con ma tren "shape" (dang than
hinh: dragon, blob, flier...). Bang shape cho 6 chi so 4-9, cong cu nhan len
thang 45-100 quen thuoc roi nhan them he so theo bac tien hoa.
"""
import os
import re
import sys
import json
import yaml

STAGE_MULT = {'basic': 1.0, 'standalone': 1.15, 'stage1': 1.2, 'stage2': 1.42}
EXP_CURVE = {'basic': 'medium_fast', 'standalone': 'medium_fast',
             'stage1': 'medium_slow', 'stage2': 'slow'}
# EV thuong: con thien ve chi so nao thi cho EV chi so do
EV_KEY = {'hp': 'hp', 'melee': 'atk', 'armour': 'def', 'ranged': 'spa', 'speed': 'spe'}


def load(path):
    with open(path, encoding='utf-8') as f:
        return yaml.safe_load(f)


def load_names(root):
    """Ten hien thi lay tu file dich en_US cua Tuxemon."""
    po = os.path.join(root, 'mods/tuxemon/l18n/en_US/LC_MESSAGES/base.po')
    out, key = {}, None
    for line in open(po, encoding='utf-8'):
        line = line.strip()
        m = re.match(r'^msgid "(.*)"$', line)
        if m:
            key = m.group(1)
            continue
        m = re.match(r'^msgstr "(.*)"$', line)
        if m and key:
            if m.group(1):
                out[key] = m.group(1)
            key = None
    return out


def stats_from_shape(a, stage):
    """6 chi so cua shape (4-9) -> thang cua game, roi nhan theo bac tien hoa."""
    k = STAGE_MULT.get(stage, 1.0)
    return {
        'hp':  round((a['hp'] * 9 + 10) * k),
        'atk': round((a['melee'] * 9 + 10) * k),
        'def': round((a['armour'] * 9 + 10) * k),
        'spa': round((a['ranged'] * 9 + 10) * k),
        'spd': round(((a['armour'] + a['dodge']) / 2 * 9 + 10) * k),
        'spe': round((a['speed'] * 9 + 10) * k),
    }


def js(v):
    return json.dumps(v, ensure_ascii=False)


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    root = sys.argv[1]
    db = os.path.join(root, 'mods/tuxemon/db')
    gfx = os.path.join(root, 'mods/tuxemon/gfx/sprites/battle')
    if not os.path.isdir(db):
        raise SystemExit('Khong thay %s — dua vao duong dan goc kho Tuxemon.' % db)

    names = load_names(root)
    disp = lambda s: names.get(s, s.replace('_', ' ').title())

    # ==== He ====
    elements = {}
    for f in sorted(os.listdir(os.path.join(db, 'element'))):
        d = load(os.path.join(db, 'element', f))
        elements[d['slug']] = {r['against']: r['multiplier'] for r in (d.get('types') or [])}

    # ==== Dang than hinh ====
    shape_dir = os.path.join(db, 'shape')
    shapes = {}
    for f in os.listdir(shape_dir):
        for row in load(os.path.join(shape_dir, f)) or []:
            shapes[row['slug']] = row['attributes']

    # ==== Sinh vat ====
    mons = []
    for f in sorted(os.listdir(os.path.join(db, 'monster'))):
        d = load(os.path.join(db, 'monster', f))
        if not d or not d.get('slug'):
            continue
        if not os.path.exists(os.path.join(gfx, d['slug'] + '-sheet.png')):
            continue                      # khong co sprite thi bo, khong lay dai con khac the vao
        mons.append(d)
    mons.sort(key=lambda m: (m.get('txmn_id', 99999), m['slug']))
    dex = {m['slug']: i + 1 for i, m in enumerate(mons)}

    # ==== Chieu thuc: chi lay nhung chieu that su co con dung ====
    used = set()
    for m in mons:
        for mv in m.get('moveset') or []:
            if mv.get('technique'):
                used.add(mv['technique'])
    techs = {}
    for slug in sorted(used):
        p = os.path.join(db, 'technique', slug + '.yaml')
        if not os.path.exists(p):
            continue
        techs[slug] = load(p)

    write_types(elements, names)
    write_species(mons, dex, shapes, disp, elements)
    write_moves(techs, disp)
    write_learnsets(mons, dex, techs)
    write_evolutions(mons, dex)
    n_img = write_sprites(mons, dex, gfx)
    n_img += write_type_icons(root)

    print('OK: %d sinh vat, %d he, %d chieu thuc, %d anh' % (len(mons), len(elements), len(techs), n_img))


# Icon he: ban goc chi 24x24, man hinh dien thoai ngay nay 3 diem anh vat ly cho
# 1 diem anh CSS nen phong len 4 lan bang NEAREST roi de trinh duyet thu nho lai
# — sac net o moi co man hinh, thay vi nhoe nhu khi phong tu anh be.
TYPE_VI_KEYS = {'normal', 'fire', 'water', 'wood', 'earth', 'metal', 'lightning',
                'frost', 'venom', 'shadow', 'sky', 'cosmic', 'heroic'}


def write_type_icons(root):
    from PIL import Image
    src = os.path.join(root, 'mods/tuxemon/gfx/ui/icons/element')
    if not os.path.isdir(src):
        return 0
    os.makedirs('assets/types', exist_ok=True)
    n = 0
    for f in sorted(os.listdir(src)):
        if not f.endswith('_type.png'):
            continue
        slug = f[:-len('_type.png')]
        if slug not in TYPE_VI_KEYS:     # he khong dung trong game thi bo qua
            continue
        im = Image.open(os.path.join(src, f)).convert('RGBA')
        k = 4
        im.resize((im.width * k, im.height * k), Image.NEAREST).save(
            'assets/types/%s.png' % slug, optimize=True)
        n += 1
    return n


# ==================== He ====================
def write_types(elements, names):
    order = sorted(elements)
    out = ["// PokeWorld H5 | data/types.js | Hệ và bảng khắc chế — TỰ SINH TỪ tools/mktuxemon.py",
           '// Nguồn: Tuxemon (CC BY-SA 4.0). Đừng sửa tay.', '',
           'export const TYPES = %s;' % js(order), '',
           '// TYPE_NAMES[hệ] = tên tiếng Việt hiển thị trong game',
           'export const TYPE_NAMES = {']
    vi = {
        'normal': 'Thường', 'fire': 'Lửa', 'water': 'Nước', 'wood': 'Gỗ', 'earth': 'Đất',
        'metal': 'Kim', 'lightning': 'Điện', 'frost': 'Băng', 'venom': 'Độc',
        'shadow': 'Bóng Tối', 'sky': 'Bầu Trời', 'cosmic': 'Vũ Trụ', 'heroic': 'Anh Hùng',
    }
    for t in order:
        out.append("  %s: %s," % (t, js(vi.get(t, t.title()))))
    out.append('};')
    out.append('export const TYPE_VI = TYPE_NAMES;   // tên cũ, giữ cho phần giao diện đang dùng')
    out.append('')
    out.append('// TYPE_COLORS[hệ] = màu thẻ hệ')
    colors = {
        'normal': '#a8a878', 'fire': '#f08030', 'water': '#6890f0', 'wood': '#78c850',
        'earth': '#b8a038', 'metal': '#b8b8d0', 'lightning': '#f8d030', 'frost': '#98d8d8',
        'venom': '#a040a0', 'shadow': '#705848', 'sky': '#a890f0', 'cosmic': '#7038f8',
        'heroic': '#f85888',
    }
    out.append('export const TYPE_COLORS = {')
    for t in order:
        out.append("  %s: %s," % (t, js(colors.get(t, '#888888'))))
    out.append('};')
    out.append('')
    out.append('// CHART[hệ đánh][hệ chịu] = hệ số sát thương')
    out.append('export const CHART = {')
    for t in order:
        row = elements[t]
        pairs = ', '.join('%s: %s' % (k, fmtnum(row[k])) for k in order if k in row)
        out.append('  %s: { %s },' % (t, pairs))
    out.append('};')
    out.append('''
// Hệ số khi một chiêu hệ `atk` đánh vào Pokémon mang các hệ `defTypes`.
// Nhân dồn từng hệ giống loạt game gốc.
export function typeEff(atk, defTypes) {
  const row = CHART[atk];
  if (!row) return 1;
  let mult = 1;
  for (const d of defTypes || []) {
    const v = row[d];
    if (typeof v === 'number') mult *= v;
  }
  return mult;
}

export const typeName = (t) => TYPE_NAMES[t] || t;
export const typeColor = (t) => TYPE_COLORS[t] || '#888888';''')
    open('js/data/types.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')


def fmtnum(v):
    return ('%g' % v)


# ==================== Sinh vat ====================
def write_species(mons, dex, shapes, disp, elements):
    out = ["// PokeWorld H5 | data/species.js | Sinh vật — TỰ SINH TỪ tools/mktuxemon.py",
           '// Nguồn: Tuxemon (CC BY-SA 4.0). Đừng sửa tay.',
           '// height tính bằng mét, weight bằng kg (Tuxemon lưu cm và hg).', '',
           'export const SPECIES = {']
    for m in mons:
        i = dex[m['slug']]
        shape = m.get('shape', 'blob')
        attr = shapes.get(shape) or shapes['blob']
        st = stats_from_shape(attr, m.get('stage', 'basic'))
        # EV thưởng: chỉ số cao nhất của dáng thân
        best = max(EV_KEY, key=lambda k: attr.get(k, 0))
        ev = {EV_KEY[best]: 1 if m.get('stage') == 'basic' else 2}
        types = m.get('types') or ['normal']
        base_exp = round(sum(st.values()) / 6 * 1.15)
        out.append('  %d: { name: %s, slug: %s, types: %s,' % (i, js(disp(m['slug'])), js(m['slug']), js(types)))
        out.append('    base: { hp: %d, atk: %d, def: %d, spa: %d, spd: %d, spe: %d },'
                   % (st['hp'], st['atk'], st['def'], st['spa'], st['spd'], st['spe']))
        out.append('    catchRate: %d, expCurve: %s, genderRatio: %s, abilities: [],'
                   % (max(3, min(255, round(m.get('catch_rate', 100)))),
                      js(EXP_CURVE.get(m.get('stage', 'basic'), 'medium_fast')),
                      fmtnum(round(float((m.get('gender_weights') or {}).get('male', 0.5)), 3))))
        ev_txt = '{ ' + ', '.join('%s: %d' % (k, v) for k, v in ev.items()) + ' }'
        # Tuxemon co 13 con "glitched" (ten kieu F7U1T3Ra) — de nguyen thi Tuxedex
        # trang dau toan chu loi nhin nhu hong font, nen danh dau de game an di.
        glitch = ', glitched: true' if m.get('species') == 'glitched' else ''
        out.append('    evYield: %s, baseExp: %d, height: %s, weight: %s, shape: %s, stage: %s%s },'
                   % (ev_txt, base_exp,
                      fmtnum(max(0.1, round((m.get('height') or 100) / 100, 2))),
                      fmtnum(max(0.1, round((m.get('weight') or 100) / 10, 1))),
                      js(shape), js(m.get('stage', 'basic')), glitch))
    out.append('};')
    out.append('''
export const DEX_MAX = %d;
export const speciesBySlug = (slug) => Object.values(SPECIES).find(s => s.slug === slug) || null;''' % len(mons))
    open('js/data/species.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')


# ==================== Chieu thuc ====================
# Tuxemon: power ~0.5-2.5 (he so), accuracy 0-1, range melee/ranged/touch/reach/special.
# Game nay: power 0-150, acc 0-100, category physical/special/status.
RANGE_CAT = {
    'melee': 'physical', 'touch': 'physical', 'reach': 'physical',
    'ranged': 'special', 'special': 'special', 'reliable': 'special',
}


def write_moves(techs, disp):
    out = ["// PokeWorld H5 | data/moves.js | Chiêu thức — TỰ SINH TỪ tools/mktuxemon.py",
           '// Nguồn: Tuxemon (CC BY-SA 4.0). Đừng sửa tay.',
           '// power quy từ hệ số của Tuxemon sang thang 0-150; category theo tầm đánh.', '',
           'export const MOVES = {']
    for slug in sorted(techs):
        t = techs[slug]
        types = t.get('types') or ['normal']
        rng = t.get('range', 'melee')
        kinds = {e.get('type') for e in (t.get('effects') or []) if isinstance(e, dict)}
        is_dmg = 'damage' in kinds
        cat = RANGE_CAT.get(rng, 'physical') if is_dmg else 'status'
        power = min(150, round(float(t.get('power') or 0) * 50)) if is_dmg else 0
        acc = round(float(t.get('accuracy') if t.get('accuracy') is not None else 1) * 100)
        pp = max(5, min(40, 40 - power // 6))
        out.append('  %s: { name: %s, type: %s, category: %s, power: %d, acc: %d, pp: %d, priority: 0 },'
                   % (js(slug), js(disp(slug)), js(types[0]), js(cat), power, acc, pp))
    out.append('};')
    out.append("\nexport const moveName = (id) => (MOVES[id] && MOVES[id].name) || id;")
    open('js/data/moves.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')


# ==================== Bang hoc chieu ====================
def write_learnsets(mons, dex, techs):
    out = ["// PokeWorld H5 | data/learnsets.js | Học chiêu theo cấp — TỰ SINH TỪ tools/mktuxemon.py",
           '// Nguồn: Tuxemon (CC BY-SA 4.0). Đừng sửa tay.', '',
           'export const LEARNSETS = {']
    for m in mons:
        rows = []
        seen = set()
        for mv in m.get('moveset') or []:
            slug = mv.get('technique')
            lv = mv.get('level_learned', 1)
            if not slug or slug not in techs or slug in seen:
                continue
            seen.add(slug)
            rows.append((lv, slug))
        rows.sort()
        out.append('  %d: [%s],' % (dex[m['slug']], ', '.join('[%d, %s]' % (lv, js(s)) for lv, s in rows)))
    out.append('};')
    out.append('''
// Các chiêu học được đúng tại cấp `lv`
export function movesAtLevel(dexId, lv) {
  return (LEARNSETS[dexId] || []).filter(([l]) => l === lv).map(([, id]) => id);
}

// Bộ 4 chiêu khi tạo mới một con ở cấp `lv`: lấy 4 chiêu mới nhất học được
export function movesUpTo(dexId, lv) {
  const all = (LEARNSETS[dexId] || []).filter(([l]) => l <= lv).map(([, id]) => id);
  return all.slice(-4);
}''')
    open('js/data/learnsets.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')


# ==================== Tien hoa ====================
def write_evolutions(mons, dex):
    out = ["// PokeWorld H5 | data/evolutions.js | Chuỗi tiến hoá — TỰ SINH TỪ tools/mktuxemon.py",
           '// Nguồn: Tuxemon (CC BY-SA 4.0). Đừng sửa tay.', '',
           'export const EVOLUTIONS = {']
    n = 0
    for m in mons:
        best = None
        for ev in m.get('evolutions') or []:
            to = ev.get('monster_slug')
            lv = ev.get('at_level')
            if not to or to not in dex or not lv:
                continue
            if best is None or lv < best[1]:
                best = (to, lv)
        if best:
            out.append('  %d: { into: %d, method: %s, level: %d },   // %s -> %s'
                       % (dex[m['slug']], dex[best[0]], js('level'), best[1], m['slug'], best[0]))
            n += 1
    out.append('};')
    out.append('\nexport const EVOLVED_INTO = new Set(Object.values(EVOLUTIONS).map(e => e.into));')
    open('js/data/evolutions.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    return n


# ==================== Sprite ====================
# Sheet goc 128x88: (0,0,64,64) mat truoc, (64,0,128,64) mat sau,
# (0,64,24,88) va (24,64,48,88) hai icon nho.
def write_sprites(mons, dex, gfx):
    from PIL import Image
    import hashlib
    os.makedirs('assets/mon', exist_ok=True)

    # Mot so con trong bo goc chi co icon dang dau hoi "?" — dung chung mot anh.
    # Tim chu ky cua anh do de thay bang chinh sprite mat truoc thu nho, nhu vay
    # moi con van co icon rieng chu khong bi trung nhau.
    sigs = {}
    for m in mons:
        sheet = Image.open(os.path.join(gfx, m['slug'] + '-sheet.png')).convert('RGBA')
        sig = hashlib.md5(sheet.crop((0, 64, 24, 88)).tobytes()).hexdigest()
        sigs[sig] = sigs.get(sig, 0) + 1
    placeholder = {s for s, c in sigs.items() if c > 1}

    n = 0
    swapped = 0
    for m in mons:
        i = dex[m['slug']]
        sheet = Image.open(os.path.join(gfx, m['slug'] + '-sheet.png')).convert('RGBA')
        front = sheet.crop((0, 0, 64, 64))
        back = sheet.crop((64, 0, 128, 64))
        icon = sheet.crop((0, 64, 24, 88))
        if hashlib.md5(icon.tobytes()).hexdigest() in placeholder:
            icon = shrink_to_icon(front)
            swapped += 1
        front.save('assets/mon/%d.png' % i, optimize=True)
        back.save('assets/mon/%d_b.png' % i, optimize=True)
        icon.save('assets/mon/%d_i.png' % i, optimize=True)
        n += 3
    if swapped:
        print('  (%d con dung icon dau hoi -> thay bang sprite thu nho)' % swapped)
    return n


def shrink_to_icon(front):
    """Cat sat sprite mat truoc roi thu ve khung 24x24, can giua."""
    from PIL import Image
    bb = front.getbbox()
    body = front.crop(bb) if bb else front
    side = max(body.width, body.height, 1)
    scale = 22 / side
    w = max(1, round(body.width * scale))
    h = max(1, round(body.height * scale))
    small = body.resize((w, h), Image.LANCZOS)
    out = Image.new('RGBA', (24, 24), (0, 0, 0, 0))
    out.alpha_composite(small, ((24 - w) // 2, (24 - h) // 2))
    return out


if __name__ == '__main__':
    main()
