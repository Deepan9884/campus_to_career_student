import { useEffect, useRef, useCallback, useState } from "react";
import { reportViolation } from "@/lib/proctoring-api";
import { acquireCameraStream, stopAllCameraStreams } from "@/lib/cameraManager";
import { getProctoringModel, runProctorDetection } from "@/lib/proctoringAiDetector";
import type { ModuleType, ViolationType } from "@/lib/proctoring-api";
import { analyzeEyeGaze, type GazeDirection, type FaceFramingStatus } from "@/lib/eyeGazeDetector";
import { playGazeWarningTone, playViolationStrikeTone, playClipboardAlertTone } from "@/lib/proctoringAudio";
import { toast } from "sonner";

export interface ProctoringSessionOptions {
  moduleType: ModuleType;
  moduleId: string;
  onBlocked: () => void;
  onViolation: (count: number, type: ViolationType) => void;
  enabled?: boolean;
  isStarted?: boolean;
  videoElement?: HTMLVideoElement | null;
  webcamRequired?: boolean;
  aiFaceDetection?: boolean;
  fullscreenEnforced?: boolean;
  tabSwitchLimit?: number;
  copyPasteDisabled?: boolean;
}

export type ProctoringAiStatus =
  | "initializing"
  | "loading_model"
  | "active"
  | "looking_away"
  | "partial_face"
  | "face_missing"
  | "phone_detected"
  | "multiple_faces"
  | "error";

export interface ViolationRecord {
  type: ViolationType;
  timestamp: string;
  count: number;
}

export interface ProctoringSessionState {
  violationCount: number;
  isBlocked: boolean;
  cameraReady: boolean;
  cameraError: string | null;
  isFullscreen: boolean;
  fullscreenCountdown: number | null;
  reEnterFullscreen: () => Promise<void>;
  mediaStream: MediaStream | null;
  aiModelReady: boolean;
  aiStatus: ProctoringAiStatus;
  detectedObjects: string[];
  violationsHistory: ViolationRecord[];
  retryCamera: () => void;
  resetSession: () => void;
  // Eye Gaze & Face Framing Tracking & Warnings
  gazeDirection: GazeDirection;
  isLookingAway: boolean;
  isFullFace: boolean;
  faceFramingStatus: FaceFramingStatus;
  gazeWarningsCount: number;
  gazeWarningsInCurrentStrike: number; // 0, 1, 2, 3
  lastGazeWarningMessage: string | null;
}

// Blocked standalone system & function keys
const BLOCKED_STANDALONE_KEYS = new Set([
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
  "F13", "F14", "F15", "F16", "F17", "F18", "F19", "F20", "F21", "F22", "F23", "F24",
  "Meta", "OS", "Windows", "ContextMenu", "PrintScreen", "Snapshot", "Insert", "Pause", "ScrollLock", "Help",
]);

