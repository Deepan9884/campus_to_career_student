import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  Trash2,
  FileCode,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Code2,
  ShieldAlert,
  Clock,
  Layers,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

export interface TestCaseItem {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  explanation?: string;
  timeLimitMs?: number;
  memoryLimitMb?: number;
}

export interface CodingQuestionConfig {
  id: string;
  title: string;
  problemStatement: string;
  constraints: string;
  allowedLanguages: string[];
  starterBoilerplate: Record<string, string>;
  testCases: TestCaseItem[];
  attachedPdfName?: string;
  attachedPdfSize?: string;
}

export interface McqQuestionConfig {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  positiveMarks: number;
  negativeMarks: number;
  explanation: string;
  topic: string;
}

export interface TestSectionConfig {
  id: string;
  title: string;
  type: "mcq" | "coding" | "architecture_descriptive";
  timeLimitMinutes: number;
  mcqQuestions: McqQuestionConfig[];
  codingQuestions: CodingQuestionConfig[];
}

export interface FullTestConfig {
  id: string;
  title: string;
  category: string;
  difficulty: "Super Dream (FAANG)" | "Expert" | "Advanced";
  targetPhase: number;
  targetCandidate: "all" | string;
  totalDurationMinutes: number;
  passingScorePercentage: number;
  scheduledWindowStart: string;
  scheduledWindowEnd: string;
  retakeAllowed: boolean;
  proctoringConfig: {
    webcamRequired: boolean;
    fullscreenEnforced: boolean;
    tabSwitchLimit: number;
    aiFaceDetection: boolean;
    copyPasteDisabled: boolean;
  };
  sections: TestSectionConfig[];
}

interface ExhaustiveTestBuilderModalProps {
  open: boolean;
  onClose: () => void;
  onSaveTest: (test: FullTestConfig) => void;
}

