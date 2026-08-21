import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useProctoringSession, type ProctoringSessionOptions } from "@/hooks/useProctoringSession";
import { stopAllCameraStreams } from "@/lib/cameraManager";
import { FullscreenCountdownModal } from "@/components/proctoring/FullscreenCountdownModal";
import type { ViolationType } from "@/lib/proctoring-api";
import {
  Shield,
  ShieldX,
  ShieldCheck,
  Camera,
  AlertTriangle,
  Lock,
  RefreshCw,
  Maximize,
  CheckCircle2,
  Move,
  Minimize2,
  Maximize2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

interface ProctoringWrapperProps extends Omit<ProctoringSessionOptions, "onBlocked" | "onViolation"> {
  children: React.ReactNode;
  onBlocked?: () => void;
  onExit?: () => void;
}

const VIOLATION_LABELS: Record<ViolationType, string> = {
  mobile_phone_detected: "Mobile phone detected in camera frame",
  fullscreen_exit: "Exam window exited fullscreen mode",
  fullscreen_timeout: "Failed to return to fullscreen within 15 seconds",
  tab_switch: "Tab or window switch detected",
  keyboard_shortcut: "Restricted keyboard shortcut was pressed",
  face_not_detected: "Face not detected in camera frame",
  multiple_faces_detected: "Multiple faces detected in camera frame",
  eye_tracking_violation: "Repeated eye gaze deviation (4 warnings reached)",
};

const STRIKE_MESSAGES: Record<number, string> = {
  1: "Strike 1 of 3 (Warning)",
  2: "Strike 2 of 3 (Caution — Next violation will lock your exam)",
  3: "Strike 3 of 3 (Exam Disqualified)",
};

export function ProctoringWrapper({
  children,
  moduleType,
  moduleId,
  enabled = true,
  onBlocked,
  onExit,
}: ProctoringWrapperProps) {
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isActuallyBlocked, setIsActuallyBlocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Floating Draggable PiP Camera State
  const [pipPos, setPipPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPipMinimized, setIsPipMinimized] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialPipX: number; initialPipY: number }>({
    startX: 0,
    startY: 0,
    initialPipX: 0,
    initialPipY: 0,
  });

  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";

    // Set initial PiP position at bottom-right of viewport
    if (typeof window !== "undefined") {
      setPipPos({
        x: Math.max(16, window.innerWidth - 220),
        y: Math.max(16, window.innerHeight - 190),
      });
    }

    return () => {
      document.body.style.overflow = "";
      stopAllCameraStreams();
    };
  }, []);

  // Window resize bounds adjustment
  useEffect(() => {
    const handleResize = () => {
      setPipPos((prev) => {
        if (!prev) return null;
        const maxX = Math.max(16, window.innerWidth - 200);
        const maxY = Math.max(16, window.innerHeight - 180);
        return {
          x: Math.min(Math.max(16, prev.x), maxX),
          y: Math.min(Math.max(16, prev.y), maxY),
        };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const proctoringState = useProctoringSession({
    moduleType,
    moduleId,
    enabled,
    isStarted: isExamStarted,
    onBlocked: () => {
      setIsActuallyBlocked(true);
      onBlocked?.();
    },
    onViolation: (count, type) => {
      const label = VIOLATION_LABELS[type] || type.replace(/_/g, " ");
      const strike = STRIKE_MESSAGES[count] || `Strike ${count}/3`;
      toast.error(`${strike}: ${label}`, {
        duration: 6000,
        id: `proctoring-violation-${count}`,
      });
    },
  });

  // Attach mediaStream safely via useEffect without inline render loops
  useEffect(() => {
    if (previewVideoRef.current && proctoringState.mediaStream) {
      previewVideoRef.current.srcObject = proctoringState.mediaStream;
      previewVideoRef.current.play().catch(() => {});
    }
  }, [proctoringState.mediaStream, isExamStarted]);

  useEffect(() => {
    if (pipVideoRef.current && proctoringState.mediaStream) {
      pipVideoRef.current.srcObject = proctoringState.mediaStream;
      pipVideoRef.current.play().catch(() => {});
    }
  }, [proctoringState.mediaStream, isExamStarted, isPipMinimized]);

  // Pointer drag event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const initialX = pipPos?.x ?? Math.max(16, window.innerWidth - 220);
    const initialY = pipPos?.y ?? Math.max(16, window.innerHeight - 190);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPipX: initialX,
      initialPipY: initialY,
    };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;
    const newX = dragStartRef.current.initialPipX + deltaX;
    const newY = dragStartRef.current.initialPipY + deltaY;

    const width = isPipMinimized ? 160 : 195;
    const height = isPipMinimized ? 40 : 170;
    const maxX = Math.max(12, window.innerWidth - width - 12);
    const maxY = Math.max(12, window.innerHeight - height - 12);

    setPipPos({
      x: Math.min(Math.max(12, newX), maxX),
      y: Math.min(Math.max(12, newY), maxY),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Direct user-gesture Fullscreen trigger
  async function handleLaunchExam() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setIsExamStarted(true);
    } catch {
      toast.error("Please allow fullscreen mode to begin the exam.");
    }
  }

  async function handleReEnterFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      toast.error("Failed to re-enter fullscreen. Please try again.");
    }
  }

  const handleExit = () => {
    stopAllCameraStreams();
    if (typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onExit?.();
  };

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  // 1. Camera Denied Screen
  if (enabled && proctoringState.cameraError) {
    return createPortal(
      <div className="fixed inset-0 z-[999999] bg-black/95 flex items-center justify-center p-6 backdrop-blur-md select-none font-sans">
        <div className="max-w-md w-full glass rounded-2xl p-8 text-center space-y-4 border border-red-500/30 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <Camera className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-red-300">Camera Access Required</h2>
          <p className="text-sm text-muted-foreground">
            {proctoringState.cameraError}
          </p>
          <div className="text-xs text-muted-foreground/80 bg-white/5 p-3 rounded-xl border border-white/5 text-left space-y-1">
            <p className="font-semibold text-white/90">Why is this required?</p>
            <p>• Automated mobile phone & device detection</p>
            <p>• AI proctoring identity verification</p>
            <p>• Exam integrity & plagiarism prevention</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => proctoringState.retryCamera()}
              className="flex-1 btn-gradient btn-gradient-hover rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Retry Camera Access
            </button>
            {onExit && (
              <button
                onClick={handleExit}
                className="glass rounded-xl px-4 py-2.5 text-sm hover:bg-white/10"
              >
                Exit Exam
              </button>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // 2. Pre-Exam Check-In & Fullscreen Launch Gate (Before questions appear)
  if (!isExamStarted) {
    return createPortal(
      <div className="fixed inset-0 z-[999999] bg-[#0b1120] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto select-none font-sans">
        <div className="p-6 max-w-xl w-full mx-auto space-y-6 animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[color:var(--color-primary)]/10 border border-[color:var(--color-primary)]/30 flex items-center justify-center mx-auto text-[color:var(--color-primary)]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">Proctored Examination Check-In</h2>
            <p className="text-xs text-muted-foreground">
              Complete the verification checklist below to enter fullscreen and unlock your questions.
            </p>
          </div>

          {/* Live Camera Preview Verification */}
          <div className="glass rounded-2xl p-4 border border-white/10 space-y-3 bg-black/40">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white/90 flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-[color:var(--color-primary)]" />
                Camera Feed Verification
              </span>
              <span className="text-[11px] text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Proctor Connected
              </span>
            </div>

            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-white/10">
              {proctoringState.mediaStream ? (
                <video
                  ref={previewVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin text-[color:var(--color-primary)]" />
                  <span>Connecting camera stream...</span>
                </div>
              )}
            </div>
          </div>

          {/* Rules Checklist */}
          <div className="glass rounded-2xl p-4 border border-white/10 space-y-2.5 text-xs text-muted-foreground">
            <p className="font-bold text-white/90 text-sm mb-2">Examination Integrity Rules</p>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
              <span><strong className="text-white/90">Full Screen Enforced:</strong> The exam must stay in fullscreen. Exiting records a strike and gives 15 seconds to return before an automatic block.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
              <span><strong className="text-white/90">No Mobile Phones:</strong> Real-time camera feed monitors for unauthorized devices.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
              <span><strong className="text-white/90">Restricted Shortcuts:</strong> Tab switches, DevTools, Win+G, and copy/paste are blocked.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
              <span><strong className="text-white/90">Full Face & Eye Gaze Enforced:</strong> Entire face must remain visible and centered. Half-face, quarter-face, edge cutoffs, or looking away trigger warnings (4 warnings = 1 strike).</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
              <span><strong className="text-white/90">3-Strike Policy:</strong> Reaching 3 violations will immediately suspend your exam access.</span>
            </div>
          </div>

          {/* Launch Button */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleLaunchExam}
              disabled={!proctoringState.cameraReady}
              className="flex-1 btn-gradient btn-gradient-hover rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 disabled:opacity-50"
            >
              <Maximize className="h-4 w-4" />
              Enter Fullscreen & Begin Exam
            </button>
            {onExit && (
              <button
                onClick={handleExit}
                className="glass rounded-xl px-5 py-3 text-sm hover:bg-white/10"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // 3. Active Exam in Progress (Portal to document.body, entirely replacing the platform viewport)
  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-[#0b1120] text-slate-100 flex flex-col h-screen w-screen overflow-hidden select-none font-sans p-0 m-0">
      {/* If exited fullscreen during exam, overlay with 15s countdown timer */}
      {!proctoringState.isFullscreen && !isActuallyBlocked && (
        <FullscreenCountdownModal
          countdown={proctoringState.fullscreenCountdown}
          violationCount={proctoringState.violationCount}
          onReEnterFullscreen={handleReEnterFullscreen}
        />
      )}

      {/* Main Fullscreen Exam Workspace */}
      <div className="w-full h-full flex flex-col flex-1 min-h-0 overflow-hidden">
        {children}
      </div>

      {/* ── DRAGGABLE FLOATING CAMERA PIP PREVIEW ─────────────────────────── */}
      {enabled && proctoringState.mediaStream && (
        <div
          style={{
            transform: pipPos ? `translate3d(${pipPos.x}px, ${pipPos.y}px, 0)` : undefined,
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 9999999,
          }}
          className={`flex flex-col items-end gap-1.5 touch-none select-none transition-shadow duration-200 ${
            isDragging ? "opacity-95 scale-105 cursor-grabbing" : "opacity-100"
          }`}
        >
          <div className="glass rounded-2xl overflow-hidden border border-white/20 shadow-2xl backdrop-blur-2xl bg-slate-950/90 w-48 transition-all duration-150">
            {/* Draggable Header Handle */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900/90 text-[11px] text-muted-foreground border-b border-white/10 cursor-grab active:cursor-grabbing gap-1.5 hover:bg-slate-800/90 transition"
              title="Drag to reposition camera anywhere"
            >
              <div className="flex items-center gap-1.5 font-medium text-white/90 truncate min-w-0">
                <Move className="h-3 w-3 text-slate-400 shrink-0" />
                <div
                  className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${
                    proctoringState.aiStatus === "phone_detected"
                      ? "bg-red-500"
                      : proctoringState.aiStatus === "face_missing"
                      ? "bg-yellow-400"
                      : proctoringState.aiStatus === "multiple_faces"
                      ? "bg-orange-500"
                      : proctoringState.aiStatus === "partial_face"
                      ? "bg-amber-500"
                      : proctoringState.aiStatus === "looking_away"
                      ? "bg-amber-400"
                      : proctoringState.aiStatus === "active"
                      ? "bg-green-400"
                      : "bg-blue-400"
                  }`}
                />
                <span className="text-[10px] font-semibold truncate">
                  {proctoringState.aiStatus === "phone_detected"
                    ? "Phone Detected!"
                    : proctoringState.aiStatus === "face_missing"
                    ? "No Face"
                    : proctoringState.aiStatus === "multiple_faces"
                    ? "Multiple People"
                    : proctoringState.aiStatus === "partial_face"
                    ? "Partial Face!"
                    : proctoringState.aiStatus === "looking_away"
                    ? "Looking Away!"
                    : proctoringState.aiStatus === "active"
                    ? "Face Verified"
                    : "Scanning..."}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPipMinimized((prev) => !prev);
                  }}
                  className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition"
                  title={isPipMinimized ? "Expand camera preview" : "Minimize camera"}
                >
                  {isPipMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                </button>
              </div>
            </div>

            {/* Video Feed (Collapsed or Expanded) */}
            {!isPipMinimized && (
              <div className="relative w-48 h-32 bg-slate-950">
                <video
                  ref={pipVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
                <div
                  className={`absolute inset-0 border-2 pointer-events-none transition-colors duration-300 ${
                    proctoringState.aiStatus === "phone_detected"
                      ? "border-red-500/80 bg-red-500/10"
                      : proctoringState.aiStatus === "face_missing"
                      ? "border-yellow-500/80 bg-yellow-500/10"
                      : proctoringState.aiStatus === "multiple_faces"
                      ? "border-orange-500/80 bg-orange-500/10"
                      : proctoringState.aiStatus === "partial_face"
                      ? "border-amber-500/80 bg-amber-500/10"
                      : proctoringState.aiStatus === "looking_away"
                      ? "border-amber-500/80 bg-amber-500/10"
                      : "border-green-500/20"
                  }`}
                />
              </div>
            )}

            {/* Real-time Face & Eye Gaze Warning Progress Meter (4 Warnings = 1 Strike) */}
            {!isPipMinimized && (
              <div className="px-2.5 py-1.5 bg-slate-900/95 border-t border-white/10 flex items-center justify-between text-[10px]">
                <span className="text-slate-300 flex items-center gap-1 font-medium">
                  <Eye className="h-3 w-3 text-indigo-400 shrink-0" />
                  Face & Gaze
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <span
                        key={step}
                        className={`w-2.5 h-1.5 rounded-sm transition-all duration-300 ${
                          step <= proctoringState.gazeWarningsInCurrentStrike
                            ? step === 4
                              ? "bg-red-500 shadow-sm shadow-red-500"
                              : "bg-amber-400 shadow-sm shadow-amber-400"
                            : "bg-slate-700/60"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[9px] font-bold text-slate-300">
                    {proctoringState.gazeWarningsInCurrentStrike}/4
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Warning badge */}
          {proctoringState.violationCount > 0 && (
            <div
              className={`glass rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 border shadow-lg ${
                proctoringState.violationCount === 1
                  ? "border-yellow-500/50 bg-yellow-500/20 text-yellow-300"
                  : proctoringState.violationCount === 2
                  ? "border-orange-500/50 bg-orange-500/20 text-orange-300 animate-pulse"
                  : "border-red-500/50 bg-red-500/20 text-red-300"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {proctoringState.violationCount}/3 Strikes
            </div>
          )}
        </div>
      )}

      {/* 3-Strike Blocked Screen Overlay */}
      {isActuallyBlocked && (
        <div className="fixed inset-0 z-[9999] bg-black/97 flex items-center justify-center p-6 backdrop-blur-xl select-none">
          <div className="max-w-lg w-full glass rounded-3xl p-8 text-center space-y-6 border border-red-500/40 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center mx-auto text-red-400">
              <ShieldX className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-red-300">Exam Access Blocked</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                You have reached 3 proctoring violations. Your examination access has been temporarily suspended to maintain institutional evaluation integrity.
              </p>
            </div>

            <div className="glass rounded-2xl p-5 text-xs text-left space-y-3 border border-red-500/20 bg-red-500/5">
              <p className="font-semibold text-red-200 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                What happens next?
              </p>
              <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                <li>Your answers submitted prior to this point have been saved.</li>
                <li>Your mentor has been alerted in real-time with telemetry logs.</li>
                <li>Your assigned mentor can review the violation history and restore your exam access.</li>
              </ul>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-red-400" />
              <span>Contact your assigned mentor through the platform to request an unblock.</span>
            </div>

            {onExit && (
              <button
                onClick={handleExit}
                className="w-full glass rounded-xl py-3 text-sm font-semibold hover:bg-white/10 transition"
              >
                Return to Dashboard
              </button>
            )}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
