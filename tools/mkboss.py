# -*- coding: utf-8 -*-
"""Chon BOSS THE GIOI va BOSS TUNG KHU cho he thong danh boss chung.

Chay:  python3 tools/mkboss.py
Phai chay SAU tools/mktuxemon.py va tools/mkworld.py.

Ghi de:
  js/data/bosses.js        bang boss cho phia nguoi choi
  server/src/boss.data.js  BAN SAO cho may chu (SINH MAY, dung sua tay)

Cach chon: boss cua mot khu la con MANH NHAT trong bang gap cua khu do —
nguoi chơi đi qua đó gặp con thường, thì con đầu đàn cũng phải là giống ấy.
Boss thế giới lấy bốn con tổng chỉ số cao nhất toàn bảng loài.

Máu boss KHÔNG phải máu của con Tuxemon đó: đây là thanh máu chung của cả máy
chủ, mọi người cùng đánh mới hết. Sát thương thật trong trận được nhân lên rồi
mới trừ vào thanh này (xem 'heSo').
"""
import json
import re

MOC_KHU = 240000          # mau boss khu vuc
MOC_THE_GIOI = 1200000    # mau boss the gioi
MOC_BANG = 400000         # mau boss bang hoi (con nhan them theo cap bang)
HE_SO = 60                # 1 diem mau trong tran = ngan nay diem tren thanh chung
# Moi lan danh chi tru duoc toi da 1/25 thanh mau -> can it nhat 25 luot danh
PHAN_MOI_LAN = 25

# Ten khu -> ten boss nghe cho ra dang dau linh
DANH_HIEU = [
    'Chúa Tể', 'Đầu Đàn', 'Bá Vương', 'Cổ Thú', 'Hung Thần',
    'Thủ Lĩnh', 'Lão Tướng', 'Ác Mộng',
]


def khoi(src, mo_dau):
    moc = [(m.start(), m.group(1)) for m in re.finditer(mo_dau, src, re.M)]
    for i, (vt, key) in enumerate(moc):
        het = moc[i + 1][0] if i + 1 < len(moc) else len(src)
        yield key, src[vt:het]


def doc_species():
    src = open('js/data/species.js', encoding='utf-8').read()
    out = {}
    for sid, than in khoi(src, r'^  (\d+): \{'):
        ten = re.search(r'name: "([^"]+)"', than)
        base = re.search(r'base: (\{[^}]*\})', than)
        if not (ten and base):
            continue
        b = json.loads(base.group(1).replace('hp:', '"hp":').replace('armour:', '"armour":')
                       .replace('dodge:', '"dodge":').replace('melee:', '"melee":')
                       .replace('ranged:', '"ranged":').replace('speed:', '"speed":'))
        out[int(sid)] = {'name': ten.group(1), 'tong': sum(b.values())}
    return out


def doc_zones():
    """Khu vuc -> danh sach (sp, cap cao nhat) lay tu bang gap da sinh."""
    ra = {}
    for tep, mo_dau in (('js/data/zones.js', r'^  ([a-z0-9_]+): \{'),
                        ('js/data/encounters.js', r'^  ([a-z0-9_]+): \[')):
        try:
            src = open(tep, encoding='utf-8').read()
        except OSError:
            continue
        for zone, than in khoi(src, mo_dau):
            ds = ra.setdefault(zone, [])
            for m in re.finditer(r'\{ sp: (\d+),[^}]*max: (\d+)', than):
                ds.append((int(m.group(1)), int(m.group(2))))
    return {k: v for k, v in ra.items() if v}


def js(v):
    return json.dumps(v, ensure_ascii=False)


