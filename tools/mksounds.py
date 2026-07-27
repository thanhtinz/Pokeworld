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
MUSIC = {
    'title': 'music/JRPG_goodMorning.ogg',
    'town': 'music/JRPG_royalCourt_loop.ogg',
    'battle': 'music/Enter_the_Emperor.ogg',
    'win': 'music/JRPG_winBattle.ogg',
}


def js(v):
    return "'%s'" % str(v).replace("'", "\\'")


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    root = os.path.join(sys.argv[1], 'mods/tuxemon')
    if not os.path.isdir(root):
        raise SystemExit('Khong thay %s' % root)

    for d in ('assets/sfx', 'assets/music'):
        os.makedirs(d, exist_ok=True)
        for f in os.listdir(d):
            os.remove(os.path.join(d, f))

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

    open('js/data/sounds.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print('OK: %d tiếng động, %d bản nhạc, tổng %.1f MB'
          % (len(SFX) - len([m for m in missing if 'music/' not in m]),
             len(MUSIC) - len([m for m in missing if 'music/' in m]),
             total / 1048576))
    if missing:
        print('THIẾU:', ', '.join(missing))


if __name__ == '__main__':
    main()
