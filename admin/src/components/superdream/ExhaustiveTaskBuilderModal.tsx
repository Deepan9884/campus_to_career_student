import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Compass,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Layers,
  FileCode,
  Award,
  Calendar,
  Clock,
  ShieldCheck,
  Target,
} from "lucide-react";
import { toast } from "sonner";

export interface PhasedTaskConfig {
  id: string;
  title: string;
  category: "DSA" | "System Design" | "Project" | "Hackathon" | "Research" | "Core Engineering";
  phase: 1 | 2 | 3 | 4;
  description: string;
  targetCandidateId: "all" | string;
  assignedBy: string;
  assignedDate: string;
  dueDate: string;
  gracePeriodDays: number;
  priority: "High" | "Urgent" | "Normal";
  status: "pending" | "in_review" | "completed";
  requiredDeliverables: {
    githubRepo: boolean;
    liveDemoUrl: boolean;
    architecturePdf: boolean;
    benchmarkSuite: boolean;
  };
  performanceBenchmarks: {
    minThroughputQps?: number;
    maxLatencyP99Ms?: number;
    zeroMemoryLeaksRequired: boolean;
  };
  rubricWeights: {
    architecturePct: number;
    performancePct: number;
    codeQualityPct: number;
  };
  attachedSpecPdfName?: string;
  attachedSpecPdfSize?: string;
}

interface ExhaustiveTaskBuilderModalProps {
  open: boolean;
  onClose: () => void;
  onSaveTask: (task: PhasedTaskConfig) => void;
}

