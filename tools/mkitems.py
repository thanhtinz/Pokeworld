# -*- coding: utf-8 -*-
"""Chuyen VAT PHAM cua Tuxemon sang du an.

Chay:  python3 tools/mkitems.py <duong-dan-kho-Tuxemon>

Nguon: https://github.com/Tuxemon/Tuxemon — du lieu va anh CC BY-SA 4.0.

Ghi de:
  js/data/items.js     danh sach vat pham + hieu ung
  js/data/capdev.js    bang he so cua tung loai tuxeball (mods/capture_devices.yaml)
  assets/items/*.png   icon lay thang tu gfx/items cua Tuxemon

Chi lay nhung mon co HIEU UNG MA GAME NAY CHAY DUOC:
  capture         nem bat
  heal            hoi mau (fixed / percentage)
  restore         go trang thai xau, hoi sinh con da guc
  gain_xp         cho ngay mot cuc EXP
  evolve          da tien hoa
  statchange      tang chi so TRONG TRAN
  change_stat     tang chi so VINH VIEN
  food_preference mon an — hop khau vi thi tang than thiet

Con lai (dien thoai, can cau, dich chuyen, nhiem vu) chua co he thong tuong ung
nen khong dua vao, dua vao chi lam day tui do.

Ma vat pham GIU NGUYEN slug cua Tuxemon de doi chieu cho de.
"""
import os
import sys

import yaml
from PIL import Image

HIEU_UNG = {'capture', 'heal', 'restore', 'gain_xp', 'evolve',
            'statchange', 'change_stat', 'food_preference'}

# category cua ban goc -> nhom o trong tui do
NHOM = {
    'capture': 'ball',
    'potion': 'medicine',
    'morph': 'stone',
    'food': 'food',
    'stats': 'stat',
    'none': 'tea',
}

# Chi so: slug ban goc -> ten tieng Viet
CHI_SO = {'hp': 'HP', 'armour': 'Giáp', 'dodge': 'Né', 'melee': 'Cận chiến',
          'ranged': 'Tầm xa', 'speed': 'Tốc độ'}

HE = {'earth': 'Đất', 'fire': 'Lửa', 'metal': 'Kim', 'water': 'Nước', 'wood': 'Gỗ',
      'nut': 'Hạt', 'aether': 'Thái Hư', 'electric': 'Điện', 'ice': 'Băng',
      'poison': 'Độc', 'psychic': 'Linh', 'dragon': 'Rồng', 'normal': 'Thường'}

VI_KHAU_VI = {
    'mild': 'nhạt', 'sweet': 'ngọt', 'soft': 'mềm', 'flakey': 'bở', 'dry': 'khô',
    'bland': 'lạt', 'peppy': 'hăng', 'salty': 'mặn', 'hearty': 'đậm',
    'zesty': 'thanh', 'refined': 'tinh', 'savory': 'bùi',
}

GIOI_TINH = {'male': 'm', 'female': 'f', 'neuter': 'n'}
VI_GIOI_TINH = {'m': 'đực', 'f': 'cái', 'n': 'vô tính'}

