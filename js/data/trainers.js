// PokeWorld H5 | data/trainers.js | Dữ liệu NPC trainer và gym leader (thoại tiếng Việt)

// kind: 'trainer' | 'gym'
export const TRAINERS = {
  // Trainer thường
  youngster_minh: {
    sprite: 'youngster', name: 'Youngster Joey', kind: 'trainer', zone: 'route_1',
    party: [{ sp: 19, lv: 5 }, { sp: 16, lv: 6 }],
    rewardMoney: 200,
    intro: 'Ê bạn! Mình mới bắt được Pokémon đấy, đấu thử một trận nhé!',
    lose: 'Ôi thua rồi... Rattata của mình đã cố hết sức mà!',
  },
  lass_lan: {
    sprite: 'lass', name: 'Lass Nina', kind: 'trainer', zone: 'route_1',
    party: [{ sp: 10, lv: 5 }, { sp: 43, lv: 6 }],
    rewardMoney: 220,
    intro: 'Pokémon của mình dễ thương lắm, nhưng đừng tưởng chúng yếu nha!',
    lose: 'Hứ, lần sau mình sẽ không thua đâu!',
  },
  bugcatcher_tung: {
    sprite: 'bug_catcher', name: 'Bug Catcher Rick', kind: 'trainer', zone: 'forest_1',
    party: [{ sp: 10, lv: 7 }, { sp: 11, lv: 8 }, { sp: 12, lv: 9 }],
    rewardMoney: 350,
    intro: 'Khu rừng này là lãnh địa của mình! Xem sức mạnh côn trùng đây!',
    lose: 'Không thể nào! Butterfree của mình mà cũng thua sao...',
  },
  hiker_dung: {
    sprite: 'camper', name: 'Camper Ethan', kind: 'trainer', zone: 'cave_1',
    party: [{ sp: 74, lv: 10 }, { sp: 66, lv: 11 }],
    rewardMoney: 500,
    intro: 'Ha ha! Trong hang này, Pokémon đá của ta là vô địch!',
    lose: 'Chà, cháu khá lắm! Đá cứng mấy cũng có ngày vỡ mà.',
  },

  // Gym leader
  gym_brock: {
    sprite: 'brock', name: 'Brock', kind: 'gym', zone: 'town_1',
    badge: 'badge_boulder', badgeName: 'Huy Hiệu Đá Tảng',
    party: [{ sp: 74, lv: 12 }, { sp: 75, lv: 14 }],
    rewardMoney: 1500, rewardItem: { id: 'potion', n: 3 },
    intro: 'Ta là Brock, chuyên gia Pokémon hệ Đá! Ý chí của ta cứng như đá tảng, cháu có phá nổi không?',
    lose: 'Xuất sắc! Cháu đã chứng minh được sức mạnh của mình. Hãy nhận Huy Hiệu Đá Tảng!',
  },
  gym_thuy: {
    sprite: 'misty', name: 'Misty', kind: 'gym', zone: 'lake_1',
    badge: 'badge_cascade', badgeName: 'Huy Hiệu Thác Nước',
    party: [{ sp: 8, lv: 18 }, { sp: 130, lv: 21 }],
    rewardMoney: 2100, rewardItem: { id: 'super_potion', n: 2 },
    intro: 'Chào mừng đến hồ nước của Misty! Sóng lớn sắp cuốn cậu đi đấy, chuẩn bị chưa?',
    lose: 'Tuyệt vời! Cậu đã vượt qua cơn sóng dữ. Huy Hiệu Thác Nước là của cậu!',
  },

  // ==== Trainer cốt truyện (đội rival do engine/story.js quyết theo starter) ====
  rival_1: {
    sprite: 'rival', name: 'Blue', kind: 'rival', zone: 'route_1', story: true,
    party: [{ sp: 4, lv: 6 }], // placeholder — thay bằng rivalTeam('rival_1') lúc vào trận
    rewardMoney: 300,
    intro: 'Xem Pokémon của ai mạnh hơn nào! Đừng khóc nếu thua đấy!',
    lose: 'Hừm! Chỉ là may mắn thôi!',
  },
  rival_2: {
    sprite: 'rival', name: 'Blue', kind: 'rival', zone: 'route_2', story: true,
    party: [{ sp: 18, lv: 30 }, { sp: 26, lv: 31 }, { sp: 130, lv: 32 }, { sp: 6, lv: 34 }],
    rewardMoney: 5000,
    intro: 'Trận cuối cùng! Người thắng sẽ là Nhà Vô Địch. Tớ không nhường đâu!',
    lose: 'Thua tâm phục khẩu phục... Cậu xứng đáng là Nhà Vô Địch!',
  },
  rocket_1: {
    sprite: 'rocket_m', name: 'Rocket Grunt', kind: 'rocket', zone: 'forest_1', story: true,
    party: [{ sp: 41, lv: 8 }, { sp: 19, lv: 9 }],
    rewardMoney: 600,
    intro: 'Chỗ này là địa bàn của Băng Hỏa Tiễn! Muốn qua thì bước qua xác Zubat của ta đã!',
    lose: 'Nhóc này mạnh thật... Rút lui!',
  },
  rocket_2: {
    sprite: 'rocket_f', name: 'Rocket Duo', kind: 'rocket', zone: 'cave_1', story: true,
    party: [{ sp: 41, lv: 13 }, { sp: 74, lv: 14 }, { sp: 20, lv: 15 }],
    rewardMoney: 1200,
    intro: 'Lần này bọn ta có hai người, xem mày làm gì được!',
    lose: 'Không thể tin được! Trùm ơi cứu em!!',
  },
  rocket_boss: {
    sprite: 'giovanni', name: 'Giovanni', kind: 'rocket', zone: 'lake_1', story: true,
    party: [{ sp: 42, lv: 18 }, { sp: 75, lv: 19 }, { sp: 130, lv: 21 }],
    rewardMoney: 3000,
    intro: 'Ta sẽ cho mày thấy sức mạnh THẬT SỰ của Băng Hỏa Tiễn!',
    lose: 'Thua... thua một đứa nhóc?! RÚT LUI!',
  },
};