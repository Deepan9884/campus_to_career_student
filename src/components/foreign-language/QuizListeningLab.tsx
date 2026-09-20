import { useEffect, useMemo, useRef, useState } from "react";
import {
  BrainCircuit,
  FileText,
  AudioLines,
  Play,
  Pause,
  RotateCcw,
  Loader2,
  Eye,
  EyeOff,
  Languages,
  CheckCircle2,
  XCircle,
  Trophy,
  Globe2,
  Link2,
  Sparkles,
  Volume2,
  Gauge,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import {
  QuizQuestion,
  ListeningScript,
  generateLanguageQuiz,
  generateListeningScript,
} from "@/lib/foreign-language-api";
import {
  TTS_LOCALE,
  LISTENING_TOPICS,
  EXAM_RESOURCE_LIST,
  getFallbackListening,
} from "@/lib/foreign-language-listening";
import {
  TTSEngineChoice,
  EngineUsed,
  getVoicesAsync,
  findBestVoice,
  playScript,
} from "@/lib/foreign-language-audio";

interface QuizListeningLabProps {
  language: string;
  targetExam: string;
  activeMaterialCount: number;
}

type PracticeMode = "ai-quiz" | "pdf-quiz" | "listening";
type AudioSource = "ai-voice" | "web-surf";

/* ── Shared quiz runner ─────────────────────────────── */

function QuizRunner({
  questions,
  accent = "violet",
  onRetry,
}: {
  questions: QuizQuestion[];
  accent?: "violet" | "cyan";
  onRetry?: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setIdx(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
  }, [questions]);

  if (questions.length === 0) return null;
  const q = questions[idx];
  const ring = accent === "cyan" ? "focus:ring-cyan-400" : "focus:ring-primary";

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="text-center py-6 space-y-3">
        <Trophy className={`w-12 h-12 mx-auto ${pct >= 70 ? "text-amber-300" : "text-muted-foreground"}`} />
        <p className="text-2xl font-black">{score} / {questions.length}</p>
        <p className="text-sm text-muted-foreground">
          {pct >= 80 ? "Exam-ready! Outstanding." : pct >= 50 ? "Good — review the explanations and retry." : "Keep practising — replay the audio and retry."}
        </p>
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => { setIdx(0); setPicked(null); setScore(0); setFinished(false); }} className="btn-gradient rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Retry
          </button>
          {onRetry && (
            <button onClick={onRetry} className="rounded-xl px-4 py-2 text-sm font-bold border border-border hover:bg-muted/40 transition-colors">
              New set
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
        <span>Question {idx + 1} / {questions.length}</span>
        <span>Score: {score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-400 transition-all"
          style={{ width: `${((idx + (picked !== null ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>
      <p className="font-semibold text-[15px] leading-relaxed">{q.questionText}</p>
      <div className="grid gap-2">
        {q.options.map((opt, i) => {
          const isCorrect = picked !== null && i === q.correctOptionIndex;
          const isWrong = picked === i && i !== q.correctOptionIndex;
          return (
            <button
              key={i}
              disabled={picked !== null}
              onClick={() => {
                setPicked(i);
                if (i === q.correctOptionIndex) setScore((s) => s + 1);
              }}
              className={`text-left rounded-xl border px-3.5 py-2.5 text-sm transition-all outline-none ${isCorrect
                ? "border-emerald-400/60 bg-emerald-400/10 font-semibold"
                : isWrong
                  ? "border-red-400/60 bg-red-400/10"
                  : "border-border/70 bg-muted/20 hover:border-primary/50 hover:bg-primary/5"
                } ${picked === null ? ring : ""}`}
            >
              <span className="font-bold mr-2 opacity-60">{String.fromCharCode(65 + i)}.</span>
              {opt}
              {isCorrect && <CheckCircle2 className="inline w-4 h-4 ml-2 text-emerald-400" />}
              {isWrong && <XCircle className="inline w-4 h-4 ml-2 text-red-400" />}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-xs leading-relaxed animate-slide-up-fade">
          <span className="font-bold">Why: </span>{q.explanation}
          <div className="mt-2.5 flex justify-end">
            <button
              onClick={() => (idx + 1 >= questions.length ? setFinished(true) : (setIdx(idx + 1), setPicked(null)))}
              className="btn-gradient rounded-xl px-4 py-2 text-xs font-bold"
            >
              {idx + 1 >= questions.length ? "See result" : "Next question →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Dual-engine exam audio hook (device voice → web voice) ── */

function useExamAudio(locale: string) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState("");
  const [engine, setEngine] = useState<TTSEngineChoice>("auto");
  const [engineUsed, setEngineUsed] = useState<EngineUsed | null>(null);
  const [rate, setRate] = useState(0.95);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioError, setAudioError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let mounted = true;
    void getVoicesAsync().then((all) => {
      if (!mounted) return;
      setVoices(all);
      const short = locale.slice(0, 2).toLowerCase();
      const best = findBestVoice(all, locale);
      if (best && best.lang.toLowerCase().startsWith(short)) {
        setVoiceURI((prev) => prev || best.voiceURI);
      } else {
        setVoiceURI(""); // Cloud HD Voice by default
      }
    });
    return () => {
      mounted = false;
    };
  }, [locale]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* noop */
      }
    };
  }, []);

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* noop */
    }
    setPlaying(false);
    setProgress(0);
  };

  const speak = async (text: string) => {
    stop();
    setAudioError("");
    setPlaying(true);
    setProgress(0);
    setEngineUsed(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const used = await playScript({
        text,
        locale,
        engine,
        voiceURI: voiceURI || undefined,
        rate,
        signal: controller.signal,
        onEngine: (u) => setEngineUsed(u),
        onProgress: (f) => setProgress(Math.round(f * 100)),
      });
      setEngineUsed(used);
      setProgress(100);
      window.setTimeout(() => setProgress((p) => (p === 100 ? 0 : p)), 2500);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setProgress(0);
      } else {
        setAudioError(
          e instanceof Error
            ? `Audio playback notice: ${e.message}. Tap Play to retry.`
            : "Audio failed to start. Tap Play to retry."
        );
        setProgress(0);
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setPlaying(false);
    }
  };

  const langVoices = useMemo(() => {
    const short = locale.slice(0, 2).toLowerCase();
    return voices.filter((v) => v.lang.toLowerCase().startsWith(short));
  }, [voices, locale]);

  const hasNativeVoice = useMemo(
    () => findBestVoice(voices, locale) !== undefined,
    [voices, locale]
  );

  return {
    voices: langVoices,
    voiceURI,
    setVoiceURI,
    engine,
    setEngine,
    engineUsed,
    rate,
    setRate,
    playing,
    progress,
    audioError,
    hasNativeVoice,
    speak,
    stop,
  };
}

/* ── Main lab ───────────────────────────────────────── */

export function QuizListeningLab({ language, targetExam, activeMaterialCount }: QuizListeningLabProps) {
  const [mode, setMode] = useState<PracticeMode>("ai-quiz");
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [quizSource, setQuizSource] = useState<"ai" | "pdf">("ai");

  const [audioSource, setAudioSource] = useState<AudioSource>("ai-voice");
  const [topic, setTopic] = useState(LISTENING_TOPICS[0]);
  const [customURL, setCustomURL] = useState("");
  const [script, setScript] = useState<ListeningScript | null>(null);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [hideScript, setHideScript] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [dictation, setDictation] = useState("");
  const [dictScore, setDictScore] = useState<number | null>(null);

  const locale = TTS_LOCALE[language] || "en-US";
  const tts = useExamAudio(locale);
  const webAudioRef = useRef<HTMLAudioElement>(null);
  const [webPlaying, setWebPlaying] = useState(false);
  const [webRate, setWebRate] = useState(1);

  // Stop all audio + reset when context changes so clips never bleed across topics
  useEffect(() => {
    setQuiz([]);
    setQuizError("");
    setScript(null);
    setDictation("");
    setDictScore(null);
    setCustomURL("");
    tts.stop();
    webAudioRef.current?.pause();
    setWebPlaying(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, targetExam]);

  useEffect(() => {
    tts.stop();
    setDictation("");
    setDictScore(null);
    setHideScript(true);
    setShowTranslation(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  const handleQuiz = async (source: "ai" | "pdf") => {
    if (source === "pdf" && activeMaterialCount === 0) {
      setQuizError("Upload & activate at least one PDF/DOCX in the Study Vault first — or use AI Quiz instead.");
      return;
    }
    setQuizLoading(true);
    setQuizError("");
    setQuizSource(source);
    try {
      const qs = await generateLanguageQuiz(language, targetExam);
      if (!Array.isArray(qs) || qs.length === 0) throw new Error("Quiz service returned no questions.");
      setQuiz(qs);
    } catch (e: unknown) {
      setQuizError(
        e instanceof Error
          ? `${e.message} — tap “Generate” again to retry.`
          : "Quiz generation failed. Tap “Generate” again to retry."
      );
    } finally {
      setQuizLoading(false);
    }
  };

  const handleScript = async () => {
    tts.stop();
    setScriptLoading(true);
    try {
      const s = await generateListeningScript(language, targetExam, topic);
      if (s && typeof s.script === "string" && s.script.trim().length >= 10) {
        setScript(s);
      } else {
        setScript(getFallbackListening(language, topic));
      }
    } catch {
      // Offline / backend unreachable → distinct local script for THIS topic
      setScript(getFallbackListening(language, topic));
    } finally {
      setScriptLoading(false);
    }
    setDictation("");
    setDictScore(null);
    setHideScript(true);
    setShowTranslation(false);
  };

  const toggleWebAudio = () => {
    const el = webAudioRef.current;
    if (!el || !customURL.trim()) return;
    if (webPlaying) {
      el.pause();
    } else {
      el.playbackRate = webRate;
      void el.play().catch(() => setWebPlaying(false));
    }
  };

  const checkDictation = () => {
    if (!script) return;
    const norm = (s: string) =>
      s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean);
    const ref = norm(script.script);
    const got = norm(dictation);
    if (ref.length === 0) return;
    const refSet = new Set(ref);
    const hits = got.filter((w) => refSet.has(w)).length;
    setDictScore(Math.round((hits / ref.length) * 100));
  };

  const resources = EXAM_RESOURCE_LIST.filter((r) => r.language === language);
  const tabs: { id: PracticeMode; label: string; icon: typeof BrainCircuit; hint: string }[] = [
    { id: "ai-quiz", label: "AI Quiz", icon: BrainCircuit, hint: `${targetExam} auto-set` },
    { id: "pdf-quiz", label: "From PDF", icon: FileText, hint: `${activeMaterialCount} active` },
    { id: "listening", label: "Listening", icon: AudioLines, hint: "exam audio" },
  ];

  return (
    <GlassCard className="p-5 md:p-6 h-full flex flex-col gap-4 overflow-hidden" glow="mint">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-emerald-400/15 border border-emerald-300/30 flex items-center justify-center shrink-0">
          <BrainCircuit className="w-5 h-5 text-emerald-300" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-base leading-tight">Quiz & Listening Practice</h3>
          <p className="text-xs text-muted-foreground">{language} • {targetExam} exam mode</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl border border-border/60 bg-muted/20">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            className={`rounded-xl px-2 py-2.5 text-center transition-all ${mode === t.id
              ? "btn-gradient shadow-lg"
              : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
          >
            <t.icon className="w-4 h-4 mx-auto mb-1" />
            <p className="text-xs font-bold leading-none">{t.label}</p>
            <p className={`text-[10px] mt-1 leading-none ${mode === t.id ? "text-white/80" : "opacity-70"}`}>{t.hint}</p>
          </button>
        ))}
      </div>

      {mode === "ai-quiz" && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 text-xs leading-relaxed text-muted-foreground">
            <span className="font-bold text-foreground flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> AI Quiz</span>
            Generates a fresh 10-question {targetExam} set for {language} — vocabulary, grammar & reading. Every tap builds a new rotated set.
          </div>
          <button onClick={() => handleQuiz("ai")} disabled={quizLoading} className="btn-gradient w-full rounded-xl px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {quizLoading && quizSource === "ai" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Generate AI Quiz
          </button>
          {quizError && quizSource === "ai" && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{quizError}</p>}
          {quiz.length > 0 && quizSource === "ai" && <QuizRunner questions={quiz} onRetry={() => handleQuiz("ai")} />}
        </div>
      )}

      {mode === "pdf-quiz" && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 text-xs leading-relaxed text-muted-foreground">
            <span className="font-bold text-foreground flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Quiz from your PDF</span>
            Questions are built from the <b>{activeMaterialCount} active vault file(s)</b> — exactly like questions set from your own notes.
          </div>
          <button onClick={() => handleQuiz("pdf")} disabled={quizLoading} className="btn-gradient w-full rounded-xl px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {quizLoading && quizSource === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Generate Quiz from my PDFs
          </button>
          {quizError && quizSource === "pdf" && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{quizError}</p>}
          {quiz.length > 0 && quizSource === "pdf" && <QuizRunner questions={quiz} accent="cyan" onRetry={() => handleQuiz("pdf")} />}
        </div>
      )}

      {mode === "listening" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <label className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Audio source</span>
              <select value={audioSource} onChange={(e) => setAudioSource(e.target.value as AudioSource)} className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none">
                <option value="ai-voice">🤖 AI Voice (exam TTS)</option>
                <option value="web-surf">🌐 Surf from Net (MP3)</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Topic</span>
              <select value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none">
                {LISTENING_TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>

          {audioSource === "web-surf" && (
            <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/5 p-3.5 space-y-2.5">
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Link2 className="w-3 h-3" /> Paste any MP3 URL from the net</span>
                <input value={customURL} onChange={(e) => setCustomURL(e.target.value)} placeholder="https://…/jlpt-n5-listening.mp3" className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none" />
              </label>
              {resources.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Globe2 className="w-3 h-3" /> Real {language} listening sites — surf & copy an MP3</p>
                  {resources.map((r) => (
                    <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs rounded-xl border border-border/60 bg-muted/20 px-3 py-2 hover:border-primary/50 transition-colors">
                      <span className="flex-1 truncate font-medium">{r.label}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          <button onClick={handleScript} disabled={scriptLoading} className="btn-gradient w-full rounded-xl px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {scriptLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AudioLines className="w-4 h-4" />}
            {audioSource === "ai-voice" ? `Generate “${topic}” passage` : "Load listening set"}
          </button>

          {audioSource === "ai-voice" && script && (
            <div className="relative overflow-hidden rounded-2xl border border-fuchsia-400/25 bg-gradient-to-br from-violet-600/20 via-fuchsia-500/10 to-cyan-400/10 p-4">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
              <div className="relative space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => (tts.playing ? tts.stop() : void tts.speak(script.script))}
                    className="w-12 h-12 rounded-full btn-gradient flex items-center justify-center shrink-0 shadow-lg"
                    title={tts.playing ? "Stop" : "Play exam audio"}
                  >
                    {tts.playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">◉ {script.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {language} • {targetExam} • {tts.engineUsed === "web" ? "🤖 Cloud HD voice" : tts.engineUsed === "device" ? "🔊 Device voice" : `AI exam voice (${locale})`}
                      {!tts.hasNativeVoice ? " • Cloud HD voice active" : ""}
                    </p>
                  </div>
                  <div className="flex items-end gap-[3px] h-8 shrink-0">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <span
                        key={i}
                        className="waveform-bar"
                        style={{
                          height: `${8 + ((i * 37) % 22)}px`,
                          animationPlayState: tts.playing ? "running" : "paused",
                          opacity: tts.playing ? 1 : 0.3,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 transition-all" style={{ width: `${tts.progress}%` }} />
                </div>

                {tts.audioError && (
                  <p className="text-[11px] text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3 py-2 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {tts.audioError}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <label className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Engine</span>
                    <select value={tts.engine} onChange={(e) => tts.setEngine(e.target.value as TTSEngineChoice)} className="w-full glass-input rounded-xl px-2 py-2 text-xs outline-none">
                      <option value="auto">Auto (Cloud HD / Device)</option>
                      <option value="web">Cloud HD voice</option>
                      <option value="device">Device voice</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 flex items-center gap-1"><Volume2 className="w-3 h-3" /> Voice</span>
                    <select value={tts.voiceURI} onChange={(e) => tts.setVoiceURI(e.target.value)} className="w-full glass-input rounded-xl px-2 py-2 text-xs outline-none">
                      <option value="">🤖 AI Exam Voice (Cloud HD - Recommended)</option>
                      {tts.voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>🔊 Device: {v.name} ({v.lang})</option>)}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 flex items-center gap-1"><Gauge className="w-3 h-3" /> Speed</span>
                    <select value={tts.rate} onChange={(e) => tts.setRate(Number(e.target.value))} className="w-full glass-input rounded-xl px-2 py-2 text-xs outline-none">
                      <option value={0.7}>0.7× slow</option>
                      <option value={0.95}>1.0× exam</option>
                      <option value={1.2}>1.2× fast</option>
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setHideScript(!hideScript)} className="text-[11px] font-bold px-3 py-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 flex items-center gap-1.5">
                    {hideScript ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {hideScript ? "Reveal script" : "Hide script (exam mode)"}
                  </button>
                  <button onClick={() => setShowTranslation(!showTranslation)} className="text-[11px] font-bold px-3 py-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 flex items-center gap-1.5">
                    <Languages className="w-3 h-3" /> {showTranslation ? "Hide" : "Show"} translation
                  </button>
                </div>

                {!hideScript && (
                  <p className="text-sm leading-relaxed rounded-xl bg-black/25 border border-white/10 p-3 animate-slide-up-fade">{script.script}</p>
                )}
                {showTranslation && (
                  <p className="text-xs leading-relaxed rounded-xl bg-black/25 border border-white/10 p-3 text-muted-foreground animate-slide-up-fade">{script.translation}</p>
                )}
              </div>
            </div>
          )}

          {audioSource === "web-surf" && (
            <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <button onClick={toggleWebAudio} disabled={!customURL.trim()} className="w-12 h-12 rounded-full btn-gradient flex items-center justify-center shrink-0 disabled:opacity-40">
                  {webPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">◉ Net Audio — {language} listening</p>
                  <p className="text-[11px] text-muted-foreground truncate">{customURL.trim() || "Paste an MP3 URL above, then press play"}</p>
                </div>
                <div className="flex items-end gap-[3px] h-8 shrink-0">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span key={i} className="waveform-bar" style={{ height: `${8 + ((i * 53) % 20)}px`, animationPlayState: webPlaying ? "running" : "paused", opacity: webPlaying ? 1 : 0.3 }} />
                  ))}
                </div>
              </div>
              {customURL.trim() && (
                <>
                  <audio
                    ref={webAudioRef}
                    src={customURL.trim()}
                    controls
                    className="w-full h-9 rounded-xl"
                    onPlay={() => setWebPlaying(true)}
                    onPause={() => setWebPlaying(false)}
                    onEnded={() => setWebPlaying(false)}
                    onError={() => setWebPlaying(false)}
                  />
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold">Speed:</span>
                    {[0.75, 1, 1.25, 1.5].map((r) => (
                      <button key={r} onClick={() => { setWebRate(r); if (webAudioRef.current) webAudioRef.current.playbackRate = r; }}
                        className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${webRate === r ? "btn-gradient border-transparent" : "border-border/60 hover:bg-muted/40"}`}>
                        {r}×
                      </button>
                    ))}
                  </div>
                </>
              )}
              {!script && (
                <button onClick={handleScript} disabled={scriptLoading} className="w-full rounded-xl px-4 py-2 text-xs font-bold border border-border hover:bg-muted/40 flex items-center justify-center gap-2 disabled:opacity-50">
                  {scriptLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Generate matching comprehension questions
                </button>
              )}
            </div>
          )}

          {script && (
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-2">
              <p className="text-xs font-bold">✍️ Dictation drill <span className="font-normal text-muted-foreground">— play (script hidden), type what you hear</span></p>
              <textarea value={dictation} onChange={(e) => setDictation(e.target.value)} rows={2} placeholder={`Type the ${language} you hear…`} className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none resize-none" />
              <div className="flex items-center gap-2">
                <button onClick={checkDictation} className="rounded-xl px-3.5 py-1.5 text-xs font-bold border border-border hover:bg-muted/40">Check dictation</button>
                {dictScore !== null && (
                  <span className={`text-xs font-bold ${dictScore >= 70 ? "text-emerald-400" : "text-amber-300"}`}>{dictScore}% words match</span>
                )}
              </div>
            </div>
          )}

          {script && script.questions?.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-muted/10 p-3.5">
              <p className="text-xs font-bold mb-2.5">🎧 Listening comprehension — answer after listening twice (exam rule)</p>
              <QuizRunner questions={script.questions} accent="cyan" onRetry={handleScript} />
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
