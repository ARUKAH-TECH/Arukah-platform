// ZIVARUKAH Admin app. Makes the admin installable and shows a friendly page
// when there's no internet. It deliberately caches NOTHING from the admin
// itself (private data never stays on the phone) — only the offline page.
const CACHE = "ziv-admin-offline-v1";
const OFFLINE = ["/admin-offline.html", "/admin-icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(OFFLINE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("ziv-admin-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.mode !== "navigate") return; // everything else: normal network
  event.respondWith(fetch(request).catch(() => caches.match("/admin-offline.html")));
});
