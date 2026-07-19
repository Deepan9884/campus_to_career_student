export interface KeywordBreakdown {
  matched: string[];
  missing: string[];
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