# Ten tieng Viet. Mon nao khong co o day thi lay ten tieng Anh trong tep dich.
TEN = {
    'tuxeball': 'Tuxeball', 'tuxeball_hardened': 'Tuxeball Gia Cố',
    'tuxeball_lavish': 'Tuxeball Xa Xỉ', 'tuxeball_crusher': 'Tuxeball Nghiền',
    'tuxeball_ancient': 'Tuxeball Cổ', 'tuxeball_noble': 'Tuxeball Quý Tộc',
    'tuxeball_grand': 'Tuxeball Thượng Hạng', 'tuxeball_majestic': 'Tuxeball Uy Nghi',
    'tuxeball_earth': 'Tuxeball Đất', 'tuxeball_fire': 'Tuxeball Lửa',
    'tuxeball_metal': 'Tuxeball Kim', 'tuxeball_water': 'Tuxeball Nước',
    'tuxeball_wood': 'Tuxeball Gỗ', 'tuxeball_male': 'Tuxeball Đực',
    'tuxeball_female': 'Tuxeball Cái', 'tuxeball_neuter': 'Tuxeball Vô Tính',
    'tuxeball_gambler': 'Tuxeball Đỏ Đen', 'tuxeball_candy': 'Tuxeball Kẹo',
    'tuxeball_hearty': 'Tuxeball Vị Đậm', 'tuxeball_peppy': 'Tuxeball Vị Hăng',
    'tuxeball_refined': 'Tuxeball Vị Tinh', 'tuxeball_salty': 'Tuxeball Vị Mặn',
    'tuxeball_zesty': 'Tuxeball Vị Thanh', 'tuxeball_diurnal': 'Tuxeball Ban Ngày',
    'tuxeball_nocturnal': 'Tuxeball Ban Đêm',

    'potion': 'Thuốc Hồi', 'super_potion': 'Thuốc Hồi Lớn',
    'mega_potion': 'Thuốc Hồi Cực Lớn', 'imperial_potion': 'Thuốc Hoàng Gia',
    'restoration': 'Thuốc Giải', 'cureall': 'Thuốc Toàn Năng', 'revive': 'Hồi Sinh',

    'tea': 'Trà', 'mystery_tea': 'Trà Bí Ẩn', 'ancient_tea': 'Trà Cổ',
    'imperial_tea': 'Trà Hoàng Gia',

    'boost_armour': 'Tăng Giáp', 'boost_dodge': 'Tăng Né', 'boost_melee': 'Tăng Cận Chiến',
    'boost_ranged': 'Tăng Tầm Xa', 'boost_speed': 'Tăng Tốc Độ',
    'raise_armour': 'Rèn Giáp', 'raise_dodge': 'Rèn Né', 'raise_hp': 'Rèn HP',
    'raise_melee': 'Rèn Cận Chiến', 'raise_ranged': 'Rèn Tầm Xa', 'raise_speed': 'Rèn Tốc Độ',

    'fire_booster': 'Đá Lửa', 'water_booster': 'Đá Nước', 'wood_booster': 'Đá Gỗ',
    'earth_booster': 'Đá Đất', 'metal_booster': 'Đá Kim', 'booster_tech': 'Đá Kỹ Thuật',
    'flintstone': 'Đá Đánh Lửa', 'thunderstone': 'Đá Sét', 'lucky_bamboo': 'Trúc May Mắn',
    'lima_pie': 'Bánh Lima', 'miaow_milk': 'Sữa Meo', 'ox_stick': 'Gậy Sừng Bò',
    'peace_lily': 'Huệ Bình An', 'pyramidion': 'Chóp Kim Tự Tháp',
    'sea_girdle': 'Đai Biển', 'stovepipe': 'Ống Khói', 'sweet_sand': 'Cát Ngọt',
    'tectonic_drill': 'Mũi Khoan Địa Tầng', 'petrified_dung': 'Phân Hoá Thạch',

    'cheesecake': 'Bánh Phô Mai', 'cream_puffs': 'Bánh Su Kem', 'crepes': 'Bánh Crepe',
    'croissants': 'Bánh Sừng Bò', 'hash': 'Khoai Băm', 'honey_cake': 'Bánh Mật Ong',
    'mashed_potatoes': 'Khoai Nghiền', 'meatballs': 'Thịt Viên',
    'mille_feuille': 'Bánh Ngàn Lớp', 'pancakes': 'Bánh Rán', 'pastry': 'Bánh Ngọt',
    'phyllo': 'Bánh Phyllo', 'pie': 'Bánh Nướng', 'pita': 'Bánh Pita',
    'potato_casserole': 'Khoai Nướng Phô Mai', 'potato_fries': 'Khoai Chiên',
    'pretzels': 'Bánh Quy Xoắn', 'pudding': 'Bánh Pudding', 'rub_chicken': 'Gà Ướp',
    'rub_pork_chops': 'Sườn Heo Ướp', 'rub_ribs': 'Sườn Nướng', 'rub_steak': 'Bò Bít Tết',
    'shell_tacos': 'Bánh Taco', 'souffle': 'Bánh Souffle', 'wings': 'Cánh Gà',
}

# Mon khong co anh trung ten -> muon anh cung y nghia
ANH = {'restoration': 'antidote-grapes', 'cureall': 'luminescent-potion'}


def js(v):
    if isinstance(v, str):
        return "'%s'" % v.replace("\\", "\\\\").replace("'", "\\'")
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if v is None:
        return 'null'
    return repr(v) if isinstance(v, float) else str(v)


def obj(d):
    return '{ %s }' % ', '.join('%s: %s' % (k, v) for k, v in d.items())


