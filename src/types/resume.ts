export interface KeywordBreakdown {
  matched: string[];
  missing: string[];
}

export interface InternshipItem {
  role: string;
  company: string;
  duration: string;
  durationMonths?: number;
  technologies: string[];
  keyResponsibilities?: string[];
  metricsIdentified?: boolean;
  qualityRating?: "Needs Improvement" | "Good" | "Strong" | string;
  feedback: string;
}

export interface ProjectItem {
  title: string;
  projectType: "personal" | "academic" | "capstone" | "hackathon" | "client" | "open_source" | string;
  duration: string;
  durationMonths?: number;
  techStack: string[];
  description?: string;
  hasLiveOrRepoLink?: boolean;
  highlights?: string[];
  complexityScore: number;
  feedback: string;
}

export interface EventItem {
  name: string;
  category: "hackathon" | "coding_contest" | "conference" | "workshop" | "leadership" | "certification" | "other" | string;
  roleOrAchievement: string;
  yearOrDate?: string;
  skillsDemonstrated?: string[];
  feedback: string;
}

export interface PillarScore {
  score: number;
  weight: number;
  summary: string;
  [key: string]: any;
}

export interface ScoreBreakdown {
  overallAtsScore: number;
  pillars: {
    internshipsAndWork: PillarScore & {
      totalMonths?: number;
      count?: number;
    };
    projectsAndPersonal: PillarScore & {
      personalCount?: number;
      academicCount?: number;
    };
    skillsAndKeywords: PillarScore & {
      matchedCount?: number;
      missingCount?: number;
    };
    eventsAndHackathons: PillarScore & {
      count?: number;
    };
    formatAndStructure: PillarScore & {
      hasMetrics?: boolean;
      readability?: string;
    };
  };
}

export interface ResumeRecommendations {
  experienceAdvice?: string;
  projectAdvice?: string;
  eventsAdvice?: string;
}

export interface Resume {
  _id: string;
  user: string;
  filename: string;
  extractedText?: string;
  atsScore?: number;
  keywordBreakdown?: KeywordBreakdown;
  strengths?: string[];
  improvements?: string[];
  summary?: string;
  targetRole?: string | null;
  inferredTargetRole?: string | null;
  internships?: InternshipItem[];
  projects?: ProjectItem[];
  eventsAndCompetitions?: EventItem[];
  scoreBreakdown?: ScoreBreakdown;
  recommendations?: ResumeRecommendations;
  status: "processing" | "completed" | "failed";
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ResumeHistoryResponse {
  resumes: Resume[];
  pagination: Pagination;
}
