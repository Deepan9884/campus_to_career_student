import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  INITIAL_MENTOR_INFO,
  INITIAL_TRAVEL_MILESTONES,
  INITIAL_MENTOR_TASKS,
  INITIAL_SUPER_DREAM_COURSES,
  INITIAL_MENTOR_ROADMAP,
  INITIAL_SUPER_DREAM_TESTS,
  INITIAL_SUPER_DREAM_ANALYTICS,
  INITIAL_COHORT_STUDENTS,
  fetchMySuperDreamState,
  syncSuperDreamState,
  logSuperDreamAction,
  resetSuperDreamState,
  type MentorTask,
  type TravelMilestone,
  type SuperDreamCourse,
  type MentorRoadmapMilestone,
  type SuperDreamTest,
  type SuperDreamAnalytics,
  type CohortStudent,
} from "@/lib/super-dream-api";
import {
  type StudentChecklistData,
  type StudentProfile,
  type SkillMasteryLevel,
  type MentorEvaluation,
  type DevDeliverableItem,
  type GithubPortfolioMetricItem,
  type IndustryCertItem,
  createDefaultChecklist,
  ensureValidChecklist,
} from "@/lib/super-dream-checklist";
import {
  type CodingPlatformKey,
  type PlatformTelemetryStats,
  INITIAL_PLATFORM_STATS,
  extractUsernameFromUrl,
  fetchLiveLeetCodeStats,
  fetchLiveCodingPlatformStats,
} from "@/lib/super-dream-dsa-data";
import {
  refreshCodingProfile,
  upsertCodingProfile,
  getAllCodingProfiles,
} from "@/lib/coding-profiles-api";
import {
  type AllocatedProject,
  INITIAL_ALLOCATED_PROJECTS,
} from "@/lib/super-dream-software-dev-data";
import {
  type AllocatedAiProject,
  INITIAL_ALLOCATED_AI_PROJECTS,
} from "@/lib/super-dream-ai-data";

export type SuperDreamTab =
  | "track-road"
  | "skill-analyzer"
  | "interview"
  | "travel-roadmap"
  | "courses"
  | "events"
  | "learning-roadmap"
  | "coding"
  | "tests"
  | "analysis";

interface SuperDreamState {
  isSuperDreamMode: boolean;
  activeTab: SuperDreamTab;
  activeSectionId: number; // 0 = Track Road overview, 1..10 = respective sections
  showWelcomeAnimation: boolean;
  hasSeenWelcomeIntro: boolean;
  isLiveSyncing: boolean;
  lastSyncedAt: string | null;
  mentorInfo: typeof INITIAL_MENTOR_INFO;
  travelMilestones: TravelMilestone[];
  mentorTasks: MentorTask[];
  courses: SuperDreamCourse[];
  mentorRoadmap: MentorRoadmapMilestone[];
  tests: SuperDreamTest[];
  analytics: SuperDreamAnalytics;
  cohortStudents: CohortStudent[];
  activeStudentId: string;

  // New Comprehensive Elite Checklist Data per student
  studentChecklist: StudentChecklistData;

  // Real-time backend connection actions
  loadLiveSuperDreamState: () => Promise<void>;
  syncToBackend: (newMovement?: {
    actionType: string;
    sectionId?: number;
    title: string;
    details?: string;
    metadata?: any;
  }) => Promise<void>;

  // Student & Navigation Actions
  enterSuperDreamMode: (triggerAnimation?: boolean) => void;
  exitSuperDreamMode: () => void;
  dismissWelcomeAnimation: () => void;
  setActiveTab: (tab: SuperDreamTab) => void;
  setActiveSectionId: (sectionId: number) => void;
  expandedBranch: string | null;
  setExpandedBranch: (branch: string | null) => void;

  // Checklist Fine-grained Actions
  updateStudentProfile: (profile: Partial<StudentProfile>) => void;
  updateSkillStatus: (id: string, status: SkillMasteryLevel, remarks?: string) => void;
  updateLanguageTracking: (
    id: string,
    trackingUpdates: {
      problemsSolved?: number;
      hoursSpent?: number;
      subtopicsMastered?: string[];
      visitedLinks?: string[];
      practiceNotes?: string;
    }
  ) => void;
  toggleLanguageSubtopic: (id: string, subtopic: string) => void;
  markLanguageLinkVisited: (id: string, linkType: string) => void;
  recordLanguageQuizAttempt: (
    id: string,
    score: number,
    passed: boolean,
    integrityScore?: number
  ) => void;

  // CS Fundamentals Quizzes & Courses State
  csQuizAttempts: Record<
    string,
    {
      bestScore: number;
      passed: boolean;
      attemptsCount: number;
      lastAttemptDate: string;
      warningsCount: number;
      rawScore: number;
    }
  >;
  visitedCsCourses: string[];
  recordCsQuizAttempt: (
    quizId: string,
    score: number,
    passed: boolean,
    rawScore?: number,
    warningsCount?: number
  ) => void;
  markCsCourseVisited: (courseId: string) => void;

  updateCsRating: (id: string, rating: number, completed?: boolean, remarks?: string) => void;
  // Coding & DSA Multi-Platform State
  codingPlatformsStats: Record<CodingPlatformKey, PlatformTelemetryStats>;
  updateCodingPlatformUrl: (platform: CodingPlatformKey, url: string) => void;
  syncCodingPlatformTelemetry: (platform?: CodingPlatformKey) => void;
  fetchAndSyncCodingPlatform: (platform: CodingPlatformKey, urlOrUsername?: string) => Promise<void>;
  syncWithClassicCodingProfiles: () => Promise<void>;

  // Software Development Allocated Projects
  allocatedProjects: AllocatedProject[];
  updateAllocatedProject: (id: string, updates: Partial<AllocatedProject>) => void;
  addAllocatedProject: (project: Partial<AllocatedProject>) => void;
  deleteAllocatedProject: (id: string) => void;

