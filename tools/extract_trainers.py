# -*- coding: utf-8 -*-
"""Cat khung dung yen ra khoi anh atlas cua pokerogue-assets.

Cac anh trainer la atlas nhieu khung xep sat nhau, chua thong tin toa do
trong file .json di kem. File .json do phat hanh theo AGPL-3.0 nen KHONG
sao chep vao du an. Thay vao do tu do bien anh: cac khung cach nhau vai
pixel trong suot nen chi can tim vung lien thong la tach duoc.
"""
from PIL import Image
import numpy as np
from collections import deque

def frame_boxes(path):
    im = Image.open(path).convert('RGBA')
    a = np.array(im)
    solid = a[:, :, 3] > 8
    H, W = solid.shape
    seen = np.zeros_like(solid, dtype=bool)
    boxes = []
    for y in range(H):
        row = solid[y]
        for x in range(W):
            if not row[x] or seen[y, x]:
                continue
            q = deque([(y, x)]); seen[y, x] = True
            x0 = x1 = x; y0 = y1 = y
            while q:
                cy, cx = q.popleft()
                x0 = min(x0, cx); x1 = max(x1, cx)
                y0 = min(y0, cy); y1 = max(y1, cy)
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < H and 0 <= nx < W and solid[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True; q.append((ny, nx))
            if (x1 - x0 + 1) * (y1 - y0 + 1) >= 200:      # bo cac manh vun
                boxes.append((x0, y0, x1 - x0 + 1, y1 - y0 + 1))
    return im, boxes

def best_frame(path):
    """Khung dung yen = khung o goc tren trai, cung la khung to nhat."""
    im, boxes = frame_boxes(path)
    if not boxes:
        return None
    boxes.sort(key=lambda b: (-(b[2] * b[3]), b[1], b[0]))
    big = boxes[0]
    top = [b for b in boxes if b[2] * b[3] >= big[2] * big[3] * 0.92]
    top.sort(key=lambda b: (b[1], b[0]))          # trong so do lay khung tren-trai nhat
    x, y, w, h = top[0]
    return im.crop((x, y, x + w, y + h))
