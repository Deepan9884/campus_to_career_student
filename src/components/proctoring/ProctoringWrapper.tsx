import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useProctoringSession, type ProctoringSessionOptions } from "@/hooks/useProctoringSession";
import { stopAllCameraStreams } from "@/lib/cameraManager";
import { FullscreenCountdownModal } from "@/components/proctoring/FullscreenCountdownModal";
import { ProctoringBlockLockoutModal } from "@/components/proctoring/ProctoringBlockLockoutModal";
import { requestAppFullscreen, isCurrentlyFullscreen } from "@/lib/fullscreenUtils";
import type { ViolationType } from "@/lib/proctoring-api";
import {
  ShieldX,
  ShieldCheck,
  AlertTriangle,
  Lock,
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

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      stopAllCameraStreams();
    };
  }, []);

  const proctoringState = useProctoringSession({
    moduleType,
    moduleId,
    enabled,
    isStarted: isExamStarted,
    webcamRequired: false,
    aiFaceDetection: false,
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

  // Direct user-gesture Fullscreen trigger
  async function handleLaunchExam() {
    try {
      if (!isCurrentlyFullscreen()) {
        const res = await requestAppFullscreen();
        if (!res.success && !isCurrentlyFullscreen()) {
          toast.error("Please allow fullscreen mode to begin the exam.");
          return;
        }
      }
      setIsExamStarted(true);
    } catch {
      toast.error("Please allow fullscreen mode to begin the exam.");
    }
  }

  async function handleReEnterFullscreen() {
    try {
      await requestAppFullscreen();
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

  // 2. Pre-Exam Check-In & Fullscreen Launch Gate (Before questions appear)
  if (!isExamStarted) {
    return createPortal(
      <div className="fixed inset-0 z-[999999] bg-[#0b1120] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto select-none font-sans">
        <div className="p-6 max-w-xl w-full mx-auto space-y-6 animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[color:var(--color-primary)]/10 border border-[color:var(--color-primary)]/30 flex items-center justify-center mx-auto text-[color:var(--color-primary)]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">Interview Assessment Check-In</h2>
            <p className="text-xs text-muted-foreground">
              Review the guidelines below and enter fullscreen to begin your session.
            </p>
          </div>

          {/* Rules Checklist */}
          <div className="glass rounded-2xl p-4 border border-white/10 space-y-2.5 text-xs text-muted-foreground">
            <p className="font-bold text-white/90 text-sm mb-2">Assessment Guidelines</p>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
              <span><strong className="text-white/90">Full Screen Enforced:</strong> The interview runs in fullscreen to help you concentrate. Exiting records a strike and gives 15 seconds to return.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
              <span><strong className="text-white/90">Focused Assessment:</strong> Tab switching, DevTools, and restricted OS shortcuts are disabled during the session.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
              <span><strong className="text-white/90">3-Strike Policy:</strong> Reaching 3 violations will temporarily suspend your session.</span>
            </div>
          </div>

          {/* Launch Button */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleLaunchExam}
              className="flex-1 btn-gradient btn-gradient-hover rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20"
            >
              <Maximize className="h-4 w-4" />
              Enter Fullscreen & Begin Session
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
      {proctoringState.fullscreenCountdown !== null && !isActuallyBlocked && (
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

      {/* ── STRIKE VIOLATION MONITOR (Tab switch / Fullscreen exit) ──────── */}
      {proctoringState.violationCount > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999999,
          }}
          className="flex flex-col items-end gap-2 font-sans select-none pointer-events-auto"
        >
          <div
            className={`glass rounded-full px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 border shadow-lg ${
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
        </div>
      )}

      {/* 30-Minute Proctoring Blocked Screen Overlay */}
      {isActuallyBlocked && (
        <ProctoringBlockLockoutModal
          initialRemainingSeconds={1800}
          title="Interview Access Suspended (30m)"
          subtitle="Proctoring Violation Strikeout"
          message="Candidate has reached the maximum proctoring violations limit. Interview access has been suspended for 30 minutes. Only your assigned mentor can unblock you early."
          onUnblocked={() => {
            setIsActuallyBlocked(false);
            proctoringState.resetSession();
          }}
          onClose={handleExit}
        />
      )}
    </div>,
    document.body
  );
}
