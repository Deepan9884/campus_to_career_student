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
        sessionStorage.setItem("cf_access_token", token);
      } else {
        sessionStorage.removeItem("cf_session_active");
        sessionStorage.removeItem("cf_access_token");
      }
    } catch {}
  }
}

export function getAccessToken(): string | null {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem("cf_access_token");
      if (stored) {
        inMemoryAccessToken = stored;
        return stored;
      }
    } catch {}
  }
  return null;
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

export interface RequestOptions extends RequestInit {
  _retried?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;
const AUTH_EXEMPT_PATHS = ["/api/auth/refresh", "/api/auth/logout", "/auth/refresh", "/auth/logout"];

export function isAuthExempt(url?: string): boolean {
  if (!url) return false;
  return AUTH_EXEMPT_PATHS.some((path) => url.includes(path));
}

export function getRefreshedToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          setAccessToken(null);
          return null;
        }
        const json = await res.json();
        const token = json.data?.accessToken || null;
        setAccessToken(token);
        return token;
      } catch {
        setAccessToken(null);
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function tryRefresh(): Promise<string | null> {
  return getRefreshedToken();
}

export function clearSessionAndRedirect(): void {
  setAccessToken(null);
  if (typeof window !== "undefined") {
    try {
      import("@/stores").then(({ useAuth }) => {
        useAuth.setState({ user: null, isAuthenticated: false });
      }).catch(() => {});
    } catch {}
    const pathname = window.location.pathname;
    if (
      pathname !== "/login" &&
      pathname !== "/register" &&
      pathname !== "/forgot-password" &&
      pathname !== "/reset-password" &&
      !pathname.startsWith("/portfolio")
    ) {
      window.location.href = "/login";
    }
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
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

  if (isAuthExempt(url)) {
    if (res.status === 401 && url.includes("/refresh")) {
      clearSessionAndRedirect();
    }
  } else if (res.status === 401 && !options._retried) {
    options._retried = true;
    try {
      const newToken = await getRefreshedToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        res = await fetch(url, { ...options, headers, credentials: "include" });
      } else {
        clearSessionAndRedirect();
      }
    } catch {
      clearSessionAndRedirect();
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
  get: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
