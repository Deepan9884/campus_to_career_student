export interface InterviewQuestionItem {
  questionId: string | null;
  questionText: string;
  itemType: "mcq" | "open_ended" | "coding";
  options?: string[];
  correctOptionIndex?: number | null;
  idealAnswerPoints?: string[];
  testCases?: Array<{ input: string; expectedOutput: string; description?: string }>;
  starterCode?: string;
  selectedOptionIndex?: number | null;
  answer?: string | null;
  isCorrect?: boolean | null;
  score?: number | null;
  feedback?: string | null;
  projectContext?: string | null;
  answeredAt?: string | null;
}

export type RoundType = "quiz" | "aptitude" | "core" | "technical" | "coding" | "hr";

export interface InterviewRound {
  roundType: RoundType;
  status: "pending" | "in-progress" | "completed" | "skipped" | "failed";
  gradingMethod: "auto" | "gemini";
  items: InterviewQuestionItem[];
  roundScore?: number | null;
  strengths?: string[] | null;
  improvements?: string[] | null;
  summary?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
}

export interface InterviewSession {
  _id: string;
  user: string;
  targetRole: string | null;
  resume?: string | null;
  resumeFilename?: string | null;
  status: "in-progress" | "completed" | "failed";
  currentRoundIndex: number;
  rounds: InterviewRound[];
  overallScore: number | null;
  skillDimensionScores?: {
    technicalKnowledge: number | null;
    problemSolving: number | null;
    handsOnTechnical: number | null;
    communication: number | null;
  };
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Interview = InterviewSession;

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InterviewHistoryItem {
  _id: string;
  targetRole: string | null;
  overallScore: number | null;
  status: string;
  createdAt: string;
  rounds?: Array<{
    roundType: string;
    roundScore: number | null;
  }>;
}

export interface InterviewHistoryResponse {
  sessions: InterviewHistoryItem[];
  pagination: Pagination;
}

export interface StartInterviewPayload {
  targetRole?: string;
  difficulty?: "easy" | "medium" | "hard";
  questionCount?: number;
  selectedRounds?: RoundType[];
  resumeId?: string;
  resumeText?: string;
}

export interface AnswerPayload {
  itemIndex: number;
  selectedOptionIndex?: number | null;
  answer?: string | null;
}
