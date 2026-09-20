/**
 * Cross-browser Fullscreen Utility
 * Provides robust fullscreen request, exit, and detection across modern browsers (Chrome, Brave, Firefox, Safari, Edge).
 */

export function isCurrentlyFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
  );
}

export async function requestAppFullscreen(
  targetElement?: HTMLElement | null
): Promise<{ success: boolean; error?: any }> {
  if (typeof document === "undefined") {
    return { success: false, error: new Error("Document is undefined") };
  }

  // If already in fullscreen, succeed immediately
  if (isCurrentlyFullscreen()) {
    return { success: true };
  }

  const element: any = targetElement || document.documentElement || document.body;

  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      await element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      await element.msRequestFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    } else {
      return { success: false, error: new Error("Fullscreen API not supported in this environment") };
    }

    // Brief delay to allow browser OS window manager to commit fullscreen transition
    await new Promise((resolve) => setTimeout(resolve, 80));

    const confirmed = isCurrentlyFullscreen();
    return { success: confirmed };
  } catch (err: any) {
    console.warn("[Fullscreen] requestAppFullscreen failed or was rejected:", err);
    return { success: false, error: err };
  }
}

export async function exitAppFullscreen(): Promise<boolean> {
  if (typeof document === "undefined") return false;

  if (!isCurrentlyFullscreen()) {
    return true;
  }

  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
    }
    return true;
  } catch (err) {
    console.warn("[Fullscreen] exitAppFullscreen failed:", err);
    return false;
  }
}

export function addFullscreenChangeListener(
  callback: (isFullscreen: boolean) => void
): () => void {
  if (typeof document === "undefined") return () => {};

  const handler = () => {
    callback(isCurrentlyFullscreen());
  };

  document.addEventListener("fullscreenchange", handler);
  document.addEventListener("webkitfullscreenchange", handler);
  document.addEventListener("mozfullscreenchange", handler);
  document.addEventListener("MSFullscreenChange", handler);

  return () => {
    document.removeEventListener("fullscreenchange", handler);
    document.removeEventListener("webkitfullscreenchange", handler);
    document.removeEventListener("mozfullscreenchange", handler);
    document.removeEventListener("MSFullscreenChange", handler);
  };
}
