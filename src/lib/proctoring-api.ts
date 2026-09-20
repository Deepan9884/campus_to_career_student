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
  isProctoringBlocked?: boolean;
  isSuperDream?: boolean;
  hasTimer?: boolean;
  remainingSeconds?: number;
  remainingMinutes?: number;
  blockedAt?: string;
  mentor?: {
    name: string;
    email: string | null;
  };
  message: string;
}

export interface ViolationStatusResponse {
  violationCount: number;
  isBlocked: boolean;
  isSuperDream?: boolean;
  hasTimer?: boolean;
  blockedAt?: string;
  remainingSeconds?: number;
  remainingMinutes?: number;
  events: Array<{ violationType: ViolationType; detectedAt: string }>;
}

export interface MyProctoringBlockStatus {
  isBlocked: boolean;
  autoUnblocked?: boolean;
  isSuperDream?: boolean;
  hasTimer?: boolean;
  remainingMs?: number;
  remainingSeconds?: number;
  remainingMinutes?: number;
  blockedAt?: string | null;
  mentor?: {
    name: string;
    email: string | null;
  };
}

export async function reportViolation(
  moduleType: ModuleType,
  moduleId: string,
  violationType: ViolationType,
  forceBlock?: boolean,
  isSuperDream?: boolean
): Promise<ViolationResponse> {
  return api.post<ViolationResponse>("/proctoring/violation", {
    moduleType,
    moduleId,
    violationType,
    ...(forceBlock ? { forceBlock: true } : {}),
    ...(isSuperDream ? { isSuperDream: true, track: "super_dream" } : { track: "classic" }),
  });
}

export async function getViolationStatus(
  moduleId: string
): Promise<ViolationStatusResponse> {
  return api.get<ViolationStatusResponse>(`/proctoring/status/${moduleId}`);
}

export async function checkMyProctoringStatus(): Promise<MyProctoringBlockStatus> {
  return api.get<MyProctoringBlockStatus>("/proctoring/check-status");
}
