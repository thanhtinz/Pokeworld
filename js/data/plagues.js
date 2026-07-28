// TuxeWorld H5 | data/plagues.js | Bệnh dịch — TỰ SINH TỪ tools/mktuxemon.py
// Nguồn: mods/plagues.yaml của Tuxemon. Đừng sửa tay.
//
// spread = xác suất lây khi bị dính chiêu mang bệnh.
// Con đang bệnh mà ra đòn thì có lúc bị chiêu bệnh chiếm chỗ: thay vì
// đánh, nó lây bệnh sang đối thủ (bản gốc: combat/session.py pre_check).
export const PLAGUES = {
  "spyderbite": { name: "Nhện Cắn", spread: 0.125, carrier: 0.125, khoi: 0 },
};
