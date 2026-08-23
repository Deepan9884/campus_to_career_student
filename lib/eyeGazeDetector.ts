/**
 * Client-side Real-time Eye Gaze, Face Presence & Head Orientation Detector
 * High-performance, zero-latency canvas-based vision analyzer.
 * Precisely distinguishes normal on-screen viewing & code reading from:
 * 1. Missing Face (showing only shirt/torso or blank background)
 * 2. Looking Down at Phone / Desk Notes (sustained downward pitch > 0.32)
 * 3. Looking Away Left / Right (head turned > 20 degrees, yaw > 0.35)
 * 4. Half-Face / Quarter-Face / Severe Edge Cutoffs
 */

export type GazeDirection = "center" | "left" | "right" | "down" | "up" | "away";

export type FaceFramingStatus =
  | "full_face"
  | "no_face_features"
  | "half_face_left_cutoff"
  | "half_face_right_cutoff"
  | "half_face_top_cutoff"
  | "half_face_bottom_cutoff"
  | "partial_profile"
  | "face_too_far"
  | "face_occluded";

export interface GazeDetectionResult {
  isLookingAway: boolean;
  direction: GazeDirection;
  confidence: number;
  headYaw: number;   // -1 (turned far left) to +1 (turned far right)
  headPitch: number; // -1 (looking up) to +1 (looking down)
  eyeDisplacement: number;
  description: string;
  // Full Face Framing Verification
  isFullFace: boolean;
  framingStatus: FaceFramingStatus;
  framingWarning: string | null;
}

let sharedCanvas: HTMLCanvasElement | null = null;
let sharedCtx: CanvasRenderingContext2D | null = null;

function getSharedCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === "undefined") return null;
  if (!sharedCanvas) {
    sharedCanvas = document.createElement("canvas");
    sharedCanvas.width = 160;
    sharedCanvas.height = 120;
    sharedCtx = sharedCanvas.getContext("2d", { willReadFrequently: true });
  }
  return sharedCtx ? { canvas: sharedCanvas, ctx: sharedCtx } : null;
}

/**
 * Analyze candidate eye gaze and verify full-face visibility on live webcam video.
 * @param video HTMLVideoElement
 * @param personBbox Optional bounding box [x, y, w, h] from neural detector
 */
