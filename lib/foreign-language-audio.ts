/**
 * Dual-engine exam audio for the Foreign Language Lab.
 *
 * Problem it solves: many Windows desktops have NO Japanese (or French/German…)
 * voice installed, so `speechSynthesis` silently does nothing and the student
 * hears zero audio. This module tries the high-quality device voice first and
 * automatically falls back to free web-voice audio (Google Translate TTS
 * chunks played sequentially), so audio ALWAYS plays in real life.
 */

export type TTSEngineChoice = "auto" | "device" | "web";
export type EngineUsed = "device" | "web";

export const GOOGLE_TTS_CODE: Record<string, string> = {
  Japanese: "ja",
  French: "fr",
  German: "de",
  Spanish: "es",
  English: "en",
};

export function googleTtsCode(language: string): string {
  return GOOGLE_TTS_CODE[language] || "en";
}

/** Split long passages into ≤ maxLen chunks at sentence boundaries. */
export function splitIntoChunks(text: string, maxLen = 180): string[] {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];
  const sentences = clean.match(/[^。．！？!?;；]+[。．！？!?;；]?/g) || [clean];
  const chunks: string[] = [];
  let current = "";
  for (const s of sentences) {
    const piece = s.trim();
    if (!piece) continue;
    if (piece.length > maxLen) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      // Hard-split very long sentences on commas/clauses
      const subs = piece.match(new RegExp(`.{1,${maxLen}}`, "g")) || [piece];
      for (const sub of subs) chunks.push(sub.trim());
      continue;
    }
    if ((current + " " + piece).trim().length > maxLen) {
      chunks.push(current.trim());
      current = piece;
    } else {
      current = (current + " " + piece).trim();
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(Boolean);
}

export function googleTTSUrl(text: string, langCode: string): string {
  return `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&q=${encodeURIComponent(text)}`;
}

export function getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }
    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing && existing.length > 0) {
      resolve(existing);
      return;
    }
    let done = false;
    const finish = (list: SpeechSynthesisVoice[]) => {
      if (!done) {
        done = true;
        resolve(list);
      }
    };
    synth.addEventListener?.("voiceschanged", () => finish(synth.getVoices()));
    // Safety: some browsers never fire the event
    setTimeout(() => finish(synth.getVoices()), 1200);
  });
}

export function findBestVoice(
  voices: SpeechSynthesisVoice[],
  locale: string
): SpeechSynthesisVoice | undefined {
  if (!voices.length) return undefined;
  const short = locale.slice(0, 2).toLowerCase();
  return (
    voices.find((v) => v.lang.toLowerCase() === locale.toLowerCase()) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(short)) ||
    undefined
  );
}

function estimateMs(text: string, rate: number): number {
  // ~14 chars/sec for latin, ~8/sec for CJK at rate 1
  const cjk = (text.match(/[\u3040-\u30ff\u4e00-\u9faf]/g) || []).length;
  const latin = Math.max(0, text.length - cjk);
  const secs = cjk / 8 + latin / 14;
  return Math.max(3500, (secs / Math.max(0.4, rate)) * 1000);
}

export interface PlayScriptOptions {
  text: string;
  locale: string;
  engine: TTSEngineChoice;
  voiceURI?: string;
  rate?: number;
  signal?: AbortSignal;
  onEngine?: (used: EngineUsed) => void;
  onProgress?: (fraction: number) => void;
}

