// Palavras e frases do dia a dia.
// j = japonês, r = leitura, pt = significado, e = emoji (imagem para a memória)
// s = frase de exemplo: partes separadas por "|", leitura dos kanji entre {chaves}
// st = tradução da frase
const WORDS = [
  // ── U1 Cumprimentos ──
  { j: "おはようございます", r: "おはようございます", pt: "Bom dia", e: "🌅", s: "おはようございます。|今日{きょう}|は|寒{さむ}い|ですね。", st: "Bom dia. Hoje está frio, né?" },
  { j: "こんにちは", r: "こんにちは", pt: "Olá / Boa tarde", e: "👋", s: "こんにちは。|お元気{げんき}|ですか。", st: "Olá. Como vai?" },
  { j: "こんばんは", r: "こんばんは", pt: "Boa noite (ao encontrar)", e: "🌆", s: "こんばんは。|今日{きょう}|は|暑{あつ}かった|ですね。", st: "Boa noite. Hoje fez calor, né?" },
  { j: "おやすみなさい", r: "おやすみなさい", pt: "Boa noite (ao dormir)", e: "😴", s: "もう|寝{ね}ます。|おやすみなさい。", st: "Já vou dormir. Boa noite." },
  { j: "また明日", r: "またあした", pt: "Até amanhã", e: "🙋", s: "じゃあ、|また|明日{あした}。", st: "Então, até amanhã." },

  { j: "ありがとうございます", r: "ありがとうございます", pt: "Muito obrigado(a)", e: "🙏", s: "手伝{てつだ}って|くれて、|ありがとうございます。", st: "Obrigada por me ajudar." },
  { j: "すみません", r: "すみません", pt: "Com licença / Desculpe", e: "🙇", s: "すみません、|トイレ|は|どこ|ですか。", st: "Com licença, onde fica o banheiro?" },
  { j: "ごめんなさい", r: "ごめんなさい", pt: "Desculpe (pedido de desculpas)", e: "😣", s: "遅{おく}れて|ごめんなさい。", st: "Desculpe o atraso." },
  { j: "お願いします", r: "おねがいします", pt: "Por favor (pedido)", e: "🤲", s: "これ|を|お願{ねが}いします。", st: "Isto, por favor." },
  { j: "大丈夫", r: "だいじょうぶ", pt: "Tudo bem / Não precisa", e: "👌", s: "私{わたし}|は|大丈夫{だいじょうぶ}|です。", st: "Eu estou bem." },

  { j: "はじめまして", r: "はじめまして", pt: "Prazer em conhecer", e: "🤝", s: "はじめまして。|アナ|です。", st: "Prazer. Sou a Ana." },
  { j: "私", r: "わたし", pt: "eu", e: "🙋‍♀️", s: "私{わたし}|は|ブラジル人{じん}|です。", st: "Eu sou brasileira." },
  { j: "名前", r: "なまえ", pt: "nome", e: "📛", s: "お名前{なまえ}|は|何{なん}|ですか。", st: "Qual é o seu nome?" },
  { j: "ブラジル人", r: "ブラジルじん", pt: "brasileiro(a)", e: "🇧🇷", s: "夫{おっと}|は|日本人{にほんじん}|で、|私{わたし}|は|ブラジル人{じん}|です。", st: "Meu marido é japonês e eu sou brasileira." },
  { j: "よろしくお願いします", r: "よろしくおねがいします", pt: "Conto com você / Prazer", e: "😊", s: "これから|よろしく|お願{ねが}いします。", st: "Conto com você daqui em diante." },
  { j: "日本語", r: "にほんご", pt: "língua japonesa", e: "🗾", s: "日本語{にほんご}|を|勉強{べんきょう}して|います。", st: "Estou estudando japonês." },

  // ── U2 Números e dinheiro ──
  { j: "いくら", r: "いくら", pt: "quanto custa?", e: "🏷️", s: "これ|は|いくら|ですか。", st: "Quanto custa isto?" },
  { j: "お金", r: "おかね", pt: "dinheiro", e: "💰", s: "お金{かね}|が|足{た}りません。", st: "O dinheiro não é suficiente." },
  { j: "高い", r: "たかい", pt: "caro; alto", e: "💎", s: "この|服{ふく}|は|高{たか}い|です。", st: "Esta roupa é cara." },
  { j: "安い", r: "やすい", pt: "barato", e: "🪙", s: "この|店{みせ}|は|安{やす}い|です。", st: "Esta loja é barata." },
  { j: "レジ", r: "レジ", pt: "caixa (da loja)", e: "🧾", s: "レジ|は|あそこ|です。", st: "O caixa é ali." },

  { j: "袋", r: "ふくろ", pt: "sacola", e: "🛍️", s: "袋{ふくろ}|は|いりますか。", st: "Precisa de sacola?" },
  { j: "カード", r: "カード", pt: "cartão", e: "💳", s: "カード|で|払{はら}います。", st: "Vou pagar com cartão." },
  { j: "現金", r: "げんきん", pt: "dinheiro em espécie", e: "💴", s: "現金{げんきん}|で|お願{ねが}いします。", st: "Em dinheiro, por favor." },
  { j: "おつり", r: "おつり", pt: "troco", e: "🪙", s: "おつり|は|二百円{にひゃくえん}|です。", st: "O troco é 200 ienes." },
  { j: "レシート", r: "レシート", pt: "recibo (notinha)", e: "🧾", s: "レシート|は|いりません。", st: "Não preciso do recibo." },
  { j: "全部で", r: "ぜんぶで", pt: "no total", e: "🧮", s: "全部{ぜんぶ}で|千円{せんえん}|です。", st: "No total são mil ienes." },

  // ── U3 Calendário ──
  { j: "今日", r: "きょう", pt: "hoje", e: "📍", s: "今日{きょう}|は|休{やす}み|です。", st: "Hoje é folga." },
  { j: "明日", r: "あした", pt: "amanhã", e: "➡️", s: "明日{あした}|は|雨{あめ}|です。", st: "Amanhã vai chover." },
  { j: "昨日", r: "きのう", pt: "ontem", e: "⬅️", s: "昨日{きのう}、|友{とも}だち|に|会{あ}いました。", st: "Ontem encontrei uma amiga." },
  { j: "毎日", r: "まいにち", pt: "todos os dias", e: "🔁", s: "毎日{まいにち}|日本語{にほんご}|を|勉強{べんきょう}します。", st: "Estudo japonês todos os dias." },
  { j: "休み", r: "やすみ", pt: "folga; feriado; descanso", e: "🏖️", s: "明日{あした}|は|仕事{しごと}|が|休{やす}み|です。", st: "Amanhã estou de folga do trabalho." },

  { j: "今週", r: "こんしゅう", pt: "esta semana", e: "🗓️", s: "今週{こんしゅう}|は|忙{いそが}しい|です。", st: "Esta semana estou ocupada." },
  { j: "来週", r: "らいしゅう", pt: "semana que vem", e: "⏭️", s: "来週{らいしゅう}|の|月曜日{げつようび}|に|行{い}きます。", st: "Vou na segunda da semana que vem." },
  { j: "何曜日", r: "なんようび", pt: "que dia da semana?", e: "❓", s: "今日{きょう}|は|何曜日{なんようび}|ですか。", st: "Que dia da semana é hoje?" },
  { j: "いつ", r: "いつ", pt: "quando?", e: "🕰️", s: "誕生日{たんじょうび}|は|いつ|ですか。", st: "Quando é seu aniversário?" },
  { j: "誕生日", r: "たんじょうび", pt: "aniversário", e: "🎂", s: "今日{きょう}|は|母{はは}|の|誕生日{たんじょうび}|です。", st: "Hoje é aniversário da minha mãe." },
  { j: "週末", r: "しゅうまつ", pt: "fim de semana", e: "🎉", s: "週末{しゅうまつ}|は|何{なに}|を|しますか。", st: "O que você vai fazer no fim de semana?" },

  // ── U4 Horas e rotina ──
  { j: "今", r: "いま", pt: "agora", e: "⏱️", s: "今{いま}、|何{なに}|を|して|いますか。", st: "O que você está fazendo agora?" },
  { j: "何時", r: "なんじ", pt: "que horas?", e: "🕒", s: "今{いま}|何時{なんじ}|ですか。", st: "Que horas são agora?" },
  { j: "朝", r: "あさ", pt: "manhã", e: "🌄", s: "朝{あさ}|六時{ろくじ}|に|起{お}きます。", st: "Acordo às seis da manhã." },
  { j: "昼", r: "ひる", pt: "meio-dia; hora do almoço", e: "☀️", s: "昼{ひる}|は|会社{かいしゃ}|で|食{た}べます。", st: "No almoço, como na empresa." },
  { j: "夜", r: "よる", pt: "noite", e: "🌙", s: "夜{よる}|は|早{はや}く|寝{ね}ます。", st: "À noite durmo cedo." },

  { j: "起きる", r: "おきる", pt: "acordar; levantar", e: "⏰", s: "毎朝{まいあさ}|七時{しちじ}|に|起{お}きます。", st: "Acordo às sete toda manhã." },
  { j: "寝る", r: "ねる", pt: "dormir", e: "🛌", s: "十一時{じゅういちじ}|に|寝{ね}ます。", st: "Durmo às onze." },
  { j: "仕事", r: "しごと", pt: "trabalho", e: "💼", s: "仕事{しごと}|は|五時{ごじ}|に|終{お}わります。", st: "O trabalho termina às cinco." },
  { j: "帰る", r: "かえる", pt: "voltar (para casa)", e: "🏠", s: "今日{きょう}|は|何時{なんじ}|に|帰{かえ}りますか。", st: "Que horas você volta hoje?" },
  { j: "時間", r: "じかん", pt: "tempo; hora", e: "⌛", s: "今日{きょう}|は|時間{じかん}|が|ありません。", st: "Hoje não tenho tempo." },
  { j: "晩ご飯", r: "ばんごはん", pt: "jantar", e: "🍛", s: "晩{ばん}ご飯{はん}|は|何{なに}|が|いい|ですか。", st: "O que você quer para o jantar?" },

  // ── U5 Família ──
  { j: "家族", r: "かぞく", pt: "família", e: "👨‍👩‍👧", s: "家族{かぞく}|は|四人{よにん}|です。", st: "Minha família tem quatro pessoas." },
  { j: "夫", r: "おっと", pt: "(meu) marido", e: "🤵", s: "夫{おっと}|は|会社員{かいしゃいん}|です。", st: "Meu marido é funcionário de empresa." },
  { j: "妻", r: "つま", pt: "(minha) esposa", e: "👰", s: "妻{つま}|は|ブラジル人{じん}|です。", st: "Minha esposa é brasileira." },
  { j: "子ども", r: "こども", pt: "criança; filho(a)", e: "🧒", s: "子{こ}ども|は|学校{がっこう}|に|行{い}きました。", st: "As crianças foram para a escola." },
  { j: "両親", r: "りょうしん", pt: "pais (pai e mãe)", e: "👫", s: "両親{りょうしん}|は|ブラジル|に|います。", st: "Meus pais estão no Brasil." },

  { j: "お父さん", r: "おとうさん", pt: "pai", e: "👨", s: "お父{とう}さん|は|元気{げんき}|ですか。", st: "Seu pai está bem?" },
  { j: "お母さん", r: "おかあさん", pt: "mãe", e: "👩", s: "お母{かあ}さん|に|電話{でんわ}します。", st: "Vou ligar para minha mãe." },
  { j: "兄弟", r: "きょうだい", pt: "irmãos", e: "👧👦", s: "兄弟{きょうだい}|は|いますか。", st: "Você tem irmãos?" },
  { j: "友だち", r: "ともだち", pt: "amigo(a)", e: "🧑‍🤝‍🧑", s: "友{とも}だち|と|話{はな}します。", st: "Converso com uma amiga." },
  { j: "元気", r: "げんき", pt: "bem; com saúde e energia", e: "💪", s: "家族{かぞく}|は|みんな|元気{げんき}|です。", st: "Minha família está toda bem." },
  { j: "会いたい", r: "あいたい", pt: "quero ver (estou com saudade)", e: "🥹", s: "家族{かぞく}|に|会{あ}いたい|です。", st: "Estou com saudade da minha família." },

  // ── U6 Escola e trabalho ──
  { j: "学校", r: "がっこう", pt: "escola", e: "🏫", s: "学校{がっこう}|は|八時{はちじ}|に|始{はじ}まります。", st: "A escola começa às oito." },
  { j: "先生", r: "せんせい", pt: "professor(a)", e: "🧑‍🏫", s: "先生{せんせい}|に|聞{き}きます。", st: "Vou perguntar ao professor." },
  { j: "勉強", r: "べんきょう", pt: "estudo", e: "📚", s: "毎日{まいにち}|一時間{いちじかん}|勉強{べんきょう}します。", st: "Estudo uma hora por dia." },
  { j: "宿題", r: "しゅくだい", pt: "lição de casa", e: "📝", s: "宿題{しゅくだい}|は|終{お}わりましたか。", st: "Terminou a lição de casa?" },
  { j: "お知らせ", r: "おしらせ", pt: "aviso; comunicado", e: "📢", s: "学校{がっこう}|から|お知{し}らせ|が|来{き}ました。", st: "Chegou um comunicado da escola." },

  { j: "会社", r: "かいしゃ", pt: "empresa", e: "🏢", s: "会社{かいしゃ}|まで|電車{でんしゃ}|で|行{い}きます。", st: "Vou de trem até a empresa." },
  { j: "忙しい", r: "いそがしい", pt: "ocupado(a)", e: "😵‍💫", s: "今日{きょう}|は|仕事{しごと}|が|忙{いそが}しい|です。", st: "Hoje o trabalho está corrido." },
  { j: "休む", r: "やすむ", pt: "descansar; faltar", e: "🛋️", s: "熱{ねつ}|が|ある|ので、|今日{きょう}|は|休{やす}みます。", st: "Estou com febre, então vou faltar hoje." },
  { j: "遅れる", r: "おくれる", pt: "atrasar-se", e: "🏃", s: "すみません、|少{すこ}し|遅{おく}れます。", st: "Desculpe, vou me atrasar um pouco." },
  { j: "連絡", r: "れんらく", pt: "contato; aviso", e: "📞", s: "あとで|連絡{れんらく}します。", st: "Entro em contato depois." },
  { j: "手伝う", r: "てつだう", pt: "ajudar", e: "🤝", s: "少{すこ}し|手伝{てつだ}って|ください。", st: "Me ajude um pouco, por favor." },

  // ── U7 Comida ──
  { j: "ご飯", r: "ごはん", pt: "arroz cozido; refeição", e: "🍚", s: "ご飯{はん}|を|食{た}べましょう。", st: "Vamos comer." },
  { j: "水", r: "みず", pt: "água", e: "💧", s: "水{みず}|を|ください。", st: "Água, por favor." },
  { j: "お茶", r: "おちゃ", pt: "chá", e: "🍵", s: "お茶{ちゃ}|を|飲{の}みますか。", st: "Quer tomar chá?" },
  { j: "パン", r: "パン", pt: "pão", e: "🍞", s: "朝{あさ}|は|パン|を|食{た}べます。", st: "De manhã como pão." },
  { j: "おいしい", r: "おいしい", pt: "gostoso", e: "😋", s: "この|ラーメン|は|おいしい|です。", st: "Este lámen é gostoso." },

  { j: "肉", r: "にく", pt: "carne", e: "🥩", s: "肉{にく}|と|野菜{やさい}|を|買{か}います。", st: "Compro carne e verduras." },
  { j: "魚", r: "さかな", pt: "peixe", e: "🐟", s: "日本{にほん}|の|魚{さかな}|は|おいしい|です。", st: "O peixe do Japão é gostoso." },
  { j: "野菜", r: "やさい", pt: "verduras e legumes", e: "🥬", s: "野菜{やさい}|を|たくさん|食{た}べます。", st: "Como bastante verdura." },
  { j: "果物", r: "くだもの", pt: "fruta", e: "🍎", s: "果物{くだもの}|が|好{す}き|です。", st: "Gosto de frutas." },
  { j: "卵", r: "たまご", pt: "ovo", e: "🥚", s: "卵{たまご}|を|二{ふた}つ|ください。", st: "Dois ovos, por favor." },
  { j: "牛乳", r: "ぎゅうにゅう", pt: "leite", e: "🥛", s: "牛乳{ぎゅうにゅう}|を|買{か}って|きて|ください。", st: "Compre leite, por favor." },

  { j: "お腹がすいた", r: "おなかがすいた", pt: "estou com fome", e: "🤤", s: "お腹{なか}|が|すいた。|何{なに}か|食{た}べたい。", st: "Estou com fome. Quero comer alguma coisa." },
  { j: "のどがかわいた", r: "のどがかわいた", pt: "estou com sede", e: "🥵", s: "のど|が|かわいた。|水{みず}|が|飲{の}みたい。", st: "Estou com sede. Quero beber água." },
  { j: "いただきます", r: "いただきます", pt: "(dito antes de comer)", e: "🥢", s: "いただきます！|おいしそう|ですね。", st: "Vamos comer! Parece gostoso, né?" },
  { j: "ごちそうさまでした", r: "ごちそうさまでした", pt: "(dito depois de comer)", e: "🍽️", s: "ごちそうさまでした。|おいしかった|です。", st: "Obrigada pela refeição. Estava gostoso." },
  { j: "甘い", r: "あまい", pt: "doce", e: "🍰", s: "この|ケーキ|は|甘{あま}い|です。", st: "Este bolo é doce." },
  { j: "辛い", r: "からい", pt: "apimentado", e: "🌶️", s: "辛{から}い|料理{りょうり}|は|大丈夫{だいじょうぶ}|ですか。", st: "Comida apimentada, tudo bem?" },

  // ── U8 Compras ──
  { j: "スーパー", r: "スーパー", pt: "supermercado", e: "🛒", s: "スーパー|は|九時{くじ}|に|開{あ}きます。", st: "O supermercado abre às nove." },
  { j: "買い物", r: "かいもの", pt: "compras", e: "🛍️", s: "スーパー|で|買{か}い物{もの}|を|します。", st: "Faço compras no supermercado." },
  { j: "これ", r: "これ", pt: "isto", e: "👇", s: "これ|は|何{なん}|ですか。", st: "O que é isto?" },
  { j: "ください", r: "ください", pt: "me dê, por favor", e: "🫴", s: "これ|を|三{みっ}つ|ください。", st: "Me dê três destes, por favor." },
  { j: "ほしい", r: "ほしい", pt: "quero (ter)", e: "🤩", s: "新{あたら}しい|くつ|が|ほしい|です。", st: "Quero sapatos novos." },

  { j: "半額", r: "はんがく", pt: "metade do preço", e: "🔖", s: "夜{よる}|は|お弁当{べんとう}|が|半額{はんがく}|に|なります。", st: "À noite as marmitas ficam pela metade do preço." },
  { j: "割引", r: "わりびき", pt: "desconto", e: "💸", s: "この|肉{にく}|は|二割引{にわりびき}|です。", st: "Esta carne está com 20% de desconto." },
  { j: "賞味期限", r: "しょうみきげん", pt: "prazo de validade", e: "📆", s: "賞味期限{しょうみきげん}|は|明日{あした}|まで|です。", st: "A validade é até amanhã." },
  { j: "税込", r: "ぜいこみ", pt: "imposto incluído", e: "🧮", s: "税込{ぜいこみ}|で|五百円{ごひゃくえん}|です。", st: "Com imposto, são 500 ienes." },
  { j: "売り切れ", r: "うりきれ", pt: "esgotado", e: "🚫", s: "卵{たまご}|は|売{う}り切{き}れ|です。", st: "Os ovos estão esgotados." },
  { j: "ポイントカード", r: "ポイントカード", pt: "cartão de pontos", e: "🎫", s: "ポイントカード|は|お持{も}ち|ですか。", st: "Você tem cartão de pontos?" },

  { j: "たくさん", r: "たくさん", pt: "muito; bastante", e: "📦", s: "野菜{やさい}|を|たくさん|買{か}いました。", st: "Comprei bastante verdura." },
  { j: "少し", r: "すこし", pt: "um pouco", e: "🤏", s: "日本語{にほんご}|が|少{すこ}し|分{わ}かります。", st: "Entendo um pouco de japonês." },
  { j: "もっと", r: "もっと", pt: "mais", e: "➕", s: "もっと|安{やす}い|の|は|ありますか。", st: "Tem um mais barato?" },

  // ── U9 Transporte ──
  { j: "駅", r: "えき", pt: "estação", e: "🚉", s: "駅{えき}|まで|歩{ある}いて|十分{じゅっぷん}|です。", st: "Até a estação são dez minutos a pé." },
  { j: "電車", r: "でんしゃ", pt: "trem", e: "🚃", s: "電車{でんしゃ}|で|会社{かいしゃ}|に|行{い}きます。", st: "Vou para a empresa de trem." },
  { j: "バス", r: "バス", pt: "ônibus", e: "🚌", s: "バス|は|何時{なんじ}|に|来{き}ますか。", st: "Que horas vem o ônibus?" },
  { j: "切符", r: "きっぷ", pt: "bilhete; passagem", e: "🎟️", s: "切符{きっぷ}|は|どこ|で|買{か}いますか。", st: "Onde se compra a passagem?" },
  { j: "乗る", r: "のる", pt: "embarcar; pegar (transporte)", e: "🧍‍♀️", s: "ここ|で|バス|に|乗{の}ります。", st: "Pego o ônibus aqui." },
  { j: "降りる", r: "おりる", pt: "descer (do transporte)", e: "🚏", s: "次{つぎ}|の|駅{えき}|で|降{お}ります。", st: "Desço na próxima estação." },

  { j: "どこ", r: "どこ", pt: "onde?", e: "🗺️", s: "トイレ|は|どこ|ですか。", st: "Onde fica o banheiro?" },
  { j: "ここ", r: "ここ", pt: "aqui", e: "📌", s: "ここ|に|名前{なまえ}|を|書{か}いて|ください。", st: "Escreva seu nome aqui, por favor." },
  { j: "まっすぐ", r: "まっすぐ", pt: "reto; em frente", e: "⬆️", s: "この|道{みち}|を|まっすぐ|行{い}って|ください。", st: "Siga reto por esta rua." },
  { j: "曲がる", r: "まがる", pt: "virar", e: "↪️", s: "次{つぎ}|の|角{かど}|を|右{みぎ}|に|曲{ま}がります。", st: "Viro à direita na próxima esquina." },
  { j: "近い", r: "ちかい", pt: "perto", e: "📏", s: "駅{えき}|は|ここ|から|近{ちか}い|です。", st: "A estação é perto daqui." },
  { j: "遠い", r: "とおい", pt: "longe", e: "🔭", s: "病院{びょういん}|は|少{すこ}し|遠{とお}い|です。", st: "O hospital é um pouco longe." },

  // ── U10 Lugares e direções ──
  { j: "となり", r: "となり", pt: "ao lado; vizinho", e: "↔️", s: "銀行{ぎんこう}|は|スーパー|の|となり|です。", st: "O banco fica ao lado do supermercado." },
  { j: "後ろ", r: "うしろ", pt: "atrás", e: "🔙", s: "車{くるま}|の|後{うし}ろ|に|子{こ}ども|が|います。", st: "Tem uma criança atrás do carro." },
  { j: "あそこ", r: "あそこ", pt: "ali; lá", e: "👉", s: "トイレ|は|あそこ|です。", st: "O banheiro é ali." },

  { j: "郵便局", r: "ゆうびんきょく", pt: "correio", e: "🏣", s: "郵便局{ゆうびんきょく}|で|荷物{にもつ}|を|送{おく}ります。", st: "Envio encomendas pelo correio." },
  { j: "銀行", r: "ぎんこう", pt: "banco", e: "🏦", s: "銀行{ぎんこう}|は|三時{さんじ}|まで|です。", st: "O banco funciona até as três." },
  { j: "市役所", r: "しやくしょ", pt: "prefeitura", e: "🏛️", s: "市役所{しやくしょ}|で|書類{しょるい}|を|もらいます。", st: "Pego os documentos na prefeitura." },
  { j: "コンビニ", r: "コンビニ", pt: "loja de conveniência", e: "🏪", s: "コンビニ|で|お金{かね}|を|払{はら}います。", st: "Pago as contas na loja de conveniência." },
  { j: "公園", r: "こうえん", pt: "parque", e: "🌳", s: "公園{こうえん}|で|子{こ}ども|と|遊{あそ}びます。", st: "Brinco com as crianças no parque." },
  { j: "交番", r: "こうばん", pt: "posto policial", e: "👮", s: "交番{こうばん}|で|道{みち}|を|聞{き}きます。", st: "Pergunto o caminho no posto policial." },

  // ── U11 Corpo e saúde ──
  { j: "病院", r: "びょういん", pt: "hospital; clínica", e: "🏥", s: "明日{あした}、|病院{びょういん}|に|行{い}きます。", st: "Amanhã vou ao médico." },
  { j: "薬", r: "くすり", pt: "remédio", e: "💊", s: "この|薬{くすり}|を|一日{いちにち}|三回{さんかい}|飲{の}んで|ください。", st: "Tome este remédio três vezes ao dia." },
  { j: "痛い", r: "いたい", pt: "dói; dolorido", e: "🤕", s: "足{あし}|が|痛{いた}い|です。", st: "Estou com dor na perna." },
  { j: "熱", r: "ねつ", pt: "febre", e: "🤒", s: "子{こ}ども|が|熱{ねつ}|を|出{だ}しました。", st: "Meu filho ficou com febre." },
  { j: "風邪", r: "かぜ", pt: "resfriado", e: "🤧", s: "風邪{かぜ}|を|ひきました。", st: "Peguei um resfriado." },
  { j: "頭", r: "あたま", pt: "cabeça", e: "🧠", s: "朝{あさ}|から|頭{あたま}|が|痛{いた}い|です。", st: "Estou com dor de cabeça desde de manhã." },

  { j: "お腹", r: "おなか", pt: "barriga", e: "🫃", s: "お腹{なか}|が|痛{いた}い|です。", st: "Estou com dor de barriga." },
  { j: "歯", r: "は", pt: "dente", e: "🦷", s: "歯{は}|が|痛{いた}い|ので、|歯医者{はいしゃ}|に|行{い}きます。", st: "Estou com dor de dente, então vou ao dentista." },
  { j: "保険証", r: "ほけんしょう", pt: "cartão do seguro de saúde", e: "🪪", s: "保険証{ほけんしょう}|を|お願{ねが}いします。", st: "O cartão do seguro, por favor." },
  { j: "予約", r: "よやく", pt: "reserva; agendamento", e: "🗒️", s: "予約{よやく}|を|したい|です。", st: "Quero fazer um agendamento." },
  { j: "受付", r: "うけつけ", pt: "recepção", e: "🛎️", s: "受付{うけつけ}|は|一階{いっかい}|です。", st: "A recepção é no térreo." },
  { j: "お大事に", r: "おだいじに", pt: "Melhoras!", e: "💐", s: "お大事{だいじ}に。|ゆっくり|休{やす}んで|ください。", st: "Melhoras! Descanse bastante." },

  // ── U12 Tempo e natureza ──
  { j: "天気", r: "てんき", pt: "tempo (clima)", e: "🌤️", s: "今日{きょう}|は|いい|天気{てんき}|ですね。", st: "Hoje o tempo está bom, né?" },
  { j: "暑い", r: "あつい", pt: "quente (clima)", e: "🥵", s: "今日{きょう}|は|とても|暑{あつ}い|です。", st: "Hoje está muito quente." },
  { j: "寒い", r: "さむい", pt: "frio (clima)", e: "🥶", s: "今朝{けさ}|は|とても|寒{さむ}い|です。", st: "Hoje de manhã está muito frio." },
  { j: "晴れ", r: "はれ", pt: "tempo bom; sol", e: "☀️", s: "明日{あした}|は|晴{は}れ|です。", st: "Amanhã vai fazer sol." },
  { j: "傘", r: "かさ", pt: "guarda-chuva", e: "☂️", s: "傘{かさ}|を|持{も}って|いって|ください。", st: "Leve o guarda-chuva." },
  { j: "台風", r: "たいふう", pt: "tufão", e: "🌀", s: "明日{あした}|台風{たいふう}|が|来{き}ます。", st: "Amanhã vem um tufão." },

  { j: "地震", r: "じしん", pt: "terremoto", e: "🫨", s: "地震{じしん}|です。|机{つくえ}|の|下{した}|に|入{はい}って|ください。", st: "É terremoto. Entre debaixo da mesa." },
  { j: "危ない", r: "あぶない", pt: "perigoso; cuidado!", e: "⚠️", s: "危{あぶ}ない！|車{くるま}|が|来{き}ます。", st: "Cuidado! Vem um carro." },
  { j: "気をつけて", r: "きをつけて", pt: "tome cuidado", e: "🫶", s: "雨{あめ}|だから、|気{き}をつけて|ね。", st: "Está chovendo, então tome cuidado." },
  { j: "夏", r: "なつ", pt: "verão", e: "🏝️", s: "日本{にほん}|の|夏{なつ}|は|暑{あつ}い|です。", st: "O verão do Japão é quente." },
  { j: "冬", r: "ふゆ", pt: "inverno", e: "⛄", s: "冬{ふゆ}|に|雪{ゆき}|が|降{ふ}ります。", st: "No inverno neva." },

  // ── U13 Verbos do dia a dia ──
  { j: "分かります", r: "わかります", pt: "entendo", e: "💡", s: "この|漢字{かんじ}|は|分{わ}かります。", st: "Este kanji eu entendo." },
  { j: "分かりません", r: "わかりません", pt: "não entendo", e: "🤷", s: "すみません、|よく|分{わ}かりません。", st: "Desculpe, não entendo bem." },
  { j: "もう一度", r: "もういちど", pt: "mais uma vez", e: "🔂", s: "もう一度{いちど}|言{い}って|ください。", st: "Pode repetir, por favor?" },
  { j: "ゆっくり", r: "ゆっくり", pt: "devagar", e: "🐢", s: "ゆっくり|話{はな}して|ください。", st: "Fale devagar, por favor." },
  { j: "教える", r: "おしえる", pt: "ensinar; informar", e: "🧑‍🏫", s: "読{よ}み方{かた}|を|教{おし}えて|ください。", st: "Me ensine como se lê, por favor." },

  { j: "使う", r: "つかう", pt: "usar", e: "🖊️", s: "この|ペン|を|使{つか}って|も|いい|ですか。", st: "Posso usar esta caneta?" },
  { j: "作る", r: "つくる", pt: "fazer; preparar", e: "🍳", s: "晩{ばん}ご飯{はん}|を|作{つく}ります。", st: "Vou fazer o jantar." },
  { j: "洗う", r: "あらう", pt: "lavar", e: "🧼", s: "手{て}|を|洗{あら}いましょう。", st: "Vamos lavar as mãos." },
  { j: "掃除", r: "そうじ", pt: "limpeza", e: "🧹", s: "週末{しゅうまつ}|に|部屋{へや}|を|掃除{そうじ}します。", st: "No fim de semana limpo o quarto." },
  { j: "洗濯", r: "せんたく", pt: "lavar roupa", e: "🧺", s: "天気{てんき}|が|いい|から、|洗濯{せんたく}します。", st: "O tempo está bom, então vou lavar roupa." },
  { j: "料理", r: "りょうり", pt: "culinária; comida", e: "👩‍🍳", s: "夫{おっと}|は|料理{りょうり}|が|上手{じょうず}|です。", st: "Meu marido cozinha bem." },

  { j: "ゴミ", r: "ゴミ", pt: "lixo", e: "🗑️", s: "ゴミ|は|朝{あさ}|八時{はちじ}|まで|に|出{だ}します。", st: "O lixo é colocado para fora até as 8 da manhã." },
  { j: "燃えるゴミ", r: "もえるゴミ", pt: "lixo queimável", e: "🔥", s: "燃{も}えるゴミ|は|月曜日{げつようび}|と|木曜日{もくようび}|です。", st: "Lixo queimável é segunda e quinta." },
  { j: "近所", r: "きんじょ", pt: "vizinhança", e: "🏘️", s: "近所{きんじょ}|の|人{ひと}|は|やさしい|です。", st: "As pessoas da vizinhança são gentis." },
  { j: "好き", r: "すき", pt: "gostar", e: "❤️", s: "日本{にほん}|の|料理{りょうり}|が|好{す}き|です。", st: "Gosto de comida japonesa." },
  { j: "疲れた", r: "つかれた", pt: "estou cansado(a)", e: "😮‍💨", s: "今日{きょう}|は|とても|疲{つか}れた。", st: "Hoje estou muito cansada." },
  { j: "ちょっと待って", r: "ちょっとまって", pt: "espere um pouco", e: "✋", s: "ちょっと|待{ま}って|ください。", st: "Espere um pouco, por favor." },
];
