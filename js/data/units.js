// Trilha de estudo: unidades por situação do dia a dia.
// lessons: { k: "kanji da lição" } e/ou { w: ["palavras"] }
// tips: pequenas explicações de gramática (Guia da unidade)
const UNITS = [
  { id: "u1", pt: "Cumprimentos", jp: "あいさつ", emoji: "👋", color: "red", story: "s1",
    lessons: [
      { w: ["おはようございます", "こんにちは", "こんばんは", "おやすみなさい", "また明日"] },
      { k: "人名前何" },
      { w: ["ありがとうございます", "すみません", "ごめんなさい", "お願いします", "大丈夫"] },
      { k: "日本語国" },
      { w: ["はじめまして", "私", "名前", "ブラジル人", "よろしくお願いします", "日本語"] },
    ],
    tips: [
      ["A は B です", "「A é B». A partícula は marca o assunto e se lê “wa”. Ex.: 私{わたし}は アナ です。"],
      ["〜ですか", "Colocar か no fim transforma a frase em pergunta. Ex.: お元気{げんき}ですか。"],
      ["すみません", "Serve para pedir licença, chamar alguém e também pedir desculpas leves. É a palavra mais útil do Japão!"],
    ] },
  { id: "u2", pt: "Números e dinheiro", jp: "数字とお金", emoji: "💴", color: "orange", story: "s2",
    lessons: [
      { k: "一二三四五" },
      { k: "六七八九十" },
      { w: ["いくら", "お金", "高い", "安い", "レジ"] },
      { k: "百千万円" },
      { w: ["袋", "カード", "現金", "おつり", "レシート", "全部で"] },
    ],
    tips: [
      ["Números grandes", "O japonês conta de 10.000 em 10.000: 一万{いちまん} = 10.000, 十万{じゅうまん} = 100.000."],
      ["Sons que mudam", "三百{さんびゃく}, 六百{ろっぴゃく}, 八百{はっぴゃく}, 三千{さんぜん}, 八千{はっせん}: o som muda para ficar mais fácil de falar."],
      ["〜で お願{ねが}いします", "Use で para dizer o meio: カードで (com cartão), 現金{げんきん}で (em dinheiro)."],
    ] },
  { id: "u3", pt: "Calendário", jp: "カレンダー", emoji: "📅", color: "green", story: "s3",
    lessons: [
      { k: "月火水木" },
      { w: ["今日", "明日", "昨日", "毎日", "休み"] },
      { k: "金土曜週" },
      { k: "今年毎" },
      { w: ["今週", "来週", "何曜日", "いつ", "誕生日", "週末"] },
    ],
    tips: [
      ["Dias da semana", "Cada dia tem um elemento: 月{げつ} lua, 火{か} fogo, 水{すい} água, 木{もく} árvore, 金{きん} ouro, 土{ど} terra, 日{にち} sol + 曜日{ようび}."],
      ["〜に", "A partícula に marca o momento: 月曜日{げつようび}に 行{い}きます (vou na segunda). Com 今日{きょう}, 明日{あした}, 毎日{まいにち} não se usa に."],
    ] },
  { id: "u4", pt: "Horas e rotina", jp: "時間", emoji: "⏰", color: "teal", story: "s4",
    lessons: [
      { k: "時分半" },
      { w: ["今", "何時", "朝", "昼", "夜"] },
      { k: "午後間" },
      { w: ["起きる", "寝る", "仕事", "帰る", "時間", "晩ご飯"] },
    ],
    tips: [
      ["Horas", "Número + 時{じ}: 一時{いちじ}, 二時{にじ}… Atenção: 四時{よじ}, 七時{しちじ}, 九時{くじ}."],
      ["〜ます", "Forma educada do verbo: 起{お}きる → 起{お}きます, 寝{ね}る → 寝{ね}ます, 帰{かえ}る → 帰{かえ}ります."],
      ["〜から 〜まで", "“De… até…”: 九時{くじ}から 五時{ごじ}まで (das 9 às 5)."],
    ] },
  { id: "u5", pt: "Família", jp: "家族", emoji: "👨‍👩‍👧", color: "blue", story: "s5",
    lessons: [
      { k: "父母子" },
      { w: ["家族", "夫", "妻", "子ども", "両親"] },
      { k: "女男友" },
      { w: ["お父さん", "お母さん", "兄弟", "友だち", "元気", "会いたい"] },
    ],
    tips: [
      ["Minha família × a sua", "Da própria família: 父{ちち}, 母{はは}, 夫{おっと}. Da família dos outros (ou chamando): お父{とう}さん, お母{かあ}さん, ご主人{しゅじん}."],
      ["います × あります", "います para pessoas e animais, あります para coisas: 兄弟{きょうだい}が います / 時間{じかん}が あります."],
    ] },
  { id: "u6", pt: "Escola e trabalho", jp: "学校と仕事", emoji: "🏫", color: "purple", story: "s6",
    lessons: [
      { k: "先生学校" },
      { w: ["学校", "先生", "勉強", "宿題", "お知らせ"] },
      { k: "会社休" },
      { w: ["会社", "忙しい", "休む", "遅れる", "連絡", "手伝う"] },
    ],
    tips: [
      ["〜ので", "Explica o motivo de forma educada: 熱{ねつ}が あるので、休{やす}みます (como estou com febre, vou faltar)."],
      ["〜て ください", "Pedido educado: 手伝{てつだ}って ください (me ajude, por favor)."],
    ] },
  { id: "u7", pt: "Comida", jp: "食べ物", emoji: "🍚", color: "pink", story: "s7",
    lessons: [
      { k: "食飲買店" },
      { w: ["ご飯", "水", "お茶", "パン", "おいしい"] },
      { w: ["肉", "魚", "野菜", "果物", "卵", "牛乳"] },
      { w: ["お腹がすいた", "のどがかわいた", "いただきます", "ごちそうさまでした", "甘い", "辛い"] },
    ],
    tips: [
      ["〜を", "A partícula を marca o que sofre a ação: 水{みず}を 飲{の}みます (bebo água)."],
      ["〜たい", "“Quero…”: 食{た}べます → 食{た}べたい (quero comer), 飲{の}みます → 飲{の}みたい."],
      ["Contando coisas", "一{ひと}つ, 二{ふた}つ, 三{みっ}つ… servem para quase tudo: 卵{たまご}を 二{ふた}つ ください."],
    ] },
  { id: "u8", pt: "Compras", jp: "買い物", emoji: "🛒", color: "red", story: "s8",
    lessons: [
      { k: "高安大小" },
      { w: ["スーパー", "買い物", "これ", "ください", "ほしい"] },
      { k: "新古長白" },
      { w: ["半額", "割引", "賞味期限", "税込", "売り切れ", "ポイントカード"] },
      { k: "多少", w: ["たくさん", "少し", "もっと"] },
    ],
    tips: [
      ["これ・それ・あれ", "これ = isto (perto de mim), それ = isso (perto de você), あれ = aquilo (longe dos dois)."],
      ["Etiquetas do mercado", "半額{はんがく} = metade do preço, 2割引{わりびき} = 20% de desconto, 税込{ぜいこみ} = imposto incluído."],
      ["Adjetivos em い", "Vêm antes do nome sem mudar: 新{あたら}しい くつ (sapatos novos), 安{やす}い 店{みせ} (loja barata)."],
    ] },
  { id: "u9", pt: "Transporte", jp: "交通", emoji: "🚃", color: "orange", story: "s9",
    lessons: [
      { k: "駅電車道" },
      { w: ["駅", "電車", "バス", "切符", "乗る", "降りる"] },
      { k: "行来入出" },
      { w: ["どこ", "ここ", "まっすぐ", "曲がる", "近い", "遠い"] },
    ],
    tips: [
      ["〜に / 〜へ 行{い}きます", "Destino com に ou へ (lê-se “e”): 会社{かいしゃ}に 行{い}きます."],
      ["〜で", "Meio de transporte ou lugar da ação: 電車{でんしゃ}で 行{い}きます / 駅{えき}で 買{か}います."],
      ["〜に 乗{の}る / 〜を 降{お}りる", "バスに 乗{の}ります (pego o ônibus), バスを 降{お}ります (desço do ônibus)."],
    ] },
  { id: "u10", pt: "Lugares e direções", jp: "場所と方向", emoji: "🧭", color: "green", story: "s10",
    lessons: [
      { k: "上下中外" },
      { k: "左右", w: ["となり", "後ろ", "あそこ"] },
      { w: ["郵便局", "銀行", "市役所", "コンビニ", "公園", "交番"] },
      { k: "東西南北" },
    ],
    tips: [
      ["A の B", "の liga dois nomes: スーパーの となり (ao lado do supermercado), 机{つくえ}の 上{うえ} (em cima da mesa)."],
      ["ここ・そこ・あそこ", "ここ = aqui, そこ = aí, あそこ = ali/lá."],
    ] },
  { id: "u11", pt: "Corpo e saúde", jp: "体と病院", emoji: "🏥", color: "teal", story: "s11",
    lessons: [
      { k: "口目耳" },
      { w: ["病院", "薬", "痛い", "熱", "風邪", "頭"] },
      { k: "手足立" },
      { w: ["お腹", "歯", "保険証", "予約", "受付", "お大事に"] },
    ],
    tips: [
      ["〜が 痛{いた}い です", "Parte do corpo + が 痛{いた}い です: 頭{あたま}が 痛{いた}いです (estou com dor de cabeça)."],
      ["〜から", "“Desde”: 昨日{きのう}から (desde ontem), 朝{あさ}から (desde de manhã)."],
    ] },
  { id: "u12", pt: "Tempo e natureza", jp: "天気と自然", emoji: "🌦️", color: "blue", story: "s12",
    lessons: [
      { k: "天気雨明" },
      { w: ["天気", "暑い", "寒い", "晴れ", "傘", "台風"] },
      { k: "山川田" },
      { w: ["地震", "危ない", "気をつけて", "夏", "冬"] },
    ],
    tips: [
      ["〜ですね", "ね no fim busca concordância, como “né?”: 暑{あつ}いですね (está quente, né?)."],
      ["Emergências", "地震{じしん} (terremoto) e 台風{たいふう} (tufão) aparecem nos avisos do celular. 避難{ひなん} = evacuação."],
    ] },
  { id: "u13", pt: "Verbos do dia a dia", jp: "毎日の動詞", emoji: "🏃", color: "purple", story: "s13",
    lessons: [
      { k: "見聞読" },
      { w: ["分かります", "分かりません", "もう一度", "ゆっくり", "教える"] },
      { k: "書話言" },
      { w: ["使う", "作る", "洗う", "掃除", "洗濯", "料理"] },
      { w: ["ゴミ", "燃えるゴミ", "近所", "好き", "疲れた", "ちょっと待って"] },
    ],
    tips: [
      ["Quando não entender", "もう一度{いちど} 言{い}って ください (repita, por favor) e ゆっくり 話{はな}して ください (fale devagar) salvam qualquer conversa."],
      ["〜が 好{す}き です", "“Gosto de…”: 料理{りょうり}が 好{す}きです. Para “não gosto muito”: あまり 好{す}きじゃ ありません."],
    ] },
];
