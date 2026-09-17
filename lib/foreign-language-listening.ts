import type { ListeningScript } from "./foreign-language-api";

export const TTS_LOCALE: Record<string, string> = {
  Japanese: "ja-JP",
  French: "fr-FR",
  German: "de-DE",
  Spanish: "es-ES",
  English: "en-US",
};

export const LISTENING_TOPICS = [
  "Daily conversation",
  "Station announcement",
  "Restaurant ordering",
  "University lecture",
  "Job interview",
  "Shopping dialogue",
  "Travel directions",
  "Phone call",
];

/**
 * Real exam-practice resources per language (homepages of stable providers —
 * never fake "sample MP3" links). Students surf these, copy any MP3 URL, and
 * paste it into the player.
 */
export const EXAM_RESOURCE_LIST: { language: string; label: string; url: string }[] = [
  { language: "Japanese", label: "NHK News Easy (listening + script)", url: "https://www3.nhk.or.jp/news/easy/" },
  { language: "Japanese", label: "Official JLPT sample questions", url: "https://www.jlpt.jp/e/samples/" },
  { language: "French", label: "RFI Français Facile (audio + text)", url: "https://francaisfacile.rfi.fr/" },
  { language: "French", label: "DELF / DALF official samples", url: "https://www.delfdalf.fr/" },
  { language: "German", label: "DW Langsam gesprochene Nachrichten", url: "https://www.dw.com/de/deutsch-lernen/nachrichten/s-8030" },
  { language: "German", label: "Goethe-Institut practice (Übungen)", url: "https://www.goethe.de/de/spr/ueb.html" },
  { language: "Spanish", label: "ProfeDeELE listening (audiciones)", url: "https://www.profedeele.es/" },
  { language: "Spanish", label: "Instituto Cervantes DELE samples", url: "https://www.cervantes.es/" },
  { language: "English", label: "IELTS sample test questions", url: "https://www.ielts.org/for-test-takers/sample-test-questions" },
  { language: "English", label: "TOEFL iBT practice tests", url: "https://www.ets.org/toefl/test-takers/ibt/prepare/practice-tests" },
];

function Q(questionText: string, options: string[], correctOptionIndex: number, explanation: string) {
  return { questionText, options, correctOptionIndex, explanation };
}

