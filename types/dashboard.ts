export interface Readiness {
  overall: number;
  resume: number;
  interview: number;
  projects: number;
  skills: number;
  lastUpdated: string | null;
}

export interface DashboardStats {
  resumeCount: number;
  completedInterviewCount: number;
  repoCount: number;
  gapCount: number;
  roadmapCount: number;
  avgInterviewScore: number;
}

export interface Activity {
  type: "resume" | "interview" | "skill" | "project" | "roadmap";
  title: string;
  desc: string;
  date: string;
}

export interface DashboardResponse {
  readiness: Readiness;
  stats: DashboardStats;
  activities: Activity[];
}
