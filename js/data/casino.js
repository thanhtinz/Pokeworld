// TuxeWorld H5 | data/casino.js | Chỗ đặt máy trong sảnh bạc
// SINH TU DONG boi tools/casino.py — KHONG SUA TAY.

export const SANH = 'sanh_bac';

// Ô nào đứng quay mặt vào thì bấm A chơi được trò đó
export const MAY = [
  { tro: "slots", ten: "Máy Quay", x: 3, y: 5 },
  { tro: "slots", ten: "Máy Quay", x: 5, y: 5 },
  { tro: "slots", ten: "Máy Quay", x: 7, y: 5 },
  { tro: "coinflip", ten: "Sấp Ngửa", x: 18, y: 5 },
  { tro: "coinflip", ten: "Sấp Ngửa", x: 20, y: 5 },
  { tro: "blackjack", ten: "Xì Dách", x: 2, y: 11 },
  { tro: "blackjack", ten: "Xì Dách", x: 3, y: 11 },
  { tro: "blackjack", ten: "Xì Dách", x: 4, y: 11 },
  { tro: "blackjack", ten: "Xì Dách", x: 5, y: 11 },
  { tro: "blackjack", ten: "Xì Dách", x: 6, y: 11 },
  { tro: "blackjack", ten: "Xì Dách", x: 7, y: 11 },
  { tro: "blackjack", ten: "Xì Dách", x: 8, y: 11 },
  { tro: "tienlen", ten: "Tiến Lên", x: 17, y: 11 },
  { tro: "tienlen", ten: "Tiến Lên", x: 18, y: 11 },
  { tro: "tienlen", ten: "Tiến Lên", x: 19, y: 11 },
  { tro: "tienlen", ten: "Tiến Lên", x: 20, y: 11 },
  { tro: "tienlen", ten: "Tiến Lên", x: 21, y: 11 },
  { tro: "tienlen", ten: "Tiến Lên", x: 22, y: 11 },
  { tro: "tienlen", ten: "Tiến Lên", x: 23, y: 11 },
  { tro: "domino", ten: "Đô-mi-nô", x: 4, y: 16 },
  { tro: "domino", ten: "Đô-mi-nô", x: 5, y: 16 },
  { tro: "domino", ten: "Đô-mi-nô", x: 6, y: 16 },
];

export const MAY_TAI = (x, y) =>
  MAY.find(m => m.x === x && m.y === y) || null;

