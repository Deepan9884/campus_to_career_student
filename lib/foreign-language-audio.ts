import { API_BASE, getAccessToken } from "@/lib/api";

/**
 * Dual-engine exam audio for the Foreign Language Lab.
 *
 * Architecture:
 * 1. Primary Engine: Server-streamed Cloud HD Audio (/api/foreign-language/tts)
 *    - Concatenates full MP3 audio stream server-side with zero Referer/CORS blocks.
 *    - Resolves 100% reliably in Brave, Chrome, Safari, Firefox on Vercel and localhost.
 * 2. Secondary Engine: Device Voice (SpeechSynthesis)
 *    - Strictly guarded: ONLY used if the device voice actually matches the target language
 *      (never sends Japanese/German/French text to English "Microsoft David").
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

export function localeToLanguage(locale: string): string {
  const short = locale.slice(0, 2).toLowerCase();
  if (short === "ja") return "Japanese";
  if (short === "fr") return "French";
  if (short === "de") return "German";
  if (short === "es") return "Spanish";
  return "English";
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

/**
 * Fetch high-definition synthesized MP3 audio from backend.
 * Streams full continuous MPEG audio with zero CORS or Referer issues.
 */
export async function fetchTtsAudioBlob(
  text: string,
  language: string,
  signal?: AbortSignal
): Promise<Blob> {
  const clean = String(text || "").trim();
  if (!clean) throw new Error("Empty text provided for audio synthesis");

  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const endpoint = `${API_BASE}/foreign-language/tts`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ text: clean, language }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`TTS server returned HTTP ${res.status}`);
  }

  const blob = await res.blob();
  if (!blob || blob.size === 0) {
    throw new Error("TTS server returned empty audio stream");
  }

  return blob;
}

function playBlobAudio(
  blob: Blob,
  rate: number,
  signal: AbortSignal | undefined,
  onProgress: ((f: number) => void) | undefined
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("aborted", "AbortError"));
      return;
    }

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.playbackRate = Math.max(0.5, Math.min(2.0, rate));
    audio.preload = "auto";

    let cleaned = false;
    const cleanup = () => {
      if (!cleaned) {
        cleaned = true;
        try {
          audio.pause();
          URL.revokeObjectURL(url);
        } catch {
          /* noop */
        }
      }
    };

    const onAbort = () => {
      cleanup();
      reject(new DOMException("aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    audio.ontimeupdate = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        onProgress?.(Math.min(0.99, audio.currentTime / audio.duration));
      }
    };

    audio.onended = () => {
      signal?.removeEventListener("abort", onAbort);
      cleanup();
      onProgress?.(1);
      resolve();
    };

    audio.onerror = () => {
      signal?.removeEventListener("abort", onAbort);
      cleanup();
      reject(new Error("Audio playback failed on element"));
    };

    audio.play().catch((err: unknown) => {
      signal?.removeEventListener("abort", onAbort);
      cleanup();
      reject(err instanceof Error ? err : new Error("Playback blocked by browser"));
    });
  });
}

/**
 * Play foreign language listening script.
 * 
 * 1. Checks if user explicitly picked a matching native device voice.
 * 2. Otherwise streams high-fidelity Cloud HD audio from the backend.
 * 3. Never attempts to pass Japanese or non-English text to English voices like Microsoft David.
 */
export async function playScript(opts: PlayScriptOptions): Promise<EngineUsed> {
  const { text, locale, engine, voiceURI, rate = 0.95, signal, onEngine, onProgress } = opts;
  const clean = String(text || "").trim();
  if (!clean) throw new Error("Empty text");

  const language = localeToLanguage(locale);
  const shortLang = locale.slice(0, 2).toLowerCase();

  // If user explicitly picked a device voice, verify it matches the target language
  if (engine === "device" && typeof window !== "undefined" && "speechSynthesis" in window) {
    const voices = await getVoicesAsync();
    const match = voiceURI
      ? voices.find((v) => v.voiceURI === voiceURI)
      : findBestVoice(voices, locale);

    // Only allow device voice if it actually matches the language
    const isLangMatch = match && match.lang.toLowerCase().startsWith(shortLang);
    if (isLangMatch) {
      try {
        await playViaDevice(clean, locale, match, rate, signal, onProgress);
        onEngine?.("device");
        return "device";
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") throw e;
        // fallback to cloud
      }
    }
  }

  // Primary: Stream real Cloud HD audio from backend
  try {
    const blob = await fetchTtsAudioBlob(clean, language, signal);
    await playBlobAudio(blob, rate, signal, onProgress);
    onEngine?.("web");
    return "web";
  } catch (cloudErr) {
    if (cloudErr instanceof DOMException && cloudErr.name === "AbortError") {
      throw cloudErr;
    }

    // Fallback: If cloud fails (e.g. offline) and a matching native device voice exists, try it
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const voices = await getVoicesAsync();
      const match = findBestVoice(voices, locale);
      if (match && match.lang.toLowerCase().startsWith(shortLang)) {
        try {
          await playViaDevice(clean, locale, match, rate, signal, onProgress);
          onEngine?.("device");
          return "device";
        } catch (devErr) {
          if (devErr instanceof DOMException && devErr.name === "AbortError") throw devErr;
        }
      }
    }

    throw cloudErr;
  }
}

