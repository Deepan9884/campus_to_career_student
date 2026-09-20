import { api } from "./api";

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
  isMyMentee?: boolean;
  isProctoringBlocked?: boolean;
  proctoringBlockedAt?: string;
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
    assignedMentor?: string;
    isMyMentee?: boolean;
    isProctoringBlocked?: boolean;
    proctoringBlockedAt?: string;
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
  activityLogs?: any[];
  quizAttempts?: any[];
  proctoringViolations?: any[];
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
    placementFunnel?: {
      placementReady: number;
      developing: number;
      intervention: number;
    };
  };
  topTargetRoles: { role: string; count: number }[];
  topMissingSkills?: { skill: string; count: number }[];
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

export async function getCohortAnalytics(scope = "my-mentees"): Promise<CohortAnalyticsResponse> {
  return api.get<CohortAnalyticsResponse>(`/admin/analytics?scope=${scope}`);
}

export async function sendStudentFeedback(
  studentId: string,
  payload: { title?: string; note: string; actionType?: string }
): Promise<{ message: string; notification: any }> {
  return api.post<{ message: string; notification: any }>(`/admin/students/${studentId}/feedback`, payload);
}

export async function addMentee(emailOrId: string): Promise<{ message: string; student: any }> {
  return api.post<{ message: string; student: any }>("/admin/mentees", {
    studentEmail: emailOrId,
    email: emailOrId,
    studentId: emailOrId,
    query: emailOrId,
  });
}

