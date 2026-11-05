// R.O.M Bible Guide (zivarukah.com/bible). Keeps the Bible pages you have opened,
// so the app opens at once and still works without internet. A page saved in
// the last 3 hours opens instantly and is refreshed in the background; an
// older copy waits up to 2 seconds for the internet, then opens anyway.
const CACHE = "ziv-bible-v3"; // keep the name: changing it wipes saved chapters
const START = ["/bible", "/bible/books", "/bible/devotionals", "/bible/studies", "/bible/topics", "/bible-icons/icon-192.png"];
const FRESH_MS = 3 * 3600 * 1000;

self.addEventListener("install", (event) => {
  // Save the main pages now, one by one (one failing doesn't stop the rest).
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(START.map((u) => cache.add(u).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("ziv-bible-") && k !== CACHE).map((k) => caches.delete(k))))
      // Start loading the page while the app wakes up (faster on slow phones).
      .then(() => (self.registration.navigationPreload ? self.registration.navigationPreload.enable().catch(() => {}) : null))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Build files never change once published: cache first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/bible-icons/") || url.pathname.startsWith("/bible-versions/")) {
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

  // Bible pages: the saved copy first (instant), refreshed in the background.
  if (request.mode === "navigate" && url.pathname.startsWith("/bible")) {
    // Searches and questions (?q=…) are saved under their full address and
    // always asked from the internet first.
    const key = url.search ? url.pathname + url.search : url.pathname;
    const network = Promise.resolve(event.preloadResponse)
      .then((preloaded) => preloaded || fetch(request))
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(key, copy));
        }
        return res;
      });
    event.waitUntil(network.catch(() => {}));
    event.respondWith(
      caches.match(key).then((hit) => {
        if (hit && url.search) return network.then((res) => (res && res.ok ? res : hit)).catch(() => hit);
        if (hit) {
          const saved = Date.parse(hit.headers.get("date") || "") || 0;
          if (Date.now() - saved < FRESH_MS) return hit;
          return Promise.race([network.then((res) => (res && res.ok ? res : hit)).catch(() => hit), new Promise((resolve) => setTimeout(() => resolve(hit), 2000))]);
        }
        return network.catch(() => caches.match("/bible").then((home) => home || Response.error()));
      }),
    );
  }
});

// Daily devotional notification. The push itself carries nothing: we fetch
// today's devotional and scripture from the site and show them.
self.addEventListener("push", (event) => {
  event.waitUntil(
    fetch("/api/bible/today", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((note) =>
        self.registration.showNotification((note && note.title) || "R.O.M Bible Guide", {
          body: (note && note.body) || "Today's devotional and scripture are ready. Tap to read.",
          icon: "/bible-icons/icon-192.png",
          tag: "rom-daily",
          renotify: true,
          data: { url: (note && note.url) || "/bible" },
        }),
      ),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/bible";
  event.waitUntil(self.clients.openWindow(url));
});
