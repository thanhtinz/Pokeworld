# -*- coding: utf-8 -*-
"""Doc CONG THUC CHE TAO cua Tuxemon (mods/recipes.yaml) ra js/data/recipes.js.

Chay:  python3 tools/mkrecipes.py <duong-dan-kho-Tuxemon>

Mot cong thuc gom:
  · required_ingredients  nguyen lieu ton di
  · possible_outputs      ket qua, moi cai mot trong so (weight)
  · crafting_method       cach lam: cooking / brewing / ...

Ket qua bo cham theo trong so nen cung mot cong thuc co the ra mon ngon hoac
mon hong — dung nhu ban goc.
"""
import json
import os
import sys

import yaml

# Ten tieng Viet cho cach che tao
CACH = {
    'cooking': 'Nấu ăn',
    'brewing': 'Pha chế',
    'baking': 'Nướng bánh',
    'alchemy': 'Luyện đan',
    'crafting': 'Thủ công',
}


def js(v):
    return json.dumps(v, ensure_ascii=False)


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    root = sys.argv[1]
    p = os.path.join(root, 'mods/recipes.yaml')
    if not os.path.exists(p):
        raise SystemExit('Khong thay %s' % p)

    with open(p, encoding='utf-8') as f:
        ds = yaml.safe_load(f) or []

    rows = []
    lieu = set()
    ketqua = set()
    for r in ds:
        if not isinstance(r, dict) or not r.get('recipe_slug'):
            continue
        ng = {k: int(v) for k, v in (r.get('required_ingredients') or {}).items()}
        if not ng:
            continue
        lieu.update(ng)
        out = []
        for o in r.get('possible_outputs') or []:
            if o.get('type') and o['type'] != 'item':
                continue           # quest_trigger / lore_trigger: bo qua
            out.append({'id': o['slug'], 'n': int(o.get('quantity', 1)),
                        'w': float(o.get('weight', 1))})
            ketqua.add(o['slug'])
        if not out:
            continue
        rows.append({
            'id': r['recipe_slug'],
            'cach': r.get('crafting_method') or 'crafting',
            'ng': ng,
            'out': out,
        })

    with open('js/data/recipes.js', 'w', encoding='utf-8') as f:
        f.write('// TuxeWorld H5 | data/recipes.js | Công thức chế tạo\n')
        f.write('// SINH TU DONG boi tools/mkrecipes.py tu mods/recipes.yaml — KHONG SUA TAY.\n')
        f.write('//\n')
        f.write('// ng  = nguyên liệu cần (mã món -> số lượng)\n')
        f.write('// out = kết quả có thể ra, w là trọng số (cộng lại chưa chắc bằng 1)\n\n')
        f.write('export const CACH_LAM = %s;\n\n' % js(CACH))
        f.write('export const RECIPES = [\n')
        for r in rows:
            f.write('  { id: %s, cach: %s, ng: %s, out: %s },\n'
                    % (js(r['id']), js(r['cach']), js(r['ng']), js(r['out'])))
        f.write('];\n\n')
        f.write('export const RECIPE_BY_ID = '
                'Object.fromEntries(RECIPES.map(r => [r.id, r]));\n')

    # Danh sach nguyen lieu de mkitems.py biet ma giu lai (nhung mon nay khong
    # co hieu ung gi nen mac dinh bi loc mat)
    # Danh sach mon can GIU LAI cho mkitems.py: ca nguyen lieu LAN ket qua. Ca
    # hai deu co mon 'category: none' khong hieu ung gi nen mac dinh bi loc mat
    # — thieu ket qua thi che tao ra mon khong ton tai.
    with open('tools/_lieu.json', 'w', encoding='utf-8') as f:
        json.dump({'lieu': sorted(lieu), 'ketqua': sorted(ketqua)}, f,
                  ensure_ascii=False, indent=1)

    print('OK: %d công thức, %d nguyên liệu, %d loại kết quả'
          % (len(rows), len(lieu), len(ketqua)))


if __name__ == '__main__':
    main()
