/**
 * Global Camera Stream Manager
 * Provides reliable, race-condition-free webcam acquisition with
 * automatic constraint fallback and clean track lifecycle management.
 */

let activeStream: MediaStream | null = null;
let acquisitionPromise: Promise<MediaStream> | null = null;

export async function acquireCameraStream(): Promise<MediaStream> {
  // 1. If we already have a healthy, active media stream with live video tracks, return it immediately
  if (
    activeStream &&
    activeStream.active &&
    activeStream.getVideoTracks().some((t) => t.readyState === "live" && t.enabled)
  ) {
    return activeStream;
  }

  // 2. If an acquisition is already in flight, reuse the promise to prevent device conflicts
  if (acquisitionPromise) {
    return acquisitionPromise;
  }

  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      "WebRTC Camera API is not available. Please ensure you are accessing via HTTPS or localhost."
    );
  }

  acquisitionPromise = (async () => {
    try {
      // Clean up any stale dead tracks first
      if (activeStream) {
        activeStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
        activeStream = null;
      }

      let stream: MediaStream | null = null;

      // Attempt 1: Standard recommended ideal constraints
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
      } catch (err: any) {
        console.warn("[CameraManager] Ideal constraint failed, trying basic video:", err);
      }

      // Attempt 2: Basic fallback without resolution/frame constraints
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (fallbackErr: any) {
          console.error("[CameraManager] Basic video acquisition failed:", fallbackErr);
          throw fallbackErr;
        }
      }

      activeStream = stream;
      return stream;
    } finally {
      acquisitionPromise = null;
    }
  })();

  return acquisitionPromise;
}

export function stopAllCameraStreams(): void {
  if (activeStream) {
    try {
      activeStream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
    } catch {}
    activeStream = null;
  }

  // Also sweep any active video elements in the DOM to stop lingering streams
  if (typeof document !== "undefined") {
    try {
      const videos = document.querySelectorAll("video");
      videos.forEach((v) => {
        if (v.srcObject instanceof MediaStream) {
          v.srcObject.getTracks().forEach((t) => {
            try {
              t.stop();
              t.enabled = false;
            } catch {}
          });
          v.srcObject = null;
        }
      });
    } catch {}
  }
}

// Emergency cleanup on page unload / hide
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", stopAllCameraStreams);
  window.addEventListener("pagehide", stopAllCameraStreams);
}


