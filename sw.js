const CACHE="koala-v1-5";
const ASSETS=["./","index.html","koala-v1-5.css","koala-v1-5.js","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/koala-logo.png","icons/koala-hero.png","icons/koala-recap.png"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.mode==="navigate"){e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{const x=r.clone();caches.open(CACHE).then(c=>c.put("index.html",x));return r}).catch(()=>caches.match("index.html")));return}e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{const x=r.clone();caches.open(CACHE).then(c=>c.put(e.request,x));return r}).catch(()=>caches.match(e.request)))});
