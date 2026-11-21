// Gör att appen startar även utan täckning (sidan och verktygen sparas i telefonen).
const CACHE = "tidrapport-v1";
const FILER = ["./", "index.html", "config.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILER)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  const egen = u.origin === location.origin;
  const verktyg = u.hostname === "www.gstatic.com" || u.hostname === "cdnjs.cloudflare.com";
  if (!egen && !verktyg) return;                  // databas och inloggning går alltid direkt
  if (egen && (e.request.mode === "navigate" || u.pathname.endsWith("config.js"))) {
    // Sidan: försök hämta senaste versionen, annars den sparade
    e.respondWith(fetch(e.request).then(r => { const k = r.clone(); caches.open(CACHE).then(c => c.put(e.request, k)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
    return;
  }
  // Övrigt: sparad kopia direkt, uppdatera i bakgrunden
  e.respondWith(caches.match(e.request).then(sparad => {
    const nat = fetch(e.request).then(r => { if (r && (r.ok || r.type === "opaque")) { const k = r.clone(); caches.open(CACHE).then(c => c.put(e.request, k)); } return r; }).catch(() => sparad);
    return sparad || nat;
  }));
});