function playViaDevice(
  text: string,
  locale: string,
  voice: SpeechSynthesisVoice | undefined,
  rate: number,
  signal: AbortSignal | undefined,
  onProgress: ((f: number) => void) | undefined
): Promise<void> {
  return new Promise((resolve, reject) => {
    const synth = window.speechSynthesis;
    if (!synth) {
      reject(new Error("no-synth"));
      return;
    }
    if (signal?.aborted) {
      reject(new DOMException("aborted", "AbortError"));
      return;
    }
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = locale;
    utter.rate = rate;
    if (voice) utter.voice = voice;

    const started = Date.now();
    const est = estimateMs(text, rate);
    const tick = window.setInterval(() => {
      onProgress?.(Math.min(0.99, (Date.now() - started) / est));
    }, 200);

    const cleanup = () => window.clearInterval(tick);
    // Hard watchdog: device voices sometimes never fire end/error
    const watchdog = window.setTimeout(() => {
      cleanup();
      try {
        synth.cancel();
      } catch {
        /* noop */
      }
      reject(new Error("device-timeout"));
    }, est + 20000);

    utter.onend = () => {
      window.clearTimeout(watchdog);
      cleanup();
      onProgress?.(1);
      resolve();
    };
    utter.onerror = (ev) => {
      window.clearTimeout(watchdog);
      cleanup();
      // 'interrupted' / 'canceled' happen on our own stop() — treat as abort
      if (signal?.aborted || ev.error === "interrupted" || ev.error === "canceled") {
        reject(new DOMException("aborted", "AbortError"));
      } else {
        reject(new Error(`device-error:${ev.error || "unknown"}`));
      }
    };
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(watchdog);
        cleanup();
        try {
          synth.cancel();
        } catch {
          /* noop */
        }
        reject(new DOMException("aborted", "AbortError"));
      },
      { once: true }
    );
    try {
      synth.speak(utter);
    } catch (e) {
      window.clearTimeout(watchdog);
      cleanup();
      reject(e instanceof Error ? e : new Error("device-speak-failed"));
    }
  });
}

function playSingleUrl(url: string, signal: AbortSignal | undefined, rate: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("aborted", "AbortError"));
      return;
    }
    const audio = new Audio(url);
    audio.playbackRate = rate;
    audio.preload = "auto";
    const onAbort = () => {
      audio.pause();
      audio.src = "";
      reject(new DOMException("aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    audio.onended = () => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    };
    audio.onerror = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new Error("web-audio-failed"));
    };
    void audio.play().catch((e: unknown) => {
      signal?.removeEventListener("abort", onAbort);
      reject(e instanceof Error ? e : new Error("web-play-blocked"));
    });
  });
}

async function playViaWeb(
  text: string,
  langCode: string,
  rate: number,
  signal: AbortSignal | undefined,
  onProgress: ((f: number) => void) | undefined
): Promise<void> {
  const chunks = splitIntoChunks(text);
  if (chunks.length === 0) throw new Error("empty-text");
  // Warm up first chunk so playback starts fast
  for (let i = 0; i < chunks.length; i++) {
    if (signal?.aborted) throw new DOMException("aborted", "AbortError");
    // Web TTS ignores rate server-side; emulate slow exam pace by clamping
    await playSingleUrl(googleTTSUrl(chunks[i], langCode), signal, Math.min(1, rate));
    onProgress?.((i + 1) / chunks.length);
  }
}

/**
 * Speak `text` in `locale`. Auto mode: device voice when a matching voice
 * exists, otherwise web voice. Device timeouts/errors auto-fall back to web.
 * Never resolves silently without audio — rejects loudly on real failure.
 */
export async function playScript(opts: PlayScriptOptions): Promise<EngineUsed> {
  const { text, locale, engine, voiceURI, rate = 0.95, signal, onEngine, onProgress } = opts;
  if (!text.trim()) throw new Error("empty-text");

  const wantDevice = engine === "device" || engine === "auto";
  const wantWeb = engine === "web" || engine === "auto";

  if (wantDevice && typeof window !== "undefined" && "speechSynthesis" in window) {
    const voices = await getVoicesAsync();
    const match = voiceURI
      ? voices.find((v) => v.voiceURI === voiceURI)
      : findBestVoice(voices, locale);
    // In auto mode with NO matching voice installed, skip straight to web
    // (this is the exact case where Japanese was silent before).
    if (match || engine === "device") {
      try {
        await playViaDevice(text, locale, match, rate, signal, onProgress);
        onEngine?.("device");
        return "device";
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") throw e;
        if (!wantWeb) throw e;
        // fall through to web voice
      }
    }
  }

  if (wantWeb) {
    await playViaWeb(text, googleTtsCode(localeToLanguage(locale)), rate, signal, onProgress);
    onEngine?.("web");
    return "web";
  }

  throw new Error("no-audio-engine");
}

function localeToLanguage(locale: string): string {
  const short = locale.slice(0, 2).toLowerCase();
  if (short === "ja") return "Japanese";
  if (short === "fr") return "French";
  if (short === "de") return "German";
  if (short === "es") return "Spanish";
  return "English";
}
