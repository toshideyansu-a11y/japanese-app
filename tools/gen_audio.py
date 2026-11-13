"""Gera os áudios (voz japonesa) do app com o modelo Kokoro-82M.

Uso: python gen_audio.py manifest.json SAIDA_DIR [--dry]
Precisa de: kokoro-probe.onnx e kokoro-f0.onnx (feitos por make_f0_models.py), vozes (.bin) e
vocab (config.json) na pasta do manifest — ver README.
A leitura de cada frase vem das anotações do próprio app (furigana), então os
kanji nunca são lidos errado: o analisador só é usado quando concorda com a leitura anotada.
A melodia (acento tonal) vem do dicionário de acentos — ver accent.py.
"""
import json, sys, re, hashlib, os, subprocess, unicodedata
import numpy as np
import jaconv
from misaki import ja
from misaki.ja import Word
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import accent

g2p = ja.JAG2P()
PUNCT = '。、！？!?,.…'
VOW = {}
for row, v in [('あかさたなはまやらわがざだばぱぁゃ', 'a'), ('いきしちにひみりぎじぢびぴぃ', 'i'), ('うくすつぬふむゆるぐずづぶぷぅゅゔ', 'u'), ('えけせてねへめれげぜでべぺぇ', 'e'), ('おこそとのほもよろをごぞどぼぽぉょ', 'o')]:
    for ch in row: VOW[ch] = v
VK = {'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お'}

def norm(kana, strict=False):
    """Forma canônica para comparar leituras (ignora diferenças de vogal longa e, se não for
    strict, a diferença は/わ, へ/え das partículas)."""
    kana = jaconv.kata2hira(unicodedata.normalize('NFKC', kana))
    kana = re.sub(r'[\s。、！？!?,.…・「」〜~]', '', kana)
    out = []
    for ch in kana:
        prev = VOW.get(out[-1]) if out else None
        if ch == 'ー' and prev: ch = VK[prev]
        elif ch == 'う' and prev == 'o': ch = 'お'
        elif ch == 'い' and prev == 'e': ch = 'え'
        out.append(ch)
    r = ''.join(out).replace('を', 'お').replace('ぢ', 'じ').replace('づ', 'ず')
    return r if strict else r.replace('は', 'わ').replace('へ', 'え')

EI_OK = ('きれい', 'せんせい', 'ていねい', 'とけい', 'えいが', 'がくせい')
AA_OK = ('おかあさん', 'おばあさん', 'まあまあ')
WA_END = ('こんにちは', 'こんばんは', 'では', 'には', 'とは', 'のは', 'からは', 'までは')
OVERRIDE = {'言う': 'ゆー'}
SEG = re.compile(r'([\u4e00-\u9fff々ヶ]+)\{([^}]+)\}|([^\u4e00-\u9fff々ヶ{}]+)')

def heur(annot):
    """Leitura anotada -> pronúncia com vogais longas (ー), sem depender do analisador.
    Dentro da leitura de um kanji: おう, えい e vogais repetidas viram longas.
    Fora (okurigana e palavras em kana): só os casos seguros."""
    surface = re.sub(r'\{[^}]*\}', '', annot)
    if surface in OVERRIDE: return OVERRIDE[surface]
    if surface == 'は': return 'わ'
    if surface == 'へ': return 'え'
    whole = jaconv.kata2hira(SEG.sub(lambda m: m.group(2) or m.group(3), annot))
    out = []
    for m in SEG.finditer(annot):
        inside = m.group(2) is not None
        seg = jaconv.kata2hira(m.group(2) if inside else m.group(3))
        for i, ch in enumerate(seg):
            prev = VOW.get(out[-1]) if out and out[-1] != 'ー' else None
            v = VOW.get(ch) if ch in 'あいうえお' else None
            long = False
            if prev and v and i > 0:
                if v == prev:
                    long = inside or v in 'ieo' or (v == 'u') or any(w in whole for w in AA_OK)
                elif ch == 'う' and prev == 'o':
                    long = True
                elif ch == 'い' and prev == 'e':
                    long = inside or any(w in whole for w in EI_OK)
            out.append('ー' if long else ch)
    r = ''.join(out)
    if surface.endswith(WA_END) and r.endswith('は'): r = r[:-1] + 'わ'
    return r

