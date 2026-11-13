// Guarda os arquivos para o app funcionar sem internet.
const CACHE = "nihongo-v3", AUDIO_CACHE = "nihongo-audio-v1";
const FILES = ["./", "index.html", "css/app.css", "manifest.json", "apple-touch-icon.png", "icon-192.png", "icon-512.png",
  "js/data/kanji.js", "js/data/words.js", "js/data/units.js", "js/data/stories.js", "js/data/strokes.js", "js/data/audio-index.js",
  "js/core.js", "js/sound.js", "js/mascot.js", "js/exercises.js", "js/session.js", "js/screens.js", "js/main.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== AUDIO_CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;
  // Vozes: nunca mudam, então a cópia guardada vem primeiro.
  if (req.url.includes("/audio/")) {
    e.respondWith(caches.open(AUDIO_CACHE).then(c => c.match(req.url).then(hit => hit || fetch(req.url).then(r => { if (r.ok) c.put(req.url, r.clone()); return r; }))));
    return;
  }
  // Resto: tenta a rede (para pegar atualizações); sem internet ou com rede lenta, usa a cópia guardada.
  e.respondWith(new Promise(resolve => {
    let settled = false;
    const fromCache = () => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html"));
    const timer = setTimeout(() => fromCache().then(r => { if (r && !settled) { settled = true; resolve(r); } }), 3500);
    fetch(req).then(r => {
      clearTimeout(timer);
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      if (!settled) { settled = true; resolve(r); }
    }).catch(() => { clearTimeout(timer); fromCache().then(r => { if (!settled) { settled = true; resolve(r || Response.error()); } }); });
  }));
});
