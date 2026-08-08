import { getAccessToken } from "@/lib/api";
import type {
  InterviewSession,
  InterviewHistoryResponse,
  StartInterviewPayload,
  AnswerPayload,
} from "@/types/interview";

const isServer = typeof window === "undefined";
const API_BASE = isServer ? "http://localhost:5000/api" : import.meta.env.VITE_API_URL || "/api";

class ApiError extends Error {
  statusCode: number;
  errors: string[];
  constructor(statusCode: number, message: string, errors: string[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

async function authFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers, credentials: "include" });
  const json = await res.json();

  if (!res.ok || json.success === false) {
    throw new ApiError(
      json.statusCode || res.status,
      json.message || "Request failed",
      json.errors || [],
    );
  }

  return json.data as T;
}

export async function startInterview(payload: StartInterviewPayload): Promise<InterviewSession> {
  return authFetch<InterviewSession>(`${API_BASE}/interview/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function submitRoundAnswer(
  sessionId: string,
  roundType: string,
  payload: AnswerPayload,
): Promise<InterviewSession> {
  return authFetch<InterviewSession>(`${API_BASE}/interview/${sessionId}/rounds/${roundType}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function finishRound(
  sessionId: string,
  roundType: string,
): Promise<InterviewSession> {
  return authFetch<InterviewSession>(`${API_BASE}/interview/${sessionId}/rounds/${roundType}/finish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

export async function getInterviewHistory(page = 1, limit = 10): Promise<InterviewHistoryResponse> {
  return authFetch<InterviewHistoryResponse>(
    `${API_BASE}/interview/history?page=${page}&limit=${limit}`,
  );
}

export async function getInterviewById(id: string): Promise<InterviewSession> {
  return authFetch<InterviewSession>(`${API_BASE}/interview/${id}`);
}

export async function deleteInterview(id: string): Promise<void> {
  await authFetch<void>(`${API_BASE}/interview/${id}`, { method: "DELETE" });
}
