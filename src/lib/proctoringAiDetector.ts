/**
 * Singleton Proctoring AI Neural Engine
 * Pre-warms and caches TensorFlow.js + COCO-SSD object detection model
 * for zero-latency face and phone detection.
 */

export interface DetectedPrediction {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

let globalModel: any = null;
let modelLoadingPromise: Promise<any> | null = null;

export async function getProctoringModel(): Promise<any> {
  if (globalModel) {
    return globalModel;
  }
  if (modelLoadingPromise) {
    return modelLoadingPromise;
  }

  modelLoadingPromise = (async () => {
    try {
      console.log("[Proctoring AI] Initializing TensorFlow.js engine...");
      const [tf, cocoSsd] = await Promise.all([
        import("@tensorflow/tfjs"),
        import("@tensorflow-models/coco-ssd"),
      ]);

      await tf.ready();
      console.log(`[Proctoring AI] TensorFlow ready. Active backend: ${tf.getBackend()}`);

      let model: any = null;
      try {
        console.log("[Proctoring AI] Loading lite_mobilenet_v2 weights...");
        model = await cocoSsd.load({ base: "lite_mobilenet_v2" });
      } catch (liteErr) {
        console.warn("[Proctoring AI] lite_mobilenet_v2 fallback to mobilenet_v1:", liteErr);
        model = await cocoSsd.load({ base: "mobilenet_v1" });
      }

      globalModel = model;
      console.log("[Proctoring AI] COCO-SSD neural detector initialized and cached.");
      return globalModel;
    } catch (err) {
      console.error("[Proctoring AI] Failed to load neural detector:", err);
      modelLoadingPromise = null;
      throw err;
    }
  })();

  return modelLoadingPromise;
}

/**
 * Pre-warm model in background so exam begins with AI instantly active.
 */
export function preloadProctoringModel(): void {
  getProctoringModel().catch((err) => {
    console.warn("[Proctoring AI] Background preload note:", err);
  });
}

/**
 * Perform non-blocking object detection on a live video stream element.
 */
export async function runProctorDetection(
  video: HTMLVideoElement
): Promise<DetectedPrediction[]> {
  const model = await getProctoringModel();
  if (!model) return [];

  if (
    !video ||
    video.readyState < 2 ||
    video.paused ||
    video.ended ||
    video.videoWidth === 0 ||
    video.videoHeight === 0
  ) {
    return [];
  }

  // Detect with low threshold (0.18) to catch devices and partial face angles
  const rawPredictions = await model.detect(video, 10, 0.18);

  return (rawPredictions || []).map((p: any) => ({
    class: String(p.class || "").toLowerCase().trim(),
    score: Number(p.score || 0),
    bbox: p.bbox,
  }));
}
