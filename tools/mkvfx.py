# -*- coding: utf-8 -*-
"""Chep hieu ung chieu thuc (VFX) cua Tuxemon vao du an.

Chay:  python3 tools/mkvfx.py <duong-dan-kho-Tuxemon>

Nguon: https://github.com/Tuxemon/Tuxemon — mods/tuxemon/animations/technique,
CC BY-SA 4.0.

Ghi de:
  assets/vfx/<he>.png   dai anh (sprite strip) cua hieu ung
  js/data/vfx.js        so khung + kich thuoc de giao dien chay animation

Anh goc cua Tuxemon von da la DAI ANH ngang: nhieu khung vuong xep canh nhau,
nen chep nguyen ve roi chay bang CSS steps() la duoc, khong phai cat ghep gi.
"""
import os
import shutil
import sys

from PIL import Image

# he cua game -> tep animation ben Tuxemon
FX = {
    'fire': 'fireball_114.png',
    'water': 'bubbleattack.png',
    'wood': 'leafstab.png',
    'metal': 'metal_delete.png',
    'lightning': 'lightning_bolt_138.png',
    'frost': 'ice_storm.png',
    'earth': 'explosion_dusty_96.png',
    'venom': 'purple_explosion.png',
    'shadow': 'shadow_blast.png',
    'cosmic': 'starfall.png',
    'sky': 'tornado_basic.png',
    'heroic': 'divinity_beam.png',
    'normal': 'bite.png',
    # dung chung
    'hit': 'misc_hit_preview1.png',
    'heal': 'heal_burst_120.png',
}

# Neu tep chinh khong co thi lay tep nay
FALLBACK = 'bite.png'


def js(v):
    import json
    return json.dumps(v, ensure_ascii=False)


def anim_dang_dung():
    """Doc js/data/moves.js xem cac chieu dang goi nhung animation nao."""
    import re
    try:
        src = open('js/data/moves.js', encoding='utf-8').read()
    except OSError:
        return set()
    return set(re.findall(r'anim: "([^"]+)"', src))


def lam_dai_anh(src_dir, ten):
    """Tra ve (duong dan, so khung, rong, cao) hoac None.

    Ban goc luu hai kieu: mot tep dai san (<ten>.png, nhieu khung xep ngang)
    hoac nhieu tep roi danh so (<ten>1.png, <ten>2.png...). Kieu thu hai thi
    ghep lai thanh mot dai anh cho giao dien chay bang CSS steps().
    """
    mot = os.path.join(src_dir, ten + '.png')
    dst = 'assets/vfx/tech/%s.png' % ten
    os.makedirs('assets/vfx/tech', exist_ok=True)
    if os.path.exists(mot):
        im = Image.open(mot).convert('RGBA')
        frames = max(1, round(im.width / im.height))
        shutil.copyfile(mot, dst)
        return dst, frames, im.width // frames, im.height

    roi = []
    i = 1
    while True:
        p = os.path.join(src_dir, '%s%d.png' % (ten, i))
        if not os.path.exists(p):
            break
        roi.append(p)
        i += 1
    if not roi:
        return None
    ims = [Image.open(p).convert('RGBA') for p in roi]
    w = max(i.width for i in ims)
    h = max(i.height for i in ims)
    dai = Image.new('RGBA', (w * len(ims), h))
    for k, im in enumerate(ims):
        dai.paste(im, (k * w + (w - im.width) // 2, (h - im.height) // 2), im)
    dai.save(dst, optimize=True)
    return dst, len(ims), w, h


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    src_dir = os.path.join(sys.argv[1], 'mods/tuxemon/animations/technique')
    if not os.path.isdir(src_dir):
        raise SystemExit('Khong thay %s' % src_dir)

    os.makedirs('assets/vfx/tech', exist_ok=True)
    for d in ('assets/vfx', 'assets/vfx/tech'):
        for f in os.listdir(d):
            p = os.path.join(d, f)
            if f.endswith('.png') and os.path.isfile(p):
                os.remove(p)

    out = ["// TuxeWorld H5 | data/vfx.js | Hiệu ứng chiêu thức — TỰ SINH TỪ tools/mkvfx.py",
           '// Nguồn: Tuxemon (CC BY-SA 4.0). frames = số khung trong dải ảnh.', '',
           'export const VFX = {']
    n = 0
    swapped = []
    for key, fname in FX.items():
        src = os.path.join(src_dir, fname)
        if not os.path.exists(src):
            src = os.path.join(src_dir, FALLBACK)
            swapped.append(key)
        im = Image.open(src).convert('RGBA')
        frames = max(1, round(im.width / im.height))
        dst = 'assets/vfx/%s.png' % key
        shutil.copyfile(src, dst)
        out.append("  %s: { src: '%s', frames: %d, w: %d, h: %d },"
                   % (key, dst, frames, im.width // frames, im.height))
        n += 1
    out.append('};')

    # Hieu ung RIENG cua tung chieu: moi chieu ben ban goc ghi san ten animation
    # (truong visuals.animation), tep nam ngay trong cung thu muc. Ca thu muc chi
    # 1,3 MB nen chep het nhung cai dang dung.
    out.append('')
    out.append('// Hiệu ứng riêng của từng chiêu (trường visuals.animation bên bản gốc)')
    out.append('export const TECH_FX = {')
    n_tech = 0
    for ten in sorted(anim_dang_dung()):
        r = lam_dai_anh(src_dir, ten)
        if not r:
            continue
        dst, frames, w, h = r
        out.append("  %s: { src: '%s', frames: %d, w: %d, h: %d }," % (js(ten), dst, frames, w, h))
        n_tech += 1
    out.append('};')
    out.append("""
// Hệ nào chưa có hiệu ứng riêng thì dùng hiệu ứng đánh thường
export const vfxFor = (type) => VFX[type] || VFX.hit;

// Hiệu ứng của một chiêu: ưu tiên ảnh riêng của chiêu đó, không có thì theo hệ
export const fxFor = (anim, type) => TECH_FX[anim] || vfxFor(type);""")
    open('js/data/vfx.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print('OK: %d hiệu ứng theo hệ, %d hiệu ứng riêng của chiêu' % (n, n_tech))
    if swapped:
        print('Dùng tạm ảnh mặc định cho:', ', '.join(swapped))


if __name__ == '__main__':
    main()
