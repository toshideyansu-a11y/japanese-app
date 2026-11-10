"use strict";

// ---------- Armazenamento ----------
const KEY = "nihongo-v1";
const DAY = 86400000;

function defaultState() {
  return { cards: {}, custom: [], xp: 0, settings: { newPerDay: 8, sound: true }, daily: { date: "", newDone: 0, reviewed: 0 }, streak: { last: "", count: 0 } };
}
let state = defaultState();
try {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const saved = JSON.parse(raw);
    state = Object.assign(defaultState(), saved);
    state.settings = Object.assign(defaultState().settings, saved.settings || {});
  }
} catch (e) { /* sem armazenamento: o app funciona só nesta sessão */ }
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

function ymd(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function today() { return ymd(new Date()); }
function yesterday() { return ymd(new Date(Date.now() - DAY)); }
function rollDay() {
  if (state.daily.date !== today()) state.daily = { date: today(), newDone: 0, reviewed: 0 };
}

// ---------- Baralho ----------
// Ordem dos cartões novos: alterna kanji e palavras para variar (prática intercalada).
function allCards() {
  const list = [];
  const ks = KANJI.map(k => ({ id: "k:" + k.k, type: "kanji", item: k }));
  const ws = [];
  WORDS.forEach(w => {
    ws.push({ id: "wj:" + w.j, type: "jp2pt", item: w });
    ws.push({ id: "wp:" + w.j, type: "pt2jp", item: w });
  });
  const max = Math.max(ks.length, ws.length);
  for (let i = 0; i < max; i++) {
    if (ws[i]) list.push(ws[i]);
    if (ks[i]) list.push(ks[i]);
  }
  state.custom.forEach(c => {
    list.push({ id: "cj:" + c.id, type: "jp2pt", item: c, custom: true });
    list.push({ id: "cp:" + c.id, type: "pt2jp", item: c, custom: true });
  });
  return list;
}

// ---------- FSRS (repetição espaçada) ----------
const W = [0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616, 0.1544, 1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407, 2.9466, 0.5034, 0.6567];
const DECAY = -0.5, FACTOR = 19 / 81;
const clampD = d => Math.min(10, Math.max(1, d));
const initD = g => clampD(W[4] - Math.exp(W[5] * (g - 1)) + 1);
const retr = (t, s) => Math.pow(1 + FACTOR * t / s, DECAY);

function schedule(c, g, now) {
  // c: {s, d, last, reps, lapses}; g: 1 errei, 2 difícil, 3 bom, 4 fácil
  const n = Object.assign({ reps: 0, lapses: 0 }, c);
  if (!c || c.s == null) {
    n.s = W[g - 1];
    n.d = initD(g);
  } else {
    const t = Math.max(0, (now - c.last) / DAY);
    const r = retr(t, c.s);
    if (t < 1) {
      // Revisão no mesmo dia (ex.: depois de errar): ajuste curto do FSRS-5.
      n.s = c.s * Math.exp(W[17] * (g - 3 + W[18]));
      if (g === 1) n.lapses++;
    } else if (g === 1) {
      n.s = Math.min(c.s, W[11] * Math.pow(c.d, -W[12]) * (Math.pow(c.s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r)));
      n.lapses++;
    } else {
      const hard = g === 2 ? W[15] : 1, easy = g === 4 ? W[16] : 1;
      n.s = c.s * (Math.exp(W[8]) * (11 - c.d) * Math.pow(c.s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * hard * easy + 1);
    }
    const d2 = c.d - W[6] * (g - 3);
    n.d = clampD(W[7] * initD(4) + (1 - W[7]) * d2);
  }
  n.reps++;
  n.last = now;
  // Errou: volta daqui a pouco na mesma sessão. Senão: intervalo em dias (90% de chance de lembrar).
  const days = g === 1 ? 0 : Math.min(365, Math.max(1, Math.round(n.s)));
  n.due = g === 1 ? now + 60 * 1000 : startOfDay(now) + days * DAY;
  n.days = days;
  return n;
}
function startOfDay(ms) { const d = new Date(ms); d.setHours(4, 0, 0, 0); return d.getTime(); }
function label(days) {
  if (days === 0) return "agora";
  if (days < 30) return days + "d";
  if (days < 365) return Math.round(days / 30) + "m";
  return "1a";
}

// ---------- Fila de estudo ----------
let queue = [];
let current = null;
let revealed = false;
let session = null;

function buildQueue() {
  rollDay();
  const now = Date.now();
  const cards = allCards();
  const due = cards.filter(c => state.cards[c.id] && state.cards[c.id].due <= now);
  due.sort((a, b) => state.cards[a.id].due - state.cards[b.id].due);
  const left = Math.max(0, state.settings.newPerDay - state.daily.newDone);
  const fresh = cards.filter(c => !state.cards[c.id]).slice(0, left);
  // Cartões novos espalhados entre as revisões.
  const q = due.slice();
  fresh.forEach((c, i) => q.splice(Math.min(q.length, (i + 1) * 3), 0, c));
  return q;
}
function counts() {
  const q = buildQueue();
  return { review: q.filter(c => state.cards[c.id]).length, fresh: q.filter(c => !state.cards[c.id]).length };
}

// ---------- Nível (XP) ----------
const XP_PER_LEVEL = 150;
const RANKS = ["はじめ", "たまご", "わかば", "つぼみ", "さくら", "たけ", "まつ", "ふじ", "たいよう", "めいじん"];
function level() { return Math.floor(state.xp / XP_PER_LEVEL) + 1; }
function rank(l) { return RANKS[Math.min(RANKS.length - 1, l - 1)]; }

// ---------- Voz ----------
let jaVoice = null;
function pickVoice() {
  if (!("speechSynthesis" in window)) return;
  const vs = speechSynthesis.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith("ja"));
  jaVoice = vs.find(v => /kyoko|otoya|o-ren|siri/i.test(v.name)) || vs[0] || null;
}
if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ja-JP";
  if (jaVoice) u.voice = jaVoice;
  u.rate = 0.85;
  speechSynthesis.speak(u);
}