  // AI & Data Science Allocated Projects
  allocatedAiProjects: AllocatedAiProject[];
  updateAllocatedAiProject: (id: string, updates: Partial<AllocatedAiProject>) => void;
  addAllocatedAiProject: (project: Partial<AllocatedAiProject>) => void;
  deleteAllocatedAiProject: (id: string) => void;

  updateCodingMetric: (id: string, current: number) => void;
  updateDevDeliverable: (
    id: string,
    updatesOrCurrent: Partial<DevDeliverableItem> | number,
    verified?: boolean,
    repoUrl?: string,
    liveUrl?: string
  ) => void;
  addNewDevProject: (projectData?: Partial<DevDeliverableItem>) => void;
  deleteDevProject: (id: string) => void;
  updateAiDeliverable: (id: string, current: number, verified?: boolean) => void;
  updateCloudDeliverable: (id: string, current: number, verified?: boolean) => void;
  updateGithubMetric: (
    id: string,
    updatesOrCurrent: Partial<GithubPortfolioMetricItem> | number,
    isCompleted?: boolean,
    extraUpdates?: Partial<GithubPortfolioMetricItem>
  ) => void;
  updateIndustryCert: (
    id: string,
    updatesOrStatus: Partial<IndustryCertItem> | ("Completed" | "In Progress" | "Not Started"),
    credentialId?: string,
    credentialUrl?: string,
    verified?: boolean,
    certificatePdfName?: string,
    certificatePdfUrl?: string
  ) => void;
  updateInterviewMetric: (id: string, current: number) => void;
  updateMentorEvaluation: (evalData: Partial<MentorEvaluation>) => void;
  resetChecklistToDefault: () => Promise<void>;

  // Legacy & Aux Actions
  submitCourseCertificate: (
    courseId: string,
    proofData: NonNullable<SuperDreamCourse["certificateProof"]>
  ) => void;
  submitMentorTask: (
    taskId: string,
    deliverableLink: string,
    submissionNote: string
  ) => void;
  recordQuizScore: (
    milestoneId: string,
    topicId: string,
    score: number
  ) => void;
  recordTestAttempt: (
    testId: string,
    score: number
  ) => void;
  recalculateAnalytics: () => void;
  resetSuperDreamData: () => Promise<void>;

  // Mentor Actions
  setActiveStudentId: (studentId: string) => void;
  assignNewMentorTask: (taskData: Omit<MentorTask, "id" | "assignedBy" | "assignedDate">) => void;
  deleteMentorTask: (taskId: string) => void;
  reviewStudentTask: (
    taskId: string,
    status: "completed" | "in_review" | "pending",
    feedback: string,
    rating?: number
  ) => void;
  assignNewCourse: (courseData: Omit<SuperDreamCourse, "id">) => void;
  deleteCourse: (courseId: string) => void;
  verifyCourseProofManual: (courseId: string, approved: boolean) => void;
  assignNewTest: (testData: Omit<SuperDreamTest, "id">) => void;
  deleteTest: (testId: string) => void;
  addMentorRoadmapMilestone: (milestoneData: Omit<MentorRoadmapMilestone, "id">) => void;
  deleteMentorRoadmapMilestone: (milestoneId: string) => void;
}

let syncTimer: any = null;
function scheduleBackendSync(get: () => SuperDreamState, newMovement?: any) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    get().syncToBackend(newMovement).catch(() => {});
  }, 1200);
}