def doc_gia(root):
    """Gia mua/ban that trong db/economy (moi cua hang mot tep)."""
    import glob
    out = {}
    for f in glob.glob(os.path.join(root, 'mods/tuxemon/db/economy/*.yaml')):
        with open(f, encoding='utf-8') as fh:
            d = yaml.safe_load(fh) or {}
        for it in (d if isinstance(d, list) else (d.get('items') or [])):
            if isinstance(it, dict) and it.get('slug') and 'price' in it:
                out[it['slug']] = (int(it['price']),
                                   int(it.get('cost') or round(it['price'] * 0.5)))
    return out


def doc_ten_anh(root):
    """Ten tieng Anh trong tep dich, dung khi chua kip dat ten tieng Viet."""
    p = os.path.join(root, 'mods/tuxemon/l18n/en_US/LC_MESSAGES/base.po')
    out, key = {}, None
    if not os.path.exists(p):
        return out
    for line in open(p, encoding='utf-8'):
        line = line.strip()
        if line.startswith('msgid "'):
            key = line[7:-1]
        elif line.startswith('msgstr "') and key:
            out[key] = line[8:-1]
            key = None
    return out


def doc_capdev(root):
    p = os.path.join(root, 'mods/capture_devices.yaml')
    with open(p, encoding='utf-8') as fh:
        return yaml.safe_load(fh) or {}


def viet_capdev(cfg, ra):
    """js/data/capdev.js — he so cua tung loai tuxeball, chep y nguyen ban goc."""
    out = ['// TuxeWorld H5 | data/capdev.js | Hệ số của từng loại Tuxeball',
           '// TỰ SINH TỪ tools/mkitems.py — nguồn mods/capture_devices.yaml của Tuxemon.',
           '// Đừng sửa tay.', '',
           '// Mặc định của bản gốc khi một loại bóng không khai báo riêng.',
           'export const CAPDEV_BASE = %s;' % obj({
               'statusMult': js(float(cfg.get('status_modifier', 1.0))),
               'ballMult': js(float(cfg.get('capdev_modifier', 1.0))),
               'positive': '1.0', 'negative': '1.2',
               'elementMalus': '0.2', 'genderMalus': '0.2',
               'varBonus': '1.5', 'varMalus': '0.2',
           }),
           '',
           'export const CAPDEV = {']
    for slug, c in (cfg.get('items') or {}).items():
        if slug == 'example' or not isinstance(c, dict):
            continue
        d = {}
        if c.get('specific_capdev_modifier') is not None:
            d['mult'] = js(float(c['specific_capdev_modifier']))
        if c.get('specific_element_modifiers'):
            d['element'] = obj({k: js(float(v))
                                for k, v in c['specific_element_modifiers'].items()})
            d['elementMalus'] = js(float(c.get('fallback_element_malus', 0.2)))
        if c.get('specific_gender_modifiers'):
            d['gender'] = obj({GIOI_TINH.get(k, k): js(float(v))
                               for k, v in c['specific_gender_modifiers'].items()})
            d['genderMalus'] = js(float(c.get('fallback_gender_malus', 0.2)))
        if c.get('specific_status_modifiers'):
            d['status'] = obj({k: js(float(v))
                               for k, v in c['specific_status_modifiers'].items()})
        if c.get('specific_variables_modifiers'):
            d['vars'] = '[%s]' % ', '.join(
                obj({'key': js(v['key']), 'value': js(str(v['value']).lower())})
                for v in c['specific_variables_modifiers'] if isinstance(v, dict))
            d['varBonus'] = js(float(c.get('fallback_variables_bonus', 1.5)))
            d['varMalus'] = js(float(c.get('fallback_variables_malus', 0.2)))
        if c.get('random_bounds'):
            lo, hi = c['random_bounds']
            d['random'] = '[%s, %s]' % (js(float(lo)), js(float(hi)))
        if c.get('capdev_persistent_on_failure'):
            d['keepOnFail'] = 'true'
        if c.get('capdev_persistent_on_success'):
            d['keepOnCatch'] = 'true'
        if c.get('capdev_effects'):
            d['onCatch'] = '[%s]' % ', '.join(
                obj({'attr': js({'taste_warm': 'tasteWarm', 'taste_cold': 'tasteCold',
                                 'level': 'lv'}.get(e['target_attribute'], e['target_attribute'])),
                     'op': js(e['operation']),
                     'value': js(e['value'])})
                for e in c['capdev_effects'])
        out.append('  %s: %s,' % (slug, obj(d) if d else '{}'))
    out.append('};')
    out.append('''
// Loài nào bắt bằng bóng đắt tiền thì hệ số chỉ đọc được ở đây, không nằm trong
// items.js — giữ đúng cách bản gốc chia hai tệp.
export const capdevOf = (id) => CAPDEV[id] || null;''')
    ra.write('\n'.join(out) + '\n')