// ---------- Efeitos sonoros (gerados, sem arquivos) ----------
let actx = null;
function tone(freq, start, dur, type, vol) {
  if (!state.settings.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime + start;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t); o.stop(t + dur + 0.05);
  } catch (e) {}
}
const sfx = {
  good: () => { tone(1318.5, 0, 0.25); tone(1760, 0.08, 0.35); },
  easy: () => { tone(1046.5, 0, 0.2); tone(1318.5, 0.07, 0.2); tone(1760, 0.14, 0.4); },
  hard: () => { tone(880, 0, 0.3, "triangle", 0.12); },
  miss: () => { tone(330, 0, 0.25, "triangle", 0.12); tone(262, 0.1, 0.35, "triangle", 0.1); },
  flip: () => { tone(600, 0, 0.06, "sine", 0.05); },
  combo: () => { [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(f, i * 0.06, 0.25, "sine", 0.12)); },
  fanfare: () => { [523.3, 659.3, 784, 1046.5, 784, 1046.5].forEach((f, i) => tone(f, i * 0.12, 0.35, "triangle", 0.14)); },
};

// ---------- Efeitos visuais ----------
const $ = sel => document.querySelector(sel);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const app = () => $("#app");

// Pétalas de sakura saindo de um ponto.
function petals(x, y, n) {
  for (let i = 0; i < n; i++) {
    const p = document.createElement("i");
    p.className = "petal";
    const ang = Math.random() * Math.PI * 2, dist = 60 + Math.random() * 120;
    p.style.left = x + "px"; p.style.top = y + "px";
    p.style.setProperty("--dx", Math.cos(ang) * dist + "px");
    p.style.setProperty("--dy", Math.sin(ang) * dist - 40 + "px");
    p.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg");
    p.style.animationDelay = Math.random() * 0.08 + "s";
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1600);
  }
}
// Chuva de sakura pela tela toda (tela de parabéns).
function sakuraRain(n) {
  for (let i = 0; i < n; i++) {
    const p = document.createElement("i");
    p.className = "petal fall";
    p.style.left = Math.random() * 100 + "vw";
    p.style.animationDuration = 3 + Math.random() * 3 + "s";
    p.style.animationDelay = Math.random() * 2.5 + "s";
    p.style.setProperty("--sway", (Math.random() * 120 - 60) + "px");
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 9000);
  }
}
function floatText(text, x, y, cls) {
  const t = document.createElement("div");
  t.className = "float " + (cls || "");
  t.textContent = text;
  t.style.left = x + "px"; t.style.top = y + "px";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1200);
}

