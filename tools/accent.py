"""Acento tonal (高低アクセント) para as vozes do app.

O modelo de voz sozinho "chuta" a melodia das palavras e erra com frequência. Aqui a melodia
vem do dicionário de acentos do OpenJTalk (pyopenjtalk-plus) e é aplicada direto na curva de
altura (F0) que o modelo usa para falar:

  texto -> análise (sílabas/moras, frases de acento, posição da queda) -> nível alto/baixo
  por mora -> curva de F0 corrigida.

A leitura continua vindo das anotações do app; o analisador só fornece o acento.
"""
import json, os, re, unicodedata
import numpy as np
import jaconv
import pyopenjtalk

PUNCT = '。、！？!?,.…'
SMALL = 'ャュョァィゥェォヮゃゅょぁぃぅぇぉゎ'
VOWELS = set('aioeɨɯ')
NASALS = set('mnŋɲɴ')
NONMORA = set(' .,!?')

# Correções manuais: superfície -> acento em katakana, com ＼ depois da mora acentuada e espaço entre
# frases de acento. Ex.: "何曜日": "ナンヨ＼ービ". Sem ＼ = sem queda.
HERE = os.path.dirname(os.path.abspath(__file__))
try:
    OVERRIDES = json.load(open(os.path.join(HERE, 'accent_overrides.json'), encoding='utf8'))
except FileNotFoundError:
    OVERRIDES = {}


def kata_moras(pron):
    """'キョーワ' -> ['キョ', 'ー', 'ワ']"""
    out = []
    for ch in pron.replace('’', '').replace("'", ''):
        if ch in SMALL and out: out[-1] += ch
        else: out.append(ch)
    return out


def mora_spans(ps):
    """Fonemas do Kokoro -> lista de moras, cada uma com os índices dos seus símbolos."""
    spans, cur = [], []
    n = len(ps)
    for i, c in enumerate(ps):
        if c in NONMORA:
            if cur and spans: spans[-1].extend(cur)
            cur = []
        elif c in VOWELS:
            cur.append(i); spans.append(cur); cur = []
        elif c in 'ːʔ':
            if cur and spans: spans[-1].extend(cur)
            cur = []
            spans.append([i])
        elif c in NASALS:
            j = i + 1
            if j < n and ps[j] == 'ʲ': j += 1
            if j < n and ps[j] in VOWELS: cur.append(i)
            else:
                if cur and spans: spans[-1].extend(cur)
                cur = []
                spans.append([i])
        else:
            cur.append(i)
    if cur and spans: spans[-1].extend(cur)
    return spans


def _kana_of(annot):
    """'休{やす}み' -> 'やすみ' (a leitura no lugar dos kanji)"""
    return re.sub(r'[一-鿿々ヶ]+\{([^}]+)\}', r'\1', annot)


def _frontend(parts, cuts):
    """Analisa o texto; em cada índice de 'cuts' a análise recomeça (força o limite de palavra)."""
    nodes, seg = [], []
    for i, p in enumerate(parts + [None]):
        if p is None or (i in cuts and seg):
            ns = pyopenjtalk.run_frontend(''.join(seg))
            if nodes and ns:
                ns[0]['chain_flag'] = 1 if ns[0]['pos'] in ('助詞', '助動詞') else 0
            nodes.extend(ns); seg = []
        if p is not None: seg.append(p)
    return nodes


def _align(parts, nodes):
    groups, i, j = [], 0, 0
    while i < len(parts):
        I, J, pa, pb = [i], [], len(parts[i]), 0
        while pa != pb:
            if pb < pa: J.append(j); pb += len(nodes[j]['string']); j += 1
            else: i += 1; I.append(i); pa += len(parts[i])
        i += 1
        groups.append((I, J))
    return groups


def _head(nodes, k):
    while k > 0 and nodes[k]['chain_flag'] == 1: k -= 1
    return k