export function ExhaustiveTaskBuilderModal({
  open,
  onClose,
  onSaveTask,
}: ExhaustiveTaskBuilderModalProps) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCategory, setTaskCategory] = useState<PhasedTaskConfig["category"]>("DSA");
  const [taskPhase, setTaskPhase] = useState<1 | 2 | 3 | 4>(1);
  const [taskDueDate, setTaskDueDate] = useState("");
  const [gracePeriodDays, setGracePeriodDays] = useState(0);
  const [taskPriority, setTaskPriority] = useState<"High" | "Urgent" | "Normal">("Normal");
  const [targetCandidateId, setTargetCandidateId] = useState("all");
  const [taskDesc, setTaskDesc] = useState("");

  // Deliverables checklist
  const [reqGithub, setReqGithub] = useState(true);
  const [reqLiveDemo, setReqLiveDemo] = useState(false);
  const [reqArchPdf, setReqArchPdf] = useState(false);
  const [reqBenchmarkSuite, setReqBenchmarkSuite] = useState(false);

  // Benchmarks
  const [minQps, setMinQps] = useState(0);
  const [maxLatencyP99, setMaxLatencyP99] = useState(0);
  const [zeroLeaks, setZeroLeaks] = useState(false);

  // Rubric weights
  const [archPct, setArchPct] = useState(40);
  const [perfPct, setPerfPct] = useState(30);
  const [codeQualityPct, setCodeQualityPct] = useState(30);

  // Attached spec
  const [attachedPdfName, setAttachedPdfName] = useState<string | undefined>(undefined);
  const [attachedPdfSize, setAttachedPdfSize] = useState<string | undefined>(undefined);

  if (!open) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedPdfName(file.name);
      setAttachedPdfSize(`${(file.size / 1024 / 1024).toFixed(2)} MB`);
      toast.success(`Attached specification PDF: ${file.name}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      toast.error("Please enter task title");
      return;
    }

    const newTask: PhasedTaskConfig = {
      id: `task-${Date.now()}`,
      title: taskTitle,
      category: taskCategory,
      phase: taskPhase,
      description: taskDesc,
      targetCandidateId,
      assignedBy: "Faculty Mentor",
      assignedDate: new Date().toISOString().split("T")[0],
      dueDate: taskDueDate,
      gracePeriodDays: Number(gracePeriodDays),
      priority: taskPriority,
      status: "pending",
      requiredDeliverables: {
        githubRepo: reqGithub,
        liveDemoUrl: reqLiveDemo,
        architecturePdf: reqArchPdf,
        benchmarkSuite: reqBenchmarkSuite,
      },
      performanceBenchmarks: {
        minThroughputQps: Number(minQps),
        maxLatencyP99Ms: Number(maxLatencyP99),
        zeroMemoryLeaksRequired: zeroLeaks,
      },
      rubricWeights: {
        architecturePct: Number(archPct),
        performancePct: Number(perfPct),
        codeQualityPct: Number(codeQualityPct),
      },
      attachedSpecPdfName: attachedPdfName,
      attachedSpecPdfSize: attachedPdfSize,
    };

    onSaveTask(newTask);
    toast.success(`Task "${taskTitle}" assigned to Phase 0${taskPhase}!`);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 dark:bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-4xl max-h-[92vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/40 shadow-2xl flex flex-col text-slate-900 dark:text-white overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 grid place-items-center text-white shadow-lg">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                PHASED TRAJECTORY DELIVERABLE ARCHITECT
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Assign High-Impact Milestone Deliverable
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Task Identity & Trajectory Phase
            </h3>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Deliverable Title *</label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Trajectory Phase</label>
                <select
                  value={taskPhase}
                  onChange={(e) => setTaskPhase(Number(e.target.value) as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                >
                  <option value={1}>Phase 01: Core CS Foundations (15-20 LPA)</option>
                  <option value={2}>Phase 02: Distributed Systems (20-30 LPA)</option>
                  <option value={3}>Phase 03: High Concurrency (30-40 LPA)</option>
                  <option value={4}>Phase 04: FAANG Master Tier (40+ LPA)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Category</label>
                <select
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="System Design">System Design</option>
                  <option value="DSA">DSA</option>
                  <option value="Core Engineering">Core Engineering</option>
                  <option value="Project">Project Deliverable</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Research">Research & Whitepaper</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Priority Level</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="Urgent">Urgent Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Normal">Normal Priority</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Target Assignee</label>
                <select
                  value={targetCandidateId}
                  onChange={(e) => setTargetCandidateId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="all">Entire Super Dream Cohort (Batch 2026)</option>
                  <option value="std-1">Candidate 1 (Phase 2)</option>
                  <option value="std-2">Candidate 2 (Phase 2)</option>
                  <option value="std-3">Candidate 3 (Phase 1)</option>
                  <option value="std-4">Candidate 4 (Phase 3)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Grace Period (Days)</label>
                <input
                  type="number"
                  value={gracePeriodDays}
                  onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Deliverable Description & Technical Expectations</label>
              <textarea
                rows={3}
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white resize-none"
              />
            </div>
          </div>

          {/* Section 2: PDF Specification Attachment */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-300 font-bold">
                <Upload className="w-4 h-4" />
                <span>Attach Problem Specification / Architecture Whitepaper (PDF)</span>
              </div>
              {attachedPdfName && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  Attached: {attachedPdfName} ({attachedPdfSize})
                </span>
              )}
            </div>
            <p className="text-slate-400 text-[11px]">
              Attach complete design requirements, RFC specifications, and benchmark targets for the candidate to reference.
            </p>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileUpload}
              className="block w-full text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
            />
          </div>

          {/* Section 3: Required Deliverables Checklist */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Candidate Required Submission Deliverables
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
                <div>
                  <p className="font-bold text-white">GitHub Repository Link</p>
                  <p className="text-[11px] text-slate-400">Clean code with commit history</p>
                </div>
                <input
                  type="checkbox"
                  checked={reqGithub}
                  onChange={(e) => setReqGithub(e.target.checked)}
                  className="rounded text-indigo-500"
                />
              </label>

              <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
                <div>
                  <p className="font-bold text-white">Live Demo / Deployed API</p>
                  <p className="text-[11px] text-slate-400">Publicly accessible endpoint</p>
                </div>
                <input
                  type="checkbox"
                  checked={reqLiveDemo}
                  onChange={(e) => setReqLiveDemo(e.target.checked)}
                  className="rounded text-indigo-500"
                />
              </label>

              <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
                <div>
                  <p className="font-bold text-white">Architecture Design PDF</p>
                  <p className="text-[11px] text-slate-400">System diagrams & sequence flows</p>
                </div>
                <input
                  type="checkbox"
                  checked={reqArchPdf}
                  onChange={(e) => setReqArchPdf(e.target.checked)}
                  className="rounded text-indigo-500"
                />
              </label>

              <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
                <div>
                  <p className="font-bold text-white">Benchmark & Test Suite</p>
                  <p className="text-[11px] text-slate-400">JMH / Pytest with coverage</p>
                </div>
                <input
                  type="checkbox"
                  checked={reqBenchmarkSuite}
                  onChange={(e) => setReqBenchmarkSuite(e.target.checked)}
                  className="rounded text-indigo-500"
                />
              </label>
            </div>
          </div>

          {/* Section 4: Performance Benchmarks & Scoring Rubric */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <Award className="w-4 h-4 text-amber-400" />
              Quantitative Benchmarks & Evaluation Rubric
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Min Throughput (QPS)</label>
                <input
                  type="number"
                  value={minQps}
                  onChange={(e) => setMinQps(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Max p99 Latency (ms)</label>
                <input
                  type="number"
                  step="0.1"
                  value={maxLatencyP99}
                  onChange={(e) => setMaxLatencyP99(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">AddressSanitizer Leak Check</label>
                <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-bold">
                  Zero Leaks Mandated
                </div>
              </div>
            </div>

            {/* Rubric Weights */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-slate-400">Architecture Weight</p>
                <p className="text-base font-black text-indigo-400 font-mono mt-0.5">{archPct}%</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-slate-400">Performance Weight</p>
                <p className="text-base font-black text-cyan-400 font-mono mt-0.5">{perfPct}%</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-slate-400">Code Quality & Tests</p>
                <p className="text-base font-black text-emerald-400 font-mono mt-0.5">{codeQualityPct}%</p>
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-95 text-white font-bold cursor-pointer shadow-lg shadow-indigo-500/25"
            >
              Publish & Assign Phased Task
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
