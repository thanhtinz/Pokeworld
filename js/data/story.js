// TuxeWorld H5 | data/story.js | Cốt truyện chiến dịch 8 chương
// Mỗi chương: hội thoại mở đầu (dialog), mục tiêu (goal — cùng schema quest),
// thưởng, zone mở khóa khi hoàn thành, hội thoại kết chương (outro).
// speaker: 'prof' Giáo sư Taba | 'rival' Kyle | 'xero' Team Xero | 'omni' Omnichannel
//          | 'nurse' y tá | 'boss' thủ lĩnh Xero | 'me' người chơi | 'sys' lời dẫn
//
// Cốt truyện bám theo bối cảnh gốc của Tuxemon: Omnichannel nắm truyền thông và
// cấm dân thường nuôi Tuxemon, Team Xero đi gom Tuxemon còn sót lại, còn Giáo sư
// ở Thị Trấn Taba vẫn lén giữ ba con cuối cùng.

export const SPEAKERS = {
  prof:   { name: 'Giáo Sư',     icon: '👨‍🔬', img: 'professor' },
  rival:  { name: 'Kyle',        icon: '😏', img: 'rogue' },
  omni:   { name: 'Omnichannel', icon: '📺', img: 'chief' },
  nurse:  { name: 'Y Tá Trạm Hồi Sức', icon: '👩‍⚕️', img: 'nurse' },
  xero: { name: 'Team Xero', icon: '🕶️', img: 'grunt' },
  boss:   { name: 'Thủ Lĩnh Xero', icon: '😈', img: 'boss' },
  me:     { name: 'Bạn',           icon: '🧢', img: null }, // avatar tài khoản (red/leaf)
  sys:    { name: '',              icon: '', img: null },
};

// Đội của Kyle theo từng mốc — chọn khắc hệ với starter của người chơi.
// key = starter dex của NGƯỜI CHƠI: cỏ -> đối thủ cầm lửa, lửa -> nước, nước -> cỏ
// Đối thủ luôn chọn con khắc hệ với con mình chọn (xoay vòng ba hệ)
// Đối thủ luôn nhặt con khắc chế mình, đúng như bản gốc Tuxemon
// (maps/professor_lab.tmx): Rockitten -> Cardiling -> Tweesher -> Rockitten.
export const RIVAL_STARTER = { 19: 80, 80: 25, 25: 19 };

