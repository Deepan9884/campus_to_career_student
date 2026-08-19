import { api } from "@/lib/api";

export type ViolationType =
  | "mobile_phone_detected"
  | "face_not_detected"
  | "multiple_faces_detected"
  | "fullscreen_exit"
  | "tab_switch"
  | "keyboard_shortcut";

export type ModuleType = "quiz" | "interview";

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
  violationType: ViolationType
): Promise<ViolationResponse> {
  return api.post<ViolationResponse>("/proctoring/violation", {
    moduleType,
    moduleId,
    violationType,
  });
}

export async function getViolationStatus(
  moduleId: string
): Promise<ViolationStatusResponse> {
  return api.get<ViolationStatusResponse>(`/proctoring/status/${moduleId}`);
}
