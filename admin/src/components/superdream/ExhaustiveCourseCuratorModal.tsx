import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  GraduationCap,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Award,
  Layers,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

export interface CourseWeekModule {
  weekNumber: number;
  title: string;
  subtopics: string[];
  estimatedHours: number;
  mandatoryReadingPaper?: string;
}

export interface FullCourseConfig {
  id: string;
  title: string;
  provider: string;
  instructor: string;
  duration: string;
  difficulty: "Advanced" | "Expert" | "Master";
  targetLpaTier: string;
  description: string;
  topics: string[];
  weeklyModules: CourseWeekModule[];
  verificationPolicy: {
    minSyllabusCoveragePct: number;
    mandatoryStudentNameMatch: boolean;
    requireCryptoSignature: boolean;
    tamperCheckMandatory: boolean;
  };
  status: "in_progress" | "completed" | "locked";
}

interface ExhaustiveCourseCuratorModalProps {
  open: boolean;
  onClose: () => void;
  onSaveCourse: (course: FullCourseConfig) => void;
}

export function ExhaustiveCourseCuratorModal({
  open,
  onClose,
  onSaveCourse,
}: ExhaustiveCourseCuratorModalProps) {
  const [courseTitle, setCourseTitle] = useState("");
  const [provider, setProvider] = useState("");
  const [instructor, setInstructor] = useState("");
  const [duration, setDuration] = useState("");
  const [difficulty, setDifficulty] = useState<"Advanced" | "Expert" | "Master">("Advanced");
  const [targetLpaTier, setTargetLpaTier] = useState("20+ LPA (Super Dream)");
  const [description, setDescription] = useState("");
  const [topicsString, setTopicsString] = useState("");

  // Verification Policy
  const [minSyllabusCoverage, setMinSyllabusCoverage] = useState(90);
  const [mandatoryNameMatch, setMandatoryNameMatch] = useState(true);
  const [requireCryptoSig, setRequireCryptoSig] = useState(true);
  const [tamperCheck, setTamperCheck] = useState(true);

  // Weekly breakdown
  const [weeklyModules, setWeeklyModules] = useState<CourseWeekModule[]>([]);

  if (!open) return null;

  const handleAddWeek = () => {
    const nextWeek: CourseWeekModule = {
      weekNumber: weeklyModules.length + 1,
      title: `Week 0${weeklyModules.length + 1}: Advanced Architectural Module`,
      subtopics: ["Core Concepts", "Implementation Lab"],
      estimatedHours: 6,
    };
    setWeeklyModules([...weeklyModules, nextWeek]);
  };

  const handleDeleteWeek = (index: number) => {
    setWeeklyModules(weeklyModules.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) {
      toast.error("Please enter course title");
      return;
    }

    const fullCourse: FullCourseConfig = {
      id: `course-${Date.now()}`,
      title: courseTitle,
      provider,
      instructor,
      duration,
      difficulty,
      targetLpaTier,
      description,
      topics: topicsString.split(",").map((t) => t.trim()).filter(Boolean),
      weeklyModules,
      verificationPolicy: {
        minSyllabusCoveragePct: Number(minSyllabusCoverage),
        mandatoryStudentNameMatch: mandatoryNameMatch,
        requireCryptoSignature: requireCryptoSig,
        tamperCheckMandatory: tamperCheck,
      },
      status: "in_progress",
    };

    onSaveCourse(fullCourse);
    toast.success(`Course "${courseTitle}" published to Super Dream curriculum!`);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 dark:bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-4xl max-h-[92vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-emerald-500/40 shadow-2xl flex flex-col text-slate-900 dark:text-white overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 grid place-items-center text-white shadow-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                CURRICULUM & PROOF VERIFICATION ARCHITECT
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Curate Verified Course & Set AI Proof Policy
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Course Meta */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Course Syllabus Metadata
            </h3>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Course Title *</label>
              <input
                type="text"
                required
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">University / Provider</label>
                <input
                  type="text"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Lead Instructors</label>
                <input
                  type="text"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Estimated Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="Master">Master Tier (Senior / Staff Benchmark)</option>
                  <option value="Expert">Expert Tier (FAANG SDE-2)</option>
                  <option value="Advanced">Advanced Tier (High-Yield Core)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Target Placement Package Tier</label>
                <input
                  type="text"
                  value={targetLpaTier}
                  onChange={(e) => setTargetLpaTier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Key Syllabus Topics (Comma separated)</label>
              <input
                type="text"
                value={topicsString}
                onChange={(e) => setTopicsString(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Course Description & Goals</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white resize-none"
              />
            </div>
          </div>

          {/* AI Certificate Verification Security Rules */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                AI Proof Verification Engine Rules
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                NEURAL OCR VALIDATION
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Min Syllabus Coverage (%)</span>
                  <span className="font-mono text-emerald-400 font-bold">{minSyllabusCoverage}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="100"
                  value={minSyllabusCoverage}
                  onChange={(e) => setMinSyllabusCoverage(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <label className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
                <div>
                  <p className="font-bold text-white">Strict Student Identity Match</p>
                  <p className="text-[11px] text-slate-400">Exact name matching against enrollment registry</p>
                </div>
                <input
                  type="checkbox"
                  checked={mandatoryNameMatch}
                  onChange={(e) => setMandatoryNameMatch(e.target.checked)}
                  className="rounded text-emerald-500"
                />
              </label>

              <label className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
                <div>
                  <p className="font-bold text-white">Public Cryptographic Ledger Check</p>
                  <p className="text-[11px] text-slate-400">Verifies credential ID against issuer public ledger</p>
                </div>
                <input
                  type="checkbox"
                  checked={requireCryptoSig}
                  onChange={(e) => setRequireCryptoSig(e.target.checked)}
                  className="rounded text-emerald-500"
                />
              </label>

              <label className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700">
                <div>
                  <p className="font-bold text-white">Anti-Tampering Pixel & EXIF Analysis</p>
                  <p className="text-[11px] text-slate-400">Detects digital forgery or metadata modification</p>
                </div>
                <input
                  type="checkbox"
                  checked={tamperCheck}
                  onChange={(e) => setTamperCheck(e.target.checked)}
                  className="rounded text-emerald-500"
                />
              </label>
            </div>
          </div>

          {/* Weekly Modules Breakdown */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Weekly Curriculum Schedule ({weeklyModules.length} Modules)
              </h3>

              <button
                type="button"
                onClick={handleAddWeek}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/50 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Week Module
              </button>
            </div>

            <div className="space-y-3">
              {weeklyModules.map((wm, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={wm.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWeeklyModules((prev) =>
                          prev.map((m, i) => (i === idx ? { ...m, title: val } : m))
                        );
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold w-72"
                    />

                    <button
                      type="button"
                      onClick={() => handleDeleteWeek(idx)}
                      className="text-rose-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400">Subtopics (Comma separated):</span>
                      <input
                        type="text"
                        value={wm.subtopics.join(", ")}
                        onChange={(e) => {
                          const val = e.target.value.split(",").map((s) => s.trim());
                          setWeeklyModules((prev) =>
                            prev.map((m, i) => (i === idx ? { ...m, subtopics: val } : m))
                          );
                        }}
                        className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 mt-1"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400">Mandatory Research Paper:</span>
                      <input
                        type="text"
                        value={wm.mandatoryReadingPaper || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWeeklyModules((prev) =>
                            prev.map((m, i) => (i === idx ? { ...m, mandatoryReadingPaper: val } : m))
                          );
                        }}
                        placeholder="e.g. Raft Consensus Whitepaper"
                        className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold cursor-pointer shadow-lg shadow-emerald-500/25"
            >
              Publish Course to Super Dream Track
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
