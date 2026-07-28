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
# Tieng keu rieng cua tung loai: db/monster/<slug>.yaml ghi
#   sounds.combat_call.sfx  (luc ra tran)  va  sounds.faint_call.sfx (luc guc),
# bang slug -> tep nam o db/sounds/monster_calls.yaml.
# Ca bo la 4.7 MB nen may tep WAV nang duoc ha xuong mono 22 kHz truoc khi chep.
def ha_wav(src, dst):
    """WAV goc 44 kHz stereo 16 bit -> mono 22 kHz, con 1/4 dung luong."""
    import audioop
    import wave
    with wave.open(src, 'rb') as r:
        kenh, rong, tan, khung = r.getnchannels(), r.getsampwidth(), r.getframerate(), r.getnframes()
        data = r.readframes(khung)
    if rong != 2:
        return False
    if kenh == 2:
        data = audioop.tomono(data, 2, 0.5, 0.5)
    if tan > 22050:
        data, _ = audioop.ratecv(data, 2, 1, tan, 22050, None)
        tan = 22050
    with wave.open(dst, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(tan)
        w.writeframes(data)
    return True


def chep_tieng_keu(root):
    import glob
    import yaml
    bang_p = os.path.join(root, 'mods/tuxemon/db/sounds/monster_calls.yaml')
    mon_d = os.path.join(root, 'mods/tuxemon/db/monster')
    if not os.path.exists(bang_p) or not os.path.isdir(mon_d):
        return {}, {}
    bang = {r['slug']: r['file'] for r in (yaml.safe_load(open(bang_p, encoding='utf-8')) or [])
            if isinstance(r, dict) and r.get('slug') and r.get('file')}

    theo_loai = {}
    can = set()
    for f in sorted(glob.glob(os.path.join(mon_d, '*.yaml'))):
        d = yaml.safe_load(open(f, encoding='utf-8')) or {}
        am = d.get('sounds') or {}
        vao = (am.get('combat_call') or {}).get('sfx')
        guc = (am.get('faint_call') or {}).get('sfx')
        if vao or guc:
            theo_loai[d['slug']] = (vao, guc)
            can.update(x for x in (vao, guc) if x)

    os.makedirs('assets/sfx/cry', exist_ok=True)
    tep = {}
    for slug in sorted(can):
        duong = bang.get(slug)
        if not duong:
            continue
        src = os.path.join(root, 'mods/tuxemon/sounds', duong)
        if not os.path.exists(src):
            continue
        ten = os.path.basename(duong)
        dst = os.path.join('assets/sfx/cry', ten)
        if ten.lower().endswith('.wav') and ha_wav(src, dst):
            pass
        else:
            shutil.copyfile(src, dst)
        tep[slug] = 'assets/sfx/cry/' + ten
    return tep, theo_loai


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

    tieng_keu, keu_loai = chep_tieng_keu(sys.argv[1])
    out.append('// Tiếng kêu riêng của từng loài (db/sounds/monster_calls.yaml)')
    out.append('export const CRY_SFX = {')
    for slug, path in sorted(tieng_keu.items()):
        total += os.path.getsize(path)
        out.append('  %s: %s,' % (js(slug), js(path)))
    out.append('};')
    out.append('')
    out.append('// slug loài -> [tiếng lúc ra trận, tiếng lúc gục]')
    out.append('export const MON_CRY = {')
    for slug, (vao, guc) in sorted(keu_loai.items()):
        out.append('  %s: [%s, %s],' % (js(slug), js(vao) if vao else 'null',
                                        js(guc) if guc else 'null'))
    out.append('};')
    out.append('')
    out.append('''export function cryPath(monSlug, kind = 0) {
  const c = MON_CRY[monSlug];
  return (c && CRY_SFX[c[kind]]) || null;
}''')

    open('js/data/sounds.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print('  (%d tiếng kêu cho %d loài)' % (len(tieng_keu), len(keu_loai)))
    print('  (%d tiếng riêng cho chiêu thức)' % len(tieng_chieu))
    print('OK: %d tiếng động, %d bản nhạc, tổng %.1f MB'
          % (len(SFX) - len([m for m in missing if 'music/' not in m]),
             len(MUSIC) - len([m for m in missing if 'music/' in m]),
             total / 1048576))
    if missing:
        print('THIẾU:', ', '.join(missing))


if __name__ == '__main__':
    main()
