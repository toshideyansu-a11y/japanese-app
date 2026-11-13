"use strict";
// Base do app: utilidades, itens de estudo, progresso salvo, repetição espaçada (FSRS), XP e conquistas.

const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => [...(el || document).querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const el = html => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uniq = a => [...new Set(a)];
const DAY = 864e5;
const today = t => { const d = new Date(t || Date.now()); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const startOfDay = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };

// ── Texto japonês ──
const KAN = "一-鿿々ヶ";
const KAN_RE = new RegExp(`[${KAN}]`);
const ANN = new RegExp(`([${KAN}]+)\\{([^}]+)\\}`, "g");
const hasKanji = s => KAN_RE.test(s);
const plain = s => s.replace(/\{[^}]*\}/g, "").replace(/\|/g, "");
const kanaOf = s => s.replace(ANN, "$2").replace(/\|/g, "");
const hira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
// "お母さん" + "おかあさん" → "お母{かあ}さん"
function annotate(surface, read) {
  if (!hasKanji(surface)) return surface;
  const parts = surface.match(new RegExp(`[${KAN}]+|[^${KAN}]+`, "g"));
  const re = new RegExp("^" + parts.map(p => hasKanji(p) ? "(.+?)" : hira(p).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("") + "$");
  const m = hira(read).match(re);
  if (!m) return surface;
  let g = 1;
  return parts.map(p => hasKanji(p) ? `${p}{${m[g++]}}` : p).join("");
}
// Texto anotado → HTML com furigana. mode: "all" | "smart" (esconde nos kanji já firmes) | "none"
function ruby(s, mode) {
  mode = mode || S.settings.furigana;
  return esc(s.replace(/\|/g, "")).replace(ANN, (m, k, r) => {
    if (mode === "none") return k;
    if (mode === "smart" && [...k].every(c => stage(S.items["k:" + c]) >= 3)) return k;
    return `<ruby>${k}<rt>${r}</rt></ruby>`;
  });
}

// ── Itens de estudo e trilha ──
const ITEMS = new Map();
KANJI.forEach(k => ITEMS.set("k:" + k.k, Object.assign({ id: "k:" + k.k, t: "k" }, k)));
WORDS.forEach(w => ITEMS.set("w:" + w.j, Object.assign({ id: "w:" + w.j, t: "w", a: annotate(w.j, w.r) }, w)));
const NODES = [], NODE = {};
UNITS.forEach((u, ui) => {
  u.idx = ui; u.nodes = []; u.items = [];
  const add = n => { n.unit = u; n.pos = NODES.length; NODES.push(n); NODE[n.id] = n; u.nodes.push(n); };
  u.lessons.forEach((l, li) => {
    const items = [...(l.k || "")].map(k => "k:" + k).concat((l.w || []).map(w => "w:" + w));
    items.forEach(id => { ITEMS.get(id).unit = u; u.items.push(id); });
    add({ id: `${u.id}-${li + 1}`, type: "lesson", n: li + 1, items, kan: !!l.k, icon: l.k ? l.k[0] : ITEMS.get(items[0]).e });
  });
  add({ id: u.id + "-s", type: "story", story: STORIES.find(s => s.id === u.story), icon: "💬" });
  add({ id: u.id + "-b", type: "boss", icon: "🏆" });
});
const CONFUSE = ["人入", "大太犬", "日目白百", "木本休", "土上", "千十", "右左石", "午牛", "田男", "小少", "天夫", "間聞", "話語読", "学字", "万方", "古右", "川三", "先生", "東車", "母毎", "今会", "後前", "出山", "時間", "買見"];

// ── Progresso salvo ──
const KEY = "nihongo-v3";
const defState = () => ({
  v: 3, xp: 0, daily: { date: "", xp: 0 }, goal: 100, streak: { last: "", count: 0, best: 0, freeze: 1 }, history: {},
  items: {}, nodes: {}, custom: [], mistakes: {}, ach: {},
  stats: { answers: 0, correct: 0, traces: 0, time: 0, bestSpeed: 0, maxCombo: 0, perfect: 0, lessons: 0 },
  settings: { sfx: true, voice: "rec", furigana: "all", autoplay: true, trace: true }, onboarded: false,
});
let S = defState();
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw && raw.v === 3) {
      const d = defState();
      S = Object.assign(d, raw);
      S.settings = Object.assign(defState().settings, raw.settings);
      S.stats = Object.assign(defState().stats, raw.stats);
      S.streak = Object.assign(defState().streak, raw.streak);
    }
  } catch (e) { /* começa do zero */ }
  syncCustom();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* sem espaço */ } }
