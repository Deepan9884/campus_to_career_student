import { formatMathText } from "../../lib/formatMathText";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Printer,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  Layers,
  Code2,
  HelpCircle,
  Shield,
  Maximize,
  Copy,
  Check,
  BookOpen,
  Terminal,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { ExamItem, ExamSectionData, McqQuestionData, CodingQuestionData } from "../../lib/admin-api";

interface QuestionPaperPreviewModalProps {
  open: boolean;
  onClose: () => void;
  exam: ExamItem | null;
}

// Helper to adapt LeetCode parameter inputs (e.g. nums = [1, 1, 2]) into standard stdin (1 1 2)
function cleanStdinInput(raw: any): string {
  if (!raw) return "";
  let str = String(raw).trim();
  str = str.replace(/^(?:Input\s*:\s*)+/i, "").trim();
  const varRegex = /(?:^|,|\n)\s*([a-zA-Z_]\w*)\s*=\s*(\[[^\]]*\]|'[^']*'|"[^"]*"|[^,\n]+)/g;
  const matches = [...str.matchAll(varRegex)];
  if (matches.length > 0) {
    const parts: string[] = [];
    for (const m of matches) {
      const val = m[2].trim();
      if (val.startsWith("[") && val.endsWith("]")) {
        const inner = val.slice(1, -1).trim();
        const items = inner.length > 0
          ? inner.split(",").map((x) => x.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean)
          : [];
        parts.push(items.join(" "));
      } else {
        parts.push(val.replace(/^['"]|['"]$/g, ""));
      }
    }
    return parts.join("\n");
  }
  if (str.startsWith("[") && str.endsWith("]")) {
    const inner = str.slice(1, -1).trim();
    const items = inner.length > 0
      ? inner.split(",").map((x) => x.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean)
      : [];
    return items.join(" ");
  }
  return String(raw).trim();
}

// Helper to sanitize expected output strings (e.g. "2, nums = [1,2,_]" -> "2")
function cleanExpectedOutput(raw: any): string {
  if (!raw) return "";
  let str = String(raw).trim();
  str = str.replace(/^(?:Output\s*:\s*)+/i, "").trim();
  str = str.replace(/,\s*[a-zA-Z_]\w*\s*=\s*\[[^\]]*\]/gi, "").trim();
  str = str.replace(/,\s*[a-zA-Z_]\w*\s*=\s*[^,\n\r]+/gi, "").trim();
  str = str.replace(/,\s*(?:where|with|hence|and)\b.*$/gi, "").trim();
  return str;
}

export function QuestionPaperPreviewModal({
  open,
  onClose,
  exam,
}: QuestionPaperPreviewModalProps) {
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  if (!open || !exam) return null;

  const sections = exam.sections || [];
  const activeSec = sections[activeSectionIdx] || sections[0];

  const totalMcqCount = sections.reduce(
    (acc, sec) => acc + (sec.type === "mcq" ? sec.mcqQuestions?.length || 0 : 0),
    0
  );
  const totalCodingCount = sections.reduce(
    (acc, sec) => acc + (sec.type === "coding" ? sec.codingQuestions?.length || 0 : 0),
    0
  );

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    toast.success("Code snippet copied to clipboard");
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto backdrop-blur-2xl"
      >
        {/* ── MODAL HEADER ─────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Official Question Paper Preview
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30">
                  {exam.examType?.toUpperCase() || "ASSESSMENT"} Paper
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Institutional examination blueprint, verified test cases, and marking scheme
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:white text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
              title="Print Question Paper"
            >
              <Printer className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Print Paper</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── QUESTION PAPER METADATA BANNER ───────────────────────────────── */}
        <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white">{exam.title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {exam.description || "Comprehensive Placement Assessment & Programming Competency Evaluation."}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Duration</span>
              <strong className="text-slate-900 dark:text-white font-bold">{exam.durationMinutes} Minutes</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Max Marks</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{exam.totalMarks} Marks</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Passing Mark</span>
              <strong className="text-indigo-600 dark:text-indigo-300 font-bold">{exam.passingScorePercentage}%</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Total Questions</span>
              <strong className="text-cyan-600 dark:text-cyan-400 font-bold">
                {totalMcqCount + totalCodingCount} Questions
              </strong>
            </div>
          </div>
        </div>

        {/* ── SECTION NAV TABS ─────────────────────────────────────────────── */}
        {sections.length > 1 && (
          <div className="px-6 py-2 bg-slate-50/50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
            {sections.map((sec, idx) => {
              const qCount =
                sec.type === "mcq"
                  ? sec.mcqQuestions?.length || 0
                  : sec.codingQuestions?.length || 0;
              return (
                <button
                  key={sec.sectionId || idx}
                  onClick={() => setActiveSectionIdx(idx)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                    activeSectionIdx === idx
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white dark:border-slate-800"
                  }`}
                >
                  {sec.type === "mcq" ? (
                    <HelpCircle className="h-3.5 w-3.5" />
                  ) : (
                    <Code2 className="h-3.5 w-3.5" />
                  )}
                  <span>
                    Section {idx + 1}: {sec.title} ({qCount})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── SECTION CONTENT BODY ─────────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs select-text">
          {/* Section Summary Header */}
          {activeSec && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {activeSec.title}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30">
                    {activeSec.type === "mcq" ? "Multiple Choice Questions" : "Hands-on Coding Arena"}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  Topics:{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {(activeSec.topics || []).join(", ") || "Core Competency"}
                  </strong>{" "}
                  • Time Allocation:{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {activeSec.timeLimitMinutes || 30} mins
                  </strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-800 shadow-xs">
                  Difficulty: {activeSec.difficulty?.toUpperCase() || "MEDIUM"}
                </span>
              </div>
            </div>
          )}

          {/* ── MCQ QUESTIONS RENDER ───────────────────────────────────────── */}
          {activeSec?.type === "mcq" && (
            <div className="space-y-4">
              {(activeSec.mcqQuestions || []).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  No MCQ questions present in this section.
                </div>
              ) : (
                (activeSec.mcqQuestions || []).map((q, qIdx) => (
                  <div
                    key={q.questionId || qIdx}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/90 space-y-4 shadow-xs"
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-600/30 dark:text-indigo-300 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-500/40">
                          {qIdx + 1}
                        </span>
                        <div className="space-y-2">
                          <p className="font-bold text-slate-900 dark:text-white text-sm whitespace-pre-wrap leading-relaxed">
                            {formatMathText(q.question)}
                          </p>
                          {q.imageUrl && (
                            <div className="mt-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 inline-block max-w-md">
                              <img
                                src={q.imageUrl}
                                alt="Question Diagram"
                                className="max-h-56 object-contain rounded-lg"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-500/30">
                          +{q.positiveMarks || 1} Mark
                        </span>
                        {q.negativeMarks > 0 && (
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 font-bold text-[10px] border border-rose-200 dark:border-rose-500/30">
                            -{q.negativeMarks} Neg
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Options 4-Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {(q.options || []).map((opt, oIdx) => {
                        const isCorrect = oIdx === q.correctOptionIndex;
                        const optionLabels = ["A", "B", "C", "D", "E"];
                        return (
                          <div
                            key={oIdx}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition ${
                              isCorrect
                                ? "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-500/50 dark:text-emerald-200 shadow-xs"
                                : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`w-5 h-5 rounded-md text-[10px] font-extrabold flex items-center justify-center shrink-0 ${
                                  isCorrect
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400"
                                }`}
                              >
                                {optionLabels[oIdx] || oIdx + 1}
                              </span>
                              <span className="truncate font-medium text-xs">
                                {formatMathText(opt)}
                              </span>
                            </div>
                            {isCorrect && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-500/30 dark:text-emerald-300 shrink-0 flex items-center gap-1 border border-emerald-300 dark:border-emerald-500/40">
                                <CheckCircle2 className="h-3 w-3" /> Correct Key
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Faculty Explanation / Solution Notes */}
                    {q.explanation && (
                      <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 space-y-1">
                        <span className="text-[10px] uppercase font-black tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-indigo-600 dark:text-indigo-400" /> Faculty Technical Explanation
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                          {formatMathText(q.explanation)}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── CODING QUESTIONS RENDER ────────────────────────────────────── */}
          {activeSec?.type === "coding" && (
            <div className="space-y-6">
              {(activeSec.codingQuestions || []).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  No coding challenges present in this section.
                </div>
              ) : (
                (activeSec.codingQuestions || []).map((code, cIdx) => (
                  <div
                    key={code.id || cIdx}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/90 space-y-4 shadow-xs"
                  >
                    {/* Challenge Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                          #{cIdx + 1}
                        </span>
                        <div>
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {formatMathText(code.title)}
                          </h3>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            Category: {code.category || "Algorithms"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 font-bold text-[10px] dark:border-amber-500/30">
                          {code.difficulty}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold text-[10px] dark:border-emerald-500/30">
                          {code.marks || 10} Marks
                        </span>
                      </div>
                    </div>

                    {/* Problem Statement */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 tracking-wider">
                        Problem Statement
                      </span>
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed font-sans text-xs whitespace-pre-wrap">
                        {formatMathText(code.problemStatement)}
                      </div>
                    </div>

                    {/* I/O Specifications & Constraints */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                          Input Format
                        </span>
                        <p className="text-slate-800 dark:text-slate-300 text-xs font-mono">
                          {code.inputFormat || "Standard Input (stdin)"}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                          Output Format
                        </span>
                        <p className="text-slate-800 dark:text-slate-300 text-xs font-mono">
                          {code.outputFormat || "Standard Output (stdout)"}
                        </p>
                      </div>
                    </div>

                    {/* Constraints */}
                    {code.constraints && code.constraints.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                          Constraints
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                          {code.constraints.map((con, i) => (
                            <li key={i}>{formatMathText(con)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Test Cases Table */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 tracking-wider">
                        Evaluation Test Cases ({(code.testCases || []).length})
                      </span>
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                            <tr>
                              <th className="py-2 px-3 w-16">Case</th>
                              <th className="py-2 px-3">Input (stdin)</th>
                              <th className="py-2 px-3">Expected Output (stdout)</th>
                              <th className="py-2 px-3 w-28 text-right">Visibility</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
                            {(code.testCases || []).map((tc, tcIdx) => (
                              <tr key={tcIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <td className="py-2.5 px-3 font-sans font-bold text-slate-700 dark:text-slate-300">
                                  #{tcIdx + 1}
                                </td>
                                <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                                  {cleanStdinInput(tc.input) || "<empty>"}
                                </td>
                                <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 whitespace-pre-wrap font-bold">
                                  {cleanExpectedOutput(tc.expectedOutput)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-sans">
                                  {tc.isHidden ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30">
                                      Hidden
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30">
                                      Sample
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── MODAL FOOTER ─────────────────────────────────────────────────── */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">
            Official Institution Blueprint • Total Marks: <strong className="text-slate-900 dark:text-white">{exam.totalMarks}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Question Paper</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition cursor-pointer shadow-md shadow-indigo-500/20"
            >
              Done Viewing
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
