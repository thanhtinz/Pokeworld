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

  // ======================================================================
  // ==== MỞ RỘNG CHIẾN DỊCH — 8 Gym Kanto, Elite Four, Champion, Rocket ====
  // ======================================================================

  // ---- Gym Leader 3..8 (Brock & Misty đã có ở trên) ----
  gym_surge: {
    sprite: 'cooltrainer_m', name: 'Lt. Surge', kind: 'gym', zone: 'city_thunder',
    badge: 'badge_thunder', badgeName: 'Huy Hiệu Sấm Sét',
    party: [{ sp: 100, lv: 22 }, { sp: 25, lv: 22 }, { sp: 26, lv: 24 }],
    rewardMoney: 2600, rewardItem: { id: 'thunder_stone', n: 1 },
    intro: 'Nhóc con! Ngoài chiến trường, điện của ta đã cứu mạng ta hàng trăm lần. Chịu nổi một cú giật không?',
    lose: 'Ha ha ha! Gan dạ đấy nhóc! Cầm lấy Huy Hiệu Sấm Sét — cháu đã kiếm được nó.',
  },
  gym_erika: {
    sprite: 'lass', name: 'Erika', kind: 'gym', zone: 'city_rainbow',
    badge: 'badge_rainbow', badgeName: 'Huy Hiệu Cầu Vồng',
    party: [{ sp: 114, lv: 27 }, { sp: 70, lv: 27 }, { sp: 45, lv: 29 }],
    rewardMoney: 3200, rewardItem: { id: 'leaf_stone', n: 1 },
    intro: 'Xin chào... Tôi là Erika, tôi dạy nghệ thuật cắm hoa. Hương thơm của cỏ cây cũng có thể là vũ khí đấy.',
    lose: 'Tôi đã thua... nhưng thật vui. Huy Hiệu Cầu Vồng xin trao lại cho bạn.',
  },
  gym_koga: {
    sprite: 'rocket_m', name: 'Koga', kind: 'gym', zone: 'city_fuchsia', // sprite tạm: rocket_m (ninja áo đen)
    badge: 'badge_soul', badgeName: 'Huy Hiệu Linh Hồn',
    party: [{ sp: 109, lv: 31 }, { sp: 89, lv: 31 }, { sp: 49, lv: 32 }, { sp: 110, lv: 33 }],
    rewardMoney: 3800, rewardItem: { id: 'full_heal', n: 3 },
    intro: 'Ta là Koga, ninja của Phòng Gym độc. Sương mù và chất độc sẽ bào mòn cháu trước khi cháu chạm được vào ta!',
    lose: 'Ngươi đã nhìn thấu màn sương... Nhận lấy Huy Hiệu Linh Hồn, nhà huấn luyện trẻ.',
  },
  gym_sabrina: {
    sprite: 'channeler', name: 'Sabrina', kind: 'gym', zone: 'city_saffron', // sprite tạm: channeler
    badge: 'badge_marsh', badgeName: 'Huy Hiệu Đầm Lầy',
    party: [{ sp: 64, lv: 35 }, { sp: 122, lv: 35 }, { sp: 49, lv: 36 }, { sp: 65, lv: 37 }],
    rewardMoney: 4400, rewardItem: { id: 'hyper_potion', n: 3 },
    intro: 'Ta đã thấy trước trận đấu này từ ba ngày trước. Ta cũng đã thấy cháu quỳ gối. Hãy chứng minh tương lai có thể đổi khác.',
    lose: 'Tương lai... đã đổi. Lần đầu tiên ta vui vì mình đoán sai. Huy Hiệu Đầm Lầy là của cháu.',
  },
  gym_blaine: {
    sprite: 'camper', name: 'Blaine', kind: 'gym', zone: 'island_cinnabar', // sprite tạm: camper
    badge: 'badge_volcano', badgeName: 'Huy Hiệu Núi Lửa',
    party: [{ sp: 58, lv: 39 }, { sp: 77, lv: 39 }, { sp: 78, lv: 40 }, { sp: 59, lv: 41 }],
    rewardMoney: 5000, rewardItem: { id: 'fire_stone', n: 1 },
    intro: 'Đố vui đây! Ta là ai? Đáp án: kẻ sẽ thiêu rụi đội hình của cháu! Ha ha, ta là Blaine!',
    lose: 'Cháu dập tắt được ngọn lửa của ta rồi! Câu đố cuối cùng có đáp án là: Huy Hiệu Núi Lửa.',
  },
  gym_giovanni: {
    sprite: 'giovanni', name: 'Giovanni', kind: 'gym', zone: 'city_viridian',
    badge: 'badge_earth', badgeName: 'Huy Hiệu Đất Trời',
    party: [{ sp: 111, lv: 43 }, { sp: 51, lv: 43 }, { sp: 34, lv: 44 }, { sp: 112, lv: 45 }],
    rewardMoney: 6000, rewardItem: { id: 'ultra_ball', n: 5 },
    intro: 'Lâu rồi không gặp, nhóc con. Ngươi tưởng Chủ Gym cuối cùng của Kanto là ai? Ta đã đợi ngươi ngay tại đây.',
    lose: 'Ta thua... lần này là thua thật. Team Rocket giải tán từ hôm nay. Cầm Huy Hiệu Đất Trời và đi tiếp đi.',
  },

  // ---- Elite Four & Champion ----
  elite_lorelei: {
    sprite: 'swimmer_f', name: 'Lorelei', kind: 'gym', zone: 'league_1', story: true,
    party: [{ sp: 87, lv: 48 }, { sp: 91, lv: 49 }, { sp: 124, lv: 49 }, { sp: 80, lv: 50 }, { sp: 131, lv: 51 }],
    rewardMoney: 7000, rewardItem: { id: 'hyper_potion', n: 3 },
    intro: 'Ta là Lorelei của Bộ Tứ Elite. Băng giá không chỉ làm chậm Pokémon — nó làm chậm cả suy nghĩ của ngươi.',
    lose: 'Ngươi giữ được cái đầu lạnh hơn cả ta. Đi tiếp đi, phòng kế tiếp đang chờ.',
  },
  elite_bruno: {
    sprite: 'cooltrainer_m', name: 'Bruno', kind: 'gym', zone: 'league_1', story: true,
    party: [{ sp: 95, lv: 50 }, { sp: 107, lv: 51 }, { sp: 106, lv: 51 }, { sp: 95, lv: 52 }, { sp: 68, lv: 53 }],
    rewardMoney: 7500, rewardItem: { id: 'max_potion', n: 2 },
    intro: 'HỰC! Ta là Bruno. Ta và Pokémon rèn luyện cùng nhau mỗi ngày. Cơ bắp không biết nói dối!',
    lose: 'Sao lại thế... Ta còn phải rèn nhiều hơn nữa. Đi đi, đừng để Agatha phải đợi.',
  },
  elite_agatha: {
    sprite: 'channeler', name: 'Agatha', kind: 'gym', zone: 'league_1', story: true,
    party: [{ sp: 93, lv: 52 }, { sp: 42, lv: 52 }, { sp: 24, lv: 53 }, { sp: 110, lv: 54 }, { sp: 94, lv: 55 }],
    rewardMoney: 8000, rewardItem: { id: 'revive', n: 3 },
    intro: 'Oak cứ khen ngươi mãi. Hồi trẻ hắn cũng là một tay đấu ra trò... trước khi hắn đổi bóng ma lấy sách vở.',
    lose: 'Hừ! Bà già này thua rồi. Nhưng nói cho Oak biết: ta vẫn chưa hết thời đâu!',
  },
  elite_lance: {
    sprite: 'red', name: 'Lance', kind: 'gym', zone: 'league_1', story: true, // sprite tạm: red (áo choàng đỏ)
    party: [{ sp: 130, lv: 55 }, { sp: 148, lv: 56 }, { sp: 148, lv: 56 }, { sp: 142, lv: 57 }, { sp: 149, lv: 58 }],
    rewardMoney: 9000, rewardItem: { id: 'max_potion', n: 3 },
    intro: 'Ta là Lance, kẻ thuần rồng. Không ai vượt qua ta mà chưa hiểu thế nào là sức mạnh tuyệt đối.',
    lose: 'Rồng của ta đã gục... Ngươi xứng đáng bước vào căn phòng cuối cùng. Nhà Vô Địch đang chờ.',
  },
  champion_blue: {
    sprite: 'rival', name: 'Champion Blue', kind: 'rival', zone: 'league_1', story: true,
    party: [{ sp: 18, lv: 58 }, { sp: 65, lv: 59 }, { sp: 112, lv: 59 }, { sp: 59, lv: 60 }, { sp: 103, lv: 60 }, { sp: 6, lv: 62 }],
    rewardMoney: 20000, rewardItem: { id: 'rare_candy', n: 3 },
    intro: 'Hê hê! Ngạc nhiên chưa? Tớ tới đây trước cậu và đã đánh bại Bộ Tứ Elite. Tớ là NHÀ VÔ ĐỊCH.',
    lose: 'Sao lại là cậu... Tớ đã chọn Pokémon mạnh nhất, nhưng cậu chọn những người bạn tốt nhất.',
  },

  // ---- Rival trung gian ----
  rival_3: {
    sprite: 'rival', name: 'Blue', kind: 'rival', zone: 'route_3', story: true,
    party: [{ sp: 17, lv: 20 }, { sp: 64, lv: 20 }, { sp: 58, lv: 21 }, { sp: 5, lv: 22 }],
    rewardMoney: 2200,
    intro: 'Lại gặp nhau! Nghe nói cậu vừa hạ Misty à? Tớ hạ bà ấy từ tuần trước rồi, nhóc chậm chân.',
    lose: 'Cái gì?! Được, tớ đi luyện tiếp. Lần sau đừng hòng.',
  },
  rival_4: {
    sprite: 'rival', name: 'Blue', kind: 'rival', zone: 'lighthouse_1', story: true,
    party: [{ sp: 18, lv: 36 }, { sp: 130, lv: 37 }, { sp: 65, lv: 37 }, { sp: 103, lv: 38 }, { sp: 6, lv: 39 }],
    rewardMoney: 6000, rewardItem: { id: 'super_potion', n: 5 },
    intro: 'Đội hình của tớ giờ đã hoàn chỉnh. Trận này không còn là trò trẻ con nữa đâu!',
    lose: 'Ha... cậu vẫn đi trước tớ một bước. Nhưng đích đến là Indigo Plateau — hẹn gặp ở đó!',
  },

  // ---- Team Rocket mở rộng ----
  rocket_admin_1: {
    sprite: 'rocket_f', name: 'Rocket Admin Ariana', kind: 'rocket', zone: 'tower_radio', story: true,
    party: [{ sp: 42, lv: 28 }, { sp: 20, lv: 28 }, { sp: 97, lv: 30 }],
    rewardMoney: 4000, rewardItem: { id: 'great_ball', n: 5 },
    intro: 'Sóng phát thanh này sẽ khiến mọi Pokémon trong vùng phát điên và nghe lệnh chúng ta. Đừng xen vào!',
    lose: 'Cái tháp... hỏng rồi! Boss sẽ không tha cho tôi đâu...',
  },
  rocket_admin_2: {
    sprite: 'rocket_m', name: 'Rocket Admin Archer', kind: 'rocket', zone: 'city_saffron', story: true,
    party: [{ sp: 110, lv: 34 }, { sp: 24, lv: 34 }, { sp: 115, lv: 35 }, { sp: 97, lv: 36 }],
    rewardMoney: 5200, rewardItem: { id: 'ultra_ball', n: 3 },
    intro: 'Tòa nhà Silph là của Team Rocket rồi. Chỉ cần bản thiết kế đó, cả Kanto sẽ quỳ gối!',
    lose: 'Không thể... chúng tôi đã lên kế hoạch suốt ba năm!',
  },
  rocket_grunt_3: {
    sprite: 'rocket_m', name: 'Rocket Grunt', kind: 'rocket', zone: 'tower_radio',
    party: [{ sp: 23, lv: 25 }, { sp: 88, lv: 26 }],
    rewardMoney: 1400,
    intro: 'Cầu thang này cấm người ngoài! Biến đi!',
    lose: 'Đau quá... sao tụi nhóc bây giờ mạnh vậy trời...',
  },
  rocket_grunt_4: {
    sprite: 'rocket_f', name: 'Rocket Grunt', kind: 'rocket', zone: 'city_saffron',
    party: [{ sp: 109, lv: 30 }, { sp: 20, lv: 31 }, { sp: 42, lv: 31 }],
    rewardMoney: 1800,
    intro: 'Nhân viên Silph bị nhốt hết rồi. Mày muốn vào cùng họ à?',
    lose: 'Thôi... tôi nghỉ việc Team Rocket đây.',
  },

  // ---- Trainer thường rải zone mới ----
  sailor_route3: {
    sprite: 'swimmer_f', name: 'Swimmer Marina', kind: 'trainer', zone: 'route_3',
    party: [{ sp: 72, lv: 18 }, { sp: 118, lv: 19 }],
    rewardMoney: 700,
    intro: 'Nước ở đoạn này sâu lắm đó, bạn bơi được không?',
    lose: 'Bạn khỏe thật! Cho mình nghỉ chút nha.',
  },
  camper_route3: {
    sprite: 'camper_e', name: 'Camper Liam', kind: 'trainer', zone: 'route_3',
    party: [{ sp: 56, lv: 19 }, { sp: 21, lv: 19 }, { sp: 27, lv: 20 }],
    rewardMoney: 750,
    intro: 'Cắm trại ba đêm rồi, tay mình ngứa đánh nhau quá!',
    lose: 'Được rồi được rồi, mình về lều đây.',
  },
  cool_thunder: {
    sprite: 'psychic_m', name: 'Psychic Preston', kind: 'trainer', zone: 'city_thunder',
    party: [{ sp: 81, lv: 23 }, { sp: 100, lv: 23 }, { sp: 82, lv: 25 }],
    rewardMoney: 1100, rewardItem: { id: 'super_potion', n: 2 },
    intro: 'Thành phố cảng này chạy bằng điện. Và mình cũng vậy!',
    lose: 'Hết pin rồi... cậu giỏi lắm.',
  },
  lass_rainbow: {
    sprite: 'picnicker', name: 'Picnicker Hazel', kind: 'trainer', zone: 'city_rainbow',
    party: [{ sp: 44, lv: 26 }, { sp: 70, lv: 26 }, { sp: 71, lv: 28 }],
    rewardMoney: 1200,
    intro: 'Vườn hoa của Erika đẹp lắm, nhưng đừng hái trộm nhé!',
    lose: 'Hic, mình chăm cây giỏi hơn đánh nhau...',
  },
  channeler_tower: {
    sprite: 'hex_maniac', name: 'Hex Maniac Tammy', kind: 'trainer', zone: 'tower_radio',
    party: [{ sp: 92, lv: 27 }, { sp: 93, lv: 29 }],
    rewardMoney: 1300,
    intro: 'Ta nghe thấy tiếng khóc của Pokémon trong bức tường này... ngươi có nghe không?',
    lose: 'Linh hồn đã yên nghỉ... cảm ơn ngươi.',
  },
  swimmer_light: {
    sprite: 'swimmer_m', name: 'Swimmer Douglas', kind: 'trainer', zone: 'lighthouse_1',
    party: [{ sp: 120, lv: 33 }, { sp: 116, lv: 33 }, { sp: 121, lv: 35 }],
    rewardMoney: 1600, rewardItem: { id: 'water_stone', n: 1 },
    intro: 'Ánh đèn hải đăng gọi Pokémon biển tới đây. Cả mình nữa!',
    lose: 'Sóng của bạn còn lớn hơn cả biển...',
  },
  cool_cinnabar: {
    sprite: 'sailor', name: 'Sailor Duncan', kind: 'trainer', zone: 'island_cinnabar',
    party: [{ sp: 126, lv: 38 }, { sp: 38, lv: 39 }],
    rewardMoney: 2000,
    intro: 'Đảo núi lửa này nóng, nhưng trận đấu còn nóng hơn!',
    lose: 'Cháy hết mình rồi mà vẫn thua...',
  },
  camper_victory: {
    sprite: 'hiker', name: 'Hiker Marcos', kind: 'trainer', zone: 'mountain_1',
    party: [{ sp: 76, lv: 42 }, { sp: 95, lv: 42 }, { sp: 112, lv: 43 }],
    rewardMoney: 2400, rewardItem: { id: 'max_potion', n: 1 },
    intro: 'Đường Chiến Thắng không dành cho kẻ yếu. Quay về đi nhóc!',
    lose: 'Được! Lên tới Indigo Plateau đi, ta tin cháu.',
  },
  cool_victory: {
    sprite: 'gentleman', name: 'Gentleman Everett', kind: 'trainer', zone: 'mountain_1',
    party: [{ sp: 105, lv: 43 }, { sp: 68, lv: 44 }, { sp: 149, lv: 45 }],
    rewardMoney: 2600,
    intro: 'Mình cắm trại ở đây hai năm chỉ để chờ một đối thủ xứng tầm.',
    lose: 'Cuối cùng cũng gặp được... cảm ơn trận đấu này!',
  },
  channeler_unknown: {
    sprite: 'psychic_f', name: 'Researcher Mio', kind: 'trainer', zone: 'cave_unknown',
    party: [{ sp: 65, lv: 55 }, { sp: 94, lv: 56 }, { sp: 122, lv: 56 }],
    rewardMoney: 5000, rewardItem: { id: 'ultra_ball', n: 5 },
    intro: 'Hang này vặn xoắn cả tâm trí. Nếu bạn không đủ mạnh, hãy quay ra ngay.',
    lose: 'Bạn... đủ mạnh. Đi sâu vào trong đi, NÓ đang chờ.',
  },
};