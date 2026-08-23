export interface SubTopic {
  subTopicId: string;
  skillName: string;
  name: string;
  weightPercent: number;
  status: "not_started" | "in_progress" | "passed";
}

export interface RoadmapResource {
  name: string;
  platform: string;
  type: "course" | "docs" | "video" | "article";
  url: string;
}

export interface RoadmapMilestone {
  _id: string;
  skillName: string;
  subTopicId: string;
  importance: "core" | "nice-to-have";
  difficulty?: string;
  estimatedTimeframe: string;
  resources: RoadmapResource[];
}

export interface LearningRoadmap {
  _id: string;
  user: string;
  targetRole: string;
  basedOnGapAnalysis: string;
  subTopics: SubTopic[];
  milestones: RoadmapMilestone[];
  overallSummary: string | null;
  status: "completed" | "failed";
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapHistoryItem {
  _id: string;
  targetRole: string;
  status: string;
  milestoneCount: number;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RoadmapHistoryResponse {
  roadmaps: RoadmapHistoryItem[];
  pagination: Pagination;
}

export interface GenerateRoadmapPayload {
  skillGapAnalysisId: string;
}