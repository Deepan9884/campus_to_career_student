import { api } from "@/lib/api";
import type {
  UserSkill,
  Suggestion,
  SkillGapAnalysis,
  AnalysisHistoryResponse,
  AddSkillPayload,
  AnalyzePayload,
} from "@/types/skills";

export async function getAvailableRoles(): Promise<{ roles: string[] }> {
  return api.get<{ roles: string[] }>("/skills/roles");
}

export async function addSkill(payload: AddSkillPayload): Promise<UserSkill> {
  return api.post<UserSkill>("/skills/current", payload);
}

export async function getCurrentSkills(): Promise<{ skills: UserSkill[] }> {
  return api.get<{ skills: UserSkill[] }>("/skills/current");
}

export async function deleteSkill(id: string): Promise<void> {
  await api.delete<void>(`/skills/current/${id}`);
}

export async function getSuggestions(targetRole?: string): Promise<{ suggestions: Suggestion[] }> {
  const params = targetRole ? `?targetRole=${encodeURIComponent(targetRole)}` : "";
  return api.get<{ suggestions: Suggestion[] }>(`/skills/suggestions${params}`);
}

export async function analyzeGap(payload: AnalyzePayload): Promise<SkillGapAnalysis> {
  return api.post<SkillGapAnalysis>("/skills/analyze", payload);
}

export async function getGapHistory(page = 1, limit = 10): Promise<AnalysisHistoryResponse> {
  return api.get<AnalysisHistoryResponse>(`/skills/history?page=${page}&limit=${limit}`);
}

export async function getGapById(id: string): Promise<SkillGapAnalysis> {
  return api.get<SkillGapAnalysis>(`/skills/${id}`);
}

export async function deleteGapAnalysis(id: string): Promise<void> {
  await api.delete<void>(`/skills/${id}`);
}

export interface LiveStrategyItem {
  type: "skill" | "resume" | "interview" | "coding" | "event";
  title: string;
  description: string;
  impact: string;
}

export interface CodingPlatformItem {
  platform: string;
  username: string;
  profileUrl: string;
  lastFetchedAt?: string;
  totalSolved: number;
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
  rating?: number;
  rank?: string | number | null;
  rawStats?: any;
}

export interface CodingPlatformAnalysis {
  linkedPlatformsCount: number;
  totalProblemsSolved: number;
  totalEasySolved: number;
  totalMediumSolved: number;
  totalHardSolved: number;
  platforms: CodingPlatformItem[];
  summaryRecommendation: string;
}

export interface GrowthMetrics {
  overallReadinessPct: number;
  skillGapMatchPct: number;
  resumeScore: number;
  avgInterviewScore: number;
  codingScore: number;
  eventScore: number;
  totalProblemsSolved: number;
  repoCount: number;
  totalEventsCount: number;
  verifiedEventsCount: number;
  interviewsCount: number;
  userSkillsCount: number;
  liveStrategy: LiveStrategyItem[];
  codingPlatformAnalysis?: CodingPlatformAnalysis;
}

export interface LatestAnalysisResponse {
  analysis: SkillGapAnalysis | null;
  growthMetrics: GrowthMetrics;
}

export async function getLatestAnalysis(): Promise<LatestAnalysisResponse> {
  return api.get<LatestAnalysisResponse>("/skills/latest");
}