// Animação da ordem dos traços (dados do KanjiVG).
function strokeSVG(k, cls) {
  const paths = (typeof STROKES !== "undefined" && STROKES[k]) || null;
  if (!paths) return `<div class="big-kanji">${esc(k)}</div>`;
  return `<svg class="strokes ${cls || ""}" viewBox="0 0 109 109" aria-label="${esc(k)}">
    <g class="ghost">${paths.map(d => `<path d="${d}"/>`).join("")}</g>
    <g class="ink">${paths.map(d => `<path d="${d}"/>`).join("")}</g>
  </svg>`;
}
function animateStrokes(svg) {
  if (!svg) return;
  const ps = svg.querySelectorAll(".ink path");
  const step = Math.min(0.55, 3.2 / ps.length);
  ps.forEach((p, i) => {
    const len = p.getTotalLength();
    p.style.transition = "none";
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
    p.getBoundingClientRect();
    p.style.transition = `stroke-dashoffset ${step * 0.9}s ease-in-out ${0.15 + i * step}s`;
    p.style.strokeDashoffset = 0;
  });
  svg.querySelectorAll(".num").forEach(n => n.remove());
}

// ---------- Telas ----------
function learnedCount() {
  return Object.values(state.cards).filter(c => c.days >= 21).length;
}

function home() {
  const c = counts();
  const total = allCards().length;
  const seen = Object.keys(state.cards).length;
  const kSeen = KANJI.filter(k => state.cards["k:" + k.k]).length;
  const streak = state.streak.last === today() || state.streak.last === yesterday() ? state.streak.count : 0;
  const nothing = c.review + c.fresh === 0;
  const lv = level(), into = state.xp % XP_PER_LEVEL;
  const pick = KANJI[Math.floor(Date.now() / DAY) % KANJI.length];
  app().innerHTML = `
    <header class="top"><h1>日本語 <span>todo dia</span></h1><button id="settings" class="icon" aria-label="Ajustes">⚙︎</button></header>
    <section class="levelbox">
      <div class="lv"><b>Nível ${lv}</b> <span class="rank">${rank(lv)}</span></div>
      <div class="bar xp"><i style="width:${Math.round(into / XP_PER_LEVEL * 100)}%"></i></div>
      <small>${into} / ${XP_PER_LEVEL} XP para o próximo nível</small>
    </section>
    <section class="hero">
      <div class="stat"><b>${c.review}</b><small>revisões</small></div>
      <div class="stat"><b>${c.fresh}</b><small>novos</small></div>
      <div class="stat fire ${streak ? "on" : ""}"><b>${streak ? "🔥" : ""}${streak}</b><small>dias seguidos</small></div>
    </section>
    ${nothing
      ? `<p class="done">Tudo feito por hoje! お疲れさまでした 🌸<br><small>Volte amanhã: revisar no dia certo é o que fixa a memória.</small></p>`
      : `<button class="primary big pulse" id="start">Começar <span>${c.review + c.fresh} cartões</span></button>`}
    <section class="daily" id="daily">
      <div class="daily-k">${strokeSVG(pick.k, "mini")}</div>
      <div><small>Kanji do dia · toque para ver os traços</small><b>${esc(pick.k)} — ${esc(pick.pt)}</b><span class="r">${esc(pick.kun || pick.on)}</span></div>
    </section>
    <section class="card-list">
      <h2>Seu progresso</h2>
      <div class="bar"><i style="width:${Math.round(seen / total * 100)}%"></i></div>
      <p>${seen} de ${total} cartões estudados · ${kSeen} de ${KANJI.length} kanji · ${learnedCount()} bem memorizados</p>
    </section>
    <nav class="row">
      <button id="browse">🀄 Coleção de kanji</button>
      <button id="add">＋ Criar cartão</button>
    </nav>
    <p class="tip">Dica: tente lembrar a resposta <b>antes</b> de virar o cartão. Esse esforço é o que faz memorizar.</p>`;
  if (!nothing) $("#start").onclick = startStudy;
  $("#add").onclick = addCard;
  $("#browse").onclick = browse;
  $("#settings").onclick = settings;
  const d = $("#daily");
  d.onclick = () => { animateStrokes(d.querySelector("svg")); speak(pick.ex[0] ? pick.ex[0][1] : pick.k); };
  setTimeout(() => animateStrokes(d.querySelector("svg")), 300);
}

