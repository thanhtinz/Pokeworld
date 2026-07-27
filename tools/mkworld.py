# -*- coding: utf-8 -*-
"""Ghep sinh vat Tuxemon vao the gioi cua PokeWorld.

Chay:  python3 tools/mkworld.py <duong-dan-kho-Tuxemon>
Phai chay SAU tools/mktuxemon.py vi can js/data/species.js da sinh xong.

Cong cu ghi de:
  js/data/zones.js     bang gap sinh vat cua tung khu vuc
  js/data/trainers.js  doi hinh cua tung huan luyen vien
  js/data/starters.js  ba con khoi dau

Cach ghep: moi khu vuc co mot bo "terrain" cua Tuxemon di kem. Con nao
Tuxemon ghi la song o dia hinh do thi moi duoc dua vao bang gap cua khu vuc
do — khong boc dai con nao. Trong tung khu vuc, con bac 'basic'/'standalone'
la thuong gap, con da tien hoa thi hiem va cap cao hon.

MOI CON CHI THUOC MOT KHU VUC DUY NHAT (tru vai con hiem co chu y), de moi
khu vuc co danh sach rieng chu khong lap lai nhau.
"""
import os
import re
import sys
import json
import yaml

# Khu vuc -> dia hinh Tuxemon tuong ung + khoang cap
ZONE_TERRAIN = {
    'route_1':  (['grassland'], 2, 6),
    'forest_1': (['woodland', 'jungle'], 4, 9),
    'route_2':  (['grassland', 'urban'], 5, 11),
    'cave_1':   (['underground', 'ruins'], 7, 13),
    'lake_1':   (['freshwater', 'swamp'], 6, 12),
    'route_3':  (['desert'], 9, 15),
    'meadow_1': (['jungle', 'grassland'], 11, 17),
    'beach_1':  (['coastal', 'sea'], 13, 19),
    'cave_2':   (['mountains', 'underground'], 15, 22),
}
# Vai con hiem duoc phep xuat hien them o khu vuc khac
EXTRAPLANAR_ZONE = 'cave_2'


def load(p):
    with open(p, encoding='utf-8') as f:
        return yaml.safe_load(f)


def read_species():
    """Doc lai js/data/species.js da sinh de biet id, slug, he, bac."""
    src = open('js/data/species.js', encoding='utf-8').read()
    out = {}
    for m in re.finditer(
            r'^  (\d+): \{ name: "([^"]+)", slug: "([^"]+)", types: (\[[^\]]*\]),', src, re.M):
        i, name, slug, types = int(m.group(1)), m.group(2), m.group(3), json.loads(m.group(4))
        out[slug] = {'id': i, 'name': name, 'types': types}
    for m in re.finditer(r'^  (\d+): \{ name: .*?\n.*?\n.*?\n.*?stage: "(\w+)" \},', src, re.M | re.S):
        pass
    # bac tien hoa doc rieng cho chac
    for m in re.finditer(r'slug: "([^"]+)".*?stage: "(\w+)" \}', src, re.S):
        if m.group(1) in out:
            out[m.group(1)]['stage'] = m.group(2)
    return out


def js(v):
    return json.dumps(v, ensure_ascii=False)


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    root = sys.argv[1]
    db = os.path.join(root, 'mods/tuxemon/db/monster')
    sp = read_species()

    mons = []
    for f in sorted(os.listdir(db)):
        d = load(os.path.join(db, f))
        if not d or d.get('slug') not in sp:
            continue
        info = sp[d['slug']]
        mons.append({
            'slug': d['slug'], 'id': info['id'], 'name': info['name'],
            'types': info['types'], 'stage': info.get('stage', 'basic'),
            'terrains': d.get('terrains') or [], 'catch': d.get('catch_rate', 100),
        })

    # ==== Chia con theo khu vuc, moi con chi vao MOT khu ====
    taken = set()
    zone_pool = {}
    for zid, (terrains, lo, hi) in ZONE_TERRAIN.items():
        pool = [m for m in mons
                if m['slug'] not in taken and any(t in m['terrains'] for t in terrains)]
        # uu tien con bac thap cho khu vuc dau, con manh cho khu vuc sau
        pool.sort(key=lambda m: (STAGE_ORDER.get(m['stage'], 1), m['slug']))
        chosen = pool[:7]
        for m in chosen:
            taken.add(m['slug'])
        zone_pool[zid] = (chosen, lo, hi)

    write_zones(zone_pool)
    write_starters(mons)
    n = write_trainers(zone_pool, mons)
    print('OK: %d khu vực, %d huấn luyện viên, %d con đã xếp chỗ'
          % (len(zone_pool), n, len(taken)))


