export interface TestCase {
  id?: string;
  input: string;
  expectedOutput: string;
  description?: string;
}

export interface QuizQuestion {
  questionId: string;
  section?: number; // 1: Conceptual MCQs, 2: Coding Challenge, 3: Tough MCQs
  sectionTitle?: string;
  type?: "mcq" | "coding" | "scenario";
  difficulty?: "easy" | "medium" | "hard";
  questionText: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  testCases?: TestCase[];
  starterCode?: string;
  keyPoints?: string[];
}

export interface QuizQuestionResult {
  questionId: string;
  section?: number;
  type?: string;
  questionText: string;
  userAnswerText: string;
  correctAnswer?: string;
  keyPoints?: string[];
  score: number;
  feedback: string;
}

export interface QuizGenerationResult {
  attemptId: string;
  subTopicId: string;
  subTopicName: string;
  skillName: string;
  questions: QuizQuestion[];
  isFirstAttempt: boolean;
}

export interface TestCaseResult {
  testCaseId: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  status?: string;
  executionTimeMs: number;
  error?: string;
}

export interface CodeExecutionResult {
  success: boolean;
  language: string;
  stdout: string;
  stderr: string;
  isCompilationError?: boolean;
  compilationError?: boolean;
  isRuntimeError?: boolean;
  passedCount?: number;
  totalCount?: number;
  testCaseResults: TestCaseResult[];
}

export interface SectionScoreSummary {
  title: string;
  score: number;
  total: number;
}

export interface QuizSubmissionResult {
  attemptId: string;
  score: number;
  passed: boolean;
  totalQuestions: number;
  questionResults: QuizQuestionResult[];
  subTopicStatus: "not_started" | "in_progress" | "passed";
  sectionBreakdown?: {
    section1?: SectionScoreSummary;
    section2?: SectionScoreSummary;
    section3?: SectionScoreSummary;
  };
}

export interface GenerateQuizPayload {
  roadmapItemId?: string;
  subTopicId?: string;
  subTopicName?: string;
  skillName?: string;
}

export interface RunCodePayload {
  code: string;
  language: string;
  testCases?: TestCase[];
  questionText?: string;
}

export interface QuizAnswerPayload {
  questionId: string;
  answerText: string;
}

export interface SubmitQuizPayload {
  attemptId: string;
  answers: QuizAnswerPayload[];
}

