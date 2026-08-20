import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { generateQuiz, submitQuiz } from "@/lib/quiz-api";
import { ProctoredExamConsole } from "@/components/exam/ProctoredExamConsole";
import { acquireCameraStream, stopAllCameraStreams } from "@/lib/cameraManager";
import { preloadProctoringModel, runProctorDetection } from "@/lib/proctoringAiDetector";
import type { QuizGenerationResult, QuizSubmissionResult } from "@/types/quiz";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Brain,
  Camera,
  Maximize,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface QuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roadmapItemId?: string;
  subTopicName?: string;
  skillName?: string;
  onPassed?: () => void | Promise<void>;
}

export function QuizDialog({
  open,
  onOpenChange,
  roadmapItemId,
  subTopicName,
  skillName,
  onPassed,
}: QuizDialogProps) {
  const [phase, setPhase] = useState<"loading" | "ready" | "taking" | "submitting" | "error">("loading");
  const [gen, setGen] = useState<QuizGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  const [isQuizBlocked, setIsQuizBlocked] = useState(false);

  // Preload neural detection model as soon as modal intent is received
  useEffect(() => {
    if (open) {
      preloadProctoringModel();
    }
  }, [open]);

  // Load quiz upon opening
  useEffect(() => {
    if (!open) {
      setGen(null);
      setError(null);
      setResult(null);
      setIsQuizBlocked(false);
      setPhase("loading");
      return;
    }

    let active = true;

    async function loadQuiz() {
      setPhase("loading");
      setError(null);
      try {
        const data = await generateQuiz({ roadmapItemId, subTopicName, skillName });
        if (!active) return;
        setGen(data);
        setPhase("ready");
      } catch (err: any) {
        if (!active) return;
        setError(err.message || "Failed to generate assessment questions.");
        setPhase("error");
      }
    }

    loadQuiz();

    return () => {
      active = false;
      stopAllCameraStreams();
    };
  }, [open, roadmapItemId, subTopicName, skillName]);

  const handleSubmit = async (answers: Record<string, string>) => {
    if (!gen) return;
    setPhase("submitting");
    try {
      const answersPayload = Object.entries(answers).map(([questionId, answerText]) => ({
        questionId,
        answerText,
      }));
      const res = await submitQuiz({ attemptId: gen.attemptId, answers: answersPayload });
      setResult(res);
      if (res.passed) {
        onPassed?.();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit assessment answers.");
    }
  };

  const handleRetry = () => {
    setError(null);
    setResult(null);
    setIsQuizBlocked(false);
    setPhase("loading");
    generateQuiz({ roadmapItemId, subTopicName, skillName })
      .then((data) => {
        setGen(data);
        setPhase("ready");
      })
      .catch((err) => {
        setError(err.message || "Failed to generate assessment.");
        setPhase("error");
      });
  };

  const handleClose = () => {
    stopAllCameraStreams();
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    onOpenChange(false);
  };

  if (!open || typeof document === "undefined") return null;

  // 1. Loading Phase Overlay
  if (phase === "loading" || (!gen && phase !== "error")) {
    return createPortal(
      <div className="fixed inset-0 z-[999999] bg-[#0b1120] text-slate-100 flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="max-w-md w-full bg-[#111c34] border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
            <Brain className="h-8 w-8 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Initializing Assessment Environment</h3>
            <p className="text-xs text-slate-400">
              Generating questions & activating AI proctoring for {subTopicName}...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-blue-400 font-semibold pt-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Connecting Proctor Engine...</span>
          </div>
          <button
            onClick={handleClose}
            className="text-xs text-slate-500 hover:text-slate-300 transition pt-2"
          >
            Cancel
          </button>
        </div>
      </div>,
      document.body
    );
  }

  // 1.5 Ready Phase — Interactive Pre-Exam Verification & Rules Onboarding
  if (phase === "ready" && gen) {
    return createPortal(
      <PreExamCheckIn
        subTopicName={subTopicName}
        skillName={skillName}
        onStart={() => {
          document.documentElement.requestFullscreen?.().catch(() => {});
          setPhase("taking");
        }}
        onCancel={handleClose}
      />,
      document.body
    );
  }

  // 2. Error Phase
  if (phase === "error") {
    return createPortal(
      <div className="fixed inset-0 z-[999999] bg-[#0b1120] text-slate-100 flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="max-w-md w-full bg-[#111c34] border border-red-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Assessment Generation Failed</h3>
          <p className="text-xs text-slate-400">{error || "An unexpected error occurred while preparing your exam."}</p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleRetry}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Try Again
            </button>
            <button
              onClick={handleClose}
              className="px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // 3. Full-Screen Proctored Exam Environment
  if (!gen) return null;

  return createPortal(
    <ProctoredExamConsole
      quiz={gen}
      subTopicName={subTopicName}
      skillName={skillName}
      isBlocked={isQuizBlocked}
      onBlockStateChange={setIsQuizBlocked}
      onSubmit={handleSubmit}
      onClose={handleClose}
      submitting={phase === "submitting"}
      result={result}
      onRetry={handleRetry}
    />,
    document.body
  );
}

// ── Interactive Pre-Exam Verification & Rules Modal ─────────────────────────
interface PreExamCheckInProps {
  subTopicName: string;
  skillName: string;
  onStart: () => void;
  onCancel: () => void;
}

function PreExamCheckIn({ subTopicName, skillName, onStart, onCancel }: PreExamCheckInProps) {
  const [agreed, setAgreed] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<"loading" | "ok" | "no_face" | "phone" | "multi">("loading");
  const [detectedSummary, setDetectedSummary] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let active = true;
    let loopTimer: any = null;

    async function initCameraAndAI() {
      try {
        const camStream = await acquireCameraStream();
        if (!active) return;
        setStream(camStream);
        if (videoRef.current) {
          videoRef.current.srcObject = camStream;
          videoRef.current.play().catch(() => {});
        }

        // Run continuous real-time test inference on preview
        async function checkFrame() {
          if (!active) return;
          if (videoRef.current && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
            try {
              const preds = await runProctorDetection(videoRef.current);
              const classes = preds.map((p) => ({ class: p.class, score: p.score }));
              const summary = classes.map((c) => `${c.class} (${Math.round(c.score * 100)}%)`);
              setDetectedSummary(summary);

              const hasPhone = preds.some(
                (p) => p.class === "cell phone" && p.score >= 0.38
              );

              if (hasPhone) {
                setAiStatus("phone");
              } else {
                // Distinct person filtering with spatial center & overlap deduplication
                const personBoxes = preds
                  .filter((p) => p.class === "person" && p.score >= 0.20 && p.bbox)
                  .map((p) => ({
                    x: p.bbox[0],
                    y: p.bbox[1],
                    w: p.bbox[2],
                    h: p.bbox[3],
                    centerX: p.bbox[0] + p.bbox[2] / 2,
                    centerY: p.bbox[1] + p.bbox[3] / 2,
                    area: p.bbox[2] * p.bbox[3],
                    score: p.score,
                  }))
                  .filter((b) => b.area >= 1500)
                  .sort((a, b) => b.score - a.score);

                let distinctCount = 0;
                if (personBoxes.length === 0) {
                  const anyP = preds.some((p) => p.class === "person" && p.score >= 0.18);
                  distinctCount = anyP ? 1 : 0;
                } else if (personBoxes.length === 1) {
                  distinctCount = 1;
                } else {
                  const kept: typeof personBoxes = [];
                  for (const box of personBoxes) {
                    let isDuplicateOfSamePerson = false;
                    for (const k of kept) {
                      const x1 = Math.max(box.x, k.x);
                      const y1 = Math.max(box.y, k.y);
                      const x2 = Math.min(box.x + box.w, k.x + k.w);
                      const y2 = Math.min(box.y + box.h, k.y + k.h);

                      const interW = Math.max(0, x2 - x1);
                      const interH = Math.max(0, y2 - y1);
                      const interArea = interW * interH;
                      const smallerArea = Math.min(box.area, k.area);
                      const overlapRatio = smallerArea > 0 ? interArea / smallerArea : 0;

                      const centerDistX = Math.abs(box.centerX - k.centerX);
                      const minW = Math.min(box.w, k.w);

                      if (overlapRatio > 0.30 || centerDistX < minW * 0.35) {
                        isDuplicateOfSamePerson = true;
                        break;
                      }
                    }
                    if (!isDuplicateOfSamePerson) kept.push(box);
                  }
                  distinctCount = kept.length;
                }

                if (distinctCount === 0) {
                  setAiStatus("no_face");
                } else if (distinctCount > 1) {
                  setAiStatus("multi");
                } else {
                  setAiStatus("ok");
                }
              }
            } catch {}
          }
          if (active) {
            loopTimer = setTimeout(checkFrame, 500);
          }
        }

        loopTimer = setTimeout(checkFrame, 600);
      } catch (err: any) {
        if (!active) return;
        setCameraError(err.message || "Failed to access webcam");
      }
    }

    initCameraAndAI();

    return () => {
      active = false;
      if (loopTimer) clearTimeout(loopTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[999999] bg-[#0b1120]/95 backdrop-blur-xl text-slate-100 flex flex-col items-center justify-center p-4 md:p-6 select-none overflow-y-auto font-sans">
      <div className="max-w-3xl w-full bg-[#111c34] border border-slate-700/60 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
        {/* Header Title */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Proctored Assessment Check-In</h2>
              <p className="text-xs text-slate-400">
                {skillName} • {subTopicName}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold rounded-full">
            AI Monitored
          </span>
        </div>

        {/* Two-Column Layout: Left Live Camera AI Preview / Right Rules Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Column: Live AI Camera Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Live Camera & AI Feed</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                  aiStatus === "ok"
                    ? "bg-green-500/15 text-green-400 border border-green-500/30"
                    : aiStatus === "phone"
                    ? "bg-red-500/15 text-red-400 border border-red-500/30"
                    : aiStatus === "multi"
                    ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                    : aiStatus === "no_face"
                    ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                    : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    aiStatus === "ok"
                      ? "bg-green-400 animate-pulse"
                      : aiStatus === "phone"
                      ? "bg-red-400"
                      : aiStatus === "multi"
                      ? "bg-orange-400"
                      : aiStatus === "no_face"
                      ? "bg-yellow-400"
                      : "bg-blue-400"
                  }`}
                />
                {aiStatus === "ok"
                  ? "Identity Verified"
                  : aiStatus === "phone"
                  ? "Phone in Frame!"
                  : aiStatus === "multi"
                  ? "Multiple People"
                  : aiStatus === "no_face"
                  ? "No Face Detected"
                  : "AI Initializing..."}
              </span>
            </div>

            <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/80 shadow-inner flex items-center justify-center">
              {stream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
              ) : cameraError ? (
                <div className="p-4 text-center space-y-2">
                  <Camera className="h-8 w-8 text-red-400 mx-auto" />
                  <p className="text-xs text-red-300">{cameraError}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                  <span>Accessing camera...</span>
                </div>
              )}

              {/* Status Banner inside Video */}
              {stream && (
                <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] text-slate-300 flex items-center justify-between">
                  <span>Inference: COCO-SSD</span>
                  <span className="truncate max-w-[140px] text-slate-400 font-mono">
                    {detectedSummary.length > 0 ? detectedSummary.slice(0, 2).join(", ") : "Scanning..."}
                  </span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Ensure your face is well-lit and directly in front of the camera before starting.
            </p>
          </div>

          {/* Right Column: Rules Checklist & Terms */}
          <div className="space-y-3.5">
            <span className="text-xs font-semibold text-slate-300">Exam Integrity Policy</span>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Full-Screen Lockdown:</strong> Leaving fullscreen records a strike.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">No External Devices:</strong> AI camera continuously checks for phones.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Continuous Presence:</strong> Stay in front of the camera at all times.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <CheckCircle2 className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">3-Strike Rule:</strong> 3 violations lock the exam and notify your mentor.
                </span>
              </div>
            </div>

            {/* Agreement Checkbox */}
            <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 accent-blue-600"
              />
              <span className="text-xs text-slate-300 font-medium">
                I agree to adhere to all exam integrity guidelines
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </button>

          <button
            onClick={onStart}
            disabled={!agreed || !stream}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-500/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Maximize className="h-4 w-4" />
            Enter Fullscreen & Begin Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
