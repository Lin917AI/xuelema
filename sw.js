/* ==========================================================
   学了么 · Service Worker（离线缓存）
   策略：联网时优先取最新内容并更新缓存；断网时用缓存。
   每次发布新内容时，把下面的版本号加 1（如 v1 → v2）。
   ========================================================== */

var CACHE_NAME = "xuelema-v8";

var ASSETS = [
  "./index.html?v=1.6",
  "./styles.css?v=1.6",
  "./app.js?v=1.6",
  "./data.js?v=1.6",
  "./content-crisis.js",
  "./content-china.js",
  "./content-biographies.js?v=1.6",
  "./content-worldhist.js",
  "./content-econ.js",
  "./content-money.js",
  "./content-powers.js",
  "./content-people.js",
  "./manifest.webmanifest?v=1.6",
  "./icon-192-v2.png",
  "./icon-512-v2.png",
  "./apple-touch-icon-v2.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE_NAME) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  // 导航始终绕过 HTTP 缓存取最新版 HTML，避免已安装 PWA 长时间停留在旧版。
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch("./index.html?v=1.6", { cache: "no-store" }).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put("./index.html?v=1.6", copy);
        });
        return res;
      }).catch(function () {
        return caches.match("./index.html?v=1.6");
      })
    );
    return;
  }

  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE_NAME).then(function (cache) { cache.put(e.request, copy); });
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (hit) {
        if (hit) return hit;
        if (e.request.mode === "navigate") return caches.match("./index.html");
      });
    })
  );
});
