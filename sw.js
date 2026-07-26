// PokeWorld H5 | sw.js | Service worker: cache app shell + sprite để chơi offline
const CACHE = 'pokeworld-v1';
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

// Chiến lược: network-first cho file app (để update nhanh), cache-first cho sprite (bất biến)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const isSprite = url.hostname === 'raw.githubusercontent.com';
  if (isSprite) {
    e.respondWith(
      caches.match(e.request).then(hit => hit ||
        fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        }).catch(() => hit))
    );
  } else if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
  }
});
