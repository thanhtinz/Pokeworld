# -*- coding: utf-8 -*-
"""Ghep sinh vat Tuxemon vao the gioi cua TuxeWorld.

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
# Khu vuc = ID ban do do tools/mktmx.py sinh ra. Chi nhung ban do NGOAI TROI
# moi co bang gap; nha va cua hang thi khong.
# Khu vuc di bo duoc ngoai troi -> (dia hinh cua Tuxemon, cap thap, cap cao).
# Dia hinh lay tu truong 'terrains' trong db/monster nen con nao song o dau thi
# gap o do. Thu tu tu de den kho theo duong di trong game.
ZONE_TERRAIN = {
    'route1':            (['grassland'], 2, 7),
    'dryadsgrove':       (['woodland', 'jungle'], 5, 11),
    'route1_sanglorian': (['grassland', 'urban'], 6, 12),
    'route2':            (['woodland', 'grassland'], 8, 14),
    'cotton_town':       (['urban'], 8, 14),
    'citypark':          (['urban', 'grassland'], 10, 16),
    'route3':            (['mountains', 'woodland'], 13, 20),
    'leather_town':      (['desert', 'ruins'], 11, 18),
    'leather_shaft1':    (['underground'], 15, 22),
    'leather_shaft2':    (['underground', 'ruins'], 17, 24),
    'flower_city':       (['coastal', 'freshwater'], 19, 26),
    'taba_ba_passageway_1': (['extraplanar'], 21, 28),
    'taba_ba_passageway_2': (['swamp', 'boreal_snow'], 23, 30),
    'taba_ba_passageway_3': (['sea', 'coastal'], 25, 32),
}
# Vai con hiem duoc phep xuat hien them o khu vuc khac
EXTRAPLANAR_ZONE = 'cave_2'


def load(p):
    with open(p, encoding='utf-8') as f:
        return yaml.safe_load(f)


def khoi(src, mo_dau):
    """Cat tep .js da sinh thanh tung khoi mot muc.

    Truoc day cho nay dung regex DOTALL quet ca tep — them mot dong vao species.js
    la Python quay lui vo tan, chay may phut khong xong. Cat theo moc dong dau
    thi bao nhieu dong cung khong sao.
    """
    moc = [(m.start(), m.group(1)) for m in re.finditer(mo_dau, src, re.M)]
    for i, (vt, key) in enumerate(moc):
        het = moc[i + 1][0] if i + 1 < len(moc) else len(src)
        yield key, src[vt:het]


def read_species():
    """Doc lai js/data/species.js da sinh de biet id, slug, he, bac."""
    src = open('js/data/species.js', encoding='utf-8').read()
    out = {}
    for sid, than in khoi(src, r'^  (\d+): \{'):
        m = re.search(r'slug: "([^"]+)"', than)
        t = re.search(r'types: (\[[^\]]*\])', than)
        ten = re.search(r'name: "([^"]+)"', than)
        if not (m and t and ten):
            continue
        d2 = {'id': int(sid), 'name': ten.group(1), 'types': json.loads(t.group(1))}
        st = re.search(r'stage: "(\w+)"', than)
        if st:
            d2['stage'] = st.group(1)
        if 'glitched: true' in than:
            d2['glitched'] = True
        out[m.group(1)] = d2
    return out


def js(v):
    return json.dumps(v, ensure_ascii=False)


def read_maps():
    """Doc lai js/data/maps.js: ten + cong dich chuyen cua tung ban do."""
    src = open('js/data/maps.js', encoding='utf-8').read()
    out = {}
    for slug, than in khoi(src, r'^  ([a-z_0-9]+): \{$'):
        ten = re.search(r'name: "([^"]+)"', than)
        out[slug] = {'name': ten.group(1) if ten else slug, 'next': set()}
    for slug, than in khoi(src, r'^  ([a-z_0-9]+): \{$'):
        for t in re.findall(r'"to":\s*"([a-z_0-9]+)"', than):
            if t in out and t != slug:
                out[slug]['next'].add(t)
    return out


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
        if sp[d['slug']].get('glitched'):
            continue          # con "glitched" khong ra ngoai tu nhien
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

    write_zones(zone_pool, read_maps())
    write_starters(mons)
    n = write_trainers(zone_pool, mons)
    print('OK: %d khu vực, %d huấn luyện viên, %d con đã xếp chỗ'
          % (len(zone_pool), n, len(taken)))


STAGE_ORDER = {'basic': 0, 'standalone': 1, 'stage1': 2, 'stage2': 3}


# ==================== Khu vuc ====================
DESC = {
    'taba_town': 'Thị trấn quê nhà, nơi hành trình bắt đầu.',
    'route1': 'Con đường cỏ dại đầu tiên ngoài thị trấn.',
    'dryadsgrove': 'Rừng cây rậm rạp, sinh vật hệ Gỗ trú ngụ rất nhiều.',
    'route1_sanglorian': 'Đoạn đường nối sang thị trấn kế tiếp.',
    'cotton_town': 'Thị trấn buôn bán sầm uất.',
    'leather_town': 'Thị trấn vùng đất khô, gió cát quanh năm.',
    'route2': 'Đường mòn ven rừng, cỏ mọc cao quá gối.',
    'citypark': 'Công viên giữa phố, chim chóc và người đi dạo.',
    'route3': 'Đường đèo lên núi, dốc và lắm đá.',
    'flower_city': 'Thành phố ven nước, đâu cũng thấy hoa.',
    'leather_shaft1': 'Tầng trên của hầm mỏ, tối om và ẩm thấp.',
    'leather_shaft2': 'Tầng sâu của hầm mỏ, ít ai dám xuống tới đây.',
    'taba_ba_passageway_1': 'Hành lang khu thi đấu, không khí lạ thường.',
    'taba_ba_passageway_2': 'Hành lang khu thi đấu, sương giá bám tường.',
    'taba_ba_passageway_3': 'Hành lang khu thi đấu, nghe cả tiếng sóng.',
}

ZONE_TRAINERS = {
    'taba_town': ['gym_brock'],
    'route1': ['youngster_minh', 'lass_lan', 'rival_1'],
    'dryadsgrove': ['bugcatcher_tung', 'lass_rainbow', 'rocket_1'],
    'route1_sanglorian': ['camper_route3', 'sailor_route3', 'rocket_2'],
    'cotton_town': ['gym_thuy', 'rocket_grunt_3', 'rocket_boss'],
    'leather_town': ['camper_victory', 'channeler_unknown', 'swimmer_light', 'rival_2'],
}


def write_zones(zone_pool, meta):
    out = ["// TuxeWorld H5 | data/zones.js | Khu vực: bảng gặp sinh vật, huấn luyện viên, lối đi",
           '// Bảng gặp TỰ SINH TỪ tools/mkworld.py theo địa hình của Tuxemon — đừng sửa tay phần encounters.', '',
           "// kind: 'town' | 'route' | 'forest' | 'cave' | 'lake' | 'meadow' | 'beach'",
           'export const ZONES = {']
    for zid, info in meta.items():
        name = info['name']
        nxt = sorted(info['next'])
        kind = ('town' if 'town' in zid or 'city' in zid
                else 'route' if 'route' in zid
                else 'forest' if 'grove' in zid or 'forest' in zid
                else 'indoor')
        desc = DESC.get(zid) or ('Khu vực %s.' % name)
        pool, lo, hi = zone_pool.get(zid, ([], 1, 5))
        out.append('  %s: {' % zid)
        icon_sp_txt = str(pool[0]['id']) if pool else 'null'
        out.append('    name: %s, kind: %s, icon: %s, iconSp: %s, iconItem: %s,'
                   % (js(name), js(kind), js(kind), icon_sp_txt, 'null'))
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
# LAY DUNG BA CON CUA BAN GOC. Trong Tuxemon, canh chon con dau tien nam o
# mods/tuxemon/maps/professor_lab.tmx: ba qua tuxeball xanh / do / lam ung voi
# "add_monster rockitten,5" - "add_monster cardiling,5" - "add_monster tweesher,5",
# va doi thu kay_wren luon nhat con khac che lai.
# Truoc day file nay tu chon lay theo he wood/fire/water nen ra ba con khong
# giong ban goc, nhin lai con hao hao nhau nua.
STARTER_SLUGS = ['rockitten', 'cardiling', 'tweesher']


def write_starters(mons):
    by_slug = {m['slug']: m for m in mons}
    picks = [by_slug[s] for s in STARTER_SLUGS if s in by_slug]
    out = ["// TuxeWorld H5 | data/starters.js | Ba sinh vật khởi đầu — TỰ SINH TỪ tools/mkworld.py",
           '// Đúng ba con của bản gốc Tuxemon (maps/professor_lab.tmx):',
           '// rockitten (Đất) · cardiling (Lửa) · tweesher (Băng).', '',
           'export const STARTERS = [']
    for m in picks:
        out.append('  { sp: %d, name: %s, type: %s },' % (m['id'], js(m['name']), js(m['types'][0])))
    out.append('];')
    open('js/data/starters.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')


# ==================== Huan luyen vien ====================
TRAINERS_META = [
    # (id, sprite, ten, kind, zone, so con, thuong, intro, lose, badge, badgeName)
    ('youngster_minh', 'youngster', 'Nam Nhóc Tì', 'trainer', 'route1', 2, 200,
     'Ê bạn! Mình mới bắt được sinh vật đầu tiên, đấu thử một trận nhé!',
     'Ôi thua rồi... nhưng mình sẽ mạnh lên!', None, None),
    ('lass_lan', 'lass', 'Bé Lan', 'trainer', 'route1', 2, 240,
     'Trông dễ thương thôi chứ đánh không hiền đâu nha!',
     'Hức... bạn giỏi thật đấy.', None, None),
    ('bugcatcher_tung', 'bug_catcher', 'Tùng Bắt Bọ', 'trainer', 'dryadsgrove', 3, 320,
     'Rừng này là sân nhà của tớ!', 'Sao lại thua ở chính khu rừng của mình...', None, None),
    ('hiker_dung', 'camper', 'Dũng Leo Núi', 'trainer', 'route1', 3, 420,
     'Trong hang tối nhưng ta thuộc từng ngóc ngách!', 'Đường hang khó vậy mà cậu vẫn thắng.', None, None),
    ('camper_route3', 'camper_f', 'Liêm Cắm Trại', 'trainer', 'route1_sanglorian', 3, 520,
     'Cắm trại giữa sa mạc mới đã!', 'Nắng quá nên mình mất tập trung...', None, None),
    ('sailor_route3', 'swimmer_f', 'Thuỷ Thủ Marina', 'trainer', 'route1_sanglorian', 3, 560,
     'Tớ vừa lên bờ nghỉ chút, đấu một trận nhé!', 'Trên cạn tớ đúng là kém hơn thật.', None, None),
    ('lass_rainbow', 'picnicker', 'Hạnh Dã Ngoại', 'trainer', 'dryadsgrove', 4, 700,
     'Đi picnic mà gặp đối thủ, vui quá!', 'Thua rồi nhưng hôm nay vẫn vui.', None, None),
    ('rocket_grunt_3', 'rocket_m', 'Kẻ Áo Đen', 'rocket', 'cotton_town', 4, 900,
     'Ngôi làng này sắp thuộc về bọn ta!', 'Bọn ta sẽ còn quay lại...', None, None),
    ('swimmer_light', 'swimmer_m', 'Douglas Bơi Lội', 'trainer', 'leather_town', 4, 1000,
     'Dưới nước tớ là số một!', 'Lên bờ rồi tớ đuối thật.', None, None),
    ('camper_victory', 'hiker', 'Marcos Trèo Non', 'trainer', 'leather_town', 5, 1400,
     'Leo núi cả đời, chưa sợ ai bao giờ!', 'Cậu khoẻ hơn ta tưởng.', None, None),
    ('channeler_unknown', 'scientist', 'Nhà Nghiên Cứu Mio', 'trainer', 'leather_town', 5, 1500,
     'Tôi đang đo địa chấn, đừng làm phiền!', 'Số liệu của tôi sai ở đâu đó rồi...', None, None),
    ('gym_brock', 'brock', 'Thạch — Võ Đường Đất', 'gym', 'taba_town', 3, 1200,
     'Ta là chủ võ đường đầu tiên. Cho ta xem cậu tiến bộ tới đâu!',
     'Cậu xứng đáng với huy hiệu này.', 'badge_boulder', 'Huy Hiệu Đá'),
    ('gym_thuy', 'misty', 'Thuỷ — Võ Đường Nước', 'gym', 'cotton_town', 4, 2000,
     'Nước mềm nhưng bào mòn được cả đá đấy!',
     'Được lắm, huy hiệu là của cậu.', 'badge_cascade', 'Huy Hiệu Thác'),
    # Huan luyen vien cua cot truyen — id phai khop js/data/story.js
    # kind 'rival': doi hinh sinh o engine/story.js theo starter nguoi choi
    ('rival_1', 'rogue', 'Vũ', 'rival', 'route1', 1, 500,
     'Tới rồi à! Xem Tuxemon của ai mạnh hơn nào.',
     'Hừm! Chỉ là may mắn thôi!', None, None),
    ('rocket_1', 'rocket_m', 'Team Xero — Tay Chân', 'rocket', 'dryadsgrove', 2, 600,
     'Ê nhóc! Chỗ này là địa bàn của Team Xero!',
     'Khoan đã... nhóc này mạnh thật!', None, None),
    ('rocket_2', 'rocket_f', 'Team Xero — Bộ Đôi', 'rocket', 'route1_sanglorian', 3, 1200,
     'Lại là nhóc đó! Lần này bọn ta đông hơn!',
     'Không thể tin được!', None, None),
    ('rocket_boss', 'boss', 'Thủ Lĩnh Xero', 'rocket', 'cotton_town', 5, 5000,
     'Ta sẽ cho mày thấy sức mạnh THẬT SỰ của Team Xero!',
     'Thua... thua một đứa nhóc?!', None, None),
    ('rival_2', 'rogue', 'Vũ — Trận Cuối', 'rival', 'leather_town', 4, 8000,
     'Trận cuối rồi. Lần này tớ không nhường đâu!',
     'Thua tâm phục khẩu phục...', None, None),
]


def write_trainers(zone_pool, mons):
    by_id = {m['id']: m for m in mons}
    out = ["// TuxeWorld H5 | data/trainers.js | Huấn luyện viên — TỰ SINH TỪ tools/mkworld.py",
           '// Đội hình lấy từ chính bảng gặp của khu vực họ đứng, nên đánh ở đâu gặp sinh vật vùng đó.', '',
           "// kind: 'trainer' | 'gym' | 'rocket' | 'rival'",
           'export const TRAINERS = {']
    for (tid, sprite, name, kind, zone, n, money, intro, lose, badge, badge_name) in TRAINERS_META:
        pool, lo, hi = zone_pool.get(zone, ([], 3, 8))
        if not pool:
            # Thi tran khong co bang gap -> muon tam bang cua tuyen duong dau tien,
            # khong thi doi gym o thi tran ra rong va tran dau khong bat dau duoc.
            pool, lo, hi = zone_pool.get('route1', ([], 3, 8))
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