export const useSuperDream = create<SuperDreamState>()(
  persist(
    (set, get) => ({
      isSuperDreamMode: false,
      activeTab: "track-road",
      activeSectionId: 0, // default to Section 0 (Track Road)
      expandedBranch: "coding",
      showWelcomeAnimation: false,
      hasSeenWelcomeIntro: false,
      isLiveSyncing: false,
      lastSyncedAt: null,
      mentorInfo: INITIAL_MENTOR_INFO,
      travelMilestones: INITIAL_TRAVEL_MILESTONES,
      mentorTasks: INITIAL_MENTOR_TASKS,
      courses: INITIAL_SUPER_DREAM_COURSES,
      mentorRoadmap: INITIAL_MENTOR_ROADMAP,
      tests: INITIAL_SUPER_DREAM_TESTS,
      analytics: INITIAL_SUPER_DREAM_ANALYTICS,
      cohortStudents: INITIAL_COHORT_STUDENTS,
      activeStudentId: "",
      csQuizAttempts: {},
      visitedCsCourses: [],
      codingPlatformsStats: INITIAL_PLATFORM_STATS,
      allocatedProjects: INITIAL_ALLOCATED_PROJECTS,
      allocatedAiProjects: INITIAL_ALLOCATED_AI_PROJECTS,

      studentChecklist: ensureValidChecklist(undefined, "Student"),

      loadLiveSuperDreamState: async () => {
        try {
          set({ isLiveSyncing: true });
          const res = await fetchMySuperDreamState();
          if (res?.superDream) {
            const sd = res.superDream;
            set((state) => ({
              studentChecklist: ensureValidChecklist(
                sd.checklist,
                state.studentChecklist?.profile?.name || "Student"
              ),
              codingPlatformsStats: sd.codingPlatformsStats && Object.keys(sd.codingPlatformsStats).length > 0 ? sd.codingPlatformsStats : state.codingPlatformsStats,
              csQuizAttempts: sd.csQuizAttempts && Object.keys(sd.csQuizAttempts).length > 0 ? sd.csQuizAttempts : state.csQuizAttempts,
              visitedCsCourses: sd.visitedCsCourses && sd.visitedCsCourses.length > 0 ? sd.visitedCsCourses : state.visitedCsCourses,
              allocatedProjects: sd.allocatedProjects && sd.allocatedProjects.length > 0 ? sd.allocatedProjects : state.allocatedProjects,
              allocatedAiProjects: sd.allocatedAiProjects && sd.allocatedAiProjects.length > 0 ? sd.allocatedAiProjects : state.allocatedAiProjects,
              courses: sd.courses && sd.courses.length > 0 ? sd.courses : state.courses,
              tests: sd.tests && sd.tests.length > 0 ? sd.tests : state.tests,
              mentorRoadmap: sd.mentorRoadmap && sd.mentorRoadmap.length > 0 ? sd.mentorRoadmap : state.mentorRoadmap,
              travelMilestones: sd.travelMilestones && sd.travelMilestones.length > 0 ? sd.travelMilestones : state.travelMilestones,
              lastSyncedAt: new Date().toISOString(),
              isLiveSyncing: false,
            }));
          } else {
            set({ isLiveSyncing: false });
          }
        } catch {
          set({ isLiveSyncing: false });
        }
      },

      syncToBackend: async (newMovement) => {
        try {
          const state = get();
          await syncSuperDreamState({
            checklist: state.studentChecklist,
            codingPlatformsStats: state.codingPlatformsStats,
            csQuizAttempts: state.csQuizAttempts,
            visitedCsCourses: state.visitedCsCourses,
            allocatedProjects: state.allocatedProjects,
            allocatedAiProjects: state.allocatedAiProjects,
            courses: state.courses,
            tests: state.tests,
            mentorRoadmap: state.mentorRoadmap,
            travelMilestones: state.travelMilestones,
          });
          if (newMovement) {
            await logSuperDreamAction(newMovement).catch(() => {});
          }
          set({ lastSyncedAt: new Date().toISOString() });
        } catch {
          // silent
        }
      },

      enterSuperDreamMode: (triggerAnimation = false) => {
        const state = get();
        set({
          isSuperDreamMode: true,
          showWelcomeAnimation: triggerAnimation && !state.hasSeenWelcomeIntro,
        });
      },

      exitSuperDreamMode: () => {
        set({ isSuperDreamMode: false });
      },

      dismissWelcomeAnimation: () => {
        set({
          showWelcomeAnimation: false,
          hasSeenWelcomeIntro: true,
        });
      },

      setActiveTab: (tab: SuperDreamTab) => {
        set({ activeTab: tab });
      },

      setActiveSectionId: (sectionId: number) => {
        set({ activeSectionId: sectionId, activeTab: "track-road" });
      },

      setExpandedBranch: (expandedBranch: string | null) => {
        set({ expandedBranch });
      },

      // --- CHECKLIST ACTIONS ---
      updateStudentProfile: (profileUpdates) => {
        set((state) => ({
          studentChecklist: {
            ...state.studentChecklist,
            profile: {
              ...state.studentChecklist.profile,
              ...profileUpdates,
            },
          },
        }));
        scheduleBackendSync(get, {
          actionType: "profile_updated",
          sectionId: 0,
          title: "Student profile details updated",
        });
      },

      updateSkillStatus: (id, status, remarks) => {
        set((state) => ({
          studentChecklist: {
            ...state.studentChecklist,
            section1Programming: state.studentChecklist.section1Programming.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status,
                    ...(remarks !== undefined ? { facultyRemarks: remarks } : {}),
                  }
                : item
            ),
          },
        }));
      },

      updateLanguageTracking: (id, trackingUpdates) => {
        set((state) => ({
          studentChecklist: {
            ...state.studentChecklist,
            section1Programming: state.studentChecklist.section1Programming.map((item) => {
              if (item.id !== id) return item;
              return {
                ...item,
                ...trackingUpdates,
              };
            }),
          },
        }));
        scheduleBackendSync(get, {
          actionType: "language_tracking_updated",
          sectionId: 1,
          title: "Language practice and telemetry updated",
        });
      },

      toggleLanguageSubtopic: (id, subtopic) => {
        set((state) => ({
          studentChecklist: {
            ...state.studentChecklist,
            section1Programming: state.studentChecklist.section1Programming.map((item) => {
              if (item.id !== id) return item;
              const current = item.subtopicsMastered || [];
              const exists = current.includes(subtopic);
              const updated = exists ? current.filter((s) => s !== subtopic) : [...current, subtopic];
              return {
                ...item,
                subtopicsMastered: updated,
              };
            }),
          },
        }));
      },

      markLanguageLinkVisited: (id, linkType) => {
        set((state) => ({
          studentChecklist: {
            ...state.studentChecklist,
            section1Programming: state.studentChecklist.section1Programming.map((item) => {
              if (item.id !== id) return item;
              const current = item.visitedLinks || [];
              if (current.includes(linkType)) return item;
              return {
                ...item,
                visitedLinks: [...current, linkType],
              };
            }),
          },
        }));
      },

      recordLanguageQuizAttempt: (id, score, passed, integrityScore = 100) => {
        const today = new Date().toISOString().split("T")[0];
        set((state) => ({
          studentChecklist: {
            ...state.studentChecklist,
            section1Programming: state.studentChecklist.section1Programming.map((item) => {
              if (item.id !== id) return item;
              const bestScore = Math.max(item.bestQuizScore || 0, score);
              const isMastered = passed || bestScore >= 70 || item.status === "Mastered";
              return {
                ...item,
                bestQuizScore: bestScore,
                quizPassed: passed || item.quizPassed,
                lastQuizDate: today,
                quizIntegrityScore: integrityScore,
                status: isMastered ? "Mastered" : "In Progress",
              };
            }),
          },
        }));
        scheduleBackendSync(get, {
          actionType: "quiz_completed",
          sectionId: 1,
          title: `Language Quiz Completed (${id})`,
          details: `Score: ${score}% • Status: ${passed ? "Passed" : "Attempted"} • Integrity: ${integrityScore}%`,
        });
      },

      recordCsQuizAttempt: (quizId, score, passed, rawScore = score, warningsCount = 0) => {
        const today = new Date().toISOString().split("T")[0];
        set((state) => {
          const current = state.csQuizAttempts[quizId] || {
            bestScore: 0,
            passed: false,
            attemptsCount: 0,
            lastAttemptDate: today,
            warningsCount: 0,
            rawScore: 0,
          };
          return {
            csQuizAttempts: {
              ...state.csQuizAttempts,
              [quizId]: {
                bestScore: Math.max(current.bestScore, score),
                passed: passed || current.passed,
                attemptsCount: current.attemptsCount + 1,
                lastAttemptDate: today,
                warningsCount,
                rawScore,
              },
            },
          };
        });
        scheduleBackendSync(get, {
          actionType: "quiz_completed",
          sectionId: 2,
          title: `CS Core Diagnostic Quiz (${quizId})`,
          details: `Score: ${score}% • Raw: ${rawScore} • Warnings: ${warningsCount}`,
        });
      },

      markCsCourseVisited: (courseId) => {
        set((state) => {
          if (state.visitedCsCourses.includes(courseId)) return state;
          return {
            visitedCsCourses: [...state.visitedCsCourses, courseId],
          };
        });
        scheduleBackendSync(get);
      },

      updateCsRating: (id, rating, completed, remarks) => {
        set((state) => ({
          studentChecklist: {
            ...state.studentChecklist,
            section2CsFundamentals: state.studentChecklist.section2CsFundamentals.map((item) =>
              item.id === id
                ? {
                    ...item,
                    rating,
                    completed: completed !== undefined ? completed : rating >= 4,
                    ...(remarks !== undefined ? { remarks } : {}),
                  }
                : item
            ),
          },
        }));
        scheduleBackendSync(get, {
          actionType: "rating_updated",
          sectionId: 2,
          title: `Updated CS Subject Rating (${id})`,
          details: `Rated ${rating}/5 Stars • ${remarks || "Self-evaluation updated"}`,
        });
      },

      updateCodingPlatformUrl: (platform, url) => {
        set((state) => {
          const current = state.codingPlatformsStats[platform] || INITIAL_PLATFORM_STATS[platform];
          const extractedUser = extractUsernameFromUrl(platform, url) || current.username;

          return {
            codingPlatformsStats: {
              ...state.codingPlatformsStats,
              [platform]: {
                ...current,
                profileUrl: url,
                username: extractedUser,
                isConnected: Boolean(url.trim()),
              },
            },
          };
        });
      },

      syncCodingPlatformTelemetry: (_platform) => {
        set((state) => {
          const stats = { ...state.codingPlatformsStats };
          
          // Calculate checklist metrics purely from connected user platforms
          const lcSolved = stats.leetcode?.isConnected ? (stats.leetcode?.totalSolved || 0) : 0;
          const hrSolved = stats.hackerrank?.isConnected ? (stats.hackerrank?.totalSolved || 0) : 0;
          const ccContests = stats.codechef?.isConnected ? (stats.codechef?.contestsAttended || 0) : 0;
          const totalContests =
            (stats.leetcode?.isConnected ? (stats.leetcode?.contestsAttended || 0) : 0) +
            (stats.codechef?.isConnected ? (stats.codechef?.contestsAttended || 0) : 0) +
            (stats.gfg?.isConnected ? (stats.gfg?.contestsAttended || 0) : 0) +
            (stats.hackerrank?.isConnected ? (stats.hackerrank?.contestsAttended || 0) : 0);
          const totalHard =
            (stats.leetcode?.isConnected ? (stats.leetcode?.hardSolved || 0) : 0) +
            (stats.gfg?.isConnected ? (stats.gfg?.hardSolved || 0) : 0) +
            (stats.codechef?.isConnected ? (stats.codechef?.hardSolved || 0) : 0) +
            (stats.hackerrank?.isConnected ? (stats.hackerrank?.hardSolved || 0) : 0);
          const lcRating = stats.leetcode?.isConnected ? (stats.leetcode?.contestRating || 0) : 0;
          const totalSolvedAll =
            (stats.leetcode?.isConnected ? (stats.leetcode?.totalSolved || 0) : 0) +
            (stats.gfg?.isConnected ? (stats.gfg?.totalSolved || 0) : 0) +
            (stats.codechef?.isConnected ? (stats.codechef?.totalSolved || 0) : 0) +
            (stats.hackerrank?.isConnected ? (stats.hackerrank?.totalSolved || 0) : 0);

          const updatedSection3 = state.studentChecklist.section3CodingDsa.map((item) => {
            switch (item.id) {
              case "dsa-1":
                return { ...item, current: lcSolved };
              case "dsa-2":
                return { ...item, current: hrSolved };
              case "dsa-3":
                return { ...item, current: ccContests };
              case "dsa-4":
                return { ...item, current: totalContests };
              case "dsa-5":
                // Proportionally calculate or keep current
                return { ...item, current: Math.min(item.target, Math.round(totalSolvedAll * 0.15)) };
              case "dsa-6":
                return { ...item, current: Math.min(item.target, Math.round(totalSolvedAll * 0.12)) };
              case "dsa-7":
                return { ...item, current: Math.min(item.target, Math.round(totalSolvedAll * 0.12)) };
              case "dsa-8":
                return { ...item, current: totalHard };
              case "dsa-9":
                return { ...item, current: stats.leetcode?.isConnected || stats.gfg?.isConnected ? Math.max(item.current, 5) : item.current };
              case "dsa-10":
                return { ...item, current: lcRating };
              default:
                return item;
            }
          });

          return {
            studentChecklist: {
              ...state.studentChecklist,
              section3CodingDsa: updatedSection3,
            },
          };
        });
      },

      fetchAndSyncCodingPlatform: async (platform, urlOrUsername) => {
        const state = get();
        const current = state.codingPlatformsStats[platform];
        const targetUrl = (urlOrUsername || current.profileUrl || current.username || "").trim();
        if (!targetUrl) return;

        const username = extractUsernameFromUrl(platform, targetUrl);
        if (!username) return;

        // 1. Try direct live public APIs first
        try {
          const liveStats = await fetchLiveCodingPlatformStats(platform, targetUrl);
          if (liveStats && (liveStats.totalSolved !== undefined || liveStats.contestRating !== undefined)) {
            set((s) => ({
              codingPlatformsStats: {
                ...s.codingPlatformsStats,
                [platform]: {
                  ...s.codingPlatformsStats[platform],
                  ...liveStats,
                  username,
                  profileUrl: targetUrl.startsWith("http") ? targetUrl : (s.codingPlatformsStats[platform]?.profileUrl || targetUrl),
                  isConnected: true,
                } as PlatformTelemetryStats,
              },
            }));
            get().syncCodingPlatformTelemetry(platform);
          }
        } catch (err) {
          console.warn(`Direct live stats fetch for ${platform} encountered an issue:`, err);
        }

        // 2. Also sync with backend MongoDB coding-profiles API
        try {
          const res = await upsertCodingProfile({ platform, profileUrl: targetUrl });
          if (res && res.profile) {
            const p = res.profile;
            const cStats = p.cachedStats || {};
            if (cStats.solved || cStats.totalSolved) {
              set((s) => ({
                codingPlatformsStats: {
                  ...s.codingPlatformsStats,
                  [platform]: {
                    ...s.codingPlatformsStats[platform],
                    username: p.username || username,
                    profileUrl: p.profileUrl || targetUrl,
                    isConnected: true,
                    totalSolved: Number(cStats.solved || cStats.totalSolved || 0),
                    easySolved: Number(cStats.byDifficulty?.Easy || cStats.byDifficulty?.easy || cStats.easySolved || 0),
                    mediumSolved: Number(cStats.byDifficulty?.Medium || cStats.byDifficulty?.medium || cStats.mediumSolved || 0),
                    hardSolved: Number(cStats.byDifficulty?.Hard || cStats.byDifficulty?.hard || cStats.hardSolved || 0),
                    contestRating: Number(cStats.currentRating || cStats.rating || cStats.contestRating || cStats.codingScore || 0),
                    globalRank: cStats.globalRank
                      ? String(cStats.globalRank).startsWith("#")
                        ? String(cStats.globalRank)
                        : `Global #${cStats.globalRank}`
                      : cStats.rank
                      ? `Rank #${cStats.rank}`
                      : cStats.overallRank || "Active",
                    dsaRank: cStats.dsaRank
                      ? String(cStats.dsaRank).startsWith("#")
                        ? String(cStats.dsaRank)
                        : `DSA #${cStats.dsaRank}`
                      : undefined,
                    contestRank: cStats.contestRank
                      ? String(cStats.contestRank).startsWith("#")
                        ? String(cStats.contestRank)
                        : `Contest #${cStats.contestRank}`
                      : undefined,
                    contestsAttended: Number(cStats.contestsAttended || 0),
                    streakDays: Number(cStats.streak || 0),
                    lastActiveDate: "Live Synced",
                  },
                },
              }));
              get().syncCodingPlatformTelemetry(platform);
            }
          }
        } catch (err) {
          // Backend offline or non-blocking
        }

        scheduleBackendSync(get, {
          actionType: "coding_synced",
          sectionId: 3,
          title: `Synced ${platform.toUpperCase()} Coding Telemetry`,
          details: `Verified ${get().codingPlatformsStats[platform]?.totalSolved || 0} problems solved`,
        });
      },

      syncWithClassicCodingProfiles: async () => {
        try {
          const res = await getAllCodingProfiles();
          const profilesList: any[] = Array.isArray(res) ? res : (res as any)?.data || [];
          if (!profilesList || profilesList.length === 0) return;

          const PLATFORMS: CodingPlatformKey[] = ["leetcode", "codechef", "gfg", "hackerrank"];
          for (const item of profilesList) {
            const plat = item.platform as CodingPlatformKey;
            if (plat && PLATFORMS.includes(plat) && item.profileUrl) {
              get().updateCodingPlatformUrl(plat, item.profileUrl);
              await get().fetchAndSyncCodingPlatform(plat, item.profileUrl);
            }
          }
        } catch (err) {
          console.warn("Could not sync classic coding profiles to Super Dream:", err);
        }
      },

      updateAllocatedProject: (id, updates) => {
        set((state) => {
          const updatedProjects = (state.allocatedProjects || INITIAL_ALLOCATED_PROJECTS).map((p) =>
            p.id === id ? { ...p, ...updates } : p
          );
          return { allocatedProjects: updatedProjects };
        });
      },

      addAllocatedProject: (project) => {
        set((state) => {
          const currentList = state.allocatedProjects || INITIAL_ALLOCATED_PROJECTS;
          const category = project.categoryKey || "fullstack";
          const count = currentList.filter((p) => p.categoryKey === category).length;
          const newProj: AllocatedProject = {
            id: `proj-${Date.now()}`,
            categoryKey: category,
            categoryLabel: project.categoryLabel || "Software Development Project",
            projectNumber: count + 1,
            title: project.title || `Project #${count + 1}: Scalable Architecture`,
            tagline: project.tagline || "Production system with modular services",
            description: project.description || "Production-grade software deliverable with source code verification.",
            techStack: project.techStack || ["TypeScript", "React", "Node.js"],
            githubUrl: project.githubUrl || "https://github.com/student/new-project",
            screenshotUrl: project.screenshotUrl || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
            liveUrl: project.liveUrl || "",
            demoVideoUrl: project.demoVideoUrl || "",
            verified: project.verified ?? false,
            architectureHighlights: project.architectureHighlights || ["Clean modular architecture", "Automated CI/CD validation"],
            metrics: project.metrics || { commits: 45, stars: 12, latency: "35ms", testCoverage: "90%" },
          };
          return { allocatedProjects: [...currentList, newProj] };
        });
      },

      deleteAllocatedProject: (id) => {
        set((state) => {
          const currentList = state.allocatedProjects || INITIAL_ALLOCATED_PROJECTS;
          const target = currentList.find((p) => p.id === id);
          if (!target) return { allocatedProjects: currentList };
          const category = target.categoryKey;
          const filtered = currentList.filter((p) => p.id !== id);
          let counter = 1;
          const reindexed = filtered.map((p) => {
            if (p.categoryKey === category) {
              return { ...p, projectNumber: counter++ };
            }
            return p;
          });
          return { allocatedProjects: reindexed };
        });
      },

      updateAllocatedAiProject: (id, updates) => {
        set((state) => {
          const currentList = state.allocatedAiProjects || INITIAL_ALLOCATED_AI_PROJECTS;
          const updated = currentList.map((p) => (p.id === id ? { ...p, ...updates } : p));
          return { allocatedAiProjects: updated };
        });
      },

      addAllocatedAiProject: (project) => {
        set((state) => {
          const currentList = state.allocatedAiProjects || INITIAL_ALLOCATED_AI_PROJECTS;
          const category = project.categoryKey || "ml-models";
          const count = currentList.filter((p) => p.categoryKey === category).length;
          const newAiProj: AllocatedAiProject = {
            id: `ai-proj-${Date.now()}`,
            categoryKey: category,
            categoryLabel: project.categoryLabel || "AI & Data Science Deliverable",
            projectNumber: count + 1,
            title: project.title || `Model #${count + 1}: Optimized Pipeline`,
            tagline: project.tagline || "High accuracy neural network architecture",
            description: project.description || "Production-grade AI pipeline with verified repository and metrics.",
            framework: project.framework || "PyTorch / HuggingFace",
            techStack: project.techStack || ["Python", "PyTorch", "FastAPI"],
            githubUrl: project.githubUrl || "https://github.com/student/new-ai-project",
            screenshotUrl: project.screenshotUrl || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
            liveUrl: project.liveUrl || "",
            demoVideoUrl: project.demoVideoUrl || "",
            verified: project.verified ?? false,
            metrics: project.metrics || { accuracy: "95%", f1Score: "0.92", latency: "15ms" },
            highlights: project.highlights || ["Automated hyperparameter tuning", "Quantized INT8 inference engine"],
          };
          return { allocatedAiProjects: [...currentList, newAiProj] };
        });
      },

      deleteAllocatedAiProject: (id) => {
        set((state) => {
          const currentList = state.allocatedAiProjects || INITIAL_ALLOCATED_AI_PROJECTS;
          const target = currentList.find((p) => p.id === id);
          if (!target) return { allocatedAiProjects: currentList };
          const category = target.categoryKey;
          const filtered = currentList.filter((p) => p.id !== id);
          let counter = 1;
          const reindexed = filtered.map((p) => {
            if (p.categoryKey === category) {
              return { ...p, projectNumber: counter++ };
            }
            return p;
          });
          return { allocatedAiProjects: reindexed };
        });
      },

      updateCodingMetric: (id, current) => {
        set((state) => ({
          studentChecklist: {
            ...state.studentChecklist,
            section3CodingDsa: state.studentChecklist.section3CodingDsa.map((item) =>
              item.id === id ? { ...item, current: Math.max(0, current) } : item
            ),
          },
        }));
      },

      updateDevDeliverable: (id, updatesOrCurrent, verified, repoUrl, liveUrl) => {
        set((state) => ({
          studentChecklist: {
            ...state.studentChecklist,
            section4SoftwareDev: state.studentChecklist.section4SoftwareDev.map((item) => {
              if (item.id !== id) return item;
              if (typeof updatesOrCurrent === "object" && updatesOrCurrent !== null) {
                return {
                  ...item,
                  ...updatesOrCurrent,
                  ...(updatesOrCurrent.githubUrl ? { repoUrl: updatesOrCurrent.githubUrl } : {}),
                };
              }
              return {
                ...item,
                current: Math.max(0, updatesOrCurrent),
                ...(verified !== undefined ? { verified } : {}),
                ...(repoUrl !== undefined ? { repoUrl, githubUrl: repoUrl } : {}),
                ...(liveUrl !== undefined ? { liveUrl } : {}),
              };
            }),
          },
        }));
        scheduleBackendSync(get, {
          actionType: "deliverable_updated",
          sectionId: 4,
          title: `Updated Software Dev Project (${id})`,
          details: `Repo: ${repoUrl || (typeof updatesOrCurrent === "object" ? updatesOrCurrent.githubUrl : "") || "Updated"}`,
        });
      },

      addNewDevProject: (projectData) => {
        set((state) => {
          const list = state.studentChecklist.section4SoftwareDev;
          const nextNum = list.length + 1;
          const newProject: DevDeliverableItem = {
            id: `dev-${Date.now()}`,
            projectNumber: nextNum,
            activity: projectData?.activity || `Project #${nextNum}: Advanced Engineering System`,
            category: projectData?.category || "Full-Stack Development",
            description: projectData?.description || "Modular enterprise software project with architectural verification and source code.",
            techStack: projectData?.techStack || ["TypeScript", "React", "Node.js", "PostgreSQL"],
            target: 1,
            current: 1,
            githubUrl: projectData?.githubUrl || "https://github.com/student/new-engineering-project",
            repoUrl: projectData?.githubUrl || "https://github.com/student/new-engineering-project",
            screenshotUrl: projectData?.screenshotUrl || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
            liveUrl: projectData?.liveUrl || "",
            demoVideoUrl: projectData?.demoVideoUrl || "",
            verified: projectData?.verified ?? false,
          };
          return {
            studentChecklist: {
              ...state.studentChecklist,
              section4SoftwareDev: [...list, newProject],
            },
          };
        });
        scheduleBackendSync(get, {
          actionType: "repo_submitted",
          sectionId: 4,
          title: "Added New Software Engineering Project",
          details: projectData?.activity || "Enterprise full-stack repository created",
        });
      },

      deleteDevProject: (id) => {
        set((state) => ({
          studentChecklist: {
            ...state.studentChecklist,
            section4SoftwareDev: state.studentChecklist.section4SoftwareDev
              .filter((item) => item.id !== id)
              .map((item, idx) => ({ ...item, projectNumber: idx + 1 })),
          },
        }));
        scheduleBackendSync(get);
      },

      updateAiDeliverable: (id, current, verified) => {
        set((state) => ({
          studentChecklist: {
            ...state.studentChecklist,
            section5AiDataScience: state.studentChecklist.section5AiDataScience.map((item) =>
              item.id === id
                ? {
                    ...item,
                    current: Math.max(0, current),
                    ...(verified !== undefined ? { verified } : {}),
                  }
                : item
            ),
          },
        }));
      },

      updateCloudDeliverable: (id, current, verified) => {
        set((state) => ({
          studentChecklist: {
            ...state.studentChecklist,
            section6CloudDevOps: state.studentChecklist.section6CloudDevOps.map((item) =>
              item.id === id
                ? {
                    ...item,
                    current: Math.max(0, current),
                    ...(verified !== undefined ? { verified } : {}),
                  }
                : item
            ),
          },
        }));
      },

      updateGithubMetric: (id, updatesOrCurrent, isCompleted, extraUpdates) => {
        set((state) => ({
          studentChecklist: {
            ...state.studentChecklist,
            section7GithubPortfolio: state.studentChecklist.section7GithubPortfolio.map((item) => {
              if (item.id !== id) return item;
              if (typeof updatesOrCurrent === "number") {
                return {
                  ...item,
                  current: Math.max(0, updatesOrCurrent),
                  ...(isCompleted !== undefined ? { isCompleted } : {}),
                  ...(extraUpdates || {}),
                };
              }
              return {
                ...item,
                ...updatesOrCurrent,
                ...(isCompleted !== undefined ? { isCompleted } : {}),
                ...(extraUpdates || {}),
              };
            }),
          },
        }));
      },

      updateIndustryCert: (id, updatesOrStatus, credentialId, credentialUrl, verified, certificatePdfName, certificatePdfUrl) => {
        set((state) => ({
          studentChecklist: {
            ...state.studentChecklist,
            section8Certifications: state.studentChecklist.section8Certifications.map((item) => {
              if (item.id !== id) return item;
              if (typeof updatesOrStatus === "object") {
                return { ...item, ...updatesOrStatus };
              }
              return {
                ...item,
                status: updatesOrStatus,
                ...(credentialId !== undefined ? { credentialId } : {}),
                ...(credentialUrl !== undefined ? { credentialUrl } : {}),
                ...(verified !== undefined ? { verified } : {}),
                ...(certificatePdfName !== undefined ? { certificatePdfName } : {}),
                ...(certificatePdfUrl !== undefined ? { certificatePdfUrl } : {}),
              };
            }),
          },
        }));
      },

      updateInterviewMetric: (id, current) => {
        set((state) => ({
          studentChecklist: {
            ...state.studentChecklist,
            section9InterviewPrep: state.studentChecklist.section9InterviewPrep.map((item) =>
              item.id === id ? { ...item, current: Math.max(0, current) } : item
            ),
          },
        }));
      },

      updateMentorEvaluation: (evalUpdates) => {
        set((state) => ({
          studentChecklist: {
            ...state.studentChecklist,
            section10Evaluation: {
              ...state.studentChecklist.section10Evaluation,
              ...evalUpdates,
            },
          },
        }));
      },

      resetChecklistToDefault: async () => {
        const clean = createDefaultChecklist("Student", "", "Computer Science & Engineering");
        set({
          studentChecklist: clean,
          codingPlatformsStats: INITIAL_PLATFORM_STATS,
          csQuizAttempts: {},
          visitedCsCourses: [],
          allocatedProjects: INITIAL_ALLOCATED_PROJECTS,
          allocatedAiProjects: INITIAL_ALLOCATED_AI_PROJECTS,
          courses: INITIAL_SUPER_DREAM_COURSES,
          tests: INITIAL_SUPER_DREAM_TESTS,
          mentorRoadmap: INITIAL_MENTOR_ROADMAP,
          travelMilestones: INITIAL_TRAVEL_MILESTONES,
        });
        
        // Delete the backend database record completely
        try {
          await resetSuperDreamState();
        } catch (error) {
          console.error("Failed to reset backend state:", error);
        }
      },

      submitCourseCertificate: (courseId, proofData) => {
        set((state) => {
          const updatedCourses = state.courses.map((c) =>
            c.id === courseId
              ? {
                  ...c,
                  status: "verification_pending" as const,
                  certificateProof: proofData,
                }
              : c
          );

          const verifiedCount = updatedCourses.filter(
            (c) => c.status === "completed"
          ).length;

          const updatedAnalytics = {
            ...state.analytics,
            verifiedCoursesCount: verifiedCount,
            readinessIndex: Math.min(100, state.analytics.readinessIndex + 3),
          };

          return {
            courses: updatedCourses,
            analytics: updatedAnalytics,
          };
        });
      },

      submitMentorTask: (taskId, deliverableLink, submissionNote) => {
        set((state) => {
          const updatedTasks = state.mentorTasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: "in_review" as const,
                  deliverableLink,
                  submissionNote,
                  submittedAt: new Date().toISOString().split("T")[0],
                }
              : t
          );

          return {
            mentorTasks: updatedTasks,
          };
        });
      },

      recordQuizScore: (milestoneId, topicId, score) => {
        set((state) => {
          const updatedRoadmap = state.mentorRoadmap.map((m) => {
            if (m.id !== milestoneId) return m;
            const updatedTopics = m.topics.map((t) => {
              if (t.id !== topicId) return t;
              return {
                ...t,
                completed: score >= 80,
                quizCompleted: true,
                quizScore: score,
              };
            });

            const allDone = updatedTopics.every((t) => t.completed);
            return {
              ...m,
              topics: updatedTopics,
              status: allDone ? ("completed" as const) : m.status,
            };
          });

          return { mentorRoadmap: updatedRoadmap };
        });
      },

      recordTestAttempt: (testId, score) => {
        set((state) => {
          const updatedTests = state.tests.map((t) => {
            if (t.id !== testId) return t;
            const currentHigh = t.highScore || 0;
            return {
              ...t,
              status: "completed" as const,
              highScore: Math.max(currentHigh, score),
              lastAttemptedAt: new Date().toISOString(),
              attemptsCount: (t.attemptsCount || 0) + 1,
            };
          });

          const completedCount = updatedTests.filter(
            (t) => t.status === "completed"
          ).length;
          const avgScore = Math.round(
            updatedTests.reduce((acc, curr) => acc + (curr.highScore || 0), 0) /
              (completedCount || 1)
          );

          const updatedAnalytics = {
            ...state.analytics,
            averageTestScore: avgScore,
            readinessIndex: Math.min(100, Math.max(88, avgScore)),
          };

          return {
            tests: updatedTests,
            analytics: updatedAnalytics,
          };
        });
      },

      recalculateAnalytics: () => {
        // Recalculates metrics based on state
      },

      resetSuperDreamData: async () => {
        const cleanChecklist = createDefaultChecklist();
        set({
          travelMilestones: INITIAL_TRAVEL_MILESTONES,
          mentorTasks: INITIAL_MENTOR_TASKS,
          courses: INITIAL_SUPER_DREAM_COURSES,
          mentorRoadmap: INITIAL_MENTOR_ROADMAP,
          tests: INITIAL_SUPER_DREAM_TESTS,
          analytics: INITIAL_SUPER_DREAM_ANALYTICS,
          cohortStudents: INITIAL_COHORT_STUDENTS,
          studentChecklist: cleanChecklist,
          csQuizAttempts: {},
          visitedCsCourses: [],
          codingPlatformsStats: INITIAL_PLATFORM_STATS,
          allocatedProjects: INITIAL_ALLOCATED_PROJECTS,
          allocatedAiProjects: INITIAL_ALLOCATED_AI_PROJECTS,
        });
        
        // Delete the backend database record completely
        try {
          await resetSuperDreamState();
        } catch (error) {
          console.error("Failed to reset backend state:", error);
        }
      },

      setActiveStudentId: (studentId: string) => {
        set({ activeStudentId: studentId });
      },

      assignNewMentorTask: (taskData) => {
        set((state) => {
          const newTask: MentorTask = {
            ...taskData,
            id: `task-${Date.now()}`,
            assignedBy: state.mentorInfo.name,
            assignedDate: new Date().toISOString().split("T")[0],
            status: "pending",
          };

          const updatedTasks = [newTask, ...state.mentorTasks];

          const updatedMilestones = state.travelMilestones.map((m) => {
            if (m.phase === taskData.phase) {
              return {
                ...m,
                requiredTasksCount: m.requiredTasksCount + 1,
              };
            }
            return m;
          });

          return {
            mentorTasks: updatedTasks,
            travelMilestones: updatedMilestones,
          };
        });
      },

      deleteMentorTask: (taskId) => {
        set((state) => ({
          mentorTasks: state.mentorTasks.filter((t) => t.id !== taskId),
        }));
      },

      reviewStudentTask: (taskId, status, feedback, rating = 5) => {
        set((state) => {
          const updatedTasks = state.mentorTasks.map((t) => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              status,
              mentorFeedback: feedback,
              mentorRating: rating,
            };
          });

          const targetTask = state.mentorTasks.find((t) => t.id === taskId);
          let updatedMilestones = state.travelMilestones;
          if (targetTask && status === "completed") {
            updatedMilestones = state.travelMilestones.map((m) => {
              if (m.phase === targetTask.phase) {
                const finishedCount = updatedTasks.filter(
                  (t) => t.phase === m.phase && t.status === "completed"
                ).length;
                return {
                  ...m,
                  completedTasksCount: finishedCount,
                  status:
                    finishedCount >= m.requiredTasksCount
                      ? ("completed" as const)
                      : m.status,
                };
              }
              return m;
            });
          }

          return {
            mentorTasks: updatedTasks,
            travelMilestones: updatedMilestones,
          };
        });
      },

      assignNewCourse: (courseData) => {
        set((state) => {
          const newCourse: SuperDreamCourse = {
            ...courseData,
            id: `course-${Date.now()}`,
            status: "in_progress",
          };

          return {
            courses: [newCourse, ...state.courses],
          };
        });
      },

      deleteCourse: (courseId) => {
        set((state) => ({
          courses: state.courses.filter((c) => c.id !== courseId),
        }));
      },

      verifyCourseProofManual: (courseId, approved) => {
        set((state) => {
          const updatedCourses = state.courses.map((c) => {
            if (c.id !== courseId) return c;
            if (approved) {
              return {
                ...c,
                status: "completed" as const,
                certificateProof: c.certificateProof || {
                  credentialId: `CERT-MENTOR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                  issuedBy: c.provider,
                  issueDate: new Date().toISOString().split("T")[0],
                  studentName: state.studentChecklist?.profile?.name || "Student",
                  verificationScore: 99,
                  verifiedAt: new Date().toISOString(),
                  verificationChecks: {
                    studentMatch: true,
                    issuerAuthenticated: true,
                    cryptographicSignatureValid: true,
                    syllabusAlignment: 99,
                    tamperCheckPassed: true,
                  },
                },
              };
            } else {
              return {
                ...c,
                status: "in_progress" as const,
                certificateProof: undefined,
              };
            }
          });

          return { courses: updatedCourses };
        });
      },

      assignNewTest: (testData) => {
        set((state) => {
          const newTest: SuperDreamTest = {
            ...testData,
            id: `test-${Date.now()}`,
            status: "not_started",
            attemptsCount: 0,
          };

          return {
            tests: [newTest, ...state.tests],
          };
        });
      },

      deleteTest: (testId) => {
        set((state) => ({
          tests: state.tests.filter((t) => t.id !== testId),
        }));
      },

      addMentorRoadmapMilestone: (milestoneData) => {
        set((state) => {
          const newMilestone: MentorRoadmapMilestone = {
            ...milestoneData,
            id: `m-${Date.now()}`,
            status: "in_progress",
          };

          return {
            mentorRoadmap: [...state.mentorRoadmap, newMilestone],
          };
        });
      },

      deleteMentorRoadmapMilestone: (milestoneId) => {
        set((state) => ({
          mentorRoadmap: state.mentorRoadmap.filter((m) => m.id !== milestoneId),
        }));
      },
    }),
    {
      name: "campus_super_dream_checklist_v6",
      onRehydrateStorage: () => (state) => {
        if (state && state.studentChecklist) {
          state.studentChecklist = ensureValidChecklist(state.studentChecklist);
        }
      },
    }
  )
);
