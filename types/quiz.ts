export interface QuizQuestion {
  questionId: string;
  questionText: string;
}

export interface QuizQuestionResult {
  questionId: string;
  questionText: string;
  userAnswerText: string;
  keyPoints: string[];
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

export interface QuizSubmissionResult {
  attemptId: string;
  score: number;
  passed: boolean;
  totalQuestions: number;
  questionResults: QuizQuestionResult[];
  subTopicStatus: "not_started" | "in_progress" | "passed";
}

export interface GenerateQuizPayload {
  roadmapItemId: string;
}

export interface QuizAnswerPayload {
  questionId: string;
  answerText: string;
}

export interface SubmitQuizPayload {
  attemptId: string;
  answers: QuizAnswerPayload[];
}