function startStudy() {
  queue = buildQueue();
  session = { total: queue.length, done: 0, right: 0, answered: 0, combo: 0, best: 0, xp: 0, newKanji: [], startLevel: level() };
  next();
}

function next() {
  current = queue.shift();
  revealed = false;
  if (!current) { finishSession(); return; }
  renderCard(true);
}

function frontHTML(c) {
  const it = c.item;
  if (c.type === "kanji") return `<div class="kind">Kanji · o que significa e como se lê?</div><div class="big-kanji">${esc(it.k)}</div>`;
  if (c.type === "jp2pt") return `<div class="kind">O que significa?</div><div class="jp">${esc(it.j)}</div>`;
  return `<div class="kind">Como se diz em japonês?</div><div class="pt">${esc(it.pt)}</div>`;
}
function backHTML(c) {
  const it = c.item;
  if (c.type === "kanji") {
    return `<div class="kanji-back">
        <button class="stroke-box" id="replay" aria-label="Ver os traços de novo">${strokeSVG(it.k)}<small>↻ traços (${(STROKES[it.k] || []).length})</small></button>
        <div class="kb-info">
          <div class="meaning">${esc(it.pt)}</div>
          <div class="readings"><span><em>on</em> ${esc(it.on || "—")}</span><span><em>kun</em> ${esc(it.kun || "—")}</span></div>
        </div>
      </div>
      ${it.d ? `<div class="hint">💡 ${esc(it.d)}</div>` : ""}
      <ul class="ex">${it.ex.map(e => `<li><button class="say" data-say="${esc(e[1])}">🔊</button><b>${esc(e[0])}</b> <span class="r">${esc(e[1])}</span> — ${esc(e[2])}</li>`).join("")}</ul>`;
  }
  const head = c.type === "jp2pt"
    ? `<div class="meaning">${esc(it.pt)}</div><div class="r">${esc(it.r)}</div>`
    : `<div class="jp">${esc(it.j)}</div><div class="r">${esc(it.r)}</div>`;
  const s = it.s && it.s[0] ? `<div class="sentence"><button class="say" data-say="${esc(it.s[0])}">🔊</button><div><div class="jp-s">${esc(it.s[0])}</div><div class="pt-s">${esc(it.s[1] || "")}</div></div></div>` : "";
  return head + s;
}
function sayText(c) {
  if (c.type === "kanji") return c.item.ex[0] ? c.item.ex[0][1] : c.item.k;
  return c.item.r || c.item.j;
}

