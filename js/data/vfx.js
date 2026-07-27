// TuxeWorld H5 | data/vfx.js | Hiệu ứng chiêu thức — TỰ SINH TỪ tools/mkvfx.py
// Nguồn: Tuxemon (CC BY-SA 4.0). frames = số khung trong dải ảnh.

export const VFX = {
  fire: { src: 'assets/vfx/fire.png', frames: 4, w: 85, h: 91 },
  water: { src: 'assets/vfx/water.png', frames: 4, w: 64, h: 64 },
  wood: { src: 'assets/vfx/wood.png', frames: 7, w: 64, h: 64 },
  metal: { src: 'assets/vfx/metal.png', frames: 6, w: 64, h: 64 },
  lightning: { src: 'assets/vfx/lightning.png', frames: 8, w: 75, h: 73 },
  frost: { src: 'assets/vfx/frost.png', frames: 12, w: 64, h: 64 },
  earth: { src: 'assets/vfx/earth.png', frames: 12, w: 96, h: 96 },
  venom: { src: 'assets/vfx/venom.png', frames: 8, w: 96, h: 96 },
  shadow: { src: 'assets/vfx/shadow.png', frames: 4, w: 64, h: 64 },
  cosmic: { src: 'assets/vfx/cosmic.png', frames: 5, w: 64, h: 64 },
  sky: { src: 'assets/vfx/sky.png', frames: 13, w: 64, h: 64 },
  heroic: { src: 'assets/vfx/heroic.png', frames: 4, w: 64, h: 64 },
  normal: { src: 'assets/vfx/normal.png', frames: 7, w: 64, h: 64 },
  hit: { src: 'assets/vfx/hit.png', frames: 10, w: 64, h: 64 },
  heal: { src: 'assets/vfx/heal.png', frames: 5, w: 120, h: 120 },
};

// Hệ nào chưa có hiệu ứng riêng thì dùng hiệu ứng đánh thường
export const vfxFor = (type) => VFX[type] || VFX.hit;