STAGE_ORDER = {'basic': 0, 'standalone': 1, 'stage1': 2, 'stage2': 3}


# ==================== Khu vuc ====================
ZONE_META = {
    'town_1':  ('Thị Trấn Khởi Đầu', 'town', None, 'town_map',
                'Nơi hành trình bắt đầu. Có trung tâm hồi phục, cửa hàng và võ đường đầu tiên.',
                ['route_1']),
    'route_1': ('Đường Số 1', 'route', None, None,
                'Đồng cỏ phía bắc thị trấn, đầy sinh vật hoang cấp thấp.',
                ['town_1', 'forest_1', 'route_2']),
    'forest_1': ('Rừng Xanh Thẳm', 'forest', None, None,
                 'Khu rừng rậm rạp, tán cây che kín mặt trời.',
                 ['route_1']),
    'route_2': ('Đường Số 2', 'route', None, None,
                'Đường mòn dẫn tới hang núi và hồ nước.',
                ['route_1', 'cave_1', 'lake_1']),
    'cave_1':  ('Hang Đá', 'cave', None, None,
                'Hang động tối tăm, lãnh địa của những sinh vật sống dưới lòng đất.',
                ['route_2', 'cave_2']),
    'lake_1':  ('Hồ Gương Trời', 'lake', None, None,
                'Hồ nước trong vắt, nơi đặt võ đường hệ Nước.',
                ['route_2', 'route_3']),
    'route_3': ('Đường Số 3', 'route', None, None,
                'Con đường cát nóng phía nam hồ.',
                ['lake_1', 'meadow_1', 'town_2']),
    'meadow_1': ('Đồng Hoa Nắng', 'meadow', None, None,
                 'Cánh đồng hoa nở quanh năm, sinh vật hệ Gỗ tụ về rất đông.',
                 ['route_3']),
    'town_2':  ('Làng Ven Núi', 'town', None, 'town_map',
                'Ngôi làng nhỏ kẹp giữa núi và biển.',
                ['route_3', 'beach_1']),
    'beach_1': ('Bãi Biển Hoàng Hôn', 'beach', None, None,
                'Bãi cát trải dài dưới nắng chiều, sóng vỗ suốt ngày đêm.',
                ['town_2']),
    'cave_2':  ('Hang Sâu Thẳm', 'cave', None, None,
                'Mê cung đá sâu trong lòng núi, tối đến mức không thấy lối ra.',
                ['cave_1']),
}
ZONE_TRAINERS = {
    'town_1': ['gym_brock'], 'route_1': ['youngster_minh', 'lass_lan'],
    'forest_1': ['bugcatcher_tung'], 'route_2': [], 'cave_1': ['hiker_dung'],
    'lake_1': ['gym_thuy'], 'route_3': ['camper_route3', 'sailor_route3'],
    'meadow_1': ['lass_rainbow'], 'town_2': ['rocket_grunt_3'],
    'beach_1': ['swimmer_light'], 'cave_2': ['camper_victory', 'channeler_unknown'],
}