export async function removeMentee(studentId: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/admin/mentees/${studentId}`);
}

export async function getMyMentees(): Promise<{ mentees: any[] }> {
  return api.get<{ mentees: any[] }>("/admin/mentees");
}

export async function searchRegisteredStudents(query: string): Promise<{ students: any[] }> {
  return api.get<{ students: any[] }>(`/admin/students/search-registered?query=${encodeURIComponent(query)}`);
}

export async function getMentorProfile(): Promise<any> {
  return api.get<any>("/admin/profile");
}

export async function updateMentorProfile(data: any): Promise<{ message: string; user: any }> {
  return api.patch<{ message: string; user: any }>("/admin/profile", data);
}

export async function changeMentorPassword(data: any): Promise<{ message: string }> {
  return api.post<{ message: string }>("/admin/change-password", data);
}

export async function unblockStudentProctoring(
  studentId: string
): Promise<{ message: string }> {
  return api.post<{ message: string }>(
    `/admin/students/${studentId}/unblock-proctoring`,
    {}
  );
}

export async function getStudentProctoringViolations(
  studentId: string
): Promise<{
  violations: Array<{
    _id: string;
    moduleType: string;
    moduleId: string;
    violationCount: number;
    isBlocked: boolean;
    blockedAt?: string;
    createdAt: string;
    events: Array<{ violationType: string; detectedAt: string }>;
  }>;
}> {
  return api.get(`/admin/students/${studentId}/proctoring-violations`);
}

export interface AIInterventionPlan {
  diagnosisSummary: string;
  keyDeficits: string[];
  twoWeekPlan: Array<{
    week: number;
    theme: string;
    actions: string[];
  }>;
  suggestedTasks: Array<{
    title: string;
    description: string;
    category: "quiz" | "interview" | "resume" | "coding" | "general";
    priority: "urgent" | "high" | "medium" | "low";
    daysToComplete: number;
    actionUrl: string;
  }>;
}

export async function generateAIIntervention(
  studentId: string
): Promise<{
  student: { _id: string; name: string; targetRole: string };
  intervention: AIInterventionPlan;
}> {
  return api.post(`/admin/students/${studentId}/generate-intervention`, {});
}

export interface MentorTaskItem {
  _id: string;
  student: string;
  mentor: { _id: string; name: string; email: string; avatar?: string };
  title: string;
  description: string;
  category: "quiz" | "interview" | "resume" | "coding" | "general";
  priority: "urgent" | "high" | "medium" | "low";
  dueDate: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  actionUrl: string;
  completedAt?: string;
  createdAt: string;
}

export async function createMentorTask(
  studentId: string,
  payload: {
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    daysToComplete?: number;
    actionUrl?: string;
  }
): Promise<{ message: string; task: MentorTaskItem }> {
  return api.post(`/admin/students/${studentId}/tasks`, payload);
}

export async function getStudentMentorTasks(
  studentId: string
): Promise<{ tasks: MentorTaskItem[] }> {
  return api.get(`/admin/students/${studentId}/tasks`);
}

export async function updateMentorTask(
  taskId: string,
  payload: Partial<MentorTaskItem>
): Promise<{ message: string; task: MentorTaskItem }> {
  return api.patch(`/admin/tasks/${taskId}`, payload);
}

export async function deleteMentorTask(taskId: string): Promise<{ message: string }> {
  return api.delete(`/admin/tasks/${taskId}`);
}

export interface LiveExamCandidate {
  submissionId: string;
  studentId: string;
  name: string;
  email: string;
  avatar: string;
  registerNumber: string;
  targetRole: string;
  status: "in_progress" | "warning" | "blocked" | "submitted";
  isActiveNow?: boolean;
  isSubmitted?: boolean;
  violationsCount: number;
  violationDetails: string[];
  proctoringIntegrity: number;
  totalScore: number;
  durationSeconds: number;
  submittedAt?: string;
  updatedAt?: string;
}

export interface LiveExamGroup {
  examId: string;
  examTitle: string;
  examType: "mcq" | "coding" | "mixed";
  category: string;
  difficulty: string;
  durationMinutes: number;
  status?: string;
  activeCount: number;
  submittedCount?: number;
  todayCount?: number;
  blockedCount: number;
  warningCount: number;
  candidates: LiveExamCandidate[];
}

export interface LiveProctoringFeedResponse {
  totalBlockedCount: number;
  blockedUsers: Array<{
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    targetRole?: string;
    proctoringBlockedAt?: string;
    assignedMentor?: string;
  }>;
  recentViolations: Array<{
    _id: string;
    userId: { _id: string; name: string; email: string; avatar?: string; targetRole?: string };
    moduleType: string;
    moduleId: string;
    violationCount: number;
    isBlocked: boolean;
    blockedAt?: string;
    updatedAt: string;
    events: Array<{ violationType: string; detectedAt: string }>;
  }>;
  activeExamsCount?: number;
  totalActiveCandidates?: number;
  totalTodayCandidates?: number;
  examsWithTakers?: LiveExamGroup[];
}

export async function getLiveProctoringFeed(): Promise<LiveProctoringFeedResponse> {
  return api.get("/admin/proctoring/live-feed");
}

export async function batchUnblockStudents(
  studentIds: string[],
  reason?: string
): Promise<{ message: string; unblockedCount: number }> {
  return api.post("/admin/students/batch-unblock", { studentIds, reason });
}

export async function exportCohortCsvData(): Promise<{ students: StudentSummary[] }> {
  return api.get("/admin/cohort/export-csv");
}

/* ================================================================== */
/* Super Dream Operations & 10-Section Mentor Live Inspection API      */
/* ================================================================== */

export interface SuperDreamCohortStudent {
  id: string;
  name: string;
  email: string;
  avatar: string;
  targetRole: string;
  readinessIndex: number;
  tierName: string;
  activePhase: number;
  verifiedCourses: number;
  completedTasks: number;
  avgTestScore: number;
  status: "Qualified" | "In Training" | "Review Required";
  verifiedDeliverablesCount: number;
  lastActivityAt: string;
  recentMovements: Array<{
    actionType: string;
    sectionId: number;
    title: string;
    details: string;
    metadata?: any;
    timestamp: string;
  }>;
  hasFullData: boolean;
  isAssignedToMe?: boolean;
}

export interface SuperDreamCohortResponse {
  total: number;
  cohort: SuperDreamCohortStudent[];
}

export interface SuperDreamStudentDetailResponse {
  student: {
    _id: string;
    name: string;
    email: string;
    avatar: string;
    targetRole: string;
    githubUsername?: string;
    createdAt: string;
  };
  superDream: {
    _id: string;
    student: string;
    checklist: any;
    codingPlatformsStats: Record<string, any>;
    csQuizAttempts: Record<string, any>;
    visitedCsCourses: string[];
    allocatedProjects: any[];
    allocatedAiProjects: any[];
    courses: any[];
    tests: any[];
    mentorRoadmap: any[];
    travelMilestones: any[];
    movementHistory: Array<{
      actionType: string;
      sectionId: number;
      title: string;
      details: string;
      metadata?: any;
      timestamp: string;
    }>;
    overallReadiness: number;
    tierName: string;
    activePhase: number;
    verifiedDeliverablesCount: number;
    lastActivityAt: string;
  };
  resumeData?: {
    hasResume: boolean;
    totalResumes: number;
    latestResume: {
      _id: string;
      filename: string;
      atsScore: number;
      targetRole?: string;
      matchedKeywords: string[];
      missingKeywords: string[];
      strengths: string[];
      improvements: string[];
      summary: string;
      extractedText?: string;
      status: string;
      updatedAt: string;
    } | null;
  };
  interviewData?: {
    totalSessions: number;
    completedSessions: number;
    avgScore: number;
    technicalCount: number;
    systemDesignCount: number;
    hrCount: number;
    aptitudeCount: number;
    recentSessions: Array<{
      id: string;
      title: string;
      overallScore: number;
      status: string;
      targetRole?: string;
      createdAt: string;
    }>;
  };
}

export async function getSuperDreamCohort(
  search = "",
  phase?: number,
  scope = "my-mentees"
): Promise<SuperDreamCohortResponse> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (phase) params.append("phase", String(phase));
  if (scope) params.append("scope", scope);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return api.get<SuperDreamCohortResponse>(`/super-dream/cohort${qs}`);
}

export async function getStudentSuperDreamDetail(
  studentId: string
): Promise<SuperDreamStudentDetailResponse> {
  return api.get<SuperDreamStudentDetailResponse>(`/super-dream/student/${studentId}`);
}

export async function verifyStudentSuperDreamDeliverable(
  studentId: string,
  payload: {
    sectionKey?: string;
    itemId: string;
    verified: boolean;
    feedback?: string;
    rating?: number;
  }
): Promise<{ message: string; superDream: any }> {
  return api.post<{ message: string; superDream: any }>(
    `/super-dream/student/${studentId}/verify`,
    payload
  );
}

export async function submitMentorEvaluationSignoff(
  studentId: string,
  payload: {
    strengths?: string;
    areasForImprovement?: string;
    actionPlanNextSemester?: string;
    recommendedLearningPaths?: string[];
    facultyMentorSignature?: string;
    hodSignature?: string;
  }
): Promise<{ message: string; superDream: any }> {
  return api.post<{ message: string; superDream: any }>(
    `/super-dream/student/${studentId}/signoff`,
    payload
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAM CREATION, EVALUATION, AND RESULT DISCLOSURE API
// ═══════════════════════════════════════════════════════════════════════════

export interface McqQuestionData {
  questionId: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  correctAnswer?: string;
  positiveMarks: number;
  negativeMarks: number;
  explanation: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  imageUrl?: string;
  diagramUrl?: string;
}

export interface CodingQuestionData {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard" | "FAANG Tier";
  category: string;
  sourceUrl?: string;
  problemStatement: string;
  diagramUrl?: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  marks: number;
  starterCodes?: Record<string, string>;
  testCases: {
    input: string;
    expectedOutput: string;
    description: string;
    isHidden: boolean;
  }[];
}

export interface ExamSectionData {
  sectionId: string;
  title: string;
  type: "mcq" | "coding";
  difficulty: "easy" | "medium" | "hard" | "faang";
  topics: string[];
  timeLimitMinutes: number;
  targetQuestionCount?: number;
  mcqQuestions: McqQuestionData[];
  codingQuestions: CodingQuestionData[];
}

export interface ExamItem {
  _id: string;
  title: string;
  description: string;
  examType: "mcq" | "coding" | "mixed";
  category: string;
  difficulty: string;
  durationMinutes: number;
  passingScorePercentage: number;
  totalMarks: number;
  targetAudience: "all" | "mentees" | "selected" | "batch";
  assignedStudents?: { _id: string; name: string; email: string; profile?: { registerNumber?: string } }[];
  batchId?: string | null;
  batchName?: string;
  sections: ExamSectionData[];
  proctoringConfig: {
    webcamRequired: boolean;
    fullscreenEnforced: boolean;
    tabSwitchLimit: number;
    aiFaceDetection: boolean;
    copyPasteDisabled: boolean;
  };
  isResultDisclosed: boolean;
  allowRetakes?: boolean;
  isPublished: boolean;
  isScheduled?: boolean;
  scheduledStartTime?: string | null;
  scheduledEndTime?: string | null;
  status?: "draft" | "scheduled" | "active" | "completed" | "stopped";
  stoppedAt?: string | null;
  stoppedBy?: string | null;
  createdAt: string;
  stats?: {
    totalSubmissions: number;
    avgScore: number;
    passedCount: number;
  };
}

export interface QuestionScoreDetail {
  questionId: string;
  questionTitle: string;
  type: "mcq" | "coding";
  userAnswer: string;
  selectedOptionIndex?: number;
  correctOptionIndex?: number;
  isCorrect: boolean;
  score: number;
  maxMarks: number;
  testCasesPassed?: number;
  totalTestCases?: number;
  executionTimeMs?: number;
  feedback?: string;
}

export interface ExamResultRow {
  submissionId: string;
  studentId: string;
  rank: number;
  studentName: string;
  studentEmail: string;
  studentAvatar?: string;
  registerNumber: string;
  department: string;
  batch: string;
  questionScores: QuestionScoreDetail[];
  sectionScores: {
    sectionId: string;
    sectionTitle: string;
    type: "mcq" | "coding";
    score: number;
    maxScore: number;
    percentage: number;
  }[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  durationSeconds: number;
  proctoringIntegrity: number;
  violationsCount: number;
  isBlocked?: boolean;
  blockedReason?: string;
  status: string;
  submittedAt: string;
}

export interface ExamResultsResponse {
  exam: {
    _id: string;
    title: string;
    examType: "mcq" | "coding" | "mixed";
    category: string;
    difficulty: string;
    durationMinutes: number;
    passingScorePercentage: number;
    totalMarks: number;
    isResultDisclosed: boolean;
    sections: ExamSectionData[];
  };
  summary: {
    totalSubmissions: number;
    passedCount: number;
    failedCount: number;
    passPercentage: number;
    avgScore: number;
    highestScore: number;
    lowestScore: number;
  };
  resultsTable: ExamResultRow[];
}

export async function createAdminExam(payload: Partial<ExamItem> & { batchId?: string | null }): Promise<ExamItem> {
  return api.post<ExamItem>("/exams/admin/create", payload);
}

// ── Saved reusable student batches ──────────────────────────────────────────

export interface StudentBatch {
  _id: string;
  name: string;
  description?: string;
  studentIds: string[];
  studentCount: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  members?: { _id: string; name: string; email: string; profile?: { registerNumber?: string }; targetRole?: string }[];
}

export async function getBatches(): Promise<{ batches: StudentBatch[] }> {
  return api.get<{ batches: StudentBatch[] }>("/admin/batches");
}

export async function getBatchDetail(batchId: string): Promise<{ batch: StudentBatch }> {
  return api.get<{ batch: StudentBatch }>(`/admin/batches/${batchId}`);
}

export async function createBatch(payload: {
  name: string;
  description?: string;
  studentIds: string[];
}): Promise<{ batch: StudentBatch }> {
  return api.post<{ batch: StudentBatch }>("/admin/batches", payload);
}

export async function updateBatch(
  batchId: string,
  payload: { name?: string; description?: string; studentIds?: string[] }
): Promise<{ batch: StudentBatch }> {
  return api.patch<{ batch: StudentBatch }>(`/admin/batches/${batchId}`, payload);
}

export async function deleteBatch(batchId: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/admin/batches/${batchId}`);
}

