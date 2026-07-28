// TuxeWorld H5 | ui/icons.js | Icon giao diện vẽ bằng SVG
//
// Trước đây mọi nút trong giao diện đều mượn tạm sprite vật phẩm Tuxemon, nên
// nhiều chỗ khác nghĩa nhau lại dùng chung một ảnh (cục vàng vừa là tiền vừa là
// bảng xếp hạng...). Bộ icon này vẽ bằng SVG nên mỗi chức năng có hình riêng,
// ăn theo màu chữ hiện hành và nét luôn sắc ở mọi cỡ.
//
// itemIcon() vẫn giữ nguyên cho những chỗ ẢNH CHÍNH LÀ VẬT PHẨM (túi đồ, cửa
// hàng) — ở đó dùng sprite thật mới đúng.
//
// Từ bản này: chức năng nào Tuxemon có sẵn ảnh giao diện (ba lô, nhật ký, nhân
// vật, cài đặt, đội hình, tầm đánh, trạng thái) thì DÙNG ẢNH CỦA GAME; chỉ chức
// năng nào bản gốc không có ảnh mới vẽ bằng SVG.

const P = {
  // Bản đồ / đi lại
  map: '<path d="M3 6 9 3l6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/>',
  walk: '<path d="M13 4a2 2 0 1 0 0-.01"/><path d="M11 8 8 12l3 2 1 7"/><path d="M14 10l3 2 3-1"/><path d="M11 14l-3 7"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
  // Đội hình / túi / nhân vật
  team: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 6a3 3 0 0 1 0 6"/><path d="M17 20a6 6 0 0 0-2-4"/>',
  bag: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  person: '<circle cx="12" cy="7" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z"/><path d="M8 7h7M8 11h7"/>',
  // Menu
  quest: '<path d="M6 3h12v18H6z"/><path d="m9 9 1.5 1.5L13 8"/><path d="m9 15 1.5 1.5L13 14"/>',
  shop: '<path d="M4 8h16l-1.2 11H5.2L4 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/><path d="M4 8 6 4h12l2 4"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v1a3 3 0 0 0 3 3"/><path d="M17 6h3v1a3 3 0 0 1-3 3"/><path d="M10 14v3h4v-3"/><path d="M8 21h8"/>',
  guild: '<path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z"/><path d="m9 12 2 2 4-4"/>',
  friends: '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20a6 6 0 0 1 12 0"/><path d="M15 20a5 5 0 0 1 7-4"/>',
  heart: '<path d="M12 20s-7-4.4-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7 2.8C19 15.6 12 20 12 20Z"/>',
  server: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>',
  gift: '<path d="M4 11h16v9H4z"/><path d="M3 7h18v4H3z"/><path d="M12 7v13"/><path d="M12 7S9 3 7 4.5 9 7 12 7Zm0 0s3-4 5-2.5S15 7 12 7Z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4V5Z"/>',
  // Hành động trong game
  heal: '<path d="M12 5v14M5 12h14"/>',
  battle: '<path d="m5 5 10 10M4 18l4-1 1-4"/><path d="m19 5-10 10M20 18l-4-1-1-4"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M10 10h3a2 2 0 0 1 0 4h-3"/>',
  ball: '<circle cx="12" cy="12" r="8"/><path d="M4 12h5M15 12h5"/><circle cx="12" cy="12" r="2.5"/>',
  swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
  run: '<path d="M13 4a1.7 1.7 0 1 0 0-.01"/><path d="m10 21 2-6-3-3 1-4 3 3 3 1"/><path d="M4 12h3M4 16h4"/>',
  // Ô trang bị (mỗi ô một hình riêng, thay cho sprite vật phẩm mờ nhìn giống hệt nhau)
  slot_hat: '<path d="M4 16h16l-1-2a7 7 0 0 0-14 0l-1 2Z"/><path d="M3 16h18v3H3z"/>',
  slot_outfit: '<path d="M9 4 6 6 4 10l3 1v9h10v-9l3-1-2-4-3-2-3 2-3-2Z"/>',
  slot_gloves: '<path d="M7 20V9a2 2 0 0 1 4 0V4a1.6 1.6 0 0 1 3 0v5a1.6 1.6 0 0 1 3 0v8a4 4 0 0 1-4 4H7Z"/>',
  slot_shoes: '<path d="M3 16V8h4l3 3 5 2 5 1v2H3Z"/><path d="M3 16h19v3H3z"/>',
  slot_bag: '<path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M8 13h8"/>',
  slot_skin: '<path d="M9 3 5 5v6h3v10h8V11h3V5l-4-2-3 2-3-2Z"/><path d="M9 3a3 3 0 0 0 6 0"/>',
  flag: '<path d="M6 21V4"/><path d="M6 5h12l-2.5 4L18 13H6"/>',
};

