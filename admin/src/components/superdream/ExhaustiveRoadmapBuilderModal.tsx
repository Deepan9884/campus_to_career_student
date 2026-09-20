import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Map,
  Plus,
  Trash2,
  CheckCircle2,
  BookOpen,
  Award,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

export interface RoadmapTopicConfig {
  id: string;
  name: string;
  estimatedHours: number;
  whitepaperRef?: string;
  handsOnLabRequired: boolean;
}

export interface RoadmapQuizConfig {
  title: string;
  questionsCount: number;
  passingPercentage: number;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

export interface FullRoadmapModuleConfig {
  id: string;
  title: string;
  tag: string;
  phase: number;
  description: string;
  topics: RoadmapTopicConfig[];
  quiz: RoadmapQuizConfig;
  status: "in_progress" | "completed" | "locked";
}

interface ExhaustiveRoadmapBuilderModalProps {
  open: boolean;
  onClose: () => void;
  onSaveRoadmapModule: (module: FullRoadmapModuleConfig) => void;
}

export function ExhaustiveRoadmapBuilderModal({
  open,
  onClose,
  onSaveRoadmapModule,
}: ExhaustiveRoadmapBuilderModalProps) {
  const [moduleTitle, setModuleTitle] = useState("");
  const [domainTag, setDomainTag] = useState("");
  const [phase, setPhase] = useState(1);
  const [description, setDescription] = useState("");

  const [topics, setTopics] = useState<RoadmapTopicConfig[]>([]);

  const [quizTitle, setQuizTitle] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<
    {
      id: string;
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }[]
  >([]);

  if (!open) return null;

  const handleAddTopic = () => {
    const newT: RoadmapTopicConfig = {
      id: `t-${Date.now()}`,
      name: "New Architectural Subtopic",
      estimatedHours: 10,
      handsOnLabRequired: true,
    };
    setTopics([...topics, newT]);
  };

  const handleAddQuizQuestion = () => {
    const newQ = {
      id: `q-${Date.now()}`,
      question: "Enter new quiz assessment question...",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctIndex: 0,
      explanation: "Explanation of the correct answer.",
    };
    setQuizQuestions([...quizQuestions, newQ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim()) {
      toast.error("Enter module title");
      return;
    }

    const fullModule: FullRoadmapModuleConfig = {
      id: `m-${Date.now()}`,
      title: moduleTitle,
      tag: domainTag,
      phase,
      description,
      topics,
      quiz: {
        title: quizTitle,
        questionsCount: quizQuestions.length,
        passingPercentage: 80,
        questions: quizQuestions,
      },
      status: "in_progress",
    };

    onSaveRoadmapModule(fullModule);
    toast.success(`Module "${moduleTitle}" published to student Learning Roadmap!`);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 dark:bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-4xl max-h-[92vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-purple-500/40 shadow-2xl flex flex-col text-slate-900 dark:text-white overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 grid place-items-center text-white shadow-lg">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                SYLLABUS & QUIZ ARCHITECT
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Curate Learning Roadmap Module & Topic Checkpoint Quiz
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
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              Module Core Metadata
            </h3>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Module Title *</label>
              <input
                type="text"
                required
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Domain Tag</label>
                <input
                  type="text"
                  value={domainTag}
                  onChange={(e) => setDomainTag(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Target Trajectory Phase</label>
                <select
                  value={phase}
                  onChange={(e) => setPhase(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                >
                  <option value={1}>Phase 01: Core CS Foundations</option>
                  <option value={2}>Phase 02: Distributed Systems</option>
                  <option value={3}>Phase 03: High Concurrency</option>
                  <option value={4}>Phase 04: FAANG Offers</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white resize-none"
              />
            </div>
          </div>

          {/* Subtopics */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Subtopics & Hands-On Engineering Labs ({topics.length})
              </h3>
              <button
                type="button"
                onClick={handleAddTopic}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-purple-600/30 text-purple-300 border border-purple-500/40 hover:bg-purple-600/50 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Subtopic
              </button>
            </div>

            <div className="space-y-3">
              {topics.map((t, idx) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={t.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTopics((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, name: val } : item))
                        );
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold w-80"
                    />

                    <button
                      type="button"
                      onClick={() => setTopics(topics.filter((_, i) => i !== idx))}
                      className="text-rose-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400">Estimated Study Hours:</span>
                      <input
                        type="number"
                        value={t.estimatedHours}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setTopics((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, estimatedHours: val } : item))
                          );
                        }}
                        className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white mt-1"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400">Reference RFC / Whitepaper:</span>
                      <input
                        type="text"
                        value={t.whitepaperRef || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTopics((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, whitepaperRef: val } : item))
                          );
                        }}
                        placeholder="e.g. Lamport Logical Clocks paper"
                        className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkpoint Quiz */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Checkpoint Assessment Quiz ({quizQuestions.length} Questions)
              </h3>
              <button
                type="button"
                onClick={handleAddQuizQuestion}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-600/30 text-amber-300 border border-amber-500/40 hover:bg-amber-600/50 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Quiz Question
              </button>
            </div>

            <div className="space-y-4">
              {quizQuestions.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">Quiz Question {qIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setQuizQuestions(quizQuestions.filter((_, i) => i !== qIdx))}
                      className="text-rose-400 hover:underline"
                    >
                      Remove
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={q.question}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuizQuestions((prev) =>
                        prev.map((item, i) => (i === qIdx ? { ...item, question: val } : item))
                      );
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white resize-none"
                  />

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400">Options (Select radio for correct answer):</span>
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`quiz-correct-${q.id}`}
                          checked={q.correctIndex === optIdx}
                          onChange={() => {
                            setQuizQuestions((prev) =>
                              prev.map((item, i) => (i === qIdx ? { ...item, correctIndex: optIdx } : item))
                            );
                          }}
                          className="text-emerald-500"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newOpts = [...q.options];
                            newOpts[optIdx] = val;
                            setQuizQuestions((prev) =>
                              prev.map((item, i) => (i === qIdx ? { ...item, options: newOpts } : item))
                            );
                          }}
                          className="flex-1 px-3 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Explanation:</span>
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuizQuestions((prev) =>
                          prev.map((item, i) => (i === qIdx ? { ...item, explanation: val } : item))
                        );
                      }}
                      className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-white text-xs"
                    />
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold cursor-pointer shadow-lg shadow-purple-500/25"
            >
              Publish Roadmap Module
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