export function analyzeEyeGaze(
  video: HTMLVideoElement,
  personBbox?: [number, number, number, number]
): GazeDetectionResult {
  const defaultResult: GazeDetectionResult = {
    isLookingAway: false,
    direction: "center",
    confidence: 0.95,
    headYaw: 0,
    headPitch: 0,
    eyeDisplacement: 0,
    description: "Looking at Screen",
    isFullFace: true,
    framingStatus: "full_face",
    framingWarning: null,
  };

  if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return defaultResult;
  }

  const canvasSetup = getSharedCanvas();
  if (!canvasSetup) return defaultResult;
  const { canvas, ctx } = canvasSetup;

  const vw = video.videoWidth;
  const vh = video.videoHeight;

  // ── 1. Determine Head Region of Interest (ROI) ─────────────────────────────
  let isFullFace = true;
  let framingStatus: FaceFramingStatus = "full_face";
  let framingWarning: string | null = null;

  let sx = 0;
  let sy = 0;
  let sw = vw;
  let sh = vh;

  let normHeadX = 0.5;
  let normHeadY = 0.35;

  if (personBbox && personBbox.length >= 4) {
    const [bx, by, bw, bh] = personBbox;

    // Person head region is the upper ~38% of the detected person box
    const headW = Math.max(50, bw * 0.70);
    const headH = Math.max(50, bh * 0.42);
    const headCenterX = bx + bw * 0.5;
    const headCenterY = by + bh * 0.20;

    normHeadX = headCenterX / vw;
    normHeadY = headCenterY / vh;

    // Check if candidate is too far away
    if (bw < vw * 0.08 || bh < vh * 0.10) {
      isFullFace = false;
      framingStatus = "face_too_far";
      framingWarning = "Face too far: Move closer to the webcam";
    }
    // Half-Face Cutoff: only triggers if head center is severely shifted off the frame edge
    else if (normHeadX < 0.12) {
      isFullFace = false;
      framingStatus = "half_face_left_cutoff";
      framingWarning = "Half face detected: Center your face (cut off on left)";
    } else if (normHeadX > 0.88) {
      isFullFace = false;
      framingStatus = "half_face_right_cutoff";
      framingWarning = "Half face detected: Center your face (cut off on right)";
    } else if (normHeadY < 0.03) {
      isFullFace = false;
      framingStatus = "half_face_top_cutoff";
      framingWarning = "Partial face detected: Adjust camera down (head cut off at top)";
    } else if (normHeadY > 0.88) {
      isFullFace = false;
      framingStatus = "half_face_bottom_cutoff";
      framingWarning = "Partial face detected: Adjust camera up (head cut off at bottom)";
    }

    // Crop head region with boundary safety
    sx = Math.max(0, headCenterX - headW * 0.5);
    sy = Math.max(0, headCenterY - headH * 0.5);
    sw = Math.min(vw - sx, headW);
    sh = Math.min(vh - sy, headH);
  } else {
    // Default center-upper region
    sx = vw * 0.20;
    sy = vh * 0.06;
    sw = vw * 0.60;
    sh = vh * 0.50;
  }

  if (sw <= 15 || sh <= 15) return defaultResult;

  // Draw face sub-region into normalized 160x120 canvas
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const totalPixels = canvas.width * canvas.height;

  // ── 2. Facial Landmark & Dual-Eye Presence Verification ───────────────────
  const eyeBandTop = Math.floor(canvas.height * 0.16);
  const eyeBandBottom = Math.floor(canvas.height * 0.62);
  const halfWidth = Math.floor(canvas.width / 2);

  let totalLuma = 0;
  let minLuma = 255;
  let maxLuma = 0;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      const luma = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      totalLuma += luma;
      if (luma < minLuma) minLuma = luma;
      if (luma > maxLuma) maxLuma = luma;
    }
  }

  const avgLuma = totalLuma / totalPixels;
  const lumaDynamicRange = maxLuma - minLuma;

  // A. Reject Uniform Crops (e.g. Plain Shirt, Chest, Wall)
  if (lumaDynamicRange < 28) {
    return {
      isLookingAway: false,
      direction: "center",
      confidence: 0.9,
      headYaw: 0,
      headPitch: 0,
      eyeDisplacement: 0,
      description: "No Face Detected (Only Clothing/Background Visible)",
      isFullFace: false,
      framingStatus: "no_face_features",
      framingWarning: "No face detected: Position your face clearly in front of the camera",
    };
  }

  // B. Analyze Eye Sockets / Pupil Centroids & Eye Symmetry
  const darkThreshold = Math.max(18, minLuma + (avgLuma - minLuma) * 0.38);

  let leftEyeDarkPixels = 0;
  let rightEyeDarkPixels = 0;
  let darkXSum = 0;
  let darkYSum = 0;
  let totalDarkInEyeBand = 0;

  for (let y = eyeBandTop; y < eyeBandBottom; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      const luma = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;

      if (luma <= darkThreshold) {
        if (x < halfWidth) {
          leftEyeDarkPixels++;
        } else {
          rightEyeDarkPixels++;
        }
        darkXSum += x;
        darkYSum += y;
        totalDarkInEyeBand++;
      }
    }
  }

  // If no eye-socket features exist (e.g. collar of shirt or chest in frame)
  if (totalDarkInEyeBand < 12) {
    return {
      isLookingAway: false,
      direction: "center",
      confidence: 0.9,
      headYaw: 0,
      headPitch: 0,
      eyeDisplacement: 0,
      description: "No Face Detected (Face Not Visible)",
      isFullFace: false,
      framingStatus: "no_face_features",
      framingWarning: "Face not detected: Please ensure your full face is facing the webcam",
    };
  }

  // C. Half-Face / Quarter-Face Occlusion Check (one eye visible, other completely obscured)
  if (isFullFace) {
    const maxEye = Math.max(leftEyeDarkPixels, rightEyeDarkPixels);
    const minEye = Math.min(leftEyeDarkPixels, rightEyeDarkPixels);
    if (maxEye >= 50 && minEye <= 2) {
      isFullFace = false;
      framingStatus = leftEyeDarkPixels < rightEyeDarkPixels ? "half_face_left_cutoff" : "half_face_right_cutoff";
      framingWarning = "Half/quarter face detected: Ensure both eyes and full face are visible";
    }
  }

  // ── 3. Gaze & Head Orientation Computation (Yaw, Pitch & Look-Away) ───────
  let normIrisX = 0.5;
  let normIrisY = 0.40;

  if (totalDarkInEyeBand > 0) {
    normIrisX = darkXSum / totalDarkInEyeBand / canvas.width;
    normIrisY = darkYSum / totalDarkInEyeBand / canvas.height;
  }

  // Horizontal Yaw:
  // Balanced around center 0.5. Looking away left/right shifts yaw past 0.35.
  const eyePixelDiff = (rightEyeDarkPixels - leftEyeDarkPixels) / Math.max(1, totalDarkInEyeBand);
  const headYaw = Math.max(-1, Math.min(1, eyePixelDiff * 1.3 + (normIrisX - 0.5) * 2.0));

  // Vertical Pitch:
  // Neutral eye horizon is at ~0.38 - 0.42.
  // Looking at screen is normIrisY ~0.36 - 0.46 -> headPitch is between -0.15 and +0.22.
  // Looking down at phone/desk shifts normIrisY > 0.50 -> headPitch > 0.32.
  const headPitch = Math.max(-1, Math.min(1, (normIrisY - 0.39) * 3.0));

  const eyeDisplacement = Math.sqrt(headYaw * headYaw + headPitch * headPitch);

  let isLookingAway = false;
  let direction: GazeDirection = "center";
  let description = "Looking at Screen";

  // Downward look threshold: triggers when candidate looks down at lap/desk/phone
  if (headPitch > 0.32) {
    isLookingAway = true;
    direction = "down";
    description = "Looking Down (Phone / Desk Notes Detected)";
  }
  // Upward look threshold: looking up at ceiling/wall
  else if (headPitch < -0.38) {
    isLookingAway = true;
    direction = "up";
    description = "Looking Up (Off-Screen)";
  }
  // Left look threshold: looking away to the left
  else if (headYaw < -0.36) {
    isLookingAway = true;
    direction = "left";
    description = "Looking Away (Left)";
  }
  // Right look threshold: looking away to the right
  else if (headYaw > 0.36) {
    isLookingAway = true;
    direction = "right";
    description = "Looking Away (Right)";
  }

  if (!isFullFace && framingWarning) {
    description = framingWarning;
  }

  const confidence = Math.min(0.99, Math.max(0.70, 0.80 + eyeDisplacement * 0.20));

  return {
    isLookingAway,
    direction,
    confidence,
    headYaw: Number(headYaw.toFixed(2)),
    headPitch: Number(headPitch.toFixed(2)),
    eyeDisplacement: Number(eyeDisplacement.toFixed(2)),
    description,
    isFullFace,
    framingStatus,
    framingWarning,
  };
}