function renderCard(entering) {
  const c = current;
  const now = Date.now();
  const st = state.cards[c.id];
  const opts = [1, 2, 3, 4].map(g => schedule(st, g, now).days);
  const names = ["Errei", "Difícil", "Bom", "Fácil"];
  const pct = session.total ? Math.min(100, Math.round(session.done / session.total * 100)) : 0;
  app().innerHTML = `
    <header class="top study"><button id="back" class="link">✕</button>
      <div class="sbar"><i style="width:${pct}%"></i></div>
      <span class="combo ${session.combo >= 3 ? "show" : ""}">🔥${session.combo}</span>
    </header>
    <div class="tags">${st ? "" : `<span class="tag new">✨ novo</span>`}${c.custom ? `<span class="tag">meu cartão</span>` : ""}<span class="tag type-${c.type}">${c.type === "kanji" ? "漢字" : c.type === "jp2pt" ? "言葉 → PT" : "PT → 言葉"}</span></div>
    <section class="flash ${entering ? "enter" : ""} ${revealed ? "flip-in" : ""}" id="flash">
      ${revealed ? backHTML(c) : frontHTML(c)}
      ${revealed && c.type !== "kanji" ? "" : ""}
    </section>
    ${revealed
      ? `<div class="grades">${names.map((n, i) => `<button class="g g${i + 1}" data-g="${i + 1}">${n}<small>${label(opts[i])}</small></button>`).join("")}</div>`
      : `<button class="primary big" id="show">Mostrar resposta</button>`}`;
  $("#back").onclick = () => { save(); home(); };
  if (!revealed) {
    $("#show").onclick = reveal;
    $("#flash").onclick = reveal;
    if (c.type === "jp2pt") speak(sayText(c));
  } else {
    document.querySelectorAll(".say").forEach(b => b.onclick = e => { e.stopPropagation(); speak(b.dataset.say); });
    document.querySelectorAll(".g").forEach(b => b.onclick = e => grade(+b.dataset.g, b));
    const svg = document.querySelector("#flash .strokes");
    if (svg) {
      setTimeout(() => animateStrokes(svg), 250);
      $("#replay").onclick = () => animateStrokes(svg);
    }
  }
}

function reveal() {
  const f = $("#flash");
  if (!f || revealed) return;
  sfx.flip();
  f.classList.add("flip-out");
  setTimeout(() => { revealed = true; renderCard(false); speak(sayText(current)); }, 180);
}

function grade(g, btn) {
  rollDay();
  const now = Date.now();
  const wasNew = !state.cards[current.id];
  state.cards[current.id] = schedule(state.cards[current.id], g, now);
  if (wasNew) state.daily.newDone++;
  state.daily.reviewed++;
  session.answered++;
  const gain = [2, 5, 10, 12][g - 1] + (wasNew ? 5 : 0);
  state.xp += gain; session.xp += gain;
  const r = btn.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top;
  const flash = $("#flash");
  if (g >= 3) {
    session.right++; session.combo++; session.best = Math.max(session.best, session.combo);
    petals(cx, cy, g === 4 ? 22 : 14);
    (g === 4 ? sfx.easy : sfx.good)();
    if (session.combo > 0 && session.combo % 5 === 0) { setTimeout(sfx.combo, 200); floatText(`🔥 ${session.combo} seguidos!`, window.innerWidth / 2, r.top - 80, "big"); }
    if (current.type === "kanji" && wasNew) session.newKanji.push(current.item.k);
    flash.classList.add("good");
  } else if (g === 2) {
    session.combo++; session.best = Math.max(session.best, session.combo);
    sfx.hard(); flash.classList.add("good");
  } else {
    session.combo = 0; sfx.miss(); flash.classList.add("shake");
    queue.splice(Math.min(queue.length, 3), 0, current); // mostra de novo daqui a pouco
  }
  if (g > 1) session.done++;
  floatText("+" + gain + " XP", cx, cy - 10);
  save();
  document.querySelectorAll(".g").forEach(b => b.disabled = true);
  setTimeout(next, g === 1 ? 520 : 420);
}

