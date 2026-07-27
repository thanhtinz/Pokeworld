// PokeWorld H5 | data/story.js | Cốt truyện chiến dịch 8 chương
// Mỗi chương: hội thoại mở đầu (dialog), mục tiêu (goal — cùng schema quest),
// thưởng, zone mở khóa khi hoàn thành, hội thoại kết chương (outro).
// speaker: 'prof' Giáo sư Oak | 'rival' Blue | 'rocket' Team Rocket | 'me' người chơi | 'sys'

export const SPEAKERS = {
  prof:   { name: 'Professor Oak',  icon: '👨‍🔬', img: 'oak' },
  rival:  { name: 'Blue',          icon: '😏', img: 'rival' },
  nurse:  { name: 'Nurse Joy',      icon: '👩‍⚕️', img: 'lass' },
  rocket: { name: 'Team Rocket', icon: '🚀', img: 'rocket_m' },
  boss:   { name: 'Giovanni', icon: '😈', img: 'giovanni' },
  me:     { name: 'Bạn',           icon: '🧢', img: null }, // avatar tài khoản (red/leaf)
  sys:    { name: '',              icon: '', img: null },
};

// Đội của rival Blue theo từng mốc — chọn khắc hệ với starter của người chơi.
// key = starter dex của NGƯỜI CHƠI (1 cỏ -> Blue cầm 4 lửa, 4 -> 7 nước, 7 -> 1 cỏ)
export const RIVAL_STARTER = { 1: 4, 4: 7, 7: 1 };

