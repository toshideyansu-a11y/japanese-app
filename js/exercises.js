"use strict";
// Exercícios: geradores (o que perguntar) e telas (como responder).

// ── Efeitos visuais ──
function petals(x, y, n) {
  for (let i = 0; i < (n || 10); i++) {
    const p = document.createElement("i"), a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 70;
    p.className = "petal"; p.style.left = x + "px"; p.style.top = y + "px";
    p.style.setProperty("--dx", Math.cos(a) * d + "px"); p.style.setProperty("--dy", Math.sin(a) * d - 30 + "px"); p.style.setProperty("--rot", Math.random() * 720 - 360 + "deg");
    document.body.append(p); setTimeout(() => p.remove(), 1300);
  }
}
function petalRain(n) {
  for (let i = 0; i < (n || 28); i++) {
    const p = document.createElement("i");
    p.className = "petal fall"; p.style.left = Math.random() * 100 + "vw"; p.style.setProperty("--sway", Math.random() * 120 - 60 + "px");
    p.style.animationDuration = 2.2 + Math.random() * 2.5 + "s"; p.style.animationDelay = Math.random() * 1.2 + "s";
    document.body.append(p); setTimeout(() => p.remove(), 6200);
  }
}
function floatText(text, x, y, big) {
  const f = el(`<div class="float ${big ? "big" : ""}">${esc(text)}</div>`);
  f.style.left = x + "px"; f.style.top = y + "px"; document.body.append(f); setTimeout(() => f.remove(), 1150);
}
let toastQ = Promise.resolve();
function toast(emoji, html) {
  toastQ = toastQ.then(() => new Promise(res => {
    const t = el(`<div class="toast"><span class="e">${emoji}</span><span>${html}</span></div>`);
    document.body.append(t); setTimeout(() => { t.remove(); res(); }, 3200);
  }));
}
function sheet(html, mount) {
  const sc = el(`<div class="scrim"><div class="sheet">${html}</div></div>`);
  const close = () => sc.remove();
  sc.addEventListener("click", e => { if (e.target === sc || e.target.closest("[data-close]")) close(); });
  document.body.append(sc);
  if (mount) mount($(".sheet", sc), close);
  return { close, el: $(".sheet", sc) };
}

// ── Traços dos kanji ──
function strokeSVG(k) {
  const p = (STROKES[k] || []).map(d => `<path d="${d}"/>`).join("");
  return `<svg class="strokes" viewBox="0 0 109 109"><g class="ghost">${p}</g><g class="ink">${p}</g></svg>`;
}
function animateStrokes(svg, speed) {
  let delay = 150;
  $$(".ink path", svg).forEach(p => {
    const L = p.getTotalLength(), dur = Math.max(220, L * (speed || 9));
    p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
    (p.getAnimations ? p.getAnimations() : []).forEach(a => a.cancel());
    if (p.animate) p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: dur, delay, fill: "forwards", easing: "ease-in-out" });
    else p.style.strokeDashoffset = 0;
    delay += dur + 110;
  });
  return delay;
}

