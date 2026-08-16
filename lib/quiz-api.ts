import { api } from "@/lib/api";
import type {
  GenerateQuizPayload,
  SubmitQuizPayload,
  QuizGenerationResult,
  QuizSubmissionResult,
} from "@/types/quiz";

export async function generateQuiz(payload: GenerateQuizPayload): Promise<QuizGenerationResult> {
  return api.post<QuizGenerationResult>("/skill-gap/quiz/generate", payload);
}

export async function submitQuiz(payload: SubmitQuizPayload): Promise<QuizSubmissionResult> {
  return api.post<QuizSubmissionResult>("/skill-gap/quiz/submit", payload);
}