def mo_ta(slug, cat, eff, capdev, tien_hoa):
    """Sinh mo ta tieng Viet TU CHINH HIEU UNG — khong bia them."""
    if cat == 'capture':
        c = capdev.get(slug) or {}
        if c.get('specific_element_modifiers'):
            he = ', '.join(HE.get(k, k) for k in c['specific_element_modifiers'])
            return 'Bắt Tuxemon hệ %s dễ hơn hẳn, hệ khác thì khó hơn nhiều.' % he
        if c.get('specific_gender_modifiers'):
            g = ', '.join(VI_GIOI_TINH.get(GIOI_TINH.get(k, k), k)
                          for k in c['specific_gender_modifiers'])
            return 'Bắt Tuxemon giống %s dễ hơn hẳn, giống khác thì khó hơn nhiều.' % g
        if c.get('capdev_effects'):
            e = c['capdev_effects'][0]
            if e['target_attribute'] == 'level':
                return 'Bắt được thì con đó lên luôn 1 cấp.'
            return 'Bắt được thì con đó đổi khẩu vị ấm thành vị %s.' % \
                VI_KHAU_VI.get(str(e['value']), e['value'])
        if c.get('random_bounds'):
            return 'Tỉ lệ bắt bốc thăm mỗi lần ném — có khi trượt sạch, có khi ăn ngay.'
        if c.get('capdev_persistent_on_failure'):
            return 'Ném hụt vẫn nhặt lại được, không mất bóng.'
        if c.get('specific_variables_modifiers'):
            ban_ngay = str(c['specific_variables_modifiers'][0]['value']).lower() == 'true'
            return 'Chỉ hiệu quả vào %s, %s thì gần như vô dụng.' % (
                ('ban ngày', 'ban đêm') if ban_ngay else ('ban đêm', 'ban ngày'))
        if slug == 'tuxeball_crusher':
            return 'Đối thủ giáp càng dày càng dễ bắt — nhưng dính buff là hỏng.'
        m = c.get('specific_capdev_modifier')
        if m and m > 1:
            return 'Tỉ lệ bắt gấp %s lần Tuxeball thường.' % (
                ('%.2f' % m).rstrip('0').rstrip('.'))
        return 'Tuxeball cơ bản để bắt Tuxemon hoang.'

    phan = []
    for e in eff:
        t = e['type']
        p = e.get('parameters') or []
        if t == 'heal':
            n, mode = float(p[0]), (p[1] if len(p) > 1 else 'fixed')
            if mode == 'percentage':
                phan.append('Hồi %d%% máu tối đa.' % round(n * 100))
            else:
                phan.append('Hồi %d HP.' % int(n))
        elif t == 'restore':
            phan.append('Gỡ mọi trạng thái xấu, cứu được cả con đã gục.')
        elif t == 'gain_xp':
            phan.append('Cho ngay %s EXP.' % '{:,}'.format(int(float(p[0]))).replace(',', '.'))
        elif t == 'evolve':
            ten = tien_hoa.get(slug)
            phan.append('Giúp %s tiến hoá.' % (ten or 'vài loài nhất định'))
        elif t == 'statchange':
            st = slug[len('boost_'):] if slug.startswith('boost_') else ''
            phan.append('Tăng mạnh chỉ số %s trong suốt trận đấu.'
                        % CHI_SO.get(st, st or 'chính').lower())
        elif t == 'change_stat':
            phan.append('Tăng vĩnh viễn %d%% chỉ số %s.'
                        % (round(float(p[1]) * 100), CHI_SO.get(p[0], p[0]).lower()))
        elif t == 'food_preference':
            warm = VI_KHAU_VI.get(p[0].replace('taste_', ''), p[0])
            cold = VI_KHAU_VI.get(p[1].replace('taste_', ''), p[1])
            phan.append('Món vị %s và %s — hợp khẩu vị thì tăng thân thiết, kỵ thì mất.'
                        % (warm, cold))
    return ' '.join(phan) or 'Vật phẩm của thế giới Tuxemon.'


