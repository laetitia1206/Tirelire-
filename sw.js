const CACHE="tirelire-v1-2";
const ASSETS=["./","style.css","app.js","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png"];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put("./", copy));
          return response;
        })
        .catch(() => caches.match("./"))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
