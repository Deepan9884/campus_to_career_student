import type {
  GenerateQuizPayload,
  SubmitQuizPayload,
  QuizGenerationResult,
  QuizSubmissionResult,
} from "@/types/quiz";

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

  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("cf-token");
  }
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

export async function generateQuiz(payload: GenerateQuizPayload): Promise<QuizGenerationResult> {
  return authFetch<QuizGenerationResult>(`${API_BASE}/skill-gap/quiz/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function submitQuiz(payload: SubmitQuizPayload): Promise<QuizSubmissionResult> {
  return authFetch<QuizSubmissionResult>(`${API_BASE}/skill-gap/quiz/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
