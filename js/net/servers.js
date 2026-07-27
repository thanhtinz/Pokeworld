// PokeWorld H5 | net/servers.js | DANH SÁCH MÁY CHỦ
//
// ĐÂY LÀ CHỖ DUY NHẤT BẠN CẦN SỬA KHI DỰNG XONG VPS.
// Người chơi chỉ được CHỌN trong danh sách này, không tự nhập địa chỉ.
//
// Cách thêm máy chủ:
//   1. Dựng server theo docs/SERVER.md (Docker hoặc pm2 + nginx).
//   2. Bỏ dấu // ở dòng mẫu bên dưới, sửa lại name / url / region.
//   3. Đẩy code lên là người chơi thấy máy chủ mới ngay.
//
// url PHẢI là https khi web chạy trên https, nếu không trình duyệt sẽ chặn.
// Bỏ trống mảng = cả game chỉ chơi offline.

export const SERVERS = [
  // {
  //   id: 'vn1',
  //   name: 'Việt Nam 1',
  //   url: 'https://api.tenmien.com',
  //   region: 'Đông Nam Á',
  //   note: 'Máy chủ mới',        // nhãn nhỏ tuỳ chọn, bỏ cũng được
  // },
  // {
  //   id: 'vn2',
  //   name: 'Việt Nam 2',
  //   url: 'https://api2.tenmien.com',
  //   region: 'Đông Nam Á',
  // },
];

// Chế độ thử máy chủ dành cho người phát triển.
// Bật bằng cách chạm 5 lần vào tiêu đề "Chọn máy chủ", hoặc thêm ?dev=1 vào link.
// Khi bật sẽ hiện ô nhập địa chỉ để bạn kiểm tra VPS trước khi thêm vào SERVERS.
const DEV_KEY = 'pw_dev_server';

export function isDevMode() {
  if (new URLSearchParams(location.search).get('dev') === '1') return true;
  return localStorage.getItem(DEV_KEY) === '1';
}

export function setDevMode(on) {
  if (on) localStorage.setItem(DEV_KEY, '1');
  else localStorage.removeItem(DEV_KEY);
}

// Địa chỉ người phát triển đã thử gần nhất (chỉ dùng khi bật chế độ thử)
const DEV_URL_KEY = 'pw_dev_server_url';
export const getDevUrl = () => localStorage.getItem(DEV_URL_KEY) || '';
export const setDevUrl = (u) => localStorage.setItem(DEV_URL_KEY, u || '');
