"use strict";
// Sessão de estudo: fila de exercícios, retorno imediato, erros que voltam, resultado e agendamento das revisões.

const PRAISE = [["せいかい！", "Correto!"], ["いいですね！", "Muito bem!"], ["その調子！", "Continue assim!"], ["やったね！", "Isso mesmo!"], ["すごい！", "Incrível!"]];
const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const Session = {
  cur: null,
  // cfg: { mode: lesson|review|boss|practice|mistakes|story|jump, steps, node?, title?, onEnd? }
  start(cfg) {
    Sound.stop();
    const root = el('<div class="sess"><div class="sess-top"><button class="x" aria-label="Sair">✕</button><div class="bar"><i style="width:0"></i></div><div class="combo"></div></div><div class="sess-body"></div><div class="sess-foot"></div></div>');
    document.body.append(root);
    document.documentElement.classList.add("lock");
    this.cur = { cfg, root, queue: cfg.steps.slice(), done: 0, combo: 0, maxCombo: 0, right: 0, wrong: 0, xp: 0, miss: {}, graded: {}, t0: Date.now(),
      ids: uniq(cfg.steps.flatMap(s => (s.item ? [s.item] : s.items || []))), flags: {}, n: 0 };
    $(".x", root).onclick = () => this.confirmQuit();
    root.addEventListener("click", e => { const b = e.target.closest("[data-skip]"); if (b) this.skip(b.dataset.skip); });
    this.next();
  },
  next() {
    const c = this.cur;
    if (!c) return;
    const fb = $(".fb", c.root); if (fb) fb.remove();
    Sound.stop();
    if (!c.queue.length) return this.finish();
    const step = c.step = c.queue.shift(), my = ++c.n;
    $(".sess-top .bar i", c.root).style.width = Math.round(100 * c.done / (c.done + c.queue.length + 1)) + "%";
    const body = $(".sess-body", c.root), foot = $(".sess-foot", c.root);
    body.innerHTML = ""; foot.innerHTML = ""; body.scrollTop = 0;
    const sp = c.spec = makeSpec(step, c.flags);
    const api = c.api = {
      alive: () => this.cur === c && c.n === my,
      answer: (ok, o) => { if (api.alive()) this.answer(ok, o || {}); },
      next: () => { if (api.alive()) { c.done++; Sound.sfx("tap"); this.next(); } },
      done: miss => { if (api.alive()) { c.done++; c.xp += 5; this.next(); } },
    };
    RENDER[sp.kind](sp, body, foot, api);
    // já deixa pronto o áudio dos próximos passos
    const pre = [sp.audio, sp.say];
    c.queue.slice(0, 2).forEach(s => { const it = s.item && ITEMS.get(s.item); if (it) pre.push(itemAudio(it), it.s ? sentAudio(it.s) : null); });
    Sound.preload(pre);
  },
  answer(ok, o) {
    const c = this.cur, st = c.step, sp = c.spec, id = st.item, mode = c.cfg.mode;
    S.stats.answers++;
    if (ok) { S.stats.correct++; c.right++; c.combo++; c.maxCombo = Math.max(c.maxCombo, c.combo); }
    else { c.wrong++; c.combo = 0; }
    let gain = 0;
    if (ok) { gain = st.retry ? 2 : (o.xp || 5); c.xp += gain; }
    if (id) {
      if (!ok) { c.miss[id] = (c.miss[id] || 0) + 1; S.mistakes[id] = Math.min(5, (S.mistakes[id] || 0) + 1); }
      else if (mode === "mistakes" && S.mistakes[id]) { if (--S.mistakes[id] <= 0) delete S.mistakes[id]; }
      if (mode === "review" && !c.graded[id]) { c.graded[id] = true; schedule(id, ok ? 3 : 1); }
      // errou: a mesma pergunta volta um pouco depois (no máximo 2 vezes)
      if (!ok && (st.retry || 0) < 2 && mode !== "jump") c.queue.splice(Math.min(c.queue.length, 3), 0, Object.assign({}, st, { retry: (st.retry || 0) + 1 }));
    }
    save();
    const combo = $(".combo", c.root);
    combo.textContent = c.combo >= 3 ? "🔥" + c.combo : ""; combo.classList.toggle("on", c.combo >= 3);
    if (ok) {
      Sound.sfx("ok", Math.min(c.combo - 1, 7));
      if (o.x) { petals(o.x, o.y, 8 + Math.min(c.combo, 8)); floatText("+" + gain + " XP", o.x, o.y - 30); }
      if (c.combo === 5 || c.combo === 10 || c.combo === 20) floatText(`${c.combo} seguidas! すごい！`, innerWidth / 2, innerHeight * 0.3, true);
    } else Sound.sfx("no");
    if (sp.say && S.settings.autoplay) setTimeout(() => { if (this.cur === c && c.spec === sp) Sound.say(sp.say); }, ok ? 480 : 650);
    const pr = PRAISE[ok ? (c.combo >= 5 ? 4 : rnd(4)) : 0];
    const fb = el(`<div class="fb ${ok ? "" : "bad"}"><h3><span>${ok ? `<span class="jp">${pr[0]}</span> ${pr[1]}` : '<span class="jp">おしい！</span> Quase!'}</span>${gain ? `<span class="xp">+${gain} XP</span>` : ""}</h3>
      ${ok ? "" : '<div class="small muted" style="margin-top:6px">Resposta certa:</div>'}<div class="ans">${sp.ans || ""}</div><button class="btn ${ok ? "green" : "red"}">Continuar</button></div>`);
    $(".btn", fb).onclick = () => { c.done++; this.next(); };
    $(".sess-foot", c.root).innerHTML = "";
    c.root.append(fb);
    c.api.solve = () => $(".btn", fb).click();
  },
  // "Não posso ouvir/escrever agora": troca os exercícios desse tipo nesta sessão
  skip(kind) {
    const c = this.cur; if (!c) return;
    if (kind === "listen") c.flags.noListen = true; else c.flags.noTrace = true;
    c.queue.unshift(c.step); this.next();
  },
  confirmQuit() {
    const c = this.cur; if (!c) return;
    if (c.resultShown) return this.close();
    sheet(`<div class="center">${kapi("sad", "")}</div><h2 class="center">Já vai?</h2><p class="center muted" style="margin:6px 0 16px">${c.cfg.mode === "review" ? "As revisões que você já fez ficam salvas." : "O progresso desta lição não será salvo."}</p>
      <button class="btn" data-close>Continuar estudando</button><button class="btn ghost" style="margin-top:10px;color:var(--red)" data-quit>Sair</button>`,
    (sh, close) => { $(".kapi", sh).style.cssText = "width:110px;margin:0 auto"; $("[data-quit]", sh).onclick = () => { close(); if (c.xp && c.cfg.mode === "review") addXP(c.xp); this.close(); }; });
  },
  close() {
    const c = this.cur; if (!c) return;
    Sound.stop(); c.root.remove(); this.cur = null;
    document.documentElement.classList.remove("lock");
    if (c.cfg.onEnd) c.cfg.onEnd(c);
    App.render();
    if (App.tab === "home" && c.cfg.node || c.cfg.mode === "jump") App.toCurrent(true);
    checkAch().forEach(a => { toast(a[1], `<b>Conquista!</b><br>${esc(a[2])}`); Sound.sfx("level"); });
  },
  finish() {
    const c = this.cur, cfg = c.cfg, node = cfg.node, mode = cfg.mode;
    const secs = Math.round((Date.now() - c.t0) / 1000), total = c.right + c.wrong, acc = total ? Math.round(100 * c.right / total) : 100;
    S.stats.time += secs; S.stats.maxCombo = Math.max(S.stats.maxCombo, c.maxCombo);
    let bonus = 0, title = "Treino concluído!", jp = "おつかれさまでした！", fail = false;
    const fresh = [];
    if (mode === "lesson") {
      for (const id of node.items) if (!S.items[id]) { const m = c.miss[id] || 0; schedule(id, m === 0 ? 3 : m === 1 ? 2 : 1); S.items[id].due = startOfDay(Date.now() + DAY); fresh.push(id); }
      bonus += 15; S.stats.lessons++; title = "Lição concluída!";
    } else if (mode === "story") { bonus += 30; title = "Conversa concluída!"; }
    else if (mode === "boss") { bonus += 25; title = "Desafio vencido!"; jp = "やったね！"; }
    else if (mode === "review") { title = "Revisão em dia!"; }
    else if (mode === "jump") {
      fail = c.wrong > 2;
      if (fail) { title = "Ainda não…"; jp = "がんばって！"; }
      else { title = "Unidade liberada!"; jp = "すごい！"; bonus += 30; cfg.onPass(); }
    }
    if (c.wrong === 0 && total >= 5) { bonus += 10; if (mode === "lesson") S.stats.perfect++; }
    if (node && !fail && mode !== "jump") {
      const stars = acc >= 90 ? 3 : acc >= 70 ? 2 : 1, old = S.nodes[node.id] || {};
      S.nodes[node.id] = { done: true, best: Math.max(old.best || 0, stars), n: (old.n || 0) + 1 };
    }
    const ev = addXP(c.xp + bonus);
    save();
    c.resultShown = true;
    $(".sess-top .bar i", c.root).style.width = "100%";
    const kan = fresh.filter(id => id[0] === "k").map(id => ITEMS.get(id)), wds = fresh.filter(id => id[0] !== "k").map(id => ITEMS.get(id));
    const extra = [];
    if (ev.streak) extra.push(`<div class="chip">🔥 ${ev.streak} ${ev.streak === 1 ? "dia" : "dias seguidos"}${ev.freeze ? " (folga usada)" : ""}</div>`);
    if (ev.goal) extra.push('<div class="chip">⚡ Meta do dia cumprida!</div>');
    if (ev.level) extra.push(`<div class="chip">⬆️ Nível ${ev.level}</div>`);
    if (c.wrong === 0 && total >= 5) extra.push('<div class="chip">💎 Sem nenhum erro</div>');
    $(".sess-body", c.root).innerHTML = `<div class="result">${kapi(fail ? "sad" : "cheer", fail ? "" : "jump")}
      <div class="jpbig">${jp}</div><h2>${title}</h2>
      ${mode === "jump" && fail ? '<p class="muted">Você errou mais de 2. Siga a trilha e tente de novo quando quiser.</p>' : ""}
      <div class="tiles3">
        <div class="t3" style="--c:var(--orange)"><small>XP ganho</small><b>+${ev.xp}</b></div>
        <div class="t3" style="--c:var(--green);animation-delay:.12s"><small>Precisão</small><b>${acc}%</b></div>
        <div class="t3" style="--c:var(--blue);animation-delay:.24s"><small>Tempo</small><b>${fmtTime(secs)}</b></div>
      </div>
      ${kan.length ? `<div class="muted small">Kanji novos na sua coleção</div><div class="stamps">${kan.map((k, i) => `<span class="stamp" style="animation-delay:${0.3 + i * 0.12}s">${k.k}</span>`).join("")}</div>` : ""}
      ${wds.length ? `<div class="muted small">Palavras novas</div><div class="row" style="flex-wrap:wrap;justify-content:center;gap:6px;margin:6px 0 10px">${wds.map(w => `<span class="chip jp">${esc(w.j)}</span>`).join("")}</div>` : ""}
      <div class="row" style="flex-wrap:wrap;justify-content:center;gap:6px">${extra.join("")}</div>
      ${fresh.length ? '<p class="muted small" style="margin-top:12px">Amanhã eles voltam na revisão, na hora certa para a memória fixar.</p>' : ""}
    </div>`;
    const btn = el('<button class="btn green">Continuar</button>');
    btn.onclick = () => this.close();
    const foot = $(".sess-foot", c.root); foot.innerHTML = ""; foot.append(btn);
    c.api = { solve: () => btn.click() };
    if (!fail) { Sound.sfx(ev.level ? "level" : "win"); petalRain(); setTimeout(() => { if (this.cur === c) Sound.say(sentAudio(jp)); }, 900); }
    else Sound.sfx("over");
  },
};