function finishSession() {
  rollDay();
  let streakUp = false;
  if (state.streak.last !== today()) {
    state.streak.count = state.streak.last === yesterday() ? state.streak.count + 1 : 1;
    state.streak.last = today();
    streakUp = true;
  }
  save();
  const s = session || { answered: 0, right: 0, xp: 0, best: 0, newKanji: [], startLevel: level() };
  const acc = s.answered ? Math.round(s.right / s.answered * 100) : 0;
  const lvUp = level() > s.startLevel;
  app().innerHTML = `
    <section class="finish">
      <div class="otsukare">おつかれさま！</div>
      <p class="sub">Parabéns, você terminou por hoje!</p>
      ${lvUp ? `<div class="levelup">⬆ Nível ${level()} <span>${rank(level())}</span></div>` : ""}
      <div class="hero">
        <div class="stat pop" style="animation-delay:.2s"><b>+${s.xp}</b><small>XP</small></div>
        <div class="stat pop" style="animation-delay:.35s"><b>${acc}%</b><small>acertos</small></div>
        <div class="stat pop" style="animation-delay:.5s"><b>🔥${state.streak.count}</b><small>dias seguidos</small></div>
      </div>
      ${s.newKanji.length ? `<h2>Kanji novos de hoje</h2><div class="stamps">${s.newKanji.map((k, i) => `<div class="stamp" style="animation-delay:${0.8 + i * 0.25}s">${esc(k)}</div>`).join("")}</div>` : ""}
      ${s.best >= 3 ? `<p class="sub">Melhor sequência: 🔥 ${s.best}</p>` : ""}
      <button class="primary big" id="home">Voltar ao início</button>
    </section>`;
  sfx.fanfare();
  sakuraRain(40);
  s.newKanji.forEach((k, i) => setTimeout(() => tone(220, 0, 0.12, "square", 0.05), 800 + i * 250));
  $("#home").onclick = home;
  session = null;
  if (streakUp && state.streak.count > 1) setTimeout(() => floatText(`🔥 ${state.streak.count} dias seguidos!`, window.innerWidth / 2, 120, "big"), 1200);
}

function addCard() {
  app().innerHTML = `
    <header class="top study"><button id="back" class="link">← Voltar</button><span>Criar cartão</span></header>
    <form id="f" class="form">
      <label>Japonês<input name="j" required placeholder="例: 公園"></label>
      <label>Leitura (hiragana)<input name="r" placeholder="例: こうえん"></label>
      <label>Significado em português<input name="pt" required placeholder="ex: parque"></label>
      <label>Frase de exemplo (opcional)<input name="s0" placeholder="例: 公園で子どもと遊びます。"></label>
      <label>Tradução da frase (opcional)<input name="s1" placeholder="ex: Brinco com as crianças no parque."></label>
      <button class="primary big" type="submit">Salvar</button>
    </form>
    ${state.custom.length ? `<section class="card-list"><h2>Meus cartões (${state.custom.length})</h2><ul class="mine">${state.custom.map(c => `<li><b>${esc(c.j)}</b> ${esc(c.r)} — ${esc(c.pt)} <button class="link del" data-id="${esc(c.id)}">apagar</button></li>`).join("")}</ul></section>` : ""}`;
  $("#back").onclick = home;
  $("#f").onsubmit = e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const j = f.get("j").trim(), pt = f.get("pt").trim();
    if (!j || !pt) return;
    state.custom.push({ id: Date.now().toString(36), j, r: f.get("r").trim() || j, pt, s: f.get("s0").trim() ? [f.get("s0").trim(), f.get("s1").trim()] : null });
    save();
    sfx.good();
    addCard();
  };
  document.querySelectorAll(".del").forEach(b => b.onclick = () => {
    if (!confirm("Apagar este cartão?")) return;
    const id = b.dataset.id;
    state.custom = state.custom.filter(c => c.id !== id);
    delete state.cards["cj:" + id]; delete state.cards["cp:" + id];
    save(); addCard();
  });
}