const JP: Record<string, ListeningScript> = {
  "Daily conversation": {
    title: "毎日の会話 — Daily Conversation (N5)",
    script: "田中：おはよう、山田さん。きのうのパーティーはどうでしたか。山田：おはようございます。とても楽しかったです。田中さんのケーキはおいしかったです。田中：ありがとう。来週の日曜日、うちで昼ごはんを食べませんか。山田：いいですね。何時に行きますか。田中：十二時ごろ来てください。山田：わかりました。何か持っていきますか。田中：いいえ、何もいりません。",
    translation: "Tanaka: Good morning, Yamada. How was yesterday's party? Yamada: It was a lot of fun — your cake was delicious. Tanaka: Thanks. Won't you have lunch at my place next Sunday? Yamada: Sounds good, what time? Tanaka: Around twelve. Yamada: Shall I bring something? Tanaka: No, nothing needed.",
    questions: [
      Q("パーティーはどうでしたか。", ["楽しくなかった", "とても楽しかった", "つまらなかった", "行かなかった"], 1, "「とても楽しかったです」と言いました。"),
      Q("昼ごはんは何曜日ですか。", ["土曜日", "日曜日", "月曜日", "金曜日"], 1, "「来週の日曜日」と言いました。"),
      Q("何時に行きますか。", ["十一時", "十二時ごろ", "一時", "十時"], 1, "「十二時ごろ来てください」と言いました。"),
    ],
  },
  "Station announcement": {
    title: "駅のアナウンス — Station Announcement (N5)",
    script: "みなさん、おはようございます。つぎは、しんじゅく、しんじゅくです。電車をおりるときは、忘れ物に気をつけてください。つぎの電車は九時十五分です。切符をなくした方は、駅の人に聞いてください。",
    translation: "Good morning. Next stop is Shinjuku. When you get off, watch your belongings. The next train is at 9:15. If you lost your ticket, ask the station staff.",
    questions: [
      Q("つぎの駅はどこですか。", ["渋谷", "新宿", "東京", "池袋"], 1, "「つぎは、しんじゅく」と言いました。"),
      Q("つぎの電車は何時ですか。", ["八時十五分", "九時五分", "九時十五分", "十時十五分"], 2, "「九時十五分」と言いました。"),
      Q("切符をなくした人はどうしますか。", ["電車に乗る", "家に帰る", "駅の人に聞く", "切符を捨てる"], 2, "「駅の人に聞いてください」と言いました。"),
    ],
  },
  "Restaurant ordering": {
    title: "レストランで — At the Restaurant (N5)",
    script: "店員：いらっしゃいませ。何名さまですか。客：二人です。店員：こちらへどうぞ。お飲み物は何にしますか。客：オレンジジュースを二つください。店員：はい。お料理はお決まりですか。客：カレーライスとサラダをお願いします。店員：カレーの辛さはどうしますか。客：中辛でお願いします。",
    translation: "Staff: Welcome, how many? Customer: Two. Staff: This way. Drinks? Customer: Two orange juices. Staff: Decided on food? Customer: Curry rice and salad. Staff: How spicy? Customer: Medium.",
    questions: [
      Q("何人ですか。", ["一人", "二人", "三人", "四人"], 1, "「二人です」と言いました。"),
      Q("飲み物は何ですか。", ["コーヒー二つ", "オレンジジュース二つ", "お茶一つ", "水二つ"], 1, "「オレンジジュースを二つ」と言いました。"),
      Q("カレーの辛さはどうしましたか。", ["甘口", "中辛", "辛口", "辛さなし"], 1, "「中辛でお願いします」と言いました。"),
    ],
  },
  "University lecture": {
    title: "大学の授業 — University Lecture (N4)",
    script: "先生：今日は日本の季節について話します。日本には春、夏、秋、冬の四つの季節があります。春は桜が咲きます。三月から五月ごろです。夏は暑くて、雨がたくさん降ります。秋は涼しくて、紅葉がきれいです。冬は寒くて、雪が降ります。質問がある人は、手を挙げてください。",
    translation: "Teacher: Today, Japan's seasons. Four: spring, summer, autumn, winter. Spring: cherry blossoms, March–May. Summer: hot and rainy. Autumn: cool, beautiful leaves. Winter: cold with snow. Questions? Raise your hand.",
    questions: [
      Q("日本にはいくつの季節がありますか。", ["二つ", "三つ", "四つ", "五つ"], 2, "「四つの季節」と言いました。"),
      Q("桜が咲くのはいつですか。", ["夏", "秋", "冬", "春"], 3, "「春は桜が咲きます」と言いました。"),
      Q("質問がある人はどうしますか。", ["立つ", "手を挙げる", "紙に書く", "外に出る"], 1, "「手を挙げてください」と言いました。"),
    ],
  },
  "Job interview": {
    title: "面接 — Job Interview (N4)",
    script: "面接官：自己紹介をお願いします。学生：はい。私は大学で経済を勉強しています。去年、コンビニでアルバイトをしました。お客様と話すことが好きです。面接官：どうしてこの会社を選びましたか。学生：環境を守る仕事がしたいからです。面接官：週に何時間働けますか。学生：週に二十時間ぐらい働けます。",
    translation: "Interviewer: Introduce yourself. Student: I study economics; worked part-time at a convenience store last year; I like talking with customers. Why us? I want work protecting the environment. Hours? About twenty a week.",
    questions: [
      Q("学生は何を勉強していますか。", ["経済", "歴史", "英語", "数学"], 0, "「経済を勉強しています」と言いました。"),
      Q("どうしてこの会社を選びましたか。", ["給料が高いから", "家から近いから", "環境を守る仕事がしたいから", "友達がいるから"], 2, "「環境を守る仕事がしたいから」と言いました。"),
      Q("週に何時間働けますか。", ["十時間", "十五時間", "二十時間", "三十時間"], 2, "「二十時間ぐらい」と言いました。"),
    ],
  },
  "Shopping dialogue": {
    title: "買い物 — Shopping (N5)",
    script: "客：すみません、このシャツはいくらですか。店員：三千五百円です。客：少し高いですね。もっと安いのはありますか。店員：こちらは二千円です。色は青と白があります。客：じゃあ、白いのをください。店員：ありがとうございます。二千円になります。",
    translation: "Customer: How much is this shirt? Staff: 3,500 yen. Customer: A bit expensive — anything cheaper? Staff: This one, 2,000 yen, in blue or white. Customer: The white one, please. Staff: Thank you, 2,000 yen.",
    questions: [
      Q("最初のシャツはいくらですか。", ["二千円", "三千円", "三千五百円", "四千円"], 2, "「三千五百円です」と言いました。"),
      Q("安いシャツにない色はどれですか。", ["青", "白", "赤", "青と白がある"], 2, "「色は青と白」と言いました。"),
      Q("客は何を買いましたか。", ["青いシャツ", "白いシャツ", "ズボン", "何も買わなかった"], 1, "「白いのをください」と言いました。"),
    ],
  },
  "Travel directions": {
    title: "道案内 — Asking Directions (N5)",
    script: "旅行者：すみません、郵便局はどこですか。通行人：この道をまっすぐ行って、二つ目の信号を右に曲がります。コンビニのとなりです。旅行者：歩いて何分ぐらいですか。通行人：十分ぐらいです。旅行者：ありがとうございます。通行人：どういたしまして。",
    translation: "Traveller: Where is the post office? Passerby: Straight on, right at the second light, next to the convenience store. Traveller: How many minutes on foot? Passerby: About ten. Traveller: Thanks!",
    questions: [
      Q("郵便局はどこにありますか。", ["コンビニのとなり", "駅の前", "公園の中", "学校のとなり"], 0, "「コンビニのとなり」と言いました。"),
      Q("いつ右に曲がりますか。", ["一つ目の信号", "二つ目の信号", "三つ目の信号", "橋の前"], 1, "「二つ目の信号を右」と言いました。"),
      Q("歩いて何分ですか。", ["五分", "十分", "十五分", "二十分"], 1, "「十分ぐらい」と言いました。"),
    ],
  },
  "Phone call": {
    title: "電話 — Phone Call (N4)",
    script: "佐藤：もしもし、佐藤です。鈴木さんはいますか。鈴木の母：あいにく、今出かけています。七時ごろ帰ります。佐藤：そうですか。では、また七時半ごろかけ直します。鈴木の母：わかりました。伝えておきます。佐藤：お願いします。失礼します。",
    translation: "Sato: Hello, it's Sato. Is Suzuki there? Mother: She's out, back around seven. Sato: I'll call back around seven-thirty. Mother: Understood, I'll tell her. Sato: Thanks, goodbye.",
    questions: [
      Q("鈴木さんは今どこにいますか。", ["家にいる", "出かけている", "会社にいる", "学校にいる"], 1, "「今出かけています」と言いました。"),
      Q("鈴木さんは何時ごろ帰りますか。", ["六時", "七時", "七時半", "八時"], 1, "「七時ごろ帰ります」と言いました。"),
      Q("佐藤さんはいつかけ直しますか。", ["六時半", "七時", "七時半", "八時"], 2, "「七時半ごろかけ直します」と言いました。"),
    ],
  },
};

