import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "../lib/useDebounce";
import { GlassCard } from "../components/GlassCard";
import {
  Users,
  Compass,
  GraduationCap,
  FileCode,
  Map,
  CheckCircle2,
  Clock,
  Plus,
  ExternalLink,
  ShieldCheck,
  Award,
  Search,
  X,
  UserCheck,
  TrendingUp,
  Crown,
  ChevronRight,
  ChevronLeft,
  Filter,
  Layers,
  Calendar,
  AlertCircle,
  Star,
  BookOpen,
  Code2,
  Eye,
  FileText,
  ShieldAlert,
  Terminal,
  Activity,
  Check,
  Flame,
  Radio,
  Cpu,
  Binary,
  BrainCircuit,
  Cloud,
  Github,
  Mic,
  FileBadge,
  Sparkles,
  RefreshCw,
  Printer,
  FileSpreadsheet,
  LayoutGrid,
  ArrowRight,
  UserPlus,
  UserMinus,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSuperDreamCohort,
  getStudentSuperDreamDetail,
  verifyStudentSuperDreamDeliverable,
  submitMentorEvaluationSignoff,
  assignSuperDreamMentee,
  unassignSuperDreamMentee,
  searchRegisteredStudents,
  type SuperDreamCohortStudent,
} from "../lib/admin-api";
import {
  ExhaustiveTaskBuilderModal,
} from "../components/superdream/ExhaustiveTaskBuilderModal";
import {
  ExhaustiveCourseCuratorModal,
} from "../components/superdream/ExhaustiveCourseCuratorModal";
import {
  ExhaustiveRoadmapBuilderModal,
} from "../components/superdream/ExhaustiveRoadmapBuilderModal";

const SECTION_ICONS: Record<number, React.ElementType> = {
  1: Code2,
  2: Cpu,
  3: Binary,
  4: Layers,
  5: BrainCircuit,
  6: Cloud,
  7: Github,
  8: Award,
  9: Mic,
  10: Crown,
};

const SECTION_TITLES: Record<number, string> = {
  1: "1. Programming Languages Mastery & Integrity",
  2: "2. Computer Science Fundamentals Diagnostic",
  3: "3. Coding & DSA Multi-Platform Telemetry",
  4: "4. Software Development Deliverables",
  5: "5. AI, Generative AI & Data Science Pipelines",
  6: "6. Cloud & DevOps Infrastructure",
  7: "7. GitHub Portfolio & Open Source Footprint",
  8: "8. Industry Certifications & Verification",
  9: "9. Mock Technical & Executive Interview Prep & ATS Resume Intelligence",
  10: "10. Departmental Readiness Evaluation & Signoff",
};

