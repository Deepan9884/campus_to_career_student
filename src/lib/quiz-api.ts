import { api } from "@/lib/api";
import type {
  GenerateQuizPayload,
  SubmitQuizPayload,
  QuizGenerationResult,
  QuizSubmissionResult,
  RunCodePayload,
  CodeExecutionResult,
} from "@/types/quiz";

export async function generateQuiz(payload: GenerateQuizPayload): Promise<QuizGenerationResult> {
  return api.post<QuizGenerationResult>("/skill-gap/quiz/generate", payload);
}

export async function executeCode(payload: RunCodePayload): Promise<CodeExecutionResult> {
  return api.post<CodeExecutionResult>("/skill-gap/quiz/run-code", payload);
}

export async function submitQuiz(payload: SubmitQuizPayload): Promise<QuizSubmissionResult> {
  return api.post<QuizSubmissionResult>("/skill-gap/quiz/submit", payload);
}
