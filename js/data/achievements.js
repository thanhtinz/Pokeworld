// TuxeWorld H5 | data/achievements.js | Bảng thành tựu
//
// Mỗi thành tựu gắn với MỘT biến của bản lưu (xem js/engine/achievements.js),
// đạt mốc là nhận thưởng một lần. Danh sách này viết tay chứ không sinh máy:
// nó là phần thiết kế trò chơi, không phải dữ liệu bê từ bản gốc sang.
//
// bien:   khoá trong bảng biến  ·  moc: con số cần đạt
// qua:    { tien, do: [{id, n}] }
// nhom:   để gom nhóm trên màn Thành tựu

export const NHOM_TEN = {
  batgiu: 'Bắt giữ',
  chien: 'Chiến đấu',
  hanhtrinh: 'Hành trình',
  suutam: 'Sưu tầm',
};

export const ACHIEVEMENTS = [
  // ==== Bắt giữ ====
  { id: 'bat_1', nhom: 'batgiu', ico: 'ball', ten: 'Cú ném đầu tiên',
    mo: 'Bắt được một Tuxemon hoang.', bien: 'catches', moc: 1,
    qua: { tien: 500, do: [{ id: 'tuxeball', n: 5 }] } },
  { id: 'bat_10', nhom: 'batgiu', ico: 'ball', ten: 'Tay bắt cứng',
    mo: 'Bắt đủ 10 Tuxemon.', bien: 'catches', moc: 10,
    qua: { tien: 2000, do: [{ id: 'tuxeball', n: 10 }] } },
  { id: 'bat_50', nhom: 'batgiu', ico: 'ball', ten: 'Thợ săn lão luyện',
    mo: 'Bắt đủ 50 Tuxemon.', bien: 'catches', moc: 50,
    qua: { tien: 8000, do: [{ id: 'tuxeball_hardened', n: 10 }] } },
  { id: 'bat_200', nhom: 'batgiu', ico: 'ball', ten: 'Ông trùm Tuxeball',
    mo: 'Bắt đủ 200 Tuxemon.', bien: 'catches', moc: 200,
    qua: { tien: 30000, do: [{ id: 'tuxeball_lavish', n: 10 }] } },

  // ==== Chiến đấu ====
  { id: 'thang_10', nhom: 'chien', ico: 'battle', ten: 'Quen tay',
    mo: 'Thắng 10 trận.', bien: 'wins', moc: 10,
    qua: { tien: 1500, do: [{ id: 'potion', n: 5 }] } },
  { id: 'thang_100', nhom: 'chien', ico: 'battle', ten: 'Bách chiến',
    mo: 'Thắng 100 trận.', bien: 'wins', moc: 100,
    qua: { tien: 12000, do: [{ id: 'super_potion', n: 10 }] } },
  { id: 'thang_500', nhom: 'chien', ico: 'battle', ten: 'Huyền thoại sàn đấu',
    mo: 'Thắng 500 trận.', bien: 'wins', moc: 500,
    qua: { tien: 60000, do: [{ id: 'imperial_potion', n: 5 }] } },
  { id: 'hh_1', nhom: 'chien', ico: 'trophy', ten: 'Huy hiệu đầu tay',
    mo: 'Thắng võ đường đầu tiên.', bien: 'badges', moc: 1,
    qua: { tien: 3000, do: [{ id: 'revive', n: 3 }] } },
  { id: 'hh_5', nhom: 'chien', ico: 'trophy', ten: 'Đủ bộ huy hiệu',
    mo: 'Thắng cả 5 võ đường.', bien: 'badges', moc: 5,
    qua: { tien: 50000, do: [{ id: 'cureall', n: 5 }] } },

  // ==== Hành trình ====
  { id: 'buoc_1k', nhom: 'hanhtrinh', ico: 'walk', ten: 'Rời khỏi nhà',
    mo: 'Đi 1.000 bước.', bien: 'steps', moc: 1000,
    qua: { tien: 1000, do: [{ id: 'potion', n: 3 }] } },
  { id: 'buoc_20k', nhom: 'hanhtrinh', ico: 'walk', ten: 'Chân đi không mỏi',
    mo: 'Đi 20.000 bước.', bien: 'steps', moc: 20000,
    qua: { tien: 10000, do: [{ id: 'alpha_seep', n: 5 }] } },
  { id: 'gio_10', nhom: 'hanhtrinh', ico: 'map', ten: 'Mười tiếng phiêu lưu',
    mo: 'Chơi đủ 10 giờ.', bien: 'gioChoi', moc: 10,
    qua: { tien: 8000, do: [{ id: 'mystery_tea', n: 3 }] } },
  { id: 'lv_10', nhom: 'hanhtrinh', ico: 'flag', ten: 'Huấn luyện viên cứng',
    mo: 'Đạt Trainer Lv.10.', bien: 'trainerLv', moc: 10,
    qua: { tien: 5000, do: [{ id: 'ancient_tea', n: 3 }] } },
  { id: 'lv_30', nhom: 'hanhtrinh', ico: 'flag', ten: 'Kỳ cựu',
    mo: 'Đạt Trainer Lv.30.', bien: 'trainerLv', moc: 30,
    qua: { tien: 25000, do: [{ id: 'imperial_tea', n: 3 }] } },

  // ==== Sưu tầm ====
  { id: 'gap_50', nhom: 'suutam', ico: 'book', ten: 'Sổ tay dày dần',
    mo: 'Gặp 50 loài trong Tuxedex.', bien: 'dexSeen', moc: 50,
    qua: { tien: 3000, do: [{ id: 'tuxeball', n: 10 }] } },
  { id: 'gap_200', nhom: 'suutam', ico: 'book', ten: 'Nhà tự nhiên học',
    mo: 'Gặp 200 loài trong Tuxedex.', bien: 'dexSeen', moc: 200,
    qua: { tien: 20000, do: [{ id: 'tuxeball_grand', n: 5 }] } },
  { id: 'batloai_25', nhom: 'suutam', ico: 'book', ten: 'Bộ sưu tập nhỏ',
    mo: 'Bắt đủ 25 loài khác nhau.', bien: 'dexCaught', moc: 25,
    qua: { tien: 6000, do: [{ id: 'super_potion', n: 5 }] } },
  { id: 'batloai_100', nhom: 'suutam', ico: 'book', ten: 'Bộ sưu tập lớn',
    mo: 'Bắt đủ 100 loài khác nhau.', bien: 'dexCaught', moc: 100,
    qua: { tien: 40000, do: [{ id: 'tuxeball_majestic', n: 5 }] } },
  { id: 'tien_100k', nhom: 'suutam', ico: 'coin', ten: 'Rủng rỉnh',
    mo: 'Có $100.000 trong người.', bien: 'money', moc: 100000,
    qua: { tien: 10000, do: [] } },
  { id: 'tien_1m', nhom: 'suutam', ico: 'coin', ten: 'Đại gia Tuxe',
    mo: 'Có $1.000.000 trong người.', bien: 'money', moc: 1000000,
    qua: { tien: 100000, do: [] } },
];

export const ACH_BY_ID = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));
