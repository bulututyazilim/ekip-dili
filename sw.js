// Ekip Dili servis çalışanı: uygulamayı önbelleğe alır, internetsiz de açılır.
var CACHE = "ekip-dili-v6";
var DOSYALAR = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(DOSYALAR); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (anahtarlar) {
      return Promise.all(anahtarlar.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Önce önbellek, arkada güncelle. Başka sitelere (Gemini, OpenRouter) dokunmaz.
self.addEventListener("fetch", function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      var ag = fetch(e.request).then(function (r) {
        if (r && r.ok) {
          var kopya = r.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, kopya); });
        }
        return r;
      }).catch(function () { return hit; });
      return hit || ag;
    })
  );
});
