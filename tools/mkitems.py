# -*- coding: utf-8 -*-
"""Chuyen vat pham cua Tuxemon sang du an.

Chay:  python3 tools/mkitems.py <duong-dan-kho-Tuxemon>

Nguon: https://github.com/Tuxemon/Tuxemon — du lieu va anh CC BY-SA 4.0.

Ghi de:
  js/data/items.js     danh sach vat pham
  assets/items/*.png   icon lay thang tu gfx/items cua Tuxemon

Truoc day phan vat pham van la do Pokemon (Potion, Poke Ball...) voi icon
lay tu kho pokesprite. Gio dung DUNG do cua Tuxemon: tuxeball de bat, potion
de hoi mau, booster de tien hoa.

Ma vat pham GIU NGUYEN slug cua Tuxemon de sau nay doi chieu cho de.
"""
import os
import re
import sys

from PIL import Image

# Vat pham dua vao game: (slug, nhom, gia, mo ta tieng Viet, so lieu rieng)
# kind: 'ball' bat | 'medicine' hoi phuc | 'stone' tien hoa | 'held' mang theo
#   ball  -> rate: he so bat
#   medicine -> heal: so HP hoi ('full' = day), cure: trang thai chua ('all' = het)
ITEMS = [
    # ==== Tuxeball ====
    ('tuxeball',          'ball',     100, 'Tuxeball cơ bản để bắt Tuxemon hoang.', {'rate': 1}),
    ('tuxeball_hardened', 'ball',     350, 'Vỏ gia cố, bắt dễ hơn hẳn Tuxeball thường.', {'rate': 1.5}),
    ('tuxeball_lavish',   'ball',     300, 'Tuxeball xa xỉ, tỉ lệ bắt cao.', {'rate': 2}),
    ('tuxeball_crusher',  'ball',     400, 'Càng ép yếu đối thủ thì càng dễ bắt.', {'rate': 2.5}),
    ('tuxeball_ancient',  'ball',    1200, 'Tuxeball cổ, gần như chắc chắn bắt được.', {'rate': 4}),
    # ==== Hoi phuc ====
    ('potion',            'medicine',   50, 'Hồi 50 HP cho một Tuxemon.', {'heal': 50}),
    ('super_potion',      'medicine',  100, 'Hồi 100 HP cho một Tuxemon.', {'heal': 100}),
    ('mega_potion',       'medicine',  400, 'Hồi 200 HP cho một Tuxemon.', {'heal': 200}),
    ('imperial_potion',   'medicine', 1000, 'Hồi đầy HP cho một Tuxemon.', {'heal': 'full'}),
    ('restoration',       'medicine',  700, 'Chữa mọi trạng thái xấu.', {'cure': 'all'}),
    ('cureall',           'medicine', 1500, 'Hồi đầy HP và chữa mọi trạng thái.',
     {'heal': 'full', 'cure': 'all'}),
    ('revive',            'medicine', 1500, 'Hồi sinh Tuxemon bất tỉnh với nửa HP.',
     {'revive': 0.5}),
    # ==== Tien hoa ====
    ('fire_booster',      'stone',    2000, 'Giúp Tuxemon hệ Lửa tiến hoá.', {}),
    ('water_booster',     'stone',    2000, 'Giúp Tuxemon hệ Nước tiến hoá.', {}),
    ('wood_booster',      'stone',    2000, 'Giúp Tuxemon hệ Gỗ tiến hoá.', {}),
    ('earth_booster',     'stone',    2000, 'Giúp Tuxemon hệ Đất tiến hoá.', {}),
    ('metal_booster',     'stone',    2000, 'Giúp Tuxemon hệ Kim tiến hoá.', {}),
    # ==== Keo len cap ====
    ('lucky_bamboo',      'held',     2000, 'Trúc may mắn — tăng ngay 1 cấp cho Tuxemon.',
     {'levelUp': 1}),
    # ==== Mang theo / khac ====
    ('fishing_rod',       'held',      800, 'Cần câu — vật kỷ niệm của dân ven hồ.', {}),
    ('nu_phone',          'held',      500, 'Điện thoại đời mới, ai cũng có một cái.', {}),
]

