// PokeWorld H5 | data/zones.js | Khu vực bản đồ: encounter hoang dã, trainer và liên kết di chuyển

// kind: 'town' | 'route' | 'forest' | 'cave' | 'lake'
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
    name: 'Rừng Xanh', kind: 'forest', icon: 'forest', iconSp: 10, iconItem: null,
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
    next: ['route_2'],
  },
  lake_1: {
    name: 'Hồ Nước Trong', kind: 'lake', icon: 'lake', iconSp: 129, iconItem: null,
    desc: 'Hồ nước trong vắt, nơi đặt Nhà Thi Đấu Nước của Thủy. Nghe đồn có rồng ẩn mình dưới đáy hồ.',
    encounters: [
      { sp: 129, w: 45, min: 3, max: 10 }, // Magikarp
      { sp: 7, w: 10, min: 5, max: 9 },    // Squirtle
      { sp: 41, w: 10, min: 6, max: 9 },   // Zubat ven hồ
      { sp: 147, w: 3, min: 10, max: 15 }, // Dratini (hiếm)
      { sp: 130, w: 1, min: 20, max: 25 }, // Gyarados (cực hiếm)
    ],
    trainers: ['gym_thuy'],
    next: ['route_2'],
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