export function SuperDreamManagementPage() {
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [searchCandidate, setSearchCandidate] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<number | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"interactive-panels" | "full-report" | "live-stream">("interactive-panels");
  const [activePanelSection, setActivePanelSection] = useState<number>(1);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [showTaskBuilderModal, setShowTaskBuilderModal] = useState(false);
  const [showCourseCuratorModal, setShowCourseCuratorModal] = useState(false);
  const [showRoadmapBuilderModal, setShowRoadmapBuilderModal] = useState(false);
  const [showResumeTextModal, setShowResumeTextModal] = useState(false);
  const [showAssignMenteeModal, setShowAssignMenteeModal] = useState(false);
  const [assignStudentInput, setAssignStudentInput] = useState("");
  const [assignSearchResults, setAssignSearchResults] = useState<any[]>([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);

  // Live student search in assign modal
  const handleLiveStudentSearch = async (val: string) => {
    setAssignStudentInput(val);
    if (!val.trim()) {
      setAssignSearchResults([]);
      return;
    }
    setIsSearchingStudents(true);
    try {
      const res = await searchRegisteredStudents(val);
      setAssignSearchResults(res.students || []);
    } catch {
      setAssignSearchResults([]);
    } finally {
      setIsSearchingStudents(false);
    }
  };

  // Assign Mentee Mutation
  const assignMenteeMutation = useMutation({
    mutationFn: (input: string) => assignSuperDreamMentee(input),
    onSuccess: (res) => {
      toast.success(res.message || "Student successfully assigned to your Super Dream roster!");
      queryClient.invalidateQueries({ queryKey: ["superDreamCohort"] });
      queryClient.invalidateQueries({ queryKey: ["adminStudentsList"] });
      queryClient.invalidateQueries({ queryKey: ["adminCohortAnalytics"] });
      setShowAssignMenteeModal(false);
      setAssignStudentInput("");
      setAssignSearchResults([]);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to assign student to mentee roster");
    },
  });

  // Unassign Mentee Mutation
  const unassignMenteeMutation = useMutation({
    mutationFn: (studentId: string) => unassignSuperDreamMentee(studentId),
    onSuccess: (res) => {
      toast.success(res.message || "Student unassigned from your roster");
      queryClient.invalidateQueries({ queryKey: ["superDreamCohort"] });
      queryClient.invalidateQueries({ queryKey: ["adminStudentsList"] });
      queryClient.invalidateQueries({ queryKey: ["adminCohortAnalytics"] });
      if (selectedStudentId) {
        setSelectedStudentId("");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to unassign student");
    },
  });

  // Section 10 Evaluation Signoff State
  const [strengthsInput, setStrengthsInput] = useState("");
  const [areasInput, setAreasInput] = useState("");
  const [actionPlanInput, setActionPlanInput] = useState("");
  const [mentorSigInput, setMentorSigInput] = useState("");
  const [hodSigInput, setHodSigInput] = useState("");

  const debouncedSearchCandidate = useDebounce(searchCandidate, 350);

  // 1. Fetch Real Cohort Candidates from MongoDB (Cached & Reactively Updated)
  const { data: cohortData, isLoading: isCohortLoading, refetch: refetchCohort } = useQuery({
    queryKey: ["superDreamCohort", debouncedSearchCandidate, phaseFilter],
    queryFn: () => getSuperDreamCohort(debouncedSearchCandidate, phaseFilter),
  });

  const rawCandidates: SuperDreamCohortStudent[] = cohortData?.cohort || [];
  
  // Filter out any accounts that are explicitly marked as faculty/admin
  const candidates: SuperDreamCohortStudent[] = rawCandidates.filter((cand) => {
    const roleStr = (cand.targetRole || "").toLowerCase();
    const nameStr = (cand.name || "").toLowerCase();
    if (
      nameStr.startsWith("dr.") ||
      nameStr.startsWith("prof.") ||
      nameStr.includes("faculty") ||
      roleStr.includes("faculty")
    ) {
      return false;
    }
    return true;
  });
  const totalRegistered = candidates.length;

  // 2. Fetch Detailed Super Dream 360 State for Selected Student
  const {
    data: studentDetailData,
    isLoading: isDetailLoading,
    refetch: refetchStudentDetail,
  } = useQuery({
    queryKey: ["superDreamStudentDetail", selectedStudentId],
    queryFn: () => getStudentSuperDreamDetail(selectedStudentId),
    enabled: Boolean(selectedStudentId),
  });

  const selectedCandidate = candidates.find((c) => c.id === selectedStudentId);
  const superDreamRecord = studentDetailData?.superDream;
  const resumeData = studentDetailData?.resumeData;
  const latestResume = resumeData?.latestResume;
  const interviewData = studentDetailData?.interviewData;
  const checklist = superDreamRecord?.checklist || {};
  const profile = checklist?.profile || {};
  const movements = superDreamRecord?.movementHistory || [];
  const codingStats = superDreamRecord?.codingPlatformsStats || {};
  const csAttempts = superDreamRecord?.csQuizAttempts || {};
  const section1Programming = checklist?.section1Programming || [];
  const section2CsFundamentals = checklist?.section2CsFundamentals || [];
  const section3CodingDsa = checklist?.section3CodingDsa || [];
  const section4SoftwareDev = checklist?.section4SoftwareDev || [];
  const section5AiDataScience = checklist?.section5AiDataScience || [];
  const section6CloudDevOps = checklist?.section6CloudDevOps || [];
  const section7GithubPortfolio = checklist?.section7GithubPortfolio || [];
  const section8Certifications = checklist?.section8Certifications || [];
  const section9InterviewPrep = checklist?.section9InterviewPrep || [];
  const section10Evaluation = checklist?.section10Evaluation || {};

  // Pre-fill Section 10 evaluation when data loads
  useEffect(() => {
    if (checklist?.section10Evaluation) {
      const evalData = checklist.section10Evaluation;
      setStrengthsInput(evalData.strengths || "");
      setAreasInput(evalData.areasForImprovement || "");
      setActionPlanInput(evalData.actionPlanNextSemester || "");
      setMentorSigInput(evalData.facultyMentorSignature || "");
      setHodSigInput(evalData.hodSignature || "");
    }
  }, [checklist]);

  // Handle Manual Refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchCohort(),
        selectedStudentId ? refetchStudentDetail() : Promise.resolve(),
      ]);
      setLastRefreshedAt(new Date());
      toast.success("Live student telemetry updated from MongoDB", {
        description: `Refreshed at ${new Date().toLocaleTimeString()}`,
      });
    } catch (err: any) {
      toast.error("Failed to refresh live telemetry");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Mutations
  const verifyMutation = useMutation({
    mutationFn: (payload: { sectionKey?: string; itemId: string; verified: boolean; feedback?: string; rating?: number }) =>
      verifyStudentSuperDreamDeliverable(selectedStudentId, payload),
    onSuccess: (data) => {
      toast.success(data.message || "Deliverable verification updated");
      queryClient.invalidateQueries({ queryKey: ["superDreamStudentDetail", selectedStudentId] });
      queryClient.invalidateQueries({ queryKey: ["superDreamCohort"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update verification status");
    },
  });

  const signoffMutation = useMutation({
    mutationFn: (payload: any) => submitMentorEvaluationSignoff(selectedStudentId, payload),
    onSuccess: () => {
      toast.success("Official Placement Readiness Evaluation signed & saved!");
      queryClient.invalidateQueries({ queryKey: ["superDreamStudentDetail", selectedStudentId] });
      queryClient.invalidateQueries({ queryKey: ["superDreamCohort"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save evaluation signoff");
    },
  });

  const handleVerifyItem = (sectionKey: string, itemId: string, currentVerified: boolean) => {
    verifyMutation.mutate({
      sectionKey,
      itemId,
      verified: !currentVerified,
      feedback: !currentVerified ? "Verified by Faculty Mentor" : "Revisions required",
      rating: !currentVerified ? 5 : 3,
    });
  };

  const handleSaveSignoff = () => {
    signoffMutation.mutate({
      strengths: strengthsInput,
      areasForImprovement: areasInput,
      actionPlanNextSemester: actionPlanInput,
      facultyMentorSignature: mentorSigInput,
      hodSignature: hodSigInput,
    });
  };

  // Aggregated cohort KPIs
  const avgReadiness = candidates.length > 0
    ? Math.round(candidates.reduce((acc, c) => acc + (c.readinessIndex || 0), 0) / candidates.length)
    : 0;
  const totalVerifiedDeliverables = candidates.reduce((acc, c) => acc + (c.verifiedDeliverablesCount || 0), 0);

  // Section Progress Calculations for the Master Matrix
  const sectionScores = [
    {
      id: 1,
      title: "Languages",
      completed: section1Programming.filter((p: any) => p.status === "Mastered").length,
      total: section1Programming.length || 9,
      icon: Code2,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50/80 dark:bg-indigo-500/10",
      borderColor: "border-indigo-200 dark:border-indigo-500/30",
    },
    {
      id: 2,
      title: "CS Core",
      completed: section2CsFundamentals.filter((c: any) => c.completed || c.rating >= 4).length,
      total: section2CsFundamentals.length || 10,
      icon: Cpu,
      color: "text-sky-600 dark:text-sky-400",
      bgColor: "bg-sky-50/80 dark:bg-sky-500/10",
      borderColor: "border-sky-200 dark:border-sky-500/30",
    },
    {
      id: 3,
      title: "Coding/DSA",
      completed: Object.values(codingStats).filter((s: any) => s.isConnected || s.totalSolved > 0).length,
      total: 4,
      icon: Binary,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50/80 dark:bg-emerald-500/10",
      borderColor: "border-emerald-200 dark:border-emerald-500/30",
    },
    {
      id: 4,
      title: "Software Dev",
      completed: section4SoftwareDev.filter((d: any) => d.verified || d.current >= d.target && d.target > 0).length,
      total: section4SoftwareDev.length || 4,
      icon: Layers,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50/80 dark:bg-orange-500/10",
      borderColor: "border-orange-200 dark:border-orange-500/30",
    },
    {
      id: 5,
      title: "AI & ML",
      completed: section5AiDataScience.filter((a: any) => a.verified || a.current >= a.target && a.target > 0).length,
      total: section5AiDataScience.length || 6,
      icon: BrainCircuit,
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-50/80 dark:bg-pink-500/10",
      borderColor: "border-pink-200 dark:border-pink-500/30",
    },
    {
      id: 6,
      title: "Cloud/DevOps",
      completed: section6CloudDevOps.filter((c: any) => c.verified || c.current >= c.target && c.target > 0).length,
      total: section6CloudDevOps.length || 6,
      icon: Cloud,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50/80 dark:bg-purple-500/10",
      borderColor: "border-purple-200 dark:border-purple-500/30",
    },
    {
      id: 7,
      title: "GitHub",
      completed: section7GithubPortfolio.filter((g: any) => g.verified || g.current > 0).length,
      total: section7GithubPortfolio.length || 7,
      icon: Github,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50/80 dark:bg-amber-500/10",
      borderColor: "border-amber-200 dark:border-amber-500/30",
    },
    {
      id: 8,
      title: "Certifications",
      completed: section8Certifications.filter((c: any) => c.verified || c.status === "Completed").length,
      total: section8Certifications.length || 5,
      icon: Award,
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-50/80 dark:bg-teal-500/10",
      borderColor: "border-teal-200 dark:border-teal-500/30",
    },
    {
      id: 9,
      title: "Mock Prep",
      completed: section9InterviewPrep.filter((i: any) => i.current > 0).length,
      total: section9InterviewPrep.length || 5,
      icon: Mic,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50/80 dark:bg-rose-500/10",
      borderColor: "border-rose-200 dark:border-rose-500/30",
    },
    {
      id: 10,
      title: "Signoff",
      completed: section10Evaluation.facultyMentorSignature ? 1 : 0,
      total: 1,
      icon: Crown,
      color: "text-amber-600 dark:text-yellow-400",
      bgColor: "bg-amber-50/80 dark:bg-yellow-500/10",
      borderColor: "border-amber-200 dark:border-yellow-500/30",
    },
  ];

  // 10 Section Renderers
  const renderSection1 = () => (
    <GlassCard className="p-6 space-y-4 border-indigo-500/30">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
          <Code2 className="w-5 h-5 text-indigo-400" />
          {SECTION_TITLES[1]} ({section1Programming.length} Languages)
        </h3>
        <span className="text-xs font-mono font-bold text-indigo-400">
          {section1Programming.filter((p: any) => p.status === "Mastered").length} Mastered
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {section1Programming.map((p: any) => (
          <div key={p.id} className="p-4 rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-[var(--foreground)]">{p.skill}</h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                  p.status === "Mastered"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                    : p.status === "In Progress"
                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30"
                    : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30"
                }`}
              >
                {p.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-100/80 border border-slate-200/80 dark:bg-slate-900/60 dark:border-white/10 shadow-2xs">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Problems</p>
                <p className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">{p.problemsSolved || 0}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-100/80 border border-slate-200/80 dark:bg-slate-900/60 dark:border-white/10 shadow-2xs">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Hours Logged</p>
                <p className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">{p.hoursSpent || 0}h</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-100/80 border border-slate-200/80 dark:bg-slate-900/60 dark:border-white/10 shadow-2xs">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Quiz Score</p>
                <p className="font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">{p.bestQuizScore || 0}%</p>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Mastered Subtopics:</p>
              <div className="flex flex-wrap gap-1">
                {(p.subtopicsMastered || []).length > 0 ? (
                  (p.subtopicsMastered || []).map((sub: string, i: number) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-transparent font-medium">
                      {sub}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Foundational concepts in progress</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );

const CS_SUBJECT_DETAILS: Record<string, {
  code: string;
  category: string;
  hours: number;
  topics: string[];
  course: { name: string; portal: string; url?: string };
}> = {
  "Data Structures": {
    code: "CS-DS-101",
    category: "Foundations & Memory Models",
    hours: 45,
    topics: ["B-Trees & Tries", "Heaps & Priority Queues", "Disjoint Set (Union-Find)", "Segment Trees"],
    course: { name: "Data Structures & Algorithms", portal: "UC Berkeley (CS 61B)", url: "https://sp21.datastructur.es/" },
  },
  "Algorithms": {
    code: "CS-ALGO-102",
    category: "Complexity & Paradigms",
    hours: 50,
    topics: ["Dynamic Programming (2D/Bitmask)", "Graph Theory (Max Flow, SCC)", "Divide & Conquer", "NP-Completeness"],
    course: { name: "Design & Analysis of Algorithms", portal: "MIT OCW (6.046J)", url: "https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/" },
  },
  "Operating Systems": {
    code: "CS-OS-201",
    category: "Systems & Architecture",
    hours: 45,
    topics: ["Process Scheduling (CFS)", "Virtual Memory & Paging", "Deadlock & Banker's Algo", "POSIX Threads & Mutexes"],
    course: { name: "Operating Systems Engineering", portal: "MIT OCW (6.828)", url: "https://pdos.csail.mit.edu/6.828/" },
  },
  "Computer Networks": {
    code: "CS-CN-203",
    category: "Networking & Protocols",
    hours: 35,
    topics: ["TCP 3-Way Handshake & BBR", "OSI & Subnetting (CIDR)", "DNS, TLS 1.3 & HTTP/3", "Routing (BGP / OSPF)"],
    course: { name: "Computer Networking", portal: "Stanford (CS 144)", url: "https://cs144.github.io/" },
  },
  "DBMS & Transactions": {
    code: "CS-DBMS-202",
    category: "Data & Storage Engines",
    hours: 40,
    topics: ["ACID & 2PL Concurrency", "B+ Tree & LSM Indexing", "BCNF Normalization", "WAL & ARIES Recovery"],
    course: { name: "Database Systems", portal: "CMU (15-445 / Pavlo)", url: "https://15445.courses.cs.cmu.edu/" },
  },
  "Distributed Systems": {
    code: "CS-DS-301",
    category: "Distributed Architecture",
    hours: 40,
    topics: ["CAP Theorem & PACELC", "Raft & Paxos Consensus", "Consistent Hashing & Vector Clocks", "Distributed Tracing"],
    course: { name: "Distributed Systems", portal: "MIT OCW (6.824)", url: "https://pdos.csail.mit.edu/6.824/" },
  },
  "System Design (HLD & LLD)": {
    code: "CS-SD-302",
    category: "Architecture & Scalability",
    hours: 50,
    topics: ["Load Balancing & CDN", "Database Sharding & Replication", "Kafka Message Queues", "Design Patterns (SOLID, Factory)"],
    course: { name: "System Design for FAANG", portal: "Harvard / MIT", url: "https://github.com/donnemartin/system-design-primer" },
  },
  "Compiler Design": {
    code: "CS-CD-205",
    category: "Languages & Parsers",
    hours: 35,
    topics: ["Lexical Analysis & Flex", "LR / LL Parsing & Bison", "AST & Intermediate Code (IR)", "Code Optimization"],
    course: { name: "Compilers", portal: "Stanford (CS 143)", url: "https://web.stanford.edu/class/cs143/" },
  },
  "Computer Architecture": {
    code: "CS-CA-204",
    category: "Hardware & Instruction Sets",
    hours: 35,
    topics: ["Pipelining & Hazards", "Cache Coherence (MESI)", "Instruction Sets (RISC-V/x86)", "Branch Prediction"],
    course: { name: "Computer Architecture", portal: "Carnegie Mellon (18-447)", url: "https://safari.ethz.ch/architecture/" },
  },
  "Software Engineering & CI/CD": {
    code: "CS-SE-206",
    category: "Lifecycle & DevOps",
    hours: 30,
    topics: ["Agile Scrum & SDLC", "CI/CD GitHub Actions", "Unit & Integration Testing (TDD)", "Docker & Microservices"],
    course: { name: "Software Engineering", portal: "MIT / Industry Standards", url: "https://missing.csail.mit.edu/" },
  },
};

  const renderSection2 = () => {
    const verifiedCount = section2CsFundamentals.filter((c: any) => c.completed).length;
    const highlyRatedCount = section2CsFundamentals.filter((c: any) => c.rating >= 4).length;

    return (
      <GlassCard className="p-6 space-y-5 border-sky-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 grid place-items-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 uppercase tracking-wider font-mono">
                  FAANG CS FOUNDATIONS
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  10 Core Engineering Disciplines
                </span>
              </div>
              <h3 className="text-base font-bold text-[var(--foreground)] mt-0.5">
                {SECTION_TITLES[2]} (10 Subjects)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-mono">
              <span className="text-slate-500 dark:text-slate-400">Verified Mastery: </span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{verifiedCount} / 10</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-mono">
              <span className="text-slate-500 dark:text-slate-400">Rating ≥ 4★: </span>
              <strong className="text-sky-600 dark:text-sky-400 font-bold">{highlyRatedCount} / 10</strong>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {section2CsFundamentals.map((cs: any) => {
            const attempt = csAttempts[cs.id];
            const meta = CS_SUBJECT_DETAILS[cs.subject] || {
              code: "CS-CORE",
              category: "Core Computer Science",
              hours: 35,
              topics: ["Foundational Principles", "Algorithm Complexity", "Systems Architecture", "Design Trade-offs"],
              course: { name: "Computer Science Foundations", portal: "Top University Portal" },
            };

            const isVerified = Boolean(cs.completed);
            const ratingVal = Number(cs.rating || 0);

            return (
              <div
                key={cs.id}
                className={`p-5 rounded-2xl bg-[var(--glass-input-bg)] border space-y-3.5 transition ${
                  isVerified
                    ? "border-emerald-500/40 ring-1 ring-emerald-500/20"
                    : "border-[var(--border)]"
                }`}
              >
                {/* Header: Title, Code, & Category */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-300/30">
                        {meta.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {meta.category}
                      </span>
                    </div>
                    <h4 className="font-bold text-base text-[var(--foreground)] mt-1">
                      {cs.subject}
                    </h4>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isVerified
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 flex items-center gap-1"
                        : attempt?.passed
                        ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30"
                        : ratingVal >= 3
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30"
                        : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30"
                    }`}
                  >
                    {isVerified ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified Mastery</span>
                      </>
                    ) : attempt?.passed ? (
                      `Diagnostic Passed (${attempt.bestScore}%)`
                    ) : ratingVal >= 3 ? (
                      `Self-Assessed (${ratingVal}★)`
                    ) : (
                      "Pending Diagnostic"
                    )}
                  </span>
                </div>

                {/* Star Rating & Benchmarks Row */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Competency Rating:</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= ratingVal
                              ? "text-amber-500 fill-amber-500"
                              : "text-slate-300 dark:text-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 font-mono ml-1">
                      {ratingVal > 0 ? `${ratingVal}/5` : "Unrated"}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Depth: ~{meta.hours}h Target
                  </span>
                </div>

                {/* Key Syllabus & Interview Topics */}
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    Core Syllabus & FAANG Topics:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {meta.topics.map((top, idx) => (
                      <span
                        key={idx}
                        className="text-[10.5px] px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900/80 dark:border-white/10 dark:text-slate-300 font-medium"
                      >
                        {top}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Diagnostic Score & Course Portal Reference */}
                <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200/80 dark:bg-slate-900/60 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Course Reference:</span>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-200 mt-0.5">
                      <BookOpen className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span>{meta.course.name}</span>
                      <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold">({meta.course.portal})</span>
                    </div>
                  </div>

                  {meta.course.url && (
                    <a
                      href={meta.course.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium shrink-0"
                    >
                      <span>Syllabus Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Mentor Verification Action Bar */}
                <div className="pt-2.5 border-t border-[var(--border)] flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[220px]">
                    {cs.remarks || (isVerified ? "Verified by Faculty Mentor" : "Assessed via proctored examination")}
                  </span>

                  <button
                    onClick={() => handleVerifyItem("section2CsFundamentals", cs.id, isVerified)}
                    disabled={verifyMutation.isPending}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      isVerified
                        ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isVerified ? "Revoke Mastery" : "Verify Subject Mastery"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    );
  };

  const renderSection3 = () => (
    <GlassCard className="p-6 space-y-5 border-emerald-500/30">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
          <Binary className="w-5 h-5 text-emerald-400" />
          {SECTION_TITLES[3]}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {["leetcode", "codechef", "gfg", "hackerrank"].map((plat) => {
          const stats = codingStats[plat] || {};
          const easy = Number(stats.easySolved || 0);
          const medium = Number(stats.mediumSolved || 0);
          const hard = Number(stats.hardSolved || 0);
          const sum = easy + medium + hard;
          const totalSolved = Number(stats.totalSolved ?? (sum > 0 ? sum : 0));
          const isConnected = Boolean(stats.isConnected || stats.profileUrl || totalSolved > 0);
          return (
            <div key={plat} className="p-4 rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-[var(--primary)] font-mono">{plat}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                  isConnected
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                    : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30"
                }`}>
                  {isConnected ? "Connected" : "Not Linked"}
                </span>
              </div>

              <div>
                <p className="text-2xl font-black text-[var(--foreground)] font-mono">{totalSolved}</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">Problems Solved</p>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                <div className="p-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-transparent font-bold">E: {easy}</div>
                <div className="p-1 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-transparent font-bold">M: {medium}</div>
                <div className="p-1 rounded bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-transparent font-bold">H: {hard}</div>
              </div>

              {stats.profileUrl && (
                <a href={stats.profileUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 truncate pt-1 border-t border-[var(--border)]">
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{stats.username || "Open Profile"}</span>
                </a>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-[var(--border)] space-y-2">
        <h4 className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Algorithmic Problem Categories</h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {section3CodingDsa.map((d: any) => {
            let cur = Number(d.current || 0);
            if (d.id === "dsa-1" && cur === 0) {
              const lc = codingStats.leetcode || {};
              cur = Number(lc.totalSolved || (Number(lc.easySolved || 0) + Number(lc.mediumSolved || 0) + Number(lc.hardSolved || 0)) || 0);
            } else if (d.id === "dsa-2" && cur === 0) {
              const hr = codingStats.hackerrank || {};
              cur = Number(hr.totalSolved || (Number(hr.easySolved || 0) + Number(hr.mediumSolved || 0) + Number(hr.hardSolved || 0)) || 0);
            }
            return (
              <div key={d.id} className="p-3 rounded-xl bg-slate-100/80 border border-slate-200/80 dark:bg-slate-900/60 dark:border-white/10 space-y-1 shadow-2xs">
                <p className="text-[11px] font-bold text-[var(--foreground)] truncate">{d.activity}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">{cur}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">/ {d.target}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );

  const renderSection4 = () => (
    <GlassCard className="p-6 space-y-4 border-orange-500/30">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
          <Layers className="w-5 h-5 text-orange-400" />
          {SECTION_TITLES[4]} ({section4SoftwareDev.length} Enterprise Modules)
        </h3>
        <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
          {section4SoftwareDev.filter((d: any) => d.verified).length} Mentor Verified
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {section4SoftwareDev.map((proj: any) => {
          const hasSubmission = Boolean(
            proj.githubUrl ||
            proj.repoUrl ||
            proj.liveUrl ||
            Number(proj.current) > 0 ||
            proj.status === "Completed"
          );

          return (
            <div
              key={proj.id}
              className={`p-5 rounded-2xl bg-[var(--glass-input-bg)] border space-y-3.5 transition ${
                proj.verified ? "border-emerald-500/40 ring-1 ring-emerald-500/20" : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-transparent">
                      Project 0{proj.projectNumber || 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{proj.category || "Full-Stack"}</span>
                  </div>
                  <h4 className="font-bold text-base text-[var(--foreground)] mt-1">{proj.activity || proj.title}</h4>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    proj.verified
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 flex items-center gap-1"
                      : hasSubmission
                      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30"
                      : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30"
                  }`}
                >
                  {proj.verified && <CheckCircle2 className="w-3 h-3" />}
                  {proj.verified
                    ? "Verified by Mentor"
                    : hasSubmission
                    ? "Pending Verification"
                    : "Not Submitted"}
                </span>
              </div>

              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{proj.description}</p>

              <div className="flex flex-wrap gap-1.5">
                {(proj.techStack || []).map((tech: string, i: number) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-slate-300 font-mono">
                    {tech}
                  </span>
                ))}
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {proj.githubUrl ? (
                    <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-mono">
                      <Github className="w-3.5 h-3.5" /> Source Code
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic">Repo not submitted</span>
                  )}
                  {proj.liveUrl && (
                    <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                    </a>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (!proj.verified && !hasSubmission) {
                      toast.error("Cannot verify: Student has not submitted a repository link, live demo, or work yet.");
                      return;
                    }
                    handleVerifyItem("section4SoftwareDev", proj.id, proj.verified);
                  }}
                  disabled={verifyMutation.isPending || (!proj.verified && !hasSubmission)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    proj.verified
                      ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30 cursor-pointer"
                      : hasSubmission
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 cursor-pointer"
                      : "bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-700/50 cursor-not-allowed"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  {proj.verified
                    ? "Revoke Verification"
                    : hasSubmission
                    ? "Verify Deliverable"
                    : "Awaiting Submission"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );

  const renderSection5 = () => (
    <GlassCard className="p-6 space-y-4 border-pink-500/30">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-pink-400" />
          {SECTION_TITLES[5]} ({section5AiDataScience.length} Pipelines)
        </h3>
        <span className="text-xs font-mono font-bold text-pink-600 dark:text-pink-400">
          {section5AiDataScience.filter((a: any) => a.verified).length} Verified
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {section5AiDataScience.map((ai: any) => {
          const hasProgress = Boolean(
            Number(ai.current) > 0 ||
            ai.repoUrl ||
            ai.liveUrl ||
            ai.status === "Completed"
          );

          return (
            <div key={ai.id} className="p-5 rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)] flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-50 border border-pink-200 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400 dark:border-transparent font-medium">
                    {ai.framework || "PyTorch / Transformers"}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    ai.verified
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                      : hasProgress
                      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30"
                      : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30"
                  }`}>
                    {ai.verified
                      ? "Verified"
                      : hasProgress
                      ? "Pending Review"
                      : "Not Started"}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[var(--foreground)] mt-2">{ai.activity}</h4>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Target Models: {ai.target} Deliverables</p>
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">Progress: {ai.current} / {ai.target}</span>
                <button
                  onClick={() => {
                    if (!ai.verified && !hasProgress) {
                      toast.error("Cannot verify: Student has not submitted progress or pipeline work yet.");
                      return;
                    }
                    handleVerifyItem("section5AiDataScience", ai.id, ai.verified);
                  }}
                  disabled={verifyMutation.isPending || (!ai.verified && !hasProgress)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                    ai.verified
                      ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30 cursor-pointer"
                      : hasProgress
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer"
                      : "bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-700/50 cursor-not-allowed"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  {ai.verified ? "Revoke" : hasProgress ? "Verify AI Pipeline" : "Awaiting Progress"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );

  const renderSection6 = () => (
    <GlassCard className="p-6 space-y-4 border-purple-500/30">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
          <Cloud className="w-5 h-5 text-purple-400" />
          {SECTION_TITLES[6]} ({section6CloudDevOps.length} Architectures)
        </h3>
        <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
          {section6CloudDevOps.filter((c: any) => c.verified).length} Verified
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {section6CloudDevOps.map((c: any) => {
          const hasProgress = Boolean(
            Number(c.current) > 0 ||
            c.repoUrl ||
            c.cloudUrl ||
            c.status === "Completed"
          );

          return (
            <div key={c.id} className="p-5 rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)] flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400 dark:border-transparent font-medium">
                    {c.cloudProvider || "Multi-Cloud"}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    c.verified
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                      : hasProgress
                      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30"
                      : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30"
                  }`}>
                    {c.verified
                      ? "Verified"
                      : hasProgress
                      ? "Pending"
                      : "Not Configured"}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[var(--foreground)] mt-2">{c.activity}</h4>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">Target Services: {c.target}</p>
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">Configured: {c.current} / {c.target}</span>
                <button
                  onClick={() => {
                    if (!c.verified && !hasProgress) {
                      toast.error("Cannot verify: Student has not submitted cloud architecture config yet.");
                      return;
                    }
                    handleVerifyItem("section6CloudDevOps", c.id, c.verified);
                  }}
                  disabled={verifyMutation.isPending || (!c.verified && !hasProgress)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                    c.verified
                      ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30 cursor-pointer"
                      : hasProgress
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer"
                      : "bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-700/50 cursor-not-allowed"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  {c.verified ? "Revoke" : hasProgress ? "Verify Cloud Infra" : "Awaiting Config"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );

  const renderSection7 = () => (
    <GlassCard className="p-6 space-y-4 border-amber-500/30">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
          <Github className="w-5 h-5 text-amber-400" />
          {SECTION_TITLES[7]}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {section7GithubPortfolio.map((g: any) => (
          <div key={g.id} className="p-4 rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)] space-y-2">
            <h4 className="font-bold text-sm text-[var(--foreground)]">{g.activity}</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{g.current || 0}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/ Target: {g.targetDisplay || g.target || 1} {g.unit || ""}</span>
            </div>
            {g.details && <p className="text-[11px] text-[var(--muted-foreground)]">{g.details}</p>}
          </div>
        ))}
      </div>
    </GlassCard>
  );

  const renderSection8 = () => (
    <GlassCard className="p-6 space-y-4 border-teal-500/30">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
          <Award className="w-5 h-5 text-teal-400" />
          {SECTION_TITLES[8]}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {section8Certifications.map((cert: any) => {
          const hasProof = Boolean(
            cert.credentialId ||
            cert.credentialUrl ||
            cert.certificatePdfUrl ||
            cert.certificatePdfName ||
            cert.status === "Completed"
          );

          return (
            <div
              key={cert.id}
              className={`p-5 rounded-2xl bg-[var(--glass-input-bg)] border space-y-3 ${
                cert.verified ? "border-emerald-500/40 ring-1 ring-emerald-500/20" : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-amber-600 dark:text-[var(--warning)]">{cert.issuer || "Certification Body"}</span>
                  <h4 className="font-bold text-base text-[var(--foreground)] mt-0.5">{cert.certification}</h4>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    cert.verified
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                      : hasProof
                      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30"
                      : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30"
                  }`}
                >
                  {cert.verified
                    ? "Verified"
                    : hasProof
                    ? "Pending Verification"
                    : "No Document Submitted"}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
                <p>Credential ID: <strong className="text-[var(--foreground)] font-mono">{cert.credentialId || "Not Linked"}</strong></p>
                {cert.credentialUrl && (
                  <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-mono">
                    <ExternalLink className="w-3 h-3" /> View Credential URL
                  </a>
                )}
                {cert.certificatePdfName && (
                  <p className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                    <FileBadge className="w-3.5 h-3.5 shrink-0" /> {cert.certificatePdfName}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-xs text-[var(--muted-foreground)] font-medium">
                  Status: {cert.status || (hasProof ? "Submitted" : "Not Started")}
                </span>
                <button
                  onClick={() => {
                    if (!cert.verified && !hasProof) {
                      toast.error("Cannot verify: Student has not submitted any credential ID, link, or certificate document yet.");
                      return;
                    }
                    handleVerifyItem("section8Certifications", cert.id, cert.verified);
                  }}
                  disabled={verifyMutation.isPending || (!cert.verified && !hasProof)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    cert.verified
                      ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30 cursor-pointer"
                      : hasProof
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 cursor-pointer"
                      : "bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-700/50 cursor-not-allowed"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {cert.verified
                    ? "Revoke Proof"
                    : hasProof
                    ? "Approve Certificate"
                    : "Awaiting Document"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );

  const renderSection9 = () => (
    <div className="space-y-5">
      {/* 1. REAL-TIME LIVE ATS RESUME INTELLIGENCE CARD */}
      <GlassCard className="p-6 space-y-5 border-indigo-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-transparent grid place-items-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-transparent uppercase tracking-wider font-mono">
                  LIVE ATS RESUME TELEMETRY
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    latestResume
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
                      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30"
                  }`}
                >
                  {latestResume ? `Verified • ${latestResume.status}` : "No Resume Uploaded"}
                </span>
              </div>
              <h3 className="text-base font-bold text-[var(--foreground)] mt-0.5">
                Candidate ATS Resume Audit &amp; Keyword Gap Analysis
              </h3>
            </div>
          </div>

          {latestResume?.extractedText && (
            <button
              onClick={() => setShowResumeTextModal(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--glass-input-bg)] border border-[var(--border)] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect Extracted Text</span>
            </button>
          )}
        </div>

        {latestResume ? (
          <div className="space-y-5">
            {/* Top Score & Meta Strip */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* ATS Score Dial Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-emerald-50 border border-indigo-200 dark:from-indigo-500/15 dark:via-purple-500/10 dark:to-emerald-500/10 dark:border-indigo-500/30 text-center flex flex-col items-center justify-center space-y-1">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                  ATS Match Score
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span
                    className={`text-3xl font-black font-mono ${
                      latestResume.atsScore >= 80
                        ? "text-emerald-600 dark:text-emerald-400"
                        : latestResume.atsScore >= 60
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {latestResume.atsScore}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/ 100</span>
                </div>
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                  {latestResume.atsScore >= 80
                    ? "Tier-1 Competitive"
                    : latestResume.atsScore >= 60
                    ? "Good Match"
                    : "Remediation Needed"}
                </span>
              </div>

              {/* Resume File & Role Details */}
              <div className="md:col-span-3 p-4 rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileBadge className="w-4 h-4 text-[var(--primary)] shrink-0" />
                    <h4 className="font-bold text-sm text-[var(--foreground)] truncate">
                      {latestResume.filename}
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Last Parsed: {new Date(latestResume.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Target Engineering Track: </span>
                    <strong className="text-[var(--foreground)]">
                      {latestResume.targetRole || profile.targetRole || "Software Engineer"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Total Revisions: </span>
                    <strong className="text-[var(--foreground)] font-mono">
                      {resumeData?.totalResumes || 1} Uploaded
                    </strong>
                  </div>
                </div>

                {latestResume.summary && (
                  <div className="pt-2 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)] leading-relaxed">
                    <p className="line-clamp-2 italic">"{latestResume.summary}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Keyword Match & Gap Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Matched Keywords */}
              <div className="p-4 rounded-2xl bg-[var(--glass-input-bg)] border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Verified Matched Keywords ({(latestResume.matchedKeywords || []).length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {(latestResume.matchedKeywords || []).length > 0 ? (
                    (latestResume.matchedKeywords || []).map((kw, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/20"
                      >
                        {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                      No explicit keywords matched yet
                    </span>
                  )}
                </div>
              </div>

              {/* Missing Critical Keywords */}
              <div className="p-4 rounded-2xl bg-[var(--glass-input-bg)] border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Missing Critical ATS Keywords ({(latestResume.missingKeywords || []).length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {(latestResume.missingKeywords || []).length > 0 ? (
                    (latestResume.missingKeywords || []).map((kw, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/20"
                      >
                        + {kw}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 italic">
                      No major keyword gaps identified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(latestResume.strengths || []).length > 0 && (
                <div className="p-4 rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)] space-y-2">
                  <h5 className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Key Resume Strengths
                  </h5>
                  <ul className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
                    {(latestResume.strengths || []).map((str, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(latestResume.improvements || []).length > 0 && (
                <div className="p-4 rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)] space-y-2">
                  <h5 className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Recommended ATS Improvements
                  </h5>
                  <ul className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
                    {(latestResume.improvements || []).map((imp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)] space-y-2">
            <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
            <h4 className="text-xs font-bold text-[var(--foreground)]">No ATS Resume Uploaded Yet</h4>
            <p className="text-xs text-[var(--muted-foreground)] max-w-md mx-auto">
              The candidate has not uploaded an ATS resume on their student portal yet. Once uploaded, real-time keyword matching, ATS scoring, and strengths will appear here.
            </p>
          </div>
        )}
      </GlassCard>

      {/* 2. MOCK INTERVIEW PREPARATION TARGETS */}
      <GlassCard className="p-6 space-y-4 border-rose-500/30">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
            <Mic className="w-5 h-5 text-rose-400" />
            Mock Technical, Behavioral &amp; AI Interview Goals
          </h3>
          <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
            {interviewData?.completedSessions || 0} Total Sessions Completed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {section9InterviewPrep.map((item: any) => (
            <div key={item.id} className="p-4 rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)] space-y-2">
              <h4 className="font-bold text-sm text-[var(--foreground)]">{item.activity}</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{item.current || 0}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/ Target: {item.target || 1} Rounds</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Mock Interview Sessions Log */}
        {(interviewData?.recentSessions || []).length > 0 && (
          <div className="pt-3 border-t border-[var(--border)] space-y-2.5">
            <h4 className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
              Recent Proctored Mock Sessions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(interviewData?.recentSessions || []).map((session) => (
                <div
                  key={session.id}
                  className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200/80 dark:bg-slate-900/40 dark:border-white/5 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <h5 className="font-bold text-[var(--foreground)]">{session.title}</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {session.targetRole} • {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                      {session.overallScore}%
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 block">Score</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );

  const renderSection10 = () => (
    <GlassCard className="p-6 space-y-5 border-amber-500/40">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
              OFFICIAL INSTITUTIONAL EVALUATION
            </span>
          </div>
          <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight mt-1 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            {SECTION_TITLES[10]}
          </h3>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
            Demonstrated Technical Strengths
          </label>
          <textarea
            rows={2}
            value={strengthsInput}
            onChange={(e) => setStrengthsInput(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-indigo-500"
            placeholder="Record verified candidate technical strengths..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
            Key Areas for Improvement &amp; Remediation
          </label>
          <textarea
            rows={2}
            value={areasInput}
            onChange={(e) => setAreasInput(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-indigo-500"
            placeholder="Record remediation and areas for growth..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
            Action Plan for Upcoming Placement Drives
          </label>
          <textarea
            rows={2}
            value={actionPlanInput}
            onChange={(e) => setActionPlanInput(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-[var(--border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-indigo-500"
            placeholder="Enter strategic next semester action plan..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
              Faculty Mentor Digital Signature
            </label>
            <input
              type="text"
              value={mentorSigInput}
              onChange={(e) => setMentorSigInput(e.target.value)}
              placeholder="Enter Faculty Mentor Name"
              className="w-full p-2.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-[var(--border)] text-xs font-serif italic text-indigo-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
              Head of Department (HOD) Endorsement
            </label>
            <input
              type="text"
              value={hodSigInput}
              onChange={(e) => setHodSigInput(e.target.value)}
              placeholder="Enter Head of Department Name"
              className="w-full p-2.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-[var(--border)] text-xs font-serif italic text-amber-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
          <p className="text-xs text-[var(--muted-foreground)]">
            Review Date: <strong className="text-[var(--foreground)] font-mono">{section10Evaluation.reviewDate || new Date().toISOString().split("T")[0]}</strong>
          </p>

          <button
            onClick={handleSaveSignoff}
            disabled={signoffMutation.isPending}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-indigo-600 hover:opacity-95 text-white transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Crown className="w-4 h-4" />
            Sign &amp; Issue Official Evaluation
          </button>
        </div>
      </div>
    </GlassCard>
  );

  return (
    <div className="space-y-6 pb-20 animate-slide-up-fade">
      {/* 1. MASTER COMMAND CENTER EXECUTIVE HEADER */}
      <div className="elite-panel hero-card-shimmer relative rounded-3xl p-6 overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div
          className="absolute top-0 right-0 w-72 h-32 pointer-events-none opacity-20"
          style={{ background: "radial-gradient(ellipse at top right, rgba(99,102,241,0.12), transparent 70%)" }}
        />
        <div className="flex items-start sm:items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 p-2 grid place-items-center shadow-lg shrink-0 ring-2 ring-indigo-500/20">
            <img src="/eec-logo.webp" alt="Easwari Engineering College" className="w-full h-full object-contain" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              <span className="gradient-text-warm">Super Dream 20+ LPA</span>{" "}
              <span className="text-[var(--foreground)]">Track</span>
            </h1>
            <p className="text-xs text-[var(--muted-foreground)]">
              High-tier placement preparation and tracking.
            </p>
          </div>
        </div>

        {/* Quick Action Launchers */}
        {selectedStudentId && (
          <div className="flex flex-wrap items-center gap-2.5 relative z-10">
            <button
              onClick={() => window.print()}
              className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--glass-input-bg)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition cursor-pointer"
              title="Print Official Dossier"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. PRIMARY VIEW: CANDIDATES PANEL MODEL DIRECTORY (WHEN NO STUDENT IS SELECTED) */}
      {/* ========================================================================= */}
      {!selectedStudentId ? (
        <div className="space-y-4">
          <GlassCard className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-[var(--foreground)] tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  Super Dream Enrolled Candidates ({candidates.length})
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Click on any student card to open their live 360 diagnostic report across all 10 sections.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <input
                    type="text"
                    placeholder="Search candidate by name, role..."
                    value={searchCandidate}
                    onChange={(e) => setSearchCandidate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-white/[0.04] p-1 rounded-xl border border-[var(--border)] text-xs">
                  <button
                    onClick={() => setPhaseFilter(undefined)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      phaseFilter === undefined ? "bg-indigo-600 text-white" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    All Phases
                  </button>
                  {[1, 2, 3, 4].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPhaseFilter(p)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                        phaseFilter === p ? "bg-indigo-600 text-white" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      P{p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Candidates Card Panel Grid */}
            {candidates.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[var(--glass-input-bg)] border border-[var(--border)] space-y-4 max-w-lg mx-auto my-6 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                  <Users className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-[var(--foreground)]">No Mentees Assigned Yet</h4>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    Only students specifically assigned to your mentee roster will appear in your Super Dream cohort. Click below to assign a student to your cohort.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setShowAssignMenteeModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm shadow-indigo-500/25 flex items-center gap-1.5 cursor-pointer active:scale-95 transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Assign Mentee to Super Dream</span>
                  </button>
                  {(searchCandidate || phaseFilter !== undefined) && (
                    <button
                      onClick={() => {
                        setPhaseFilter(undefined);
                        setSearchCandidate("");
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-white/10 text-[var(--foreground)] hover:bg-slate-300 dark:hover:bg-white/20 transition cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                {candidates.map((cand) => (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedStudentId(cand.id)}
                    className="p-6 rounded-3xl bg-[var(--glass-input-bg)] border border-[var(--border)] hover:border-indigo-500/50 hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between group space-y-5 hover:-translate-y-1 relative overflow-hidden"
                  >
                    {/* Top Accent line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 opacity-80" />

                    <div className="space-y-4">
                      {/* Candidate Header with Photo and Readiness */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={cand.avatar}
                            alt={cand.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cand.name || "Student")}&backgroundColor=4f46e5,7c3aed,059669`;
                            }}
                            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/30 group-hover:ring-indigo-500 transition shrink-0"
                          />
                          <div className="min-w-0">
                            <h3 className="font-bold text-base text-[var(--foreground)] group-hover:text-indigo-400 transition truncate">
                              {cand.name}
                            </h3>
                            <p className="text-xs text-[var(--muted-foreground)] truncate">{cand.email}</p>
                          </div>
                        </div>

                        {/* Readiness Metric Circle/Badge */}
                        <div className="text-right shrink-0 p-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20 text-center min-w-[70px]">
                          <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 block">
                            {cand.readinessIndex}%
                          </span>
                          <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                            Readiness
                          </span>
                        </div>
                      </div>

                      {/* Role & Imp Details */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Target Track:</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-300 truncate max-w-[200px] text-right">
                            {cand.targetRole || "Career Accelerator Track"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Target Tier:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[200px] text-right">
                            {cand.tierName || "Pending Evaluation"}
                          </span>
                        </div>
                      </div>

                      {/* Important Detail Badges Strip */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                        <div className="p-2 rounded-xl bg-slate-100/80 border border-slate-200/80 dark:bg-slate-900/60 dark:border-white/10 shadow-2xs">
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Active Phase</p>
                          <p className="font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">Phase 0{cand.activePhase}</p>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-100/80 border border-slate-200/80 dark:bg-slate-900/60 dark:border-white/10 shadow-2xs">
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Verified</p>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{cand.verifiedDeliverablesCount || 0} Items</p>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-100/80 border border-slate-200/80 dark:bg-slate-900/60 dark:border-white/10 shadow-2xs">
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Status</p>
                          <p className="font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5 truncate">{cand.status}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Strip */}
                    <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Remove ${cand.name} (${cand.email}) from your mentee and Super Dream roster?`)) {
                            unassignMenteeMutation.mutate(cand.id);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/20 transition flex items-center gap-1.5 cursor-pointer"
                        title="Unassign this student from your roster"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        <span>Unassign</span>
                      </button>

                      <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                        <span>Inspect 360 Report</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      ) : (
        /* ========================================================================= */
        /* 4. DETAIL VIEW: SELECTED STUDENT 360 REPORT (WITH BACK BUTTON) */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedStudentId("")}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--glass-input-bg)] border border-[var(--border)] text-[var(--foreground)] hover:bg-white/10 transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to All Candidates ({candidates.length})</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (confirm(`Remove ${selectedCandidate?.name || "this student"} from your mentee and Super Dream roster?`)) {
                    unassignMenteeMutation.mutate(selectedStudentId);
                  }
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/15 border border-red-500/30 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Mentee from Roster</span>
              </button>

              <span className="text-xs text-[var(--muted-foreground)] font-mono">
                Candidate ID: {selectedStudentId}
              </span>
            </div>
          </div>

          {/* Selected Candidate HUD Header */}
          <GlassCard className="p-5 border-[rgb(var(--primary-rgb)/40%)] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedCandidate?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedCandidate?.name || "Student")}&backgroundColor=4f46e5,7c3aed,059669`}
                  alt={selectedCandidate?.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedCandidate?.name || "Student")}&backgroundColor=4f46e5,7c3aed,059669`;
                  }}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[var(--primary)] shadow-lg"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-[var(--foreground)] tracking-tight">
                      {selectedCandidate?.name}
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {selectedCandidate?.status}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      Phase 0{selectedCandidate?.activePhase} Active
                    </span>
                  </div>
                  <p className="text-xs text-[var(--primary)] font-semibold">
                    {profile.targetRole || selectedCandidate?.targetRole}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)] pt-0.5">
                    <span>Reg: <strong className="text-[var(--foreground)] font-mono">{profile.registerNumber || "Not Set"}</strong></span>
                    <span>Dept: <strong className="text-[var(--foreground)]">{profile.department || "Not Set"}</strong></span>
                    <span>Batch: <strong className="text-[var(--foreground)] font-mono">{profile.batch || "Not Set"}</strong></span>
                    <span>Semester: <strong className="text-[var(--foreground)]">{profile.currentSemester || "Not Set"}</strong></span>
                    <span>Mentor: <strong className="text-[var(--warning)]">{profile.facultyMentor || "Unassigned"}</strong></span>
                  </div>
                </div>
              </div>

              {/* Score & Tier Badge */}
              <div className="flex items-center gap-4 self-end md:self-auto">
                <div className="p-3.5 px-6 rounded-2xl bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-amber-500/10 border border-indigo-500/30 text-center min-w-[180px]">
                  <p className="text-[10px] text-[var(--muted-foreground)] uppercase font-semibold tracking-wider">
                    Super Dream Score
                  </p>
                  <div className="flex items-baseline justify-center gap-1 mt-0.5">
                    <span className="text-3xl font-black text-[var(--primary)] font-mono">
                      {superDreamRecord?.overallReadiness ?? selectedCandidate?.readinessIndex ?? 0}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)] font-medium">/ 100</span>
                  </div>
                  <p className="text-[10px] font-bold text-emerald-400 truncate mt-0.5">
                    {superDreamRecord?.tierName || selectedCandidate?.tierName || "Pending Evaluation"}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Master 10-Section Health Matrix Bar */}
          <GlassCard className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
                10-Stage Real-Time Curriculum Completion Matrix
              </h3>
              <span className="text-[11px] text-emerald-400 font-mono font-semibold">
                {sectionScores.filter((s) => s.completed === s.total).length} of 10 Modules 100% Completed
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
              {sectionScores.map((sec) => {
                const Icon = sec.icon;
                const percent = Math.round((sec.completed / sec.total) * 100);
                return (
                  <button
                    key={sec.id}
                    onClick={() => {
                      setViewMode("interactive-panels");
                      setActivePanelSection(sec.id);
                    }}
                    className={`p-3 rounded-2xl border ${sec.borderColor} ${sec.bgColor} text-left transition hover:scale-102 cursor-pointer flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`w-4 h-4 ${sec.color}`} />
                      <span className="text-[10px] font-mono font-bold text-[var(--foreground)]">{percent}%</span>
                    </div>
                    <div className="mt-2">
                      <p className="text-[10px] font-bold text-[var(--foreground)] truncate">{sec.title}</p>
                      <p className="text-[9px] text-[var(--muted-foreground)] font-mono">
                        {sec.completed}/{sec.total} Done
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* View Mode Switcher */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-white/[0.04] p-1.5 rounded-2xl border border-[var(--border)]">
              <button
                onClick={() => setViewMode("interactive-panels")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  viewMode === "interactive-panels"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Section-by-Section Deep Dive</span>
              </button>

              <button
                onClick={() => setViewMode("full-report")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  viewMode === "full-report"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Full 10-Section Comprehensive Dossier</span>
              </button>

              <button
                onClick={() => setViewMode("live-stream")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  viewMode === "live-stream"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Live Audit Stream ({movements.length})</span>
              </button>
            </div>
          </div>

          {/* Render Active View Mode */}
          {viewMode === "interactive-panels" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((secId) => {
                  const Icon = SECTION_ICONS[secId] || Code2;
                  const isActive = activePanelSection === secId;
                  const shortTitles: Record<number, string> = {
                    1: "Languages",
                    2: "CS Core",
                    3: "Coding/DSA",
                    4: "Software Dev",
                    5: "AI & ML",
                    6: "Cloud/DevOps",
                    7: "GitHub",
                    8: "Certifications",
                    9: "Mock Prep",
                    10: "Evaluation",
                  };
                  return (
                    <button
                      key={secId}
                      onClick={() => setActivePanelSection(secId)}
                      className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        isActive
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-md ring-2 ring-indigo-500/20 dark:bg-gradient-to-b dark:from-indigo-500/25 dark:to-purple-500/15 dark:border-indigo-500/50 dark:text-white dark:ring-indigo-500/30"
                          : "bg-[var(--glass-input-bg)] border-[var(--border)] text-slate-600 hover:text-slate-900 dark:text-[var(--muted-foreground)] dark:hover:text-[var(--foreground)] hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600 dark:text-indigo-400" : ""}`} />
                      <span className="text-[10px] font-bold">Sec {secId}</span>
                      <span className="text-[9px] font-medium text-slate-500 dark:text-[var(--muted-foreground)] truncate max-w-[70px]">
                        {shortTitles[secId]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activePanelSection === 1 && renderSection1()}
              {activePanelSection === 2 && renderSection2()}
              {activePanelSection === 3 && renderSection3()}
              {activePanelSection === 4 && renderSection4()}
              {activePanelSection === 5 && renderSection5()}
              {activePanelSection === 6 && renderSection6()}
              {activePanelSection === 7 && renderSection7()}
              {activePanelSection === 8 && renderSection8()}
              {activePanelSection === 9 && renderSection9()}
              {activePanelSection === 10 && renderSection10()}
            </div>
          )}

          {viewMode === "full-report" && (
            <div className="space-y-6">
              {renderSection1()}
              {renderSection2()}
              {renderSection3()}
              {renderSection4()}
              {renderSection5()}
              {renderSection6()}
              {renderSection7()}
              {renderSection8()}
              {renderSection9()}
              {renderSection10()}
            </div>
          )}

          {viewMode === "live-stream" && (
            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    Live Student Movement Stream &amp; Audit Trail
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    Every quiz submission, repository check-in, coding profile telemetry sync, and certification uploaded in real-time.
                  </p>
                </div>
              </div>

              {movements.length === 0 ? (
                <div className="p-12 text-center text-[var(--muted-foreground)] space-y-2 rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)]">
                  <Activity className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-sm font-semibold">No Movements Logged Yet</p>
                  <p className="text-xs">Student activities and live telemetry will stream here automatically.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {movements.map((mov: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[var(--glass-input-bg)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 grid place-items-center shrink-0 mt-0.5">
                          <Terminal className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 uppercase">
                              Sec {mov.sectionId} • {mov.actionType.replace("_", " ")}
                            </span>
                            <h4 className="font-bold text-sm text-[var(--foreground)]">{mov.title}</h4>
                          </div>
                          <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">{mov.details}</p>
                        </div>
                      </div>

                      <span className="text-[11px] text-[var(--muted-foreground)] font-mono shrink-0">
                        {new Date(mov.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          )}
        </div>
      )}

      {/* MODALS */}
      <ExhaustiveTaskBuilderModal
        open={showTaskBuilderModal}
        onClose={() => setShowTaskBuilderModal(false)}
        onSaveTask={() => {
          toast.success("Phased Task Assigned to Student");
          setShowTaskBuilderModal(false);
        }}
      />

      <ExhaustiveCourseCuratorModal
        open={showCourseCuratorModal}
        onClose={() => setShowCourseCuratorModal(false)}
        onSaveCourse={() => {
          toast.success("Course Curated with Cryptographic Verification Policy");
          setShowCourseCuratorModal(false);
        }}
      />

      <ExhaustiveRoadmapBuilderModal
        open={showRoadmapBuilderModal}
        onClose={() => setShowRoadmapBuilderModal(false)}
        onSaveRoadmapModule={() => {
          toast.success("Roadmap Module Added to Cohort");
          setShowRoadmapBuilderModal(false);
        }}
      />

      {/* Extracted Resume Text Modal */}
      {showResumeTextModal && latestResume && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-[var(--card)] border border-slate-200 dark:border-[var(--border)] rounded-3xl p-6 shadow-2xl flex flex-col space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-[var(--foreground)]">
                    Extracted Resume Content
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[var(--muted-foreground)]">
                    {latestResume.filename} • ATS Score: {latestResume.atsScore}%
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowResumeTextModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 text-slate-500 hover:text-slate-900 dark:text-[var(--muted-foreground)] dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-white/5 font-mono text-xs text-slate-800 dark:text-slate-300 whitespace-pre-wrap leading-relaxed select-text">
              {latestResume.extractedText || "No raw text available."}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[var(--border)]">
              <span className="text-xs text-slate-500 dark:text-[var(--muted-foreground)]">
                Parsed on {new Date(latestResume.updatedAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => setShowResumeTextModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── ASSIGN MENTEE TO SUPER DREAM MODAL ───────────────────────── */}
      {showAssignMenteeModal && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Assign Student to Mentee Cohort</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Search and link registered student to your mentee roster</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAssignMenteeModal(false);
                  setAssignStudentInput("");
                  setAssignSearchResults([]);
                }}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 select-text">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Student Name, Email, or Register Number *
                </label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={assignStudentInput}
                    onChange={(e) => handleLiveStudentSearch(e.target.value)}
                    placeholder="Search by name, email, register no..."
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && assignStudentInput.trim()) {
                        assignMenteeMutation.mutate(assignStudentInput.trim());
                      }
                    }}
                  />
                  {isSearchingStudents && (
                    <Loader2 className="h-4 w-4 absolute right-3 top-3 animate-spin text-indigo-600" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  Search across registered students to add to your Super Dream and mentee management.
                </span>
              </div>

              {/* Live Search Suggestions */}
              {assignSearchResults.length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold px-2 py-1 uppercase">
                    Matching Students ({assignSearchResults.length})
                  </p>
                  {assignSearchResults.map((s) => (
                    <div
                      key={s._id}
                      onClick={() => {
                        if (!s.isMyMentee) {
                          assignMenteeMutation.mutate(s.email || s._id);
                        }
                      }}
                      className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition ${
                        s.isMyMentee ? "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20" : "hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 grid place-items-center font-bold shrink-0">
                          {s.name ? s.name.charAt(0).toUpperCase() : "S"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{s.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{s.email}</p>
                        </div>
                      </div>
                      {s.isMyMentee ? (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="h-3 w-3" /> Assigned
                        </span>
                      ) : (
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold shrink-0">Click to Assign +</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  setShowAssignMenteeModal(false);
                  setAssignStudentInput("");
                  setAssignSearchResults([]);
                }}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={!assignStudentInput.trim() || assignMenteeMutation.isPending}
                onClick={() => assignMenteeMutation.mutate(assignStudentInput.trim())}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-2 rounded-xl text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                {assignMenteeMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Assigning...
                  </>
                ) : (
                  "Confirm Assignment"
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