# Ten tieng Viet hien trong game
VI = {
    'tuxeball': 'Tuxeball', 'tuxeball_hardened': 'Tuxeball Gia Cố',
    'tuxeball_lavish': 'Tuxeball Xa Xỉ', 'tuxeball_crusher': 'Tuxeball Nghiền',
    'tuxeball_ancient': 'Tuxeball Cổ',
    'potion': 'Thuốc Hồi', 'super_potion': 'Thuốc Hồi Lớn',
    'mega_potion': 'Thuốc Hồi Cực Lớn', 'imperial_potion': 'Thuốc Hoàng Gia',
    'restoration': 'Thuốc Giải', 'cureall': 'Thuốc Toàn Năng', 'revive': 'Hồi Sinh',
    'fire_booster': 'Đá Lửa', 'water_booster': 'Đá Nước', 'wood_booster': 'Đá Gỗ',
    'earth_booster': 'Đá Đất', 'metal_booster': 'Đá Kim',
    'fishing_rod': 'Cần Câu', 'nu_phone': 'Điện Thoại',
    'lucky_bamboo': 'Trúc May Mắn',
}


# Vai mon khong co anh trung ten -> lay anh cung y nghia trong kho Tuxemon
IMG = {
    'restoration': 'antidote-grapes',
    'cureall': 'luminescent-potion',
}


def js(v):
    if isinstance(v, str):
        return "'%s'" % v.replace("'", "\\'")
    if isinstance(v, bool):
        return 'true' if v else 'false'
    return str(v)


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    root = sys.argv[1]
    db = os.path.join(root, 'mods/tuxemon/db/item')
    gfx = os.path.join(root, 'mods/tuxemon/gfx/items')
    if not os.path.isdir(db):
        raise SystemExit('Khong thay %s' % db)

    os.makedirs('assets/items', exist_ok=True)
    for f in os.listdir('assets/items'):
        if f.endswith('.png'):
            os.remove(os.path.join('assets/items', f))

    out = ["// TuxeWorld H5 | data/items.js | Vật phẩm — TỰ SINH TỪ tools/mkitems.py",
           '// Nguồn: Tuxemon (CC BY-SA 4.0). Đừng sửa tay.', '',
           "// kind: 'ball' bắt | 'medicine' hồi phục | 'stone' tiến hoá | 'held' mang theo",
           'export const ITEMS = {']
    n_img = 0
    missing = []
    for slug, kind, price, desc, extra in ITEMS:
        y = os.path.join(db, slug + '.yaml')
        if not os.path.exists(y):
            missing.append(slug)
            continue
        src = os.path.join(gfx, IMG.get(slug, slug) + '.png')
        if os.path.exists(src):
            # Icon goc 24x24. Man hinh dien thoai co 3 diem anh vat ly cho 1
            # diem anh CSS nen phai phong len 4 lan bang NEAREST, khong thi
            # trinh duyet tu keo gian ra anh nhoe.
            im = Image.open(src).convert('RGBA')
            im.resize((im.width * 4, im.height * 4), Image.NEAREST).save(
                'assets/items/%s.png' % slug, optimize=True)
            n_img += 1
        else:
            missing.append('anh:' + slug)
        eff = ', '.join('%s: %s' % (k, js(v)) for k, v in extra.items())
        out.append("  %s: { name: %s, desc: %s, kind: %s, price: %d, sell: %d%s }," % (
            slug, js(VI.get(slug, slug)), js(desc), js(kind), price, round(price * 0.5),
            (', effect: { %s }' % eff) if eff else ''))
    out.append('};')
    out.append('''
export const itemIconPath = (id) => `assets/items/${id}.png`;
export const itemsOfKind = (kind) => Object.entries(ITEMS).filter(([, it]) => it.kind === kind);''')
    open('js/data/items.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print('OK: %d vật phẩm, %d icon' % (len(ITEMS) - len([m for m in missing if ':' not in m]), n_img))
    if missing:
        print('THIẾU:', ', '.join(missing))


if __name__ == '__main__':
    main()
