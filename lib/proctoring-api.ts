import { api } from "@/lib/api";

export type ViolationType =
  | "mobile_phone_detected"
  | "face_not_detected"
  | "multiple_faces_detected"
  | "fullscreen_exit"
  | "fullscreen_timeout"
  | "tab_switch"
  | "keyboard_shortcut"
  | "eye_tracking_violation";

export type ModuleType = "quiz" | "interview" | "exam";

export interface ViolationResponse {
  violationCount: number;
  isBlocked: boolean;
  message: string;
}

export interface ViolationStatusResponse {
  violationCount: number;
  isBlocked: boolean;
  blockedAt?: string;
  events: Array<{ violationType: ViolationType; detectedAt: string }>;
}

export async function reportViolation(
  moduleType: ModuleType,
  moduleId: string,
  violationType: ViolationType,
  forceBlock?: boolean
): Promise<ViolationResponse> {
  return api.post<ViolationResponse>("/proctoring/violation", {
    moduleType,
    moduleId,
    violationType,
    ...(forceBlock ? { forceBlock: true } : {}),
  });
}

export async function getViolationStatus(
  moduleId: string
): Promise<ViolationStatusResponse> {
  return api.get<ViolationStatusResponse>(`/proctoring/status/${moduleId}`);
}
