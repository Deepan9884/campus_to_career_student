import { api } from "@/lib/api";
import type {
  InterviewSession,
  InterviewHistoryResponse,
  StartInterviewPayload,
  AnswerPayload,
} from "@/types/interview";

export async function startInterview(payload: StartInterviewPayload): Promise<InterviewSession> {
  return api.post<InterviewSession>("/interview/start", payload);
}

export async function submitRoundAnswer(
  sessionId: string,
  roundType: string,
  payload: AnswerPayload,
): Promise<InterviewSession> {
  return api.post<InterviewSession>(`/interview/${sessionId}/rounds/${roundType}/answer`, payload);
}

export async function finishRound(
  sessionId: string,
  roundType: string,
): Promise<InterviewSession> {
  return api.post<InterviewSession>(`/interview/${sessionId}/rounds/${roundType}/finish`, {});
}

export async function getInterviewHistory(page = 1, limit = 10): Promise<InterviewHistoryResponse> {
  return api.get<InterviewHistoryResponse>(`/interview/history?page=${page}&limit=${limit}`);
}

export async function getInterviewById(id: string): Promise<InterviewSession> {
  return api.get<InterviewSession>(`/interview/${id}`);
}

export async function deleteInterview(id: string): Promise<void> {
  await api.delete<void>(`/interview/${id}`);
}
