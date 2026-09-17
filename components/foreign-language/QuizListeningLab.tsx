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
  WEB_AUDIO_SOURCES,
  LISTENING_TOPICS,
  getFallbackListening,
} from "@/lib/foreign-language-listening";

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

/* ── Futuristic TTS hook ────────────────────────────── */

function useFuturisticTTS(locale: string) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState("");
  const [rate, setRate] = useState(0.95);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis?.getVoices() || [];
      setVoices(all);
      if (!voiceURI) {
        const match = all.find((v) => v.lang === locale) || all.find((v) => v.lang.startsWith(locale.slice(0, 2)));
        if (match) setVoiceURI(match.voiceURI);
      }
    };
    load();
    window.speechSynthesis?.addEventListener?.("voiceschanged", load);
    return () => {
      window.speechSynthesis?.removeEventListener?.("voiceschanged", load);
      window.speechSynthesis?.cancel();
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const stop = () => {
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setProgress(0);
    if (timer.current) clearInterval(timer.current);
  };

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) {
      alert("Your browser does not support AI voice playback. Try Chrome or Edge.");
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale;
    u.rate = rate;
    const v = voices.find((x) => x.voiceURI === voiceURI);
    if (v) u.voice = v;
    const estMs = Math.max(4000, (text.length / 14 / rate) * 1000);
    const started = Date.now();
    setPlaying(true);
    setProgress(0);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      const p = Math.min(99, ((Date.now() - started) / estMs) * 100);
      setProgress(p);
    }, 200);
    u.onend = () => {
      setPlaying(false);
      setProgress(100);
      if (timer.current) clearInterval(timer.current);
      setTimeout(() => setProgress(0), 2500);
    };
    u.onerror = () => {
      setPlaying(false);
      if (timer.current) clearInterval(timer.current);
    };
    window.speechSynthesis.speak(u);
  };

  const langVoices = useMemo(
    () => voices.filter((v) => v.lang.startsWith(locale.slice(0, 2))),
    [voices, locale]
  );

  return { voices: langVoices.length ? langVoices : voices, voiceURI, setVoiceURI, rate, setRate, playing, progress, speak, stop };
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
  const [webURL, setWebURL] = useState(WEB_AUDIO_SOURCES[0].url);
  const [customURL, setCustomURL] = useState("");
  const [script, setScript] = useState<ListeningScript | null>(null);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [hideScript, setHideScript] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [dictation, setDictation] = useState("");
  const [dictScore, setDictScore] = useState<number | null>(null);

  const locale = TTS_LOCALE[language] || "en-US";
  const tts = useFuturisticTTS(locale);
  const webAudioRef = useRef<HTMLAudioElement>(null);
  const [webPlaying, setWebPlaying] = useState(false);
  const [webRate, setWebRate] = useState(1);

  useEffect(() => {
    setQuiz([]);
    setQuizError("");
    setScript(null);
    setDictation("");
    setDictScore(null);
    tts.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, targetExam]);

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
      if (!Array.isArray(qs) || qs.length === 0) throw new Error("Empty quiz returned");
      setQuiz(qs);
    } catch (e: unknown) {
      setQuizError(e instanceof Error ? e.message : "Quiz generation failed. Check AI keys / backend and retry.");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleScript = async () => {
    setScriptLoading(true);
    try {
      const s = await generateListeningScript(language, targetExam, topic);
      if (s && s.script) {
        setScript(s);
      } else {
        setScript(getFallbackListening(language));
      }
    } catch {
      setScript(getFallbackListening(language));
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
    if (!el) return;
    if (webPlaying) {
      el.pause();
    } else {
      el.playbackRate = webRate;
      void el.play();
    }
  };

  const checkDictation = () => {
    if (!script) return;
    const ref = script.script.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean);
    const got = dictation.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean);
    if (ref.length === 0) return;
    const refSet = new Set(ref);
    const hits = got.filter((w) => refSet.has(w)).length;
    setDictScore(Math.round((hits / ref.length) * 100));
  };

  const effectiveWebURL = customURL.trim() || webURL;
  const tabs: { id: PracticeMode; label: string; icon: typeof BrainCircuit; hint: string }[] = [
    { id: "ai-quiz", label: "AI Quiz", icon: BrainCircuit, hint: `${targetExam} auto-set` },
    { id: "pdf-quiz", label: "From PDF", icon: FileText, hint: `${activeMaterialCount} active` },
    { id: "listening", label: "Listening", icon: AudioLines, hint: "exam audio" },
  ];

  return (
    <GlassCard className="p-5 md:p-6 h-full flex flex-col gap-4 overflow-hidden" glow="mint">
      {/* Header + mode dropdown-style segmented tabs */}
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

      {/* ── AI QUIZ ── */}
      {mode === "ai-quiz" && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 text-xs leading-relaxed text-muted-foreground">
            <span className="font-bold text-foreground flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> AI Quiz</span>
            Generates a fresh 10-question {targetExam} set for {language} — vocabulary, grammar & reading. No upload needed.
          </div>
          <button onClick={() => handleQuiz("ai")} disabled={quizLoading} className="btn-gradient w-full rounded-xl px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {quizLoading && quizSource === "ai" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Generate AI Quiz
          </button>
          {quizError && quizSource === "ai" && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{quizError}</p>}
          {quiz.length > 0 && quizSource === "ai" && <QuizRunner questions={quiz} onRetry={() => handleQuiz("ai")} />}
        </div>
      )}

      {/* ── FROM PDF ── */}
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

      {/* ── LISTENING LAB ── */}
      {mode === "listening" && (
        <div className="space-y-3">
          {/* Source + topic dropdowns */}
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
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Globe2 className="w-3 h-3" /> Pick a surfaced clip</span>
                <select value={webURL} onChange={(e) => setWebURL(e.target.value)} className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none">
                  {WEB_AUDIO_SOURCES.map((s) => <option key={s.url} value={s.url}>{s.label}</option>)}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Link2 className="w-3 h-3" /> …or paste any MP3 URL from the net</span>
                <input value={customURL} onChange={(e) => setCustomURL(e.target.value)} placeholder="https://…/jlpt-n5-listening.mp3" className="w-full glass-input rounded-xl px-3 py-2.5 text-sm outline-none" />
              </label>
            </div>
          )}

          <button onClick={handleScript} disabled={scriptLoading} className="btn-gradient w-full rounded-xl px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {scriptLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AudioLines className="w-4 h-4" />}
            {audioSource === "ai-voice" ? "Generate listening passage" : "Load listening set"}
          </button>

          {/* ── FUTURISTIC PLAYER ── */}
          {audioSource === "ai-voice" && script && (
            <div className="relative overflow-hidden rounded-2xl border border-fuchsia-400/25 bg-gradient-to-br from-violet-600/20 via-fuchsia-500/10 to-cyan-400/10 p-4">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
              <div className="relative space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => (tts.playing ? tts.stop() : tts.speak(script.script))}
                    className="w-12 h-12 rounded-full btn-gradient flex items-center justify-center shrink-0 shadow-lg"
                    title={tts.playing ? "Stop" : "Play AI voice"}
                  >
                    {tts.playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">◉ {script.title}</p>
                    <p className="text-[11px] text-muted-foreground">{language} • {targetExam} • AI exam voice ({locale})</p>
                  </div>
                  {/* live visualizer */}
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

                {/* progress */}
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 transition-all" style={{ width: `${tts.progress}%` }} />
                </div>

                {/* voice + speed dropdowns */}
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 flex items-center gap-1"><Volume2 className="w-3 h-3" /> AI Voice</span>
                    <select value={tts.voiceURI} onChange={(e) => tts.setVoiceURI(e.target.value)} className="w-full glass-input rounded-xl px-2.5 py-2 text-xs outline-none">
                      {tts.voices.slice(0, 12).map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
                      {tts.voices.length === 0 && <option value="">System default</option>}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 flex items-center gap-1"><Gauge className="w-3 h-3" /> Speed</span>
                    <select value={tts.rate} onChange={(e) => tts.setRate(Number(e.target.value))} className="w-full glass-input rounded-xl px-2.5 py-2 text-xs outline-none">
                      <option value={0.7}>0.7× slow (N5)</option>
                      <option value={0.95}>1.0× exam pace</option>
                      <option value={1.2}>1.2× fast</option>
                    </select>
                  </label>
                </div>

                {/* exam toggles */}
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

          {/* web audio player */}
          {audioSource === "web-surf" && (
            <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <button onClick={toggleWebAudio} className="w-12 h-12 rounded-full btn-gradient flex items-center justify-center shrink-0">
                  {webPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">◉ Net Audio — {language} listening</p>
                  <p className="text-[11px] text-muted-foreground truncate">{effectiveWebURL}</p>
                </div>
                <div className="flex items-end gap-[3px] h-8 shrink-0">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span key={i} className="waveform-bar" style={{ height: `${8 + ((i * 53) % 20)}px`, animationPlayState: webPlaying ? "running" : "paused", opacity: webPlaying ? 1 : 0.3 }} />
                  ))}
                </div>
              </div>
              <audio
                ref={webAudioRef}
                src={effectiveWebURL}
                controls
                className="w-full h-9 rounded-xl"
                onPlay={() => setWebPlaying(true)}
                onPause={() => setWebPlaying(false)}
                onEnded={() => setWebPlaying(false)}
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
              {!script && (
                <button onClick={handleScript} disabled={scriptLoading} className="w-full rounded-xl px-4 py-2 text-xs font-bold border border-border hover:bg-muted/40 flex items-center justify-center gap-2 disabled:opacity-50">
                  {scriptLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Generate matching comprehension questions
                </button>
              )}
            </div>
          )}

          {/* dictation */}
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

          {/* listening comprehension */}
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