const GENERIC_DIALOGUES: Record<string, Record<string, string[]>> = {
  French: {
    "Daily conversation": ["Bonjour Marie, comment s'est passé ton week-end ?", "Salut Paul ! Très bien, je suis allée au marché samedi et dimanche j'ai vu ma grand-mère.", "Et toi, tu as fait du sport ?", "Oui, j'ai couru une heure au parc."],
    "Station announcement": ["Mesdames et messieurs, le train pour Lyon partira du quai trois dans cinq minutes.", "Attention à la fermeture des portes.", "Les voyageurs sans billet doivent se présenter au guichet.", "Merci de votre attention."],
    "Restaurant ordering": ["Bonsoir, vous êtes combien ?", "Deux personnes, s'il vous plaît.", "Voici la carte. Que désirez-vous boire ?", "Deux jus d'orange et ensuite deux plats du jour, s'il vous plaît."],
    "University lecture": ["Aujourd'hui nous parlons du climat de la France.", "Il pleut souvent au nord et il fait chaud au sud en été.", "En automne les feuilles tombent et en hiver il neige en montagne.", "Posez vos questions à la fin du cours."],
    "Job interview": ["Présentez-vous, s'il vous plaît.", "J'étudie l'économie et j'ai travaillé un an dans un magasin.", "Pourquoi notre entreprise ?", "Parce que je veux protéger l'environnement."],
    "Shopping dialogue": ["Bonjour, combien coûte cette chemise ?", "Trente-cinq euros.", "C'est un peu cher. Avez-vous moins cher ?", "Oui, celle-ci à vingt euros, en bleu ou en blanc."],
    "Travel directions": ["Pardon, où est la poste ?", "Allez tout droit, tournez à droite au deuxième feu.", "C'est à côté de la supérette, à dix minutes à pied.", "Merci beaucoup !"],
    "Phone call": ["Allô, c'est Pierre. Marie est là ?", "Non, elle est sortie, elle rentre vers dix-neuf heures.", "D'accord, je rappellerai vers dix-neuf heures trente.", "Très bien, je lui dirai."],
  },
  German: {
    "Daily conversation": ["Guten Morgen, Lisa! Wie war dein Wochenende?", "Hallo Max! Sehr gut, am Samstag war ich auf dem Markt und am Sonntag bei meiner Oma.", "Und du, hast du Sport gemacht?", "Ja, ich bin eine Stunde im Park gelaufen."],
    "Station announcement": ["Meine Damen und Herren, der Zug nach München fährt in fünf Minuten von Gleis sieben ab.", "Bitte achten Sie auf das Schließen der Türen.", "Fahrgäste ohne Fahrkarte melden sich bitte beim Personal.", "Vielen Dank."],
    "Restaurant ordering": ["Guten Abend, für wie viele Personen?", "Für zwei Personen, bitte.", "Hier ist die Karte. Was möchten Sie trinken?", "Zwei Orangensäfte und danach zweimal das Tagesgericht, bitte."],
    "University lecture": ["Heute sprechen wir über das Klima in Deutschland.", "Im Norden regnet es oft, im Süden ist der Sommer warm.", "Im Herbst fallen die Blätter, im Winter schneit es in den Bergen.", "Fragen bitte am Ende der Stunde."],
    "Job interview": ["Bitte stellen Sie sich vor.", "Ich studiere Wirtschaft und habe ein Jahr in einem Geschäft gearbeitet.", "Warum unser Unternehmen?", "Weil ich die Umwelt schützen möchte."],
    "Shopping dialogue": ["Guten Tag, was kostet dieses Hemd?", "Fünfunddreißig Euro.", "Das ist etwas teuer. Haben Sie etwas Billigeres?", "Ja, dieses hier für zwanzig Euro, in Blau oder Weiß."],
    "Travel directions": ["Entschuldigung, wo ist die Post?", "Gehen Sie geradeaus und biegen Sie an der zweiten Ampel rechts ab.", "Neben dem Supermarkt, etwa zehn Minuten zu Fuß.", "Vielen Dank!"],
    "Phone call": ["Hallo, hier ist Peter. Ist Maria da?", "Nein, sie ist ausgegangen und kommt gegen neunzehn Uhr zurück.", "Gut, ich rufe gegen neunzehn Uhr dreißig wieder an.", "Alles klar, ich richte es aus."],
  },
  Spanish: {
    "Daily conversation": ["¡Buenos días, María! ¿Qué tal el fin de semana?", "¡Hola, Pablo! Muy bien, el sábado fui al mercado y el domingo vi a mi abuela.", "¿Y tú, hiciste deporte?", "Sí, corrí una hora en el parque."],
    "Station announcement": ["Señores pasajeros, el tren con destino a Madrid saldrá del andén cuatro en cinco minutos.", "Atención al cierre de puertas.", "Los pasajeros sin billete deben ir a la ventanilla.", "Gracias por su atención."],
    "Restaurant ordering": ["Buenas noches, ¿cuántos son?", "Dos, por favor.", "Aquí tienen la carta. ¿Qué desean beber?", "Dos zumos de naranja y después dos menús del día, por favor."],
    "University lecture": ["Hoy hablamos del clima de España.", "En el norte llueve a menudo y en el sur el verano es caluroso.", "En otoño caen las hojas y en invierno nieva en la montaña.", "Preguntas al final de la clase."],
    "Job interview": ["Preséntese, por favor.", "Estudio economía y trabajé un año en una tienda.", "¿Por qué nuestra empresa?", "Porque quiero proteger el medio ambiente."],
    "Shopping dialogue": ["Hola, ¿cuánto cuesta esta camisa?", "Treinta y cinco euros.", "Es un poco caro. ¿Tiene algo más barato?", "Sí, esta por veinte euros, en azul o en blanco."],
    "Travel directions": ["Perdone, ¿dónde está el correo?", "Siga recto y gire a la derecha en el segundo semáforo.", "Al lado del supermercado, a diez minutos a pie.", "¡Muchas gracias!"],
    "Phone call": ["Hola, soy Pedro. ¿Está María?", "No, ha salido, vuelve sobre las siete.", "Vale, llamaré sobre las siete y media.", "Muy bien, se lo diré."],
  },
  English: {
    "Daily conversation": ["Morning, Sarah! How was your weekend?", "Hi, Tom! Great — farmers' market on Saturday, grandma on Sunday.", "Did you get any exercise?", "Yes, an hour's run in the park."],
    "Station announcement": ["Good morning, passengers. The train to Oxford departs from platform three in five minutes.", "Please stand clear of the closing doors.", "Passengers without tickets should visit the ticket office.", "Thank you."],
    "Restaurant ordering": ["Good evening, how many of you?", "Two, please.", "Here are the menus. What would you like to drink?", "Two orange juices, then two set lunches, please."],
    "University lecture": ["Today we discuss Britain's climate.", "The north is often rainy; the south is warm in summer.", "Leaves fall in autumn; it snows on high ground in winter.", "Questions at the end, please."],
    "Job interview": ["Please introduce yourself.", "I study economics and worked a year in retail.", "Why our company?", "Because I want work that protects the environment."],
    "Shopping dialogue": ["Excuse me, how much is this shirt?", "Thirty-five pounds.", "That's a bit pricey. Anything cheaper?", "Yes, this one at twenty pounds, in blue or white."],
    "Travel directions": ["Excuse me, where's the post office?", "Go straight on, turn right at the second lights.", "Next to the supermarket, about ten minutes on foot.", "Thanks so much!"],
    "Phone call": ["Hello, it's Peter. Is Mary there?", "No, she's out — back around seven.", "OK, I'll call back around half past seven.", "Got it, I'll tell her."],
  },
};