def split_punct(tokens):
    out = []
    for t in tokens:
        s, r = unicodedata.normalize('NFKC', t['s']), unicodedata.normalize('NFKC', t['r'])
        while s and s[0] in PUNCT: out.append((s[0], s[0], s[0])); s, r = s[1:], r[1:]
        tail = []
        while s and s[-1] in PUNCT: tail.insert(0, (s[-1], s[-1], s[-1])); s, r = s[:-1], r[:-1]
        # pontuação no meio (ex.: "お母さん、")
        m = re.split('([' + re.escape(PUNCT) + '])', s)
        if len(m) > 1:
            raise SystemExit('pontuação no meio do token: ' + t['s'])
        if s: out.append((s, r, t.get('a', s) if not tail and t['s'] == s else re.sub('[' + re.escape(PUNCT) + ']', '', t.get('a', s))))
        out.extend(tail)
    return out

def phonemize(tokens, log):
    mine = split_punct(tokens)
    raw = ''.join(m[0] for m in mine)
    tw = [w for w in g2p.tagger(raw)]
    assert ''.join(w.surface for w in tw) == raw, (raw, [w.surface for w in tw])
    words, i, j = [], 0, 0
    while i < len(mine):
        I, J, pa, pb = [i], [], len(mine[i][0]), 0
        while pa != pb:
            if pb < pa: J.append(j); pb += len(tw[j].surface); j += 1
            else: i += 1; I.append(i); pa += len(mine[i][0])
        i += 1
        surf = ''.join(mine[x][0] for x in I)
        mr = ''.join(mine[x][1] for x in I)
        if surf[0] in PUNCT:
            for x in J: words.append(Word(tw[x].surface, tw[x].surface, 3))
            continue
        theirs = ''.join((tw[x].feature.pron or tw[x].feature.kana or tw[x].surface) for x in J)
        said = ''.join(heur(mine[x][2]) for x in I)
        if norm(said, True) == norm(theirs, True):
            for x in J:
                w = tw[x]
                words.append(Word(w.surface, jaconv.kata2hira(w.feature.pron or w.feature.kana or w.surface), 6 if w.char_type == 7 or not w.is_unk else w.char_type))
        else:
            h = ''.join(heur(mine[x][2]) for x in I)
            log.append(f'  {surf}: anotado={mr} analisador={jaconv.kata2hira(theirs)} -> usa {h}')
            for x in I: words.append(Word(mine[x][0], heur(mine[x][2]), 6))
    toks = g2p._romaji_tokens(words)
    out = ''.join(str(t) for t in toks)
    ps = re.sub(r'\s+', ' ', out.strip())
    ps = re.sub(r'(?<![!",.:;?»—…”]) (?=ʔ)|(?<=ʔ) (?!["«“])', '', ps)
    if ps and ps[-1] not in '.!?': ps += '.'
    return ps

VOICE = {'a': 'jf_alpha', 'k': 'jm_kumo', 't': 'jf_gongitsune', 'y': 'jf_tebukuro'}
SPEED = {'a': 0.9, 'k': 0.92, 't': 0.9, 'y': 0.92}
# Altura (Hz) do "alto" de cada voz: escolhida para a melodia nova ficar no registro natural da voz.
TOP = {'a': 318, 'k': 113, 't': 294, 'y': 415}
VERSION = 'acento-1'

def melody(it, log):
    """Acento de um texto: (moras, notação legível) ou (None, '') se a análise falhar."""
    n = len(log)
    moras, alog = accent.analyze(split_punct(it['tokens']), norm, heur)
    log.extend(alog)
    if len(log) > n: log.insert(n, it['key'])
    return moras, (accent.show(moras) if moras else '')

