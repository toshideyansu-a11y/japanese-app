"use strict";
// Som: vozes gravadas (audio/*.mp3) + efeitos sonoros + voz do aparelho como reserva.
// No iPhone: a voz toca por um elemento <audio> (não é cortada pela chave de silêncio) e tudo é
// liberado no primeiro toque na tela.
const Sound = (() => {
  let ctx = null, voiceEl = null, elOK = false, elBusy = false, seq = 0, jaVoice = null, onState = null, ttsPrimed = false;
  const blobs = new Map();   // chave → URL do áudio já baixado
  const pending = new Map();
  const MAXBLOBS = 90;
  let playing = false;

  // WAV mudo curtinho, para "acordar" o elemento de áudio no primeiro toque
  const SIL = (() => {
    const n = 800, b = new ArrayBuffer(44 + n), v = new DataView(b), w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, "RIFF"); v.setUint32(4, 36 + n, true); w(8, "WAVEfmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, "data"); v.setUint32(40, n, true);
    for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
    try { return URL.createObjectURL(new Blob([b], { type: "audio/wav" })); } catch (e) { return ""; }
  })();

  function el() {
    if (!voiceEl) { voiceEl = new Audio(); voiceEl.preload = "auto"; voiceEl.setAttribute("playsinline", ""); }
    return voiceEl;
  }
  function unlock() {
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) { /* ok */ }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!ctx && AC) { try { ctx = new AC(); } catch (e) { ctx = null; } }
    if (ctx && ctx.state !== "running") { try { ctx.resume().catch(() => {}); } catch (e) { /* ok */ } }
    if (!elOK && !elBusy && !playing && SIL) {
      elBusy = true;
      const a = el();
      a.src = SIL;
      let p;
      try { p = a.play(); } catch (e) { p = null; }
      if (p && p.then) p.then(() => { elOK = true; }).catch(() => {}).then(() => { elBusy = false; });
      else elBusy = false;
    }
    pickVoice();
    // a voz do aparelho também precisa ser "acordada" por um toque
    if (!ttsPrimed && window.speechSynthesis && S.settings.voice === "tts") {
      ttsPrimed = true;
      try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; u.lang = "ja-JP"; speechSynthesis.speak(u); } catch (e) { /* ok */ }
    }
  }
  ["touchend", "pointerup", "click", "keydown"].forEach(ev => document.addEventListener(ev, unlock, { capture: true, passive: true }));
  document.addEventListener("visibilitychange", () => { if (!document.hidden && ctx && ctx.state !== "running") { try { ctx.resume().catch(() => {}); } catch (e) { /* ok */ } } });

  // ── Voz do aparelho (reserva e opção nos ajustes) ──
  function pickVoice() {
    if (jaVoice || !window.speechSynthesis) return;
    const vs = speechSynthesis.getVoices().filter(v => /^ja/i.test(v.lang));
    if (!vs.length) return;
    const score = v => (/premium|enhanced|siri/i.test(v.name) ? 4 : 0) + (/kyoko|o-ren|hattori/i.test(v.name) ? 2 : 0) + (v.localService ? 1 : 0);
    jaVoice = vs.sort((a, b) => score(b) - score(a))[0];
  }
  if (window.speechSynthesis) { try { speechSynthesis.onvoiceschanged = pickVoice; } catch (e) { /* ok */ } }
  const hasTTS = () => !!window.speechSynthesis;
  function tts(text, rate) {
    return new Promise(res => {
      if (!window.speechSynthesis || !text) return res(false);
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "ja-JP"; if (jaVoice) u.voice = jaVoice;
        u.rate = (rate || 1) * 0.9;
        let done = false; const fin = ok => { if (!done) { done = true; res(ok); } };
        u.onend = () => fin(true); u.onerror = () => fin(false);
        speechSynthesis.speak(u);
        setTimeout(() => fin(true), 9000);
      } catch (e) { res(false); }
    });
  }

  // ── Vozes gravadas ──
  const urlOf = key => (typeof AUDIO !== "undefined" && AUDIO[key]) ? `audio/${AUDIO[key]}.mp3` : null;
  function fetchBlob(key) {
    if (blobs.has(key)) { const u = blobs.get(key); blobs.delete(key); blobs.set(key, u); return Promise.resolve(u); }
    if (pending.has(key)) return pending.get(key);
    const p = fetch(urlOf(key)).then(r => { if (!r.ok) throw new Error("http " + r.status); return r.arrayBuffer(); }).then(buf => {
      const u = URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" }));
      blobs.set(key, u); pending.delete(key);
      if (blobs.size > MAXBLOBS) { const k = blobs.keys().next().value; URL.revokeObjectURL(blobs.get(k)); blobs.delete(k); }
      return u;
    }).catch(e => { pending.delete(key); throw e; });
    pending.set(key, p);
    return p;
  }
  function preload(list) { (list || []).forEach(a => { if (a && urlOf(a.key) && S.settings.voice === "rec") fetchBlob(a.key).catch(() => {}); }); }
  // Reserva: toca pelo WebAudio se o elemento <audio> for recusado
  function playBuffer(url, rate) {
    return new Promise((res, rej) => {
      if (!ctx) return rej(new Error("sem contexto"));
      fetch(url).then(r => r.arrayBuffer()).then(b => new Promise((ok, no) => ctx.decodeAudioData(b, ok, no))).then(buf => {
        const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate || 1; src.connect(ctx.destination);
        src.onended = () => res(true); src.start();
      }).catch(rej);
    });
  }
  function stop() {
    seq++; playing = false;
    if (voiceEl) { try { voiceEl.pause(); } catch (e) { /* ok */ } }
    if (window.speechSynthesis) { try { speechSynthesis.cancel(); } catch (e) { /* ok */ } }
    if (onState) { onState(false); onState = null; }
  }
  // Fala um áudio {key, text}. Resolve quando termina. opts: { rate, onState(bool) }
  function say(a, opts) {
    opts = opts || {};
    stop();
    if (!a) return Promise.resolve(false);
    const my = ++seq, rate = opts.rate || 1;
    onState = opts.onState || null;
    if (onState) onState(true);
    const finish = ok => { if (my === seq) { playing = false; if (onState) { onState(false); onState = null; } } return ok; };
    if (S.settings.voice === "tts" || !urlOf(a.key)) return tts(a.text, rate).then(finish);
    playing = true;
    return fetchBlob(a.key).then(url => new Promise(res => {
      if (my !== seq) return res(false);
      const au = el();
      let done = false, timer = null;
      const fin = ok => { if (done) return; done = true; clearTimeout(timer); au.onended = au.onerror = null; res(ok); };
      au.onended = () => fin(true);
      au.onerror = () => { if (my === seq) playBuffer(url, rate).then(() => fin(true)).catch(() => tts(a.text, rate).then(fin)); else fin(false); };
      au.src = url;
      try { au.defaultPlaybackRate = rate; au.playbackRate = rate; } catch (e) { /* ok */ }
      let p;
      try { p = au.play(); } catch (e) { p = Promise.reject(e); }
      if (p && p.then) p.then(() => { elOK = true; try { au.playbackRate = rate; } catch (e) { /* ok */ } }).catch(err => {
        if (my !== seq || (err && err.name === "AbortError")) return fin(false);
        playBuffer(url, rate).then(() => fin(true)).catch(() => tts(a.text, rate).then(fin));
      });
      timer = setTimeout(() => fin(true), 15000);
    })).catch(() => (my === seq ? tts(a.text, rate) : false)).then(finish);
  }

  // ── Efeitos sonoros (sintetizados) ──
  function tone(f, t, dur, type, vol, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain(), t0 = ctx.currentTime + t;
    o.type = type || "sine"; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.18, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + dur + 0.03);
  }
  const FX = {
    tap: () => tone(660, 0, 0.05, "triangle", 0.07),
    pick: () => tone(520, 0, 0.07, "sine", 0.1, 700),
    drop: () => tone(700, 0, 0.07, "sine", 0.08, 480),
    ok: n => { const k = Math.pow(2, Math.min(n || 0, 8) / 12); tone(659 * k, 0, 0.12, "triangle", 0.2); tone(988 * k, 0.09, 0.26, "triangle", 0.2); tone(1976 * k, 0.09, 0.2, "sine", 0.05); },
    no: () => { tone(260, 0, 0.16, "sawtooth", 0.07, 200); tone(196, 0.14, 0.26, "sawtooth", 0.07, 150); },
    stroke: () => tone(880, 0, 0.09, "sine", 0.12, 1320),
    match: () => { tone(784, 0, 0.09, "triangle", 0.16); tone(1175, 0.07, 0.16, "triangle", 0.16); },
    win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => { tone(f, i * 0.1, 0.32, "triangle", 0.17); tone(f * 2, i * 0.1, 0.2, "sine", 0.04); }),
    level: () => [392, 523, 659, 784, 1047, 1568].forEach((f, i) => tone(f, i * 0.085, 0.4, "triangle", 0.16)),
    tick: () => tone(1200, 0, 0.03, "square", 0.03),
    over: () => { tone(523, 0, 0.18, "triangle", 0.16); tone(392, 0.16, 0.18, "triangle", 0.16); tone(330, 0.32, 0.4, "triangle", 0.16); },
  };
  function sfx(name, arg) {
    if (!S.settings.sfx || !ctx || !FX[name]) return;
    try { if (ctx.state !== "running") ctx.resume(); FX[name](arg); } catch (e) { /* ok */ }
  }
  return { say, stop, sfx, preload, unlock, tts, hasTTS, urlOf, state: () => ({ ctx: ctx ? ctx.state : "none", elOK, session: !!navigator.audioSession }) };
})();

const SPK_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
// Botão de ouvir: <button class="spk" data-say='{"key":..,"text":..}'>
function spk(a, cls, slow) {
  return `<button class="spk ${cls || ""}" data-say="${esc(JSON.stringify(a))}"${slow ? ' data-rate="0.72"' : ""} aria-label="${slow ? "Ouvir devagar" : "Ouvir"}">${slow ? "🐢" : SPK_ICON}</button>`;
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-say]");
  if (!b) return;
  e.stopPropagation();
  let a; try { a = JSON.parse(b.dataset.say); } catch (err) { return; }
  Sound.say(a, { rate: parseFloat(b.dataset.rate) || 1, onState: on => b.classList.toggle("playing", on) });
});
