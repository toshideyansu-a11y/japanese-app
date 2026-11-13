# 日本語 todo dia

ポルトガル語話者のための日本語学習アプリ(iPhone向けWebアプリ)。生活場面ごとの短いレッスンをクイズ形式で進めます。

- 13単元(あいさつ、買い物、病院、学校…)、漢字103字、日常語163語、会話13本
- すべて問題形式: 選択、ペア合わせ、文の組み立て、穴埋め、かな並べ、聞き取り、漢字の書き取り(書き順判定つき)
- 日本語の音声を572本収録(オフラインでも再生)
- 間隔反復(FSRS)で、忘れかける頃に復習を出題
- 画面はポルトガル語。進み具合はiPhone内に保存

## 使い方
SafariでGitHub PagesのURLを開き、共有ボタン →「ホーム画面に追加」。

## ファイル
- `js/data/` 教材(内容を直すときはここ)
  - `kanji.js` 漢字 / `words.js` 言葉と例文 / `units.js` 単元の並びと文法メモ / `stories.js` 会話
  - `strokes.js` 書き順 / `audio-index.js` 音声の対応表(自動生成)
- `js/core.js` 進み具合の保存、復習の計算、XP
- `js/sound.js` 音声と効果音
- `js/exercises.js` 問題の種類 / `js/session.js` レッスンの進行 / `js/screens.js` 各画面
- `audio/` 音声ファイル
- `tools/` 教材の検査と音声の生成(`export.js` → `gen_audio.py`)
- `sw.js` オフライン用

## 教材を直したとき
文や言葉を変えたら音声も作り直します。

```
node tools/export.js > manifest.json      # 検査と、読み上げる文の一覧
python tools/gen_audio.py manifest.json out   # 音声を生成(Kokoro のモデルと声のファイルが必要)
```

`out/*.mp3` を `audio/` に、`out/index.json` の中身を `js/data/audio-index.js` に入れます。

## クレジット
- 漢字の書き順データ: [KanjiVG](https://kanjivg.tagaini.net) (c) Ulrich Apel, CC BY-SA 3.0
- 漢字の表示書体: [Klee One](https://github.com/fontworks-fonts/Klee) (SIL OFL 1.1、使う文字だけを抜き出して収録)
- 音声: [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (Apache 2.0) で合成
- 復習の計算: [FSRS](https://github.com/open-spaced-repetition/fsrs4anki)
