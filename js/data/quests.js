// PokeWorld H5 | data/quests.js | Dữ liệu nhiệm vụ (2 main, 4 side, 2 daily) và thưởng điểm danh

// kind: 'main' | 'side' | 'daily'
// goal.t: catch_any | catch_species | defeat_trainer | reach_zone | catch_count | win_battles
export const QUESTS = {
  // Nhiệm vụ chính
  main_starter: {
    kind: 'main',
    name: 'Người Bạn Đầu Tiên',
    desc: 'Hãy bắt Pokémon hoang dã đầu tiên của bạn để bắt đầu hành trình!',
    goal: { t: 'catch_any', n: 1 },
    reward: { money: 500, items: [{ id: 'poke_ball', n: 5 }] },
    next: 'main_gym1',
  },
  main_gym1: {
    kind: 'main',
    name: 'Thử Thách Nhà Thi Đấu Đá',
    desc: 'Đánh bại thủ lĩnh Brock ở thị trấn để giành Huy Hiệu Đá Tảng.',
    goal: { t: 'defeat_trainer', id: 'gym_brock' },
    reward: { money: 2000, items: [{ id: 'great_ball', n: 3 }, { id: 'super_potion', n: 2 }] },
    next: null,
  },

  // Nhiệm vụ phụ
  side_pikachu: {
    kind: 'side',
    name: 'Tia Chớp Vàng',
    desc: 'Nghe đồn có Pikachu xuất hiện gần Đường Số 1 và trong rừng. Hãy bắt một con!',
    goal: { t: 'catch_species', sp: 25 },
    reward: { money: 800, items: [{ id: 'thunder_stone', n: 1 }] },
  },
  side_forest: {
    kind: 'side',
    name: 'Khám Phá Rừng Xanh',
    desc: 'Tiến vào khu rừng phía bắc thị trấn để khám phá vùng đất mới.',
    goal: { t: 'reach_zone', zone: 'forest_1' },
    reward: { money: 300, items: [{ id: 'oran_berry', n: 5 }] },
  },
  side_bughunt: {
    kind: 'side',
    name: 'Vua Côn Trùng',
    desc: 'Đánh bại Tùng Bắt Bọ trong rừng để chứng minh ai mới là vua côn trùng.',
    goal: { t: 'defeat_trainer', id: 'bugcatcher_tung' },
    reward: { money: 600, items: [{ id: 'antidote', n: 3 }] },
  },
  side_magikarp: {
    kind: 'side',
    name: 'Cá Chép Hóa Rồng',
    desc: 'Bắt một con Magikarp ở hồ. Đừng coi thường nó, biết đâu sau này hoá rồng!',
    goal: { t: 'catch_species', sp: 129 },
    reward: { money: 500, items: [{ id: 'rare_candy', n: 1 }] },
  },

  // Nhiệm vụ hằng ngày
  daily_catch3: {
    kind: 'daily',
    name: 'Thợ Săn Trong Ngày',
    desc: 'Bắt 3 Pokémon hoang dã bất kỳ trong hôm nay.',
    goal: { t: 'catch_count', n: 3 },
    reward: { money: 400, items: [{ id: 'poke_ball', n: 3 }] },
  },
  daily_win5: {
    kind: 'daily',
    name: 'Chuỗi Chiến Thắng',
    desc: 'Thắng 5 trận đấu bất kỳ trong hôm nay.',
    goal: { t: 'win_battles', n: 5 },
    reward: { money: 600, items: [{ id: 'potion', n: 2 }] },
  },
};

// Bảng thưởng điểm danh 7 mốc (lặp lại theo chu kỳ khi streak > 7)
export const DAILY_REWARDS = [
  { money: 500, items: [{ id: 'poke_ball', n: 1 }] },
  { money: 700, items: [{ id: 'poke_ball', n: 2 }] },
  { money: 1000, items: [{ id: 'potion', n: 1 }] },
  { money: 1200, items: [{ id: 'poke_ball', n: 3 }] },
  { money: 1500, items: [{ id: 'potion', n: 2 }] },
  { money: 2000, items: [{ id: 'great_ball', n: 2 }] },
  { money: 3000, items: [{ id: 'rare_candy', n: 1 }] },
];