export function ExhaustiveTestBuilderModal({
  open,
  onClose,
  onSaveTest,
}: ExhaustiveTestBuilderModalProps) {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Identity & Proctoring
  const [testTitle, setTestTitle] = useState("");
  const [testCategory, setTestCategory] = useState("DSA Master");
  const [testDifficulty, setTestDifficulty] = useState<"Super Dream (FAANG)" | "Expert" | "Advanced">("Advanced");
  const [targetPhase, setTargetPhase] = useState(1);
  const [targetCandidate, setTargetCandidate] = useState("all");
  const [totalDurationMinutes, setTotalDurationMinutes] = useState(45);
  const [passingScorePercentage, setPassingScorePercentage] = useState(70);
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [retakeAllowed, setRetakeAllowed] = useState(false);

  // Security & Proctoring
  const [webcamRequired, setWebcamRequired] = useState(false);
  const [fullscreenEnforced, setFullscreenEnforced] = useState(true);
  const [tabSwitchLimit, setTabSwitchLimit] = useState(3);
  const [aiFaceDetection, setAiFaceDetection] = useState(false);
  const [copyPasteDisabled, setCopyPasteDisabled] = useState(false);

  // Step 2 & 3: Sections & Questions
  const [sections, setSections] = useState<TestSectionConfig[]>([
    {
      id: "sec-1",
      title: "Section A: Technical Assessment",
      type: "mcq",
      timeLimitMinutes: 30,
      mcqQuestions: [],
      codingQuestions: [],
    },
  ]);

  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  if (!open) return null;

  const currentSection = sections[activeSectionIndex] || sections[0];

  const handleAddSection = () => {
    const newSec: TestSectionConfig = {
      id: `sec-${Date.now()}`,
      title: `Section ${String.fromCharCode(65 + sections.length)}: New Assessment Block`,
      type: "mcq",
      timeLimitMinutes: 20,
      mcqQuestions: [],
      codingQuestions: [],
    };
    setSections([...sections, newSec]);
    setActiveSectionIndex(sections.length);
    toast.success("New section added to test");
  };

  const handleDeleteSection = (index: number) => {
    if (sections.length <= 1) {
      toast.error("Test must contain at least 1 section");
      return;
    }
    const updated = sections.filter((_, idx) => idx !== index);
    setSections(updated);
    setActiveSectionIndex(Math.max(0, index - 1));
  };

  // Question helpers for current section
  const handleAddMcqQuestion = () => {
    const newQ: McqQuestionConfig = {
      id: `q-mcq-${Date.now()}`,
      question: "Enter question statement here...",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctOptionIndex: 0,
      positiveMarks: 4,
      negativeMarks: 1,
      explanation: "Explanation of why Option A is correct.",
      topic: "System Architecture",
    };

    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === activeSectionIndex
          ? { ...sec, mcqQuestions: [...sec.mcqQuestions, newQ] }
          : sec
      )
    );
  };

  const handleAddCodingQuestion = () => {
    const newCodeQ: CodingQuestionConfig = {
      id: `q-code-${Date.now()}`,
      title: "New Algorithmic Engineering Problem",
      problemStatement: "Detailed problem statement, algorithmic requirements, and input/output structure...",
      constraints: "Time Limit: 1000ms • Memory Limit: 64MB",
      allowedLanguages: ["C++", "Java", "Python", "Go", "Rust"],
      starterBoilerplate: {
        "C++": "// Complete your solution here\n#include <iostream>\n\nint main() {\n  return 0;\n}",
        "Python": "# Write your solution here\ndef solve():\n    pass",
      },
      testCases: [
        {
          id: `tc-${Date.now()}-1`,
          input: "Sample Input 1",
          expectedOutput: "Sample Output 1",
          isHidden: false,
          explanation: "Sample walkthrough",
        },
        {
          id: `tc-${Date.now()}-2`,
          input: "Hidden Edgecase Input",
          expectedOutput: "Hidden Edgecase Output",
          isHidden: true,
        },
      ],
    };

    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === activeSectionIndex
          ? { ...sec, codingQuestions: [...sec.codingQuestions, newCodeQ] }
          : sec
      )
    );
  };

  const handleFileUploadMock = (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSections((prev) =>
      prev.map((sec) => ({
        ...sec,
        codingQuestions: sec.codingQuestions.map((q) =>
          q.id === questionId
            ? {
                ...q,
                attachedPdfName: file.name,
                attachedPdfSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
              }
            : q
        ),
      }))
    );

    toast.success(`PDF "${file.name}" attached to problem! Test cases parsed.`);
  };

  const handleAddTestCase = (questionId: string) => {
    const newTc: TestCaseItem = {
      id: `tc-${Date.now()}`,
      input: "Input data...",
      expectedOutput: "Expected output data...",
      isHidden: false,
    };

    setSections((prev) =>
      prev.map((sec) => ({
        ...sec,
        codingQuestions: sec.codingQuestions.map((q) =>
          q.id === questionId
            ? { ...q, testCases: [...q.testCases, newTc] }
            : q
        ),
      }))
    );
  };

  const handleSaveFullTest = () => {
    if (!testTitle.trim()) {
      toast.error("Please provide a test title");
      return;
    }

    const fullTest: FullTestConfig = {
      id: `test-${Date.now()}`,
      title: testTitle,
      category: testCategory,
      difficulty: testDifficulty,
      targetPhase,
      targetCandidate,
      totalDurationMinutes: Number(totalDurationMinutes),
      passingScorePercentage: Number(passingScorePercentage),
      scheduledWindowStart: windowStart,
      scheduledWindowEnd: windowEnd,
      retakeAllowed,
      proctoringConfig: {
        webcamRequired,
        fullscreenEnforced,
        tabSwitchLimit: Number(tabSwitchLimit),
        aiFaceDetection,
        copyPasteDisabled,
      },
      sections,
    };

    onSaveTest(fullTest);
    toast.success(`Exhaustive test "${testTitle}" configured and published to candidates!`);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 dark:bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-5xl h-[92vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-rose-500/40 shadow-2xl flex flex-col text-slate-900 dark:text-white overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 grid place-items-center text-white shadow-lg">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                  EXHAUSTIVE TEST ARCHITECT
                </span>
                <span className="text-xs text-slate-400 font-mono">Super Dream Track</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {testTitle || "Configure Diagnostic Assessment"}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-4 border-b border-white/10 text-xs font-semibold shrink-0 bg-slate-950/40">
          <button
            onClick={() => setActiveStep(1)}
            className={`py-3 px-4 flex items-center justify-center gap-2 transition border-b-2 ${
              activeStep === 1
                ? "border-rose-500 text-rose-400 bg-rose-500/10 font-bold"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <span className="w-5 h-5 rounded-full border border-current grid place-items-center text-[10px]">1</span>
            <span>Security & Policy</span>
          </button>

          <button
            onClick={() => setActiveStep(2)}
            className={`py-3 px-4 flex items-center justify-center gap-2 transition border-b-2 ${
              activeStep === 2
                ? "border-rose-500 text-rose-400 bg-rose-500/10 font-bold"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <span className="w-5 h-5 rounded-full border border-current grid place-items-center text-[10px]">2</span>
            <span>Section Structure</span>
          </button>

          <button
            onClick={() => setActiveStep(3)}
            className={`py-3 px-4 flex items-center justify-center gap-2 transition border-b-2 ${
              activeStep === 3
                ? "border-rose-500 text-rose-400 bg-rose-500/10 font-bold"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <span className="w-5 h-5 rounded-full border border-current grid place-items-center text-[10px]">3</span>
            <span>Questions & Testcases</span>
          </button>

          <button
            onClick={() => setActiveStep(4)}
            className={`py-3 px-4 flex items-center justify-center gap-2 transition border-b-2 ${
              activeStep === 4
                ? "border-rose-500 text-rose-400 bg-rose-500/10 font-bold"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <span className="w-5 h-5 rounded-full border border-current grid place-items-center text-[10px]">4</span>
            <span>Review & Publish</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: IDENTITY, TIMINGS & PROCTORING POLICY */}
          {activeStep === 1 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                  <FileText className="w-4 h-4 text-rose-400" />
                  Assessment Meta & Scheduling
                </h3>

                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-300 font-medium">Test Title *</label>
                  <input
                    type="text"
                    required
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-400 font-medium text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Category</label>
                    <input
                      type="text"
                      value={testCategory}
                      onChange={(e) => setTestCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Difficulty</label>
                    <select
                      value={testDifficulty}
                      onChange={(e) => setTestDifficulty(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-400"
                    >
                      <option value="Super Dream (FAANG)">Super Dream (FAANG)</option>
                      <option value="Expert">Expert Tier</option>
                      <option value="Advanced">Advanced Tier</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Trajectory Phase</label>
                    <select
                      value={targetPhase}
                      onChange={(e) => setTargetPhase(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-400"
                    >
                      <option value={1}>Phase 01 (Core Foundations)</option>
                      <option value={2}>Phase 02 (Distributed Systems)</option>
                      <option value={3}>Phase 03 (High Concurrency)</option>
                      <option value={4}>Phase 04 (FAANG Offers)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Total Duration (Minutes)</label>
                    <input
                      type="number"
                      value={totalDurationMinutes}
                      onChange={(e) => setTotalDurationMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Passing Score Cutoff (%)</label>
                    <input
                      type="number"
                      value={passingScorePercentage}
                      onChange={(e) => setPassingScorePercentage(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Target Candidate Group</label>
                    <select
                      value={targetCandidate}
                      onChange={(e) => setTargetCandidate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-400"
                    >
                      <option value="all">All Cohort Candidates (2026 Batch)</option>
                      <option value="std-1">Candidate 1 (Phase 2)</option>
                      <option value="std-2">Candidate 2 (Phase 2)</option>
                      <option value="std-3">Candidate 3 (Phase 1)</option>
                      <option value="std-4">Candidate 4 (Phase 3)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Schedule Window Starts</label>
                    <input
                      type="datetime-local"
                      value={windowStart}
                      onChange={(e) => setWindowStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-medium">Schedule Window Closes</label>
                    <input
                      type="datetime-local"
                      value={windowEnd}
                      onChange={(e) => setWindowEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-rose-400"
                    />
                  </div>
                </div>
              </div>

              {/* Proctoring & Exam Integrity Policy */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    AI Anti-Cheating & Proctoring Rules
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                    ENTERPRISE SECURITY
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
                    <div className="space-y-0.5 pr-2">
                      <p className="font-bold text-white">Mandatory Movable Camera PiP</p>
                      <p className="text-[11px] text-slate-400">Requires candidate video feed preview on screen</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={webcamRequired}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setWebcamRequired(checked);
                        if (!checked) setAiFaceDetection(false);
                      }}
                      className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400"
                    />
                  </label>

                  <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
                    <div className="space-y-0.5 pr-2">
                      <p className="font-bold text-white">Strict Fullscreen Lockout</p>
                      <p className="text-[11px] text-slate-400">Blocks window resize or exiting fullscreen</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={fullscreenEnforced}
                      onChange={(e) => setFullscreenEnforced(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400"
                    />
                  </label>

                  <label className={`p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700 ${!webcamRequired ? "opacity-50 pointer-events-none" : ""}`}>
                    <div className="space-y-0.5 pr-2">
                      <p className="font-bold text-white">AI Multi-Face & Object Detection</p>
                      <p className="text-[11px] text-slate-400">Detects mobile phones and secondary persons</p>
                    </div>
                    <input
                      type="checkbox"
                      disabled={!webcamRequired}
                      checked={aiFaceDetection && webcamRequired}
                      onChange={(e) => setAiFaceDetection(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400"
                    />
                  </label>

                  <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
                    <div className="space-y-0.5 pr-2">
                      <p className="font-bold text-white">Copy-Paste & Clipboard Lockout</p>
                      <p className="text-[11px] text-slate-400">Prevents pasting external solutions into editor</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={copyPasteDisabled}
                      onChange={(e) => setCopyPasteDisabled(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400"
                    />
                  </label>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="space-y-0.5 pr-2">
                      <p className="font-bold text-white">Tab Switch Strike Limit</p>
                      <p className="text-[11px] text-slate-400">Max tab switches before disqualification</p>
                    </div>
                    <select
                      value={tabSwitchLimit}
                      onChange={(e) => setTabSwitchLimit(Number(e.target.value))}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white cursor-pointer"
                    >
                      <option value={1}>1 Strike (Strict)</option>
                      <option value={2}>2 Strikes</option>
                      <option value={3}>3 Strikes (Standard)</option>
                      <option value={5}>5 Strikes (Lenient)</option>
                      <option value={999}>Unlimited</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SECTION STRUCTURE */}
          {activeStep === 2 && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-rose-400" />
                    Configured Assessment Sections ({sections.length})
                  </h3>
                  <p className="text-xs text-slate-400">Define sections, time limits, and question types.</p>
                </div>

                <button
                  onClick={handleAddSection}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Section
                </button>
              </div>

              <div className="space-y-4">
                {sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                          Section {String.fromCharCode(65 + idx)}
                        </span>
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSections((prev) =>
                              prev.map((s, i) => (i === idx ? { ...s, title: val } : s))
                            );
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-bold w-64 sm:w-80"
                        />
                      </div>

                      <button
                        onClick={() => handleDeleteSection(idx)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete Section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="text-slate-400 font-medium">Question Format Type</label>
                        <select
                          value={sec.type}
                          onChange={(e) => {
                            const t = e.target.value as any;
                            setSections((prev) =>
                              prev.map((s, i) => (i === idx ? { ...s, type: t } : s))
                            );
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                        >
                          <option value="mcq">Multiple Choice MCQ Questions</option>
                          <option value="coding">Live Code Sandbox & Hidden Testcases</option>
                          <option value="architecture_descriptive">Architecture & Design Case Study</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-400 font-medium">Allocated Time (Minutes)</label>
                        <input
                          type="number"
                          value={sec.timeLimitMinutes}
                          onChange={(e) => {
                            const mins = Number(e.target.value);
                            setSections((prev) =>
                              prev.map((s, i) => (i === idx ? { ...s, timeLimitMinutes: mins } : s))
                            );
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-400 font-medium">Total Questions</label>
                        <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-mono font-bold">
                          {sec.type === "mcq" ? sec.mcqQuestions.length : sec.codingQuestions.length} Questions
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: QUESTIONS & TESTCASES / PDF UPLOADER */}
          {activeStep === 3 && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Section Selector Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {sections.map((sec, idx) => (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSectionIndex(idx)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 border ${
                      activeSectionIndex === idx
                        ? "bg-rose-600/20 text-rose-300 border-rose-500/40 shadow-sm"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>Section {String.fromCharCode(65 + idx)}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 uppercase font-mono">
                      {sec.type}
                    </span>
                  </button>
                ))}
              </div>

              {/* CURRENT SECTION QUESTIONS BUILDER */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      {currentSection.title}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {currentSection.type === "mcq"
                        ? "Define multiple-choice questions with answer keys and score weights."
                        : "Upload problem PDF, specify allowed languages, and build hidden testcase suite."}
                    </p>
                  </div>

                  <button
                    onClick={
                      currentSection.type === "mcq"
                        ? handleAddMcqQuestion
                        : handleAddCodingQuestion
                    }
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-amber-600 hover:opacity-95 text-white transition flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />{" "}
                    {currentSection.type === "mcq" ? "Add MCQ Question" : "Add Coding Problem"}
                  </button>
                </div>

                {/* MCQ BUILDER */}
                {currentSection.type === "mcq" && (
                  <div className="space-y-6">
                    {currentSection.mcqQuestions.map((q, qIdx) => (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-rose-300">
                            Question {qIdx + 1}
                          </span>
                          <button
                            onClick={() => {
                              setSections((prev) =>
                                prev.map((s, sIdx) =>
                                  sIdx === activeSectionIndex
                                    ? {
                                        ...s,
                                        mcqQuestions: s.mcqQuestions.filter(
                                          (item) => item.id !== q.id
                                        ),
                                      }
                                    : s
                                )
                              );
                            }}
                            className="text-xs text-rose-400 hover:underline"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <label className="text-slate-300 font-medium">Question Text *</label>
                          <textarea
                            rows={2}
                            value={q.question}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSections((prev) =>
                                prev.map((s, sIdx) =>
                                  sIdx === activeSectionIndex
                                    ? {
                                        ...s,
                                        mcqQuestions: s.mcqQuestions.map((item) =>
                                          item.id === q.id ? { ...item, question: val } : item
                                        ),
                                      }
                                    : s
                                )
                              );
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white resize-none"
                          />
                        </div>

                        <div className="space-y-2 text-xs">
                          <label className="text-slate-300 font-medium">Options (Select radio for Correct Answer):</label>
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={q.correctOptionIndex === optIdx}
                                onChange={() => {
                                  setSections((prev) =>
                                    prev.map((s, sIdx) =>
                                      sIdx === activeSectionIndex
                                        ? {
                                            ...s,
                                            mcqQuestions: s.mcqQuestions.map((item) =>
                                              item.id === q.id
                                                ? { ...item, correctOptionIndex: optIdx }
                                                : item
                                            ),
                                          }
                                        : s
                                    )
                                  );
                                }}
                                className="text-emerald-500 focus:ring-emerald-400"
                              />
                              <span className="font-mono text-slate-400 w-6">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const newOpts = [...q.options];
                                  newOpts[optIdx] = val;
                                  setSections((prev) =>
                                    prev.map((s, sIdx) =>
                                      sIdx === activeSectionIndex
                                        ? {
                                            ...s,
                                            mcqQuestions: s.mcqQuestions.map((item) =>
                                              item.id === q.id
                                                ? { ...item, options: newOpts }
                                                : item
                                            ),
                                          }
                                        : s
                                    )
                                  );
                                }}
                                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                          <div className="space-y-1">
                            <label className="text-slate-400 font-medium">Marks (+Correct / -Incorrect)</label>
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400 font-bold">+{q.positiveMarks}</span>
                              <span className="text-rose-400 font-bold">-{q.negativeMarks}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-slate-400 font-medium">Explanation</label>
                            <input
                              type="text"
                              value={q.explanation}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSections((prev) =>
                                  prev.map((s, sIdx) =>
                                    sIdx === activeSectionIndex
                                      ? {
                                          ...s,
                                          mcqQuestions: s.mcqQuestions.map((item) =>
                                            item.id === q.id
                                              ? { ...item, explanation: val }
                                              : item
                                          ),
                                        }
                                      : s
                                  )
                                );
                              }}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* CODING PROBLEM BUILDER WITH PDF UPLOADER */}
                {currentSection.type === "coding" && (
                  <div className="space-y-6">
                    {currentSection.codingQuestions.map((q, codeIdx) => (
                      <div
                        key={q.id}
                        className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Code2 className="w-4 h-4 text-cyan-400" />
                            <span className="font-bold text-sm text-white">
                              Problem {codeIdx + 1}: {q.title}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setSections((prev) =>
                                prev.map((s, sIdx) =>
                                  sIdx === activeSectionIndex
                                    ? {
                                        ...s,
                                        codingQuestions: s.codingQuestions.filter(
                                          (item) => item.id !== q.id
                                        ),
                                      }
                                    : s
                                )
                              );
                            }}
                            className="text-xs text-rose-400 hover:underline"
                          >
                            Remove Problem
                          </button>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <label className="text-slate-300 font-medium">Problem Title *</label>
                          <input
                            type="text"
                            value={q.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSections((prev) =>
                                prev.map((s, sIdx) =>
                                  sIdx === activeSectionIndex
                                    ? {
                                        ...s,
                                        codingQuestions: s.codingQuestions.map((item) =>
                                          item.id === q.id ? { ...item, title: val } : item
                                        ),
                                      }
                                    : s
                                )
                              );
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                          />
                        </div>

                        {/* PDF Upload Zone for Questions & Specifications */}
                        <div className="p-4 rounded-xl bg-slate-950 border-2 border-dashed border-indigo-500/40 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                              <Upload className="w-4 h-4" />
                              <span>Upload Problem & Testcase Specification (PDF)</span>
                            </div>
                            {q.attachedPdfName && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Attached: {q.attachedPdfName} ({q.attachedPdfSize})
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400">
                            Upload problem description, input/output schemas, architectural constraints, and testcase files in PDF format.
                          </p>

                          <input
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={(e) => handleFileUploadMock(q.id, e)}
                            className="block w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <label className="text-slate-300 font-medium">Problem Statement</label>
                          <textarea
                            rows={3}
                            value={q.problemStatement}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSections((prev) =>
                                prev.map((s, sIdx) =>
                                  sIdx === activeSectionIndex
                                    ? {
                                        ...s,
                                        codingQuestions: s.codingQuestions.map((item) =>
                                          item.id === q.id
                                            ? { ...item, problemStatement: val }
                                            : item
                                        ),
                                      }
                                    : s
                                )
                              );
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white resize-none"
                          />
                        </div>

                        {/* Allowed Languages */}
                        <div className="space-y-1.5 text-xs">
                          <label className="text-slate-300 font-medium">Allowed Execution Languages</label>
                          <div className="flex flex-wrap gap-2">
                            {["C++", "Java", "Python", "Go", "Rust", "TypeScript", "SQL"].map((lang) => {
                              const isSelected = q.allowedLanguages.includes(lang);
                              return (
                                <button
                                  key={lang}
                                  type="button"
                                  onClick={() => {
                                    const nextLangs = isSelected
                                      ? q.allowedLanguages.filter((l) => l !== lang)
                                      : [...q.allowedLanguages, lang];
                                    setSections((prev) =>
                                      prev.map((s, sIdx) =>
                                        sIdx === activeSectionIndex
                                          ? {
                                              ...s,
                                              codingQuestions: s.codingQuestions.map((item) =>
                                                item.id === q.id
                                                  ? { ...item, allowedLanguages: nextLangs }
                                                  : item
                                              ),
                                            }
                                          : s
                                      )
                                    );
                                  }}
                                  className={`px-3 py-1 rounded-lg font-mono font-bold border transition text-xs ${
                                    isSelected
                                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                                      : "bg-slate-950 text-slate-500 border-slate-800"
                                  }`}
                                >
                                  {lang}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Test Cases Builder */}
                        <div className="space-y-3 pt-3 border-t border-white/10">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>Evaluation Test Cases ({q.testCases.length})</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                (Visible + Hidden Suite)
                              </span>
                            </label>

                            <button
                              onClick={() => handleAddTestCase(q.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 border border-indigo-500/40 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add Testcase
                            </button>
                          </div>

                          <div className="space-y-3">
                            {q.testCases.map((tc, tcIdx) => (
                              <div
                                key={tc.id}
                                className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-slate-300">
                                      Testcase #{tcIdx + 1}
                                    </span>
                                    <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={tc.isHidden}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          setSections((prev) =>
                                            prev.map((s, sIdx) =>
                                              sIdx === activeSectionIndex
                                                ? {
                                                    ...s,
                                                    codingQuestions: s.codingQuestions.map((item) =>
                                                      item.id === q.id
                                                        ? {
                                                            ...item,
                                                            testCases: item.testCases.map((t) =>
                                                              t.id === tc.id
                                                                ? { ...t, isHidden: checked }
                                                                : t
                                                            ),
                                                          }
                                                        : item
                                                    ),
                                                  }
                                                : s
                                            )
                                          );
                                        }}
                                        className="rounded text-amber-500"
                                      />
                                      <span>Hidden from Candidate</span>
                                    </label>
                                  </div>

                                  <button
                                    onClick={() => {
                                      setSections((prev) =>
                                        prev.map((s, sIdx) =>
                                          sIdx === activeSectionIndex
                                            ? {
                                                ...s,
                                                codingQuestions: s.codingQuestions.map((item) =>
                                                  item.id === q.id
                                                    ? {
                                                        ...item,
                                                        testCases: item.testCases.filter(
                                                          (t) => t.id !== tc.id
                                                        ),
                                                      }
                                                    : item
                                                ),
                                              }
                                            : s
                                        )
                                      );
                                    }}
                                    className="text-rose-400 hover:underline text-[11px]"
                                  >
                                    Delete
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-[10px] text-slate-400">Standard Input (stdin):</span>
                                    <textarea
                                      rows={2}
                                      value={tc.input}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSections((prev) =>
                                          prev.map((s, sIdx) =>
                                            sIdx === activeSectionIndex
                                              ? {
                                                  ...s,
                                                  codingQuestions: s.codingQuestions.map((item) =>
                                                    item.id === q.id
                                                      ? {
                                                          ...item,
                                                          testCases: item.testCases.map((t) =>
                                                            t.id === tc.id
                                                              ? { ...t, input: val }
                                                              : t
                                                          ),
                                                        }
                                                      : item
                                                  ),
                                                }
                                              : s
                                          )
                                        );
                                      }}
                                      className="w-full p-1.5 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] text-cyan-300"
                                    />
                                  </div>

                                  <div>
                                    <span className="text-[10px] text-slate-400">Expected Output (stdout):</span>
                                    <textarea
                                      rows={2}
                                      value={tc.expectedOutput}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setSections((prev) =>
                                          prev.map((s, sIdx) =>
                                            sIdx === activeSectionIndex
                                              ? {
                                                  ...s,
                                                  codingQuestions: s.codingQuestions.map((item) =>
                                                    item.id === q.id
                                                      ? {
                                                          ...item,
                                                          testCases: item.testCases.map((t) =>
                                                            t.id === tc.id
                                                              ? { ...t, expectedOutput: val }
                                                              : t
                                                          ),
                                                        }
                                                      : item
                                                  ),
                                                }
                                              : s
                                          )
                                        );
                                      }}
                                      className="w-full p-1.5 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] text-emerald-300"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & PUBLISH */}
          {activeStep === 4 && (
            <div className="space-y-6 max-w-3xl mx-auto text-xs">
              <div className="p-5 rounded-2xl bg-slate-950 border border-rose-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-rose-400 font-mono">
                      {testDifficulty}
                    </span>
                    <h3 className="text-base font-bold text-white">{testTitle}</h3>
                    <p className="text-slate-400 mt-0.5">Category: {testCategory} • Target Phase 0{targetPhase}</p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                    Pass: {passingScorePercentage}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-slate-400">Total Duration</p>
                    <p className="text-base font-black text-white font-mono">{totalDurationMinutes} Mins</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-slate-400">Sections Configured</p>
                    <p className="text-base font-black text-cyan-300 font-mono">{sections.length} Sections</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-slate-400">Proctoring AI Shield</p>
                    <p className="text-base font-black text-amber-400 font-mono">
                      {webcamRequired ? "Enabled (PiP)" : "Standard"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-white">Section Breakdown:</h4>
                  {sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-white">{sec.title}</p>
                        <p className="text-slate-400 text-[11px]">
                          Format: <span className="uppercase text-indigo-300">{sec.type}</span> • {sec.timeLimitMinutes} Mins allocated
                        </p>
                      </div>
                      <span className="text-slate-300 font-mono font-bold">
                        {sec.type === "mcq"
                          ? `${sec.mcqQuestions.length} MCQs`
                          : `${sec.codingQuestions.length} Coding Problems`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-slate-950/80 shrink-0">
          <button
            type="button"
            onClick={() => setActiveStep((prev) => Math.max(1, prev - 1) as any)}
            disabled={activeStep === 1}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Previous Step
          </button>

          <div className="flex items-center gap-3">
            {activeStep < 4 ? (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => Math.min(4, prev + 1) as any)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-amber-600 hover:opacity-95 text-white transition flex items-center gap-1.5 shadow-lg shadow-rose-500/20 cursor-pointer"
              >
                <span>Continue to Step {activeStep + 1}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveFullTest}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-500 hover:opacity-95 text-white transition flex items-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Publish Test to Super Dream Candidates</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
