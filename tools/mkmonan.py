# -*- coding: utf-8 -*-
"""Lap danh sach MON AN va bang mon roi ra tu Tuxemon hoang.

Chay:  python3 tools/mkmonan.py <duong-dan-kho-Tuxemon>

Ghi de:
  js/data/drops.js   mon an roi ra khi thang mot con hoang, xep theo HE
  tools/_lieu.json   danh sach mon can giu lai cho tools/mkitems.py

Truoc day tep nay doc mods/recipes.yaml ra bang cong thuc de nau trong Nha Bep.
Nha Bep bo roi, nhung 25 mon an thi giu: an vao van duoc mot BUA NO cong chi so
(xem js/engine/meal.js). Gio doc recipes.yaml chi de biet mon nao la MON AN,
roi cho tiem tap hoa ban va cho Tuxemon hoang lam rot ra.

Loc bang chinh du lieu goc: mon nao trong db/item co category 'food' moi la mon
an. May mon "nau hong" trong cung cong thuc (sup lam mat mau, trung op kinh
hoang) mang category 'none' nen tu roi ra ngoai.
"""
import glob
import json
import os
import sys

import yaml

# ==== Mon an roi ra tu Tuxemon hoang ====
# Danh mot con hoang la co cua nhat duoc mot mon hop voi HE cua no. Mon an chia
# nhom theo VI AM (js/data/tastes.js) — moi vi am cong mot chi so khac nhau —
# nen gan vi am voi he cho hop le: vi Man cong Can chien thi ra o may he danh
# gan, vi Thanh cong Tam xa thi ra o may he danh xa.
#
# w = trong so trong bang boc tham cua he do.
ROI_THEO_VI = {
    'salty':   [('heroic', 9), ('metal', 7), ('earth', 5)],     # Mặn — cận chiến
    'zesty':   [('sky', 9), ('lightning', 7), ('water', 5)],    # Thanh — tầm xa
    'hearty':  [('earth', 9), ('metal', 7), ('wood', 5)],       # Đậm — giáp
    'peppy':   [('lightning', 9), ('fire', 7), ('sky', 5)],     # Hăng — tốc
    'refined': [('cosmic', 9), ('shadow', 7), ('venom', 5)],    # Tinh — né
    'savory':  [('normal', 9), ('wood', 7), ('frost', 5)],      # Bùi — máu
}

# Xac suat roi do sau MOT tran thang Tuxemon hoang. Danh mai khong ra thi nan,
# ma ra lien tuc thi day tui trong nua tieng — mot phan ba la vua.
TI_LE_ROI = 0.34


def js(v):
    return json.dumps(v, ensure_ascii=False)


def doc_mon_an(root):
    """Doc db/item, tra ve {ma mon: vi am} cua nhung mon category 'food'."""
    ra = {}
    for p in sorted(glob.glob(os.path.join(root, 'mods/tuxemon/db/item/*.yaml'))):
        d = yaml.safe_load(open(p, encoding='utf-8')) or {}
        if d.get('category') != 'food':
            continue
        vi = None
        for e in (d.get('effects') or []):
            if isinstance(e, dict) and e.get('type') == 'food_preference':
                # parameters: ['taste_<vi am>', 'taste_<vi lanh>']
                ps = [str(x) for x in (e.get('parameters') or [])]
                if ps:
                    vi = ps[0].replace('taste_', '')
        ra[d.get('slug') or os.path.basename(p)[:-5]] = vi
    return ra


def viet_drops(mon_vi):
    """js/data/drops.js — bang mon an roi ra theo HE cua con vua danh."""
    la = sorted(v for v in set(mon_vi.values()) if v and v not in ROI_THEO_VI)
    if la:
        raise SystemExit('Vi am chua gan he: %s' % ' '.join(la))
    theo_he = {}
    for ma, vi in sorted(mon_vi.items()):
        for he, w in ROI_THEO_VI.get(vi) or []:
            theo_he.setdefault(he, []).append({'id': ma, 'w': w})
    with open('js/data/drops.js', 'w', encoding='utf-8') as f:
        f.write('// TuxeWorld H5 | data/drops.js | Món ăn rơi từ Tuxemon hoang\n')
        f.write('// SINH TU DONG boi tools/mkmonan.py — KHONG SUA TAY.\n')
        f.write('//\n')
        f.write('// Bản gốc Tuxemon không có hệ thống rơi đồ, mà món ăn cũng không\n')
        f.write('// bán ở đâu. Bảng này cho mỗi hệ vài món hợp lẽ: món vị Mặn (cộng\n')
        f.write('// Cận chiến) rơi ở mấy hệ đánh gần, món vị Thanh (cộng Tầm xa) rơi\n')
        f.write('// ở mấy hệ đánh xa.\n\n')
        f.write('export const TI_LE_ROI = %s;\n\n' % js(TI_LE_ROI))
        f.write('export const ROI_THEO_HE = {\n')
        for he, ds in sorted(theo_he.items()):
            f.write('  %s: %s,\n' % (he, js(ds)))
        f.write('};\n')
    return theo_he


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    root = sys.argv[1]
    mon_vi = doc_mon_an(root)
    if not mon_vi:
        raise SystemExit('Khong tim thay mon an nao trong db/item')

    # Mon an mang 'category: none' nen mkitems.py mac dinh loc mat — ghi ra day
    # cho no biet ma giu lai.
    with open('tools/_lieu.json', 'w', encoding='utf-8') as f:
        json.dump({'lieu': [], 'ketqua': sorted(mon_vi)}, f,
                  ensure_ascii=False, indent=1)

    theo_he = viet_drops(mon_vi)
    print('OK: %d món ăn, rơi ở %d hệ' % (len(mon_vi), len(theo_he)))


if __name__ == '__main__':
    main()