def write_zones(zone_pool):
    out = ["// PokeWorld H5 | data/zones.js | Khu vực: bảng gặp sinh vật, huấn luyện viên, lối đi",
           '// Bảng gặp TỰ SINH TỪ tools/mkworld.py theo địa hình của Tuxemon — đừng sửa tay phần encounters.', '',
           "// kind: 'town' | 'route' | 'forest' | 'cave' | 'lake' | 'meadow' | 'beach'",
           'export const ZONES = {']
    for zid, (name, kind, icon_sp, icon_item, desc, nxt) in ZONE_META.items():
        pool, lo, hi = zone_pool.get(zid, ([], 1, 5))
        out.append('  %s: {' % zid)
        icon_sp_txt = str(pool[0]['id']) if pool else 'null'
        out.append('    name: %s, kind: %s, icon: %s, iconSp: %s, iconItem: %s,'
                   % (js(name), js(kind), js(kind), icon_sp_txt, js(icon_item) if icon_item else 'null'))
        out.append('    desc: %s,' % js(desc))
        if pool:
            out.append('    encounters: [')
            # con bac thap gap nhieu, con da tien hoa hiem
            for k, m in enumerate(pool):
                stage = m['stage']
                w = 30 if stage in ('basic', 'standalone') else 8 if stage == 'stage1' else 3
                span = hi - lo
                mlo = lo + (2 if stage == 'stage1' else 4 if stage == 'stage2' else 0)
                mhi = hi + (3 if stage == 'stage1' else 6 if stage == 'stage2' else 0)
                out.append('      { sp: %d, w: %d, min: %d, max: %d },   // %s (%s)'
                           % (m['id'], w, mlo, mhi, m['name'], stage))
            out.append('    ],')
        else:
            out.append('    encounters: [],')
        out.append('    trainers: %s,' % js(ZONE_TRAINERS.get(zid, [])))
        out.append('    next: %s,' % js(nxt))
        out.append('  },')
    out.append('};')
    out.append('''
// Random 1 encounter theo trọng số trong zone (null nếu zone không có spawn)
export function rollEncounter(zoneId, rng = Math.random) {
  const zone = ZONES[zoneId];
  if (!zone || !zone.encounters.length) return null;
  const total = zone.encounters.reduce((s, e) => s + e.w, 0);
  let r = rng() * total;
  for (const e of zone.encounters) {
    r -= e.w;
    if (r < 0) {
      const lv = e.min + Math.floor(rng() * (e.max - e.min + 1));
      return { sp: e.sp, lv };
    }
  }
  return null;
}''')
    open('js/data/zones.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')


# ==================== Starter ====================
# Ba con khoi dau: bac 'basic', ba he khac nhau, deu co duong tien hoa.
STARTER_TYPES = ['wood', 'fire', 'water']


def write_starters(mons):
    evo = set()
    src = open('js/data/evolutions.js', encoding='utf-8').read()
    for m in re.finditer(r'^  (\d+): \{ into:', src, re.M):
        evo.add(int(m.group(1)))
    picks = []
    for want in STARTER_TYPES:
        cand = [m for m in mons
                if m['stage'] == 'basic' and m['types'] and m['types'][0] == want and m['id'] in evo]
        cand.sort(key=lambda m: m['slug'])
        if cand:
            picks.append(cand[0])
    out = ["// PokeWorld H5 | data/starters.js | Ba sinh vật khởi đầu — TỰ SINH TỪ tools/mkworld.py",
           '// Đều là bậc cơ bản, ba hệ khác nhau và đều có đường tiến hoá.', '',
           'export const STARTERS = [']
    for m in picks:
        out.append('  { sp: %d, name: %s, type: %s },' % (m['id'], js(m['name']), js(m['types'][0])))
    out.append('];')
    open('js/data/starters.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')