// ── Escolha das alternativas erradas ──
function distract(it, n, keyFn, filter) {
  const sess = new Set((Session.cur && Session.cur.ids) || []);
  const conf = it.t === "k" ? new Set(CONFUSE.filter(g => g.includes(it.k)).join("")) : null;
  const cands = [...ITEMS.values()].filter(o => o.t === it.t && o.id !== it.id && (!filter || filter(o)));
  const sc = new Map(cands.map(o => [o, (conf && conf.has(o.k) ? 6 : 0) + (sess.has(o.id) ? 4 : 0) + (S.items[o.id] ? 3 : 0) + (o.unit && o.unit === it.unit ? 3 : 0) + Math.random() * 5]));
  cands.sort((a, b) => sc.get(b) - sc.get(a));
  const out = [], seen = new Set([keyFn(it)]);
  for (const o of cands) { const k = keyFn(o); if (seen.has(k)) continue; seen.add(k); out.push(o); if (out.length >= n) break; }
  return out;
}
const optList = (it, others, h, cls) => [{ h: h(it), ok: true, cls }].concat(others.map(o => ({ h: h(o), cls })));
// leituras parecidas (para treinar o ouvido e o olho): ex. きょう → きょ, きょお, ぎょう
function mutate(r) {
  const out = new Set(), DAK = "かがきぎくぐけげこごさざしじすずせぜそぞただちぢつづてでとどはばひびふぶへべほぼ";
  if (/[うー]/.test(r.slice(1))) out.add(r.replace(/(.)[うー]/, "$1"));
  if (/[おこそとのほもよろごぞどぼぽょ]$/.test(r)) out.add(r + "う");
  if (/[おこそとのほもよろょ][^うんっ]/.test(r)) out.add(r.replace(/([おこそとのほもよろょ])([^うんっ])/, "$1う$2"));
  if (r.includes("っ")) out.add(r.replace("っ", "")); else if (r.length >= 3) out.add(r.slice(0, 1) + "っ" + r.slice(1));
  for (let i = 0; i < r.length; i++) { const p = DAK.indexOf(r[i]); if (p >= 0) { out.add(r.slice(0, i) + DAK[p ^ 1] + r.slice(i + 1)); break; } }
  if (r.includes("ん")) out.add(r.replace("ん", ""));
  out.delete(r);
  return [...out].filter(x => x.length > 0);
}
function readingOpts(right, others) {
  const muts = shuffle(mutate(right)).slice(0, 2);
  const rest = shuffle(uniq(others.filter(r => r !== right && !muts.includes(r)))).sort((a, b) => Math.abs(a.length - right.length) - Math.abs(b.length - right.length));
  return [{ h: esc(right), ok: true, cls: "jpw" }].concat(muts.concat(rest).slice(0, 3).map(r => ({ h: esc(r), cls: "jpw" })));
}
const KANA_UNITS = /[ぁ-ゖァ-ヺー][ゃゅょぁぃぅぇぉャュョァィゥェォ]?/g;
const KANA_MIX = { "は": "ほ", "ほ": "は", "さ": "き", "き": "さ", "ね": "れ", "れ": "わ", "わ": "ね", "る": "ろ", "ろ": "る", "ぬ": "め", "め": "ぬ", "あ": "お", "お": "あ", "い": "り", "り": "い", "シ": "ツ", "ツ": "シ", "ソ": "ン", "ン": "ソ", "ク": "タ", "タ": "ク", "こ": "に", "に": "こ", "た": "な", "な": "た", "ち": "ら", "ら": "ち" };
const tileText = t => t.replace(/[。、！？!?]/g, "");
const normJP = s => plain(s).replace(/[。、！？!?\s]/g, "");

// ── Linhas de resposta (aparecem no retorno e nas listas) ──
function ansHTML(it) {
  if (it.t === "k") {
    const ex = it.ex[0];
    return `${spk(exAudio(ex), "mini")}<div><div class="j"><span style="font-family:var(--kyo);font-size:1.5em">${it.k}</span> ${esc(it.pt)}</div><div class="small">${ruby(annotate(ex[0], ex[1]), "all")} · ${esc(ex[2])}</div></div>`;
  }
  return `${spk(wordAudio(it), "mini")}<div><div class="j">${ruby(it.a, "all")}</div><div class="small">${esc(it.pt)}</div></div>`;
}
const sentAns = it => `${spk(sentAudio(it.s), "mini")}<div><div class="j">${ruby(it.s, "all")}</div><div class="small">${esc(it.st)}</div></div>`;
const listenBox = a => `<div class="listen">${spk(a, "big")}${spk(a, "slow", true)}</div>`;
const kapiSays = (html, mood) => `<div class="prompt">${kapi(mood || "happy")}<div class="bubble">${html}</div></div>`;