export async function getAdminExams(type = "all", search = "", status = "all"): Promise<ExamItem[]> {
  const params = new URLSearchParams();
  if (type && type !== "all") params.append("examType", type);
  if (status && status !== "all") params.append("status", status);
  if (search) params.append("search", search);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return api.get<ExamItem[]>(`/exams/admin${qs}`);
}

export async function getAdminExamDetail(examId: string): Promise<ExamItem> {
  return api.get<ExamItem>(`/exams/admin/${examId}`);
}

export async function deleteAdminExam(examId: string): Promise<void> {
  return api.delete<void>(`/exams/admin/${examId}`);
}

export async function stopAdminExam(examId: string): Promise<{ message: string; examId: string; status: string }> {
  return api.patch<{ message: string; examId: string; status: string }>(`/exams/admin/${examId}/stop`, {});
}

export async function rescheduleAdminExam(
  examId: string,
  payload: {
    isScheduled: boolean;
    scheduledStartTime?: string | null;
    scheduledEndTime?: string | null;
    durationMinutes?: number;
    resetSubmissions?: boolean;
    notifyStudents?: boolean;
    reason?: string;
  }
): Promise<{ message: string; exam: ExamItem; resetSubmissionsCount?: number }> {
  return api.patch<{ message: string; exam: ExamItem; resetSubmissionsCount?: number }>(
    `/exams/admin/${examId}/reschedule`,
    payload
  );
}

