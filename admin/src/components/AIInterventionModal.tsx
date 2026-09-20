import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  X,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Send,
  Target,
  FileText,
  Mic,
  Code2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  generateAIIntervention,
  createMentorTask,
  type AIInterventionPlan,
} from "../lib/admin-api";

interface AIInterventionModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export function AIInterventionModal({
  open,
  onClose,
  studentId,
  studentName,
}: AIInterventionModalProps) {
  const queryClient = useQueryClient();
  const [delivering, setDelivering] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["adminAIIntervention", studentId],
    queryFn: () => generateAIIntervention(studentId),
    enabled: open && Boolean(studentId),
    staleTime: 5 * 60 * 1000,
  });

  const plan: AIInterventionPlan | undefined = data?.intervention;

  const handleDeliverToStudent = async () => {
    if (!plan || !plan.suggestedTasks?.length) {
      toast.error("No prescribed tasks available to deliver.");
      return;
    }

    setDelivering(true);
    try {
      toast.loading("Assigning prescribed remedial tasks to student...", { id: "deliver-plan" });

      for (const t of plan.suggestedTasks) {
        await createMentorTask(studentId, {
          title: t.title,
          description: t.description,
          category: t.category,
          priority: t.priority,
          daysToComplete: t.daysToComplete || 7,
          actionUrl: t.actionUrl || "/dashboard",
        });
      }

      toast.success(`2-Week Recovery Plan successfully delivered to ${studentName}!`, {
        id: "deliver-plan",
      });
      queryClient.invalidateQueries({ queryKey: ["adminStudentTasks", studentId] });
      queryClient.invalidateQueries({ queryKey: ["adminStudent360", studentId] });
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to deliver plan to student", { id: "deliver-plan" });
    } finally {
      setDelivering(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-[40px] saturate-[180%]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">AI Mentor Co-Pilot Intervention Diagnosis</h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30">
                  Gemini Powered
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tailored 2-week remedial roadmap and prescribed action goals for <strong className="text-slate-900 dark:text-white">{studentName}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs select-text">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-indigo-200 dark:border-indigo-500/30 border-t-indigo-600 animate-spin" />
                <Bot className="h-6 w-6 text-indigo-600 dark:text-indigo-400 absolute inset-0 m-auto" />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm text-slate-900 dark:text-white">Synthesizing Diagnostic Performance Dossier...</p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Evaluating ATS resume metrics, mock interview transcripts, and skill gap telemetry.</p>
              </div>
            </div>
          ) : isError || !plan ? (
            <div className="py-16 text-center space-y-3">
              <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
              <p className="font-bold text-slate-900 dark:text-white text-sm">Failed to generate AI intervention plan</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Retry Diagnosis
              </button>
            </div>
          ) : (
            <>
              {/* Executive Diagnosis */}
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 space-y-2">
                <span className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 text-xs">
                  <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Executive Diagnosis
                </span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-xs">{plan.diagnosisSummary}</p>
              </div>

              {/* Identified Root Causes */}
              {plan.keyDeficits && plan.keyDeficits.length > 0 && (
                <div className="space-y-2">
                  <p className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                    Primary Performance Bottlenecks ({plan.keyDeficits.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {plan.keyDeficits.map((d: string, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 shadow-xs"
                      >
                        <span className="w-5 h-5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 text-[10px] font-black flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-500/30">
                          {i + 1}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 leading-snug">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2-Week Structured Recovery Roadmap */}
              {plan.twoWeekPlan && plan.twoWeekPlan.length > 0 && (
                <div className="space-y-3">
                  <p className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> 2-Week Structured Recovery Roadmap
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {plan.twoWeekPlan.map((w: any) => (
                      <div
                        key={w.week}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs">Week {w.week}</span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">{w.theme}</span>
                        </div>
                        <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                          {(w.actions || []).map((act: string, j: number) => (
                            <li key={j} className="flex items-start gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <span className="leading-snug">{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Mentor Tasks */}
              {plan.suggestedTasks && plan.suggestedTasks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Prescribed Task Milestones (Will be assigned to mentee)
                  </p>
                  <div className="space-y-2">
                    {plan.suggestedTasks.map((t: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 shrink-0 border border-indigo-100 dark:border-transparent">
                            {t.category === "interview" ? (
                              <Mic className="h-4 w-4" />
                            ) : t.category === "resume" ? (
                              <FileText className="h-4 w-4" />
                            ) : (
                              <Code2 className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{t.title}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{t.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              t.priority === "urgent"
                                ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30"
                                : t.priority === "high"
                                ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30"
                                : "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30"
                            }`}
                          >
                            {t.priority}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Due in {t.daysToComplete}d</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400 text-xs">
            Review the generated diagnosis and deliver the prescribed tasks to the mentee.
          </span>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs font-bold transition cursor-pointer">
              Close
            </button>
            <button
              onClick={handleDeliverToStudent}
              disabled={delivering || isLoading || !plan}
              className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition cursor-pointer"
            >
              {delivering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Deliver 2-Week Plan & Assign Tasks
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
