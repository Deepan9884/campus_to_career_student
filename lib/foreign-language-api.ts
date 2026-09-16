import { api } from "./api";

export interface LanguageProfile {
  _id: string;
  activeLanguage: string;
  targetExam: string;
  fluencyLevel: string;
  preferences: {
    dailyGoalMinutes: number;
    focusAreas: string[];
  };
  stats: {
    quizzesTaken: number;
    materialsUploaded: number;
    chatMessages: number;
  };
}

export interface StudyMaterial {
  _id: string;
  title: string;
  language: string;
  originalFileName: string;
  fileType: string;
  isActive: boolean;
  materialType: string;
  createdAt: string;
}

export interface LanguageChatMessage {
  _id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface LanguageChat {
  messages: LanguageChatMessage[];
  activeMaterials: Partial<StudyMaterial>[];
}

export interface QuizQuestion {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export async function getLanguageProfile(): Promise<LanguageProfile> {
  return api.get<LanguageProfile>("/foreign-language/profile");
}

export async function updateLanguageProfile(data: Partial<LanguageProfile>): Promise<LanguageProfile> {
  return api.put<LanguageProfile>("/foreign-language/profile", data);
}

export async function uploadStudyMaterial(file: File, language: string, materialType: string, title?: string): Promise<StudyMaterial> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("language", language);
  formData.append("materialType", materialType);
  if (title) formData.append("title", title);

  return api.post<StudyMaterial>("/foreign-language/materials", formData);
}

export async function getStudyMaterials(language: string): Promise<StudyMaterial[]> {
  return api.get<StudyMaterial[]>(`/foreign-language/materials?language=${encodeURIComponent(language)}`);
}

export async function toggleMaterialActive(id: string, isActive: boolean): Promise<StudyMaterial> {
  return api.patch<StudyMaterial>(`/foreign-language/materials/${id}/active`, { isActive });
}

export async function deleteStudyMaterial(id: string): Promise<void> {
  return api.delete<void>(`/foreign-language/materials/${id}`);
}

export async function sendLanguageChat(language: string, message: string): Promise<{ response: string; materialsReferenced: string[] }> {
  return api.post<{ response: string; materialsReferenced: string[] }>("/foreign-language/chat", { language, message });
}

export async function getLanguageChatHistory(language: string): Promise<LanguageChat> {
  return api.get<LanguageChat>(`/foreign-language/chat?language=${encodeURIComponent(language)}`);
}

export async function generateLanguageQuiz(language: string, targetExam: string): Promise<QuizQuestion[]> {
  return api.post<QuizQuestion[]>("/foreign-language/quiz", { language, targetExam });
}