export async function makeAdminExamLive(
  examId: string,
  durationMinutes?: number,
  resetSubmissions: boolean = false
): Promise<{ message: string; exam: ExamItem; resetSubmissionsCount?: number }> {
  return api.patch<{ message: string; exam: ExamItem; resetSubmissionsCount?: number }>(
    `/exams/admin/${examId}/make-live`,
    { durationMinutes, resetSubmissions }
  );
}

export async function toggleAdminExamDisclosure(
  examId: string,
  isResultDisclosed?: boolean
): Promise<{ examId: string; isResultDisclosed: boolean }> {
  return api.patch<{ examId: string; isResultDisclosed: boolean }>(
    `/exams/admin/${examId}/toggle-disclosure`,
    { isResultDisclosed }
  );
}

export async function toggleAdminExamRetakes(
  examId: string,
  allowRetakes?: boolean
): Promise<{ examId: string; allowRetakes: boolean }> {
  return api.patch<{ examId: string; allowRetakes: boolean }>(
    `/exams/admin/${examId}/toggle-retakes`,
    { allowRetakes }
  );
}

export async function assignExamStudents(
  examId: string,
  targetAudience: "all" | "mentees" | "selected" | "batch" = "selected",
  assignedStudents: string[] = [],
  batchId?: string | null
): Promise<{ examId: string; targetAudience: string; assignedCount: number; assignedStudents: string[] }> {
  return api.patch<{ examId: string; targetAudience: string; assignedCount: number; assignedStudents: string[] }>(
    `/exams/admin/${examId}/assign-students`,
    { targetAudience, assignedStudents, batchId: batchId || null }
  );
}