# ==================== Huan luyen vien ====================
TRAINERS_META = [
    # (id, sprite, ten, kind, zone, so con, thuong, intro, lose, badge, badgeName)
    ('youngster_minh', 'youngster', 'Nam Nhóc Tì', 'trainer', 'route_1', 2, 200,
     'Ê bạn! Mình mới bắt được sinh vật đầu tiên, đấu thử một trận nhé!',
     'Ôi thua rồi... nhưng mình sẽ mạnh lên!', None, None),
    ('lass_lan', 'lass', 'Bé Lan', 'trainer', 'route_1', 2, 240,
     'Trông dễ thương thôi chứ đánh không hiền đâu nha!',
     'Hức... bạn giỏi thật đấy.', None, None),
    ('bugcatcher_tung', 'bug_catcher', 'Tùng Bắt Bọ', 'trainer', 'forest_1', 3, 320,
     'Rừng này là sân nhà của tớ!', 'Sao lại thua ở chính khu rừng của mình...', None, None),
    ('hiker_dung', 'camper', 'Dũng Leo Núi', 'trainer', 'cave_1', 3, 420,
     'Trong hang tối nhưng ta thuộc từng ngóc ngách!', 'Đường hang khó vậy mà cậu vẫn thắng.', None, None),
    ('camper_route3', 'camper_f', 'Liêm Cắm Trại', 'trainer', 'route_3', 3, 520,
     'Cắm trại giữa sa mạc mới đã!', 'Nắng quá nên mình mất tập trung...', None, None),
    ('sailor_route3', 'swimmer_f', 'Thuỷ Thủ Marina', 'trainer', 'route_3', 3, 560,
     'Tớ vừa lên bờ nghỉ chút, đấu một trận nhé!', 'Trên cạn tớ đúng là kém hơn thật.', None, None),
    ('lass_rainbow', 'picnicker', 'Hạnh Dã Ngoại', 'trainer', 'meadow_1', 4, 700,
     'Đi picnic mà gặp đối thủ, vui quá!', 'Thua rồi nhưng hôm nay vẫn vui.', None, None),
    ('rocket_grunt_3', 'rocket_m', 'Kẻ Áo Đen', 'rocket', 'town_2', 4, 900,
     'Ngôi làng này sắp thuộc về bọn ta!', 'Bọn ta sẽ còn quay lại...', None, None),
    ('swimmer_light', 'swimmer_m', 'Douglas Bơi Lội', 'trainer', 'beach_1', 4, 1000,
     'Dưới nước tớ là số một!', 'Lên bờ rồi tớ đuối thật.', None, None),
    ('camper_victory', 'hiker', 'Marcos Trèo Non', 'trainer', 'cave_2', 5, 1400,
     'Leo núi cả đời, chưa sợ ai bao giờ!', 'Cậu khoẻ hơn ta tưởng.', None, None),
    ('channeler_unknown', 'scientist', 'Nhà Nghiên Cứu Mio', 'trainer', 'cave_2', 5, 1500,
     'Tôi đang đo địa chấn, đừng làm phiền!', 'Số liệu của tôi sai ở đâu đó rồi...', None, None),
    ('gym_brock', 'brock', 'Thạch — Võ Đường Đất', 'gym', 'town_1', 3, 1200,
     'Ta là chủ võ đường đầu tiên. Cho ta xem cậu tiến bộ tới đâu!',
     'Cậu xứng đáng với huy hiệu này.', 'badge_boulder', 'Huy Hiệu Đá'),
    ('gym_thuy', 'misty', 'Thuỷ — Võ Đường Nước', 'gym', 'lake_1', 4, 2000,
     'Nước mềm nhưng bào mòn được cả đá đấy!',
     'Được lắm, huy hiệu là của cậu.', 'badge_cascade', 'Huy Hiệu Thác'),
]


def write_trainers(zone_pool, mons):
    by_id = {m['id']: m for m in mons}
    out = ["// PokeWorld H5 | data/trainers.js | Huấn luyện viên — TỰ SINH TỪ tools/mkworld.py",
           '// Đội hình lấy từ chính bảng gặp của khu vực họ đứng, nên đánh ở đâu gặp sinh vật vùng đó.', '',
           "// kind: 'trainer' | 'gym' | 'rocket'",
           'export const TRAINERS = {']
    for (tid, sprite, name, kind, zone, n, money, intro, lose, badge, badge_name) in TRAINERS_META:
        pool, lo, hi = zone_pool.get(zone, ([], 3, 8))
        if not pool:
            # thi tran khong co bang gap -> lay tu khu vuc ke ben
            pool, lo, hi = zone_pool.get('route_1', ([], 3, 8))
        # gym manh hon: lay con bac cao nhat trong vung
        ranked = sorted(pool, key=lambda m: -STAGE_ORDER.get(m['stage'], 0))
        party = (ranked if kind == 'gym' else pool)[:n]
        lv_base = hi + (3 if kind == 'gym' else 1)
        out.append('  %s: {' % tid)
        out.append('    sprite: %s, name: %s, kind: %s, zone: %s,' % (js(sprite), js(name), js(kind), js(zone)))
        out.append('    party: [%s],' % ', '.join(
            '{ sp: %d, lv: %d }' % (m['id'], lv_base + i) for i, m in enumerate(party)))
        out.append('    rewardMoney: %d,' % money)
        out.append('    intro: %s,' % js(intro))
        out.append('    lose: %s,' % js(lose))
        if badge:
            out.append('    badge: %s, badgeName: %s,' % (js(badge), js(badge_name)))
        out.append('  },')
    out.append('};')
    open('js/data/trainers.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    return len(TRAINERS_META)


if __name__ == '__main__':
    main()
