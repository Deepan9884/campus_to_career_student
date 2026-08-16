import { api } from "@/lib/api";
import type { Resume, ResumeHistoryResponse } from "@/types/resume";

export async function uploadResume(file: File, targetRole?: string): Promise<Resume> {
  const formData = new FormData();
  formData.append("resume", file);
  if (targetRole) {
    formData.append("targetRole", targetRole);
  }
  return api.post<Resume>("/resume/upload", formData);
}

export async function getResumeHistory(page = 1, limit = 10): Promise<ResumeHistoryResponse> {
  return api.get<ResumeHistoryResponse>(`/resume/history?page=${page}&limit=${limit}`);
}

export async function getResumeById(id: string): Promise<Resume> {
  return api.get<Resume>(`/resume/${id}`);
}

export async function deleteResume(id: string): Promise<void> {
  await api.delete<void>(`/resume/${id}`);
}

export async function improveBulletPoint(bulletPoint: string, role?: string): Promise<{ improved: string }> {
  return api.post<{ improved: string }>("/resume/improve-bullet", { bulletPoint, role });
}
