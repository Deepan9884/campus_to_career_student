import { getAccessToken } from "@/lib/api";
import type {
  LearningRoadmap,
  RoadmapHistoryResponse,
  GenerateRoadmapPayload,
} from "@/types/roadmap";

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

export async function generateRoadmap(payload: GenerateRoadmapPayload): Promise<LearningRoadmap> {
  return authFetch<LearningRoadmap>(`${API_BASE}/roadmap/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getRoadmapHistory(page = 1, limit = 10): Promise<RoadmapHistoryResponse> {
  return authFetch<RoadmapHistoryResponse>(
    `${API_BASE}/roadmap/history?page=${page}&limit=${limit}`,
  );
}

export async function getRoadmapById(id: string): Promise<LearningRoadmap> {
  return authFetch<LearningRoadmap>(`${API_BASE}/roadmap/${id}`);
}

export async function deleteRoadmap(id: string): Promise<void> {
  await authFetch<void>(`${API_BASE}/roadmap/${id}`, { method: "DELETE" });
}

export async function getRoadmapByGapAnalysis(
  gapAnalysisId: string,
): Promise<LearningRoadmap | null> {
  return authFetch<LearningRoadmap | null>(
    `${API_BASE}/roadmap/by-gap/${gapAnalysisId}`,
  );
}