def hieu_ung_js(slug, eff, doc):
    out = []
    for e in eff:
        t = e['type']
        p = e.get('parameters') or []
        if t == 'capture':
            out.append(obj({'t': js('capture')}))
        elif t == 'heal':
            out.append(obj({'t': js('heal'), 'n': js(float(p[0])),
                            'mode': js(p[1] if len(p) > 1 else 'fixed')}))
        elif t == 'restore':
            out.append(obj({'t': js('restore')}))
        elif t == 'gain_xp':
            out.append(obj({'t': js('gainXp'), 'n': js(int(float(p[0])))}))
        elif t == 'evolve':
            out.append(obj({'t': js('evolve')}))
        elif t == 'change_stat':
            out.append(obj({'t': js('changeStat'), 'stat': js(p[0]), 'n': js(float(p[1]))}))
        elif t == 'statchange':
            # Chi so va do manh nam o khoa stat_modifiers cua chinh tep item.
            # SUA LOI CUA BAN GOC: boost_ranged khai bao nham la armour, ma ten
            # mon lai la "ranged" — lay chi so theo ten mon cho khoi loan.
            for stat, mod in (doc.get('stat_modifiers') or {}).items():
                if slug.startswith('boost_') and slug[len('boost_'):] in CHI_SO:
                    stat = slug[len('boost_'):]
                out.append(obj({'t': js('boost'), 'stat': js(stat),
                                'step': js(int(mod.get('step', 1)))}))
        elif t == 'food_preference':
            out.append(obj({'t': js('food'),
                            'warm': js(p[0].replace('taste_', '')),
                            'cold': js(p[1].replace('taste_', ''))}))
    return out


def dieu_kien_js(conds):
    """Chi giu dieu kien game nay kiem tra duoc."""
    out = []
    for c in conds or []:
        t = c.get('type')
        p = c.get('parameters') or []
        if t == 'wild_monster':
            out.append(obj({'t': js('wild')}))
        elif t == 'current_hp' and len(p) >= 2:
            out.append(obj({'t': js('hp'), 'op': js(p[0]), 'n': js(float(p[1]))}))
        elif t == 'status' and p:
            out.append(obj({'t': js('status'), 'id': js(p[0])}))
        elif t == 'has_status':
            out.append(obj({'t': js('anyStatus')}))
        elif t == 'can_evolve':
            out.append(obj({'t': js('canEvolve')}))
    return out


