import { api } from "@/lib/api";
import type {
  LearningRoadmap,
  RoadmapHistoryResponse,
  GenerateRoadmapPayload,
} from "@/types/roadmap";

export async function generateRoadmap(payload: GenerateRoadmapPayload): Promise<LearningRoadmap> {
  return api.post<LearningRoadmap>("/roadmap/generate", payload);
}

export async function getRoadmapHistory(page = 1, limit = 10): Promise<RoadmapHistoryResponse> {
  return api.get<RoadmapHistoryResponse>(`/roadmap/history?page=${page}&limit=${limit}`);
}

export async function getRoadmapById(id: string): Promise<LearningRoadmap> {
  return api.get<LearningRoadmap>(`/roadmap/${id}`);
}

export async function deleteRoadmap(id: string): Promise<void> {
  await api.delete<void>(`/roadmap/${id}`);
}

export async function getRoadmapByGapAnalysis(
  gapAnalysisId: string,
): Promise<LearningRoadmap | null> {
  return api.get<LearningRoadmap | null>(`/roadmap/by-gap/${gapAnalysisId}`);
}

export async function getLatestRoadmap(): Promise<LearningRoadmap | null> {
  return api.get<LearningRoadmap | null>("/roadmap/latest");
}
