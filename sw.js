/* 学了么 v3：阅读与投资工具各有导航入口；缓存只含公开代码与文章。
   个人行情存于 IndexedDB，不经网络、不加入 Service Worker 缓存。 */
var CACHE_NAME = 'xuelema-v14';
var ASSETS = [
  './index.html?v=3.1', './styles.css?v=3.1', './app.js?v=3.1', './data.js?v=3.1',
  './content-crisis.js', './content-china.js', './content-biographies.js?v=3.1',
  './content-worldhist.js?v=3.1', './content-econ.js?v=3.1', './content-money.js?v=3.1',
  './content-powers.js?v=3.1', './content-people.js?v=3.1', './manifest.webmanifest?v=3.1',
  './icon-192-v2.png', './icon-512-v2.png', './apple-touch-icon-v2.png',
  './invest/index.html?v=3.1', './invest/invest.css?v=3.1', './invest/engine.js?v=3.1',
  './invest/data-store.js?v=3.1', './invest/events.js?v=3.1', './invest/invest.js?v=3.1'
];
self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    return cache.addAll(ASSETS);
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return /^xuelema-v\d+$/.test(key) && key !== CACHE_NAME; }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});
function offlinePage(path) {
  var base = new URL(self.registration.scope).pathname;
  if (path === base || path === base + 'index.html') return './index.html?v=3.1';
  if (path === base + 'invest/' || path === base + 'invest/index.html' || path === base + 'invest') return './invest/index.html?v=3.1';
  return null;
}
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  var page = event.request.mode === 'navigate' ? offlinePage(url.pathname) : null;
  var request = page ? new Request(new URL(page, self.registration.scope), { cache: 'no-store' }) : event.request;
  event.respondWith(fetch(request).then(function (response) {
    if (response.ok && response.type !== 'opaque') {
      var copy = response.clone();
      event.waitUntil(caches.open(CACHE_NAME).then(function (cache) { return cache.put(request, copy); }));
    }
    return response;
  }).catch(function () {
    return caches.match(request).then(function (cached) {
      return cached || new Response('暂时离线，请联网后重试。', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    });
  }));
});
