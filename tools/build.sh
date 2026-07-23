#!/usr/bin/env bash
# PokeWorld | tools/build.sh | Đóng gói script thành file release cho Mini World: CREATA
# Kết quả trong dist/:
#   - PokeWorld_all_in_one.lua : 1 file duy nhất, paste thẳng vào 1 script trong editor
#   - PokeWorld_scripts.zip    : từng file riêng (giữ thứ tự load 00_ -> 99_) nếu muốn
#                                tạo mỗi file 1 script trong editor
set -euo pipefail
cd "$(dirname "$0")/.."

DIRS="00_core 10_data 20_model 30_save 40_world 50_battle 60_ui 70_systems 90_main"
OUT_DIR="dist"
BUNDLE="$OUT_DIR/PokeWorld_all_in_one.lua"
ZIP="$OUT_DIR/PokeWorld_scripts.zip"
VERSION="$(git describe --tags --always 2>/dev/null || echo dev)"
DATE="$(date -u +%Y-%m-%d)"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

# ==== Bundle 1 file ====
{
  echo "-- ============================================================"
  echo "-- PokeWorld — Mini World: CREATA | bản build $VERSION ($DATE)"
  echo "-- Paste toàn bộ file này vào 1 script Lua trong Developer Editor."
  echo "-- Mỗi module gốc được bọc trong khối do...end để tránh giới hạn"
  echo "-- 200 biến local mỗi chunk của Lua."
  echo "-- Nguồn: https://github.com/thanhtinz/Pokeworld"
  echo "-- ============================================================"
  echo
  for dir in $DIRS; do
    for f in "$dir"/*.lua; do
      echo "-- ========== $f =========="
      echo "do"
      cat "$f"
      echo
      echo "end"
      echo
    done
  done
} > "$BUNDLE"

# ==== Zip từng file (đổi / thành __ để giữ thứ tự tên khi import) ====
STAGE="$OUT_DIR/scripts"
mkdir -p "$STAGE"
for dir in $DIRS; do
  for f in "$dir"/*.lua; do
    cp "$f" "$STAGE/$(echo "$f" | tr '/' '_')"
  done
done
(cd "$OUT_DIR" && zip -q -r "$(basename "$ZIP")" scripts)
rm -rf "$STAGE"

# ==== Kiểm tra bundle: parse + load + smoke ====
luac -p "$BUNDLE"
lua - "$BUNDLE" <<'LUA'
local bundle = arg[1]
dofile(bundle)
local PW = _G.PW
assert(PW and PW.species and PW.battle and PW.creata, "bundle thieu module")
local n = 0; for _ in pairs(PW.species) do n = n + 1 end
assert(n >= 30, "bundle thieu species")
local mon = PW.pokemon.new(25, 20)
assert(mon and PW.pokemon.stats(mon).hp > 0, "pokemon.new hong trong bundle")
print(string.format("[build] bundle OK: %d species, %d moves", n, (function() local c=0 for _ in pairs(PW.moves) do c=c+1 end return c end)()))
LUA

echo "[build] xong:"
ls -la "$OUT_DIR"
