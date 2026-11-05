// R.O.M Bible Guide (zivarukah.com/bible). Keeps the Bible pages you have opened,
// so they still open without internet. Newest version first when online.
const CACHE = "ziv-bible-v3"; // keep the name: changing it wipes saved chapters
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

  // Bible pages: from the internet, but if the connection is slow (no answer
  // within 3 seconds) show the saved copy straight away, and save the fresh
  // page for next time when it arrives.
  if (request.mode === "navigate" && url.pathname.startsWith("/bible")) {
    const network = fetch(request).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(url.pathname, copy));
      }
      return res;
    });
    const saved = () => caches.match(url.pathname).then((hit) => hit || caches.match("/bible"));
    event.respondWith(
      new Promise((resolve) => {
        let done = false;
        const finish = (res) => {
          if (!done && res) {
            done = true;
            resolve(res);
          }
        };
        const timer = setTimeout(() => caches.match(url.pathname).then(finish), 3000); // only this exact page
        network
          .then((res) => {
            clearTimeout(timer);
            finish(res);
          })
          .catch(() => {
            clearTimeout(timer);
            saved().then((hit) => (hit ? finish(hit) : finish(Response.error())));
          });
        // If there is no saved copy yet, keep waiting for the internet.
      }),
    );
    event.waitUntil(network.catch(() => {}));
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
