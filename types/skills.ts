export interface UserSkill {
  _id: string;
  user: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  source: "self-reported" | "resume" | "github";
  addedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Suggestion {
  source: "resume" | "github" | "role";
  name: string;
}

export interface SubTopic {
  subTopicId: string;
  name: string;
  weightPercent: number;
  status: "not_started" | "in_progress" | "passed";
}

export interface SkillGap {
  skillName: string;
  importance: "core" | "nice-to-have";
  subTopics: SubTopic[];
  gapPercent: number;
}

export interface SkillGapAnalysis {
  _id: string;
  user: string;
  targetRole: string;
  matchedSkills: string[];
  gaps: SkillGap[];
  matchPercentage: number;
  recommendations: string[] | null;
  status: "completed" | "failed";
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  overallGapPercent?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AnalysisHistoryItem {
  _id: string;
  targetRole: string;
  matchPercentage: number;
  status: string;
  createdAt: string;
}

export interface AnalysisHistoryResponse {
  analyses: AnalysisHistoryItem[];
  pagination: Pagination;
}

export interface AddSkillPayload {
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
}

export interface AnalyzePayload {
  targetRole: string;
}