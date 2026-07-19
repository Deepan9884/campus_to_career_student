export interface InterviewQuestion {
  questionId: string | null;
  questionText: string;
  answer: string | null;
  answeredAt: string | null;
  score: number | null;
  feedback: string | null;
}

export interface Interview {
  _id: string;
  user: string;
  domain: "behavioral" | "technical";
  targetRole: string | null;
  difficulty: "easy" | "medium" | "hard" | null;
  questions: InterviewQuestion[];
  overallScore: number | null;
  strengths: string[] | null;
  improvements: string[] | null;
  summary: string | null;
  status: "in-progress" | "completed" | "failed";
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InterviewHistoryItem {
  _id: string;
  domain: "behavioral" | "technical";
  targetRole: string | null;
  overallScore: number | null;
  status: string;
  createdAt: string;
}

export interface InterviewHistoryResponse {
  interviews: InterviewHistoryItem[];
  pagination: Pagination;
}

export interface StartInterviewPayload {
  domain: "behavioral" | "technical";
  targetRole?: string;
  difficulty?: "easy" | "medium" | "hard";
  questionCount?: number;
}

export interface AnswerPayload {
  questionIndex: number;
  answer: string;
}
