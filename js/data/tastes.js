// TuxeWorld H5 | data/tastes.js | "Khẩu vị" — thay cho hệ tính cách của bản gốc
//
// Nguồn: Tuxemon db/taste/taste.yaml. Mỗi con mang đúng MỘT vị lạnh và MỘT vị
// ấm; vị lạnh làm yếu một chỉ số, vị ấm làm mạnh một chỉ số.
export const TASTES_COLD = {
  mild:   { stat: 'speed',  mult: 0.9,  name: 'Nhạt' },
  sweet:  { stat: 'melee',  mult: 0.9,  name: 'Ngọt' },
  soft:   { stat: 'armour', mult: 0.9,  name: 'Mềm' },
  flakey: { stat: 'ranged', mult: 0.9,  name: 'Bở' },
  dry:    { stat: 'dodge',  mult: 0.9,  name: 'Khô' },
  bland:  { stat: 'hp',     mult: 0.95, name: 'Lạt' },
};

export const TASTES_WARM = {
  peppy:   { stat: 'speed',  mult: 1.1,  name: 'Hăng' },
  salty:   { stat: 'melee',  mult: 1.1,  name: 'Mặn' },
  hearty:  { stat: 'armour', mult: 1.1,  name: 'Đậm' },
  zesty:   { stat: 'ranged', mult: 1.1,  name: 'Thanh' },
  refined: { stat: 'dodge',  mult: 1.1,  name: 'Tinh' },
  savory:  { stat: 'hp',     mult: 1.05, name: 'Bùi' },
};

export const COLD_LIST = Object.keys(TASTES_COLD);
export const WARM_LIST = Object.keys(TASTES_WARM);

// Câu mô tả gọn cho giao diện: "Bùi · Khô"
export function tasteText(mon) {
  const w = TASTES_WARM[mon?.tasteWarm]?.name;
  const c = TASTES_COLD[mon?.tasteCold]?.name;
  return [w, c].filter(Boolean).join(' · ') || '—';
}
