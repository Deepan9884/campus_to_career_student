import React, { useState } from "react";
import {
  X,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  Clock,
  Code2,
  Play,
  Award,
  Sparkles,
  ShieldCheck,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSuperDream } from "@/stores/superDreamStore";
import {
  PROGRAMMING_LANGUAGES_CURRICULUM,
  type LanguageQuizData,
} from "@/lib/super-dream-languages-data";
import { toast } from "sonner";

interface LanguageProgressDrawerModalProps {
  open: boolean;
  onClose: () => void;
  skillId: string;
  skillName: string;
  onOpenQuiz: () => void;
  onOpenPractice?: () => void;
}

export function LanguageProgressDrawerModal({
  open,
  onClose,
  skillId,
  skillName,
  onOpenQuiz,
  onOpenPractice,
}: LanguageProgressDrawerModalProps) {
  const {
    studentChecklist,
    updateLanguageTracking,
    toggleLanguageSubtopic,
    markLanguageLinkVisited,
    updateSkillStatus,
  } = useSuperDream();

  const currentItem = studentChecklist.section1Programming.find((s) => s.id === skillId);
  const quizData: LanguageQuizData =
    PROGRAMMING_LANGUAGES_CURRICULUM[skillId] || PROGRAMMING_LANGUAGES_CURRICULUM["p-1"];

  const masteredSubtopics = currentItem?.subtopicsMastered || [];
  const visitedLinks = currentItem?.visitedLinks || [];
  const problemsSolved = currentItem?.problemsSolved || 0;
  const hoursSpent = currentItem?.hoursSpent || 0;
  const displayHours = typeof hoursSpent === "number" ? (hoursSpent % 1 === 0 ? `${hoursSpent}h` : `${hoursSpent.toFixed(1)}h`) : `${hoursSpent}h`;
  const bestScore = currentItem?.bestQuizScore || 0;
  const isMastered = currentItem?.status === "Mastered";

  const subtopicCompletionRate = Math.round(
    (masteredSubtopics.length / Math.max(1, quizData.subtopics.length)) * 100
  );

  const handleLinkClick = (type: "gfg" | "codechef" | "hackerrank" | "officialDocs", url: string) => {
    markLanguageLinkVisited(skillId, type);
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success(`Opened ${type.toUpperCase()} Learning Portal`, {
      description: "Resource access logged in your placement tracking profile.",
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-[#12161f] text-zinc-200 w-full max-w-3xl rounded-3xl border border-zinc-800/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-[#161c27] border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-zinc-100">{quizData.languageName}</h3>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[11px] font-medium border",
                    isMastered
                      ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/50"
                      : "bg-amber-950/40 text-amber-300 border-amber-800/50"
                  )}
                >
                  {currentItem?.status || "In Progress"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{quizData.targetLevel}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Free Learning Hubs Attached */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Free Learning Portals (GFG, CodeChef, HackerRank)
              </h4>
              <span className="text-[11px] text-zinc-500 font-mono">
                {visitedLinks.length}/3 Portals Explored
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* GeeksforGeeks */}
              <button
                onClick={() => handleLinkClick("gfg", quizData.learningLinks.gfg.url)}
                className="p-4 rounded-2xl bg-[#161c27]/70 hover:bg-[#1c2331] border border-zinc-800/80 hover:border-emerald-800/50 text-left transition group cursor-pointer shadow-2xs relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    GeeksforGeeks
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition" />
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {quizData.learningLinks.gfg.description}
                </p>
                {visitedLinks.includes("gfg") && (
                  <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-md">
                    <Check className="w-3 h-3" /> Visited
                  </span>
                )}
              </button>

              {/* CodeChef */}
              <button
                onClick={() => handleLinkClick("codechef", quizData.learningLinks.codechef.url)}
                className="p-4 rounded-2xl bg-[#161c27]/70 hover:bg-[#1c2331] border border-zinc-800/80 hover:border-amber-800/50 text-left transition group cursor-pointer shadow-2xs relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                    CodeChef
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 transition" />
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {quizData.learningLinks.codechef.description}
                </p>
                {visitedLinks.includes("codechef") && (
                  <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-md">
                    <Check className="w-3 h-3" /> Visited
                  </span>
                )}
              </button>

              {/* HackerRank */}
              <button
                onClick={() => handleLinkClick("hackerrank", quizData.learningLinks.hackerrank.url)}
                className="p-4 rounded-2xl bg-[#161c27]/70 hover:bg-[#1c2331] border border-zinc-800/80 hover:border-indigo-800/50 text-left transition group cursor-pointer shadow-2xs relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                    HackerRank
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-indigo-400 transition" />
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {quizData.learningLinks.hackerrank.description}
                </p>
                {visitedLinks.includes("hackerrank") && (
                  <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-medium text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2 py-0.5 rounded-md">
                    <Check className="w-3 h-3" /> Visited
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Activity & Counter Tracking Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Problems Solved */}
            <div className="p-4 rounded-2xl bg-[#161c27] border border-zinc-800/80 space-y-2">
              <span className="text-xs text-zinc-400 font-medium block">Problems Solved</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-zinc-100 font-mono">{problemsSolved}</span>
                <span className="text-[10px] text-zinc-500 font-mono">Practice Console</span>
              </div>
            </div>

            {/* Study / Practice Hours */}
            <div className="p-4 rounded-2xl bg-[#161c27] border border-zinc-800/80 space-y-2">
              <span className="text-xs text-zinc-400 font-medium block">Practice Hours</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-zinc-100 font-mono">{displayHours}</span>
                <span className="text-[10px] text-zinc-500 font-mono">Console Time</span>
              </div>
            </div>

            {/* Best Proctored Quiz Score */}
            <div className="p-4 rounded-2xl bg-[#161c27] border border-zinc-800/80 space-y-2">
              <span className="text-xs text-zinc-400 font-medium block">Proctored Score</span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-indigo-400 font-mono">
                  {bestScore > 0 ? `${bestScore}%` : "Not Taken"}
                </span>
                {bestScore >= 70 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Subtopics Checklist Tracking */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Subtopics & Competency Checkpoints
              </h4>
              <span className="text-xs font-mono text-zinc-300 font-medium">
                {subtopicCompletionRate}% Complete ({masteredSubtopics.length}/{quizData.subtopics.length})
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${subtopicCompletionRate}%` }}
              />
            </div>

            <div className="space-y-2">
              {quizData.subtopics.map((subtopic, idx) => {
                const isChecked = masteredSubtopics.includes(subtopic);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleLanguageSubtopic(skillId, subtopic)}
                    className={cn(
                      "w-full p-3 rounded-2xl border text-left text-xs transition cursor-pointer flex items-center justify-between gap-3",
                      isChecked
                        ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                        : "bg-[#161c27]/60 border-zinc-800/80 text-zinc-300 hover:bg-[#1c2331]"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition",
                          isChecked
                            ? "bg-emerald-600 border-emerald-500 text-white font-bold"
                            : "border-zinc-700 bg-zinc-900"
                        )}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span>{subtopic}</span>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-500">
                      {isChecked ? "Mastered" : "Click to mark done"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Student Practice Notes / Faculty Remarks */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Faculty Feedback & Practice Notes
            </label>
            <input
              type="text"
              defaultValue={currentItem?.facultyRemarks || ""}
              onBlur={(e) =>
                updateSkillStatus(skillId, currentItem?.status || "In Progress", e.target.value)
              }
              placeholder="e.g. Sound understanding of memory management and concurrency..."
              className="w-full px-4 py-2.5 rounded-2xl bg-[#161c27] border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 bg-[#161c27] border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "px-3 py-1.5 rounded-2xl text-xs font-medium border flex items-center gap-2",
                isMastered
                  ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-300"
                  : "bg-zinc-800/80 border-zinc-700/80 text-zinc-400"
              )}
            >
              {isMastered ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-amber-400" />}
              <span>Status: {isMastered ? "Mastered (Quiz Verified)" : "In Progress"}</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {onOpenPractice && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPractice();
                }}
                className="px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 text-xs font-medium transition flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span>Practice Coding</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenQuiz();
              }}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Launch 3-Section Quiz</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
