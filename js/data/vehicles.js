// TuxeWorld H5 | data/vehicles.js | Phương tiện — SINH TỰ ĐỘNG bởi tools/mkmounts.py
// KHONG SUA TAY. Ảnh cắt từ core_outdoor.png của Tuxemon (CC BY-SA 4.0).

// speed = hệ số nhân tốc độ đi bộ. img = ảnh theo bốn hướng.
export const VEHICLES = [
  { id: "xe_den", name: "Xe Hơi Đen", price: 60000, speed: 1.55, desc: "Chiếc xe phổ thông, đi nhanh hơn đi bộ kha khá.", img: {"up": "assets/mounts/xe_den_up.png", "down": "assets/mounts/xe_den_down.png", "right": "assets/mounts/xe_den_right.png", "left": "assets/mounts/xe_den_left.png"} },
  { id: "xe_do", name: "Xe Thể Thao Đỏ", price: 150000, speed: 1.75, desc: "Máy khoẻ hơn, phóng một cái là tới nơi.", img: {"up": "assets/mounts/xe_do_up.png", "down": "assets/mounts/xe_do_down.png", "right": "assets/mounts/xe_do_right.png", "left": "assets/mounts/xe_do_left.png"} },
  { id: "xe_xanh", name: "Xe Điện Xanh", price: 260000, speed: 1.95, desc: "Chạy êm và nhanh nhất — đắt thì phải khác chứ.", img: {"up": "assets/mounts/xe_xanh_up.png", "down": "assets/mounts/xe_xanh_down.png", "right": "assets/mounts/xe_xanh_right.png", "left": "assets/mounts/xe_xanh_left.png"} },
];

export const VEHICLE_BY_ID = Object.fromEntries(VEHICLES.map(v => [v.id, v]));
