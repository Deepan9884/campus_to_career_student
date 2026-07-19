// Client-side uses the Vite proxy (/api -> localhost:5000).
// Server-side (SSR / Nitro) must reach the backend directly.
const isServer = typeof window === "undefined";
const API_BASE = isServer ? "http://localhost:5000/api" : import.meta.env.VITE_API_URL || "/api";

let accessToken: string | null =
  typeof window !== "undefined" ? localStorage.getItem("cf-token") : null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) localStorage.setItem("cf-token", token);
  else localStorage.removeItem("cf-token");
}

export function getAccessToken(): string | null {
  return accessToken;
}

export class ApiError extends Error {
  statusCode: number;
  errors: string[];
  constructor(statusCode: number, message: string, errors: string[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

let refreshing: Promise<void> | null = null;

async function tryRefresh(): Promise<void> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      setAccessToken(null);
      throw new ApiError(401, "Session expired");
    }
    const json = await res.json();
    setAccessToken(json.data.accessToken);
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let res = await fetch(url, { ...options, headers, credentials: "include" });

  if (res.status === 401 && endpoint !== "/auth/refresh" && endpoint !== "/auth/login") {
    try {
      await tryRefresh();
      headers["Authorization"] = `Bearer ${accessToken}`;
      res = await fetch(url, { ...options, headers, credentials: "include" });
    } catch {
      if (endpoint !== "/auth/me") {
        const { useAuth } = await import("@/stores");
        useAuth.getState().logout();
      }
      throw new ApiError(401, "Session expired");
    }
  }

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

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};
