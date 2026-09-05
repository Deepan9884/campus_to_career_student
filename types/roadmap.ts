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

export interface PrimaryRecommendation {
  subTopicId: string;
  skillName: string;
  name: string;
  importance: "core" | "nice-to-have";
  difficulty: string;
  estimatedTimeframe: string;
  weightPercent: number;
  impactScore: string;
  reason: string;
  actionLabel: string;
  status: "not_started" | "in_progress" | "passed";
  learningOutcomes: string[];
  resources: RoadmapResource[];
}

export interface RecommendationTrackItem {
  subTopicId: string;
  skillName: string;
  name: string;
  difficulty: string;
  estimatedTimeframe: string;
  importance: "core" | "nice-to-have";
  status: "not_started" | "in_progress" | "passed";
  tag: string;
  resources: RoadmapResource[];
}

export interface ProjectSuggestion {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedHours: string;
  skillsApplied: string[];
}

export interface StudyDay {
  day: string;
  label: string;
  duration: string;
  task: string;
}

export interface StudyPacingPlan {
  pace: string;
  weeklyGoal: string;
  days: StudyDay[];
}

export interface RoadmapReadiness {
  score: number;
  progressPercent: number;
  passedCount: number;
  inProgressCount: number;
  totalCount: number;
  estimatedWeeksLeft: number;
  readinessTier: string;
}

export interface RoadmapRecommendations {
  roadmapId: string;
  targetRole: string;
  readiness: RoadmapReadiness;
  primaryRecommendation: PrimaryRecommendation | null;
  tracks: {
    quickWins: RecommendationTrackItem[];
    coreEssentials: RecommendationTrackItem[];
    projectSuggestions: ProjectSuggestion[];
  };
  studyPacingPlan: StudyPacingPlan;
  interviewTips: string[];
}