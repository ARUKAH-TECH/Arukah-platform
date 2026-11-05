// ZIVARUKAH Admin app. Makes the admin installable, opens it faster and shows
// a friendly page when there's no internet.
// Private data never stays on the phone: admin PAGES are never saved. Only the
// app's public building blocks (scripts, styles, fonts, icons — the same for
// everyone, under /_next/static/) are kept, so they don't download every time.
const CACHE = "ziv-admin-offline-v1";
const STATIC = "ziv-admin-static-v1";
const OFFLINE = ["/admin-offline.html", "/admin-icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(OFFLINE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("ziv-admin-") && k !== CACHE && k !== STATIC).map((k) => caches.delete(k))))
      // Start loading the page while the app wakes up (faster on slow phones).
      .then(() => (self.registration.navigationPreload ? self.registration.navigationPreload.enable().catch(() => {}) : null))
      .then(() => self.clients.claim()),
  );
});

// Keep the saved building blocks from growing for ever (each release adds new files).
async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length > 400) await Promise.all(keys.slice(0, keys.length - 300).map((k) => cache.delete(k)));
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    // Admin pages: always fresh from the internet (never saved).
    event.respondWith(
      Promise.resolve(event.preloadResponse)
        .then((preloaded) => preloaded || fetch(request))
        .catch(() => caches.match("/admin-offline.html")),
    );
    return;
  }

  // Build files never change once published (their names change instead): saved copy first.
  if (request.method === "GET" && url.origin === self.location.origin && (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/admin-icons/"))) {
    event.respondWith(
      caches.open(STATIC).then((cache) =>
        cache.match(request).then(
          (hit) =>
            hit ||
            fetch(request).then((res) => {
              if (res.ok) cache.put(request, res.clone()).then(() => trim(cache));
              return res;
            }),
        ),
      ),
    );
  }
  // Everything else (data, uploads, sign-in): normal internet.
});
