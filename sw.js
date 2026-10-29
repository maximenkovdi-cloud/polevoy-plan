// Фоновый помощник «Полевого плана»: хранит само приложение в телефоне, чтобы оно открывалось без интернета.
// Куски карты хранит не он, а сама страница (IndexedDB «tk-tiles»).
const SHELL = 'polevoy-shell-v1';
const FILES = ['./', './index.html', './lib/leaflet.min.css', './lib/leaflet.min.js', './lib/proj4.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Своё приложение: сначала сеть (чтобы получать обновления), без сети — из сохранённого. Чужие адреса не трогаем.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const copy = r.clone(); caches.open(SHELL).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
