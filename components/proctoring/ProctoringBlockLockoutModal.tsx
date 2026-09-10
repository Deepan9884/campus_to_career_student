import { useState, useEffect, useRef } from "react";
import {
  ShieldAlert,
  Lock,
  Clock,
  UserCheck,
  Mail,
  RefreshCw,
  LogOut,
  AlertTriangle,
  Loader2,
  Crown,
  Sparkles,
} from "lucide-react";
import { checkMyProctoringStatus } from "@/lib/proctoring-api";
import { toast } from "sonner";

interface ProctoringBlockLockoutModalProps {
  isSuperDream?: boolean;
  initialRemainingSeconds?: number;
  blockedAt?: string | Date | null;
  mentorName?: string;
  mentorEmail?: string | null;
  message?: string;
  onUnblocked?: () => void;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
}

const TOTAL_BLOCK_DURATION_SECONDS = 30 * 60; // 30 minutes = 1800s

export function ProctoringBlockLockoutModal({
  isSuperDream: propIsSuperDream,
  initialRemainingSeconds = 1800,
  blockedAt,
  mentorName: propMentorName,
  mentorEmail: propMentorEmail,
  message: propMessage,
  onUnblocked,
  onClose,
  title: propTitle,
  subtitle: propSubtitle,
}: ProctoringBlockLockoutModalProps) {
  // Detect if student is on Super Dream track
  const [isSuperDream, setIsSuperDream] = useState<boolean>(() => {
    if (typeof propIsSuperDream === "boolean") return propIsSuperDream;
    if (typeof window !== "undefined") {
      return (
        window.location.pathname.includes("super-dream") ||
        window.location.hash.includes("super-dream") ||
        window.location.search.includes("super_dream")
      );
    }
    return false;
  });

  // Compute initial remaining seconds for classic countdown
  const calculateInitialSeconds = () => {
    if (blockedAt) {
      const elapsed = Math.floor((Date.now() - new Date(blockedAt).getTime()) / 1000);
      return Math.max(0, TOTAL_BLOCK_DURATION_SECONDS - elapsed);
    }
    return Math.max(0, initialRemainingSeconds);
  };

  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateInitialSeconds);
  const [mentorName, setMentorName] = useState<string>(propMentorName || "Your Assigned Mentor");
  const [mentorEmail, setMentorEmail] = useState<string | null>(propMentorEmail || null);
  const [isChecking, setIsChecking] = useState(false);
  const [isAutoUnblocking, setIsAutoUnblocking] = useState(false);
  const onUnblockedRef = useRef(onUnblocked);
  onUnblockedRef.current = onUnblocked;

  // 1. Live Countdown Timer Ticking Every 1 Second — ONLY IN CLASSIC MODE!
  // Rule: "timer comes only in classic ...inside super dream mentor unblocks"
  useEffect(() => {
    if (isSuperDream) {
      return; // Do NOT start countdown timer in Super Dream
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // When timer reaches 0, trigger classic auto-unblock check
          triggerAutoUnblockCheck();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuperDream]);

  // 2. Query block status to ensure accurate mentor info & server time sync
  const queryServerStatus = async (showToastOnNoChange = false) => {
    try {
      setIsChecking(true);
      const res = await checkMyProctoringStatus();
      if (!res.isBlocked) {
        toast.success("🎉 Access restored! Your assessment access is now authorized.");
        onUnblockedRef.current?.();
        return true;
      }
      if (typeof res.isSuperDream === "boolean") {
        setIsSuperDream(res.isSuperDream);
      }
      if (res.mentor?.name) {
        setMentorName(res.mentor.name);
      }
      if (res.mentor?.email) {
        setMentorEmail(res.mentor.email);
      }
      if (typeof res.remainingSeconds === "number" && res.remainingSeconds > 0) {
        setRemainingSeconds(res.remainingSeconds);
      }
      if (showToastOnNoChange) {
        if (res.isSuperDream || isSuperDream) {
          toast.info(
            `Super Dream Lockout Active: Only ${res.mentor?.name || mentorName} can review and unblock your access.`
          );
        } else {
          toast.info(
            `Lockout active: ${Math.ceil((res.remainingSeconds || remainingSeconds) / 60)} minute(s) remaining. Awaiting mentor unblock or timer expiry.`
          );
        }
      }
      return false;
    } catch (err: any) {
      console.warn("[ProctoringLockout] Status check error:", err);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  const triggerAutoUnblockCheck = async () => {
    if (isSuperDream) return;
    setIsAutoUnblocking(true);
    const unblocked = await queryServerStatus(false);
    if (!unblocked) {
      // Re-check after 2 seconds in case server clock is slightly behind
      setTimeout(async () => {
        const retryUnblocked = await queryServerStatus(false);
        if (retryUnblocked) {
          setIsAutoUnblocking(false);
        } else {
          setIsAutoUnblocking(false);
        }
      }, 2000);
    } else {
      setIsAutoUnblocking(false);
    }
  };

  // 3. Background Polling (Every 3.5 seconds) to detect if Mentor Unblocks Early / Authorizes Super Dream
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await checkMyProctoringStatus();
        if (!res.isBlocked) {
          toast.success("🎉 Access unlocked by your mentor! Resuming your assessment...");
          onUnblockedRef.current?.();
        } else {
          if (typeof res.isSuperDream === "boolean") setIsSuperDream(res.isSuperDream);
          if (res.mentor?.name) setMentorName(res.mentor.name);
          if (res.mentor?.email) setMentorEmail(res.mentor.email);
        }
      } catch {}
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  // Format MM:SS (for classic track)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercent = Math.min(
    100,
    Math.max(0, ((TOTAL_BLOCK_DURATION_SECONDS - remainingSeconds) / TOTAL_BLOCK_DURATION_SECONDS) * 100)
  );

  const modalTitle =
    propTitle ||
    (isSuperDream
      ? "Super Dream Assessment Suspended"
      : "Assessment Access Suspended (30m)");

  const modalSubtitle =
    propSubtitle ||
    (isSuperDream
      ? "Super Dream Track · Mentor Authorization Required"
      : "Anti-Cheat 30-Minute Security Lockout");

  const modalMessage =
    propMessage ||
    (isSuperDream
      ? "Proctoring security violations were detected in this Super Dream session. In Super Dream, auto-unblock timers are disabled. Access can only be restored through your assigned mentor's authorization."
      : "Proctoring security violations (e.g. repeated tab switching, camera absence, or fullscreen exit) were detected. Access has been temporarily suspended for 30 minutes.");

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 select-none font-sans animate-in fade-in duration-200">
      <div
        className={`max-w-lg w-full bg-white border ${
          isSuperDream
            ? "border-amber-300/80 shadow-amber-500/10"
            : "border-slate-200/90 shadow-slate-900/15"
        } rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center text-slate-900 relative overflow-hidden`}
      >
        {/* Top Accent Gradient Bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            isSuperDream
              ? "bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600"
              : "bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600"
          }`}
        />

        {/* Security Shield Icon with Track Badge */}
        <div className="relative mx-auto w-16 h-16 pt-1">
          <div
            className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border shadow-sm ${
              isSuperDream
                ? "bg-amber-50 border-amber-200 text-amber-600"
                : "bg-rose-50 border-rose-200 text-rose-600"
            }`}
          >
            {isSuperDream ? (
              <Crown className="h-7 w-7 text-amber-600" />
            ) : (
              <ShieldAlert className="h-7 w-7 text-rose-600" />
            )}
          </div>
          <div
            className={`absolute bottom-0 right-2 p-1 rounded-full ${
              isSuperDream ? "bg-amber-600" : "bg-rose-600"
            } text-white shadow border-2 border-white`}
          >
            <Lock className="h-3 w-3" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
              isSuperDream
                ? "bg-amber-50 border border-amber-200 text-amber-800"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
          >
            {isSuperDream ? (
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            )}
            <span>{modalSubtitle}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {modalTitle}
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            {modalMessage}
          </p>
        </div>

        {/* ── TIMER BANNER: ONLY COMES IN CLASSIC! ────────────────────────── */}
        {!isSuperDream ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3 text-slate-900 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-rose-500 animate-spin" style={{ animationDuration: "10s" }} />
                Auto-Unblock Timer:
              </span>
              <span className="text-[11px] font-mono uppercase bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-bold border border-rose-200">
                30 Mins Lockout
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-wider text-rose-600">
              {formatTime(remainingSeconds)}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-rose-500 to-amber-500 h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="text-xs text-slate-500">
              Access automatically restores when the countdown finishes (Classic 30-Min Auto-Unblock).
            </p>
          </div>
        ) : (
          /* ── SUPER DREAM MENTOR AUTHORITY NOTICE (NO TIMER) ─────────────── */
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <Crown className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Super Dream Strict Integrity Policy</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Auto-unblock timers are strictly disabled for all Super Dream track assessments. Your session is held in lock until authorized.
            </p>
          </div>
        )}

        {/* Mentor Authority Card */}
        <div
          className={`border rounded-xl p-4 text-left space-y-2 ${
            isSuperDream
              ? "bg-indigo-50/60 border-indigo-200 text-slate-800"
              : "bg-slate-50 border-slate-200 text-slate-800"
          }`}
        >
          <div
            className={`flex items-center gap-2 text-xs font-bold ${
              isSuperDream
                ? "text-indigo-950"
                : "text-slate-900"
            }`}
          >
            <UserCheck
              className={`h-4 w-4 shrink-0 ${
                isSuperDream ? "text-indigo-600" : "text-slate-700"
              }`}
            />
            <span>
              {isSuperDream
                ? "Assigned Mentor Verification Required"
                : "Mentor Early Authorization Access"}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            {isSuperDream ? (
              <>
                Only your mentor, <strong>{mentorName}</strong>, can review your session violations telemetry and unblock your Super Dream access from the Mentor Portal.
              </>
            ) : (
              <>
                Only <strong>{mentorName}</strong> has authorization to unblock your test access early before the 30-minute timer expires.
              </>
            )}
          </p>

          {mentorEmail && (
            <div className="flex items-center gap-2 text-xs text-indigo-700 pt-1">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <a
                href={`mailto:${mentorEmail}?subject=${encodeURIComponent(
                  isSuperDream
                    ? "Super Dream Assessment Unblock Request"
                    : "Proctoring Unblock Request"
                )}&body=${encodeURIComponent(
                  `Hello ${mentorName},\n\nMy assessment access was suspended due to a proctoring violation. Please review my proctoring log and unblock my test access.\n\nThank you!`
                )}`}
                className="underline hover:text-indigo-900 transition truncate font-medium"
              >
                {mentorEmail}
              </a>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={() => queryServerStatus(true)}
            disabled={isChecking || isAutoUnblocking}
            className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.99] disabled:opacity-50 text-white bg-slate-900 hover:bg-slate-800 shadow-md"
          >
            {isChecking || isAutoUnblocking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>Check Unblock Status</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl font-medium text-xs transition border cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 flex items-center justify-center gap-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Exit Assessment</span>
            </button>
          )}
        </div>

        {/* Real-time Listening Indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                isSuperDream ? "bg-amber-400" : "bg-emerald-400"
              } opacity-75`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isSuperDream ? "bg-amber-500" : "bg-emerald-500"
              }`}
            ></span>
          </span>
          <span>
            {isSuperDream
              ? "Listening for Mentor unblock authorization from Mentor Portal..."
              : "Listening for Mentor unblock signal or auto-unblock..."}
          </span>
        </div>
      </div>
    </div>
  );
}
