export interface RepoAnalysis {
  _id: string;
  user: string;
  repoFullName: string;
  repoUrl: string;
  overview: string | null;
  quality: string | null;
  security: string | null;
  resumeImpact: string[] | null;
  filesAnalyzed: string[];
  status: "processing" | "completed" | "failed";
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AnalysisHistoryItem {
  _id: string;
  repoFullName: string;
  status: string;
  createdAt: string;
}

export interface AnalysisHistoryResponse {
  analyses: AnalysisHistoryItem[];
  pagination: Pagination;
}

export interface GithubProfile {
  login: string;
  name: string;
  avatar_url: string;
  public_repos: number;
  bio: string;
  html_url: string;
}

export interface GithubConnectResponse {
  user: { _id: string; githubUsername: string };
  github: GithubProfile;
}

export interface RepoListItem {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  private: boolean;
}

export interface RepoListResponse {
  repos: RepoListItem[];
}

export interface ConnectPayload {
  githubUsername: string;
}

export interface AnalyzePayload {
  repoFullName: string;
}
