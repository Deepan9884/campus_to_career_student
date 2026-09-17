import type { ListeningScript } from "./foreign-language-api";

export const TTS_LOCALE: Record<string, string> = {
  Japanese: "ja-JP",
  French: "fr-FR",
  German: "de-DE",
  Spanish: "es-ES",
  English: "en-US",
};

/** Curated open listening streams / sample audio surfaced from the web. */
export const WEB_AUDIO_SOURCES: { label: string; url: string; note: string }[] = [
  {
    label: "NHK Japanese Listening Sample",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    note: "Placeholder stream — replace with any JLPT MP3 URL you surf. Plays in exam-style player below.",
  },
  {
    label: "Slow French News Clip",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    note: "Paste any RFI / Français Facile MP3 link to practise real broadcast audio.",
  },
  {
    label: "Deutsche Welle Slow German",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    note: "Swap in a DW Langsam gesprochene Nachrichten MP3 for authentic exam audio.",
  },
];

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

const FALLBACKS: Record<string, ListeningScript> = {
  Japanese: {
    title: "駅のアナウンス — Station Announcement (N5)",
    script:
      "みなさん、おはようございます。つぎは、しんじゅく、しんじゅくです。電車をおりるときは、忘れ物に気をつけてください。つぎの電車は、九時十五分です。切符をなくした方は、駅の人に聞いてください。",
    translation:
      "Good morning, everyone. Next stop is Shinjuku, Shinjuku. When you get off the train, please be careful not to forget your belongings. The next train is at 9:15. If you lost your ticket, please ask the station staff.",
    questions: [
      {
        questionText: "つぎの駅はどこですか?",
        options: ["渋谷 (Shibuya)", "新宿 (Shinjuku)", "東京 (Tokyo)", "池袋 (Ikebukuro)"],
        correctOptionIndex: 1,
        explanation: "The announcement clearly says つぎは、しんじゅくです (Next is Shinjuku).",
      },
      {
        questionText: "つぎの電車は何時ですか?",
        options: ["8:15", "9:05", "9:15", "10:15"],
        correctOptionIndex: 2,
        explanation: "つぎの電車は、九時十五分です means the next train is at 9:15.",
      },
      {
        questionText: "切符をなくした人はどうしますか?",
        options: [
          "電車に乗ります",
          "家に帰ります",
          "駅の人に聞きます",
          "切符を買います",
        ],
        correctOptionIndex: 2,
        explanation: "切符をなくした方は、駅の人に聞いてください — ask the station staff.",
      },
    ],
  },
  French: {
    title: "Annonce à la gare — Station Announcement (A1)",
    script:
      "Mesdames et messieurs, bonjour. Le train numéro 4521 à destination de Lyon va partir du quai numéro trois. Attention à la fermeture des portes. Les voyageurs sans billet doivent aller au guichet avant de monter dans le train.",
    translation:
      "Ladies and gentlemen, hello. Train number 4521 to Lyon will depart from platform number three. Watch out for the closing doors. Passengers without a ticket must go to the ticket counter before boarding.",
    questions: [
      {
        questionText: "Le train va à quelle ville ?",
        options: ["Paris", "Lyon", "Marseille", "Nice"],
        correctOptionIndex: 1,
        explanation: "Le texte dit « à destination de Lyon ».",
      },
      {
        questionText: "De quel quai part le train ?",
        options: ["Quai 1", "Quai 2", "Quai 3", "Quai 4"],
        correctOptionIndex: 2,
        explanation: "« quai numéro trois » = platform 3.",
      },
      {
        questionText: "Que doivent faire les voyageurs sans billet ?",
        options: [
          "Monter vite",
          "Aller au guichet",
          "Rester à la maison",
          "Changer de train",
        ],
        correctOptionIndex: 1,
        explanation: "Ils « doivent aller au guichet avant de monter ».",
      },
    ],
  },
  German: {
    title: "Bahnhofsansage — Station Announcement (A1)",
    script:
      "Guten Morgen, meine Damen und Herren. Der Zug nach München fährt in fünf Minuten von Gleis sieben ab. Bitte achten Sie beim Aussteigen auf Ihre Taschen. Fahrgäste ohne Fahrkarte melden sich bitte beim Personal.",
    translation:
      "Good morning, ladies and gentlemen. The train to Munich departs in five minutes from platform seven. When getting off, please watch your bags. Passengers without a ticket should contact the staff.",
    questions: [
      {
        questionText: "Wohin fährt der Zug?",
        options: ["Berlin", "Hamburg", "München", "Köln"],
        correctOptionIndex: 2,
        explanation: "« Der Zug nach München » — to Munich.",
      },
      {
        questionText: "Von welchem Gleis fährt der Zug ab?",
        options: ["Gleis 5", "Gleis 6", "Gleis 7", "Gleis 8"],
        correctOptionIndex: 2,
        explanation: "« von Gleis sieben » = platform 7.",
      },
      {
        questionText: "Was sollen Fahrgäste ohne Fahrkarte tun?",
        options: [
          "Aussteigen",
          "Warten",
          "Sich beim Personal melden",
          "Ein Taxi nehmen",
        ],
        correctOptionIndex: 2,
        explanation: "« melden sich bitte beim Personal » — contact the staff.",
      },
    ],
  },
  Spanish: {
    title: "Anuncio en la estación — Station Announcement (A1)",
    script:
      "Buenos días, señores pasajeros. El tren con destino a Madrid sale en diez minutos del andén número cuatro. Por favor, tengan cuidado con sus maletas al bajar. Los pasajeros sin billete deben ir a la ventanilla.",
    translation:
      "Good morning, passengers. The train to Madrid leaves in ten minutes from platform four. Please be careful with your suitcases when getting off. Passengers without a ticket must go to the ticket window.",
    questions: [
      {
        questionText: "¿A qué ciudad va el tren?",
        options: ["Barcelona", "Madrid", "Sevilla", "Valencia"],
        correctOptionIndex: 1,
        explanation: "« con destino a Madrid » — to Madrid.",
      },
      {
        questionText: "¿De qué andén sale?",
        options: ["Andén 2", "Andén 3", "Andén 4", "Andén 5"],
        correctOptionIndex: 2,
        explanation: "« del andén número cuatro » = platform 4.",
      },
      {
        questionText: "¿Qué deben hacer los pasajeros sin billete?",
        options: [
          "Subir rápido",
          "Ir a la ventanilla",
          "Esperar fuera",
          "Llamar por teléfono",
        ],
        correctOptionIndex: 1,
        explanation: "« deben ir a la ventanilla » — go to the ticket window.",
      },
    ],
  },
  English: {
    title: "Airport Announcement — Departure Gate (IELTS)",
    script:
      "Good afternoon, passengers. Flight BA249 to New York is now boarding at gate twelve. Please have your passport and boarding pass ready. Passengers needing special assistance should approach the desk near the gate. The flight will close twenty minutes before departure.",
    translation:
      "Same as above — native-speed announcement. Listen twice, then answer without reading the script, exactly like the IELTS listening section.",
    questions: [
      {
        questionText: "Which flight is boarding?",
        options: ["BA249", "BA294", "BA429", "BA492"],
        correctOptionIndex: 0,
        explanation: "The announcement says Flight BA249.",
      },
      {
        questionText: "At which gate?",
        options: ["Gate 10", "Gate 12", "Gate 20", "Gate 22"],
        correctOptionIndex: 1,
        explanation: "« boarding at gate twelve ».",
      },
      {
        questionText: "What should passengers needing assistance do?",
        options: [
          "Call the airline",
          "Approach the desk near the gate",
          "Wait on the plane",
          "Go to gate 20",
        ],
        correctOptionIndex: 1,
        explanation: "« should approach the desk near the gate ».",
      },
    ],
  },
};

export function getFallbackListening(language: string): ListeningScript {
  return FALLBACKS[language] ?? FALLBACKS.Japanese;
}
