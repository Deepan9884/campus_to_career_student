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

export interface LanguageCertificate {
  _id: string;
  language: string;
  examLevel: string;
  certificateTitle: string;
  issuer: string;
  status: string;
  score?: string;
  credentialId?: string;
  issuedDate?: string;
  notes?: string;
  originalFileName?: string;
  fileType?: string;
  createdAt: string;
}

export interface ListeningScript {
  title: string;
  script: string;
  translation: string;
  questions: QuizQuestion[];
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

export async function generateListeningScript(
  language: string,
  targetExam: string,
  topic?: string
): Promise<ListeningScript> {
  return api.post<ListeningScript>("/foreign-language/listening", { language, targetExam, topic });
}

export async function uploadLanguageCertificate(data: {
  file?: File | null;
  language: string;
  examLevel: string;
  certificateTitle: string;
  issuer: string;
  status: string;
  score?: string;
  credentialId?: string;
  issuedDate?: string;
  notes?: string;
}): Promise<LanguageCertificate> {
  const formData = new FormData();
  if (data.file) formData.append("file", data.file);
  formData.append("language", data.language);
  formData.append("examLevel", data.examLevel);
  formData.append("certificateTitle", data.certificateTitle);
  formData.append("issuer", data.issuer);
  formData.append("status", data.status);
  if (data.score) formData.append("score", data.score);
  if (data.credentialId) formData.append("credentialId", data.credentialId);
  if (data.issuedDate) formData.append("issuedDate", data.issuedDate);
  if (data.notes) formData.append("notes", data.notes);

  return api.post<LanguageCertificate>("/foreign-language/certificates", formData);
}

export async function getLanguageCertificates(language?: string): Promise<LanguageCertificate[]> {
  const qs = language ? `?language=${encodeURIComponent(language)}` : "";
  return api.get<LanguageCertificate[]>(`/foreign-language/certificates${qs}`);
}

export async function deleteLanguageCertificate(id: string): Promise<void> {
  return api.delete<void>(`/foreign-language/certificates/${id}`);
}
