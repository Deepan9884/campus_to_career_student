import { getAccessToken } from "@/lib/api";
import type { Resume, ResumeHistoryResponse } from "@/types/resume";

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

export async function uploadResume(file: File, targetRole?: string): Promise<Resume> {
  const formData = new FormData();
  formData.append("resume", file);
  if (targetRole) {
    formData.append("targetRole", targetRole);
  }

  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/resume/upload`, {
    method: "POST",
    headers,
    body: formData,
    credentials: "include",
  });

  const json = await res.json();

  if (!res.ok || json.success === false) {
    throw new ApiError(
      json.statusCode || res.status,
      json.message || "Upload failed",
      json.errors || [],
    );
  }

  return json.data as Resume;
}

export async function getResumeHistory(page = 1, limit = 10): Promise<ResumeHistoryResponse> {
  return authFetch<ResumeHistoryResponse>(`${API_BASE}/resume/history?page=${page}&limit=${limit}`);
}

export async function getResumeById(id: string): Promise<Resume> {
  return authFetch<Resume>(`${API_BASE}/resume/${id}`);
}

export async function deleteResume(id: string): Promise<void> {
  await authFetch<void>(`${API_BASE}/resume/${id}`, { method: "DELETE" });
}

export async function improveBulletPoint(bulletPoint: string, role?: string): Promise<{ improved: string }> {
  return authFetch<{ improved: string }>(`${API_BASE}/resume/improve-bullet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bulletPoint, role }),
  });
}
