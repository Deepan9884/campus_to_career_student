import { useEffect, useRef, useCallback, useState } from "react";
import { reportViolation } from "@/lib/proctoring-api";
import { acquireCameraStream, stopAllCameraStreams } from "@/lib/cameraManager";
import type { ModuleType, ViolationType } from "@/lib/proctoring-api";

export interface ProctoringSessionOptions {
  moduleType: ModuleType;
  moduleId: string;
  onBlocked: () => void;
  onViolation: (count: number, type: ViolationType) => void;
  enabled?: boolean;
  isStarted?: boolean;
  videoElement?: HTMLVideoElement | null;
}

export interface ProctoringSessionState {
  violationCount: number;
  isBlocked: boolean;
  cameraReady: boolean;
  cameraError: string | null;
  isFullscreen: boolean;
  mediaStream: MediaStream | null;
  aiModelReady: boolean;
}

// Blocked standalone system & function keys
const BLOCKED_STANDALONE_KEYS = new Set([
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
  "F13", "F14", "F15", "F16", "F17", "F18", "F19", "F20", "F21", "F22", "F23", "F24",
  "Meta", "OS", "Windows", "ContextMenu", "PrintScreen", "Snapshot", "Insert", "Pause", "ScrollLock", "Help",
]);

function isBlockedShortcut(e: KeyboardEvent): boolean {
  if (BLOCKED_STANDALONE_KEYS.has(e.key)) return true;
  if (e.metaKey || e.key === "Meta" || e.key === "OS" || e.key === "Windows") return true;
  if (e.altKey || e.key === "Alt" || e.key === "AltGraph") return true;
  if (e.ctrlKey || e.key === "Control") return true;
  return false;
}

const AI_INFERENCE_INTERVAL_MS = 1500;

