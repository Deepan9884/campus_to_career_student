import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  Trash2,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Link as LinkIcon,
  BookOpen,
  Code2,
  HelpCircle,
  Search,
  Check,
  Award,
  Shield,
  Eye,
  Terminal,
  Loader2,
  Cpu,
  Users,
  Building2,
  Zap,
  Sliders,
  Settings2,
  ListOrdered,
  Flame,
  ArrowRight,
  Image as ImageIcon,
  Calendar,
  Timer,
  Lock,
  Upload,
  FileUp,
  FileText,
  Copy,
  FileCheck2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  createAdminExam,
  parseCodingLink,
  generateAiMcqs,
  generateAiCoding,
  extractQuestionsFromFile,
  extractQuestionsFromText,
  getStudentsList,
  getBatches,
  getBatchDetail,
  createBatch,
  updateBatch,
  deleteBatch,
  type ExamItem,
  type ExamSectionData,
  type McqQuestionData,
  type CodingQuestionData,
  type StudentSummary,
  type StudentBatch,
} from "../../lib/admin-api";
import { QuestionPaperPreviewModal } from "./QuestionPaperPreviewModal";
import { formatMathText } from "../../lib/formatMathText";

interface CreateExamModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (exam: ExamItem) => void;
}

const COMMON_TOPICS = [
  "Data Structures & Algorithms",
  "Arrays & Strings",
  "Trees & Graphs",
  "Dynamic Programming",
  "Database Management Systems (DBMS)",
  "SQL Queries & Optimization",
  "Operating Systems",
  "Computer Networks",
  "Object Oriented Programming (OOP)",
  "Python Programming",
  "Java Core & JVM",
  "C++ Standard Library",
  "JavaScript & Web Architecture",
  "System Design & Scalability",
  "Quantitative Aptitude",
];

const SAMPLE_QUESTION_PAPER_FORMAT = `1. What is the primary purpose of the Virtual DOM in React?
   A. To directly manipulate the browser DOM faster
   B. To maintain an in-memory UI representation and calculate minimal DOM updates
   C. To store database records in browser storage
   D. To compile TypeScript code into WebAssembly
   Answer: B
   Explanation: React uses the Virtual DOM and reconciliation diffing algorithm to minimize costly direct DOM manipulations.
   Difficulty: Medium
   Topic: React & Frontend

2. Which HTTP status code indicates a successful resource creation via POST?
   A. 200 OK
   B. 201 Created
   C. 204 No Content
   D. 301 Moved Permanently
   Ans: B
   Explanation: HTTP 201 Created signifies that the request succeeded and resulted in a new resource creation.
   Difficulty: Easy
   Topic: Web & REST API

3. What mechanism protects web applications from Cross-Site Request Forgery (CSRF)?
   A. Anti-CSRF Synchronizer Tokens and SameSite Cookies
   B. CSS Minification
   C. Disabling browser localStorage
   D. DNS Prefetching
   Answer: A
   Explanation: CSRF tokens ensure that state-changing requests originate from an authenticated, trusted user interface.
   Difficulty: Hard
   Topic: Web Security`;

