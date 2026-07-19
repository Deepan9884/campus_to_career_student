import { getAccessToken } from "@/lib/api";
import type { AnalyticsResponse } from "@/types/analytics";

const isServer = typeof window === "undefined";
const API_BASE = isServer ? "http://localhost:5000/api" : import.meta.env.VITE_API_URL || "/api";

class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function authFetch<T>(url: string): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { headers, credentials: "include" });
  const json = await res.json();

  if (!res.ok || json.success === false) {
    throw new ApiError(json.statusCode || res.status, json.message || "Request failed");
  }

  return json.data as T;
}

export async function getAnalyticsOverview(): Promise<AnalyticsResponse> {
  return authFetch<AnalyticsResponse>(`${API_BASE}/analytics/overview`);
}
