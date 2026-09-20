export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

export type BadgeId =
  | "first_steps"
  | "first_resume"
  | "score_80"
  | "interview_rookie"
  | "interview_5"
  | "star_communicator"
  | "skill_explorer"
  | "gap_closer"
  | "skill_collector"
  | "project_pro"
  | "roadmap_builder"
  | "placement_ready"
  | "First Steps"
  | "Resume Ready"
  | "Interview Warmup"
  | "Interview Pro"
  | "Code Explorer"
  | "Gap Closer"
  | "Roadmap Builder"
  | "Quiz Streak"
  | "High Scorer"
  | string;

export interface UnifiedTrophy {
  id: string;
  name: string;
  desc: string;
  tier: BadgeTier;
  icon?: string;
  category?: string;
  earned: boolean;
  earnedAt?: string;
  progress: number; // 0 - 100
  metricLabel?: string;
  currentValue?: number;
  targetValue?: number;
}

export interface BadgeSummary {
  earnedCount: number;
  totalCount: number;
  percentage: number;
}

export interface EarnedBadge {
  _id?: string;
  userId: string;
  badgeId: BadgeId;
  earnedAt: string;
}

export interface BadgesResponse {
  badges: EarnedBadge[];
  achievements: UnifiedTrophy[];
  summary: BadgeSummary;
  data?: {
    badges?: EarnedBadge[];
    achievements?: UnifiedTrophy[];
    summary?: BadgeSummary;
  };
}
