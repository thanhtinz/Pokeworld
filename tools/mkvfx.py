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


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    src_dir = os.path.join(sys.argv[1], 'mods/tuxemon/animations/technique')
    if not os.path.isdir(src_dir):
        raise SystemExit('Khong thay %s' % src_dir)

    os.makedirs('assets/vfx', exist_ok=True)
    for f in os.listdir('assets/vfx'):
        if f.endswith('.png'):
            os.remove(os.path.join('assets/vfx', f))

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
    out.append("""
// Hệ nào chưa có hiệu ứng riêng thì dùng hiệu ứng đánh thường
export const vfxFor = (type) => VFX[type] || VFX.hit;""")
    open('js/data/vfx.js', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print('OK: %d hiệu ứng' % n)
    if swapped:
        print('Dùng tạm ảnh mặc định cho:', ', '.join(swapped))


if __name__ == '__main__':
    main()
