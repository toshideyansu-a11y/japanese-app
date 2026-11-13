"use strict";
// Início do app.
load();
App.render();
if (!S.onboarded) onboarding();
checkAch();

// Funciona sem internet: guarda o app e, aos poucos, todas as vozes.
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
  const FLAG = "nihongo-audio-cached";
  const files = uniq(Object.values(AUDIO)).map(h => `audio/${h}.mp3`);
  const cacheAudio = async () => {
    if (!navigator.onLine || !("caches" in window) || localStorage.getItem(FLAG) === String(files.length)) return;
    try {
      const cache = await caches.open("nihongo-audio-v1");
      const have = new Set((await cache.keys()).map(r => new URL(r.url).pathname.split("/").pop()));
      const todo = files.filter(f => !have.has(f.split("/").pop()));
      for (let i = 0; i < todo.length; i += 6) {
        if (document.hidden) return;
        await Promise.all(todo.slice(i, i + 6).map(f => fetch(f).then(r => (r.ok ? cache.put(f, r) : null)).catch(() => {})));
      }
      localStorage.setItem(FLAG, String(files.length));
    } catch (e) { /* tenta de novo na próxima vez */ }
  };
  setTimeout(cacheAudio, 6000);
}
// Para testes automáticos
window.KAPI = { solve: w => Session.cur && Session.cur.api && Session.cur.api.solve && Session.cur.api.solve(w), get state() { return S; }, Session, App };