// ── Montagem das sessões ──
function reviewGen(it, st) {
  if (st === undefined) st = stage(S.items[it.id]);
  if (it.t === "k") return pick(st <= 1 ? ["k_meaning", "k_pick", "k_exmean"] : st === 2 ? ["k_pick", "k_read", "k_listen", "k_trace"] : ["k_read", "k_trace", "k_listen", "k_trace"]);
  return pick(st <= 1 ? ["w_jp_pt", "w_listen_pt", "w_pt_jp"] : st === 2 ? ["w_pt_jp", "w_listen_jp", "w_read", "w_cloze", "w_spell"] : ["w_spell", "w_build", "w_listen_build", "w_cloze", "w_read"]);
}
// itens para o jogo de pares, sem significados repetidos
function matchIds(ids, n) {
  const seen = new Set(), out = [];
  for (const id of shuffle(ids)) { const it = ITEMS.get(id), k = it.pt.toLowerCase(); if (seen.has(k)) continue; seen.add(k); out.push(id); if (out.length >= n) break; }
  return out;
}
function lessonSteps(node) {
  const its = node.items.map(id => ITEMS.get(id)), steps = [];
  // 1) conhecer aos pares e já reconhecer
  for (let i = 0; i < its.length; i += 2) {
    const pair = its.slice(i, i + 2);
    pair.forEach(it => steps.push({ gen: "intro", item: it.id }));
    shuffle(pair).forEach(it => steps.push({ gen: it.t === "k" ? "k_meaning" : "w_jp_pt", item: it.id }));
  }
  // 2) pares + caminho inverso
  if (its.length >= 3) steps.push({ gen: "match", items: matchIds(node.items, 5) });
  shuffle(its).forEach((it, i) => steps.push({ gen: it.t === "k" ? "k_pick" : (i % 2 ? "w_listen_pt" : "w_pt_jp"), item: it.id }));
  // 3) um item antigo no meio (intercalar ajuda a memória)
  const old = shuffle(learned().filter(id => !node.items.includes(id))).slice(0, 2);
  old.forEach(id => steps.push({ gen: reviewGen(ITEMS.get(id)), item: id }));
  // 4) produzir: ler, soletrar, completar, escrever
  shuffle(its).forEach((it, i) => steps.push({ gen: it.t === "k" ? (i % 2 ? "k_listen" : "k_read") : pick(["w_spell", "w_cloze", "w_listen_jp"]), item: it.id }));
  shuffle(its.filter(it => it.t === "k")).forEach(it => steps.push({ gen: "k_trace", item: it.id, guided: true }));
  shuffle(its.filter(it => it.t === "w" && it.s)).slice(0, 2).forEach((it, i) => steps.push({ gen: i ? "w_listen_build" : "w_build", item: it.id }));
  return steps;
}
function reviewSteps(ids) {
  const steps = shuffle(ids).map(id => ({ gen: reviewGen(ITEMS.get(id)), item: id, guided: false }));
  if (ids.length >= 4) steps.splice(Math.min(3, steps.length), 0, { gen: "match", items: matchIds(ids, 4) });
  return steps;
}
function bossSteps(unit) {
  const ids = shuffle(unit.items).slice(0, 14), steps = [];
  steps.push({ gen: "match", items: matchIds(ids.slice(0, 7), 5) });
  ids.forEach(id => steps.push({ gen: reviewGen(ITEMS.get(id), 3), item: id }));
  steps.push({ gen: "match", items: matchIds(ids.slice(7), 5) });
  return steps;
}
function storySteps(story) {
  const steps = [{ gen: "story", story }];
  story.quiz.forEach(q => steps.push({ gen: "quiz", q }));
  const all = story.lines.flatMap(l => l[1].split("|"));
  shuffle(story.lines.filter(l => { const n = l[1].split("|").length; return n >= 3 && n <= 6; })).slice(0, 2).forEach(l => {
    const mine = new Set(l[1].split("|").map(t => tileText(plain(t))));
    const extra = uniq(shuffle(all).filter(t => tileText(plain(t)) && !mine.has(tileText(plain(t))))).slice(0, 2);
    steps.push({ gen: "line", line: [l[1], l[2], story.cast[l[0]][2]], extra });
  });
  return steps;
}
const PRACTICE = {
  listen: () => shuffle(learned()).slice(0, 12).map(id => ({ gen: id[0] === "k" ? "k_listen" : pick(["w_listen_pt", "w_listen_jp", "w_listen_build"]), item: id })),
  write: () => learned("k").filter(id => id[0] === "k").sort((a, b) => S.items[a].s - S.items[b].s + Math.random() * 3 - 1.5).slice(0, 8).map(id => ({ gen: "k_trace", item: id, guided: false })),
  phrases: () => shuffle(learned("w").filter(id => ITEMS.get(id).s)).slice(0, 10).map(id => ({ gen: pick(["w_build", "w_listen_build", "w_cloze"]), item: id })),
  mistakes: () => Object.keys(S.mistakes).filter(id => ITEMS.has(id)).sort((a, b) => S.mistakes[b] - S.mistakes[a]).slice(0, 12).map(id => ({ gen: reviewGen(ITEMS.get(id), 2), item: id })),
};
function startNode(node) {
  if (node.type === "lesson") Session.start({ mode: "lesson", node, steps: lessonSteps(node) });
  else if (node.type === "story") Session.start({ mode: "story", node, steps: storySteps(node.story) });
  else Session.start({ mode: "boss", node, steps: bossSteps(node.unit) });
}
function startReview() {
  const ids = dueItems().slice(0, 20);
  if (ids.length) Session.start({ mode: "review", steps: reviewSteps(ids) });
}
function startPractice(kind) {
  const steps = PRACTICE[kind]();
  if (steps.length) Session.start({ mode: kind === "mistakes" ? "mistakes" : "practice", steps });
}
// Teste para pular direto a uma unidade (para quem já sabe o começo)
function startJump(unit) {
  const before = NODES.slice(0, unit.nodes[0].pos), ids = uniq(before.flatMap(n => n.items || []));
  const steps = shuffle(ids).slice(0, 12).map(id => ({ gen: id[0] === "k" ? pick(["k_meaning", "k_read", "k_pick"]) : pick(["w_jp_pt", "w_listen_pt", "w_pt_jp"]), item: id }));
  Session.start({ mode: "jump", steps, onPass() {
    before.forEach(n => { if (!nodeDone(n)) S.nodes[n.id] = { done: true, best: 1, n: 0, skipped: true }; });
    // o que foi pulado entra nas revisões aos poucos, espalhado pelos próximos dias
    ids.filter(id => !S.items[id]).forEach((id, i) => { schedule(id, 3); S.items[id].due = startOfDay(Date.now() + (1 + (i % 7)) * DAY); });
    save();
  } });
}