// Whitelisted text editing keystrokes when focused inside code/text editor
const ALLOWED_EDITOR_CTRL_KEYS = new Set(["z", "Z", "y", "Y", "a", "A", "f", "F", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Backspace", "Delete"]);
const ALLOWED_COPY_PASTE_KEYS = new Set(["c", "C", "v", "V", "x", "X", "Insert"]);

// Whitelisted hardware brightness & display adjustment keys
const ALLOWED_BRIGHTNESS_KEYS = new Set([
  "BrightnessUp",
  "BrightnessDown",
  "BrightnessAuto",
  "BrightnessMin",
  "BrightnessMax",
  "MonBrightnessUp",
  "MonBrightnessDown",
  "KbdBrightnessUp",
  "KbdBrightnessDown",
  "DisplayToggleIntExt",
]);

function isBlockedShortcut(e: KeyboardEvent, allowCopyPaste = false): boolean {
  // Always permit hardware brightness and display adjustment function keys
  if (ALLOWED_BRIGHTNESS_KEYS.has(e.key) || ALLOWED_BRIGHTNESS_KEYS.has(e.code)) {
    return false;
  }

  // Strictly block Windows / Meta key press and any OS combination (Win, Win+G, Win+Alt+R, Win+Shift+S, Win+Tab, etc.)
  const isMetaOrWinKey =
    e.key === "Meta" ||
    e.key === "OS" ||
    e.key === "Windows" ||
    e.code === "MetaLeft" ||
    e.code === "MetaRight" ||
    e.code === "OSLeft" ||
    e.code === "OSRight" ||
    e.metaKey;

  if (isMetaOrWinKey) {
    return true;
  }

  // Windows Game Bar & screen recording hotkeys (Win+G, Win+Alt+R, Win+Alt+G, Alt+G, Ctrl+Alt+G)
  if (
    (e.metaKey || (e.altKey && (e.ctrlKey || e.shiftKey || e.metaKey))) &&
    (e.key === "g" || e.key === "G" || e.code === "KeyG" || e.key === "r" || e.key === "R" || e.code === "KeyR")
  ) {
    return true;
  }

  // Check PrintScreen & Screenshot shortcuts
  if (e.key === "PrintScreen" || e.code === "PrintScreen" || e.keyCode === 44 || e.key === "Snapshot") return true;

  // Screenshot hotkeys: Win+Shift+S, Cmd+Shift+3/4/5, Ctrl+Shift+S
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "S" || e.key === "s" || e.key === "3" || e.key === "4" || e.key === "5" || e.code === "KeyS")) {
    return true;
  }

  // DevTools inspection hotkeys (ALWAYS strictly blocked even inside code editor)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "i", "J", "j", "C", "c", "K", "k"].includes(e.key)) {
    return true;
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === "U" || e.key === "u")) {
    return true;
  }
  if (e.altKey && (e.metaKey || e.ctrlKey) && ["I", "i", "J", "j", "C", "c", "R", "r", "G", "g"].includes(e.key)) {
    return true;
  }

  // Prohibit any key bindings with Tab (e.g. Alt+Tab, Ctrl+Tab, Win+Tab). Standalone Tab is reserved only for code indentation.
  if ((e.key === "Tab" || e.code === "Tab") && (e.altKey || e.ctrlKey || e.metaKey)) {
    return true;
  }

  // Block Alt combinations (Alt+Tab, Alt+F4, Alt+Space, Alt+Enter, Alt+Esc, Alt+Letter)
  if (e.altKey && (e.key === "F4" || e.key === "Space" || e.key === "Escape" || e.key === "Enter" || /^[a-zA-Z0-9]$/.test(e.key))) {
    return true;
  }

  // Function keys F1-F24
  if (/^F\d+$/.test(e.key) || /^F\d+$/.test(e.code)) {
    return true;
  }

  // Standalone blocked system keys (excluding modifier keys)
  if (BLOCKED_STANDALONE_KEYS.has(e.key) || BLOCKED_STANDALONE_KEYS.has(e.code)) return true;

  // ContextMenu key
  if (e.key === "ContextMenu" || e.code === "ContextMenu") return true;

  const target = e.target as HTMLElement | null;
  const isInsideTextInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable || target.closest(".monaco-editor"));

  // Always permit Undo (Ctrl+Z), Redo (Ctrl+Y / Ctrl+Shift+Z), Select All (Ctrl+A), and Find (Ctrl+F) ONLY inside active code/text inputs
  if (isInsideTextInput && (e.ctrlKey || e.metaKey) && ["z", "Z", "y", "Y", "a", "A", "f", "F"].includes(e.key)) {
    return false;
  }

  // Allowed copy/paste keys if enabled AND inside text editor
  if (allowCopyPaste && isInsideTextInput && (e.ctrlKey || e.metaKey) && ALLOWED_COPY_PASTE_KEYS.has(e.key)) {
    return false;
  }

  // Block specific dangerous browser navigation Ctrl combinations (reload, new tab, close, print, save, etc.)
  const FORBIDDEN_CTRL_KEYS = new Set([
    "r", "R", "w", "W", "t", "T", "n", "N", "p", "P", "s", "S", "d", "D", "h", "H", "j", "J", "l", "L", "o", "O", "e", "E", "g", "G", "b", "B", "q", "Q", "k", "K", "m", "M",
  ]);

  if ((e.ctrlKey || e.metaKey) && FORBIDDEN_CTRL_KEYS.has(e.key)) {
    return true;
  }

  return false;
}

const AI_INFERENCE_INTERVAL_MS = 600;

