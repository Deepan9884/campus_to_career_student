import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { useSuperDream } from "@/stores/superDreamStore";
import {
  Map,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  HelpCircle,
  X,
  Check,
  Award,
  Zap,
  FileText,
  Compass,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import type { MentorRoadmapMilestone } from "@/lib/super-dream-api";

const QUIZ_QUESTIONS_BANK: Record<string, Array<{ question: string; options: string[]; correctIndex: number; explanation: string }>> = {
  "m-1": [
    {
      question: "Which cache coherence state in MESI indicates that the cache line is present only in the current cache and is clean (matches main memory)?",
      options: ["Modified (M)", "Exclusive (E)", "Shared (S)", "Invalid (I)"],
      correctIndex: 1,
      explanation: "Exclusive (E) means the line is present only in this cache and clean with respect to main memory.",
    },
    {
      question: "What is the primary danger of the ABA problem in lock-free Compare-And-Swap (CAS) data structures?",
      options: [
        "Thread starvation",
        "A pointer value changes to B and back to A, causing CAS to succeed erroneously even if underlying nodes were freed",
        "Memory leakage in virtual memory",
        "Deadlock across CPU cores",
      ],
      correctIndex: 1,
      explanation: "ABA occurs when a memory location is read as A, updated to B, and restored to A. CAS perceives no difference and proceeds dangerously.",
    },
    {
      question: "In Linux epoll, what is the fundamental difference between Level-Triggered (LT) and Edge-Triggered (ET) notification?",
      options: [
        "LT works only with UDP sockets",
        "ET notifies only when state transitions from non-ready to ready, requiring complete read loops until EAGAIN",
        "ET requires elevated root privileges",
        "LT uses zero kernel memory",
      ],
      correctIndex: 1,
      explanation: "Edge-Triggered (ET) triggers only on new state transitions, so application code must drain the buffer until EAGAIN.",
    },
  ],
  "m-2": [
    {
      question: "In Raft consensus, how does a leader determine that a log entry from its current term is safely committed?",
      options: [
        "When all followers acknowledge receipt",
        "When a majority of cluster nodes (quorum) replicate the entry into their logs",
        "Immediately upon writing to the leader's local WAL",
        "When client confirms reception",
      ],
      correctIndex: 1,
      explanation: "Raft commits an entry once it is replicated across a majority of nodes in the leader's current term.",
    },
    {
      question: "In RocksDB's LSM-Tree architecture, why are Bloom Filters placed before SSTables?",
      options: [
        "To compress log records",
        "To quickly rule out non-existent keys and avoid unnecessary disk page reads",
        "To encrypt data at rest",
        "To balance the B-Tree pointers",
      ],
      correctIndex: 1,
      explanation: "Bloom filters provide fast in-memory probabilistic checks to avoid disk I/O for keys not present in the SSTable.",
    },
  ],
};

export function SuperDreamLearningRoadmap() {
  const { mentorRoadmap, recordQuizScore } = useSuperDream();

  const [activeQuizMilestone, setActiveQuizMilestone] = useState<MentorRoadmapMilestone | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [calculatedScore, setCalculatedScore] = useState(0);

  const handleStartQuiz = (milestone: MentorRoadmapMilestone) => {
    setActiveQuizMilestone(milestone);
    setCurrentQuestionIdx(0);
    setSelectedAnswers({});
    setQuizFinished(false);
    setCalculatedScore(0);
  };

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (quizFinished) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleFinishQuiz = () => {
    if (!activeQuizMilestone) return;
    const questions = QUIZ_QUESTIONS_BANK[activeQuizMilestone.id] || QUIZ_QUESTIONS_BANK["m-1"];

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount += 1;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    setCalculatedScore(score);
    setQuizFinished(true);

    // Record quiz score for all topics within this curriculum milestone
    activeQuizMilestone.topics.forEach((t) => {
      recordQuizScore(activeQuizMilestone.id, t.id, score);
    });

    if (score >= 80) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#A855F7", "#6366F1", "#38BDF8"],
        });
      } catch {
        // silent
      }
      toast.success(`Topic Quiz Passed with ${score}%!`);
    } else {
      toast.info(`Quiz score: ${score}%. Pass mark is 80%.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <GlassCard className="p-6 border-purple-500/30 bg-gradient-to-r from-slate-900/90 via-purple-950/40 to-slate-900/90 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <Map className="w-3.5 h-3.5 text-purple-400" />
            Mentor-Curated Engineering Syllabus
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Learning Roadmap & System Architecture Mastery
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Curated syllabus targeting high-frequency systems topics: low-level concurrency, distributed consensus, and microservice patterns with topic quizzes.
          </p>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-purple-500/30 shrink-0 text-center shadow-lg shadow-purple-950/30">
          <p className="text-xs text-slate-400">Curriculum Source</p>
          <p className="text-sm font-bold text-purple-300 mt-0.5 flex items-center justify-center gap-1.5">
            <Compass className="w-4 h-4 text-purple-400" /> Mentor Curated
          </p>
        </div>
      </GlassCard>

      {/* Roadmap Modules */}
      {mentorRoadmap.length === 0 ? (
        <GlassCard className="p-12 text-center text-slate-400 space-y-3 border-slate-800 bg-slate-900/40">
          <Map className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Learning Modules Assigned Yet</h3>
          <p className="text-xs max-w-md mx-auto">
            Your faculty mentor will assign curated system architecture modules and milestones here.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {mentorRoadmap.map((milestone, idx) => {
            const isDone = milestone.status === "completed";
            const isLocked = milestone.status === "locked";

            return (
              <GlassCard
                key={milestone.id}
                className={cn(
                  "p-6 border-slate-800 bg-slate-900/70 space-y-4 transition card-hover-lift",
                  isDone && "border-emerald-500/40"
                )}
              >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Module 0{idx + 1}
                    </span>
                    <h3 className="text-base font-bold text-white">{milestone.title}</h3>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {milestone.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5">{milestone.description}</p>
                </div>

                <button
                  onClick={() => handleStartQuiz(milestone)}
                  disabled={isLocked}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer shadow-md",
                    isLocked
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white shadow-purple-500/20"
                  )}
                >
                  <HelpCircle className="w-4 h-4 text-purple-200" />
                  Take Topic Quiz
                </button>
              </div>

              {/* Subtopics Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {milestone.topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between gap-2.5 hover:border-purple-500/30 transition"
                  >
                    <div className="flex items-start gap-2.5">
                      {topic.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                      )}
                      <p className="text-xs font-medium text-slate-200 leading-snug">{topic.name}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                      <span className="font-mono">{topic.estimatedHours}h effort</span>
                      {topic.quizCompleted ? (
                        <span className="text-emerald-400 font-mono font-bold">Score: {topic.quizScore}%</span>
                      ) : (
                        <span className="text-slate-500">Quiz pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          );
        })}
      </div>
      )}

      {/* Quiz Modal */}
      {activeQuizMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-purple-500/40 p-6 shadow-2xl space-y-4 text-white relative">
            <button
              onClick={() => setActiveQuizMilestone(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-0.5">
              <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">
                {activeQuizMilestone.tag} Diagnostic Quiz
              </span>
              <h3 className="text-lg font-bold">{activeQuizMilestone.quiz.title}</h3>
            </div>

            {(() => {
              const questions = QUIZ_QUESTIONS_BANK[activeQuizMilestone.id] || QUIZ_QUESTIONS_BANK["m-1"];
              const currentQ = questions[currentQuestionIdx];

              if (quizFinished) {
                return (
                  <div className="py-4 text-center space-y-4">
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                      <p className="text-xs text-slate-400">Assessment Result</p>
                      <p className="text-3xl font-black font-mono text-purple-300 mt-1">
                        {calculatedScore}%
                      </p>
                      <p className="text-xs text-slate-300 mt-1 font-medium">
                        {calculatedScore >= 80 ? "Passed • Progress Recorded" : "Needs Review • Retake anytime"}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-slate-300 text-left max-h-48 overflow-y-auto space-y-2">
                      <p className="font-bold text-white">Review & Explanations:</p>
                      {questions.map((q, idx) => (
                        <div key={idx} className="border-b border-slate-800 pb-2 last:border-0">
                          <p className="font-medium text-slate-200">{idx + 1}. {q.question}</p>
                          <p className="text-emerald-400 text-[11px] mt-0.5">Correct: {q.options[q.correctIndex]}</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">{q.explanation}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setActiveQuizMilestone(null)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold transition shadow-lg shadow-purple-500/20"
                    >
                      Done & Return to Roadmap
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-4 pt-1">
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-white/10">
                    <span>Question {currentQuestionIdx + 1} of {questions.length}</span>
                    <span className="text-purple-300 font-mono">Passing Mark: 80%</span>
                  </div>

                  <p className="text-sm font-semibold text-white leading-relaxed">
                    {currentQ.question}
                  </p>

                  <div className="space-y-2.5">
                    {currentQ.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[currentQuestionIdx] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(currentQuestionIdx, optIdx)}
                          className={cn(
                            "w-full text-left p-3.5 rounded-xl text-xs transition flex items-center gap-3 border cursor-pointer",
                            isSelected
                              ? "bg-purple-600/20 border-purple-500/60 text-white font-semibold shadow-md shadow-purple-950/50"
                              : "bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/50"
                          )}
                        >
                          <span
                            className={cn(
                              "w-6 h-6 rounded-full grid place-items-center text-xs font-mono font-bold shrink-0 border",
                              isSelected
                                ? "bg-purple-600 text-white border-purple-400"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            )}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <button
                      type="button"
                      disabled={currentQuestionIdx === 0}
                      onClick={() => setCurrentQuestionIdx((prev) => prev - 1)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 disabled:opacity-30"
                    >
                      Previous
                    </button>

                    {currentQuestionIdx < questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentQuestionIdx((prev) => prev + 1)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleFinishQuiz}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white shadow-lg shadow-purple-500/25"
                      >
                        Submit Quiz
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
