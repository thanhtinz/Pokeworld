// PokeWorld H5 | data/zones.js | Khu vực bản đồ: encounter hoang dã, trainer và liên kết di chuyển

// kind: 'town' | 'route' | 'forest' | 'cave' | 'lake' | 'meadow' | 'beach'
// encounters: [{sp: số dex, w: trọng số, min/max: cấp}]
// next: các zone đi được từ zone này
export const ZONES = {
  town_1: {
    name: 'Thị Trấn Khởi Đầu', kind: 'town', icon: 'town', iconSp: null, iconItem: 'town_map',
    desc: 'Nơi hành trình bắt đầu. Có Trung tâm Pokémon, cửa hàng và Nhà Thi Đấu Đá của Brock.',
    encounters: [],
    trainers: ['gym_brock'],
    next: ['route_1'],
  },
  route_1: {
    name: 'Đường Số 1', kind: 'route', icon: 'route', iconSp: 16, iconItem: null,
    desc: 'Con đường cỏ dại phía bắc thị trấn, nhiều Pokémon hoang dã cấp thấp.',
    encounters: [
      { sp: 16, w: 30, min: 2, max: 5 },   // Pidgey
      { sp: 19, w: 30, min: 2, max: 5 },   // Rattata
      { sp: 10, w: 20, min: 2, max: 4 },   // Caterpie
      { sp: 25, w: 5, min: 3, max: 6 },    // Pikachu (hiếm)
      { sp: 133, w: 2, min: 4, max: 6 },   // Eevee (rất hiếm)
    ],
    trainers: ['youngster_minh', 'lass_lan'],
    next: ['town_1', 'forest_1', 'route_2'],
  },
  forest_1: {
    name: 'Rừng Xanh Thẳm', kind: 'forest', icon: 'forest', iconSp: 10, iconItem: null,
    desc: 'Khu rừng rậm rạp đầy côn trùng, nghe đồn ban đêm có Snorlax xuất hiện.',
    encounters: [
      { sp: 10, w: 35, min: 3, max: 6 },   // Caterpie
      { sp: 11, w: 15, min: 4, max: 7 },   // Metapod
      { sp: 43, w: 20, min: 4, max: 8 },   // Oddish
      { sp: 25, w: 8, min: 4, max: 7 },    // Pikachu
      { sp: 12, w: 3, min: 8, max: 10 },   // Butterfree (hiếm)
      { sp: 143, w: 1, min: 15, max: 18 }, // Snorlax (cực hiếm)
    ],
    trainers: ['bugcatcher_tung'],
    next: ['route_1'],
  },
  route_2: {
    name: 'Đường Số 2', kind: 'route', icon: 'route', iconSp: 19, iconItem: null,
    desc: 'Đường mòn dẫn tới hang núi và hồ nước, Pokémon ở đây mạnh hơn hẳn.',
    encounters: [
      { sp: 16, w: 25, min: 4, max: 8 },   // Pidgey
      { sp: 19, w: 25, min: 4, max: 8 },   // Rattata
      { sp: 43, w: 20, min: 5, max: 9 },   // Oddish
      { sp: 66, w: 10, min: 6, max: 10 },  // Machop
      { sp: 17, w: 5, min: 9, max: 12 },   // Pidgeotto (hiếm)
    ],
    trainers: [],
    next: ['route_1', 'cave_1', 'lake_1'],
  },
  cave_1: {
    name: 'Hang Đá', kind: 'cave', icon: 'cave', iconSp: 41, iconItem: null,
    desc: 'Hang động tối tăm, lãnh địa của Pokémon hệ Đá và bầy Zubat.',
    encounters: [
      { sp: 41, w: 40, min: 6, max: 10 },  // Zubat
      { sp: 74, w: 30, min: 6, max: 10 },  // Geodude
      { sp: 66, w: 10, min: 7, max: 11 },  // Machop
      { sp: 75, w: 5, min: 12, max: 15 },  // Graveler (hiếm)
      { sp: 42, w: 3, min: 13, max: 16 },  // Golbat (hiếm)
    ],
    trainers: ['hiker_dung'],
    next: ['route_2', 'cave_2'],
  },
  lake_1: {
    name: 'Hồ Gương Trời', kind: 'lake', icon: 'lake', iconSp: 129, iconItem: null,
    desc: 'Hồ nước trong vắt, nơi đặt Nhà Thi Đấu Nước của Thủy. Nghe đồn có rồng ẩn mình dưới đáy hồ.',
    encounters: [
      { sp: 129, w: 45, min: 3, max: 10 }, // Magikarp
      { sp: 7, w: 10, min: 5, max: 9 },    // Squirtle
      { sp: 41, w: 10, min: 6, max: 9 },   // Zubat ven hồ
      { sp: 147, w: 3, min: 10, max: 15 }, // Dratini (hiếm)
      { sp: 130, w: 1, min: 20, max: 25 }, // Gyarados (cực hiếm)
    ],
    trainers: ['gym_thuy'],
    next: ['route_2', 'route_3'],
  },
  route_3: {
    name: 'Đường Số 3', kind: 'route', icon: 'route', iconSp: 21, iconItem: null,
    desc: 'Con đường dài phía nam hồ, một nhánh dẫn ra đồng hoa, nhánh kia về làng ven núi.',
    encounters: [
      { sp: 21, w: 28, min: 8, max: 13 },   // Spearow
      { sp: 19, w: 20, min: 8, max: 13 },   // Rattata
      { sp: 43, w: 18, min: 9, max: 14 },   // Oddish
      { sp: 27, w: 15, min: 9, max: 14 },   // Sandshrew
      { sp: 56, w: 12, min: 10, max: 15 },  // Mankey
      { sp: 22, w: 5, min: 14, max: 18 },   // Fearow (hiếm)
    ],
    trainers: ['camper_route3', 'sailor_route3'],
    next: ['lake_1', 'meadow_1', 'town_2'],
  },
  meadow_1: {
    name: 'Đồng Hoa Nắng', kind: 'meadow', icon: 'meadow', iconSp: 44, iconItem: null,
    desc: 'Cánh đồng hoa nở quanh năm. Pokémon hệ Cỏ và hệ Bay tụ về đây rất đông.',
    encounters: [
      { sp: 43, w: 25, min: 10, max: 15 },  // Oddish
      { sp: 69, w: 22, min: 10, max: 15 },  // Bellsprout
      { sp: 46, w: 18, min: 10, max: 14 },  // Paras
      { sp: 48, w: 15, min: 11, max: 16 },  // Venonat
      { sp: 16, w: 10, min: 10, max: 14 },  // Pidgey
      { sp: 44, w: 6, min: 16, max: 20 },   // Gloom (hiếm)
      { sp: 123, w: 2, min: 18, max: 22 },  // Scyther (cực hiếm)
    ],
    trainers: ['lass_rainbow'],
    next: ['route_3'],
  },
  town_2: {
    name: 'Làng Ven Núi', kind: 'town', icon: 'town', iconSp: null, iconItem: 'town_map',
    desc: 'Ngôi làng nhỏ kẹp giữa núi và biển. Có Trung tâm Pokémon và cửa hàng.',
    encounters: [],
    trainers: ['rocket_grunt_3'],
    next: ['route_3', 'beach_1'],
  },
  beach_1: {
    name: 'Bãi Biển Hoàng Hôn', kind: 'beach', icon: 'beach', iconSp: 98, iconItem: null,
    desc: 'Bãi cát trải dài dưới nắng chiều. Pokémon vỏ cứng bò lên bờ khi thuỷ triều rút.',
    encounters: [
      { sp: 98, w: 30, min: 12, max: 17 },  // Krabby
      { sp: 90, w: 22, min: 12, max: 17 },  // Shellder
      { sp: 72, w: 18, min: 12, max: 16 },  // Tentacool
      { sp: 120, w: 14, min: 13, max: 18 }, // Staryu
      { sp: 116, w: 10, min: 13, max: 18 }, // Horsea
      { sp: 99, w: 4, min: 20, max: 24 },   // Kingler (hiếm)
      { sp: 131, w: 1, min: 25, max: 30 },  // Lapras (cực hiếm)
    ],
    trainers: ['swimmer_light'],
    next: ['town_2'],
  },
  cave_2: {
    name: 'Hang Sâu Thẳm', kind: 'cave', icon: 'cave', iconSp: 95, iconItem: null,
    desc: 'Mê cung đá sâu trong lòng núi, tối đến mức không thấy lối ra.',
    encounters: [
      { sp: 41, w: 25, min: 14, max: 19 },  // Zubat
      { sp: 74, w: 22, min: 14, max: 19 },  // Geodude
      { sp: 66, w: 18, min: 15, max: 20 },  // Machop
      { sp: 50, w: 15, min: 14, max: 18 },  // Diglett
      { sp: 75, w: 10, min: 18, max: 23 },  // Graveler
      { sp: 95, w: 6, min: 20, max: 25 },   // Onix (hiếm)
      { sp: 142, w: 1, min: 28, max: 32 },  // Aerodactyl (cực hiếm)
    ],
    trainers: ['camper_victory', 'channeler_unknown'],
    next: ['cave_1'],
  },
};

// Random 1 encounter theo trọng số trong zone (null nếu zone không có spawn)
export function rollEncounter(zoneId, rng = Math.random) {
  const zone = ZONES[zoneId];
  if (!zone || !zone.encounters.length) return null;
  const total = zone.encounters.reduce((s, e) => s + e.w, 0);
  let r = rng() * total;
  for (const e of zone.encounters) {
    r -= e.w;
    if (r < 0) {
      const lv = e.min + Math.floor(rng() * (e.max - e.min + 1));
      return { sp: e.sp, lv };
    }
  }
  return null;
}
