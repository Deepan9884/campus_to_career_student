import React from "react";
import { CheckCircle2, Award, BookOpen, Target, ShieldCheck } from "lucide-react";

export const StreamLineTicker: React.FC = () => {
  const highlights = [
    { label: "AI ATS Resume Scoring", val: "98.4% Match Accuracy" },
    { label: "Voice Mock Interviews", val: "12,400+ Sessions" },
    { label: "Coding Platforms Sync", val: "LeetCode & Codeforces" },
    { label: "GitHub Code Audits", val: "Automated Review" },
    { label: "Personal Roadmaps", val: "Custom Milestones" },
    { label: "Placement Drives", val: "500+ Verified Drives" },
  ];

  return (
    <div className="w-full bg-slate-900/60 border-y border-white/10 backdrop-blur-xl py-3 overflow-hidden relative select-none">
      <div className="flex items-center justify-center flex-wrap gap-x-8 gap-y-2 px-4 max-w-7xl mx-auto text-xs text-slate-300">
        {highlights.map((item, idx) => (
          <div key={idx} className="flex items-center space-x-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="font-semibold text-slate-200">{item.label}:</span>
            <span className="font-bold text-indigo-300">{item.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