function syncCustom() {
  for (const id of [...ITEMS.keys()]) if (id[0] === "c") ITEMS.delete(id);
  S.custom.forEach(c => ITEMS.set(c.id, { id: c.id, t: "w", custom: true, j: c.j, r: c.r || c.j, pt: c.pt, e: "📝", a: annotate(c.j, c.r || c.j) }));
}

// ── Repetição espaçada (FSRS) ──
const W = [0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616, 0.1544, 1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407, 2.9466, 0.5034, 0.6567];
const DECAY = -0.5, FACTOR = 19 / 81;
const retr = (t, s) => Math.pow(1 + FACTOR * t / s, DECAY);
const clampD = d => Math.min(10, Math.max(1, d));
const initD = g => clampD(W[4] - Math.exp(W[5] * (g - 1)) + 1);
// g: 1 errou, 2 difícil, 3 bom, 4 fácil
function schedule(id, g, now) {
  now = now || Date.now();
  let c = S.items[id];
  if (!c) c = S.items[id] = { s: W[g - 1], d: initD(g), reps: 0, lapses: 0, first: now };
  else {
    const t = Math.max(0, (now - c.last) / DAY);
    if (t < 0.5) c.s = c.s * Math.exp(W[17] * (g - 3 + W[18]));
    else {
      const r = retr(t, c.s);
      if (g === 1) c.s = Math.min(c.s, W[11] * Math.pow(c.d, -W[12]) * (Math.pow(c.s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r)));
      else c.s = c.s * (1 + Math.exp(W[8]) * (11 - c.d) * Math.pow(c.s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * (g === 2 ? W[15] : 1) * (g === 4 ? W[16] : 1));
    }
    const d2 = c.d - W[6] * (g - 3) * (10 - c.d) / 9;
    c.d = clampD(W[7] * initD(4) + (1 - W[7]) * d2);
    if (g === 1) c.lapses++;
  }
  c.s = Math.min(36500, Math.max(0.05, c.s));
  c.last = now; c.reps++;
  // errou: volta ainda hoje; acertou: no início do dia marcado (no mínimo amanhã)
  c.due = g === 1 && c.reps > 1 ? now + 10 * 60e3 : startOfDay(now + Math.max(1, Math.round(c.s)) * DAY);
  return c;
}
// 0 novo · 1 🌱 · 2 🌿 · 3 🌸 · 4 🍒 · 5 🌳
function stage(c) { return !c ? 0 : c.s < 2 ? 1 : c.s < 7 ? 2 : c.s < 21 ? 3 : c.s < 60 ? 4 : 5; }
const STAGE = ["·", "🌱", "🌿", "🌸", "🍒", "🌳"];
const STAGE_PT = ["Novo", "Broto", "Folha", "Flor", "Fruto", "Árvore"];
const learned = t => Object.keys(S.items).filter(id => ITEMS.has(id) && (!t || ITEMS.get(id).t === t || (t === "w" && id[0] === "c")));
const dueItems = now => { now = now || Date.now(); return learned().filter(id => S.items[id].due <= now).sort((a, b) => S.items[a].due - S.items[b].due); };
const nodeDone = n => !!(S.nodes[n.id] && S.nodes[n.id].done);
const nodeOpen = n => n.pos === 0 || nodeDone(NODES[n.pos - 1]) || nodeDone(n);
const currentNode = () => NODES.find(n => !nodeDone(n));

// ── XP, nível, sequência de dias ──
const level = xp => Math.floor((1 + Math.sqrt(1 + 4 * xp / 100)) / 2);
const levelStart = L => 100 * L * (L - 1);
function streakNow() {
  const st = S.streak, t = today();
  if (st.last === t || st.last === today(Date.now() - DAY)) return st.count;
  if (st.last === today(Date.now() - 2 * DAY) && st.freeze > 0) return st.count;
  return 0;
}
function dailyXP() { return S.daily.date === today() ? S.daily.xp : 0; }
function addXP(n) {
  const d = today(), ev = { xp: n };
  if (S.daily.date !== d) S.daily = { date: d, xp: 0 };
  const before = S.daily.xp, lvl = level(S.xp);
  S.xp += n; S.daily.xp += n; S.history[d] = (S.history[d] || 0) + n;
  const st = S.streak;
  if (st.last !== d) {
    if (st.last === today(Date.now() - DAY)) st.count++;
    else if (st.last === today(Date.now() - 2 * DAY) && st.freeze > 0) { st.freeze--; st.count++; ev.freeze = true; }
    else st.count = 1;
    st.last = d; st.best = Math.max(st.best, st.count); ev.streak = st.count;
    if (st.count % 7 === 0) st.freeze = Math.min(2, st.freeze + 1);
  }
  if (before < S.goal && S.daily.xp >= S.goal) ev.goal = true;
  if (level(S.xp) > lvl) ev.level = level(S.xp);
  save();
  return ev;
}

// ── Conquistas ──
const ACH = [
  ["first", "🌱", "Primeiro passo", "Termine a primeira lição", () => S.stats.lessons >= 1],
  ["s3", "🔥", "3 dias seguidos", "Estude 3 dias seguidos", () => S.streak.best >= 3],
  ["s7", "🎏", "Uma semana", "Estude 7 dias seguidos", () => S.streak.best >= 7],
  ["s30", "🏯", "Um mês", "Estude 30 dias seguidos", () => S.streak.best >= 30],
  ["k10", "🖌️", "10 kanji", "Aprenda 10 kanji", () => learned("k").length >= 10],
  ["k50", "📜", "50 kanji", "Aprenda 50 kanji", () => learned("k").length >= 50],
  ["k103", "🐉", "Mestre dos kanji", "Aprenda os 103 kanji", () => learned("k").length >= KANJI.length],
  ["w50", "💬", "50 palavras", "Aprenda 50 palavras", () => learned("w").length >= 50],
  ["w163", "📚", "Vocabulário cheio", "Aprenda todas as palavras", () => learned("w").filter(id => id[0] === "w").length >= WORDS.length],
  ["perfect", "💎", "Perfeita!", "Termine uma lição sem errar", () => S.stats.perfect >= 1],
  ["combo10", "⚡", "Combo 10", "Acerte 10 seguidas", () => S.stats.maxCombo >= 10],
  ["speed20", "🚀", "Relâmpago", "Faça 20 pontos no Relâmpago", () => S.stats.bestSpeed >= 20],
  ["trace50", "✍️", "Mão firme", "Escreva 50 kanji", () => S.stats.traces >= 50],
  ["story1", "🎭", "Primeira conversa", "Termine uma conversa", () => NODES.some(n => n.type === "story" && nodeDone(n))],
  ["story13", "🎬", "Vida no Japão", "Termine todas as conversas", () => NODES.filter(n => n.type === "story").every(nodeDone)],
  ["all", "🗻", "Monte Fuji", "Complete toda a trilha", () => NODES.every(nodeDone)],
];
function checkAch() {
  const got = [];
  for (const a of ACH) if (!S.ach[a[0]] && a[4]()) { S.ach[a[0]] = Date.now(); got.push(a); }
  if (got.length) save();
  return got;
}

// ── Chaves de áudio ──
const wordAudio = it => ({ key: `a|${it.j}/${it.r}`, text: it.r });
const exAudio = ex => ({ key: `a|${ex[0]}/${ex[1]}`, text: ex[1] });
const sentAudio = (annot, voice) => ({ key: `${voice || "a"}|${plain(annot)}`, text: plain(annot) });
const itemAudio = it => it.t === "k" ? exAudio(it.ex[0]) : wordAudio(it);