export async function getAdminExamResults(examId: string): Promise<ExamResultsResponse> {
  return api.get<ExamResultsResponse>(`/exams/admin/${examId}/results`);
}

export async function parseCodingLink(urlOrTitle: string): Promise<CodingQuestionData> {
  return api.post<CodingQuestionData>("/exams/admin/parse-coding-link", { urlOrTitle });
}

export async function generateAiMcqs(
  topics: string[],
  difficulty: "easy" | "medium" | "hard" = "medium",
  count = 5
): Promise<McqQuestionData[]> {
  return api.post<McqQuestionData[]>("/exams/admin/generate-ai-mcqs", {
    topics,
    difficulty,
    count,
  });
}

export async function generateAiCoding(
  topic: string,
  difficulty: string = "Medium"
): Promise<CodingQuestionData> {
  return api.post<CodingQuestionData>("/exams/admin/generate-ai-coding", {
    topic,
    difficulty,
  });
}

export interface ExtractedDocQuestionsResult {
  totalExtracted: number;
  fileName?: string;
  questions: McqQuestionData[];
}

export async function extractQuestionsFromFile(
  file: File,
  sectionType = "mcq",
  topic = "General Aptitude",
  difficulty = "medium"
): Promise<ExtractedDocQuestionsResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("sectionType", sectionType);
  formData.append("topic", topic);
  formData.append("difficulty", difficulty);

  return api.post<ExtractedDocQuestionsResult>("/exams/admin/extract-questions-from-file", formData);
}

export async function extractQuestionsFromText(
  text: string,
  sectionType = "mcq",
  topic = "General Aptitude",
  difficulty = "medium"
): Promise<ExtractedDocQuestionsResult> {
  return api.post<ExtractedDocQuestionsResult>("/exams/admin/extract-questions-from-text", {
    text,
    sectionType,
    topic,
    difficulty,
  });
}

export async function unblockStudentExam(
  examId: string,
  studentId: string
): Promise<{ studentId: string; examId: string; isBlocked: boolean; message?: string }> {
  return api.patch<any>(`/exams/admin/${examId}/students/${studentId}/unblock`, {});
}

export async function blockStudentExam(
  examId: string,
  studentId: string,
  reason?: string
): Promise<{ studentId: string; examId: string; isBlocked: boolean; message?: string }> {
  return api.patch<any>(`/exams/admin/${examId}/students/${studentId}/block`, { reason });
}

export async function assignSuperDreamMentee(studentIdOrEmail: string): Promise<{ message: string; student: any }> {
  return api.post<{ message: string; student: any }>("/super-dream/assign-mentee", {
    studentId: studentIdOrEmail,
    studentEmail: studentIdOrEmail,
    query: studentIdOrEmail,
    name: studentIdOrEmail,
    email: studentIdOrEmail,
  });
}

export async function unassignSuperDreamMentee(studentIdOrEmail: string): Promise<{ message: string; unassignedStudentId: string }> {
  return api.post<{ message: string; unassignedStudentId: string }>("/super-dream/unassign-mentee", {
    studentId: studentIdOrEmail,
    studentEmail: studentIdOrEmail,
    query: studentIdOrEmail,
  });
}



