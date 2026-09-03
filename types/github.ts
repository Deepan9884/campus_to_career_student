export interface RepoAnalysis {
  _id: string;
  user: string;
  repoFullName: string;
  repoUrl: string;
  
  // Executive Summary
  overview: string | null;
  projectType: string | null;
  primaryTechStack: string[];
  
  // Code Quality Analysis
  quality: {
    overallScore?: number;
    codeOrganization?: string;
    readability?: string;
    bestPractices?: string;
    documentation?: string;
    testing?: string;
    strengths?: string[];
    improvements?: string[];
  } | string | null;
  
  // Technical Skills Demonstrated
  technicalSkills?: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    patterns: string[];
    databases: string[];
    cloudServices: string[];
  };
  
  // Security Analysis
  security: {
    overallRating?: string;
    issues?: string[];
    goodPractices?: string[];
    recommendations?: string[];
  } | string | null;
  
  // Professional Readiness
  professionalReadiness?: {
    overallScore?: number;
    productionReady?: boolean;
    teamCollaboration?: string;
    projectComplexity?: string;
    businessValue?: string;
    scalability?: string;
  };
  
  // Resume & Interview Value
  resumeImpact: {
    bullets?: string[];
    interviewTalkingPoints?: string[];
    uniqueSellingPoints?: string[];
    improvementSuggestions?: string[];
  } | string[] | null;
  
  // Recruiter Perspective
  recruiterView?: {
    hiringPotential?: string;
    standoutFeatures?: string[];
    redFlags?: string[];
    idealRoles?: string[];
    experienceLevel?: string;
  };
  
  // Comparison Benchmarks
  benchmarks?: {
    peerComparison?: string;
    industryStandards?: string;
    competitiveAdvantage?: string;
  };
  
  // Metadata
  filesAnalyzed: string[];
  repoStats?: {
    stars?: number;
    forks?: number;
    language?: string;
    size?: number;
    lastUpdated?: string;
    hasReadme?: boolean;
    hasTests?: boolean;
    hasCI?: boolean;
    hasDocumentation?: boolean;
  };
  
  status: "processing" | "completed" | "failed";
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AnalysisHistoryItem {
  _id: string;
  repoFullName: string;
  status: string;
  createdAt: string;
}

export interface AnalysisHistoryResponse {
  analyses: AnalysisHistoryItem[];
  pagination: Pagination;
}

export interface GithubProfile {
  login: string;
  name: string;
  avatar_url: string;
  public_repos: number;
  bio: string;
  html_url: string;
}

export interface GithubConnectResponse {
  user: { _id: string; githubUsername: string };
  github: GithubProfile;
}

export interface RepoListItem {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  private: boolean;
}

export interface RepoListResponse {
  repos: RepoListItem[];
}

export interface ConnectPayload {
  githubUsername: string;
}

export interface AnalyzePayload {
  repoFullName: string;
}
