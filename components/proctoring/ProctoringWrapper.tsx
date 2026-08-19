import { useState, useEffect, useRef } from "react";
import { useProctoringSession, type ProctoringSessionOptions } from "@/hooks/useProctoringSession";
import { stopAllCameraStreams } from "@/lib/cameraManager";
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
  tab_switch: "Tab or window switch detected",
  keyboard_shortcut: "Restricted keyboard shortcut was pressed",
  face_not_detected: "Face not detected in camera frame",
  multiple_faces_detected: "Multiple faces detected in camera frame",
};

const STRIKE_MESSAGES: Record<number, string> = {
  1: "⚠️ Strike 1 of 3 (Warning)",
  2: "⚠️ Strike 2 of 3 (Caution — Next violation will block your exam!)",
  3: "🚫 Strike 3 of 3 (Exam Access Blocked)",
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

  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);

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
      const strike = STRIKE_MESSAGES[count] || `⚠️ Strike ${count}/3`;
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
  }, [proctoringState.mediaStream, isExamStarted]);

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
    onExit?.();
  };

  // 1. Camera Denied Screen
  if (enabled && proctoringState.cameraError) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-6 backdrop-blur-md">
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
              onClick={() => window.location.reload()}
              className="flex-1 btn-gradient btn-gradient-hover rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Refresh & Allow
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
      </div>
    );
  }

  // 2. Pre-Exam Check-In & Fullscreen Launch Gate (Before questions appear)
  if (!isExamStarted) {
    return (
      <div className="p-6 max-w-xl mx-auto space-y-6 animate-in fade-in duration-200">
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
            <span><strong className="text-white/90">Full Screen Enforced:</strong> The exam must stay in fullscreen. Exiting will record a strike.</span>
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
    );
  }

  // 3. Active Exam in Progress
  return (
    <div className="relative">
      {/* If exited fullscreen during exam, overlay with resume button */}
      {!proctoringState.isFullscreen && !isActuallyBlocked && (
        <div className="fixed inset-0 z-[9990] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md">
          <div className="max-w-md w-full glass rounded-3xl p-8 text-center space-y-5 border border-yellow-500/40 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/40 flex items-center justify-center mx-auto text-yellow-400">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-yellow-300">Fullscreen Mode Required</h2>
            <p className="text-xs text-muted-foreground">
              You exited fullscreen mode during the examination. This incident has been logged. Click below to return to fullscreen and resume answering.
            </p>
            <button
              onClick={handleReEnterFullscreen}
              className="w-full btn-gradient btn-gradient-hover rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <Maximize className="h-4 w-4" />
              Re-enter Fullscreen to Continue
            </button>
          </div>
        </div>
      )}

      {/* Main Exam Content */}
      {children}

      {/* Camera PiP Preview (Bottom Right) */}
      {enabled && proctoringState.mediaStream && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none">
          <div className="glass rounded-2xl overflow-hidden border border-white/15 shadow-2xl backdrop-blur-lg bg-black/60">
            <div className="flex items-center justify-between px-3 py-1.5 bg-black/50 text-[11px] text-muted-foreground border-b border-white/10">
              <div className="flex items-center gap-1.5 font-medium text-white/90">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                AI Proctor Active
              </div>
              <Shield className="h-3.5 w-3.5 text-green-400" />
            </div>
            <div className="relative w-40 h-28 bg-slate-950">
              <video
                ref={pipVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              <div className="absolute inset-0 border border-green-500/20 pointer-events-none rounded-b-2xl" />
            </div>
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
        <div className="fixed inset-0 z-[9999] bg-black/97 flex items-center justify-center p-6 backdrop-blur-xl">
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
    </div>
  );
}
