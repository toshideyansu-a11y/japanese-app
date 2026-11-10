"use strict";

// ---------- Armazenamento ----------
const KEY = "nihongo-v1";
const DAY = 86400000;

function defaultState() {
  return { cards: {}, custom: [], settings: { newPerDay: 8 }, daily: { date: "", newDone: 0, reviewed: 0 }, streak: { last: "", count: 0 } };
}
let state = defaultState();
try {
  const raw = localStorage.getItem(KEY);
  if (raw) state = Object.assign(defaultState(), JSON.parse(raw));
} catch (e) { /* sem armazenamento: o app funciona só nesta sessão */ }
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

function today() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
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
function endOfToday() { return startOfDay(Date.now()) + DAY; }
function counts() {
  const q = buildQueue();
  return { review: q.filter(c => state.cards[c.id]).length, fresh: q.filter(c => !state.cards[c.id]).length };
}

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

// ---------- Telas ----------
const $ = sel => document.querySelector(sel);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const app = () => $("#app");

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
  app().innerHTML = `
    <header class="top"><h1>日本語 <span>todo dia</span></h1></header>
    <section class="hero">
      <div class="stat"><b>${c.review}</b><small>revisões</small></div>
      <div class="stat"><b>${c.fresh}</b><small>novos</small></div>
      <div class="stat"><b>${streak}</b><small>dias seguidos</small></div>
    </section>
    ${nothing
      ? `<p class="done">Tudo feito por hoje! お疲れさまでした 🎉<br><small>Volte amanhã: revisar no dia certo é o que fixa a memória.</small></p>`
      : `<button class="primary big" id="start">Começar (${c.review + c.fresh})</button>`}
    <section class="card-list">
      <h2>Seu progresso</h2>
      <div class="bar"><i style="width:${Math.round(seen / total * 100)}%"></i></div>
      <p>${seen} de ${total} cartões já estudados · ${kSeen} de ${KANJI.length} kanji N5 · ${learnedCount()} bem memorizados</p>
    </section>
    <nav class="row">
      <button id="add">＋ Criar cartão</button>
      <button id="browse">Ver kanji</button>
      <button id="settings">Ajustes</button>
    </nav>
    <p class="tip">Dica: tente lembrar a resposta <b>antes</b> de virar o cartão. Esse esforço é o que faz memorizar.</p>`;
  if (!nothing) $("#start").onclick = startStudy;
  $("#add").onclick = addCard;
  $("#browse").onclick = browse;
  $("#settings").onclick = settings;
}
function yesterday() { const d = new Date(Date.now() - DAY); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }

function startStudy() {
  queue = buildQueue();
  next();
}

function next() {
  current = queue.shift();
  revealed = false;
  if (!current) { finishSession(); return; }
  renderCard();
}

function finishSession() {
  rollDay();
  if (state.streak.last !== today()) {
    state.streak.count = state.streak.last === yesterday() ? state.streak.count + 1 : 1;
    state.streak.last = today();
  }
  save();
  home();
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
    return `<div class="meaning">${esc(it.pt)}</div>
      <div class="readings"><span>on: ${esc(it.on || "—")}</span><span>kun: ${esc(it.kun || "—")}</span></div>
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

function renderCard() {
  const c = current;
  const now = Date.now();
  const st = state.cards[c.id];
  const opts = [1, 2, 3, 4].map(g => schedule(st, g, now).days);
  const names = ["Errei", "Difícil", "Bom", "Fácil"];
  app().innerHTML = `
    <header class="top study"><button id="back" class="link">← Sair</button><span>${queue.length + 1} restantes${st ? "" : " · <em>novo</em>"}${c.custom ? " · meu cartão" : ""}</span></header>
    <section class="flash">
      ${frontHTML(c)}
      ${revealed ? `<hr>${backHTML(c)}` : ""}
    </section>
    ${revealed
      ? `<div class="grades">${names.map((n, i) => `<button class="g g${i + 1}" data-g="${i + 1}">${n}<small>${label(opts[i])}</small></button>`).join("")}</div>`
      : `<button class="primary big" id="show">Mostrar resposta</button>`}`;
  $("#back").onclick = () => { save(); home(); };
  if (!revealed) {
    $("#show").onclick = () => { revealed = true; renderCard(); speak(sayText(c)); };
    if (c.type === "jp2pt") speak(sayText(c));
  } else {
    document.querySelectorAll(".say").forEach(b => b.onclick = () => speak(b.dataset.say));
    document.querySelectorAll(".g").forEach(b => b.onclick = () => grade(+b.dataset.g));
  }
}

function grade(g) {
  rollDay();
  const now = Date.now();
  const wasNew = !state.cards[current.id];
  state.cards[current.id] = schedule(state.cards[current.id], g, now);
  if (wasNew) state.daily.newDone++;
  state.daily.reviewed++;
  if (g === 1) queue.splice(Math.min(queue.length, 3), 0, current); // mostra de novo daqui a pouco
  save();
  next();
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
  app().innerHTML = `
    <header class="top study"><button id="back" class="link">← Voltar</button><span>Kanji N5 (${KANJI.length})</span></header>
    <div class="grid">${KANJI.map(k => {
      const c = state.cards["k:" + k.k];
      const cls = !c ? "" : c.days >= 21 ? "ok" : "seen";
      return `<button class="kc ${cls}" data-k="${esc(k.k)}">${esc(k.k)}<small>${esc(k.pt.split(";")[0])}</small></button>`;
    }).join("")}</div>
    <p class="tip">Verde = bem memorizado · Azul = estudando · Branco = ainda não visto</p>`;
  $("#back").onclick = home;
  document.querySelectorAll(".kc").forEach(b => b.onclick = () => {
    const k = KANJI.find(x => x.k === b.dataset.k);
    current = { id: "k:" + k.k, type: "kanji", item: k };
    app().innerHTML = `<header class="top study"><button id="back" class="link">← Voltar</button><span>Kanji</span></header>
      <section class="flash">${frontHTML(current)}<hr>${backHTML(current)}</section>`;
    $("#back").onclick = browse;
    document.querySelectorAll(".say").forEach(s => s.onclick = () => speak(s.dataset.say));
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
      <button id="test">🔊 Testar a voz</button>
      <h2>Cópia de segurança</h2>
      <p class="tip">O progresso fica salvo só neste iPhone. Faça uma cópia de vez em quando.</p>
      <button id="exp">Baixar cópia</button>
      <label class="file">Restaurar cópia<input type="file" id="imp" accept="application/json,.json"></label>
      <h2>Zerar</h2>
      <button id="reset" class="danger">Apagar todo o progresso</button>
    </section>`;
  $("#back").onclick = home;
  $("#npd").onchange = e => { state.settings.newPerDay = +e.target.value; save(); };
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
      try { state = Object.assign(defaultState(), JSON.parse(t)); save(); alert("Cópia restaurada!"); home(); }
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