export function useProctoringSession(options: ProctoringSessionOptions): ProctoringSessionState {
  const {
    moduleType,
    moduleId,
    onBlocked,
    onViolation,
    enabled = true,
    isStarted = false,
    videoElement,
    webcamRequired = true,
    aiFaceDetection = true,
    fullscreenEnforced = true,
    tabSwitchLimit = 3,
    copyPasteDisabled = false,
  } = options;

  const [cameraAttempt, setCameraAttempt] = useState(0);

  const retryCamera = useCallback(() => {
    setCameraAttempt((prev) => prev + 1);
  }, []);

  const reEnterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && typeof document !== "undefined") {
        await document.documentElement.requestFullscreen();
      }
      clearFullscreenCountdown();
      setState((prev) => ({ ...prev, isFullscreen: true, fullscreenCountdown: null }));
    } catch (err) {
      console.warn("[Proctoring] Failed to re-enter fullscreen:", err);
      throw err;
    }
  }, []);

  const resetSession = useCallback(() => {
    isBlockedRef.current = false;
    if (fullscreenIntervalRef.current) {
      clearInterval(fullscreenIntervalRef.current);
      fullscreenIntervalRef.current = null;
    }
    fullscreenCountdownRef.current = null;
    phoneStreak.current = 0;
    noPersonStreak.current = 0;
    multiPersonStreak.current = 0;
    lookAwayStreak.current = 0;
    startTimestampRef.current = Date.now();
    setState((prev) => ({
      ...prev,
      violationCount: 0,
      isBlocked: false,
      fullscreenCountdown: null,
      gazeWarningsCount: 0,
      gazeWarningsInCurrentStrike: 0,
      lastGazeWarningMessage: null,
      violationsHistory: [],
    }));
  }, []);

  const [state, setState] = useState<ProctoringSessionState>({
    violationCount: 0,
    isBlocked: false,
    cameraReady: !webcamRequired,
    cameraError: null,
    isFullscreen: false,
    fullscreenCountdown: null,
    reEnterFullscreen,
    mediaStream: null,
    aiModelReady: false,
    aiStatus: webcamRequired ? "initializing" : "active",
    detectedObjects: [],
    violationsHistory: [],
    retryCamera,
    resetSession,
    gazeDirection: "center",
    isLookingAway: false,
    isFullFace: true,
    faceFramingStatus: "full_face",
    gazeWarningsCount: 0,
    gazeWarningsInCurrentStrike: 0,
    lastGazeWarningMessage: null,
  });

  const onBlockedRef = useRef(onBlocked);
  onBlockedRef.current = onBlocked;

  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;

  const isStartedRef = useRef(isStarted);
  isStartedRef.current = isStarted;

  const startTimestampRef = useRef<number>(0);
  useEffect(() => {
    if (isStarted) {
      startTimestampRef.current = Date.now();
    } else {
      startTimestampRef.current = 0;
    }
  }, [isStarted]);

  const isBlockedRef = useRef(false);
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inferenceVideoRef = useRef<HTMLVideoElement | null>(null);
  const externalVideoRef = useRef<HTMLVideoElement | null>(videoElement || null);
  externalVideoRef.current = videoElement || null;

  const fullscreenIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fullscreenCountdownRef = useRef<number | null>(null);

  const phoneStreak = useRef(0);
  const noPersonStreak = useRef(0);
  const multiPersonStreak = useRef(0);
  const lookAwayStreak = useRef(0);

  const lastPhoneViolationTime = useRef(0);
  const lastMultiPersonViolationTime = useRef(0);
  const lastNoPersonViolationTime = useRef(0);
  const lastGazeWarningTime = useRef(0);
  const gazeWarningsCountRef = useRef(0);
  const lastViolationDispatchTime = useRef<Record<string, number>>({});

  // Synchronize external video whenever videoElement or stream changes
  useEffect(() => {
    if (videoElement && state.mediaStream) {
      if (videoElement.srcObject !== state.mediaStream) {
        videoElement.srcObject = state.mediaStream;
        videoElement.play().catch(() => {});
      }
    }
  }, [videoElement, state.mediaStream]);

  const sendViolation = useCallback(
    (type: ViolationType, forceBlock = false) => {
      const effectiveModuleId = moduleId || "active-session";
      if ((isBlockedRef.current && !forceBlock) || !isStartedRef.current) return;

      const now = Date.now();
      // Brief 2-second warm-up after starting exam to allow fullscreen mode activation
      if (
        isStartedRef.current &&
        startTimestampRef.current > 0 &&
        now - startTimestampRef.current < 2000 &&
        !forceBlock
      ) {
        console.log(`[Proctoring] Suppressing initial entrance warm-up event: ${type}`);
        return;
      }

      const lastTime = lastViolationDispatchTime.current[type] || 0;
      // 1.5s cooldown to prevent rapid multi-firing
      if (now - lastTime < 1500 && !forceBlock) {
        return;
      }
      lastViolationDispatchTime.current[type] = now;

      // Immediately increment local count & calculate block
      setState((prev) => {
        const nextCount = forceBlock ? tabSwitchLimit : Math.min(tabSwitchLimit, prev.violationCount + 1);
        const shouldBlock = forceBlock || nextCount >= tabSwitchLimit;
        const timeStr = new Date().toLocaleTimeString();

        if (shouldBlock) {
          isBlockedRef.current = true;
        }

        // Fire audio tone and callback immediately
        playViolationStrikeTone();
        onViolationRef.current(nextCount, type);

        if (shouldBlock) {
          onBlockedRef.current();
        }

        return {
          ...prev,
          violationCount: nextCount,
          isBlocked: shouldBlock,
          violationsHistory: [
            ...prev.violationsHistory,
            { type, timestamp: timeStr, count: nextCount },
          ],
        };
      });

      // Fire-and-forget sync to backend
      reportViolation(moduleType, effectiveModuleId, type, forceBlock).catch((err) => {
        console.warn("[Proctoring Sync] Remote violation log error, local strike recorded:", err);
      });
    },
    [moduleType, moduleId, tabSwitchLimit]
  );

  const clearFullscreenCountdown = useCallback(() => {
    if (fullscreenIntervalRef.current) {
      clearInterval(fullscreenIntervalRef.current);
      fullscreenIntervalRef.current = null;
    }
    fullscreenCountdownRef.current = null;
    setState((prev) => (prev.fullscreenCountdown !== null ? { ...prev, fullscreenCountdown: null } : prev));
  }, []);

  const handleFullscreenTimeout = useCallback(() => {
    if (fullscreenIntervalRef.current) {
      clearInterval(fullscreenIntervalRef.current);
      fullscreenIntervalRef.current = null;
    }
    fullscreenCountdownRef.current = 0;
    isBlockedRef.current = true;
    setState((prev) => ({
      ...prev,
      isBlocked: true,
      fullscreenCountdown: 0,
    }));
    sendViolation("fullscreen_timeout", true);
    onBlockedRef.current();
  }, [sendViolation]);

  const startFullscreenCountdown = useCallback(() => {
    if (fullscreenIntervalRef.current) {
      clearInterval(fullscreenIntervalRef.current);
    }
    const INITIAL_COUNTDOWN = 15;
    fullscreenCountdownRef.current = INITIAL_COUNTDOWN;
    setState((prev) => ({ ...prev, fullscreenCountdown: INITIAL_COUNTDOWN }));

    fullscreenIntervalRef.current = setInterval(() => {
      if (fullscreenCountdownRef.current === null) {
        if (fullscreenIntervalRef.current) clearInterval(fullscreenIntervalRef.current);
        return;
      }
      const nextCount = fullscreenCountdownRef.current - 1;
      fullscreenCountdownRef.current = nextCount;

      if (nextCount <= 0) {
        if (fullscreenIntervalRef.current) {
          clearInterval(fullscreenIntervalRef.current);
          fullscreenIntervalRef.current = null;
        }
        handleFullscreenTimeout();
      } else {
        setState((prev) => ({ ...prev, fullscreenCountdown: nextCount }));
      }
    }, 1000);
  }, [handleFullscreenTimeout]);

  // ── 1. Fullscreen Tracking, System Keyboard Lock & 15-Second Grace Countdown ────
  useEffect(() => {
    if (!enabled) {
      clearFullscreenCountdown();
      return;
    }

    async function requestSystemKeyboardLock() {
      if (typeof navigator !== "undefined" && "keyboard" in navigator && (navigator as any).keyboard?.lock) {
        try {
          if (document.fullscreenElement) {
            await (navigator as any).keyboard.lock([
              "Escape",
              "MetaLeft",
              "MetaRight",
              "KeyG",
              "KeyR",
              "KeyS",
              "KeyD",
              "KeyE",
              "KeyX",
              "KeyC",
              "KeyV",
              "KeyU",
              "KeyP",
              "Tab",
              "AltLeft",
              "AltRight",
              "ContextMenu",
              "PrintScreen",
              "F1",
              "F2",
              "F3",
              "F4",
              "F5",
              "F6",
              "F7",
              "F8",
              "F9",
              "F10",
              "F11",
              "F12",
            ]);
          }
        } catch {
          try {
            await (navigator as any).keyboard.lock();
          } catch {}
        }
      }
    }

    function releaseSystemKeyboardLock() {
      if (typeof navigator !== "undefined" && "keyboard" in navigator && (navigator as any).keyboard?.unlock) {
        try {
          (navigator as any).keyboard.unlock();
        } catch {}
      }
    }

    function handleFSChange() {
      const isFS = Boolean(document.fullscreenElement);
      setState((prev) => ({ ...prev, isFullscreen: isFS }));

      if (isFS) {
        // Re-entered fullscreen within grace period -> cancel countdown and lock system keys
        clearFullscreenCountdown();
        requestSystemKeyboardLock();
      } else if (isStartedRef.current && !isBlockedRef.current) {
        // Left fullscreen during active exam -> strike violation + start 15s timer + unlock
        releaseSystemKeyboardLock();
        sendViolation("fullscreen_exit");
        startFullscreenCountdown();
      }
    }

    document.addEventListener("fullscreenchange", handleFSChange);
    const initialFS = Boolean(document.fullscreenElement);
    setState((prev) => ({ ...prev, isFullscreen: initialFS }));
    if (initialFS) {
      requestSystemKeyboardLock();
    }

    return () => {
      document.removeEventListener("fullscreenchange", handleFSChange);
      clearFullscreenCountdown();
      releaseSystemKeyboardLock();
    };
  }, [enabled, sendViolation, startFullscreenCountdown, clearFullscreenCountdown]);

  // ── 2. Tab Visibility & Focus Blur Detection ──────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    function handleVisibility() {
      if (document.hidden && isStartedRef.current && !isBlockedRef.current) {
        sendViolation("tab_switch");
        if (fullscreenCountdownRef.current === null) {
          startFullscreenCountdown();
        }
        setState((prev) => ({ ...prev, isFullscreen: false }));
      } else if (!document.hidden && document.fullscreenElement) {
        clearFullscreenCountdown();
        setState((prev) => ({ ...prev, isFullscreen: true }));
      }
    }

    function handleWindowBlur() {
      if (isStartedRef.current && !isBlockedRef.current) {
        sendViolation("tab_switch");
        if (fullscreenCountdownRef.current === null) {
          startFullscreenCountdown();
        }
        setState((prev) => ({ ...prev, isFullscreen: false }));
      }
    }

    function handleWindowFocus() {
      if (document.fullscreenElement) {
        clearFullscreenCountdown();
        setState((prev) => ({ ...prev, isFullscreen: true }));
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [enabled, sendViolation, startFullscreenCountdown, clearFullscreenCountdown]);

  // ── 3. Strict Keyboard Lockdown, Screenshot Detection & Anti-Copy ─────────
  useEffect(() => {
    if (!enabled) return;

    async function wipeClipboard() {
      if (!copyPasteDisabled) return;
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText("");
        }
      } catch {}
    }

    if (isStarted && copyPasteDisabled) {
      wipeClipboard();
    }

    function handleWindowFocus() {
      if (isStartedRef.current && !isBlockedRef.current && copyPasteDisabled) {
        wipeClipboard();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (!isStartedRef.current || isBlockedRef.current) return;

      const isPrintScreen = e.key === "PrintScreen" || e.code === "PrintScreen" || e.keyCode === 44;
      const isScreenshotCombo =
        ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "S" || e.key === "s" || e.key === "3" || e.key === "4" || e.key === "5" || e.code === "KeyS")) ||
        (e.altKey && isPrintScreen) ||
        (e.ctrlKey && isPrintScreen);

      if (isPrintScreen || isScreenshotCombo) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        wipeClipboard();
        playClipboardAlertTone();
        toast.error("Screenshot Blocked: Screenshots and screen captures are strictly prohibited during the assessment.", {
          id: `proctor-screenshot-${Date.now()}`,
          duration: 5000,
        });
        sendViolation("keyboard_shortcut");
        return;
      }

      const target = e.target as HTMLElement | null;
      const isInsideTextInput = Boolean(
        target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable ||
            target.closest(".monaco-editor"))
      );

      // Always permit Undo (Ctrl+Z), Redo (Ctrl+Y / Ctrl+Shift+Z), Select All (Ctrl+A), and Find (Ctrl+F) inside active code/text inputs
      if (
        isInsideTextInput &&
        (e.ctrlKey || e.metaKey) &&
        ["z", "Z", "y", "Y", "a", "A", "f", "F"].includes(e.key)
      ) {
        return; // Allow!
      }

      // Check Windows / Meta keys and OS combinations (Win, Win+G, Win+Alt+R, etc.)
      const isMetaOrWinKey =
        e.key === "Meta" ||
        e.key === "OS" ||
        e.key === "Windows" ||
        e.code === "MetaLeft" ||
        e.code === "MetaRight" ||
        e.code === "OSLeft" ||
        e.code === "OSRight" ||
        (!isInsideTextInput && e.metaKey);

      if (isMetaOrWinKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        wipeClipboard();
        playClipboardAlertTone();
        toast.error("System Shortcut Blocked: Windows key, Game Bar (Win+G), and OS shortcuts are disabled during proctored exams.", {
          id: `proctor-winkey-${Date.now()}`,
          duration: 4000,
        });
        sendViolation("keyboard_shortcut");
        return;
      }

      const isCopyCombo =
        (e.ctrlKey || e.metaKey) &&
        (e.key === "c" || e.key === "C" || e.key === "v" || e.key === "V" || e.key === "x" || e.key === "X" || e.key === "Insert");

      // If copy-paste avoidance is NOT selected by admin, allow standard copy/paste/cut/undo keys!
      if (!copyPasteDisabled && isCopyCombo) {
        return; // Allow!
      }

      if (copyPasteDisabled && isCopyCombo) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        wipeClipboard();
        try {
          window.getSelection()?.removeAllRanges();
        } catch {}
        playClipboardAlertTone();
        toast.error("Clipboard Sanitized: Copying and pasting is prohibited during the exam. All clipboard data has been erased.", {
          id: `proctor-copy-${Date.now()}`,
          duration: 4000,
        });
        sendViolation("keyboard_shortcut");
        return;
      }

      if (isBlockedShortcut(e, !copyPasteDisabled)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        sendViolation("keyboard_shortcut");
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (!isStartedRef.current) return;

      const isPrintScreen = e.key === "PrintScreen" || e.code === "PrintScreen" || e.keyCode === 44;
      if (isPrintScreen) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        wipeClipboard();
        sendViolation("keyboard_shortcut");
        return;
      }

      const isMetaOrWinKey =
        e.key === "Meta" ||
        e.key === "OS" ||
        e.key === "Windows" ||
        e.code === "MetaLeft" ||
        e.code === "MetaRight" ||
        e.code === "OSLeft" ||
        e.code === "OSRight" ||
        e.metaKey;

      if (isMetaOrWinKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }

      if (isBlockedShortcut(e, !copyPasteDisabled)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    }

    function handleClipboard(e: Event) {
      if (!isStartedRef.current || !copyPasteDisabled) return;
      e.preventDefault();
      e.stopPropagation();

      const clipEvent = e as ClipboardEvent;
      if (clipEvent.clipboardData) {
        try {
          clipEvent.clipboardData.setData("text/plain", "");
          clipEvent.clipboardData.setData("text/html", "");
        } catch {}
      }

      try {
        window.getSelection()?.removeAllRanges();
      } catch {}

      wipeClipboard();
      playClipboardAlertTone();
      toast.error("Clipboard Sanitized: Copying and pasting is disabled. All copied data has been cleared from clipboard.", {
        id: `proctor-clip-${Date.now()}`,
        duration: 3500,
      });

      sendViolation("keyboard_shortcut");
    }

    function handleContextMenu(e: MouseEvent) {
      if (isStartedRef.current && copyPasteDisabled) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    function handleSelectStart(e: Event) {
      if (!isStartedRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.closest(".proctor-question-protected") || (copyPasteDisabled && !target.closest("input") && !target.closest("textarea") && !target.closest(".monaco-editor")))) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    if (copyPasteDisabled) {
      window.addEventListener("focus", handleWindowFocus);
    }
    window.addEventListener("keydown", handleKeyDown, { capture: true, passive: false });
    window.addEventListener("keyup", handleKeyUp, { capture: true, passive: false });
    document.addEventListener("keydown", handleKeyDown, { capture: true, passive: false });
    document.addEventListener("keyup", handleKeyUp, { capture: true, passive: false });
    document.addEventListener("selectstart", handleSelectStart, { capture: true, passive: false });

    if (copyPasteDisabled) {
      window.addEventListener("contextmenu", handleContextMenu, { capture: true });
      document.addEventListener("contextmenu", handleContextMenu, { capture: true });
      document.addEventListener("copy", handleClipboard, { capture: true });
      document.addEventListener("cut", handleClipboard, { capture: true });
      document.addEventListener("paste", handleClipboard, { capture: true });
      document.addEventListener("dragstart", (e) => e.preventDefault(), { capture: true });
    }

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("keydown", handleKeyDown, { capture: true } as any);
      window.removeEventListener("keyup", handleKeyUp, { capture: true } as any);
      document.removeEventListener("keydown", handleKeyDown, { capture: true } as any);
      document.removeEventListener("keyup", handleKeyUp, { capture: true } as any);
      document.removeEventListener("selectstart", handleSelectStart, { capture: true } as any);
      window.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleClipboard, { capture: true } as any);
      document.removeEventListener("cut", handleClipboard, { capture: true } as any);
      document.removeEventListener("paste", handleClipboard, { capture: true } as any);
    };
  }, [enabled, isStarted, copyPasteDisabled, sendViolation]);

  // ── 4. Live Camera & Dedicated Self-Contained AI Pipeline ─────────────────
  useEffect(() => {
    if (!enabled || !webcamRequired) {
      stopAllCameraStreams();
      if (!webcamRequired) {
        setState((prev) => ({
          ...prev,
          cameraReady: true,
          cameraError: null,
          aiStatus: "active",
        }));
      }
      return;
    }

    let active = true;
    let isDetecting = false;

    async function startCameraAndAI() {
      try {
        setState((prev) => ({ ...prev, cameraError: null, aiStatus: "initializing" }));
        const stream = await acquireCameraStream();
        if (!active) return;

        // Attach track event listeners for hardware disconnect or manual shutoff
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            if (!active) return;
            console.warn("[Proctoring AI] Camera track ended by user/hardware!");
            setState((prev) => ({
              ...prev,
              cameraReady: false,
              cameraError: "Camera feed disconnected or disabled.",
              aiStatus: "face_missing",
            }));
            sendViolation("face_not_detected");
          };

          videoTrack.onmute = () => {
            if (!active) return;
            console.warn("[Proctoring AI] Camera track muted by user/system!");
            setState((prev) => ({
              ...prev,
              aiStatus: "face_missing",
            }));
            sendViolation("face_not_detected");
          };
        }

        // 1. Create a dedicated off-screen video element for uninterrupted AI inference
        if (typeof document !== "undefined") {
          let invVideo = inferenceVideoRef.current;
          if (!invVideo) {
            invVideo = document.createElement("video");
            invVideo.setAttribute("playsinline", "true");
            invVideo.setAttribute("webkit-playsinline", "true");
            invVideo.muted = true;
            invVideo.width = 640;
            invVideo.height = 480;
            inferenceVideoRef.current = invVideo;
          }
          invVideo.srcObject = stream;
          invVideo.play().catch(() => {});
        }

        // 2. Also attach to external video element if provided
        if (externalVideoRef.current) {
          externalVideoRef.current.srcObject = stream;
          externalVideoRef.current.play().catch(() => {});
        }

        setState((prev) => ({
          ...prev,
          cameraReady: true,
          mediaStream: stream,
          cameraError: null,
          aiStatus: "loading_model",
        }));

        // 3. Load Singleton Neural Detector
        try {
          await getProctoringModel();

          if (!active) return;

          setState((prev) => ({
            ...prev,
            aiModelReady: true,
            aiStatus: "active",
          }));
          console.log("[Proctoring AI] Neural detector active and scanning.");
        } catch (modelErr) {
          console.error("[Proctoring AI] Failed to load object detection model:", modelErr);
          if (active) {
            setState((prev) => ({ ...prev, aiStatus: "error" }));
          }
        }

        // 4. Autonomous Sequential AI Inference Loop
        async function runInferenceLoop() {
          if (!active) return;

          // Check if active video track is live and enabled
          const activeTrack = stream.getVideoTracks()[0];
          const isTrackLive = activeTrack && activeTrack.readyState === "live" && activeTrack.enabled;

          // Prefer visible DOM video element, fallback to offscreen element
          const targetVideo =
            externalVideoRef.current &&
            externalVideoRef.current.readyState >= 2 &&
            externalVideoRef.current.videoWidth > 0
              ? externalVideoRef.current
              : inferenceVideoRef.current;

          if (isStartedRef.current && !isBlockedRef.current) {
            // Case 1: Camera stream is turned off, muted, or has no valid frames
            if (!isTrackLive || !targetVideo || targetVideo.readyState < 2 || targetVideo.videoWidth === 0) {
              noPersonStreak.current += 1;
              setState((prev) => ({
                ...prev,
                aiStatus: "face_missing",
                detectedObjects: ["Camera Offline / No Feed"],
              }));

              // If camera stays offline for 3 consecutive ticks (~1.8s) -> trigger violation
              if (noPersonStreak.current >= 3) {
                noPersonStreak.current = 0;
                sendViolation("face_not_detected");
              }
            } else if (!isDetecting) {
              // Case 2: Camera is live -> run neural object & face inference
              isDetecting = true;
              try {
                const predictions = await runProctorDetection(targetVideo);

                if (predictions && predictions.length >= 0) {
                  const detectedClasses = predictions.map((p) => ({
                    class: p.class,
                    score: p.score,
                  }));

                  const objectSummary = detectedClasses.map((d) => `${d.class} (${Math.round(d.score * 100)}%)`);

                  // ── A. Mobile Phone Detection (High-Precision Neural Recognition) ──
                  const hasPhone = predictions.some((p) => {
                    if (p.class !== "cell phone" && p.class !== "remote") return false;
                    // Responsive confidence threshold (>= 0.25) catches phones held in frame or angled
                    if (p.score < 0.25) return false;
                    return true;
                  });

                  if (hasPhone) {
                    phoneStreak.current += 1;
                    setState((prev) => ({
                      ...prev,
                      aiStatus: "phone_detected",
                      detectedObjects: objectSummary,
                    }));

                    // Immediate violation dispatch upon phone presence, throttled by 4.5s cooldown
                    const now = Date.now();
                    if (now - lastPhoneViolationTime.current > 4500) {
                      lastPhoneViolationTime.current = now;
                      sendViolation("mobile_phone_detected");
                    }
                  } else {
                    phoneStreak.current = 0;
                  }

                  // ── B. Face / Candidate Presence Verification with Spatial Deduplication ──
                  if (!hasPhone) {
                    // Filter candidate detections: 0.20 threshold catches secondary people in darker / peripheral areas
                    const personBoxes = predictions
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

                    let distinctPersonsCount = 0;
                    if (personBoxes.length === 0) {
                      const anyPerson = predictions.some((p) => p.class === "person" && p.score >= 0.18);
                      distinctPersonsCount = anyPerson ? 1 : 0;
                    } else if (personBoxes.length === 1) {
                      distinctPersonsCount = 1;
                    } else {
                      // Deduplicate overlapping/nested boxes for the same individual
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

                          // Same person if: significant overlap (> 30%) OR horizontal centers are very close (< 35% width)
                          if (overlapRatio > 0.30 || centerDistX < minW * 0.35) {
                            isDuplicateOfSamePerson = true;
                            break;
                          }
                        }
                        if (!isDuplicateOfSamePerson) {
                          kept.push(box);
                        }
                      }
                      distinctPersonsCount = kept.length;
                    }

                    if (distinctPersonsCount === 0) {
                      noPersonStreak.current += 1;
                      multiPersonStreak.current = 0;
                      if (noPersonStreak.current >= 2) {
                        setState((prev) => ({
                          ...prev,
                          aiStatus: "face_missing",
                          detectedObjects: objectSummary,
                        }));
                      }

                      // 4 consecutive absence ticks (~2.4 seconds) triggers missing face violation with 5s cooldown
                      const now = Date.now();
                      if (noPersonStreak.current >= 4 && now - lastNoPersonViolationTime.current > 5000) {
                        lastNoPersonViolationTime.current = now;
                        noPersonStreak.current = 0;
                        sendViolation("face_not_detected");
                      }
                    } else if (distinctPersonsCount > 1) {
                      multiPersonStreak.current += 1;
                      noPersonStreak.current = 0;
                      if (multiPersonStreak.current >= 1) {
                        setState((prev) => ({
                          ...prev,
                          aiStatus: "multiple_faces",
                          detectedObjects: objectSummary,
                        }));
                      }

                      // 2 consecutive ticks (~1.2 seconds) with verified distinct multiple people triggers violation with 4.5s cooldown
                      const now = Date.now();
                      if (multiPersonStreak.current >= 2 && now - lastMultiPersonViolationTime.current > 4500) {
                        lastMultiPersonViolationTime.current = now;
                        sendViolation("multiple_faces_detected");
                      }
                    } else {
                      // Exactly 1 candidate verified in frame -> Run Eye Gaze & Head Pose Analysis
                      noPersonStreak.current = 0;
                      multiPersonStreak.current = 0;

                      const primaryPerson = personBoxes[0];
                      const gaze = analyzeEyeGaze(
                        targetVideo,
                        primaryPerson ? [primaryPerson.x, primaryPerson.y, primaryPerson.w, primaryPerson.h] : undefined
                      );

                      const now = Date.now();

                      const isWarningCondition = gaze.isLookingAway || !gaze.isFullFace;

                      if (isWarningCondition) {
                        lookAwayStreak.current += 1;

                        const isFaceMissing = gaze.framingStatus === "no_face_features";
                        const isPartialFace = !gaze.isFullFace && !isFaceMissing;
                        const requiredStreak = 5; // 5 ticks (~3.0-3.5s) of continuous look-away confirmation

                        // After 5 continuous look-away ticks (~3.0-3.5s) with 5.0s cooldown
                        if (lookAwayStreak.current >= requiredStreak && now - lastGazeWarningTime.current > 5000) {
                          lastGazeWarningTime.current = now;
                          lookAwayStreak.current = 0;

                          const totalWarnings = gazeWarningsCountRef.current + 1;
                          gazeWarningsCountRef.current = totalWarnings;
                          const warningInCurrentStrike = ((totalWarnings - 1) % 4) + 1;

                          const warningMsg = isFaceMissing
                            ? `Face Missing Alert: ${gaze.framingWarning || "Full face must be visible"} (Warning ${warningInCurrentStrike}/4)`
                            : isPartialFace
                            ? `Face Alert: ${gaze.framingWarning || "Full face must be visible (no half/quarter face)"} (Warning ${warningInCurrentStrike}/4)`
                            : `Eye Gaze Alert: ${gaze.description} (Warning ${warningInCurrentStrike}/4)`;

                          setState((prev) => ({
                            ...prev,
                            aiStatus: isFaceMissing ? "face_missing" : isPartialFace ? "partial_face" : "looking_away",
                            gazeDirection: gaze.direction,
                            isLookingAway: gaze.isLookingAway,
                            isFullFace: gaze.isFullFace,
                            faceFramingStatus: gaze.framingStatus,
                            gazeWarningsCount: totalWarnings,
                            gazeWarningsInCurrentStrike: warningInCurrentStrike,
                            lastGazeWarningMessage: warningMsg,
                            detectedObjects: objectSummary,
                          }));

                          if (warningInCurrentStrike === 4) {
                            // 4 Warnings reached -> 1 Violation Strike
                            playViolationStrikeTone();
                            toast.error(`🚨 Proctoring Strike: 4 Warnings Reached (${isFaceMissing ? "Face not visible" : isPartialFace ? gaze.framingWarning : gaze.description})`, {
                              duration: 6000,
                              id: `proctor-strike-converted-${totalWarnings}`,
                            });
                            sendViolation("eye_tracking_violation");
                          } else {
                            // Warning 1, 2, or 3 of 4
                            playGazeWarningTone();
                            toast.warning(`⚠️ ${isFaceMissing ? "Face Missing" : isPartialFace ? "Face" : "Eye Gaze"} Warning (${warningInCurrentStrike}/4): ${isFaceMissing ? "Full face must be visible in front of camera!" : isPartialFace ? gaze.framingWarning : gaze.description}`, {
                              duration: 4000,
                              id: `proctor-warning-active-${totalWarnings}`,
                            });
                          }
                        } else if (lookAwayStreak.current >= 1) {
                          setState((prev) => ({
                            ...prev,
                            aiStatus: isFaceMissing ? "face_missing" : isPartialFace ? "partial_face" : "looking_away",
                            gazeDirection: gaze.direction,
                            isLookingAway: gaze.isLookingAway,
                            isFullFace: gaze.isFullFace,
                            faceFramingStatus: gaze.framingStatus,
                            detectedObjects: objectSummary,
                          }));
                        }
                      } else {
                        lookAwayStreak.current = 0;
                        setState((prev) => ({
                          ...prev,
                          aiStatus: "active",
                          gazeDirection: "center",
                          isLookingAway: false,
                          isFullFace: true,
                          faceFramingStatus: "full_face",
                          detectedObjects: objectSummary,
                        }));
                      }
                    }
                  }
                }
              } catch {
                // Frame dropped safely without crashing loop
              } finally {
                isDetecting = false;
              }
            }
          }

          if (active) {
            loopTimerRef.current = setTimeout(runInferenceLoop, AI_INFERENCE_INTERVAL_MS);
          }
        }

        loopTimerRef.current = setTimeout(runInferenceLoop, AI_INFERENCE_INTERVAL_MS);
      } catch (err: any) {
        if (!active) return;
        console.error("[Proctoring] Camera acquisition error:", err);
        let errorMsg = "Camera access failed. Please ensure a working webcam is connected and allowed.";
        if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
          errorMsg = "Camera permission denied. Please click the camera icon in your browser address bar and grant camera access.";
        } else if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
          errorMsg = "No webcam detected. Please connect a webcam or enable your laptop camera.";
        } else if (err?.name === "NotReadableError" || err?.name === "TrackStartError") {
          errorMsg = "Camera is currently in use by another application (e.g. Zoom, Teams, Lenovo Vantage). Please close other camera apps and click Retry.";
        } else if (err?.name === "OverconstrainedError") {
          errorMsg = "Camera does not support requested settings.";
        } else if (err?.message) {
          errorMsg = err.message;
        }

        setState((prev) => ({
          ...prev,
          cameraReady: false,
          mediaStream: null,
          cameraError: errorMsg,
          aiStatus: "error",
        }));
      }
    }

    startCameraAndAI();

    return () => {
      active = false;
      if (loopTimerRef.current) {
        clearTimeout(loopTimerRef.current);
        loopTimerRef.current = null;
      }
      if (inferenceVideoRef.current) {
        inferenceVideoRef.current.pause();
        inferenceVideoRef.current.srcObject = null;
      }
      if (externalVideoRef.current) {
        externalVideoRef.current.srcObject = null;
      }
      // Ensure webcam hardware stream is completely closed
      stopAllCameraStreams();
    };
  }, [enabled, moduleId, cameraAttempt]);

  return state;
}
