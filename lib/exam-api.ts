import { api } from "./api";
import type { ProctoredAssessment } from "./tests-data";

export interface StudentExamSummary {
  _id: string;
  title: string;
  description: string;
  examType: "mcq" | "coding" | "mixed";
  category: string;
  difficulty: string;
  durationMinutes: number;
  totalMarks: number;
  passingScorePercentage: number;
  sectionsCount: number;
  proctoringConfig: {
    webcamRequired: boolean;
    fullscreenEnforced: boolean;
    tabSwitchLimit: number;
    aiFaceDetection: boolean;
    copyPasteDisabled: boolean;
  };
  isResultDisclosed: boolean;
  allowRetakes?: boolean;
  hasAttempted: boolean;
  submissionStatus?: {
    isSubmitted: boolean;
    submittedAt: string;
    status: string;
  } | null;
}

export interface StudentQuestionScore {
  questionId: string;
  questionTitle: string;
  type: "mcq" | "coding";
  userAnswer?: string;
  isCorrect?: boolean;
  score?: number;
  maxMarks?: number;
  testCasesPassed?: number;
  totalTestCases?: number;
  executionTimeMs?: number;
  feedback?: string;
}

export interface StudentExamResultItem {
  submissionId: string;
  examId: string;
  examTitle: string;
  category: string;
  examType: "mcq" | "coding" | "mixed";
  difficulty: string;
  submittedAt: string;
  durationSeconds: number;
  isResultDisclosed: boolean;
  status: string;
  message?: string;
  rank?: number;
  totalScore?: number;
  maxScore?: number;
  percentage?: number;
  passed?: boolean;
  proctoringIntegrity?: number;
  violationsCount?: number;
  sectionScores?: {
    sectionId: string;
    sectionTitle: string;
    type: "mcq" | "coding";
    score: number;
    maxScore: number;
    percentage: number;
  }[];
  questionScores?: StudentQuestionScore[];
}

export async function getStudentAvailableExams(): Promise<StudentExamSummary[]> {
  try {
    const res = await api.get<StudentExamSummary[]>("/exams/student/available");
    return res || [];
  } catch (err) {
    console.warn("Failed to fetch student exams from backend:", err);
    return [];
  }
}

export async function getStudentExamSession(examId: string): Promise<any> {
  return api.get<any>(`/exams/student/${examId}`);
}

export async function submitStudentExamResponse(
  examId: string,
  payload: {
    answers: Record<string, any>;
    codingResults?: Record<string, any>;
    durationSeconds: number;
    violationsCount: number;
    violationDetails?: string[];
    proctoringIntegrity: number;
  }
): Promise<{
  submissionId: string;
  examTitle: string;
  status: string;
  message: string;
  isResultDisclosed: boolean;
}> {
  return api.post<any>(`/exams/student/${examId}/submit`, payload);
}

export async function getStudentMyResults(): Promise<StudentExamResultItem[]> {
  try {
    const res = await api.get<StudentExamResultItem[]>("/exams/student/my-results");
    return res || [];
  } catch (err) {
    console.warn("Failed to fetch student results from backend:", err);
    return [];
  }
}

export async function reportStudentExamBlocked(
  examId: string,
  payload: {
    violationsCount: number;
    violationDetails?: string[];
    reason?: string;
  }
): Promise<{ isBlocked: boolean; blockedReason: string; blockedAt: string }> {
  return api.post<any>(`/exams/student/${examId}/report-blocked`, payload);
}

export async function getStudentExamBlockStatus(
  examId: string
): Promise<{ isBlocked: boolean; unblockedAt?: string; status?: string; blockedReason?: string }> {
  return api.get<any>(`/exams/student/${examId}/block-status`);
}
