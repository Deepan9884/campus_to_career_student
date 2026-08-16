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
  if (!accessToken && typeof window !== "undefined") {
    accessToken = localStorage.getItem("cf-token");
  }
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
    throw new ApiError(
      res.status || 500,
      res.ok ? "Invalid response format from server" : `Server error (${res.status}): Please check backend server`,
    );
  }

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
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
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