export const CHAPTERS = [
  {
    id: 'ch1', title: 'Chương 1 — Món quà của Giáo sư',
    desc: 'Gặp Giáo sư và nhận Tuxemon đầu tiên.',
    dialog: [
      ['prof', 'Chào mừng đến Thị Trấn Taba! Ta là Giáo sư, người nghiên cứu Tuxemon của vùng này.'],
      ['prof', 'Từ ngày có lệnh cấm, Team Xero đi lùng bắt Tuxemon khắp nơi... Vùng này cần một nhà huấn luyện dám lên tiếng.'],
      ['prof', 'Ta giấu được ba con cuối cùng. Chọn một bạn đồng hành đi — nhưng đừng để Omnichannel biết.'],
    ],
    goal: { t: 'choose_starter' },       // hoàn thành ngay khi chọn starter
    outro: [
      ['rival', 'Ê! Cậu cũng vừa nhận Tuxemon hả? Tớ là Kyle, nhà ngay Đường Số 1.'],
      ['rival', 'Tớ chọn con KHẮC HỆ với cậu luôn. Mai ra đường đấu một trận nhé!'],
    ],
    reward: { items: [{ id: 'potion', n: 3 }] },
    unlock: ['route1'],
  },
  {
    id: 'ch2', title: 'Chương 2 — Trận đấu đầu tiên',
    desc: 'Kyle đang chờ ở Đường Số 1. Thắng cậu ấy để chứng tỏ bản thân!',
    dialog: [
      ['rival', 'Tới rồi à! Xem Tuxemon của ai mạnh hơn nào. Đừng khóc nếu thua đấy!'],
    ],
    goal: { t: 'defeat_trainer', id: 'rival_1' },
    outro: [
      ['rival', 'Hừm! Chỉ là may mắn thôi! Tớ sẽ luyện tập rồi phục thù!'],
      ['prof', 'Giỏi lắm! Cầm mấy quả Tuxeball này. Gặp Tuxemon hoang trong bụi cỏ thì làm yếu rồi ném bóng.'],
    ],
    reward: { money: 500, items: [{ id: 'tuxeball', n: 10 }] },
    unlock: [],
  },
  {
    id: 'ch3', title: 'Chương 3 — Đồng đội mới',
    desc: 'Bắt 2 Tuxemon hoang để mở rộng đội hình.',
    dialog: [
      ['prof', 'Đội càng đa dạng càng dễ sống. Bắt thêm hai con hoang nữa cho ta xem nào.'],
    ],
    goal: { t: 'catch_count', n: 2 },
    outro: [
      ['prof', 'Tuyệt lắm. Nhưng nghe nói trong rừng Dryadsgrove có người lạ mặc đồ đen — dân ở đây gọi là Team Xero.'],
    ],
    reward: { money: 800, items: [{ id: 'potion', n: 3 }] },
    unlock: ['dryadsgrove'],
  },
  {
    id: 'ch4', title: 'Chương 4 — Bóng đen trong rừng',
    desc: 'Điều tra rừng Dryadsgrove. Đánh bại tên Team Xero!',
    dialog: [
      ['xero', 'Ê nhóc! Rừng này Team Xero gom hàng rồi. Tuxemon ở đây thuộc về bọn ta hết.'],
      ['xero', 'Muốn qua thì thắng Tuxemon của ta đã!'],
    ],
    goal: { t: 'defeat_trainer', id: 'xero_1' },
    outro: [
      ['xero', 'Khoan... nhóc này mạnh thật! Rút! Nhưng chuyến hàng ngoài sa mạc vẫn chạy đúng hẹn...'],
      ['prof', 'Sa mạc?! Chúng đang moi đá tiến hoá ngoài Đường1 Sanglorian. Nhưng trước hết cháu nên thử sức ở võ đường trong thị trấn.'],
    ],
    reward: { money: 1000 },
    unlock: [],
  },
  {
    id: 'ch5', title: 'Chương 5 — Huy hiệu đầu tiên',
    desc: 'Thách đấu Thạch — chủ Võ Đường hệ Đất của Thị Trấn Taba.',
    dialog: [
      ['sys', 'Võ đường nằm ngay giữa Thị Trấn Taba. Thạch — bậc thầy hệ Đất — đang chờ người dám thách đấu.'],
    ],
    goal: { t: 'earn_badge', id: 'badge_boulder' },
    outro: [
      ['prof', 'Huy hiệu Đất! Cháu đúng là có tố chất. Giờ thì ra Đường1 Sanglorian chặn Team Xero thôi!'],
    ],
    reward: { money: 1500, items: [{ id: 'super_potion', n: 2 }] },
    unlock: ['route1_sanglorian', 'cotton_town'],
  },
  {
    id: 'ch6', title: 'Chương 6 — Giải cứu hang đá',
    desc: 'Team Xero đang đào trộm đá tiến hoá ngoài Đường1 Sanglorian. Đánh đuổi chúng!',
    dialog: [
      ['xero', 'Lại là nhóc đó! Lần này bọn ta đi hai người, xem mày làm gì được.'],
    ],
    goal: { t: 'defeat_trainer', id: 'xero_2' },
    outro: [
      ['xero', 'Không thể tin được! Đại ca ơi, cứu em!'],
      ['boss', 'Lũ vô dụng... Nhóc con, Thị Trấn Bông mới là mỏ vàng. Con Leviadile dưới hồ ở đó sẽ thuộc về Team Xero.'],
    ],
    reward: { money: 2000, items: [{ id: 'tuxeball_lavish', n: 5 }] },
    unlock: ['cotton_town'],
  },
  {
    id: 'ch7', title: 'Chương 7 — Quyết chiến bên hồ',
    desc: 'Thủ lĩnh Team Xero định bắt Leviadile ở hồ Thị Trấn Bông. Ngăn hắn lại!',
    dialog: [
      ['omni', 'Nhắc lại lần cuối: dân thường không được nuôi Tuxemon.'],
      ['boss', 'Nghe chưa nhóc? Cả cái đài kia cũng đứng về phía ta. Xem sức mạnh THẬT SỰ của Team Xero đây!'],
    ],
    goal: { t: 'defeat_trainer', id: 'xero_boss' },
    outro: [
      ['boss', 'Thua... thua một đứa nhóc?! Team Xero sẽ nhớ mặt mày! RÚT!'],
      ['nurse', 'Cả hồ nước được cứu rồi! Chủ võ đường Thuỷ ở Thị Trấn Bông muốn gặp người hùng đấy.'],
    ],
    reward: { money: 3000, items: [{ id: 'tuxeball_ancient', n: 3 }] },
    unlock: [],
  },
  {
    id: 'ch8', title: 'Chương 8 — Nhà vô địch',
    desc: 'Lấy Huy hiệu Nước từ Thuỷ, rồi đấu trận cuối với Kyle để thành Nhà Vô Địch của vùng!',
    dialog: [
      ['sys', 'Hai thử thách cuối cùng: Võ Đường Nước, và... người bạn đối thủ.'],
    ],
    goal: { t: 'defeat_trainer', id: 'rival_2' },
    require: { badge: 'badge_cascade' }, // cần badge nước trước khi rival_2 xuất hiện
    outro: [
      ['rival', 'Thua tâm phục khẩu phục... Cậu xứng đáng là Nhà Vô Địch. Nhưng tớ chưa bỏ cuộc đâu!'],
      ['prof', 'Cháu đi được một chặng dài rồi. Từ hôm nay cháu là NHÀ VÔ ĐỊCH của vùng — và là bằng chứng sống rằng lệnh cấm kia sai.'],
      ['prof', 'Hành trình chưa hết đâu: Tuxedex vẫn còn trống nhiều lắm.'],
    ],
    reward: { money: 10000, items: [{ id: 'lucky_bamboo', n: 3 }, { id: 'tuxeball_ancient', n: 3 }] },
    unlock: [],
  },
];

// Zone nào cần mở khóa bằng cốt truyện (zone không có ở đây = mở sẵn)
export const ZONE_LOCKS = {
  route1:  'ch1',
  dryadsgrove: 'ch3',
  route1_sanglorian:  'ch5',
  cotton_town:   'ch5',
  cotton_town:   'ch6',
};