export function CreateExamModal({ open, onClose, onSuccess }: CreateExamModalProps) {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // ── STEP 1: EXAM TYPE ──────────────────────────────────────────────────────
  const [examType, setExamType] = useState<"mcq" | "coding" | "mixed">("mcq");

  // ── STEP 2: EXAM OVERVIEW & SECTION ARCHITECTURE ───────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Placement Assessment");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard" | "FAANG Tier" | "Mixed">("Medium");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passingScorePercentage, setPassingScorePercentage] = useState(60);

  // Section configurations
  const [sections, setSections] = useState<ExamSectionData[]>([
    {
      sectionId: "sec-1",
      title: "Section 1: Core Fundamentals & MCQs",
      type: "mcq",
      difficulty: "medium",
      topics: [],
      timeLimitMinutes: 30,
      targetQuestionCount: 5,
      mcqQuestions: [],
      codingQuestions: [],
    },
  ]);

  const sectionCount = sections.length;

  // ── STEP 3: QUESTION SOURCING & LINK PARSER ────────────────────────────────
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [linkInput, setLinkInput] = useState("");
  const [slotLinkInputs, setSlotLinkInputs] = useState<Record<string, string>>({});
  const [parsingSlotKey, setParsingSlotKey] = useState<string | null>(null);
  const [generatingSlotKey, setGeneratingSlotKey] = useState<string | null>(null);
  const [isParsingLink, setIsParsingLink] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [customTopicInput, setCustomTopicInput] = useState("");
  const [isTopicsDropdownOpen, setIsTopicsDropdownOpen] = useState(false);
  const [topicSearchQuery, setTopicSearchQuery] = useState("");
  const topicsDropdownRef = useRef<HTMLDivElement>(null);

  // Close topic dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (topicsDropdownRef.current && !topicsDropdownRef.current.contains(e.target as Node)) {
        setIsTopicsDropdownOpen(false);
      }
    };
    if (isTopicsDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTopicsDropdownOpen]);

  // Manual MCQ builder inline state
  const [showManualMcqModal, setShowManualMcqModal] = useState(false);
  const [manualQuestion, setManualQuestion] = useState("");
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [manualOptions, setManualOptions] = useState<string[]>(["", "", "", ""]);
  const [manualCorrectIdx, setManualCorrectIdx] = useState(0);
  const [manualMarks, setManualMarks] = useState(2);
  const [manualExplanation, setManualExplanation] = useState("");

  // Document & PDF Question Extractor state
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [docUploadTab, setDocUploadTab] = useState<"file" | "text">("file");
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const [pastedDocText, setPastedDocText] = useState("");
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);
  const [extractedDocResult, setExtractedDocResult] = useState<McqQuestionData[]>([]);
  const [showDocFormatGuide, setShowDocFormatGuide] = useState(false);
  const [isDragOverDoc, setIsDragOverDoc] = useState(false);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // ── STEP 4: TARGET AUDIENCE, PROCTORING & SCHEDULING ───────────────────────
  const [targetAudience, setTargetAudience] = useState<"all" | "mentees" | "selected" | "batch">("all");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentsRoster, setStudentsRoster] = useState<StudentSummary[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);

  // ── Saved reusable batches ────────────────────────────────────────────────
  const [batches, setBatches] = useState<StudentBatch[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [newBatchName, setNewBatchName] = useState("");
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  const refreshBatches = async () => {
    setIsLoadingBatches(true);
    try {
      const res = await getBatches();
      setBatches(res.batches || []);
    } catch (err) {
      console.error("Failed to load batches:", err);
    } finally {
      setIsLoadingBatches(false);
    }
  };

  const handlePickBatch = async (batchId: string) => {
    setSelectedBatchId(batchId);
    try {
      const res = await getBatchDetail(batchId);
      const ids = (res.batch.studentIds || []).map((id) => String(id));
      setSelectedStudentIds(ids);
      setBatches((prev) =>
        prev.map((b) => (b._id === batchId ? { ...b, studentIds: ids, studentCount: ids.length } : b))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to load batch members");
    }
  };

  const handleSaveBatch = async () => {
    const name = newBatchName.trim();
    if (!name) {
      toast.error("Give the batch a name first (e.g. CSE 2026-A)");
      return;
    }
    if (selectedStudentIds.length === 0) {
      toast.error("Select at least 1 student to save a batch");
      return;
    }
    setIsSavingBatch(true);
    try {
      const res = await createBatch({ name, studentIds: selectedStudentIds });
      setBatches((prev) => [{ ...res.batch, studentCount: res.batch.studentIds.length }, ...prev]);
      setSelectedBatchId(res.batch._id);
      setNewBatchName("");
      toast.success(`Batch "${res.batch.name}" saved — reuse it in any future assessment`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save batch");
    } finally {
      setIsSavingBatch(false);
    }
  };

  const handleUpdateBatch = async () => {
    if (!selectedBatchId) return;
    if (selectedStudentIds.length === 0) {
      toast.error("A batch must contain at least 1 student");
      return;
    }
    setIsSavingBatch(true);
    try {
      const res = await updateBatch(selectedBatchId, { studentIds: selectedStudentIds });
      setBatches((prev) =>
        prev.map((b) =>
          b._id === selectedBatchId
            ? { ...b, studentIds: res.batch.studentIds, studentCount: res.batch.studentIds.length }
            : b
        )
      );
      toast.success(`Batch "${res.batch.name}" updated`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update batch");
    } finally {
      setIsSavingBatch(false);
    }
  };

  const handleDeleteBatch = async (batchId: string, batchName: string) => {
    if (!window.confirm(`Delete saved batch "${batchName}"? Published exams keep their students.`)) return;
    try {
      await deleteBatch(batchId);
      setBatches((prev) => prev.filter((b) => b._id !== batchId));
      if (selectedBatchId === batchId) setSelectedBatchId(null);
      toast.success("Batch deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete batch");
    }
  };

  const selectedBatch = batches.find((b) => b._id === selectedBatchId) || null;
  const batchDirty =
    !!selectedBatch &&
    (selectedBatch.studentIds.length !== selectedStudentIds.length ||
      selectedBatch.studentIds.some((id) => !selectedStudentIds.includes(String(id))));

  // Scheduling Configuration
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledStartTime, setScheduledStartTime] = useState("");
  const [scheduledEndTime, setScheduledEndTime] = useState("");
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);

  // Helper to calculate or update scheduledEndTime based on preset
  const applyWindowPreset = (presetHours: number | "same" | "allDay") => {
    if (!scheduledStartTime) {
      toast.info("Please set the Start Date & Time first");
      return;
    }
    const start = new Date(scheduledStartTime);
    if (isNaN(start.getTime())) return;

    let end = new Date(start);
    if (presetHours === "same") {
      end = new Date(start.getTime() + (Number(durationMinutes) || 60) * 60 * 1000);
    } else if (presetHours === "allDay") {
      end.setHours(23, 59, 0, 0);
    } else {
      end = new Date(start.getTime() + presetHours * 60 * 60 * 1000);
    }

    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = end.getFullYear();
    const month = pad(end.getMonth() + 1);
    const day = pad(end.getDate());
    const hours = pad(end.getHours());
    const minutes = pad(end.getMinutes());
    setScheduledEndTime(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  // Proctoring Settings
  const [webcamRequired, setWebcamRequired] = useState(false);
  const [fullscreenEnforced, setFullscreenEnforced] = useState(true);
  const [tabSwitchLimit, setTabSwitchLimit] = useState(3);
  const [aiFaceDetection, setAiFaceDetection] = useState(false);
  const [copyPasteDisabled, setCopyPasteDisabled] = useState(false);
  const [allowRetakes, setAllowRetakes] = useState(false);

  // Success & Preview States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreviewPaperModal, setShowPreviewPaperModal] = useState(false);
  const [createdExamRecord, setCreatedExamRecord] = useState<ExamItem | null>(null);

  // Fetch student roster when target audience needs manual picking
  useEffect(() => {
    if ((targetAudience === "selected" || targetAudience === "batch") && studentsRoster.length === 0) {
      setIsLoadingRoster(true);
      getStudentsList(1, "", "all", 1000)
        .then((res) => {
          setStudentsRoster(res.students || []);
        })
        .catch((err) => {
          console.error("Failed to load roster:", err);
        })
        .finally(() => {
          setIsLoadingRoster(false);
        });
    }
    if ((targetAudience === "selected" || targetAudience === "batch") && batches.length === 0 && !isLoadingBatches) {
      refreshBatches();
    }
  }, [targetAudience]);

  // Adjust initial sections when examType changes
  const handleSelectExamType = (type: "mcq" | "coding" | "mixed") => {
    setExamType(type);
    if (type === "mcq") {
      setSections([
        {
          sectionId: "sec-1",
          title: "Section 1: Conceptual & Technical MCQs",
          type: "mcq",
          difficulty: "medium",
          topics: [],
          timeLimitMinutes: 30,
          targetQuestionCount: 5,
          mcqQuestions: [],
          codingQuestions: [],
        },
      ]);
    } else if (type === "coding") {
      setSections([
        {
          sectionId: "sec-1",
          title: "Section 1: Hands-on Coding Arena",
          type: "coding",
          difficulty: "medium",
          topics: [],
          timeLimitMinutes: 60,
          targetQuestionCount: 2,
          mcqQuestions: [],
          codingQuestions: [],
        },
      ]);
    } else {
      // Mixed
      const half = Math.floor((durationMinutes || 60) / 2);
      const rem = (durationMinutes || 60) - half;
      setSections([
        {
          sectionId: "sec-1",
          title: "Section 1: Foundational MCQs",
          type: "mcq",
          difficulty: "medium",
          topics: [],
          timeLimitMinutes: half,
          targetQuestionCount: 5,
          mcqQuestions: [],
          codingQuestions: [],
        },
        {
          sectionId: "sec-2",
          title: "Section 2: Algorithmic Problem Solving",
          type: "coding",
          difficulty: "hard",
          topics: [],
          timeLimitMinutes: rem,
          targetQuestionCount: 2,
          mcqQuestions: [],
          codingQuestions: [],
        },
      ]);
    }
    setActiveStep(2);
  };

  // 1-Click Auto-Distribute Total Duration Evenly Across All Sections
  const handleAutoDistributeTime = () => {
    const total = Math.max(5, Number(durationMinutes) || 60);
    const count = sections.length;
    if (count === 0) return;
    const base = Math.floor(total / count);
    const remainder = total % count;
    const updated = sections.map((sec, i) => ({
      ...sec,
      timeLimitMinutes: Math.max(1, base + (i < remainder ? 1 : 0)),
    }));
    setSections(updated);
    toast.success(`Distributed ${total} mins evenly across ${count} sections!`);
  };

  // Handle Duration Change and Auto-Sync Section Times
  const handleDurationChange = (newDuration: number) => {
    const validDuration = Math.max(5, Math.min(600, newDuration || 5));
    setDurationMinutes(validDuration);
    if (sections.length > 0) {
      const base = Math.floor(validDuration / sections.length);
      const remainder = validDuration % sections.length;
      const updated = sections.map((sec, i) => ({
        ...sec,
        timeLimitMinutes: Math.max(1, base + (i < remainder ? 1 : 0)),
      }));
      setSections(updated);
    }
  };

  // Set number of sections directly and re-distribute durationMinutes evenly
  const handleSetSectionCount = (targetCount: number) => {
    if (targetCount < 1) return;
    if (targetCount > 8) {
      toast.error("Maximum 8 sections per examination");
      return;
    }

    if (targetCount === sections.length) return;

    const totalTime = Math.max(5, Number(durationMinutes) || 60);
    const baseTime = Math.floor(totalTime / targetCount);
    const remainderTime = totalTime % targetCount;

    let nextSections: ExamSectionData[] = [];
    if (targetCount > sections.length) {
      nextSections = [...sections];
      for (let i = sections.length + 1; i <= targetCount; i++) {
        const defaultType = examType === "coding" ? "coding" : "mcq";
        nextSections.push({
          sectionId: `sec-${i}-${Date.now()}`,
          title: `Section ${i}: ${defaultType === "mcq" ? "MCQ Diagnostic" : "Coding Challenge"}`,
          type: defaultType,
          difficulty: "medium",
          topics: [],
          timeLimitMinutes: baseTime,
          targetQuestionCount: defaultType === "mcq" ? 5 : 2,
          mcqQuestions: [],
          codingQuestions: [],
        });
      }
    } else {
      nextSections = sections.slice(0, targetCount);
      if (activeSectionIdx >= targetCount) {
        setActiveSectionIdx(targetCount - 1);
      }
    }

    // Distribute exact total duration across all sections
    nextSections = nextSections.map((sec, idx) => ({
      ...sec,
      timeLimitMinutes: Math.max(1, baseTime + (idx < remainderTime ? 1 : 0)),
    }));

    setSections(nextSections);
  };

  // Section Topic toggle
  const handleToggleTopic = (secIdx: number, topic: string) => {
    const updated = [...sections];
    const curTopics = updated[secIdx].topics || [];
    if (curTopics.includes(topic)) {
      updated[secIdx].topics = curTopics.filter((t) => t !== topic);
    } else {
      updated[secIdx].topics = [...curTopics, topic];
    }
    setSections(updated);
  };

  // Custom Topic add
  const handleAddCustomTopic = (secIdx: number) => {
    const trimmed = customTopicInput.trim();
    if (!trimmed) return;
    const updated = [...sections];
    const curTopics = updated[secIdx].topics || [];
    if (!curTopics.includes(trimmed)) {
      updated[secIdx].topics = [...curTopics, trimmed];
      setSections(updated);
      toast.success(`Added topic: "${trimmed}"`);
    }
    setCustomTopicInput("");
  };

  // ── STRICT STEP PROGRESSION VALIDATOR ──────────────────────────────────────
  const validateStep = (fromStep: number): boolean => {
    if (fromStep === 1) {
      if (!examType) {
        toast.error("Please select an Exam Type to proceed.");
        return false;
      }
      return true;
    }
    if (fromStep === 2) {
      if (!title.trim() || title.trim().length < 3) {
        toast.error("Please provide an Exam Title (at least 3 characters).");
        return false;
      }
      if (!durationMinutes || durationMinutes < 5) {
        toast.error("Duration must be at least 5 minutes.");
        return false;
      }
      if (sections.length === 0) {
        toast.error("Please configure at least 1 section.");
        return false;
      }
      for (let i = 0; i < sections.length; i++) {
        if (!sections[i].title.trim()) {
          toast.error(`Section ${i + 1} must have a valid title.`);
          return false;
        }
      }

      // Strict Time Duration Validation
      const totalSectionMinutes = sections.reduce(
        (sum, s) => sum + (Number(s.timeLimitMinutes) || 0),
        0
      );
      if (totalSectionMinutes > Number(durationMinutes)) {
        toast.error(
          `Total section time limits (${totalSectionMinutes} mins) cannot exceed the overall exam duration (${durationMinutes} mins). Please adjust section times.`
        );
        return false;
      }
      if (totalSectionMinutes < Number(durationMinutes)) {
        const diff = Number(durationMinutes) - totalSectionMinutes;
        toast.info(
          `Allocated the remaining ${diff} mins across sections to match the ${durationMinutes} mins exam duration.`
        );
        const base = Math.floor(Number(durationMinutes) / sections.length);
        const rem = Number(durationMinutes) % sections.length;
        const rebalanced = sections.map((sec, idx) => ({
          ...sec,
          timeLimitMinutes: Math.max(1, base + (idx < rem ? 1 : 0)),
        }));
        setSections(rebalanced);
      }
      return true;
    }
    if (fromStep === 3) {
      if (isGeneratingAi || isParsingLink || parsingSlotKey || generatingSlotKey) {
        toast.error("Please wait for AI generation / link parsing to complete before proceeding.");
        return false;
      }
      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        if (sec.type === "mcq" && (!sec.mcqQuestions || sec.mcqQuestions.length === 0)) {
          toast.error(`Section ${i + 1} ("${sec.title}") has no MCQ questions. Please click "Fetch Questions via AI" or author questions before proceeding.`);
          setActiveSectionIdx(i);
          return false;
        }
        if (sec.type === "coding" && (!sec.codingQuestions || sec.codingQuestions.length === 0)) {
          toast.error(`Section ${i + 1} ("${sec.title}") has no coding challenges. Please import a link or generate questions before proceeding.`);
          setActiveSectionIdx(i);
          return false;
        }
      }
      return true;
    }
    if (fromStep === 4) {
      if (targetAudience === "selected" && selectedStudentIds.length === 0) {
        toast.error("Please select at least 1 student or choose 'All Students'.");
        return false;
      }
      if (targetAudience === "batch" && (!selectedBatchId || selectedStudentIds.length === 0)) {
        toast.error("Please pick a saved batch (or save the current selection as a batch).");
        return false;
      }
      if (isScheduled) {
        if (!scheduledStartTime) {
          toast.error("Please select a Scheduled Start Date & Time.");
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const handleStepClick = (targetStep: number) => {
    if (isGeneratingAi) {
      toast.error("AI question generation is in progress. Please wait until questions are generated.");
      return;
    }
    if (targetStep > activeStep) {
      for (let s = activeStep; s < targetStep; s++) {
        if (!validateStep(s)) return;
      }
    }
    setActiveStep(targetStep as any);
  };

  const handleNextStep = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => Math.min(5, prev + 1) as any);
    }
  };

  const handleSwitchSection = (newIdx: number) => {
    if (isGeneratingAi) {
      toast.error("AI question generation is in progress. Please wait.");
      return;
    }
    const current = sections[activeSectionIdx];
    if (current.type === "mcq" && current.mcqQuestions.length === 0) {
      toast.info(`Note: ${current.title} currently has no questions generated.`);
    }
    setActiveSectionIdx(newIdx);
  };

  // ── AI MCQ GENERATOR ──────────────────────────────────────────────────────
  const handleGenerateAiMcqsForSection = async (secIdx: number) => {
    const sec = sections[secIdx];
    setIsGeneratingAi(true);
    const count = sec.targetQuestionCount || 5;

    try {
      toast.loading(`AI Examiner is generating ${count} ${sec.difficulty} MCQs...`, { id: "ai-mcq-gen" });
      const topicPayload =
        sec.topics.length > 0
          ? sec.topics
          : sec.title && sec.title.trim()
          ? [sec.title.trim()]
          : ["General Computer Science & Programming"];

      const generated = await generateAiMcqs(
        topicPayload,
        sec.difficulty as any,
        count
      );

      const sanitized = generated.map((q) => ({
        ...q,
        question: formatMathText(q.question),
        options: (q.options || []).map((o) => formatMathText(o)),
        correctAnswer: formatMathText(q.correctAnswer),
        explanation: formatMathText(q.explanation),
      }));

      const updated = [...sections];
      updated[secIdx].mcqQuestions = sanitized;
      setSections(updated);
      toast.success(`Generated ${generated.length} MCQs for "${sec.title}"! Review questions below.`, { id: "ai-mcq-gen" });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate AI MCQs", { id: "ai-mcq-gen" });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // ── EXTRACT QUESTIONS FROM PDF / DOC / TEXT ────────────────────────────────
  const handleExtractFromDoc = async () => {
    const sec = sections[activeSectionIdx];
    const targetTopic =
      sec.topics.length > 0
        ? sec.topics.join(", ")
        : sec.title && sec.title.trim()
        ? sec.title.trim()
        : "General Technical Aptitude";
    const targetDifficulty = sec.difficulty || "medium";

    setIsExtractingDoc(true);
    setExtractedDocResult([]);

    try {
      let resData: { totalExtracted: number; fileName?: string; questions: McqQuestionData[] };
      if (docUploadTab === "file") {
        if (!selectedDocFile) {
          toast.error("Please choose a .pdf, .docx, or .txt file first.");
          setIsExtractingDoc(false);
          return;
        }
        toast.loading(`Extracting questions from ${selectedDocFile.name}...`, { id: "doc-extract" });
        resData = await extractQuestionsFromFile(
          selectedDocFile,
          sec.type,
          targetTopic,
          targetDifficulty
        );
      } else {
        if (!pastedDocText.trim() || pastedDocText.trim().length < 20) {
          toast.error("Please paste question text (at least 20 characters).");
          setIsExtractingDoc(false);
          return;
        }
        toast.loading("Analyzing and extracting questions from text...", { id: "doc-extract" });
        resData = await extractQuestionsFromText(
          pastedDocText,
          sec.type,
          targetTopic,
          targetDifficulty
        );
      }

      if (resData.questions && resData.questions.length > 0) {
        const sanitized = resData.questions.map((q: any) => ({
          ...q,
          question: formatMathText(q.question),
          options: (q.options || []).map((o: string) => formatMathText(o)),
          correctAnswer: formatMathText(q.correctAnswer),
          explanation: formatMathText(q.explanation),
        }));
        setExtractedDocResult(sanitized);
        toast.success(`Successfully extracted ${resData.questions.length} questions! Review and apply below.`, { id: "doc-extract" });
      } else {
        toast.error("No questions could be extracted. Please check the document format.", { id: "doc-extract" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to extract questions from document", { id: "doc-extract" });
    } finally {
      setIsExtractingDoc(false);
    }
  };

  const handleApplyExtractedDocQuestions = (mode: "append" | "replace") => {
    if (extractedDocResult.length === 0) return;
    const updated = [...sections];
    if (mode === "replace") {
      updated[activeSectionIdx].mcqQuestions = [...extractedDocResult];
      toast.success(`Replaced section questions with ${extractedDocResult.length} extracted questions!`);
    } else {
      updated[activeSectionIdx].mcqQuestions = [
        ...(updated[activeSectionIdx].mcqQuestions || []),
        ...extractedDocResult,
      ];
      toast.success(`Added ${extractedDocResult.length} questions to "${currentSec.title}"!`);
    }
    setSections(updated);
    setShowDocUploadModal(false);
    setExtractedDocResult([]);
    setSelectedDocFile(null);
    setPastedDocText("");
  };

  // ── PARSE LINK FOR A SPECIFIC QUESTION SLOT ─────────────────────────────
  const handleParseCodingLinkForSlot = async (secIdx: number, slotIdx: number) => {
    const key = `${secIdx}-${slotIdx}`;
    const url = (slotLinkInputs[key] || "").trim();
    if (!url) {
      toast.error(`Please paste a HackerRank or LeetCode link for Challenge #${slotIdx + 1}`);
      return;
    }

    setParsingSlotKey(key);
    try {
      const parsedProblem = await parseCodingLink(url);
      
      const diffMap: Record<string, string> = {
        easy: "Easy",
        medium: "Medium",
        hard: "Hard",
        faang: "FAANG Tier"
      };

      const sanitizedProblem = {
        ...parsedProblem,
        difficulty: diffMap[parsedProblem.difficulty?.toLowerCase() || ""] || "Medium",
        title: formatMathText(parsedProblem.title || ""),
        problemStatement: formatMathText(parsedProblem.problemStatement || ""),
        constraints: Array.isArray(parsedProblem.constraints)
          ? parsedProblem.constraints.map((c: string) => formatMathText(c))
          : parsedProblem.constraints,
      };

      const updated = [...sections];
      const currentQuestions = [...(updated[secIdx].codingQuestions || [])];

      if (slotIdx < currentQuestions.length) {
        currentQuestions[slotIdx] = sanitizedProblem;
      } else {
        currentQuestions.push(sanitizedProblem);
      }

      updated[secIdx].codingQuestions = currentQuestions;
      setSections(updated);
      toast.success(`Challenge #${slotIdx + 1} imported: "${sanitizedProblem.title}" with test cases!`);
    } catch (err: any) {
      toast.error(err.message || `Failed to parse link for Challenge #${slotIdx + 1}`);
    } finally {
      setParsingSlotKey(null);
    }
  };

  // ── GENERATE AI CODING FOR A SPECIFIC QUESTION SLOT ─────────────────────
  const handleGenerateAiCodingForSlot = async (secIdx: number, slotIdx: number) => {
    const key = `${secIdx}-${slotIdx}`;
    const sec = sections[secIdx];
    setGeneratingSlotKey(key);
    try {
      const topic = sec.topics.length > slotIdx ? sec.topics[slotIdx] : sec.topics[0] || "Algorithms";
      const diffMap: Record<string, string> = {
        easy: "Easy",
        medium: "Medium",
        hard: "Hard",
        faang: "FAANG Tier"
      };
      const requestedDiff = diffMap[sec.difficulty?.toLowerCase() || "medium"] || "Medium";
      const generated = await generateAiCoding(topic, requestedDiff);
      const sanitizedGenerated = {
        ...generated,
        difficulty: diffMap[generated.difficulty?.toLowerCase() || ""] || requestedDiff,
        title: formatMathText(generated.title || ""),
        problemStatement: formatMathText(generated.problemStatement || ""),
        constraints: Array.isArray(generated.constraints)
          ? generated.constraints.map((c: string) => formatMathText(c))
          : generated.constraints,
      };

      const updated = [...sections];
      const currentQuestions = [...(updated[secIdx].codingQuestions || [])];

      if (slotIdx < currentQuestions.length) {
        currentQuestions[slotIdx] = sanitizedGenerated;
      } else {
        currentQuestions.push(sanitizedGenerated);
      }

      updated[secIdx].codingQuestions = currentQuestions;
      setSections(updated);
      toast.success(`Generated Challenge #${slotIdx + 1}: "${sanitizedGenerated.title}"!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate AI coding challenge");
    } finally {
      setGeneratingSlotKey(null);
    }
  };

  // ── REMOVE OR CLEAR A SPECIFIC QUESTION SLOT ────────────────────────────
  const handleRemoveCodingSlot = (secIdx: number, slotIdx: number) => {
    const updated = [...sections];
    updated[secIdx].codingQuestions = updated[secIdx].codingQuestions.filter((_, i) => i !== slotIdx);
    setSections(updated);
    toast.info(`Challenge #${slotIdx + 1} removed`);
  };

  // ── ADD AN EXTRA QUESTION SLOT ──────────────────────────────────────────
  const handleAddExtraQuestionSlot = (secIdx: number) => {
    const updated = [...sections];
    const currentTarget = updated[secIdx].targetQuestionCount || 1;
    updated[secIdx].targetQuestionCount = Math.max(currentTarget + 1, (updated[secIdx].codingQuestions?.length || 0) + 1);
    setSections(updated);
    toast.success(`Added Challenge #${updated[secIdx].targetQuestionCount} slot to ${updated[secIdx].title}`);
  };

  // ── ADD MANUAL MCQ ────────────────────────────────────────────────────────
  const handleSaveManualMcq = (secIdx: number) => {
    if (!manualQuestion.trim()) {
      toast.error("Question prompt is required");
      return;
    }
    if (manualOptions.some((opt) => !opt.trim())) {
      toast.error("All 4 options must be filled");
      return;
    }

    const newMcq: McqQuestionData = {
      questionId: `mcq-manual-${Date.now()}`,
      question: manualQuestion.trim(),
      options: manualOptions.map((o) => o.trim()),
      correctOptionIndex: manualCorrectIdx,
      correctAnswer: manualOptions[manualCorrectIdx].trim(),
      positiveMarks: Number(manualMarks) || 2,
      negativeMarks: Number(manualMarks) * 0.25,
      explanation: manualExplanation.trim() || "Correct answer as configured by faculty.",
      topic: sections[secIdx].topics[0] || "General",
      difficulty: sections[secIdx].difficulty as any,
      imageUrl: manualImageUrl.trim(),
      diagramUrl: manualImageUrl.trim(),
    };

    const updated = [...sections];
    updated[secIdx].mcqQuestions = [...updated[secIdx].mcqQuestions, newMcq];
    setSections(updated);

    // Reset
    setManualQuestion("");
    setManualImageUrl("");
    setManualOptions(["", "", "", ""]);
    setManualCorrectIdx(0);
    setManualExplanation("");
    setShowManualMcqModal(false);
    toast.success("Manual question added to section");
  };

  // Construct preview exam object
  const previewExamObject: ExamItem = {
    _id: "preview-temp-id",
    title: title.trim() || "Placement Assessment",
    description: description.trim() || "Proctored Institutional Examination",
    examType,
    category,
    difficulty,
    durationMinutes: Number(durationMinutes) || 60,
    passingScorePercentage: Number(passingScorePercentage) || 60,
    totalMarks: sections.reduce((acc, s) => {
      if (s.type === "mcq") {
        return acc + s.mcqQuestions.reduce((qAcc, q) => qAcc + (Number(q.positiveMarks) || 1), 0);
      }
      return acc + s.codingQuestions.reduce((cAcc, c) => cAcc + (Number(c.marks) || 10), 0);
    }, 0) || 100,
    targetAudience,
    batchId: targetAudience === "batch" ? selectedBatchId : null,
    batchName: targetAudience === "batch" ? selectedBatch?.name || "" : "",
    sections,
    proctoringConfig: {
      webcamRequired,
      fullscreenEnforced,
      tabSwitchLimit,
      aiFaceDetection,
      copyPasteDisabled,
    },
    isResultDisclosed: false,
    allowRetakes,
    isPublished: true,
    isScheduled,
    scheduledStartTime: isScheduled && scheduledStartTime ? scheduledStartTime : null,
    scheduledEndTime: isScheduled && scheduledStartTime
      ? scheduledEndTime
        ? scheduledEndTime
        : new Date(new Date(scheduledStartTime).getTime() + Number(durationMinutes) * 60 * 1000).toISOString()
      : null,
    status: isScheduled && scheduledStartTime && new Date(scheduledStartTime) > new Date() ? "scheduled" : "active",
    createdAt: new Date().toISOString(),
  };

  // ── VALIDATE AND SUBMIT FINAL EXAM ────────────────────────────────────────
  const handleSubmitExam = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const computedEndTime = isScheduled && scheduledStartTime
        ? scheduledEndTime
          ? new Date(scheduledEndTime).toISOString()
          : new Date(new Date(scheduledStartTime).getTime() + Number(durationMinutes) * 60 * 1000).toISOString()
        : null;

      const payload: Partial<ExamItem> = {
        title: title.trim(),
        description: description.trim(),
        examType,
        category,
        difficulty,
        durationMinutes: Number(durationMinutes) || 60,
        passingScorePercentage: Number(passingScorePercentage) || 60,
        targetAudience,
        assignedStudents: targetAudience === "selected" || targetAudience === "batch" ? (selectedStudentIds as any) : [],
        batchId: targetAudience === "batch" ? selectedBatchId : null,
        sections,
        proctoringConfig: {
          webcamRequired,
          fullscreenEnforced,
          tabSwitchLimit,
          aiFaceDetection,
          copyPasteDisabled,
        },
        isResultDisclosed: false,
        allowRetakes,
        isPublished: true,
        isScheduled: Boolean(isScheduled && scheduledStartTime),
        scheduledStartTime: isScheduled && scheduledStartTime ? scheduledStartTime : null,
        scheduledEndTime: computedEndTime,
      };

      const created = await createAdminExam(payload);
      toast.success(
        isScheduled
          ? "Exam scheduled and published successfully!"
          : "Exam authored and published successfully!"
      );
      setCreatedExamRecord(created);
      onSuccess(created);
    } catch (err: any) {
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const msg = err.errors.map((e: any) => `${e.field}: ${e.message}`).join("\n");
        toast.error(`Validation Failed:\n${msg}`);
        console.error("Validation errors:", err.errors);
      } else {
        toast.error(err.message || "Failed to create exam");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  const currentSec = sections[activeSectionIdx] || sections[0];
  const totalAllocatedMinutes = sections.reduce(
    (sum, s) => sum + (Number(s.timeLimitMinutes) || 0),
    0
  );

  return createPortal(
    <>
      <div className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none overflow-y-auto">
        <div className="max-w-4xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto text-slate-900 dark:text-slate-100 backdrop-blur-2xl transition-colors">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/80">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <FileCode className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Create Proctored Assessment</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Strict section gating, AI question synthesis, scheduling, and question preview
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Step Indicator Bar with Strict Progression Locks */}
          <div className="px-6 py-3 bg-slate-50/70 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs overflow-x-auto gap-2">
            {[
              { num: 1, label: "1. Exam Type" },
              { num: 2, label: "2. Sections & Topics" },
              { num: 3, label: "3. Sourcing & Links" },
              { num: 4, label: "4. Schedule & Rules" },
              { num: 5, label: "5. Review & Publish" },
            ].map((s) => {
              const isCurrent = activeStep === s.num;
              const isPast = activeStep > s.num;
              return (
                <button
                  key={s.num}
                  onClick={() => handleStepClick(s.num)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                    isCurrent
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : isPast
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
                      : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200 dark:text-slate-400 dark:hover:text-white dark:bg-slate-900 dark:border-slate-800/80"
                  }`}
                >
                  <span>{s.label}</span>
                  {isPast && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                  {!isPast && !isCurrent && <Lock className="h-3 w-3 text-slate-400 dark:text-slate-500" />}
                </button>
              );
            })}
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* ══════════════════════════════════════════════════════════════════
                SUCCESS OVERLAY (AFTER PUBLISHING)
                ══════════════════════════════════════════════════════════════════ */}
            {createdExamRecord ? (
              <div className="p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
                <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center bg-emerald-50 border-2 border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-xl shadow-emerald-500/10">
                  <CheckCircle2 className="h-10 w-10 animate-bounce" />
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
                    Assessment Published
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">{createdExamRecord.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    {createdExamRecord.isScheduled
                      ? `Scheduled to unlock for candidates on ${new Date(
                          createdExamRecord.scheduledStartTime!
                        ).toLocaleString()}`
                      : "Live and active immediately for enrolled students in the Test Arena."}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                  <button
                    onClick={() => setShowPreviewPaperModal(true)}
                    className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>View Question Paper</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                  >
                    Back to Assessments Console
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* ══════════════════════════════════════════════════════════════════
                    STEP 1: SELECT EXAM TYPE (MCQ / CODING / BOTH)
                    ══════════════════════════════════════════════════════════════════ */}
                {activeStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Choose Exam Type</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Select the core examination architecture to configure sections and sourcing
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 1. MCQs */}
                      <div
                        onClick={() => handleSelectExamType("mcq")}
                        className={`p-6 rounded-3xl border transition-all cursor-pointer space-y-3 relative ${
                          examType === "mcq"
                            ? "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md shadow-indigo-500/10 dark:bg-indigo-950/40 dark:ring-indigo-500/40"
                            : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50 shadow-xs dark:bg-slate-900/60 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                        }`}
                      >
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-200 dark:bg-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <HelpCircle className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-base">1. MCQs Only</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            Configure topics, section time limits, and question targets. Synthesize questions via AI with instant visual review.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 pt-2">
                          <span>Configure MCQ Sections</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      {/* 2. Coding */}
                      <div
                        onClick={() => handleSelectExamType("coding")}
                        className={`p-6 rounded-3xl border transition-all cursor-pointer space-y-3 relative ${
                          examType === "coding"
                            ? "bg-cyan-50/70 border-cyan-500 ring-2 ring-cyan-500/30 shadow-md shadow-cyan-500/10 dark:bg-cyan-950/40 dark:ring-cyan-500/40"
                            : "bg-white border-slate-200 hover:border-cyan-300 hover:bg-slate-50/50 shadow-xs dark:bg-slate-900/60 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                        }`}
                      >
                        <div className="h-12 w-12 rounded-2xl bg-cyan-50 border border-cyan-200 dark:bg-cyan-500/20 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                          <Code2 className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-base">2. Coding Only</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            Paste problem links from HackerRank/LeetCode or synthesize FAANG-tier coding problems with full test suites.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-600 dark:text-cyan-400 pt-2">
                          <span>Configure Coding Arena</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      {/* 3. Both (Mixed) */}
                      <div
                        onClick={() => handleSelectExamType("mixed")}
                        className={`p-6 rounded-3xl border transition-all cursor-pointer space-y-3 relative ${
                          examType === "mixed"
                            ? "bg-purple-50/70 border-purple-500 ring-2 ring-purple-500/30 shadow-md shadow-purple-500/10 dark:bg-purple-950/40 dark:ring-purple-500/40"
                            : "bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50/50 shadow-xs dark:bg-slate-900/60 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                        }`}
                      >
                        <div className="h-12 w-12 rounded-2xl bg-purple-50 border border-purple-200 dark:bg-purple-500/20 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                          <Layers className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-base">3. Both (Mixed)</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            Comprehensive placement assessments combining multiple MCQ rounds and hands-on coding challenges in a single proctored test.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-600 dark:text-purple-400 pt-2">
                          <span>Configure Mixed Rounds</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    STEP 2: SECTION ARCHITECTURE, QUESTION COUNTS, HARDNESS & TOPICS
                    ══════════════════════════════════════════════════════════════════ */}
                {activeStep === 2 && (
                  <div className="space-y-6">
                    {/* Basic Overview Strip */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Exam Title *</label>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Campus Recruitment: DSA & CS Fundamentals Assessment"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none shadow-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
                          <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g. Super Dream Placement Qualifier"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none shadow-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Duration (Mins) *</label>
                          <input
                            type="number"
                            min={5}
                            max={600}
                            value={durationMinutes}
                            onChange={(e) => handleDurationChange(Number(e.target.value))}
                            className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none shadow-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Passing Score (%) *</label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={passingScorePercentage}
                            onChange={(e) => setPassingScorePercentage(Number(e.target.value))}
                            className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none shadow-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section Count Controls & Live Allocation Tracker */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Section Architecture ({sections.length})</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Configure distinct assessment modules, questions & time breakdown</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((cnt) => (
                            <button
                              key={cnt}
                              type="button"
                              onClick={() => handleSetSectionCount(cnt)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                sections.length === cnt
                                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white dark:border-slate-700"
                              }`}
                            >
                              {cnt} {cnt === 1 ? "Section" : "Sections"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Live Time Allocation Meter & Auto-Distribute Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30 shrink-0">
                            <Timer className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Allocated Section Time:
                              </span>
                              <span
                                className={`font-mono text-xs font-black px-2 py-0.5 rounded-md ${
                                  totalAllocatedMinutes === durationMinutes
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-500/30 dark:text-emerald-300"
                                    : totalAllocatedMinutes > durationMinutes
                                    ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-500/30 dark:text-rose-300"
                                    : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-500/30 dark:text-amber-300"
                                }`}
                              >
                                {totalAllocatedMinutes}m / {durationMinutes}m
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {totalAllocatedMinutes === durationMinutes ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  ✓ All {durationMinutes} mins perfectly allocated across {sections.length} sections
                                </span>
                              ) : totalAllocatedMinutes < durationMinutes ? (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  ⚠️ {durationMinutes - totalAllocatedMinutes} mins unallocated
                                </span>
                              ) : (
                                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                                  ❌ Exceeds total exam duration by {totalAllocatedMinutes - durationMinutes} mins
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAutoDistributeTime}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-center shrink-0 shadow-2xs"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Auto-Distribute Evenly</span>
                        </button>
                      </div>

                      {/* Sections List */}
                      <div className="space-y-4">
                        {sections.map((sec, idx) => (
                          <div
                            key={sec.sectionId || idx}
                            className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs"
                          >
                            {/* Section Header: Number, Title Input & Section Type Segmented Switch */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-extrabold text-xs flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-500/30">
                                  #{idx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={sec.title}
                                  onChange={(e) => {
                                    const updated = [...sections];
                                    updated[idx].title = e.target.value;
                                    setSections(updated);
                                  }}
                                  placeholder={`Section ${idx + 1} Title (e.g. Core Fundamentals & Aptitude)`}
                                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                                />
                              </div>

                              {/* Section Type Badge or Segmented Switch for Mixed Exams */}
                              {examType === "mixed" ? (
                                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shrink-0 self-start md:self-auto">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...sections];
                                      updated[idx].type = "mcq";
                                      if (!updated[idx].targetQuestionCount || updated[idx].targetQuestionCount <= 0) {
                                        updated[idx].targetQuestionCount = 5;
                                      }
                                      setSections(updated);
                                    }}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                      sec.type === "mcq"
                                        ? "bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                    }`}
                                  >
                                    <span>📝 MCQ Questions</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...sections];
                                      updated[idx].type = "coding";
                                      if (!updated[idx].targetQuestionCount || updated[idx].targetQuestionCount <= 0) {
                                        updated[idx].targetQuestionCount = 2;
                                      }
                                      setSections(updated);
                                    }}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                      sec.type === "coding"
                                        ? "bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs"
                                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                    }`}
                                  >
                                    <span>💻 Coding Arena</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs shrink-0 self-start md:self-auto">
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      sec.type === "mcq" ? "bg-indigo-500" : "bg-cyan-500"
                                    }`}
                                  />
                                  <span>{sec.type === "mcq" ? "MCQ Section" : "Coding Arena"}</span>
                                </div>
                              )}
                            </div>

                            {/* Section Parameters Grid: Difficulty, Target Questions, Section Duration */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                              {/* Difficulty */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Difficulty Level</label>
                                <select
                                  value={sec.difficulty}
                                  onChange={(e) => {
                                    const updated = [...sections];
                                    updated[idx].difficulty = e.target.value as any;
                                    setSections(updated);
                                  }}
                                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-indigo-500 shadow-xs"
                                >
                                  <option value="easy">Easy (Foundation)</option>
                                  <option value="medium">Medium (Standard)</option>
                                  <option value="hard">Hard (Advanced)</option>
                                  <option value="faang">FAANG Tier (Elite)</option>
                                </select>
                              </div>

                              {/* Number of Questions (Stepper) */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Target Questions *
                                  </label>
                                  <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                                    {sec.targetQuestionCount || (sec.type === "mcq" ? 5 : 2)} {sec.type === "mcq" ? "MCQs" : "Challenges"}
                                  </span>
                                </div>
                                <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-xs">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...sections];
                                      const cur = updated[idx].targetQuestionCount || (sec.type === "mcq" ? 5 : 2);
                                      updated[idx].targetQuestionCount = Math.max(1, cur - 1);
                                      setSections(updated);
                                    }}
                                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center transition cursor-pointer border border-slate-200 dark:border-transparent"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min={1}
                                    max={sec.type === "mcq" ? 100 : 20}
                                    value={sec.targetQuestionCount || (sec.type === "mcq" ? 5 : 2)}
                                    onChange={(e) => {
                                      const updated = [...sections];
                                      const val = Math.max(1, Math.min(sec.type === "mcq" ? 100 : 20, Number(e.target.value) || 1));
                                      updated[idx].targetQuestionCount = val;
                                      setSections(updated);
                                    }}
                                    className="flex-1 text-center bg-transparent text-slate-900 dark:text-white font-bold text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...sections];
                                      const cur = updated[idx].targetQuestionCount || (sec.type === "mcq" ? 5 : 2);
                                      updated[idx].targetQuestionCount = Math.min(sec.type === "mcq" ? 100 : 20, cur + 1);
                                      setSections(updated);
                                    }}
                                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center transition cursor-pointer border border-slate-200 dark:border-transparent"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              {/* Section Time Limit */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Time Limit</label>
                                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                    {sec.timeLimitMinutes || 1} Mins
                                  </span>
                                </div>
                                <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-xs">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...sections];
                                      const cur = updated[idx].timeLimitMinutes || 1;
                                      updated[idx].timeLimitMinutes = Math.max(1, cur - 5);
                                      setSections(updated);
                                    }}
                                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center transition cursor-pointer border border-slate-200 dark:border-transparent"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min={1}
                                    max={durationMinutes}
                                    step={1}
                                    value={sec.timeLimitMinutes || 1}
                                    onChange={(e) => {
                                      const otherSum = sections.reduce(
                                        (sum, s, i) => (i === idx ? sum : sum + (Number(s.timeLimitMinutes) || 0)),
                                        0
                                      );
                                      const maxAllowed = Math.max(1, durationMinutes - otherSum);
                                      const rawVal = Number(e.target.value) || 1;
                                      const clampedVal = Math.max(1, Math.min(maxAllowed, rawVal));
                                      if (rawVal > maxAllowed) {
                                        toast.warning(
                                          `Capped to ${maxAllowed} mins so total section time does not exceed exam duration (${durationMinutes} mins).`
                                        );
                                      }
                                      const updated = [...sections];
                                      updated[idx].timeLimitMinutes = clampedVal;
                                      setSections(updated);
                                    }}
                                    className="flex-1 text-center bg-transparent text-slate-900 dark:text-white font-bold text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const otherSum = sections.reduce(
                                        (sum, s, i) => (i === idx ? sum : sum + (Number(s.timeLimitMinutes) || 0)),
                                        0
                                      );
                                      const maxAllowed = Math.max(1, durationMinutes - otherSum);
                                      const cur = sections[idx].timeLimitMinutes || 1;
                                      if (cur >= maxAllowed) {
                                        toast.warning(
                                          `Cannot increase beyond ${maxAllowed} mins (total exam duration is ${durationMinutes} mins).`
                                        );
                                        return;
                                      }
                                      const updated = [...sections];
                                      updated[idx].timeLimitMinutes = Math.min(maxAllowed, cur + 5);
                                      setSections(updated);
                                    }}
                                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center transition cursor-pointer border border-slate-200 dark:border-transparent"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    STEP 3: QUESTION SOURCING & AI GENERATION GATE
                    ══════════════════════════════════════════════════════════════════ */}
                {activeStep === 3 && (
                  <div className="space-y-6">
                    {/* Section Sub-tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
                      {sections.map((sec, idx) => {
                        const qCount =
                          sec.type === "mcq" ? sec.mcqQuestions.length : sec.codingQuestions.length;
                        const target = sec.targetQuestionCount || (sec.type === "mcq" ? 5 : 2);

                        return (
                          <button
                            key={sec.sectionId || idx}
                            onClick={() => handleSwitchSection(idx)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                              activeSectionIdx === idx
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                : "bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            <span>{sec.title}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                                qCount >= target
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/30 dark:text-emerald-300"
                                  : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {qCount} / {target}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* AI Generation Loading Shield */}
                    {isGeneratingAi && (
                      <div className="p-8 rounded-3xl bg-indigo-50 border-2 border-indigo-200 dark:bg-indigo-950/50 dark:border-indigo-500/50 text-center space-y-4 animate-pulse">
                        <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-indigo-100 text-indigo-600 border border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/40 shadow-lg shadow-indigo-500/20">
                          <Loader2 className="h-7 w-7 animate-spin" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-extrabold text-slate-900 dark:text-white">AI Examiner Generating Questions...</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                            Crafting rigorous, technically verified questions with options, marked answer keys, and detailed faculty explanations. Please hold on...
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Current Section Sourcing Controls */}
                    {!isGeneratingAi && (
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-5">
                        {/* Requirements Banner with On-the-fly Question Count Customizer */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white">{currentSec.title}</h4>
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30">
                                {currentSec.type === "mcq" ? "MCQs" : "Coding Arena"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              Target: <strong className="text-indigo-600 dark:text-indigo-400">{currentSec.targetQuestionCount || (currentSec.type === "mcq" ? 5 : 2)} questions</strong> • Hardness: <strong className="text-amber-600 dark:text-amber-400 capitalize">{currentSec.difficulty}</strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-3 self-start md:self-auto">
                            {/* On-the-fly target count stepper */}
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-indigo-500/40 rounded-xl px-2 py-1">
                              <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 mr-1">Target Qs:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...sections];
                                  const cur = updated[activeSectionIdx].targetQuestionCount || (currentSec.type === "mcq" ? 5 : 2);
                                  updated[activeSectionIdx].targetQuestionCount = Math.max(1, cur - 1);
                                  setSections(updated);
                                }}
                                className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-indigo-600/30 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-black text-xs flex items-center justify-center transition cursor-pointer border border-slate-200 dark:border-transparent"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-mono font-black text-xs text-slate-900 dark:text-white">
                                {currentSec.targetQuestionCount || (currentSec.type === "mcq" ? 5 : 2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...sections];
                                  const cur = updated[activeSectionIdx].targetQuestionCount || (currentSec.type === "mcq" ? 5 : 2);
                                  updated[activeSectionIdx].targetQuestionCount = Math.min(100, cur + 1);
                                  setSections(updated);
                                }}
                                className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-indigo-600/30 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-black text-xs flex items-center justify-center transition cursor-pointer border border-slate-200 dark:border-transparent"
                              >
                                +
                              </button>
                            </div>

                            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300">
                              {currentSec.type === "mcq"
                                ? `${currentSec.mcqQuestions.length} Questions Added`
                                : `${currentSec.codingQuestions.length} Challenges Added`}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Topics Selection Dropdown for Section */}
                        <div className="relative" ref={topicsDropdownRef}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span className="text-xs font-bold text-slate-900 dark:text-white">Section Topics / Syllabus:</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30">
                                  {(currentSec.topics || []).length} Selected
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {(currentSec.topics || []).length === 0 ? (
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                                    No topics selected yet. Click "Select Topics" to choose from syllabus.
                                  </span>
                                ) : (
                                  (currentSec.topics || []).map((t) => (
                                    <span
                                      key={t}
                                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30 shadow-2xs"
                                    >
                                      <span>{t}</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleTopic(activeSectionIdx, t);
                                        }}
                                        className="hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer p-0.5 rounded"
                                        title="Remove topic"
                                      >
                                        <X className="h-2.5 w-2.5" />
                                      </button>
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setIsTopicsDropdownOpen(!isTopicsDropdownOpen)}
                              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 transition flex items-center gap-2 shrink-0 cursor-pointer shadow-xs self-start sm:self-center"
                            >
                              <span>{isTopicsDropdownOpen ? "Close Dropdown" : "Select Topics"}</span>
                              {isTopicsDropdownOpen ? (
                                <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                              )}
                            </button>
                          </div>

                          {/* Dropdown Popup Menu */}
                          {isTopicsDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 z-50 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
                              {/* Search & Actions Bar */}
                              <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                  <input
                                    type="text"
                                    value={topicSearchQuery}
                                    onChange={(e) => setTopicSearchQuery(e.target.value)}
                                    placeholder="Search syllabus topics..."
                                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...sections];
                                    updated[activeSectionIdx].topics = [...COMMON_TOPICS];
                                    setSections(updated);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-300 transition cursor-pointer shrink-0"
                                >
                                  Select All
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...sections];
                                    updated[activeSectionIdx].topics = [];
                                    setSections(updated);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 transition cursor-pointer shrink-0"
                                >
                                  Clear
                                </button>
                              </div>

                              {/* Topics Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                                {COMMON_TOPICS.filter((t) =>
                                  t.toLowerCase().includes(topicSearchQuery.toLowerCase())
                                ).map((topic) => {
                                  const isSelected = (currentSec.topics || []).includes(topic);
                                  return (
                                    <button
                                      key={topic}
                                      type="button"
                                      onClick={() => handleToggleTopic(activeSectionIdx, topic)}
                                      className={`p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition cursor-pointer ${
                                        isSelected
                                          ? "bg-indigo-50 border-indigo-500 text-indigo-900 dark:bg-indigo-500/20 dark:border-indigo-500/60 dark:text-indigo-200 shadow-2xs font-bold"
                                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-300"
                                      }`}
                                    >
                                      <span className="truncate pr-2">{topic}</span>
                                      <div
                                        className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                                          isSelected
                                            ? "bg-indigo-600 border-indigo-600 text-white"
                                            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                                        }`}
                                      >
                                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Custom Topic Input */}
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                <input
                                  type="text"
                                  value={customTopicInput}
                                  onChange={(e) => setCustomTopicInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAddCustomTopic(activeSectionIdx);
                                    }
                                  }}
                                  placeholder="Type custom topic and hit Enter..."
                                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddCustomTopic(activeSectionIdx)}
                                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shrink-0 transition cursor-pointer"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  <span>Add</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sourcing Actions for MCQ */}
                        {currentSec.type === "mcq" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* 1. Auto Fetch via AI */}
                              <button
                                type="button"
                                disabled={isGeneratingAi}
                                onClick={() => handleGenerateAiMcqsForSection(activeSectionIdx)}
                                className="p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 hover:border-indigo-300 dark:bg-gradient-to-r dark:from-indigo-900/50 dark:to-purple-900/50 dark:border-indigo-500/40 dark:hover:border-indigo-400 text-left space-y-1.5 transition group cursor-pointer shadow-xs"
                              >
                                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition" />
                                  <span>Generate via AI</span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                  Synthesizes {currentSec.targetQuestionCount || 5} {currentSec.difficulty} questions tailored to syllabus.
                                </p>
                              </button>

                              {/* 2. Upload Question Paper / PDF */}
                              <button
                                type="button"
                                onClick={() => {
                                  setShowDocUploadModal(true);
                                  setExtractedDocResult([]);
                                }}
                                className="p-4 rounded-2xl bg-sky-50 hover:bg-sky-100/80 border border-sky-200 hover:border-sky-300 dark:bg-gradient-to-r dark:from-sky-950/60 dark:to-blue-950/60 dark:border-sky-500/40 dark:hover:border-sky-400 text-left space-y-1.5 transition group cursor-pointer shadow-xs"
                              >
                                <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300 font-bold text-xs">
                                  <FileUp className="w-4 h-4 text-sky-600 dark:text-sky-400 group-hover:-translate-y-0.5 transition" />
                                  <span>Upload PDF / Paper</span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                  Extracts questions & marked answer keys from PDF, DOCX, or text.
                                </p>
                              </button>

                              {/* 3. Manual Add */}
                              <button
                                type="button"
                                onClick={() => setShowManualMcqModal(true)}
                                className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700 text-left space-y-1.5 transition cursor-pointer shadow-xs"
                              >
                                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                                  <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                  <span>Author Custom MCQ</span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                  Manually write question prompt, 4 choices, marks, and answer key.
                                </p>
                              </button>
                            </div>

                            {/* Fetched Questions List with Full Visual Inspection */}
                            <div className="space-y-3 pt-2">
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300">
                                  Section Questions ({currentSec.mcqQuestions.length})
                                </h5>
                                {currentSec.mcqQuestions.length > 0 && (
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Ready for examination
                                  </span>
                                )}
                              </div>

                              {currentSec.mcqQuestions.length === 0 ? (
                                <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 space-y-1">
                                  <AlertCircle className="h-5 w-5 text-amber-500 mx-auto" />
                                  <p>No questions added yet. Click <strong>"Fetch via AI"</strong> or <strong>"Author Custom MCQ"</strong> to populate this section.</p>
                                </div>
                              ) : (
                                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                  {currentSec.mcqQuestions.map((q, qIdx) => (
                                    <div
                                      key={q.questionId || qIdx}
                                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-2.5">
                                          <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-600/30 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-500/30">
                                            {qIdx + 1}
                                          </span>
                                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                                            {formatMathText(q.question)}
                                          </p>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = [...sections];
                                            updated[activeSectionIdx].mcqQuestions = updated[
                                              activeSectionIdx
                                            ].mcqQuestions.filter((_, i) => i !== qIdx);
                                            setSections(updated);
                                          }}
                                          className="text-slate-400 hover:text-rose-500 p-1 transition"
                                          title="Remove question"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>

                                      {/* Options */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                        {q.options.map((opt, oIdx) => {
                                          const isCorrect = oIdx === q.correctOptionIndex;
                                          return (
                                            <div
                                              key={oIdx}
                                              className={`px-3 py-1.5 rounded-lg border flex items-center justify-between gap-1.5 ${
                                                isCorrect
                                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-500/50 dark:text-emerald-300 font-bold"
                                                  : "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400"
                                              }`}
                                            >
                                              <span className="truncate">
                                                {String.fromCharCode(65 + oIdx)}. {formatMathText(opt)}
                                              </span>
                                              {isCorrect && (
                                                <span className="text-[9px] uppercase font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 px-1.5 py-0.2 rounded shrink-0">
                                                  Correct
                                                </span>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* Explanation */}
                                      {q.explanation && (
                                        <p className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 leading-relaxed">
                                          <strong className="text-indigo-600 dark:text-indigo-400">Explanation:</strong> {formatMathText(q.explanation)}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Sourcing Actions for Coding */}
                        {currentSec.type === "coding" && (
                          <div className="space-y-4">
                            {/* Slots */}
                            <div className="space-y-3">
                              {Array.from({ length: currentSec.targetQuestionCount || 2 }).map((_, slotIdx) => {
                                const codeQuestion = currentSec.codingQuestions[slotIdx];
                                const slotKey = `${activeSectionIdx}-${slotIdx}`;
                                const isParsing = parsingSlotKey === slotKey;
                                const isGen = generatingSlotKey === slotKey;

                                return (
                                  <div
                                    key={slotIdx}
                                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                                          #{slotIdx + 1}
                                        </span>
                                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                                          Challenge #{slotIdx + 1}
                                        </span>
                                      </div>

                                      {codeQuestion ? (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveCodingSlot(activeSectionIdx, slotIdx)}
                                          className="text-slate-400 hover:text-rose-500 p-1 text-xs"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      ) : null}
                                    </div>

                                    {codeQuestion ? (
                                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                                        <div className="flex items-center justify-between">
                                          <strong className="text-slate-900 dark:text-white text-xs font-bold">
                                            {codeQuestion.title}
                                          </strong>
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                                            {codeQuestion.difficulty}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                                          {codeQuestion.problemStatement}
                                        </p>
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                                          ✓ {(codeQuestion.testCases || []).length} Test Cases configured
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        {/* Import via Link */}
                                        <div className="space-y-1.5">
                                          <div className="flex gap-2">
                                            <input
                                              type="text"
                                              value={slotLinkInputs[slotKey] || ""}
                                              onChange={(e) =>
                                                setSlotLinkInputs({ ...slotLinkInputs, [slotKey]: e.target.value })
                                              }
                                              placeholder="LeetCode / HackerRank URL"
                                              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                                            />
                                            <button
                                              type="button"
                                              disabled={isParsing}
                                              onClick={() => handleParseCodingLinkForSlot(activeSectionIdx, slotIdx)}
                                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white flex items-center gap-1 shrink-0 cursor-pointer"
                                            >
                                              {isParsing ? <Loader2 className="w-3 h-3 animate-spin" /> : "Import"}
                                            </button>
                                          </div>
                                        </div>

                                        {/* AI Generate */}
                                        <button
                                          type="button"
                                          disabled={isGen}
                                          onClick={() => handleGenerateAiCodingForSlot(activeSectionIdx, slotIdx)}
                                          className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-xs font-bold text-indigo-600 dark:text-indigo-300 flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                          {isGen ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                          )}
                                          <span>Generate AI Challenge</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Add Another Coding Challenge Slot Button */}
                            <button
                              type="button"
                              onClick={() => handleAddExtraQuestionSlot(activeSectionIdx)}
                              className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-500 bg-slate-50/50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 dark:border-slate-800 dark:hover:border-indigo-500/50 dark:bg-slate-900/40 dark:hover:bg-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer group"
                            >
                              <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition" />
                              <span>Add Coding Challenge Slot #{((currentSec.targetQuestionCount || 2) + 1)}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    STEP 4: TARGET AUDIENCE, PROCTORING & SCHEDULING
                    ══════════════════════════════════════════════════════════════════ */}
                {activeStep === 4 && (
                  <div className="space-y-6">
                    {/* Assessment Scheduling Window Card */}
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Assessment Timing & Availability Window</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Configure individual test duration and the attendance time window (from when to when)</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsScheduled(false)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                              !isScheduled
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                            }`}
                          >
                            Launch Immediately
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsScheduled(true);
                              if (!scheduledStartTime) {
                                const d = new Date(Date.now() + 60 * 60 * 1000);
                                d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
                                const pad = (n: number) => n.toString().padStart(2, "0");
                                const startStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                setScheduledStartTime(startStr);
                                const endD = new Date(d.getTime() + 4 * 60 * 60 * 1000);
                                const endStr = `${endD.getFullYear()}-${pad(endD.getMonth() + 1)}-${pad(endD.getDate())}T${pad(endD.getHours())}:${pad(endD.getMinutes())}`;
                                setScheduledEndTime(endStr);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                              isScheduled
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                            }`}
                          >
                            Schedule Window
                          </button>
                        </div>
                      </div>

                      {/* Duration Summary Bar */}
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Candidate Test Duration:</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-mono font-bold border border-indigo-200 dark:border-indigo-500/30">
                          {durationMinutes} Minutes ({Math.floor(durationMinutes / 60) > 0 ? `${Math.floor(durationMinutes / 60)}h ` : ""}{durationMinutes % 60 > 0 ? `${durationMinutes % 60}m` : ""})
                        </span>
                      </div>

                      {isScheduled && (
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Window Open / Start Time */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span>Window Opens (Available From) *</span>
                              </label>
                              <div className="relative flex items-center">
                                <input
                                  ref={startDateInputRef}
                                  type="datetime-local"
                                  value={scheduledStartTime}
                                  onChange={(e) => setScheduledStartTime(e.target.value)}
                                  className="w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:border-indigo-500 focus:outline-none cursor-pointer"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    try {
                                      if (startDateInputRef.current && "showPicker" in startDateInputRef.current) {
                                        (startDateInputRef.current as any).showPicker();
                                      } else {
                                        startDateInputRef.current?.focus();
                                      }
                                    } catch {
                                      startDateInputRef.current?.focus();
                                    }
                                  }}
                                  className="absolute right-2 p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-600 text-slate-600 hover:text-white dark:bg-slate-800 dark:text-indigo-300 dark:hover:text-white transition cursor-pointer"
                                  title="Open Calendar Picker"
                                >
                                  <Calendar className="h-4 w-4" />
                                </button>
                              </div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                                Candidates cannot attend prior to this time.
                              </span>
                            </div>

                            {/* Window Close / End Time */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Timer className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                                <span>Window Closes (Available Until) *</span>
                              </label>
                              <div className="relative flex items-center">
                                <input
                                  ref={endDateInputRef}
                                  type="datetime-local"
                                  value={scheduledEndTime}
                                  onChange={(e) => setScheduledEndTime(e.target.value)}
                                  className="w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:border-indigo-500 focus:outline-none cursor-pointer"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    try {
                                      if (endDateInputRef.current && "showPicker" in endDateInputRef.current) {
                                        (endDateInputRef.current as any).showPicker();
                                      } else {
                                        endDateInputRef.current?.focus();
                                      }
                                    } catch {
                                      endDateInputRef.current?.focus();
                                    }
                                  }}
                                  className="absolute right-2 p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-600 text-slate-600 hover:text-white dark:bg-slate-800 dark:text-indigo-300 dark:hover:text-white transition cursor-pointer"
                                  title="Open Calendar Picker"
                                >
                                  <Calendar className="h-4 w-4" />
                                </button>
                              </div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                                Gate closes strictly after this deadline.
                              </span>
                            </div>
                          </div>

                          {/* Quick Window Presets */}
                          <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                              Quick Window Presets (Calculated from Start Time):
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => applyWindowPreset("same")}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 dark:bg-slate-800 dark:hover:bg-indigo-500/20 dark:text-slate-300 dark:hover:text-indigo-200 dark:border-slate-700 transition cursor-pointer shadow-2xs"
                              >
                                Match Duration ({durationMinutes}m)
                              </button>
                              <button
                                type="button"
                                onClick={() => applyWindowPreset(2)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 dark:bg-slate-800 dark:hover:bg-indigo-500/20 dark:text-slate-300 dark:hover:text-indigo-200 dark:border-slate-700 transition cursor-pointer shadow-2xs"
                              >
                                Open 2 Hours
                              </button>
                              <button
                                type="button"
                                onClick={() => applyWindowPreset(4)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 hover:border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 transition cursor-pointer shadow-2xs"
                              >
                                Open 4 Hours (e.g. 4 PM – 8 PM)
                              </button>
                              <button
                                type="button"
                                onClick={() => applyWindowPreset("allDay")}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 dark:bg-slate-800 dark:hover:bg-indigo-500/20 dark:text-slate-300 dark:hover:text-indigo-200 dark:border-slate-700 transition cursor-pointer shadow-2xs"
                              >
                                Open All Day (Until 11:59 PM)
                              </button>
                            </div>
                          </div>

                          {/* How Window & Duration Work Notice */}
                          {scheduledStartTime && scheduledEndTime && (
                            <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300">
                                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                                <span>Window & Duration Policy</span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                Students can attend anytime between{" "}
                                <strong className="text-slate-900 dark:text-white font-mono">
                                  {new Date(scheduledStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </strong>{" "}
                                and{" "}
                                <strong className="text-slate-900 dark:text-white font-mono">
                                  {new Date(scheduledEndTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </strong>
                                . Once a student begins, they receive up to <strong>{durationMinutes} minutes</strong> to complete. If they start late (e.g. 20 minutes before the window closes), their timer is automatically capped to the closing cutoff.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Target Audience */}
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Target Candidate Cohort</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { id: "all", label: "All Registered Students", desc: "Open to entire student directory" },
                          { id: "mentees", label: "My Mentees Only", desc: "Restricted to your assigned mentees" },
                          { id: "selected", label: "Specific Selected Students", desc: "Manually pick candidates" },
                          { id: "batch", label: "Saved Batches", desc: "Reuse a saved student group" },
                        ].map((aud) => (
                          <div
                            key={aud.id}
                            onClick={() => setTargetAudience(aud.id as any)}
                            className={`p-4 rounded-2xl border transition cursor-pointer space-y-1.5 ${
                              targetAudience === aud.id
                                ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 text-slate-900 dark:bg-indigo-950/40 dark:text-white"
                                : "bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700"
                            }`}
                          >
                            <span className="font-bold text-slate-900 dark:text-white text-xs block">{aud.label}</span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{aud.desc}</p>
                          </div>
                        ))}
                      </div>

                      {/* Saved Batches Picker */}
                      {targetAudience === "batch" && (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                              Pick a saved batch to reuse
                            </span>
                            <button
                              type="button"
                              onClick={refreshBatches}
                              disabled={isLoadingBatches}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <RefreshCw className={`h-3 w-3 ${isLoadingBatches ? "animate-spin" : ""}`} />
                              Refresh
                            </button>
                          </div>

                          {isLoadingBatches ? (
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-3">
                              <Loader2 className="h-4 w-4 animate-spin" /> Loading saved batches…
                            </div>
                          ) : batches.length === 0 ? (
                            <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-1">
                              <Layers className="h-5 w-5 mx-auto text-slate-400" />
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No saved batches yet</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Switch to “Specific Selected Students”, pick candidates, then save them as a batch below.
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-0.5">
                              {batches.map((b) => {
                                const isActive = selectedBatchId === b._id;
                                return (
                                  <div
                                    key={b._id}
                                    onClick={() => handlePickBatch(b._id)}
                                    className={`p-3 rounded-2xl border transition cursor-pointer space-y-1 ${
                                      isActive
                                        ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 dark:bg-indigo-950/40"
                                        : "bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-bold text-slate-900 dark:text-white text-xs truncate">{b.name}</span>
                                      <button
                                        type="button"
                                        title={`Delete batch "${b.name}"`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteBatch(b._id, b.name);
                                        }}
                                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer shrink-0"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-extrabold border border-indigo-200 dark:border-indigo-500/30">
                                        {b.studentCount} student{b.studentCount === 1 ? "" : "s"}
                                      </span>
                                      <span>Updated {new Date(b.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                    {isActive && (
                                      <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                                        <Check className="h-3 w-3" /> Members loaded below — tweak if needed
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Selected Students & Batch Picker */}
                      {(targetAudience === "selected" || targetAudience === "batch") && (
                        <div className="space-y-4 pt-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-extrabold text-xs border border-indigo-200 dark:border-indigo-500/30">
                                {selectedStudentIds.length} Candidate(s) Selected for this Test Batch
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const filtered = studentsRoster.filter((st) => {
                                    const matchesSearch =
                                      !studentSearch ||
                                      st.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                                      st.email?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                                      ((st as any).registerNumber && (st as any).registerNumber.toLowerCase().includes(studentSearch.toLowerCase()));
                                    return matchesSearch;
                                  });
                                  const allIds = Array.from(new Set([...selectedStudentIds, ...filtered.map((s) => s._id)]));
                                  setSelectedStudentIds(allIds);
                                  toast.success(`Selected ${filtered.length} candidates`);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
                              >
                                Select All Filtered ({studentsRoster.filter((st) => !studentSearch || st.name.toLowerCase().includes(studentSearch.toLowerCase()) || st.email.toLowerCase().includes(studentSearch.toLowerCase())).length})
                              </button>

                              {selectedStudentIds.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedStudentIds([])}
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-500/20 dark:hover:text-rose-300 dark:text-slate-400 font-bold text-xs transition cursor-pointer"
                                >
                                  Clear Selection
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Save / update reusable batch from current selection */}
                          <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-950/20">
                            <div className="relative flex-1">
                              <Layers className="h-3.5 w-3.5 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={newBatchName}
                                onChange={(e) => setNewBatchName(e.target.value)}
                                placeholder='Save selection as batch — e.g. "CSE 2026-A"'
                                maxLength={80}
                                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                              />
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={handleSaveBatch}
                                disabled={isSavingBatch || selectedStudentIds.length === 0}
                                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                              >
                                {isSavingBatch ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                                Save Batch
                              </button>
                              {selectedBatch && batchDirty && (
                                <button
                                  type="button"
                                  onClick={handleUpdateBatch}
                                  disabled={isSavingBatch}
                                  className="px-3 py-2 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-300 dark:bg-slate-900 dark:hover:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/40 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                                  title="Overwrite the saved batch with the current selection"
                                >
                                  Update “{selectedBatch.name}”
                                </button>
                              )}
                            </div>
                          </div>

                          {selectedBatch && !batchDirty && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <Check className="h-3 w-3 text-emerald-500" />
                              Selection matches saved batch “{selectedBatch.name}” ({selectedBatch.studentCount} students)
                            </p>
                          )}

                          <div className="relative">
                            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={studentSearch}
                              onChange={(e) => setStudentSearch(e.target.value)}
                              placeholder="Search candidates by name, email, or register number..."
                              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>

                          <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 bg-white dark:bg-slate-900/90">
                            {studentsRoster
                              .filter((st) =>
                                !studentSearch ||
                                st.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                                st.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
                                ((st as any).registerNumber && (st as any).registerNumber.toLowerCase().includes(studentSearch.toLowerCase()))
                              )
                              .map((st) => {
                                const isSelected = selectedStudentIds.includes(st._id);
                                return (
                                  <div
                                    key={st._id}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedStudentIds(selectedStudentIds.filter((id) => id !== st._id));
                                      } else {
                                        setSelectedStudentIds([...selectedStudentIds, st._id]);
                                      }
                                    }}
                                    className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer text-xs transition border ${
                                      isSelected
                                        ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-bold dark:bg-indigo-600/20 dark:border-indigo-500/50 dark:text-white"
                                        : "bg-slate-50/50 border-slate-200/80 hover:border-slate-300 text-slate-700 dark:bg-slate-950/60 dark:border-slate-800/80 dark:hover:border-slate-700 dark:text-slate-300"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                                          isSelected ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                        }`}
                                      >
                                        {st.name.charAt(0)}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-slate-900 dark:text-white">{st.name}</span>
                                          {(st as any).registerNumber && (
                                            <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-300 font-semibold">
                                              ({(st as any).registerNumber})
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{st.email}</span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {st.targetRole && (
                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hidden sm:inline-block">
                                          {st.targetRole}
                                        </span>
                                      )}
                                      <div
                                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                                          isSelected
                                            ? "bg-indigo-600 border-indigo-500 text-white"
                                            : "border-slate-300 bg-white text-transparent dark:border-slate-700 dark:bg-slate-800/50"
                                        }`}
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Proctoring Rules */}
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Proctoring & Anti-Cheat Protocols</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <label className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer shadow-xs">
                          <div className="space-y-0.5 pr-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">Fullscreen Mode Required</span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Lock into fullscreen; blocks test viewing or coding outside fullscreen.</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={fullscreenEnforced}
                            onChange={(e) => setFullscreenEnforced(e.target.checked)}
                            className="accent-indigo-600 w-4 h-4 cursor-pointer shrink-0"
                          />
                        </label>

                        <label className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer shadow-xs">
                          <div className="space-y-0.5 pr-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">Webcam Monitoring</span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Requires live video stream preview of candidate.</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={webcamRequired}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setWebcamRequired(checked);
                              if (!checked) setAiFaceDetection(false);
                            }}
                            className="accent-indigo-600 w-4 h-4 cursor-pointer shrink-0"
                          />
                        </label>

                        <label className={`p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer shadow-xs ${!webcamRequired ? "opacity-50 pointer-events-none" : ""}`}>
                          <div className="space-y-0.5 pr-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">AI Face & Phone Detection</span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Detects multiple persons, absent face, or phones via camera.</p>
                          </div>
                          <input
                            type="checkbox"
                            disabled={!webcamRequired}
                            checked={aiFaceDetection && webcamRequired}
                            onChange={(e) => setAiFaceDetection(e.target.checked)}
                            className="accent-indigo-600 w-4 h-4 cursor-pointer shrink-0"
                          />
                        </label>

                        <label className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer shadow-xs">
                          <div className="space-y-0.5 pr-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">Disable Copy/Paste & Shortcuts</span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Blocks copy/paste without triggering browser permission popups.</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={copyPasteDisabled}
                            onChange={(e) => setCopyPasteDisabled(e.target.checked)}
                            className="accent-indigo-600 w-4 h-4 cursor-pointer shrink-0"
                          />
                        </label>

                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
                          <div className="space-y-0.5 pr-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">Tab Switch Strike Limit</span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Max tab/window switches before disqualification.</p>
                          </div>
                          <select
                            value={tabSwitchLimit}
                            onChange={(e) => setTabSwitchLimit(Number(e.target.value))}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                          >
                            <option value={1}>1 Strike (Strict)</option>
                            <option value={2}>2 Strikes</option>
                            <option value={3}>3 Strikes (Standard)</option>
                            <option value={5}>5 Strikes (Lenient)</option>
                            <option value={999}>Unlimited</option>
                          </select>
                        </div>

                        <label className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer shadow-xs">
                          <div className="space-y-0.5 pr-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">Permit Retakes</span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Allow candidates to re-attempt assessment if failed.</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={allowRetakes}
                            onChange={(e) => setAllowRetakes(e.target.checked)}
                            className="accent-indigo-600 w-4 h-4 cursor-pointer shrink-0"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    STEP 5: REVIEW, QUESTION PAPER PREVIEW & PUBLISH
                    ══════════════════════════════════════════════════════════════════ */}
                {activeStep === 5 && (
                  <div className="space-y-6">
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30">
                            {examType.toUpperCase()} ASSESSMENT
                          </span>
                          <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1.5">{title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {description || "Placement Readiness & Technical Competency Examination"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowPreviewPaperModal(true)}
                          className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-600/30 dark:hover:bg-indigo-600/50 dark:text-indigo-200 dark:border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition cursor-pointer shadow-xs"
                        >
                          <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          <span>Preview Full Question Paper</span>
                        </button>
                      </div>

                      {/* Summary Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-semibold">Duration</span>
                          <strong className="text-slate-900 dark:text-white">{durationMinutes} mins</strong>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-semibold">Max Marks</span>
                          <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{previewExamObject.totalMarks} Marks</strong>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-semibold">Passing Score</span>
                          <strong className="text-indigo-600 dark:text-indigo-300 font-bold">{passingScorePercentage}%</strong>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-semibold">Status</span>
                          <strong className="text-amber-600 dark:text-amber-300 font-bold">
                            {isScheduled ? "Scheduled" : "Live Immediately"}
                          </strong>
                        </div>
                      </div>

                      {/* Sections List */}
                      <div className="space-y-2 pt-2">
                        <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                          Verified Question Sections ({sections.length})
                        </span>
                        <div className="space-y-2">
                          {sections.map((sec, idx) => {
                            const count =
                              sec.type === "mcq" ? sec.mcqQuestions.length : sec.codingQuestions.length;
                            return (
                              <div
                                key={sec.sectionId || idx}
                                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between shadow-xs"
                              >
                                <div>
                                  <strong className="text-slate-900 dark:text-white block">{sec.title}</strong>
                                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                                    Topics: {(sec.topics || []).join(", ")} • Difficulty: {sec.difficulty}
                                  </span>
                                </div>
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {count} {sec.type === "mcq" ? "MCQs" : "Challenges"} Ready
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Modal Footer Controls */}
          {!createdExamRecord && (
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
              <button
                type="button"
                disabled={activeStep === 1 || isGeneratingAi}
                onClick={() => setActiveStep((prev) => Math.max(1, prev - 1) as any)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {activeStep < 5 ? (
                <button
                  type="button"
                  disabled={isGeneratingAi}
                  onClick={handleNextStep}
                  className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md shadow-indigo-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitExam}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>
                    {isSubmitting
                      ? "Publishing Assessment..."
                      : isScheduled
                      ? "Schedule & Publish Assessment"
                      : "Publish Assessment"}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── MANUAL MCQ MODAL ──────────────────────────────────────────────── */}
        {showManualMcqModal && (
          <div className="fixed inset-0 z-[100000] bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Author Custom MCQ</h3>
                <button onClick={() => setShowManualMcqModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Question Text *</label>
                  <textarea
                    value={manualQuestion}
                    onChange={(e) => setManualQuestion(e.target.value)}
                    rows={2}
                    placeholder="Enter question problem statement..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Diagram / Image URL (Optional)</label>
                  <input
                    type="text"
                    value={manualImageUrl}
                    onChange={(e) => setManualImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">4 Choices (Select radio for correct answer)</label>
                  {manualOptions.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctChoice"
                        checked={manualCorrectIdx === oIdx}
                        onChange={() => setManualCorrectIdx(oIdx)}
                        className="accent-indigo-600 w-4 h-4 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const next = [...manualOptions];
                          next[oIdx] = e.target.value;
                          setManualOptions(next);
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Marks</label>
                  <input
                    type="number"
                    value={manualMarks}
                    onChange={(e) => setManualMarks(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowManualMcqModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveManualMcq(activeSectionIdx)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
                >
                  Save Question
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── DOCUMENT & PDF QUESTION EXTRACTOR MODAL ─────────────────────── */}
        {showDocUploadModal && (
          <div className="fixed inset-0 z-[100000] bg-slate-950/70 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl text-slate-900 dark:text-white my-8 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30">
                    <FileUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Extract Questions from Document / PDF
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Targeting: <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentSec.title}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDocUploadModal(false);
                    setExtractedDocResult([]);
                  }}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-4 pr-1 flex-1">
                {/* Method Tabs: File Upload vs Text Paste */}
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDocUploadTab("file")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      docUploadTab === "file"
                        ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Document File (.pdf, .docx, .txt)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocUploadTab("text")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      docUploadTab === "text"
                        ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Paste Question Paper Text</span>
                  </button>
                </div>

                {/* Format Guidance & Accordion */}
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 dark:border-indigo-500/20 dark:bg-indigo-950/20 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Supported Question Formats & Answer Keys</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDocFormatGuide(!showDocFormatGuide)}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{showDocFormatGuide ? "Hide Format Guide" : "View Example Format"}</span>
                      {showDocFormatGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    The AI parser automatically identifies 4 options (A-D) and extracts answer keys in standard styles like <code className="px-1 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 font-mono text-[10px]">Answer: B</code>, <code className="px-1 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 font-mono text-[10px]">Ans: B</code>, <code className="px-1 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 font-mono text-[10px]">*B) Correct*</code>, <code className="px-1 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 font-mono text-[10px]">[X] B.</code>, or bottom answer key tables.
                  </p>

                  {showDocFormatGuide && (
                    <div className="space-y-2 pt-2 border-t border-indigo-200/60 dark:border-indigo-500/30">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono font-bold text-indigo-700 dark:text-indigo-300">
                          Sample Question Paper Template:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(SAMPLE_QUESTION_PAPER_FORMAT);
                            toast.success("Sample question paper format copied to clipboard!");
                          }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-indigo-200 dark:border-indigo-500/40 flex items-center gap-1 transition cursor-pointer shadow-2xs"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy Template</span>
                        </button>
                      </div>
                      <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[10.5px] leading-relaxed overflow-x-auto max-h-44 border border-slate-800">
                        {SAMPLE_QUESTION_PAPER_FORMAT}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Tab 1: File Upload */}
                {docUploadTab === "file" && (
                  <div className="space-y-3">
                    <input
                      ref={docFileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedDocFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    {!selectedDocFile ? (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragOverDoc(true);
                        }}
                        onDragLeave={() => setIsDragOverDoc(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragOverDoc(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            setSelectedDocFile(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => docFileInputRef.current?.click()}
                        className={`p-8 rounded-3xl border-2 border-dashed text-center space-y-3 cursor-pointer transition ${
                          isDragOverDoc
                            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40"
                            : "border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50 dark:bg-slate-950/60"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Click to browse or drag & drop your question document
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Supports PDF (.pdf), Word (.docx), or Text (.txt) up to 10MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/40 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-xs shrink-0">
                            {selectedDocFile.name.split(".").pop()?.toUpperCase() || "DOC"}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {selectedDocFile.name}
                            </h5>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {(selectedDocFile.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => docFileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 cursor-pointer shadow-xs"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedDocFile(null)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Text Paste */}
                {docUploadTab === "text" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Paste Raw Question Paper Content
                      </label>
                      <button
                        type="button"
                        onClick={() => setPastedDocText(SAMPLE_QUESTION_PAPER_FORMAT)}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Paste Sample Questions
                      </button>
                    </div>
                    <textarea
                      value={pastedDocText}
                      onChange={(e) => setPastedDocText(e.target.value)}
                      rows={8}
                      placeholder={`1. What is...\n   A. Choice 1\n   B. Choice 2\n   C. Choice 3\n   D. Choice 4\n   Answer: B\n   Explanation: ...`}
                      className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* Extraction Button */}
                {extractedDocResult.length === 0 && (
                  <button
                    type="button"
                    disabled={isExtractingDoc || (docUploadTab === "file" ? !selectedDocFile : !pastedDocText.trim())}
                    onClick={handleExtractFromDoc}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 transition"
                  >
                    {isExtractingDoc ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>AI Parsing & Structuring Questions...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Extract & Parse Questions</span>
                      </>
                    )}
                  </button>
                )}

                {/* Extracted Questions Review & Verification Stage */}
                {extractedDocResult.length > 0 && (
                  <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-500/30">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Successfully Extracted {extractedDocResult.length} Questions</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setExtractedDocResult([]);
                          setSelectedDocFile(null);
                          setPastedDocText("");
                        }}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Re-upload
                      </button>
                    </div>

                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {extractedDocResult.map((q, qIdx) => (
                        <div
                          key={q.questionId || qIdx}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-black text-[10px] flex items-center justify-center shrink-0">
                                {qIdx + 1}
                              </span>
                              <p className="font-bold text-slate-900 dark:text-white">{q.question}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const next = extractedDocResult.filter((_, idx) => idx !== qIdx);
                                setExtractedDocResult(next);
                              }}
                              className="text-slate-400 hover:text-rose-600 transition p-0.5"
                              title="Delete question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* 4 Choices */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = q.correctOptionIndex === oIdx;
                              return (
                                <label
                                  key={oIdx}
                                  className={`p-2 rounded-xl border text-[11px] font-medium flex items-center gap-2 transition cursor-pointer ${
                                    isCorrect
                                      ? "bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-500/40 dark:text-emerald-200 font-bold"
                                      : "bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`extracted-choice-${qIdx}`}
                                    checked={isCorrect}
                                    onChange={() => {
                                      const updated = [...extractedDocResult];
                                      updated[qIdx].correctOptionIndex = oIdx;
                                      updated[qIdx].correctAnswer = opt;
                                      setExtractedDocResult(updated);
                                    }}
                                    className="accent-emerald-600 w-3.5 h-3.5"
                                  />
                                  <span className="truncate">
                                    <strong>{String.fromCharCode(65 + oIdx)}.</strong> {opt}
                                  </span>
                                </label>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                              💡 <strong>Explanation:</strong> {q.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowDocUploadModal(false);
                    setExtractedDocResult([]);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>

                {extractedDocResult.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyExtractedDocQuestions("replace")}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition cursor-pointer shadow-xs"
                    >
                      Replace Section Qs
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyExtractedDocQuestions("append")}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Append {extractedDocResult.length} Questions</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Question Paper Preview Modal */}
      <QuestionPaperPreviewModal
        open={showPreviewPaperModal}
        onClose={() => setShowPreviewPaperModal(false)}
        exam={createdExamRecord || previewExamObject}
      />
    </>,
    document.body
  );
}
