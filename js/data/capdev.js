// TuxeWorld H5 | data/capdev.js | Hệ số của từng loại Tuxeball
// TỰ SINH TỪ tools/mkitems.py — nguồn mods/capture_devices.yaml của Tuxemon.
// Đừng sửa tay.

// Mặc định của bản gốc khi một loại bóng không khai báo riêng.
export const CAPDEV_BASE = { statusMult: 1.0, ballMult: 1.0, positive: 1.0, negative: 1.2, elementMalus: 0.2, genderMalus: 0.2, varBonus: 1.5, varMalus: 0.2 };

export const CAPDEV = {
  tuxeball: { mult: 1.0 },
  tuxeball_crusher: {},
  tuxeball_ancient: { mult: 99.0 },
  tuxeball_noble: { mult: 1.25 },
  tuxeball_lavish: { mult: 1.5 },
  tuxeball_grand: { mult: 1.75 },
  tuxeball_majestic: { mult: 2.0 },
  tuxeball_earth: { element: { earth: 1.5 }, elementMalus: 0.2 },
  tuxeball_fire: { element: { fire: 1.5 }, elementMalus: 0.2 },
  tuxeball_metal: { element: { metal: 1.5 }, elementMalus: 0.2 },
  tuxeball_water: { element: { water: 1.5 }, elementMalus: 0.2 },
  tuxeball_wood: { element: { wood: 1.5 }, elementMalus: 0.2 },
  tuxeball_male: { gender: { m: 1.5 }, genderMalus: 0.2 },
  tuxeball_female: { gender: { f: 1.5 }, genderMalus: 0.2 },
  tuxeball_neuter: { gender: { n: 1.5 }, genderMalus: 0.2 },
  tuxeball_gambler: { random: [0.0, 2.0] },
  tuxeball_candy: { onCatch: [{ attr: 'lv', op: 'increment', value: 1 }] },
  tuxeball_hearty: { onCatch: [{ attr: 'tasteWarm', op: 'set', value: 'hearty' }] },
  tuxeball_peppy: { onCatch: [{ attr: 'tasteWarm', op: 'set', value: 'peppy' }] },
  tuxeball_refined: { onCatch: [{ attr: 'tasteWarm', op: 'set', value: 'refined' }] },
  tuxeball_salty: { onCatch: [{ attr: 'tasteWarm', op: 'set', value: 'salty' }] },
  tuxeball_zesty: { onCatch: [{ attr: 'tasteWarm', op: 'set', value: 'zesty' }] },
  tuxeball_hardened: { keepOnFail: true },
  tuxeball_diurnal: { vars: [{ key: 'daytime', value: 'true' }], varBonus: 1.5, varMalus: 0.2 },
  tuxeball_nocturnal: { vars: [{ key: 'daytime', value: 'false' }], varBonus: 1.5, varMalus: 0.2 },
};

// Loài nào bắt bằng bóng đắt tiền thì hệ số chỉ đọc được ở đây, không nằm trong
// items.js — giữ đúng cách bản gốc chia hai tệp.
export const capdevOf = (id) => CAPDEV[id] || null;