// ── Geradores ──
const GEN = {
  intro: it => ({ kind: "intro", item: it }),
  k_meaning: it => ({ kind: "choose", item: it, q: "O que significa este kanji?", prompt: `<div class="hero-k">${it.k}</div>`,
    opts: optList(it, distract(it, 3, o => o.pt), o => esc(o.pt)), say: exAudio(it.ex[0]), ans: ansHTML(it) }),
  k_pick: it => ({ kind: "choose", item: it, grid: true, q: "Qual é o kanji?", prompt: `<div class="hero-pt">${esc(it.pt)}</div>`,
    opts: optList(it, distract(it, 3, o => o.k), o => o.k, "kan"), say: exAudio(it.ex[0]), ans: ansHTML(it) }),
  k_read(it) {
    const ex = pick(it.ex), others = [];
    for (const o of distract(it, 8, o => o.k)) o.ex.forEach(e => others.push(e[1]));
    return { kind: "choose", item: it, grid: true, q: "Como se lê?", prompt: `<div class="hero-w">${esc(ex[0])}</div><div class="center muted" style="margin:-8px 0 14px">${esc(ex[2])}</div>`,
      opts: readingOpts(ex[1], others), say: exAudio(ex), ans: exAns(it, ex) };
  },
  k_listen(it) {
    const ex = pick(it.ex), others = uniq(distract(it, 6, o => o.k).map(o => pick(o.ex)[0]).filter(w => w !== ex[0])).slice(0, 3);
    return { kind: "choose", item: it, grid: true, listen: true, q: "Qual palavra você ouviu?", prompt: listenBox(exAudio(ex)), audio: exAudio(ex),
      opts: [{ h: esc(ex[0]), ok: true, cls: "jpw" }].concat(others.map(w => ({ h: esc(w), cls: "jpw" }))), ans: exAns(it, ex) };
  },
  k_exmean(it) {
    const ex = pick(it.ex), others = uniq(distract(it, 6, o => o.k).map(o => pick(o.ex)[2]).filter(m => m !== ex[2])).slice(0, 3);
    return { kind: "choose", item: it, q: "O que significa?", prompt: kapiSays(`${spk(exAudio(ex), "mini")}<span>${ruby(annotate(ex[0], ex[1]))}</span>`), audio: exAudio(ex),
      opts: [{ h: esc(ex[2]), ok: true }].concat(others.map(m => ({ h: esc(m) }))), ans: exAns(it, ex) };
  },
  k_trace: (it, step) => (STROKES[it.k] ? { kind: "trace", item: it, guided: !!step.guided, say: exAudio(it.ex[0]), ans: ansHTML(it) } : null),

  w_jp_pt: it => ({ kind: "choose", item: it, q: "O que significa?", prompt: kapiSays(`${spk(wordAudio(it), "mini")}<span>${ruby(it.a)}</span>`), audio: wordAudio(it),
    opts: optList(it, distract(it, 3, o => o.pt), o => esc(o.pt)), ans: ansHTML(it) }),
  w_pt_jp: it => ({ kind: "choose", item: it, q: "Como se diz em japonês?", prompt: `<div class="hero-emo">${it.e || "💬"}</div><div class="hero-pt">${esc(it.pt)}</div>`,
    opts: optList(it, distract(it, 3, o => o.j), o => ruby(o.a), "jpw"), say: wordAudio(it), ans: ansHTML(it) }),
  w_listen_pt: it => ({ kind: "choose", item: it, listen: true, q: "O que você ouviu?", prompt: listenBox(wordAudio(it)), audio: wordAudio(it),
    opts: optList(it, distract(it, 3, o => o.pt), o => esc(o.pt)), ans: ansHTML(it) }),
  w_listen_jp: it => ({ kind: "choose", item: it, listen: true, q: "Qual palavra você ouviu?", prompt: listenBox(wordAudio(it)), audio: wordAudio(it),
    opts: optList(it, distract(it, 3, o => o.j), o => esc(o.j), "jpw"), ans: ansHTML(it) }),
  w_read(it) {
    if (!hasKanji(it.j)) return null;
    const others = distract(it, 10, o => o.r, o => hasKanji(o.j)).map(o => hira(o.r));
    return { kind: "choose", item: it, grid: true, q: "Como se lê?", prompt: `<div class="hero-emo">${it.e || ""}</div><div class="hero-w">${esc(it.j)}</div>`,
      opts: readingOpts(hira(it.r), others), say: wordAudio(it), ans: ansHTML(it) };
  },
  w_spell(it) {
    const units = it.r.match(KANA_UNITS) || [];
    if (units.join("") !== it.r || units.length < 2 || units.length > 8) return null;
    const kata = /[ァ-ヺ]/.test(it.r), base = kata ? "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン" : "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわん";
    const extra = [];
    for (const u of shuffle(units)) if (KANA_MIX[u] && !units.includes(KANA_MIX[u]) && !extra.includes(KANA_MIX[u]) && extra.length < 2) extra.push(KANA_MIX[u]);
    while (extra.length < 3) { const c = base[rnd(base.length)]; if (!units.includes(c) && !extra.includes(c)) extra.push(c); }
    return { kind: "build", spell: true, item: it, q: hasKanji(it.j) ? "Escreva a leitura" : "Escreva em japonês",
      prompt: `<div class="hero-emo">${it.e || "💬"}</div><div class="hero-pt" style="margin:8px 0 10px">${hasKanji(it.j) ? `<span class="jp">${esc(it.j)}</span> · ` : ""}${esc(it.pt)}</div>`,
      tokens: units, extra, target: it.r, say: wordAudio(it), ans: ansHTML(it) };
  },
  w_build(it, step, listen) {
    if (!it.s) return null;
    const toks = it.s.split("|").filter(t => tileText(plain(t)));
    if (toks.length < 3 || toks.length > 8) return null;
    const mine = new Set(toks.map(t => tileText(plain(t))));
    const extra = [];
    for (const o of distract(it, 6, o => o.j, o => !!o.s)) {
      const t = pick(o.s.split("|")), p = tileText(plain(t));
      if (p && !mine.has(p) && !extra.some(e => tileText(plain(e)) === p)) extra.push(t);
      if (extra.length >= (toks.length > 5 ? 2 : 3)) break;
    }
    const a = sentAudio(it.s);
    return { kind: "build", item: it, listen: !!listen, q: listen ? "Monte o que você ouviu" : "Monte a frase em japonês",
      prompt: listen ? listenBox(a) : kapiSays(`<span class="pt">${esc(it.st)}</span>`, "think"),
      audio: listen ? a : null, tokens: toks, extra, target: normJP(it.s), say: listen ? null : a, ans: sentAns(it) };
  },
  w_listen_build: (it, step) => GEN.w_build(it, step, true),
  w_cloze(it) {
    if (!it.s || !it.s.includes(it.a)) return null;
    const i = it.s.indexOf(it.a), before = it.s.slice(0, i), after = it.s.slice(i + it.a.length);
    return { kind: "choose", item: it, grid: true, q: "Complete a frase",
      prompt: `<div class="cloze">${ruby(before)}<span class="gap">&nbsp;</span>${ruby(after)}</div><div class="center muted" style="margin-bottom:14px">${esc(it.st)}</div>`,
      opts: optList(it, distract(it, 3, o => o.j, o => !it.s.includes(o.j)), o => ruby(o.a), "jpw"), say: sentAudio(it.s), ans: sentAns(it) };
  },
  match: (it, step) => ({ kind: "match", pairs: step.items.map(id => ITEMS.get(id)).map(o => ({ l: o.t === "k" ? `<span style="font-family:var(--kyo);font-size:1.7rem">${o.k}</span>` : ruby(o.a), r: esc(o.pt), a: itemAudio(o) })) }),
  story: (it, step) => ({ kind: "story", story: step.story }),
  quiz: (it, step) => ({ kind: "choose", q: esc(step.q[0]), prompt: kapiSays("どうでしたか？", "think"), opts: step.q[1].map((t, i) => ({ h: esc(t), ok: i === 0 })), ans: `<div><div class="j">${esc(step.q[1][0])}</div></div>` }),
  line(it, step) {
    const [txt, pt, voice] = step.line, toks = txt.split("|").filter(t => tileText(plain(t))), a = sentAudio(txt, voice);
    return { kind: "build", listen: true, q: "Monte o que você ouviu", prompt: listenBox(a), audio: a, tokens: toks, extra: step.extra || [], target: normJP(txt),
      ans: `${spk(a, "mini")}<div><div class="j">${ruby(txt, "all")}</div><div class="small">${esc(pt)}</div></div>` };
  },
};
function exAns(it, ex) {
  return `${spk(exAudio(ex), "mini")}<div><div class="j">${ruby(annotate(ex[0], ex[1]), "all")}</div><div class="small">${esc(ex[2])}</div></div>`;
}
const FALLBACK = { k_listen: "k_read", k_trace: "k_read", k_exmean: "k_meaning", w_listen_pt: "w_jp_pt", w_listen_jp: "w_pt_jp", w_listen_build: "w_build", w_build: "w_cloze", w_cloze: "w_spell", w_spell: "w_pt_jp", w_read: "w_spell" };
function makeSpec(step, flags) {
  let gen = step.gen;
  const it = step.item ? ITEMS.get(step.item) : null;
  for (let guard = 0; guard < 6; guard++) {
    const noListen = flags && flags.noListen && /listen/.test(gen), noTrace = (flags && flags.noTrace || !S.settings.trace) && gen === "k_trace";
    const noAudio = /listen/.test(gen) && it && it.custom && !Sound.hasTTS();
    const sp = (noListen || noTrace || noAudio) ? null : GEN[gen](it, step);
    if (sp) { sp.gen = gen; return sp; }
    gen = FALLBACK[gen] || (it && it.t === "k" ? "k_meaning" : "w_jp_pt");
  }
  return GEN[it.t === "k" ? "k_meaning" : "w_jp_pt"](it, step);
}