// ── Relâmpago: 60 segundos de perguntas rápidas ──
function startSpeed() {
  Sound.stop();
  let ids = learned();
  if (ids.length < 8) ids = uniq(ids.concat(UNITS[0].items));
  const root = el('<div class="sess"><div class="sess-top"><button class="x" aria-label="Sair">✕</button><div class="timer"><i></i></div><div class="score">0</div></div><div class="sess-body"></div></div>');
  document.body.append(root);
  const body = $(".sess-body", root), bar = $(".timer i", root), scoreEl = $(".score", root);
  const TOTAL = 60000;
  let left = TOTAL, last = Date.now(), score = 0, streak = 0, over = false, locked = false, opts = [];
  Session.cur = { ids, root, cfg: { mode: "speed" }, api: {} };
  const tick = setInterval(() => {
    const now = Date.now(); left -= now - last; last = now;
    bar.style.width = Math.max(0, 100 * left / TOTAL) + "%";
    if (left <= 0) end();
  }, 100);
  function ask() {
    const it = ITEMS.get(pick(ids));
    const sp = GEN[it.t === "k" ? pick(["k_meaning", "k_pick"]) : pick(["w_jp_pt", "w_pt_jp"])](it);
    opts = shuffle(sp.opts); locked = false;
    body.innerHTML = `<div class="ex"><div class="q">${sp.q}</div>${sp.prompt}<div class="opts ${sp.grid ? "grid" : ""}">${opts.map((o, i) => `<button class="opt ${o.cls || ""}" data-i="${i}"><span>${o.h}</span></button>`).join("")}</div></div>`;
  }
  body.addEventListener("click", e => {
    const b = e.target.closest(".opt");
    if (!b || locked || over) return;
    locked = true;
    const ok = opts[+b.dataset.i].ok, r = b.getBoundingClientRect();
    b.classList.add(ok ? "ok" : "no");
    if (ok) { score++; streak++; Sound.sfx("ok", Math.min(streak, 8)); petals(r.left + r.width / 2, r.top + r.height / 2, 6); scoreEl.textContent = score; }
    else { streak = 0; left -= 3000; Sound.sfx("no"); floatText("−3 s", r.left + r.width / 2, r.top); $$(".opt", body).forEach((x, i) => { if (opts[i].ok) x.classList.add("ok"); }); }
    setTimeout(() => { if (!over) ask(); }, ok ? 220 : 800);
  });
  function close() { clearInterval(tick); over = true; root.remove(); Session.cur = null; App.render(); checkAch().forEach(a => toast(a[1], `<b>Conquista!</b><br>${esc(a[2])}`)); }
  $(".x", root).onclick = close;
  function end() {
    if (over) return; over = true; clearInterval(tick);
    const best = score > S.stats.bestSpeed; if (best) S.stats.bestSpeed = score;
    const ev = score ? addXP(score * 2) : { xp: 0 }; save();
    body.innerHTML = `<div class="result">${kapi(score >= 10 ? "cheer" : "happy", "jump")}<div class="jpbig">${score >= 10 ? "すごい！" : "おつかれさまでした！"}</div><h2>${score} ${score === 1 ? "ponto" : "pontos"}</h2>
      <div class="tiles3"><div class="t3" style="--c:var(--orange)"><small>XP ganho</small><b>+${ev.xp}</b></div><div class="t3" style="--c:var(--purple)"><small>Recorde</small><b>${S.stats.bestSpeed}</b></div><div class="t3" style="--c:var(--green)"><small>${best ? "Novo" : "Faltou"}</small><b>${best ? "🏅" : Math.max(0, S.stats.bestSpeed - score)}</b></div></div>
      <button class="btn orange" data-again>Jogar de novo</button><button class="btn ghost" style="margin-top:10px" data-out>Sair</button></div>`;
    Sound.sfx(best ? "level" : "win"); if (best) petalRain();
    $("[data-again]", body).onclick = () => { root.remove(); Session.cur = null; startSpeed(); };
    $("[data-out]", body).onclick = close;
  }
  Session.cur.api.solve = wrong => { const i = opts.findIndex(o => (wrong ? !o.ok : o.ok)); $$(".opt", body)[i].click(); };
  Session.cur.end = end;
  ask();
}