export const CHAPTERS = [
  {
    id: 'ch1', title: 'Chương 1 — Món quà của Giáo sư',
    desc: 'Gặp Giáo sư Oak và nhận Pokémon đầu tiên.',
    dialog: [
      ['prof', 'Chào mừng đến Thị Trấn Khởi Đầu! Ta là Giáo sư Oak, người nghiên cứu Pokémon của vùng này.'],
      ['prof', 'Dạo này Team Rocket lộng hành, bắt trộm Pokémon khắp nơi... Vùng này cần một nhà huấn luyện tài năng.'],
      ['prof', 'Ta có ba Pokémon quý. Hãy chọn một bạn đồng hành, và bắt đầu hành trình của cháu!'],
    ],
    goal: { t: 'choose_starter' },       // hoàn thành ngay khi chọn starter
    outro: [
      ['rival', 'Ê! Cậu cũng nhận Pokémon từ ông nội tớ hả? Tớ là Blue!'],
      ['rival', 'Vậy thì... tớ chọn con KHẮC HỆ với cậu luôn! Hê hê. Mai đấu thử một trận nhé!'],
    ],
    reward: { items: [{ id: 'potion', n: 3 }] },
    unlock: ['route_1'],
  },
  {
    id: 'ch2', title: 'Chương 2 — Trận đấu đầu tiên',
    desc: 'Blue đang chờ ở Đường Số 1. Thắng cậu ấy để chứng tỏ bản thân!',
    dialog: [
      ['rival', 'Tới rồi à! Xem Pokémon của ai mạnh hơn nào. Đừng khóc nếu thua đấy!'],
    ],
    goal: { t: 'defeat_trainer', id: 'rival_1' },
    outro: [
      ['rival', 'Hừm! Chỉ là may mắn thôi! Tớ sẽ luyện tập và phục thù!'],
      ['prof', 'Giỏi lắm! Đây là Poké Ball — hãy bắt thêm đồng đội. Gặp Pokémon hoang trong bụi cỏ, làm yếu rồi ném bóng!'],
    ],
    reward: { money: 500, items: [{ id: 'poke_ball', n: 10 }] },
    unlock: [],
  },
  {
    id: 'ch3', title: 'Chương 3 — Đồng đội mới',
    desc: 'Bắt 2 Pokémon hoang để mở rộng đội hình.',
    dialog: [
      ['prof', 'Một nhà huấn luyện giỏi cần một đội đa dạng. Hãy bắt 2 Pokémon hoang dã nhé!'],
    ],
    goal: { t: 'catch_count', n: 2 },
    outro: [
      ['prof', 'Tuyệt vời! Nghe nói trong Rừng Xanh Thẳm xuất hiện người lạ mặc đồ đen... Cẩn thận đấy.'],
    ],
    reward: { money: 800, items: [{ id: 'potion', n: 3 }] },
    unlock: ['forest_1'],
  },
  {
    id: 'ch4', title: 'Chương 4 — Bóng đen trong rừng',
    desc: 'Điều tra Rừng Xanh Thẳm. Đánh bại tên Team Rocket!',
    dialog: [
      ['rocket', 'Ê nhóc! Chỗ này là địa bàn của Team Rocket. Bọn ta đang "thu hoạch" Pokémon ở đây!'],
      ['rocket', 'Muốn qua thì bước qua xác Zubat của ta đã!'],
    ],
    goal: { t: 'defeat_trainer', id: 'rocket_1' },
    outro: [
      ['rocket', 'Khoan đã... nhóc này mạnh thật! Rút lui! Nhưng kế hoạch ở hang đá vẫn tiếp tục...'],
      ['prof', 'Hang đá?! Chúng đang đào trộm đá tiến hóa ở Hang Dơi Đá! Nhưng trước hết, hãy thử sức với Phòng Gym của thị trấn đi đã.'],
    ],
    reward: { money: 1000 },
    unlock: [],
  },
  {
    id: 'ch5', title: 'Chương 5 — Huy hiệu đầu tiên',
    desc: 'Thách đấu Brock — chủ Phòng Gym hệ Đá của Thị Trấn Khởi Đầu.',
    dialog: [
      ['sys', 'Phòng Gym sừng sững giữa thị trấn. Brock, bậc thầy hệ Đá, đang chờ thách đấu...'],
    ],
    goal: { t: 'earn_badge', id: 'badge_boulder' },
    outro: [
      ['prof', 'Huy hiệu Đá! Cháu đúng là có tố chất. Giờ thì đến Hang Dơi Đá chặn Team Rocket thôi!'],
    ],
    reward: { money: 1500, items: [{ id: 'super_potion', n: 2 }] },
    unlock: ['route_2', 'cave_1'],
  },
  {
    id: 'ch6', title: 'Chương 6 — Giải cứu hang đá',
    desc: 'Team Rocket đang khai thác trộm trong Hang Dơi Đá. Đánh đuổi chúng!',
    dialog: [
      ['rocket', 'Lại là nhóc đó! Lần này bọn ta có hai người, xem mày làm gì được!'],
    ],
    goal: { t: 'defeat_trainer', id: 'rocket_2' },
    outro: [
      ['rocket', 'Không thể tin được! Đại ca ơi cứu em!!'],
      ['boss', 'Lũ vô dụng... Nhóc con, hồ nước phía bắc sẽ là mỏ vàng của ta. Gyarados hồ đó sẽ thuộc về Team Rocket!'],
    ],
    reward: { money: 2000, items: [{ id: 'great_ball', n: 5 }] },
    unlock: ['lake_1'],
  },
  {
    id: 'ch7', title: 'Chương 7 — Quyết chiến bên hồ',
    desc: 'Giovanni định bắt Gyarados của Hồ Gương Trời. Ngăn hắn lại!',
    dialog: [
      ['boss', 'Đến rồi à, phiền phức. Ta sẽ cho mày thấy sức mạnh THẬT SỰ của Team Rocket!'],
    ],
    goal: { t: 'defeat_trainer', id: 'rocket_boss' },
    outro: [
      ['boss', 'Thua... thua một đứa nhóc?! Team Rocket sẽ nhớ mặt mày! RÚT LUI!'],
      ['nurse', 'Bạn đã cứu cả hồ nước! Chủ Gym Misty muốn gặp người hùng đấy.'],
    ],
    reward: { money: 3000, items: [{ id: 'ultra_ball', n: 3 }] },
    unlock: [],
  },
  {
    id: 'ch8', title: 'Chương 8 — Nhà vô địch',
    desc: 'Lấy Huy hiệu Nước từ Misty, rồi đấu trận cuối với Blue để trở thành Nhà Vô Địch của vùng!',
    dialog: [
      ['sys', 'Hai thử thách cuối cùng: Phòng Gym Nước, và... người bạn đối thủ.'],
    ],
    goal: { t: 'defeat_trainer', id: 'rival_2' },
    require: { badge: 'badge_cascade' }, // cần badge nước trước khi rival_2 xuất hiện
    outro: [
      ['rival', 'Thua tâm phục khẩu phục... Cậu xứng đáng là Nhà Vô Địch. Nhưng tớ sẽ không bỏ cuộc đâu!'],
      ['prof', 'Cháu đã đi một hành trình dài... Từ hôm nay, cháu là NHÀ VÔ ĐỊCH của vùng! Hãy tiếp tục hoàn thành Pokédex nhé!'],
    ],
    reward: { money: 10000, items: [{ id: 'rare_candy', n: 3 }, { id: 'lucky_egg', n: 1 }] },
    unlock: [],
  },
];

// Zone nào cần mở khóa bằng cốt truyện (zone không có ở đây = mở sẵn)
export const ZONE_LOCKS = {
  route_1:  'ch1',
  forest_1: 'ch3',
  route_2:  'ch5',
  cave_1:   'ch5',
  lake_1:   'ch6',
};
