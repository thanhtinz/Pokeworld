# -*- coding: utf-8 -*-
"""Dung nen tran dau tu anh nen cua Tuxemon.

Chay:  python3 tools/mkarena.py <duong-dan-kho-Tuxemon>

Nguon: https://github.com/Tuxemon/Tuxemon — db/environment + gfx/ui/combat,
CC BY-SA 4.0.

Ghi de:
  assets/arena/<moi-truong>_bg.png   nen doc 320x480
  js/data/arenas.js                  bang tra nen theo moi truong

Moi truong lay THANG tu db/environment cua ban goc — moi ban do trong game da
mang san hai ma moi truong (ban ngay / ban dem) do tools/mktmx.py doc ra tu
lenh "set_environment" trong tep .tmx, nen khong con bang tra chep tay nao nua.

Khong ve "be dung": Tuxemon goc khong co be, con nao cung dung thang tren nen,
giao dien chi ve mot vet bong mem duoi chan bang CSS.

Anh goc cua Tuxemon la canh NGANG 256x108 (danh cho man ngang). Khung tran dau
cua game nay la MAN DOC nen cong cu ghep lai: canh goc dat o phan tren, phan
duoi keo dai bang chinh hang pixel duoi cung cua canh do (thanh bai dat truoc
mat) va toi dan xuong cho co chieu sau.
"""
import os
import sys

import yaml
from PIL import Image, ImageDraw

W, H = 320, 480


def build(src_path, name):
    scene = Image.open(src_path).convert('RGBA')
    top = scene.resize((W, round(scene.height * W / scene.width)), Image.NEAREST)

    out = Image.new('RGBA', (W, H))
    out.paste(top, (0, 0))

    # Keo dai mat dat bang hang pixel duoi cung
    strip = top.crop((0, top.height - 1, W, top.height)).resize((W, H - top.height), Image.NEAREST)
    out.paste(strip, (0, top.height))

    # To toi dan cho co chieu sau. PIL CHI pha alpha tren anh RGB — ve mau nua
    # trong suot thang len anh RGBA la ghi de, ca vung se thanh den.
    out = out.convert('RGB')
    d = ImageDraw.Draw(out, 'RGBA')
    for i in range(top.height, H):
        t = (i - top.height) / max(1, H - top.height)
        d.line([(0, i), (W, i)], fill=(0, 0, 0, int(38 * t)))

    out.save('assets/arena/%s_bg.png' % name, optimize=True)


def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    root = sys.argv[1]
    db = os.path.join(root, 'mods/tuxemon/db/environment')
    if not os.path.isdir(db):
        raise SystemExit('Khong thay %s' % db)

    os.makedirs('assets/arena', exist_ok=True)
    for f in os.listdir('assets/arena'):
        if f.endswith('.png'):
            os.remove(os.path.join('assets/arena', f))

    lam = []
    for f in sorted(os.listdir(db)):
        if not f.endswith('.yaml'):
            continue
        d = yaml.safe_load(open(os.path.join(db, f), encoding='utf-8')) or {}
        bg = (d.get('battle_graphics') or {}).get('background')
        slug = d.get('slug') or os.path.splitext(f)[0]
        if not bg:
            continue
        src = os.path.join(root, 'mods/tuxemon', bg)
        if not os.path.exists(src):
            print('THIEU:', bg)
            continue
        build(src, slug)
        lam.append(slug)

    out = ['// TuxeWorld H5 | data/arenas.js | Nền trận đấu theo môi trường',
           '// TỰ SINH TỪ tools/mkarena.py — nguồn db/environment của Tuxemon.',
           '// Đừng sửa tay.',
           '//',
           '// Mỗi bản đồ mang sẵn hai mã môi trường (env ban ngày, envNight ban',
           '// đêm) do tools/mktmx.py đọc từ lệnh set_environment của bản gốc.',
           "import { absUrl } from '../util.js';",
           "import { MAPS } from './maps.js';",
           "import { isDaytime } from '../engine/daytime.js';",
           '',
           '// Danh sách môi trường có sẵn ảnh nền',
           'export const ARENAS = [%s];' % ', '.join("'%s'" % s for s in lam),
           '',
           "export const DEFAULT_ARENA = 'grass';",
           '',
           '// Nền của một bản đồ. Trời tối thì lấy cảnh đêm; môi trường nào không',
           '// có cảnh đêm riêng (trong nhà) thì vẫn dùng cảnh thường.',
           'export function arenaFor(mapId) {',
           '  const mp = MAPS[mapId];',
           '  let a = mp ? (isDaytime() ? mp.env : mp.envNight) : DEFAULT_ARENA;',
           '  if (!ARENAS.includes(a)) a = mp && ARENAS.includes(mp.env) ? mp.env : DEFAULT_ARENA;',
           '  return { name: a, bg: absUrl(`assets/arena/${a}_bg.png`) };',
           '}']
    with open('js/data/arenas.js', 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(out) + '\n')

    print('OK: %d bộ nền trận đấu (cả cảnh đêm)' % len(lam))


if __name__ == '__main__':
    main()
