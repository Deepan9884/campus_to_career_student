import { api } from "@/lib/api";
import type {
  GithubConnectResponse,
  RepoListResponse,
  RepoAnalysis,
  AnalysisHistoryResponse,
  ConnectPayload,
  AnalyzePayload,
} from "@/types/github";

export async function connectGithub(payload: ConnectPayload): Promise<GithubConnectResponse> {
  return api.post<GithubConnectResponse>("/github/connect", payload);
}

export async function listRepos(): Promise<RepoListResponse> {
  return api.get<RepoListResponse>("/github/repos");
}

export async function analyzeRepo(payload: AnalyzePayload): Promise<RepoAnalysis> {
  return api.post<RepoAnalysis>("/github/analyze", payload);
}

export async function getAnalysisHistory(page = 1, limit = 10): Promise<AnalysisHistoryResponse> {
  return api.get<AnalysisHistoryResponse>(`/github/history?page=${page}&limit=${limit}`);
}

export async function getAnalysisById(id: string): Promise<RepoAnalysis> {
  return api.get<RepoAnalysis>(`/github/${id}`);
}

export async function deleteAnalysis(id: string): Promise<void> {
  await api.delete<void>(`/github/${id}`);
}

export interface LinkedInPostVariation {
  style: string;
  content: string;
}

export interface LinkedInPostResult {
  draft: string;
  headline?: string;
  achievementParagraph?: string;
  variations?: LinkedInPostVariation[];
  suggestedHashtags?: string[];
  suggestedMentions?: string[];
  keyTakeaways?: string[];
  sourceData?: {
    postType?: string;
    title?: string;
  };
}

export interface GenerateLinkedInPostPayload {
  postType?: "github" | "event" | "milestone" | "custom" | "idea";
  eventId?: string;
  eventName?: string;
  eventType?: string;
  organizer?: string;
  role?: string;
  teamName?: string;
  teamSize?: number;
  teamMembers?: string[];
  projectTitle?: string;
  problemStatement?: string;
  techStack?: string[] | string;
  description?: string;
  result?: string;
  prize?: string;
  whatDidYouBuild?: string;
  whatDidYouLearn?: string;
  challengesFaced?: string;
  keyTakeaways?: string[] | string;
  projectLink?: string;
  repoFullName?: string;
  overview?: string;
  quality?: string;
  resumeImpact?: string[];
  repoUrl?: string;
  tone?: string;
  length?: string;
  customHighlights?: string;
  mentions?: string[] | string;
  includeEmoji?: boolean;
  includeHashtags?: boolean;
  title?: string;
  topic?: string;
  organization?: string;
  milestoneType?: string;
  keyAchievements?: string;
}

export async function generateLinkedInPost(
  payload: GenerateLinkedInPostPayload,
): Promise<LinkedInPostResult> {
  return api.post<LinkedInPostResult>("/github/linkedin-post", payload);
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
  return api.get<PortfolioData>(`/github/portfolio/${username}`);
}