def _fix_nodes(nodes):
    """Regras que o dicionário erra com frequência."""
    for k, x in enumerate(nodes):
        # depois de pontuação começa sempre uma frase de acento nova
        if k and nodes[k - 1]['pos'] == '記号' and x['chain_flag'] == 1: x['chain_flag'] = 0
        # 〜たい: verbo com queda -> a queda vai para o "ta" (たべた＼い)
        if x['pos'] == '助動詞' and x['orig'] == 'たい' and x['chain_flag'] == 1 and x['pron'].startswith('タ'):
            h = _head(nodes, k)
            if nodes[h]['acc'] > 0:
                nodes[h]['acc'] = sum(len(kata_moras(nodes[q]['pron'])) for q in range(h, k)) + 1
        # いい (bom) analisado como 言い
        if x['string'] == 'いい' and x['pron'] in ('イイ', 'イー') and x['chain_flag'] != 1:
            x['acc'] = 1


def parse_notation(s):
    """'ノ＼ドガ カワ＼イタ' -> [(3, 1), (4, 2)]  (moras, posição da queda; 0 = sem queda)"""
    out = []
    for ph in s.split():
        acc = 0
        if '＼' in ph: acc = len(kata_moras(ph.split('＼')[0]))
        out.append((len(kata_moras(ph.replace('＼', ''))), acc))
    return out


def _apply_overrides(mine, groups, nodes, moras, log):
    # mora inicial de cada nó
    start, c = [], 0
    for x in nodes:
        start.append(c)
        if x['pron'] and x['pron'][0] not in '、。？！?!': c += len(kata_moras(x['pron']))
    start.append(c)
    surf = [''.join(mine[x][0] for x in I) for I, J in groups]
    g = 0
    while g < len(groups):
        hit = None
        for key in OVERRIDES:
            acc, h = '', g
            while h < len(groups) and len(acc) < len(key): acc += surf[h]; h += 1
            if acc == key and (hit is None or len(key) > len(hit[0])): hit = (key, h)
        if not hit: g += 1; continue
        key, h = hit
        J = [j for G in groups[g:h] for j in G[1]]
        a, b = start[J[0]], start[J[-1] + 1]
        new = parse_notation(OVERRIDES[key])
        if sum(n for n, _ in new) != b - a:
            log.append(f'  acento: correção de "{key}" não tem {b - a} moras'); g = h; continue
        # o que vem antes/depois na mesma frase de acento continua junto
        lead = a
        while lead > 0 and moras[lead - 1]['ph'] == moras[a]['ph']: lead -= 1
        trail = b
        while trail < len(moras) and moras[trail]['ph'] == moras[b - 1]['ph']: trail += 1
        old = moras[b - 1]
        old_nuc = (b - old['pos']) + old['acc'] if 0 < old['acc'] < old['n'] else None   # índice (1-based) da mora acentuada
        new = [list(x) for x in new]
        if a - lead:
            if new[0][1]: new[0][1] += a - lead
            new[0][0] += a - lead
        if trail - b:
            n, acc = new[-1]
            if acc == 0:
                tk = ''.join(m.get('kana', '') for m in moras[b:trail])
                if tk.startswith('デショ'): acc = n + 2
                elif tk.startswith(('デス', 'デシ')): acc = n + 1
                elif old_nuc is not None and old_nuc > b: acc = n + (old_nuc - b)
                else: acc = 0
            new[-1] = [n + trail - b, acc]
        k = lead
        for n, acc in new:
            for i in range(n):
                moras[k].update(ph=-1 - (k - i), pos=i + 1, n=n, acc=acc or n)
                k += 1
        g = h
    # renumera as frases
    ph, last = -1, None
    for m in moras:
        if m['ph'] != last: ph += 1; last = m['ph']
        m['ph'] = ph


