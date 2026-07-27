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

# Tuxemon KHONG co chi so rieng tung loai: moi con lay 6 chi so cua DANG THAN
# (shape) roi nhan theo cap. Bang shape nao cung cong lai bang 36 nen khong con
# nao "manh san" hon con nao — chenh lech den tu cap, IV, TP va bo chieu.
STAT_KEYS = ['hp', 'armour', 'dodge', 'melee', 'ranged', 'speed']


# Chi 5 tam nay moi gay sat thuong (mods/range_map.yaml cua ban goc)
DAMAGE_RANGES = {'melee', 'touch', 'ranged', 'reach', 'reliable'}


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

    write_statuses(db, names, disp)
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


# ==================== Trang thai ====================
# Ten tieng Viet cho tung trang thai. Cai nao khong co trong bang thi lay ten
# goc, van chay duoc.
STATUS_VI = {
    'blinded': 'Mù', 'burn': 'Bỏng', 'chargedup': 'Tích lực', 'charging': 'Đang dồn lực',
    'charmed': 'Mê hoặc', 'confused': 'Rối trí', 'diehard': 'Lì đòn',
    'elementalshield': 'Khiên nguyên tố', 'enraged': 'Nổi giận', 'exhausted': 'Kiệt sức',
    'feedback': 'Phản đòn', 'festering': 'Mưng mủ', 'flinching': 'Chùn tay',
    'focused': 'Tập trung', 'grabbed': 'Bị ghì', 'hardshell': 'Vỏ cứng',
    'harpooned': 'Dính lao', 'lifegift': 'Ban sinh lực', 'lifeleech': 'Hút máu',
    'lockdown': 'Bị khoá', 'noddingoff': 'Ngủ gật', 'poison': 'Trúng độc',
    'prickly': 'Gai góc', 'recover': 'Hồi phục', 'retaliate': 'Đáp trả',
    'revenge': 'Báo thù', 'slow': 'Chậm chạp', 'sniping': 'Nhắm bắn',
    'softened': 'Mềm nhũn', 'spiky': 'Đầy gai', 'stuck': 'Kẹt cứng',
    'wasting': 'Suy kiệt', 'wild': 'Hoang dại', 'eliminated': 'Bị loại', 'faint': 'Gục',
}

# Trang thai chi de danh dau trong may, khong phai thu dinh vao con vat
STATUS_SKIP = {'faint', 'eliminated'}


def write_statuses(db, names, disp):
    d = os.path.join(db, 'status')
    rows = []
    for f in sorted(os.listdir(d)):
        if not f.endswith('.yaml'):
            continue
        st = load(os.path.join(d, f))
        slug = st.get('slug')
        if not slug or slug in STATUS_SKIP:
            continue
        eff = [e for e in (st.get('effects') or []) if isinstance(e, dict)]
        kind = next((e['type'] for e in eff if e.get('type') != 'statchange'), 'statchange')
        params = next((e.get('parameters') or [] for e in eff if e.get('type') == kind), [])
        mods = {k: v.get('value') for k, v in (st.get('stat_modifiers') or {}).items()
                if v.get('operation') == '*'}
        # He mien nhiem / dinh nang: modifiers kieu type
        imm = [m['values'][0] for m in (st.get('modifiers') or [])
               if m.get('attribute') == 'type' and m.get('multiplier') == 0 and m.get('values')]
        rows.append((slug, {
            'name': STATUS_VI.get(slug, disp(slug)),
            'cat': st.get('category') or 'negative',
            'kind': kind,
            'p': params,
            'mods': mods,
            'immune': imm,
            'keep': bool((st.get('behaviors') or {}).get('persists_after_combat')),
        }))

    out = ["// PokeWorld H5 | data/statuses.js | Trạng thái — TỰ SINH TỪ tools/mktuxemon.py",
           '// Nguồn: Tuxemon db/status (CC BY-SA 4.0). Đừng sửa tay.',
           '// kind = kiểu tác động (xem js/engine/status.js), p = tham số của bản gốc,',
           '// mods = nhân chỉ số, immune = hệ miễn nhiễm, keep = còn sau khi hết trận.', '',
           'export const STATUSES = {']
    for slug, r in rows:
        out.append('  %s: { name: %s, cat: %s, kind: %s, p: %s, mods: %s, immune: %s%s },'
                   % (js(slug), js(r['name']), js(r['cat']), js(r['kind']), js(r['p']),
                      js(r['mods']), js(r['immune']), ', keep: true' if r['keep'] else ''))
    out.append('};')
    out.append('')
    out.append('export const statusName = (id) => (STATUSES[id] && STATUSES[id].name) || id;')
    open('js/data/statuses.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    return len(rows)


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
           '// base = 6 chỉ số của DÁNG THÂN (4-9), giống hệt bản gốc: chỉ số thật',
           '// tính bằng base * (cấp + 7) + IV + TP. Mọi dáng thân cộng lại đều bằng 36.',
           '// catchRate 0-100, catchLo/catchHi = khoảng kháng bắt ngẫu nhiên mỗi lần ném.',
           '// height tính bằng mét, weight bằng kg (Tuxemon lưu cm và hg).', '',
           'export const SPECIES = {']
    for m in mons:
        i = dex[m['slug']]
        shape = m.get('shape', 'blob')
        attr = shapes.get(shape) or shapes['blob']
        types = m.get('types') or ['normal']
        out.append('  %d: { name: %s, slug: %s, types: %s,' % (i, js(disp(m['slug'])), js(m['slug']), js(types)))
        out.append('    base: { %s },' % ', '.join('%s: %d' % (k, attr[k]) for k in STAT_KEYS))
        out.append('    catchRate: %s, catchLo: %s, catchHi: %s, genderRatio: %s,'
                   % (fmtnum(round(float(m.get('catch_rate', 100)), 2)),
                      fmtnum(round(float(m.get('lower_catch_resistance', 1)), 2)),
                      fmtnum(round(float(m.get('upper_catch_resistance', 1)), 2)),
                      fmtnum(round(float((m.get('gender_weights') or {}).get('male', 0.5)), 3))))
        # Tuxemon co 13 con "glitched" (ten kieu F7U1T3Ra) — de nguyen thi Tuxedex
        # trang dau toan chu loi nhin nhu hong font, nen danh dau de game an di.
        glitch = ', glitched: true' if m.get('species') == 'glitched' else ''
        out.append('    height: %s, weight: %s, shape: %s, stage: %s%s },'
                   % (fmtnum(max(0.1, round((m.get('height') or 100) / 100, 2))),
                      fmtnum(max(0.1, round((m.get('weight') or 100) / 10, 1))),
                      js(shape), js(m.get('stage', 'basic')), glitch))
    out.append('};')
    out.append('''
export const DEX_MAX = %d;
export const speciesBySlug = (slug) => Object.values(SPECIES).find(s => s.slug === slug) || null;''' % len(mons))
    open('js/data/species.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')


