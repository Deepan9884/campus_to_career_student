import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { generateQuiz, submitQuiz } from "@/lib/quiz-api";
import { ProctoredExamConsole } from "@/components/exam/ProctoredExamConsole";
import { ProctoringBlockLockoutModal } from "@/components/proctoring/ProctoringBlockLockoutModal";
import { acquireCameraStream, stopAllCameraStreams } from "@/lib/cameraManager";
import { runProctorDetection, preloadProctoringModel } from "@/lib/proctoringAiDetector";
import type { QuizGenerationResult, QuizSubmissionResult } from "@/types/quiz";
import { cn } from "@/lib/utils";
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Brain,
  Maximize,
  Camera,
  CameraOff,
  Smartphone,
  UserCheck,
  Eye,
  Monitor,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface QuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roadmapItemId?: string;
  subTopicName?: string;
  skillName?: string;
  customQuiz?: QuizGenerationResult;
  onCustomSubmit?: (answers: Record<string, string>) => Promise<QuizSubmissionResult>;
  onPassed?: () => void | Promise<void>;
}

export function QuizDialog({
  open,
  onOpenChange,
  roadmapItemId,
  subTopicName,
  skillName,
  customQuiz,
  onCustomSubmit,
  onPassed,
}: QuizDialogProps) {
  const [phase, setPhase] = useState<"loading" | "ready" | "taking" | "submitting" | "error">("loading");
  const [gen, setGen] = useState<QuizGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  const [isQuizBlocked, setIsQuizBlocked] = useState(false);
  const [blockInfo, setBlockInfo] = useState<{
    isBlocked: boolean;
    remainingSeconds?: number;
    blockedAt?: string | null;
    mentorName?: string;
    mentorEmail?: string | null;
    message?: string;
  } | null>(null);

  // Reset state on modal open

  // Load quiz upon opening
  useEffect(() => {
    if (!open) {
      setGen(null);
      setError(null);
      setResult(null);
      setIsQuizBlocked(false);
      setBlockInfo(null);
      setPhase("loading");
      return;
    }

    let active = true;

    async function loadQuiz() {
      setPhase("loading");
      setError(null);
      setBlockInfo(null);
      if (customQuiz) {
        setGen(customQuiz);
        setPhase("ready");
        return;
      }
      try {
        const data = await generateQuiz({ roadmapItemId, subTopicName, skillName });
        if (!active) return;
        setGen(data);
        setPhase("ready");
      } catch (err: any) {
        if (!active) return;
        if (
          err.statusCode === 403 ||
          err.data?.isProctoringBlocked ||
          err.message?.includes("suspended for 30 minutes") ||
          err.message?.includes("proctoring") ||
          err.message?.includes("blocked")
        ) {
          setBlockInfo({
            isBlocked: true,
            remainingSeconds: err.data?.remainingSeconds ?? 1800,
            blockedAt: err.data?.blockedAt || null,
            mentorName: err.data?.mentor?.name,
            mentorEmail: err.data?.mentor?.email,
            message: err.message,
          });
          setPhase("error");
          return;
        }
        setError(err.message || "Failed to generate assessment questions.");
        setPhase("error");
      }
    }

    loadQuiz();

    return () => {
      active = false;
      stopAllCameraStreams();
    };
  }, [open, roadmapItemId, subTopicName, skillName, customQuiz]);

  const handleSubmit = async (answers: Record<string, string>) => {
    if (!gen) return;
    setPhase("submitting");
    try {
      if (onCustomSubmit) {
        const res = await onCustomSubmit(answers);
        setResult(res);
        if (res.passed) {
          onPassed?.();
        }
        return;
      }
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
      if (
        err.statusCode === 403 ||
        err.data?.isProctoringBlocked ||
        err.message?.includes("suspended for 30 minutes")
      ) {
        setBlockInfo({
          isBlocked: true,
          remainingSeconds: err.data?.remainingSeconds ?? 1800,
          blockedAt: err.data?.blockedAt || null,
          mentorName: err.data?.mentor?.name,
          mentorEmail: err.data?.mentor?.email,
          message: err.message,
        });
        setIsQuizBlocked(true);
        return;
      }
      toast.error(err.message || "Failed to submit assessment answers.");
    }
  };

  const handleRetry = () => {
    setError(null);
    setResult(null);
    setIsQuizBlocked(false);
    setBlockInfo(null);
    setPhase("loading");
    if (customQuiz) {
      setGen(customQuiz);
      setPhase("ready");
      return;
    }
    generateQuiz({ roadmapItemId, subTopicName, skillName })
      .then((data) => {
        setGen(data);
        setPhase("ready");
      })
      .catch((err: any) => {
        if (
          err.statusCode === 403 ||
          err.data?.isProctoringBlocked ||
          err.message?.includes("suspended for 30 minutes") ||
          err.message?.includes("proctoring") ||
          err.message?.includes("blocked")
        ) {
          setBlockInfo({
            isBlocked: true,
            remainingSeconds: err.data?.remainingSeconds ?? 1800,
            blockedAt: err.data?.blockedAt || null,
            mentorName: err.data?.mentor?.name,
            mentorEmail: err.data?.mentor?.email,
            message: err.message,
          });
          setPhase("error");
          return;
        }
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
      <div className="fixed inset-0 z-[999999] bg-background text-foreground flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="max-w-md w-full bg-popover border border-border rounded-3xl p-8 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-chart-5/10 border border-chart-5/30 flex items-center justify-center mx-auto text-chart-5">
            <Brain className="h-8 w-8 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">Initializing Assessment Environment</h3>
            <p className="text-xs text-muted-foreground">
              Generating questions & activating AI proctoring for {subTopicName}...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-chart-5 font-semibold pt-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Connecting Proctor Engine...</span>
          </div>
          <button
            onClick={handleClose}
            className="text-xs text-muted-foreground hover:text-foreground transition pt-2"
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
        subTopicName={subTopicName || "Technical Assessment"}
        skillName={skillName || "Core Competency"}
        onStart={() => {
          document.documentElement.requestFullscreen?.().catch(() => {});
          setPhase("taking");
        }}
        onCancel={handleClose}
      />,
      document.body
    );
  }

  // 1.8 Proctoring Blocked Phase (30-Minute Lockout & Mentor Override)
  if (blockInfo?.isBlocked || isQuizBlocked) {
    return createPortal(
      <ProctoringBlockLockoutModal
        initialRemainingSeconds={blockInfo?.remainingSeconds ?? 1800}
        blockedAt={blockInfo?.blockedAt}
        mentorName={blockInfo?.mentorName}
        mentorEmail={blockInfo?.mentorEmail}
        message={blockInfo?.message}
        onUnblocked={() => {
          setBlockInfo(null);
          setIsQuizBlocked(false);
          handleRetry();
        }}
        onClose={handleClose}
      />,
      document.body
    );
  }

  // 2. Error Phase
  if (phase === "error") {
    return createPortal(
      <div className="fixed inset-0 z-[999999] bg-background text-foreground flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="max-w-md w-full bg-popover border border-destructive/30 rounded-3xl p-8 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto text-destructive">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Assessment Generation Failed</h3>
          <p className="text-xs text-muted-foreground">{error || "An unexpected error occurred while preparing your exam."}</p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleRetry}
              className="flex-1 bg-primary hover:brightness-110 text-primary-foreground py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Try Again
            </button>
            <button
              onClick={handleClose}
              className="px-5 bg-[var(--glass-input-bg)] hover:brightness-110 text-foreground py-2.5 rounded-xl text-xs font-semibold"
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
      subTopicName={subTopicName || "Technical Assessment"}
      skillName={skillName || "Core Competency"}
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
  const [allowBypass, setAllowBypass] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeRef = useRef(true);

  // Directly attach the media stream to the video DOM element
  const attachStreamToVideo = useCallback((node: HTMLVideoElement | null, mediaStream: MediaStream | null) => {
    if (!node || !mediaStream) return;
    try {
      if (node.srcObject !== mediaStream) {
        node.srcObject = mediaStream;
      }
      node.play().catch((err) => {
        console.warn("[CameraCheckIn] Video autoplay note:", err);
      });
    } catch (e) {
      console.warn("[CameraCheckIn] Attach stream error:", e);
    }
  }, []);

  // Ref callback guaranteeing attachment the millisecond the video node mounts
  const setVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      if (node && stream) {
        attachStreamToVideo(node, stream);
      }
    },
    [stream, attachStreamToVideo]
  );

  // Synchronize when stream becomes available
  useEffect(() => {
    if (videoRef.current && stream) {
      attachStreamToVideo(videoRef.current, stream);
    }
  }, [stream, attachStreamToVideo]);

  // Pre-load TensorFlow model
  useEffect(() => {
    preloadProctoringModel();
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setAiStatus("loading");
    try {
      const camStream = await acquireCameraStream();
      if (!activeRef.current) return;
      setStream(camStream);
      if (videoRef.current) {
        attachStreamToVideo(videoRef.current, camStream);
      }
    } catch (err: any) {
      if (!activeRef.current) return;
      console.error("[PreExamCheckIn] Camera error:", err);
      setCameraError(err.message || "Failed to access webcam. Please check browser permissions.");
      setAiStatus("no_face");
    }
  }, [attachStreamToVideo]);

  useEffect(() => {
    activeRef.current = true;
    startCamera();

    return () => {
      activeRef.current = false;
      stopAllCameraStreams();
    };
  }, [startCamera]);

  // Frame check & detection loop
  useEffect(() => {
    if (!stream) return;

    let timer: any = null;
    let fallbackTimer: any = null;

    // Safety fallback: if AI model download takes > 3.5s, verify feed anyway so student isn't stuck
    fallbackTimer = setTimeout(() => {
      setAiStatus((prev) => (prev === "loading" ? "ok" : prev));
    }, 3500);

    async function checkFrame() {
      if (!activeRef.current) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2 && video.videoWidth > 0 && !video.paused) {
        try {
          const preds = await runProctorDetection(video);
          if (!activeRef.current) return;

          const classes = preds.map((p) => ({ class: p.class, score: p.score }));
          const summary = classes.map((c) => `${c.class} (${Math.round(c.score * 100)}%)`);
          setDetectedSummary(summary);

          const hasPhone = preds.some(
            (p) => p.class === "cell phone" && p.score >= 0.35
          );

          if (hasPhone) {
            setAiStatus("phone");
          } else {
            // Deduplicate person boxes
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
        } catch (detectionErr) {
          console.warn("[PreExamCheckIn] Detection error:", detectionErr);
          setAiStatus("ok");
        }
      }

      if (activeRef.current) {
        timer = setTimeout(checkFrame, 600);
      }
    }

    timer = setTimeout(checkFrame, 400);

    return () => {
      if (timer) clearTimeout(timer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [stream]);

  const handleStartExam = () => {
    stopAllCameraStreams();
    onStart();
  };

  const handleCancel = () => {
    stopAllCameraStreams();
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-md text-foreground flex flex-col items-center justify-center p-4 md:p-6 select-none overflow-y-auto font-sans">
      <div className="max-w-4xl w-full bg-card text-card-foreground border border-border/80 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header Title */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-bold shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight">Proctored Assessment Check-In</h2>
              <p className="text-xs text-muted-foreground">
                {skillName} • {subTopicName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/25 text-primary text-xs font-semibold rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            AI Monitored
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Live AI Camera Preview (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Live Camera & AI Feed</span>
              <span
                className={cn(
                  "text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all",
                  aiStatus === "ok"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : aiStatus === "phone"
                    ? "bg-destructive/15 text-destructive border border-destructive/30"
                    : aiStatus === "multi"
                    ? "bg-destructive/15 text-destructive border border-destructive/30"
                    : aiStatus === "no_face"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    : "bg-primary/15 text-primary border border-primary/30"
                )}
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    aiStatus === "ok"
                      ? "bg-emerald-500 animate-pulse"
                      : aiStatus === "phone"
                      ? "bg-red-500"
                      : aiStatus === "multi"
                      ? "bg-red-500"
                      : aiStatus === "no_face"
                      ? "bg-amber-500"
                      : "bg-primary animate-spin"
                  )}
                />
                {aiStatus === "ok"
                  ? "Identity Verified"
                  : aiStatus === "phone"
                  ? "Phone in Frame!"
                  : aiStatus === "multi"
                  ? "Multiple People"
                  : aiStatus === "no_face"
                  ? "Position Face in Frame"
                  : "Configuring AI..."}
              </span>
            </div>

            {/* Video Box Viewfinder */}
            <div className="relative w-full aspect-video md:h-56 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl ring-1 ring-white/10 flex items-center justify-center">
              <video
                ref={setVideoRef}
                autoPlay
                muted
                playsInline
                onLoadedMetadata={(e) => {
                  e.currentTarget.play().catch(() => {});
                }}
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-300",
                  stream ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                style={{ transform: "scaleX(-1)" }}
              />

              {/* Connecting State */}
              {!stream && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 text-slate-300 p-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
                    <Camera className="h-6 w-6 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white">Accessing Camera...</p>
                    <p className="text-[11px] text-slate-400">Initializing sensor & verification feed</p>
                  </div>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}

              {/* Camera Error State */}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-slate-950/95 text-slate-300 p-5 text-center">
                  <div className="w-10 h-10 rounded-xl bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive">
                    <CameraOff className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-rose-300">Webcam Not Available</p>
                  <p className="text-[11px] text-slate-400 max-w-xs">{cameraError}</p>
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3 py-1.5 rounded-lg bg-primary hover:brightness-110 text-primary-foreground text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Retry Camera Access
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllowBypass(true)}
                      className="text-[10px] text-slate-400 hover:text-white underline underline-offset-2 transition"
                    >
                      Continue with Self-Attestation
                    </button>
                  </div>
                </div>
              )}

              {/* Live Overlay HUD */}
              {stream && (
                <>
                  <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-white shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    LIVE FEED
                  </div>

                  <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-white/50 pointer-events-none" />
                  <div className="absolute bottom-9 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-white/50 pointer-events-none" />
                  <div className="absolute bottom-9 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-white/50 pointer-events-none" />

                  <div className="absolute bottom-0 inset-x-0 px-3 py-1.5 bg-slate-950/90 backdrop-blur-md border-t border-white/10 text-[10px] text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-200 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Inference: COCO-SSD
                    </span>
                    <span className="truncate max-w-[140px] font-mono text-emerald-400 text-right">
                      {detectedSummary.length > 0 ? detectedSummary.slice(0, 2).join(", ") : "Scanning..."}
                    </span>
                  </div>
                </>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Ensure your face is well-lit and directly in front of the camera before starting.
            </p>
          </div>

          {/* Right Column: Rules Checklist & Terms (7 cols) */}
          <div className="md:col-span-7 space-y-3">
            <span className="text-xs font-bold text-foreground">Exam Integrity Policy</span>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-3 p-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/60 transition">
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                  <Monitor className="h-3.5 w-3.5" />
                </div>
                <div>
                  <strong className="text-foreground font-semibold">Full-Screen Lockdown:</strong>{" "}
                  <span className="text-muted-foreground">Leaving fullscreen records a strike and starts a 15-second timer to return or get blocked.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/60 transition">
                <div className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-500 shrink-0 mt-0.5">
                  <Smartphone className="h-3.5 w-3.5" />
                </div>
                <div>
                  <strong className="text-foreground font-semibold">No External Devices:</strong>{" "}
                  <span className="text-muted-foreground">AI camera continuously checks for phones and secondary devices.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/60 transition">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                  <UserCheck className="h-3.5 w-3.5" />
                </div>
                <div>
                  <strong className="text-foreground font-semibold">Continuous Presence:</strong>{" "}
                  <span className="text-muted-foreground">Stay centered in front of your camera for the full duration of the test.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/60 transition">
                <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-500 shrink-0 mt-0.5">
                  <Eye className="h-3.5 w-3.5" />
                </div>
                <div>
                  <strong className="text-foreground font-semibold">Full Face & Eye Gaze:</strong>{" "}
                  <span className="text-muted-foreground">Full face must be visible (no cutoffs) with eyes focused on the screen (4 warnings = 1 strike).</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/60 transition">
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                <div>
                  <strong className="text-foreground font-semibold">3-Strike Rule:</strong>{" "}
                  <span className="text-muted-foreground">3 integrity violations lock the exam and notify your mentor automatically.</span>
                </div>
              </div>
            </div>

            {/* Agreement Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/60 transition cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
              />
              <span className="text-xs text-foreground font-medium leading-tight">
                I agree to adhere to all exam integrity guidelines and consent to automated AI proctoring
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border/80 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2.5 rounded-xl border border-border/80 bg-muted/50 hover:bg-muted text-foreground text-xs font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleStartExam}
            disabled={!agreed || (!stream && !allowBypass)}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/85 hover:brightness-110 text-primary-foreground text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Maximize className="h-4 w-4" />
            Enter Fullscreen & Begin Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