def main():
    manifest = json.load(open(sys.argv[1], encoding='utf8'))
    outdir = sys.argv[2]
    dry = '--dry' in sys.argv
    log, alog, jobs = [], [], []
    for it in manifest:
        n = len(log)
        ps = phonemize(it['tokens'], log)
        if len(log) > n: log.insert(n, it['key'])
        moras, shown = melody(it, alog)
        if moras is not None and len(moras) != len(accent.mora_spans(ps)):
            alog.append(f'{it["key"]}\n  acento: {len(moras)} moras no analisador, {len(accent.mora_spans(ps))} na fala; fica a melodia do modelo')
            moras, shown = None, ''
        jobs.append((it, ps, moras, shown))
    print(f'{len(jobs)} textos; {sum(1 for l in log if not l.startswith("  "))} com leitura corrigida pela anotação; {sum(1 for j in jobs if j[2] is None)} sem acento do dicionário')
    print('\n'.join(log + alog))
    if dry:
        for it, ps, moras, shown in jobs: print(it['key'], '=>', ps, '|', shown)
        return
    import onnxruntime as ort, soundfile as sf
    here = os.path.dirname(os.path.abspath(sys.argv[1]))
    vocab = json.load(open(os.path.join(here, 'kwheel/kokoro_onnx/config.json')))['vocab']
    so = ort.SessionOptions(); so.intra_op_num_threads = 4
    probe = ort.InferenceSession(os.path.join(here, 'kokoro-probe.onnx'), so, providers=['CPUExecutionProvider'])
    forced = ort.InferenceSession(os.path.join(here, 'kokoro-f0.onnx'), so, providers=['CPUExecutionProvider'])
    voices = {k: np.fromfile(os.path.join(here, f'x/kokoro-js-1.2.1/package/voices/{v}.bin'), dtype=np.float32).reshape(-1, 1, 256) for k, v in VOICE.items()}
    os.makedirs(outdir, exist_ok=True)
    index, stats = {}, []
    for n, (it, ps, moras, shown) in enumerate(jobs):
        h = hashlib.md5('\n'.join([it['key'], ps, shown, VERSION]).encode('utf8')).hexdigest()[:10]
        index[it['key']] = h
        mp3 = os.path.join(outdir, h + '.mp3')
        if os.path.exists(mp3): continue
        ids = [vocab[c] for c in ps if c in vocab]
        bad = [c for c in ps if c not in vocab]
        if bad: print('símbolo fora do vocabulário', it['key'], bad)
        v = it['voice']
        feed = {'input_ids': np.array([[0, *ids, 0]], dtype=np.int64), 'style': voices[v][len(ids)], 'speed': np.array([SPEED[v]], dtype=np.float32)}
        a, f0, dur, _ = probe.run(None, feed)
        if moras is not None:
            # 2ª passada: a mesma fala, com a melodia do dicionário de acentos
            f0n = accent.contour(f0[0], dur[0].astype(int), accent.mora_spans(ps), accent.levels(moras), TOP[v], accent.tails(moras))
            a = forced.run(None, {**feed, 'f0_in': f0n[None]})[0]
        a = a.squeeze()
        # corta o silêncio das pontas, normaliza o volume e suaviza início/fim
        env = np.abs(a); thr = max(env.max() * 0.02, 1e-4); idx = np.where(env > thr)[0]
        a = a[max(0, idx[0] - 1200): min(len(a), idx[-1] + 3600)]
        a = a / max(np.abs(a).max(), 1e-6) * 0.89
        f = 240; a[:f] *= np.linspace(0, 1, f); a[-f:] *= np.linspace(1, 0, f)
        wav = os.path.join(outdir, h + '.wav'); sf.write(wav, a, 24000)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-ac', '1', '-ar', '24000', '-b:a', '48k', mp3], check=True)
        os.remove(wav)
        stats.append((it['key'], len(a) / 24000, len(ids)))
        if n % 50 == 0: print(n, '/', len(jobs), flush=True)
    json.dump(index, open(os.path.join(outdir, 'index.json'), 'w', encoding='utf8'), ensure_ascii=False)
    json.dump(stats, open(os.path.join(outdir, 'stats.json'), 'w', encoding='utf8'), ensure_ascii=False)
    json.dump({it['key']: shown for it, ps, moras, shown in jobs}, open(os.path.join(outdir, 'accent.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=0)
    print('feito', len(index))

if __name__ == '__main__':
    main()