export function useProctoringSession(options: ProctoringSessionOptions): ProctoringSessionState {
  const { moduleType, moduleId, onBlocked, onViolation, enabled = true, isStarted = false, videoElement } = options;

  const [state, setState] = useState<ProctoringSessionState>({
    violationCount: 0,
    isBlocked: false,
    cameraReady: false,
    cameraError: null,
    isFullscreen: false,
    mediaStream: null,
    aiModelReady: false,
  });

  const onBlockedRef = useRef(onBlocked);
  onBlockedRef.current = onBlocked;

  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;

  const isStartedRef = useRef(isStarted);
  isStartedRef.current = isStarted;

  const isBlockedRef = useRef(false);
  const reportingRef = useRef(false);
  const modelRef = useRef<any>(null);
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(videoElement || null);
  videoElementRef.current = videoElement || null;

  const phoneStreak = useRef(0);
  const noPersonStreak = useRef(0);
  const multiPersonStreak = useRef(0);

  const sendViolation = useCallback(
    async (type: ViolationType) => {
      if (reportingRef.current || isBlockedRef.current || !moduleId || !isStartedRef.current) return;
      reportingRef.current = true;
      try {
        const result = await reportViolation(moduleType, moduleId, type);
        setState((prev) => ({
          ...prev,
          violationCount: result.violationCount,
          isBlocked: result.isBlocked,
        }));
        onViolationRef.current(result.violationCount, type);
        if (result.isBlocked) {
          isBlockedRef.current = true;
          onBlockedRef.current();
        }
      } catch (err) {
        console.error("[Proctoring] Failed to report violation:", err);
      } finally {
        reportingRef.current = false;
      }
    },
    [moduleType, moduleId]
  );

  // ── 1. Fullscreen Tracking ────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    function handleFSChange() {
      const isFS = Boolean(document.fullscreenElement);
      setState((prev) => ({ ...prev, isFullscreen: isFS }));

      if (!isFS && isStartedRef.current && !isBlockedRef.current) {
        sendViolation("fullscreen_exit");
      }
    }

    document.addEventListener("fullscreenchange", handleFSChange);
    setState((prev) => ({ ...prev, isFullscreen: Boolean(document.fullscreenElement) }));

    return () => {
      document.removeEventListener("fullscreenchange", handleFSChange);
    };
  }, [enabled, sendViolation]);

  // ── 2. Tab Visibility & Focus Blur Detection ──────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    function handleVisibility() {
      if (document.hidden && isStartedRef.current && !isBlockedRef.current) {
        sendViolation("tab_switch");
      }
    }

    function handleWindowBlur() {
      if (isStartedRef.current && !isBlockedRef.current && document.fullscreenElement) {
        sendViolation("tab_switch");
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [enabled, sendViolation]);

  // ── 3. Strict Keyboard Lockdown, Clipboard & Context Menu ─────────────────
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (!isStartedRef.current || isBlockedRef.current) return;
      if (isBlockedShortcut(e)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        sendViolation("keyboard_shortcut");
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (!isStartedRef.current) return;
      if (isBlockedShortcut(e)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    }

    function handleClipboard(e: Event) {
      if (!isStartedRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      sendViolation("keyboard_shortcut");
    }

    function handleContextMenu(e: MouseEvent) {
      if (isStartedRef.current) e.preventDefault();
    }

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("keyup", handleKeyUp, { capture: true });
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    document.addEventListener("keyup", handleKeyUp, { capture: true });
    window.addEventListener("contextmenu", handleContextMenu, { capture: true });
    document.addEventListener("contextmenu", handleContextMenu, { capture: true });
    document.addEventListener("copy", handleClipboard, { capture: true });
    document.addEventListener("cut", handleClipboard, { capture: true });
    document.addEventListener("paste", handleClipboard, { capture: true });
    document.addEventListener("dragstart", (e) => e.preventDefault(), { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("keyup", handleKeyUp, { capture: true });
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.removeEventListener("keyup", handleKeyUp, { capture: true });
      window.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleClipboard, { capture: true });
      document.removeEventListener("cut", handleClipboard, { capture: true });
      document.removeEventListener("paste", handleClipboard, { capture: true });
    };
  }, [enabled, sendViolation]);

  // ── 4. Live Camera & AI Detector (Stable Lifecycle) ───────────────────────
  useEffect(() => {
    if (!enabled) {
      stopAllCameraStreams();
      return;
    }

    let active = true;
    let isDetecting = false;

    async function startCameraAndAI() {
      try {
        const stream = await acquireCameraStream();
        if (!active) {
          stopAllCameraStreams();
          return;
        }

        // Directly connect to video element if available
        if (videoElementRef.current) {
          videoElementRef.current.srcObject = stream;
          videoElementRef.current.play().catch(() => {});
        }

        setState((prev) => ({
          ...prev,
          cameraReady: true,
          mediaStream: stream,
          cameraError: null,
        }));

        // Load TensorFlow.js + COCO-SSD asynchronously in background
        try {
          const [tf, cocoSsd] = await Promise.all([
            import("@tensorflow/tfjs"),
            import("@tensorflow-models/coco-ssd"),
          ]);
          await tf.ready();
          const model = await cocoSsd.load({ base: "lite_mobilenet_v2" });
          if (!active) return;
          modelRef.current = model;
          setState((prev) => ({ ...prev, aiModelReady: true }));
        } catch (modelErr) {
          console.warn("[Proctoring AI] Background COCO-SSD load notice:", modelErr);
        }

        // Sequential, non-blocking AI Inference Loop on visible video
        async function runInferenceLoop() {
          if (!active) return;

          const targetVideo = videoElementRef.current;

          if (
            isStartedRef.current &&
            !isBlockedRef.current &&
            modelRef.current &&
            targetVideo &&
            !isDetecting
          ) {
            isDetecting = true;
            try {
              if (
                targetVideo.readyState >= 2 &&
                !targetVideo.paused &&
                !targetVideo.ended &&
                targetVideo.videoWidth > 0
              ) {
                const predictions = await modelRef.current.detect(
                  targetVideo,
                  10,
                  0.25
                );

                const detectedClasses = (predictions || []).map((p: any) => ({
                  class: p.class.toLowerCase(),
                  score: p.score,
                }));

                console.log("[Proctoring AI] Predictions:", detectedClasses);

                // 1. Mobile Phone & Handheld Device Detection
                const hasPhone = detectedClasses.some(
                  (p: any) => (p.class === "cell phone" || p.class === "remote" || p.class === "book") && p.score > 0.25
                );

                if (hasPhone) {
                  phoneStreak.current += 1;
                  if (phoneStreak.current >= 1) {
                    sendViolation("mobile_phone_detected");
                  }
                } else {
                  phoneStreak.current = 0;
                }

                // 2. Candidate Face / Person Presence Detection
                const personCount = detectedClasses.filter(
                  (p: any) => p.class === "person" && p.score > 0.40
                ).length;

                if (personCount === 0) {
                  noPersonStreak.current += 1;
                  if (noPersonStreak.current >= 4) {
                    noPersonStreak.current = 0;
                    sendViolation("face_not_detected");
                  }
                } else {
                  noPersonStreak.current = 0;
                }

                if (personCount > 1) {
                  multiPersonStreak.current += 1;
                  if (multiPersonStreak.current >= 2) {
                    multiPersonStreak.current = 0;
                    sendViolation("multiple_faces_detected");
                  }
                } else {
                  multiPersonStreak.current = 0;
                }
              }
            } catch {
              // Frame dropped safely
            } finally {
              isDetecting = false;
            }
          }

          if (active) {
            loopTimerRef.current = setTimeout(runInferenceLoop, AI_INFERENCE_INTERVAL_MS);
          }
        }

        loopTimerRef.current = setTimeout(runInferenceLoop, AI_INFERENCE_INTERVAL_MS);
      } catch (err: any) {
        if (!active) return;
        const errorMsg =
          err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
            ? "Camera permission denied. Live camera access is strictly required for proctored exams."
            : "Camera access failed. Please ensure a working webcam is connected and allowed.";
        setState((prev) => ({ ...prev, cameraReady: false, mediaStream: null, cameraError: errorMsg }));
      }
    }

    startCameraAndAI();

    return () => {
      active = false;
      if (loopTimerRef.current) {
        clearTimeout(loopTimerRef.current);
        loopTimerRef.current = null;
      }
      modelRef.current = null;
      stopAllCameraStreams();
    };
  }, [enabled, moduleId]);

  return state;
}