/** Distinct offline fallback per language AND topic. Never the same audio twice. */
export function getFallbackListening(language: string, topic?: string): ListeningScript {
  const t = topic && LISTENING_TOPICS.includes(topic) ? topic : LISTENING_TOPICS[0];
  if (language === "Japanese" && JP[t]) return JP[t];
  const dialogues = GENERIC_DIALOGUES[language] || GENERIC_DIALOGUES.English;
  const lines = dialogues[t] || dialogues[LISTENING_TOPICS[0]];
  const langName = GENERIC_DIALOGUES[language] ? language : "English";
  return {
    title: `${t} — ${langName} listening`,
    script: lines.join(" "),
    translation: `Exam-style ${langName.toLowerCase()} passage on "${t.toLowerCase()}". Listen twice, then answer from memory — exactly like the real exam.`,
    questions: [
      Q(
        `What is this ${t.toLowerCase()} mainly about?`,
        [t, "A weather report", "A sports match", "A cooking recipe"],
        0,
        `The whole passage plays out one ${t.toLowerCase()} situation: “${lines[0].slice(0, 70)}…”`
      ),
      Q("How many voices take turns in the audio?", ["One", "Two", "Three", "Four"], 1, "It is a two-voice dialogue / announcement + reply pattern."),
      Q("What is the exam rule for this task?", ["Listen twice, answer from memory", "Read the script first", "Translate every word", "Skip the questions"], 0, "Real listening sections allow two plays, no script."),
    ],
  };
}

/** @deprecated — kept for backwards compat; now topic-aware. */
export function getFallbackListeningLegacy(language: string): ListeningScript {
  return getFallbackListening(language, LISTENING_TOPICS[0]);
}
