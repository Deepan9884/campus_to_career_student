import { getAccessToken } from "@/lib/api";
import type {
  GithubConnectResponse,
  RepoListResponse,
  RepoAnalysis,
  AnalysisHistoryResponse,
  ConnectPayload,
  AnalyzePayload,
} from "@/types/github";

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

export async function connectGithub(payload: ConnectPayload): Promise<GithubConnectResponse> {
  return authFetch<GithubConnectResponse>(`${API_BASE}/github/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function listRepos(): Promise<RepoListResponse> {
  return authFetch<RepoListResponse>(`${API_BASE}/github/repos`);
}

export async function analyzeRepo(payload: AnalyzePayload): Promise<RepoAnalysis> {
  return authFetch<RepoAnalysis>(`${API_BASE}/github/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getAnalysisHistory(page = 1, limit = 10): Promise<AnalysisHistoryResponse> {
  return authFetch<AnalysisHistoryResponse>(
    `${API_BASE}/github/history?page=${page}&limit=${limit}`,
  );
}

export async function getAnalysisById(id: string): Promise<RepoAnalysis> {
  return authFetch<RepoAnalysis>(`${API_BASE}/github/${id}`);
}

export async function deleteAnalysis(id: string): Promise<void> {
  await authFetch<void>(`${API_BASE}/github/${id}`, { method: "DELETE" });
}

export async function generateLinkedInPost(payload: {
  repoFullName: string;
  overview: string;
  quality: string;
  resumeImpact: string[];
  repoUrl: string;
}): Promise<{ draft: string }> {
  return authFetch<{ draft: string }>(`${API_BASE}/github/linkedin-post`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export interface PortfolioData {
  user: {
    name: string;
    githubUsername: string;
    targetRole: string;
    skills: string[];
  };
  projects: {
    _id: string;
    repoFullName: string;
    repoUrl: string;
    overview: string;
    quality: string;
    resumeImpact: string[];
    filesAnalyzed: string[];
  }[];
}

export async function getPortfolio(username: string): Promise<PortfolioData> {
  const res = await fetch(`${API_BASE}/github/portfolio/${username}`);
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new ApiError(
      json.statusCode || res.status,
      json.message || "Failed to fetch portfolio",
      json.errors || [],
    );
  }
  return json.data as PortfolioData;
}
