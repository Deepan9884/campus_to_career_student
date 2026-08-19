import { api } from "@/lib/api";

export interface StudentSummary {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  targetRole: string;
  githubUsername?: string;
  overallReadiness: number;
  resumeScore: number;
  avgInterviewScore: number;
  totalProblemsSolved: number;
  repoCount: number;
  verifiedEventsCount: number;
  linkedPlatformsCount: number;
  status: "On Track" | "At Risk" | "Top Performer";
  lastActive?: string;
}

export interface StudentsListResponse {
  students: StudentSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Student360DetailResponse {
  student: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    targetRole: string;
    githubUsername?: string;
    bio?: string;
    createdAt: string;
  };
  metrics: {
    overallReadinessPct: number;
    skillGapMatchPct: number;
    resumeScore: number;
    avgInterviewScore: number;
    codingScore: number;
    eventScore: number;
    totalProblemsSolved: number;
    repoCount: number;
    verifiedEventsCount: number;
  };
  resumes: any[];
  interviews: any[];
  codingProfiles: any[];
  repoAnalyses: any[];
  events: any[];
  gapAnalyses: any[];
  roadmaps: any[];
  userSkills: any[];
}

export interface CohortAnalyticsResponse {
  summary: {
    totalStudents: number;
    avgResumeScore: number;
    avgInterviewScore: number;
    totalCodingProblems: number;
    verifiedProofsCount: number;
    completedInterviewsCount: number;
    analyzedResumesCount: number;
  };
  topTargetRoles: { role: string; count: number }[];
}

export async function getStudentsList(
  page = 1,
  search = "",
  filter = "all",
  limit = 20
): Promise<StudentsListResponse> {
  return api.get<StudentsListResponse>(
    `/admin/students?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&filter=${filter}`
  );
}

export async function getStudent360Detail(studentId: string): Promise<Student360DetailResponse> {
  return api.get<Student360DetailResponse>(`/admin/students/${studentId}`);
}

export async function getCohortAnalytics(): Promise<CohortAnalyticsResponse> {
  return api.get<CohortAnalyticsResponse>("/admin/analytics");
}

export async function sendStudentFeedback(
  studentId: string,
  payload: { title?: string; note: string; actionType?: string }
): Promise<{ message: string; notification: any }> {
  return api.post<{ message: string; notification: any }>(`/admin/students/${studentId}/feedback`, payload);
}
