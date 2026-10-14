// Offline-Cache.
// Startseite und config.js: zuerst Netz, Cache nur offline (damit Updates sofort ankommen).
// Übrige Dateien (Skripte, Schriften, Icons, mit Hash im Namen): Cache zuerst, im Hintergrund aktualisiert.
// Google-Anfragen (Sync) laufen nie über diesen Cache.
const CACHE = "tum-planer-v2";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html", "./manifest.webmanifest", "./config.js"]).catch(() => {}))); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  const fresh = req.mode === "navigate" || url.pathname.endsWith("/config.js") || url.pathname.endsWith("/manifest.webmanifest");
  e.respondWith(caches.open(CACHE).then(async (c) => {
    if (fresh) {
      try {
        const res = await fetch(req, { cache: "no-store" });
        if (res.ok) c.put(req, res.clone());
        return res;
      } catch {
        return (await c.match(req, { ignoreSearch: true })) || (await c.match("./index.html")) || Response.error();
      }
    }
    const hit = await c.match(req);
    const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
