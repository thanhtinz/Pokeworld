// TuxeWorld H5 | sw.js | Service worker: nhớ sẵn phần khung để chơi offline
// ĐỔI SỐ NÀY mỗi khi thay asset hàng loạt: đổi tên kho là máy người chơi xoá
// sạch bản nhớ cũ, không còn cảnh nửa tệp mới nửa tệp cũ.
const CACHE = 'tuxeworld-v121';
const SHELL = ['.', 'index.html', 'css/style.css', 'manifest.webmanifest', 'assets/icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Ưu tiên mạng để bản mới lên ngay, mất mạng mới lấy bản đã nhớ.
// Ảnh nay nằm hết trong dự án nên không còn nhánh tải từ CDN ngoài.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
  }
});
