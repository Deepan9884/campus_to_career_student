import React from "react";
import { motion } from "framer-motion";
import {
  Code,
  FileText,
  Mic,
  Github,
  Map,
  Calendar,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

export interface FeaturePanelData {
  id: string;
  keyNumber: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  gradient: string;
  highlights: string[];
  imagePath: string;
}

export const ELEGANT_FEATURE_PANELS: FeaturePanelData[] = [
  {
    id: "resume",
    keyNumber: "1",
    title: "AI Resume & ATS Optimizer",
    subtitle: "Tailor your resume to target roles with instant ATS match analysis",
    badge: "RESUME ANALYSIS",
    icon: FileText,
    gradient: "from-indigo-500 to-blue-600",
    highlights: [
      "Instant ATS score calculation & keyword suggestions",
      "Impact phrasing & metric enhancement tips",
      "Clean, recruiter-approved PDF template export",
    ],
    imagePath: "/landing/study_resume.jpg",
  },
  {
    id: "interview",
    keyNumber: "2",
    title: "Voice AI Mock Interviews",
    subtitle: "Practice technical and behavioral questions in a calm interview studio",
    badge: "INTERVIEW COACH",
    icon: Mic,
    gradient: "from-purple-500 to-indigo-600",
    highlights: [
      "Speech-to-text with pacing & articulation feedback",
      "Targeted technical & coding questions",
      "Detailed post-session scorecards & improvement areas",
    ],
    imagePath: "/landing/study_interview.jpg",
  },
  {
    id: "coding",
    keyNumber: "3",
    title: "Coding Platforms Analytics Hub",
    subtitle: "Unify your LeetCode, Codeforces, and HackerRank practice in one clean dashboard",
    badge: "CODING HUB",
    icon: Code,
    gradient: "from-blue-500 to-cyan-600",
    highlights: [
      "Auto-synchronized problem solving statistics",
      "Daily problem-solving streak tracking",
      "Algorithmic complexity & solution analysis",
    ],
    imagePath: "/landing/study_coding.jpg",
  },
  {
    id: "github",
    keyNumber: "4",
    title: "GitHub & Code Quality Review",
    subtitle: "Automate code quality, maintainability index, and portfolio showcase",
    badge: "CODE AUDITOR",
    icon: Github,
    gradient: "from-slate-600 to-slate-800",
    highlights: [
      "Repository code coverage & maintainability audit",
      "Automated security & dependency check",
      "Clean portfolio builder for recruiters",
    ],
    imagePath: "/landing/study_github.jpg",
  },
  {
    id: "roadmap",
    keyNumber: "5",
    title: "Skill-Gap & Career Roadmaps",
    subtitle: "Step-by-step learning milestones tailored to your target tech role",
    badge: "CAREER ROADMAP",
    icon: Map,
    gradient: "from-emerald-500 to-teal-600",
    highlights: [
      "Diagnostic quiz to discover skill gaps",
      "Curated project & learning step progression",
      "Interactive milestone badges & progress tracking",
    ],
    imagePath: "/landing/study_roadmap.jpg",
  },
  {
    id: "events",
    keyNumber: "6",
    title: "Placement Drives & Hackathons",
    subtitle: "Never miss off-campus hiring drives, hackathons, and referral opportunities",
    badge: "CAMPUS RADAR",
    icon: Calendar,
    gradient: "from-violet-500 to-purple-600",
    highlights: [
      "Verified company hiring drive notifications",
      "Hackathon timeline tracker & team building",
      "Referral request guidelines & application tracking",
    ],
    imagePath: "/landing/study_events.jpg",
  },
];

export interface FeatureDeckProps {
  activeId: string;
  onSelectPanel: (panel: FeaturePanelData) => void;
}

export const FeatureDeck: React.FC<FeatureDeckProps> = ({ activeId, onSelectPanel }) => {
  return (
    <div className="flex flex-col space-y-2.5 overflow-y-auto max-h-[calc(100vh-220px)] pr-1 custom-scrollbar">
      {ELEGANT_FEATURE_PANELS.map((panel) => {
        const isActive = panel.id === activeId;
        const Icon = panel.icon;

        return (
          <motion.div
            key={panel.id}
            onClick={() => onSelectPanel(panel)}
            whileHover={{ x: 2 }}
            className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 border ${
              isActive
                ? "bg-indigo-50/90 dark:bg-slate-800/80 border-indigo-500/50 shadow-lg shadow-indigo-500/10 text-slate-900 dark:text-white"
                : "bg-white/80 dark:bg-slate-900/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/40 border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span
                  className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </span>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {panel.badge}
                  </span>
                  <h3
                    className={`text-sm font-semibold mt-0.5 leading-tight ${
                      isActive ? "text-slate-900 dark:text-white" : "text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {panel.title}
                  </h3>
                </div>
              </div>

              <ChevronRight
                className={`w-4 h-4 transition-transform duration-300 ${
                  isActive ? "text-indigo-600 dark:text-indigo-400 translate-x-0.5" : "text-slate-400 dark:text-slate-600"
                }`}
              />
            </div>

            {isActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.2 }}
                className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 space-y-2"
              >
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{panel.subtitle}</p>
                <div className="space-y-1.5 pt-1">
                  {panel.highlights.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-[11px] text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export const FEATURE_PANELS = ELEGANT_FEATURE_PANELS;
