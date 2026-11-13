"use strict";
// Telas: Trilha, Treinar, Coleção, Perfil, boas-vindas.

const ICON = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20l6-11 4 6 2-3 6 8z"/><circle cx="17" cy="6" r="2"/></svg>',
  train: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>',
  me: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 5-7 8-7s7 2 8 7"/></svg>',
};
const NODE_X = [0, 46, 72, 46, 0, -46, -72, -46];
const whenDue = c => { const d = Math.ceil((c.due - Date.now()) / DAY); return d <= 0 ? "hoje" : d === 1 ? "amanhã" : `em ${d} dias`; };

const App = {
  tab: "home", sub: "kanji", scrolled: false,
  go(tab) { this.tab = tab; Sound.sfx("tap"); this.render(); window.scrollTo(0, 0); if (tab === "home") this.toCurrent(); },
  render() {
    const app = $("#app"), y = window.scrollY, due = dueItems().length;
    app.innerHTML = `<div class="screen">${SCREEN[this.tab]()}</div>
      <nav class="tabbar"><div>${[["home", "Trilha", ICON.home], ["train", "Treinar", ICON.train], ["book", "Coleção", ICON.book], ["me", "Perfil", ICON.me]].map(t =>
      `<button class="tab ${this.tab === t[0] ? "on" : ""}" data-tab="${t[0]}">${t[2]}<span>${t[1]}</span>${t[0] === "train" && due ? `<span class="dot">${due > 99 ? "99+" : due}</span>` : ""}</button>`).join("")}</div></nav>`;
    window.scrollTo(0, y);
    if (this.tab === "home" && !this.scrolled) { this.scrolled = true; this.toCurrent(); }
  },
  toCurrent(smooth) { const n = $(".node.cur"); if (n && n.dataset.node !== NODES[0].id) n.scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" }); },
};

const SCREEN = {
  home() {
    const due = dueItems().length, cur = currentNode(), xp = dailyXP(), pct = Math.min(100, Math.round(100 * xp / S.goal)), h = new Date().getHours();
    const greet = h < 5 ? "こんばんは！" : h < 11 ? "おはよう！" : h < 18 ? "こんにちは！" : "こんばんは！";
    let msg, btn = "", mood = "wave";
    if (due) { msg = `Você tem <b>${due}</b> ${due === 1 ? "revisão" : "revisões"} para hoje.`; btn = '<button class="btn small orange" data-act="review">Revisar agora</button>'; mood = "wow"; }
    else if (xp >= S.goal) { msg = "Meta do dia cumprida! 🎉 Quer adiantar mais um pouco?"; mood = "cheer"; }
    else if (cur) { msg = cur.pos ? "Vamos para a próxima?" : "Vamos começar pela primeira lição?"; btn = `<button class="btn small" data-act="cur">${cur.pos ? "Continuar" : "Começar"}</button>`; }
    else { msg = "Você completou toda a trilha! 🗻 Agora é manter as revisões."; mood = "cheer"; }
    return `<div class="topbar"><div class="stats"><span class="chip">🔥 ${streakNow()}</span><span class="chip" style="padding:3px 11px 3px 4px"><span class="ring" style="--p:${pct}"></span>${xp}/${S.goal}</span></div><span class="chip">⭐ Nível ${level(S.xp)}</span></div>
      <div class="banner">${kapi(mood)}<div class="grow"><b class="jp">${greet}</b><div class="small" style="margin:2px 0 8px">${msg}</div>${btn}</div></div>
      ${UNITS.map(u => `<section class="unit" id="${u.id}"><div class="unit-head" style="--c:var(--${u.color})"><span class="emo">${u.emoji}</span><div><small>Unidade ${u.idx + 1} · ${u.nodes.filter(nodeDone).length}/${u.nodes.length}</small><b>${esc(u.pt)}</b><span class="jpn jp">${esc(u.jp)}</span></div><button class="guide" data-guide="${u.id}">📖 Guia</button></div>
        <div class="nodes">${u.nodes.map(n => nodeHTML(n, cur)).join("")}</div></section>`).join("")}`;
  },
  train() {
    const due = dueItems().length, n = learned().length, nk = learned("k").filter(id => id[0] === "k").length, nm = Object.keys(S.mistakes).filter(id => ITEMS.has(id)).length;
    const next = n && !due ? Math.min(...learned().map(id => S.items[id].due)) : 0;
    const mode = (act, c, ic, t, d, cnt, off, hero) => `<button class="mode ${hero ? "hero" : ""}" style="--c:var(--${c})" data-act="${act}" ${off ? "disabled" : ""}><span class="ic">${ic}</span><span class="grow"><b>${t}</b><small>${d}</small></span>${cnt !== "" ? `<span class="cnt">${cnt}</span>` : ""}</button>`;
    return `<div class="topbar"><h1>Treinar</h1><span class="chip">🔥 ${streakNow()}</span></div>
      ${mode("review", "orange", "🧠", "Revisão do dia", due ? "O app escolhe o que você está quase esquecendo" : n ? `Tudo em dia! Próxima: ${whenDue({ due: next })}` : "Termine uma lição para começar a revisar", due || "✓", !due, !!due)}
      <div class="sec">Jogos e treinos</div>
      ${mode("speed", "purple", "⚡", "Relâmpago", "60 segundos, o máximo de acertos", S.stats.bestSpeed ? "🏅" + S.stats.bestSpeed : "", false)}
      ${mode("listen", "blue", "🎧", "Ouvir", "Só de ouvido, sem ler", "", n < 4)}
      ${mode("write", "red", "✍️", "Escrever kanji", "De memória, na ordem dos traços", "", nk < 1)}
      ${mode("phrases", "teal", "🧩", "Montar frases", "Frases do dia a dia", "", learned("w").length < 3)}
      ${mode("mistakes", "pink", "🩹", "Meus erros", nm ? "Reforce o que você errou" : "Nenhum erro guardado", nm || "", !nm)}
      ${n < 4 ? '<p class="muted small center" style="margin-top:8px">Os treinos abrem conforme você avança na trilha.</p>' : ""}`;
  },
  book() {
    const seg = `<div class="seg">${[["kanji", "Kanji"], ["words", "Palavras"], ["stories", "Conversas"]].map(s => `<button class="${App.sub === s[0] ? "on" : ""}" data-sub="${s[0]}">${s[1]}</button>`).join("")}</div>`;
    let html = "";
    if (App.sub === "kanji") {
      const got = learned("k").filter(id => id[0] === "k").length;
      html = `<div class="card" style="margin-bottom:14px"><div class="row"><b class="grow">${got} de ${KANJI.length} kanji</b><span class="muted small">${Math.round(100 * got / KANJI.length)}%</span></div><div class="bar" style="margin-top:8px"><i style="width:${100 * got / KANJI.length}%;--c:var(--red)"></i></div></div>
        ${UNITS.map(u => { const ks = u.items.filter(id => id[0] === "k"); return ks.length ? `<div class="sec">${u.emoji} ${esc(u.pt)}</div><div class="kgrid">${ks.map(id => { const st = stage(S.items[id]); return `<button class="kc s${st}" data-item="${id}">${id.slice(2)}${st ? `<i>${STAGE[st]}</i>` : ""}</button>`; }).join("")}</div>` : ""; }).join("")}
        <div class="legend">${[1, 2, 3, 4, 5].map(i => `<span>${STAGE[i]} ${STAGE_PT[i]}</span>`).join("")}</div>
        <p class="muted small center">Quanto mais você acerta nas revisões, mais o kanji cresce.</p>`;
    } else if (App.sub === "words") {
      const got = learned("w").filter(id => id[0] === "w").length, row = id => { const it = ITEMS.get(id), st = stage(S.items[id]); return `<li data-item="${id}">${spk(wordAudio(it), "mini")}<div class="grow"><div class="w jp">${ruby(it.a, "all")}</div><div class="small muted">${esc(it.pt)}</div></div><span class="stage">${st ? STAGE[st] : ""}</span></li>`; };
      html = `<div class="card" style="margin-bottom:14px"><div class="row"><b class="grow">${got} de ${WORDS.length} palavras</b><span class="muted small">${Math.round(100 * got / WORDS.length)}%</span></div><div class="bar" style="margin-top:8px"><i style="width:${100 * got / WORDS.length}%;--c:var(--blue)"></i></div></div>
        <div class="sec">📝 Minhas palavras</div><div class="card">${S.custom.length ? `<ul class="wlist">${S.custom.map(c => row(c.id)).join("")}</ul>` : '<p class="muted small">Viu uma palavra nova na rua, na escola, no mercado? Guarde aqui e ela entra nas suas revisões.</p>'}<button class="btn small ghost" style="margin-top:10px" data-act="add">＋ Adicionar palavra</button></div>
        ${UNITS.map(u => { const ws = u.items.filter(id => id[0] === "w"); return `<div class="sec">${u.emoji} ${esc(u.pt)}</div><div class="card"><ul class="wlist">${ws.map(row).join("")}</ul></div>`; }).join("")}`;
    } else {
      html = NODES.filter(n => n.type === "story").map(n => { const st = n.story, open = nodeOpen(n), done = nodeDone(n);
        return `<button class="mode" style="--c:var(--${n.unit.color})" data-story="${n.id}" ${open ? "" : "disabled"}><span class="ic">${open ? st.emoji : "🔒"}</span><span class="grow"><b>${esc(st.pt)}</b><small class="jp">${esc(st.jp)} · Unidade ${n.unit.idx + 1}</small></span>${done ? '<span class="cnt">✓</span>' : ""}</button>`; }).join("") +
        '<p class="muted small center">As conversas abrem conforme você avança na trilha.</p>';
    }
    return `<div class="topbar"><h1>Coleção</h1></div>${seg}${html}`;
  },
  me() {
    const L = level(S.xp), a = levelStart(L), b = levelStart(L + 1), acc = S.stats.answers ? Math.round(100 * S.stats.correct / S.stats.answers) : 0;
    const days = [], t0 = startOfDay(Date.now()), dow = (new Date().getDay() + 6) % 7;
    for (let i = 27 - (6 - dow); i >= -(6 - dow); i--) { const d = today(t0 - i * DAY + DAY / 2), xp = S.history[d] || 0; days.push(`<span class="${xp >= S.goal ? "a2" : xp ? "a1" : ""} ${i === 0 ? "today" : ""}" style="${i < 0 ? "opacity:.35" : ""}">${new Date(t0 - i * DAY + DAY / 2).getDate()}</span>`); }
    const sw = (k, label) => `<div class="set"><span>${label}</span><button class="switch ${S.settings[k] ? "on" : ""}" data-sw="${k}" aria-label="${label}"></button></div>`;
    const sel = (k, label, opts, val) => `<div class="set"><span>${label}</span><select data-sel="${k}">${opts.map(o => `<option value="${o[0]}" ${String(val) === String(o[0]) ? "selected" : ""}>${o[1]}</option>`).join("")}</select></div>`;
    return `<div class="topbar"><h1>Perfil</h1></div>
      <div class="card profile">${kapi("happy")}<div class="grow"><b style="font-size:1.2rem">Nível ${L}</b><div class="bar" style="margin:6px 0 4px"><i style="width:${100 * (S.xp - a) / (b - a)}%;--c:var(--orange)"></i></div><span class="small muted">${S.xp - a} / ${b - a} XP para o nível ${L + 1}</span></div></div>
      <div class="tiles3">
        <div class="t3" style="--c:var(--orange)"><small>Sequência</small><b>🔥 ${streakNow()}</b></div>
        <div class="t3" style="--c:var(--red)"><small>Kanji</small><b>${learned("k").filter(id => id[0] === "k").length}</b></div>
        <div class="t3" style="--c:var(--blue)"><small>Palavras</small><b>${learned("w").length}</b></div>
      </div>
      <div class="card small muted center">Recorde: ${S.streak.best} ${S.streak.best === 1 ? "dia" : "dias"} · ${S.xp} XP no total · ${acc}% de acertos · ${Math.round(S.stats.time / 60)} min de estudo${S.streak.freeze ? ` · ${"🧊".repeat(S.streak.freeze)} folga${S.streak.freeze > 1 ? "s" : ""}` : ""}</div>
      <div class="sec">Últimas 4 semanas</div>
      <div class="card"><div class="cal">${["S", "T", "Q", "Q", "S", "S", "D"].map(d => `<span style="background:none;aspect-ratio:auto">${d}</span>`).join("")}${days.join("")}</div></div>
      <div class="sec">Conquistas · ${Object.keys(S.ach).length}/${ACH.length}</div>
      <div class="card"><div class="badges">${ACH.map(x => `<div class="badge ${S.ach[x[0]] ? "on" : ""}" title="${esc(x[3])}"><i>${x[1]}</i>${esc(x[2])}</div>`).join("")}</div></div>
      <div class="sec">Ajustes</div>
      <div class="card">
        ${sel("goal", "Meta diária", [[100, "Leve · 5 min"], [200, "Normal · 10 min"], [400, "Intensa · 20 min"]], S.goal)}
        ${sel("voice", "Voz", [["rec", "Gravada"], ["tts", "Do aparelho"]], S.settings.voice)}
        ${sw("autoplay", "Tocar a voz sozinha")}
        ${sw("sfx", "Efeitos sonoros")}
        ${sel("furigana", "Furigana (leitura em cima)", [["all", "Sempre"], ["smart", "Só nos kanji novos"], ["none", "Nunca"]], S.settings.furigana)}
        ${sw("trace", "Exercícios de escrever kanji")}
        <div class="set"><span>Não está saindo som?</span><button class="btn small ghost" data-act="soundtest">Testar o som</button></div>
      </div>
      <div class="sec">Seus dados</div>
      <div class="card"><p class="small muted" style="margin-bottom:10px">O progresso fica guardado neste aparelho. Faça uma cópia de vez em quando.</p>
        <div class="row"><button class="btn small ghost grow" data-act="export">Copiar backup</button><button class="btn small ghost grow" data-act="import">Restaurar</button></div>
        <button class="link small" style="color:var(--red);display:block;margin:10px auto 0" data-act="reset">Recomeçar do zero</button></div>
      <p class="muted small center" style="margin-top:18px">Traços dos kanji: KanjiVG (CC BY-SA 3.0)<br>Letra dos kanji: Klee One (SIL OFL)<br>Vozes: geradas com Kokoro TTS (Apache 2.0)<br>Agendamento das revisões: FSRS</p>`;
  },
};

function nodeHTML(n, cur) {
  const done = nodeDone(n), open = nodeOpen(n), isCur = cur === n, x = NODE_X[n.pos % 8];
  const icon = n.type === "lesson" && n.kan ? `<span style="font-family:var(--kyo);font-weight:700">${n.icon}</span>` : n.icon;
  return `<button class="node ${done ? "done" : open ? "" : "locked"} ${isCur ? "cur" : ""}" style="--x:${x}px;--c:var(--${n.unit.color})${isCur && n === n.unit.nodes[0] ? ";margin-top:34px" : ""}" data-node="${n.id}" aria-label="${n.type}">${open ? icon : "🔒"}${isCur ? `<span class="tip">${n.pos ? "CONTINUAR" : "COMEÇAR"}</span>${kapi("wave", "node-kapi" + (x > 0 ? " l" : ""))}` : ""}${done ? `<span class="stars">${"★".repeat(S.nodes[n.id].best || 1)}</span>` : ""}</button>`;
}

// ── Folhas ──
function nodeSheet(n) {
  const open = nodeOpen(n), u = n.unit;
  let body = "";
  if (n.type === "lesson") {
    const its = n.items.map(id => ITEMS.get(id));
    body = `<h2>Lição ${n.n} · ${esc(u.pt)}</h2><p class="muted">Você vai aprender:</p>
      <ul class="wlist" style="margin:8px 0 14px">${its.map(it => it.t === "k"
        ? `<li><span style="font-family:var(--kyo);font-size:1.9rem;width:44px;text-align:center">${it.k}</span><div class="grow">${esc(it.pt)}</div><span class="stage">${STAGE[stage(S.items[it.id])] === "·" ? "" : STAGE[stage(S.items[it.id])]}</span></li>`
        : `<li><span style="font-size:1.5rem;width:44px;text-align:center">${it.e}</span><div class="grow"><div class="w jp">${ruby(it.a, "all")}</div><div class="small muted">${esc(it.pt)}</div></div><span class="stage">${stage(S.items[it.id]) ? STAGE[stage(S.items[it.id])] : ""}</span></li>`).join("")}</ul>`;
  } else if (n.type === "story") {
    const st = n.story;
    body = `<div class="center"><div class="hero-emo">${st.emoji}</div><h2 style="margin-top:8px">${esc(st.pt)}</h2><p class="muted jp">${esc(st.jp)}</p>
      <p style="margin:12px 0 16px">Uma conversa de verdade: ${Object.values(st.cast).map(c => `${c[1]} ${esc(c[0])}`).join(" e ")}. Ouça, leia e responda.</p></div>`;
  } else {
    body = `<div class="center"><div class="hero-emo">🏆</div><h2 style="margin-top:8px">Desafio · ${esc(u.pt)}</h2><p style="margin:12px 0 16px">Tudo da unidade misturado, sem apresentação. Mostre o que ficou!</p></div>`;
  }
  const jump = !open && !nodeOpen(u.nodes[0]) && u.idx > 0;
  sheet(body + (open ? `<button class="btn" style="--c:var(--${u.color})" data-go>${nodeDone(n) ? "Praticar de novo" : n.type === "lesson" ? "Começar · +XP" : "Começar"}</button>`
    : `<p class="center muted" style="margin-bottom:12px">🔒 Termine o passo anterior para abrir este.</p>${jump ? `<button class="btn ghost" data-jump>Já sei o que vem antes · fazer teste</button><p class="small muted center" style="margin-top:8px">12 perguntas sobre as unidades anteriores. Com até 2 erros, a unidade ${u.idx + 1} abre.</p>` : ""}`),
  (sh, close) => {
    const go = $("[data-go]", sh), j = $("[data-jump]", sh);
    if (go) go.onclick = () => { close(); startNode(n); };
    if (j) j.onclick = () => { close(); startJump(u); };
  });
}
function guideSheet(u) {
  const ks = u.items.filter(id => id[0] === "k"), ws = u.items.filter(id => id[0] === "w").map(id => ITEMS.get(id));
  sheet(`<h2>📖 ${esc(u.pt)}</h2><p class="muted jp" style="margin-bottom:8px">${esc(u.jp)}</p>
    ${u.tips.map(t => `<div class="tiprow"><b class="jp">${ruby(t[0], "all")}</b><div style="line-height:1.9">${ruby(t[1], "all")}</div></div>`).join("")}
    ${ks.length ? `<div class="sec">Kanji desta unidade</div><div class="kgrid">${ks.map(id => `<button class="kc s${stage(S.items[id])}" data-item="${id}">${id.slice(2)}</button>`).join("")}</div>` : ""}
    <div class="sec">Palavras</div><ul class="wlist">${ws.map(it => `<li>${spk(wordAudio(it), "mini")}<div class="grow"><div class="w jp">${ruby(it.a, "all")}</div><div class="small muted">${esc(it.pt)}</div></div></li>`).join("")}</ul>
    <button class="btn ghost" style="margin-top:14px" data-close>Fechar</button>`);
}
function itemSheet(id) {
  const it = ITEMS.get(id), c = S.items[id];
  const srs = c ? `<div class="row" style="justify-content:center;gap:6px;margin:10px 0"><span class="chip">${STAGE[stage(c)]} ${STAGE_PT[stage(c)]}</span><span class="chip">Próxima revisão: ${whenDue(c)}</span></div>` : '<p class="center muted small" style="margin:10px 0">Ainda não estudado</p>';
  if (it.t === "k") {
    sheet(`<div class="intro" style="box-shadow:none;background:none;padding:0"><button class="strokebox">${strokeSVG(it.k)}</button><div class="mean">${esc(it.pt)}</div>
      <div class="readings">${it.on ? `<span><em>ON</em>${esc(it.on)}</span>` : ""}${it.kun ? `<span><em>KUN</em>${esc(it.kun)}</span>` : ""}</div>${srs}
      ${it.d ? `<div class="hint">💡 ${esc(it.d)}</div>` : ""}
      <ul class="exlist">${it.ex.map(ex => `<li>${spk(exAudio(ex), "mini")}<b>${ruby(annotate(ex[0], ex[1]), "all")}</b><span class="muted">${esc(ex[2])}</span></li>`).join("")}</ul></div>
      <button class="btn" style="margin-top:14px;--c:var(--red)" data-write>✍️ Praticar a escrita</button>`,
    (sh, close) => {
      const svg = $("svg.strokes", sh); animateStrokes(svg);
      $(".strokebox", sh).onclick = () => animateStrokes(svg);
      $("[data-write]", sh).onclick = () => { $$(".scrim").forEach(s => s.remove()); Session.start({ mode: "practice", steps: [{ gen: "k_trace", item: id, guided: true }, { gen: "k_trace", item: id, guided: false }] }); };
    });
  } else {
    sheet(`<div class="intro" style="box-shadow:none;background:none;padding:0"><div class="hero-emo">${it.e || "💬"}</div><div class="hero-w" style="font-size:${it.j.length > 8 ? 1.5 : 2.1}rem">${ruby(it.a, "all")}</div>
      <div class="row" style="justify-content:center;margin-bottom:10px">${spk(wordAudio(it))}${spk(wordAudio(it), "slow", true)}</div><div class="mean">${esc(it.pt)}</div>${srs}
      ${it.s ? `<div class="sent">${spk(sentAudio(it.s), "mini")}<div><div class="j">${ruby(it.s, "all")}</div><div class="p">${esc(it.st)}</div></div></div>` : ""}</div>
      ${it.custom ? '<button class="link small" style="color:var(--red);display:block;margin:14px auto 0" data-del>Apagar esta palavra</button>' : ""}
      <button class="btn ghost" style="margin-top:14px" data-close>Fechar</button>`,
    (sh, close) => {
      const d = $("[data-del]", sh);
      if (d) d.onclick = () => { S.custom = S.custom.filter(x => x.id !== id); delete S.items[id]; delete S.mistakes[id]; syncCustom(); save(); close(); App.render(); };
    });
  }
}
function addSheet() {
  sheet(`<h2>📝 Nova palavra</h2><p class="muted small">Ela entra nas suas revisões, com a voz do aparelho.</p>
    <label class="field">Em japonês<input data-f="j" lang="ja" placeholder="例: 回覧板" autocomplete="off"></label>
    <label class="field">Leitura em hiragana (se tiver kanji)<input data-f="r" lang="ja" placeholder="かいらんばん" autocomplete="off"></label>
    <label class="field">Significado em português<input data-f="pt" placeholder="circular do bairro" autocomplete="off"></label>
    <button class="btn green" style="margin-top:8px" data-save>Guardar</button>`,
  (sh, close) => {
    $("[data-save]", sh).onclick = () => {
      const j = $('[data-f="j"]', sh).value.trim(), r = $('[data-f="r"]', sh).value.trim(), pt = $('[data-f="pt"]', sh).value.trim();
      if (!j || !pt) return toast("✏️", "Preencha o japonês e o significado.");
      if (hasKanji(j) && !r) return toast("✏️", "Escreva a leitura em hiragana.");
      const id = "c:" + Date.now().toString(36);
      S.custom.push({ id, j, r: r || j, pt }); syncCustom();
      schedule(id, 2); S.items[id].due = Date.now();
      save(); close(); App.render(); toast("📝", "Palavra guardada! Ela já aparece na revisão.");
    };
  });
}
const GREETING = "こんにちは！|いっしょに|日本語{にほんご}|を|勉強{べんきょう}しましょう。";
const SOUND_TIPS = `<ol style="text-align:left;padding-left:20px;margin:10px 0;line-height:1.6">
  <li>Aumente o volume pelos botões laterais.</li>
  <li>Veja se o iPhone não está ligado a um fone ou caixa Bluetooth.</li>
  <li>Feche o app por completo e abra de novo.</li>
  <li>Se continuar mudo, toque em <b>Usar a voz do aparelho</b> abaixo.</li></ol>`;
function soundSheet() {
  sheet(`<h2 class="center">Teste de som</h2><p class="center muted">Toque no botão e escute a Kapi.</p>
    <div class="listen">${spk(sentAudio(GREETING), "big")}</div><div data-out></div>
    <div class="row"><button class="btn green grow" data-close>Ouvi!</button><button class="btn ghost grow" data-no>Não ouvi</button></div>`,
  (sh, close) => {
    $("[data-no]", sh).onclick = () => {
      const st = Sound.state();
      $("[data-out]", sh).innerHTML = `${SOUND_TIPS}<button class="btn small ghost" data-tts>Usar a voz do aparelho</button><p class="small muted" style="margin:10px 0">Diagnóstico: áudio ${st.ctx} · elemento ${st.elOK ? "ok" : "bloqueado"} · sessão ${st.session ? "sim" : "não"} · voz ${S.settings.voice}</p>`;
      $("[data-tts]", sh).onclick = () => { S.settings.voice = "tts"; save(); Sound.say(sentAudio(GREETING)); toast("🔊", "Agora o app usa a voz do aparelho."); };
    };
  });
}
function backupSheet(mode) {
  if (mode === "export") {
    const data = JSON.stringify(S);
    sheet(`<h2>Backup</h2><p class="muted small">Copie este texto e guarde (Notas, e-mail…). Para voltar, use “Restaurar”.</p>
      <label class="field"><input readonly value="${esc(data)}"></label><button class="btn" data-copy>Copiar</button>`,
    (sh, close) => { $("[data-copy]", sh).onclick = () => { const i = $("input", sh); i.select(); try { navigator.clipboard.writeText(data); } catch (e) { document.execCommand("copy"); } toast("📋", "Backup copiado!"); close(); }; });
  } else {
    sheet(`<h2>Restaurar</h2><p class="muted small">Cole aqui o texto do backup. O progresso atual será substituído.</p>
      <label class="field"><input data-in placeholder='{"v":3,…}'></label><button class="btn" data-ok>Restaurar</button>`,
    (sh, close) => { $("[data-ok]", sh).onclick = () => { try { const d = JSON.parse($("[data-in]", sh).value); if (d.v !== 3) throw 0; localStorage.setItem(KEY, JSON.stringify(d)); load(); close(); App.render(); toast("✅", "Progresso restaurado!"); } catch (e) { toast("⚠️", "Esse texto não é um backup válido."); } }; });
  }
}
function resetSheet() {
  sheet(`<h2 class="center">Recomeçar do zero?</h2><p class="center muted" style="margin:8px 0 16px">Todo o progresso, XP e conquistas serão apagados.</p>
    <button class="btn" data-close>Cancelar</button><button class="btn ghost" style="margin-top:10px;color:var(--red)" data-yes>Apagar tudo</button>`,
  (sh, close) => { $("[data-yes]", sh).onclick = () => { localStorage.removeItem(KEY); S = defState(); S.onboarded = true; syncCustom(); save(); close(); App.scrolled = false; App.go("home"); }; });
}

// ── Boas-vindas ──
function onboarding() {
  const root = el('<div class="onb"></div>');
  document.body.append(root);
  Sound.preload([sentAudio(GREETING)]);
  const standalone = window.navigator.standalone || (window.matchMedia && matchMedia("(display-mode: standalone)").matches);
  const steps = [
    () => { root.innerHTML = `${kapi("wave")}<h1>Olá! Eu sou a Kapi <span class="jp">🍊</span></h1><p>Vou te ajudar com o japonês do dia a dia: mercado, escola, hospital, vizinhos. Um pouquinho por dia.</p><button class="btn" data-n>Vamos lá!</button>`; },
    () => {
      root.innerHTML = `${kapi("happy")}<h1>Primeiro, o som 🔊</h1><p>Toque no botão e escute.</p><div class="listen" style="margin:6px 0">${spk(sentAudio(GREETING), "big")}</div><div data-q class="hide" style="width:100%"><p style="margin:0 auto 10px"><b>Você ouviu a voz?</b></p><div class="row"><button class="btn green grow" data-n>Sim, ouvi</button><button class="btn ghost grow" data-no>Não ouvi</button></div></div><div data-tips class="hide" style="width:100%">${SOUND_TIPS}<div class="row"><button class="btn small ghost grow" data-tts>Usar a voz do aparelho</button><button class="btn small ghost grow" data-n>Continuar assim</button></div></div>`;
      $(".spk", root).addEventListener("click", () => setTimeout(() => $("[data-q]", root) && $("[data-q]", root).classList.remove("hide"), 900));
      $("[data-no]", root).onclick = () => { $("[data-q]", root).classList.add("hide"); $("[data-tips]", root).classList.remove("hide"); };
      $("[data-tts]", root).onclick = () => { S.settings.voice = "tts"; save(); Sound.say(sentAudio(GREETING)); $("[data-tips]", root).classList.add("hide"); $("[data-q]", root).classList.remove("hide"); };
    },
    () => {
      root.innerHTML = `${kapi("think")}<h1>Quanto tempo por dia?</h1><p>Pouco e todo dia funciona melhor do que muito de vez em quando.</p><div class="opts">${[[100, "🌱", "Leve", "5 minutos · 1 lição"], [200, "🌿", "Normal", "10 minutos · 2 lições"], [400, "🌳", "Intensa", "20 minutos · 4 lições"]].map(g => `<button class="opt" data-goal="${g[0]}"><span style="font-size:1.5rem">${g[1]}</span><span class="grow"><b>${g[2]}</b> · ${g[3]}</span></button>`).join("")}</div>`;
      $$("[data-goal]", root).forEach(b => { b.onclick = () => { S.goal = +b.dataset.goal; save(); go(); }; });
    },
    () => {
      root.innerHTML = `${kapi("cheer", "jump")}<h1>Tudo pronto!</h1>
        <div class="card" style="text-align:left;width:100%"><div class="tiprow" style="border:none;padding-top:0"><b>🗺️ Trilha</b>Lições curtas, sempre com perguntas. Nada de só ler.</div><div class="tiprow"><b>🧠 Revisão</b>O app traz cada palavra de volta bem na hora em que você ia esquecer.</div><div class="tiprow" style="padding-bottom:0"><b>✍️ Ouvir e escrever</b>Vozes em japonês e kanji escritos com o dedo, na ordem certa.</div></div>
        ${standalone ? "" : '<p class="small">Dica: no Safari, toque em <b>Compartilhar</b> → <b>Adicionar à Tela de Início</b> para usar como um app.</p>'}
        <button class="btn green" data-n>Começar</button>`;
    },
  ];
  let i = -1;
  function go() {
    i++;
    if (i >= steps.length) { S.onboarded = true; save(); root.remove(); App.render(); return; }
    steps[i]();
    $$("[data-n]", root).forEach(b => { b.onclick = go; });
  }
  go();
}

// ── Toques ──
document.addEventListener("click", e => {
  if (e.target.closest("[data-say]")) return;
  const t = e.target.closest("[data-tab],[data-node],[data-guide],[data-act],[data-sub],[data-item],[data-story],[data-sw]");
  if (!t || t.closest(".sess")) return;
  const d = t.dataset;
  if (d.tab) return App.go(d.tab);
  if (d.node) { Sound.sfx("tap"); return nodeSheet(NODE[d.node]); }
  if (d.guide) return guideSheet(UNITS.find(u => u.id === d.guide));
  if (d.sub) { App.sub = d.sub; return App.render(); }
  if (d.item) return itemSheet(d.item);
  if (d.story) return startNode(NODE[d.story]);
  if (d.sw) { S.settings[d.sw] = !S.settings[d.sw]; save(); Sound.sfx("tap"); return App.render(); }
  const act = d.act;
  if (act === "review") startReview();
  else if (act === "cur") { const n = currentNode(); if (n) nodeSheet(n); }
  else if (act === "speed") startSpeed();
  else if (PRACTICE[act]) startPractice(act);
  else if (act === "add") addSheet();
  else if (act === "soundtest") soundSheet();
  else if (act === "export" || act === "import") backupSheet(act);
  else if (act === "reset") resetSheet();
});
document.addEventListener("change", e => {
  const s = e.target.closest("[data-sel]");
  if (!s) return;
  if (s.dataset.sel === "goal") S.goal = +s.value; else S.settings[s.dataset.sel] = s.value;
  save(); App.render();
});
