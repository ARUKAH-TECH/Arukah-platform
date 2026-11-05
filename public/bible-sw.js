// Holy Bible app (zivarukah.com/bible). Keeps the Bible pages you have opened,
// so they still open without internet. Newest version first when online.
const CACHE = "ziv-bible-v1";
const START = ["/bible", "/bible/books", "/bible-icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(START)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("ziv-bible-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Build files never change once published: cache first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/bible-icons/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) caches.open(CACHE).then((c) => c.put(request, res.clone()));
            return res;
          }),
      ),
    );
    return;
  }

  // Bible pages: from the internet when possible, else the saved copy.
  if (request.mode === "navigate" && url.pathname.startsWith("/bible")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(url.pathname, copy));
          }
          return res;
        })
        .catch(() => caches.match(url.pathname).then((hit) => hit || caches.match("/bible"))),
    );
  }
});
