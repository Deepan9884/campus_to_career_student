import { getAccessToken } from "@/lib/api";
import type {
  UserSkill,
  Suggestion,
  SkillGapAnalysis,
  AnalysisHistoryResponse,
  AddSkillPayload,
  AnalyzePayload,
} from "@/types/skills";

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

export async function getAvailableRoles(): Promise<{ roles: string[] }> {
  return authFetch<{ roles: string[] }>(`${API_BASE}/skills/roles`);
}

export async function addSkill(payload: AddSkillPayload): Promise<UserSkill> {
  return authFetch<UserSkill>(`${API_BASE}/skills/current`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getCurrentSkills(): Promise<{ skills: UserSkill[] }> {
  return authFetch<{ skills: UserSkill[] }>(`${API_BASE}/skills/current`);
}

export async function deleteSkill(id: string): Promise<void> {
  await authFetch<void>(`${API_BASE}/skills/current/${id}`, { method: "DELETE" });
}

export async function getSuggestions(targetRole?: string): Promise<{ suggestions: Suggestion[] }> {
  const params = targetRole ? `?targetRole=${encodeURIComponent(targetRole)}` : "";
  return authFetch<{ suggestions: Suggestion[] }>(`${API_BASE}/skills/suggestions${params}`);
}

export async function analyzeGap(payload: AnalyzePayload): Promise<SkillGapAnalysis> {
  return authFetch<SkillGapAnalysis>(`${API_BASE}/skills/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getGapHistory(page = 1, limit = 10): Promise<AnalysisHistoryResponse> {
  return authFetch<AnalysisHistoryResponse>(
    `${API_BASE}/skills/history?page=${page}&limit=${limit}`,
  );
}

export async function getGapById(id: string): Promise<SkillGapAnalysis> {
  return authFetch<SkillGapAnalysis>(`${API_BASE}/skills/${id}`);
}

export async function deleteGapAnalysis(id: string): Promise<void> {
  await authFetch<void>(`${API_BASE}/skills/${id}`, { method: "DELETE" });
}