def main():
    sp = doc_species()
    zones = doc_zones()

    bosses = []

    # ==== Boss tung khu ====
    # Chi lay nhung khu co it nhat 4 loai — khu mong qua thi khong dang mot boss
    ung = [(z, ds) for z, ds in zones.items() if len({s for s, _ in ds}) >= 4]
    ung.sort()
    for i, (zone, ds) in enumerate(ung):
        manh = max(ds, key=lambda x: (sp.get(x[0], {}).get('tong', 0), x[1]))
        s = sp.get(manh[0])
        if not s:
            continue
        cap = min(80, max(20, manh[1] + 8))
        bosses.append({
            'id': 'khu_' + zone,
            'kind': 'khu',
            'zone': zone,
            'name': '%s %s' % (DANH_HIEU[i % len(DANH_HIEU)], s['name']),
            'sp': manh[0], 'lv': cap,
            'hpMax': MOC_KHU,
            'heSo': HE_SO,
        })

    # ==== Boss the gioi ====
    manh_nhat = sorted(sp.items(), key=lambda kv: -kv[1]['tong'])[:4]
    for i, (sid, s) in enumerate(manh_nhat):
        bosses.append({
            'id': 'the_gioi_%d' % (i + 1),
            'kind': 'the_gioi',
            'zone': None,
            'name': 'Bạo Chúa %s' % s['name'],
            'sp': sid, 'lv': 90 + i * 3,
            'hpMax': MOC_THE_GIOI + i * 200000,
            'heSo': HE_SO,
        })

    # ==== Boss bang hoi ====
    # Ba con, mo dan theo cap bang. Mau con nhan them theo cap ben may chu.
    for i, (sid, s2) in enumerate(sorted(sp.items(), key=lambda kv: -kv[1]['tong'])[4:7]):
        bosses.append({
            'id': 'bang_%d' % (i + 1),
            'kind': 'bang',
            'zone': None,
            'name': 'Thủ Hộ %s' % s2['name'],
            'sp': sid, 'lv': 60 + i * 12,
            'hpMax': MOC_BANG + i * 300000,
            'heSo': HE_SO,
            'capBang': 1 + i * 5,
        })

    for b in bosses:
        b['capMoiLan'] = b['hpMax'] // PHAN_MOI_LAN

    than = ['export const BOSS_HE_SO = %d;' % HE_SO,
            '',
            '// hpMax = thanh máu CHUNG của cả máy chủ, không phải máu con Tuxemon.',
            '// heSo  = sát thương thật trong trận nhân lên bấy nhiêu lần.',
            '// capMoiLan = một lần đánh trừ được nhiều nhất bằng này.',
            '// capBang = boss bang hội mở ở cấp bang này (0 = không phải boss bang).',
            'export const BOSSES = [']
    for b in bosses:
        than.append('  { id: %s, kind: %s, zone: %s, name: %s, sp: %d, lv: %d,'
                    ' hpMax: %d, heSo: %d, capMoiLan: %d, capBang: %d },'
                    % (js(b['id']), js(b['kind']), js(b['zone']), js(b['name']),
                       b['sp'], b['lv'], b['hpMax'], b['heSo'], b['capMoiLan'],
                       b.get('capBang', 0)))
    than += ['];', '',
             'export const BOSS_BY_ID = Object.fromEntries(BOSSES.map(b => [b.id, b]));',
             '']

    with open('js/data/bosses.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join([
            '// TuxeWorld H5 | data/bosses.js | Boss chung — SINH TỰ ĐỘNG bởi tools/mkboss.py',
            '// KHONG SUA TAY.', ''] + than))
    with open('server/src/boss.data.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join([
            '// TuxeWorld server | src/boss.data.js | BẢN SAO của js/data/bosses.js',
            '// SINH TỰ ĐỘNG bởi tools/mkboss.py — KHONG SUA TAY.',
            '// Máy chủ tự tra máu và trần sát thương của từng boss, không tin số client gửi lên.',
            ''] + than))
    print('OK: %d boss khu vực + %d boss thế giới + %d boss bang hội'
          % (sum(1 for b in bosses if b['kind'] == 'khu'),
             sum(1 for b in bosses if b['kind'] == 'the_gioi'),
             sum(1 for b in bosses if b['kind'] == 'bang')))


if __name__ == '__main__':
    main()
