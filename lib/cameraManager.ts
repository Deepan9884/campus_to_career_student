/**
 * Global Camera Stream Manager
 * Ensures zero-leak camera lifecycle, cancels pending promises on unmount,
 * and shuts off hardware webcam immediately.
 */

const activeStreams = new Set<MediaStream>();
let isAcquiring = false;
let cancelAcquisition = false;

export async function acquireCameraStream(): Promise<MediaStream> {
  // If we already have an active stream with live tracks, reuse it!
  for (const stream of activeStreams) {
    if (stream.active && stream.getVideoTracks().some((t) => t.readyState === "live")) {
      return stream;
    }
  }

  // Stop any stale tracks
  stopAllCameraStreams();
  
  isAcquiring = true;
  cancelAcquisition = false;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user",
      },
      audio: false,
    });

    // If cancelled while getUserMedia was resolving, kill it immediately!
    if (cancelAcquisition) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch {}
      });
      isAcquiring = false;
      throw new Error("Camera acquisition cancelled");
    }

    activeStreams.add(stream);
    isAcquiring = false;
    return stream;
  } catch (err) {
    isAcquiring = false;
    throw err;
  }
}

export function stopAllCameraStreams(): void {
  cancelAcquisition = true;
  for (const stream of activeStreams) {
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
        track.enabled = false;
      } catch {}
    });
  }
  activeStreams.clear();
}

// Emergency cleanup on page unload / refresh
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", stopAllCameraStreams);
  window.addEventListener("pagehide", stopAllCameraStreams);
}