# ==================== Chieu thuc ====================
# Giu nguyen so lieu goc cua Tuxemon: power la HE SO (0.4-3.0), accuracy 0-1,
# range quyet dinh lay chi so nao danh vao chi so nao (xem js/engine/damage.js),
# recharge la so luot phai cho truoc khi dung lai — Tuxemon KHONG co PP.
# range 'special' trong du lieu goc khong nam trong bang range_map nen khong gay
# sat thuong; day la nhung chieu ho tro.
# Nhung hieu ung cua chieu ma game nay chay duoc (xem js/engine/battle.js).
# Cai khong nam trong day (multiattack phuc tap, swap doi hinh, forfeit...) thi
# bo qua chu khong bia ra hieu ung khac.
EFFECT_KEEP = {'give', 'healing', 'prop_healing', 'prop_damage', 'remove', 'money', 'multiattack'}


def hieu_ung(t):
    """Rut goi danh sach effects cua Tuxemon ve dang game doc duoc."""
    out = []
    for e in t.get('effects') or []:
        if not isinstance(e, dict):
            continue
        kind = e.get('type')
        if kind not in EFFECT_KEEP:
            continue
        par = [str(x) for x in (e.get('parameters') or [])]
        row = {'t': kind}
        if kind == 'give':
            row['id'] = par[0] if par else ''
            row['to'] = 'self' if len(par) > 1 and par[1] == 'own_monster' else 'foe'
        elif kind in ('prop_healing', 'prop_damage'):
            row['to'] = 'self' if par and par[0] == 'own_monster' else 'foe'
            row['n'] = float(par[1]) if len(par) > 1 else 0.25
        elif kind == 'multiattack':
            row['n'] = int(float(par[0])) if par else 2
        elif kind == 'remove':
            row['cat'] = par[0] if par else 'negative'
            row['to'] = 'self' if len(par) > 1 and par[1] == 'own_monster' else 'foe'
        out.append(row)
    return out


def write_moves(techs, disp):
    out = ["// PokeWorld H5 | data/moves.js | Chiêu thức — TỰ SINH TỪ tools/mktuxemon.py",
           '// Nguồn: Tuxemon (CC BY-SA 4.0). Đừng sửa tay.',
           '// power là HỆ SỐ như bản gốc (0.4-3.0), acc 0-100, recharge = số lượt chờ.',
           '// range: melee (cận chiến vs giáp) · touch (cận chiến vs né) · ranged',
           '// (tầm xa vs né) · reach (tầm xa vs giáp) · reliable (theo cấp, không đỡ được).', '',
           'export const MOVES = {']
    for slug in sorted(techs):
        t = techs[slug]
        types = t.get('types') or ['normal']
        rng = t.get('range', 'melee')
        kinds = {e.get('type') for e in (t.get('effects') or []) if isinstance(e, dict)}
        is_dmg = 'damage' in kinds and rng in DAMAGE_RANGES
        heal = float(t.get('healing_power') or 0)
        cat = 'damage' if is_dmg else ('healing' if heal > 0 else 'status')
        power = round(float(t.get('power') or 0), 2) if is_dmg else 0
        acc = round(float(t.get('accuracy') if t.get('accuracy') is not None else 1) * 100)
        eff = hieu_ung(t)
        out.append('  %s: { name: %s, types: %s, range: %s, category: %s, power: %s, acc: %d, recharge: %d, potency: %s, heal: %s%s },'
                   % (js(slug), js(disp(slug)), js(types), js(rng), js(cat), fmtnum(power), acc,
                      int(t.get('recharge') or 0), fmtnum(round(float(t.get('potency') or 0), 2)),
                      fmtnum(round(heal, 2)),
                      (', eff: %s' % js(eff)) if eff else ''))
    out.append('};')
    out.append('')
    out.append('// Hệ chính của chiêu (giao diện cần một màu để tô)')
    out.append('export const moveType = (id) => (MOVES[id] && MOVES[id].types[0]) || \'normal\';')
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
