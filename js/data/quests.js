// TuxeWorld H5 | data/quests.js | Dữ liệu nhiệm vụ (2 main, 4 side, 2 daily) và thưởng điểm danh

// kind: 'main' | 'side' | 'daily'
// goal.t: catch_any | catch_species | defeat_trainer | reach_zone | catch_count | win_battles
export const QUESTS = {
  main_starter: {
    kind: 'main',
    name: 'Người Bạn Đầu Tiên',
    desc: 'Hãy bắt Tuxemon hoang dã đầu tiên của bạn để bắt đầu hành trình!',
    goal: { t: 'catch_any', n: 1 },
    reward: { money: 500, items: [{ id: 'tuxeball', n: 5 }] },
    next: 'main_gym1',
  },
  main_gym1: {
    kind: 'main',
    name: 'Thử Thách Võ Đường Đất',
    desc: 'Đánh bại Thạch ở Thị Trấn Taba để giành Huy Hiệu Đá.',
    goal: { t: 'defeat_trainer', id: 'gym_brock' },
    reward: { money: 2000, items: [{ id: 'tuxeball_lavish', n: 3 }, { id: 'super_potion', n: 2 }] },
    next: null,
  },

  side_pikachu: {
    kind: 'side',
    name: 'Chim Lửa Đường Số 1',
    desc: 'Nghe nói Cardiling hay đậu trên hàng rào Đường Số 1. Hãy bắt một con!',
    goal: { t: 'catch_species', sp: 80 },
    reward: { money: 800, items: [{ id: 'fire_booster', n: 1 }] },
  },
  side_forest: {
    kind: 'side',
    name: 'Khám Phá Dryadsgrove',
    desc: 'Tiến vào rừng Dryadsgrove phía bắc thị trấn để khám phá vùng đất mới.',
    goal: { t: 'reach_zone', zone: 'dryadsgrove' },
    reward: { money: 300, items: [{ id: 'potion', n: 5 }] },
  },
  side_bughunt: {
    kind: 'side',
    name: 'Vua Côn Trùng',
    desc: 'Đánh bại Tùng Bắt Bọ trong rừng Dryadsgrove để chứng minh ai mới là vua côn trùng.',
    goal: { t: 'defeat_trainer', id: 'bugcatcher_tung' },
    reward: { money: 600, items: [{ id: 'restoration', n: 3 }] },
  },
  side_magikarp: {
    kind: 'side',
    name: 'Đốm Lửa Giữa Rừng',
    desc: 'Người ta đồn thấy Bursa cháy sáng trong rừng Dryadsgrove. Bắt một con xem thực hư!',
    goal: { t: 'catch_species', sp: 101 },
    reward: { money: 500, items: [{ id: 'lucky_bamboo', n: 1 }] },
  },

  daily_catch3: {
    kind: 'daily',
    name: 'Thợ Săn Trong Ngày',
    desc: 'Bắt 3 Tuxemon hoang dã bất kỳ trong hôm nay.',
    goal: { t: 'catch_count', n: 3 },
    reward: { money: 400, items: [{ id: 'tuxeball', n: 3 }] },
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
  { money: 500, items: [{ id: 'tuxeball', n: 1 }] },
  { money: 700, items: [{ id: 'tuxeball', n: 2 }] },
  { money: 1000, items: [{ id: 'potion', n: 1 }] },
  { money: 1200, items: [{ id: 'tuxeball', n: 3 }] },
  { money: 1500, items: [{ id: 'potion', n: 2 }] },
  { money: 2000, items: [{ id: 'tuxeball_lavish', n: 2 }] },
  { money: 3000, items: [{ id: 'lucky_bamboo', n: 1 }] },
];