def analyze(mine, norm, heur):
    """mine: [(superfície, leitura, anotação)] já separado da pontuação.
    Devolve (moras, log). Cada mora: dict(kana, ph=frase de acento, pos, n, acc, bg=grupo de fôlego).
    acc = mora depois da qual a voz cai; acc == n quer dizer "sem queda dentro da frase"."""
    log = []
    parts = [m[0] for m in mine]
    said = [heur(m[2]) for m in mine]          # como cada parte é pronunciada, segundo a anotação
    cuts, nodes, groups, bad = set(), None, None, []
    for attempt in range(4):
        text = ''.join(parts)
        nodes = _frontend(parts, cuts)
        if sum(len(x['string']) for x in nodes) != len(text):
            log.append(f'  acento: tamanho diferente em "{text}"'); return None, log
        groups = _align(parts, nodes)
        bad, more = [], set()
        for I, J in groups:
            if mine[I[0]][0][0] in PUNCT: continue
            mr = ''.join(said[x] for x in I)
            theirs = ''.join(nodes[x]['pron'] for x in J).replace('’', '')
            if norm(mr, True) != norm(theirs, True): bad.append((I, J, mr, theirs))
            if len(I) > 1 and len(J) > 1: more.update(I[1:])     # o analisador juntou pedaços de palavras vizinhas
        if more - cuts: cuts |= more; continue
        if not bad or attempt == 3: break
        for I, J, mr, theirs in bad:
            if len(I) > 1: cuts.update(I[1:])
            for x in I:
                k = _kana_of(mine[x][2]) if parts[x] == mine[x][0] else said[x]
                parts[x] = k if len(k) else parts[x]
    # o que ainda não bate: troca o nó pelo que está anotado
    drop = set()
    for I, J, mr, theirs in bad:
        surf = ''.join(mine[x][0] for x in I)
        h = jaconv.hira2kata(mr)
        log.append(f'  acento: {surf} leitura do analisador={theirs}; usa {h} sem queda')
        n0 = nodes[J[0]]
        n0['pron'] = n0['read'] = h; n0['mora_size'] = len(kata_moras(h)); n0['acc'] = 0
        drop.update(J[1:])
    _fix_nodes(nodes)
    nodes = [x for k, x in enumerate(nodes) if k not in drop]
    labels = pyopenjtalk.make_label(nodes)
    kana = []
    for x in nodes:
        if x['pron'] and x['pron'][0] not in '、。？！?!': kana.extend(kata_moras(x['pron']))
    moras, ph, bg, prev_pos = [], -1, 0, None
    for lab in labels:
        p = re.search(r'\-(.+?)\+', lab).group(1)
        if p in ('sil', 'pau'):
            if p == 'pau': bg += 1; prev_pos = None
            continue
        if not (p in 'aiueoAIUEO' or p in ('N', 'cl')): continue
        a = re.search(r'/A:(-?\d+)\+(\d+)\+(\d+)', lab); f = re.search(r'/F:(\d+)_(\d+)', lab)
        pos, n, acc = int(a.group(2)), int(f.group(1)), int(f.group(2))
        if prev_pos is None or pos <= prev_pos: ph += 1
        prev_pos = pos
        moras.append(dict(ph=ph, pos=pos, n=n, acc=acc, bg=bg, unvoiced=p in 'AIUEO' or p == 'cl'))
    if len(kana) != len(moras):
        for m in moras: m['kana'] = '?'
        log.append('  acento: contagem de moras diferente; correções manuais não aplicadas')
        return moras, log
    for m, k in zip(moras, kana): m['kana'] = k
    c = 0
    for x in nodes:
        if x['pron'] and x['pron'][0] not in '、。？！?!': c += len(kata_moras(x['pron']))
        elif c and x['string'] and x['string'][-1] in PUNCT: moras[c - 1]['end'] = x['string'][-1]
    if not drop: _apply_overrides(mine, groups, nodes, moras, log)
    return moras, log


def show(moras):
    """'キョ＼ーワ ヤスミ＼デス' — ＼ marca a queda; frase sem ＼ não tem queda."""
    out, cur = [], None
    for m in moras:
        if m['ph'] != cur:
            if cur is not None: out.append(' ')
            cur = m['ph']
        out.append(m.get('kana', '?'))
        if m['pos'] == m['acc'] and m['pos'] < m['n']: out.append('＼')
        if m.get('end'): out.append(m['end'])
    return ''.join(out)


def tails(moras):
    """Movimento da voz dentro da última mora de cada trecho, em semitons: {índice da mora: quanto}.
    Pergunta sobe (com か sobe menos; no meio da fala, menos ainda); fim de frase desce um pouco."""
    t = {}
    for k, m in enumerate(moras):
        e, last, ka = m.get('end'), k == len(moras) - 1, m.get('kana') == 'カ'
        if e in ('？', '?'): t[k] = 4.5 if ka else 6.0
        elif e == '。' and ka: t[k] = 4.5 if last else 2.5
        elif e in ('。', '！', '!') or last: t[k] = -1.5
    return t


