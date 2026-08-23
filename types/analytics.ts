export interface Overview {
  readiness: number;
  daysOnPlatform: number;
  featuresUsed: number;
  totalFeatures: number;
}

export interface ResumeTrendPoint {
  date: string;
  score: number;
}

export interface InterviewTrendPoint {
  name: string;
  score: number;
  type: string;
}

export interface SkillRadarPoint {
  skill: string;
  current: number;
  target: number;
}

export interface FeatureUsagePoint {
  name: string;
  value: number;
}

export interface Achievement {
  name: string;
  desc: string;
  earned: boolean;
  tier: "bronze" | "silver" | "gold" | "platinum";
  progress: number;
}

export interface Activity {
  type: "resume" | "interview" | "skill" | "project" | "roadmap";
  title: string;
  desc: string;
  date: string;
}

export interface AnalyticsResponse {
  overview: Overview;
  resumeTrend: ResumeTrendPoint[];
  interviewTrend: InterviewTrendPoint[];
  skillRadar: SkillRadarPoint[];
  featureUsage: FeatureUsagePoint[];
  achievements: Achievement[];
  activities: Activity[];
}
