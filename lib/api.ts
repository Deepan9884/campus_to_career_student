function normalizeApiBase(rawUrl?: string): string {
  if (!rawUrl || rawUrl === "/api") return "/api";
  const trimmed = rawUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

// Client-side uses the Vite proxy (/api -> localhost:5000) or VITE_API_URL.
// Server-side (SSR / Nitro) must reach the backend directly.
const isServer = typeof window === "undefined";
const API_BASE = isServer
  ? normalizeApiBase(
      typeof process !== "undefined" && (process.env.VITE_API_URL || process.env.API_URL)
        ? (process.env.VITE_API_URL || process.env.API_URL)
        : "http://localhost:5000/api"
    )
  : normalizeApiBase(import.meta.env.VITE_API_URL || "/api");

let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("cf-token");
      if (token) {
        sessionStorage.setItem("cf_session_active", "1");
      } else {
        sessionStorage.removeItem("cf_session_active");
      }
    } catch {}
  }
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
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

export async function tryRefresh(): Promise<void> {
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
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${cleanEndpoint}`;
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers, credentials: "include" });

  if (res.status === 401 && !url.includes("/auth/refresh") && !url.includes("/auth/login")) {
    try {
      await tryRefresh();
      const freshToken = getAccessToken();
      if (freshToken) {
        headers["Authorization"] = `Bearer ${freshToken}`;
      }
      res = await fetch(url, { ...options, headers, credentials: "include" });
    } catch {
      if (!url.includes("/auth/me")) {
        const { useAuth } = await import("@/stores");
        useAuth.getState().logout();
      }
      throw new ApiError(401, "Session expired");
    }
  }

  let json: any;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { message: text };
  }

  if (!res.ok || json.success === false) {
    const errorMsg =
      (typeof json === "object" && json?.message) ||
      (typeof json === "string" && json) ||
      text ||
      `Request failed (${res.status})`;
    throw new ApiError(
      json?.statusCode || res.status,
      errorMsg,
      json?.errors || [],
    );
  }

  return json.data as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
