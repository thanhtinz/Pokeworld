# -*- coding: utf-8 -*-
"""Chep am thanh + nhac cua Tuxemon vao du an.

Chay:  python3 tools/mksounds.py <duong-dan-kho-Tuxemon>

Nguon:
  Hieu ung: Kelvin Shadewing's Soundpack Vol.1 (dung duoc ca cho muc dich
            thuong mai, chi can ghi cong + dan link — xem CREDITS.md)
  Nhac:     Eric Skiff / HHavok / bo JRPG trong kho Tuxemon, CC BY-SA 4.0

Ghi de:
  assets/sfx/<ten>.ogg     tieng dong ngan
  assets/music/<ten>.ogg   nhac nen
  js/data/sounds.js        bang ten -> duong dan cho game dung

Chi lay nhung tep THAT SU dung, va uu tien tep nhe: nhac nen chon ban duoi
1.5 MB, ai vao game bang 3G cung khong phai cho lau.
"""
import os
import shutil
import sys

# ten trong game -> duong dan trong kho Tuxemon
SFX = {
    'tap': 'sounds/interface/menu-select.ogg',
    'confirm': 'sounds/interface/confirm.ogg',
    'click': 'sounds/interface/NenadSimic_Click.ogg',
    'hit': 'sounds/technique/kick.ogg',
    'hit_strong': 'sounds/technique/blaster1.ogg',
    'hit_weak': 'sounds/technique/boioing.ogg',
    'faint': 'sounds/technique/faint.ogg',
    'fall': 'sounds/combat/falling_Macro.ogg',
    'heal': 'sounds/technique/shiney.ogg',
    'levelup': 'sounds/ding.wav',
    'catch': 'sounds/technique/forcefield.ogg',
    'throw': 'sounds/player/throw.ogg',
    'coin': 'sounds/setting/coinecho.wav',
    'fire': 'sounds/technique/flamethrower.ogg',
    'water': 'sounds/technique/bubble.ogg',
    'lightning': 'sounds/technique/lightning.ogg',
    'earth': 'sounds/technique/crumble.ogg',
    'wood': 'sounds/technique/sand.ogg',
    'metal': 'sounds/technique/drill.ogg',
    'frost': 'sounds/technique/freeze.ogg',
}

# Nhac nen: giu it va nhe
# Ban goc goi nhac bang lenh play_music trong tung ban do (xem tools/mktmx.py).
# Chi chep them hai ban nhe nhat trong so do; ban do nao goi ban nhac nang hon
# thi dung tam 'town' cho khoi phinh dung luong tai ve.
MUSIC = {
    'title': 'music/JRPG_goodMorning.ogg',
    'town': 'music/JRPG_royalCourt_loop.ogg',      # music_cathedral_theme
    'field': 'music/Chibi Ninja.ogg',              # music_chibi_ninja — thi tran + duong
    'grove': 'music/JRPG_mysticIsle.ogg',          # music_mystic_island — rung
    'battle': 'music/Enter_the_Emperor.ogg',
    'win': 'music/JRPG_winBattle.ogg',
}


def js(v):
    return "'%s'" % str(v).replace("'", "\\'")


# Tieng dong rieng cho tung chieu: db/sounds/techniques.yaml co bang slug -> tep,
# con moi chieu ghi san slug trong truong sound.sfx. Ca thu muc chi 500KB nen
# chep het, danh cho moi chieu dung dung tieng cua no.
def chep_tieng_chieu(root):
    import glob
    try:
        import yaml
    except ImportError:
        return {}
    p = os.path.join(root, 'mods/tuxemon/db/sounds/techniques.yaml')
    if not os.path.exists(p):
        return {}
    with open(p, encoding='utf-8') as f:
        rows = yaml.safe_load(f) or []
    os.makedirs('assets/sfx/tech', exist_ok=True)
    ban = {}
    for r in rows:
        slug, tep = r.get('slug'), r.get('file')
        if not slug or not tep:
            continue
        src = os.path.join(root, 'mods/tuxemon/sounds', tep)
        if not os.path.exists(src):
            continue
        ten = os.path.basename(tep)
        shutil.copyfile(src, os.path.join('assets/sfx/tech', ten))
        ban[slug] = 'assets/sfx/tech/' + ten
    return ban


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    root = os.path.join(sys.argv[1], 'mods/tuxemon')
    if not os.path.isdir(root):
        raise SystemExit('Khong thay %s' % root)

    for d in ('assets/sfx', 'assets/music', 'assets/sfx/tech'):
        os.makedirs(d, exist_ok=True)
        for f in os.listdir(d):
            p = os.path.join(d, f)
            if os.path.isfile(p):
                os.remove(p)

    out = ["// TuxeWorld H5 | data/sounds.js | Bảng âm thanh — TỰ SINH TỪ tools/mksounds.py",
           '// Nguồn: bộ âm thanh và nhạc đi kèm Tuxemon (xem CREDITS.md).', '']
    missing = []
    total = 0

    for group, table, folder, var in (
            ('SFX', SFX, 'assets/sfx', 'SFX'),
            ('MUSIC', MUSIC, 'assets/music', 'MUSIC')):
        out.append('export const %s = {' % var)
        for name, rel in table.items():
            src = os.path.join(root, rel)
            if not os.path.exists(src):
                missing.append(rel)
                continue
            ext = os.path.splitext(rel)[1]
            dst = os.path.join(folder, name + ext)
            shutil.copyfile(src, dst)
            total += os.path.getsize(dst)
            out.append('  %s: %s,' % (name, js(dst)))
        out.append('};')
        out.append('')

    tieng_chieu = chep_tieng_chieu(sys.argv[1])
    out.append('// Tiếng riêng của từng chiêu (db/sounds/techniques.yaml của bản gốc)')
    out.append('export const TECH_SFX = {')
    for slug, path in sorted(tieng_chieu.items()):
        total += os.path.getsize(path)
        out.append('  %s: %s,' % (js(slug), js(path)))
    out.append('};')
    out.append('')

    open('js/data/sounds.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print('  (%d tiếng riêng cho chiêu thức)' % len(tieng_chieu))
    print('OK: %d tiếng động, %d bản nhạc, tổng %.1f MB'
          % (len(SFX) - len([m for m in missing if 'music/' not in m]),
             len(MUSIC) - len([m for m in missing if 'music/' in m]),
             total / 1048576))
    if missing:
        print('THIẾU:', ', '.join(missing))


if __name__ == '__main__':
    main()
