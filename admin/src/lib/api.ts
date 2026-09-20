export const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

let inMemoryAccessToken: string | null =
  typeof window !== "undefined" ? sessionStorage.getItem("cf-admin-token") : null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("cf-admin-token"); // Clean legacy unencrypted localStorage
      if (token) {
        sessionStorage.setItem("cf-admin-token", token);
      } else {
        sessionStorage.removeItem("cf-admin-token");
      }
    } catch {}
    window.dispatchEvent(new CustomEvent("cf:admin:auth-change", { detail: { token } }));
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

/** Whether current page is an active exam monitoring route (admin side) */
function isActiveExamRoute(): boolean {
  if (typeof window === "undefined") return false;
  const p = window.location.pathname;
  return (
    p.includes("/exam") ||
    p.includes("/test") ||
    p.includes("/monitor") ||
    p.includes("/proctoring") ||
    p.includes("/assessment")
  );
}

export async function tryAdminRefresh(): Promise<void> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      setAccessToken(null);
      // Don't throw during active exam monitoring — just clear token silently
      if (!isActiveExamRoute()) {
        throw new ApiError(401, "Admin session expired");
      }
      return;
    }
    const json = await res.json();
    setAccessToken(json.data?.accessToken || null);
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
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

  // Handle 401 with silent token refresh
  if (res.status === 401 && !url.includes("/auth/refresh") && !url.includes("/auth/login")) {
    try {
      await tryAdminRefresh();
      const freshToken = getAccessToken();
      if (freshToken) {
        headers["Authorization"] = `Bearer ${freshToken}`;
      }
      res = await fetch(url, { ...options, headers, credentials: "include" });
    } catch {
      setAccessToken(null);
      // During active exam monitoring, suppress the forced logout
      if (!isActiveExamRoute()) {
        throw new ApiError(401, "Admin session expired");
      }
    }
  }

  let json: any;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new ApiError(
      res.status || 500,
      res.ok ? "Invalid response format" : `Server error (${res.status})`
    );
  }

  if (!res.ok || json.success === false) {
    if (
      res.status === 401 ||
      res.status === 403 ||
      json.message === "Invalid token" ||
      json.message === "Authentication token is required" ||
      json.message === "Access forbidden: insufficient permissions"
    ) {
      setAccessToken(null);
    }
    throw new ApiError(
      json.statusCode || res.status,
      json.message || "Request failed",
      json.errors || []
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