// Chỗ nào Tuxemon có sẵn ảnh thì DÙNG ẢNH GAME, không có mới lấy ảnh pixel tự
// vẽ (tools/mkicons.py). Icon SVG chỉ còn là lưới an toàn cho tên nào chưa có
// ảnh — trước đây nét SVG mảnh đặt cạnh art pixel của Tuxemon nhìn lệch tông.
// Ảnh nằm trong assets/ui, do tools/mkui.py chép sang từ gfx/ui của bản gốc.
const ART = {
  bag: 'assets/ui/bag.png',        // ba lô
  book: 'assets/ui/book.png',      // nhật ký -> Tuxedex
  gear: 'assets/ui/gear.png',      // cài đặt
  team: 'assets/ui/team.png',      // đội hình
  // 'person' của bản gốc là bóng người đen thui, chìm nghỉm trên nền tối —
  // tools/mkui.py đổi tông sang màu sáng rồi mới chép sang.
  person: 'assets/ui/person.png',
  exit: 'assets/ui/exit.png',      // thoát / đăng xuất
  save: 'assets/ui/save.png',      // lưu
};

// Icon pixel tự vẽ — tools/mkicons.py sinh ra assets/ui/icon/<tên>.png.
// Danh sách phải khớp ICONS bên tệp đó.
const VE = new Set(['coin', 'map', 'chat', 'gift', 'quest', 'shop', 'trophy',
                    'guild', 'friends', 'heart', 'flag', 'server', 'heal',
                    'battle', 'walk', 'star']);

// size = px, cls thêm class ngoài
export function uiIcon(name, size = 22, cls = '') {
  const art = ART[name] || (VE.has(name) ? `assets/ui/icon/${name}.png` : null);
  if (art) {
    return `<span class="ui-ico ui-art ${cls}" style="width:${size}px;height:${size}px"
      ><img src="${art}" width="${size}" height="${size}" alt="" aria-hidden="true"></span>`;
  }
  const d = P[name];
  if (!d) return '';
  return `<span class="ui-ico ${cls}" style="width:${size}px;height:${size}px">
    <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none"
         stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true">${d}</svg>
  </span>`;
}

// Icon tầm đánh của chiêu (ảnh gốc Tuxemon, rộng gấp ~4 lần chiều cao)
export function rangeIcon(range, h = 12) {
  if (!range || !['melee', 'touch', 'ranged', 'reach', 'reliable'].includes(range)) return '';
  return `<img class="range-ico" src="assets/ui/range/${range}.png" height="${h}" alt="${range}"
    onerror="this.remove()">`;
}

// Mũi tên tốc độ của chiêu (-3 chậm nhất .. +3 nhanh nhất) — ảnh gfx/ui/icons/speed.
// Chiêu tốc độ thường (0) thì không cần hiện, đỡ rối mắt.
const TOC_VI = { '-3': 'Cực chậm', '-2': 'Rất chậm', '-1': 'Chậm', 0: 'Thường',
  1: 'Nhanh', 2: 'Rất nhanh', 3: 'Cực nhanh' };

export function speedIcon(speed, h = 11) {
  const n = Number(speed) || 0;
  if (!n) return '';
  return `<img class="speed-ico" src="assets/ui/speed/${n}.png" height="${h}"
    alt="${TOC_VI[n]}" title="${TOC_VI[n]}" onerror="this.remove()">`;
}

// Icon trạng thái (bỏng, độc, ngủ, tê, băng)
export function statusIcon(st, size = 14) {
  if (!st) return '';
  return `<img class="status-ico" src="assets/ui/status/${st}.png" width="${size}" height="${size}"
    alt="" onerror="this.remove()">`;
}

export const hasIcon = (name) => !!P[name];
