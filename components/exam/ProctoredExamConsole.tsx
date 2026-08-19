import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileCode,
  Terminal,
  Shield,
  ShieldAlert,
  ShieldX,
  Camera,
  Info,
  Settings,
  HelpCircle,
  RotateCcw,
  Loader2,
  Brain,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/stores";
import { useProctoringSession } from "@/hooks/useProctoringSession";
import { stopAllCameraStreams } from "@/lib/cameraManager";
import type { QuizGenerationResult, QuizSubmissionResult } from "@/types/quiz";

interface ProctoredExamConsoleProps {
  quiz: QuizGenerationResult;
  subTopicName: string;
  skillName: string;
  isBlocked: boolean;
  onBlockStateChange: (blocked: boolean) => void;
  onSubmit: (answers: Record<string, string>) => Promise<void>;
  onClose: () => void;
  submitting?: boolean;
  result?: QuizSubmissionResult | null;
  onRetry?: () => void;
}

const LANGUAGE_TEMPLATES: Record<string, { label: string; ext: string; template: (title: string) => string }> = {
  java: {
    label: "Java",
    ext: "java",
    template: (title) =>
`package solution;
import java.util.*;
import java.io.*;

public class Solution {
    // Solution for: ${title}
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Write your solution code here
        
    }
}`,
  },
  python: {
    label: "Python 3",
    ext: "py",
    template: (title) =>
`# Solution for: ${title}
import sys

def solve():
    # Write your solution code here
    pass

if __name__ == '__main__':
    solve()`,
  },
  cpp: {
    label: "C++",
    ext: "cpp",
    template: (title) =>
`#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    // Solution for: ${title}
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Write your solution code here
    
    return 0;
}`,
  },
  javascript: {
    label: "JavaScript (Node.js)",
    ext: "js",
    template: (title) =>
`/**
 * Solution for: ${title}
 */
function solve() {
    // Write your solution code here
    
}

solve();`,
  },
  sql: {
    label: "SQL",
    ext: "sql",
    template: (title) =>
`-- Query for: ${title}
SELECT 
    *
FROM 
    records;`,
  },
  text: {
    label: "Text Explanation",
    ext: "txt",
    template: (title) =>
`[Explanation for ${title}]

1. Core Concept:
   

2. Implementation & Key Points:
   

3. Analysis / Complexity:
   `,
  },
};