function browse() {
  const ok = KANJI.filter(k => (state.cards["k:" + k.k] || {}).days >= 21).length;
  const seen = KANJI.filter(k => state.cards["k:" + k.k]).length;
  app().innerHTML = `
    <header class="top study"><button id="back" class="link">← Voltar</button><span>Coleção de kanji</span></header>
    <p class="tip center">🔴 carimbo = bem memorizado (${ok}) · contorno azul = estudando (${seen - ok}) · ${KANJI.length - seen} ainda não vistos</p>
    <div class="grid">${KANJI.map((k, i) => {
      const c = state.cards["k:" + k.k];
      const cls = !c ? "" : c.days >= 21 ? "ok" : "seen";
      return `<button class="kc ${cls}" data-k="${esc(k.k)}" style="animation-delay:${Math.min(i, 40) * 12}ms">${esc(k.k)}<small>${esc(k.pt.split(";")[0])}</small></button>`;
    }).join("")}</div>`;
  $("#back").onclick = home;
  document.querySelectorAll(".kc").forEach(b => b.onclick = () => {
    const k = KANJI.find(x => x.k === b.dataset.k);
    current = { id: "k:" + k.k, type: "kanji", item: k };
    app().innerHTML = `<header class="top study"><button id="back" class="link">← Voltar</button><span>Kanji</span></header>
      <section class="flash enter">${backHTML(current)}</section>`;
    $("#back").onclick = browse;
    document.querySelectorAll(".say").forEach(s => s.onclick = () => speak(s.dataset.say));
    const svg = document.querySelector("#flash .strokes, .flash .strokes");
    setTimeout(() => animateStrokes(svg), 250);
    $("#replay").onclick = () => animateStrokes(svg);
    speak(sayText(current));
  });
}

function settings() {
  app().innerHTML = `
    <header class="top study"><button id="back" class="link">← Voltar</button><span>Ajustes</span></header>
    <section class="form">
      <label>Cartões novos por dia
        <select id="npd">${[3, 5, 8, 10, 15, 20].map(n => `<option ${n === state.settings.newPerDay ? "selected" : ""}>${n}</option>`).join("")}</select>
      </label>
      <p class="tip">Recomendado: 5 a 10. Mais novos hoje = mais revisões nos próximos dias.</p>
      <label class="check"><input type="checkbox" id="snd" ${state.settings.sound ? "checked" : ""}> Efeitos sonoros</label>
      <button id="test">🔊 Testar a voz</button>
      <h2>Cópia de segurança</h2>
      <p class="tip">O progresso fica salvo só neste iPhone. Faça uma cópia de vez em quando.</p>
      <button id="exp">Baixar cópia</button>
      <label class="file">Restaurar cópia<input type="file" id="imp" accept="application/json,.json"></label>
      <h2>Zerar</h2>
      <button id="reset" class="danger">Apagar todo o progresso</button>
      <p class="tip">Ordem dos traços: <a href="https://kanjivg.tagaini.net" target="_blank" rel="noopener">KanjiVG</a> (CC BY-SA 3.0).</p>
    </section>`;
  $("#back").onclick = home;
  $("#npd").onchange = e => { state.settings.newPerDay = +e.target.value; save(); };
  $("#snd").onchange = e => { state.settings.sound = e.target.checked; save(); if (e.target.checked) sfx.good(); };
  $("#test").onclick = () => speak("こんにちは。毎日少しずつ、がんばりましょう。");
  $("#exp").onclick = () => {
    const blob = new Blob([JSON.stringify(state)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "nihongo-copia-" + today() + ".json";
    a.click();
  };
  $("#imp").onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    file.text().then(t => {
      try { const s = JSON.parse(t); state = Object.assign(defaultState(), s); state.settings = Object.assign(defaultState().settings, s.settings || {}); save(); alert("Cópia restaurada!"); home(); }
      catch (err) { alert("Não foi possível ler este arquivo."); }
    });
  };
  $("#reset").onclick = () => {
    if (confirm("Tem certeza? Todo o progresso será apagado.")) { state = defaultState(); save(); home(); }
  };
}

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
home();
