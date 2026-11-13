// Lê os dados do app, valida e exporta a lista de textos para gerar áudio.
// Uso: node tools/export.js > manifest.json
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = {};
vm.createContext(ctx);
for (const f of ["kanji", "words", "units", "stories", "strokes"]) {
  vm.runInContext(fs.readFileSync(path.join(root, "js/data", f + ".js"), "utf8").replace(/^const (\w+) =/m, "this.$1 ="), ctx);
}
const { KANJI, WORDS, UNITS, STORIES, STROKES } = ctx;
const errs = [];
const KJ = /[一-鿿々ヶ]/;
const ANN = /([一-鿿々ヶ]+)\{([^}]+)\}/g;
const plain = s => s.replace(/\{[^}]*\}/g, "");
const reading = s => s.replace(ANN, "$2");
function tokens(s, where) {
  return s.split("|").map(t => {
    const rest = t.replace(ANN, "");
    if (KJ.test(rest) || /[{}]/.test(rest)) errs.push(`kanji sem leitura em "${t}" (${where})`);
    return { s: plain(t), r: reading(t), a: t };
  });
}
const hira = s => s.replace(/[\u30a1-\u30f6]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
// "お母さん" + "おかあさん" -> "お母{かあ}さん"
function annotate(surface, read) {
  const parts = surface.match(/[\u4e00-\u9fff々ヶ]+|[^\u4e00-\u9fff々ヶ]+/g);
  const re = new RegExp("^" + parts.map(p => KJ.test(p) ? "(.+?)" : hira(p).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("") + "$");
  const m = hira(read).match(re);
  if (!m) { errs.push(`leitura não bate: ${surface} / ${read}`); return surface; }
  let g = 1;
  return parts.map(p => KJ.test(p) ? `${p}{${m[g++]}}` : p).join("");
}
const word = (w, r) => [{ s: w, r, a: annotate(w, r) }];
// validação das unidades
const wordSet = new Map(WORDS.map(w => [w.j, w])), kanjiSet = new Map(KANJI.map(k => [k.k, k]));
if (wordSet.size !== WORDS.length) errs.push("palavra duplicada: " + WORDS.map(w => w.j).filter((j, i, a) => a.indexOf(j) !== i));
const usedW = new Set(), usedK = new Set();
for (const u of UNITS) for (const l of u.lessons) {
  for (const k of (l.k || "")) { if (!kanjiSet.has(k)) errs.push("kanji desconhecido " + k); if (usedK.has(k)) errs.push("kanji repetido " + k); usedK.add(k); if (!STROKES[k]) errs.push("sem traços " + k); }
  for (const w of (l.w || [])) { if (!wordSet.has(w)) errs.push("palavra desconhecida " + w); if (usedW.has(w)) errs.push("palavra repetida " + w); usedW.add(w); }
  if (!STORIES.find(s => s.id === u.story)) errs.push("sem conversa " + u.story);
}
for (const k of KANJI) if (!usedK.has(k.k)) errs.push("kanji fora da trilha " + k.k);
for (const w of WORDS) if (!usedW.has(w.j)) errs.push("palavra fora da trilha " + w.j);
// manifesto de áudio
const items = new Map();
const add = (key, toks) => { if (!items.has(key)) items.set(key, { key, voice: key[0], tokens: toks }); };
for (const k of KANJI) for (const [w, r] of k.ex) add(`a|${w}/${r}`, word(w, r));
for (const w of WORDS) {
  add(`a|${w.j}/${w.r}`, word(w.j, w.r));
  add(`a|${plain(w.s).replace(/\|/g, "")}`, tokens(w.s, w.j));
}
for (const st of STORIES) for (const [who, line] of st.lines) {
  if (!st.cast[who]) errs.push("sem personagem " + who + " em " + st.id);
  add(`${st.cast[who][2]}|${plain(line).replace(/\|/g, "")}`, tokens(line, st.id));
}
for (const u of UNITS) for (const [a, b] of u.tips) { tokens(a.replace(/ /g, "|"), u.id + " tip"); tokens(b.replace(/[ “”«»()]/g, "|"), u.id + " tip"); }
const EXTRA = ["こんにちは！|いっしょに|日本語{にほんご}|を|勉強{べんきょう}しましょう。", "おつかれさまでした！", "すごい！", "いいですね！", "その|調子{ちょうし}！", "がんばって！", "おしい！", "やったね！"];
for (const e of EXTRA) add(`a|${plain(e).replace(/\|/g, "")}`, tokens(e, "extra"));
if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
console.error(`ok: ${KANJI.length} kanji, ${WORDS.length} palavras, ${STORIES.length} conversas, ${items.size} áudios`);
console.log(JSON.stringify([...items.values()]));
