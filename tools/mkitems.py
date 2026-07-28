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
  learn_tm        dia chieu: day dung mot chieu
  learn_mm        dia he: boc mot chieu bat ky cua he do
  switch_type     qua doi he: doi han he cua con vat

Con lai (dien thoai, can cau, dich chuyen, nhiem vu) chua co he thong tuong ung
nen khong dua vao, dua vao chi lam day tui do.

Ma vat pham GIU NGUYEN slug cua Tuxemon de doi chieu cho de.
"""
import os
import re
import sys

import yaml
from PIL import Image

HIEU_UNG = {'capture', 'heal', 'restore', 'gain_xp', 'evolve',
            'statchange', 'change_stat', 'food_preference',
            'learn_tm', 'learn_mm', 'switch_type',
            'fishing', 'repellent', 'teleport_item', 'bivouac'}

# category cua ban goc -> nhom o trong tui do
NHOM = {
    'capture': 'ball',
    'potion': 'medicine',
    'morph': 'morph',
    'food': 'food',
    'stats': 'stat',
    'none': 'tea',
    'badge': 'badge',         # huy hieu vo duong
    'fish': 'fish',           # can cau
    'technique': 'tm',        # dia day chieu (TM/MM)
    'elements': 'element',    # qua doi he
}

# Do MANG THEO (behaviors.holdable ben ban goc). Ban goc co 12 mon holdable
# nhung 10 mon khong khai hieu ung gi (modifiers rong) — chi lay hai mon that
# su co tac dung trong ma nguon: xp_transmitter va xp_feeder.
MANG_THEO = {
    'xp_transmitter': ('Máy Truyền EXP', 4000,
                       'Con nào mang theo thì sau mỗi trận cả đội cùng nhận EXP: '
                       'một nửa cho con ra trận, một nửa chia đều cho những con còn lại.'),
}

# Bua ho menh: mon HOLDABLE khai immunity_to_status — cam theo la mien nhiem
# han trang thai do (horseshoe: 'all' = mien tat). Ten tieng Viet + gia dat tay
# vi ban goc khong ghi gia cho nhung mon nay.
# Mon tien ich ngoai tran ban goc khong ghi gia — dat tay
GIA_TIEN_ICH = {'fishing_rod': 3000, 'neptune': 12000, 'poseidon': 30000,
                'alpha_seep': 700}

BUA = {
    'antidote_grapes': ('Chùm Nho Giải Độc', 1800),
    'cure_festering': ('Thuốc Trị Mưng Mủ', 1800),
    'refreshing_slice': ('Lát Cam Mát Lạnh', 1800),
    'marble': ('Viên Bi', 1500),
    'feather': ('Chiếc Lông Vũ', 1500),
    'toy_bear': ('Gấu Bông', 2200),
    'flute': ('Cây Sáo', 2000),
    'horseshoe': ('Móng Ngựa May Mắn', 9000),
}

# Chi so: slug ban goc -> ten tieng Viet
CHI_SO = {'hp': 'HP', 'armour': 'Giáp', 'dodge': 'Né', 'melee': 'Cận chiến',
          'ranged': 'Tầm xa', 'speed': 'Tốc độ'}

# 13 he cua Tuxemon — giu khop voi TYPE_NAMES trong js/data/types.js
HE = {'cosmic': 'Vũ Trụ', 'earth': 'Đất', 'fire': 'Lửa', 'frost': 'Băng',
      'heroic': 'Anh Hùng', 'lightning': 'Điện', 'metal': 'Kim', 'normal': 'Thường',
      'shadow': 'Bóng Tối', 'sky': 'Bầu Trời', 'venom': 'Độc', 'water': 'Nước',
      'wood': 'Gỗ'}

VI_KHAU_VI = {
    'mild': 'nhạt', 'sweet': 'ngọt', 'soft': 'mềm', 'flakey': 'bở', 'dry': 'khô',
    'bland': 'lạt', 'peppy': 'hăng', 'salty': 'mặn', 'hearty': 'đậm',
    'zesty': 'thanh', 'refined': 'tinh', 'savory': 'bùi',
}

# Ten trang thai tieng Viet (chi de viet mo ta bua ho menh)
TEN_TRANG_THAI = {
    'poison': 'trúng độc', 'festering': 'mưng mủ', 'exhausted': 'kiệt sức',
    'stuck': 'kẹt cứng', 'grabbed': 'bị ghì', 'lifeleech': 'bị hút máu',
    'noddingoff': 'ngủ gật',
}

# Mon 'booster' cua ban goc gan voi mot he — mo ta bam theo dung ban goc
HE_BOOSTER = {'fire_booster': 'Lửa', 'water_booster': 'Nước', 'wood_booster': 'Gỗ',
              'earth_booster': 'Đất', 'metal_booster': 'Kim',
              'booster_tech': 'Kỹ Thuật'}

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

    # Ban goc goi la 'booster' (chat kich hoat bien hinh), khong phai 'stone'.
    'fire_booster': 'Tinh Chất Lửa', 'water_booster': 'Tinh Chất Nước',
    'wood_booster': 'Tinh Chất Gỗ', 'earth_booster': 'Tinh Chất Đất',
    'metal_booster': 'Tinh Chất Kim', 'booster_tech': 'Tinh Chất Kỹ Thuật',
    'flintstone': 'Đá Lửa', 'thunderstone': 'Đá Sấm', 'lucky_bamboo': 'Trúc May Mắn',
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

    'tm_acid': 'Đĩa Chiêu: Axit', 'tm_all_in': 'Đĩa Chiêu: Dốc Sức',
    'tm_avalanche': 'Đĩa Chiêu: Tuyết Lở', 'tm_blade': 'Đĩa Chiêu: Lưỡi Kiếm',
    'tm_blossom': 'Đĩa Chiêu: Trổ Hoa', 'tm_frostbite': 'Đĩa Chiêu: Buốt Giá',
    'tm_ice_shield': 'Đĩa Chiêu: Khiên Băng', 'tm_leaf_barrage': 'Đĩa Chiêu: Mưa Lá',
    'tm_panjandrum': 'Đĩa Chiêu: Bánh Xe Nổ', 'tm_shadow_boxing': 'Đĩa Chiêu: Quyền Bóng',
    'tm_solar_synthesis': 'Đĩa Chiêu: Quang Hợp', 'tm_supernova': 'Đĩa Chiêu: Siêu Tân Tinh',
    'tm_surf': 'Đĩa Chiêu: Lướt Sóng', 'tm_vorpal': 'Đĩa Chiêu: Chém Đứt',
    'mm_earth': 'Đĩa Hệ Đất', 'mm_fire': 'Đĩa Hệ Lửa', 'mm_metal': 'Đĩa Hệ Kim',
    'mm_water': 'Đĩa Hệ Nước', 'mm_wood': 'Đĩa Hệ Gỗ',

    'fishing_rod': 'Cần Câu', 'neptune': 'Cần Neptune', 'poseidon': 'Cần Poseidon',
    'alpha_seep': 'Bình Xịt Xua Đuổi', 'escape_key': 'Chìa Khoá Thoát Hiểm',
    'bivouac': 'Lều Trại',

    'shaft_badge': 'Huy Hiệu Hầm Mỏ', 'scoop_badge': 'Huy Hiệu Kem',
    'omnichannel_badge': 'Huy Hiệu Thương Trường', 'greenwash_badge': 'Huy Hiệu Xanh',
    'nimrod_badge': 'Huy Hiệu Thợ Săn',

    'cosmic_berry': 'Quả Vũ Trụ', 'earth_berry': 'Quả Đất', 'fire_berry': 'Quả Lửa',
    'frost_berry': 'Quả Băng', 'heroic_berry': 'Quả Anh Hùng',
    'lightning_berry': 'Quả Điện', 'metal_berry': 'Quả Kim', 'normal_berry': 'Quả Thường',
    'shadow_berry': 'Quả Bóng Tối', 'sky_berry': 'Quả Bầu Trời', 'venom_berry': 'Quả Độc',
    'water_berry': 'Quả Nước', 'wood_berry': 'Quả Gỗ',
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

    if cat == 'badge':
        return 'Vật chứng thắng một võ đường. Giữ đủ huy hiệu mới đi tiếp được.'

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
            # Ban goc xep nhom nay la 'morph' va mo ta la "morph ... into a
            # different form" — khong phai da tien hoa kieu Pokemon.
            he = HE_BOOSTER.get(slug)
            if he:
                phan.append('Cho Tuxemon hệ %s biến sang một hình thái khác.' % he)
            else:
                ten = tien_hoa.get(slug)
                phan.append('Giúp %s biến sang hình thái mới.'
                            % (ten or 'vài loài nhất định'))
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
        elif t == 'learn_tm':
            phan.append('Dạy chiêu %s cho một Tuxemon bất kỳ, không cần đủ cấp.'
                        % CHIEU.get(p[0], (p[0], ''))[0])
        elif t == 'learn_mm':
            phan.append('Dạy một chiêu hệ %s bốc ngẫu nhiên — chỉ dùng được cho '
                        'Tuxemon đúng hệ đó.' % HE.get(p[0], p[0]))
        elif t == 'switch_type':
            phan.append('Đổi hẳn hệ của Tuxemon sang hệ %s.' % HE.get(p[0], p[0]))
        elif t == 'fishing':
            c = CAU.get(slug) or {}
            lo, hi = (c.get('level_bounds') or [1, 10])[:2]
            phan.append('Đứng trước mặt nước rồi thả câu. Tỉ lệ cắn câu %d%%, '
                        'cá lên cấp %d-%d. Thả được %d lần thì gãy.'
                        % (round(float(c.get('trigger', 0)) * 100), lo, hi,
                           DO_BEN_CAN.get(slug, 20)))
        elif t == 'repellent':
            phan.append('Xịt xong thì %s bước tiếp theo không gặp Tuxemon hoang nào.'
                        % (p[0] if p else '100'))
        elif t == 'teleport_item':
            phan.append('Dùng là về thẳng chỗ nghỉ gần nhất, khỏi lội ngược đường.')
        elif t == 'bivouac':
            phan.append('Dựng trại nghỉ giữa đường: cả đội hồi đầy máu và gỡ sạch trạng thái.')
    return ' '.join(phan) or 'Vật phẩm của thế giới Tuxemon.'


# Bang chieu game dang co: {slug: (ten, [he])}. Doc thang js/data/moves.js nen
# PHAI chay mkitems.py SAU mktuxemon.py. Dia day chieu ma chieu do khong co
# trong game thi bo qua, khong nem vao tui do mot mon bam khong an gi.
CHIEU = {}

# Cau hinh cau ca doc tu mods/fishing.yaml cua ban goc (nap trong main)
CAU = {}


# So lan tha cau moi can chiu duoc truoc khi gay. Ban goc khong tieu hao can,
# nhung cau vo han thi cau kho het y nghia — can cang dat cang ben.
DO_BEN_CAN = {'fishing_rod': 20, 'neptune': 40, 'poseidon': 80}


# Ten tieng Viet cho tung cua hang trong db/economy
TEN_TIEM = {
    'tuxe_mart_taba': 'Tuxemart Taba',
    'cotton_scoop': 'Tiệm Tạp Hoá Bông', 'spyder_cotton_scoop': 'Tiệm Tạp Hoá Bông',
    'spyder_cotton_tech': 'Tiệm Kỹ Thuật Bông',
    'leather_scoop': 'Tiệm Tạp Hoá Da', 'spyder_leather_scoop': 'Tiệm Tạp Hoá Da',
    'spyder_flower_scoop': 'Tiệm Tạp Hoá Hoa',
    'spyder_flower_petshop': 'Tiệm Thú Cưng Hoa',
    'spyder_timber_scoop': 'Tiệm Tạp Hoá Gỗ',
    'spyder_paper_scoop': 'Tiệm Tạp Hoá Giấy',
    'spyder_candy_scoop': 'Tiệm Tạp Hoá Kẹo',
    'spyder_candy_tech': 'Tiệm Kỹ Thuật Kẹo',
}


def viet_shops(root, co_mon):
    """db/economy -> js/data/shops.js. co_mon = tap ma vat pham game dang co."""
    import glob as _glob
    import json as _json
    rows = []
    for f in sorted(_glob.glob(os.path.join(root, 'mods/tuxemon/db/economy/*.yaml'))):
        d = yaml.safe_load(open(f, encoding='utf-8')) or {}
        for e in (d if isinstance(d, list) else [d]):
            if not isinstance(e, dict) or not e.get('slug'):
                continue
            its = []
            for it in (e.get('items') or []):
                if it.get('slug') not in co_mon:
                    continue
                row = {'id': it['slug'], 'price': int(it['price'])}
                # inventory > 0 = hang co han, ban het la thoi
                if it.get('inventory') and int(it['inventory']) > 0:
                    row['stock'] = int(it['inventory'])
                its.append(row)
            if not its:
                continue
            rows.append((e['slug'], {
                'name': TEN_TIEM.get(e['slug'], e['slug']),
                'sell': round(float(e.get('resale_multiplier') or 0.5), 2),
                'items': its,
            }))
    out = ['// TuxeWorld H5 | data/shops.js | Cửa hàng trên bản đồ — TỰ SINH TỪ tools/mkitems.py',
           '// Nguồn: db/economy của Tuxemon (CC BY-SA 4.0). Đừng sửa tay.',
           '// Mỗi thị trấn một gian hàng riêng, càng đi xa hàng càng xịn.',
           '// stock = số lượng có hạn (bán hết là thôi), sell = hệ số bán lại.', '',
           'export const SHOPS = {']
    for slug, r in rows:
        out.append('  %s: %s,' % (_json.dumps(slug), _json.dumps(r, ensure_ascii=False)))
    out.append('};')
    out.append('')
    out.append('export const shopName = (id) => SHOPS[id]?.name || \'Cửa hàng\';')
    open('js/data/shops.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    return rows


def viet_fishing(root):
    """mods/fishing.yaml -> js/data/fishing.js. Tra ve so can cau."""
    import json as _json
    p_yaml = os.path.join(root, 'mods/fishing.yaml')
    if not os.path.exists(p_yaml):
        return {}
    cfg = yaml.safe_load(open(p_yaml, encoding='utf-8')) or {}
    out = ['// TuxeWorld H5 | data/fishing.js | Cấu hình câu cá — TỰ SINH TỪ tools/mkitems.py',
           '// Nguồn: mods/fishing.yaml của Tuxemon (CC BY-SA 4.0). Đừng sửa tay.',
           '// trigger = tỉ lệ cắn câu · lv = khoảng cấp · stages/shapes = lọc loài theo',
           '// bậc tiến hoá và dáng thân, w = trọng số bốc dáng thân,',
           '// uses = thả được bao nhiêu lần thì cần gãy.', '',
           'export const FISHING = {']
    for slug, c in cfg.items():
        lo, hi = (c.get('level_bounds') or [1, 10])[:2]
        row = {
            'name': TEN.get(slug, slug),
            'trigger': round(float(c.get('trigger') or 0), 2),
            'lv': [int(lo), int(hi)],
            'stages': list(c.get('stages') or []),
            'shapes': list(c.get('shapes') or []),
            'w': {k: round(float(v), 2) for k, v in (c.get('shape_weights') or {}).items()},
            'uses': DO_BEN_CAN.get(slug, 20),
            'env': (c.get('environment') or {}).get('default', 'ocean'),
            'envNight': (c.get('environment') or {}).get('night', 'night_ocean'),
        }
        out.append('  %s: %s,' % (_json.dumps(slug), _json.dumps(row, ensure_ascii=False)))
    out.append('};')
    out.append('')
    out.append('export const isRod = (id) => Object.prototype.hasOwnProperty.call(FISHING, id);')
    open('js/data/fishing.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    return cfg


def doc_chieu():
    p = 'js/data/moves.js'
    if not os.path.exists(p):
        return {}
    out = {}
    for m in re.finditer(r'^  "([a-z_0-9]+)": \{ name: "([^"]*)", types: \[([^\]]*)\]',
                         open(p, encoding='utf-8').read(), re.M):
        out[m.group(1)] = (m.group(2), re.findall(r'"(\w+)"', m.group(3)))
    return out


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
        elif t == 'learn_tm':
            out.append(obj({'t': js('learnMove'), 'id': js(p[0])}))
        elif t == 'learn_mm':
            out.append(obj({'t': js('learnRandom'), 'el': js(p[0])}))
        elif t == 'switch_type':
            out.append(obj({'t': js('switchType'), 'el': js(p[0])}))
        elif t == 'fishing':
            out.append(obj({'t': js('fishing')}))
        elif t == 'repellent':
            out.append(obj({'t': js('repellent'), 'n': js(int(float(p[0]))) if p else js(100)}))
        elif t == 'teleport_item':
            # 'center' = ve dung cho hoi sinh khi ca doi guc
            out.append(obj({'t': js('teleport'), 'to': js(p[0] if p else 'center')}))
        elif t == 'bivouac':
            out.append(obj({'t': js('camp')}))
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
        elif t == 'facing_tile' and p and p[0] in ('surfable', 'swimmable'):
            out.append(obj({'t': js('water')}))
        elif t == 'has_tech' and p:
            # dia day chieu: chi dung duoc khi con do CHUA biet chieu ay
            out.append(obj({'t': js('hasTech'), 'id': js(p[0]),
                            'no': js(c.get('operator') == 'not')}))
        elif t == 'base' and len(p) >= 2 and p[0] == 'types':
            # dia MM doi he: doi con phai (hoac phai khong) mang he do
            out.append(obj({'t': js('type'), 'el': js(p[1]),
                            'no': js(c.get('operator') == 'not')}))
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

    global CHIEU, CAU
    CHIEU = doc_chieu()
    CAU = viet_fishing(root)
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
        holdable = bool((d.get('behaviors') or {}).get('holdable'))
        mang_theo = d['slug'] in MANG_THEO and holdable
        # Bua ho menh: mon cam theo de chan han mot trang thai
        bua = d['slug'] in BUA and holdable and d.get('immunity_to_status')
        # Huy hieu vo duong khong co hieu ung gi — no la vat chung minh da thang,
        # giu lai de lay ten + icon that cua Tuxemon thay cho huy hieu tu che.
        huy_hieu = (d.get('category') or '') == 'badge'
        if not mang_theo and not huy_hieu and not bua:
            if not eff or not (set(e['type'] for e in eff) & HIEU_UNG):
                continue
            # Bo mon hieu ung phu tro chua chay duoc (learn_tm, switch_type...)
            if any(e['type'] not in HIEU_UNG for e in eff):
                continue
        slug = d['slug']
        # Dia day chieu ma chieu do khong nam trong 257 chieu game dang co
        # (tm_scope, tm_ubuntu...) thi bo — ban ra chi de nguoi choi bam hut.
        day = [e for e in eff if e['type'] == 'learn_tm']
        if day and (day[0].get('parameters') or [''])[0] not in CHIEU:
            continue
        cat = d.get('category') or 'none'
        mang = mang_theo or bool(bua)
        if cat not in NHOM and not mang:
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
        if mang_theo:
            mac_dinh = MANG_THEO[slug][1]
        elif bua:
            mac_dinh = BUA[slug][1]
        elif slug in GIA_TIEN_ICH:
            mac_dinh = GIA_TIEN_ICH[slug]
        mua, ban = gia_goc.get(slug, (d.get('cost') or mac_dinh,
                                      round((d.get('cost') or mac_dinh) * 0.5)))
        trong_tran = 'MainCombatMenuState' in (d.get('usable_in') or [])
        ngoai_tran = 'WorldState' in (d.get('usable_in') or [])
        if huy_hieu:
            # Huy hieu khong "dung" duoc, khong ban duoc — chi de trung bay
            trong_tran = ngoai_tran = False
            eff = []
            d = dict(d, conditions=[])
        chan = list(d.get('immunity_to_status') or []) if bua else []
        if mang_theo:
            ten, mo = MANG_THEO[slug][0], MANG_THEO[slug][2]
        elif bua:
            ten = BUA[slug][0]
            mo = ('Cầm theo thì miễn nhiễm mọi trạng thái xấu.' if 'all' in chan
                  else 'Cầm theo thì không bao giờ dính %s.'
                  % ' / '.join(TEN_TRANG_THAI.get(x, x) for x in chan))
        else:
            ten, mo = (TEN.get(slug) or ten_anh.get(slug) or slug), mo_ta(slug, cat, eff, capdev, tien_hoa)
        row = {
            'name': js(ten),
            'desc': js(mo),
            # Mon tien ich xep rieng mot o, khong lan vao o "Tra"
            'kind': js('held' if mang else
                       ('tool' if any(e['type'] in ('repellent', 'teleport_item', 'bivouac')
                                      for e in eff) else NHOM[cat])),
            'price': js(int(mua)),
            'sell': js(int(ban)),
            'inBattle': js(bool(trong_tran) and not mang),
            'inWorld': js(bool(ngoai_tran) and not mang),
            'held': js(bool(mang)),
            'eff': '[%s]' % ', '.join(hieu_ung_js(slug, eff, d) if not mang else []),
            'cond': '[%s]' % ', '.join(dieu_kien_js(d.get('conditions'))),
        }
        if chan:
            row['immuneTo'] = js(chan)
        rows.append((slug, obj(row)))

    out = ['// TuxeWorld H5 | data/items.js | Vật phẩm — TỰ SINH TỪ tools/mkitems.py',
           '// Nguồn: Tuxemon (CC BY-SA 4.0). Đừng sửa tay.',
           '//',
           "// kind: 'ball' bắt | 'medicine' hồi phục | 'morph' biến hình |",
           "//       'food' món ăn | 'stat' rèn chỉ số | 'tea' cho EXP | 'held' mang theo",
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

    tiem = viet_shops(root, {sl for sl, _ in rows})
    print('OK: %d cần câu có cấu hình riêng' % len(CAU))
    print('OK: %d gian hàng trong db/economy' % len(tiem))
    print('OK: %d vật phẩm, %d loại tuxeball có hệ số riêng'
          % (len(rows), len([k for k in capdev if k != 'example'])))
    print('  (%d món lấy đúng giá trong db/economy)'
          % len([s for s, _ in rows if s in gia_goc]))
    if thieu_anh:
        print('THIẾU ẢNH:', ', '.join(thieu_anh))


if __name__ == '__main__':
    main()
