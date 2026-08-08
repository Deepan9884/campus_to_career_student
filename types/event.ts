export type EventType =
  | "hackathon"
  | "ideathon"
  | "coding-competition"
  | "ctf"
  | "game-jam"
  | "research-symposium"
  | "startup-weekend"
  | "other";
export type EventMode = "online" | "offline" | "hybrid";
export type EventLevel = "intra-college" | "inter-college" | "state" | "national" | "international";
export type EventResult = "winner" | "runner-up" | "finalist" | "shortlisted" | "participated";

export interface EventReflection {
  whatILearned?: string;
  whatIdDoDifferently?: string;
  whatDidYouLearn?: string;
  whatDidYouBuild?: string;
  challengesFaced?: string;
  whatWouldYouDoDifferently?: string;
  keyTakeaways?: string[];
  skillsImproved?: string[];
  rating?: number;
  wouldRecommend?: boolean;
}

export interface EventPortfolioMeta {
  isPublic?: boolean;
  featured?: boolean;
  showcaseOrder?: number;
  customThumbnail?: string;
  tags?: string[];
  viewCount?: number;
}

export interface Event {
  _id: string;
  user: string;
  eventName: string;
  eventType: EventType;
  organizer: string;
  mode: EventMode;
  level: EventLevel;
  startDate: string;
  endDate: string;
  teamName?: string | null;
  teamSize: number;
  role?: string | null;
  teamMembers: string[];
  projectTitle?: string | null;
  problemStatement?: string | null;
  techStack: string[];
  description?: string | null;
  result: EventResult;
  prize?: string | null;
  certificateUrl: string;
  projectLink?: string | null;
  socialPostLink?: string | null;
  reflection?: EventReflection | null;
  portfolio?: EventPortfolioMeta | null;
  isPublic: boolean;
  tags: string[];
  recruiterNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventPagination {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateEventPayload {
  eventName: string;
  eventType: EventType;
  organizer: string;
  mode: EventMode;
  level: EventLevel;
  startDate: string;
  endDate: string;
  teamName?: string;
  teamSize?: number;
  role?: string;
  teamMembers?: string[];
  projectTitle?: string;
  problemStatement?: string;
  techStack?: string[];
  description?: string;
  result: EventResult;
  prize?: string;
  projectLink?: string;
  socialPostLink?: string;
  certificate: File;
  reflection?: EventReflection;
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
  certificate?: File;
}

export interface EventStats {
  totalEvents: number;
  byType: Record<EventType, number>;
  byResult: Record<EventResult, number>;
  byLevel: Record<EventLevel, number>;
  byMode: Record<EventMode, number>;
  winRate: number;
  uniqueTechStack: number;
  totalTeamMembers: number;
  currentStreak: number;
  longestStreak: number;
}

export interface EventBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  progress?: number;
  target?: number;
}

export interface EventAnalytics {
  stats: EventStats;
  monthlyActivity: Array<{ month: string; count: number }>;
  techStackDistribution: Array<{ tech: string; count: number }>;
  levelProgression: Array<{ level: EventLevel; count: number }>;
  resultTrend: Array<{ month: string; won: number; participated: number }>;
  teamSizeDistribution: Array<{ size: number; count: number }>;
}

export interface EventPortfolio {
  user: {
    name: string;
    avatar?: string;
    headline?: string;
  };
  events: Event[];
  stats: EventStats;
  badges: EventBadge[];
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  hackathon: "Hackathon",
  ideathon: "Ideathon",
  "coding-competition": "Coding Competition",
  ctf: "CTF (Capture The Flag)",
  "game-jam": "Game Jam",
  "research-symposium": "Research Symposium",
  "startup-weekend": "Startup Weekend",
  other: "Other",
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  hackathon: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ideathon: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "coding-competition": "bg-green-500/20 text-green-400 border-green-500/30",
  ctf: "bg-red-500/20 text-red-400 border-red-500/30",
  "game-jam": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "research-symposium": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  "startup-weekend": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  other: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export const EVENT_TYPE_ICONS: Record<EventType, string> = {
  hackathon: "Zap",
  ideathon: "Lightbulb",
  "coding-competition": "Terminal",
  ctf: "Flag",
  "game-jam": "Award",
  "research-symposium": "FileText",
  "startup-weekend": "Target",
  other: "Calendar",
};

export const EVENT_RESULT_LABELS: Record<EventResult, string> = {
  winner: "Winner",
  "runner-up": "Runner-up",
  finalist: "Finalist",
  shortlisted: "Shortlisted",
  participated: "Participated",
};

export const EVENT_RESULT_COLORS: Record<EventResult, string> = {
  winner: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "runner-up": "bg-slate-300/20 text-slate-300 border-slate-300/30",
  finalist: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shortlisted: "bg-green-500/20 text-green-400 border-green-500/30",
  participated: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export const EVENT_LEVEL_ORDER: EventLevel[] = [
  "intra-college",
  "inter-college",
  "state",
  "national",
  "international",
];

export const EVENT_LEVEL_LABELS: Record<EventLevel, string> = {
  "intra-college": "Intra-College",
  "inter-college": "Inter-College",
  state: "State",
  national: "National",
  international: "International",
};

export const EVENT_LEVEL_COLORS: Record<EventLevel, string> = {
  "intra-college": "bg-gray-500/20 text-gray-400",
  "inter-college": "bg-blue-500/20 text-blue-400",
  state: "bg-green-500/20 text-green-400",
  national: "bg-purple-500/20 text-purple-400",
  international: "bg-amber-500/20 text-amber-400",
};

export const MODE_LABELS: Record<EventMode, string> = {
  online: "Online",
  offline: "Offline",
  hybrid: "Hybrid",
};