// PokeWorld H5 | ui/icons.js | Icon giao diện vẽ bằng SVG
//
// Trước đây mọi nút trong giao diện đều mượn tạm sprite vật phẩm Pokémon, nên
// nhiều chỗ khác nghĩa nhau lại dùng chung một ảnh (cục vàng vừa là tiền vừa là
// bảng xếp hạng...). Bộ icon này vẽ bằng SVG nên mỗi chức năng có hình riêng,
// ăn theo màu chữ hiện hành và nét luôn sắc ở mọi cỡ.
//
// itemIcon() vẫn giữ nguyên cho những chỗ ẢNH CHÍNH LÀ VẬT PHẨM (túi đồ, cửa
// hàng, ô trang bị) — ở đó dùng sprite thật mới đúng.

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
  flag: '<path d="M6 21V4"/><path d="M6 5h12l-2.5 4L18 13H6"/>',
};

// size = px, cls thêm class ngoài
export function uiIcon(name, size = 22, cls = '') {
  const d = P[name];
  if (!d) return '';
  return `<span class="ui-ico ${cls}" style="width:${size}px;height:${size}px">
    <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none"
         stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true">${d}</svg>
  </span>`;
}

export const hasIcon = (name) => !!P[name];