// ── Telas dos exercícios ──
const RENDER = {
  choose(sp, body, foot, api) {
    const opts = shuffle(sp.opts);
    body.innerHTML = `<div class="ex"><div class="q">${sp.q}</div>${sp.prompt || ""}<div class="opts ${sp.grid ? "grid" : ""}">${opts.map((o, i) =>
      `<button class="opt ${o.cls || ""}" data-i="${i}">${sp.grid ? "" : `<span class="n">${i + 1}</span>`}<span>${o.h}</span></button>`).join("")}</div>${sp.listen ? '<button class="skip" data-skip="listen">Não posso ouvir agora</button>' : ""}</div>`;
    if (sp.audio && (sp.listen || S.settings.autoplay)) setTimeout(() => { if (api.alive()) Sound.say(sp.audio); }, 280);
    const box = $(".opts", body);
    box.addEventListener("click", e => {
      const b = e.target.closest(".opt");
      if (!b || box.classList.contains("locked-in")) return;
      const o = opts[+b.dataset.i];
      box.classList.add("locked-in");
      $$(".opt", box).forEach((x, i) => { if (opts[i].ok) x.classList.add("ok"); else if (x === b) x.classList.add("no"); else x.classList.add("dim"); });
      const r = b.getBoundingClientRect();
      api.answer(o.ok, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    });
    api.solve = wrong => $$(".opt", box)[opts.findIndex(o => (wrong ? !o.ok : o.ok))].click();
  },

  build(sp, body, foot, api) {
    const tiles = shuffle(sp.tokens.map(t => ({ t, own: true })).concat((sp.extra || []).map(t => ({ t }))));
    const show = t => (sp.spell ? esc(t) : ruby(tileText(t)));
    body.innerHTML = `<div class="ex"><div class="q">${sp.q}</div>${sp.prompt || ""}<div class="answer ${sp.spell ? "spell" : ""}"></div><div class="bank">${tiles.map((x, i) =>
      `<button class="tile ${sp.spell ? "kana" : ""}" data-i="${i}">${show(x.t)}</button>`).join("")}</div>${sp.listen ? '<button class="skip" data-skip="listen">Não posso ouvir agora</button>' : ""}</div>`;
    if (sp.audio) setTimeout(() => { if (api.alive()) Sound.say(sp.audio); }, 280);
    const ans = $(".answer", body), bank = $(".bank", body), placed = [];
    const btn = el('<button class="btn green" disabled>Verificar</button>');
    foot.append(btn);
    let locked = false;
    const draw = () => {
      ans.innerHTML = placed.map(i => `<button class="tile ${sp.spell ? "kana" : ""}" data-i="${i}">${show(tiles[i].t)}</button>`).join("");
      $$(".tile", bank).forEach((b, i) => b.classList.toggle("used", placed.includes(i)));
      btn.disabled = !placed.length;
    };
    bank.addEventListener("click", e => { const b = e.target.closest(".tile"); if (!b || locked || b.classList.contains("used")) return; placed.push(+b.dataset.i); Sound.sfx("pick"); draw(); });
    ans.addEventListener("click", e => { const b = e.target.closest(".tile"); if (!b || locked) return; placed.splice(placed.indexOf(+b.dataset.i), 1); Sound.sfx("drop"); draw(); });
    const got = () => placed.map(i => (sp.spell ? tiles[i].t : normJP(tiles[i].t))).join("");
    btn.addEventListener("click", () => {
      if (locked) return; locked = true; btn.remove();
      const r = ans.getBoundingClientRect();
      api.answer(got() === sp.target, { x: r.left + r.width / 2, y: r.top + 30 });
    });
    api.solve = wrong => {
      placed.length = 0;
      if (wrong) placed.push(0);
      else { const used = new Set(); for (const t of sp.tokens) { const i = tiles.findIndex((x, j) => x.own && x.t === t && !used.has(j)); used.add(i); placed.push(i); } }
      draw(); btn.click();
    };
  },

  match(sp, body, foot, api) {
    const L = shuffle(sp.pairs.map((p, i) => ({ i, h: p.l, s: "l" }))), R = shuffle(sp.pairs.map((p, i) => ({ i, h: p.r, s: "r" })));
    let html = "";
    L.forEach((l, n) => { html += `<button class="opt jpw" data-s="l" data-i="${l.i}"><span>${l.h}</span></button><button class="opt" data-s="r" data-i="${R[n].i}"><span>${R[n].h}</span></button>`; });
    body.innerHTML = `<div class="ex"><div class="q">Toque nos pares</div><div class="match">${html}</div></div>`;
    const box = $(".match", body);
    let sel = null, left = sp.pairs.length, miss = 0;
    box.addEventListener("click", e => {
      const b = e.target.closest(".opt");
      if (!b || b.classList.contains("gone")) return;
      if (!sel || sel.dataset.s === b.dataset.s) { if (sel) sel.classList.remove("sel"); sel = b === sel ? null : b; if (sel) { sel.classList.add("sel"); Sound.sfx("tap"); } return; }
      const a = sel; sel = null; a.classList.remove("sel");
      const pa = sp.pairs[+a.dataset.i], pb = sp.pairs[+b.dataset.i];
      if (pa === pb || pa.r === pb.r || pa.l === pb.l) {
        [a, b].forEach(x => { x.classList.add("ok"); setTimeout(() => { x.classList.remove("ok"); x.classList.add("gone"); }, 380); });
        Sound.sfx("match");
        if (S.settings.autoplay) Sound.say(sp.pairs[+a.dataset.i].a);
        const r = b.getBoundingClientRect(); petals(r.left + r.width / 2, r.top + r.height / 2, 5);
        if (--left === 0) setTimeout(() => api.done(miss), 900);
      } else {
        miss++; Sound.sfx("no");
        [a, b].forEach(x => { x.classList.add("no"); setTimeout(() => x.classList.remove("no"), 400); });
      }
    });
    api.solve = () => { for (const p of sp.pairs.keys()) { $(`.opt[data-s="l"][data-i="${p}"]`, box).click(); $(`.opt[data-s="r"][data-i="${p}"]`, box).click(); } };
  },

  intro(sp, body, foot, api) {
    const it = sp.item;
    if (it.t === "k") {
      body.innerHTML = `<div class="ex"><span class="tagnew">Kanji novo</span><div class="intro">
        <button class="strokebox" aria-label="Ver os traços de novo">${strokeSVG(it.k)}</button>
        <div class="mean">${esc(it.pt)}</div>
        <div class="readings">${it.on ? `<span><em>ON</em>${esc(it.on)}</span>` : ""}${it.kun ? `<span><em>KUN</em>${esc(it.kun)}</span>` : ""}</div>
        ${it.d ? `<div class="hint">💡 ${esc(it.d)}</div>` : ""}
        <ul class="exlist">${it.ex.map(ex => `<li>${spk(exAudio(ex), "mini")}<b>${ruby(annotate(ex[0], ex[1]), "all")}</b><span class="muted">${esc(ex[2])}</span></li>`).join("")}</ul>
      </div></div>`;
      const svg = $("svg.strokes", body);
      animateStrokes(svg);
      $(".strokebox", body).onclick = () => animateStrokes(svg);
      if (S.settings.autoplay) setTimeout(() => { if (api.alive()) Sound.say(exAudio(it.ex[0])); }, 500);
    } else {
      body.innerHTML = `<div class="ex"><span class="tagnew">${it.j.length > 6 ? "Expressão nova" : "Palavra nova"}</span><div class="intro">
        <div class="hero-emo">${it.e || "💬"}</div>
        <div class="hero-w" style="font-size:${it.j.length > 8 ? 1.5 : it.j.length > 5 ? 1.9 : 2.4}rem">${ruby(it.a, "all")}</div>
        <div class="row" style="justify-content:center;margin-bottom:10px">${spk(wordAudio(it))}${spk(wordAudio(it), "slow", true)}</div>
        <div class="mean">${esc(it.pt)}</div>
        ${it.s ? `<div class="sent">${spk(sentAudio(it.s), "mini")}<div><div class="j">${ruby(it.s, "all")}</div><div class="p">${esc(it.st)}</div></div></div>` : ""}
      </div></div>`;
      if (S.settings.autoplay) setTimeout(() => { if (api.alive()) Sound.say(wordAudio(it)); }, 350);
    }
    const btn = el('<button class="btn">Entendi</button>');
    btn.onclick = () => api.next();
    foot.append(btn);
    api.solve = () => btn.click();
  },

  story(sp, body, foot, api) {
    const st = sp.story;
    let i = 0;
    body.innerHTML = `<div class="ex"><div class="center" style="margin-bottom:14px"><div class="hero-emo">${st.emoji}</div><div class="q" style="margin:6px 0 0">${esc(st.pt)}</div><div class="muted jp">${esc(st.jp)}</div></div><div class="chat"></div></div>`;
    const chat = $(".chat", body), btn = el('<button class="btn">Começar a conversa</button>');
    foot.append(btn);
    const addLine = () => {
      const [who, txt, pt] = st.lines[i], c = st.cast[who], a = sentAudio(txt, c[2]);
      const node = el(`<div class="line ${who === "A" ? "me" : ""}"><div class="av">${c[1]}</div><div class="bub"><div class="who">${esc(c[0])}</div><div class="j">${ruby(txt)}</div><div class="p hide">${esc(pt)}</div><button class="link small" style="padding:4px 0 0">Ver tradução</button></div></div>`);
      const play = () => Sound.say(a, { onState: on => node.classList.toggle("playing", on) });
      $(".link", node).onclick = e => { e.stopPropagation(); $(".p", node).classList.remove("hide"); e.target.remove(); };
      $(".bub", node).onclick = play;
      chat.append(node);
      node.scrollIntoView({ behavior: "smooth", block: "end" });
      play(); i++;
      btn.textContent = i < st.lines.length ? "Continuar" : "Responder perguntas";
      if (i < st.lines.length) Sound.preload([sentAudio(st.lines[i][1], st.cast[st.lines[i][0]][2])]);
    };
    btn.onclick = () => { if (i < st.lines.length) addLine(); else api.next(); };
    api.solve = () => btn.click();
  },

  trace(sp, body, foot, api) {
    const it = sp.item, ds = STROKES[it.k], n = ds.length, guided = sp.guided;
    body.innerHTML = `<div class="ex"><div class="q">${guided ? "Escreva seguindo os traços" : "Escreva de memória"}: <span style="color:var(--blue)">${esc(it.pt)}</span></div>
      <div class="tracewrap"><svg viewBox="0 0 109 109"><g class="ghost" style="${guided ? "" : "opacity:0"}">${ds.map(d => `<path d="${d}"/>`).join("")}</g><g class="done"></g><path class="hintp" d=""/><circle class="start" r="3.6" cx="-9" cy="-9"/><path class="user" d=""/></svg></div>
      <div class="traceinfo"><span>Traço <b class="cur">1</b> de ${n}</span><button class="link" data-hint>💡 Mostrar traço</button></div>
      <button class="skip" data-skip="trace">Não posso escrever agora</button></div>`;
    const wrap = $(".tracewrap", body), svg = $("svg", wrap), ghosts = $$(".ghost path", svg), doneG = $(".done", svg), hintP = $(".hintp", svg), startC = $(".start", svg), userP = $(".user", svg);
    const NS = 20;
    const sample = p => { const L = p.getTotalLength(), a = []; for (let i = 0; i <= NS; i++) { const q = p.getPointAtLength(L * i / NS); a.push([q.x, q.y]); } a.len = L; return a; };
    const exp = ghosts.map(sample);
    let cur = 0, miss = 0, missHere = 0, hints = 0, pts = null, finished = false;
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    function resample(p) {
      let L = 0; const seg = [0];
      for (let i = 1; i < p.length; i++) { L += dist(p[i], p[i - 1]); seg.push(L); }
      const out = []; let j = 1;
      for (let i = 0; i <= NS; i++) {
        const t = L * i / NS;
        while (j < p.length - 1 && seg[j] < t) j++;
        const a = p[j - 1] || p[0], b = p[j] || p[0], d = seg[j] - seg[j - 1] || 1, f = Math.min(1, Math.max(0, (t - seg[j - 1]) / d));
        out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
      }
      out.len = L; return out;
    }
    const score = (u, e) => { let s = 0; for (let i = 0; i <= NS; i++) s += dist(u[i], e[i]); return s / (NS + 1); };
    const fits = (u, e) => dist(u[0], e[0]) < 25 && dist(u[NS], e[NS]) < 29 && score(u, e) < 17 && u.len > e.len * 0.4 && u.len < e.len * 2.4 + 12;
    function showHint(auto) {
      if (finished) return;
      if (!auto) hints++;
      const e = exp[cur];
      hintP.setAttribute("d", ds[cur]); startC.setAttribute("cx", e[0][0]); startC.setAttribute("cy", e[0][1]);
      const L = e.len; hintP.style.strokeDasharray = L;
      if (hintP.animate) hintP.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: Math.max(350, L * 9), fill: "forwards" });
    }
    function clearHint() { hintP.setAttribute("d", ""); startC.setAttribute("cx", -9); }
    function setup() { $(".cur", body).textContent = Math.min(cur + 1, n); clearHint(); missHere = 0; if (guided) showHint(true); }
    function accept() {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", ds[cur]); doneG.append(p);
      const L = exp[cur].len; p.style.strokeDasharray = L;
      if (p.animate) p.animate([{ strokeDashoffset: L * 0.6 }, { strokeDashoffset: 0 }], { duration: 160, fill: "forwards" });
      Sound.sfx("stroke"); cur++;
      if (cur >= n) return win();
      setup();
    }
    function win() {
      finished = true; clearHint(); wrap.classList.add("win"); S.stats.traces++;
      const r = wrap.getBoundingClientRect();
      const ok = miss + hints * 2 <= Math.max(2, Math.ceil(n / 3));
      setTimeout(() => api.answer(ok, { x: r.left + r.width / 2, y: r.top + r.height / 2, xp: 8 }), 350);
    }
    function reject(msg) {
      miss++; missHere++; Sound.sfx("no");
      wrap.classList.remove("bad"); void wrap.offsetWidth; wrap.classList.add("bad");
      if (msg) { const r = wrap.getBoundingClientRect(); floatText(msg, r.left + r.width / 2, r.top + 20); }
      if (missHere >= 2) showHint(true);
    }
    const pos = e => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 109, (e.clientY - r.top) / r.height * 109]; };
    svg.addEventListener("pointerdown", e => { if (finished) return; e.preventDefault(); try { svg.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } pts = [pos(e)]; userP.setAttribute("d", ""); });
    svg.addEventListener("pointermove", e => { if (!pts) return; const p = pos(e); if (dist(p, pts[pts.length - 1]) > 1.2) { pts.push(p); userP.setAttribute("d", "M" + pts.map(q => q[0].toFixed(1) + "," + q[1].toFixed(1)).join("L")); } });
    const up = () => {
      if (!pts) return;
      const raw = pts; pts = null; userP.setAttribute("d", "");
      if (raw.length < 2) return;
      const u = resample(raw), e = exp[cur];
      if (u.len < 4 && e.len > 14) return;
      if (fits(u, e)) return accept();
      const rev = u.slice().reverse(); rev.len = u.len;
      if (fits(rev, e)) return reject("Direção contrária!");
      for (let k = cur + 1; k < n; k++) if (fits(u, exp[k])) return reject("Outro traço vem antes!");
      reject();
    };
    svg.addEventListener("pointerup", up); svg.addEventListener("pointercancel", up);
    $("[data-hint]", body).onclick = () => showHint(false);
    setup();
    api.solve = wrong => { if (wrong) { miss = 99; } while (!finished) accept(); };
  },
};