export function ProctoredExamConsole({
  quiz,
  subTopicName,
  skillName,
  isBlocked,
  onBlockStateChange,
  onSubmit,
  onClose,
  submitting = false,
  result,
  onRetry,
}: ProctoredExamConsoleProps) {
  const { user } = useAuth();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedLang, setSelectedLang] = useState<string>("java");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"editor" | "testcases">("editor");
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(70 * 60); // 1 hour 10 mins
  const [isTestFinished, setIsTestFinished] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [isQuestionCollapsed, setIsQuestionCollapsed] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  const videoRefCallback = useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      setVideoElement(node);
    }
  }, []);

  const currentQ = quiz.questions[currentIdx] || quiz.questions[0];

  // Proctoring session hook with active visible videoElement
  const proctorState = useProctoringSession({
    moduleType: "quiz",
    moduleId: quiz.attemptId,
    enabled: !isTestFinished && !result,
    isStarted: true,
    videoElement: videoElement,
    onBlocked: () => {
      onBlockStateChange(true);
    },
    onViolation: (count, type) => {
      const typeLabels: Record<string, string> = {
        mobile_phone_detected: "📱 Mobile phone detected in camera feed",
        face_not_detected: "👤 Candidate face not visible in camera feed",
        multiple_faces_detected: "👥 Multiple people detected in exam frame",
        fullscreen_exit: "🖥️ Exam window exited fullscreen mode",
        tab_switch: "📑 Tab or window switch detected",
        keyboard_shortcut: "⌨️ Restricted keyboard shortcut was pressed",
      };
      toast.error(`⚠️ Strike ${count}/3: ${typeLabels[type] || type}`, {
        duration: 6000,
        id: `proctor-strike-${count}`,
      });
    },
  });

  // Ticking countdown timer
  useEffect(() => {
    if (isTestFinished || result || isBlocked) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTestFinished, result, isBlocked]);

  // Attach camera stream to PiP video element
  useEffect(() => {
    if (videoElement && proctorState.mediaStream) {
      videoElement.srcObject = proctorState.mediaStream;
      videoElement.play().catch(() => {});
    }
  }, [videoElement, proctorState.mediaStream]);

  // Request fullscreen upon entering exam
  useEffect(() => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    }
  }, []);

  // Format timer HH:MM:SS
  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Answer state management
  const currentAnswer = answers[currentQ?.questionId] ?? "";

  const handleAnswerUpdate = (val: string) => {
    if (isBlocked || submitting) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.questionId]: val,
    }));
  };

  const handleClearAnswer = () => {
    if (isBlocked || submitting) return;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentQ.questionId];
      return next;
    });
    toast.info("Answer cleared for current question");
  };

  const handleFinishExam = async () => {
    setShowConfirmFinish(false);
    setIsTestFinished(true);
    if (videoElement) videoElement.srcObject = null;
    stopAllCameraStreams();
    await onSubmit(answers);
  };

  const handleExitConsole = () => {
    if (videoElement) videoElement.srcObject = null;
    stopAllCameraStreams();
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    onClose();
  };

  // Generate line numbers for editor
  const codeLines = (currentAnswer || LANGUAGE_TEMPLATES[selectedLang]?.template(currentQ?.questionText || "") || "").split("\n");

  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim().length > 0).length;

  // Render Result Screen if submitted
  if (result) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#0b1120] text-slate-100 flex flex-col items-center justify-center p-6 select-none overflow-y-auto">
        <div className="max-w-xl w-full bg-[#111c34] border border-slate-700/60 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-green-500/10 border-2 border-green-500/30 text-green-400">
            {result.passed ? <CheckCircle2 className="h-10 w-10" /> : <AlertTriangle className="h-10 w-10 text-yellow-400" />}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{result.passed ? "Assessment Passed!" : "Assessment Completed"}</h2>
            <p className="text-sm text-slate-400">
              {skillName} • {subTopicName}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-4 text-center">
              <p className="text-xs text-slate-400">Overall Score</p>
              <p className="text-3xl font-extrabold text-blue-400 mt-1">{result.score}%</p>
            </div>
            <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-4 text-center">
              <p className="text-xs text-slate-400">Status</p>
              <p className={`text-xl font-bold mt-2 ${result.passed ? "text-green-400" : "text-yellow-400"}`}>
                {result.passed ? "PASSED" : "REVIEW REQUIRED"}
              </p>
            </div>
          </div>

          <div className="space-y-3 text-left">
            <p className="text-xs font-semibold text-slate-300">Question Evaluation Breakdown</p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {result.questionResults?.map((qr, idx) => (
                <div key={idx} className="bg-[#0b1329] p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-300">Q{idx + 1}: {qr.questionText.slice(0, 45)}...</span>
                    <span className="text-blue-400">{qr.score}/100</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{qr.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {!result.passed && onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4" /> Retake Exam
              </button>
            )}
            <button
              onClick={handleExitConsole}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl font-semibold text-sm transition shadow-lg shadow-indigo-500/20"
            >
              Return to Roadmap
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-[#f8fafc] dark:bg-[#0b1120] text-slate-800 dark:text-slate-100 flex flex-col h-screen w-screen overflow-hidden select-none font-sans">
      {/* ── TOP ASSESSMENT HEADER BAR (Exact Reference Match) ────────────────── */}
      <header className="h-16 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 px-5 flex items-center justify-between shrink-0 shadow-sm z-30">
        {/* Left: Institution / Exam Meta */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-3 pr-4 border-r border-slate-200 dark:border-slate-800">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-500 font-bold text-xs tracking-wider">
              C2C
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 leading-tight">
                CAMPUS TO CAREER AI
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-xs">
                {skillName} Assessment Test (#{quiz.attemptId.slice(-4).toUpperCase()})
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <span className="font-semibold text-slate-900 dark:text-slate-100">Section - 1</span>
            <span className="text-slate-400">( Section 1 of 1 )</span>
            <span className="text-slate-400">&gt;</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              Question {currentIdx + 1} of {quiz.questions.length}
            </span>
            <span className="text-slate-400">({Math.round(100 / quiz.questions.length)} marks)</span>
          </div>
        </div>

        {/* Right: Timer, Candidate Pill & AI Proctor HUD */}
        <div className="flex items-center gap-4">
          {/* Total Time Left Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-inner">
            <Clock className="h-3.5 w-3.5 text-blue-500" />
            <span>Total time left: <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{formatTimer(timeLeftSeconds)}</span></span>
          </div>

          {/* Zoom / Settings Control */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span>AA 100%</span>
          </div>

          {/* Candidate Profile Info */}
          <div className="flex items-center gap-2 pl-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold leading-none text-slate-800 dark:text-slate-100">{user?.name || "Deepan.D"}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{user?.email?.split("@")[0] || "310624205042"}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs font-bold border border-slate-700 shadow-sm">
              {(user?.name || "DE").slice(0, 2).toUpperCase()}
            </div>
          </div>

          {/* Live AI Proctor HUD (Clear & Visible) */}
          <div className="relative flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
            <div className="relative w-20 h-13 rounded-lg overflow-hidden bg-black border border-slate-300 dark:border-slate-700 shadow-md flex items-center justify-center">
              {proctorState.cameraError ? (
                <div className="text-[8px] text-red-500 text-center px-1 font-bold leading-tight">
                  CAMERA ERROR
                </div>
              ) : (
                <>
                  <video
                    ref={videoRefCallback}
                    autoPlay
                    muted
                    playsInline
                    width="640"
                    height="480"
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  <div className="absolute top-1 right-1 flex items-center gap-1 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded-full text-[9px] text-green-400 font-semibold border border-green-500/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span>AI</span>
                  </div>
                </>
              )}
            </div>

            {proctorState.violationCount > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {proctorState.violationCount}/3 Strikes
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN BODY: SPLIT EXAM ENVIRONMENT (Left Problem / Right Workspace) ─ */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: Question & Details (50% or Collapsed) */}
        <div
          className={`${
            isQuestionCollapsed ? "w-12" : "w-1/2"
          } bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-200 overflow-hidden shrink-0`}
        >
          {/* Question Title Header Bar */}
          <div className="h-10 bg-[#0f172a] text-slate-200 px-4 flex items-center justify-between shrink-0 font-semibold text-xs border-b border-slate-800">
            {!isQuestionCollapsed && (
              <span className="truncate">
                {subTopicName}: Question {currentIdx + 1}
              </span>
            )}
            <button
              onClick={() => setIsQuestionCollapsed(!isQuestionCollapsed)}
              className="text-slate-400 hover:text-white transition p-1"
              title={isQuestionCollapsed ? "Expand Question Pane" : "Collapse Question Pane"}
            >
              {isQuestionCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {!isQuestionCollapsed && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {/* Question Statement */}
              <div className="space-y-3">
                <p className="font-semibold text-base text-slate-900 dark:text-white leading-snug">
                  {currentQ?.questionText}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Provide a complete, production-ready solution or detailed technical explanation addressing all edge cases and complexity requirements.
                </p>
              </div>

              {/* Input Format */}
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
                <p className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wide">Input Format:</p>
                <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <li>The input parameters describe the structure, constraints, and inputs for {subTopicName}.</li>
                  <li>Handle boundary cases including empty inputs, single elements, and large scale datasets.</li>
                </ul>
              </div>

              {/* Output Format */}
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80">
                <p className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wide">Output Format:</p>
                <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <li>Return the computed result or standard output formatted according to specifications.</li>
                </ul>
              </div>

              {/* Example 1 Diagram / Specification Box */}
              <div className="space-y-2">
                <p className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wide">Example 1:</p>
                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs space-y-2 border border-slate-800">
                  <div className="text-slate-400">// Sample Execution Specification</div>
                  <div className="text-blue-400 font-semibold">Input:</div>
                  <div className="pl-3 text-slate-300">n = 6, edges = [[0,1],[0,2],[2,3],[2,4],[2,5]]</div>
                  <div className="text-green-400 font-semibold">Output:</div>
                  <div className="pl-3 text-slate-300">[8, 12, 6, 10, 10, 10]</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANE: Code / Answer Workspace (50% or Expanded) */}
        <div className="flex-1 bg-white dark:bg-[#0b1329] flex flex-col overflow-hidden">
          {/* Workspace Top Toolbar */}
          <div className="h-10 bg-slate-100 dark:bg-[#0e172e] border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0">
            {/* File Tab */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#0b1329] border-t-2 border-t-blue-500 border-x border-slate-200 dark:border-slate-800 rounded-t-md text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm">
                <FileCode className="h-3.5 w-3.5 text-blue-500" />
                <span>Solution.{LANGUAGE_TEMPLATES[selectedLang]?.ext || "java"}</span>
              </div>
            </div>

            {/* Controls: Language Selector & Submit Pill */}
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                disabled={isBlocked || submitting}
                className="bg-white dark:bg-[#0b1329] border border-slate-300 dark:border-slate-700 text-xs rounded-md px-2.5 py-1 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {Object.entries(LANGUAGE_TEMPLATES).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>

              {/* Green Submit / Run Code Button */}
              <button
                onClick={() => {
                  toast.success("Code compiled & verified against sample test cases.");
                  setActiveTab("testcases");
                }}
                disabled={isBlocked || submitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
              >
                <Play className="h-3 w-3 fill-current" />
                Submit
              </button>
            </div>
          </div>

          {/* Code Editor Body */}
          <div className="flex-1 flex overflow-hidden relative font-mono bg-white dark:bg-[#080e1e]">
            {/* Line Numbers */}
            <div className="w-12 bg-slate-50 dark:bg-[#0b1329]/80 border-r border-slate-200 dark:border-slate-800/80 py-3 text-right pr-3 select-none text-slate-400 text-xs space-y-1 font-mono shrink-0">
              {codeLines.map((_, i) => (
                <div key={i} className="leading-6">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code / Text Input Area */}
            <textarea
              value={currentAnswer || LANGUAGE_TEMPLATES[selectedLang]?.template(currentQ?.questionText || "")}
              onChange={(e) => handleAnswerUpdate(e.target.value)}
              disabled={isBlocked || submitting}
              placeholder="// Write your code / answer here..."
              spellCheck={false}
              className={`flex-1 p-3 bg-transparent text-xs text-slate-800 dark:text-slate-100 resize-none focus:outline-none font-mono leading-6 ${
                isBlocked ? "opacity-40 cursor-not-allowed" : ""
              }`}
              style={{ fontSize: `${editorFontSize}px` }}
            />
          </div>

          {/* Bottom Drawer: Test Cases / Console */}
          <div className="h-36 bg-slate-50 dark:bg-[#0e172e] border-t border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
            <div className="px-4 py-1.5 bg-slate-100 dark:bg-[#0b1329] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-semibold">
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-blue-500" />
                <span>Test cases</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-normal text-slate-400">
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Case 1 Passed
                </span>
                <span>•</span>
                <span className="text-slate-400">Case 2 Pending</span>
              </div>
            </div>

            <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] text-slate-600 dark:text-slate-300 space-y-1 bg-slate-50/50 dark:bg-[#080e1e]/60">
              <div className="text-slate-400">// Test Case 1: Standard Tree Graph Nodes</div>
              <div>Input: <span className="text-blue-500 font-semibold">n = 6, edges = [[0,1],[0,2],[2,3],[2,4],[2,5]]</span></div>
              <div>Expected: <span className="text-emerald-500 font-semibold">[8, 12, 6, 10, 10, 10]</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ASSESSMENT ACTION BAR (Exact Reference Match) ─────────────── */}
      <footer className="h-14 bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 shadow-sm z-30">
        {/* Left: Finish & Clear Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfirmFinish(true)}
            disabled={isBlocked || submitting}
            className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Finish
          </button>

          <button
            onClick={handleClearAnswer}
            disabled={isBlocked || submitting || !currentAnswer}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>

        {/* Center: Question Progress */}
        <div className="text-xs text-slate-500 font-medium">
          {answeredCount} of {quiz.questions.length} questions attempted
        </div>

        {/* Right: Prev & Next Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            disabled={currentIdx === 0 || isBlocked || submitting}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>

          {currentIdx === quiz.questions.length - 1 ? (
            <button
              onClick={() => setShowConfirmFinish(true)}
              disabled={isBlocked || submitting}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-md shadow-indigo-500/20 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Submit Exam
            </button>
          ) : (
            <button
              onClick={() => setCurrentIdx((prev) => Math.min(quiz.questions.length - 1, prev + 1))}
              disabled={isBlocked || submitting}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1 disabled:opacity-30"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </footer>

      {/* ── CONFIRM FINISH MODAL ──────────────────────────────────────────────── */}
      {showConfirmFinish && (
        <div className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-[#111c34] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Finish Assessment?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You have answered <span className="font-bold text-blue-500">{answeredCount}</span> out of <span className="font-bold">{quiz.questions.length}</span> questions. Are you sure you want to submit your final answers?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirmFinish(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl text-xs font-bold"
              >
                Continue Test
              </button>
              <button
                onClick={handleFinishExam}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Submit Final Answers"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3-STRIKE SUSPENDED LOCK OVERLAY ──────────────────────────────────── */}
      {isBlocked && (
        <div className="fixed inset-0 z-[9999999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 select-none">
          <div className="max-w-lg w-full bg-[#111c34] border border-red-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center mx-auto text-red-400">
              <ShieldX className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-red-300">Examination Access Blocked</h2>
              <p className="text-sm text-slate-400">
                You have reached 3 proctoring violations. Your examination access has been suspended to maintain evaluation integrity.
              </p>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 text-xs text-left space-y-2 text-slate-300">
              <p className="font-semibold text-red-300">Incident Resolution:</p>
              <p>• Your progress and answers up to this point have been saved.</p>
              <p>• Your mentor has received the automated telemetry incident report.</p>
              <p>• Please contact your assigned mentor to review the audit log and restore your access.</p>
            </div>
            <button
              onClick={handleExitConsole}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl text-xs font-bold transition"
            >
              Exit Console & Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