# Níveis em semitons em relação ao topo da voz.
RISE = 2.6        # a 1ª mora da frase começa mais baixa
FALL = 5.0        # queda depois da mora acentuada
def levels(moras, question=False):
    lv = np.zeros(len(moras))
    reg, bg, k = 0.0, None, 0
    while k < len(moras):
        ph = moras[k]['ph']; j = k
        while j < len(moras) and moras[j]['ph'] == ph: j += 1
        m0 = moras[k]; n = j - k
        acc = m0['acc'] if 0 < m0['acc'] < n else 0          # acc == n: sem queda dentro da frase
        first = m0['bg'] != bg
        if first and bg is not None: reg = max(reg * 0.4, -1.5) - 0.6   # depois da pausa a voz recomeça quase do alto
        bg = m0['bg']
        heavy = n > 1 and moras[k + 1].get('kana', '') in ('ー', 'ン')
        rise = RISE * (1.0 if first else 0.6) * (0.5 if heavy else 1.0)
        for i in range(n):
            pos = i + 1
            if acc == 0: v = (-rise if pos == 1 and n > 1 else 0) - 0.2 * i
            elif acc == 1: v = 0.6 if pos == 1 else -FALL - 0.45 * (pos - 2)
            elif pos <= acc: v = (-rise if pos == 1 else 0.3 if pos == acc else 0) - 0.1 * i
            else: v = -FALL - 0.45 * (pos - acc - 1)
            lv[k + i] = max(reg + max(v, -8.5), -10.5)
        # frase com queda rebaixa as seguintes (downstep); sem queda, só um pouco
        reg = max(reg - (1.6 if acc else 0.5), -4.5)
        k = j
    return lv


def contour(f0, dur, spans, lv, top_hz, tail=None, beta=0.4):
    """f0: curva prevista pelo modelo (Hz, por quadro); dur: quadros por símbolo (com os 2 de borda);
    spans: moras -> índices de símbolo; lv: nível por mora; tail: ver tails().
    Devolve a curva corrigida."""
    f0 = f0.astype(np.float64).copy(); T = len(f0)
    ends = np.cumsum(dur) * 2; starts = ends - np.asarray(dur) * 2
    voiced = f0 > 0.3 * top_hz      # abaixo disso são só as rampas de início/fim de voz
    lf = np.log(np.maximum(f0, 1.0))
    tgt = np.full(T, np.nan); pm = np.full(T, np.nan)
    means = []
    for sp in spans:
        a, b = int(starts[sp[0] + 1]), int(ends[sp[-1] + 1])
        v = voiced[a:b]
        means.append(lf[a:b][v].mean() if v.sum() >= 2 else np.nan)
    means = np.array(means); ok = ~np.isnan(means)
    if ok.sum() == 0: return f0.astype(np.float32)
    means = np.interp(np.arange(len(means)), np.where(ok)[0], means[ok])
    base = np.log(top_hz)
    for k, sp in enumerate(spans):
        a, b = int(starts[sp[0] + 1]), int(ends[sp[-1] + 1])
        tgt[a:b] = base + lv[k] * np.log(2) / 12
        pm[a:b] = means[k]
    # fim de frase: desce (afirmação) ou sobe (pergunta) dentro da última mora
    for k, amount in (tail if tail is not None else {len(spans) - 1: -1.5}).items():
        a, b = int(starts[spans[k][0] + 1]), int(ends[spans[k][-1] + 1])
        vi = np.where(voiced[a:b])[0]          # a duração da última mora inclui silêncio: usa só o trecho com voz
        if len(vi) >= 3:
            v0, v1 = a + vi[0], a + vi[-1] + 1
            ramp = np.linspace(0, 1, v1 - v0)
            tgt[v0:v1] += amount * (ramp ** 1.5 if amount > 0 else ramp) * np.log(2) / 12
            tgt[v1:b] += amount * np.log(2) / 12
    idx = np.where(~np.isnan(tgt))[0]
    tgt = np.interp(np.arange(T), idx, tgt[idx]); pm = np.interp(np.arange(T), idx, pm[idx])
    w = np.hanning(9); w /= w.sum()
    pad = lambda x: np.convolve(np.pad(x, 4, mode='edge'), w, mode='valid')
    tgt_s, pm_s = pad(tgt), pad(pm)
    new = np.exp(tgt_s + beta * (lf - pm_s))
    out = np.where(voiced, new, f0)
    return out.astype(np.float32)