def ten_loai_tien_hoa(root, ten_anh):
    """Món nào mở đường tiến hoá cho loài nào — đọc thẳng db/monster của bản gốc."""
    d = os.path.join(root, 'mods/tuxemon/db/monster')
    ten = {}
    if not os.path.isdir(d):
        return {}
    for f in sorted(os.listdir(d)):
        if not f.endswith('.yaml'):
            continue
        y = yaml.safe_load(open(os.path.join(d, f), encoding='utf-8')) or {}
        for ev in y.get('evolutions') or []:
            it = ev.get('item')
            if not it:
                continue
            for x in (sorted(it) if isinstance(it, dict) else [it]):
                ten.setdefault(x, set()).add(ten_anh.get(y['slug']) or y['slug'])
    # Nhieu qua thi liet ke 3 con dau cho do dai dong
    out = {}
    for k, v in ten.items():
        ds = sorted(v)
        out[k] = ', '.join(ds[:3]) + ('...' if len(ds) > 3 else '')
    return out


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    root = sys.argv[1]
    db = os.path.join(root, 'mods/tuxemon/db/item')
    gfx = os.path.join(root, 'mods/tuxemon/gfx/items')
    if not os.path.isdir(db):
        raise SystemExit('Khong thay %s' % db)

    gia_goc = doc_gia(root)
    ten_anh = doc_ten_anh(root)
    capdev_cfg = doc_capdev(root)
    capdev = capdev_cfg.get('items') or {}
    tien_hoa = ten_loai_tien_hoa(root, ten_anh)

    os.makedirs('assets/items', exist_ok=True)
    for f in os.listdir('assets/items'):
        if f.endswith('.png'):
            os.remove(os.path.join('assets/items', f))

    rows, thieu_anh = [], []
    for f in sorted(os.listdir(db)):
        if not f.endswith('.yaml'):
            continue
        d = yaml.safe_load(open(os.path.join(db, f), encoding='utf-8')) or {}
        eff = [e for e in (d.get('effects') or []) if isinstance(e, dict)]
        if not eff or not (set(e['type'] for e in eff) & HIEU_UNG):
            continue
        # Bo mon hieu ung phu tro chua chay duoc (learn_tm, switch_type...)
        if any(e['type'] not in HIEU_UNG for e in eff):
            continue
        slug = d['slug']
        cat = d.get('category') or 'none'
        if cat not in NHOM:
            continue
        # Mon co hai am (bite_of_despair...) khong ban trong shop, bo qua
        if any(e['type'] == 'heal' and float((e.get('parameters') or ['0'])[0]) < 0
               for e in eff):
            continue

        # Duong dan anh nam ngay trong tep item (nhieu mon dung chung mot anh)
        if slug in ANH:
            src = os.path.join(gfx, ANH[slug] + '.png')
        else:
            src = os.path.join(root, 'mods/tuxemon', d.get('sprite') or '')
        if os.path.exists(src):
            # Icon goc 24x24 — man hinh dien thoai co 3 diem anh vat ly cho 1 diem
            # anh CSS nen phong 4 lan bang NEAREST cho khoi nhoe.
            im = Image.open(src).convert('RGBA')
            im.resize((im.width * 4, im.height * 4), Image.NEAREST).save(
                'assets/items/%s.png' % slug, optimize=True)
        else:
            thieu_anh.append(slug)

        # Mon nao ban goc khong ghi gia thi KHONG BAN trong shop (gia 0) — chi
        # nhat duoc qua nhiem vu/cot truyen. Tuxeball Co gap 99 lan ma bay ban
        # 1000 dong thi hong het do kho cua game.
        # Da tien hoa ban goc khong ghi gia (nhat trong the gioi) — game nay
        # chua rai duoc do khap ban do nen cho ban trong shop, khong thi ca
        # dong duong tien hoa thanh vo nghia.
        mac_dinh = 2000 if cat == 'morph' else 0
        mua, ban = gia_goc.get(slug, (d.get('cost') or mac_dinh,
                                      round((d.get('cost') or mac_dinh) * 0.5)))
        trong_tran = 'MainCombatMenuState' in (d.get('usable_in') or [])
        ngoai_tran = 'WorldState' in (d.get('usable_in') or [])
        rows.append((slug, obj({
            'name': js(TEN.get(slug) or ten_anh.get(slug) or slug),
            'desc': js(mo_ta(slug, cat, eff, capdev, tien_hoa)),
            'kind': js(NHOM[cat]),
            'price': js(int(mua)),
            'sell': js(int(ban)),
            'inBattle': js(bool(trong_tran)),
            'inWorld': js(bool(ngoai_tran)),
            'eff': '[%s]' % ', '.join(hieu_ung_js(slug, eff, d)),
            'cond': '[%s]' % ', '.join(dieu_kien_js(d.get('conditions'))),
        })))

    out = ['// TuxeWorld H5 | data/items.js | Vật phẩm — TỰ SINH TỪ tools/mkitems.py',
           '// Nguồn: Tuxemon (CC BY-SA 4.0). Đừng sửa tay.',
           '//',
           "// kind: 'ball' bắt | 'medicine' hồi phục | 'stone' tiến hoá |",
           "//       'food' món ăn | 'stat' rèn chỉ số | 'tea' cho EXP",
           "// eff:  hiệu ứng khi dùng, giữ đúng tên bên bản gốc (js/engine/useitem.js chạy)",
           "// cond: điều kiện dùng được, cũng lấy từ bản gốc",
           'export const ITEMS = {']
    for slug, body in rows:
        out.append('  %s: %s,' % (slug, body))
    out.append('};')
    out.append('''
export const itemIconPath = (id) => `assets/items/${id}.png`;
export const itemsOfKind = (kind) => Object.entries(ITEMS).filter(([, it]) => it.kind === kind);''')
    with open('js/data/items.js', 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(out) + '\n')

    with open('js/data/capdev.js', 'w', encoding='utf-8') as fh:
        viet_capdev(capdev_cfg, fh)

    print('OK: %d vật phẩm, %d loại tuxeball có hệ số riêng'
          % (len(rows), len([k for k in capdev if k != 'example'])))
    print('  (%d món lấy đúng giá trong db/economy)'
          % len([s for s, _ in rows if s in gia_goc]))
    if thieu_anh:
        print('THIẾU ẢNH:', ', '.join(thieu_anh))


if __name__ == '__main__':
    main()
