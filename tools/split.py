#!/usr/bin/env python3
# PokeWorld | tools/split.py | Chia script thành nhiều phần nhỏ cho ô "Mã tự chế"
# có giới hạn độ dài trên mobile. Mỗi phần chứa TRỌN VẸN một số file (bọc do...end),
# nén bớt: bỏ dòng chỉ có comment, dòng trống, thụt đầu dòng.
# Dùng: python3 tools/split.py [max_bytes_moi_phan]  (mặc định 24000)

import os, sys, glob

MAX = int(sys.argv[1]) if len(sys.argv) > 1 else 24000
DIRS = ["00_core", "10_data", "20_model", "30_save", "40_world",
        "50_battle", "60_ui", "70_systems", "90_main"]
OUT = "dist/parts"

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
os.makedirs(OUT, exist_ok=True)
for old in glob.glob(f"{OUT}/*.lua"):
    os.remove(old)

def minify(src: str) -> str:
    out = []
    for line in src.splitlines():
        s = line.strip()
        if not s:
            continue            # bỏ dòng trống
        if s.startswith("--"):
            continue            # bỏ dòng chỉ có comment (không có block comment trong repo)
        out.append(s)
    return "\n".join(out)

# Gom từng file (đã nén, bọc do...end) theo thứ tự load
chunks = []
for d in DIRS:
    for f in sorted(glob.glob(f"{d}/*.lua")):
        body = minify(open(f, encoding="utf-8").read())
        chunks.append((f, f"-- {f}\ndo\n{body}\nend\n"))

# Chia thành các phần <= MAX byte, không cắt giữa file
parts, cur, cur_size = [], [], 0
for name, chunk in chunks:
    size = len(chunk.encode("utf-8"))
    if size > MAX:
        sys.exit(f"LOI: file {name} mot minh da {size}B > gioi han {MAX}B — giam MAX khong duoc, can tach file nguon")
    if cur and cur_size + size > MAX:
        parts.append(cur)
        cur, cur_size = [], 0
    cur.append(chunk)
    cur_size += size
if cur:
    parts.append(cur)

n = len(parts)
for i, part in enumerate(parts, 1):
    header = (f"-- PokeWorld PHAN {i}/{n} — dan vao 1 khoi 'Ma tu che' rieng.\n"
              f"-- Cac khoi phai chay theo dung thu tu 1 -> {n} (cung 1 trigger 'khi game bat dau').\n")
    path = f"{OUT}/PokeWorld_phan_{i:02d}.lua"
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(header + "".join(part))
    print(f"{path}  {os.path.getsize(path)} bytes")

print(f"[split] {n} phan, moi phan <= {MAX} bytes")
